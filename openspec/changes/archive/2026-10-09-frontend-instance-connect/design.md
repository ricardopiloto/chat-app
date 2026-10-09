# Design

## Context

Ver `proposal.md` — Why. Pontos de código que ancoram este design:

- `frontend/src/api/http.ts:56-67` (`request`/`requestBytes`): `fetch(path, ...)` com `path` relativo e `credentials: "include"` — o único transporte hoje.
- `frontend/src/api/realtime.ts:54-57` (`socketUrl`): `${scheme}//${location.host}/ws` — deriva sempre da origem actual; linha 103, `fetch("/api/auth/me", { credentials: "same-origin" })` no caminho de reconexão.
- `frontend/src/session/session.tsx`: `login`/`register`/`recoverWithCode`/`recoverWithKey` chamam `auth.*` (`frontend/src/api/endpoints/auth.ts`) e recebem de volta o tipo `Account` — é aqui que o novo campo `session_token` (de `native-client-auth`) fica disponível ao cliente, se o backend o enviar.
- `frontend/src/index.tsx` (`Gate`): decide o ecrã a partir de `session.phase()`; é o ponto onde entra um novo estado anterior a "loading" quando falta a instância.
- `frontend/src/api/endpoints/auth.ts:37` (`avatarUrl`) e `frontend/src/api/endpoints/servers.ts:11` (`imageUrl`): devolvem caminhos relativos (`/api/accounts/{id}/avatar`, `/api/servers/{id}/image`) consumidos directamente em `<img src>` pelos componentes — nunca passam por `http.ts`. Achado da revisão de `desktop-tauri-shell`: sem os incluir no âmbito desta change, avatares e imagens de servidor resolvem contra a origem do webview em modo nativo, não contra a instância configurada — quebra visível, não um detalhe cosmético.
- `docs/arquitetura-tecnica.md` §5.1 já antecipa "uma única SPA... build web e dentro do webview do Tauri... degradar graciosamente" — este design implementa essa frase para a camada de rede.

## Goals / Non-Goals

**Goals:**
- Um único `frontend/dist`, sem flag de build nem variante separada, serve tanto o browser (hoje) como o shell Tauri (change seguinte) — a diferença é detectada em runtime.
- Zero mudança de comportamento, bytes de rede, ou UI no build web.
- A troca de transporte (fetch/WS, cookie/token) fica centralizada num pequeno número de módulos (`http.ts`, `realtime.ts`), não espalhada pelos ecrãs que os chamam.

**Non-Goals:**
- Guardar o token num cofre nativo do SO (keychain) — ver Decisão 3.
- Suportar mais do que uma instância guardada em simultâneo, ou perfis/contas múltiplas por instância.
- Qualquer mudança ao fluxo de identidade/cofre E2EE (`frontend-v2/auth`) — este design só acrescenta um transporte alternativo por baixo do mesmo fluxo.
- O próprio shell Tauri (janela, ícone, empacotamento) — isso é `desktop-tauri-shell`; aqui o "modo nativo" é testável mesmo sem esse shell existir ainda (ver Decisão 4).

## Decisions

### 1. Detecção em runtime via `isTauri()`, não uma flag de build

Alternativa descartada: duas variantes de build (`vite build --mode web` vs `--mode desktop`) com uma constante injectada em build-time. Rejeitada porque contradiz o objectivo de "mesma identidade visual, mesmo bundle" — duas variantes implicam dois artefactos a manter sincronizados e a testar separadamente, exactamente a duplicação que `docs/arquitetura-tecnica.md` §5.1 pede para evitar. `@tauri-apps/api/core`'s `isTauri()` devolve `true` só quando o código corre dentro do webview do Tauri (verifica a presença da ponte `__TAURI_INTERNALS__` injectada pelo processo nativo); num browser comum devolve `false` de forma estável. O custo é um pequeno `if` nos pontos de entrada em vez de nenhum — aceitável.

### 2. Módulo de "instância" como nova fonte de verdade, lido por `http.ts`/`realtime.ts`

