# Tasks

## 1. `electron-builder`: feed de actualização

- [ ] 1.1 Adicionar `electron-updater` a `frontend/package.json` (dependência de produção, não de desenvolvimento — corre no processo principal empacotado).
- [ ] 1.2 Adicionar o bloco `publish` a `frontend/electron-builder.yml` (`provider: github`, `owner: ricardopiloto`, `repo: chat-app`) — sem mudar `--publish never` nos passos de CI existentes (Decisão 5 de `design.md`).
- [ ] 1.3 Confirmar, correndo `npx electron-builder --linux AppImage deb rpm` localmente com o bloco `publish` adicionado, que os ficheiros de feed (`latest-linux.yml` ou equivalente) aparecem em `frontend/release/` mesmo com publicação desactivada — se não aparecerem, investigar a flag/configuração correcta do `electron-builder` para os gerar sem publicar de facto (não assumir a resposta sem correr o build).
- [ ] 1.4 Repetir a confirmação da Tarefa 1.3 para os alvos Windows (`latest.yml`) e macOS (`latest-mac.yml`), numa máquina/runner de cada SO.

## 2. `electron-updater` no processo principal

- [ ] 2.1 Em `frontend/electron/main.ts`, depois de `createWindow()` (linha 364), inicializar o verificador de actualização só quando `!isDev` — mesma guarda já usada para `registerAppProtocol()` (linha 358).
- [ ] 2.2 Implementar a detecção de plataforma/formato de instalação (Decisão 2 de `design.md`): Linux sempre; Windows só quando a instalação é NSIS (confirmar o mecanismo exacto de detecção durante esta tarefa — registo do Windows, variável de ambiente, ou API do próprio `electron-updater` — e documentar a escolha feita); macOS e Windows MSI nunca correm o verificador automático. Verificar manualmente em cada combinação disponível.
- [ ] 2.3 Configurar a verificação periódica (arranque + a cada 6 horas) só nas combinações da Tarefa 2.2 que suportam. Verificar com um `setInterval` de teste reduzido (ex. 1 minuto) antes de fixar o valor de produção.
- [ ] 2.4 No evento `update-downloaded`, emitir um IPC para o renderer com a informação da versão nova (Decisão 4 de `design.md`) — não chamar `quitAndInstall()` automaticamente.

## 3. UI: aviso de actualização

- [ ] 3.1 No shell (`frontend/src/shell/`), adicionar uma faixa persistente (mesmo padrão visual da faixa de reconexão do WebSocket já existente) que aparece ao receber o IPC da Tarefa 2.4, com "Nova versão disponível — reiniciar para atualizar" e um botão "Reiniciar agora" que invoca `quitAndInstall()` via IPC.
- [ ] 3.2 Em macOS e Windows MSI (onde a Tarefa 2.2 nunca activa o verificador automático), adicionar à mesma superfície (ou ao menu de conta/ajuda) uma indicação de "actualizar manualmente" com a ligação para a página de releases e/ou instrução para reexecutar o script de instalação. Verificar manualmente em cada plataforma sem auto-update.
- [ ] 3.3 Chaves de i18n novas (pt-BR/en) para as mensagens das Tarefas 3.1/3.2, seguindo o padrão já existente de catálogos por área.

## 4. Scripts de instalação por linha de comando

