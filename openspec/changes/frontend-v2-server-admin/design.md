# Design

## Context

Esta fase constrói sobre `frontend-v2-foundation` (tokens, componentes, cliente API+TanStack Query) e `frontend-v2-auth-shell` (shell de navegação, sidebar que já lê servidores/canais). A referência de comportamento é a aplicação v1 em execução (caixa-preta) e os contratos do backend; o código de `frontend/` não é consultado.

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
A aplicação actual tem páginas totalmente separadas (imagem, boas-vindas, apagar, e um botão "Permissões" por cargo que navega para outro ecrã). Os mockups novos agregam Imagem+Boas-vindas+Apagar numa única "Visão Geral", e editam permissões de cargo inline na mesma página da lista de cargos (master-detail), sem navegação separada.
**Decisão**: esta fase segue a estrutura dos mockups. **Porquê**: é a estrutura que já foi desenhada visualmente e aprovada como a nova identidade do produto; manter a estrutura antiga da v1 exigiria desenhar páginas novas não cobertas por nenhum mockup, ou forçar os mockups existentes numa IA diferente da que foram desenhados. **Trade-off aceite**: quem conhece a v1 vai encontrar menos cliques para "Apagar servidor" antes (estava isolado) e agora está dentro de "Visão Geral" — isto é uma mudança de UX consciente, não uma regressão de funcionalidade (o requisito continua coberto, só muda onde vive).
**Alternativa considerada**: manter páginas separadas como a v1 e adaptar só o visual dos mockups a essa estrutura. Rejeitada — perderia o valor do trabalho de design já feito (a agregação foi uma escolha deliberada do design system, não um acidente, conforme confirmado pela auditoria em `docs/v2/TR-frontend-v2.md` §6.2).

### D2 — Durações de silenciamento seguem a v1 (5/10/15/30 min + custom), não o mockup
O mockup de silenciar membro (`mesa_modais_de_gest_ao_de_canal`) usa durações diferentes (5min/15min/1h/24h/1sem/Custom) das que a v1 implementa hoje (5/10/15/30 min + minutos customizados). Esta fase segue o comportamento da v1, não o do mockup.
**Porquê**: o mandato desta reescrita é paridade funcional com a v1 (ver `docs/design-system/stitch-prompt.md` §0), não introduzir novas opções de duração — as durações do mockup não foram pedidas nem justificadas por nenhuma necessidade de produto identificada, e mudar durações de silenciamento é uma decisão de produto que não foi tomada. A apresentação visual (pills de duração) do mockup é reaproveitada; só os valores mudam para bater com a v1.
**Alternativa considerada**: adoptar as durações do mockup como estão. Rejeitada por introduzir uma mudança de comportamento não solicitada (ver TR §7.4, achado de divergência já registado).

### D3 — Unmute fica junto do fluxo de mute, não num diálogo de diagnóstico separado
Os mockups novos colocam a acção de dessilenciar num diálogo de diagnóstico de acesso completamente diferente (`mesa_di_logo_inspecionar_acesso_efetivo_fator_a_fator`), desligado do diálogo de silenciar. Esta fase implementa mute+unmute como um par coerente no mesmo componente (`MuteMemberDialog` mostra o botão de dessilenciar quando o membro já está silenciado), preservando a coesão que a aplicação actual já tem entre silenciar e dessilenciar.
**Porquê**: separar mute e unmute em fluxos desconhecidos um do outro é uma regressão de usabilidade identificada na auditoria (TR §7.4, achado D do lote 2) — a v2 corrige isso em vez de herdar a inconsistência do mockup.

### Requirement do inspector de acesso: reconciliar as duas UX encontradas nos mockups
Os mockups entregaram duas formas diferentes de "inspecionar acesso efectivo": uma dentro do próprio painel de ACL do canal (`mesa_di_logo_permiss_es_de_canal_acl_inspecionar_acesso`, sub-aba) e outra como diálogo standalone de diagnóstico de um membro específico (`mesa_di_logo_inspecionar_acesso_efetivo_fator_a_fator`). Esta fase adopta a **primeira** (sub-aba dentro do painel de ACL) como a canónica, porque é a que corresponde directamente ao requisito já existente na v1 (`ChannelAclPanel.tsx` → "Inspecionar acesso"), e não introduz um ecrã de diagnóstico de moderação novo que a v1 não tem.

### D4 — Checklists de fidelidade desta fase
Elementos obrigatórios por tela (ver `docs/v2/AUDIT-fidelity.md` §4). **Excluídos por falta de suporte no backend ou por serem fora de escopo (AUDIT §6)**: cor de cargo (o backend não guarda cor), métricas de D20/armazenamento, assinatura pública da guilda, escopo "em todo o reino" e motivo/notificação no silenciamento, estatísticas de mensagens/anexos no apagar canal, QR e expiração configurável no convite, inspecção de chaves MLS.

