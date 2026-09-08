# Quickstart: 055-channels-rail-drawer

## Prerequisites

- Frontend em `npm run dev` (ou build)
- Layout desktop com Server Rail + sidebar de canais (viewport larga)
- Spec clarificada: fora do palco; peek só abre; reflow; header fecha

## A — Ocultar fora do palco

1. Sem modo palco (vista normal de canais).
2. No cabeçalho da sidebar, usar **Ocultar canais**.

**Expect**: Lista recolhe atrás do rail; faixa fina à direita do rail; main ganha espaço; ícones do rail clicáveis.

## B — Hover enlarge + abrir pela faixa

1. Com lista oculta, passar o rato na faixa.
2. **Expect**: enlarge/destaque da faixa.
3. Clicar a faixa.
4. **Expect**: lista abre em reflow (~largura original); main cede espaço.

## C — Faixa não fecha

1. Com lista aberta, clicar na zona da faixa / borda se ainda visível.
2. **Expect**: **não** fecha.
3. Usar **Ocultar canais** no cabeçalho.
4. **Expect**: fecha com peek de novo.

## D — Palco

1. Entrar em canal de voz / stage-mode.
2. Repetir ocultar / peek abrir / header ocultar.

**Expect**: Mesmo padrão; chrome de voz intacto.

## E — Persistência

1. Ocultar canais → refresh.
2. **Expect**: estado oculto restaurado (ou coerente com pref).

## F — Mobile / estreito

1. Viewport ~375px.
2. **Expect**: menu/drawer existente continua a funcionar; não exige peek-behind-rail.

## G — Tipagem

```bash
cd frontend && ./node_modules/.bin/tsc --noEmit
```

**Expect**: exit 0.
