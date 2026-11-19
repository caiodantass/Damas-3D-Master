/**
 * CheckersEngine - Motor oficial de Damas Brasileiras (64 casas)
 * Regras oficiais: Lei da Maioria, Captura para Trás, Dama Voadora,
 * Combos obrigatórios com a mesma peça, Promoção ao Parar e Derrota por Bloqueio.
 */

const PIECE = {
    EMPTY: ' ',
    BLACK: '○',
    WHITE: '●',
    BLACK_KING: '◎',
    WHITE_KING: '◉'
};

const PLAYER = {
    BLACK: 1, // Peças Pretas (J1)
    WHITE: 2  // Peças Brancas (J2 / IA)
};

const DIRECTIONS = [
    [-1, -1], [-1, 1], [1, -1], [1, 1]
];

class CheckersEngine {
    constructor() {
        this.board = [];
        this.currentPlayer = PLAYER.BLACK;
        this.piecesCount = { black: 12, white: 12 };
        this.kingsCount = { black: 0, white: 0 };
        this.comboPiece = null; // [r, c] se estiver no meio de um salto múltiplo
        this.kingConsecutiveMoves = { black: 0, white: 0 };
        this.history = []; // Para função Desfazer Jogada (Undo)
        this.gameOver = false;
        this.winner = null; // null, PLAYER.BLACK, PLAYER.WHITE, ou 'DRAW'
        this.winReason = '';
        this.initBoard();
    }

    initBoard() {
        this.board = [];
        for (let r = 0; r < 8; r++) {
            const row = [];
            for (let c = 0; c < 8; c++) {
                if ((r + c) % 2 === 0) {
                    if (r <= 2) row.push(PIECE.WHITE);
                    else if (r >= 5) row.push(PIECE.BLACK);
                    else row.push(PIECE.EMPTY);
                } else {
                    row.push(PIECE.EMPTY);
                }
            }
            this.board.push(row);
        }
        this.currentPlayer = PLAYER.BLACK;
        this.piecesCount = { black: 12, white: 12 };
        this.kingsCount = { black: 0, white: 0 };
        this.comboPiece = null;
        this.kingConsecutiveMoves = { black: 0, white: 0 };
        this.history = [];
        this.gameOver = false;
        this.winner = null;
        this.winReason = '';
    }

    cloneBoard(b = this.board) {
        return b.map(row => [...row]);
    }

    saveState() {
        return {
            board: this.cloneBoard(),
            currentPlayer: this.currentPlayer,
            piecesCount: { ...this.piecesCount },
            kingsCount: { ...this.kingsCount },
            comboPiece: this.comboPiece ? [...this.comboPiece] : null,
            kingConsecutiveMoves: { ...this.kingConsecutiveMoves },
            gameOver: this.gameOver,
            winner: this.winner,
            winReason: this.winReason
        };
    }

    loadState(state) {
        this.board = state.board.map(r => [...r]);
        this.currentPlayer = state.currentPlayer;
        this.piecesCount = { ...state.piecesCount };
        this.kingsCount = { ...state.kingsCount };
        this.comboPiece = state.comboPiece ? [...state.comboPiece] : null;
        this.kingConsecutiveMoves = { ...state.kingConsecutiveMoves };
        this.gameOver = state.gameOver;
        this.winner = state.winner;
        this.winReason = state.winReason;
    }

    undo() {
        if (this.history.length === 0) return false;
        const prevState = this.history.pop();
        this.loadState(prevState);
        return true;
    }

    isInside(r, c) {
        return r >= 0 && r < 8 && c >= 0 && c < 8;
    }

    isPlayable(r, c) {
        return this.isInside(r, c) && (r + c) % 2 === 0;
    }

    isBlack(p) {
        return p === PIECE.BLACK || p === PIECE.BLACK_KING;
    }

    isWhite(p) {
        return p === PIECE.WHITE || p === PIECE.WHITE_KING;
    }

    isKing(p) {
        return p === PIECE.BLACK_KING || p === PIECE.WHITE_KING;
    }

    isOpponent(p1, p2) {
        if (!p2 || p2 === PIECE.EMPTY) return false;
        if (this.isBlack(p1)) return this.isWhite(p2);
        if (this.isWhite(p1)) return this.isBlack(p2);
        return false;
    }

