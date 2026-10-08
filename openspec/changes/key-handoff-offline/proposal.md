# Proposal

## Why

O handoff da chave do servidor é só online (`specs/002-fase-1-mvp/contracts/key-handoff.md`, "Limitação conhecida"): quem entra por convite, ou troca de identidade, fica `pending` e não lê nem envia mensagens até que um membro `synced` abra o cliente. Em servidores pequenos ou fora de hora isso pode durar horas ou dias, e o novo membro vê o servidor "quebrado". O problema afeta o fluxo normal de convite, não só a recuperação de senha. Esta change resolve o caso do **convite**; a recuperação de senha por código do operador (Fase 1 do `password-recovery`) continua dependente de um membro online e só a chave de recuperação (Fase 2 do `password-recovery`) a resolve.

## What Changes

- O link de convite passa a poder carregar a `server_key` selada para uma chave efémera, no fragmento `#` (nunca enviado ao backend). Quem aceita o convite abre a chave localmente e fica utilizável de imediato, sem esperar um membro online.
- O cliente que aceita publica o próprio envelope (`POST /servers/{id}/key-envelopes`), ficando `synced` sem handoff de terceiros.
- Fallback para convites antigos (sem fragmento), para quem perde o fragmento e para a recuperação de senha: o handoff online continua, agora com a UI a dizer claramente "aguardando um membro online" e com atendimento idempotente em lote.
- Contrato aditivo: nenhum campo obrigatório novo no backend para clientes existentes (ver `docs/v2/contracts/backend-change-policy.md`).
- A recuperação por código do operador permanece no caminho de fallback (handoff online). A semente de convite não serve a quem já é membro.
- Fora de escopo: chave de recuperação (change `password-recovery`) e custódia pelo servidor (viola FR-015/SC-006).

## Capabilities

### New Capabilities
- `crypto/invite-key-seed`: convite que transporta a chave do servidor selada no fragmento, com aceitação que fica `synced` sem membro online.
- `crypto/handoff-fallback`: atendimento em lote e idempotente dos pedidos `key_handoff.requested` pendentes quando um membro `synced` liga.

### Modified Capabilities
- `frontend-v2/invites`: criação do link com semente, aceitação com abertura local da chave e estado "aguardando um membro online".

## Impact

- Backend: sem migração obrigatória. A aceitação já suporta o cliente publicar o próprio envelope; verificar em `api/key_envelopes.rs` que um membro `pending` pode publicar o seu envelope quando o servidor já tem chave (hoje devolve 409/403, ver design D3). `ws/mod.rs::replay_pending_handoffs` já cobre todos os pendentes.
- Frontend: `admin/InviteDialog.tsx`, `pages/Invite.tsx`, `crypto/keyHandoff.ts`, novo módulo `crypto/inviteSeed.ts`, catálogos i18n.
- Docs: `specs/002-fase-1-mvp/contracts/key-handoff.md`, `docs/v2/contracts/crypto-formats.md`, vectores.
- Registo na tabela de `docs/v2/contracts/backend-change-policy.md`.
- Ordem de merge: esta change entra **depois** de `password-recovery`, que tem alterações não commitadas em `key_envelopes.rs` e `keyHandoff.ts`, os mesmos ficheiros que esta toca.
