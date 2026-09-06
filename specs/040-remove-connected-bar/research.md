# Research: 040-remove-connected-bar

## 1. Remoção da `voice-connected-bar`

**Decision**: Apagar o segundo `<Show when={showConnectedBar()}>` em `AppShell.tsx` (markup `voice-connected-bar` + Voltar/Sair). Manter **um** `<Show when={showConnectedBar()}>` só com `<FloatingVoicePip />`. Renomear o predicado para `showVoicePip` (opcional, legibilidade) — comportamento idêntico ao de 038.

**Rationale**: FR-001 / FR-010; a barra duplica o PiP e consome altura do `shell-main`.

**Alternatives considered**: Esconder só via CSS — rejeitado (DOM/a11y mortos). Compactar a barra — rejeitado pelo pedido.

## 2. Layout Voltar + hangup no PiP

**Decision**: Mover «Voltar à mesa» do header para uma **fila de rodapé** `.voice-pip-actions` (flex: Voltar à esquerda, hangup à direita). O header fica só título + timer (handle de arrasto 038). Hangup: `button.btn-danger` / classe PiP com `IconPhoneHangupFilled`, `aria-label="Sair da chamada"`, **sem** texto «Sair».

**Rationale**: Clarificação 2026-09-06 (footer row); FR-004/005. Hoje Voltar está no header — incompatível com a fila partilhada.

**Alternatives considered**: Hangup no header ao lado de Voltar — rejeitado. Mic/cam no PiP — rejeitado (FR-009).

## 3. Hangup sem navegação

**Decision**: `onClick` → `void voice.hangup()` **apenas** (igual ao Sair actual da barra). **Não** chamar `navigate`. Após hangup, `voice.live()` fica false → `showConnectedBar` false → PiP desmonta; a rota actual (texto, etc.) permanece.

**Rationale**: Clarificação «permanecer na vista actual»; FR-003. `hangup()` em `VoiceSession` já faz leave + `releaseLocalCapture` (035).

**Alternatives considered**: Navegar para home/mesa — rejeitado. Confirmação modal — fora de âmbito (assumptions).

## 4. Drag vs botões

**Decision**: Pointer handlers de drag **só** no header (já é assim). Nos botões do rodapé: `onPointerDown={(e) => e.stopPropagation()}` defensivo se o root algum dia capturar drag; garantir que clique no hangup/Voltar não inicia drag.

**Rationale**: Edge case da spec; 038 já isola drag no header.

**Alternatives considered**: Drag no root inteiro — pior para hit-targets.

## 5. CSS legado

**Decision**: Remover regras `.voice-connected-bar*` **excepto** se o timer do PiP ainda usar `.voice-connected-bar-timer` — nesse caso: (a) mover estilos para `.voice-pip-timer` e actualizar o PiP, **ou** (b) manter só a regra do timer sob o nome antigo até limpeza. Preferir (a) no implement.

**Rationale**: Evitar CSS morto; não partir o timer do PiP.

**Alternatives considered**: Deixar todo o CSS da barra — dívida visual.

## 6. Coordenação com 039-floating-user-bar

**Decision (escopo 040)**: Hangup **no PiP** é o sítio canónico off-stage **enquanto** a connected-bar não existe e a UserPanel 039 não está implementada. Se 039 merge depois: UserPanel pode tornar-se o sítio Discord de leave/mic/cam; alinhar na implementação 039 para **não** triplicar (research 039 §6). 040 **não** bloqueia em 039.

**Rationale**: Specs independentes; 040 P1 remove barra já hoje.

**Alternatives considered**: Adiar hangup PiP até 039 — deixaria buraco de Sair após remover a barra.
