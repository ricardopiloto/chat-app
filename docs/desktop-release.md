# Release do cliente desktop

## Manifesto de integridade e aviso de versão

O job de release gera `SHA256SUMS` a partir dos seis instaladores e anexa o manifesto à mesma GitHub Release em rascunho. Antes de publicar, confirme que os seis ficheiros e o manifesto estão presentes. Os scripts `scripts/install-mesa.sh` e `scripts/install-mesa.ps1` só instalam releases publicadas com esse manifesto e verificam o SHA-256 antes de executar o instalador. Reexecutar o script reinstala a versão publicada mais recente. Uma release antiga sem manifesto continua a poder ser instalada por download direto.

O aplicativo empacotado consulta a última release publicada no arranque e a cada seis horas. Se houver versão mais recente, mostra uma faixa com ligação para a release. A aplicação da atualização é manual em todos os formatos; não há feed `latest*.yml` nem `electron-updater` neste fluxo.

O workflow [`.github/workflows/desktop-release.yml`](../.github/workflows/desktop-release.yml) empacota o shell Electron com `electron-builder`. Não corre em cada push.

## Bater a versão

A versão do produto está em três manifestos, e os três têm de ser o mesmo número. `frontend/package.json` é a fonte de verdade; os outros dois seguem-no.

- `backend/Cargo.toml`
- `frontend/package.json`
- `frontend/electron/package.json`

Os instaladores usam o número de `frontend/package.json` (o `electron-builder` lê esse manifesto, com o projecto em `frontend/`). Uma tag `v1.2.0` só é aceite se `frontend/electron/package.json` disser `1.2.0`. Se a tag não bater certo, o workflow falha antes de produzir instaladores.

## Disparar

- **Sem publicar:** em GitHub Actions, correr `Desktop release` com *Run workflow* (`workflow_dispatch`). Os três jobs compilam e deixam os ficheiros nos artefactos da execução. Não é criada nenhuma GitHub Release.
- **Release:** criar a tag `v*` (por exemplo `v1.2.0`) no commit que já tem os três manifestos actualizados. O job `release` cria uma GitHub Release **em rascunho** (`draft: true` em `softprops/action-gh-release`) com esse nome e anexa os instaladores. O rascunho não fica público até alguém o publicar na página da release. Um `workflow_dispatch` sem tag não corre esse job.

A escolha do rascunho é deliberada. A primeira release real não deve aparecer publicada sem uma revisão dos ficheiros.

## O que cada plataforma produz

| Runner | Ficheiros |
| --- | --- |
| Linux | `.AppImage`, `.deb`, `.rpm` |
| Windows | `.exe` (NSIS) e `.msi`, sem assinatura Authenticode |
| macOS | `.dmg` (a `.app` vai dentro do disco, não é publicada à parte), sem notarização |

O nome de cada ficheiro inclui a versão de `frontend/package.json`, que tem de ser a mesma de `frontend/electron/package.json` (hoje `1.2.0`).

Nos três formatos Linux, o nome do ficheiro, o binário instalado e o identificador do pacote usam `mesa-chat-app`, não `mesa`/`Mesa` (`frontend/electron-builder.yml`: `executableName`, `deb.packageName`, `rpm.packageName`, `artifactName`) — por exemplo `mesa-chat-app-1.2.0-amd64.deb`, `mesa-chat-app-1.2.0-x86_64.rpm`, `mesa-chat-app-1.2.0-x86_64.AppImage`. Motivo: `mesa`/`Mesa` é também o nome da biblioteca gráfica Mesa 3D (`mesa-libgallium`, `mesa-vulkan-drivers`, etc.), já instalada por omissão em praticamente qualquer distribuição Linux — confirmado em `dpkg -l | grep mesa` numa instalação Ubuntu comum. `productName` ("Mesa", mostrado no menu/dock/título da janela) e `appId` (`com.mesa.desktop`) não mudam, só o identificador de empacotamento. Windows e macOS não têm este risco de colisão (sem um espaço de nomes de pacotes partilhado) e continuam com `Mesa` no nome dos instaladores.

Os artefactos de uma tag ficam na GitHub Release `v*` (rascunho até ser publicada): `https://github.com/ricardopiloto/chat-app/releases`. Num disparo manual, ficam só nos artefactos dessa execução do workflow.

O `.deb` e o `.rpm` instalam um `.desktop` (`mesa-chat-app.desktop`) com o ícone de `frontend/electron/icons/`. No Wayland, esse ícone só aparece na barra depois de instalar o pacote; uma janela de desenvolvimento ou um directório desempacotado continua com o símbolo genérico.

## Instaladores por assinar

Os instaladores de Windows e de macOS **não são assinados nem notarizados**. Não há certificado Authenticode nem conta Apple Developer neste repositório, e o workflow não define variáveis de assinatura.

No primeiro arranque isso aparece como aviso, não como um instalador "verificado":

- **Windows:** o SmartScreen pode bloquear o `.exe` ou o `.msi` com "Windows protected your PC". Quem confia na origem escolhe *More info* e *Run anyway*.
- **macOS:** o Gatekeeper pode recusar o `.dmg` com "cannot be opened because the developer cannot be verified". Quem confia na origem abre *Privacy & Security* e permite a aplicação, ou usa o menu de contexto *Open*. O pacote declara à mesma o uso da câmara e do microfone (`NSCameraUsageDescription` e `NSMicrophoneUsageDescription`), para o sistema mostrar o diálogo de permissão em vez de o recusar em silêncio.

Estes avisos mantêm-se enquanto não houver certificados. Não são um passo que o instalador trate sozinho.
