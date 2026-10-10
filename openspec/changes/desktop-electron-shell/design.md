# Design

## Context

Ver `proposal.md` — Why, para o diagnóstico completo (sandbox do WebKit, `gst-plugins-bad`, X11/compositing todos descartados; pipeline `v4l2src` isolada funciona; `getUserMedia({video: true})` do Mesa não passa nenhuma constraint de intervalo). Pontos de código que ancoram este design:

- `frontend/src/api/instance.ts`: módulo já existente (de `frontend-instance-connect`, arquivada) com `isNative()`, `loadInstance()`/`saveInstanceUrl()`/`saveSessionToken()`/`clearInstance()`, `probe()` (usa `@tauri-apps/plugin-http` quando `tauriBridge()`). É o único ponto a adaptar no frontend — a forma (`loadInstance`/`saveInstanceUrl`/etc.) mantém-se, só a implementação por baixo de `tauriBridge()`/`probe()` muda.
- `frontend/src/api/http.ts`, `realtime.ts`: já resolvem `path` contra `baseUrl` e usam `Authorization: Bearer` quando `isNative()` (trabalho de `frontend-instance-connect`). Não precisam de saber COMO o header chega ao pedido — só precisam de continuar a defini-lo.
- `frontend/src/api/endpoints/auth.ts` (`avatarUrl`), `servers.ts` (`imageUrl`): já resolvem para URL absoluta em modo nativo e são consumidos via `requestBytes` → `blob:` (Decisão 2.2 de `frontend-instance-connect`). Continuam a funcionar sem alteração — só deixam de precisar que `http.ts` importe um plugin especial.
- `backend/src/api/auth/session.rs` (`load_user`), `backend/src/api/mod.rs` (`ws_handler`): já aceitam cookie e header `Authorization` (`native-client-auth`, arquivada). Ganham um terceiro ponto de leitura (sub-protocolo do WebSocket).
- `frontend/src-tauri/`: crate Rust completo, ícones já gerados em `frontend/src-tauri/icons/` (Tarefa 2.1/2.2 de `desktop-tauri-shell`) — os ficheiros de ícone em si são reaproveitados; o crate Rust é removido.

## Goals / Non-Goals

**Goals:**
- Câmara/microfone e colar imagem funcionam de forma fiável nas três plataformas (motivação central desta change).
- Reaproveitar o máximo possível do que `frontend-instance-connect` já implementou (forma do módulo de instância, `http.ts`/`realtime.ts`, avatares via `blob:`) — só a camada de mecanismo nativo por baixo muda.
- Reaproveitar os ícones já produzidos, sem repetir o trabalho de isolar o emblema.

**Non-Goals:**
- Manter o Tauri como opção alternativa/configurável — é uma substituição, não uma segunda via.
- Assinatura de código/notarização (decisão já tomada em `desktop-packaging-ci`, inalterada por esta change).
- Resolver o bug do WebKitGTK em si (fora do controlo deste projecto) — contorna-se trocando de motor, não se corrige o motor.

## Decisions

### 1. `webSecurity: false` + `session.webRequest.onBeforeSendHeaders`, em vez de um proxy no processo principal

Alternativa descartada: manter `webSecurity` ligado e fazer o renderer pedir ao processo principal, via IPC, para executar cada pedido de rede (replicando o padrão do `@tauri-apps/plugin-http`, onde o renderer nunca faz `fetch()` directo). Rejeitada por ser mais código para o mesmo resultado: como a janela só carrega o `frontend/dist` do próprio pacote (nunca uma página de terceiros — ver Requirement "A janela nunca navega para conteúdo de terceiros"), desligar `webSecurity` para esta janela não abre a aplicação a conteúdo não confiável, só deixa de aplicar a política de mesma origem ao código já confiável que a aplicação carrega. Com isso, `fetch()`/`<img src>` nativos do `frontend/dist` já existente funcionam sem adaptação — `http.ts` só precisa de continuar a resolver `path` contra `baseUrl` e a definir o header (que o `webRequest.onBeforeSendHeaders`, filtrado pela origem da instância configurada, garante que chega ao pedido mesmo que o código do renderer o omita, como rede de segurança).

**Risco aceite e mitigado**: `webSecurity: false` é perigoso para uma janela que carregasse conteúdo arbitrário. Mitigação: a janela principal nunca navega para fora do `frontend/dist` — qualquer link externo (`target="_blank"`, `window.open`) é interceptado pelo processo principal (`setWindowOpenHandler`/`will-navigate`) e aberto no browser do sistema (`shell.openExternal`), nunca dentro da mesma janela. Isto é a implementação concreta do Requirement "A janela nunca navega para conteúdo de terceiros" do `desktop/shell`.

### 2. Token como sub-protocolo do WebSocket, em vez de um transporte nativo dedicado

Alternativa descartada: replicar o padrão do `@tauri-apps/plugin-websocket` — uma ligação WebSocket nativa gerida pelo processo principal (via uma biblioteca Node como `ws`, capaz de definir qualquer header), em ponte com o renderer por IPC. Rejeitada por ser significativamente mais código (gerir o ciclo de vida da ligação dos dois lados da ponte IPC, serializar mensagens) para resolver um problema que o próprio protocolo WebSocket já resolve de forma nativa: o construtor `WebSocket(url, protocols)` permite declarar sub-protocolos, enviados no header `Sec-WebSocket-Protocol` da negociação — um mecanismo padrão, suportado pelo `WebSocket` normal de qualquer motor (Chromium incluído), sem precisar de nenhum acesso privilegiado. O token de sessão (hex, `hex::encode` de 32 bytes aleatórios — ver `native-client-auth`) usa só caracteres válidos para um valor de `Sec-WebSocket-Protocol`, sem necessidade de qualquer codificação adicional.

