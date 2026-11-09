# Review — Arquiteto de Soluções

**Change:** spotlight-bottom-cameras-and-fullscreen
**Data:** 2026-11-08
**Veredito geral:** Aprovado

## 1. Definição da arquitetura técnica
Veredito: OK

- Confirmei por leitura de `node_modules/lucide-solid/dist/esm/icons/`: `maximize.mjs` e `minimize.mjs` existem como exportações distintas de `maximize-2.mjs`/`minimize-2.mjs` — a escolha de D4 (`Maximize`/`Minimize` para o botão novo, separados de `Maximize2`/`Minimize2` já usados pelo alternador de destaque) é implementável exactamente como especificado, sem risco de colisão de nomes nem de ícone inexistente.
- A Fullscreen API nativa do browser é a escolha certa — não há motivo para uma biblioteca de terceiros para isto, e é consistente com o resto do projecto (sem dependências novas para funcionalidades de UI que o browser já oferece).

## 2. Integração com a infraestrutura existente
Veredito: OK

- Sem backend, sem infraestrutura nova. D1 (faixa inferior) é puramente CSS, reaproveitando uma regra que já existe no projecto para outro breakpoint — baixo risco de regressão por ser extensão de um padrão já testado visualmente (ainda que só no mobile).

## 3. Qualidade de arquitetura e trade-offs
Veredito: OK

- D3 (sincronizar pelo evento `fullscreenchange`, nunca pela resolução da promessa) é a decisão correcta — é precisamente o padrão recomendado para esta API, porque a saída por Esc ou gesto do sistema nunca passa pelo código da aplicação. Boa antecipação de um bug fácil de introduzir (estado dessincronizado) numa API que o projecto nunca usou antes.
- D3 também já antecipa o caso do tile ser desmontado em tela-cheia (chamar `exitFullscreen()` no `onCleanup`) — evita a app ficar "presa" em tela-cheia de um elemento removido, um bug real e fácil de esquecer na primeira integração desta API.
- Risco assinalado correctamente nos Risks/Trade-offs: `requestFullscreen()` pode ser rejeitado fora de um gesto directo do utilizador; o `.catch(() => {})` já previsto evita uma promessa rejeitada sem tratamento.

## 4. Documentação e decisões (ADRs)
Veredito: OK

- `design.md` está ao nível das melhores changes desta sessão: 4 decisões, cada uma com o porquê, incluindo a nota de implementação sobre mover o chip "Em transmissão" para dentro do `<figure>` (um detalhe fácil de passar ao lado sem o registar explicitamente).
- A reversão do requirement de fidelidade ao mockup está registada tanto no `proposal.md` (marcada **BREAKING**) como no próprio spec delta (cenário de comparação ajustado para excluir especificamente a posição da faixa) — é o padrão certo, mesmo já usado em `electron-custom-title-bar`.

## 5. Ponte entre produto e técnico
Veredito: OK

- As duas peças do pedido do utilizador (câmaras em baixo; opção de tela-cheia) estão ambas traduzidas em decisões técnicas concretas e implementáveis, sem lacuna nem promessa vaga.

## Bloqueantes antes de implementar
- Nenhum.

## Revisão pós-implementação (2026-11-09)
**Veredito geral:** Aprovado

Li o diff real (`frontend/src/voice.css`, `frontend/src/components/ui/icon-map.ts`, `frontend/src/voice/GridView.tsx`, `voice.en.ts`/`voice.pt-BR.ts`) linha a linha, não apenas o relatório do Codex.

- D1 implementado exactamente como especificado: `.call-spotlight-layout` em linhas (`grid-template-rows:minmax(0,1fr) auto`), `.call-spotlight-side` em `flex-direction:row` com `width:160px` por item, e a regra duplicada do `@media (max-width:767px)` foi removida (não ficou nenhuma regra conflituosa).
- D2 implementado correctamente: o `ref` está no `<figure>`, não no `<video>`; o chip "Em transmissão" foi movido para dentro do `<figure>` como irmão do chip "Tela" (ambos directamente dentro do `<figure>`, fora do `<figcaption>`), exactamente a estrutura prevista.
- D3 implementado fielmente: signal local sincronizado por `document.addEventListener("fullscreenchange", ...)` em `onMount`, removido em `onCleanup`, comparando `document.fullscreenElement === figureRef` — nunca assume o estado pela resolução da promessa. O `onCleanup` chama `document.exitFullscreen()` quando `document.fullscreenElement === figureRef`, cobrindo o caso do tile ser desmontado em tela-cheia (desligar o destaque ou a partilha terminar). `ref={figureRef}` com variável simples é o idiom correcto do Solid (compilador atribui o elemento à variável de forma síncrona, antes de qualquer `onMount` rodar) — sem risco de `undefined` quando o listener dispara.
- D4 implementado correctamente: `Maximize`/`Minimize` importados de `lucide-solid`, mapeados para `fullscreen`/`fullscreen_exit`, distintos de `Maximize2`/`Minimize2` já usados pelo alternador de destaque — sem colisão.
- `tsc --noEmit`, `eslint`, `verify:i18n-keys` e `build` passaram (confirmado pela saída registada pelo Codex); o único aviso do ESLint é pré-existente em `callSession.tsx`, fora do escopo desta change.

**Achado menor (não bloqueante):** o botão novo `.call-fullscreen` não tem `margin-left:auto` nem está agrupado com `.call-spotlight` (que tem `margin-left:auto` e por isso é empurrado para a extremidade direita da legenda, sozinho); visualmente, o botão de tela-cheia fica colado ao nome/handle, com um vão grande até o botão de destaque, em vez dos dois botões aparecerem agrupados. Não é um bug de lógica — é só uma questão de agrupamento visual que vale a pena ajustar (mover o `margin-left:auto` para o primeiro botão presente, ou envolver os dois num `<div>` com a margem automática) antes da verificação manual (3.2), para não exigir um ajuste depois de já ter sido testado visualmente.

## Bloqueantes antes de arquivar
- Nenhum. O achado acima é cosmético e pode ser corrigido junto com o fecho da tarefa 3.2.
