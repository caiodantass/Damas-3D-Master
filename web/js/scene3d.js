/**
 * Scene3D - Renderizador 3D com Three.js para Jogo de Damas
 * Materiais PBR fotorrealistas, sombras suaves, animações parabólicas e coroas 3D.
 */

class CheckersScene3D {
    constructor(container, onSquareClicked) {
        this.container = container;
        this.onSquareClicked = onSquareClicked;

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;

        this.boardGroup = new THREE.Group();
        this.piecesGroup = new THREE.Group();
        this.highlightsGroup = new THREE.Group();

        this.pieceMeshes = new Map(); // key "r,c" -> Mesh
        this.animations = []; // lista de animacoes ativas

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.selectedSquare = null;
        this.validDestinations = [];
        this.mandatorySquares = [];

        this.currentTheme = 'wood'; // 'wood', 'marble', 'neon'
        this.isInteracting = false;

        this.init();
    }

    init() {
        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;

        // Cena
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x12141a);
        this.scene.fog = new THREE.FogExp2(0x12141a, 0.025);

        // Câmera
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        this.camera.position.set(0, 14, 16);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.15;
        this.container.appendChild(this.renderer.domElement);

        // OrbitControls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.08; // Não deixar a câmera entrar por baixo da mesa
        this.controls.minDistance = 8;
        this.controls.maxDistance = 28;
        this.controls.target.set(0, 0, 0);

        // Grupos principais
        this.scene.add(this.boardGroup);
        this.scene.add(this.piecesGroup);
        this.scene.add(this.highlightsGroup);

        this.setupLights();
        this.buildBoard();

        // Eventos
        window.addEventListener('resize', () => this.onWindowResize());
        this.renderer.domElement.addEventListener('pointerdown', (e) => this.onPointerDown(e));
        this.renderer.domElement.addEventListener('pointermove', (e) => this.onPointerMove(e));

