# Design

## Context

Ver proposal.md. Observado no código e na infra:

- `electron-builder.yml`: `appId: com.mesa.desktop`, `productName: Mesa`, Linux `executableName`/`packageName`/`desktopName` com `mesa-chat-app`, Windows com alvos NSIS e MSI, macOS DMG.
- Não há auto-update embutido. O aviso de versão consulta a última release no GitHub; a instalação é manual ou por `scripts/install-mesa.sh` e `.ps1`. O `.sh` escolhe o instalador por extensão e arquitetura e, no Linux, cria `~/.local/bin/mesa-chat-app.AppImage`, `~/.local/share/applications/mesa.desktop` e `~/.local/share/icons/mesa-chat-app.png`. O `.ps1` filtra o instalador por `.exe` **e** pelo texto "Mesa".
- Variáveis `MESA_*`: `backend/src/config.rs` (`MESA_PRODUCTION`, `MESA_ENV`, `MESA_RATE_LIMIT_DISABLED`), `frontend/vite.config.ts` (`MESA_BACKEND`, `MESA_BACKEND_WS`, `MESA_DEV_PORT`), `frontend/electron/main.ts` e o script `electron:dev` em `package.json` (`MESA_ELECTRON_DEV`).
- A instância real usa `systemd`, `/etc/mesa/mesa.env` (com `MESA_PRODUCTION=1`) e Nginx servindo `frontend/dist` (`docs/deploy-producao.md`).
- Rótulos de derivação de chave: `mesa-recovery-v1` (`frontend/src/crypto/recovery.ts`) e `mesa-invite-seed-v1` (`frontend/src/crypto/inviteSeed.ts`). `frontend/scripts/contracts/reference.mjs` e `npm run test:contracts` já comparam a implementação com valores de referência.
- A pasta `userData` do Electron e o `localStorage` do cliente desktop derivam do nome da aplicação e da origem `mesa://app`.

## Goals / Non-Goals

**Goals:**
- Texto visível, instaladores e pacotes deixam de dizer Mesa.
- O app novo não deixa o Mesa antigo instalado ao lado.
- Nenhum deploy desliga o modo produção por esquecer de renomear uma variável.
- Nenhuma chave criptográfica ou armazenamento de chaves E2E é invalidado.

**Non-Goals:**
- Preservar sessão e URL da instância do cliente desktop (o usuário informa de novo; aceito).
- Compatibilidade de variáveis `MESA_*` (removida de vez).
- Renomear usuário, diretórios e unit do servidor atual, ou o repositório.
- Migrar servidores já criados (o canal de voz existente continua a chamar-se `mesa`).
- Definir o desenho do logo (entrada externa).

## Decisions

1. **Intocáveis.** Não se renomeiam, com a justificativa:
   - `mesa-recovery-v1` e `mesa-invite-seed-v1`: separação de domínio na derivação de chaves. Trocar muda as chaves derivadas e invalida recovery keys e convites. Fixados por teste em `test:contracts` (tarefa 4.4).
   - Chaves `mesa.*` do `localStorage` (`mesa.channelKey.<id>`, `mesa.instance.*`, `mesa.locale`, `mesa.theme`, …): renomear apaga as chaves E2E locais dos usuários do cliente web.
   - Protocolo `mesa://`: define a origem do `localStorage` no desktop.
   - Canais IPC `mesa:*`, global `__MESA_NATIVE__` e header `x-mesa-media-type`: contratos internos sem ganho visível; mudar exige publicar cliente e servidor juntos.
   Uma busca e troca de "mesa" nunca é aceitável; a tarefa 4.1 exige revisão linha a linha.
