# Tasks

## 1. Autorização

- [x] 1.1 Auditar todas as rotas de mutação de cenas e trocar verificação de dono pela comparação com `created_by_account_id`.
- [x] 1.2 Mostrar «Editar cena» apenas ao criador do canal em `Stage.tsx`; preservar feedback de 403 se o estado mudou entretanto.
- [x] 1.3 Testar criador, dono não criador, gestor de canais e membro comum; cobrir canal histórico com backfill.

## 2. Revisão

- [x] 2.1 Revisão dupla (arquiteto + fullstack, skills `spec-review-architect` / `spec-review-fullstack`).
- [x] 2.2 `openspec validate restrict-scene-edit-to-channel-creator --strict`.