Isto simplifica `realtime.ts` para menos do que o desenho original de `frontend-instance-connect` previa: deixa de ser preciso escolher entre duas implementações de transporte (`WebSocket` do browser vs plugin) — usa-se sempre o `WebSocket` nativo, só a forma de autenticar (cookie, implícito; ou sub-protocolo, em modo nativo) muda.

O Chromium e o cliente de handshake usado nos testes de contrato recusam a abertura quando o pedido oferece um sub-protocolo e a resposta 101 não selecciona nenhum (ao contrário do que a RFC 6455, sozinha, permitiria). A resposta ecoa o primeiro nome oferecido para a ligação abrir. Esse eco não escolhe a sessão: a ordem continua a ser cookie, depois `Authorization`, depois o valor do sub-protocolo. Não se usa `WebSocketUpgrade::protocols()`, que só aceita um menu fixo de nomes conhecidos na rota.

### 3. Armazenamento local via ficheiro JSON próprio, não `electron-store`

Alternativa descartada: usar o pacote `electron-store` (popular no ecossistema Electron para isto). Rejeitada por ser uma dependência externa para um problema pequeno — ler/escrever um ficheiro JSON em `app.getPath("userData")` é poucas linhas de Node puro (`fs/promises`), e mantém o mesmo nível de "sem dependência desnecessária" já aplicado em `frontend-instance-connect` (Decisão 3 dessa change, sobre não usar keychain nativo). O preload script expõe `loadInstance`/`saveInstanceUrl`/`saveSessionToken`/`clearInstance` via `contextBridge.exposeInMainWorld`, com a mesma assinatura que `frontend/src/api/instance.ts` já usa — só a implementação por trás de cada chamada muda de `@tauri-apps/plugin-store` para uma chamada IPC ao processo principal.

### 4. Detecção de modo nativo via flag exposta pelo preload, não `navigator.userAgent`

Alternativa descartada: detectar Electron por `navigator.userAgent.includes("Electron")` (técnica comum, mas falsificável por qualquer página e frágil a mudanças de versão). Em vez disso, o preload script define explicitamente `window.__MESA_NATIVE__ = true` via `contextBridge.exposeInMainWorld` antes da página carregar — o equivalente directo ao que `isTauri()` já fazia (verificar a presença de uma ponte injectada pelo processo nativo), só que explícito em vez de genérico. `frontend/src/api/instance.ts` troca `isTauri()` de `@tauri-apps/api/core` por esta verificação.

## Risks / Trade-offs

- [`webSecurity: false` é uma configuração sensível, fácil de copiar incorrectamente para outro contexto (ex. se no futuro a app alguma vez carregar conteúdo de terceiros numa `BrowserWindow`)] → Mitigação: aplicado só à janela principal, que nunca carrega outra coisa senão `frontend/dist`; documentado explicitamente no código (comentário) e nesta decisão, não escondido.
- [No macOS, `getUserMedia()` só mostra o pedido de permissão quando o pacote declara `NSCameraUsageDescription`/`NSMicrophoneUsageDescription` no `Info.plist` — sem isso, o sistema recusa silenciosamente, reproduzindo no macOS o mesmo sintoma que motivou esta change no Linux] → Não é resolvido por esta change (é configuração de `electron-builder`, não do processo principal) — fica registado aqui como ponto de coordenação a não perder: `desktop-packaging-ci`, ao ser reescrita para Electron, tem de declarar explicitamente estas duas chaves.
- [Instalador muito maior e mais RAM/CPU que o Tauri — já era esperado e aceite explicitamente com o utilizador antes de iniciar esta change] → Sem mitigação técnica; é o custo consciente da troca.
- [`frontend/src-tauri/` fica obsoleto — se não for removido, um colaborador pode confundir-se sobre qual é o shell activo] → Mitigação: tarefa explícita de remover o crate Tauri (ver `tasks.md`), não só deixar de o referenciar.
- [Electron tem o seu próprio ciclo de actualizações de segurança (Chromium embutido) — ao contrário do Tauri, que usa o webview já actualizado pelo SO, esta app passa a ser responsável por manter o Electron actualizado] → Mitigação: fora do escopo técnico desta change (é uma responsabilidade operacional contínua, não uma decisão de arquitectura a resolver agora); registar como nota operacional em `desktop-packaging-ci` ou em `docs/` sobre acompanhar releases do Electron.

## Migration Plan

Substituição, não adição incremental — `frontend/src-tauri/` é removido na mesma change em que `frontend/electron/` é introduzido (não há um período de convivência dos dois shells). O backend ganha um transporte aditivo (sub-protocolo WS) sem remover nada dos dois já existentes, por isso não quebra nada que já dependa de cookie/header. Depende de `native-client-auth` (já arquivada); a change seguinte, `desktop-packaging-ci`, tem de ser revista para empacotar `frontend/electron/` com `electron-builder` em vez de `frontend/src-tauri/` com `cargo tauri`/`tauri-action`.