2. **`appId` novo `com.parley.desktop`.** Alternativa: manter `com.mesa.desktop` para o instalador do Windows atualizar no lugar. Rejeitada pelo autor. Consequência: Mesa e Parley coexistem até a limpeza (decisão 3). No macOS, o bundle id novo também faz o sistema pedir de novo as permissões de câmara e microfone.
3. **Limpeza da instalação anterior na primeira execução do app.** Alternativas: (a) hook do instalador NSIS (`customInit`/`customInstall`) que executa o desinstalador do Mesa antes de instalar o Parley; é mais determinístico no Windows (corre elevado quando preciso e antes de o app abrir), mas só cobre Windows e exige script NSIS próprio; (b) apenas documentar a desinstalação manual. Escolhida a primeira execução porque cobre as três plataformas com o mesmo mecanismo e corre no contexto do usuário. Regras:
   - Só em app empacotado (nunca em dev) e só uma vez: um arquivo de marca em `userData` do Parley é gravado depois de qualquer resposta ou falha.
   - Pergunta primeiro com diálogo nativo ("Remover o Mesa instalado?"); sem resposta afirmativa, não remove e a marca é gravada.
   - Nunca falha nem atrasa a abertura: roda depois de a janela abrir, com erros só registrados em log, e uma falha mostra as instruções manuais.
   - Nunca toca no próprio app: ignora qualquer instalação cujo caminho seja o do executável em execução.
   - A pasta de dados do Mesa (`%APPDATA%\Mesa`, `~/Library/Application Support/Mesa`, `~/.config/Mesa`) **não** é apagada.
   - **Windows:** localizar a chave de desinstalação do app anterior em `HKCU` e `HKLM` (`SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall`) e executar o desinstalador em modo silencioso. A chave exata e o argumento silencioso são capturados numa instalação real do Mesa antes de implementar (tarefa 1.1). Instalação por MSI ou por máquina (`HKLM`) pode exigir elevação: nesse caso o app mostra o passo manual e não tenta.
   - **macOS:** remover `/Applications/Mesa.app` e `~/Applications/Mesa.app`; se a remoção falhar por permissão, mostrar o passo manual.
   - **Linux:** remover o AppImage `~/.local/bin/mesa-chat-app.AppImage`, o atalho `~/.local/share/applications/mesa.desktop` e o ícone `~/.local/share/icons/mesa-chat-app.png` (os três criados pelo `install-mesa.sh`). Pacotes `.deb`/`.rpm` exigem root: o app só informa o comando (`sudo apt remove mesa-chat-app` ou `sudo dnf remove mesa-chat-app`).
   - **Se a primeira execução não for confiável** (por exemplo, o desinstalador silencioso falha na prática ou o app é lançado em ambiente restrito): mover a parte do Windows para o instalador NSIS e deixar o app só com macOS e Linux. A tarefa 2.4 decide isso a partir do teste manual no Windows.
4. **Variáveis `MESA_*` removidas sem leitura legada.** O backend lê só `PARLEY_*` e, em `Config`, devolve erro de partida se encontrar `MESA_PRODUCTION`, `MESA_ENV` ou `MESA_RATE_LIMIT_DISABLED`, com mensagem que cita o nome novo. Alternativa: manter o fallback com aviso. Rejeitada: com uma instância, a recusa explícita é mais simples e igualmente segura. No Vite e no Electron em desenvolvimento, as variáveis antigas são apenas ignoradas (sem risco de segurança).
5. **Pacotes Linux `parley-chat-app`.** `packageName`, `executableName`, `desktopName` e `artifactName` usam o sufixo. O nome `parley` sozinho colide com o pacote Parley do KDE (também ícone e `.desktop`). Windows e macOS usam `Parley`.
6. **Artefatos renomeados e scripts de instalação atualizados na mesma change.** O `.ps1` passa a filtrar por `Parley`. No macOS o `.sh` remove `Mesa.app` ao instalar. Um script antigo já copiado numa máquina deixa de achar o instalador; o README manda reexecutar a partir do repositório.
7. **Servidor atual não é renomeado.** Usuário `mesa`, `/opt/mesa`, `/etc/mesa` e a unit continuam. Só a documentação de novas instalações usa o nome novo. A única mudança no servidor é o conteúdo do `mesa.env`: `PARLEY_PRODUCTION` no lugar de `MESA_PRODUCTION` e o nome de exibição em `EMAIL_FROM` (que hoje deve citar o nome antigo). As variáveis da change `email-registration` (`EMAIL_*`, `PUBLIC_BASE_URL`, `REGISTO_MODO`, `TURNSTILE_*`) não têm prefixo `MESA_` e não são afetadas pela recusa de partida.
8. **Logo.** Aprovado e entregue em `docs/v2/parley_logo/` (opção D: urso cuja cabeça é um balão de conversa, com orelhas e olhos quadrados). Mestres: `parley-emblem`, `parley-logo` e `parley-mono`, cada um em SVG e PNG 1024 px RGBA. Os SVG não têm texto vivo (letras convertidas em curvas) nem gradientes. Regra do PNG monocromático: só se recolore pela máscara alfa ou pelo SVG, nunca pintando o retângulo inteiro, para preservar os olhos vazados. A pasta `docs/v2/parley_logo/mascote/` (ilustrações do personagem com fundo escuro embutido) **não** é fonte de ícones e fica fora desta change; é material para um uso futuro, como tela de boas-vindas. O conjunto de ícones nativos é gerado dos mestres por um passo documentado e reproduzível. Observado: o ImageMagick da máquina de desenvolvimento grava `.ico` mas não `.icns`, e não há `png2icns`; o caminho do macOS é definido na tarefa 5.2. As pastas `android/` e `ios/` de `frontend/electron/icons/` não são referenciadas pelo build (sobra do Tauri) e saem do conjunto. `verify-icons.mjs` hoje só valida o mapa de ícones de UI; o check dos arquivos do app é um acréscimo.
9. **Versão 1.4.0** (minor): muda nome de instaladores e variáveis.

