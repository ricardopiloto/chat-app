# Quickstart: 048-user-panel-span-rail

Validar cartão-base contínuo, rail encurtada, e moldura do chrome.

## Prerequisites

```bash
cd frontend && npm run dev
# backend já a correr se necessário para login
```

Autenticar; ter ≥1 servidor; idealmente vários para testar scroll da rail.

## Scenarios

### A — Cartão contínuo + gutter

1. Abrir shell normal (não stage).
2. Confirmar: um único `.user-panel` na base alinhado à esquerda da rail e à direita da sidebar.
3. Confirmar: espaço `--shell-gutter` entre o fundo da rail e o topo do painel.
4. Confirmar: rail **não** desce ao lado do painel.

### B — Scroll da rail

1. Com muitos servidores (ou altura de janela reduzida).
2. Scroll na lista: ícones e “+” ficam acima do painel; nenhum ícone sob o painel.

### C — Controlos de chamada

1. Entrar em voz; sair do stage (controlos no painel).
2. Mute / surdez / câmara / sair accionáveis sem scroll horizontal do painel.

### D — Moldura exterior

1. Observar contorno de **toda** a área (topbar + shell).
2. Borda 1px visível; cantos arredondados (`radius-lg`); sem glow.
3. Tema claro (se disponível): borda ainda legível.

### E — Stage + membros

1. Stage colapsado: painel ainda full-span da nav (rail + faixa); rail acima.
2. Abrir membros: moldura `.app` envolve também a coluna de membros; geometria esquerda intacta.

## Expected outcome

- SC-001–SC-005 satisfeitos visualmente.
- Contrato [chrome-span-border.md](./contracts/chrome-span-border.md) cumprido.
- `cd frontend && ./node_modules/.bin/tsc --noEmit` OK após mudanças TSX.
