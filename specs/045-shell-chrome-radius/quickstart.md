# Quickstart: 045-shell-chrome-radius

Validar cartões de chrome com cantos visíveis e gutters subtis.

## Prerequisites

- Frontend: `cd frontend && npm run dev`
- Sessão autenticada com servidor + canais (texto/voz)
- Comparar mentalmente com shell full-bleed pré-045

## Setup

```bash
cd frontend && npm run dev
npx tsc --noEmit
```

## Checklist desktop (tema escuro)

1. **Topbar**: cartão arredondado com folga às bordas da app; alinhada às colunas; não full-bleed.
2. **Server-rail**: cartão com cantos visíveis; gap face à sidebar.
3. **Sidebar-header**: cartão próprio (nome do servidor).
4. **Sidebar-nav**: cartão próprio com folga face ao header e ao user-panel; scroll interno sem “cortar” o fundo em recto.
5. **User-panel**: cartão próprio no fundo da coluna.
6. **Pane / home-empty**: cartão arredondado (“Escolha um canal” ou canal aberto).
7. **Gutter**: folga lê-se subtil e uniforme (não quase-colado nem gaps largos).

## Tema claro

Repetir 1–7; mesmos gutters/raios (FR-004 / SC-003).

## Stage + drawer

1. Entrar em voz (stage): expand/collapse canais — sem clip grave / gaps partidos (FR-006).
2. Viewport &lt; 900px: abrir drawer — cartões coerentes, conteúdo legível (SC-004).

## Expected outcome

- SC-001: 6/6 regiões com cantos visíveis
- SC-005: gutters subtis
- Contrato [shell-chrome-cards.md](./contracts/shell-chrome-cards.md) cumprido
- `tsc` limpo
