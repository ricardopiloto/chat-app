# Proposal

## Why

O utilizador pediu para detalhar melhor a rolagem de dados antes de avançar para o desenvolvimento: no protótipo, os canais de um servidor têm uma terceira categoria na sidebar, "Ferramentas VTT" (`docs/v2/mesa_shell_da_aplica_o_chat_de_texto/code.html`, secção de navegação, junto a "Canais de Texto" e "Voz & Transmissão"), com uma entrada "Histórico de Dados" (`data-path="rolagem-de-dados"`, ícone `casino`) — ao lado de "Tabuleiro Tático" (`data-path="mesa-tesserae-vtt"`, fora de escopo, ver `docs/v2/AUDIT-fidelity.md`). Confirmado com o utilizador: "Histórico de Dados" é um **novo tipo de canal**, criado e gerido como qualquer outro canal — não uma tela agregadora à parte.

Isto estende a arquitectura de canais existente, hoje com exactamente dois tipos (`backend/src/domain/channel.rs:6-9`, `ChannelType::Text`/`ChannelType::VoiceVideo`), ambos enumerados explicitamente em vários requisitos já aceites: `openspec/specs/frontend-v2/channel-management/spec.md` ("Criar canal com visibilidade e custódia de voz", "Criação e permissões de canal fiéis aos mockups", "ACL de canal com construtor de regras e inspector de acesso", "Acesso por omissão e exclusividade dos canais"). Introduzir um terceiro tipo exige deltas nesses requisitos, não só nos dois já identificados em `text-messaging`/`visual-fidelity` (reversão da proibição de rolagem de dados).

Mantém-se tudo o que já tinha sido decidido sobre a rolagem em si (notação `NdM+K`, RNG do servidor, mensagem `kind='dice_roll'` reaproveitando a infra-estrutura não-E2EE já usada por `kind='system'`) — o que muda é **onde** isso vive: já não é só um botão no composer de qualquer canal de texto, é também um tipo de canal dedicado.

## What Changes

- Novo `ChannelType::Dice` (`backend/src/domain/channel.rs`), ao lado de `Text`/`VoiceVideo` — mesmo mecanismo (`as_str`/`parse`), sem migração de esquema (a coluna `kind` já é `TEXT` livre, sem `CHECK`). `valid_level` (`backend/src/api/channels.rs:140-149`) ganha `(ChannelType::Dice, PermLevel::Read | PermLevel::Write)` — os mesmos dois níveis do tipo Texto, sem nível novo.
- Canais do tipo `Dice` SHALL NOT aceitar mensagens de texto normais (`POST /channels/{id}/messages` passa a recusar nesse tipo) — só aceitam o novo endpoint de rolagem (`POST /channels/{id}/dice`, inalterado da proposta anterior). Canais de texto continuam a aceitar **ambos** — o botão "Lançar dados" no composer continua a funcionar em qualquer canal de texto, embutindo a rolagem na conversa, tal como o mockup do shell mostra.
- Canais `Dice` nunca têm E2EE (nunca geram/pedem uma chave de canal na criação) — toda mensagem que vivem neles é `kind='dice_roll'`, sempre em claro, pela mesma razão já decidida para a rolagem em si (RNG do servidor é incompatível com conteúdo que o servidor não pode ler).
- `frontend/src/shell/Sidebar.tsx`: nova entrada em `SECTIONS` (`kind: "dice"`, título "Ferramentas VTT", ícone `casino`) — só esta entrada; sem secção/entrada para "Tabuleiro Tático" (continua fora de escopo).
- `frontend/src/admin/CreateChannelDialog.tsx`: terceiro segmento no controlo Texto/Voz, "Dados" — sem o passo de custódia de chave (como Texto), e sem gerar chave de canal nenhuma (Decisão acima).
- Resto da proposta anterior inalterado: endpoint de rolagem, persistência como mensagem, renderização no `MessageRow`, botão no composer, destaque de 20/1 natural em `1d20`, resumo legível em `ChatMessage.text`.

## Capabilities

### Modified Capabilities
- `frontend-v2/channel-management`: segmentado de criação ganha um terceiro tipo (Dados), sem custódia; nível de acesso do construtor de ACL ganha "ler/rolar" para canais de Dados; acesso por omissão estende-se a canais de Dados; referência ao mockup do shell para a categoria "Ferramentas VTT" na sidebar.
- `frontend-v2/text-messaging`: remove a proibição de cartões de rolagem de dados (inalterado da proposta anterior); adiciona o requisito de rolagem de dados, agora cobrindo tanto canais de texto quanto o novo tipo Dados.
- `frontend-v2/visual-fidelity`: deixa de citar "rolagem de dados" como exemplo do que a v2 não implementa (inalterado da proposta anterior).

## Impact

- **Backend** (`backend/src/domain/channel.rs`, `backend/src/api/channels.rs`, `backend/src/api/messages.rs` — guarda contra `kind='dice'`, `backend/src/api/dice.rs` novo): sem migração de esquema.
- **Frontend** (`Sidebar.tsx`, `CreateChannelDialog.tsx`, `Composer.tsx`, `thread.ts`, `MessageRow.tsx`, novo endpoint em `frontend/src/api/endpoints/`).
- **Sem impacto**: canais de voz, painel "Mesa Rápida D20" do roster de chamada (continua fora de escopo), "Tabuleiro Tático", métricas de servidor.
