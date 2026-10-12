# Tasks

## 1. Backend: novo tipo de canal

- [ ] 1.1 Em `backend/src/domain/channel.rs`, adicionar `ChannelType::Dice` (`as_str() => "dice"`, `parse("dice") => Some(Self::Dice)`), ao lado de `Text`/`VoiceVideo`. Verificar: `cargo build` passa; nenhum `match` existente em `ChannelType` fica incompleto (o compilador aponta qualquer `match` não exaustivo).
- [ ] 1.2 Estender todos os sítios reais que despacham por `ChannelType` com um terceiro braço para `Dice` (Decisão A3 de `design.md`, achado das revisões): `backend/src/api/channels.rs:140-149` (`valid_level`); `backend/src/domain/permissions.rs` — `maximum_level` (70-75, `=> PermLevel::Write`), `view_level` (77-82, `=> PermLevel::Read`), `level_compatible` (84-93, `(ChannelType::Dice, PermLevel::Read | PermLevel::Write)`), e o bloco de acesso por omissão (288-339, usar `caps.can_send_messages` para decidir `Write`/`Read` por omissão, mesma *capability* do Texto). Verificar: `cargo build` não falha por `match` não exaustivo (o compilador aponta qualquer sítio esquecido); um teste de integração confirma que uma regra de ACL com nível `Read`/`Write` é aceite para um canal `Dice` e recusada para `Listen`/`Speak`; um membro sem regra explícita e com `can_send_messages=true` recebe `Write` por omissão num canal de Dados.
- [ ] 1.3 Confirmar (teste de integração) que `last_channel_of_type` (`channels.rs:~415`) já funciona correctamente para `ChannelType::Dice` sem nenhuma mudança de código — só adicionar o caso ao teste existente de protecção do último canal.
- [ ] 1.4 Em `backend/src/api/messages.rs` (`post_message`), adicionar a guarda: se `channel.kind == ChannelType::Dice`, recusar com `400` (código `dice_channel_text_not_allowed`) antes de processar o corpo do pedido. Verificar: `POST /channels/{id}/messages` num canal Dice devolve `400`; continua a funcionar normalmente num canal de Texto.
- [ ] 1.5 Localizar o construtor de regras de ACL no frontend (painel de definições de canal, onde já escolhe o nível apropriado ao tipo de canal) e estender as opções de nível para canais do tipo Dados (Decisão A3 de `design.md`) — sem localização prévia confirmada nesta spec, confirmar o ficheiro real antes de editar.

## 2. Backend: rolagem e persistência (inalterado da ronda anterior)

- [ ] 2.1 Em `backend/src/db/message.rs`, adicionar `create_dice_roll(pool, id, channel_id, sender_account_id, payload_json, created_at)` — análogo a `create_system` mas com `kind='dice_roll'` e **sem** anular o remetente real. Verificar: teste de integração confirma `sender_account_id` igual ao chamador e `kind='dice_roll'`.
- [ ] 2.2 Criar `backend/src/api/dice.rs` com `pub async fn roll(...)`: valida a notação (`count` 1-20, `sides` 2-1000, `modificador` -100..100), usa `require_write_text` + a mesma verificação de silenciamento de `post_message`, gera os dados com `rand::thread_rng()`, calcula o `total`, decide a etiqueta de `1d20` natural, persiste via `create_dice_roll`, difunde com `send_to_channel_viewers(&state, &channel, "message.new", &created)`. Funciona para `ChannelType::Text` **e** `ChannelType::Dice` (ambos passam `require_write_text`/`can_write_text` com a Tarefa 1.2 aplicada). Verificar: notação válida devolve `201` em ambos os tipos de canal; fora dos limites devolve `400`; silenciado devolve `403`.
- [ ] 2.3 Registar a rota `POST /channels/{channel_id}/dice` em `backend/src/api/mod.rs`. Verificar: `cargo test` continua a passar.
- [ ] 2.4 Teste de contrato/integração cobrindo os cenários do spec delta de `text-messaging`: notação simples num canal de texto, notação num canal de Dados, natural 20/1 destacado, notação inválida recusada, sem permissão recusado, canal de Dados recusa mensagem de texto normal.

