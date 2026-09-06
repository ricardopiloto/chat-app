# Quickstart: 032-voice-join-camera-choice

Validação E2E da escolha com/sem câmera e destino banco. Requer canal de voz e (idealmente) duas contas.

## Prerequisites

- Backend + frontend + LiveKit ([operar-instancia](../../docs/operar-instancia.md) / README).
- Reiniciar `cargo run` após implementar a regra de auto-assign condicionada a `cam_on`.

## Automated

```bash
cd backend && cargo test --test contract
cd frontend && ./node_modules/.bin/tsc --noEmit
```

Contratos: [voice-join-camera.md](./contracts/voice-join-camera.md). Esperado: join `cam_on: false` sem slot; PATCH `cam_on: true` com auto + slot livre → slot.

## Manual — User Story 1 & 3 (escolha)

1. Abrir canal de voz **fora** da chamada → ver **dois** botões (com câmera / sem câmera), não só «Ligar câmera e microfone».
2. «Sem câmera» → join completa; câmera off; **sem** prompt de permissão de vídeo (pode pedir mic).
3. «Com câmera» → permissão de vídeo; câmera on após sucesso.

## Manual — User Story 2 (banco)

1. Entrar sem câmera com composição visível → aparecer em **No banco**; não ocupar tile de slot.
2. Observador noutro cliente: confirma ausência no slot.
3. Entrar com câmera (cena auto, slot livre) → ocupa slot como hoje.

## Manual — FR-010 (ligar câmera depois)

1. Entrar sem câmera (banco).
2. Cena em atribuição automática + slot livre → ligar câmera → ir para um slot.
3. Cena com atribuição owner (ou grade cheia) → ligar câmera → permanecer no banco com vídeo (ou conforme mute/publish local), **sem** roubar slot.

## Fora deste quickstart

Preferência persistente; deafen; mudar quem entra na lista 028.
