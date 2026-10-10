# Tasks

## 1. Licença e metadados de empacotamento (revisto para Electron)

- [x] 1.1 Criar `LICENSE` na raiz do repositório com o texto oficial da AGPL-3.0. *(Concluído antes da troca de shell; inalterado — texto da licença não depende da tecnologia do shell.)*
- [ ] 1.2 **Revisto**: `license = "AGPL-3.0-only"` continua em `backend/Cargo.toml` e `frontend/package.json` (já feito, inalterado); acrescentar `"license": "AGPL-3.0-only"` a `frontend/electron/package.json` (novo ficheiro, criado por `desktop-electron-shell`) — substitui o campo que estava em `frontend/src-tauri/Cargo.toml`, removido com o crate Tauri. Verificar com `npm pkg get license --prefix frontend/electron`.
- [ ] 1.2.1 **Revisto**: a convenção de sincronizar a versão entre manifestos antes de uma tag passa a cobrir `backend/Cargo.toml`, `frontend/package.json` (fonte de verdade) e `frontend/electron/package.json` (em vez de `frontend/src-tauri/Cargo.toml`, que já não existe). Verificar que os três têm o mesmo número de versão.
- [ ] 1.3 **Revisto**: preencher no campo `build` de `frontend/electron/package.json` (ou `frontend/electron-builder.yml`) os metadados de empacotamento — descrição curta/longa a partir do `README.md`, categoria Linux (ex. "Network"), `appId: "com.mesa.desktop"`, autor/publisher. Verificar com `npx electron-builder --linux deb` local (sem publicar) que o bundler não falha por metadado em falta — instalar `rpmbuild` localmente primeiro se for verificar o alvo `rpm` (mesma dependência que a Tarefa 2.1 instala no CI).
- [ ] 1.4 Configurar `mac.extendInfo` em `frontend/electron/package.json`/`electron-builder.yml` com `NSCameraUsageDescription`/`NSMicrophoneUsageDescription` (texto claro: a app usa câmara/microfone para canais de voz/vídeo) — ver `design.md` Decisão 5, achado da revisão cruzada com `desktop-electron-shell`. Verificar, quando houver acesso a uma máquina macOS (Tarefa 3.1/6.1), que o pedido de câmara mostra o diálogo do sistema em vez de falhar silenciosamente.

## 2. Workflow de CI — scaffold e Linux

- [ ] 2.1 Criar `.github/workflows/desktop-release.yml` com gatilho `workflow_dispatch` e `push: tags: ["v*"]`, e um job `ubuntu-latest` que instala dependências (Node, `rpm`/`rpmbuild` via `apt-get` — confirmado ainda necessário com `electron-builder`, ver `design.md` Context) e corre `npx electron-builder --linux AppImage deb rpm` a partir de `frontend/electron/`. Quando o gatilho for uma tag, acrescentar um passo que falha explicitamente o workflow se a versão em `frontend/electron/package.json` não corresponder ao nome da tag. Verificar accionando o workflow manualmente numa branch de teste e confirmando que o job Linux termina com sucesso; verificar separadamente, com uma tag de teste que não corresponda à versão do manifesto, que o workflow falha antes de produzir qualquer artefacto.
- [ ] 2.2 Verificar que a execução da Tarefa 2.1 produz os três ficheiros (`.AppImage`, `.deb`, `.rpm`) como artefactos/outputs do job, com os nomes esperados (versão de `frontend/electron/package.json` no nome do ficheiro).

## 3. Workflow de CI — Windows e macOS

- [ ] 3.1 Acrescentar ao mesmo workflow os jobs `windows-latest` (`npx electron-builder --win nsis msi`) e `macos-latest` (`npx electron-builder --mac dmg`). Verificar, accionando manualmente, que os dois jobs terminam com sucesso e produzem os ficheiros esperados.
- [ ] 3.2 Confirmar que nenhum dos dois jobs tenta assinar o binário (sem segredos de certificado configurados nos `secrets` do repositório) — comportamento por omissão do `electron-builder` quando as variáveis de assinatura não estão definidas. Verificar inspeccionando o log de build.

## 4. Publicação

- [x] 4.1 Passo de release configurado (`releaseDraft: true` na acção/passo de publicação) — quando o gatilho for uma tag `v*`, cria/actualiza uma GitHub Release em rascunho com esse nome; quando for `workflow_dispatch` sem tag, não publica nenhuma release. *(Decisão já tomada antes da troca de shell; verificar na Tarefa 2.1/3.1 que o mecanismo equivalente do `electron-builder` — publish config em `package.json`/`electron-builder.yml`, ou um passo separado tipo `softprops/action-gh-release` — ainda produz o mesmo resultado em draft.)*

## 5. Documentação

- [x] 5.1 Nota no `README.md` de que os instaladores de Windows e macOS não são assinados/notarizados, com o que isso implica no primeiro arranque. *(Concluído antes da troca de shell; inalterado.)*
- [ ] 5.2 **Revisto**: actualizar `docs/desktop-release.md` (já criado) para reflectir `frontend/electron/package.json` em vez de `frontend/src-tauri/Cargo.toml` na lista de manifestos a bater antes de uma tag, e confirmar que o resto do texto (o que esperar em cada plataforma, draft vs. publicado, onde encontrar os artefactos) continua correcto com o novo bundler. Verificar seguindo o texto actualizado para cortar a primeira release real.

## 6. Verificação end-to-end

- [ ] 6.1 Com `desktop-electron-shell` implementada, criar uma tag de versão real (coordenada com o utilizador) e confirmar que a GitHub Release resultante tem os seis artefactos esperados (`.AppImage`, `.deb`, `.rpm`, `.nsis`/`.exe`, `.msi`, `.dmg`) e que pelo menos um deles, instalado manualmente numa máquina de cada SO disponível, abre a aplicação, liga-se a uma instância Mesa de teste, **e confirma especificamente câmara/microfone e colar imagem** (os dois comportamentos que motivaram a troca de shell — não assumir que "abre e autentica" é suficiente desta vez).
