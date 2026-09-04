# Quickstart: 007-shell-create-plus

## Prerequisites

- Backend + frontend running (ex. `cargo run` in `backend/`, `npm run dev` in `frontend/`).
- Conta autenticada; idealmente 2 contas (dono + membro) no mesmo servidor.

## Smoke CSS (US3)

1. Abrir a SPA no browser.
2. **Expect**: chrome Mesa visível; sem falha de estilos por CSS inválido.
3. Opcional: `cd frontend && npm run build` completa sem erro de parse do CSS.

## Criar servidor pelo «+» do rail (US1)

1. Observar o rail: «+» no **fundo**, visível mesmo com muitos servidores (scroll só na lista).
2. Clicar «+» → diálogo «Criar servidor» com nome + bloco de custódia da chave do canal de voz + checkbox.
3. Sem checkbox → submit falha / bloqueado.
4. Com custódia confirmada → servidor seleccionado; secções **Texto** e **Voz e vídeo** com ≥1 canal cada; voz com `has_channel_key` (Gravar não bloqueado por “legado sem chave”).
5. Coluna de canais: **0** botões «Criar servidor» / «Criar canal».

## Criar canal pelas secções (US2)

1. Como **dono**: «+» à direita de Texto e de Voz e vídeo.
2. «+» Texto → diálogo **sem** escolha de tipo → cria texto sob Texto.
3. «+» Voz → custódia → cria voz sob Voz e vídeo.
4. Como **membro** (não dono): labels das secções sem «+».

## Invariante apagar (US4)

1. Servidor com 1 texto + 1 voz: tentar apagar o texto → **409** / mensagem; canal permanece.
2. Idem para o único voz.
3. Com 2 textos: apagar um texto → sucesso; o outro permanece.

## Uma cena + Editar cena (US5)

1. Abrir canal de voz: **sem** painel lista «Cenas» / nova / duplicar / activar / apagar.
2. Dono: **Editar cena** → editor da cena activa → Salvar → grade reflecte alterações.
3. Confirmar em `docs/backlog-prototype-v2-gaps.md` que multi-cena é **G10**.

## Contracts to exercise

- [create-server-bootstrap.md](./contracts/create-server-bootstrap.md)
- [delete-channel-last-of-type.md](./contracts/delete-channel-last-of-type.md)
- [shell-plus-ui.md](./contracts/shell-plus-ui.md)

## Automated checks (when implemented)

```bash
cd backend && cargo test
cd frontend && npx tsc --noEmit
```
