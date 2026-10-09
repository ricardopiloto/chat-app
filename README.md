# Mesa

**Chat e vídeo self-hosted**, no espírito do Discord, com **composição nativa de câmeras** e **criptografia ponta a ponta (E2EE) por omissão**.

Pensado para mesas de RPG que gravam ou transmitem sessões, e para qualquer grupo pequeno que queira uma instância própria, sem federação e sem o servidor a ler o conteúdo das conversas.

| | |
|--|--|
| **Estado** | Backend `1.1.0` · Frontend `1.1.0` (cliente v2 em `frontend/`; ver [CHANGELOG.md](CHANGELOG.md)) |
| **Stack** | Backend Rust (Axum + SQLite) · Frontend **v2** SolidJS (Vite, Tailwind) · LiveKit (voz/vídeo) |
| **Frontend** | [`frontend/`](frontend/) é o cliente atual (v2). A versão 0.8.1 da v1 permanece no histórico Git para rollback |
| **Operação** | [docs/operar-instancia.md](docs/operar-instancia.md) · [docs/deploy-producao.md](docs/deploy-producao.md) |
| **Integração** | [docs/contratos-e-fluxos.md](docs/contratos-e-fluxos.md) |
| **Arquitetura** | [docs/arquitetura-tecnica.md](docs/arquitetura-tecnica.md) |
| **Produto** | [docs/product-brief.md](docs/product-brief.md) |

> Este README descreve a **v2**. A versão anterior do documento (centrada na v1) está em [`docs/archive/README-v1.md`](docs/archive/README-v1.md).

## Índice

