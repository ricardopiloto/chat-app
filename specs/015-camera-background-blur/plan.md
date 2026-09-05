# Implementation Plan: Blur de fundo da câmara

**Branch**: `015-camera-background-blur` | **Date**: 2026-09-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/015-camera-background-blur/spec.md`

## Summary

Cada participante desfoca o **fundo da própria câmara** (modos **leve** / **forte**, mais **sem blur**) no feed **enviado** — os outros e a gravação vêem o mesmo. UI: controlo **partido** no botão Câmara (área principal = toggle; **seta** = menu). Preferência em `localStorage`. Processamento **no cliente** com `@livekit/track-processors` (MediaPipe), **antes** de publicar; primeiro frame nítido **nunca** é publicado se leve/forte estiver escolhido; falha do efeito = vídeo pára (mute), áudio continua.

## Technical Context

**Language/Version**: TypeScript ~5.8 (SolidJS 1.9 SPA) — frontend; backend intocado.

**Primary Dependencies**: `livekit-client` (já em uso); **novo** `@livekit/track-processors` (`BackgroundProcessor`, `supportsBackgroundProcessors`); MediaPipe WASM/modelo **servidos pela própria origem** (`assetPaths`). Ícones do catálogo 012 + chevron. Sem schema/API novos.

**Storage**: `localStorage` chave `mesa.cameraBlur` (`off` | `light` | `strong`), no mesmo espírito de `mesa.theme`.

**Testing**: `cd frontend && npx tsc --noEmit`; validação manual a duas contas + câmara [quickstart.md](./quickstart.md).

**Target Platform**: Browser com Insertable Streams / processadores LiveKit (Chrome/Edge fiáveis; Firefox/Safari: probe → FR-010 se indisponível). Canal de voz/vídeo já existente.

**Project Type**: Web app — `frontend/` only.

**Performance Goals**: Mudança de modo visível ≤2 s no tile próprio (spec US2); observadores ≤5 s (SC-001); ligar câmara com blur pré-escolhido sem frame nítido (SC-007). Segmentação a ~15–30 fps no canvas de saída é aceitável; não exigir 60 fps.

**Constraints**: E2EE inalterada (o track processado é o que se cifra). FR-012: não aplicar a «Vídeo de teste». FR-015: com leve/forte seleccionado, **nunca** publicar quarto nítido. Sem fundos virtuais. Sem botão «Fundo» separado.

**Scale/Scope**: 1 módulo de blur + persistência; refactor de `joinLiveRoom` / `toggleCam` para `LocalVideoTrack` + processor; split button + menu na barra de chamada; CSS; 1–2 ícones novos.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado (como 007–014).

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | N/A — `tsc` + quickstart |
| Complexity Tracking | Vazio (dependência npm justificada em research; não é violação de constituição) |

**Gate: PASS**

### Re-check pós-Phase 1

Sem schema/API; contratos cobrem processor, raios, split button e persistência. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/015-camera-background-blur/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── background-blur-processor.md
│   └── camera-split-control.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/
├── public/mediapipe/                 # WASM + modelo selfie (origem própria; sem CDN Google)
├── package.json                      # + @livekit/track-processors
└── src/
    ├── video/
    │   ├── liveClient.ts             # ALTERAR — publicar LocalVideoTrack; hook de processor
    │   └── backgroundBlur.ts         # NOVO — probe, raios, gate 1.º frame, fail-closed
    ├── blur/
    │   └── blurPreference.ts         # NOVO — read/write mesa.cameraBlur
    ├── components/
    │   ├── CameraBlurMenu.tsx        # NOVO — menu Sem / Leve / Forte
    │   └── icons/
    │       └── IconChevron.tsx       # NOVO — seta default vs seta «blur ligado» (forma)
    ├── pages/
    │   └── VoiceChannel.tsx          # ALTERAR — split Câmara; wiring blur; toggleCam com gate
    └── styles/
        └── mesa-theme.css            # ALTERAR — .call-ctrl-split, menu, seta ligada

backend/            # Intocado
```

**Structure Decision**: Processar no cliente e publicar o track já desfocada (`backgroundBlur.ts` + `LocalVideoTrack.setProcessor`). UI no botão Câmara existente (split + menu), persistência local espelhando o tema.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/](./contracts/)
- [quickstart.md](./quickstart.md)
