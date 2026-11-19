from tabuleiro import *
import constantes as const

DIRECOES = [(-1, -1), (-1, 1), (1, -1), (1, 1)]

def dentro_tabuleiro(l, c):
    """Verifica se a linha e coluna estao dentro dos limites 8x8."""
    return 0 <= l < 8 and 0 <= c < 8

def casa_jogavel(l, c):
    """Verifica se a posicao e uma casa escura jogavel."""
    return dentro_tabuleiro(l, c) and (l + c) % 2 == 0

def verifica_posicao(l, c):
    """Verificacao de posicao dentro do limite do tabuleiro (para compatibilidade)."""
    if dentro_tabuleiro(l, c):
        return const.matriz[l][c]
    return False

def eh_preta(peca):
    return peca in (const.pretas, const.dama_preta)

def eh_branca(peca):
    return peca in (const.brancas, const.dama_branca)

def eh_dama(peca):
    return peca in (const.dama_preta, const.dama_branca)

def eh_adversario(peca1, peca2):
    if peca2 == const.vazio or peca2 is False:
        return False
    if eh_preta(peca1):
        return eh_branca(peca2)
    if eh_branca(peca1):
        return eh_preta(peca2)
    return False

def eh_amigo(peca1, peca2):
    if peca2 == const.vazio or peca2 is False:
        return False
    if eh_preta(peca1):
        return eh_preta(peca2)
    if eh_branca(peca1):
        return eh_branca(peca2)
    return False

def limites_diagonais(l, c):
    """Analisa os limites diagonais (mantida para compatibilidade)."""
    if l <= c and l + c <= 7:
        d_desc = ((- (c - l) + 7), 7)
        d_sub = (0, (l + c))
        e_desc = ((l + c), 0)
        e_sub = (0, (c - l))
    elif l >= c and l + c >= 7:
        d_desc = (7, -(l - c) + 7)
        d_sub = ((l + c) - 7, 7)
        e_desc = (7, (l + c) - 7)
        e_sub = (l - c, 0)
    elif l >= c and l + c <= 7:
        d_desc = (7, -(l - c) + 7)
        d_sub = (0, l + c)
        e_desc = (l + c, 0)
        e_sub = (l - c, 0)
    else:
        d_desc = (-(c - l) + 7, 7)
        d_sub = ((l + c) - 7, 7)
        e_desc = (7, (l + c) - 7)
        e_sub = (0, c - l)
    return d_desc, d_sub, e_desc, e_sub

def gera_posicoes(l_o, c_o):
    """Gera a lista de posicoes diagonais possiveis para dama."""
    pos_validas = []
    for dl, dc in DIRECOES:
        nl, nc = l_o + dl, c_o + dc
        while dentro_tabuleiro(nl, nc):
            pos_validas.append([nl, nc])
            nl += dl
            nc += dc
    return pos_validas

def obter_movimentos_simples(matriz, l, c):
    """Retorna lista de destinos [l_d, c_d] para movimento simples a partir de (l, c)."""
    peca = matriz[l][c]
    if peca == const.vazio:
        return []
    
    destinos = []
    if eh_dama(peca):
        for dl, dc in DIRECOES:
            nl, nc = l + dl, c + dc
            while dentro_tabuleiro(nl, nc) and matriz[nl][nc] == const.vazio:
                destinos.append([nl, nc])
                nl += dl
                nc += dc
    elif peca == const.pretas:
        # Pretas andam para frente diminuindo a linha
        for dl, dc in [(-1, -1), (-1, 1)]:
            nl, nc = l + dl, c + dc
            if dentro_tabuleiro(nl, nc) and matriz[nl][nc] == const.vazio:
                destinos.append([nl, nc])
    elif peca == const.brancas:
        # Brancas andam para frente aumentando a linha
        for dl, dc in [(1, -1), (1, 1)]:
            nl, nc = l + dl, c + dc
            if dentro_tabuleiro(nl, nc) and matriz[nl][nc] == const.vazio:
                destinos.append([nl, nc])
    return destinos

