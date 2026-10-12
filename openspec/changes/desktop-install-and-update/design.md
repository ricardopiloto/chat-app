# Design

## Context

Ver `proposal.md` — Why, incluindo as descobertas técnicas já confirmadas (macOS exige assinatura para auto-update; Windows só NSIS; Linux suporta os três formatos). Pontos de código que ancoram este design:

- `frontend/electron/main.ts:351-368` (`app.whenReady().then(...)`): já faz `createWindow()` e o resto do arranque; é aqui que a verificação de actualização entra, depois de `createWindow()`.
- `frontend/package.json:45-46`: `electron`/`electron-builder` já são dependências; `electron-updater` ainda não.
- `frontend/electron-builder.yml`: sem bloco `publish` hoje — `linux.target`/`win.target`/`mac.target` já definidos (`AppImage`/`deb`/`rpm`; `nsis`/`msi`; `dmg`).
- `.github/workflows/desktop-release.yml:53,102,148`: cada job chama `electron-builder ... --publish never`; a publicação real é um passo separado (`softprops/action-gh-release`, `draft: true`, linhas 169-174) — o portão de rascunho humano já estabelecido, que esta change preserva sem alteração.
- `docs/desktop-release.md`: já documenta o fluxo de release (bater versão, disparar, rascunho vs. publicado) — ganha uma secção nova sobre o feed de actualização, sem reescrever o resto.

## Goals / Non-Goals

**Goals:**
- Instalação por linha de comando disponível em Linux, macOS e Windows, documentada no README a par de todas as outras vias.
- Auto-update real (descarrega, valida, aplica) onde a plataforma/formato suporta: Linux (os três formatos), Windows (só NSIS).
- Nunca um auto-update silencioso sem aviso — o utilizador vê que uma actualização foi descarregada antes de reiniciar.
- Nenhuma mudança ao portão de revisão humana já estabelecido (rascunho → publicar manualmente).

**Non-Goals:**
- Auto-update em macOS — bloqueado por falta de assinatura/notarização (decisão já tomada, inalterada); fica só com aviso/instalação manual via o mesmo script de linha de comando.
- Auto-update em Windows MSI — não suportado pelo `electron-updater`; o `.msi` continua disponível sem auto-update, documentado como tal.
- Assinatura de código, notarização, canal beta, publicação em lojas (Microsoft Store/Homebrew/Flathub/AUR) — inalterado de `desktop-packaging-ci`.
- Telemetria de adopção/contagem de instalações.

## Decisions

### 1. `electron-updater` no processo principal, não um serviço externo

Reaproveita o ecossistema `electron-builder` já em uso (mesmo autor, mesmos ficheiros de feed `latest*.yml` gerados a partir do que já se compila) em vez de montar um servidor de actualização próprio — nenhuma infra-estrutura nova, nenhum novo serviço para operar. O feed é servido directamente pela GitHub Release já existente.

Alternativa descartada: servidor de actualização próprio (ex. Hazel, Nuts). Rejeitada — infra-estrutura adicional a operar e manter, sem necessidade quando o GitHub já serve o ficheiro e o `electron-updater` já sabe falar o protocolo dessa release.

### 2. Auto-update real em Linux (3 formatos) e Windows (só NSIS); macOS e MSI ficam com instalação manual assistida pelo script

Ver `proposal.md` para a evidência técnica de cada limite. Em vez de fingir paridade entre plataformas (prometer auto-update em todo o lado e falhar silenciosamente onde não funciona), a aplicação **detecta o tipo de instalação no arranque** e só activa o verificador automático onde é suportado:

- **Linux**: sempre activo, **incluindo `.deb`/`.rpm`** — `electron-updater` já escolhe `AppImageUpdater`/`DebUpdater`/`RpmUpdater` com base num marcador que o próprio `electron-builder` escreve no pacote; nenhuma configuração extra para além do bloco `publish`.
- **Windows**: activo só quando a instalação é NSIS. Detecção exacta (registo do Windows, ou a própria lógica interna do `electron-updater`) a confirmar durante a implementação (ver `tasks.md` — não assumir a API sem verificar, dado o risco documentado de instalação duplicada ao misturar NSIS e MSI).
- **macOS**: nunca activo. O ecrã de "Verificar actualizações" (ou equivalente) mostra uma mensagem clara em vez de tentar e falhar: "actualize manualmente descarregando a versão nova" com a ligação para a release, ou reexecutando `install-mesa.sh`.
- **Windows MSI**: nunca activo, mesma mensagem que macOS, adaptada.

**Porque é que `.deb`/`.rpm` precisam de mecanismo próprio, e não ficam só a cargo do `apt`/`dnf` da distro** (pergunta levantada na revisão): `apt upgrade`/`dnf upgrade` só actualizam pacotes que vêm de um **repositório configurado no sistema** (metadados + assinatura conhecidos pelo gestor de pacotes). O `.deb`/`.rpm` da Mesa não é distribuído assim — é um ficheiro solto, anexado à GitHub Release, instalado uma vez com `dpkg -i`/`rpm -i` a partir de um download manual. Sem um repositório, `apt`/`dnf` não têm onde verificar se existe uma versão nova; ficariam parados na versão instalada para sempre, exactamente como o `.msi` do Windows ou o `.dmg` do macOS ficam sem o `electron-updater`. É por isso que o `electron-updater` tem as classes `DebUpdater`/`RpmUpdater`: resolvem precisamente este caso — o próprio processo da aplicação verifica a GitHub Release, descarrega o pacote novo, e invoca `dpkg -i`/`rpm`/`dnf install` directamente sobre esse ficheiro (com `pkexec` para a elevação), sem depender de nenhum repositório.

