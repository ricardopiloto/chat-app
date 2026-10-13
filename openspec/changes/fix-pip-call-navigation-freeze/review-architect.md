# Review — Arquiteto de Soluções

**Change:** fix-pip-call-navigation-freeze
**Data:** 2026-10-12
**Veredito geral:** Aprovado

## 1. Definição da arquitetura técnica

Veredito: N/A — correcção de um defeito na stack já existente (SolidJS/Electron/LiveKit), sem componente, stack ou fluxo de dados novo. A própria change recusa-se a propor uma correcção antes de ter causa confirmada (`design.md` Decisão 1), o que é a postura certa para este tipo de defeito.

## 2. Integração com a infraestrutura existente

Veredito: N/A — não toca em backend, reverse proxy, containers nem dados. Confirmado pelo `proposal.md`: "Sem impacto conhecido em backend, API ou formato de mensagens."

## 3. Qualidade de arquitectura e trade-offs

Veredito: OK

- A Non-Goal "Adivinhar uma correcção sem reprodução confirmada" é a decisão de qualidade mais importante desta change — um travamento (não uma excepção) convida a "correcções" especulativas que mascaram o sintoma. Faseá-la em reprodução → diagnóstico → correcção → verificação, com um bloqueio explícito entre a Tarefa 1.3 e a Tarefa 2.1, está correcto.
- Segurança/E2EE: sem impacto — nenhuma chave, token ou canal de cifra está envolvido no caminho de navegação/popout.
- O "Risco" de não conseguir reproduzir de forma fiável (`design.md` Risks) já prevê o caminho de saída honesto (documentar tentativas, pedir mais evidência ao utilizador) em vez de fechar a change com uma correcção não verificada.

## 4. Documentação e decisões (ADRs)

Veredito: OK

- Uma decisão registada (Decisão 1, "Reprodução antes de correcção") com alternativa considerada e motivo de rejeição, no formato já estabelecido no projecto.
- O `design.md` já incorpora a pista nova trazida a meio da investigation (o cenário do popout, "não consigo voltar") sem a tratar como uma change à parte — correcto, já que o utilizador confirmou ser "o mesmo bug" e os dois sintomas partilham `callSession.tsx` como área provável.

## 5. Ponte entre produto e técnico

Veredito: OK

- O "Why" liga três relatos concretos do utilizador (PiP + troca de servidor, PiP + troca de canal, popout + "não consigo voltar") a hipóteses técnicas identificadas por leitura de código real (`callSession.tsx`, `Hosts.tsx`), sem inventar uma causa. A tarefa 1.3 define explicitamente o critério para saber se os dois sintomas são a mesma causa ou duas causas distintas, antes de gastar esforço de correcção na direcção errada.

## Bloqueantes antes de implementar

- nenhum
