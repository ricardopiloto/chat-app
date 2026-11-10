# Design

## Context

Ver `proposal.md` — Why. Pontos de código que ancoram este design:

- `backend/src/domain/channel.rs:6-9`: `ChannelType` hoje só tem `Text`/`VoiceVideo`, com `as_str()`/`parse()` triviais de estender.
- `backend/src/api/channels.rs:140-149` (`valid_level`): mapeia tipo de canal → níveis de permissão válidos (`Text` → `Read|Write`; `VoiceVideo` → `Listen|Speak`).
- `backend/src/api/channels.rs:~415` (`last_channel_of_type`): já genérico por `kind_label`, não enumera tipos — não precisa de mudança para um terceiro tipo.
- `backend/migrations/0001_init.sql:66`: a coluna `type` de `channel` tem `CHECK (type IN ('text', 'voice_video'))`; aceitar `dice` exige reconstruir a tabela.
- `frontend/src/shell/Sidebar.tsx:13-16` (`SECTIONS`): array `{kind, title, add, glyph}` já é o ponto de extensão exacto para uma secção nova na sidebar.
- `frontend/src/admin/CreateChannelDialog.tsx:12-26`: `kind` como `Segmented` entre `"text"`/`"voice_video"`; `voice()` só controla o passo de custódia de chave, não a geração da chave em si (gerada sempre, linha 23 `generateChannelKey()`).
- `docs/v2/mesa_shell_da_aplica_o_chat_de_texto/code.html`: secção "Ferramentas VTT" com "Tabuleiro Tático" (`grid_view`, fora de escopo) e "Histórico de Dados" (`casino`, `data-path="rolagem-de-dados"`).
- Restante contexto (mecânica da rolagem) inalterado da versão anterior deste documento: `backend/src/domain/message.rs`, `backend/src/db/message.rs` (`create_system` como precedente de `kind` não-E2EE), `backend/src/api/messages.rs` (`require_write_text`, `send_to_channel_viewers`), `rand::thread_rng()` já em uso, `frontend/src/chat/thread.ts` (`toChatMessage`).
- No SoloRPG do utilizador, `@3d-dice/dice-box` (BabylonJS/Ammo) alimenta um overlay full-screen `DiceOverlay.tsx` através de um host singleton `diceBoxHost.ts` (`ensureDiceBox`/`preloadDiceBox`/`safeClear`); o mesmo padrão de ciclo de vida serve aqui, com outra biblioteca.
- `@3d-dice/dice-box-threejs` (Three.js/cannon-es) documenta *predetermined outcomes* em `Box.roll("NdM@v1,v2,...")`: cada valor individual já persistido pelo servidor é forçado como face final, enquanto a física anima localmente. Esta API reconcilia a Decisão B2 com dados 3D reais.
- `frontend/src/shell/Content.tsx` monta `frontend/src/chat/ChannelPage.tsx`; `createThread` em `frontend/src/chat/thread.ts` recebe `message.new` no handler `onEvent`, separadamente de `open`/`refresh`/`loadOlder` (buscas de histórico). Os assets estáticos do Vite vivem em `frontend/public/`.

- `Channel.visible_to_new_members` em `backend/src/domain/channel.rs` e `backend/migrations/0012_server_channel_permissions.sql:3` dão o precedente de booleano por canal em SQLite (`INTEGER NOT NULL DEFAULT 1`); o novo campo usa `DEFAULT 0`. `backend/src/db/channel.rs` centraliza `Row`, `map_row`, `SELECT_COLS`, `create`, `find_by_id` e `list_by_server`.
- `PatchChannelBody` e `patch_channel` em `backend/src/api/channels.rs` já usam `require_channel_manager` no topo; a alteração de visibilidade difunde `channel_acl.changed`. O handler em `frontend/src/shell/state.tsx` invalida `queryKeys.channels(about)` nesse evento.
- `frontend/src/admin/channel/AccessPanel.tsx` já edita `visible_to_new_members` e dispõe de `text()` (`props.channel.type === "text"`). `frontend/src/api/types.ts` define `Channel`; `frontend/src/api/endpoints/channels.ts` tipa o body opcional de `channels.update`.

## Goals / Non-Goals

