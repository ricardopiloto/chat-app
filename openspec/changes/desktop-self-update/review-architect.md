# Review — Arquiteto de Soluções

**Change:** desktop-self-update
**Data:** 2026-11-05
**Veredito geral:** Bloqueado

Contexto reconstruído de: `docs/desktop-release.md`, `.github/workflows/desktop-release.yml`, `frontend/electron-builder.yml`, `frontend/electron/main.ts`, `scripts/install-mesa.{sh,ps1}`, `frontend/src/lib/toast.ts` e `openspec/specs/desktop/{packaging,updates}`.

## 1. Definição da arquitetura técnica
Veredito: Atenção
- A escolha de `electron-updater` com GitHub provider é coerente com a stack (Electron + electron-builder já em uso) e remove código próprio de download/diferencial. OK. (`design.md` D1)
- Os componentes (módulo puro `updateMode.ts`, estado único `mesa:update-state`, toast no renderer) têm responsabilidades claras e a fronteira main↔renderer é mínima. OK.
- `design.md` D6 afirma reaproveitar «o mecanismo de toast persistente existente», mas `frontend/src/lib/toast.ts` só tem `createToast(lifetimeMs)` com `flash()` temporizado: não existe toast persistente nem com ações. Será um componente novo; ajustar o design e a estimativa. — corrigir D6 e a tarefa 3.1.
- Carga/escala: não se aplica (cliente desktop, uma verificação por abertura; o feed é servido pelo CDN do GitHub). N/A.

## 2. Integração com a infraestrutura existente
Veredito: **Bloqueante**
- **Bloqueante — o self-update do AppImage quebra o atalho criado por `install-mesa.sh`.** O script instala em `~/.local/bin/parley-chat-app.AppImage` (nome fixo) e grava `Exec=` com esse caminho no `.desktop`. O `artifactName` do Linux é `parley-chat-app-${version}-${arch}.${ext}`, e, pelo que sei do `AppImageUpdater` do `electron-updater`, quando o nome do arquivo baixado difere do `APPIMAGE` em execução ele grava o novo arquivo com o nome novo no mesmo diretório e remove o antigo. Resultado provável: após a primeira atualização o atalho aponta para um arquivo que não existe mais. Nem o spec nem as tarefas cobrem isso. — Decidir antes de implementar (e provar num protótipo): (a) nome de artefato AppImage sem versão (ajustando os filtros dos scripts de instalação, que hoje usam `startswith("parley-chat-app-")`), ou (b) o app recriar/atualizar o `.desktop` e um symlink estável após atualizar, ou (c) AppImage fora do script só em modo aviso. Acrescentar requisito/cenário e tarefa.
- O bloco `publish` do builder e a publicação do feed seguem o fluxo de rascunho existente; Windows gera `latest.yml`, Linux `latest-linux.yml`, sem colisão de nomes entre jobs. OK.
- Fluxo de release: o `find` do job `release` já filtra por extensão, então os `.yml`/`.blockmap` não entram nos seis instaladores nem no `SHA256SUMS`. OK. Mas `files: artifacts/**` publica tudo o que existir, então os globs de upload de cada job precisam listar o feed explicitamente (tarefa 4.3 cobre).
- macOS: o `electron-builder` com `publish` pode gerar `latest-mac.yml`; o design diz que ele não é publicado. Deixar isso explícito no workflow (glob que não o inclui). Atenção menor.
- `--publish never` deve continuar gerando `app-update.yml` e `latest*.yml`; a tarefa 4.2 só prova isso no Linux. Windows só será provado na release real. — antecipar com `workflow_dispatch` e conferir o artefato Windows antes de taguear.

## 3. Qualidade de arquitetura e trade-offs
Veredito: Atenção
- Segurança: com instaladores não assinados, a confiança é HTTPS + SHA-512 do `latest*.yml` hospedado na mesma release. Quem controlar o repositório ou o token de release executa código em todos os clientes. É um trade-off assumido e documentado no spec; manter a documentação explícita sobre isso (inclusive para a conta com permissão de publicar). Atenção, sem mudar a decisão.
- A variável `PARLEY_UPDATE_FEED_URL` (D7) fica ativa também no app empacotado de produção, restrita a loopback. O risco é baixo (precisa de acesso local), mas é superfície evitável: preferir honrá-la só quando `!app.isPackaged` ou quando uma segunda variável de teste explícita estiver presente — porém a tarefa 5.3 testa com o app empacotado, então se decidir manter, registrar o motivo no design.
- D3 (modo aviso por redirecionamento de `releases/latest` com `redirect: "manual"`) é mais simples que a API REST e retira o limite de 60/h. Depende de comportamento do GitHub não contratual; mitigação já correta: falha silenciosa. OK.
- Manutenibilidade: lógica de decisão isolada e testável (`updateMode.ts`, `verify:updates`) é adequada ao tamanho da equipe. OK.
- Detecção NSIS pelo `Uninstall Parley.exe` (D2) é heurística; o lado seguro é aviso, bem justificado. O teste que liga o nome ao `productName` mitiga. OK.

## 4. Documentação e decisões (ADRs)
Veredito: Atenção
- `design.md` registra decisões com alternativas descartadas em D1 e D3, mas D2, D4–D8 não trazem alternativa rejeitada. Para D5 (confirmação no renderer) e D7 (feed de teste) vale uma linha de alternativa. Menor.
- `docs/arquitetura-tecnica.md` e `docs/desktop-release.md` precisam registrar o novo fluxo de update; a tarefa 5.1 cobre o segundo, não o primeiro. Verificar se `arquitetura-tecnica.md` descreve o Electron e incluir se sim.
- Um diagrama simples do fluxo (abertura → modo → estado → toast → reinício/instalação ao fechar) ajudaria, dado o número de estados e fallback para aviso. Opcional.

## 5. Ponte entre produto e técnico
Veredito: Atenção
- O objetivo do produto (o grupo não precisar reinstalar à mão) é atendido para Windows NSIS e, **condicionalmente à correção do bloqueante**, Linux AppImage. Sem ela, o caminho de instalação recomendado no Linux (o script) fica pior após a primeira atualização.
- O rollout está bem tratado: quem está na 1.5.0 reinstala uma vez; a primeira versão com atualizador é ≥1.5.1.
- Usuários de Linux que instalaram o AppImage por outro meio podem estar em diretório não gravável: coberto pelo modo aviso. OK.

## Bloqueantes antes de implementar
- Definir e especificar como o AppImage atualizado mantém o atalho/caminho estável criado por `install-mesa.sh` (nome do artefato, symlink ou recriação do `.desktop`), com cenário no spec e tarefa de verificação ponta a ponta no Linux.
