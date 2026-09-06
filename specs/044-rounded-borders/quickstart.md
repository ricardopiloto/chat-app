# Quickstart: 044-rounded-borders

Validação visual end-to-end do grau **moderado–forte** e preservação de círculos/pílulas.

## Prerequisites

- Frontend a correr (`npm run dev` em `frontend/`).
- Conta de teste com servidor, canal de texto e canal de voz.
- Comparar mentalmente com o baseline pré-044 (ou branch `main` noutro browser).

## Setup

```bash
cd frontend && npm run dev
# opcional
npx tsc --noEmit
```

## Checklist visual (tema escuro)

1. **Shell**: sidebar, rail, topbar, painel de utilizador — cantos de caixas claramente mais redondos; avatars/server icons ainda circulares.
2. **Canal de texto**: composer/input, mensagens/cartões se aplicável, diálogos (criar canal, etc.).
3. **Menus flutuantes**: abertos a partir do shell — raio alinhado a md/lg, não afiado.
4. **Pílulas**: badges unread / chips full-pill ainda pílula (`999`), não “caixa md”.
5. **Voz**: pré-join / controlos caixa / tiles — mesmo grau; botões redondos de call intactos.
6. **Auth / convite**: formulário e painéis — mesmos tokens (sem estilo antigo afiado).

## Tema claro

Repetir passos 1–4 com tema claro: **mesmo** grau de arredondamento (FR-004 / SC-003).

## Smoke overflow

- Abrir diálogo modal e menu denso: texto/ícones **não** cortados pelos cantos (FR-006 / SC-004).
- Drawer/mobile se aplicável: sem clip óbvio.

## Grep sanity (opcional)

```bash
rg 'border-radius:\s*(6|8|10)px' frontend/src/styles/mesa-theme.css
```

Esperado: poucos ou nenhum hit em caixas (justificar residual no PR).

## Expected outcome

- SC-001/002 satisfazíveis por revisão informal.
- Contrato [radius-scale.md](./contracts/radius-scale.md) cumprido nos tokens.
- `tsc` limpo; zero mudança de comportamento funcional.
