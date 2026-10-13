# Review — Arquiteto de Soluções

**Change:** call-join-sound-on-own-entry
**Data:** 2026-10-12
**Veredito geral:** Aprovado

## 1. Definição da arquitetura técnica

Veredito: N/A — mudança de comportamento de UI num cliente já existente, sem componente, stack ou fluxo de dados novo.

## 2. Integração com a infraestrutura existente

Veredito: N/A — sem backend, sem evento novo.

## 3. Qualidade de arquitectura e trade-offs

Veredito: OK

- Segurança/E2EE: sem impacto — não lê nem expõe dados novos. Performance: `notify()` continua O(1), sem pedido extra.
- A exclusão da reconexão interna de `onE2eeChanged` (Decisão 1) é o ponto mais importante desta revisão: sem ela, mudar o E2EE de um canal a meio de uma chamada tocaria som para quem nem saiu da chamada — um efeito colateral sonoro vindo de uma acção de terceiros (quem mudou o E2EE), não da própria pessoa. Bem identificado e endereçado.
- O parâmetro novo em `join()` é a forma mais directa de distinguir entrada genuína de reconexão interna, sem inferir a partir de outro estado reactivo — consistente com a Decisão 1 da versão anterior desta change (preferir o sinal mais directo disponível).

## 4. Documentação e decisões (ADRs)

Veredito: OK

- Duas decisões, ambas com alternativa considerada e motivo de rejeição concreto. O `proposal.md` regista explicitamente que esta é uma correcção de escopo sobre o pedido anterior do mesmo dia, não uma change nova — mantém o histórico legível.

## 5. Ponte entre produto e técnico

Veredito: OK

- O pedido corrigido do utilizador ("para todos que entram, quem chegou e quem já estava") está traduzido com precisão: quem já estava continua coberto pelo mecanismo existente (`arrivals()`, inalterado), quem entra passa a ouvir sempre, e a change identifica por conta própria um caso que o pedido não mencionou explicitamente (reconexão de E2EE) e decide-o de forma consistente com a intenção do pedido, sem alargar para outros caminhos de reconexão automática (Non-Goals).

## Bloqueantes antes de implementar

- nenhum