- [ ] 4.1 Criar `scripts/install-mesa.sh` (Linux/macOS, POSIX): detecta SO (`uname -s`) e arquitectura (`uname -m`), consulta `https://api.github.com/repos/ricardopiloto/chat-app/releases/latest`, descarrega o artefacto certo (AppImage no Linux, `.dmg` no macOS), verifica o hash SHA-256/512 publicado, e instala (Linux: torna o AppImage executável e coloca-o num local no `PATH`, ex. `~/.local/bin/`; macOS: monta o `.dmg` e copia para `/Applications`). Verificar correndo o script numa máquina de cada SO contra uma release real já publicada.
- [ ] 4.1.2 **Confirmar explicitamente em distro Arch-based** (ex. CachyOS, pedido pelo utilizador): o AppImage é distro-agnóstico (não depende de `apt`/`dnf`/`pacman`), por isso `install-mesa.sh` não precisa de nenhum ramo específico para Arch — mas confirmar por teste real, não por suposição, que o script corre e a aplicação abre numa máquina Arch-based, incluindo a integração de menu da Tarefa 4.1.1 (algumas distros Arch-based têm convenções diferentes de `~/.local/share/applications/`). Decisão confirmada com o utilizador: sem PKGBUILD/AUR — o script genérico é a via oficial também para Arch.
- [ ] 4.1.1 **Integração de menu para o AppImage** (achado de `review-fullstack.md`): sem isto, a via CLI fica com integração pior do que o `.deb`/`.rpm` (que já instalam um `.desktop` com ícone, `docs/desktop-release.md`). `install-mesa.sh` gera também `~/.local/share/applications/mesa.desktop` a apontar para o AppImage instalado, e extrai/copia o ícone (via `--appimage-extract` do próprio AppImage, ou reaproveitando `frontend/electron/icons/`). Verificar: depois de instalar pelo script, a Mesa aparece no menu de aplicações com o ícone correcto, não só correndo pelo terminal.
- [ ] 4.2 Criar `scripts/install-mesa.ps1` (Windows PowerShell): mesmo fluxo, descarregando o instalador NSIS e correndo-o (silenciosamente com uma flag `-Silent`, ou interactivamente por omissão). Verificar numa máquina Windows.
- [ ] 4.3 Confirmar que reexecutar qualquer um dos dois scripts, com a aplicação já instalada numa versão mais antiga, actualiza para a última release publicada (Decisão 3 de `design.md` — o mesmo script serve de "actualizar à mão").
- [ ] 4.4 Confirmar que um hash inválido (simular corrompendo o ficheiro descarregado, ou apontando temporariamente para um artefacto errado) interrompe o script antes de instalar, com uma mensagem clara.

## 5. CI

- [ ] 5.1 Confirmar que o passo `action-gh-release` existente (`.github/workflows/desktop-release.yml:169-174`, glob `artifacts/**`) já inclui os ficheiros de feed gerados pela Tarefa 1 sem precisar de nenhuma alteração — se o glob não os apanhar (ex. porque ficam fora de `frontend/release/*`), ajustar o passo `upload-artifact` de cada job para os incluir explicitamente.
- [ ] 5.2 Verificar, numa tag de teste coordenada com o utilizador, que a GitHub Release em rascunho resultante tem os instaladores **e** os ficheiros de feed, e que `electron-updater`, apontado para essa release depois de publicada manualmente, detecta a versão nova.

## 6. Documentação

- [ ] 6.1 `README.md`: nova secção "Instalar e actualizar" com as quatro vias (linha de comando, `.deb`/`.rpm`, `.msi`/NSIS, `.dmg`) e, para cada uma, se a actualização é automática, manual ou não suportada — ligar à secção "Distribuição desktop" já existente (avisos de SmartScreen/Gatekeeper, inalterados).
- [ ] 6.2 `docs/desktop-release.md`: acrescentar uma nota sobre o requisito de feed de actualização (bloco `publish` no `electron-builder.yml`, ficheiros `latest*.yml` a acompanhar os instaladores na release) para quem cortar uma release não se esquecer de os verificar.

## 7. Não-regressão

- [ ] 7.1 Confirmar que a aplicação continua a arrancar e a funcionar normalmente em modo de desenvolvimento (`npm run electron:dev`) sem nenhuma tentativa de verificar actualizações (guarda `!isDev` da Tarefa 2.1).
- [ ] 7.2 Confirmar que nenhuma das mudanças desta change interfere com o workflow de release já existente para quem não tiver ainda esta change aplicada (CI continua a produzir os mesmos seis instaladores, com os mesmos nomes).