    getSimpleMoves(r, c, board = this.board) {
        const piece = board[r][c];
        if (piece === PIECE.EMPTY) return [];

        const moves = [];
        if (this.isKing(piece)) {
            for (const [dr, dc] of DIRECTIONS) {
                let nr = r + dr;
                let nc = c + dc;
                while (this.isInside(nr, nc) && board[nr][nc] === PIECE.EMPTY) {
                    moves.push([nr, nc]);
                    nr += dr;
                    nc += dc;
                }
            }
        } else if (piece === PIECE.BLACK) {
            // Pretas avançam diminuindo a linha
            for (const [dr, dc] of [[-1, -1], [-1, 1]]) {
                const nr = r + dr;
                const nc = c + dc;
                if (this.isInside(nr, nc) && board[nr][nc] === PIECE.EMPTY) {
                    moves.push([nr, nc]);
                }
            }
        } else if (piece === PIECE.WHITE) {
            // Brancas avançam aumentando a linha
            for (const [dr, dc] of [[1, -1], [1, 1]]) {
                const nr = r + dr;
                const nc = c + dc;
                if (this.isInside(nr, nc) && board[nr][nc] === PIECE.EMPTY) {
                    moves.push([nr, nc]);
                }
            }
        }
        return moves;
    }

    findCaptureSequences(r, c, board = this.board, capturedKeys = new Set(), isCrownedInTransit = false) {
        const piece = board[r][c];
        const sequences = [];
        const playsAsKing = this.isKing(piece) || isCrownedInTransit;

        if (!playsAsKing) {
            // Peça comum salta para frente ou para trás
            for (const [dr, dc] of DIRECTIONS) {
                const pr = r + dr;
                const pc = c + dc;
                const lr = r + 2 * dr;
                const lc = c + 2 * dc;

                const key = `${pr},${pc}`;
                if (this.isInside(lr, lc) && !capturedKeys.has(key)) {
                    if (this.isOpponent(piece, board[pr][pc]) && (board[lr][lc] === PIECE.EMPTY || (lr === r && lc === c))) {
                        const newCaptured = new Set(capturedKeys);
                        newCaptured.add(key);

                        const reachedEnd = (piece === PIECE.BLACK && lr === 0) || (piece === PIECE.WHITE && lr === 7);

                        // Simula o salto
                        const subBoard = this.cloneBoard(board);
                        subBoard[r][c] = PIECE.EMPTY;
                        subBoard[lr][lc] = piece;

                        // Regra Brasileira: continua tomando como pedra se houver mais tomadas
                        const nextSteps = this.findCaptureSequences(lr, lc, subBoard, newCaptured, false);

                        if (nextSteps.length > 0) {
                            for (const next of nextSteps) {
                                sequences.push({
                                    path: [[r, c], [lr, lc], ...next.path.slice(1)],
                                    captures: [[pr, pc], ...next.captures],
                                    becomesKing: next.becomesKing
                                });
                            }
                        } else {
                            sequences.push({
                                path: [[r, c], [lr, lc]],
                                captures: [[pr, pc]],
                                becomesKing: reachedEnd
                            });
                        }
                    }
                }
            }
        } else {
            // Dama voadora
            for (const [dr, dc] of DIRECTIONS) {
                let nr = r + dr;
                let nc = c + dc;

                // Avança por casas vazias
                while (this.isInside(nr, nc) && board[nr][nc] === PIECE.EMPTY) {
                    nr += dr;
                    nc += dc;
                }

                const key = `${nr},${nc}`;
                if (this.isInside(nr, nc) && this.isOpponent(piece, board[nr][nc]) && !capturedKeys.has(key)) {
                    const pr = nr;
                    const pc = nc;
                    let lr = pr + dr;
                    let lc = pc + dc;

                    // As casas imediatamente após a peça adversária devem estar livres
                    while (this.isInside(lr, lc) && (board[lr][lc] === PIECE.EMPTY || (lr === r && lc === c))) {
                        const newCaptured = new Set(capturedKeys);
                        newCaptured.add(key);

                        const subBoard = this.cloneBoard(board);
                        subBoard[r][c] = PIECE.EMPTY;
                        subBoard[lr][lc] = piece;

                        const nextSteps = this.findCaptureSequences(lr, lc, subBoard, newCaptured, true);

                        if (nextSteps.length > 0) {
                            for (const next of nextSteps) {
                                sequences.push({
                                    path: [[r, c], [lr, lc], ...next.path.slice(1)],
                                    captures: [[pr, pc], ...next.captures],
                                    becomesKing: true
                                });
                            }
                        } else {
                            sequences.push({
                                path: [[r, c], [lr, lc]],
                                captures: [[pr, pc]],
                                becomesKing: true
                            });
                        }

                        lr += dr;
                        lc += dc;
                    }
                }
            }
        }

        return sequences;
    }

