# Spec Delta

## ADDED Requirements

### Requirement: Borda visível da janela principal no desktop

No cliente desktop (Electron), a janela principal SHALL apresentar uma borda fina e contínua à volta do conteúdo da aplicação, com contraste suficiente para permanecer distinguível face a um fundo do sistema operativo escuro e face aos temas claros e escuros da própria aplicação. O build web SHALL NOT desenhar esta borda. Janelas secundárias do shell (popout de chamada, picker de ecrã) SHALL NOT receber esta borda por esta change.

Quando a janela principal estiver maximizada, o sistema SHALL ocultar essa borda (sem faixa residual nas bordas do ecrã).

#### Scenario: Borda visível com tema escuro do SO

- **WHEN** a aplicação desktop corre com a janela principal restaurada (não maximizada) sobre um ambiente de SO com tema escuro
- **THEN** o contorno da janela permanece perceptível em relação ao fundo

#### Scenario: Sem borda no build web

- **WHEN** a mesma UI corre no browser
- **THEN** não há borda de janela acrescentada por este mecanismo

#### Scenario: Maximizado sem borda

- **WHEN** o utilizador maximiza a janela principal no desktop
- **THEN** a borda deixa de ser desenhada até a janela voltar ao estado restaurado
