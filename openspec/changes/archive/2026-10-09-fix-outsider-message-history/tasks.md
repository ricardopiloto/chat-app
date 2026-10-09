# Tasks

## 1. Recusa de quem não é membro

- [x] 1.1 Em `channel_access` (`backend/src/api/authz.rs`), quando não há membership da conta no servidor do canal, devolver 403 `not a member of this server` em vez de 404 `channel not found`. Manter o 404 de canal inexistente no `find_by_id` e o 404 de `require_channel_view` quando o membro existe mas `access.view` é falso. Verificar que `permissions_acl` continua a esperar 404 no histórico de um membro sem permissão de ver, e que `integration::server_isolation::servers_do_not_leak_across_membership` passa (histórico 403, igual à lista de canais).
- [x] 1.2 Confirmar que um canal inexistente continua 404, que um pedido sem sessão continua 401, e que enviar (e reagir, se usar o mesmo lookup) num canal existente por quem não é membro passa a 403. Verificar com os testes de contrato de mensagens e reações já existentes, ajustando só expectativas que codificavam o 404 de não-membro.
- [x] 1.3 `voice::join`/`leave`/`patch_media` (`backend/src/api/voice.rs`) e os handlers de `backend/src/api/mute.rs` também passam por `require_channel_view` → `channel_access`, mas nenhum tem hoje um caso de não-membro: `backend/tests/contract/voice_join.rs` só tem um comentário morto ("outsider: create another server owner charlie...") sem a asserção correspondente, e `channel_mute.rs` só testa membro silenciado, nunca não-membro. Completar a asserção em `voice_join.rs` (não-membro recebe 403 ao tentar `POST .../voice/join`) e acrescentar um caso equivalente a `channel_mute.rs` — verificar que os dois novos casos passam.

## 2. Registo

- [x] 2.1 Acrescentar uma linha em `docs/v2/contracts/backend-change-policy.md` a descrever a correcção: o 404 de não-membro num canal existente passa a 403; não é aditivo; canal inexistente e membro sem `view` ficam 404. Mover o bug em `docs/bugs.md` para Resolvidos com ligação a esta change. Verificar que a linha e a secção Resolvidos existem e que `cargo test` passa, incluindo `server_isolation` e os testes de contrato de mensagens, ACL e reações.
