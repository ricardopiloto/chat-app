# Quickstart: 054-channel-rename

## Prerequisites

- Backend + frontend running; migration stack current (no new migration expected)
- Accounts: Owner O, Member A (can create channels), Member B with role **Gerenciar canal**, Member C without

## Setup

```bash
cd backend && cargo test --test contract channel_rename -- --nocapture
cd frontend && ./node_modules/.bin/tsc --noEmit
```

## Scenarios

### A — Criador

1. A cria canal «tmp».
2. Duplo-clique no nome → «tmp2» → Enter.
3. **Expect**: lista e canal aberto mostram «tmp2».

### B — Dono

1. Canal criado por A.
2. O renomeia via duplo-clique.
3. **Expect**: sucesso.

### C — Gerenciar canal

1. B (com capacidade) renomeia canal de A.
2. **Expect**: sucesso.
3. C tenta → **Expect**: sem edição efectiva / 403.

### D — Validação

1. Rename para vazio → rejeitado; nome antigo permanece.
2. Rename para nome já usado por outro canal → **aceite**.

### E — Touch / narrow

1. Viewport estreita: duplo-toque no nome → editar → confirmar.
2. **Expect**: mesmo resultado que desktop.

## Done when

- A–E OK + contratos + `tsc` limpos.
