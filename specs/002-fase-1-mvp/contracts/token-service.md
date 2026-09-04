# Contrato interno: emissão de token LiveKit

Módulo `backend/src/token/`, evolução direta do `spike/token` (contrato já validado go no spike — ver `specs/001-fase-0-spike/contracts/token-api.yaml` e `results.md`, seção "credencial → go"). Não é um serviço HTTP separado nesta fase: é uma função interna chamada pelo handler `POST /channels/{channelId}/voice/join` (ver [rest-api.yaml](./rest-api.yaml)), no mesmo processo do backend — o secret do LiveKit só existe nesta camada, nunca atravessa a API pública.

## Entrada (interna)

| Campo | Origem | Regra |
|---|---|---|
| `identity` | `account_id` da sessão autenticada | Estável entre joins — garante rejoin no mesmo slot (FR-011) |
| `room` | `channel_id` do canal `voice_video` alvo | Verificado como pertencente a um Servidor onde a conta tem Membership antes de chamar esta função (403 se não) |
| `name` | `Account.handle` | Display name no LiveKit |

## Saída (o que vira `VoiceJoinResponse` no REST)

| Campo | Regra |
|---|---|
| `token` | JWT assinado com `livekit-api`; `video.room` = `room`, `video.roomJoin = true`; TTL curto (minutos, renovado a cada join) |
| `url` | URL de sinalização LiveKit (`wss://` em produção; `ws://` só em dev local) |

**Invariante herdada do spike** (contrato idêntico, é o mesmo teste `cargo test` estendido): a resposta HTTP **nunca** contém `secret`/`apiSecret`/`api_secret`; o `API secret` do LiveKit só existe em variável de ambiente do processo backend.

## Diferença em relação ao spike

- `room` deixa de ser a constante `spike-room`: passa a ser o `channel_id` real, um por canal `voice_video` (multi-sala, multi-Servidor).
- `identity` deixa de ser `alice`/`bob` fixos: passa a ser o `account_id` real, validado contra Membership antes da emissão (o spike não tinha auth de produto).
- Autorização adicionada: emissão exige sessão válida + Membership no Servidor do canal — o spike só fazia bind de rede, sem checar identidade de quem pedia.