**Goals:**
- "Histórico de Dados" existe como um canal de um novo tipo (`Dice`), criado/gerido/apagado como qualquer canal — ACL, posição na sidebar, protecção de "último canal do tipo".
- Rolar dados funciona em canais de Dados **e** em canais de Texto (o botão do composer continua a embutir rolagens na conversa normal).
- Canais de Dados nunca têm E2EE — coerente com a rolagem em si nunca poder ser E2EE (Decisão B2).
- Todos os membros com o canal de Dados aberto, ou de Texto com o interruptor ligado, vêem a animação 3D ao vivo, com cada dado a pousar no valor já decidido pelo servidor.
- Dar a quem já administra um canal de Texto um interruptor por canal para a animação, desligado por padrão.

**Non-Goals:**
- "Tabuleiro Tático" (`mesa-tesserae-vtt` no mockup) — continua inteiramente fora de escopo, sem nenhuma entrada/placeholder na sidebar.
- Painel "Mesa Rápida D20" do roster de chamada de voz — ambiguidade de canal-alvo já descartada antes, inalterada.
- Limite de um só canal de Dados por servidor — tratado como qualquer outro tipo de canal (pode haver vários, tal como vários canais de texto), a não ser que o utilizador peça o contrário mais tarde.
- Migrar/mover mensagens de rolagem já existentes de canais de Texto para um canal de Dados — não pedido.
- Reproduzir a animação de mensagens carregadas por histórico, paginação, busca ou retorno ao canal.
- Sincronizar a trajectória física entre clientes: cada cliente simula localmente; só os valores finais individuais são forçados.
- Permissão granular por cargo ou membro para controlar a animação: aplica-se apenas a permissão existente de gerir o canal.
- Efeito do interruptor em canais de Dados (sempre animados, sem ler o campo) ou Voz (sem rolagem).

## Decisions

### A. Arquitectura do novo tipo de canal

#### A1. `ChannelType::Dice` como terceiro tipo de primeira classe, não um "modo" de canal de texto

Em vez de um `boolean`/flag num canal de Texto (ex. `is_dice_log: bool`), um tipo novo no mesmo enum — porque a sidebar, a criação, a ACL e a protecção de "último canal do tipo" já são todas orientadas por `ChannelType`/`kind`, e um canal de Dados precisa exactamente dessas quatro coisas (aparecer na secção certa, ser criável, ter as suas próprias regras de acesso, não poder ser apagado se for o único). Um "modo" dentro de Texto exigiria ramificar cada um desses quatro sítios por uma condição extra, em vez de reaproveitar o despacho por tipo que já existe.

#### A1-bis. Corrigir a restrição de tipo na base de dados

A coluna real é `channel.type`, com `CHECK (type IN ('text', 'voice_video'))` desde `0001_init.sql`. Uma migração após `0030` reconstrói `channel` com todas as colunas actuais, incluindo `dice_animations_enabled`, copia os dados, renomeia a tabela e recria os índices existentes. O novo `CHECK (type IN ('text', 'voice_video', 'dice'))` mantém a validação estrita.

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

`NdM+K`: `count` 1-20, `sides` 2-1000, `modificador` -100..100. `400` fora destes limites. `rand::thread_rng()` (já em uso no backend). O modificador pode vir na própria notação (`1d20+5`) ou ser composto pela UI a partir de um controlo explícito (Decisão B5).

#### B4. Rótulo de desfecho só para `1d20`, sem motor de regras

Natural 20 → "Crítico"; natural 1 → "Falha Crítica"; qualquer outro valor, ou outra notação, sem etiqueta.

#### B5. Composer: popover no Texto e composer dedicado em Dados, com modificador explícito

Botão "Lançar dados" (ícone `casino`) no composer de canais de Texto abre um **popover/modal** (mantido — não se remove). O painel segue o padrão dos pickers existentes **e** destaca-se com **borda** e **sombra** visíveis (tokens do design system, ex. `border-outline-variant` + `shadow-floating` / equivalente já usado em superfícies flutuantes). Campos: notação, **modificador explícito** (`+1`, `-3`, …, nos limites de B3) e rótulo opcional; o cliente compõe `NdM+K` antes do `POST`.

Dentro de um canal de Dados, o composer normal é substituído por um formulário dedicado (não um popover), com os mesmos três controlos (notação, modificador, rótulo) — sem anexar/emoji/menção.

#### B6. `ChatMessage.text` também recebe um resumo legível, não só `diceRoll` estruturado

Para `kind === "dice_roll"`, `ChatMessage.text` passa a conter um resumo legível (ex. `"🎲 1d20+5 → 18 (Teste de Percepção (Sabedoria))"`), a par do campo `diceRoll` estruturado — resolve `MessageRow.tsx:179` (citação), `NotificationsPanel.tsx:116` (notificação) e `searching.ts:74` (pesquisa) sem lhes tocar individualmente.

