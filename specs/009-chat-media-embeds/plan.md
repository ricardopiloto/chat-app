# Implementation Plan: Mídia e resolução de links no chat de texto

**Branch**: `009-chat-media-embeds` | **Date**: 2026-09-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/009-chat-media-embeds/spec.md`

## Summary

Adicionar **imagens/GIFs** (até 10 por mensagem, ≤8 MiB) em canais de **texto**, com **cifra no cliente** (server key / AES-GCM) e blobs opacos na instância; e **unfurl lazy** de URLs após decifrar (`POST /api/unfurl`), sem o servidor ler ciphertext para descobrir links. Composer com attach/preview/remove; histórico responsivo. Vídeo só via cartão de link (sem upload de ficheiro de vídeo).

## Technical Context

**Language/Version**: TypeScript (SolidJS) + Rust 2021 (Axum/sqlx) — herdado.

**Primary Dependencies**: SolidJS/Vite; existing `encryptMessage`/`decryptMessage` (server key); Axum; SQLite; HTTP client for unfurl (e.g. `reqwest`) + HTML/OG parse (lightweight).

**Storage**: SQLite migration `message_attachment` (+ optional pending); files under `ATTACHMENTS_DIR` (default `./data/attachments`).

**Testing**: `cargo test` (attach ACL, MIME/size, message bind, unfurl rejects bad URL/SSRF where testable); `npx tsc --noEmit`; manual [quickstart.md](./quickstart.md).

**Target Platform**: Browser desktop + mobile; self-hosted LAN/HTTPS.

**Project Type**: Web app (`frontend/` + `backend/`).

**Performance Goals**: SC-001 media visible ≤5 s LAN; unfurl timeouts so UI never blocks on slow sites.

**Constraints**: Text channels only; client-encrypted blobs; no server unfurl from ciphertext; max 10 attachments / 5 unfurls; no generic files/stickers/Tenor.

**Scale/Scope**: New attachment + unfurl APIs; message JSON/WS extend; Channel composer + message render; migration 0007.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | N/A — contract tests Rust + quickstart |
| Complexity Tracking | Ver tabela — unfurl HTTP é o único sistema novo não trivial |

**Gate: PASS** (complexidade justificada abaixo)

### Re-check pós-Phase 1

Modelo + contratos cobrem attachments E2EE e unfurl lazy; SSRF documentado. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/009-chat-media-embeds/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── attachments-api.md
│   └── unfurl-api.md
└── spec.md
```

### Source Code (repository root)

```text
backend/
├── migrations/0007_message_attachments.sql
├── src/api/attachments.rs, unfurl.rs, messages.rs (extend)
├── src/db/attachment.rs
├── src/domain/attachment.rs
├── src/config.rs                    # ATTACHMENTS_DIR
└── tests/contract/…

frontend/src/
├── crypto/serverKey.ts              # encryptBytes/decryptBytes helpers
├── pages/Channel.tsx                # composer attach + render media + unfurl
├── components/                      # AttachmentThumb, LinkPreviewCard, …
└── api/client.ts                    # types + helpers
```

**Structure Decision**: Backend stores opaque ciphertext files + metadata; frontend owns encrypt/decrypt and URL extraction.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Server-side HTTP unfurl | OG/CORS; product needs previews | Client-only fetch fails on most sites |
| Separate upload then message | Large binary + E2EE | Single JSON base64 blows WS/API |

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/](./contracts/)
- [quickstart.md](./quickstart.md)
