# Implementation Plan: Bordas mais arredondadas em todo o sistema

**Branch**: `044-rounded-borders` | **Date**: 2026-09-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/044-rounded-borders/spec.md`

## Summary

Aumentar de forma **moderado–forte** o raio das superfícies caixa em toda a UI Mesa (shell, auth, voz), via tokens `--radius-sm|md|lg` em `nocturne.css` **e** alinhamento dos hardcodes de caixa em `mesa-theme.css` / usos no tema, preservando círculos (`50%`) e pílulas (`999px` / `--radius-pill`). Escala partilhada: sm/md/lg sobem juntos. Sem backend, sem mudança de layout/comportamento.

## Technical Context

**Language/Version**: TypeScript ~5.8 / SolidJS 1.9; CSS custom properties (`nocturne.css` + `mesa-theme.css`).

**Primary Dependencies**: Vite frontend; design tokens existentes; sem novas libs.

**Storage**: N/A

**Testing**: `npx tsc --noEmit`; grep/auditoria de raios residual; validação visual [quickstart.md](./quickstart.md) (claro/escuro).

**Target Platform**: Browser moderno (igual shell Mesa).

**Project Type**: Web app — só `frontend/` (CSS).

**Performance Goals**: Sem custo runtime (só CSS estático); sem regressão de paint perceptível.

**Constraints**: Clarificações 2026-09-06 — grau moderado–forte; tokens + hardcodes Mesa; escala sm/md/lg conjunta; fora de âmbito: auditoria exaustiva CSS/inline, fornecedores, tipografia/cor/elevação.

**Scale/Scope**: ~3 tokens + dezenas de `border-radius` hardcoded em `mesa-theme.css` (e eventuais refs em `nocturne.css`); shell + auth + voz.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Quickstart visual + tsc; sem contract BE |
| Complexity Tracking | Vazio (só tokens CSS) |

**Gate: PASS**

### Re-check pós-Phase 1

Design localizado a tokens + mapeamento de hardcodes + contrato UI. Sem BE, sem novas deps. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/044-rounded-borders/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── radius-scale.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/styles/nocturne.css     # --radius-sm|md|lg (e fallbacks se existirem)
frontend/src/styles/mesa-theme.css   # hardcodes caixa → tokens ou novos px alinhados
# opcional: grep TSX por borderRadius inline (alinhar se caixa Mesa)
```

**Structure Decision**: Feature 100% FE/CSS no design system Mesa. Preferir `var(--radius-*)` onde o hardcoded corresponde a um degrau; mapear literais orphan (6/10/12/14/16) para a nova escala documentada em research/contracts.

## Complexity Tracking

> Sem violações.

## Phase 0 & 1 outputs

- [research.md](./research.md) — mapeamento px e regras de preservação
- [data-model.md](./data-model.md) — escala de raio como “entidade” de design
- [contracts/radius-scale.md](./contracts/radius-scale.md) — contrato UI
- [quickstart.md](./quickstart.md) — checklist visual
