# Design

## Context

Backend é Rust (axum + sqlx/SQLite). O modelo de mensagem (`backend/src/domain/message.rs`, `backend/src/db/message.rs`) já segue um padrão de "enriquecimento": a linha base da tabela `message` é lida e depois `enrich()` preenche campos derivados (`attachment_ids`, `mentioned_account_ids`, remetente da mensagem citada) com queries adicionais antes de devolver o `Message` completo. `backend/src/api/messages.rs` expõe `post_message`/`delete_message`, e ambos terminam por chamar `send_to_channel_viewers(&state, &channel, <event>, <payload>)`, que resolve os membros do servidor com acesso de visualização ao canal (`authz::channel_access`) e usa `WsHub::send_to_accounts` para fan-out em tempo real. Os nomes de evento hoje emitidos (`message.new`, `message.deleted`, `presence`, `channel.e2ee_changed`, etc.) estão também tipados no frontend em `frontend/src/api/realtime.ts` (`REALTIME_EVENTS`). Não existe hoje `message.edited` nem indicador de "a escrever" — apagar é a única mutação pós-envio que existe.

O corpo da mensagem (`content_ciphertext`) é cifrado no cliente com a chave simétrica do servidor (`frontend/src/crypto/serverKey.ts`, AES-GCM) antes do `POST`; o backend nunca vê texto em claro de uma mensagem de utilizador. Já `reply_to_message_id`, `mentioned_account_ids` e `attachment_ids` viajam como metadados em claro (UUIDs) — não passam por `content_ciphertext`.

O selector de emoji já existe e é reutilizável: `frontend/src/chat/logic/emoji.ts` define `EMOJI_GROUPS`/`BY_CODE` (glyphs Unicode nativos, sem biblioteca externa, ~250 itens em 6 grupos, cada item com `{code, glyph}`) e `frontend/src/chat/EmojiPicker.tsx` é um componente Solid.js genérico (`onPick: (glyph) => void`) já usado pelo `Composer.tsx` para inserir emoji no texto.

Ver `proposal.md` para a motivação; ver a spec delta em `specs/frontend-v2/text-messaging/spec.md` para o comportamento exigido.

## Goals / Non-Goals

**Goals:**
- Persistir reações (mensagem × utilizador × emoji) e expor a contagem agregada por emoji em cada mensagem, para texto, anexos e mensagens de resposta.
- Reaproveitar o `EMOJI_GROUPS`/`EmojiPicker` existentes como fonte única de emoji válidos, sem introduzir uma segunda lista ou biblioteca de emoji.
- Sincronizar adicionar/remover reação em tempo real via o mesmo `WsHub`/`send_to_channel_viewers` já usado por `message.new`/`message.deleted`.
- Manter o mesmo modelo de permissão de escrita já aplicado ao envio de mensagens (reagir é uma forma leve de "escrever" no canal).

**Non-Goals:**
- Reações a um anexo individual dentro de uma mensagem multi-anexo (a reação é sempre à mensagem).
- Emoji livres/custom ou upload de emoji — o conjunto é fechado ao `EMOJI_GROUPS` atual.
- Notificações dedicadas de reação (ex. "X reagiu à tua mensagem") — fora de escopo desta change; pode ser proposto depois reaproveitando `notification.created`.
- Alterar o modelo de cifra do corpo da mensagem (`content_ciphertext`) — não é tocado por esta change.

## Decisions

### D1 — Nova tabela `message_reaction`, agregada no `enrich()` do backend
Nova tabela `message_reaction (message_id, account_id, emoji_code, created_at)` com chave primária composta `(message_id, account_id, emoji_code)`, FK em `message_id` com `ON DELETE CASCADE` (para desaparecer junto com a mensagem apagada, sem passo extra). O `enrich()` de `backend/src/db/message.rs` passa a incluir, por mensagem, uma lista agregada `reactions: Vec<ReactionSummary>` (`{ emoji_code, count, account_ids }`), seguindo o mesmo padrão já usado para `attachment_ids`/`mentioned_account_ids`.
- **Alternativa considerada**: guardar reações como JSON dentro da própria linha de `message`. Rejeitada — dificulta `UPSERT`/toggle atómico por `(message_id, account_id, emoji_code)` e quebra o padrão relacional já usado no resto do schema.

### D2 — Identidade da reação é o `code` (shortcode), não o glyph
A reação é guardada e sincronizada pelo `emoji_code` (ex. `"fire"`), não pelo carácter Unicode. O frontend resolve `code → glyph` com o `BY_CODE` já existente em `emoji.ts` para desenhar a pill.
- **Porquê**: mantém uma identidade estável e independente de como cada SO/browser renderiza o glyph, e segue a mesma convenção que o composer já usa para `:shortcode:`.
- **Alternativa considerada**: guardar o glyph diretamente (mais simples, zero mapeamento). Rejeitada por acoplar a identidade da reação à representação visual.
- **Impacto de implementação**: `EmojiPicker.tsx` ganha uma forma de expor também o `code` do item escolhido (hoje só devolve `glyph` via `onPick`), para o fluxo de reagir poder capturar o `code` sem alterar o comportamento existente do composer.

### D3 — Reações não passam por `content_ciphertext`; viajam como metadado em claro
O `emoji_code` é tratado como metadado (como `reply_to_message_id`/`mentioned_account_ids`), não como conteúdo cifrado.
- **Porquê**: o conjunto de emoji é fechado e não-sensível (não é texto livre do utilizador), e uma reação já é por natureza visível a todos os membros do canal com acesso à mensagem — cifrar não acrescenta confidencialidade real, só complexidade (seria necessário decifrar para agregar contagens no servidor, o que o modelo atual evita de propósito para o corpo da mensagem).
- **Alternativa considerada**: cifrar o `emoji_code` com a mesma chave do servidor, como o corpo da mensagem. Rejeitada por não haver ganho de confidencialidade (a reação é pública dentro do canal) e por impedir o servidor de agregar contagens sem decifrar.

