# Design

## Context

Motivação e escopo em `proposal.md`; requisitos em `specs/`. Terceira da sequência `parley-server-standalone` → `instance-settings` → `desktop-local-host`. Depende da standalone (`LIVEKIT_MANAGED`, proxy `/rtc`, `TLS_MODE=self` com impressão digital estável, desligamento ordenado) e da `instance-settings` (primeiro arranque automático, token de configuração, tela do administrador); coordena-se com `desktop-self-update`.

Estado atual relevante:

- `frontend/electron/main.ts`: janela carregando o pacote por `mesa://app` com `webSecurity: false`; o token da instância é injetado por `session.webRequest.onBeforeSendHeaders` para a `baseUrl` guardada; `setCertificateVerifyProc` só existe em desenvolvimento (loopback). A instância (`baseUrl`, `sessionToken`) é guardada em `userData/mesa-instance.json`.
- `InstanceConnect` valida o endereço por `GET /health` e hoje recusa `http://`.
- O app sai quando todas as janelas fecham (`window-all-closed`); não há bandeja.
- `electron-builder.yml` empacota `dist/**` e `electron/dist/**`; não há recursos extras por plataforma.

## Goals / Non-Goals

**Goals:**
- Ligar/desligar uma instância local pelo app, com voz e vídeo, e convidar pessoas por um convite com certificado fixado.
- Nenhuma lógica de servidor em Node: o app só supervisiona o processo do servidor.
- Nada escuta, baixa ou roda sem ação explícita.

**Non-Goals:**
- Serviço do sistema, UPnP, descoberta na LAN, entrada pelo navegador (etapa B), migrar instância existente para dentro do app.

## Decisions

### D1. `host-manager` no processo principal
Módulo `frontend/electron/host-manager.ts` com uma máquina de estados (`off → starting → on | error → stopping → off`). Ao ligar: garante `userData/host/`, inicia `chat-backend --data-dir userData/host` (o primeiro arranque automático e o token são da `instance-settings`) com as variáveis fixas `TLS_MODE=self`, `LIVEKIT_MANAGED=1`, `SERVE_FRONTEND=off` (o binário do host é compilado sem o frontend embutido e a variável evita o padrão de instalação nova), `PARLEY_PRODUCTION=1`, `COOKIE_SECURE=true`, a porta escolhida e `PARLEY_SETUP_TOKEN` gerado pelo app (esses campos aparecem travados na tela de configurações), `STATIC_DIR` desligado (o cliente é o próprio app), e espera `GET https://127.0.0.1:<porta>/health` com a impressão digital do certificado local. Registra a saída do processo em `userData/host/logs/`. A lógica de decisão (porta, variáveis, estado) fica em funções puras testáveis.
*Alternativa descartada:* hospedar o servidor dentro do Node (portar a lógica). Duplicaria o backend.

### D2. Portas e endereço
Porta TCP do servidor fixa por padrão (ex.: `8443`), configurável; se estiver ocupada, falha com erro claro em vez de trocar de porta (o convite depende da porta). Mídia: uma porta UDP e uma TCP de recurso (D7 da change 1), configuráveis e mostradas na tela. O servidor escuta em todas as interfaces **somente** enquanto ligado; desligado, nenhuma porta.

### D3. Dados em `userData/host/`
Banco, anexos, avatares, chaves LiveKit, certificado TLS e binário do LiveKit em `userData/host/`, separado do JSON do cliente. Desligar preserva tudo; um botão «Apagar dados da hospedagem» exige confirmação.

### D4. Binário do servidor como recurso extra do instalador
`electron-builder.yml` ganha `extraResources` por plataforma/arquitetura apontando para `server/<plataforma>-<arch>/chat-backend[.exe]` (compilado no workflow de release, change 1 D11). No Linux AppImage o recurso fica em `process.resourcesPath` (somente leitura, executável) e é copiado para `userData/host/bin/` na primeira execução se precisar de permissão de execução fora do mount. A versão do servidor é lida na inicialização e comparada com a do app; divergência bloqueia ligar com mensagem clara.

### D5. LiveKit sob demanda, no próprio servidor
O download e a verificação do `livekit-server` são do `LIVEKIT_MANAGED` (change 1 D4). O host-manager apenas mostra a necessidade e o tamanho, pede confirmação e repassa o progresso (saída do servidor ou endpoint de estado local) à tela. Falha de download ou de integridade deixa a hospedagem no ar só com texto, com aviso.

### D6. Convite e certificado fixado
Formato do convite: `parley://host:porta/?fp=<sha256-hex>` (URL copiável). Gerado a partir do endereço escolhido (público detectado ou digitado) e da impressão digital do `tls-fingerprint` do servidor. Não contém segredos. Quem cola o convite em `InstanceConnect` tem `https://host:porta` e a impressão digital guardadas em `mesa-instance.json` (`pinnedFingerprint`).

