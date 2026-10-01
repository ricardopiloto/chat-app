# Design

## Context

Última fase da reescrita. Consolida duas dívidas conscientes registadas explicitamente em cada fase anterior (D3 da Fase 1 para o shell, D3/D4 da Fase 4 para os layouts sem mockup e a faixa de E2EE desligada — todas resolvidas "por extrapolação" com uma revisão visual pontual, não uma auditoria de conjunto) e executa a decisão de corte de produção que ficou em aberto desde o TR (`docs/v2/TR-frontend-v2.md` §10, pergunta 2 — já resolvida: `frontend-v2/` paralelo até este ponto).

## Goals / Non-Goals

**Goals:**
- Zero dívida de modo claro, responsividade e i18n ao fim desta fase.
- Um corte de produção seguro, com rollback disponível.

**Non-Goals:**
- Qualquer funcionalidade nova — esta fase não introduz comportamento, só corrige e liga o que já foi especificado.
- Resolver as perguntas em aberto registadas nas fases anteriores que não bloqueiam o corte (ex.: padrão de navegação mobile drawer-vs-bottom-nav da Fase 1, adoptar `@livekit/components-*` da Fase 4) — ficam registadas como trabalho pós-corte, não bloqueiam esta fase.

## Decisions

### D1 — Auditoria por checklist contra o inventário funcional, não um redesenho
Esta fase não volta a desenhar nada — percorre sistematicamente `docs/design-system/stitch-prompt.md` §3 (a lista exaustiva de telas/fluxos da v1) e verifica cada item em `frontend-v2`, em modo claro e em viewport móvel, corrigindo defeitos pontuais encontrados. Não é uma nova ronda de mockups.
**Porquê**: as fases anteriores já resolveram modo claro/mobile "por extrapolação dos padrões estabelecidos" (decisão already tomada, TR §10 pergunta 3) — esta fase verifica que essa extrapolação foi aplicada de forma consistente em todo o lado, não questiona a abordagem em si.

### D2 — Corte via troca de destino Nginx, sem período de convivência em produção
O corte é uma alteração de configuração (`root /opt/mesa/frontend/dist;` → `root /opt/mesa/frontend-v2/dist;` em `docs/deploy-producao.md`/Nginx), não uma migração gradual por utilizador (ex. feature flag por conta, canary). A v1 e a v2 não servem tráfego de produção em simultâneo para utilizadores diferentes.
**Porquê**: o backend não tem CORS nem serve estáticos — ambas as versões já partilham exactamente a mesma API e o mesmo cookie de sessão; não há necessidade de um mecanismo de split de tráfego mais complexo do que trocar qual directório o Nginx serve. Uma migração gradual por utilizador exigiria lógica adicional (ex. decidir por cookie/cabeçalho qual frontend servir) que não existe hoje e que esta reescrita não pede.
**Alternativa considerada**: período de convivência com opt-in (ex. um parâmetro de URL ou cookie que escolhe a versão). Rejeitada — complexidade desproporcional para uma aplicação self-hosted de grupo pequeno (não uma aplicação com milhões de utilizadores a migrar gradualmente); o `docs/operar-instancia.md` já assume uma única versão de frontend por instância.

### D3 — `frontend/` (v1) não é apagada nesta fase, só deixa de ser servida
Depois do corte, `frontend/` permanece no repositório (não apagada) durante um período de rollback disponível (ver requisito "Caminho de rollback disponível"). A decisão de quando efectivamente remover `frontend/` do repositório fica registada como pergunta em aberto (ver Open Questions) — não é tomada nesta fase.

### D4 — Fecho com três portões: paridade, fidelidade e independência
O corte só é elegível quando os três portões passam: (1) **paridade funcional** — todos os itens de `docs/v2/parity-checklist.md` verificados contra a aplicação anterior; (2) **fidelidade visual** — as 31 entradas de `docs/v2/AUDIT-fidelity.md` §4 reavaliadas e todas as telas em escopo **Fiel** (ausentes só se excluídas por escopo); (3) **independência** — `check-v1-overlap` sobre todo `frontend-v2/src` dentro dos limiares, com excepções justificadas. Nenhum dos portões é negociável por prazo: uma tela abaixo de Fiel regressa à fase que a entregou.

### D5 — Reconciliação do backend
Antes do corte lista-se tudo o que mudou no backend durante a reescrita. Cada alteração tem de ser aditiva e retrocompatível com a v1 enquanto o rollback existir, estar em `docs/v2/contracts/` e ter testes (`cargo test`) a passar. Alterações não retrocompatíveis obrigam a rever o caminho de rollback antes do corte.

## Risks / Trade-offs

- **[Risco] Auditoria de conjunto pode encontrar mais defeitos do que o esperado**, já que nenhuma fase anterior teve uma revisão de modo claro/mobile área-a-área — só pontual em 2 casos (Fase 1 shell, Fase 4 E2EE-desligada/layouts) → **Mitigação**: orçamentar esta fase com expectativa de correcções, não só verificação; o checklist de `docs/design-system/stitch-prompt.md` §3 dá uma lista fechada e finita de áreas a percorrer, não um escopo aberto.
- **[Risco] Corte sem convivência (D2) significa que um problema descoberto só depois do corte afecta todos os utilizadores de uma vez** → **Mitigação**: requisito explícito de rollback disponível (troca de `root` do Nginx de volta), testável antes do corte real.

## Migration Plan

1. Completar a auditoria de D1 e corrigir os defeitos encontrados.
2. Confirmar o checklist de paridade completo (requisito "Critério de aceite de paridade antes do corte").
3. Build de produção de `frontend-v2/` (`npm run build` → `frontend-v2/dist/`).
4. Alterar a configuração Nginx para servir `frontend-v2/dist` em vez de `frontend/dist`, mantendo a mesma origem/porta que o backend espera para o cookie de sessão.
5. Verificar manualmente uma sessão de utilizador existente (criada antes do corte) continua válida depois do corte.
6. Manter `frontend/` disponível no servidor (não apagar os ficheiros de build antigos) durante o período de rollback definido.
7. Rollback, se necessário: reverter a configuração Nginx para `frontend/dist`, sem qualquer alteração de backend.

- **[Risco] Reabrir telas que não chegam a Fiel pode atrasar o corte** → **Mitigação**: o portão de fidelidade corre também no fecho de cada fase anterior, para que esta fase encontre poucas surpresas.

## Open Questions

- Quando remover `frontend/` do repositório de vez, depois do corte? Não bloqueia esta fase (o requisito de rollback só exige mantê-la disponível "durante um período a definir") — decisão do dono do produto, a tomar depois do corte estar validado em produção por tempo suficiente.
- As perguntas em aberto registadas nas Fases 1 (padrão de navegação mobile) e 4 (adoptar `@livekit/components-*`) ficam para uma iteração pós-corte, fora do escopo desta reescrita de 6 fases.
