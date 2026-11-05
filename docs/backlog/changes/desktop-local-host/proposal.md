# Proposal

## Why

Hoje, para ter uma instância do Parley, alguém precisa montar um servidor na internet. Queremos que quem usa o app desktop possa, a partir do próprio cliente, iniciar uma instância local na sua máquina, à qual outras pessoas se conectem, desde que o anfitrião tenha IP e portas alcançáveis (modelo análogo ao FoundryVTT, que roda como aplicativo local ou como servidor dedicado). Voz e vídeo, que são o núcleo do Parley, **fazem parte** da primeira versão: sem eles o host local não faz sentido.

Esta change é a terceira da sequência `parley-server-standalone` → `instance-settings` → `desktop-local-host`. Depende da primeira (o `chat-backend` com `STATIC_DIR`, `LIVEKIT_MANAGED`, TLS embutido e desligamento ordenado) e da segunda (primeiro arranque automático, token de configuração e tela de configurações do administrador). O shell continua sendo Electron: o problema que levou ao abandono do Tauri foi o motor de webview (WebKitGTK), não a linguagem, e reescrever o cliente em Rust não simplifica o host local.

## What Changes

- **Modo «Hospedar» no app desktop**: nova área no cliente para ligar e desligar uma instância local. O processo principal do Electron (`host-manager`, novo) define o diretório de dados em `userData/host/` (`--data-dir`), gera o token de configuração inicial e lança o `chat-backend` empacotado como processo filho, que por sua vez gerencia o LiveKit. O app não reimplementa lógica de servidor em Node. O primeiro arranque, a configuração e a conta de administrador são da `instance-settings`; o app só entrega o token ao cliente do próprio dono, que cai direto no cadastro guiado do administrador sem digitá-lo.
- **Binários**: o `chat-backend` vai dentro do instalador (build por plataforma no `desktop-release.yml`); o `livekit-server` é **baixado sob demanda** na primeira vez que a pessoa liga a hospedagem, com SHA-256 verificado, para não engordar o instalador de quem nunca hospeda.
- **Entrada pelo app (etapa A)**: quem se conecta usa o app Parley desktop com `IP:porta`. O servidor local fala **HTTPS** com certificado autoassinado (`TLS_MODE=self`); o cliente o aceita **somente** se a impressão digital SHA-256 do certificado coincidir com a contida no convite (certificado fixado). `http://` continua recusado; o requisito de `instance-connect` ganha apenas a aceitação desse certificado fixado, sem enfraquecer a validação das demais instâncias. TLS público e entrada pelo navegador ficam como evolução plugável (etapa B), usando `TLS_MODE=acme` do servidor.
- **Configuração pela tela do administrador**: o app não tem uma tela de configuração própria. A área «Hospedar» mostra estado, portas, convite e diagnóstico e leva a «Configurações da instância» (registro, e-mail, voz, convites), a mesma tela de qualquer instância. O host-manager fixa por variável apenas o que o app precisa controlar (porta, `TLS_MODE=self`, `LIVEKIT_MANAGED`, perfil de produção e `COOKIE_SECURE`), campos que aparecem travados na tela.
- **Convite de hospedagem**: o anfitrião copia um convite com endereço, porta e impressão digital do certificado; o convite existente de conta/servidor continua como hoje.
- **Diagnóstico de alcance**: tela que informa IP local/público detectável e testa se a porta TCP do servidor responde de fora (a UDP de mídia só é confirmada por um teste de chamada com outra pessoa), com mensagens claras para NAT, CGNAT e firewall. O app não abre portas por conta própria.
- **Ciclo de vida**: o servidor roda enquanto o app estiver aberto; o comportamento ao fechar a janela (parar, manter na bandeja ou virar serviço) é uma decisão em aberto desta change, com recomendação de manter na bandeja do sistema e encerrar só por «Sair».
- **Não entram**: reescrever o cliente em Rust; serviço de sistema independente do app; resolução automática de NAT (UPnP) como requisito; entrada pelo navegador com certificado público como fluxo completo; descoberta automática na LAN; migração de uma instância existente para dentro do app.

## Capabilities

### New Capabilities
- `desktop/local-host`: ligar, desligar e monitorar a instância local pelo app; dados em `userData/host/`; binários do servidor e download verificado do LiveKit; convite com endereço e impressão digital; diagnóstico de alcance; comportamento ao fechar o app.

### Modified Capabilities
- `frontend-v2/instance-connect`: aceitar o endereço de um convite de self-host (`https://IP:porta` com impressão digital) e validar o certificado autoassinado por essa impressão digital, mantendo HTTPS e certificado válido obrigatórios para as demais instâncias.
- `desktop/shell`: o processo principal passa a gerenciar processos filhos, bandeja do sistema e permissões de rede/escuta; a janela continua sem navegar para conteúdo de terceiros.
- `desktop/packaging`: o instalador inclui o `chat-backend` por plataforma.

## Impact

- **Electron** (`frontend/electron`): novo `host-manager`, IPC e preload para o estado do host, bandeja do sistema, verificação de certificados fixados (`setCertificateVerifyProc`) restrita ao host e à impressão digital do convite.
- **Frontend** (`frontend/src`): tela de hospedagem, convite, diagnóstico, ajustes em `InstanceConnect`; catálogos `pt-BR` e `en`.
- **Empacotamento e release**: `electron-builder.yml` (recursos extras por plataforma), `.github/workflows/desktop-release.yml` (compilação do `chat-backend` nas três plataformas e arquiteturas suportadas).
- **Segurança**: superfície nova (porta escutando na máquina do anfitrião); permissão local de rede, escuta apenas quando o host está ligado, nada ligado por padrão.
- **Depende de** `parley-server-standalone` e `instance-settings`; interage com `desktop-self-update` (atualizar o app atualiza o servidor embutido; o servidor para antes de `quitAndInstall`).
- **Sem impacto** na produção atual nem no formato do banco.
