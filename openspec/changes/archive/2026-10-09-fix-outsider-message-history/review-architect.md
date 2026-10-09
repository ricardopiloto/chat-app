# Review — Arquiteto de Soluções

**Change:** fix-outsider-message-history
**Data:** 2026-10-09
**Veredito geral:** Aprovado com ressalvas

## 1. Definição da arquitetura técnica
Veredito: OK

- Não há stack, componente ou camada nova: é uma correção dentro de `channel_access` (`backend/src/api/authz.rs`), a mesma função de autorização já usada por todos os endpoints que dependem de `require_channel_view`. Confirmado lendo o código real — a troca é de uma linha (`ApiError::not_found` → `ApiError::forbidden`) no ramo em que `db::membership::find` não encontra a conta.
- N/A — escalabilidade: é uma correção de uma regra de autorização, não uma feature com carga nova; não há questão de capacidade a avaliar.

## 2. Integração com a infraestrutura existente
Veredito: OK

- Sem migração, sem endpoint novo, sem evento WS novo, sem alteração de deploy/infra — confirmado pelo `design.md` ("Migration Plan": sem migração, rollback por revert de commit). A correção é inteiramente dentro do processo servidor já existente.

## 3. Qualidade de arquitetura e trade-offs
Veredito: OK

- Segurança: o trade-off central (403 confirma a um estranho que aquele id de canal existe) está explicitado e aceito no `design.md`, com justificação correta — a lista de canais já faz essa mesma confirmação hoje, então a correção só torna o histórico consistente com um comportamento que já existe, não introduz uma fuga de informação nova.
- Decisão de centralizar a correção em `channel_access` (em vez de corrigir só `GET .../messages`) é a escolha certa: lendo os call sites reais, `require_channel_view`/`channel_access` são partilhados por mensagens, voz (`voice::join/leave/patch_media`), silenciar/dessilenciar (`mute.rs`, 5 handlers) e obtenção de acesso de canal (`channels::get_channel_access`). Corrigir na raiz evita o mesmo bug reaparecer endpoint a endpoint.
- Manutenibilidade: mantém-se a um só sítio de decisão, como o próprio `design.md` pede como Goal ("Um único sítio decide a recusa de 'sem membership'") — consistente com o objetivo do projeto de ser mantido por uma pessoa só.

## 4. Documentação e decisões (ADRs)
Veredito: Atenção

- `design.md` segue bem o estilo de ADR do projeto, com alternativas consideradas e motivo claro para a decisão central.
- **Atenção — a lista de verificação do próprio risco não cobre todo o raio de alcance que o `design.md` identifica**: a secção "Risks / Trade-offs" diz "Confirmar com `cargo test`, em especial `server_isolation` e os testes de mensagens, reações e ACL" — mas a mesma secção, uma linha antes, já reconhece que "outros callers de `channel_access` passam a ver 403 em vez de 404 se a membership faltar" como "o efeito pedido". Pelos call sites reais, isso inclui `backend/src/api/voice.rs` (`join`, `leave`, `patch_media`, linhas 249/323/343) e todos os handlers de `backend/src/api/mute.rs` (linhas 82/103/122/133/155), nenhum dos quais é nomeado na lista de testes a confirmar. Não é um erro de desenho — a decisão de corrigir na raiz é a correta (dimensão 3) — mas a lista de verificação deveria nomear esses dois ficheiros de teste explicitamente, não deixá-los implícitos em "outros callers".
- Diagrama: não é necessário — é uma correção de uma condição dentro de uma função já existente, sem fluxo novo a desenhar.

## 5. Ponte entre produto e técnico
Veredito: OK

- A proposta rastreia a um bug concreto já registado (`docs/bugs.md`) e a um teste já escrito e falhando (`integration::server_isolation::servers_do_not_leak_across_membership`), e o `design.md` traduz isso diretamente numa mudança de uma linha com âmbito bem delimitado (os três estados — canal inexistente, membro sem `view`, sessão ausente — continuam exatamente como estão).
- N/A — RPG: correção de autorização de propósito geral, sem componente específico de RPG.

## Bloqueantes antes de implementar
- Nenhum.

**Reconciliação (2026-10-09):** tarefa 1.3 adicionada a `tasks.md`, nomeando explicitamente `voice_join.rs` e `channel_mute.rs` na verificação — fecha a lacuna apontada na dimensão 4.