- **Criar servidor (`mesa_modal_criar_servidor_cust_dia_e2ee`)**: eyebrow + título "Fundar uma Nova Mesa" com gradiente de topo, selector de sigilo/ícone da imagem do servidor, nome com contador x/32, bloco de chave mestra com Copiar, checkbox de custódia **inicialmente desmarcada** com explicação e botão Criar bloqueado até marcar, Cancelar, nota da configuração padrão (canal de texto + canal de voz).
- **Criar canal (`mesa_modal_criar_canal_de_voz_cust_dia_e2ee`)**: controlo segmentado Texto/Voz interactivo, nome com ícone, validação visual e dica de formatação, cartões de visibilidade Público/Privado com descrição, opção "visível na listagem", bloco de custódia (só voz) com chave, Copiar e checkbox **inicialmente desmarcada**, rodapé com Cancelar e Criar.
- **Definições do servidor (shell)**: sidebar própria (Servidor: Visão geral, Boas-vindas · Papéis: Cargos · Pessoas: Membros · Zona crítica: Apagar), cabeçalho com breadcrumb, título e chips (E2EE, "acesso exclusivo do dono"), botão de fechar com Esc.
- **Visão geral (`mesa_defini_es_do_servidor_vis_o_geral_e_boas_vindas`)**: cartão de imagem (pré-visualização, nome do ficheiro e tamanho, estado de validação, Alterar/Remover), nome do servidor com contador, cartão de boas-vindas (canal de destino, modelo com tokens `{user}` `{server}`, Pré-visualizar, Guardar), zona crítica com confirmação por nome.
- **Membros (`mesa_defini_es_do_servidor_membros`)**: cartões Total e Online, filtro por texto e por cargo, botão "Convidar pessoas", tabela Identidade (avatar, nome, handle, presença) · Cargo (selector) · Ações (Remover), linha do dono sem controlos, paginação, rodapé informativo.
- **Cargos (`mesa_defini_es_do_servidor_cargos_e_permiss_es`)**: criar cargo, lista em ordem com contagem de membros, ↑/↓ e apagar, cargo de sistema só-leitura, detalhe com cabeçalho do cargo, **interruptores (toggles)** agrupados Geral/Texto/Voz com contador de activas, barra de alterações por guardar (Cancelar/Guardar), matriz de membros do cargo, zona de apagar com aviso.
- **Permissões de canal (`mesa_di_logo_permiss_es_de_canal_acl_inspecionar_acesso`) e Inspecionar acesso (`mesa_di_logo_inspecionar_acesso_efetivo_fator_a_fator`)**: cabeçalho com chips, abas "Políticas e ACL activa (n)" / "Inspecionar acesso", visibilidade em cartões, construtor de regra em quatro passos numerados, lista de regras activas com ícone, efeito, prioridade e remover, rodapé com aviso, Cancelar e Guardar; inspector com membro escolhido, veredito geral e matriz por precedência (membro > cargo > `@everyone`) com itens permitido/negado/ignorado. A UX canónica é a sub-aba.
- **Silenciar e apagar canal (`mesa_modais_de_gest_ao_de_canal`)**: silenciar com cartão do membro, durações em pílulas (valores da aplicação actual, D2), tempo restante e dessilenciar; apagar com cabeçalho de risco, aviso e confirmação digitando o nome do canal.
- **Convidar (`mesa_di_logo_de_convidar_fluxo_encadeado_de_2_passos`)**: indicador de passos 01/02, cartões de canais de boas-vindas (radio, badges), opção de histórico, botão avançar; passo 2 com URL copiável e feedback "Copiado", destino, "Gerar outro convite" e Concluído.
- **Onboarding de convidado (`mesa_convite_onboarding_de_convidado`)**: cartão do servidor convidante (nome, histórico incluído, validade), handle com disponibilidade, nome de exibição, senha com barra de força, checkbox de cofre E2EE, botão "Aceitar convite", ligação "já tenho identidade".

### D5 — Funcionalidades desta área que têm de continuar a funcionar
Criar servidor com bootstrap (canal de texto + voz) e custódia de chave; criar canal de texto/voz público/privado/visível; renomear inline; apagar canal com 409 `last_channel_of_type`; ACL de canal (visibilidade, regras de membro/cargo/todos, efeito, nível); inspector de acesso; silenciar/dessilenciar com tempo restante; membros (pesquisa, mudar cargo, remover, dono protegido); cargos (criar, reordenar, apagar com aviso, permissões por grupo, cargo de sistema só-leitura); imagem do servidor (validações); boas-vindas (canal + modelo); apagar servidor por nome; convite em 2 passos, preview sem sessão, aceitar com registo inline e com sessão existente; boas-vindas publicadas no canal ao entrar. Cada item consta de `docs/v2/parity-checklist.md`.

## Risks / Trade-offs

- **[Risco] Seguir a IA agregada dos mockups (D1) pode confundir quem espera a estrutura da v1** → **Mitigação**: aceite conscientemente; documentado aqui e no proposal para que a decisão não pareça acidental durante revisão.
- **[Risco] Divergir das durações de silenciamento do mockup (D2) significa não reaproveitar 100% do HTML do mockup** → **Mitigação**: só os valores numéricos mudam; a apresentação visual (pills, estilo, disposição) é reaproveitada integralmente.
- **[Risco] O construtor de regras de ACL é o componente mais complexo desta fase** (múltiplos selects dependentes: tipo de sujeito → sujeito → efeito → nível) → **Mitigação**: `mesa_di_logo_permiss_es_de_canal_acl_inspecionar_acesso` é, segundo a auditoria, "o ficheiro mais completo do lote" — seguir a sua estrutura JS de perto reduz risco de reinvenção.

## Open Questions

Nenhuma — as divergências entre mockups e v1 encontradas nesta fase (D1, D2, D3) foram resolvidas directamente nesta secção, com justificação registada, em vez de deixadas em aberto.
