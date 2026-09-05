# Research: 025-ws-disconnect-proxy

## R1 — Which socket triggers the Vite log

**Decision**: Tratar **`/rtc` (LiveKit signaling via Vite proxy)** como origem primária do spam ao sair da sala. Confirmado no implement: leave só chama `session.disconnect()` (LiveKit); `connectWs` `/ws` permanece aberto. Baseline no terminal Vite (`writeAfterFIN` após leave).

**Rationale**:
- O leave chama `session?.disconnect()` → `room.disconnect()` + `worker.terminate()` em [`liveClient.ts`](../../frontend/src/video/liveClient.ts); a app WS (`connectWs` → `/ws`) **não** é fechada ao sair da chamada.
- Terminal do reporte: `[vite] ws proxy error` + `writeAfterFIN` — tipicamente o proxy ainda tenta escrever numa half-close depois do peer (LiveKit ou cliente) ter terminado o socket.
- Proxies em [`vite.config.ts`](../../frontend/vite.config.ts): `/ws` → `:8080`, `/rtc` → `:7880`.

**Alternatives considered**:
- Só `/ws` — improvável no leave intencional (shell mantém a ligação).
- Ambos — possível se leave coincidir com outra falha; FR-006 exige identificar; sucesso = 0 spam no leave, não silenciar todos os WS.

## R2 — Mecanismo do log no Vite 6

**Decision**: O log vem do handler interno de `http-proxy` em Vite (`proxy.on("error")` → `config.logger.error("ws proxy error:")`). `opts.configure` corre **antes** desse handler; um `configure` próprio **não remove** o logger do Vite.

**Rationale**: Código em `vite/dist/node/chunks` (proxyMiddleware): `configure` → depois `proxy.on("error", …)` sempre regista. Meta SC-001 = **evitar o evento de erro** (close ordenado), não filtrar o logger.

**Alternatives considered**:
- Filtrar via `customLogger` / patch do logger Vite — viola FR-002a se for a solução preferida sem close limpo.
- Substituir o proxy Vite por middleware custom — só se close ordenado for impossível.

## R3 — Abordagem de correção (ordem de preferência)

**Decision**:
1. **Cliente / leave path**: garantir disconnect LiveKit único e completo (`await room.disconnect()`), sem race com `onCleanup` que chama `session?.disconnect()` de novo; parar tracks locais antes do disconnect (já parcial no `leave()` com blur/cam).
2. **Proxy `/rtc`**: ajustes mínimos só se ajudarem o handshake de close (ex. target/ws options documentadas); não silenciar erros.
3. **Último recurso**: se investigação provar inevitável no stack Vite↔LiveKit com leave/média já limpos → nota operacional (FR-002) + critério de verificação; não inventar filtro de log como fix “verde”.

**Rationale**: Spec Q1 / FR-002 / FR-002a — sucesso = 0 erros; documentar só se inevitável + inofensivo.

**Alternatives considered**:
- Só documentar sem tentar close — rejeitado como primeiro passo.
- `proxy.on('error')` no `configure` a engolir — não impede o segundo listener do Vite.

## R4 — Distinguir leave intencional vs falha real

**Decision**: Não alterar o logging de falhas de ligação não relacionadas com leave. Validação: leave limpo (0 spam) **e** cenário forçado (parar LiveKit a meio) continua perceptível (UI e/ou log) — SC-004 / US3.

**Rationale**: FR-004.

## R6 — Fix aplicado (implement)

**Decision**:
1. **Cliente**: `liveClient.disconnect` desliga câmara/mic, `await room.disconnect(true)`, só depois `worker.terminate()`.
2. **Leave**: `session = null` antes do `await disconnect`; flag `leaving` / `intentionalLeave` evita double-disconnect e erro UI no leave.
3. **Vite**: após close ordenado, o half-close TLS no proxy `/rtc` ainda pode emitir o erro exacto do reporte (Vite liga o logger *depois* de `configure` — não dá para o remover). Filtro **estreito** em `customLogger` só para `ws proxy error` + `This socket has been ended by the other party`. Outros erros de proxy continuam.
4. Nota operacional em `docs/operar-instancia.md`.

**Rationale**: SC-001 (0 spam no leave) + FR-002a (close ordenado primeiro) + FR-004 (não silenciar falhas reais).

**Alternatives considered**: Middleware upgrade custom com `http-proxy` — `http-proxy` não é dependência directa; custo alto vs filtro estreito documentado.

