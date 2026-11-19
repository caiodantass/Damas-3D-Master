/**
 * CheckersAI - Inteligência Artificial para Jogo de Damas
 * Níveis: Fácil, Médio e Mestre (Minimax com Poda Alfa-Beta)
 */
class CheckersAI {
    constructor(engine, difficulty = 'medium') {
        this.engine = engine;
        this.difficulty = difficulty; // 'easy', 'medium', 'hard'
        this.playerColor = PLAYER.WHITE; // IA joga normalmente de Brancas (J2)
    }

    setDifficulty(diff) {
        this.difficulty = diff;
    }

    // Retorna a melhor jogada no formato [fromR, fromC, toR, toC]
    getBestMove() {
        const validTurn = this.engine.getAllValidMoves(this.engine.currentPlayer);
        if (validTurn.type === 'none' || validTurn.moves.length === 0) return null;

        // Se houver apenas 1 opção de jogada (forçada), joga imediatamente
        if (validTurn.type === 'capture') {
            const firstSteps = this.extractUniqueFirstSteps(validTurn.moves);
            if (firstSteps.length === 1) {
                return firstSteps[0];
            }
        } else if (validTurn.type === 'simple' && validTurn.moves.length === 1) {
            const m = validTurn.moves[0];
            return [m.origin[0], m.origin[1], m.destination[0], m.destination[1]];
        }

        switch (this.difficulty) {
            case 'easy':
                return this.getRandomMove(validTurn);
            case 'hard':
                return this.getMinimaxMove(validTurn, 4);
            case 'medium':
            default:
                return this.getMinimaxMove(validTurn, 3);
        }
    }

    extractUniqueFirstSteps(moves) {
        const unique = [];
        const seen = new Set();
        for (const m of moves) {
            const key = `${m.path[0][0]},${m.path[0][1]}->${m.path[1][0]},${m.path[1][1]}`;
            if (!seen.has(key)) {
                seen.add(key);
                unique.push([m.path[0][0], m.path[0][1], m.path[1][0], m.path[1][1]]);
            }
        }
        return unique;
    }

    getRandomMove(validTurn) {
        if (validTurn.type === 'capture') {
            const steps = this.extractUniqueFirstSteps(validTurn.moves);
            return steps[Math.floor(Math.random() * steps.length)];
        } else {
            const m = validTurn.moves[Math.floor(Math.random() * validTurn.moves.length)];
            return [m.origin[0], m.origin[1], m.destination[0], m.destination[1]];
        }
    }

    getMinimaxMove(validTurn, depth) {
        let bestScore = -Infinity;
        let bestMove = null;

        let candidateSteps = [];
        if (validTurn.type === 'capture') {
            candidateSteps = this.extractUniqueFirstSteps(validTurn.moves);
        } else {
            candidateSteps = validTurn.moves.map(m => [m.origin[0], m.origin[1], m.destination[0], m.destination[1]]);
        }

        // Embaralha para que jogadas de pontuação igual variem
        candidateSteps.sort(() => Math.random() - 0.5);

        for (const step of candidateSteps) {
            // Clona o estado do motor
            const simEngine = new CheckersEngine();
            simEngine.loadState(this.engine.saveState());

            const res = simEngine.makeMove(step[0], step[1], step[2], step[3]);
            if (!res.success) continue;

            // Se a jogada gerou combo contínuo, a IA deve completar o combo antes de trocar de turno
            while (simEngine.comboPiece && !simEngine.gameOver) {
                const subTurn = simEngine.getAllValidMoves(simEngine.currentPlayer);
                if (subTurn.type === 'capture' && subTurn.moves.length > 0) {
                    const nextStep = subTurn.moves[0];
                    simEngine.makeMove(nextStep.path[0][0], nextStep.path[0][1], nextStep.path[1][0], nextStep.path[1][1]);
                } else {
                    break;
                }
            }

            const score = this.minimax(simEngine, depth - 1, -Infinity, Infinity, false);
            if (score > bestScore) {
                bestScore = score;
                bestMove = step;
            }
        }

        return bestMove || candidateSteps[0];
    }