    getAllValidMoves(player = this.currentPlayer, board = this.board) {
        const allCaptures = [];

        // Se houver uma peça em combo, apenas ela pode continuar jogando
        if (this.comboPiece) {
            const [cr, cc] = this.comboPiece;
            const seqs = this.findCaptureSequences(cr, cc, board);
            if (seqs.length > 0) {
                const maxCap = Math.max(...seqs.map(s => s.captures.length));
                const best = seqs.filter(s => s.captures.length === maxCap);
                return { type: 'capture', maxCaptures: maxCap, moves: best };
            }
        }

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = board[r][c];
                if ((player === PLAYER.BLACK && this.isBlack(p)) || (player === PLAYER.WHITE && this.isWhite(p))) {
                    const seqs = this.findCaptureSequences(r, c, board);
                    allCaptures.push(...seqs);
                }
            }
        }

        if (allCaptures.length > 0) {
            // Lei da Maioria: apenas os lances que capturam o maior número de peças
            const maxCap = Math.max(...allCaptures.map(s => s.captures.length));
            const best = allCaptures.filter(s => s.captures.length === maxCap);
            return { type: 'capture', maxCaptures: maxCap, moves: best };
        }

        // Se não há capturas, busca movimentos simples
        const simpleMoves = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = board[r][c];
                if ((player === PLAYER.BLACK && this.isBlack(p)) || (player === PLAYER.WHITE && this.isWhite(p))) {
                    const dests = this.getSimpleMoves(r, c, board);
                    for (const dest of dests) {
                        simpleMoves.push({
                            origin: [r, c],
                            destination: dest,
                            becomesKing: (p === PIECE.BLACK && dest[0] === 0) || (p === PIECE.WHITE && dest[0] === 7) || this.isKing(p)
                        });
                    }
                }
            }
        }

        if (simpleMoves.length > 0) {
            return { type: 'simple', maxCaptures: 0, moves: simpleMoves };
        }

        return { type: 'none', maxCaptures: 0, moves: [] };
    }

    findCapturedSquare(fromR, fromC, toR, toC, board = this.board) {
        const stepR = toR > fromR ? 1 : -1;
        const stepC = toC > fromC ? 1 : -1;
        let curR = fromR + stepR;
        let curC = fromC + stepC;

        while (curR !== toR || curC !== toC) {
            if (board[curR][curC] !== PIECE.EMPTY) {
                return [curR, curC];
            }
            curR += stepR;
            curC += stepC;
        }
        return null;
    }

    makeMove(fromR, fromC, toR, toC) {
        if (this.gameOver) return { success: false, reason: 'O jogo já acabou!' };

        if (!this.isPlayable(fromR, fromC) || !this.isPlayable(toR, toC)) {
            return { success: false, reason: 'Coordenadas fora das casas jogáveis!' };
        }

        const piece = this.board[fromR][fromC];
        if (piece === PIECE.EMPTY) {
            return { success: false, reason: 'Não há peça na posição de origem!' };
        }

        if (this.currentPlayer === PLAYER.BLACK && !this.isBlack(piece)) {
            return { success: false, reason: 'Vez do Jogador 1 (Pretas)!' };
        }
        if (this.currentPlayer === PLAYER.WHITE && !this.isWhite(piece)) {
            return { success: false, reason: 'Vez do Jogador 2 (Brancas)!' };
        }

        if (this.comboPiece && (this.comboPiece[0] !== fromR || this.comboPiece[1] !== fromC)) {
            return { success: false, reason: `Você é obrigado a continuar a captura com a peça em [${this.comboPiece[0]}, ${this.comboPiece[1]}]!` };
        }

        const validTurn = this.getAllValidMoves(this.currentPlayer);
        if (validTurn.type === 'none') {
            this.checkGameStatus();
            return { success: false, reason: 'Sem movimentos válidos!' };
        }

        // Salva estado para Undo antes do primeiro passo da jogada
        if (!this.comboPiece) {
            this.history.push(this.saveState());
        }

        if (validTurn.type === 'capture') {
            // Verifica Lei da Maioria e primeiro salto
            const validOrigin = validTurn.moves.some(m => m.path[0][0] === fromR && m.path[0][1] === fromC);
            if (!validOrigin) {
                return { success: false, reason: `Captura obrigatória! Pela Lei da Maioria, capture ${validTurn.maxCaptures} peça(s)!` };
            }

            const validStep = validTurn.moves.some(m => 
                m.path[0][0] === fromR && m.path[0][1] === fromC &&
                m.path[1][0] === toR && m.path[1][1] === toC
            );

            if (!validStep) {
                return { success: false, reason: 'Destino inválido para a captura!' };
            }

            // Realiza captura
            const capturedSq = this.findCapturedSquare(fromR, fromC, toR, toC);
            let capturedPiece = null;
            if (capturedSq) {
                capturedPiece = this.board[capturedSq[0]][capturedSq[1]];
                this.board[capturedSq[0]][capturedSq[1]] = PIECE.EMPTY;

                if (this.currentPlayer === PLAYER.BLACK) {
                    this.piecesCount.white--;
                    if (this.isKing(capturedPiece)) this.kingsCount.white = Math.max(0, this.kingsCount.white - 1);
                } else {
                    this.piecesCount.black--;
                    if (this.isKing(capturedPiece)) this.kingsCount.black = Math.max(0, this.kingsCount.black - 1);
                }
            }

            this.board[toR][toC] = piece;
            this.board[fromR][fromC] = PIECE.EMPTY;

            // Zera lances consecutivos de damas
            this.kingConsecutiveMoves.black = 0;
            this.kingConsecutiveMoves.white = 0;

            // Checa se há capturas adicionais com a mesma peça
            const nextCaptures = this.findCaptureSequences(toR, toC);
            if (nextCaptures.length > 0) {
                this.comboPiece = [toR, toC];
                return {
                    success: true,
                    type: 'capture',
                    capturedSquare: capturedSq,
                    capturedPiece: capturedPiece,
                    continuesCombo: true,
                    crowned: false
                };
            } else {
                // Combo terminou
                this.comboPiece = null;
                let crowned = false;

                // Coroação apenas se parar na linha final
                if (piece === PIECE.BLACK && toR === 0) {
                    this.board[toR][toC] = PIECE.BLACK_KING;
                    this.kingsCount.black++;
                    crowned = true;
                } else if (piece === PIECE.WHITE && toR === 7) {
                    this.board[toR][toC] = PIECE.WHITE_KING;
                    this.kingsCount.white++;
                    crowned = true;
                }

                this.switchPlayer();
                this.checkGameStatus();

                return {
                    success: true,
                    type: 'capture',
                    capturedSquare: capturedSq,
                    capturedPiece: capturedPiece,
                    continuesCombo: false,
                    crowned: crowned
                };
            }
        }

        if (validTurn.type === 'simple') {
            const validMove = validTurn.moves.some(m => 
                m.origin[0] === fromR && m.origin[1] === fromC &&
                m.destination[0] === toR && m.destination[1] === toC
            );

            if (!validMove) {
                return { success: false, reason: 'Movimentação inválida para a peça selecionada!' };
            }

            this.board[toR][toC] = piece;
            this.board[fromR][fromC] = PIECE.EMPTY;

            let crowned = false;
            if (this.isKing(piece)) {
                if (this.currentPlayer === PLAYER.BLACK) this.kingConsecutiveMoves.black++;
                else this.kingConsecutiveMoves.white++;
            } else {
                // Movimento de pedra comum reseta os contadores de empate
                this.kingConsecutiveMoves.black = 0;
                this.kingConsecutiveMoves.white = 0;

                if (piece === PIECE.BLACK && toR === 0) {
                    this.board[toR][toC] = PIECE.BLACK_KING;
                    this.kingsCount.black++;
                    crowned = true;
                } else if (piece === PIECE.WHITE && toR === 7) {
                    this.board[toR][toC] = PIECE.WHITE_KING;
                    this.kingsCount.white++;
                    crowned = true;
                }
            }

            this.switchPlayer();
            this.checkGameStatus();

            return {
                success: true,
                type: 'simple',
                capturedSquare: null,
                continuesCombo: false,
                crowned: crowned
            };
        }

        return { success: false, reason: 'Movimento não permitido!' };
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === PLAYER.BLACK ? PLAYER.WHITE : PLAYER.BLACK;
    }

    checkGameStatus() {
        // 1. Eliminação total
        if (this.piecesCount.black <= 0) {
            this.gameOver = true;
            this.winner = PLAYER.WHITE;
            this.winReason = 'Todas as peças pretas foram capturadas!';
            return;
        }
        if (this.piecesCount.white <= 0) {
            this.gameOver = true;
            this.winner = PLAYER.BLACK;
            this.winReason = 'Todas as peças brancas foram capturadas!';
            return;
        }

        // 2. Empate por 20 lances sucessivos de damas sem captura
        if (this.kingConsecutiveMoves.black >= 20 && this.kingConsecutiveMoves.white >= 20) {
            this.gameOver = true;
            this.winner = 'DRAW';
            this.winReason = 'Partida empatada por 20 lances sucessivos de damas sem captura!';
            return;
        }

        // 3. Derrota por Bloqueio / Afogamento
        const turn = this.getAllValidMoves(this.currentPlayer);
        if (turn.type === 'none') {
            this.gameOver = true;
            this.winner = this.currentPlayer === PLAYER.BLACK ? PLAYER.WHITE : PLAYER.BLACK;
            const nomePerdedor = this.currentPlayer === PLAYER.BLACK ? 'Jogador 1 (Pretas)' : 'Jogador 2 (Brancas)';
            this.winReason = `${nomePerdedor} não possui movimentos válidos (bloqueado)!`;
            return;
        }
    }
}

window.CheckersEngine = CheckersEngine;
window.PIECE = PIECE;
window.PLAYER = PLAYER;
