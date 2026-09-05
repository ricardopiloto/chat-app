# Implementation Plan: Endurecimento de segurança e higiene de código

**Branch**: `024-security-hardening` | **Date**: 2026-09-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/024-security-hardening/spec.md`

## Summary

Endurecer o **único** processo HTTP (Axum + SQLite) sem BFF. Perfil de produção explícito recusa credenciais LiveKit de exemplo e exige cookie Secure; bind default loopback; unfurl com DNS + tecto de corpo; ritmo em login/registo; primeiro operador sob lock SQLite; URL de voz = `LIVEKIT_WS_URL`; envelopes só no handoff; CSP/frame-ancestors e fontes sem CDN; helpers de autorização partilhados. Documentar produção em `docs/operar-instancia.md`.

## Technical Context

**Language/Version**: Rust 2021 (backend); TypeScript ~5.8 / SolidJS 1.9 (SPA).

**Primary Dependencies**: Axum 0.8, sqlx SQLite, reqwest+url (unfurl), tower-http (headers); frontend `mesa-theme.css` / `nocturne.css` / `LinkPreviews.tsx`.

**Storage**: SQLite existente (sem tabela nova para ritmo — memória do processo). Sem schema para CSP.

**Testing**: `cargo test --test contract` + testes novos (unfurl SSRF, rate limit, boot production, voice URL, envelope, first-operator race); `cd frontend && npx tsc --noEmit`; [quickstart.md](./quickstart.md).

**Target Platform**: Self-hosted Linux; LAN (sem perfil) vs produção (MESA_PRODUCTION).

**Project Type**: Web app — um serviço + SPA; proxy TLS opcional (Caddy/nginx) **fora** do binário.

**Performance Goals**: Unfurl ≤5 s, corpo ≤256 KiB; ritmo não afecta o caminho feliz de login.

**Constraints**: FR-016/017 — sem BFF, sem MFA, sem mudar armazenamento de chaves de canal; FR-011 — nunca Host/X-Forwarded-Host.

**Scale/Scope**: Grupo pequeno / uma instância; ritmo in-process (reinício limpa buckets).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Contract tests para SSRF, ritmo, boot, voz, envelope, operador inicial |
| Complexity Tracking | Vazio |

**Gate: PASS**

### Re-check pós-Phase 1

Contratos de boot/unfurl/auth/voz/envelope/CSP; data-model sem persistência nova de ritmo. Sem BFF. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/024-security-hardening/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── production-boot.md
│   ├── unfurl.md
│   ├── auth-abuse.md
│   ├── voice-signaling.md
│   ├── key-envelopes.md
│   └── browser-headers.md
└── spec.md
```

### Source Code (repository root)

```text
backend/src/
├── config.rs                 # ALTERAR — MESA_PRODUCTION, BIND default loopback, validate()
├── main.rs                   # ALTERAR — validate before bind; security headers layer
├── api/
│   ├── auth/{login,register}.rs  # ritmo; BEGIN IMMEDIATE no primeiro operador
│   ├── unfurl.rs             # DNS + cap + image_url
│   ├── voice.rs              # join: url = config.livekit_url
│   ├── key_envelopes.rs      # handoff-only para outra conta
│   ├── messages.rs / attachments.rs  # usar helpers partilhados
│   └── authz.rs              # NOVO — require_member, channel member, history_since
├── token/mod.rs              # ALTERAR — remover rewrite por Host
└── tests/contract/           # NOVOS módulos

frontend/src/
├── styles/nocturne.css       # remover @import Google Fonts; stack system-ui
├── components/LinkPreviews.tsx  # recusar img_url não http(s) público
docs/operar-instancia.md      # secção Produção + BIND explícito na LAN
```

**Structure Decision**: Um binário Axum. Cabeçalhos via middleware. Autorização em `api/authz.rs`. Ritmo em módulo pequeno (HashMap+Mutex), desligado ou folgado em `TestApp`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/](./contracts/)
- [quickstart.md](./quickstart.md)
