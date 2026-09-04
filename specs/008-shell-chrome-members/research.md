# Research: 008-shell-chrome-members

## 1. Botões pílula (radius 999px)

**Decision**: Aplicar `border-radius: 999px` (ou token equivalente) à base `.btn` em `nocturne.css` / override Mesa, alinhado ao protótipo; isentar controlos que não são botões de acção (tiles de vídeo, ícones de canal no sidebar, avatares do rail).

**Rationale**: Spec e protótipo usam pílula; hoje `.btn` usa `var(--radius-md)`. Override pontual (`.sidebar-actions .btn`) já sugere pílula — globalizar reduz inconsistência.

**Alternatives considered**: Só classes `.btn-pill` novas (mais markup); token `--radius-pill` só em Mesa (aceitável se nocturne base ficar intocado — preferir override Mesa se nocturne for shared spike).

## 2. Composer full-bleed

**Decision**: Remover `max-width: calc(74ch + 48px)` (e centragem associada) de `.composer` em `mesa-theme.css`; manter padding lateral alinhado ao scroll de mensagens / cabeçalho do pane.

**Rationale**: FR-002 / SC-002; DOM path do bug aponta exactamente para esse `max-width`.

**Alternatives considered**: Aumentar 74ch (ainda limita); full-bleed só ≥breakpoint (spec pede também viewport estreito).

## 3. Modo palco — colapso (não hide)

**Decision**:
- Rail de servidores **permanece** visível em stage-mode.
- Coluna de canais (`.sidebar`) passa a **faixa estreita** (~40–56px) com controlo «mostrar canais» que **expande** a coluna sem sair do palco (`stage-channels-expanded` ou similar).
- Toggle «Modo palco» **desliga** o palco (comportamento actual do evento `mesa:stage-mode`).
- Substituir `display: none` actual em `.shell.stage-mode .server-rail` / `.sidebar` por grelha colapsada (`grid-template-columns: 68px <strip|expanded> 1fr`).

**Rationale**: Clarificação 2026-09-04; diverge do protótipo HTML (que zera a esquerda).

**Alternatives considered**: Overlay drawer para canais (pior que faixa persistente); esconder rail (rejeitado).

## 4. Lista de membros

**Decision**:
- Botão «Membros» no **cabeçalho do canal** (texto `Channel.tsx` e voz `VoiceChannel.tsx`).
- Painel direito no shell (ou coluna do pane) listando membros do **servidor actual** via `GET /api/servers/{id}/members` (já existe).
- Trocar de servidor com painel aberto: **mantém aberto** e **refetch** da lista.
- Sem schema novo; sem roles UI nesta feature (só handle / presença mínima se já disponível).

**Rationale**: Clarificações; API já usada em Channel/VoiceChannel para mapas de handle.

**Alternatives considered**: Painel só em texto (rejeitado — voz também); endpoint novo (desnecessário).

## 5. Persistência UI

**Decision**: Preferência local para stage-mode já existe (`uiPrefs`). Adicionar preferência opcional para «painel membros aberto» e/ou «canais expandidos no palco» se útil ao quickstart; default razoável: membros fechado; canais no palco colapsados.

**Rationale**: SC-005 / FR-005; evita estado surpresa ao refresh.

**Alternatives considered**: Só estado em memória (aceitável MVP se documentado no quickstart).
