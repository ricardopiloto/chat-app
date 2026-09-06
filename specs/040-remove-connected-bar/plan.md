# Implementation Plan: Remover barra «ainda na chamada»; controlos só no PiP

**Branch**: `040-remove-connected-bar` | **Date**: 2026-09-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/040-remove-connected-bar/spec.md`

## Summary

Remover o cromado `voice-connected-bar` do `AppShell` quando o utilizador está em chamada fora da mesa. O **PiP** (038) passa a ser o único chrome off-stage: manter **Voltar à mesa**, acrescentar **Sair** como ícone vermelho de telefone na mesma fila de acções (Voltar à esquerda, hangup à direita), sem mic/câmera no PiP. Hangup chama o mesmo `voice.hangup()` da barra/palco, **sem** navegar — permanece na vista actual. Supersede a coexistência barra+PiP da 038.

## Technical Context

**Language/Version**: TypeScript ~5.8 / SolidJS 1.9; CSS `mesa-theme.css`.

**Primary Dependencies**: `AppShell` (`showConnectedBar`, markup da barra); `FloatingVoicePip`; `VoiceSession.hangup()` / leave + `releaseLocalCapture` (035); `IconPhoneHangupFilled` (037).

**Storage**: N/A — só UI shell.

**Testing**: `tsc --noEmit`; [quickstart.md](./quickstart.md) manual. Sem BE.

**Target Platform**: Browser SPA (shell autenticado).

**Project Type**: Web app — `frontend/` only.

**Performance Goals**: Remoção da barra liberta altura do main imediatamente; hangup PiP ≤1 clique (SC-003).

**Constraints**: FR-001–010 + clarificações (sem mic/cam no PiP; stay on view; footer Voltar|hangup). Não alterar call-controls do palco. Coordenar com [039](../039-floating-user-bar/) se hangup também for para a UserPanel (research).

**Scale/Scope**: Um PiP / uma chamada activa; remoção completa do connected-bar.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Quickstart + tsc |
| Complexity Tracking | Vazio |

**Gate: PASS**

### Re-check pós-Phase 1

Diff localizado: apagar barra no AppShell; footer actions no PiP; CSS morto. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/040-remove-connected-bar/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── remove-connected-bar.md
│   └── pip-hangup-ui.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/shell/AppShell.tsx           # remover bloco voice-connected-bar; manter Show PiP
frontend/src/shell/FloatingVoicePip.tsx   # fila Voltar + hangup ícone; stopPropagation no hangup
frontend/src/styles/mesa-theme.css        # .voice-pip-actions; remover/legacy .voice-connected-bar*
frontend/src/components/icons/IconPhoneHangup.tsx  # reutilizar IconPhoneHangupFilled
```

**Structure Decision**: Não criar componente novo — estender PiP + limpar AppShell. Hangup = `void voice.hangup()` sem `navigate`.

## Complexity Tracking

> Vazio — remoção de UI + um botão.

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/](./contracts/)
- [quickstart.md](./quickstart.md)
