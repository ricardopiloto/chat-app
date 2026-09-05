# Research: 024-security-hardening

## R1 — Perfil de produção e credenciais LiveKit

**Decision**: `MESA_PRODUCTION=1` (ou `true` / `MESA_ENV=production`). Com o perfil: recusar `LIVEKIT_API_KEY=instkey` **e** `LIVEKIT_API_SECRET=instsecretinstsecretinstsecret12`; exigir `COOKIE_SECURE=true`. Sem perfil: defaults actuais de chaves de exemplo ainda arrancam. `Config::validate()` no `main` antes do bind.

**Rationale**: Clarificação A — não partir o guia LAN de 30 minutos.

**Alternatives considered**: Inferir produção por bind/HTTPS — frágil. Recusar sempre o par de exemplo — parte o quickstart.

## R2 — Bind default

**Decision**: Default `BIND=127.0.0.1:8080`. Escuta em todas as interfaces só com `BIND=0.0.0.0:8080` (ou outro não-loopback) **explícito**. Guia LAN documenta essa linha; guia produção recomenda loopback + proxy TLS.

**Rationale**: FR-002.

**Alternatives considered**: Manter `0.0.0.0` — rejeitado (superfície por omissão).

## R3 — Unfurl SSRF e DoS

**Decision**: Antes de cada GET (e após cada redirect, máx. 3): parse URL → http(s) only → `lookup_host` em `spawn_blocking` → todos os IPs passam `is_blocked_ip` (v4 private/loopback/link-local/unspecified/broadcast; v6 loopback/ULA/unspecified; bloquear `169.254.0.0/16` e IPv4-mapped). Corpo: `Content-Length` se >256 KiB recusar; senão ler com tecto 256 KiB (não `bytes()` ilimitado). Timeout 5 s. `image_url` OG: mesmo validador; cliente `LinkPreviews` ignora `javascript:` / não-http(s).

**Rationale**: FR-005/006/007; o código actual salta DNS e baixa o corpo inteiro.

**Alternatives considered**: Só blocklist de hostnames — insuficiente (DNS rebinding).

## R4 — Ritmo login/registo

**Decision**: In-process, chave = IP do pedido (`x-forwarded-for` **só** com perfil de produção **e** o operador confia no proxy — senão `ConnectInfo` / `socket`). Sem produção: usar o endereço de ligação, ignorar XFF (evita bypass). Limite: **10** POST falhados ou totais a `/api/auth/login` e `/api/auth/register` por IP por **60 s**; excesso **429** `{ "error": "too many requests" }` (sem revelar handle). `TestApp` define `rate_limit_per_minute: u32::MAX` ou `MESA_RATE_LIMIT_DISABLED=1`.

**Rationale**: SC-004; sem Redis numa instância SQLite.

**Alternatives considered**: `tower_governor` — dep extra; buckets em SQLite — overkill.

## R5 — Primeiro operador

**Decision**: Em `register_inner`, `BEGIN IMMEDIATE` (sqlx transaction) → `COUNT(*)` → no máximo um `is_initial_operator`. Segundo paralelo: conta normal **sem** flag **ou** 409 se a política for «segundo precisa convite» (já existe quando count>0). A corrida count==0/count==0 fica serializada pelo lock de escrita SQLite.

**Rationale**: FR-010 / SC-005.

**Alternatives considered**: Unique index parcial — SQLite limita; tabela singleton — mais migração.

## R6 — URL de voz

**Decision**: `VoiceJoinResponse.url` = `config.livekit_url` (`LIVEKIT_WS_URL`). Apagar `signaling_url` baseado em `Host` / `X-Forwarded-Host`. Guia: LAN `ws://<IP-LAN>:7880`; produção `wss://…`.

**Rationale**: Clarificação A da URL; FR-011.

**Alternatives considered**: Allowlist de hosts — complexidade sem ganho após A.

## R7 — Envelopes

**Decision**: `POST` envelope para `account_id != caller`: permitir só se o alvo é membro com `key_handoff_status=pending` **e** o caller é dono do servidor **ou** membro `synced`. Self-upsert sempre. Overwrite de envelope de outro `synced` → 403.

**Rationale**: FR-012 (handoff, não vandalismo).

**Alternatives considered**: Só o dono sela — mais seguro, pior UX se o dono offline; qualquer membro — status quo inseguro.

## R8 — Cabeçalhos e fontes

**Decision**: Middleware em todas as respostas: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Content-Security-Policy` com `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' ws: wss:; frame-ancestors 'none'; font-src 'self'`. HSTS só se `cookie_secure` ou `MESA_PRODUCTION`. Remover `@import` Google Fonts; `--font-body` / `--font-heading` = `system-ui, sans-serif` (Inter local omitido nesta entrega — sem ficheiros .woff).

**Rationale**: Clarificação A US5; `unsafe-inline` em style necessário para CSS actual sem nonce.

**Alternatives considered**: Self-host Inter — mais artefactos; CSP strict style — parte o tema.

## R9 — authz partilhado e CSS

**Decision**: `backend/src/api/authz.rs`: `require_member`, `require_channel_member` (load channel + member), `history_visible_since(membership)`. `messages` e `attachments` usam o mesmo `history_visible_since`. `nocturne.css` perde o CDN; não fundir ficheiros inteiros nesta entrega (risco visual) — só o import remoto e o stack de fontes.

**Rationale**: FR-015; US6 aceite «não é necessário segundo sistema legado **com tipos remotos**».

**Alternatives considered**: Apagar `nocturne.css` — alto risco de regressão visual; fica para depois.