Um novo módulo (`frontend/src/api/instance.ts`, nome indicativo) guarda `{ baseUrl, sessionToken }` em memória, com persistência via `@tauri-apps/plugin-store` quando `isTauri()`, carregado no arranque antes de `SessionProvider.restore()` ser chamado. Expõe `saveInstanceUrl(url)` e `saveSessionToken(token)` como duas funções separadas (não um único `saveInstance(url, token)`) — a primeira é chamada pelo ecrã de selecção de instância, antes de existir qualquer sessão; a segunda, depois do login/registo, quando o token passa a existir. `http.ts`/`realtime.ts` passam a perguntar a este módulo "qual é a base e qual o modo" em vez de assumirem `location`/cookie directamente. Quando `isNative()` é verdadeiro mas `baseUrl` ainda não foi definido (pedido disparado antes do utilizador escolher uma instância — ver Risco correspondente), as funções de pedido do módulo rejeitam de imediato com um erro claro, em vez de tentar construir uma URL inválida a partir de `null`. Alternativa descartada: injectar a base via `fetch` global sobreposto (`window.fetch = ...`) — rejeitada por esconder a troca de comportamento num efeito lateral global, difícil de testar e de distinguir de um bug de rede real.

### 2.1 Transporte REST nativo usa `@tauri-apps/plugin-http`, não o `fetch` global

O `fetch` global, dentro de um webview Tauri, continua a ser o motor de browser normal (WebView2/WKWebView/WebKitGTK) — sujeito a CORS exactamente como em qualquer página carregada num browser. A decisão já tomada em `native-client-auth` de não precisar de CORS no backend ("o cliente nativo vai usar um transporte HTTP do lado Rust... que não está sujeito a CORS de todo") só se realiza se `http.ts` importar e usar o `fetch` exportado por `@tauri-apps/plugin-http` (não o global) quando `isNative()` — essa troca é, por isso, parte central desta change, não um detalhe de implementação a decidir depois. `@tauri-apps/plugin-websocket` já tem a mesma propriedade (corre do lado Rust) para a ligação de tempo real, mas o REST precisa da sua própria dependência equivalente.

### 2.2 `avatarUrl`/`imageUrl` em modo nativo passam a object URL via fetch autenticado (revisto durante a implementação)

Versão original desta decisão (mantida aqui para registo): só mudar `avatarUrl`/`imageUrl` para devolver a URL absoluta da instância, assumindo que o `<img src>` chegaria lá por si. **Essa versão estava incompleta** — descoberto ao implementar a Tarefa 3.3: `GET /api/accounts/{id}/avatar` e `GET /api/servers/{id}/image` exigem sessão (`AuthUser`, `backend/src/api/avatars.rs:114-124,186-194`). Em modo nativo não há cookie (Decisão 2.1) e o `<img>` não pode enviar o header `Authorization` — o pedido chega sem credencial nenhuma e falha com 401, imagem nunca carrega. CSP `img-src` (ver `desktop-tauri-shell`) continua necessária, mas não é suficiente por si só.

Correcção: em modo nativo, `avatarUrl`/`imageUrl` deixam de devolver uma string síncrona para consumo directo em `<img src>`. Os componentes que hoje fazem `<img src={avatarUrl(id)}>` passam a obter a imagem através de uma função que busca os bytes com `requestBytes` de `http.ts` (que já leva `Authorization: Bearer`, ver Decisão 2.1) e devolve um `URL.createObjectURL(blob)`, com `URL.revokeObjectURL` quando o componente desmonta ou a imagem muda — exactamente o padrão já usado em `frontend/src/api/endpoints/conversation.ts` (`fetchAttachmentBlob`) para anexos, reaproveitado em vez de inventado de novo. Fora do modo nativo, `avatarUrl`/`imageUrl` continuam a devolver o caminho relativo de hoje, consumido directamente em `<img src>` sem qualquer `fetch` — zero mudança no build web.

Alternativa descartada: token na query string (`?token=...`). Rejeitada por expor o segredo em logs de acesso, histórico do browser, e cabeçalho `Referer` de pedidos subsequentes — exactamente o tipo de exposição que `native-client-auth` evitou ao optar por um header em vez de outro transporte visível.

### 3. Token em `@tauri-apps/plugin-store` (ficheiro na pasta de perfil da app), não keychain nativo