def buscar_sequencias_captura_peca(matriz, l, c, pecas_capturadas=None, coroou=False):
    """Busca recursivamente todas as sequencias de captura para a peca em (l, c).
    
    Aplica as regras oficiais brasileiras:
    - Peca comum captura para frente e para tras saltando 1 peca adversaria para casa vazia.
    - Dama voadora salta peca adversaria a distancia e aterrissa em qualquer casa vazia posterior.
    - Proibido saltar duas pecas consecutivas sem casa vazia entre elas.
    - Nao e permitido passar pela mesma peca capturada duas vezes no mesmo lance.
    - Promocao a dama so ocorre se a pedra terminar o lance na linha de coroacao.
    """
    if pecas_capturadas is None:
        pecas_capturadas = set()

    peca = matriz[l][c]
    sequencias = []

    joga_como_dama = eh_dama(peca) or coroou

    if not joga_como_dama:
        for dl, dc in DIRECOES:
            p_l, p_c = l + dl, c + dc
            d_l, d_c = l + 2 * dl, c + 2 * dc

            if dentro_tabuleiro(d_l, d_c) and (p_l, p_c) not in pecas_capturadas:
                if eh_adversario(peca, matriz[p_l][p_c]) and (matriz[d_l][d_c] == const.vazio or (d_l == l and d_c == c)):
                    novas_capturadas = set(pecas_capturadas)
                    novas_capturadas.add((p_l, p_c))
                    
                    chegou_fim = (peca == const.pretas and d_l == 0) or (peca == const.brancas and d_l == 7)
                    
                    sub_matriz = [row[:] for row in matriz]
                    sub_matriz[l][c] = const.vazio
                    sub_matriz[d_l][d_c] = peca
                    
                    # Continua tomando como pedra se houver capturas
                    proximas = buscar_sequencias_captura_peca(sub_matriz, d_l, d_c, novas_capturadas, coroou=False)
                    
                    if proximas:
                        for prox in proximas:
                            sequencias.append({
                                'caminho': [[l, c], [d_l, d_c]] + prox['caminho'][1:],
                                'capturas': [[p_l, p_c]] + prox['capturas'],
                                'vira_dama': prox['vira_dama']
                            })
                    else:
                        sequencias.append({
                            'caminho': [[l, c], [d_l, d_c]],
                            'capturas': [[p_l, p_c]],
                            'vira_dama': chegou_fim
                        })
    else:
        for dl, dc in DIRECOES:
            nl, nc = l + dl, c + dc
            # Avanca por casas vazias
            while dentro_tabuleiro(nl, nc) and matriz[nl][nc] == const.vazio:
                nl += dl
                nc += dc
            
            # Se encontrou peca adversaria ainda nao capturada
            if dentro_tabuleiro(nl, nc) and eh_adversario(peca, matriz[nl][nc]) and (nl, nc) not in pecas_capturadas:
                p_l, p_c = nl, nc
                landing_l, landing_c = p_l + dl, p_c + dc
                
                # As casas logo apos a peca adversaria devem estar livres
                while dentro_tabuleiro(landing_l, landing_c) and (matriz[landing_l][landing_c] == const.vazio or (landing_l == l and landing_c == c)):
                    novas_capturadas = set(pecas_capturadas)
                    novas_capturadas.add((p_l, p_c))
                    
                    sub_matriz = [row[:] for row in matriz]
                    sub_matriz[l][c] = const.vazio
                    sub_matriz[landing_l][landing_c] = peca
                    
                    proximas = buscar_sequencias_captura_peca(sub_matriz, landing_l, landing_c, novas_capturadas, coroou=True)
                    if proximas:
                        for prox in proximas:
                            sequencias.append({
                                'caminho': [[l, c], [landing_l, landing_c]] + prox['caminho'][1:],
                                'capturas': [[p_l, p_c]] + prox['capturas'],
                                'vira_dama': True
                            })
                    else:
                        sequencias.append({
                            'caminho': [[l, c], [landing_l, landing_c]],
                            'capturas': [[p_l, p_c]],
                            'vira_dama': True
                        })
                    landing_l += dl
                    landing_c += dc

    return sequencias

