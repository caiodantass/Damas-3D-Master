# ♟️ Damas 3D Master & Terminal (Python & Web)

Jogo de **Damas** completo com regras oficiais (incluindo **Lei da Maioria**, **Captura para Trás**, **Dama Voadora**, **Capturas Múltiplas Obrigatórias**, **Coroação ao Parar** e **Derrota por Bloqueio**).

Agora disponível em **duas versões**:
1. 🌐 **Versão Web 3D Imersiva (Navegador)** — Gráficos 3D realistas com Three.js, animações em arco parabólico, efeitos sonoros sintetizados, modo **Jogador vs Jogador** e **Jogador vs Máquina (IA com 3 níveis: Fácil, Médio e Mestre)**.
2. 💻 **Versão Terminal Clássica** — Jogo 100% em Python no terminal com suporte a salvar/carregar progresso via Memory Card (`savegame.pkl`).

---

## 🚀 Como Jogar a Versão Web 3D (Recomendado)

### Passo 1: Executar o inicializador
No terminal, na pasta do projeto:
```bash
python iniciar_jogo.py
```
Isso iniciará o servidor local e **abrirá automaticamente o seu navegador** em `http://localhost:8000`.

*(Alternativamente, você também pode simplesmente abrir o arquivo `web/index.html` em qualquer navegador moderno).*

### ✨ Destaques da Versão 3D
- 🎮 **Modos de Jogo:**
  - **Jogador vs Máquina (IA):** Enfrente a inteligência artificial com 3 níveis (Iniciante, Estrategista e Mestre com Minimax e Poda Alfa-Beta).
  - **Jogador vs Jogador:** Jogue com um amigo no mesmo computador.
- 🎨 **Visual 3D Imersivo:**
  - Tabuleiro esculpido em madeira nobre com sombras suaves e materiais PBR fotorrealistas.
  - Peças chanfradas com detalhes de torneio e **Coroa Real 3D Dourada** para as Damas.
  - Animação de salto em arco parabólico durante as capturas.
  - Efeitos luminosos indicando casas válidas e alerta de captura obrigatória pela Lei da Maioria.
  - Chuva de confetes comemorativos na vitória!
- 🔊 **Efeitos Sonoros Integrados (Web Audio API):**
  - Sons sintetizados de peças de madeira deslizando, impacto de captura, fanfarra triunfal e coroação.
- 🎥 **Câmeras Alternáveis:**
  - 3D Livre (órbita interativa), Superior Tática (2D), Visão das Pretas e Visão das Brancas.
- ↩️ **Função Desfazer Lance (Undo)** e **Histórico de Jogadas**.

---

## 💻 Como Jogar a Versão Terminal Clássica

Para jogar a versão original de terminal:
```bash
cd Projeto_Damas-main
python main.py
```

### 🧠 Como funciona a entrada no terminal
Digite a posição de origem (linha e coluna) e a posição de destino (linha e coluna), com valores entre `0` e `7`:
```text
Posição da peça (Linha Coluna): 5 1
Movimentação da peça (Linha Coluna): 4 0
```

---

## 🧩 Estrutura do Projeto

```text
Projeto_Damas-main/
│
├── iniciar_jogo.py            # Inicializador que abre o jogo 3D no navegador
├── teste_regras.py            # Suíte automatizada de testes das regras oficiais
├── README.md                  # Documentação do projeto
│
├── web/                       # 🌐 JOGO DE DAMAS 3D WEB
│   ├── index.html             # Interface do jogo com HUD em Glassmorphism
│   ├── css/
│   │   └── style.css          # Estilos visuais, Dark Mode e animações
│   ├── js/
│   │   ├── engine.js          # Motor de regras oficial das Damas Brasileiras
│   │   ├── ai.js              # Inteligência Artificial (Minimax / Alpha-Beta)
│   │   ├── scene3d.js         # Renderizador 3D em Three.js (iluminação, peças, câmera)
│   │   ├── audio.js           # Sintetizador de efeitos sonoros nativo
│   │   └── app.js             # Controlador principal
│   └── libs/
│       ├── three.min.js       # Three.js R128
│       ├── OrbitControls.js   # Controle de câmera orbital
│       └── canvas-confetti.min.js # Efeito festivo de confetes
│
└── Projeto_Damas-main/        # 💻 JOGO CLÁSSICO DE TERMINAL
    ├── main.py                # Loop principal do terminal
    ├── movimentacao.py        # Motor de regras corrigido em Python
    ├── tabuleiro.py           # Renderização ANSI do tabuleiro
    ├── constantes.py          # Constantes globais
    └── banco_de_dados.py      # Sistema de Save/Load (Memory Card)
```

---

## 🏆 Regras Oficiais Aplicadas (Damas Brasileiras - 64 casas)
- ✅ **Captura Obrigatória e Lei da Maioria:** Se houver capturas disponíveis, é obrigatório escolher a linha que captura o maior número de peças.
- ✅ **Captura para Trás:** Peças simples podem capturar para frente e para trás.
- ✅ **Dama Voadora:** Move-se e captura em qualquer distância ao longo das 4 diagonais (sem saltar peças coladas).
- ✅ **Captura Múltipla Obrigatória:** O jogador deve continuar a captura em cadeia com a mesma peça.
- ✅ **Coroação ao Parar:** Se uma pedra atingir a linha de coroação mas puder continuar tomando peças, ela continua tomando como pedra simples e só vira dama se terminar o lance na linha de fundo.
- ✅ **Condição de Vitória:** Eliminação de todas as peças adversárias OU bloqueio (falta de lances válidos).
- ✅ **Empate:** 20 lances sucessivos de damas sem captura.

---

Feito com dedicação por **Caio Dantas**!