Alternativa descartada: usar o keychain do SO (via um plugin de keyring/Stronghold) já nesta change. Rejeitada para o MVP por introduzir uma dependência e uma superfície de falha por plataforma (Windows Credential Manager / macOS Keychain / Secret Service no Linux, que pode nem estar disponível em todas as distros/ambientes de desktop) por um ganho de segurança marginal face ao risco já aceite: o `design.md` de `native-client-auth` já trata o token como equivalente, em sensibilidade, ao cookie de sessão de hoje (mesmo blast radius se roubado). Guardar num ficheiro do perfil da app com as permissões normais do SO para dados de utilizador é o mesmo nível de protecção que outras aplicações desktop (incluindo clientes Electron) já usam para sessão. Fica registado como melhoria futura, não como lacuna escondida.

### 4. Esta change é testável sem o shell Tauri existir

Como `isTauri()` é só uma função que devolve `false` fora do Tauri, o ecrã de selecção de instância e a troca de transporte podem ser forçados/testados num browser normal (ex.: um parâmetro de query ou uma função exposta só em `import.meta.env.DEV` para simular `isTauri() === true` nos testes/dev) sem esperar por `desktop-tauri-shell`. Isto permite implementar e validar esta change de forma independente, na ordem já decidida (`native-client-auth` → esta → `desktop-tauri-shell`).

## Risks / Trade-offs

- [`@tauri-apps/plugin-websocket` tem uma API diferente do `WebSocket` nativo do browser — mais código de adaptação em `realtime.ts` do que uma troca trivial] → Mitigação: isolar as duas implementações detrás da mesma interface mínima já usada pelos chamadores (`open`/`onmessage`/`onclose`/`close`), para que o resto de `realtime.ts` (lógica de reconexão, backoff, resync) não precise de saber qual transporte está activo.
- [Validar o endereço só com `GET /health` pode aceitar um endereço que responde mas não é uma instância Mesa (ex.: outro serviço HTTP qualquer na mesma porta)] → Mitigação aceite como suficiente para o MVP: `/health` já devolve um corpo específico (`{"ok":true}`); um falso positivo aqui falha de forma visível no primeiro pedido autenticado a seguir (401/erro de parsing), não corrompe dados.
- [Utilizador introduz um endereço com protocolo errado (`http://` para uma instância que só aceita `https://`, ou vice-versa) e o erro de rede resultante é pouco claro] → Mitigação: a mensagem de falha da Tarefa correspondente deve distinguir "sem resposta" de "resposta com erro de certificado/protocolo" quando a API do Tauri o permitir; não bloqueia esta change, é um detalhe de UX a refinar nas tasks.
- [`SessionProvider` (`frontend/src/session/session.tsx:282-285`) chama `restore()` incondicionalmente ao montar, antes de `Gate` decidir mostrar o ecrã de selecção de instância — em modo nativo sem instância ainda guardada, isto dispara um pedido com `baseUrl` nulo] → Mitigação: o módulo da Decisão 2 rejeita de imediato nesse caso (sem tentar construir uma URL inválida); o `catch` já existente em `restore()` (`session.tsx:43-46`) absorve a falha e resulta em "sem sessão", que é o estado correcto a mostrar por trás do ecrã de selecção de instância. Comportamento correcto, mas por composição dos dois mecanismos, não por um caminho dedicado — registado aqui para não ser confundido com um bug se aparecer um erro inofensivo na consola durante o arranque nativo.
- [Testar `instance.ts` isoladamente (fora do browser/Tauri, ao estilo dos scripts `verify-*.mjs` existentes) falha se o módulo importar `@tauri-apps/plugin-store` de forma estática — esse pacote espera a ponte de IPC do Tauri, inexistente em Node] → Mitigação: `instance.ts` só importa o plugin dinamicamente (`await import(...)`) dentro do ramo `isNative()`; a lógica pura (o que guardar, quando limpar, as duas funções da Decisão 2) fica testável em Node sem nunca tocar o plugin real.

## Migration Plan

Mudança aditiva — o build web não muda de comportamento (verificável directamente: nenhum dos ficheiros tocados tem o seu caminho "sem Tauri" alterado, só um novo ramo "com Tauri" é acrescentado). Não há dados a migrar. Depende de `native-client-auth` já estar implementada (o campo `session_token` e o header `Authorization` têm de existir no backend antes desta change poder ser testada ponta-a-ponta); pode ser codificada em paralelo e só integrada/testada depois.
