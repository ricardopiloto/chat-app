# Design

## Context

Ver `proposal.md` — Why. Pontos de código que ancoram este design:

- `backend/src/domain/channel.rs:6-9`: `ChannelType` hoje só tem `Text`/`VoiceVideo`, com `as_str()`/`parse()` triviais de estender.
- `backend/src/api/channels.rs:140-149` (`valid_level`): mapeia tipo de canal → níveis de permissão válidos (`Text` → `Read|Write`; `VoiceVideo` → `Listen|Speak`).
- `backend/src/api/channels.rs:~415` (`last_channel_of_type`): já genérico por `kind_label`, não enumera tipos — não precisa de mudança para um terceiro tipo.
- `backend/migrations/0019_member_join_welcome.sql:2` e a coluna `kind` da tabela `channel`: `TEXT`, sem `CHECK` — um valor novo não exige migração.
- `frontend/src/shell/Sidebar.tsx:13-16` (`SECTIONS`): array `{kind, title, add, glyph}` já é o ponto de extensão exacto para uma secção nova na sidebar.
- `frontend/src/admin/CreateChannelDialog.tsx:12-26`: `kind` como `Segmented` entre `"text"`/`"voice_video"`; `voice()` só controla o passo de custódia de chave, não a geração da chave em si (gerada sempre, linha 23 `generateChannelKey()`).
- `docs/v2/mesa_shell_da_aplica_o_chat_de_texto/code.html`: secção "Ferramentas VTT" com "Tabuleiro Tático" (`grid_view`, fora de escopo) e "Histórico de Dados" (`casino`, `data-path="rolagem-de-dados"`).
- Restante contexto (mecânica da rolagem) inalterado da versão anterior deste documento: `backend/src/domain/message.rs`, `backend/src/db/message.rs` (`create_system` como precedente de `kind` não-E2EE), `backend/src/api/messages.rs` (`require_write_text`, `send_to_channel_viewers`), `rand::thread_rng()` já em uso, `frontend/src/chat/thread.ts` (`toChatMessage`).

## Goals / Non-Goals

**Goals:**
- "Histórico de Dados" existe como um canal de um novo tipo (`Dice`), criado/gerido/apagado como qualquer canal — ACL, posição na sidebar, protecção de "último canal do tipo".
- Rolar dados funciona em canais de Dados **e** em canais de Texto (o botão do composer continua a embutir rolagens na conversa normal).
- Canais de Dados nunca têm E2EE — coerente com a rolagem em si nunca poder ser E2EE (Decisão B2).

**Non-Goals:**
- "Tabuleiro Tático" (`mesa-tesserae-vtt` no mockup) — continua inteiramente fora de escopo, sem nenhuma entrada/placeholder na sidebar.
- Painel "Mesa Rápida D20" do roster de chamada de voz — ambiguidade de canal-alvo já descartada antes, inalterada.
- Limite de um só canal de Dados por servidor — tratado como qualquer outro tipo de canal (pode haver vários, tal como vários canais de texto), a não ser que o utilizador peça o contrário mais tarde.
- Migrar/mover mensagens de rolagem já existentes de canais de Texto para um canal de Dados — não pedido.

## Decisions

### A. Arquitectura do novo tipo de canal

#### A1. `ChannelType::Dice` como terceiro tipo de primeira classe, não um "modo" de canal de texto

Em vez de um `boolean`/flag num canal de Texto (ex. `is_dice_log: bool`), um tipo novo no mesmo enum — porque a sidebar, a criação, a ACL e a protecção de "último canal do tipo" já são todas orientadas por `ChannelType`/`kind`, e um canal de Dados precisa exactamente dessas quatro coisas (aparecer na secção certa, ser criável, ter as suas próprias regras de acesso, não poder ser apagado se for o único). Um "modo" dentro de Texto exigiria ramificar cada um desses quatro sítios por uma condição extra, em vez de reaproveitar o despacho por tipo que já existe.

#### A2. Canais de Dados aceitam só rolagens, não mensagens normais

`backend/src/api/messages.rs` (`post_message`) ganha uma guarda: se `channel.kind == ChannelType::Dice`, recusar com um erro claro (ex. `400 dice_channel_text_not_allowed`) — este tipo de canal existe para ser um histórico de rolagens, não mais um lugar para conversar. O endpoint de rolagem (`POST /channels/{id}/dice`, Decisão B abaixo) continua a usar `require_write_text`/`can_write_text` para ambos os tipos (Decisão A3) — só `post_message` ganha a exclusão.

#### A3. `ChannelType::Dice` ganha os mesmos níveis do tipo Texto, em todos os sítios reais que despacham por tipo

**Achado das revisões (`review-architect.md`/`review-fullstack.md`)**: não é só `channels.rs:140-149` (`valid_level`) — confirmado por leitura de `backend/src/domain/permissions.rs` que há mais quatro funções com `match channel.kind`/`match (channel.kind, ...)` exaustivo a estender:
- `maximum_level` (70-75) e `view_level` (77-82): `ChannelType::Dice => PermLevel::Write` e `=> PermLevel::Read`, respectivamente — mesmos valores do tipo Texto.
- `level_compatible` (84-93): `(ChannelType::Dice, PermLevel::Read | PermLevel::Write)` — mesma combinação que `valid_level` em `channels.rs` (possível redundância pré-existente entre os dois ficheiros, não desta change).
- O bloco de **acesso por omissão** (288-339): decide `Write`/`Read` por omissão a partir de uma *capability* do cargo efectivo — `caps.can_send_messages` para Texto, `caps.can_speak_voice`/`can_connect_voice` para Voz. Para Dados, reaproveita-se **`caps.can_send_messages`** (mesma *capability* do Texto) — decisão explícita, não uma *capability* `can_roll_dice` nova, porque não há motivo para distinguir "pode escrever texto" de "pode rolar dados" como permissões separadas.