        // Loop de renderização
        this.animate();
    }

    setupLights() {
        // Luz Ambiente
        const ambientLight = new THREE.AmbientLight(0xfff6ea, 0.6);
        this.scene.add(ambientLight);

        // Luz Direcional Principal (com sombras)
        const dirLight = new THREE.DirectionalLight(0xfffaed, 1.2);
        dirLight.position.set(10, 18, 12);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.near = 1;
        dirLight.shadow.camera.far = 40;
        dirLight.shadow.camera.left = -10;
        dirLight.shadow.camera.right = 10;
        dirLight.shadow.camera.top = 10;
        dirLight.shadow.camera.bottom = -10;
        dirLight.shadow.bias = -0.0005;
        this.scene.add(dirLight);

        // Luz de preenchimento (Rim light azulada para contraste cinematográfico)
        const fillLight = new THREE.DirectionalLight(0x7da4d4, 0.45);
        fillLight.position.set(-12, 10, -10);
        this.scene.add(fillLight);

        // Ponto de luz quente suave acima do tabuleiro
        const pointLight = new THREE.PointLight(0xffeedd, 0.5, 20);
        pointLight.position.set(0, 8, 0);
        this.scene.add(pointLight);
    }

    // Gera textura procedural de madeira de alta qualidade em canvas
    createWoodTexture(isDark = false) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        const baseColor = isDark ? '#231710' : '#d2b48c';
        const grainColor = isDark ? '#140c08' : '#b89467';

        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, 512, 512);

        // Veios de madeira orgânicos
        for (let i = 0; i < 500; i++) {
            ctx.fillStyle = grainColor;
            ctx.globalAlpha = 0.05 + Math.random() * 0.08;
            const y = Math.random() * 512;
            const h = 1 + Math.random() * 4;
            ctx.fillRect(0, y, 512, h);
        }

        // Anéis e variações suaves
        ctx.globalAlpha = 0.04;
        for (let r = 50; r < 800; r += 12) {
            ctx.beginPath();
            ctx.arc(256, 1000, r, 0, Math.PI * 2);
            ctx.strokeStyle = grainColor;
            ctx.lineWidth = 4 + Math.random() * 4;
            ctx.stroke();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    buildBoard() {
        this.boardGroup.clear();

        const darkWoodTex = this.createWoodTexture(true);
        const lightWoodTex = this.createWoodTexture(false);

        // Materiais
        this.matDarkSquare = new THREE.MeshStandardMaterial({
            map: darkWoodTex,
            roughness: 0.35,
            metalness: 0.05,
            color: 0x3d271d
        });

        this.matLightSquare = new THREE.MeshStandardMaterial({
            map: lightWoodTex,
            roughness: 0.3,
            metalness: 0.05,
            color: 0xe8d7bc
        });

        // 1. Moldura Externa do Tabuleiro
        const frameGeo = new THREE.BoxGeometry(11, 0.7, 11);
        const frameMat = new THREE.MeshStandardMaterial({
            map: darkWoodTex,
            roughness: 0.25,
            metalness: 0.08,
            color: 0x1c120c
        });
        const frameMesh = new THREE.Mesh(frameGeo, frameMat);
        frameMesh.position.y = -0.35;
        frameMesh.receiveShadow = true;
        this.boardGroup.add(frameMesh);

        // Borda dourada chanfrada decorativa
        const borderGeo = new THREE.BoxGeometry(9.85, 0.15, 9.85);
        const borderMat = new THREE.MeshStandardMaterial({
            color: 0xc8963e,
            metalness: 0.85,
            roughness: 0.25
        });
        const borderMesh = new THREE.Mesh(borderGeo, borderMat);
        borderMesh.position.y = 0.01;
        this.boardGroup.add(borderMesh);

        // 2. Casas do Tabuleiro (8x8)
        const squareGeo = new THREE.BoxGeometry(1.2, 0.1, 1.2);
        this.squares = [];

        for (let r = 0; r < 8; r++) {
            this.squares[r] = [];
            for (let c = 0; c < 8; c++) {
                const isPlayable = (r + c) % 2 === 0;
                const mat = isPlayable ? this.matDarkSquare : this.matLightSquare;

                const sqMesh = new THREE.Mesh(squareGeo, mat);
                const x = (c - 3.5) * 1.2;
                const z = (r - 3.5) * 1.2;

                sqMesh.position.set(x, 0.05, z);
                sqMesh.receiveShadow = true;
                sqMesh.userData = { row: r, col: c, isPlayable };

                this.boardGroup.add(sqMesh);
                this.squares[r][c] = sqMesh;
            }
        }

        // Mesa abaixo do tabuleiro
        const tableGeo = new THREE.CylinderGeometry(14, 14, 0.5, 64);
        const tableMat = new THREE.MeshStandardMaterial({
            color: 0x0d0e12,
            roughness: 0.8,
            metalness: 0.1
        });
        const tableMesh = new THREE.Mesh(tableGeo, tableMat);
        tableMesh.position.y = -0.95;
        tableMesh.receiveShadow = true;
        this.boardGroup.add(tableMesh);
    }

    // Cria a geometria de uma Dama com coroa 3D esculpida
    createPieceMesh(isBlack, isKing = false) {
        const group = new THREE.Group();

        // Material da Peça
        const pieceMat = isBlack ?
            new THREE.MeshStandardMaterial({
                color: 0x1a1614,
                roughness: 0.28,
                metalness: 0.15
            }) :
            new THREE.MeshStandardMaterial({
                color: 0xf4eedb,
                roughness: 0.22,
                metalness: 0.08
            });

        // Corpo cilíndrico chanfrado
        const baseGeo = new THREE.CylinderGeometry(0.48, 0.52, 0.22, 32);
        const baseMesh = new THREE.Mesh(baseGeo, pieceMat);
        baseMesh.castShadow = true;
        baseMesh.receiveShadow = true;
        baseMesh.position.y = 0.11;
        group.add(baseMesh);

        // Anel entalhado no topo
        const ringGeo = new THREE.TorusGeometry(0.32, 0.035, 16, 32);
        const ringMesh = new THREE.Mesh(ringGeo, pieceMat);
        ringMesh.rotation.x = Math.PI / 2;
        ringMesh.position.y = 0.22;
        group.add(ringMesh);

        // Centro elevado
        const centerGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.04, 24);
        const centerMesh = new THREE.Mesh(centerGeo, pieceMat);
        centerMesh.position.y = 0.23;
        group.add(centerMesh);

        // Se for DAMA, adiciona Coroa Real Dourada em 3D
        if (isKing) {
            const crownMat = new THREE.MeshStandardMaterial({
                color: 0xffd700,
                metalness: 0.9,
                roughness: 0.2,
                emissive: 0x443300
            });

            // Base da coroa
            const crownBase = new THREE.CylinderGeometry(0.24, 0.24, 0.08, 16);
            const crownBaseMesh = new THREE.Mesh(crownBase, crownMat);
            crownBaseMesh.position.y = 0.28;
            group.add(crownBaseMesh);

            // 5 pontas pontiagudas da coroa
            for (let i = 0; i < 5; i++) {
                const angle = (i / 5) * Math.PI * 2;
                const spikeGeo = new THREE.ConeGeometry(0.065, 0.18, 12);
                const spikeMesh = new THREE.Mesh(spikeGeo, crownMat);
                spikeMesh.position.set(
                    Math.cos(angle) * 0.18,
                    0.38,
                    Math.sin(angle) * 0.18
                );
                group.add(spikeMesh);
            }

            // Gema central brilhante
            const gemGeo = new THREE.SphereGeometry(0.07, 16, 16);
            const gemMat = new THREE.MeshStandardMaterial({
                color: isBlack ? 0xff2222 : 0x2288ff,
                roughness: 0.1,
                metalness: 0.3,
                emissive: isBlack ? 0x660000 : 0x002266
            });
            const gemMesh = new THREE.Mesh(gemGeo, gemMat);
            gemMesh.position.y = 0.36;
            group.add(gemMesh);
        }

        group.userData = { isBlack, isKing };
        return group;
    }

    getSquareCoords(r, c) {
        return {
            x: (c - 3.5) * 1.2,
            y: 0.1,
            z: (r - 3.5) * 1.2
        };
    }

    // Sincroniza todas as peças visuais com a matriz do jogo
    syncPieces(board) {
        this.piecesGroup.clear();
        this.pieceMeshes.clear();

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = board[r][c];
                if (p === PIECE.EMPTY) continue;

                const isBlack = (p === PIECE.BLACK || p === PIECE.BLACK_KING);
                const isKing = (p === PIECE.BLACK_KING || p === PIECE.WHITE_KING);

                const mesh = this.createPieceMesh(isBlack, isKing);
                const pos = this.getSquareCoords(r, c);
                mesh.position.set(pos.x, pos.y, pos.z);
                mesh.userData.row = r;
                mesh.userData.col = c;

                this.piecesGroup.add(mesh);
                this.pieceMeshes.set(`${r},${c}`, mesh);
            }
        }
    }

    // Animação de Salto Parabólico e Movimento
    animateMove(fromR, fromC, toR, toC, isCapture, onComplete) {
        const keyFrom = `${fromR},${fromC}`;
        const mesh = this.pieceMeshes.get(keyFrom);
        if (!mesh) {
            if (onComplete) onComplete();
            return;
        }

        this.pieceMeshes.delete(keyFrom);
        this.pieceMeshes.set(`${toR},${toC}`, mesh);
        mesh.userData.row = toR;
        mesh.userData.col = toC;

        const startPos = mesh.position.clone();
        const endCoords = this.getSquareCoords(toR, toC);
        const endPos = new THREE.Vector3(endCoords.x, endCoords.y, endCoords.z);

        const duration = isCapture ? 0.36 : 0.28;
        const jumpHeight = isCapture ? 1.4 : 0.25; // Parábola alta em capturas!
        const startTime = performance.now();

        this.animations.push({
            update: (now) => {
                const elapsed = (now - startTime) / (duration * 1000);
                const t = Math.min(Math.max(elapsed, 0), 1);

                // Easing cúbico suave
                const easeT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

                // Interpolação X e Z
                mesh.position.x = THREE.MathUtils.lerp(startPos.x, endPos.x, easeT);
                mesh.position.z = THREE.MathUtils.lerp(startPos.z, endPos.z, easeT);

                // Arco de parábola no Y
                mesh.position.y = THREE.MathUtils.lerp(startPos.y, endPos.y, t) + Math.sin(t * Math.PI) * jumpHeight;

                if (t >= 1) {
                    mesh.position.copy(endPos);
                    if (onComplete) onComplete();
                    return true; // remove animação
                }
                return false;
            }
        });
    }

    // Animação de peça capturada desaparecendo
    animateCapture(capturedR, capturedC) {
        const key = `${capturedR},${capturedC}`;
        const mesh = this.pieceMeshes.get(key);
        if (!mesh) return;

        this.pieceMeshes.delete(key);
        const startTime = performance.now();
        const startY = mesh.position.y;

        this.animations.push({
            update: (now) => {
                const elapsed = (now - startTime) / 320;
                const t = Math.min(elapsed, 1);

                mesh.scale.set(1 - t, 1 - t, 1 - t);
                mesh.position.y = startY + t * 0.4;
                mesh.rotation.y += 0.15;

                if (t >= 1) {
                    this.piecesGroup.remove(mesh);
                    return true;
                }
                return false;
            }
        });
    }

    // Destaques Visuais no Tabuleiro
    setHighlights(selected, validDests, mandatoryPieces = []) {
        this.highlightsGroup.clear();
        this.selectedSquare = selected;
        this.validDestinations = validDests;
        this.mandatorySquares = mandatoryPieces;

        // 1. Destaque da Peça Selecionada (Anel Dourado)
        if (selected) {
            const pos = this.getSquareCoords(selected[0], selected[1]);
            const ringGeo = new THREE.RingGeometry(0.35, 0.54, 32);
            const ringMat = new THREE.MeshBasicMaterial({
                color: 0x48dbfb,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.85
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = -Math.PI / 2;
            ring.position.set(pos.x, 0.11, pos.z);
            this.highlightsGroup.add(ring);
        }

        // 2. Destinos Válidos (Círculos Esmeralda Luminosos)
        for (const dest of validDests) {
            const pos = this.getSquareCoords(dest[0], dest[1]);
            const circleGeo = new THREE.CircleGeometry(0.38, 32);
            const circleMat = new THREE.MeshBasicMaterial({
                color: 0x1dd1a1,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.65
            });
            const circle = new THREE.Mesh(circleGeo, circleMat);
            circle.rotation.x = -Math.PI / 2;
            circle.position.set(pos.x, 0.11, pos.z);
            this.highlightsGroup.add(circle);

            // Anel externo pulsante
            const outGeo = new THREE.RingGeometry(0.42, 0.48, 32);
            const outMat = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.4
            });
            const outRing = new THREE.Mesh(outGeo, outMat);
            outRing.rotation.x = -Math.PI / 2;
            outRing.position.set(pos.x, 0.11, pos.z);
            this.highlightsGroup.add(outRing);
        }

        // 3. Peças com Captura Obrigatória (Alerta Vermelho/Dourado)
        for (const mand of mandatoryPieces) {
            const pos = this.getSquareCoords(mand[0], mand[1]);
            const alertGeo = new THREE.RingGeometry(0.5, 0.58, 32);
            const alertMat = new THREE.MeshBasicMaterial({
                color: 0xff6b6b,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.9
            });
            const alertRing = new THREE.Mesh(alertGeo, alertMat);
            alertRing.rotation.x = -Math.PI / 2;
            alertRing.position.set(pos.x, 0.115, pos.z);
            this.highlightsGroup.add(alertRing);
        }
    }

    // Controle de Câmera suave
    setCameraView(viewType) {
        const startPos = this.camera.position.clone();
        let targetPos = new THREE.Vector3();

        switch (viewType) {
            case 'top':
                targetPos.set(0, 18, 0.01);
                break;
            case 'black': // Jogador 1 (Pretas)
                targetPos.set(0, 13, 14);
                break;
            case 'white': // Jogador 2 (Brancas)
                targetPos.set(0, 13, -14);
                break;
            case 'perspective':
            default:
                targetPos.set(11, 14, 13);
                break;
        }

        const startTime = performance.now();
        this.animations.push({
            update: (now) => {
                const elapsed = (now - startTime) / 600;
                const t = Math.min(elapsed, 1);
                const easeT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

                this.camera.position.lerpVectors(startPos, targetPos, easeT);
                this.controls.target.set(0, 0, 0);

                return t >= 1;
            }
        });
    }

    onPointerDown(event) {
        if (event.button !== 0) return; // apenas clique esquerdo

        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Checar interseção com peças ou casas
        const targets = [...this.piecesGroup.children, ...this.boardGroup.children];
        const intersects = this.raycaster.intersectObjects(targets, true);

        if (intersects.length > 0) {
            let hit = intersects[0].object;
            // Subir até encontrar o grupo ou userData com row e col
            while (hit && (hit.userData.row === undefined) && hit.parent && hit.parent !== this.scene) {
                hit = hit.parent;
            }

            if (hit && hit.userData && hit.userData.row !== undefined) {
                const { row, col } = hit.userData;
                if (this.onSquareClicked) {
                    this.onSquareClicked(row, col);
                }
            }
        }
    }

    onPointerMove(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const targets = [...this.piecesGroup.children, ...this.boardGroup.children];
        const intersects = this.raycaster.intersectObjects(targets, true);

        let isHoverable = false;
        if (intersects.length > 0) {
            let hit = intersects[0].object;
            while (hit && (hit.userData.row === undefined) && hit.parent && hit.parent !== this.scene) {
                hit = hit.parent;
            }
            if (hit && hit.userData && hit.userData.row !== undefined) {
                const { row, col } = hit.userData;
                if ((row + col) % 2 === 0) {
                    isHoverable = true;
                }
            }
        }
        this.container.style.cursor = isHoverable ? 'pointer' : 'default';
    }

    onWindowResize() {
        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const now = performance.now();

        // Executa e filtra animações ativas
        this.animations = this.animations.filter(anim => !anim.update(now));

        // Pulsação suave dos destaques de captura obrigatória
        if (this.highlightsGroup.children.length > 0) {
            const pulse = 0.8 + Math.sin(now * 0.008) * 0.2;
            for (const child of this.highlightsGroup.children) {
                if (child.material && child.material.opacity) {
                    child.scale.set(pulse, pulse, 1);
                }
            }
        }

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

window.CheckersScene3D = CheckersScene3D;