def obter_todas_jogadas_jogador(matriz, jogador):
    """Retorna o tipo de jogada disponivel ('captura', 'simples' ou 'nenhuma'),
    o numero maximo de capturas e a lista de jogadas validas (com Lei da Maioria)."""
    todas_capturas = []
    
    # Se houver uma peca no meio de uma captura multipla, ela e a unica que pode continuar
    if const.peca_em_combo is not None:
        l, c = const.peca_em_combo
        seqs = buscar_sequencias_captura_peca(matriz, l, c)
        if seqs:
            max_c = max(len(s['capturas']) for s in seqs)
            melhores = [s for s in seqs if len(s['capturas']) == max_c]
            return 'captura', max_c, melhores
        else:
            # Combo terminou
            const.peca_em_combo = None

    for l in range(8):
        for c in range(8):
            peca = matriz[l][c]
            if (jogador == 1 and eh_preta(peca)) or (jogador == 2 and eh_branca(peca)):
                seqs = buscar_sequencias_captura_peca(matriz, l, c)
                todas_capturas.extend(seqs)
                
    if todas_capturas:
        # Lei da Maioria: obrigatorio escolher o caminho que toma mais pecas
        max_cap = max(len(s['capturas']) for s in todas_capturas)
        melhores_capturas = [s for s in todas_capturas if len(s['capturas']) == max_cap]
        return 'captura', max_cap, melhores_capturas
        
    # Se nao ha capturas, busca movimentos simples
    movimentos_simples = []
    for l in range(8):
        for c in range(8):
            peca = matriz[l][c]
            if (jogador == 1 and eh_preta(peca)) or (jogador == 2 and eh_branca(peca)):
                destinos = obter_movimentos_simples(matriz, l, c)
                for d in destinos:
                    movimentos_simples.append({
                        'origem': [l, c],
                        'destino': d,
                        'vira_dama': (peca == const.pretas and d[0] == 0) or (peca == const.brancas and d[0] == 7) or eh_dama(peca)
                    })
                    
    if movimentos_simples:
        return 'simples', 0, movimentos_simples
        
    return 'nenhuma', 0, []

def atualiza_obrigatorios():
    """Atualiza as listas de captura obrigatoria para o estado atual."""
    const.obrigatorio_preta = []
    const.obrigatorio_branca = []

    tipo1, _, jogs1 = obter_todas_jogadas_jogador(const.matriz, 1)
    if tipo1 == 'captura':
        destinos = []
        for j in jogs1:
            d = j['caminho'][1]
            if d not in destinos:
                destinos.append(d)
        const.obrigatorio_preta = destinos

    tipo2, _, jogs2 = obter_todas_jogadas_jogador(const.matriz, 2)
    if tipo2 == 'captura':
        destinos = []
        for j in jogs2:
            d = j['caminho'][1]
            if d not in destinos:
                destinos.append(d)
        const.obrigatorio_branca = destinos

def peca_a_capturar(l_o, c_o, l_d, c_d, x=None):
    """Encontra a peca capturada entre (l_o, c_o) e (l_d, c_d)."""
    step_l = 1 if l_d > l_o else -1
    step_c = 1 if c_d > c_o else -1
    cur_l = l_o + step_l
    cur_c = c_o + step_c
    while (cur_l, cur_c) != (l_d, c_d):
        if const.matriz[cur_l][cur_c] != const.vazio:
            return [cur_l, cur_c]
        cur_l += step_l
        cur_c += step_c
    return []

def captura(l_o, c_o, l_d, c_d, jogador):
    """Realiza a remocao da peca capturada e atualiza as posicoes e contadores."""
    coord = peca_a_capturar(l_o, c_o, l_d, c_d)
    if coord:
        p_l, p_c = coord
        peca_capturada = const.matriz[p_l][p_c]
        const.matriz[p_l][p_c] = const.vazio

        if jogador == 1:
            const.quant_pecas_j2 -= 1
            if peca_capturada == const.dama_branca:
                const.quant_damas_j2 = max(0, const.quant_damas_j2 - 1)
        else:
            const.quant_pecas_j1 -= 1
            if peca_capturada == const.dama_preta:
                const.quant_damas_j1 = max(0, const.quant_damas_j1 - 1)

    # Move a peca atacante para o destino
    const.matriz[l_d][c_d] = const.matriz[l_o][c_o]
    const.matriz[l_o][c_o] = const.vazio

    # Captura zera o contador de estagnacao de damas
    const.quant_jogadas_con_j1 = 0
    const.quant_jogadas_con_j2 = 0