### D7. Verificação do certificado fixado no Electron
`session.defaultSession.setCertificateVerifyProc` passa a existir também em produção: para o host:porta da instância guardada **com** impressão digital fixada, aceita se o SHA-256 do certificado folha coincide; para qualquer outro, delega à verificação padrão (`callback(-3)` só quando não há fixação e o certificado é inválido, via resultado do verificador do Chromium). Cobre REST, WebSocket e `/rtc`, por serem a mesma origem. O mídia WebRTC usa DTLS próprio e não depende desse certificado.
*Alternativa descartada:* aceitar qualquer certificado autoassinado para IPs privados. Enfraqueceria a validação para todas as instâncias.

### D8. Diagnóstico de alcance
(a) Endereço local e público: interfaces de rede locais; o público por uma consulta HTTPS a um serviço de eco configurável. (b) Verificação de fora da porta TCP: um endpoint de sondagem na instância oficial que **conecta somente de volta ao IP de quem pediu**, nas portas permitidas, com limite de pedidos; nunca aceita destino arbitrário (evita uso como scanner/SSRF). (c) UDP de mídia: não verificável de fora; a tela explica e oferece o teste de chamada com outra pessoa. O endpoint de sondagem exige uma pequena mudança no backend da instância oficial (parte desta change).
*Alternativa descartada:* sondagem por serviço de terceiros. Introduz dependência e envio de dados a quem não controlamos.

### D9. Ciclo de vida e bandeja
`Tray` do Electron enquanto o host está ligado. Ao fechar a janela com host ligado: diálogo «Manter na bandeja» / «Encerrar», com «lembrar escolha». `before-quit` encerra o servidor de forma ordenada (sinal de término, espera, depois `kill`) e só então deixa o app sair. Interação com `desktop-self-update`: `restartForUpdate` chama o mesmo encerramento ordenado antes de `quitAndInstall`; atualizar o app atualiza o servidor embutido.

### D10. Ponte mínima com a janela
`preload.ts` expõe apenas `hostState()`, `onHostState()`, `hostStart()`, `hostStop()`, `hostInvite()`, `hostDiagnose()` e `hostSetupToken()`. Nenhuma execução arbitrária de processo; argumentos do servidor vêm de constantes e de configuração validada no processo principal.

### D11. Interface
Rota «Hospedar» (acessível no app nativo): estado, botão ligar/desligar, portas em uso, aviso de exposição, convite com «Copiar», diagnóstico, consumo/ações de dados. Textos nos catálogos `pt-BR` e `en`.

### D12. Entrega do token ao cliente do dono
O `host-manager` gera o token de configuração (32 bytes aleatórios), passa-o ao servidor por `PARLEY_SETUP_TOKEN` e o mantém só em memória. Ao ligar a hospedagem pela primeira vez, o app guarda a instância local (`https://127.0.0.1:<porta>` com a impressão digital do certificado, D7) como a instância ativa do dono; o cliente, ao encontrar essa instância em configuração inicial, chama `hostSetupToken()` e preenche o campo do token do cadastro guiado. O método só responde enquanto a instância local está em configuração e para a janela do próprio app; depois que o administrador existe, devolve vazio e o token deixa de existir. O token nunca é gravado em disco pelo app nem aparece no convite.
*Alternativa descartada:* o dono copiar o token do log. É atrito desnecessário para quem usa o app.

## Risks / Trade-offs

- [Processo filho órfão se o app morrer] → `before-quit`, `will-quit` e um arquivo de PID em `userData/host/` limpo no próximo arranque.
- [Segurança da porta exposta na máquina do anfitrião] → desligada por padrão, só quando ligado, `PARLEY_PRODUCTION`, registro fechado por padrão (convites), aviso na tela.
- [Fixação do certificado: se o anfitrião regenera o certificado, os convites antigos quebram] → certificado persistido em `userData/host/`; «Apagar dados» avisa que invalida os convites.
- [CGNAT/NAT impedem o alcance] → diagnóstico explica; o app não resolve.
- [Dependência da instância oficial para a sondagem de TCP] → degrada com mensagem («não foi possível testar»); o resto funciona.
- [Binário do servidor para 3 sistemas × arquiteturas aumenta o CI] → começar por Linux x64, Windows x64, macOS arm64/x64 e registrar o que ficar de fora.

## Migration Plan

1. Entregar depois de `parley-server-standalone`. Sem impacto em quem não liga a hospedagem.
2. Primeira versão com o recurso ≥ 1.6.x; sem migração de dados.
3. Rollback: desligar a hospedagem; remover a rota é suficiente, os dados em `userData/host/` não são tocados.
