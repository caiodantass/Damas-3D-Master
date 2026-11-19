<div align="center">

# ♟️ Damas 3D Master | Checkers 3D AI & Official Engine

<p align="center">
  <strong>Jogo de Damas com Engine Oficial de Regras Brasileiras (CBJD), Inteligência Artificial com Minimax e Poda Alfa-Beta, e Renderização 3D Fotorrealista no Navegador.</strong>
</p>

[![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL_3D-black?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![Web Audio API](https://img.shields.io/badge/Web_Audio-API_Nativa-8A2BE2?style=for-the-badge)](https://developer.mozilla.org/pt-BR/docs/Web/API/Web_Audio_API)
[![Tests](https://img.shields.io/badge/Tests-100%25_Passing-1dd1a1?style=for-the-badge&logo=pytest&logoColor=white)](#-testes-automatizados)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

<br/>

[✨ Funcionalidades](#-funcionalidades) •
[🧠 Inteligência Artificial](#-inteligência-artificial-ia) •
[🏆 Regras Oficiais Modeladas](#-regras-oficiais-modeladas-cbjd) •
[🚀 Como Executar](#-como-executar) •
[🧪 Testes](#-testes-automatizados) •
[🏛️ Arquitetura de Software](#-arquitetura-do-projeto) •
[👤 Autor](#-autor)

<br/>

</div>

---

## 📌 Visão Geral do Projeto

O **Damas 3D Master** é um projeto completo de engenharia de software que combina **desenvolvimento de algoritmos de jogos**, **computação gráfica 3D** e **inteligência artificial adversarial**.

O projeto nasceu originalmente como um clássico jogo de terminal em Python e evoluiu para uma **aplicação Web 3D moderna e imersiva**, mantendo um motor matemático rigoroso que obedece 100% às regras oficiais das **Damas Brasileiras (64 casas)** estabelecidas pela Confederação Brasileira de Jogo de Damas (CBJD) e pela Fédération Mondiale du Jeu de Dames (FMJD).

### 🎯 O que torna este projeto diferenciado:
- **Zero Frameworks Pesados:** Construído com JavaScript Vanilla, Three.js puro e Python nativo — leve, performático e sem dependências infladas de Node.js/npm.
- **Engenharia de Regras Rigorosa:** Implementação estrita de regras complexas que a maioria dos jogos amadores ignora, como a **Lei da Maioria** (busca em profundidade por árvores de captura), **Dama Voadora**, **Captura para Trás** e **Promoção apenas ao Concluir Lance**.
- **Algoritmos de IA:** Tomada de decisão por árvore de busca minimax com **Poda Alfa-Beta (Alpha-Beta Pruning)** e funções heurísticas de avaliação posicional.
- **Computação Gráfica com Three.js:** Materiais PBR (*Physically Based Rendering*), iluminação cinematográfica com sombras suaves (*PCFSoftShadowMap*), modelagem de coroas 3D e animações em arco parabólico.
- **Áudio Espacial Sintetizado:** Efeitos sonoros gerados dinamicamente em tempo real via **Web Audio API**, sem carregar nenhum arquivo de áudio externo.

---

## ✨ Funcionalidades

### 🌐 Versão Web 3D (Navegador)
- 🎮 **Modo Jogador vs Máquina (IA):**
  - **Iniciante (Fácil):** Movimentos semi-casuais, ideal para aprendizado.
  - **Estrategista (Médio):** Minimax com profundidade 3, focando em segurança e centro.
  - **Mestre (Difícil):** Minimax com Poda Alfa-Beta profundidade 4+, avaliando sacrifícios táticos e controle posicional.
- 👥 **Modo Jogador vs Jogador (PvP Local):** Partida para 2 jogadores no mesmo dispositivo com alternância dinâmica de turnos.
- 🎨 **Ambiente 3D Fotorrealista:**
  - Tabuleiro em madeira nobre esculpida com textura procedural e frisos metálicos.
  - Peças chanfradas torneadas com **Coroa Real 3D Dourada** esculpida nas Damas.
  - **Animação em Parábola 3D:** a peça salta no ar por cima da peça capturada antes de aterrissar.
  - Indicadores visuais de foco, casas de destino válidas e anel pulsante de captura obrigatória.
- 🎥 **Múltiplos Ângulos de Câmera:**
  - `3D Livre`: Rotação orbital suave e zoom interativo com o mouse.
  - `Superior (2D)`: Visão tática vertical ortogonal.
  - `Pretas / Brancas`: Câmeras alinhadas à perspectiva de cada jogador.
- ↩️ **Função Desfazer Lance (Undo):** Reversão profunda de estados com restauro completo de tabuleiro, contadores e histórico.
- 📜 **Histórico de Lances:** Notação padrão de partidas em tempo real (ex.: `C3 → D4`, `E5 ✕ C7 ✕ A5`).
- 🔊 **Efeitos Sonoros Nativos:** Deslize de madeira, impacto de captura, acorde de coroação e fanfarra de vitória.
- 🎉 **Efeito Comemorativo:** Chuva de confetes de partículas 3D ao finalizar a partida.

### 💻 Versão Terminal Clássica (Python)
- Jogo executado diretamente pelo console com formatação rica em cores ANSI.
- Sistema de **Memory Card** com serialização de dados (`savegame.pkl` via Pickle) para salvar e continuar partidas a qualquer momento.

---

## 🏆 Regras Oficiais Modeladas (CBJD / FMJD)

Muitas implementações de damas pecam por aplicar regras simplificadas de *Checkers* americano. Este projeto implementa as **Damas Brasileiras**:

| Regra | Como Funciona no Damas 3D Master |
|---|---|
| **Lei da Maioria** | Se houver mais de um caminho de captura possível, o jogador é **obrigado** a escolher aquele que toma o **maior número de peças** (resolvido via busca exaustiva em profundidade DFS). |
| **Captura para Trás** | Pedras comuns capturam tanto para frente quanto para trás em saltos de 2 casas diagonais. |
| **Dama Voadora** | A dama move-se e captura em qualquer distância ao longo das 4 diagonais, podendo aterrissar em qualquer casa livre após a peça capturada. |
| **Proibição de Saltos Colados** | A dama não pode pular duas peças adversárias adjacentes sem casa vazia intermediária. |
| **Captura Múltipla Obrigatória** | Se uma peça inicia uma captura em cadeia, o jogador é obrigado a prosseguir o combo com a **mesma peça** até esgotar as tomadas. |
| **Promoção ao Parar** | Se uma pedra atinge a última linha durante uma captura mas pode continuar tomando para trás, **ela continua tomando como pedra** e só é coroada dama se parar o lance na oitava linha. |
| **Vitória por Bloqueio** | Se um jogador não possuir lances legais disponíveis no seu turno (afogamento), ele perde imediatamente a partida. |
| **Empate por 20 Lances** | 20 lances sucessivos de damas sem captura nem avanço de pedras simples configuram empate. |

---

## 🧠 Inteligência Artificial (IA)

A IA do jogo não utiliza decisões aleatórias cegas, mas sim técnicas clássicas de **Teoria dos Jogos**:

```
[ Estado do Tabuleiro ]
           │
           ▼
  [ Gerador de Lances Legais ] (Aplica Lei da Maioria)
           │
           ▼
┌──────────────────────────────────────────────┐
│  Algoritmo Minimax com Poda Alfa-Beta        │
│  ├─ Maximiza pontuação para a IA (Brancas)   │
│  ├─ Minimiza pontuação máxima do Adversário  │
│  └─ Podas de ramos inúteis (α ≥ β)          │
└──────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────┐
│  Função Heurística de Avaliação              │
│  • Material: Pedra (+100) vs Dama (+320)     │
│  • Controle Posicional de Centro (+10)       │
│  • Avanço Estratégico de Fileiras (+5/linha) │
│  • Blindagem da Fileira de Base (+15)        │
└──────────────────────────────────────────────┘
```

---

## 🏛️ Arquitetura do Projeto

O código foi reestruturado seguindo o princípio da **Separação de Responsabilidades (SoC)**:

```text
Projeto_Damas/
│
├── iniciar_jogo.py            # Servidor HTTP local e auto-launcher do navegador
├── teste_regras.py            # Suíte com 13 testes automatizados das regras
├── README.md                  # Documentação técnica do repositório
├── .gitignore                 # Filtro de arquivos de compilação e cache
│
├── web/                       # 🌐 APLICAÇÃO WEB 3D MASTER
│   ├── index.html             # Estrutura semântica e HUD em Glassmorphism
│   ├── css/
│   │   └── style.css          # Estilos visuais, responsividade e Dark Mode
│   ├── js/
│   │   ├── engine.js          # Motor de regras determinístico em JavaScript
│   │   ├── ai.js              # Módulo de Inteligência Artificial (Minimax / Alpha-Beta)
│   │   ├── scene3d.js         # Engine gráfica 3D (Three.js, iluminação, malhas, animações)
│   │   ├── audio.js           # Sintetizador procedural via Web Audio API
│   │   └── app.js             # Controlador MVC da aplicação
│   └── libs/                  # Dependências offline embarcadas
│       ├── three.min.js       # Three.js Core (R128)
│       ├── OrbitControls.js   # Controle orbital de câmera
│       └── canvas-confetti.min.js # Efeitos de partículas na vitória
│
├── main.py                    # 💻 LOOP PRINCIPAL DA VERSÃO TERMINAL
├── movimentacao.py            # Motor de regras em Python puro
├── tabuleiro.py               # Renderizador do tabuleiro em caracteres ANSI
├── constantes.py              # Definições globais de estado e peças
└── banco_de_dados.py          # Serialização Pickle (Memory Card Save/Load)
```

---

## 🚀 Como Executar

### Pré-requisitos
- **Python 3.8+** instalado no sistema.
- Um navegador web moderno (Google Chrome, Edge, Firefox, Brave, Safari, etc.).

### 1️⃣ Executando a Versão Web 3D (Recomendado)
Clone o repositório e execute o inicializador automático:

```bash
# Clone o repositório
git clone https://github.com/caiodantass/Projeto_Damas.git

# Entre na pasta
cd Projeto_Damas

# Inicie o jogo web 3D
python iniciar_jogo.py
```
> O comando iniciará um servidor HTTP local e **abrirá automaticamente o seu navegador** em `http://localhost:8000`.

*(Se desejar, você também pode abrir o arquivo `web/index.html` com duplo clique diretamente no seu navegador).*

---

### 2️⃣ Executando a Versão Terminal Clássica
Caso queira jogar a versão clássica no terminal:

```bash
python main.py
```

Durante a partida no terminal, informe as coordenadas no formato `Linha Coluna` (de 0 a 7):
```text
Jogador 1 ('Alice'), escolha a posição da peça - (Linha Coluna): 5 1
Jogador 1 ('Alice'), escolha a movimentação da peça - (Linha Coluna): 4 0
```

---

## 🧪 Testes Automatizados

O motor de regras possui uma suíte dedicada com **13 testes automatizados** cobrindo todos os casos de borda e regras críticas:

```bash
python teste_regras.py
```

### Resultados dos Testes:
```text
=== INICIANDO SUÍTE COMPLETA DE TESTES DAS REGRAS DO JOGO ===
✓ Teste 1  - Jogador não pode mover peça adversária: OK
✓ Teste 2  - Movimento simples, restrição de frente e casas escuras: OK
✓ Teste 3  - Captura simples para frente: OK
✓ Teste 4  - Captura simples para trás (Regra Brasileira): OK
✓ Teste 5  - Captura obrigatória bloqueia movimentos simples: OK
✓ Teste 6  - Lei da Maioria e captura múltipla obrigatória: OK
✓ Teste 7  - Bloqueio de troca de peça durante captura múltipla: OK
✓ Teste 8  - Dama voadora: salto e aterrissagem à distância: OK
✓ Teste 9  - Dama proibida de saltar duas peças coladas: OK
✓ Teste 10 - Promoção normal a Dama e atualização do contador: OK
✓ Teste 11 - Regra oficial de coroação (pedra em trânsito não vira dama): OK
✓ Teste 12 - Detecção de derrota por bloqueio (afogamento): OK
✓ Teste 13 - Salvamento e Carregamento (Save/Load Memory Card): OK

🎉 TODOS OS 13 TESTES DE REGRAS PASSARAM COM 100% DE SUCESSO!
```

---

## 🛠️ Tecnologias Utilizadas

- **Linguagens:** Python 3, JavaScript (ES6+), HTML5, CSS3.
- **Gráficos 3D & Shaders:** Three.js, WebGL, PBR Shading, OrbitControls.
- **Áudio:** Web Audio API (Síntese FM, Osciladores, Envelopes ADSR e Filtros Biquad).
- **Algoritmos:** Minimax, Alpha-Beta Pruning, Busca em Profundidade (DFS), Heurísticas de Avaliação Posicional.
- **Persistência:** Python Pickle (`savegame.pkl`), Local Memory State.
- **Controle de Versão:** Git & GitHub.

---

## 👤 Autor

Desenvolvido por **Caio Dantas**.

[![GitHub](https://img.shields.io/badge/GitHub-caiodantass-181717?style=flat-square&logo=github)](https://github.com/caiodantass)
[![Email](https://img.shields.io/badge/Email-caiomunizdantas@gmail.com-D14836?style=flat-square&logo=gmail&logoColor=white)](mailto:caiomunizdantas@gmail.com)

---

<div align="center">
  Se este projeto foi útil ou te inspirou, considere deixar uma ⭐️ no repositório!
</div>