def verifica_diagonais(l, c, peca_alvo, lista, pos_captura=False):
    """Mantida para compatibilidade com assinaturas antigas."""
    atualiza_obrigatorios()
    return len(const.obrigatorio_preta if eh_preta(const.matriz[l][c]) else const.obrigatorio_branca) > 0

def verifica_diagonais_dama(l, c, peca_alvo, lista, peca, pos_captura=False):
    """Mantida para compatibilidade com assinaturas antigas."""
    atualiza_obrigatorios()
    return len(const.obrigatorio_preta if peca == 1 or peca == const.dama_preta else const.obrigatorio_branca) > 0

def verificar_movimentacao_dama(origem, destino, peca):
    """Mantida para compatibilidade com assinaturas antigas."""
    l_o, c_o = origem
    l_d, c_d = destino
    destinos = obter_movimentos_simples(const.matriz, l_o, c_o)
    if [l_d, c_d] in destinos:
        return [True, False]
    cap = peca_a_capturar(l_o, c_o, l_d, c_d)
    if cap:
        return [False, (l_d, c_d, cap[0], cap[1])]
    return [False, False]

def movimentacao(l_o, c_o, l_d, c_d, jogador):
    """Controle da movimentacao de pecas.
    
    Args:
        l_o (int): Linha de origem
        c_o (int): Coluna de origem
        l_d (int): Linha de destino
        c_d (int): Coluna de destino
        jogador (int): Jogador atual (1 para pretas, 2 para brancas)
        
    Returns:
        bool: Retorna True se a jogada foi concluida e passa a vez.
              Retorna False se o lance continua (captura multipla) ou se a jogada foi invalida.
    """
    # 1. Validacao de limites e casas do tabuleiro
    if not (dentro_tabuleiro(l_o, c_o) and dentro_tabuleiro(l_d, c_d)):
        print('\033[31mMovimentação inválida, posição fora do tabuleiro!\033[0;0m')
        return False

    if not (casa_jogavel(l_o, c_o) and casa_jogavel(l_d, c_d)):
        print('\033[31mMovimentação inválida, as peças só podem mover nas casas escuras!\033[0;0m')
        return False

    if l_o == l_d or c_o == c_d:
        print('\033[31mMovimentação inválida, a peça só pode mover para a diagonal!\033[0;0m')
        return False

    if abs(l_d - l_o) != abs(c_d - c_o):
        print('\033[31mMovimentação inválida, o movimento deve ser em diagonal perfeita!\033[0;0m')
        return False

    peca_origem = const.matriz[l_o][c_o]
    if peca_origem == const.vazio:
        print('\033[31mPosição inválida, não existe peça nessa posição!\033[0;0m')
        return False

    if const.matriz[l_d][c_d] != const.vazio:
        print('\033[31mMovimentação inválida, já existe uma peça nessa posição!\033[0;0m')
        return False

    # 2. Validacao de posse da peca
    if jogador == 1 and not eh_preta(peca_origem):
        print('\033[31mJogada inválida! Você só pode mover suas próprias peças (pretas).\033[0;0m')
        return False

    if jogador == 2 and not eh_branca(peca_origem):
        print('\033[31mJogada inválida! Você só pode mover suas próprias peças (brancas).\033[0;0m')
        return False

    # 3. Validacao de captura em andamento (combo)
    if const.peca_em_combo is not None:
        if [l_o, c_o] != const.peca_em_combo:
            print(f'\033[31mCaptura múltipla em andamento! Você deve continuar com a peça em ({const.peca_em_combo[0]}, {const.peca_em_combo[1]})!\033[0;0m')
            return False

    # 4. Obter jogadas legais no estado atual
    tipo_jogada, max_capturas, jogadas_validas = obter_todas_jogadas_jogador(const.matriz, jogador)

    if tipo_jogada == 'nenhuma':
        print('\033[31mVocê não possui movimentos válidos!\033[0;0m')
        return False

    # 5. Se houver captura obrigatoria disponivel
    if tipo_jogada == 'captura':
        # Checar se a peca escolhida e uma peca que pode realizar a captura maxima (Lei da Maioria)
        origens_validas = [j['caminho'][0] for j in jogadas_validas]
        if [l_o, c_o] not in origens_validas:
            print(f'\033[31mMovimentação inválida! Você é obrigado a capturar a peça rival (Lei da Maioria: {max_capturas} captura(s))!\033[0;0m')
            return False

        # Checar se o destino escolhido e o primeiro salto de alguma das sequencias maximas validas
        saltos_validos = [j['caminho'][1] for j in jogadas_validas if j['caminho'][0] == [l_o, c_o]]
        if [l_d, c_d] not in saltos_validos:
            print('\033[31mDestino inválido para a captura!\033[0;0m')
            return False

        # Realizar a captura
        captura(l_o, c_o, l_d, c_d, jogador)

        # Checar se a peca que acabou de capturar AINDA TEM capturas adicionais a fazer
        prox_seqs = buscar_sequencias_captura_peca(const.matriz, l_d, c_d)
        if prox_seqs:
            const.peca_em_combo = [l_d, c_d]
            atualiza_obrigatorios()
            print('\033[33mCaptura realizada! Continue a captura múltipla com a mesma peça.\033[0;0m')
            return False  # Mantem a vez com o mesmo jogador
        else:
            # Lance completo!
            const.peca_em_combo = None
            
            # Promocao a dama ao finalizar o lance na linha de coroacao
            peca_atual = const.matriz[l_d][c_d]
            if peca_atual == const.pretas and l_d == 0:
                const.matriz[l_d][c_d] = const.dama_preta
                const.quant_damas_j1 += 1
                print('\033[32mPeça promovida para DAMA!\033[0;0m')
            elif peca_atual == const.brancas and l_d == 7:
                const.matriz[l_d][c_d] = const.dama_branca
                const.quant_damas_j2 += 1
                print('\033[32mPeça promovida para DAMA!\033[0;0m')

            atualiza_obrigatorios()
            return True  # Passa a vez

    # 6. Se nao ha captura, validar movimento simples
    if tipo_jogada == 'simples':
        destinos_permitidos = [j['destino'] for j in jogadas_validas if j['origem'] == [l_o, c_o]]
        if [l_d, c_d] not in destinos_permitidos:
            if eh_dama(peca_origem):
                print('\033[31mMovimentação inválida para a dama!\033[0;0m')
            else:
                print('\033[31mMovimentação inválida! A peça só pode mover na diagonal para frente!\033[0;0m')
            return False

        # Executa o movimento simples
        const.matriz[l_d][c_d] = peca_origem
        const.matriz[l_o][c_o] = const.vazio

        # Contagem para empate (20 jogadas consecutivas de damas sem captura)
        if eh_dama(peca_origem):
            if jogador == 1:
                const.quant_jogadas_con_j1 += 1
            else:
                const.quant_jogadas_con_j2 += 1
        else:
            # Qualquer movimento de pedra simples reseta o contador de ambos os lados
            const.quant_jogadas_con_j1 = 0
            const.quant_jogadas_con_j2 = 0

            # Promocao a dama
            if peca_origem == const.pretas and l_d == 0:
                const.matriz[l_d][c_d] = const.dama_preta
                const.quant_damas_j1 += 1
                print('\033[32mPeça promovida para DAMA!\033[0;0m')
            elif peca_origem == const.brancas and l_d == 7:
                const.matriz[l_d][c_d] = const.dama_branca
                const.quant_damas_j2 += 1
                print('\033[32mPeça promovida para DAMA!\033[0;0m')

        atualiza_obrigatorios()
        return True  # Passa a vez

    return False
