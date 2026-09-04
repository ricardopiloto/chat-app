# Results: Fase 2 — Cenas (validação)

**Date**: 2026-09-04

Validação manual pelo operador: **todos os pontos da Fase 2 passaram** (US1, US2, SC-001–SC-007, quickstart).

## Automated (`cargo test`)

Backend contract + integration: **27 passed** (25 contract, 2 integration).

| Check | Result |
|-------|--------|
| US1 copiar cena activa, duplicar, não auto-activar; PUT grid edita a activa | pass |
| US1 membro não cria cena | pass |
| US2 co-diretor activa só; não cria/edita/apaga/nomeia | pass |
| SC-005 sem rota de desligar E2EE / egress / gravação | pass |
| Isolamento F1 + plaintext never stored | pass |
| Timestamps SQLite da migração 0003 não rebentam POST /scenes | pass |

Frontend: tipos e UI de cenas/co-diretor ligados a `VoiceChannel`.

## Manual (quickstart.md)

Corrido em 2026-09-04 no host Fedora, instância Fase 1 já no ar.

| Check | Result |
|-------|--------|
| US1 Cena padrão migrada, copiar quadro visível, editar inactiva, activar ao vivo, voltar, duplicar, rejoin, recusa de membro, recusa de apagar activa/última | pass |
| US2 conceder co-diretor, activar, recusas (criar/editar/apagar/nomear), revogar | pass |
| SC-001 copiar + activar &lt; 2 min | pass |
| SC-002 todos vêem a mesma ocupação &lt; 3 s | pass |
| SC-003 reload/rejoin na cena activa | pass |
| SC-004 co-diretor vs membro sem papel | pass |
| SC-005/SC-006 sem desligar E2EE nem gravar no servidor | pass |
| SC-007 troca ao vivo sem reconectar / sem perda permanente de áudio | pass |

Caminho: `docs/operar-instancia.md` + `specs/003-fase-2-cenas/quickstart.md`.

## Notes

- Durante a validação: contas F1 sem `identity_vault` no servidor bloqueavam o login (cofre só no IndexedDB); o dono que regenerou chaves ficava em «Sincronizando chave do Servidor…»; `POST /scenes` 500 por `datetime('now')` na migração 0003. Os três foram corrigidos nesta sessão.
- Trocar de cena não reinicia a sala LiveKit (`grid.updated` + `scene.changed`).
- Cenas não abrem portas novas.
