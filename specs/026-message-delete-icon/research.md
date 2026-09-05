# Research: 026-message-delete-icon

## R1 — Ícone de lixeira

**Decision**: Adicionar `IconTrash.tsx` na família `frontend/src/components/icons/` (stroke `currentColor`, viewBox 24, shell `Icon`), glifo tipo lixeira (tampa + corpo). Usar no botão `.msg-delete` sem texto filho.

**Rationale**: Consistente com 012/019/020; `currentColor` herda o vermelho do botão.

**Alternatives considered**:
- Emoji / character «🗑» — inconsistente com SVG Mesa.
- Inline SVG só em `Channel.tsx` — dificulta reuso.

## R2 — Vermelho claro (fundo + borda + ícone)

**Decision**: Não reutilizar `.btn-danger` (fill saturado + texto branco — Sair). Estilizar `.msg-delete` com tom **suave**:
- `color` / ícone: `--color-danger` (ou mix ligeiramente mais claro)
- `background`: `color-mix(in srgb, var(--color-danger) ~12–18%, transparent)` (ou token `--color-danger-soft` se preferir nomear)
- `border-color`: mesma família (mix ~25–35% ou tom alinhado ao fundo)
- Hover: mix um pouco mais forte; manter combinação ícone/fundo/borda
- Tokens claros/escuros já existem em `mesa-theme.css` (`--color-danger*`); ajustar mixes por tema se o contraste falhar no escuro

**Rationale**: Spec pede vermelho **claro** combinado; `.btn-danger` é destrutivo forte (020 Sair).

**Alternatives considered**:
- `.btn-danger` no msg-delete — rejeitado (demasiado saturado).
- Só ícone vermelho sobre `btn-ghost` — rejeitado (FR-002: fundo e borda têm de combinar).

## R3 — Tooltip e aria

**Decision**: `title="Apagar"` (dica curta, clarificação) + manter `aria-label="Apagar mensagem"` (nome acessível completo). Botão sem texto «Apagar».

**Rationale**: FR-004 / FR-004a; padrão `title` de 020, com tip curta vs aria mais descritiva (ok — tip ≠ nome completo).

**Alternatives considered**:
- `title` ≡ `aria-label` ambos «Apagar mensagem» — tip longa; clarificação pediu «Apagar».
- Só aria sem title — rejeitado na clarificação.

## R4 — Markup / classes

**Decision**: Trocar `btn btn-ghost msg-delete` por algo como `btn msg-delete` (ou `btn msg-delete msg-delete-icon`) e mover visual para `.msg-delete` em `mesa-theme.css` (tamanho icon-ish, padding, border). Manter `position` / opacity hover em `.msg-block` (011).

**Rationale**: `btn-ghost` é acento, não soft-danger.

**Alternatives considered**: Manter ghost e só pintar ícone — falha FR-002.
