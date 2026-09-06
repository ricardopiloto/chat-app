# Quickstart: 035-voice-leave-release-media

Validar que **mic e câmera deixam de ser capturados** quando a sessão termina (ou o join falha com GUM parcial).

## Prerequisites

- Backend + frontend a correr; permissões de mic/câmera concedidas ao sítio.
- Dois browsers/contas úteis para move / disconnect; um basta para Sair + indicador.
- Observar o **indicador de captura** do browser (ícone mic/câmera na barra de endereço / info do sítio).
- Relacionado: [031](../031-voice-join-errors/) (abort + tracks); contract [release-local-capture.md](./contracts/release-local-capture.md).

## Automated

```bash
cd frontend && npx tsc --noEmit
```

## Manual — Sair no palco (US1 / SC-001)

1. Entrar na mesa com **mic + câmera** on; confirmar indicador de captura activo.
2. Clicar **Sair** no palco.
3. **Esperado**: UI fora da chamada; indicador de captura **off** em ≤2 s; sem F5.

## Manual — Só mic / só cam (US1)

1. Repetir Sair com só mic; depois com cam (ou cam+mic).
2. **Esperado**: dispositivo(s) em uso libertados; nenhum fica activo.

## Manual — Sair na barra persistente (US2 / SC-002)

1. Entrar na chamada; navegar para ecrã onde a **barra de chamada** mostra Sair (fora do palco).
2. Sair pela barra.
3. **Esperado**: mesma libertação que no palco (SC-001).

## Manual — Move de canal (US2 / SC-004)

1. Em chamada com captura activa na mesa A; mudar para mesa B.
2. **Esperado**: captura da sessão A não fica fantasma; B só captura se o novo join pedir devices.

## Manual — Disconnect inesperado (US2)

1. Em chamada, forçar drop LiveKit (parar SFU / simular disconnect) se possível.
2. **Esperado**: app trata fim de sessão; captura libertada; UI não «fora» com captura ainda on >3 s (SC-005).

## Manual — Fecho de separador (US2 / SC-006)

1. Em chamada com captura; fechar o separador.
2. **Esperado**: captura cessa na medida do suportado (`pagehide`); documentar se o browser limitar.

## Manual — Re-entrar (FR-006 / SC-003)

1. Após Sair com libertação ok, entrar de novo na mesma sala.
2. **Esperado**: mic/câmera voltam a funcionar no caminho feliz sem reiniciar o browser.

## Manual — Join falhado com GUM parcial (US4 / SC-007)

1. Forçar falha após o browser já ter concedido mic/cam (ex. LiveKit down pós-GUM; ou caminho 031).
2. **Esperado**: captura parcial libertada ≤3 s; não «conectado»; indicador off.

## Manual — Leave remoto falha (US3)

1. Se possível, falhar `POST .../voice/leave` (rede offline após local release) e Sair.
2. **Esperado**: captura local já libertada; UI fora; indicador off (mesmo com leave HTTP a falhar).

## Observability

- Duplo Sair: sem erro; dispositivos já livres (FR-005).
- Com blur activo: após Sair, câmera também libertada (FR-004).