Alternativa descartada: montar um repositório `apt`/`dnf` real (hospedar metadados assinados por GPG, uma fonte por família de distribuição), para `apt upgrade`/`dnf upgrade` funcionarem nativamente. Tecnicamente mais "correcto" para quem já conhece o modelo de repositórios Linux, mas é infra-estrutura adicional a hospedar e manter (chaves GPG, metadados por arquitectura/distribuição) — do mesmo nível do que já está fora de escopo (Flathub/AUR/lojas, ver `proposal.md`) por este ser um projecto de manutenção solo. O mecanismo do `electron-updater` dá o mesmo resultado prático (actualização real, sem reinstalação manual) sem essa infra-estrutura nova.

### 3. Script de instalação por linha de comando reaproveitado como caminho de actualização manual

`scripts/install-mesa.sh`/`.ps1` não são só para a primeira instalação — reexecutá-los descarrega a última release publicada e reinstala por cima, servindo de "actualizar à mão" para quem está em macOS ou MSI. Evita construir dois mecanismos separados (um de instalação, outro de "actualização manual") quando um script idempotente resolve os dois.

Fluxo do script: detectar SO/arquitectura → consultar `https://api.github.com/repos/ricardopiloto/chat-app/releases/latest` (só vê releases publicadas, nunca rascunhos) → descarregar o artefacto certo → confirmar o hash SHA-256 do ficheiro descarregado contra o valor publicado nos metadados da release → instalar (Linux: `dpkg -i`/`rpm -i`/tornar o AppImage executável; macOS: montar o `.dmg` e copiar para `/Applications`; Windows: correr o `.exe` NSIS, silenciosamente com `/S` se invocado com uma flag `--silent`).

### 4. Aviso visível antes de reiniciar, nunca um auto-update invisível

Ao evento `update-downloaded` do `electron-updater`, mostrar uma faixa persistente no shell (mesmo padrão visual da faixa de reconexão do WebSocket já existente) com "Nova versão disponível — reiniciar para atualizar" e um botão "Reiniciar agora" que chama `autoUpdater.quitAndInstall()`. Sem o botão, a actualização só se aplica no próximo arranque manual da aplicação (comportamento por omissão do `electron-updater`, mantido, não substituído por nada mais agressivo).

### 5. CI: gerar o feed sem tocar no portão de rascunho

`electron-builder` escreve os ficheiros `latest*.yml` (com os hashes SHA-512) no directório de saída independentemente do `--publish never`, desde que o bloco `publish` no `electron-builder.yml` declare o fornecedor/repositório — a confirmar na Tarefa 1 de `tasks.md` antes de assumir. Esses ficheiros já ficam cobertos pelo glob `artifacts/**` do passo `action-gh-release` existente (linha 174), por isso não deveria ser necessário nenhum passo de CI novo — só confirmar que o glob os captura e que ficam no rascunho, tal como qualquer outro instalador.

## Risks / Trade-offs

- [Prometer auto-update onde não funciona (MSI, macOS) confundiria quem instala por essas vias] → Mitigação: Decisão 2 — detecção explícita por tipo de instalação, mensagem clara em vez de falha silenciosa.
- [Misturar NSIS e MSI com o auto-updater activo pode causar instalação duplicada, risco documentado na comunidade `electron-builder`] → Mitigação: o verificador nunca corre quando a instalação é MSI (Decisão 2); a Tarefa de implementação confirma o mecanismo de detecção antes de activar, não depois.
- [O script de instalação por linha de comando é um vector de confiança novo — descarrega e executa um instalador a partir de um script] → Mitigação: o script só descarrega da API pública do GitHub (HTTPS, repositório conhecido), verifica o hash publicado pelo `electron-builder` antes de instalar, e nunca pede nem processa credenciais; documentado no README como qualquer outro instalador não assinado (mesmos avisos de SmartScreen/Gatekeeper já existentes, sem mudança).
- [`DebUpdater`/`RpmUpdater` usam `pkexec` para elevar — pode pedir a senha do utilizador a meio de uma sessão, de forma inesperada se não avisado antes] → Mitigação: Decisão 4 (aviso visível antes de qualquer acção), o pedido de senha do `pkexec` só acontece depois de o utilizador clicar "Reiniciar agora", nunca em segundo plano sem acção explícita.

## Migration Plan

Aditivo: nova dependência (`electron-updater`), novo bloco de configuração (`publish`), dois scripts novos, documentação nova. Depende de `desktop-packaging-ci` estar implementada (precisa dos alvos de empacotamento e do workflow de CI já a funcionar) — não pode ser verificada ponta-a-ponta antes disso, mas pode ser desenhada e revista em paralelo.