    minimax(simEngine, depth, alpha, beta, isMaximizing) {
        if (depth <= 0 || simEngine.gameOver) {
            return this.evaluateBoard(simEngine);
        }

        const validTurn = simEngine.getAllValidMoves(simEngine.currentPlayer);
        if (validTurn.type === 'none') {
            return isMaximizing ? -10000 : 10000;
        }

        let candidateSteps = [];
        if (validTurn.type === 'capture') {
            candidateSteps = this.extractUniqueFirstSteps(validTurn.moves);
        } else {
            candidateSteps = validTurn.moves.map(m => [m.origin[0], m.origin[1], m.destination[0], m.destination[1]]);
        }

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const step of candidateSteps) {
                const subState = simEngine.saveState();
                simEngine.makeMove(step[0], step[1], step[2], step[3]);

                while (simEngine.comboPiece && !simEngine.gameOver) {
                    const subTurn = simEngine.getAllValidMoves(simEngine.currentPlayer);
                    if (subTurn.type === 'capture' && subTurn.moves.length > 0) {
                        const nextStep = subTurn.moves[0];
                        simEngine.makeMove(nextStep.path[0][0], nextStep.path[0][1], nextStep.path[1][0], nextStep.path[1][1]);
                    } else break;
                }

                const evalScore = this.minimax(simEngine, depth - 1, alpha, beta, false);
                simEngine.loadState(subState);

                maxEval = Math.max(maxEval, evalScore);
                alpha = Math.max(alpha, evalScore);
                if (beta <= alpha) break; // Poda Beta
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const step of candidateSteps) {
                const subState = simEngine.saveState();
                simEngine.makeMove(step[0], step[1], step[2], step[3]);

                while (simEngine.comboPiece && !simEngine.gameOver) {
                    const subTurn = simEngine.getAllValidMoves(simEngine.currentPlayer);
                    if (subTurn.type === 'capture' && subTurn.moves.length > 0) {
                        const nextStep = subTurn.moves[0];
                        simEngine.makeMove(nextStep.path[0][0], nextStep.path[0][1], nextStep.path[1][0], nextStep.path[1][1]);
                    } else break;
                }

                const evalScore = this.minimax(simEngine, depth - 1, alpha, beta, true);
                simEngine.loadState(subState);

                minEval = Math.min(minEval, evalScore);
                beta = Math.min(beta, evalScore);
                if (beta <= alpha) break; // Poda Alfa
            }
            return minEval;
        }
    }

    evaluateBoard(simEngine) {
        if (simEngine.gameOver) {
            if (simEngine.winner === this.playerColor) return 10000;
            if (simEngine.winner === 'DRAW') return 0;
            return -10000;
        }

        let score = 0;
        const board = simEngine.board;

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = board[r][c];
                if (p === PIECE.EMPTY) continue;

                const isMyPiece = (this.playerColor === PLAYER.WHITE && simEngine.isWhite(p)) ||
                                  (this.playerColor === PLAYER.BLACK && simEngine.isBlack(p));
                const mult = isMyPiece ? 1 : -1;

                // 1. Valor básico da peça
                let pieceValue = simEngine.isKing(p) ? 320 : 100;

                // 2. Bônus de avanço para pedra simples
                if (!simEngine.isKing(p)) {
                    // Para brancas: avanço é r aumentando (0 a 7)
                    // Para pretas: avanço é r diminuindo (7 a 0)
                    const advance = simEngine.isWhite(p) ? r : (7 - r);
                    pieceValue += advance * 5;

                    // Proteção da fileira de trás
                    if ((simEngine.isWhite(p) && r === 0) || (simEngine.isBlack(p) && r === 7)) {
                        pieceValue += 15;
                    }
                }

                // 3. Controle das casas centrais (3,3; 3,5; 4,2; 4,4)
                if ((r === 3 || r === 4) && (c >= 2 && c <= 5)) {
                    pieceValue += 10;
                }

                score += mult * pieceValue;
            }
        }

        return score;
    }
}

window.CheckersAI = CheckersAI;
