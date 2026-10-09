# Proposal

## Why

A change `native-client-auth` ensina o backend a aceitar o token de sessão por header `Authorization`, para além do cookie — mas ninguém o usa ainda. O frontend actual (`frontend/src/api/http.ts`, `realtime.ts`) está inteiramente hardcoded para same-origin: pedidos com caminho relativo e `credentials: "include"`, WebSocket construído a partir de `location.host` (`realtime.ts:54-57`), e o próprio reconnect faz `fetch("/api/auth/me")` relativo (`realtime.ts:103`). Isto é exactamente correcto para o build web (servido pelo Nginx na mesma origem do backend, por desenho — `openspec/specs/frontend-v2/production-cutover/spec.md`) e continua a ser depois desta change. Mas é o oposto do que o cliente desktop (Tauri, decidido como só-cliente) precisa: falar com uma instância Mesa escolhida pelo utilizador em runtime, que não é a origem de onde a aplicação foi carregada.

A arquitectura de referência (`docs/arquitetura-tecnica.md` §5.1) já previa isto: "uma única SPA é compilada para dois destinos: dentro do webview do Tauri (desktop) e como site estático servido pelo backend em modo servidor (acesso via navegador)... funcionalidades exclusivas de desktop devem degradar graciosamente na build web." Esta change implementa exactamente essa degradação graciosa para o transporte de rede: o mesmo `frontend/dist`, sem build separado, detecta em runtime se corre dentro do Tauri e, só nesse caso, pede ao utilizador a que instância ligar-se e troca cookie por token.

## What Changes

- Novo ecrã, mostrado **só quando a aplicação corre dentro do Tauri** (detectado em runtime via `isTauri()` de `@tauri-apps/api/core`) e ainda não há uma instância guardada: pede o endereço base de uma instância Mesa (ex.: `https://chat.exemplo.com` ou `http://192.168.1.50:8080`), confirma que responde em `/health`, e guarda-o para a próxima vez. Uma acção "Trocar de instância" fica acessível depois de autenticado (perto de onde já existe "Trocar de conta"). No build web este ecrã nunca aparece — a app continua a assumir same-origin exactamente como hoje.
- `frontend/src/api/http.ts`: `request`/`requestBytes` passam a resolver o pedido contra a instância configurada (quando houver uma — modo nativo) em vez de um caminho relativo, e a usar `Authorization: Bearer <token>` em vez de `credentials: "include"` nesse modo. No modo web (sem instância configurada), o comportamento é byte a byte o mesmo que hoje.
- `frontend/src/api/endpoints/auth.ts` (`avatarUrl`) e `frontend/src/api/endpoints/servers.ts` (`imageUrl`): estas duas funções devolvem caminhos relativos consumidos em `<img src>` (nunca passam por `http.ts`). Em modo nativo um `<img>` não consegue enviar `Authorization`, por isso os consumidores passam a buscar os bytes com `requestBytes` e a mostrar um `blob:` (ver `design.md`, Decisão 2.2). No build web o caminho relativo e o `<img src>` directo mantêm-se.
- `frontend/src/api/realtime.ts`: `socketUrl()` passa a derivar do endereço da instância configurada em modo nativo (em vez de `location.host`); o estabelecimento da ligação em modo nativo usa `@tauri-apps/plugin-websocket` (que corre do lado Rust e aceita cabeçalhos arbitrários na negociação) em vez do `WebSocket` nativo do browser, porque a API `WebSocket` do browser não permite definir o header `Authorization` — necessário para autenticar a ligação com o token em vez do cookie (ver `native-client-auth`, Requirement "O handshake de WebSocket aceita o mesmo header Authorization"). O *health-check* de reconexão (hoje `fetch("/api/auth/me")` relativo) passa pela mesma resolução de endereço/transporte. Em modo web, o comportamento não muda.
- `frontend/src/session/session.tsx`: `login`/`register`/os fluxos de recuperação que criam sessão passam a capturar o campo `session_token` da resposta (introduzido por `native-client-auth`) e, em modo nativo, a persisti-lo via `@tauri-apps/plugin-store`; em modo web o campo é ignorado (a sessão continua inteiramente no cookie, como hoje).
- **Fora de escopo explícito**: o próprio shell Tauri/empacotamento (change `desktop-tauri-shell`), guardar o token num cofre do SO (keychain nativo) — ver Decisão correspondente no `design.md`, qualquer mudança ao fluxo de identidade/cofre E2EE (`frontend-v2/auth` continua válido tal como está — só o transporte de rede por baixo muda), suporte a múltiplas instâncias guardadas simultaneamente (uma instância activa de cada vez, trocar implica logout explícito).

## Capabilities

### New Capabilities

- `frontend-v2/instance-connect`: selecção, validação e persistência do endereço de uma instância Mesa quando a aplicação corre fora do browser (shell Tauri), e a troca correspondente do transporte de autenticação (cookie → header) e do WebSocket (nativo do browser → plugin Tauri) para falar com essa instância.

### Modified Capabilities

(nenhuma — `frontend-v2/auth` descreve o fluxo de identidade/cofre E2EE, que esta change não altera; `frontend-v2/production-cutover` já exige same-origin só para o build servido pelo Nginx, que continua inalterado. Nenhum requisito existente muda de comportamento observável no build web.)

## Impact

- **Frontend** (`frontend/src/api/http.ts`, `realtime.ts`, `ws.ts`): a resolução de endereço e o transporte (fetch/WS) passam a depender do modo de execução; zero mudança de comportamento no build web.
- **Frontend** (`frontend/src/session/session.tsx`, novo módulo de "instância"): nova gestão de estado para o endereço da instância activa e o token de sessão em modo nativo.
- **Dependências novas** (`frontend/package.json`, só usadas em runtime nativo): `@tauri-apps/api` (`isTauri()`), `@tauri-apps/plugin-http` (REST sem CORS — ver `design.md` Decisão 2.1), `@tauri-apps/plugin-websocket`, `@tauri-apps/plugin-store`. Nenhuma delas afecta o bundle/comportamento do build web além do custo de um import condicional.
- **Depende de** `native-client-auth` (consome o campo `session_token` e o header `Authorization` que essa change introduz no backend). **É consumida por** `desktop-tauri-shell` (que embrulha este mesmo `frontend/dist` num binário Tauri) e indirectamente por `desktop-packaging-ci`.
- **Sem impacto**: backend (`backend/`), identidade/cofre E2EE (`frontend/src/crypto`), qualquer ecrã ou fluxo do build web.
