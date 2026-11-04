# Proposal

## Why

O produto passa de **Mesa** para **Parley**. O nome atual colide com a biblioteca gráfica Mesa 3D (já forçou o prefixo `mesa-chat-app` nos pacotes Linux) e não funciona em inglês como marca. Parley é curto, funciona em PT e EN e descreve o uso (conversa para combinar algo). O logo muda junto: o novo (urso com cabeça em forma de balão de conversa) já está aprovado e entregue em `docs/v2/parley_logo/`.

Premissa do autor: há **uma única instância** em produção (chat.1nodado.com.br) e **só usuários de teste**, então não é preciso manter compatibilidade com instalações de terceiros. Trocar tudo que o usuário vê, e também os identificadores de empacotamento e as variáveis de ambiente, é aceitável. O que **não** se troca é o que quebraria criptografia ou chaves já guardadas (ver design.md, "Intocáveis").

## What Changes

- Texto visível passa a "Parley": catálogos i18n (pt-BR e en), `<title>`, `alt` do logo, README, nome do produto, copyright, descrições de pacote, permissões de câmara e microfone do macOS, notas da release, scripts de instalação.
- Logo e ícones novos: `logo.png`, `emblem.png`, `favicon.png`, `apple-touch-icon.png` e o conjunto em `frontend/electron/icons/`.
- Backend: User-Agent do unfurl, prefixo do arquivo de gravação e canal de voz criado por omissão passam a Parley. Servidores já criados mantêm o nome que têm.
- Recovery key baixada passa a `parley-recovery-key.txt`.
- **BREAKING** `appId` passa de `com.mesa.desktop` a `com.parley.desktop`. O sistema trata o app novo como outro programa: Mesa e Parley coexistiriam instalados.
- **Limpeza da instalação anterior**: na primeira execução, o Parley procura uma instalação do Mesa, pergunta ao usuário e a remove (escopo e limites por plataforma no design). A pasta de dados do Mesa não é apagada.
- **BREAKING** Variáveis de ambiente passam de `MESA_*` a `PARLEY_*`, sem leitura legada. O backend **recusa partir** se encontrar `MESA_PRODUCTION`, `MESA_ENV` ou `MESA_RATE_LIMIT_DISABLED`, para não desligar o modo produção em silêncio.
- **BREAKING** Pacotes Linux e artefatos passam a `parley-chat-app` / `Parley-…` (o nome `parley` sozinho colide com o pacote Parley do KDE).
- A pasta de dados do Electron **não** é fixada: ela segue o nome novo e o usuário informa a instância e entra de novo uma vez. Perdem-se só as cópias locais do desktop (sessão e chaves de canal de voz coladas à mão); as chaves de servidor voltam pelo login, e a pasta antiga fica no disco (design, decisão 10).
- **Intocáveis** (continuam `mesa`): rótulos criptográficos `mesa-recovery-v1` e `mesa-invite-seed-v1`; chaves `mesa.*` do `localStorage`; protocolo `mesa://`; canais IPC `mesa:*`; header `x-mesa-media-type`; global `__MESA_NATIVE__`. Specs, docs e changes históricas também ficam.
- Guarda automático `npm run verify:brand`: falha com qualquer «Mesa/mesa» visível fora da lista de intocáveis.
- Documentação operacional e release: `docs/deploy-producao.md`, `docs/operar-instancia.md`, `docs/desktop-release.md`, `CHANGELOG.md`, versão 1.4.0.
- Deploy na instância real com runbook (editar `/etc/mesa/mesa.env` antes de reiniciar). Usuário de sistema, diretórios e unit do servidor atual não são renomeados.

## Capabilities

### New Capabilities
- `desktop/legacy-install-cleanup`: o shell desktop detecta uma instalação anterior do Mesa na primeira execução e a remove com confirmação, sem apagar dados.
- `instance/environment-variables`: a configuração por variáveis de ambiente usa o prefixo `PARLEY_` e o backend recusa partir quando encontra as variáveis `MESA_*` descontinuadas.

### Modified Capabilities
- `frontend-v2/brand-identity`: marca e nome passam a Parley; identificadores internos e rótulos criptográficos ficam declarados como imutáveis.
- `desktop/shell`: ícone e nome de apresentação da aplicação passam a Parley.
- `desktop/updates`: os scripts de instalação continuam a localizar o instalador após o rename dos artefatos, e a entrada de menu e as mensagens usam o nome novo.

## Impact

- Frontend: `frontend/src/i18n/catalogs/*`, `frontend/index.html`, `frontend/src/components/ui/Logo.tsx`, `frontend/src/assets/logo.png` e `emblem.png`, `frontend/public/*`, `frontend/vite.config.ts`, `frontend/package.json` (script `electron:dev`), download da recovery key, `frontend/scripts/verify-icons.mjs`.
- Electron: `frontend/electron/main.ts` (limpeza da instalação anterior e `ELECTRON_DEV`), `frontend/electron-builder.yml`, `frontend/electron/package.json`, `frontend/electron/icons/**`.
- Backend: `backend/src/config.rs`, `api/servers.rs`, `api/unfurl.rs`, `api/voice.rs`; testes de contrato (`servers.rs`, `channels.rs`).
- CI e distribuição: `.github/workflows/desktop-release.yml`, `scripts/install-mesa.sh`, `scripts/install-mesa.ps1`, `README.md`, `CHANGELOG.md`.
- Docs operacionais: `docs/deploy-producao.md`, `docs/operar-instancia.md`, `docs/desktop-release.md`. Também `docs/contratos-e-fluxos.md`, `docs/arquitetura-tecnica.md` e `infra/.env.example`.
- Produção: o arquivo de ambiente da instância atual (documentado como `/etc/mesa/mesa.env`, com `systemd`) e a topologia real de entrada do tráfego, ainda por confirmar (backlog, item 20).
- Logo: mestres aprovados em `docs/v2/parley_logo/` (SVG e PNG 1024); a change gera os ícones derivados deles.
- Ordem: a pré-condição (as changes de e-mail e de onboarding commitadas e arquivadas, `0a3ba79`) está cumprida. A pesquisa de colisão do nome (tarefa 1.2) vem antes de qualquer implementação.
