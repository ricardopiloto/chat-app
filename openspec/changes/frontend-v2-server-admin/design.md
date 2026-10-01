# Design

## Context

Esta fase constrói sobre `frontend-v2-foundation` (tokens, componentes, cliente API+TanStack Query) e `frontend-v2-auth-shell` (shell de navegação, sidebar que já lê servidores/canais). Referências de comportamento na v1: `frontend/src/shell/Sidebar.tsx` (diálogos de criar servidor/canal, hoje embutidos na sidebar), `pages/{MembersManagePage,RolesManagePage,RolePermissionsPage,ServerImagePage,ServerWelcomePage,ServerDeletePage}.tsx`, `components/ChannelAclPanel.tsx`, `components/MembersPanel.tsx` (silenciar), `pages/Invite.tsx`.

Mockups de referência: `mesa_modal_criar_servidor_cust_dia_e2ee`, `mesa_modal_criar_canal_de_voz_cust_dia_e2ee`, `mesa_defini_es_do_servidor_membros`, `mesa_defini_es_do_servidor_cargos_e_permiss_es`, `mesa_defini_es_do_servidor_vis_o_geral_e_boas_vindas`, `mesa_di_logo_permiss_es_de_canal_acl_inspecionar_acesso`, `mesa_di_logo_inspecionar_acesso_efetivo_fator_a_fator`, `mesa_modais_de_gest_ao_de_canal`, `mesa_di_logo_de_convidar_fluxo_encadeado_de_2_passos`, `mesa_convite_onboarding_de_convidado`.

## Goals / Non-Goals

**Goals:**
- Todo o ciclo de vida de administração de servidor e canal que a v1 já suporta hoje, com paridade de comportamento (não necessariamente de arquitectura de informação — ver D1).
- Convites funcionais de ponta a ponta, incluindo o registo inline de um visitante novo.

**Non-Goals:**
- Conteúdo de canal de texto/voz (Fases 3/4).
- Qualquer coisa do escopo excluído (MLS, multi-dispositivo, Passkeys, gravação/egress, multi-cena — ver `docs/backlog/backlog.md`).
- Um ecrã de "permissões" navegável separadamente por cargo (ver D1) — decisão consciente de seguir a IA dos mockups.

## Decisions

### D1 — Seguir a arquitectura de informação dos mockups (páginas agregadas, editor de cargo inline), não a da v1
A v1 tem páginas totalmente separadas (`ServerImagePage`, `ServerWelcomePage`, `ServerDeletePage`, e um botão "Permissões" por cargo que navega para `RolePermissionsPage`). Os mockups novos agregam Imagem+Boas-vindas+Apagar numa única "Visão Geral", e editam permissões de cargo inline na mesma página da lista de cargos (master-detail), sem navegação separada.
**Decisão**: esta fase segue a estrutura dos mockups. **Porquê**: é a estrutura que já foi desenhada visualmente e aprovada como a nova identidade do produto; manter a estrutura antiga da v1 exigiria desenhar páginas novas não cobertas por nenhum mockup, ou forçar os mockups existentes numa IA diferente da que foram desenhados. **Trade-off aceite**: quem conhece a v1 vai encontrar menos cliques para "Apagar servidor" antes (estava isolado) e agora está dentro de "Visão Geral" — isto é uma mudança de UX consciente, não uma regressão de funcionalidade (o requisito continua coberto, só muda onde vive).
**Alternativa considerada**: manter páginas separadas como a v1 e adaptar só o visual dos mockups a essa estrutura. Rejeitada — perderia o valor do trabalho de design já feito (a agregação foi uma escolha deliberada do design system, não um acidente, conforme confirmado pela auditoria em `docs/v2/TR-frontend-v2.md` §6.2).

### D2 — Durações de silenciamento seguem a v1 (5/10/15/30 min + custom), não o mockup
O mockup de silenciar membro (`mesa_modais_de_gest_ao_de_canal`) usa durações diferentes (5min/15min/1h/24h/1sem/Custom) das que a v1 implementa hoje (5/10/15/30 min + minutos customizados). Esta fase segue o comportamento da v1, não o do mockup.
**Porquê**: o mandato desta reescrita é paridade funcional com a v1 (ver `docs/design-system/stitch-prompt.md` §0), não introduzir novas opções de duração — as durações do mockup não foram pedidas nem justificadas por nenhuma necessidade de produto identificada, e mudar durações de silenciamento é uma decisão de produto que não foi tomada. A apresentação visual (pills de duração) do mockup é reaproveitada; só os valores mudam para bater com a v1.
**Alternativa considerada**: adoptar as durações do mockup como estão. Rejeitada por introduzir uma mudança de comportamento não solicitada (ver TR §7.4, achado de divergência já registado).

### D3 — Unmute fica junto do fluxo de mute, não num diálogo de diagnóstico separado
Os mockups novos colocam a acção de dessilenciar num diálogo de diagnóstico de acesso completamente diferente (`mesa_di_logo_inspecionar_acesso_efetivo_fator_a_fator`), desligado do diálogo de silenciar. Esta fase implementa mute+unmute como um par coerente no mesmo componente (`MuteMemberDialog` mostra o botão de dessilenciar quando o membro já está silenciado), replicando a coesão que a v1 já tem em `MembersPanel.tsx`.
**Porquê**: separar mute e unmute em fluxos desconhecidos um do outro é uma regressão de usabilidade identificada na auditoria (TR §7.4, achado D do lote 2) — a v2 corrige isso em vez de herdar a inconsistência do mockup.

### Requirement do inspector de acesso: reconciliar as duas UX encontradas nos mockups
Os mockups entregaram duas formas diferentes de "inspecionar acesso efectivo": uma dentro do próprio painel de ACL do canal (`mesa_di_logo_permiss_es_de_canal_acl_inspecionar_acesso`, sub-aba) e outra como diálogo standalone de diagnóstico de um membro específico (`mesa_di_logo_inspecionar_acesso_efetivo_fator_a_fator`). Esta fase adopta a **primeira** (sub-aba dentro do painel de ACL) como a canónica, porque é a que corresponde directamente ao requisito já existente na v1 (`ChannelAclPanel.tsx` → "Inspecionar acesso"), e não introduz um ecrã de diagnóstico de moderação novo que a v1 não tem.

## Risks / Trade-offs

- **[Risco] Seguir a IA agregada dos mockups (D1) pode confundir quem espera a estrutura da v1** → **Mitigação**: aceite conscientemente; documentado aqui e no proposal para que a decisão não pareça acidental durante revisão.
- **[Risco] Divergir das durações de silenciamento do mockup (D2) significa não reaproveitar 100% do HTML do mockup** → **Mitigação**: só os valores numéricos mudam; a apresentação visual (pills, estilo, disposição) é reaproveitada integralmente.
- **[Risco] O construtor de regras de ACL é o componente mais complexo desta fase** (múltiplos selects dependentes: tipo de sujeito → sujeito → efeito → nível) → **Mitigação**: `mesa_di_logo_permiss_es_de_canal_acl_inspecionar_acesso` é, segundo a auditoria, "o ficheiro mais completo do lote" — seguir a sua estrutura JS de perto reduz risco de reinvenção.

## Open Questions

Nenhuma — as divergências entre mockups e v1 encontradas nesta fase (D1, D2, D3) foram resolvidas directamente nesta secção, com justificação registada, em vez de deixadas em aberto.
