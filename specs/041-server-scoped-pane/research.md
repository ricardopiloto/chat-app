# Research: 041-server-scoped-pane

## R1 — Causa raiz do bug

**Decision**: Hoje `ServerRail` → `onSelectServer` só actualiza `selectedServerId` em `AppShell` e **não** navega. A rota `/channels/:id` permanece no canal do servidor anterior → painel «errado».

**Rationale**: Confirmado em `Sidebar.tsx` (`onSelect={(s) => props.onSelectServer(s)}`) sem `navigate`.

**Alternatives considered**: Só esconder o pane com CSS se `channel.server_id !== selected` (frágil; URL stale; deep links partidos).

## R2 — Acção ao seleccionar servidor

**Decision**: Handler único `selectServer(server)`:

1. `onSelectServer(server)`.
2. Carregar canais do servidor (já em cache/resource da Sidebar ou fetch).
3. Se `channels.length === 0` → `navigate(/servers/${server.id})` (vista vazia + piada).
4. Senão → `target = resolveChannel(server.id, channels)` → `navigate(/channels/${target.id}?server=…&type=…)`.

Chamar o mesmo fluxo a partir da rail (e create-server success se já navega para voz — manter).

**Rationale**: FR-001–004; URL e painel alinhados.

**Alternatives considered**: Limpar só o main sem mudar URL (estado fantasma); modal em vez de navigate.

## R3 — Regra `resolveChannel` (clarificação)

**Decision**:

```text
resolve(serverId, channels) =
  let last = readLastChannel(serverId)
  if last && channels.some(c => c.id === last) → that channel
  else first where type === 'text'
  else channels[0]
```

**Rationale**: Clarificações sessão 2026-09-06 / FR-003.

**Alternatives considered**: Sempre primeiro texto (rejeitado); nunca auto-open (rejeitado).

## R4 — Persistência último canal

**Decision**: Módulo `preferences/lastChannelByServer.ts`:

- Key: `mesa.lastChannelByServer` → JSON `Record<string, string>` (serverId → channelId).
- `writeLastChannel(serverId, channelId)` ao mostrar canal com sucesso em `ChannelRoute` (e ao clicar canal na Sidebar).
- `readLastChannel(serverId)`.
- Se canal apagado / inválido → ignore e caia no fallback da regra.

**Rationale**: FR-009; padrão igual a `uiPrefs.ts`.

**Alternatives considered**: Cookie; sync servidor (fora de âmbito); só memória de sessão (rejeitado na clarificação).

## R5 — Ecrã vazio + piadas

**Decision**:

- Página `EmptyServerPane` na rota `/servers/:serverId`.
- Fundo neutro (`.main` / classe dedicada); uma frase centrada.
- `emptyServerJokes.ts`: array ≥3 strings PT-BR leves; `pickJoke()` com `Math.random()` **por montagem** da vista (nova visita / reselect → nova escolha; pode repetir).
- Não usar fallback «Canal não encontrado» (ChannelRoute) para este caso.

**Rationale**: FR-004–007 / SC-002.

**Alternatives considered**: Reusar `Canal não encontrado` (rejeitado); piada só no Sidebar (rejeitado — pedido é área principal).

## R6 — Guard anti-mismatch

**Decision**: Em `ChannelRoute` (ou effect na shell): se `channel.server_id` está definido e `selectedServerId` (via query `server` ou contexto) diverge do canal carregado **após** troca intencional, a navegação em R2 já corrige. Extra: se URL tem canal cujo `server_id` ≠ `search.server` quando ambos presentes, preferir realinhar para o servidor da query ou do selected — no fluxo R2 a query acompanha o navigate.

Opcional defensivo: se o utilizador edita a URL para um canal de A com `?server=B`, redireccionar conforme selected/B.

**Rationale**: Edge case «URL ainda é de A».

## R7 — Voz / PiP

**Decision**: Não chamar `hangup` ao mudar de servidor. Só `navigate`. PiP/barra ligada (038/028) continuam se `voice.live` noutro canal.

**Rationale**: FR-008.

## R8 — Testes

**Decision**: Quickstart manual (A↔B, vazio+piada, reload last channel, voz em A + UI em B); `tsc --noEmit`.

**Rationale**: 100% navegação/UI.
