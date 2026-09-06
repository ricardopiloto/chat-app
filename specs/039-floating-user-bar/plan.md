# Implementation Plan: Barra de Usuário Flutuante

**Branch**: `039-floating-user-bar` | **Date**: 2026-09-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/039-floating-user-bar/spec.md`

## Summary

Adicionar um **painel fixo** no fundo da coluna de navegação (estilo Discord user panel): avatar + online + handle + definições/conta. **Microfone, deafen, câmara (+blur) e sair** partilham estado com `VoiceSession` / palco, mas aparecem **num único sítio activo**: no **palco** enquanto se vê o canal de voz da chamada; na **barra de utilizador** quando se está em chamada noutro sítio; **ocultos** na barra no palco; **visíveis e desabilitados** na barra fora de chamada. Remover o acesso à conta duplicado no TopBar. Deafen é novo (cliente LiveKit: silenciar remotes + mutar mic).

## Technical Context

**Language/Version**: TypeScript ~5.8 / SolidJS 1.9; CSS `mesa-theme.css`. Sem mudança Rust obrigatória (media já via `PATCH …/voice/media`).

**Primary Dependencies**: `AppShell` / `Sidebar` / `TopBar`; `VoiceSession` (`micOn`, `camOn`, `session`, `hangUp` / leave); `VoiceChannel` call-controls + `CameraBlurMenu`; LiveKit `LocalParticipant.setMicrophoneEnabled` / camera + remote audio volume; `IdentityAvatar`; menu de conta existente.

**Storage**: Preferências UI opcionais em memória/`uiPrefs` se necessário; **sem** migração BE. Deafen **não** precisa de coluna no servidor nesta entrega (estado local da sessão).

**Testing**: `npx tsc --noEmit`; validação [quickstart.md](./quickstart.md); sem contract BE novo (salvo regressão voice media se tocado).

**Target Platform**: Browser SPA autenticada (incl. viewport estreita / drawer).

**Project Type**: Web app — foco `frontend/`.

**Performance Goals**: Toggle mic/deafen/cam ≤1 clique (SC-001/002); sem jank ao transitar palco↔texto.

**Constraints**: FR-001–017 + clarificações (controlos num sítio; ocultar grupo na barra no palco; deafen Discord-like). Coordenar com [040](../040-remove-connected-bar/) (remove `voice-connected-bar`, hangup no PiP) — ver research.

**Scale/Scope**: Uma chamada activa por cliente; barra em todas as vistas autenticadas do shell.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Quickstart + tsc |
| Complexity Tracking | Deafen + sítio activo (justificado) |

**Gate: PASS**

### Re-check pós-Phase 1

Só FE: painel shell + estado deafen em `VoiceSession` + conditional render palco vs barra. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/039-floating-user-bar/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── user-panel-ui.md
│   ├── call-controls-active-site.md
│   └── deafen-behavior.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/shell/UserPanel.tsx          # novo — identidade + controlos condicionais
frontend/src/shell/Sidebar.tsx            # montar UserPanel no fundo da coluna
frontend/src/shell/TopBar.tsx             # remover account chip/menu duplicado
frontend/src/shell/AppShell.tsx           # passar me/identity/logout; predicar «on stage»
frontend/src/voice/VoiceSession.tsx       # deafened; APIs mute/cam/leave partilháveis
frontend/src/pages/VoiceChannel.tsx       # call-controls só quando sítio activo = palco;
                                          # deafen no palco quando no palco
frontend/src/components/CameraBlurMenu.tsx  # reutilizar na barra quando off-stage
frontend/src/styles/mesa-theme.css        # .user-panel* Discord-like
frontend/src/components/icons/…           # IconDeafen / headphones-slash se em falta
```

**Structure Decision**: `UserPanel` no rodapé da sidebar (não overlay flutuante absoluto sobre o main). Estado de mídia centralizado em `VoiceSession`; UI escolhe **onde** renderizar com base em `connected && viewingActiveVoiceChannel`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Deafen client-side | Spec exige deafen Discord-like | Só mute local não silencia remotes |
| Dual mount call-controls | Clarificação: um sítio activo | Duplicar sempre viola FR e clarificações |

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/](./contracts/)
- [quickstart.md](./quickstart.md)
