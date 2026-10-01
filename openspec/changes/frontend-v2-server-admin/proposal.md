# Proposal

## Why

Com o shell de navegação e a autenticação prontos (`frontend-v2-auth-shell`), a sidebar já consegue listar servidores e canais — mas ainda não existe forma de os criar, geri-los, convidar pessoas, ou controlar quem vê/fala em cada canal. Esta é a **Fase 2 de 6** da reescrita faseada (`docs/v2/TR-frontend-v2.md`): cobre toda a administração de servidor e canal, que é pré-requisito para qualquer servidor de teste ter conteúdo antes das Fases 3 (chat) e 4 (voz/vídeo) terem algo para mostrar.

## What Changes

- Criar servidor (nome + custódia de chave, bootstrap com canal de texto `geral` + canal de voz por omissão) e criar canal (nome, visibilidade pública/privada, custódia de chave para voz).
- Definições de servidor: Membros (pesquisa, cargo por membro, remover), Cargos e Permissões (criar/reordenar/apagar cargo, toggles de permissão agrupados Geral/Texto/Voz), Imagem do servidor, Mensagem de boas-vindas, Apagar servidor.
- Gestão de canal: renomear (inline), apagar (com tratamento do erro 409 "último canal do tipo"), painel de ACL/permissões (visibilidade, construtor de regras, lista de regras, inspector de acesso efectivo), silenciar membro num canal (com dessilenciar).
- Convites: criar (fluxo de 2 passos — escolher canal de boas-vindas, depois mostrar URL) e aceitar (ecrã de onboarding de convidado, não autenticado, com registo inline).
- **Fora desta fase**: conteúdo de mensagens de texto (Fase 3), conteúdo de chamadas de voz/vídeo (Fase 4). O painel de membros em si (leitura, não gestão) já existe estruturalmente desde a Fase 1 como afordance; esta fase preenche as acções de gestão que partem dele (silenciar, remover).
- **Fora de escopo em todas as fases**: gravação/egress, múltiplas cenas, co-diretor, templates de cena, diretório público, MLS/multi-dispositivo/Passkeys (ver `docs/backlog/backlog.md` e `docs/v2/TR-frontend-v2.md` §7).

## Capabilities

### New Capabilities
- `frontend-v2/server-management`: criar servidor, definições de servidor (membros, cargos/permissões, imagem, boas-vindas, apagar).
- `frontend-v2/channel-management`: criar/renomear/apagar canal, ACL/permissões de canal, silenciar membro.
- `frontend-v2/invites`: criar convite (fluxo de 2 passos) e aceitar convite (onboarding de convidado).

### Modified Capabilities
_Nenhuma — `frontend-v2-auth-shell` ainda não foi arquivado; esta fase depende dele por convenção de projecto (a sidebar/topbar que esta fase estende já existe), não por delta formal de spec._

## Impact

- **Código novo**: `frontend-v2/src/pages/{ServerSettings*,MembersManage,RolesManage,RolePermissions,ServerImage,ServerWelcome,ServerDelete,Invite}.tsx`, `frontend-v2/src/components/{ChannelAclPanel,MuteMemberDialog,CreateServerDialog,CreateChannelDialog}.tsx`.
- **Backend**: nenhum impacto — consome `/api/servers*`, `/api/channels*`, `/api/invites*` exactamente como a v1.
- **Depende de**: `frontend-v2-foundation` e `frontend-v2-auth-shell`.
- **Desbloqueia**: `frontend-v2-text-chat` (precisa de canais de texto existentes) e `frontend-v2-voice-video` (precisa de canais de voz existentes e de convites para testar com múltiplos utilizadores).

## Nota sobre decisões de arquitectura de informação divergentes dos mockups

Os mockups novos (`mesa_defini_es_do_servidor_*`) agregam Imagem+Boas-vindas+Apagar numa única página "Visão Geral", e o editor de Cargos usa um painel inline em vez de um botão "Permissões" que navega para outro ecrã (diferente da v1, que tem páginas separadas). Esta fase segue a estrutura dos mockups (agregada), não a da v1 — ver design.md D1 para a justificação e o registo desta divergência consciente, conforme `docs/v2/TR-frontend-v2.md` §10 pergunta 3.
