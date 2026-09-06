# Quickstart: 031-voice-join-errors

Validar falha de join sem fantasma na ocupação, feedback por categoria, e sucesso com câmera off.

## Prerequisites

- Backend + frontend a correr; dois browsers/contas no mesmo servidor e canal de voz.
- Relacionado: [028](../028-voice-call-roster/) ocupação; limpeza de tracks alinhada a [035](../035-voice-leave-release-media/).

## Automated

```bash
cd frontend && npx tsc --noEmit
# opcional: cd backend && cargo test --test contract voice_occupancy
```

## Manual — Falha de áudio / permissão (US1 + US2)

1. Negar permissão de microfone (ou bloquear dispositivo).
2. Tentar entrar na mesa.
3. **Esperado**: mensagem categoria **permissão** ou **dispositivo**; UI **fora** da chamada; B **não** te vê na ocupação; indicador de captura do browser off; podes tentar de novo sem refresh.

## Manual — Falha após join (ghost fix)

1. Com permissões OK, forçar falha pós-`voice/join` (ex. LiveKit down / URL inválida em ambiente de teste, se disponível).
2. **Esperado**: erro **ligação**; após ≤5 s, B não te vê na ocupação; tu não estás `live`; tracks libertadas.

## Manual — Só câmera falha (clarificação)

1. Permitir microfone; negar ou falhar só a câmera (ou simular falha de vídeo com áudio ok).
2. **Esperado**: entras na chamada (`live`); câmera off; aviso de câmera; ocupação presente; áudio ok.

## Manual — Retry (SC-004)

1. Após falha de áudio, corrigir permissão → Entrar de novo.
2. **Esperado**: join feliz sem reload da app.

## Manual — Loading state (US3)

1. Durante «A ligar…», provocar falha.
2. **Esperado**: sai do loading; fora da chamada; botões de entrar disponíveis.

## Observability

- Flash breve no roster de B é OK se desaparecer ≤5 s após o tratamento do erro.

## Manual — Move entre canais (edge)

1. Em chamada na mesa A; mudar para mesa B.
2. Se o **join da mesa B** falhar **depois** do `POST .../voice/join` de B: abort faz leave em **B**; sem fantasma em B; tracks libertadas.
3. Se a falha ocorrer **antes** do join de B (ex. GUM): ocupação de A pode já ter sido abandonada via `disconnectLivekitOnly` — neste caso podes ficar fora de ambas até reentraries; não é o bug «fantasma no canal novo».