#### B7. Percentil `d100`: duas faces (dezena + unidade)

Para cada dado com `sides === 100` (caso típico `1d100`, e `Nd100` = N pares), o servidor gera um total 1–100 e deriva **duas faces de animação**: dezena (`d100` / `00,10,…,90`) e unidade (`d10` / `0–9`), com `00`+`0` = 100. O payload persiste o total (e o detalhe necessário às faces) sem dar autoridade ao cliente. A biblioteca `@3d-dice/dice-box-threejs` expõe tipos distintos `d100` (dezenas) e `d10` (unidades) e **não** cria automaticamente o segundo dado ao receber só `1d100` — o overlay SHALL chamar `Box.roll("1d100+1d10@T,U")` (ou N pares) com faces forçadas.

### C. Apresentação 3D da rolagem

#### C1. Biblioteca com resultados predeterminados

Adoptar `@3d-dice/dice-box-threejs` (Three.js/cannon-es), cuja API `Box.roll("NdM@v1,v2,...")` (e combinações como `1d100+1d10@T,U` na Decisão B7) força a face final de cada dado durante a animação física. O `@3d-dice/dice-box` (BabylonJS/Ammo) usado no SoloRPG não documenta este controlo indispensável: o servidor já decidiu e persistiu os resultados (B2). Construir a expressão forçada a partir de `count`, `sides` e faces validadas da mensagem; o modificador afecta só o total, não as faces.

#### C2. Overlay no canal aberto e host singleton

Montar `DiceOverlay` em `ChannelPage.tsx`, que `Content.tsx` usa para canais de Texto e Dados. Um módulo `diceBoxHost` gere uma só instância da biblioteca com `ensureDiceBox`/`preloadDiceBox`/`safeClear`, à maneira do SoloRPG. Enfileirar rolagens rápidas por canal para que o overlay apresente uma de cada vez; limpar a instância ao sair do canal. Após uma breve permanência do resultado (ex. ~1,8 s), esvair o overlay e deixar o cartão normal visível.

#### C3. Disparo exclusivamente por `message.new`

No `onEvent` de `createThread` (`thread.ts`), quando chega `message.new` de `kind === 'dice_roll'` para o canal montado, entregar notação, valores por dado e total ao overlay, além de publicar a mensagem normal. Reutilizar o evento existente, sem rota, payload ou evento de backend adicional. `open`, `refresh`, `loadOlder` e buscas dirigidas apenas publicam cartões. Antes de montar `DiceOverlay`, consultar também o tipo e o valor actual de `dice_animations_enabled` do canal (Decisão D3); se não for elegível, publicar só o cartão estático (Decisão C5).

#### C4. Só espectadores presentes no canal

Um membro só recebe a animação se tiver esse canal aberto/montado quando o evento chega; quem estiver noutro canal ou abrir o canal depois vê apenas o cartão estático, sem recuperação de animações perdidas. A física não é sincronizada entre clientes; cada cliente força as mesmas faces finais persistidas.

#### C5. Fallback sem WebGL ou com movimento reduzido

Se WebGL estiver indisponível ou `prefers-reduced-motion` activo, não montar o overlay; mostrar directamente o cartão estático, no padrão `diceUnavailable` do SoloRPG. Falha de inicialização da biblioteca também termina no cartão já publicado.

#### C6. Assets locais

Adicionar um script `prepare:dice` que copia os assets necessários da dependência para `frontend/public/`, servido pelo próprio frontend sem CDN externo. Carregar o código da biblioteca sob demanda quando se abre um canal de Dados ou de Texto com animação ligada; manter os assets fora do caminho inicial da aplicação.

#### C7. Dado genérico para lados sem geometria 3D

A biblioteca dispõe de geometria para `d2`, `d4`, `d6`, `d8`, `d10`, `d12`, `d20` e o tipo `d100` (dezenas sobre malha `d10`). Lados nativos `{2,4,6,8,10,12,20}` passam a `Box.roll` como `NdM@…`. Lados `100` seguem a Decisão B7 (`1d100+1d10@T,U` por dado percentil), nunca um único `1d100@N`. Para outros lados permitidos pelo servidor (2–1000 fora deste conjunto), o overlay desenha um dado genérico separado, com o resultado escrito na face visível, sem enviar esse dado a `Box.roll`. Rolagens mistas mostram ambos no mesmo overlay.

