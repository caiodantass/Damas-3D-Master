/**
 * App - Controlador Principal do Jogo de Damas 3D
 * Integra Motor de Regras, IA, Renderizador Three.js, Áudio e Interface.
 */

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('canvas-container');

    const engine = new CheckersEngine();
    const ai = new CheckersAI(engine, 'medium');

    let gameMode = 'pve'; // 'pve' (Player vs IA) ou 'pvp' (Player vs Player)
    let aiPlayer = PLAYER.WHITE; // IA joga de Brancas
    let playerColor = PLAYER.BLACK; // Humano joga de Pretas
    let isAiThinking = false;
    let selectedSquare = null;
    let moveLog = [];

    // Elementos da UI
    const turnIndicator = document.getElementById('turn-indicator');
    const turnText = document.getElementById('turn-text');
    const scoreBlack = document.getElementById('score-black');
    const scoreWhite = document.getElementById('score-white');
    const kingsBlack = document.getElementById('kings-black');
    const kingsWhite = document.getElementById('kings-white');
    const movesHistory = document.getElementById('moves-history');
    const statusBanner = document.getElementById('status-banner');
    const statusText = document.getElementById('status-text');

    const btnUndo = document.getElementById('btn-undo');
    const btnReset = document.getElementById('btn-reset');
    const btnSound = document.getElementById('btn-sound');
    const selectMode = document.getElementById('select-mode');
    const selectDifficulty = document.getElementById('select-difficulty');
    const difficultyGroup = document.getElementById('difficulty-group');

    const cameraBtns = document.querySelectorAll('.cam-btn');

    // Modal de Fim de Jogo
    const modalGameOver = document.getElementById('modal-gameover');
    const gameOverTitle = document.getElementById('gameover-title');
    const gameOverReason = document.getElementById('gameover-reason');
    const btnPlayAgain = document.getElementById('btn-play-again');

    // Inicialização da Cena 3D
    const scene3d = new CheckersScene3D(container, (row, col) => onSquareClicked(row, col));
    scene3d.syncPieces(engine.board);

    function updateHUD() {
        scoreBlack.textContent = engine.piecesCount.black;
        scoreWhite.textContent = engine.piecesCount.white;
        kingsBlack.textContent = engine.kingsCount.black;
        kingsWhite.textContent = engine.kingsCount.white;

        if (engine.currentPlayer === PLAYER.BLACK) {
            turnText.textContent = gameMode === 'pve' && playerColor === PLAYER.BLACK ? 'Sua Vez (Pretas)' : 'Vez das Pretas';
            turnIndicator.className = 'turn-badge black-turn';
        } else {
            turnText.textContent = gameMode === 'pve' && aiPlayer === PLAYER.WHITE ? 'Vez da IA (Brancas)' : 'Vez das Brancas';
            turnIndicator.className = 'turn-badge white-turn';
        }

        btnUndo.disabled = engine.history.length === 0 || isAiThinking;

        // Atualizar peças obrigatórias
        const turn = engine.getAllValidMoves(engine.currentPlayer);
        let mandatory = [];
        if (turn.type === 'capture') {
            const uniqueOrigins = new Set();
            for (const m of turn.moves) {
                const key = `${m.path[0][0]},${m.path[0][1]}`;
                if (!uniqueOrigins.has(key)) {
                    uniqueOrigins.add(key);
                    mandatory.push(m.path[0]);
                }
            }
            showBanner(`⚡ Captura Obrigatória! Pela Lei da Maioria, capture ${turn.maxCaptures} peça(s).`);
        } else if (engine.comboPiece) {
            showBanner(`⚡ Continue a captura múltipla com a peça selecionada!`);
            mandatory = [engine.comboPiece];
        } else {
            hideBanner();
        }

        scene3d.setHighlights(selectedSquare, getValidDestinationsForSelected(), mandatory);
    }

    function showBanner(msg) {
        statusText.textContent = msg;
        statusBanner.classList.add('visible');
    }

    function hideBanner() {
        statusBanner.classList.remove('visible');
    }

    function getValidDestinationsForSelected() {
        if (!selectedSquare) return [];
        const [r, c] = selectedSquare;
        const turn = engine.getAllValidMoves(engine.currentPlayer);
        const dests = [];

        if (turn.type === 'capture') {
            for (const m of turn.moves) {
                if (m.path[0][0] === r && m.path[0][1] === c) {
                    dests.push(m.path[1]);
                }
            }
        } else if (turn.type === 'simple') {
            for (const m of turn.moves) {
                if (m.origin[0] === r && m.origin[1] === c) {
                    dests.push(m.destination);
                }
            }
        }
        return dests;
    }

    function onSquareClicked(row, col) {
        if (engine.gameOver || isAiThinking) return;

        // Se for o turno da IA no modo PvE, jogador humano não pode interagir
        if (gameMode === 'pve' && engine.currentPlayer === aiPlayer) return;

        const piece = engine.board[row][col];
        const isCurrentPlayersPiece = (engine.currentPlayer === PLAYER.BLACK && engine.isBlack(piece)) ||
                                     (engine.currentPlayer === PLAYER.WHITE && engine.isWhite(piece));

        // Se estiver no meio de um combo obrigatório, só pode selecionar a peça do combo
        if (engine.comboPiece) {
            if (engine.comboPiece[0] === row && engine.comboPiece[1] === col) {
                selectedSquare = [row, col];
                soundFX.playSelect();
                updateHUD();
                return;
            }
        }

        // Se clicou em uma de suas peças válidas
        if (isCurrentPlayersPiece) {
            const turn = engine.getAllValidMoves(engine.currentPlayer);

            // Se há capturas obrigatórias, só pode selecionar peças que podem capturar
            if (turn.type === 'capture') {
                const canCapture = turn.moves.some(m => m.path[0][0] === row && m.path[0][1] === col);
                if (!canCapture) {
                    soundFX.playError();
                    showBanner(`Você deve selecionar uma peça que realiza a captura máxima (${turn.maxCaptures} peças)!`);
                    return;
                }
            }

            selectedSquare = [row, col];
            soundFX.playSelect();
            updateHUD();
            return;
        }

        // Se já tem peça selecionada e clicou em uma casa vazia de destino
        if (selectedSquare) {
            const validDests = getValidDestinationsForSelected();
            const isValid = validDests.some(d => d[0] === row && d[1] === col);

            if (isValid) {
                executePlayerMove(selectedSquare[0], selectedSquare[1], row, col);
            } else {
                selectedSquare = null;
                updateHUD();
            }
        }
    }

    function executePlayerMove(fromR, fromC, toR, toC) {
        const isCapture = Math.abs(toR - fromR) >= 2;
        const res = engine.makeMove(fromR, fromC, toR, toC);

        if (!res.success) {
            soundFX.playError();
            showBanner(res.reason);
            return;
        }

        logMove(fromR, fromC, toR, toC, isCapture, engine.currentPlayer === PLAYER.BLACK ? PLAYER.WHITE : PLAYER.BLACK);

        if (isCapture) {
            soundFX.playCapture();
            if (res.capturedSquare) {
                scene3d.animateCapture(res.capturedSquare[0], res.capturedSquare[1]);
            }
        } else {
            soundFX.playMove();
        }

        if (res.crowned) {
            setTimeout(() => soundFX.playCrown(), 250);
        }

        scene3d.animateMove(fromR, fromC, toR, toC, isCapture, () => {
            // Sincroniza malha com peças para refletir damas e remoções
            scene3d.syncPieces(engine.board);

            if (res.continuesCombo) {
                selectedSquare = [toR, toC];
            } else {
                selectedSquare = null;
            }

            updateHUD();
            checkGameOver();

            // Se passou a vez e agora é a IA que joga
            if (!engine.gameOver && gameMode === 'pve' && engine.currentPlayer === aiPlayer) {
                scheduleAiTurn();
            }
        });
    }

    function scheduleAiTurn() {
        isAiThinking = true;
        updateHUD();
        showBanner('🤖 IA está pensando no melhor movimento...');

        setTimeout(() => {
            makeAiMove();
        }, 550);
    }

    function makeAiMove() {
        if (engine.gameOver || engine.currentPlayer !== aiPlayer) {
            isAiThinking = false;
            updateHUD();
            return;
        }

        const move = ai.getBestMove();
        if (!move) {
            isAiThinking = false;
            engine.checkGameStatus();
            checkGameOver();
            return;
        }

        const [fromR, fromC, toR, toC] = move;
        const isCapture = Math.abs(toR - fromR) >= 2;
        const res = engine.makeMove(fromR, fromC, toR, toC);

        if (!res.success) {
            isAiThinking = false;
            return;
        }

        logMove(fromR, fromC, toR, toC, isCapture, aiPlayer);

        if (isCapture) {
            soundFX.playCapture();
            if (res.capturedSquare) {
                scene3d.animateCapture(res.capturedSquare[0], res.capturedSquare[1]);
            }
        } else {
            soundFX.playMove();
        }

        if (res.crowned) {
            setTimeout(() => soundFX.playCrown(), 250);
        }

        scene3d.animateMove(fromR, fromC, toR, toC, isCapture, () => {
            scene3d.syncPieces(engine.board);

            if (res.continuesCombo) {
                // IA continua o combo com a mesma peça após leve pausa
                setTimeout(() => makeAiMove(), 450);
            } else {
                isAiThinking = false;
                updateHUD();
                checkGameOver();
            }
        });
    }

    function formatCoords(r, c) {
        const cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        return `${cols[c]}${8 - r}`;
    }

    function logMove(fromR, fromC, toR, toC, isCapture, player) {
        const symbol = isCapture ? '✕' : '→';
        const colorClass = player === PLAYER.BLACK ? 'log-black' : 'log-white';
        const text = `${formatCoords(fromR, fromC)} ${symbol} ${formatCoords(toR, toC)}`;

        const item = document.createElement('div');
        item.className = `log-item ${colorClass}`;
        item.textContent = `${moveLog.length + 1}. ${text}`;
        movesHistory.appendChild(item);
        movesHistory.scrollTop = movesHistory.scrollHeight;

        moveLog.push({ player, text });
    }

    function checkGameOver() {
        if (!engine.gameOver) return;

        soundFX.playWin();

        // Dispara efeito festivo de confetes 3D
        if (window.confetti) {
            window.confetti({
                particleCount: 120,
                spread: 80,
                origin: { y: 0.6 }
            });
            setTimeout(() => {
                window.confetti({ particleCount: 60, spread: 100, origin: { x: 0.2, y: 0.7 } });
                window.confetti({ particleCount: 60, spread: 100, origin: { x: 0.8, y: 0.7 } });
            }, 300);
        }

        let title = '';
        if (engine.winner === 'DRAW') {
            title = '🤝 Empate!';
        } else if (gameMode === 'pve') {
            title = engine.winner === playerColor ? '🏆 Você Venceu!' : '💀 A IA Venceu!';
        } else {
            title = engine.winner === PLAYER.BLACK ? '🏆 Jogador 1 (Pretas) Venceu!' : '🏆 Jogador 2 (Brancas) Venceu!';
        }

        gameOverTitle.textContent = title;
        gameOverReason.textContent = engine.winReason;
        modalGameOver.classList.add('active');
    }

    function resetGame() {
        engine.initBoard();
        scene3d.syncPieces(engine.board);
        selectedSquare = null;
        isAiThinking = false;
        moveLog = [];
        movesHistory.innerHTML = '';
        modalGameOver.classList.remove('active');
        updateHUD();
        hideBanner();

        if (gameMode === 'pve' && engine.currentPlayer === aiPlayer) {
            scheduleAiTurn();
        }
    }

    // Botões e Configurações
    btnReset.addEventListener('click', () => resetGame());
    btnPlayAgain.addEventListener('click', () => resetGame());

    btnUndo.addEventListener('click', () => {
        if (isAiThinking) return;
        // Se for contra IA, desfaz dois lances (o da IA e o do humano)
        if (gameMode === 'pve') {
            if (engine.history.length >= 2) {
                engine.undo();
                engine.undo();
            } else {
                engine.undo();
            }
        } else {
            engine.undo();
        }
        scene3d.syncPieces(engine.board);
        selectedSquare = null;
        updateHUD();
        soundFX.playMove();
    });

    btnSound.addEventListener('click', () => {
        const enabled = soundFX.toggle();
        btnSound.innerHTML = enabled ? '<span class="icon">🔊</span> Som: Ligado' : '<span class="icon">🔇</span> Som: Desligado';
    });

    selectMode.addEventListener('change', (e) => {
        gameMode = e.target.value;
        difficultyGroup.style.display = gameMode === 'pve' ? 'flex' : 'none';
        resetGame();
    });

    selectDifficulty.addEventListener('change', (e) => {
        ai.setDifficulty(e.target.value);
    });

    cameraBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            cameraBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            scene3d.setCameraView(btn.dataset.cam);
        });
    });

    updateHUD();
});
