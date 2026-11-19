import sys
import os

import constantes as const
import tabuleiro
import movimentacao
import banco_de_dados

def reset_jogo():
    const.matriz = []
    tabuleiro.criando_tabuleiro()
    const.J1 = "Alice"
    const.J2 = "Bob"
    const.jogador_atual = 1
    const.quant_pecas_j1 = 12
    const.quant_pecas_j2 = 12
    const.quant_damas_j1 = 0
    const.quant_damas_j2 = 0
    const.quant_jogadas_con_j1 = 0
    const.quant_jogadas_con_j2 = 0
    const.peca_em_combo = None
    movimentacao.atualiza_obrigatorios()

def limpa_tabuleiro():
    for l in range(8):
        for c in range(8):
            const.matriz[l][c] = const.vazio
    const.quant_pecas_j1 = 0
    const.quant_pecas_j2 = 0
    const.quant_damas_j1 = 0
    const.quant_damas_j2 = 0
    const.quant_jogadas_con_j1 = 0
    const.quant_jogadas_con_j2 = 0
    const.peca_em_combo = None

def teste_posse_peca():
    reset_jogo()
    # Jogador 1 (pretas) tenta mover peca branca em (2, 0)
    ret = movimentacao.movimentacao(2, 0, 3, 1, 1)
    assert ret == False
    assert const.matriz[2][0] == const.brancas
    print("✓ Teste 1 - Jogador não pode mover peça adversária: OK")

def teste_movimento_simples_e_diagonal():
    reset_jogo()
    # Jogador 1 (pretas) move peca em (5, 1) para (4, 0)
    ret = movimentacao.movimentacao(5, 1, 4, 0, 1)
    assert ret == True
    assert const.matriz[5][1] == const.vazio
    assert const.matriz[4][0] == const.pretas

    # Jogador 1 tenta mover para tras sem capturar
    ret2 = movimentacao.movimentacao(4, 0, 5, 1, 1)
    assert ret2 == False

    # Jogador 1 tenta mover para casa branca (nao jogavel)
    ret3 = movimentacao.movimentacao(4, 0, 4, 1, 1)
    assert ret3 == False
    print("✓ Teste 2 - Movimento simples, restrição de frente e casas escuras: OK")

def teste_captura_simples_para_frente_e_para_tras():
    limpa_tabuleiro()
    # Preta em (4, 2), branca em (3, 3), destino (2, 4)
    const.matriz[4][2] = const.pretas
    const.matriz[3][3] = const.brancas
    const.quant_pecas_j1 = 1
    const.quant_pecas_j2 = 1
    movimentacao.atualiza_obrigatorios()

    ret = movimentacao.movimentacao(4, 2, 2, 4, 1)
    assert ret == True
    assert const.matriz[4][2] == const.vazio
    assert const.matriz[3][3] == const.vazio
    assert const.matriz[2][4] == const.pretas
    assert const.quant_pecas_j2 == 0
    print("✓ Teste 3 - Captura simples para frente: OK")

    # Captura para tras (regra brasileira)
    limpa_tabuleiro()
    const.matriz[2][4] = const.pretas
    const.matriz[3][3] = const.brancas
    const.quant_pecas_j1 = 1
    const.quant_pecas_j2 = 1
    movimentacao.atualiza_obrigatorios()

    ret = movimentacao.movimentacao(2, 4, 4, 2, 1)
    assert ret == True
    assert const.matriz[2][4] == const.vazio
    assert const.matriz[3][3] == const.vazio
    assert const.matriz[4][2] == const.pretas
    assert const.quant_pecas_j2 == 0
    print("✓ Teste 4 - Captura simples para trás (Regra Brasileira): OK")

def teste_captura_obrigatoria_bloqueia_movimento_simples():
    limpa_tabuleiro()
    # Peca A em (4, 2) pode comer branca em (3, 3)
    # Peca B em (6, 0) livre para andar simples para (5, 1)
    const.matriz[4][2] = const.pretas
    const.matriz[3][3] = const.brancas
    const.matriz[6][0] = const.pretas
    const.quant_pecas_j1 = 2
    const.quant_pecas_j2 = 1
    movimentacao.atualiza_obrigatorios()

    # Tenta mover peca B sem capturar
    ret = movimentacao.movimentacao(6, 0, 5, 1, 1)
    assert ret == False
    assert const.matriz[6][0] == const.pretas
    print("✓ Teste 5 - Captura obrigatória bloqueia movimentos simples: OK")

