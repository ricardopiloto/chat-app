# Contrato: Controlo partido da Câmara e menu de blur

Âmbito: `VoiceChannel.tsx` call controls + `CameraBlurMenu.tsx` + `mesa-theme.css`. Padrão de ícones: [012 icon-system](../../012-shell-iconography-typography/contracts/icon-system.md).

## Split

```
[ IconCameraOn/Off | Câmara ] [ seta ]
 \____ área principal ____/   \ extra /
        toggle câmara          só menu
```

1. Área principal: mesmo `aria-label` de hoje («Câmara ligada» / «Câmara desligada»); rótulo visível fixo **Câmara**; ícone só on/off da câmara.
2. Seta: `type="button"`, `aria-haspopup="menu"`, `aria-expanded`, `aria-label` conforme blur off/on (não reutiliza o label da câmara).
3. Um clique na seta **não** chama `toggleCam`. Um clique na área principal **não** abre o menu.
4. Seta utilizável com câmara ligada **e** desligada (FR-009).
5. Alvos ≥44 px (já o `.call-controls .btn`); a seta tem min-width próprio (não <40 px) para o dedo no Modo palco.
6. Largura da área principal não deve «saltar» entre cam on/off (012 FR-004); a seta é coluna extra estável.

## Indicador da seta (FR-017 / SC-009)

| Modo | SVG | Não fazer |
|------|-----|-----------|
| `off` | `IconChevronDown` | — |
| `light` / `strong` | `IconChevronDownBlur` (forma extra: pip/losango) | Diferir **só** `color` / opacidade |

Leve vs forte: **iguais** na seta; diferença só no menu.

## Menu

1. Ancorado à seta (padrão `AccountMenu`: Escape, clique fora, não fecha ao clicar na âncora).
2. `role="menu"`; três `menuitemradio` com `aria-checked` no modo actual: **Sem blur**, **Blur leve**, **Blur forte**.
3. Escolher um item aplica o modo, persiste, fecha o menu, **não** altera `camOn`.
4. Se `supported === false`, escolher leve/forte mostra a mensagem FR-010 e **não** deixa o radio em leve/forte.
5. Se `videoPausedByBlurFailure`, o menu continua a permitir Sem blur (retoma nítido) e a manter leve/forte (espera recuperação).

## Copy

| Superfície | Texto |
|------------|--------|
| Radio | Sem blur / Blur leve / Blur forte |
| Seta `aria-label` | Fundo: sem blur / Fundo: blur ligado |
| Indisponível | Blur de fundo não disponível |
| Falha a meio | Blur de fundo falhou — o vídeo está em pausa |

## CSS

- `.call-ctrl-split` — grupo inline-flex, um único «pílula» visual (borda partilhada), sem parecer dois botões primários soltos.
- `.call-ctrl-chevron[data-blur="on"]` — a forma vem do SVG; CSS pode reforçar mas não é a única pista.
- `.camera-blur-menu` — painel elevado Nocturne, como `.account-menu-panel`.
