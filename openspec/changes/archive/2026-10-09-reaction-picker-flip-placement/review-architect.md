# Review — Arquiteto de Soluções

**Change:** reaction-picker-flip-placement
**Data:** 2026-10-09
**Veredito geral:** Aprovado com ressalvas

## 1. Definição da arquitetura técnica
Veredito: Atenção
- Solução coerente com a stack (SolidJS, CSS, sem nova dependência) e proporcional ao problema; a análise de causa (picker `absolute` dentro de `.ch-scroll` com `overflow-y:auto` aumenta o `scrollHeight`) está correcta e confirmada no código (`MessageRow.tsx:203`, `chat.css:149-150`).
- **Contradição spec × design:** a spec diz que abrir o selector "SHALL NOT provocar rolagem", mas o cenário "espaço insuficiente nos dois lados" abre abaixo/acima mesmo sem caber; abaixo continua a aumentar o `scrollHeight` e acima fica cortado (overflow negativo não é rolável). Recomendação: ou reformular a garantia ("quando existe lado com espaço suficiente") ou prever `max-height` reduzido da grelha no caso extremo (altura do picker limitada ao lado escolhido).
- **Altura H ambígua** (D1: "constante ~340px, ou `offsetHeight` real após o primeiro render"). Medir após render implica render + reposição (flicker). Recomendação: decidir só pela constante, definida num único sítio partilhado com o CSS (ex.: variável CSS/constante exportada), e remover a alternativa.

## 2. Integração com a infraestrutura existente
Veredito: N/A
- Mudança só de frontend: sem impacto em proxy, deploy, base de dados ou backup.

## 3. Qualidade de arquitetura e trade-offs
Veredito: OK
- E2EE, permissões e tempo real inalterados.
- Rejeição de portal/`position: fixed` bem justificada para uma pessoa a manter o projecto. Nota: a posição fixada ao abrir é aceitável; só falha se a lista rolar com o picker aberto (já fecha ao clicar fora; não fecha ao rolar), sem gravidade.
- Largura 320px com `right:0` em ecrã estreito (padding 10px) pode sair do ecrã à esquerda; está fora do âmbito (non-goal), mas vale confirmar na tarefa 1.3 e abrir change própria se falhar.

## 4. Documentação e decisões (ADRs)
Veredito: Atenção
- Decisões têm alternativas e motivo, mas usam numeração `1,2,3` em vez do estilo `D1, D2…` das outras changes. Menor.
- Proposal lista "Modified Capabilities: requisito 'Reações com emoji…' ganha regras", mas o delta usa `## ADDED Requirements` com requisito novo. Alinhar o texto do proposal (requisito novo ao lado do existente) — não é bloqueante.
- Diagrama não se justifica.

## 5. Ponte entre produto e técnico
Veredito: OK
- O pedido ("menu deve abrir para cima quando a mensagem está em baixo") traduz-se directamente na regra de espaço; a preferência por "abaixo" no resto dos casos preserva o comportamento actual.

## Bloqueantes antes de implementar
- nenhum
