# Proposal

## Why

O utilizador pediu para detalhar melhor a rolagem de dados antes de avançar para o desenvolvimento: no protótipo, os canais de um servidor têm uma terceira categoria na sidebar, "Ferramentas VTT" (`docs/v2/mesa_shell_da_aplica_o_chat_de_texto/code.html`, secção de navegação, junto a "Canais de Texto" e "Voz & Transmissão"), com uma entrada "Histórico de Dados" (`data-path="rolagem-de-dados"`, ícone `casino`) — ao lado de "Tabuleiro Tático" (`data-path="mesa-tesserae-vtt"`, fora de escopo, ver `docs/v2/AUDIT-fidelity.md`). Confirmado com o utilizador: "Histórico de Dados" é um **novo tipo de canal**, criado e gerido como qualquer outro canal — não uma tela agregadora à parte.

Isto estende a arquitectura de canais existente, hoje com exactamente dois tipos (`backend/src/domain/channel.rs:6-9`, `ChannelType::Text`/`ChannelType::VoiceVideo`), ambos enumerados explicitamente em vários requisitos já aceites: `openspec/specs/frontend-v2/channel-management/spec.md` ("Criar canal com visibilidade e custódia de voz", "Criação e permissões de canal fiéis aos mockups", "ACL de canal com construtor de regras e inspector de acesso", "Acesso por omissão e exclusividade dos canais"). Introduzir um terceiro tipo exige deltas nesses requisitos, não só nos dois já identificados em `text-messaging`/`visual-fidelity` (reversão da proibição de rolagem de dados).

Mantém-se tudo o que já tinha sido decidido sobre a rolagem em si (notação `NdM+K`, RNG do servidor, mensagem `kind='dice_roll'` reaproveitando a infra-estrutura não-E2EE já usada por `kind='system'`) — o que muda é **onde** isso vive: já não é só um botão no composer de qualquer canal de texto, é também um tipo de canal dedicado.

Antes de avançar, o utilizador pediu também para detalhar a **apresentação** da rolagem no modelo do seu projecto SoloRPG: dados 3D caem sobre a tela num overlay full-screen (`DiceOverlay`), em vez de a rolagem aparecer apenas como cartão estático na conversa. O SoloRPG usa `@3d-dice/dice-box` (BabylonJS/Ammo); aqui a escolha é `@3d-dice/dice-box-threejs`, pela rolagem com resultado predeterminado. Este pivot não altera o RNG do servidor, a persistência como mensagem `dice_roll` nem os limites de notação: acrescenta somente uma apresentação ao vivo sobre o cartão normal.

Em canais de Texto, várias rolagens seguidas podem repetir o overlay em tela cheia enquanto outra conversa decorre. O gestor do canal precisa de poder desligar essa apresentação; em canais de Dados, rolar é a única actividade e não há conversa a interromper.

## What Changes

