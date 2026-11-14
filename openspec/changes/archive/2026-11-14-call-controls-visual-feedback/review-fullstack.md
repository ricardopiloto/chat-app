# Review — Desenvolvedor Fullstack

**Change:** call-controls-visual-feedback
**Data:** 2026-11-11
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend

Veredito: OK

- N/A — não há nenhuma mudança de backend nesta change.

## 2. Desenvolvimento do frontend

Veredito: Atenção

- **Correcção concreta para o divisor "acoplado" (D4, mesma ressalva do Arquiteto na secção 3 do review dele):** hoje `.call-control` (câmara) e `.call-control.small` (chevron) são dois botões totalmente arredondados dentro de `.call-control-group{gap:2px}`. Para parecerem um único botão com divisor interno, como no `conceito-tokens.png`, é preciso: (a) remover o `gap` entre esse par específico (ou envolvê-los num wrapper próprio); (b) quadrar os cantos que se tocam — `border-radius` direito a 0 no botão da câmara, `border-radius` esquerdo a 0 no `.small`; (c) manter só a borda/divisor (`border-left:1px solid var(--outline-variant)`) no `.small` como já proposto. Um `border-left` sozinho, sem ajustar `gap` e `border-radius`, não resolve. Vale isolar isto num selector específico (ex.: `.call-control-group > .call-control + .call-control.small`) para não afectar outros usos de `.small` se existirem.
- **D3 (36px → 40px) interage com `.call-control.small`:** hoje `.small` só sobrescreve `width:22px`, herdando `height:36px` da base — ao mudar a base para 40px, `.small` passa a ter `22×40px` (mais alto e mais estreito do que é hoje) sem que isso tenha sido decidido explicitamente. Vale fixar `height` explícito em `.small` (por exemplo, igual à base, 40px, para bater com o contentor acoplado da correcção acima) em vez de deixar implícito por herança.
- **Ícones dentro do botão maior:** `.ui-icon` não tem tamanho por omissão fora de `.ui-button` (só `.ui-button .ui-icon{@apply text-[20px]}`); dentro de `.call-control` o ícone usa o tamanho intrínseco do SVG. Ao passar de 36px para 40px, vale confirmar visualmente que a proporção ícone/botão continua parecida com a de hoje (o README sugere ~20px de ícone para um botão de 40px); se não bater, ajustar com uma regra `.call-control .ui-icon{...}` explícita.
- **`outline-offset:2px` dentro do PiP:** verifiquei o espaço disponível — `.call-pip-controls{padding:8px}` (ou `padding:6px` na media query mais estreita) é suficiente para acomodar um `outline` de 2px + `offset` de 2px sem ser cortado pelo `overflow:hidden` de `.call-pip`. Não é um risco real, só vale confirmar visualmente numa janela estreita (a media query de `max-width:1366px` é a mais apertada).

## 3. Deploy e operação

Veredito: OK

- Só CSS; nenhuma migração, env var, porta ou processo novo. Nenhum passo de deploy diferente do habitual.

## 4. Qualidade de código

Veredito: OK

- Tasks com verificação concreta (hover/active/focus por botão, `prefers-reduced-motion`, painel e PiP nos dois temas). Falta só reflectir as correcções da secção 2 nas tasks 1.2/2.1 antes de considerar a change pronta para apply.

## 5. Execução das decisões arquitecturais

Veredito: Atenção

- A task 2.1 actual ("adicionar `border-left`") não implementa de facto a decisão D4 revista (botão acoplado) — precisa de ser reescrita com os três passos da secção 2 (gap, border-radius, border-left), não só o último.
- Fora isso, as tasks seguem D1–D5 sem reabrir decisões (tamanhos do PiP inalterados, sem mudança de markup/comportamento).

## Bloqueantes antes de implementar

- Nenhum. Recomendo fechar, antes do apply: (a) reescrever D4/task 2.1 para o botão acoplado completo (gap + border-radius + divisor), (b) fixar `height` explícito em `.call-control.small`, (c) adoptar o mecanismo único de `brightness()` para hover/active em vez de receitas `color-mix` por variante (ver review do Arquiteto, secção 3).

## Limitações técnicas a reportar ao Arquiteto

- Confirmar visualmente a proporção ícone/botão depois do aumento para 40px; se desalinhar, precisa de uma regra de tamanho de ícone nova, hoje inexistente fora de `.ui-button`.
