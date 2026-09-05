# Contrato: Visibilidade do menu de blur

Âmbito: `.call-ctrl-split` / `.camera-blur-menu` / `CameraBlurMenu` + seta em `VoiceChannel.tsx`.
Comportamento funcional de [015 camera-split-control](../../015-camera-background-blur/contracts/camera-split-control.md) mantém-se; este contrato fixa **visibilidade**.

## Open

1. Clique em `.call-ctrl-chevron` com menu fechado → `blurMenuOpen=true` → painel com 3 opções **visível** (não cortado).
2. `aria-expanded="true"` na seta.
3. Funciona com `data-blur="on"` e `"off"`.
4. Funciona em layout normal e em `.shell.stage-mode` (com ou sem `stage-channels-expanded`).

## Close

Inalterado: opção, Escape, clique fora da âncora, toggle na seta.

## CSS constraints

- Qualquer ancestral do menu MUST NOT clipar o painel aberto (evitar `overflow: hidden` no split se o menu for descendente).
- Menu continua ancorado acima da seta (ou equivalente utilizável).
- Chrome Discord do split (borda única, divisor) MUST permanecer reconhecível.

## Out of scope

- Novas opções de efeito; mudança de blur pipeline; microfone/Sair.
