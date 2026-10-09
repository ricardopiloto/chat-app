# Review — Arquiteto de Soluções

**Change:** native-client-auth
**Data:** 2026-10-09 (revisão 2, depois de `tasks.md`/`design.md` corrigidos a pedido da revisão fullstack)
**Veredito geral:** Aprovado

## 1. Definição da arquitetura técnica

Veredito: OK

- Stack e componentes coerentes com a arquitectura actual, sem dependência nova — confirmado novamente.
- A divergência com a visão de "binário único" de `docs/arquitetura-tecnica.md` §1/§2.2 (cliente desktop decidido como só-cliente para esta iniciativa) está agora registada explicitamente em `design.md` — Decisão 3 ("Nota de reconciliação com `docs/arquitetura-tecnica.md`"), incluindo a recomendação de actualizar §2.3/§8 depois de implementar. Isto satisfaz o achado da revisão anterior; a actualização do documento em si fica, correctamente, como trabalho pós-implementação, não como bloqueio de planeamento.

## 2. Integração com a infraestrutura existente

Veredito: OK

- `design.md` — Context agora declara explicitamente que o cliente nativo fala com a mesma origem pública que o browser já usa (produção via Nginx, LAN directa em `BIND=0.0.0.0:8080`), preservando o invariante de `docs/deploy-producao.md` de que o processo Axum nunca é exposto directamente em produção. Resolve o achado da revisão anterior.
- Decisão 1 continua bem ancorada nos dois ambientes reais (LAN em HTTP, produção same-origin via Nginx); nenhuma mudança de porta, processo ou serviço.

## 3. Qualidade de arquitectura e trade-offs

Veredito: OK

- Sem alteração desde a revisão anterior — E2EE de conteúdo intocada, riscos listados com mitigação proporcional, sem impacto de performance, sem tabela nova.
- A correcção da revisão fullstack (ponto único em `AuthAccount`/`auth_view()`, e os dois pontos de extracção no `ws_handler`) é, do ponto de vista arquitectural, consistente com a Decisão 2 já aprovada (mesmo token, sem novo ciclo de vida de credencial) — não abre uma decisão nova, só corrige a granularidade do plano de implementação.

## 4. Documentação e decisões (ADRs)

Veredito: OK

- `design.md` ganhou uma quarta decisão registada (reconciliação com a arquitectura de referência) e o Context foi enriquecido com os dois pontos de extracção (`load_user`/`current_session_id`) e os quatro call sites de `auth_view()` — o nível de detalhe agora espelha com precisão o código real, o que facilita a implementação e a revisão fullstack que se seguirá.

## 5. Ponte entre produto e técnico

Veredito: OK

- Sem alteração desde a revisão anterior — a resolução da questão em aberto de `arquitetura-tecnica.md` §2.3 fica agora ainda mais explícita com a Decisão 3.

## Bloqueantes antes de implementar

- nenhum
