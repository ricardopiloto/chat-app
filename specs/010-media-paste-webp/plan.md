# Implementation Plan: Colar imagens, WebP e limite 5 MB

**Branch**: `010-media-paste-webp` | **Date**: 2026-09-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/010-media-paste-webp/spec.md`

## Summary

Estender a 009: (1) **colar** imagens em **todo o painel** do canal de texto → anexos pendentes (texto da mesma colagem → composer); (2) colagens de imagem **estática** convertidas no cliente para **WebP** (GIF **animado** permanece GIF); (3) baixar o teto por anexo de **8 MiB → 5 MiB** no cliente e no servidor. Sem migração de schema; reutiliza upload E2EE e UI de anexos pendentes.

## Technical Context

**Language/Version**: TypeScript (SolidJS) + Rust 2021 (Axum/sqlx) — herdado.

**Primary Dependencies**: SolidJS/Vite; Canvas/`toBlob('image/webp')` no browser; parser leve de GIF (detectar animação); domínio `MAX_ATTACHMENT_BYTES` + body limit Axum.

**Storage**: Inalterado (SQLite `message_attachment` + `ATTACHMENTS_DIR`); só metadata `content_type`/`size_bytes` reflectem WebP/GIF após conversão.

**Testing**: Actualizar contract tests de tamanho (5 MiB); `npx tsc --noEmit`; manual [quickstart.md](./quickstart.md) (paste + WebP + rejeição >5 MiB).

**Target Platform**: Browser desktop + mobile; self-hosted LAN/HTTPS.

**Project Type**: Web app (`frontend/` + `backend/`).

**Performance Goals**: SC-001 — colagem → histórico ≤5 s LAN após envio; conversão WebP síncrona aceitável para capturas típicas de ecrã.

**Constraints**: Só painel de canal de texto; WebP só em colagens estáticas; seletor mantém JPEG/PNG/WebP/GIF; max 10 anexos; E2EE inalterado; sem editor de imagem.

**Scale/Scope**: Constante 5 MiB (FE+BE); helper paste/WebP/GIF; listener `paste` no pane; mensagens de erro actualizadas.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | N/A — contract tests tamanho + quickstart |
| Complexity Tracking | Nenhuma violação nova (só cliente + constante) |

**Gate: PASS**

### Re-check pós-Phase 1

Contrato de attachments actualiza só o max size; modelo documenta pending paste/WebP sem entidades novas. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/010-media-paste-webp/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── attachments-size.md
└── spec.md
```

### Source Code (repository root)

```text
backend/
├── src/domain/attachment.rs          # MAX_ATTACHMENT_BYTES → 5 MiB
├── src/api/mod.rs                    # DefaultBodyLimit alinhado
└── tests/contract/attachments.rs     # oversized = 5 MiB + 1

frontend/src/
├── api/client.ts                     # MAX_ATTACHMENT_BYTES + copy
├── media/pasteWebp.ts                # GIF anim detect + static→WebP
└── pages/Channel.tsx                 # paste no pane; onPickFiles 5 MiB
```

**Structure Decision**: Sem novos endpoints; lógica de colagem/WebP no frontend; política de tamanho partilhada FE/BE.

## Complexity Tracking

Nenhuma violação a justificar.

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/attachments-size.md](./contracts/attachments-size.md)
- [quickstart.md](./quickstart.md)
