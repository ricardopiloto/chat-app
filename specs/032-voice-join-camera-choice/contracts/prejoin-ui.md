# Contract: UI de pré-join (câmera)

**Feature**: [032-voice-join-camera-choice](../spec.md)

Superfície: canal de voz/vídeo quando o utilizador **ainda não** está `live` nessa mesa.

## Acções

| Controlo | Efeito |
|----------|--------|
| Entrar **com câmera** (rótulo inequívoco) | Join com captura vídeo+áudio; `cam_on: true`; auto-slot conforme BE |
| Entrar **sem câmera** / banco (rótulo inequívoco) | Join com áudio only; `cam_on: false`; sem pedir permissão de câmera |
| Vídeo de teste (existente) | Mantém-se como caminho secundário (vídeo sintético + áudio se possível) |

MUST NOT restar um único botão primário ambíguo «Ligar câmera e microfone» como única forma de entrar.

## Pós-join

- Controlos actuais de mic/câmera e banco↔slot continuam disponíveis.
- Ligar câmera após entrada sem câmera: possível; slot só se BE auto-assignar (FR-010).

## Fora

- Preferência global entre sessões.
- Toggle de mic no pré-join (mic default ligado).
- Redesign do editor de cena.