O construtor de regras de ACL no frontend (painel de definições de canal, já rotulado por tipo — "leitura/escrita para texto, ouvir/falar para voz") ganha o rótulo equivalente para Dados (ex. "ler/rolar"), localizado durante a implementação (ver `tasks.md`).

#### A6. `Content.tsx` precisa de um terceiro ramo de despacho, não só um `fallback` binário

**Achado de `review-fullstack.md`**: `frontend/src/shell/Content.tsx:46-48` despacha hoje `<Show when={channel.type === "text"} fallback={<VoicePage/>}><ChannelPage/></Show>` — um canal de Dados cairia no `fallback` e seria renderizado como `VoicePage`. Corrigido para um `Switch`/`Match` com três ramos (`"text"` → `ChannelPage`, `"voice_video"` → `VoicePage`, `"dice"` → `ChannelPage` com o composer substituído, Decisão B5) em vez de `Show`/`fallback` binário.

#### A4. Canais de Dados nunca geram chave de canal

`CreateChannelDialog.tsx` chama `generateChannelKey()` incondicionalmente hoje (linha 23) e só varia o passo de custódia por `voice()`. Para `kind === "dice"`, a criação salta a geração de chave inteiramente (nenhuma chamada a `generateChannelKey`/`sealChannelKeyForSelf`) — coerente com a Decisão B2 (a rolagem nunca é E2EE, não há nada para cifrar neste tipo de canal).

#### A5. Sidebar: nova secção "Ferramentas VTT", só com a entrada de Dados

`Sidebar.tsx` `SECTIONS` ganha `{ kind: "dice", title: "shell.vttTools", add: "admin.channel.addDice", glyph: "casino" }` — mesmo padrão exacto das duas entradas já existentes, sem nenhuma entrada extra para "Tabuleiro Tático" (Non-Goal).

### B. Mecânica da rolagem (inalterado da proposta anterior)

#### B1. Notação como novo `kind` de mensagem, não um campo novo na tabela

Uma rolagem é uma mensagem com `kind = 'dice_roll'`, `content_ciphertext` vazio e `content_plaintext` com um JSON (`{"notation","sides","count","rolls","modifier","total","label","natural"}`) — mesmo mecanismo que `kind='system'` já usa (`create_system`), sem anular o remetente. Sem migração de esquema.

#### B2. Resultado gerado e guardado em claro pelo servidor, nunca E2EE

O "RNG Seguro" do mockup só faz sentido vindo do servidor — o resultado não pode ser E2EE, nem num canal de Texto nem (por construção, Decisão A4) num canal de Dados. Risco aceite e documentado: nada impede uma narrativa posterior divergente numa mensagem normal cifrada; o número do servidor fica registado e visível a todos no momento da rolagem.

#### B3. Notação limitada e validada no servidor

`NdM+K`: `count` 1-20, `sides` 2-1000, `modificador` -100..100. `400` fora destes limites. `rand::thread_rng()` (já em uso no backend).

#### B4. Rótulo de desfecho só para `1d20`, sem motor de regras

Natural 20 → "Crítico"; natural 1 → "Falha Crítica"; qualquer outro valor, ou outra notação, sem etiqueta.

#### B5. Composer: popover novo, mesmo padrão dos pickers já existentes

Botão "Lançar dados" (ícone `casino`) no composer de canais de Texto — continua a funcionar exactamente como antes; dentro de um canal de Dados, o composer é substituído por um campo de notação dedicado (não um popover, já que é a única acção possível nesse canal).

#### B6. `ChatMessage.text` também recebe um resumo legível, não só `diceRoll` estruturado

Para `kind === "dice_roll"`, `ChatMessage.text` passa a conter um resumo legível (ex. `"🎲 1d20+5 → 18 (Teste de Percepção (Sabedoria))"`), a par do campo `diceRoll` estruturado — resolve `MessageRow.tsx:179` (citação), `NotificationsPanel.tsx:116` (notificação) e `searching.ts:74` (pesquisa) sem lhes tocar individualmente.

## Risks / Trade-offs

- [Um remetente pode narrar um resultado diferente numa mensagem normal cifrada de um canal de Texto] → Mitigação: aceite (Decisão B2) — problema social, não técnico; o número do servidor fica registado e visível.
- [Canais de Dados sem E2EE podem confundir quem espera que "todo canal tem cifra" seja absoluto] → Mitigação: a UI de criação (Decisão A4) nunca mostra um passo de chave para este tipo, tal como já não mostra para Texto hoje salvo a geração silenciosa — não há promessa de cifra a quebrar, porque nunca é feita nenhuma promessa visível para este tipo.
- [`valid_level`/ACL builder exigem localizar e estender o rótulo "leitura/escrita para texto, ouvir/falar para voz" em mais do que um sítio do frontend, sem referência exacta de ficheiro neste design] → Mitigação: `tasks.md` pede para localizar antes de implementar, não assume a localização.

## Migration Plan

Aditivo: novo valor de `kind`, sem migração de esquema; nova rota; frontend aditivo (`SECTIONS`, `Segmented`, `Icon`, `MessageRow`). Ponto de coordenação já conhecido: esta change e `frontend-icons-lucide-svg` têm cada uma um delta `MODIFIED` sobre o mesmo requisito em `openspec/specs/frontend-v2/visual-fidelity/spec.md` — aplicar/arquivar uma de cada vez, relendo a base actualizada entre elas.
