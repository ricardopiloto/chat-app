# Contrato: Chrome da barra de chamada (mic / câmara split / sair)

Âmbito: `VoiceChannel.tsx` `.call-controls` + `mesa-theme.css` (+ `.btn-danger` se em `nocturne.css`).
Estende / supersede visualmente [015 camera-split-control](../../015-camera-background-blur/contracts/camera-split-control.md) **só** na apresentação (comportamento blur inalterado).

## Microfone

```
[ IconMicOn | IconMicOff ]
```

1. Sem `<span>` «Microfone».
2. `aria-label` e `title` iguais, dinâmicos com `micOn`.
3. Classe `btn btn-secondary call-ctrl` (ou `call-ctrl-icon`); `min-width` ~44–48 px, sem min-width de rótulo longo.
4. Sem split / chevron.

## Câmara (split Discord)

```
┌─────────────────────────────┐
│ IconCam  │  ▏  chevron      │
└─────────────────────────────┘
   toggle      menu blur
```

1. Sem `<span>` «Câmara».
2. Wrapper `.call-ctrl-split`: **um** fundo/borda arredondados; filhos sem «dupla pílula».
3. Separador vertical subtil entre toggle e chevron (borda ou pseudo-elemento).
4. Toggle: `aria-label` ≡ `title` (ligada/desligada); clique → `toggleCam` apenas.
5. Chevron: `aria-haspopup` / `aria-expanded` / `aria-label` fundo; clique → menu apenas; indicador blur-on (015) mantém-se.
6. Menu `CameraBlurMenu` e copy 015 inalterados.
7. Alvos ≥44 px de altura; chevron min-width ≥40 px.

## Sair

```
[ IconPhoneHangup  Sair ]   ← fundo vermelho
```

1. Manter ícone hangup + texto «Sair».
2. Classe danger (ex. `btn btn-danger call-ctrl`) — **não** `btn-primary`.
3. Contraste legível em `data-theme=light` e dark.
4. Sem tooltip obrigatório (FR-009).
5. Clique → `leave()` como hoje.

## Fora de âmbito

- Gravar / Parar gravação, linha E2EE, editor de cena, cabeçalho.
