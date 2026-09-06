# Research: 042-panel-call-stage-ui

## 1. Visibilidade do grupo de chamada no painel

**Decision**: Alterar `showCallGroup` de `!onStage()` para `inCall() && !onStage()` (ou equivalente). Remover a necessidade de `is-disabled` / botões `disabled` para o caso «sem chamada» — o grupo simplesmente não monta. Em chamada + off-stage: grupo activo; em chamada + on-stage: oculto (039).

**Rationale**: FR-001–004; elimina `user-panel-calls is-disabled` fora de call.

**Alternatives considered**: Manter disabled (rejeitado pelo utilizador / FR-004). Esconder só o hangup (rejeitado — grupo inteiro).

## 2. Tamanho dos ícones (base = mic do painel)

**Decision**: Constante única no painel (hoje `size={18}` no mic) aplicada a `IconMic*`, `IconDeafen*` / headphones, `IconCamera*`, `IconPhoneHangupFilled`. Hit-box CSS já `.user-panel-ctrl` 32×32 — garantir que glifos stroke (ex. `IconDeafenOff` via `IconHeadphones`) e filled ocupam a mesma caixa visual (viewBox / CSS `svg` width/height alinhados). Chevron blur permanece menor (`size={14}`). **Não** copiar tamanho dos call-controls do palco.

**Rationale**: Clarificação 2026-09-06 (mic como base; caber no painel).

**Alternatives considered**: Igualar ao palco (rejeitado na clarify). Aumentar todos para 20+ (pode apertar a fila de 221px).

## 3. Ganho vertical do palco (~40–80px)

**Decision**: Ajustes CSS cumulativos, sem mexer nos call-controls:

| Alvo | Antes (aprox.) | Depois (direcção) |
|------|----------------|-------------------|
| `.stage` margin | `12px 16px` | reduzir vertical (ex. `6–8px 16px`) |
| `.stage` padding | `10px` | reduzir ligeiramente (ex. `6–8px`) |
| `.voice-pane .pane-header` | wrap + padding actual | compactar padding/gap vertical |
| `.privacy-line` | padding/margin | reduzir ou tipografia mais compacta |

Meta: soma de ganhos ~40–80px na altura útil da grelha. Verificar em stage-mode com channels expanded (DOM do utilizador).

**Rationale**: Clarificação Option B.

**Alternatives considered**: Só min-height maior (não recupera chrome). Comprimir call-controls (fora de âmbito).

## 4. Coordenação 039

**Decision**: Documentar supersede do «visível disabled» no painel; predicado on-stage inalterado.

**Rationale**: FR-004.
