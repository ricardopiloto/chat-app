# Review — Arquiteto de Soluções

**Change:** user-panel-identity-parity
**Data:** 2026-10-12
**Veredito geral:** Aprovado com ressalvas

## 1. Definição da arquitetura técnica

Veredito: N/A — correcção de estilo num único componente (`UserPanel.tsx`), sem componente, stack ou fluxo de dados novo.

## 2. Integração com a infraestrutura existente

Veredito: N/A — não toca em API, sessão, reverse proxy nem storage; é puramente a camada visual do cliente.

## 3. Qualidade de arquitectura e trade-offs

Veredito: OK

- Segurança/E2EE: sem impacto — nenhum dado sensível muda de forma de transporte ou exibição. Performance: nenhuma. Manutenibilidade: a change reaproveita tokens e componentes já existentes (confirmado pela revisão de Desenvolvedor Fullstack: `body-sm`, `label-code-sm`, `fontFamily.display/code`, `Avatar size="sm"` já existem), sem introduzir uma segunda forma de estilizar identidade na sidebar.
- O risco registado em `design.md:33` ("Call controls sit in the same wrapper") é bem colocado: a change delimita explicitamente que não vai reconstruir `CallControls` como o chip arredondado do mockup, evitando um scope creep para uma segunda change que ainda nem existe.

## 4. Documentação e decisões (ADRs)

Veredito: OK

- Três decisões, cada uma com alternativa considerada e motivo de rejeição, no padrão já usado nas outras changes desta sessão. A Decisão 2 em particular já antecipa o ponto mais delicado de implementação (isolar o anel de presença só a esta faixa, sem tocar `.presence` global) e justifica a escolha em vez de deixá-la implícita.

## 5. Ponte entre produto e técnico

Veredito: Atenção

- O "Why" (`proposal.md:5`) identifica a causa exacta do defeito visual anterior — a correcção da 1.3.0 copiou o estado destacado de `mesa_menu_de_conta_popover_modal_de_sair` em vez do estado em repouso do shell — e o `design.md` traduz isso em tokens concretos, sem ambiguidade de produto.
- **Achado cruzado, fora do escopo desta change mas relevante para confiança no processo**: a change já arquivada `openspec/changes/archive/2026-10-12-visual-parity-full-reaudit` tem a Tarefa 2.2 marcada `[x]` como tendo corrigido esta mesma cor em `UserPanel.tsx:22`. O código actual ainda tem `text-secondary` nessa linha — ou seja, o registo de progresso dessa change arquivada não corresponde ao estado real do repositório. Isso não bloqueia `user-panel-identity-parity` (a Decisão 1 desta change resolve a cor de qualquer forma, com justificação própria e correcta), mas é o mesmo padrão de checkbox desalinhado com a realidade já visto anteriormente nesta sessão em `desktop-packaging-ci`. Vale o utilizador saber que o histórico de `visual-parity-full-reaudit` pode não ser confiável ponto a ponto, não só no handle do `UserPanel`.

## Bloqueantes antes de implementar

- nenhum
