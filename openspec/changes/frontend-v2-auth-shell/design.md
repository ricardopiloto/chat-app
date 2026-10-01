# Design

## Context

Esta fase constrói sobre a fundação (`frontend-v2-foundation`): tokens de dois temas, Tailwind, biblioteca de componentes base, cliente de API/WS puro + TanStack Query, motor de i18n. Ver proposal.md para motivação. A v1 já implementa tudo o que esta fase precisa como referência de comportamento: `frontend/src/pages/Auth.tsx`, `frontend/src/crypto/identity.ts`, `frontend/src/shell/{AppShell,ServerRail,Sidebar,TopBar,UserPanel,ContextMenu}.tsx`, `frontend/src/components/AccountMenu.tsx`.

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

### D1 — Porte 1:1 da lógica de criptografia de identidade, sem alterações de algoritmo
`frontend-v2/src/crypto/identity.ts` replica exactamente `frontend/src/crypto/identity.ts`: par de chaves NaCl (`nacl.box.keyPair()`), derivação Argon2id via `hash-wasm` com os mesmos parâmetros (paralelismo 1, 3 iterações, 32 MiB, hash de 32 bytes), cifra AES-GCM via WebCrypto, persistência em IndexedDB (`chat-identity`/`keys`, chave `identity:<accountId>`), e a mesma distinção de erro `missing_vault` vs `bad_password` (`IdentityUnlockError`).
**Porquê**: é lógica de segurança já validada em produção (ver `docs/v2/TR-frontend-v2.md` §8.2, risco identificado de reescrever isto do zero sem portar a lógica). Nenhuma parte desta fase tem motivo técnico para mudar o algoritmo — só a UI à volta muda.
**Alternativa considerada**: trocar Argon2id/`hash-wasm` por outra implementação (ex. `argon2-browser`, WASM diferente). Rejeitada — não há problema conhecido com a implementação actual, e trocar introduz risco de regressão de segurança sem benefício.

### D2 — Shell como layout de rotas (SolidJS Router), não como estado global ad-hoc
O shell (`AppShell`) é implementado como um componente de layout do `@solidjs/router` que envolve as rotas de servidor/canal, com o servidor/canal activos derivados dos parâmetros da URL (`/servers/:serverId`, `/servers/:serverId/channels/:channelId`) — replicando a abordagem já usada em `frontend/src/App.tsx` e `pages/ChannelRoute.tsx` — em vez de um estado global (store) separado da navegação.
**Porquê**: mantém a URL como fonte de verdade de "onde estou", o que simplifica partilhar links profundos (`?msg=` para notificações, por exemplo, na Fase 3) e evita duas fontes de verdade (router + store) a dessincronizar.

### D3 — Modo claro do shell: extrapolado dos tokens da Fase 0, não de um mockup
Como nenhum dos 30 mockups mostra o shell em modo claro, esta fase aplica os tokens claros já definidos em `frontend-v2-foundation` (D2/2.2 desse change) directamente aos componentes do shell, sem pedir mockups novos — conforme decisão já tomada com o utilizador (`docs/v2/TR-frontend-v2.md` §10 pergunta 3: "especificar no design.md... seguindo os padrões visuais já estabelecidos").
**Verificação de qualidade**: a Fase 1 deve incluir uma revisão visual manual do shell em modo claro antes de ser dada como concluída (ver tasks.md), precisamente porque não há mockup de referência a comparar — o risco de um tema claro "quebrado" é maior aqui do que nas áreas com mockup.

### D4 — Shell responsivo mobile: replica o padrão de drawer já usado na v1
A v1 já resolve isto (`AppShell.tsx`: drawer com backdrop abaixo de 900px). Esta fase adopta o mesmo padrão comportamental, ajustado ao breakpoint definido na Fase 0 (768px, conforme os tokens Tailwind `theme.screens` já criados) em vez de reinventar a partir do zero — de novo, sem mockup de referência, mas com um padrão funcional já validado em produção pela v1 para se basear.
**Alternativa considerada**: usar um padrão diferente (ex. bottom navigation, como o `DESIGN.md` do Campfire Modernism sugere em prosa para mobile "<768px: bottom navigation bar"). Rejeitada por agora — nenhum mockup demonstra isso, e o padrão de drawer da v1 é conhecido e testado; divergir para bottom-nav sem nenhuma referência visual seria mais risco do que valor nesta fase. Registado como pergunta em aberto.

### D5 — Menu de conta segue o mockup dedicado; logout sempre com confirmação
`mesa_menu_de_conta_popover_modal_de_sair` é o mockup mais completo e directamente aplicável desta fase — segue-se a sua estrutura (popover com nome/avatar/idioma/sair + modal de confirmação de logout) quase directamente, adaptando só os tokens/ícones já reconciliados na Fase 0.

## Risks / Trade-offs

- **[Risco] Modo claro do shell sem mockup de referência pode ter problemas de contraste não previstos** → **Mitigação**: revisão visual manual explícita nas tasks desta fase (D3), antes de considerar a fase concluída.
- **[Risco] Padrão de drawer mobile copiado da v1 pode não se sentir nativo ao novo design system** (Campfire Modernism sugere bottom-nav em prosa, nunca desenhado) → **Mitigação**: aceitar o risco nesta fase (é reversível — trocar o padrão de navegação mobile mais tarde não exige mudança de dados/contrato), documentado como pergunta em aberto.
- **[Risco] Reescrever `identity.ts` à mão, mesmo copiando a lógica, pode introduzir um erro subtil de transcrição num código de segurança** → **Mitigação**: a tarefa de porte desta fase deve incluir um teste manual de round-trip (cifrar com a v2, decifrar com a mesma v2, e idealmente confirmar que um cofre criado pela v1 é desbloqueável pela v2 e vice-versa, já que o formato do cofre — `IdentityVault` — é partilhado via backend).

## Open Questions

- Padrão de navegação mobile do shell: manter o drawer da v1, ou adoptar bottom-navigation como o `DESIGN.md` sugere em prosa (nunca desenhado em mockup)? Não bloqueia esta fase (D4 assume "manter drawer"), mas vale decidir antes de investir mais polimento visual mobile na Fase 5.

### D6 — Convite no cadastro
Por decisão explícita do utilizador durante implementação, o cadastro inclui código editável, lido também de `/invite/:code` e `?invite=<code>`. O código é enviado como `invite_code`; apenas o backend decide se é obrigatório ou válido. Não inclui administração nem aceitação de convite para conta existente.
