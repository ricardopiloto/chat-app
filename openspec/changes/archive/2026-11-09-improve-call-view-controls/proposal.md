# Proposal

## Why

No teste em produção, o PiP cobre controlos em janelas menores que 1920×1080; a partilha de ecrã só pode ser iniciada em Grade; e o destaque de uma partilha na Grade não identifica visualmente o respectivo participante.

## What Changes

- Adaptar dimensões e posição do PiP ao espaço disponível, preservando arraste, encaixe e controlos.
- Expor a acção de partilhar ecrã em Composição e Grade e mudar automaticamente para Grade quando a partilha começa.
- Identificar claramente o participante cuja partilha está em destaque na Grade.

## Capabilities

### Modified Capabilities

- `frontend-v2/floating-voice-pip`: PiP responsivo sem tapar controlos de configuração ou selecção de canal.
- `frontend-v2/voice-grid`: partilha acessível nas duas vistas, transição para Grade e identificação de quem está em destaque.

## Impact

- `FloatingPlayer.tsx`, `voice.css`, `Stage.tsx`, `CallControls.tsx`, `GridView.tsx` e `view.ts`.
- O controlo está hoje condicionado a `callView() === "grid"` em Stage e CallControls; `setScreen` vive em `callSession.tsx`.