def teste_lei_da_maioria():
    limpa_tabuleiro()
    # Peca preta em (6, 2):
    # Pode comer 1 branca em (5, 1) saltando para (4, 0)
    # OU comer 2 brancas em (5, 3) e (3, 5) saltando para (4, 4) e (2, 6)
    const.matriz[6][2] = const.pretas
    const.matriz[5][1] = const.brancas
    const.matriz[5][3] = const.brancas
    const.matriz[3][5] = const.brancas
    const.quant_pecas_j1 = 1
    const.quant_pecas_j2 = 3
    movimentacao.atualiza_obrigatorios()

    # Tentativa de capturar apenas 1 peca em (5, 1) saltando para (4, 0)
    ret_invalido = movimentacao.movimentacao(6, 2, 4, 0, 1)
    assert ret_invalido == False
    assert const.matriz[6][2] == const.pretas
    assert const.matriz[5][1] == const.brancas

    # Executa a captura correta pela Lei da Maioria
    ret_passo1 = movimentacao.movimentacao(6, 2, 4, 4, 1)
    assert ret_passo1 == False  # Captura multipla em andamento
    assert const.peca_em_combo == [4, 4]
    assert const.matriz[5][3] == const.vazio
    assert const.quant_pecas_j2 == 2

    # Passo 2 da captura
    ret_passo2 = movimentacao.movimentacao(4, 4, 2, 6, 1)
    assert ret_passo2 == True  # Terminou o combo!
    assert const.peca_em_combo == None
    assert const.matriz[3][5] == const.vazio
    assert const.matriz[2][6] == const.pretas
    assert const.quant_pecas_j2 == 1
    print("✓ Teste 6 - Lei da Maioria e captura múltipla obrigatória: OK")

def teste_combo_bloqueia_outra_peca():
    limpa_tabuleiro()
    const.matriz[6][2] = const.pretas
    const.matriz[5][3] = const.brancas
    const.matriz[3][5] = const.brancas
    const.matriz[7][7] = const.pretas # outra peca
    const.quant_pecas_j1 = 2
    const.quant_pecas_j2 = 2
    movimentacao.atualiza_obrigatorios()

    # Passo 1
    movimentacao.movimentacao(6, 2, 4, 4, 1)
    assert const.peca_em_combo == [4, 4]

    # Jogador tenta mover peca em (7, 7) durante o combo
    ret_trapaca = movimentacao.movimentacao(7, 7, 6, 6, 1)
    assert ret_trapaca == False
    assert const.matriz[7][7] == const.pretas
    print("✓ Teste 7 - Bloqueio de troca de peça durante captura múltipla: OK")

def teste_dama_movimento_e_captura_voadora():
    limpa_tabuleiro()
    const.matriz[7][1] = const.dama_preta
    const.matriz[4][4] = const.brancas
    const.quant_pecas_j1 = 1
    const.quant_damas_j1 = 1
    const.quant_pecas_j2 = 1
    movimentacao.atualiza_obrigatorios()

    # Dama deve capturar a peca em (4, 4) e pode aterrissar em (2, 6)
    ret = movimentacao.movimentacao(7, 1, 2, 6, 1)
    assert ret == True
    assert const.matriz[7][1] == const.vazio
    assert const.matriz[4][4] == const.vazio
    assert const.matriz[2][6] == const.dama_preta
    assert const.quant_pecas_j2 == 0
    print("✓ Teste 8 - Dama voadora: salto e aterrissagem à distância: OK")