- Novo `ChannelType::Dice` (`backend/src/domain/channel.rs`), ao lado de `Text`/`VoiceVideo` — mesmo mecanismo (`as_str`/`parse`), sem migração de esquema (a coluna `kind` já é `TEXT` livre, sem `CHECK`). `valid_level` (`backend/src/api/channels.rs:140-149`) ganha `(ChannelType::Dice, PermLevel::Read | PermLevel::Write)` — os mesmos dois níveis do tipo Texto, sem nível novo.
- Canais do tipo `Dice` SHALL NOT aceitar mensagens de texto normais (`POST /channels/{id}/messages` passa a recusar nesse tipo) — só aceitam o novo endpoint de rolagem (`POST /channels/{id}/dice`, inalterado da proposta anterior). Canais de texto continuam a aceitar **ambos** — o botão "Lançar dados" no composer continua a abrir um **popover/modal** (mantido) com destaque visual (borda + sombra), notação, **modificador explícito** e rótulo opcional, embutindo a rolagem na conversa.
- Rolagens `d100` / percentil: cada dado de 100 faces anima-se sempre como **dois dados** (dezena + unidade) via `@3d-dice/dice-box-threejs` (`d100`+`d10`), com faces forçadas a partir do total decidido no servidor.
- Canais `Dice` nunca têm E2EE (nunca geram/pedem uma chave de canal na criação) — toda mensagem que vivem neles é `kind='dice_roll'`, sempre em claro, pela mesma razão já decidida para a rolagem em si (RNG do servidor é incompatível com conteúdo que o servidor não pode ler).
- `frontend/src/shell/Sidebar.tsx`: nova entrada em `SECTIONS` (`kind: "dice"`, título "Ferramentas VTT", ícone `casino`) — só esta entrada; sem secção/entrada para "Tabuleiro Tático" (continua fora de escopo).
- `frontend/src/admin/CreateChannelDialog.tsx`: terceiro segmento no controlo Texto/Voz, "Dados" — sem o passo de custódia de chave (como Texto), e sem gerar chave de canal nenhuma (Decisão acima).
- Resto da proposta anterior inalterado: endpoint de rolagem, persistência como mensagem, renderização no `MessageRow`, destaque de 20/1 natural em `1d20`, resumo legível em `ChatMessage.text`. O composer de canal de Dados e o popover de Texto partilham controlo explícito de modificador (`+1`, `-3`, …).
- Novo overlay 3D no frontend para canais de Texto e Dados: o `message.new` já existente dispara a animação quando `kind === 'dice_roll'` e o canal está aberto, para todos os membros que o estão a ver nesse momento; em Texto, depende também de `dice_animations_enabled`; em Dados, aparece sempre. Nenhum evento realtime novo é necessário.
- `@3d-dice/dice-box-threejs` usa *predetermined outcomes* para forçar cada dado a pousar no valor individual já decidido e persistido pelo servidor, mantendo a animação física local sem dar autoridade ao cliente.
- Histórico, paginação e retorno posterior ao canal mostram só o cartão estático; sem WebGL ou com `prefers-reduced-motion`, o overlay não aparece e o cartão é mostrado directamente.
- Nova dependência npm e script de cópia de assets estáticos para `frontend/public/` (padrão `prepare:dice` do SoloRPG). A apresentação 3D das rondas anteriores era aditiva no frontend; o interruptor desta ronda acrescenta uma coluna e um campo de API.
- Novo `dice_animations_enabled` booleano por canal, desligado por padrão para canais novos e existentes mediante migração aditiva `INTEGER NOT NULL DEFAULT 0`. Só canais de Texto usam o valor; canais de Dados mostram sempre a animação. Quem já gere o canal edita o interruptor no mesmo painel de `visible_to_new_members`, através de `patch_channel` e do seu gate `require_channel_manager`, sem permissão nova. A alteração difunde o `channel_acl.changed` existente, sem evento realtime novo.

## Capabilities

### Modified Capabilities
- `frontend-v2/channel-management`: segmentado de criação ganha um terceiro tipo (Dados), sem custódia; nível de acesso do construtor de ACL ganha "ler/rolar" para canais de Dados; acesso por omissão estende-se a canais de Dados; referência ao mockup do shell para a categoria "Ferramentas VTT" na sidebar; novo interruptor de animação por canal de Texto nas definições.
- `frontend-v2/text-messaging`: remove a proibição de cartões de rolagem de dados (inalterado da proposta anterior); adiciona o requisito de rolagem de dados em Texto e Dados, com apresentação 3D ao vivo condicional ao novo campo em Texto e sempre activa em Dados.
- `frontend-v2/visual-fidelity`: deixa de citar "rolagem de dados" como exemplo do que a v2 não implementa (inalterado da proposta anterior).

## Impact

- **Backend** (`backend/src/domain/channel.rs`, `backend/src/api/channels.rs`, `backend/src/api/messages.rs` — guarda contra `kind='dice'`, `backend/src/api/dice.rs` novo, `backend/src/db/channel.rs`): as rondas anteriores não exigiam migração; esta acrescenta `backend/migrations/NNNN_channel_dice_animations.sql`, uma coluna `INTEGER NOT NULL DEFAULT 0` em `channel`, o campo em `Channel` e `PatchChannelBody` e a sua persistência.
- **Frontend** (`Sidebar.tsx`, `CreateChannelDialog.tsx`, `Content.tsx`, `ChannelPage.tsx`, `Composer.tsx`, `thread.ts`, `MessageRow.tsx`, novo endpoint em `frontend/src/api/endpoints/`): nova dependência `@3d-dice/dice-box-threejs`, componente de overlay full-screen, módulo singleton `diceBoxHost` e script de cópia dos assets para `frontend/public/`.
- **Sem impacto**: canais de voz, painel "Mesa Rápida D20" do roster de chamada (continua fora de escopo), "Tabuleiro Tático", métricas de servidor e autoridade do RNG.