### D4 — Dois novos eventos realtime: `reaction.added` / `reaction.removed`
Novos nomes de evento, no mesmo formato dos existentes, adicionados a `REALTIME_EVENTS` (frontend) e emitidos via `send_to_channel_viewers` (backend), com um payload mínimo `{ message_id, channel_id, account_id, emoji_code }` — o cliente atualiza o agregado local adicionando/removendo `account_id` do conjunto desse `emoji_code`, em vez de reenviar a lista completa de reações da mensagem a cada clique.
- **Alternativa considerada**: reutilizar `message.new` reenviando a mensagem inteira com as reações atualizadas. Rejeitada — payload desproporcionalmente grande para uma mudança de 1 registo, e obriga o cliente a substituir a mensagem completa em vez de aplicar um delta.
- **Risco de drift**: ver secção de riscos.

### D5 — Endpoints REST para adicionar/remover, toggle decidido no cliente
`POST /api/channels/{channel_id}/messages/{message_id}/reactions` (body `{ emoji_code }`) adiciona; `DELETE /api/channels/{channel_id}/messages/{message_id}/reactions/{emoji_code}` remove. O frontend decide qual chamar com base no estado local (já reagiu com este `emoji_code`? chama DELETE; senão, POST) — mesmo padrão de decisão local que já existe para outras ações toggle na UI.
- **Alternativa considerada**: um único endpoint `PUT`/`toggle`. Rejeitada — REST com verbos distintos mantém consistência com o resto da API (`post_message`/`delete_message`) e é idempotente por construção (`INSERT ... ON CONFLICT DO NOTHING` / `DELETE` sem erro se já não existir).

### D6 — Reagir exige a mesma permissão de escrita que enviar mensagem
Reagir usa o mesmo `authz::channel_access` (permissão de escrita) já aplicado a `post_message`; num canal só-de-leitura ou enquanto o utilizador está silenciado, o botão de reagir fica indisponível, tal como o composer fica bloqueado.
- **Porquê**: reagir é uma forma de "escrever" no canal (gera um registo visível a todos), não uma ação de leitura.
- **Alternativa considerada**: permitir reagir com apenas permissão de leitura (mais permissivo, como um "like"). Rejeitada por inconsistência com o resto do modelo de permissões do canal — pode ser revisitado depois se o produto quiser esse comportamento.

### D7 — Validação do `emoji_code` no backend contra uma lista canónica
O endpoint `POST .../reactions` rejeita (400) qualquer `emoji_code` que não conste de uma lista canónica de códigos válidos mantida no backend (os mesmos `code` de `EMOJI_GROUPS`).
- **Porquê**: a UI restringe a escolha ao `EmojiPicker`, mas a API é alcançável diretamente; sem validação no servidor, qualquer chamada HTTP poderia gravar texto livre como `emoji_code`, violando o requisito "reação restrita ao conjunto fechado de emoji" mesmo que a UI nunca o permita.
- **Alternativa considerada**: confiar apenas na validação client-side. Rejeitada — o backend é a fronteira de confiança real; validação só no cliente não é suficiente.
- **Nota de implementação**: a lista canónica do backend deve ser derivada/sincronizada manualmente com `frontend/src/chat/logic/emoji.ts` (não há hoje um ponto único partilhado entre backend Rust e frontend TS); manter os dois ficheiros em sincronia é responsabilidade de quem editar o conjunto de emoji no futuro.

## Risks / Trade-offs

- **[Risco] Drift do agregado em caso de evento perdido** (reconexão de WS, rede instável) → **Mitigação**: `list_messages`/`list_since` (já usados para sincronizar o histórico ao reconectar) passam a incluir o campo `reactions` agregado em cada mensagem, dando ao cliente um estado autoritativo completo a cada resync, independente dos eventos incrementais entretanto perdidos.
- **[Risco] Toggle rápido (duplo clique) causando condição de corrida** → **Mitigação**: chave primária composta `(message_id, account_id, emoji_code)` torna o `INSERT` idempotente (`ON CONFLICT DO NOTHING`) e o `DELETE` seguro mesmo se já não existir; não é necessário lock applicativo.
- **[Risco] Lista de autores da tooltip crescer sem limite em mensagens muito reagidas** → **Mitigação**: `account_ids` por `emoji_code` é devolvido na íntegra pelo backend (contagens tipicamente pequenas por canal), mas o frontend corta a apresentação em N nomes + "e mais N", como já descrito na spec.
- **[Trade-off] `emoji_code` em claro é tecnicamente observável pelo backend/DB**, ao contrário do corpo da mensagem → aceite conscientemente em D3; não é uma regressão de confidencialidade relevante porque a reação já é visível a todos os membros do canal na UI.

## Migration Plan

- Migração de schema aditiva: nova tabela `message_reaction` (sem alterar `message`); não há dados existentes para migrar.
- Novo campo `reactions: Vec<ReactionSummary>` no payload de `Message` tem default vazio (`[]`) — compatível com qualquer cliente que ainda não o leia.
- Deploy em dois passos não é necessário: backend e frontend deste repositório são versionados e implantados juntos (não há clientes externos desta API).
- Rollback: remover a tabela `message_reaction` e os dois endpoints/eventos novos não afeta `message`/`attachment` existentes — reversível sem perda de dados fora das próprias reações.
