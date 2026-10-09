# Design

## Context

`buildTimeline` (`frontend/src/chat/logic/timeline.ts`) itera as mensagens em ordem cronológica mantendo uma referência `previous` à última mensagem não-sistema processada. Hoje `continues` só olha remetente e `replyToId`; o dia já reinicia `previous` em cada marcador de dia. Ver proposal.md - Why para a motivação.

## Goals / Non-Goals

**Goals:**
- Definir exatamente contra qual mensagem o intervalo é medido, para que o comportamento de "grupos longos" seja previsível.
- Manter `buildTimeline` uma função pura e de uma passada (sem olhar para frente na lista).

**Non-Goals:**
- Não mexe em como o agrupamento é renderizado visualmente (avatar/cabeçalho) — só na decisão `startsGroup`.
- Não cobre agrupamento de mensagens de sistema (já tratadas separadamente, sem grupo).
- Não introduz configuração de usuário para o limite; o valor é fixo no código.

## Decisions

**Âncora da janela: mensagem anterior, não a primeira do grupo.**
`continues` compara `message.createdAt` com `previous.createdAt` (a mensagem imediatamente anterior), não com o horário em que o grupo atual começou. Ou seja, um grupo pode se estender além de 5 minutos no total, desde que cada intervalo *entre mensagens consecutivas* seja ≤ 5 minutos.
- Alternativa considerada: ancorar no início do grupo (grupo nunca passa de 5 minutos de duração total). Rejeitada porque exigiria manter um segundo estado (`groupStartedAt`) e o exemplo do bug (09:24 e 09:26 juntas) já é satisfeito por qualquer uma das duas abordagens — a diferença só importa em sequências longas e rápidas, onde o comportamento "mesmo remetente, sempre respondendo rápido" é o mais natural para quem está lendo.
- Mantém a função com o mesmo estado mínimo que já tem hoje (`previous`), só adicionando a comparação de tempo.

**Limite fixo de 5 minutos**, extraído como constante exportada (`GROUP_WINDOW_MS` ou similar) em `timeline.ts`, para ficar fácil de referenciar no teste e eventualmente ajustar.
- Alternativa considerada: tornar configurável via prop/`labels`. Rejeitada — nenhum outro requisito do produto pede isso hoje, e adicionar configuração sem necessidade violaria o princípio de não generalizar prematuramente.

**Cálculo do intervalo**: `Date.parse` dos dois `createdAt` (ISO strings), diferença em milissegundos comparada ao limite. Mesma técnica já usada para `dayKey`, sem novas dependências.

## Risks / Trade-offs

- [Relógio do cliente ligeiramente incorreto entre `now` e os timestamps do servidor] → Não é um risco novo: a comparação é entre dois `createdAt` do servidor (mensagem a mensagem), não contra `now`, então o relógio local do viewer não entra nessa conta.
- [Grupos "longos" ainda possíveis em conversas muito ativas, já que a âncora é a mensagem anterior] → Aceito conscientemente (ver Decisions); é o comportamento esperado em apps de chat comparáveis e não há requisito contrário.
- [Falta de cobertura de teste hoje em `timeline.ts`] → A change inclui testes novos para `buildTimeline` cobrindo: mesmo remetente dentro da janela, mesmo remetente fora da janela, e o cenário exato do bug (09:24/09:26/09:46).
