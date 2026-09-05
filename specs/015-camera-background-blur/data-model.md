# Data Model: 015-camera-background-blur

Sem alterações SQLite, REST ou WS. Estado só no cliente.

## `CameraBlurMode`

| Valor | UI (menu) | `blurRadius` | Seta |
|-------|-----------|--------------|------|
| `off` | Sem blur | — (passthrough / sem efeito) | aspecto por omissão |
| `light` | Blur leve | `12` | marca «ligado» |
| `strong` | Blur forte | `32` | marca «ligado» (igual ao leve) |

Três estados mutuamente exclusivos. Default: `off`.

## Preferência (`mesa.cameraBlur`)

| Campo | Tipo | Persistência | Notas |
|-------|------|--------------|-------|
| modo | `CameraBlurMode` | `localStorage` chave `mesa.cameraBlur` | Inválido/ausente → `off` |

### Transições

```
off --escolher leve--> light   (persiste; se câmara on: mute → processor → unmute)
off --escolher forte--> strong
light --escolher forte--> strong  (switchTo radius; sem mute se já processado)
strong --escolher leve--> light
light|strong --Sem blur--> off    (switchTo disabled / stop efeito; vídeo nítido OK)
light|strong --falha processor--> light|strong + videoPausedByBlurFailure
videoPausedByBlurFailure --Sem blur--> off + retoma nítido
videoPausedByBlurFailure --processor recupera--> light|strong + gate 1.º frame + unmute
câmara off --escolher modo--> só persiste; aplica no próximo ligar (gate 1.º frame)
```

## `CameraBlurRuntime` (sessão de chamada)

| Campo | Tipo | Persistência | Notas |
|-------|------|--------------|-------|
| `mode` | `CameraBlurMode` | espelha preferência | |
| `supported` | `boolean` | sessão | `supportsBackgroundProcessors()` + assets OK |
| `menuOpen` | `boolean` | sinal | popover da seta |
| `videoPausedByBlurFailure` | `boolean` | sinal | FR-015; mensagem visível |
| `applying` | `boolean` | sinal | gate 1.º frame; câmara pode estar muted |

Não há entidade de domínio no servidor. O director **não** vê nem força o modo dos outros.

## Catálogo de ícones (delta 012)

| Ícone | Uso | Estado |
|-------|-----|--------|
| `IconCameraOn` / `IconCameraOff` | área principal | só câmara ligada/desligada (inalterado) |
| `IconChevronDown` | seta, modo `off` | forma por omissão |
| `IconChevronDownBlur` | seta, modo `light` \| `strong` | **forma distinta** (chevron + pip/losango); não só cor |

`title` / `aria-label` na seta: «Fundo: sem blur» vs «Fundo: blur ligado». O rótulo visível «Câmara» não muda.

## Validação

- `mode ∈ {off,light,strong}` na leitura de storage.
- `light`/`strong` só ficam persistidos se `supported` (FR-010); falha a meio **não** reescreve para `off`.
- Test video: `runtime` ignora processor; modo pode estar guardado para a próxima câmara real.
