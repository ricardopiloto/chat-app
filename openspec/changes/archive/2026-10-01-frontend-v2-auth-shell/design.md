# Design

## Context

Esta fase constrói sobre a fundação (`frontend-v2-foundation`): tokens de dois temas, Tailwind, biblioteca de componentes base, cliente de API/WS puro + TanStack Query, motor de i18n. Ver proposal.md para motivação. A referência de comportamento é a aplicação v1 **em execução**, observada como caixa-preta, e os contratos do backend e de `docs/v2/contracts/`. O código de `frontend/` não é consultado nem reaproveitado.

Os mockups de referência visual desta fase: `mesa_autentica_o_e_registo_login_criar_conta`, `mesa_desbloqueio_de_conta_recupera_o_de_identidade`, `mesa_shell_da_aplica_o_chat_de_texto` (shell geral), `mesa_menu_de_conta_popover_modal_de_sair`. Nenhum destes (nem nenhum dos 30 mockups) demonstra o shell em modo claro nem em viewport mobile — ver Decisões D3/D4 para como esta fase resolve isso sem mockup adicional, conforme já acordado (`docs/v2/TR-frontend-v2.md` §10, pergunta 3).

## Goals / Non-Goals

**Goals:**
- Um utilizador consegue registar-se, iniciar sessão, e (em dispositivo novo) desbloquear ou recuperar a sua identidade, com o mesmo modelo de segurança da v1.
- O shell de navegação (rail, sidebar, topbar, user panel, menu de conta) existe, navega entre servidores/canais já criados via API, e funciona em desktop e mobile, nos dois temas.

**Non-Goals:**
- Criar/editar/apagar servidores ou canais (Fase 2) — a sidebar só lê e navega, não gere.
- Conteúdo de canal de texto ou de voz (Fases 3 e 4) — navegar para um canal nesta fase pode renderizar um placeholder de rota, não a tela final.
- Conteúdo aberto de pesquisa e notificações (Fase 3) — só os pontos de entrada na topbar.
- Qualquer coisa do escopo excluído em `docs/v2/TR-frontend-v2.md` §7 (MLS, multi-dispositivo, Passkeys).

## Decisions

### D1 — Criptografia de identidade reescrita a partir do contrato de formato
`frontend-v2/src/crypto/identity` é implementado de raiz a partir de `docs/v2/contracts/crypto-formats.md`: par de chaves NaCl box, derivação Argon2id (`hash-wasm`) com os parâmetros do contrato (paralelismo 1, 3 iterações, 32 MiB, 32 bytes), cifra AES-GCM via WebCrypto, persistência em IndexedDB com a chave de registo definida no contrato, e a distinção de erro `missing_vault` vs `bad_password`. Os parâmetros e formatos não mudam porque são **dados de contas existentes**, não porque se copie código.
**Verificação**: todos os vectores de `docs/v2/contracts/vectors/` (cofre de identidade) passam no harness de contrato; um cofre criado pela v2 é aceite pelo oráculo (v1 em execução) e vice-versa.
**Alternativa considerada**: trocar de implementação de Argon2id. Rejeitada: sem ganho e com risco de incompatibilidade com cofres existentes.

### D2 — Shell como layout de rotas (SolidJS Router), não como estado global ad-hoc
O shell (`AppShell`) é implementado como um componente de layout do `@solidjs/router` que envolve as rotas de servidor/canal, com o servidor/canal activos derivados dos parâmetros da URL (`/servers/:serverId`, `/servers/:serverId/channels/:channelId`) em vez de um estado global (store) separado da navegação.
**Porquê**: mantém a URL como fonte de verdade de "onde estou", o que simplifica partilhar links profundos (`?msg=` para notificações, por exemplo, na Fase 3) e evita duas fontes de verdade (router + store) a dessincronizar.

### D3 — Modo claro do shell: extrapolado dos tokens da Fase 0, não de um mockup
Como nenhum dos 30 mockups mostra o shell em modo claro, esta fase aplica os tokens claros já definidos em `frontend-v2-foundation` (D2/2.2 desse change) directamente aos componentes do shell, sem pedir mockups novos — conforme decisão já tomada com o utilizador (`docs/v2/TR-frontend-v2.md` §10 pergunta 3: "especificar no design.md... seguindo os padrões visuais já estabelecidos").
**Verificação de qualidade**: a Fase 1 deve incluir uma revisão visual manual do shell em modo claro antes de ser dada como concluída (ver tasks.md), precisamente porque não há mockup de referência a comparar — o risco de um tema claro "quebrado" é maior aqui do que nas áreas com mockup.

### D4 — Shell responsivo mobile: gaveta com backdrop desenhada de raiz
Abaixo de 768px (breakpoint dos tokens da Fase 0) o rail e a sidebar colapsam numa gaveta com backdrop, aberta por botão na topbar. O comportamento é desenhado a partir dos tokens e do `DESIGN.md`, sem mockup de referência e sem partir da implementação da v1.
**Alternativa considerada**: bottom navigation, que o `DESIGN.md` sugere em prosa para <768px. Mantém-se a gaveta por ser o padrão que não exige reorganizar a navegação nem tem mockup; registado como pergunta em aberto.

