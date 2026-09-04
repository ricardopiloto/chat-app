# Results: Fase 1 — MVP (validação)

**Date**: 2026-09-04

## Automated (`cargo test`)

Backend contract + integration: **21 passed** (19 contract, 2 integration).

| Check | Result |
|-------|--------|
| US1 register first / 403 second / 409 duplicate / login / logout | pass |
| US2 servers, text channel, invites (TTL, permanente, revogado, histórico on/off) | pass |
| SC-007 isolamento entre Servidores | pass |
| US3 token LiveKit sem secret; `identity`=`account_id`; `room`=`channel_id`; primeiro slot vazio + rejoin | pass |
| US4 PUT grid só dono; 403 membro | pass |
| US5 sem rota de desligar E2EE; SQLite sem plaintext conhecido | pass |

Frontend: `npx tsc --noEmit` verde.

## Manual (quickstart.md — D8)

Corrido em 2026-09-04 no host Fedora (Zen) + telemóvel na mesma LAN. LiveKit com `network_mode: host`.

| Check | Result |
|-------|--------|
| US1 instância no ar, primeira conta, SPA HTTPS em `:1420` | pass (operador) |
| US3 duas contas em dois dispositivos, câmara+microfone, A/V nos dois sentidos | pass |
| US4 dono edita a composição da grade (slots / posições) | pass |
| US3 rejoin no mesmo slot / mesma conta em dois aparelhos / retrato SC-005 | não exercitado à parte |
| US2 convite com/sem histórico na UI (contratos já cobertos por `cargo test`) | não refeito à mão nesta sessão |
| US5 inspeção SQLite + tráfego LiveKit em claro | não corrido à mão (contratos US5 passam) |

Caminho: `docs/operar-instancia.md` + `specs/002-fase-1-mvp/quickstart.md`.

## Notes

- Cookie `Session` é httpOnly, SameSite=Strict; `COOKIE_SECURE` default false em HTTP local.
- TTL padrão de convite: 7 dias (`DEFAULT_INVITE_TTL_SECS=604800`); `expires_in_seconds: null` = permanente.
- Secret LiveKit só em `backend/src/token/`.
- Duas contas no **mesmo** perfil de navegador partilham o cookie; teste multi-utilizador exige outro dispositivo ou janela anónima.
- Telemóvel na LAN: SPA em `https://<IP-LAN>:1420`; mídia UDP nas portas do LiveKit (contentor em `network_mode: host`).
