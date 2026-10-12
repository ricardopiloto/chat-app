# Proposal

## Why

`desktop-tauri-shell` e `frontend-instance-connect` já foram implementadas e arquivadas, e `desktop-packaging-ci` chegou a produzir artefactos reais (`.rpm`/`.AppImage`) testados em Fedora. Esses testes revelaram um problema estrutural, não um bug pontual: o WebKitGTK (o webview que o Tauri usa no Linux) falha de forma reprodutível em três frentes centrais ao produto — colar uma imagem da área de transferência não funciona (`Composer.tsx`, API web padrão, sem causa no código do Mesa), e a câmara/microfone falham com `NotAllowedError` mesmo depois de a permissão ser aprovada, com o processo de render a acusar `GStreamer-CRITICAL: gst_value_collect_int_range`/`range start is not smaller than end for GstIntRange`. Isolámos a causa a um nível razoável de confiança: não é o sandbox do WebKit (desligá-lo não mudou nada), não é falta de `gst-plugins-bad` (está instalado), não é Wayland/compositing (forçar X11 não mudou nada), não é o código do Mesa (`getUserMedia({video: true})` sem nenhuma constraint de intervalo), e uma pipeline `v4l2src` isolada funciona perfeitamente com a mesma câmara — sobra a tradução interna que o próprio WebKitGTK faz de "pedido de câmara" para caps do GStreamer, um bug específico desse motor com este hardware, sem contorno conhecido encontrado.

"Composição nativa de câmaras" é a frase de abertura do `README.md` — o diferencial central do produto, não um extra. Um cliente desktop Linux sem chamada de vídeo fiável não cumpre o pedido original do utilizador ("mesmas funcionalidades"). Decidido com o utilizador: trocar o motor de webview por **Electron** (Chromium embutido, igual nas três plataformas, em vez do webview de cada sistema operativo) — o caminho padrão e comprovado para este problema exacto (é a razão de Discord, Slack e Teams usarem Electron). O custo aceite conscientemente: instalador maior (~150–300 MB em vez de poucos MB), mais RAM/CPU em repouso, e o *shell* desktop deixa de ser Rust (passa a ser Node/Electron — o backend, `backend/`, continua inteiramente Rust, inalterado).

## What Changes

