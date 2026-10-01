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

- **Código novo**: páginas e diálogos de administração de servidor, canal e convite, escritos de raiz; a divisão em ficheiros segue a estrutura dos mockups, não a da v1.
- **Backend**: nenhum impacto previsto (qualquer alteração exige tarefa própria, ver regra 4 da revisão) — consome `/api/servers*`, `/api/channels*`, `/api/invites*` exactamente como a v1.
- **Depende de**: `frontend-v2-foundation` e `frontend-v2-auth-shell`.
- **Desbloqueia**: `frontend-v2-text-chat` (precisa de canais de texto existentes) e `frontend-v2-voice-video` (precisa de canais de voz existentes e de convites para testar com múltiplos utilizadores).

## Nota sobre decisões de arquitectura de informação divergentes dos mockups

Os mockups novos (`mesa_defini_es_do_servidor_*`) agregam Imagem+Boas-vindas+Apagar numa única página "Visão Geral", e o editor de Cargos usa um painel inline em vez de um botão "Permissões" que navega para outro ecrã (diferente da v1, que tem páginas separadas). Esta fase segue a estrutura dos mockups (agregada) — ver design.md D1 para a justificação e o registo desta divergência consciente, conforme `docs/v2/TR-frontend-v2.md` §10 pergunta 3.

## Revisão: reescrita do zero e fidelidade visual (2026-10-01)

Esta revisão resulta de `docs/v2/AUDIT-fidelity.md`, que concluiu que o frontend v2 entregue até aqui adoptou os tokens do design mas **não** a interface desenhada, e que grande parte do código descende da v1 (59% em média; 87–100% na voz/vídeo). Passam a valer quatro regras, transversais a todas as fases:

1. **Independência do frontend v1.** Nada de `frontend/` é reaproveitado: nenhum ficheiro, componente, folha de estilo, hook, estrutura de pastas nem decisão de implementação é copiado, adaptado ou usado como modelo, e `frontend/` não é lido para implementar. O que permanece da v1 é **só o backend** (contratos REST/WS, regras de acesso e modelo de dados), nos pontos em que é necessário e reaproveitável sem alteração. A aplicação v1 em execução pode ser usada como caixa-preta para observar comportamento de produto. Formatos criptográficos persistidos (cofre de identidade, envelope de chave de servidor, chave de canal, cifra de mensagem/anexo) são **contratos de dados** com contas existentes: são especificados em `docs/v2/contracts/` com vectores de teste (ver `frontend-v2-foundation`) e a v2 implementa a partir dessa especificação.
2. **Fidelidade visual por tela.** Uma tela só é dada como concluída quando comparada lado a lado com o `screen.png` do mockup correspondente, cumpre a lista de elementos obrigatórios do design deste change e obtém a classificação **Fiel** na escala de `docs/v2/AUDIT-fidelity.md` §2. A comparação fica registada em `verification.md`. Elementos desenhados nos mockups mas fora de escopo (AUDIT §6) não contam como em falta.

3. **Paridade funcional total.** Todas as funcionalidades que a aplicação tem hoje continuam a funcionar na v2, sem exceção. O inventário de referência é `docs/design-system/stitch-prompt.md` §3 mais o comportamento observável da v1 em execução, consolidado em `docs/v2/parity-checklist.md` (ver `frontend-v2-foundation`). Cada change verifica as funcionalidades da sua área contra essa checklist; uma funcionalidade só pode ser omitida se estiver explicitamente excluída do escopo (`docs/v2/TR-frontend-v2.md` §4.2 e §7). Renovar a interface nunca é motivo para retirar uma funcionalidade existente.
4. **Backend só muda por necessidade do frontend.** O backend da v1 é reaproveitado como está. Uma alteração de backend só é admitida quando um requisito do frontend v2 a exige e não há alternativa no cliente; nesse caso é uma tarefa explícita neste change, com o contrato actualizado em `docs/v2/contracts/`, compatível com a v1 enquanto o rollback for possível (alterações aditivas) e verificada com os testes de backend existentes (`cargo test`).

**Consequência para o estado actual:** o código existente em `frontend-v2/` para esta fase é descartável e será substituído; as tarefas foram reabertas e as `verification.md` anteriores ficam como histórico superado.
