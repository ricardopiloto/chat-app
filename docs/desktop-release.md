# Release do cliente desktop

O workflow [`.github/workflows/desktop-release.yml`](../.github/workflows/desktop-release.yml) compila o shell Tauri em Linux, Windows e macOS. Não corre em cada push.

## Bater a versão

A versão do produto está em três manifestos, e os três têm de ser o mesmo número:

- `backend/Cargo.toml`
- `frontend/package.json`
- `frontend/src-tauri/Cargo.toml`

`frontend/src-tauri/tauri.conf.json` repete esse número no campo `version`. Os instaladores usam o número do crate Tauri e do `tauri.conf.json`. Uma tag `v1.2.0` só é aceite se esses dois ficheiros disserem `1.2.0`. Se a tag não bater certo, o workflow falha antes de produzir instaladores.

## Disparar

- **Sem publicar:** em GitHub Actions, correr `Desktop release` com *Run workflow* (`workflow_dispatch`). Os três jobs compilam e deixam os ficheiros nos artefactos da execução. Não é criada nenhuma GitHub Release.
- **Release:** criar a tag `v*` (por exemplo `v1.2.0`) no commit que já tem os manifestos actualizados. O workflow cria uma GitHub Release **em rascunho** (`releaseDraft: true`) com esse nome e anexa os instaladores. O rascunho não fica público até alguém o publicar na página da release.

A escolha do rascunho é deliberada: a acção `tauri-apps/tauri-action` já não cria rascunhos por omissão, por isso o workflow pede o rascunho explicitamente. A primeira release real não deve aparecer publicada sem uma revisão dos ficheiros.

## O que cada plataforma produz

| Runner | Ficheiros |
| --- | --- |
| Linux | `.AppImage`, `.deb`, `.rpm` |
| Windows | `.msi` e `.exe` (NSIS), sem assinatura Authenticode |
| macOS | `.app` e `.dmg`, sem notarização |

O nome de cada ficheiro inclui a versão de `frontend/src-tauri` (hoje `1.2.0`).

Os artefactos de uma tag ficam na GitHub Release `v*` (rascunho até ser publicada): `https://github.com/ricardopiloto/chat-app/releases`. Num disparo manual, ficam só nos artefactos dessa execução do workflow.

## Instaladores por assinar

Os instaladores de Windows e de macOS **não são assinados nem notarizados**. Não há certificado Authenticode nem conta Apple Developer neste repositório, e o workflow não define variáveis de assinatura.

No primeiro arranque isso aparece como aviso, não como um instalador "verificado":

- **Windows:** o SmartScreen pode bloquear o `.exe` ou o `.msi` com "Windows protected your PC". Quem confia na origem escolhe *More info* e *Run anyway*.
- **macOS:** o Gatekeeper pode recusar o `.dmg` / a `.app` com "cannot be opened because the developer cannot be verified". Quem confia na origem abre *Privacy & Security* e permite a aplicação, ou usa o menu de contexto *Open*.

Estes avisos mantêm-se enquanto não houver certificados. Não são um passo que o instalador trate sozinho.
