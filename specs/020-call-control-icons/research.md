# Research: 020-call-control-icons

## R1 — Tooltips (pairar / foco)

**Decision**: Usar atributo HTML `title` nos botões de microfone e toggle de câmara, com o **mesmo** texto que o `aria-label` de estado (`Microfone ligado` / `… desligado`, `Câmara ligada` / `… desligada`).

**Rationale**: Cumpre FR-007 / SC-006 sem componente de tooltip novo; browsers mostram tip ao pairar (e em muitos casos após foco prolongado). Solid já liga `aria-label` dinamicamente — espelhar em `title={…}` evita divergência.

**Alternatives considered**:
- Componente tooltip custom (Portal) — melhor a11y de timing, fora de âmbito para polish pequeno.
- Só `aria-label` sem tip visual — rejeitado na clarificação (opção B).
- `title` estático — rejeitado; tem de reflectir on/off.

## R2 — Split Discord (câmara)

**Decision**: Tratar `.call-ctrl-split` como **um** contentor visual: fundo/borda partilhados no wrapper; filhos sem bordas laterais «duplas»; **pseudo-elemento ou `border-inline` subtil** entre toggle e chevron; `border-radius` só nas extremidades do grupo (esquerda no toggle, direita no chevron). Remover aspecto de dois `.btn` secundários colados.

**Rationale**: Spec + imagem Discord: contentor único + linha vertical + chevron estreito. O markup 015 (dois `button` + menu) mantém-se; a unificação é sobretudo CSS (+ classes utilitárias se precisas).

**Alternatives considered**:
- Um único `<button>` com hit-testing — piora a11y (dois papéis).
- `role="group"` sem mudança visual — insuficiente para SC-002.
- Aplicar split também ao microfone — fora de âmbito (FR-006).

## R3 — Vermelho de Sair

**Decision**: Introduzir estilo **danger** reutilizável (ex. `.btn-danger` ou `.call-ctrl-leave`) com token `--color-danger` (ou valor fixo coerente) em claro/escuro: fundo vermelho saturado, texto/ícone claro; hover/active ligeiramente mais escuro. Substituir `btn-primary` no botão Sair.

**Rationale**: Hoje Sair usa `btn-primary` (acento, não destrutivo). Context menu já tem `.danger` textual; hangup vermelho é padrão Meet/Discord/Zoom.

**Alternatives considered**:
- Contorno vermelho sem fill — menos óbvio que «sair».
- Vermelho só no ícone, botão secundário — rejeitado (pedido: cor do **botão**).
- Copiar exacto hex Discord — desnecessário; contraste Mesa é o critério.

## R4 — Icon-only sizing

**Decision**: Remover `<span>Microfone</span>` / `<span>Câmara</span>`; reduzir `min-width` dos `.call-ctrl` icon-only (~44–48 px quadrados) mantendo min-height 44 px. Sair mantém gap ícone+texto e largura natural.

**Rationale**: FR-001/002 + alvos de toque da spec.

**Alternatives considered**: Manter `min-width: 148px` vazio — barra continua larga sem benefício.
