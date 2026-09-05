# Quickstart: 025-ws-disconnect-proxy

Validação manual. Ver [contracts/intentional-leave-ws.md](./contracts/intentional-leave-ws.md).

## Pré-requisitos

- Backend + LiveKit a correr; `cd frontend && npm run dev` (HTTPS :1420).
- Terminal do Vite visível (onde aparece o spam).
- Conta autenticada; canal de voz/vídeo.

## §1 Confirmar origem (`/rtc` vs `/ws`)

1. Abrir DevTools → Network → WS; entrar na chamada.
2. Sair pela acção **Sair**.
3. Verificar: socket de media/`/rtc` fechou; `/ws` da app tipicamente ainda aberto.
4. Anotar se o erro Vite coincide com o fecho de `/rtc`.

## §2 Leave limpo (SC-001 / SC-002)

1. Entrar na chamada; esperar UI estável.
2. Sair; confirmar UI fora da chamada em ≤2 s.
3. Repetir **5** vezes.
4. Esperado: **0** ocorrências do erro exacto `ws proxy error: This socket has been ended by the other party` ligadas a esses leaves.

## §3 Rejoin (SC-003)

Após um leave de §2, voltar a entrar na mesma sala à primeira tentativa.

## §4 Falha não intencional (SC-004)

1. Em chamada, parar o serviço LiveKit (ou equivalente) sem clicar Sair.
2. Confirmar que o problema continua perceptível (UI e/ou log) — não “tudo silencioso”.

## Automação

```bash
cd frontend && npx tsc --noEmit
```

(Sem teste E2E automatizado obrigatório nesta feature; critério principal é observação do terminal Vite.)
