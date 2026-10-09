# Review — Desenvolvedor Fullstack

**Change:** fix-outsider-message-history
**Data:** 2026-10-09
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend
Veredito: OK

- Implementável exatamente como descrito: li `backend/src/api/authz.rs` e confirmei que `channel_access` (linha ~41) devolve hoje `ApiError::not_found("channel not found")` quando `db::membership::find` não encontra a conta, e que `require_channel_view` (linha ~137) tem o seu próprio 404 separado para `!access.view` — os dois pontos que o `design.md` descreve existem exatamente onde ele diz, e a troca é a de uma linha que o `design.md` promete, sem decisão de arquitetura em falta.
- Sem migração, sem mudança de schema, sem integração com LiveKit/mídia/anexos a cobrir — nada disso é tocado.

## 2. Desenvolvimento do frontend
N/A — `proposal.md` ("Impact") declara "sem mudança de frontend", e confirmei isso: não há no frontend nenhum tratamento que distinga 403 de 404 para a leitura do histórico de um canal (`grep` em `frontend/src/api`/`frontend/src/chat` só encontra checagem de 401/403/204 em `realtime.ts`, para o WebSocket, sem relação com este endpoint). O marcador **BREAKING** do `proposal.md` é sobre clientes externos que dependessem do 404, não sobre este frontend.

## 3. Deploy e operação
Veredito: OK

- Nenhum script, porta, variável de ambiente ou passo de deploy novo. `cargo test` já é o mecanismo de verificação suficiente, como a própria `tasks.md` 1.1/1.2/2.1 usa.

## 4. Qualidade de código
Veredito: Atenção

- `tasks.md` segue o padrão "tarefa + como verificar" do projeto, e a tarefa 2.1 replica corretamente o formato de registo já usado em `docs/v2/contracts/backend-change-policy.md` para correções deste tipo.
- **Atenção — o raio de alcance real da mudança em `channel_access` inclui `voice.rs` e `mute.rs`, e nenhum dos dois tem hoje um teste de "não-membro" que a correção tornaria verificável**:
  - `backend/src/api/voice.rs`: `join`, `leave` e `patch_media` (linhas 249/323/343) chamam `require_channel_view` → `channel_access`, exatamente o caminho alterado. Olhei `backend/tests/contract/voice_join.rs:130-131` e o teste de "outsider" é só um **comentário morto**: `// bob is a member — should succeed. outsider: create another server owner charlie without invite to alice's server.` — o código que criaria o "charlie" e faria a asserção nunca foi escrito; a função termina logo depois da asserção do bob (membro). Ou seja, hoje não existe nenhuma asserção de que `voice::join` por um não-membro devolve 404 (antes) ou 403 (depois).
  - `backend/src/api/mute.rs`: todos os handlers (linhas 82/103/122/133/155) passam por `require_channel_view`. `backend/tests/contract/channel_mute.rs` tem `FORBIDDEN` em três pontos, mas todos são sobre um **membro silenciado** tentando enviar mensagem (ex. linha ~145, `mute_blocks_send_in_channel_only`) — nenhum é sobre um não-membro a tentar silenciar/consultar silenciamento num canal de outro servidor.
  - Como `cargo test` não tem hoje nenhuma asserção codificando 404 para esses dois casos, a suíte vai continuar a passar sem que ninguém confirme que a correção também funciona aí — não é um risco de regressão (nada quebra), é uma lacuna de cobertura que esta change é a oportunidade natural de fechar, já que é exatamente o código que ela está a mexer.
  - **Recomendação**: estender a tarefa 1.2 (ou acrescentar 1.3) para completar o teste de `voice_join.rs` (terminar a asserção que o comentário já descreve) e acrescentar um caso de não-membro a `channel_mute.rs`, confirmando 403 nos dois.
- Concorrência/resiliência: não se aplica — é uma leitura de autorização síncrona, sem estado compartilhado novo.

## 5. Execução das decisões arquiteturais
Veredito: OK

- `tasks.md` 1.1 executa fielmente a decisão central do `design.md` (mover o 404 de falta de membership para 403 dentro de `channel_access`, preservando os dois 404 legítimos) sem reabrir nem divergir da decisão.
- Não identifiquei nenhuma limitação técnica nova que a arquitetura proposta não enderece — a lacuna da dimensão 4 é de cobertura de teste em `tasks.md`, não uma limitação da decisão em si (a decisão de corrigir em `channel_access` está correta e é exatamente o que torna `voice.rs`/`mute.rs` corrigidos de brinde, sem tarefa extra de código).

## Bloqueantes antes de implementar
- Nenhum.

## Limitações técnicas a reportar ao Arquiteto
- Nenhuma — o achado da dimensão 4 é uma lacuna de teste em `tasks.md`, não uma limitação de arquitetura; não exige revisitar o `design.md`.

**Reconciliação (2026-10-09):** tarefa 1.3 adicionada a `tasks.md`, cobrindo o caso de não-membro em `voice_join.rs` e `channel_mute.rs`. Achado de atenção resolvido antes do início da implementação.
