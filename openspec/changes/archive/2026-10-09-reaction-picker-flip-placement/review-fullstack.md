# Review — Desenvolvedor Fullstack

**Change:** reaction-picker-flip-placement
**Data:** 2026-10-09
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend
Veredito: N/A
- Mudança só de frontend; sem API, migração ou autorização afetadas.

## 2. Desenvolvimento do frontend
Veredito: Atenção
- Implementável com o que existe: `anchor` (ref) já existe em `MessageRow.tsx:103`, `.ch-scroll` é único (`ChannelPage.tsx:233`), basta `closest(".ch-scroll")`.
- **CSS da variante "acima":** `.ch-emoji` base tem `bottom: 48px` (pensado para o composer, `chat.css:149`). Na linha, a variante acima precisa de `bottom: calc(100% + 4px)` explícito e a classe `.below` actual deve ser substituída por `.above`/`.below` coerentes; senão o picker fica 48px acima da âncora. A tarefa 1.1 diz isto, mas conviria listar que o default (sem prop) continua a ser o do composer.
- **Barra de acções some sem hover/foco** (`.ch-msg:hover/.focus-within .ch-msg-actions`, `chat.css:67`): o picker vive dentro dela. Abrir acima não muda isto (o input tem `data-autofocus`), mas incluir na verificação 1.3 que o picker não desaparece ao mover o rato da âncora para ele (a área acima da mensagem anterior sai do `:hover` da linha atual; o foco no input cobre via `:focus-within`).
- **Dias sticky/z-index:** os rótulos de dia da lista são sticky; confirmar que o picker (`z-index: 20`) fica por cima quando abre acima junto ao topo da lista.
- Mobile: largura fixa de 320px com `right:0` em ecrã de ~360px com padding 10px cabe; abaixo disso corta. Fora do âmbito, mas anotar na 1.3.
- Contradição spec × design (também apontada pelo arquitecto): caso "nenhum lado cabe" ainda pode causar rolagem/corte. Definir se se aceita ou se se limita `max-height` da grelha.

## 3. Deploy e operação
Veredito: N/A
- Sem novos serviços, variáveis ou portas; `npm run build` e `lint` bastam.

## 4. Qualidade de código
Veredito: Atenção
- **Tarefa 1.2 pede "teste unitário" mas o frontend não tem test runner** (`package.json`: só `lint`, `test:contracts` e `verify:*`). A convenção do projecto são scripts `scripts/verify-*.mjs` que compilam a lógica de `src/chat/logic/*.ts` com esbuild (ver `verify-mentions.mjs`). Recomendação: extrair a função pura para `src/chat/logic/popover.ts` (ao lado de `emoji.ts`, `mentions.ts`) e acrescentar `verify-picker-placement.mjs` + script `verify:picker-placement` no `package.json`, ajustando a tarefa 1.2 em conformidade. Sem isso, a tarefa não é verificável como escrita.
- A verificação do `scrollTop` inalterado (1.3) é manual no browser; considerar acrescentar caso ao `verify-chat.mjs` se já corre contra um browser, senão manter manual e dizê-lo.
- Formato "tarefa + como verificar" respeitado nas três tarefas.

## 5. Execução das decisões arquiteturais
Veredito: OK
- Tarefas seguem as decisões do design (medir ao abrir, sinal fixo, sem portal). A ambiguidade da altura H (constante vs `offsetHeight`) deve ser resolvida antes de codar: em Solid, medir após render exige efeito pós-montagem e reposicionamento visível. Preferir constante.
- Nenhuma limitação técnica nova que exija voltar à arquitectura.

## Bloqueantes antes de implementar
- nenhum

## Limitações técnicas a reportar ao Arquiteto
- Caso "nenhum lado cabe" vs garantia "não provoca rolagem" (ver §2); decidir redação da spec ou limitação de altura.
