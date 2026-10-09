# Tasks

## 1. Largura do selector de reações

- [x] 1.1 Em `MessageRow`, ao abrir o selector, calcular `maxWidth` como a distância da borda esquerda de `.ch-scroll` até à borda direita da âncora, menos 8px, e passá-lo ao `EmojiPicker` só quando for menor que 320. O picker escreve esse valor em `max-width` e, sem ele, mantém 320px. O selector do composer não recebe `maxWidth`. Verificar: `npm run build` e `npm run lint` passam.
- [x] 1.2 Verificar no browser: numa janela de 320px de largura o selector de uma mensagem fica inteiro dentro da área visível (a borda esquerda não é negativa) e a grelha continua a mostrar emoji; numa janela de 390px ou mais a largura medida continua 320px. O lado acima/abaixo não muda.