## Risks / Trade-offs

- [Rótulo criptográfico trocado por engano] → declarado intocável; teste em `test:contracts` falha se mudar.
- [Backend de produção parte sem modo produção] → recusa de partida com `MESA_*`; runbook edita `mesa.env` antes do restart.
- [Limpeza remove algo errado] → confirmação do usuário, só caminhos e chaves do Mesa, nunca o executável em execução, dados preservados. No Windows, o desinstalador só é executado se a chave de registro corresponder ao critério fixado na tarefa 1.1 (nome da chave e `DisplayName` do Mesa), para nunca rodar o desinstalador de outro programa.
- [Desinstalador NSIS assíncrono, ou Mesa em execução] → o desinstalador costuma reexecutar-se de uma cópia temporária, então o retorno do processo não prova que terminou, e ele falha se o Mesa estiver aberto. O sucesso é confirmado pelo estado (chave de registro e pasta ausentes após espera com limite de tempo); o diálogo pede para fechar o Mesa antes; se o limite estoura, cai no passo manual. Se isso não for confiável no teste da tarefa 2.4, aplica-se o plano B do NSIS (decisão 3).
- [`.icns` e instaladores só no CI] → o ambiente de desenvolvimento é Linux; os ícones de macOS e Windows e os instaladores NSIS/MSI só são exercitados no runner do CI, com uma tag de teste (tarefa 6.2). O `electron-builder --dir` local cobre só Linux.
- [Desinstalador do Windows não roda silencioso, ou exige elevação] → mostrar passo manual; plano B é o hook do NSIS (decisão 3).
- [Dois apps instalados até a limpeza] → esperado; a limpeza e o README cobrem.
- [Pasta de dados antiga fica órfã] → documentado no README, apagável à mão.
- [Colisão de marca ou com o Parley do KDE] → checagem na tarefa 1.2 antes de publicar.
- [Ícone ilegível pequeno] → o emblema dentro do disco já foi visto legível a 16 px (orelhas e olhos); confirmar nas capturas da tarefa 5.4, com aprovação do autor.
- [Conflito com a change `email-registration` em andamento] → o mesmo working tree (12 tarefas feitas, 10 pendentes, sem commit) já modifica arquivos que este rebrand também edita: `backend/src/config.rs`, `backend/tests/contract/production_boot.rs`, `README.md`, `docs/deploy-producao.md`, `docs/operar-instancia.md`, `frontend/package.json`, os catálogos `frontend/src/i18n/catalogs/en.ts` e `pt-BR.ts` e `frontend/src/pages/Auth.tsx`, além de `backend/src/email_templates.rs` (novo). Implementar este rebrand **depois** de `email-registration` estar concluída e commitada, ou fazer rebase antes.
- [Textos de e-mail novos com o nome antigo] → as changes `email-registration`, `email-password-reset` e `email-key-reminders` criam assuntos e corpos de e-mail; a varredura de nome (tarefas 4.1 e 4.3) inclui esses textos.

## Migration Plan

0. Pré-condição: `email-registration` concluída e commitada (ou rebase feito) antes de começar os grupos 3, 4, 6 e 7, que editam os mesmos arquivos (lista em Risks).
1. Antes do deploy: editar `/etc/mesa/mesa.env` na instância (`MESA_PRODUCTION` para `PARLEY_PRODUCTION`, e o nome de exibição de `EMAIL_FROM`), então publicar o backend novo, reiniciar e verificar `systemctl status` e o log.
2. Publicar o frontend (`dist`) e a release desktop 1.4.0.
3. Cada máquina desktop: instalar o Parley, abrir, confirmar a remoção do Mesa, informar a instância e entrar de novo.
4. Rollback do backend: restaurar a versão anterior e o `mesa.env` (o dado do SQLite não muda).

## Open Questions

- Nenhuma que mude escopo ou tarefas.