- **Substitui** `frontend/src-tauri/` (crate Rust, Tauri) por `frontend/electron/` (processo principal Electron, TypeScript/Node), empacotado com `electron-builder` em vez de `tauri-apps/tauri-action`/`cargo tauri`. Os ícones já produzidos (emblema sem a palavra "Mesa", fundo transparente, `desktop-tauri-shell` Tarefa 2.1/2.2) são reaproveitados tal como estão — `electron-builder` usa os mesmos formatos (`.ico`/`.icns`/PNGs).
- **Rede**: em vez dos três plugins Tauri (`@tauri-apps/plugin-http`, `plugin-websocket`, `plugin-store`), o processo principal Electron configura a janela com `webSecurity: false` (a página só carrega sempre o `frontend/dist` do próprio pacote — nunca conteúdo web arbitrário — por isso desligar a política de mesma origem para esta janela é seguro, não uma concessão a páginas de terceiros) e usa `session.webRequest.onBeforeSendHeaders` para injectar `Authorization: Bearer <token>` em todos os pedidos dirigidos ao endereço da instância configurada. Com isto, `fetch()`/`<img src>` do `frontend/dist` (código já existente de `frontend-instance-connect`, incluindo `avatarUrl`/`imageUrl` e o `requestBytes` de anexos) passam a funcionar sem nenhum import condicional de plugin — só precisam de resolver o caminho contra a instância configurada, o que já fazem.
- **WebSocket**: o `WebSocket` nativo do Chromium (tal como o de qualquer browser) também não permite definir o header `Authorization` na negociação — mas, ao contrário do que `frontend-v2/instance-connect` assumiu para o Tauri, não é preciso um transporte alternativo inteiro: o construtor `WebSocket(url, protocols)` permite declarar sub-protocolos, que *são* enviados no header `Sec-WebSocket-Protocol` da negociação. O cliente nativo passa o token como sub-protocolo; o backend (`native-client-auth`) ganha um pequeno acrescento para o aceitar como alternativa ao header `Authorization` já suportado (ver Capabilities). Isto simplifica `realtime.ts`: deixa de precisar de duas implementações de transporte (browser `WebSocket` vs plugin), usa sempre o `WebSocket` nativo.
- **Armazenamento local** (endereço da instância + token): substitui `@tauri-apps/plugin-store` por um ficheiro JSON simples escrito pelo processo principal (`app.getPath("userData")`), exposto ao `frontend/dist` por um `preload.ts` com `contextBridge` — mesma forma/contrato que `frontend/src/api/instance.ts` já expõe (`loadInstance`/`saveInstanceUrl`/`saveSessionToken`/`clearInstance`), só a implementação por baixo troca.
- **Câmara, microfone e colar imagem**: esperados a funcionar sem nenhum código extra — são o motivo desta change. O Chromium do Electron tem o `getUserMedia()`/clipboard de imagem maduros e testados (mesmo motor usado por Chrome/Edge), ao contrário do WebKitGTK.
- **Fora de escopo explícito**: assinatura de código/notarização (decisão já tomada em `desktop-packaging-ci`, inalterada), tray icon, menu nativo, auto-update, janela frameless.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `desktop/shell`: o mecanismo de rede/segurança da janela deixa de ser "plugins Tauri + CSP" e passa a ser "`webSecurity: false` + injecção de header pelo processo principal Electron"; o resto (ícone, decoração nativa da janela) não muda de requisito, só de tecnologia de implementação.
- `frontend-v2/instance-connect`: generaliza as referências a "shell Tauri" para "shell nativo" (a capacidade sempre foi sobre "correr fora do browser", não especificamente sobre Tauri); a ligação de tempo real passa a autenticar por sub-protocolo do `WebSocket` nativo em vez de um transporte alternativo capaz de definir headers.
- `auth/session-tokens`: o handshake de WebSocket passa a aceitar o token também como sub-protocolo (`Sec-WebSocket-Protocol`), além do cookie e do header `Authorization` já suportados — aditivo, nenhum dos dois transportes já existentes muda de comportamento.

## Impact

- **Removido** (`frontend/src-tauri/`): crate Rust Tauri, substituído por `frontend/electron/`.
- **Novo** (`frontend/electron/`): processo principal (TypeScript/Node), `preload.ts`, configuração `electron-builder`.
- **Backend** (`backend/src/api/mod.rs` `ws_handler`, `backend/src/api/auth/session.rs`): aceitar o token via sub-protocolo do WebSocket, além do header já existente.
- **Frontend** (`frontend/src/api/instance.ts`, `http.ts`, `realtime.ts`): simplificação — deixam de importar `@tauri-apps/plugin-*`; a detecção de modo nativo passa de `isTauri()` para uma detecção equivalente para Electron (ver `design.md`).
- **Reaproveitado sem alteração**: ícones (`desktop-tauri-shell` Tarefa 2.1/2.2), o ecrã de selecção de instância (`InstanceConnect.tsx`), a UX de "Trocar de instância", os avatares/imagens via `blob:` (continuam a funcionar, agora sem precisar do `@tauri-apps/plugin-http` para as obter — o `fetch()` simples já basta).
- **Depende de** `native-client-auth` (já arquivada) e consome a pequena extensão desta change ao WS. **Torna obsoleta** a parte Tauri-específica de `desktop-tauri-shell` (já arquivada — fica como registo histórico, não editada) e exige reescrever a parte de empacotamento de `desktop-packaging-ci` (change seguinte, em curso, a rever separadamente).
