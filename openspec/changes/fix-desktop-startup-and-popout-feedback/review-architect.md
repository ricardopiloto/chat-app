# Review — Arquiteto de Soluções

**Change:** fix-desktop-startup-and-popout-feedback
**Data:** 2026-10-12
**Veredito geral:** Aprovado

## 1. Definição da arquitetura técnica

Veredito: OK

- Os dois bugs continuam correctamente diagnosticados por leitura directa do código — `request()` sem tempo-limite, `CallProvider` a descartar o resultado de `watch()`. `skip_specs: true` continua a escolha certa, pelos mesmos motivos já estabelecidos em `fix-popout-e2ee-key`. Nenhuma mudança de stack ou componente novo introduzido pelas revisões aplicadas.

## 2. Integração com a infraestrutura existente

Veredito: N/A — sem alteração a backend/infra.

## 3. Qualidade de arquitectura e trade-offs

Veredito: OK

- O achado da ronda anterior (tempo-limite de 15s a aplicar-se também aos três uploads de bytes — `conversation.ts:21`, `servers.ts:14`, `auth.ts:34`) está agora resolvido: `design.md` Decisão "3bis" exclui explicitamente pedidos com `opts.bytes` definido do tempo-limite por omissão, mantendo o comportamento actual para uploads (sem regressão nova) em vez de arbitrar um valor "maior" sem calibração. `tasks.md` 1.1 reflecte isto na implementação e no critério de verificação (confirma que um pedido com `bytes` continua pendente sem o timeout), e 3.3 adiciona a verificação de não-regressão correspondente. A alternativa descartada (dar um valor maior arbitrário aos uploads) está correctamente rejeitada com justificação, não só omitida.
- O achado adicional trazido por `review-fullstack.md` (detalhe estrutural de `useCall()` precisar de um componente descendente de `<CallProvider>`) também foi incorporado em `design.md` Decisão 3 e em `tasks.md` 2.1 — é um detalhe de implementação (dentro do escopo da revisão fullstack), não altera nenhuma decisão arquitectural, mas a sua documentação evita ambiguidade na hora de codar.

## 4. Documentação e decisões (ADRs)

Veredito: OK

- Três decisões (mais a 3bis) bem fundamentadas, cada uma com alternativa descartada e motivo — estilo consistente com `password-recovery/design.md`. Nota cosmética, não bloqueante: a nova decisão ficou numerada "3bis" entre a 2 e a 3 em vez de reordenada sequencialmente; não afecta a leitura nem a implementação, apenas a estética do documento — não vale o custo de reescrever.

## 5. Ponte entre produto e técnico

Veredito: OK

- Ambos os bugs continuam rastreáveis directamente a relatos reais do utilizador, com o `design.md` a reconhecer honestamente (Non-Goals/Risks) que a causa de fundo do popout pode continuar por resolver — não promete mais do que entrega. As duas rondas de revisão fortaleceram a ponte entre o relato original e a implementação sem alargar o escopo.

## Bloqueantes antes de implementar

- nenhum