def teste_dama_nao_salta_duas_pecas_coladas():
    limpa_tabuleiro()
    const.matriz[7][1] = const.dama_preta
    const.matriz[5][3] = const.brancas
    const.matriz[4][4] = const.brancas # colada!
    const.quant_pecas_j1 = 1
    const.quant_damas_j1 = 1
    const.quant_pecas_j2 = 2
    movimentacao.atualiza_obrigatorios()

    # Tentativa de saltar ambas para (3, 5) deve ser negada
    ret = movimentacao.movimentacao(7, 1, 3, 5, 1)
    assert ret == False
    assert const.matriz[7][1] == const.dama_preta
    assert const.matriz[5][3] == const.brancas
    assert const.matriz[4][4] == const.brancas
    print("✓ Teste 9 - Dama proibida de saltar duas peças coladas: OK")

def teste_promocao_correta():
    limpa_tabuleiro()
    # Preta em (1, 3) move simples para (0, 2) e vira dama
    const.matriz[1][3] = const.pretas
    const.quant_pecas_j1 = 1
    movimentacao.atualiza_obrigatorios()

    ret = movimentacao.movimentacao(1, 3, 0, 2, 1)
    assert ret == True
    assert const.matriz[0][2] == const.dama_preta
    assert const.quant_damas_j1 == 1
    print("✓ Teste 10 - Promoção normal a Dama e atualização do contador: OK")

    # Promocao durante captura multipla:
    # Pedra atinge linha 0 mas continua tomando para tras -> NAO vira dama!
    limpa_tabuleiro()
    const.matriz[2][4] = const.pretas
    const.matriz[1][3] = const.brancas
    const.matriz[1][1] = const.brancas
    const.quant_pecas_j1 = 1
    const.quant_pecas_j2 = 2
    movimentacao.atualiza_obrigatorios()

    # Passo 1 (atinge linha 0 em 0, 2)
    movimentacao.movimentacao(2, 4, 0, 2, 1)
    assert const.matriz[0][2] == const.pretas # Continua pedra!

    # Passo 2 (termina em 2, 0)
    movimentacao.movimentacao(0, 2, 2, 0, 1)
    assert const.matriz[2][0] == const.pretas # Terminou longe da linha 0, entao continua pedra!
    assert const.quant_damas_j1 == 0
    print("✓ Teste 11 - Regra oficial de coroação (pedra em trânsito não vira dama): OK")

def teste_bloqueio_vitoria():
    limpa_tabuleiro()
    # Jogador 1 (pretas) tem 1 peca cercada sem movimento
    const.matriz[7][1] = const.pretas
    const.matriz[6][0] = const.brancas
    const.matriz[6][2] = const.brancas
    const.matriz[5][3] = const.brancas
    tipo, max_c, jogs = movimentacao.obter_todas_jogadas_jogador(const.matriz, 1)
    assert tipo == 'nenhuma'
    assert len(jogs) == 0
    print("✓ Teste 12 - Detecção de derrota por bloqueio (afogamento): OK")

def teste_salvamento_e_carregamento():
    reset_jogo()
    const.matriz[4][2] = const.pretas
    const.matriz[3][3] = const.brancas
    banco_de_dados.savegame()

    # Resetar memoria
    const.matriz = []
    const.J1 = ""
    banco_de_dados.loadgame()

    assert const.J1 == "Alice"
    assert const.matriz[4][2] == const.pretas
    assert const.matriz[3][3] == const.brancas
    if os.path.exists('savegame.pkl'):
        try:
            os.remove('savegame.pkl')
        except:
            pass
    print("✓ Teste 13 - Salvamento e Carregamento (Save/Load Memory Card): OK")

if __name__ == '__main__':
    print("=== INICIANDO SUÍTE COMPLETA DE TESTES DAS REGRAS DO JOGO ===")
    teste_posse_peca()
    teste_movimento_simples_e_diagonal()
    teste_captura_simples_para_frente_e_para_tras()
    teste_captura_obrigatoria_bloqueia_movimento_simples()
    teste_lei_da_maioria()
    teste_combo_bloqueia_outra_peca()
    teste_dama_movimento_e_captura_voadora()
    teste_dama_nao_salta_duas_pecas_coladas()
    teste_promocao_correta()
    teste_bloqueio_vitoria()
    teste_salvamento_e_carregamento()
    print("\n🎉 TODOS OS 13 TESTES DE REGRAS PASSARAM COM 100% DE SUCESSO!")
