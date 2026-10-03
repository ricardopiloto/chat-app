# Proposal

## Why

Três problemas surgiram no uso da v2:

1. **Não há maneira de avisar todo o canal.** Uma pessoa que quer chamar a atenção de todos tem de mencionar membro a membro (o servidor aceita no máximo 20 menções por mensagem), e nada impede que isso se transforme em abuso se for aberto a todos. Falta uma permissão própria para `@todos`.
2. **Desligar a câmara não a desliga de verdade.** Escolhendo "Câmera desligada", algum componente do pipeline de vídeo continua a manter a câmara ativa.
3. **Um convidado não consegue entrar numa chamada a falar.** A pré-entrada diz que ele não tem permissão de ligar câmara e microfone e só oferece "Entrar (ouvir)". Mas a regra do produto é outra: por omissão todos veem e escrevem em qualquer canal de texto e todos entram e participam em qualquer canal de voz, a não ser que quem criou o canal (ou alguém com permissão) o torne exclusivo de cargos ou membros específicos. O backend já cumpre essa regra; o erro está no cliente.

## What Changes

- **Nova permissão "Mencionar @todos"** na gestão de cargos, no grupo Texto. Quem a tem pode escrever `@todos` num canal de texto; a mensagem gera uma notificação para todos os membros que veem esse canal (exceto quem escreveu). O dono tem-na sempre; por omissão nenhum outro cargo a tem. Quem não a tem escreve `@todos` como texto simples, sem notificação e sem erro.
- **`@todos` no chat**: aparece no autocompletar só para quem pode, é destacado na mensagem como as outras menções e aparece nas notificações como menção.
- **Câmara**: desligar a câmara (na pré-entrada, na chamada e na página de Áudio & Vídeo) liberta a câmara física e todo o processamento de vídeo associado (incluindo o desfoque), e deixa de enviar vídeo. Voltar a ligar retoma o desfoque escolhido.
- **Acesso por omissão em canais**, agora registado como requisito: quem é membro, sem nenhum cargo atribuído, vê e escreve nos canais de texto e entra, fala e liga a câmara nos de voz. Só mudam se o canal for privado ou tiver regras, ou se o cargo da pessoa retirar a permissão. A pré-entrada deixa de decidir "só ouvir" por a pessoa não ter cargo e passa a usar só o nível de acesso que o servidor calculou para ela nesse canal.
- **Backend (aditivo)**: nova capacidade `can_mention_everyone` nos cargos e nova marca `mentions_everyone` na mensagem, com migração, contrato e testes.
- **Fora de escopo**: `@here` (só os online), `@cargo`, limite de frequência de `@todos`, e mudar o limite de 20 menções individuais.

## Capabilities

### New Capabilities
- `frontend-v2/mention-everyone`: a permissão de mencionar `@todos`, o que acontece ao enviar e ao receber, e o autocompletar.

### Modified Capabilities
- `frontend-v2/server-management`: o requisito "Cargos com permissões agrupadas" passa a incluir a permissão de mencionar `@todos` no grupo Texto.
- `frontend-v2/voice-session`: a pré-entrada decide "só ouvir" pelo acesso efetivo ao canal (não pela falta de cargo), e desligar a câmara liberta a câmara.
- `frontend-v2/channel-management`: acesso por omissão e exclusividade de canais passa a ser requisito (hoje só está implícito na ACL).

## Impact

- **Frontend** (`frontend/src`): `voice/GreenRoom.tsx` (regra de "só ouvir"), `voice/callSession.tsx` e `voice/preview.ts` (parar o processador de desfoque ao desligar a câmara), `admin/settings/Roles.tsx` e catálogos `mgmt.*` (nova permissão), `chat/Composer.tsx`, `chat/logic/mentions.ts`, `chat/logic/autocomplete.ts`, `chat/MessageRow.tsx` e catálogos `chat.*` (`@todos`), `api/types.ts`.
- **Backend** (`backend/`): migração nova (coluna da capacidade e da marca na mensagem), `domain/server_role.rs`, `db/server_role.rs`, `api/roles.rs`, `api/messages.rs`, `domain/message.rs`, `db/message.rs`. Segue `docs/v2/contracts/backend-change-policy.md`: aditivo, com contrato e testes.
- **Documentação**: `docs/v2/contracts/backend-change-policy.md` (registo), `specs/002-fase-1-mvp/contracts/rest-api.yaml`, `docs/v2/parity-checklist.md` (secção 13).
- **Dependências novas**: nenhuma.
