# Design

## Context

Ver `proposal.md` — Why. Pontos de código que ancoram este design:

- `frontend/src/api/http.ts:31-60` (`RequestOptions`/`toInit`/`request`): `signal` já é um parâmetro aceite (passado directamente ao `fetch()`), mas nenhuma chamada no caminho de arranque (`auth.me()`) o fornece — sem `AbortController`, `fetch()` não tem tempo-limite próprio.
- `frontend/src/session/session.tsx:44-52` (`restore`): já tem `try/catch` em volta de `auth.me()` — qualquer rejeição (incluindo um futuro timeout) já é absorvida correctamente, resultando em "sem sessão" (`setAccount(undefined)`), que é o comportamento certo para um utilizador sem ligação.
- `frontend/src/voice/callSession.tsx:624-636` (`CallProvider`): `void call.watch(props.watch)` — resultado descartado. `watch()` (linhas 302-368) já define `call.problem()` em caso de falha (`"noKey"`, `"failed"`) de forma consistente com o resto do módulo.
- `frontend/src/voice/GreenRoom.tsx:152-153`: padrão já estabelecido para mostrar `call.problem()` — `<Show when={call.problem()}>{(p) => <p class="call-inline-error" role="alert">{t(\`call.problem.${p()}\`)}</p>}</Show>`. `frontend/src/i18n/catalogs/voice.en.ts:65-67` já tem o texto para `noKey`/`unavailable`/`failed`.

## Goals / Non-Goals

**Goals:**
- Um pedido de rede sem resposta nunca mais deixa o arranque preso indefinidamente em "Loading...".
- Uma falha ao estabelecer a ligação do popout fica visível, com uma forma de tentar de novo — nunca mais um ecrã em branco sem pista nenhuma.
- Reaproveitar o padrão de erro já estabelecido (`call.problem()`/`GreenRoom.tsx`) em vez de inventar um novo.

**Non-Goals:**
- Diagnosticar a causa de fundo de `watch()` falhar no popout, se continuar a falhar depois desta correcção — ver proposal.md, fora de escopo explícito.
- Mudar o comportamento de pedidos que já definem o seu próprio `signal`.
- Qualquer UI/UX nova além de mostrar o erro já existente e permitir tentar de novo — sem ecrã de diagnóstico avançado, sem telemetria.

## Decisions

### 1. Tempo-limite por omissão em `http.ts`, não só no caminho de arranque

Alternativa descartada: passar um `AbortController`/timeout só na chamada específica de `auth.me()` no arranque. Rejeitada por ser a correcção mais estreita possível para um problema mais geral — qualquer outro pedido REST da aplicação que não defina o seu próprio `signal` tem exactamente a mesma exposição a uma rede lenta/sem resposta (ficar pendente para sempre). Aplicar o tempo-limite por omissão dentro de `toInit`/`request`/`requestBytes` (quando `opts.signal` não é fornecido, criar um `AbortController` interno com um `setTimeout`) corrige a classe de problema inteira com uma só mudança, sem exigir que cada chamador se lembre de o fazer.

### 2. 15 segundos como valor por omissão

Tempo suficiente para uma ligação lenta mas real completar um pedido JSON pequeno (login/`auth/me`/etc.), curto o suficiente para não deixar a aplicação parecer presa por minutos. Não configurável nesta change — se se revelar errado em uso real, ajustar o número é uma mudança trivial, não precisa de ficar configurável à partida.

### 3bis. Uploads de bytes ficam fora do tempo-limite por omissão

Achado por ambas as revisões (`review-architect.md` e `review-fullstack.md`): confirmado por `grep -rn "signal:" frontend/src/api/` que hoje **nenhuma** chamada passa `signal`, incluindo os três pontos que enviam `opts.bytes` (`frontend/src/api/endpoints/conversation.ts:21`, anexos até 5 MiB; `servers.ts:14`, imagem de servidor; `auth.ts:34`, avatar até 1 MiB). Um tempo-limite de 15s pensado para pedidos JSON pequenos aplicar-se-ia também a estes uploads maiores, introduzindo uma falha nova (upload a abortar por timeout numa ligação lenta) como efeito colateral de corrigir o arranque preso — exactamente o cenário de rede que motivou esta change.

Decisão: dentro de `toInit`, quando `opts.signal` não é fornecido, só aplicar o `AbortController`/`setTimeout` de 15s quando `opts.bytes` também não está definido. Pedidos com `opts.bytes` ficam sem tempo-limite por omissão (mesmo comportamento actual) — não têm hoje nenhum problema de arranque preso associado (não fazem parte do caminho de `restore()`), e dar-lhes um valor "maior" arbitrário só trocaria um número mágico por outro sem resolver nada melhor do que manter o comportamento actual. Se uploads lentos-sem-resposta se revelarem um problema real em uso, é uma change futura dedicada (com um valor calibrado ao tamanho, não um palpite).

### 3. `CallPopoutWindow.tsx` reage a `call.problem()`, não só ao handoff IPC

Reaproveita o padrão já usado em `GreenRoom.tsx` (`Show when={call.problem()}`, mesmas chaves de i18n `call.problem.*`) em vez de inventar uma mensagem nova só para o popout — consistência com o resto da aplicação, e o texto já existente (`failed: "Could not join the call. Try again."`) já descreve exactamente a situação. A acção de "tentar de novo" volta a chamar `call.watch(props.watch)` com os mesmos parâmetros; a acção de fechar usa o IPC já existente (`closeCallPopout`).

Detalhe estrutural (achado em `review-fullstack.md`): `useCall()` só é legível a partir de um descendente de `<CallProvider>` — lança se chamado fora dele. Como o `<Match when={watch()}>` de `CallPopoutWindow.tsx` já renderiza `<GridView/>` como filho de `<CallProvider>`, mostrar o erro "em vez de" `<GridView/>` exige um pequeno componente interno (ex. `Stage`) que chama `useCall()` e decide entre erro e `<GridView/>`, colocado dentro do `<CallProvider>` no lugar de `<GridView/>` directo — não é possível ler `call.problem()` dentro do próprio `CallPopoutWindow` antes do provider montar.

## Risks / Trade-offs

- [Um tempo-limite de 15s pode ser demasiado curto nalgumas ligações genuinamente lentas (ex. 3G fraco), causando uma falha onde antes — mal — ficaria só muito lento] → Mitigação aceite: preferível a ficar preso para sempre sem nenhuma indicação; o `catch` de `restore()` já trata isto como "sem sessão", não como erro fatal, e o utilizador pode tentar de novo (reabrir a app, ou uma acção futura de "tentar de novo" se se revelar necessário — fora de escopo desta change específica).
- [Corrigir a falha silenciosa do popout pode revelar que `watch()` falha sempre por uma causa de fundo ainda não corrigida (ex. a mesma instabilidade de rede com `livekit.1nodado.com.br` já vista em logs anteriores) — o popout passaria a mostrar sempre um erro em vez de nunca mostrar nada] → Mitigação: aceite como o resultado correcto desta change — um erro visível é estritamente melhor do que um ecrã em branco, mesmo que revele um problema que ainda precise de outra change para o resolver.

## Migration Plan

Correcções aditivas, sem mudança de comportamento visível para quem já tem ligações rápidas/fiáveis. Aplicável de imediato, independente de qualquer outra change em curso.
