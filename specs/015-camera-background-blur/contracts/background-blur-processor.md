# Contrato: Processor de blur de fundo

Âmbito: `frontend/src/video/backgroundBlur.ts` + `liveClient.ts`. Backend intocado.

## Capacidade

```ts
supportsBackgroundProcessors(): boolean  // do @livekit/track-processors
```

Se `false`, FR-010: não marcar leve/forte como activo; mensagem «Blur de fundo não disponível».

## API Mesa (proposta)

```ts
type CameraBlurMode = "off" | "light" | "strong";

const BLUR_RADIUS: Record<"light" | "strong", number> = { light: 12, strong: 32 };

function createBlurProcessor(): BackgroundProcessorWrapper;
async function applyBlurMode(track: LocalVideoTrack, mode: CameraBlurMode): Promise<void>;
/** Espera output já desfocada; descarta o 1.º frame passthrough do LiveKit. */
async function waitUntilBlurred(track: LocalVideoTrack): Promise<void>;
```

`BackgroundProcessor` é criado com `assetPaths` apontando a `/mediapipe/` (mesma origem). Sem `imagePath`.

## Publicação (câmara real)

| Situação | Comportamento |
|----------|----------------|
| Ligar câmara, modo `off` | Publicar como hoje (processor `disabled` opcional para switches futuros) |
| Ligar câmara, `light`/`strong` | `setProcessor(blur)` → `waitUntilBlurred` → só então publish/unmute |
| Já publicado nítido → `light`/`strong` | Mute vídeo → `switchTo` blur → `waitUntilBlurred` → unmute |
| `light` ↔ `strong` | `switchTo({ mode: 'background-blur', blurRadius })` sem mute se já blurred |
| → `off` | `switchTo({ mode: 'disabled' })` ou `stopProcessor`; nítido OK |
| Falha com `light`/`strong` | Mute/desligar **só vídeo**; não `disabled`; mensagem; modo persiste |
| Vídeo de teste | Sem processor |

Preview local: sempre o elemento do track publicado/processado, nunca um `srcObject` raw paralelo.

## E2EE e gravação

O payload cifrado / o Egress consomem o **mesmo** track publicado. Não há segundo encoder nítido. FR-006 sai de graça se o gate acima se cumprir.

## Erros

| Evento | UI (quem envia) | Track |
|--------|-----------------|--------|
| Sem suporte / assets | «Blur de fundo não disponível» | nítido permitido; modo não fica leve/forte |
| Falha a meio | «Blur de fundo falhou — vídeo em pausa» (ou equivalente) | vídeo paused/muted; áudio on |
| getUserMedia negado | erros de câmara já existentes | — |
