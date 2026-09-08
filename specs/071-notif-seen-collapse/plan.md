# Implementation Plan: Notificações — vista limpa, 5+, limpar e sino maior

**Branch**: `071-notif-seen-collapse` (artefactos em `specs/071-…`; git branch local pode diferir) | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/071-notif-seen-collapse/spec.md`

**Depends on**: [062](../062-message-mentions-replies/), [066](../066-topbar-notif-panel/), [068](../068-notif-channel-datetime/)

**Note**: `.specify/feature.json` → `specs/071-notif-seen-collapse`. Clarifications locked (viewport-seen, 5+ só não lidas de canal, menção+resposta sempre detalhe, badge binário, 5+ → não lida mais antiga, Limpar, sino maior).

## Summary

Evoluir o painel TopBar de notificações para: (1) **marcar lida automaticamente** qualquer notificação durável (menção/resposta) cuja mensagem alvo entre no **viewport** do histórico; (2) tratar **não lidas de canal** (sessão) como itens por mensagem, com **5+** por canal quando >5 (menções/respostas **nunca** colapsam); (3) acção **Limpar** (duráveis via API + limpar sessão); (4) sino **um pouco maior**; badge já é binário (ponto) — manter.

Hoje a sessão só guarda um `Set` de `channelId` e `ChannelRoute` limpa o canal ao **abrir** — isso impede 5+ e conflita com «só limpa no viewport». O plano migra a sessão para lista por mensagem e remove o `markSeen` no enter.

## Technical Context

**Language/Version**: TypeScript / SolidJS (FE); Rust / Axum (BE — mark-all-read).

**Primary Dependencies**: `TopBar.tsx`, `preferences/notifications.ts`, `Channel.tsx` / `highlightSeen`, `ChannelRoute.tsx`, `App.tsx` (`message.new` → unseen), `api/client.ts`, `api/notifications.rs` + `db/notification.rs`, `mesa-theme.css`, `IconBell`.

**Storage**: SQLite `user_notification` (existente) + novo endpoint mark-all-read; sessão in-memory (mapa canal → itens mensagem) no cliente.

**Testing**: `tsc --noEmit`; contrato BE se houver mark-all; manual [quickstart.md](./quickstart.md).

**Target Platform**: Browser TopBar + canal de texto.

**Project Type**: Web app (FE + thin BE).

**Performance Goals**: Mark-read por mensagem vista sem bloquear scroll; agregação O(n) no painel; mark-all uma request.

**Constraints**: Menção/resposta sempre linhas completas; 5+ só sessão «não lidas»; sem número no badge; não limpar durável só por abrir o canal; Limpar sem confirmação.

**Scale/Scope**: ~6–10 ficheiros FE + 1–2 BE + CSS; sem redesign do TopBar.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Quickstart + tsc (+ contrato mark-all se aplicável) |
| Complexity Tracking | Sessão por mensagem justificada em research (5+ exigido) |

**Gate: PASS**

### Re-check pós-Phase 1

Contratos UI + API mark-all + data-model + quickstart. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/071-notif-seen-collapse/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── notif-panel-seen-collapse.md
│   └── notifications-mark-all-read.md
└── spec.md
```

### Source Code (repository root)

```text
backend/src/api/notifications.rs          # POST mark-all (ou equivalente)
backend/src/db/notification.rs            # mark_all_read_for_account
backend/src/api/mod.rs                    # route
frontend/src/api/client.ts                # markAllNotificationsRead
frontend/src/preferences/notifications.ts # per-message session unseen + clearAll
frontend/src/App.tsx                      # markUnseen(channel, messageId, at)
frontend/src/pages/ChannelRoute.tsx       # remove markSeen-on-enter
frontend/src/pages/Channel.tsx            # viewport → clear session item + durable read
frontend/src/shell/TopBar.tsx             # Limpar, 5+, larger bell, sync list
frontend/src/styles/mesa-theme.css        # Limpar + optional bell sizing
```

**Structure Decision**: Keep durable vs session sections; extend session store; thin BE for Limpar persistence of durables.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected |
|-----------|------------|------------------------------|
| Session store per-message (not Set channel) | Spec 5+ and oldest-unread deep-link need counts/ids | Keep one row/channel — cannot implement 5+ or oldest msg |
| Stop markSeen on channel enter | Spec: open channel without viewport must not clear | Keep enter-clear — contradicts clarify Q2 |
