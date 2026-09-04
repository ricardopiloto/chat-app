# Implementation Plan: Fase 3 — Redesign visual (Mesa / Nocturne)

**Branch**: `004-fase-3-design` | **Date**: 2026-09-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-fase-3-design/spec.md`

## Summary

Reaplicar o chrome e os fluxos já entregues nas Fases 1–2 para ficarem **visual e interactivamente próximos** do protótipo **Nocturne v2** (`docs/design-ref/Mesa - Protótipo v2.dc.html` + DS em `docs/design-ref/_ds/nocturne-*`). Shell Mesa (barra, sidebar única, modo palco, tema claro/escuro com palco sempre escuro), canais de texto/voz no padrão do protótipo (banco, Composição/Grade), editor de cenas com rascunho local Salvar/Descartar, e ecrãs de auth/convite/diálogos no mesmo sistema. **Sem** novos contratos HTTP/WS de domínio, **sem** gravação/E2EE-off, **sem** migrações SQLite.

## Technical Context

**Language/Version**: TypeScript (frontend SPA, Vite + SolidJS) — herdado. Backend Rust inalterado para esta feature (só regressão).

**Primary Dependencies**: SolidJS, Vite, design system **Nocturne** vendido/adaptado a partir de `docs/design-ref/_ds/nocturne-*` + tokens semânticos do protótipo v2 (`--panel`, `--stage`, `data-theme`). Sem dependência nova de mídia.

**Storage**: Preferências de UI só no **dispositivo** (`localStorage`): tema, Composição/Grade, modo palco opcional. Sem tabelas novas. Rascunho de cena só em memória no cliente até Salvar (PATCH/PUT já existentes).

**Testing**: Regressão `cargo test` (F1+F2). Frontend: `npx tsc --noEmit`. Validação visual/manual via [quickstart.md](./quickstart.md) + checklist de fidelidade [contracts/fidelity-checklist.md](./contracts/fidelity-checklist.md). Sem suite visual automatizada nesta fase.

**Target Platform**: Navegador Chromium/Firefox (desktop + telemóvel na LAN), HTTPS local como F1.

**Project Type**: Web app (`frontend/` principal; `backend/` + `infra/` estáveis).

**Performance Goals**: Troca de tema &lt;1s percebido (SC-003); shell reconhecível vs protótipo em &lt;2min (SC-001); sem meta de req/s.

**Constraints**: Fidelidade Nocturne (FR-001/014); E2EE sempre on (FR-011/SC-008); sem rail de Servidores; palco escuro nos dois temas; gaveta em viewport estreita; preferência Composição/Grade por pessoa (global); rótulo `instância ·` + `location.hostname`.

**Scale/Scope**: Toda a SPA autenticada + auth/convite. ~todas as páginas em `frontend/src/pages/` e componentes de canal/cena. Grupo pequeno (mesa).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` continua o **template** não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A — não ratificados |
| Test-first obrigatório | N/A — regressão F1/F2 + quickstart visual |
| Library-first / CLI | N/A |
| Complexity Tracking | Não preenchido |

**Gate: PASS.**

### Re-check pós-Phase 1

`data-model.md`, `contracts/` e `quickstart.md` não introduzem Egress, E2EE-off, Postgres, federação, cliente nativo nem APIs de domínio novas. Preferências e rascunho são só cliente. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/004-fase-3-design/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
├── checklists/
└── tasks.md             # /speckit-tasks — NÃO criado aqui
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── styles/                 # tokens Nocturne + tema claro/escuro (+ styles.css legado absorvido)
│   ├── shell/                  # AppShell, TopBar, Sidebar, StageMode
│   ├── theme/                  # data-theme, prefers-color-scheme, localStorage
│   ├── preferences/            # Composição/Grade, chaves de persistência
│   ├── components/             # Dialog, SceneEditor (rascunho), tiles, etc.
│   ├── pages/                  # Auth, Invite, Servers→shell, Channel, VoiceChannel
│   └── video/                  # liveClient — inalterado na lógica LiveKit
└── …

backend/                        # sem migration nesta fase; cargo test = regressão
docs/design-ref/                # fonte da verdade visual (não servida em runtime)
```

**Structure Decision**: Redesign concentrado no `frontend/`. Contratos desta fase são **UI** (tokens, shell, preferências, checklist de fidelidade), não OpenAPI novo. APIs F1/F2 reutilizadas no Salvar do editor.

## Complexity Tracking

> Sem constituição vigente. Divergência deliberada do protótipo v2: controlos de gravação/E2EE-off **omitidos** (spec Out of Scope / clarify F2). Documentado em [research.md](./research.md) D7.

## Phase 0 & Phase 1

- Pesquisa: [research.md](./research.md)
- Modelo: [data-model.md](./data-model.md)
- Contratos: [contracts/](./contracts/)
- Validação: [quickstart.md](./quickstart.md)
