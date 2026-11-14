# Proposal

## Why

Os botões de controlo da chamada (`frontend/src/voice/CallControls.tsx`, `frontend/src/voice/FloatingPlayer.tsx`, estilos em `frontend/src/voice.css`) hoje não têm nenhuma resposta visual a hover, pressionar ou foco pelo teclado — `.call-control` não define essas pseudo-classes. A proposta visual em `propostas/controles-chamada/README.md` pede resposta imediata a esses estados, usando só os tokens já existentes em `frontend/src/tokens.css`, sem mudar o comportamento dos controlos.

## What Changes

- Hover, pressionado e foco pelo teclado passam a ter tratamento visual próprio em `.call-control` (elevação/sombra no hover, deslocamento e escala reduzida ao pressionar, contorno de foco separado do botão), respeitando `prefers-reduced-motion`.
- Botões principais passam de 36×36 px para 40×40 px (cantos `--radius-md`), com ~6 px de espaço entre controlos — o espaçamento já é 6px hoje, só o tamanho do botão muda.
- O botão de definições de câmara (menu de blur), hoje separado só por um `gap` de 2px dentro de `.call-control-group`, ganha um divisor fino visível entre ele e o botão da câmara.
- Nenhuma mudança de comportamento, estrutura de markup, atalhos ou lógica de chamada — só CSS (e ajustes mínimos de classe, se necessários) nos estados visuais já cobertos pela tabela de tokens do README da proposta.
- Aplicado igualmente ao painel do utilizador e ao mini-player flutuante (PiP), já que ambos reaproveitam a mesma classe `.call-control`.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `frontend-v2/voice-session`: estados visuais (hover, pressionado, foco pelo teclado, desligado/indisponível) dos controlos de chamada, aplicados tanto no painel do utilizador como no mini-player flutuante.

## Impact

- **Frontend:** `frontend/src/voice.css` (`.call-control`, `.call-control-group`, `.call-menu`) — novas regras de hover/active/focus-visible/disabled, divisor entre câmara e menu de blur, novo tamanho de botão; sem mudanças em `CallControls.tsx`/`FloatingPlayer.tsx` além de classes, se necessário para o foco visível.
- **Backend:** nenhum.
- **Acessibilidade:** contorno de foco visível e separado do botão (token `--primary`), sem depender só de cor para estados desligado/silenciado (ícone riscado já existe hoje via `mic_off`/`videocam_off`/`headset_off`).
