# Proposal

## Why

Dois bugs encontrados em teste real (instalação `.deb`/`.rpm`, Fedora, 2026-10-11/12), depois de `desktop-electron-shell` e `desktop-call-popout` implementadas:

**Bug 1 — arranque fica preso em "Loading..."**: ao abrir a aplicação instalada via `.rpm`, por vezes fica indefinidamente no ecrã de carregamento, sem chegar ao ecrã inicial (login/conteúdo). Causa raiz, confirmada por leitura do código: `SessionProvider.restore()` (`frontend/src/session/session.tsx:44-52`) chama `auth.me()`, que por baixo usa `request()` (`frontend/src/api/http.ts`) — esta função aceita um `signal: AbortSignal` opcional mas **nenhuma chamada no arranque lhe passa um**, e `fetch()` do browser não tem nenhum tempo-limite por omissão. Numa ligação lenta ou sem resposta a uma instância real (ao contrário de `localhost`, mais exposta a variação de rede real), a promise nunca resolve nem rejeita — fica presa para sempre, e `session.phase()` nunca sai de `"loading"` (`frontend/src/index.tsx:56`, mostra `t("auth.loading")` sem alternativa). Descartado como causa: `loadInstance()`/`pickInstance` (`frontend/src/api/instance.ts:103-114`, `frontend/src/index.tsx:45`) — é IPC local (ficheiro no processo principal), já tem `try/catch`, não depende de rede.

**Bug 2 — popout fica em branco, sem erro**: ao entrar numa chamada e abrir o popout, a janela principal mostra correctamente "a chamada está noutra janela" (confirma que o IPC de abertura teve sucesso), mas a janela de popout não mostra nada — nem vídeo, nem erro, nem indicação de progresso. Causa raiz, confirmada por leitura do código: `CallProvider` (`frontend/src/voice/callSession.tsx:624-636`) chama `void call.watch(props.watch)` no `onMount` — o resultado (`Promise<boolean>`, falso em caso de falha, que também define `call.problem = "failed"`/`"noKey"`) é descartado. `frontend/src/voice/CallPopoutWindow.tsx` só reage ao sucesso do IPC de handoff (`takeCallPopout()`), nunca ao sucesso/falha da ligação LiveKit que `watch()` tenta estabelecer a seguir — `<GridView/>` fica montado mesmo que `watch()` falhe, e sem participantes nem indicação de erro, não mostra nada. A causa exacta de `watch()` falhar (rede, token, LiveKit) ainda não está confirmada — esta change corrige a falha silenciosa (torna o erro visível, com opção de tentar de novo), o que também vai revelar a causa de fundo se ainda existir depois da correcção.

## What Changes

- `frontend/src/api/http.ts` (`request`/`requestBytes`): quando nenhum `signal` é passado pelo chamador, aplicar um tempo-limite por omissão (`AbortController`, ex. 15s) que rejeita o pedido em vez de o deixar pendente para sempre. Chamadores que já passam o seu próprio `signal` não são afectados.
- `frontend/src/session/session.tsx` (`restore`): o `catch` já existente trata qualquer rejeição (incluindo a do novo tempo-limite) como "sem sessão" — nenhuma mudança adicional necessária aqui, só deixa de ficar pendente para sempre.
- `frontend/src/voice/CallPopoutWindow.tsx`: passa a verificar o resultado de `call.watch(...)` (ou o `problem()`/`status()` reactivos de `useCall()` depois de montado), e mostra um estado de erro claro com uma acção para tentar de novo (ou fechar a janela) quando a ligação falha, em vez de `<GridView/>` silenciosamente vazio.
- **Fora de escopo explícito**: diagnosticar/corrigir a causa de fundo de `watch()` falhar no popout, se ainda acontecer depois desta correcção (rede, LiveKit, token) — essa seria uma change separada, a abrir depois de se ver o erro real. Qualquer alteração ao tempo-limite de outras chamadas que já passam o seu próprio `signal` (ex. uploads de anexos, se já tiverem um).

## Capabilities

(sem deltas de capability — `skip_specs: true`. Os requisitos relevantes já aceites — "o ecrã de login aparece" no build geral, "o popout liga-se à chamada... mostra os participantes" em `frontend-v2/call-popout` — já descrevem o comportamento correcto; esta change corrige a implementação para o cumprir de forma fiável, sem alterar nenhum requisito.)

## Impact

- **Frontend** (`frontend/src/api/http.ts`): tempo-limite por omissão em pedidos sem `signal` próprio — afecta todos os pedidos REST da aplicação, não só o arranque (mitiga a mesma classe de problema noutros pontos que também não tratam rede lenta/sem resposta).
- **Frontend** (`frontend/src/voice/CallPopoutWindow.tsx`): estado de erro visível, sem alterar `callSession.tsx`/`watch()` em si.
- **Sem impacto**: backend, `desktop-electron-shell`/`desktop-call-popout` (as duas changes continuam correctas na arquitectura; estes são bugs de implementação, não de desenho).
