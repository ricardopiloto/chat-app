# Proposal

## Why

O backlog (`docs/backlog/backlog.md`, item 10) identificou dois casos de uso prioritários para uma camada de integração de bots de terceiros — um bot de música (equivalente ao bot que hoje alimenta o Kenku no Discord, para tocar áudio durante sessões de RPG) e um bot de conversa/comandos com conhecimento próprio (equivalente ao bot "Bertroldo" do autor) — e deferiu um terceiro (bot de transcrição) por depender do item 1 (Gravação/Egress).

A análise prévia (registada no mesmo item do backlog e detalhada em `docs/backlog/TR-item10-bots-chave-por-canal.md`) encontrou um bloqueador de segurança: hoje existe **uma única chave simétrica por Servidor** (`server_key`), partilhada por todos os canais (texto e voz) e por todos os membros. Instalar um bot em **um** canal significaria, tal como o modelo está hoje, dar-lhe acesso de decifragem a **todo** o Servidor — todos os canais de texto e de voz, para sempre. Isto também expôs um descompasso já existente independente dos bots: canais privados (specs 047/063) têm ACL de aplicação, mas nenhuma chave própria — qualquer membro do Servidor já detém criptograficamente a chave que decifraria um canal privado de outra pessoa.

A aplicação está hoje em testes localizados com um grupo pequeno de pessoas, sem dados de produção reais a preservar — o que permite migrar directamente para o modelo correcto (chave por canal, para todos os canais) em vez de uma migração incremental ou de um mecanismo de compatibilidade retroativa.

## What Changes

- **BREAKING**: o modelo de criptografia de mensagens e mídia muda de "uma `server_key` por Servidor" para "uma `channel_key` por Canal". `key_envelope` passa de PK `(server_id, account_id)` para `(channel_id, account_id)`. Dados de teste existentes são recriados com as novas chaves (sem caminho de migração retrocompatível).
- As rotas e eventos de handoff de chave (`/api/servers/{id}/key-envelopes`, WS `key_handoff.*`) passam a operar por `channel_id` em vez de `server_id`, reaproveitando o mesmo mecanismo de `crypto_box_seal` já existente.
- Quem recebe o envelope de um canal passa a ser determinado pela ACL de canal já existente (specs 047/063), em vez de "todo membro do Servidor".
- O cliente (`frontend/src/crypto/serverKey.ts`, `keyHandoff.ts`, `voice/callSession.tsx`) muda de um cache por Servidor para um cache por Canal, e o carregamento deixa de ser eager-para-todos-os-servidores no login.
- Introduz-se um novo tipo de conta — **conta de bot** — distinta de conta humana: sem password/`identity_vault`, autenticada por token próprio, com a sua própria `identity_pubkey` para participar do handoff de chave como qualquer membro.
- Instalar um bot num canal = conceder-lhe ACL nesse canal (reaproveita 047/063) + handoff da `channel_key` desse canal para a `identity_pubkey` do bot. Revogar = apagar a conta de bot (cascade já existente limpa ACL e envelopes).
- Dois casos de uso MVP: **bot de música** (processo externo que entra num canal de voz como participante LiveKit real e publica áudio cifrado com a `channel_key` desse canal) e **bot de conversa** (processo externo autenticado por token que lê/escreve mensagens de um canal de texto, decifrando/cifrando com a `channel_key` desse canal).
- **Fora de escopo explícito**: bot de transcrição/egress por participante, permissões por comando (slash-commands), um sistema de "intents" configurável, directório/marketplace de bots.

## Capabilities

### New Capabilities
- `crypto/channel-keys`: infra-estrutura de chave simétrica por canal (schema, handoff, API, uso em mensagens e mídia de voz), substituindo a chave única por Servidor.
- `bots/integration`: conta de bot (schema, autenticação, instalação/revogação escopada a canais) e os dois fluxos MVP (bot de música via LiveKit, bot de conversa via mensagens de canal).

### Modified Capabilities
- `frontend-v2/crypto-contracts`: o requisito actual assume os formatos persistidos de `docs/v2/contracts/crypto-formats.md` (cofre de identidade, **envelope de chave de servidor**, chave de canal de voz com custódia, cifra de mensagem/anexo) como compatíveis com a v1. O envelope de chave deixa de ser por Servidor e passa a ser por Canal — o contrato de formato muda e `docs/v2/contracts/crypto-formats.md` precisa de reflectir o novo formato de envelope.
- `frontend-v2/server-management`: a navegação de definições do Servidor (hoje "Servidor, Papéis, Pessoas, Zona crítica") ganha um novo item "Bots", e o catálogo de capacidades "Geral" dos cargos ganha "Gerenciar bots" — necessários para que exista algum caminho humano de criar/listar/revogar bots (ver `bots/integration`).

## Impact

- **Backend** (`backend/`): schema (`key_envelope` com nova PK; novo tipo/tabela de conta de bot; novas rotas de instalação/revogação de bot); rotas de key-envelopes migram de `/servers/{id}` para `/channels/{id}`; eventos WS `key_handoff.*` passam a carregar `channel_id`. A tabela `channel_key` já existente (migração `0006_channel_e2ee_key_delete.sql`, custódia de uma cópia da chave para religar E2EE após gravação) **não é afectada** e não deve ser confundida com o novo `key_envelope` por canal.
- **Frontend** (`frontend/src/crypto/`, `frontend/src/voice/callSession.tsx`): generalização de "chave por servidor" para "chave por canal"; `callSession.tsx` troca `channel.server_id` por `channel.id` no ponto de uso da frame key.
- **Dados de teste actuais**: recriados do zero ao aplicar esta mudança (contexto explícito do autor — sem dados de produção a preservar).
- **Processos externos de bot** (música, conversa): novos clientes do backend, autenticados por token de bot, fora do repositório `frontend/`/`backend/` desta app (equivalentes aos projectos de referência do autor `discord-bot/` e, para o padrão de participação em voz, `discord-transcription/`).
- **Sem impacto**: item 1 (Gravação/Egress), item 9 (Federação), item 11 (Importador Discord) — inalterados.