### D. Controlo de spam: interruptor por canal

#### D1. Esquema aditivo e omissão desligada

Adicionar `channel.dice_animations_enabled` com migração SQLite `INTEGER NOT NULL DEFAULT 0`. `Channel`, `Row`, `map_row`, `SELECT_COLS` e `create` expõem/persistem o valor. Canais existentes e novos começam desligados; nenhum gestor precisa de migrar dados manualmente. Os tipos e campos das decisões anteriores permanecem intactos.

#### D2. API e autorização existente

`PatchChannelBody` recebe `dice_animations_enabled: Option<bool>`. `patch_channel` valida e persiste o campo por uma função de `db::channel`, sob o `require_channel_manager` já chamado no topo. Não há *capability* nem permissão nova por cargo/membro. Um pedido que inclua o campo para canal que não seja Texto recebe `400` claro; a guarda evita uma configuração sem efeito e segue a validação explícita já usada para visibilidade privada.

#### D3. Âmbito da apresentação

Só Texto lê `dice_animations_enabled` antes do overlay: `true` mostra, `false` publica directamente o cartão estático. Dados ignora o campo e mostra sempre a animação (A2/B5: rolar é a única actividade, sem conversa a interromper); Voz não tem rolagem. O campo desligado é o comportamento de canais de Texto novos e existentes até um gestor o ligar.

#### D4. Painel existente

Mostrar o interruptor em `AccessPanel.tsx`, junto de `visible_to_new_members`, somente quando `text()`. Inicializar com o valor actual do canal e enviar no mesmo `channels.update` do painel; não criar aba ou painel novo.

#### D5. Realtime existente

Quando o campo mudar, `patch_channel` difunde `channel_acl.changed`, como já faz para visibilidade. `state.tsx` invalida a query de canais, sem evento novo. C3 continua a usar `message.new` para iniciar a apresentação, mas consulta o campo actualizado do canal antes de montar `DiceOverlay`.

## Risks / Trade-offs

- [Um remetente pode narrar um resultado diferente numa mensagem normal cifrada de um canal de Texto] → Mitigação: aceite (Decisão B2) — problema social, não técnico; o número do servidor fica registado e visível.
- [Canais de Dados sem E2EE podem confundir quem espera que "todo canal tem cifra" seja absoluto] → Mitigação: a UI de criação (Decisão A4) nunca mostra um passo de chave para este tipo, tal como já não mostra para Texto hoje salvo a geração silenciosa — não há promessa de cifra a quebrar, porque nunca é feita nenhuma promessa visível para este tipo.
- [`valid_level`/ACL builder exigem localizar e estender o rótulo "leitura/escrita para texto, ouvir/falar para voz" em mais do que um sítio do frontend, sem referência exacta de ficheiro neste design] → Mitigação: `tasks.md` pede para localizar antes de implementar, não assume a localização.
- [Dispositivos fracos/mobile podem sofrer com várias rolagens simultâneas no mesmo canal] → Mitigação: uma instância de overlay por canal, rolagens serializadas/enfileiradas; carregar a biblioteca só quando um canal de Texto ou Dados é aberto.
- [Assets 3D aumentam o peso dos ficheiros estáticos do frontend] → Mitigação: cópia apenas dos assets necessários para `frontend/public/` e carregamento sob demanda, sem CDN.

- [A apresentação 3D fica invisível por omissão em canais de Texto existentes e exige descoberta activa por um gestor] → Mitigação: comportamento aceite e pedido, para evitar spam por omissão.

## Migration Plan

A migração `0030` acrescenta a coluna booleana `dice_animations_enabled` com `INTEGER NOT NULL DEFAULT 0`. Uma migração seguinte reconstrói `channel` para ampliar o `CHECK` de `type` a `dice`, preservando colunas, dados e índices; frontend aditivo (`SECTIONS`, `Segmented`, `Icon`, `MessageRow`). Ponto de coordenação já conhecido: esta change e `frontend-icons-lucide-svg` têm cada uma um delta `MODIFIED` sobre o mesmo requisito em `openspec/specs/frontend-v2/visual-fidelity/spec.md` — aplicar/arquivar uma de cada vez, relendo a base actualizada entre elas.

A apresentação 3D das rondas anteriores acrescentava dependência, host/overlay e script de assets ao frontend. O interruptor desta ronda acrescenta apenas a coluna, o campo de API e a UI descritos em D1-D5.