## 3. Frontend: novo tipo de canal na UI

- [ ] 3.1 Em `frontend/src/shell/Sidebar.tsx:13-16` (`SECTIONS`), adicionar `{ kind: "dice", title: "shell.vttTools", add: "admin.channel.addDice", glyph: "casino" }`. Adicionar as chaves i18n `shell.vttTools`/`admin.channel.addDice` (pt-BR "Ferramentas VTT"/"Adicionar canal de dados", en equivalente). Verificar visualmente contra `docs/v2/mesa_shell_da_aplica_o_chat_de_texto/screen.png`, secção "Ferramentas VTT".
- [ ] 3.2 Em `frontend/src/admin/CreateChannelDialog.tsx`, terceiro segmento "Dados" no `Segmented` de tipo; para `kind() === "dice"`, saltar a geração/custódia de chave de canal inteiramente (Decisão A4 de `design.md` — nenhuma chamada a `generateChannelKey`/`sealChannelKeyForSelf` para este tipo). Verificar manualmente: criar um canal de Dados não mostra nenhum passo de chave, e o canal criado aparece na secção "Ferramentas VTT".
- [ ] 3.3 Confirmar que apagar o único canal de Dados restante dá o mesmo erro `409 last_channel_of_type` já existente para texto/voz, com a mensagem a identificar o tipo correctamente.
- [ ] 3.4 Em `frontend/src/shell/Content.tsx:43-63`, trocar o `<Show when={channel.type === "text"} fallback={<VoicePage/>}>` por um `<Switch>`/`<Match>` com três ramos (`"text"`, `"voice_video"`, `"dice"`) — Decisão A6 de `design.md`, achado de `review-fullstack.md`. Verificar: abrir um canal de Dados mostra a página de canal (não `VoicePage`); abrir um canal de Texto ou Voz continua exactamente como antes.

## 4. Frontend: endpoint, modelo de mensagem e composer (inalterado da ronda anterior)

- [ ] 4.1 Novo wrapper em `frontend/src/api/endpoints/` (ex. `dice.ts`) para `POST /api/channels/{id}/dice`.
- [ ] 4.2 Em `frontend/src/chat/thread.ts` (`toChatMessage`), interpretar `raw.content_plaintext` como JSON de rolagem quando `raw.kind === "dice_roll"`, expondo `diceRoll?: {...}` em `ChatMessage` **e** preenchendo `text` com um resumo legível (Decisão B6 de `design.md`). Verificar: `MessageRow.tsx:179`, `NotificationsPanel.tsx:116` e `searching.ts:74` mostram o resumo, não o JSON em bruto.
- [ ] 4.3 Em `Composer.tsx` (canais de Texto): botão "Lançar dados" com popover de notação + rótulo opcional, mesmo padrão dos pickers existentes.
- [ ] 4.4 Num canal do tipo Dados: o composer normal é substituído por um campo de notação dedicado (Decisão B5 de `design.md`) — sem botão de anexar/emoji/menção, já que nenhuma mensagem de texto é possível nesse canal (Tarefa 1.4).
- [ ] 4.5 Em `MessageRow.tsx`, novo ramo de renderização para `message.diceRoll` (bloco com notação, resultado, detalhe por dado + modificador, destaque natural 20/1) em vez do texto simples — mantém avatar/nome/reacções.

## 5. Não-regressão

- [ ] 5.1 Confirmar que canais de Texto e Voz continuam a funcionar exactamente como antes (criação, ACL, apagar, custódia de voz) — nenhuma lógica existente foi alterada, só estendida com um terceiro `match` arm em cada sítio.
- [ ] 5.2 Confirmar que `openspec validate` não acusa contradição entre os três deltas desta change (`text-messaging`, `channel-management`, `visual-fidelity`) e os requisitos já existentes.
- [ ] 5.3 Lembrar, ao aplicar esta change, o ponto de coordenação com `frontend-icons-lucide-svg` sobre `visual-fidelity/spec.md` (ver `design.md` Migration Plan).