### D5 — Menu de conta segue o mockup dedicado; logout sempre com confirmação
`mesa_menu_de_conta_popover_modal_de_sair` é o mockup mais completo e directamente aplicável desta fase — segue-se a sua estrutura (popover com nome/avatar/idioma/sair + modal de confirmação de logout) quase directamente, adaptando só os tokens/ícones já reconciliados na Fase 0.

## Risks / Trade-offs

- **[Risco] Modo claro do shell sem mockup de referência pode ter problemas de contraste não previstos** → **Mitigação**: revisão visual manual explícita nas tasks desta fase (D3), antes de considerar a fase concluída.
- **[Risco] A gaveta mobile pode não se sentir nativa ao novo design system** (Campfire Modernism sugere bottom-nav em prosa, nunca desenhado) → **Mitigação**: aceitar o risco nesta fase (é reversível — trocar o padrão de navegação mobile mais tarde não exige mudança de dados/contrato), documentado como pergunta em aberto.
- **[Risco] Implementar a identidade criptográfica sem olhar a v1 pode produzir incompatibilidade subtil de formato** → **Mitigação**: contrato escrito + vectores (fundação, D8), harness de contrato e teste cruzado com a v1 em execução usada como oráculo (cofre criado por uma abre na outra).

## Open Questions

- Padrão de navegação mobile do shell: manter o drawer da v1, ou adoptar bottom-navigation como o `DESIGN.md` sugere em prosa (nunca desenhado em mockup)? Não bloqueia esta fase (D4 assume "manter drawer"), mas vale decidir antes de investir mais polimento visual mobile na Fase 5.

### D7 — Checklists de fidelidade desta fase
Elementos obrigatórios por tela (ver `docs/v2/AUDIT-fidelity.md` §4). Fora de escopo e **não** implementados: simulador de estado, Mesa Bridge/QR, semente de 24 palavras, MLS, dispositivos, opção de "cache encriptada" no logout.

- **Autenticação (`mesa_autentica_o_e_registo_login_criar_conta`)**: painel esquerdo com marca, proposta de valor, três cartões de recursos e rodapé de instância; cartão de formulário com abas Entrar/Criar conta em controlo segmentado; handle com prefixo `@` e dica de exemplo; senha com rótulo "Senha e chave mestra", ligação "Esqueceu o cofre?" e alternância de visibilidade; botão primário em pílula com ícone; separador "OU" e botão secundário "Criar uma nova conta na instância"; selo de protocolo; chips de topo (instância/versão, E2EE, idioma, tema).
- **Desbloqueio/recuperação (`mesa_desbloqueio_de_conta_recupera_o_de_identidade`)**: painel esquerdo; chip "sessão detectada · cofre em falta"; cartão de identidade (avatar, nome, handle, sessão) com "Trocar de conta"; aviso de enclave; campo de senha com alternância; botão "Desbloquear"; separador; bloco "Recuperar identidade" com a acção; ligação "Trocar de conta" no rodapé.
- **Shell (`mesa_shell_da_aplica_o_chat_de_texto`)**: topbar com logo, instância+versão, chip E2EE, busca com atalho visível, alternador de tema em três ícones (Sistema/Claro/Escuro), notificações com indicador, avatar; rail com imagem/iniciais e indicadores de não-lido e voz; sidebar com cabeçalho do servidor (nome, convidar, definições), secções Texto e Voz/vídeo com "+" por permissão, cadeado em privados, painel do utilizador (avatar, nome, handle, acções); **painel de Membros** à direita (contagem online, agrupado por cargo e presença, alternável, oculto em mobile).
- **Menu de conta e saída (`mesa_menu_de_conta_popover_modal_de_sair`)**: menu com entradas de acção (Minha conta, idioma, tema, Sair) e **sem** `<input type=file>` nativo à vista (o avatar altera-se na página de conta); modal de saída com ícone, explicação do que acontece ao sair, Cancelar com atalho Esc e confirmação com ícone.
- **Minha Conta mínima**: cabeçalho com avatar, nome editável e handle; selector de idioma; alterar/remover avatar; sem perfil, bio, recuperação, passkeys nem visibilidade P2P.
- **Marca**: logo oficial em topbar, auth e favicon.

### D8 — Funcionalidades desta área que têm de continuar a funcionar
Registo (com convite opcional e por link), login com cofre local, desbloqueio em dispositivo novo (cofre remoto), recuperação de identidade, trocar de conta, sessão persistente por cookie, rail com indicadores em tempo real (`message.new`, `voice.occupancy`), lista de canais por servidor, cadeado em privados, estado vazio, alternador de tema persistente com modo Sistema, idioma pt-BR/en, edição de nome a mostrar, upload e remoção de avatar, logout com confirmação, gaveta mobile, presença de membros. Cada item consta de `docs/v2/parity-checklist.md` e é verificado contra o comportamento da v1.

### D6 — Convite no cadastro
Por decisão explícita do utilizador durante implementação, o cadastro inclui código editável, lido também de `/invite/:code` e `?invite=<code>`. O código é enviado como `invite_code`; apenas o backend decide se é obrigatório ou válido. Não inclui administração nem aceitação de convite para conta existente.
