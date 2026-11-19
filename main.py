import constantes
import banco_de_dados
from movimentacao import *

def verifica_entrada(entrada):
    """Verifica se a entrada está correta.

    Args:
        entrada (list): Lista com as informações de entrada.

    Returns:
       bool: Retorna um bool referente a validação de entrada.
    """
    if len(entrada) != 2:
        print('\033[31mValor de entrada incorreto. Digite dois valores entre 0 e 7!\033[0;0m')
        return False
    return True

def verifica_empate():
    """Verificação do empate de jogo (20 lances sucessivos de damas sem captura).
    """
    if constantes.quant_jogadas_con_j1 >= 20 and constantes.quant_jogadas_con_j2 >= 20:
        return True
    return False

def verifica_matriz():
    """Verificação e atualização das capturas obrigatórias no tabuleiro.
    """
    atualiza_obrigatorios()

def jogador_nome(n):
    """Verifica o nome de cada jogador

    Args:
        n (int): Número referente ao jogador (1 ou 2).

    Returns:
       string: Nome do jogador 
    """
    return constantes.J1 if n == 1 else constantes.J2


def jogador_peca(n):
    """Verifica o tipo de peça do jogador
    
    Args:
        n (int): inteiro referente ao tipo do jogador
        
    Returns:
        string: cor da peça do jogador
    """
    return constantes.pretas if n == 1 else constantes.brancas


def alterna_jogador():
    """Alterna a vez do jogador
    """
    if constantes.jogador_atual == 1:
        constantes.jogador_atual = 2
    elif constantes.jogador_atual == 2:
        constantes.jogador_atual = 1


def imprime_pos_jogada():
    """Informações após a jogada de cada participante.
    """
    print()
    print(f'\033[1mQuantidade de peças do Jogador 1 ("{constantes.pretas}"): {constantes.quant_pecas_j1} (Damas: {constantes.quant_damas_j1})\033[0;0m')
    print(f'\033[1mQuantidade de peças do Jogador 2 ("{constantes.brancas}"): {constantes.quant_pecas_j2} (Damas: {constantes.quant_damas_j2})\033[0;0m')
    print()
    imprime_tabuleiro()


def start():
    """Verificações das condições de início.
    """
    continuar = False
    if banco_de_dados.verifica_memory_card():
        try:
            continuar = int(input("Foram detectados dados no memory card, deseja retornar onde parou? [1: sim | 0: não]: "))
            if continuar != 0 and continuar != 1:
                raise Exception()
        except:
            print("\033[31mValor inválido! Digite 0 ou 1!\033[0;0m")
            return start()
    if continuar:
        banco_de_dados.loadgame()
    else:
        print()
        constantes.J1 = input(f'Jogador 1 (peças "{constantes.pretas}"), digite seu nome: ')
        constantes.J2 = input(f'Jogador 2 (peças "{constantes.brancas}"), digite seu nome: ')
        constantes.jogador_atual = 1
        constantes.quant_pecas_j1 = 12
        constantes.quant_pecas_j2 = 12
        constantes.quant_damas_j1 = 0
        constantes.quant_damas_j2 = 0
        constantes.peca_em_combo = None
        criando_tabuleiro()

def loop_jogo():
    """Loop principal de execução do jogo.
    """
    start()

    while True:
        # Condição de fim de jogo por eliminação total de peças
        if constantes.quant_pecas_j1 <= 0 or constantes.quant_pecas_j2 <= 0:
            if constantes.quant_pecas_j1 <= 0:
                print("\033[32m{} GANHOU A PARTIDA!\033[0;0m".format(constantes.J2))
            if constantes.quant_pecas_j2 <= 0:
                print("\033[32m{} GANHOU A PARTIDA!\033[0;0m".format(constantes.J1))
            break
        
        # Condição de empate por 20 lances sucessivos de damas sem captura
        if verifica_empate():
            print("\033[33mPARTIDA EMPATADA POR ESTAGNAÇÃO DE DAMAS (20 LANCES)!\033[0;0m")
            break

        imprime_pos_jogada()
        verifica_matriz()

        # Condição de vitória por bloqueio (regra oficial: sem movimentos válidos = derrota)
        tipo_jogada, _, _ = obter_todas_jogadas_jogador(constantes.matriz, constantes.jogador_atual)
        if tipo_jogada == 'nenhuma':
            outro_jogador = 2 if constantes.jogador_atual == 1 else 1
            print(f"\033[33mO Jogador {constantes.jogador_atual} ('{jogador_nome(constantes.jogador_atual)}') não possui movimentos válidos (bloqueado)!\033[0;0m")
            print("\033[32m{} GANHOU A PARTIDA!\033[0;0m".format(jogador_nome(outro_jogador)))
            break

        print()
        print(f"\033[34mVez do Jogador {constantes.jogador_atual} ('{jogador_peca(constantes.jogador_atual)}')\033[0;0m")

        if constantes.peca_em_combo is not None:
            print(f"\033[33m⚡ Captura múltipla em andamento! Mova a peça em {constantes.peca_em_combo} (Linha, Coluna).\033[0;0m")

        # Posição de origem da peça
        try:
            posicao_l_c = list(map(int, input(f"\nJogador {constantes.jogador_atual} "
                                            f"('{jogador_nome(constantes.jogador_atual)}'),"
                                            f" escolha a posição da peça - (Linha Coluna): ").split()))
        except:
            print('\033[31mValor de entrada incorreto. Digite dois valores entre 0 e 7!\033[0;0m')
            continue
        
        if not verifica_entrada(posicao_l_c):
            continue
        
        if (posicao_l_c[0] > 7 or posicao_l_c[0] < 0) or (posicao_l_c[1] > 7 or posicao_l_c[1] < 0):
            print('\033[31mMovimentação inválida, a peça está fora do tabuleiro!\033[0;0m')
            continue
        
        if constantes.matriz[posicao_l_c[0]][posicao_l_c[1]] == constantes.vazio:
            print('\033[31mPosição inválida, não existe peça nessa posição!\033[0;0m')
            continue
        
        # Posição de destino da peça
        try:
            posicao_l_c_d = list(map(int, input(f"Jogador {constantes.jogador_atual} "
                                                f"('{jogador_nome(constantes.jogador_atual)}'),"
                                                f" escolha a movimentação da peça - (Linha Coluna): ").split()))
        except:
            print()
            print('\033[31mValor de entrada incorreto. Digite dois valores entre 0 e 7!\033[0;0m')
            continue
            
        if not verifica_entrada(posicao_l_c_d):
            continue
        
        if (posicao_l_c_d[0] > 7 or posicao_l_c_d[0] < 0) or (posicao_l_c_d[1] > 7 or posicao_l_c_d[1] < 0):
            print('\033[31mMovimentação inválida, a peça está fora do tabuleiro!\033[0;0m')
            continue
        
        print()
        passa_vez = movimentacao(posicao_l_c[0], posicao_l_c[1], posicao_l_c_d[0], posicao_l_c_d[1], constantes.jogador_atual)
        
        # Se a movimentação terminou com sucesso (lance completo):
        if passa_vez:
            alterna_jogador()
            
        banco_de_dados.savegame()

if __name__ == '__main__':
    loop_jogo()