1. [A ideia](#a-ideia)
2. [Funcionalidades](#funcionalidades)
3. [Telas](#telas)
4. [Arquitetura](#arquitetura)
5. [Criptografia (E2EE)](#criptografia-e2ee)
6. [Reset de senha](#reset-de-senha)
7. [Contratos Frontend ↔ Backend](#contratos-frontend--backend)
8. [Fluxos de integração](#fluxos-de-integração)
9. [Arranque rápido (dev)](#arranque-rápido-dev)
10. [Estrutura do repositório](#estrutura-do-repositório)
11. [Distribuição desktop](#distribuição-desktop)
12. [Fora de escopo e diferido](#fora-de-escopo-e-diferido)

---

## A ideia

Quem precisa de **chat + chamada** e, ao mesmo tempo, de **composição visual** (quem aparece onde na cena) costura hoje duas ferramentas: um chat tipo Discord e um programa de transmissão. A Mesa junta as duas, numa instância que o próprio grupo controla.

1. **Instância**: o processo que o operador corre (máquina local ou VPS). Hospeda vários **Servidores**.
2. **Servidor**: unidade social (dono, cargos, canais, convites, membros).
3. **Canal**: **texto** ou **voz/vídeo**. O canal de voz tem palco com composição de câmeras (cena).

Não há federação entre instâncias: o que corre na tua máquina fica na tua máquina. A primeira conta registada é o operador inicial; as seguintes entram por convite.

**Porquê self-host?** O operador escolhe onde vivem metadados e ficheiros; SQLite embutido e poucas portas (API, LiveKit, TURN) permitem subir uma mesa em menos de 30 minutos; não há rede social global nem diretório obrigatório.

---

## Funcionalidades

Lista do que o cliente atual faz hoje. A checklist de paridade está em [`docs/v2/parity-checklist.md`](docs/v2/parity-checklist.md); o comportamento exigido está nos specs em [`openspec/specs/frontend-v2/`](openspec/specs/frontend-v2/).

### Conta e identidade
- Registo (handle e palavra-passe de 8+ caracteres), com código de convite quando não é a primeira conta (`/invite/:code` ou `?invite=`).
- Login, logout com confirmação, restauro de sessão ao recarregar, troca de conta.
- **Identidade criptográfica** gerada no navegador, protegida por um cofre cifrado com a palavra-passe (guardado no dispositivo e no servidor, sempre cifrado).
- Desbloqueio em dispositivo novo (cofre remoto) e **recuperação de identidade** (nova identidade) quando a palavra-passe do cofre se perde.
- **Esqueci a senha** (`/recover`): sem e-mail. Há alteração com a senha actual, chave de recuperação, ou código do operador. O passo a passo está em [Reset de senha](#reset-de-senha).
- Perfil: nome a mostrar, avatar (JPEG, PNG ou WebP até 1 MiB), idioma **pt-BR / en** e tema **Sistema / Claro / Escuro**, todos persistentes.

### Servidores, membros e cargos
- Criar servidor com **custódia da chave** obrigatória (cria também o canal de texto `geral` e o de voz `mesa`).
- Imagem do servidor, mensagem e canal de boas-vindas, apagar servidor confirmando o nome.
- Membros com pesquisa, mudança de cargo, remoção. **Cargos** com 12 permissões (ver canais, gerir canais, gerir cargos, criar convites, enviar mensagens, apagar mensagens, anexar ficheiros, mencionar @todos, remover membros, silenciar membros, ligar-se à voz, falar). Quem não tem cargo vê e escreve nos canais de texto e participa nos de voz; só um cargo, um canal privado ou o silenciamento reduzem isso, reordenação e cargo de sistema do dono.
- **Convites** em dois passos, pré-visualização sem sessão, aceitar com registo inline ou com sessão. Os novos links levam a chave do servidor selada no fragmento `#` (não enviado ao backend), permitindo entrar mesmo sem outro membro online; convites antigos continuam com handoff online.
- Painel de Membros com presença (online / offline) e aviso quando um convite é consumido.

### Canais e acesso
- Criar canal de texto ou voz (visibilidade pública ou privada, "visível a novos membros"), renomear inline (hífens, 32 caracteres), apagar (o último canal de cada tipo é protegido).
- **ACL por canal**: regras por membro, cargo ou todos, com efeito (permitir / negar) e nível (ler, escrever, ouvir, falar), mais um **inspector de acesso efetivo** que explica fator a fator.
- **Silenciar** membro num canal (5, 10, 15, 30 minutos ou outro valor) e dessilenciar.

### Chat de texto (E2EE)
- O corpo das mensagens é cifrado no cliente; o servidor recebe o *ciphertext* e os metadados necessários. Tempo real, agrupamento por remetente em intervalos de até 5 minutos, separadores de dia, saltar para o presente.
- Responder com citação, apagar por permissão, **menções** (`@`, e `@todos` para quem tem a permissão) e autocompletar de emoji (`:shortcode:`), selector de emoji.
- **Reações com emoji** em mensagens de texto, com anexos ou com citação: pills com contagem e autores, alternância por clique e sincronização em tempo real. A reação é metadado visível ao servidor, enquanto o corpo da mensagem permanece cifrado.
- **Anexos** de imagem (ficheiro ou colar), até 10 por mensagem e 5 MiB cada, cifrados no cliente, com *lightbox* (zoom, download, navegação).
- Pré-visualização de links (até 5 por mensagem).
- Marcar canal como lido e recuperar mensagens perdidas após reconexão.

### Pesquisa e notificações
- Pesquisa livre em todos os canais de texto, **decifrando no cliente**, com o atalho `#canal termo` e `Ctrl/Cmd+F`.
- Notificações persistentes de menção e resposta, marcar uma ou todas como lidas, *deep-link* para a mensagem, canais com novidade e indicadores por servidor.

### Voz e vídeo (LiveKit)
- **Pré-entrada** (*green room*): pré-visualização com blur, medidor do microfone, calibração de dispositivos, "No canal agora" e as ações *Entrar*, *Testar vídeo* (faixa sintética, sem tocar na câmera real) e *Entrar (ouvir)* para quem só pode ouvir.
- Controlos no painel do utilizador: microfone, ensurdecer, câmera, partilha de ecrã, terminar. Entrada só com áudio quando a câmera falha ou é negada.
- **Blur de fundo** em três níveis (sem, leve, forte), indicadores de fala sincronizados no palco, na grade e na sidebar, duração da chamada.
- **Vista Composição**: três layouts (Mestre em Destaque, Painel, Faixa), de 2 a 8 posições, faixa "No banco" para quem não tem posição. **Editor de cena** com arrastar-e-largar, número de posições e confirmação de alterações por guardar.
- **Vista Grade**: câmeras e partilhas de ecrã, com destaque de uma partilha (*spotlight*) sem interromper as transmissões.
- **PiP flutuante**: mini-player arrastável com encaixe nos 4 cantos, visível ao navegar para fora do canal; "Voltar ao palco" e terminar direto no PiP.
- **E2EE de canal de voz** com chip de estado, faixa permanente "E2EE desligada" (quem e quando) e **Religar E2EE** mediante a chave do canal, validada contra a cópia selada no servidor.
- Página **Áudio & Vídeo**: escolha de microfone, saída e câmera, medidor em tempo real, som de teste, pré-visualização e blur partilhado com a chamada.
- Entrar noutro canal de voz sai do anterior; apagar o canal ou o servidor encerra a chamada.

### Efeitos sonoros
- Dois sons curtos: **nova menção ou resposta** e **alguém entrou na chamada em que está**. Nunca são o único aviso, não tocam com o utilizador ensurdecido, usam a saída de áudio escolhida e falham em silêncio (autoplay recusado, ficheiro em falta).
- A menção não toca se o canal está aberto e a janela em foco; rajadas contam como um só toque.
- Interruptor e pré-escuta em **Áudio & Vídeo**; a escolha fica neste dispositivo. Os ficheiros vivem em `assets/audio/` e são copiados para `frontend/public/audio/` quando o Vite arranca.

### Transversal
- Responsivo (gaveta abaixo de 768 px, sem scroll horizontal), modo claro e escuro com contraste verificado, português (pt-BR) e inglês, menu de contexto por clique direito e toque longo, faixa de reconexão do WebSocket, estados vazios e de erro por lista, diálogos com `Esc`.

---

## Telas

Capturas reais da v2 (tema escuro, pt-BR) em [`docs/v2/fidelity/`](docs/v2/fidelity/). Cada tela foi comparada com o seu mockup em [`docs/v2/mesa_*`](docs/v2/).

### Entrada e conta

| Entrar / criar conta | Desbloqueio do cofre | Menu da conta |
|:--:|:--:|:--:|
| ![Login](docs/v2/fidelity/frontend-v2-auth-shell/login.png) | ![Desbloqueio](docs/v2/fidelity/frontend-v2-auth-shell/unlock-local.png) | ![Menu da conta](docs/v2/fidelity/frontend-v2-auth-shell/account-menu.png) |

### Shell e chat de texto

| Shell com canais e Membros | Chat com respostas, menções e anexos |
|:--:|:--:|
| ![Shell](docs/v2/fidelity/frontend-v2-auth-shell/shell.png) | ![Chat](docs/v2/fidelity/frontend-v2-text-chat/chat-topo.jpg) |

| Pesquisa global | Notificações | Lightbox de anexos |
|:--:|:--:|:--:|
| ![Pesquisa](docs/v2/fidelity/frontend-v2-text-chat/pesquisa.jpg) | ![Notificações](docs/v2/fidelity/frontend-v2-text-chat/notificacoes.jpg) | ![Lightbox](docs/v2/fidelity/frontend-v2-text-chat/lightbox.jpg) |

### Administração do servidor

| Cargos e permissões | Membros | Convidar (passo 1) |
|:--:|:--:|:--:|
| ![Cargos](docs/v2/fidelity/frontend-v2-server-admin/cargos-lista.jpg) | ![Membros](docs/v2/fidelity/frontend-v2-server-admin/membros.jpg) | ![Convidar](docs/v2/fidelity/frontend-v2-server-admin/convidar-passo1.jpg) |

| Permissões do canal (ACL) | Inspetor de acesso | Criar canal de voz com custódia |
|:--:|:--:|:--:|
| ![ACL](docs/v2/fidelity/frontend-v2-server-admin/permissoes-canal.jpg) | ![Inspetor](docs/v2/fidelity/frontend-v2-server-admin/inspecionar-acesso.jpg) | ![Canal de voz](docs/v2/fidelity/frontend-v2-server-admin/criar-canal-voz.jpg) |

### Voz e vídeo

As câmeras verdes são o dispositivo de vídeo falso do Chromium usado nos testes.

| Pré-entrada (*green room*) | Palco em Composição |
|:--:|:--:|
| ![Green room](docs/v2/fidelity/frontend-v2-voice-video/green-room.png) | ![Composição](docs/v2/fidelity/frontend-v2-voice-video/stage-composicao.png) |

| Editor de cena | Grade |
|:--:|:--:|
| ![Editor de cena](docs/v2/fidelity/frontend-v2-voice-video/editor-mestre.png) | ![Grade](docs/v2/fidelity/frontend-v2-voice-video/grade-1280.png) |

| Grade com partilha e destaque | PiP flutuante |
|:--:|:--:|
| ![Partilha](docs/v2/fidelity/frontend-v2-voice-video/grade-share-1280.png) | ![PiP](docs/v2/fidelity/frontend-v2-voice-video/pip-1600.png) |

| E2EE desligada (modo claro) | Religar E2EE | Áudio & Vídeo |
|:--:|:--:|:--:|
| ![Faixa](docs/v2/fidelity/frontend-v2-voice-video/review-claro-e2ee-faixa.png) | ![Diálogo](docs/v2/fidelity/frontend-v2-voice-video/review-escuro-e2ee-dialogo.png) | ![Áudio e Vídeo](docs/v2/fidelity/frontend-v2-voice-video/av-968.png) |

---

## Arquitetura

```mermaid
flowchart LR
    subgraph Browser["Navegador (frontend, SolidJS)"]
        UI["UI e estado<br/>(TanStack Query)"]
        CR["Criptografia local<br/>identidade, chaves, cifra"]
        LK["livekit-client<br/>+ worker E2EE"]
    end

    subgraph Dev["Vite dev server :1421 (HTTPS)"]
        PX["proxy /api /ws /health /rtc"]
    end

    subgraph Backend["Backend Rust (Axum) :8080"]
        REST["REST /api/*"]
        WS["WebSocket /ws<br/>hub de eventos"]
        DB[("SQLite<br/>so ciphertext e metadados")]
        FS[("Ficheiros<br/>anexos e avatares")]
        TK["Emissor de tokens LiveKit"]
    end

    LKS["LiveKit server :7880<br/>SFU de voz e video"]

    UI -->|JSON, cookie Session| PX
    UI <-->|eventos| PX
    PX --> REST
    PX --> WS
    REST --> DB
    REST --> FS
    REST --> TK
    WS --- DB
    LK <-->|WebRTC, frames cifrados| LKS
    LK -->|signalling /rtc| PX
    PX --> LKS
    TK -.->|chave de API, nunca no browser| LKS
    CR --- UI
    CR --- LK
```

- **Frontend v2** (`frontend/`): SPA SolidJS. Faz REST em `/api/*` com o cookie `Session` (mesma origem), escuta o `/ws` e fala com o LiveKit por WebRTC. Toda a cifra acontece no navegador.
- **Backend** (`backend/`): API Axum sobre SQLite. Valida sessão e permissões, guarda *ciphertext* e metadados, difunde eventos por WebSocket e emite tokens do LiveKit. O segredo de API do LiveKit nunca sai do backend.
- **LiveKit** (`infra/`): SFU em Docker Compose. A mídia chega cifrada (Insertable Streams), por isso o SFU não a lê.
- **Em produção** o proxy do Vite é substituído por um *reverse proxy* da instância; o cliente continua a falar com uma única origem. Ver [docs/deploy-producao.md](docs/deploy-producao.md).

### Camadas do frontend v2

```mermaid
flowchart TB
    subgraph app["frontend/src"]
        shell["shell/ (rail, sidebar, topbar, estado do servidor)"]
        pages["pages/ e auth/ (rotas)"]
        chat["chat/ (timeline, composer, anexos, pesquisa)"]
        admin["admin/ (servidor, cargos, canais, convites)"]
        voice["voice/ (sessao de chamada, palco, grade, PiP)"]
        crypto["crypto/ (identidade, cofre, chaves)"]
        api["api/ (http, realtime, tipos, endpoints)"]
    end
    shell --> api
    pages --> api
    chat --> api
    chat --> crypto
    admin --> api
    admin --> crypto
    voice --> api
    voice --> crypto
    api --> net(("REST + WS"))
```

---

## Criptografia (E2EE)

**Objetivo:** o processo servidor (e quem o opera) não deve poder ler o conteúdo das conversas nem decifrar a mídia em condições normais.

| Camada | O que fica cifrado | Quem vê em claro |
|--------|--------------------|------------------|
| **Texto e anexos** | Corpo da mensagem (`content_ciphertext`) e bytes dos anexos | Só clientes com a chave do servidor |
| **Voz e vídeo** | Frames, via Insertable Streams do LiveKit | Só participantes com a chave do servidor |
| **Metadados** | Quem enviou, quando, ids, membros, estado E2EE do canal | O servidor (necessário para operar) |

Limitações assumidas: o servidor vê metadados, e a pré-visualização de links (`POST /api/unfurl`) faz o servidor buscar o URL, logo ele vê esse URL.

### Hierarquia de chaves

```mermaid
flowchart TD
    PW["Palavra-passe"] -->|Argon2id| WK["Chave de cofre AES-256"]
    WK -->|AES-GCM| VAULT["Cofre da identidade<br/>(servidor e IndexedDB)"]
    VAULT --> ID["Identidade: par NaCl box<br/>chave publica vai ao servidor"]
    ID -->|selar para a chave publica| ENV["Envelope da chave do servidor<br/>(um por membro)"]
    ENV --> SK["Chave do servidor 32 bytes"]
    SK -->|AES-256-GCM| MSG["Mensagens e anexos"]
    SK -->|ExternalE2EEKeyProvider| MEDIA["Frames de voz e video"]
    ID -->|selar para si| CK["Chave do canal de voz 32 bytes<br/>(custodia)"]
    CK -->|autoriza| RELIGAR["Religar E2EE do canal"]
```

- **Identidade**: par `nacl.box` gerado no cliente. O servidor guarda a chave pública e o **cofre** (a chave secreta cifrada com AES-256-GCM, chave derivada por Argon2id). Nunca recebe a chave secreta.
- **Chave do servidor**: 32 bytes gerados no cliente do dono, distribuídos por **envelopes** (caixa selada para a chave pública de cada membro). Cifra mensagens, anexos e a mídia das chamadas.
- **Chave do canal de voz**: 32 bytes gerados na criação do canal e confirmados com `custody_ack`. O servidor guarda uma cópia **selada para o custodiante**. Serve para **religar a E2EE**: o cliente abre a cópia selada (`GET .../voice/channel-key`) e só aceita a chave colada se for a mesma.
- Formatos byte a byte e vetores de teste: [`docs/v2/contracts/crypto-formats.md`](docs/v2/contracts/crypto-formats.md) e `npm run test:contracts`.

---

## Reset de senha

Não há recuperação por e-mail. A senha abre o cofre da identidade neste dispositivo. Há três caminhos.

**Alterar senha**, quando a pessoa ainda sabe a actual. Em Minha conta. A identidade fica a mesma: o cliente volta a cifrar o cofre com a senha nova. As outras sessões terminam e esta continua. Mensagens e servidores não mudam.

**Chave de recuperação**, quando a pessoa guardou o código. É opcional e cria-se no registo, ao aceitar um convite, ou depois em Minha conta. O código mostra-se uma vez. O servidor guarda só um cofre cifrado e uma chave pública de verificação, nunca o código em si. Em **Esqueci a senha**, a escolha é **Tenho a chave de recuperação**. O navegador abre o cofre com esse código, prova que o possui, e define a senha nova. A identidade e as chaves dos servidores mantêm-se, por isso o histórico continua legível. Substituir a chave invalida o código anterior.

**Código do operador**, quando não há chave de recuperação ou ela também se perdeu. Quem opera a instância emite um código de uso único no host:

```bash
chat-backend reset-code <handle>
```

O comando imprime o código uma vez (30 minutos por omissão) e a base guarda só o hash. Entrega-se por um canal que já se use com essa pessoa. O procedimento completo está em [Senha esquecida](docs/operar-instancia.md#senha-esquecida-código-do-operador).

A pessoa abre **Esqueci a senha**, escolhe **Tenho um código do operador**, escreve o handle, o código e a senha nova, e confirma que a identidade será nova. A Mesa gera um par de chaves novo, apaga a chave de recuperação se existia, e encerra todas as sessões. Os servidores voltam a abrir quando um membro que ainda tem a chave do servidor estiver online e voltar a selar o envelope. Servidores em que esta conta era a única com a chave, e a custódia da chave de voz, não voltam.

Handle inexistente e código errado recebem a mesma resposta. Várias falhas seguidas invalidam o código: é preciso esperar ou pedir um código novo.

As rotas destes três caminhos estão em [Autenticação e conta](docs/contratos-e-fluxos.md#autenticação-e-conta).

---

## Contratos Frontend ↔ Backend

Rotas REST, eventos WebSocket e a política de alteração do backend: [docs/contratos-e-fluxos.md](docs/contratos-e-fluxos.md#contratos-frontend--backend).

## Fluxos de integração

Registo, convite, mensagens, voz, E2EE e reconexão, em diagrama: [docs/contratos-e-fluxos.md](docs/contratos-e-fluxos.md#fluxos-de-integração).

---

## Arranque rápido (dev)

Pré-requisitos: Docker, Rust (cargo) e uma versão recente do Node.

```bash
# 1) LiveKit (porta 7880)
cd infra && cp .env.example .env   # se necessário
docker compose up -d

# 2) Backend (porta 8080, só localhost por omissão)
cd backend
export DATABASE_URL=sqlite://chat.db?mode=rwc
export LIVEKIT_API_KEY=instkey
export LIVEKIT_API_SECRET=instsecretinstsecretinstsecret12
export LIVEKIT_WS_URL=ws://127.0.0.1:7880
export COOKIE_SECURE=false
cargo run

# 3) Frontend v2 (https://localhost:1421, aceitar o certificado de desenvolvimento)
cd frontend
npm install
npm run dev
```

O Vite serve a SPA e faz proxy de `/api`, `/ws`, `/health` e `/rtc` para o backend (`8080`) e o LiveKit (`7880`), de modo que o navegador fala sempre com uma só origem. A primeira conta registada passa a ser o operador inicial.

### Variáveis do backend

| Variável | Omissão | Função |
|----------|---------|--------|
| `DATABASE_URL` | `sqlite://chat.db?mode=rwc` | Base de dados |
| `BIND` | `127.0.0.1:8080` | Endereço de escuta |
| `LIVEKIT_WS_URL` | `ws://127.0.0.1:7880` | URL do LiveKit devolvido a quem entra |
| `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` | par de exemplo | Credenciais do LiveKit. **Obrigatório trocar em produção** |
| `SESSION_TTL_SECS` | `604800` (7 dias) | Duração da sessão |
| `DEFAULT_INVITE_TTL_SECS` | `300` | Validade dos convites |
| `COOKIE_SECURE` | desligado | Marca o cookie como `Secure` (ligar com HTTPS) |
| `ATTACHMENTS_DIR` / `AVATARS_DIR` | `./data/attachments` / `./data/avatars` | Onde ficam os ficheiros |
| `MESA_PRODUCTION` ou `MESA_ENV` | desligado | Modo produção (recusa as credenciais de exemplo) |
| `MESA_RATE_LIMIT_DISABLED` | desligado | Desliga o limite de pedidos (testes) |
| `LIVEKIT_EGRESS_FILE_PREFIX` | — | Só para a gravação, fora do escopo da v2 |

### Verificação

```bash
cd frontend
npm run build               # tsc + vite build
npm run lint                # eslint
npm run test:contracts      # vetores criptográficos (24 casos)
npm run verify:i18n-keys    # chaves usadas = chaves em pt-BR e en
npm run verify:sound        # chegadas, janela de repouso e preferência dos efeitos sonoros
npm run verify:chat         # lógica de chat, incluindo agrupamento por tempo

cd ../backend && cargo test # contratos e integração da API
```

---

## Estrutura do repositório

```text
backend/          # API Axum, SQLite, tokens LiveKit, hub de WebSocket
frontend/         # SPA SolidJS v2 (cliente atual)
infra/            # Docker Compose do LiveKit
openspec/         # Specs e changes da v2 (specs/ = estado atual, changes/ = trabalho)
docs/             # Produto, arquitetura, operação, contratos e mockups (docs/v2/)
specs/            # Specs históricas da v1 (Speckit)
assets/audio/     # Efeitos sonoros curtos (mention.mp3, call-join.mp3), copiados para o frontend
spike/            # Provas de conceito descartáveis
CHANGELOG.md      # Versionamento
```

- Trabalho em curso: `openspec list` (ou [`openspec/changes/`](openspec/changes/)). A reescrita está em [`docs/v2/TR-frontend-v2.md`](docs/v2/TR-frontend-v2.md).
- Fidelidade visual: [`docs/v2/fidelity-protocol.md`](docs/v2/fidelity-protocol.md) e [`docs/v2/AUDIT-fidelity.md`](docs/v2/AUDIT-fidelity.md).

---

## Distribuição desktop

Os instaladores de Windows e macOS **não são assinados nem notarizados**. No primeiro arranque o Windows mostra o aviso do SmartScreen ("Windows protected your PC") e o macOS mostra o aviso do Gatekeeper ("developer cannot be verified"). A aplicação só abre depois de a pessoa confirmar que confia na origem. Isto não está resolvido: o projecto não tem certificado Authenticode nem conta Apple Developer, e o workflow de release não tenta assinar.

O processo de publicar uma versão, os formatos (AppImage, deb, rpm, msi, exe, app, dmg) e o facto de a GitHub Release nascer em rascunho estão em [docs/desktop-release.md](docs/desktop-release.md).

## Fora de escopo e diferido

- Federação entre instâncias.
- Gravação de cenas (LiveKit Egress), incompatível com a E2EE; sem UI na v2.
- Múltiplas cenas nomeadas por canal, co-diretor e *templates* de cena partilháveis.
- MLS, multi-dispositivo, Passkeys e semente BIP-39.
- Rolagem de dados, ferramentas VTT, telemetria de rede e perfil estendido.
- Outros sons além de menção e chegada à chamada, volume ajustável e notificações do sistema.
- Cliente desktop empacotado (Tauri) como binário único cliente + servidor (visão de longo prazo).
