# Design

## Context

Ver `proposal.md` - Why. Resumo técnico do estado actual (detalhado em `docs/backlog/TR-item10-bots-chave-por-canal.md`):

- `key_envelope` tem PK `(server_id, account_id)` (`backend/migrations/0001_init.sql`); `message.content_ciphertext` e a frame key LiveKit usam a mesma `server_key`.
- `account` tem `handle`, `password_hash` (NOT NULL hoje), `identity_pubkey`, `is_initial_operator`, `identity_vault` (nullable) — sem noção de tipo/papel de conta.
- Já existe uma tabela `channel_key` (PK `channel_id`, `backend/migrations/0006_channel_e2ee_key_delete.sql`) — é custódia de **uma** cópia da `server_key` por um custodiante, para religar E2EE após gravação. Não é o mecanismo que este design introduz e não deve ser reaproveitada para ele.
- ACL de canal (visibilidade pública/privada + overwrites) já existe (`db/channel_acl.rs`, specs 047/063) e é puramente de autorização de aplicação, sem chave própria.
- Cliente: cache de chave em `Map<serverId, key>` (`frontend/src/crypto/serverKey.ts`), carregado eager para todos os Servidores no login (`keyHandoff.ts: loadAllServerKeys`).
- Contexto que habilita um corte sem compatibilidade retroativa: a app está só em testes localizados, sem dados de produção a preservar.

## Goals / Non-Goals

**Goals:**
- Uma `channel_key` própria por Canal, com envelope `(channel_id, account_id)`, reaproveitando o mecanismo de handoff já existente (`crypto_box_seal`, eventos WS `key_handoff.*`).
- Elegibilidade para o envelope determinada pela ACL de canal já existente — sem tabela nova de "membership de canal".
- Conta de bot como entidade autenticável por token, capaz de participar do handoff como qualquer conta.
- MVP funcional dos dois bots de referência (música via LiveKit, conversa via mensagens de canal), escopados ao(s) canal(is) de instalação.
- UI humana para criar, listar e revogar bots de um Servidor, integrada na shell de definições já existente — sem isto, o endpoint de instalação (D1) não é alcançável por ninguém fora de uma chamada manual à API.

**Non-Goals:**
- Bot de transcrição/egress por participante (depende do item 1 do backlog).
- Qualquer forma de permissão por comando (slash-commands) ou de "intents" configuráveis — o escopo de um bot nesta versão é só "a quais canais tem ACL+chave", não granularidade por tipo de evento.
- Forward secrecy / rotação de chave ao remover um membro ou bot — fica como limitação conhecida, não resolvida por este design.
- Migração retroativa de dados cifrados sob a `server_key` antiga — assumido descartável neste contexto.

## Decisions

### D1 — Conta de bot: tabela satélite `bot`, não um campo em `account`
Introduz-se `bot(account_id PK/FK → account.id, owner_account_id FK → account.id, token_hash, created_at)`, em vez de um campo `account.kind`.

**Porquê**: segue o padrão já estabelecido no schema (`channel_key`, `key_envelope` como tabelas satélite de propósito único) em vez de sobrecarregar `account` com colunas só-de-bot (`token_hash`, `owner_account_id`) que ficariam `NULL` para toda conta humana. `account.id` continua a ser a FK universal usada por `key_envelope`, `membership`, `channel_acl` — um bot "é" uma `account` para esses efeitos, sem exigir nenhuma mudança nesses três módulos.
**Alternativa considerada**: campo `account.kind ENUM('human','bot')` — rejeitada por exigir `password_hash`/`identity_vault` nulos condicionalmente a esse campo, acoplando validação de conta humana vs. bot dentro de `account` em vez de a isolar numa tabela própria.

### D2 — `account.password_hash` passa a nullable; bot não tem `identity_vault` nem fluxo de login humano
Migração altera `password_hash` para nullable. O endpoint de login humano passa a rejeitar explicitamente contas presentes em `bot` (em vez de tentar validar password contra `NULL`). Autenticação de bot é por token próprio (ver D5), não por este endpoint.

**Porquê**: `identity_vault` já é nullable hoje (confirmado em `0002_identity_vault.sql`); só faltava `password_hash` acompanhar o mesmo relaxamento para contas sem login por password.

### D3 — Elegibilidade de envelope segue a ACL de canal existente, sem tabela de membership por canal
Ao decidir a quem selar/resselar a `channel_key` de um Canal, o sistema consulta a mesma resolução de ACL que já existe para "quem pode ver este canal" (específica de role/overwrite, specs 047/063) — não se introduz uma tabela `channel_membership` nova.

**Porquê**: evita duplicar a fonte de verdade de "quem tem acesso a este canal" — ACL e elegibilidade de chave ficariam divergentes se fossem tabelas separadas. Instalar um bot = conceder-lhe ACL nesse Canal; isso por si só torna-o elegível para o handoff.
**Alternativa considerada**: tabela de membership por canal dedicada — rejeitada por este motivo; reavaliável só se a resolução de ACL se mostrar demasiado cara para consultar a cada handoff (não esperado no volume actual).

### D4 — Carregamento de chave no cliente passa de eager-por-servidor para lazy-por-canal
`loadAllServerKeys` (eager, todos os Servidores no login) é substituído por carregamento da `channel_key` no momento em que um Canal é aberto (mensagens) ou uma sessão de voz desse Canal é iniciada.

**Porquê**: o número de Canais por conta é tipicamente maior que o número de Servidores; manter eager-para-tudo multiplicaria o burst de handoffs no login proporcionalmente a Canais, não a Servidores. Lazy-por-canal mantém o custo proporcional ao uso real.
**Alternativa considerada**: manter eager, agora por Canal — rejeitada preventivamente; o volume actual (mesas pequenas) provavelmente suportaria, mas lazy é estrategicamente mais seguro e não é mais complexo de implementar (o ponto de "abrir um canal" já existe como gatilho natural).

### D5 — Autenticação de bot: token emitido na instalação, trocado por sessão no mesmo protocolo WS dos clientes humanos
Um bot troca o seu token (enviado no handshake HTTP/WS inicial) por uma sessão equivalente à de um cliente humano autenticado — e a partir daí usa o **mesmo** protocolo WS já existente (mensagens, `key_handoff.*`) em vez de uma API REST de polling à parte.

**Porquê**: o bot comporta-se, do ponto de vista do backend, como qualquer outro membro com ACL — reaproveitar o protocolo evita construir e manter uma segunda superfície de API só para bots. O bot de conversa já precisa de reagir a mensagens em tempo real (não faz sentido fazer polling); o bot de música já precisa de uma sessão LiveKit, que depende de um token de participante emitido por essa mesma sessão autenticada.
**Alternativa considerada**: REST simples de polling para o bot de conversa — rejeitada por adicionar uma segunda superfície e latência desnecessária quando o WS já existe e já é consumido por um cliente de referência (o frontend).

### D6 — Instalação e revogação de bot reaproveitam cascade já existente
Instalar = criar `account`+`bot` + conceder ACL nos canais escolhidos (specs 047/063) + deixar o handoff normal (D3) distribuir a `channel_key`. Revogar = apagar a `account` do bot; os `ON DELETE CASCADE` já existentes em `key_envelope`/`membership`/ACL fazem o resto.

**Porquê**: nenhuma rota nova de "remover acesso a todos os canais" é necessária — é uma consequência do cascade já modelado no schema actual.

### D7 — Política de expiração do token de bot: configurada pelo dono na criação, não fixa no sistema
`bot` ganha uma coluna `token_expires_at` (nullable — `NULL` = sem expiração). O endpoint de instalação (ver D1/tasks 3.1) recebe esse valor como parâmetro escolhido por quem cria o bot, em vez de o sistema impor uma política única (ex. "todo token expira em 30 dias").

**Porquê**: quem instala o bot conhece o contexto de uso (um bot de música para uma sessão pontual vs. um bot de conversa residente há meses) melhor do que uma política global; dar-lhe a escolha evita tanto tokens permanentes por omissão (risco de segurança) como expiração forçada que quebraria um bot de uso contínuo sem aviso.
**Alternativa considerada**: TTL fixo imposto pelo sistema — rejeitada por decisão do dono do produto (preferência explícita por controlo do dono do bot sobre o próprio token).

### D8 — Bot de música de referência implementado em Rust, com o SDK `livekit` (crate oficial), não Python/Node
O processo de referência do bot de música usa o SDK Rust da LiveKit (`docs.rs/livekit`, módulos `e2ee`/`participant`/`track`), que já expõe publicação de faixas a partir de um processo backend e um `KeyProvider` de E2EE por chave partilhada com cifra GCM — o mesmo esquema (AES-GCM, chave simétrica partilhada) já usado por `channel_key` nesta app, sem necessidade de adaptar a um protocolo diferente (ao contrário do caso do Cronista/DAVE no Discord, que teve de replicar MLS).

**Porquê**: o item 14 do backlog já prevê empacotar um client desktop único via **Tauri**, que é Rust. Implementar o bot de música em Rust agora significa que, nesse empacotamento futuro, a mesma lógica pode ser **linkada directamente** no binário do client desktop (mesma linguagem, mesmo runtime, sem subprocesso externo nem runtime adicional a empacotar) — é a opção que minimiza trabalho duplicado e complexidade de empacotamento mais tarde, que foi o critério pedido para esta decisão.
**Alternativas consideradas**: Python (ex. `aiortc`) ou Node (`livekit-server-sdk`) — tecnicamente viáveis hoje e com mais exemplos prontos, mas qualquer uma delas teria de ser **reescrita em Rust** para entrar no binário Tauri mais tarde (ou, em alternativa, o client desktop teria de empacotar e gerir um runtime Python/Node à parte como subprocesso, aumentando o tamanho e a superfície de falha do binário) — ambas as alternativas perdem na análise de simplicidade pedida, que já olha para o destino final (empacotamento desktop), não só para o MVP isolado.

### D9 — Gestão de bots entra na shell de Definições do Servidor já existente, como novo item de sidebar
A UI de bots não introduz um novo padrão de navegação: adiciona-se um item **"Bots"** à sidebar de definições do servidor (spec [056-server-settings-shell](../../../specs/056-server-settings-shell/spec.md) — modo activado pela engrenagem/nome do servidor, sidebar troca para submenus agrupados, página dedicada no main, X na topbar para saída). A página "Bots" lista os bots instalados nesse Servidor (nome, canais com acesso, estado do token — activo/expirado, data de criação) com uma acção "Revogar" por linha. "Criar bot" abre um **diálogo modal** (não uma segunda página) com nome, selecção dos canais (lista de canais do Servidor, multi-select) e a expiração do token (D7) — ao confirmar, mostra o token em claro **uma única vez** com aviso de que não voltará a ser mostrado, seguindo o mesmo padrão já usado para fluxos de criação curtos e lineares nesta app (criar canal, criar servidor).

**Porquê**: reaproveita a shell de definições já construída (mesma autorização por capacidade de papel, mesmo padrão de entrada/saída) em vez de inventar uma superfície de navegação nova só para bots; o uso de modal para a criação (em vez de página) segue o precedente de outros fluxos de criação curtos já existentes (criar canal/servidor), reservando página dedicada para a vista de **gestão contínua** (listar/revogar), que é o padrão que a spec 056 já define para esse tipo de conteúdo.
**Autorização**: nova capacidade de papel **"Gerenciar bots"**, adicionada ao catálogo "Geral" já existente (specs 047/063, junto de "Gerenciar canal", "Gerenciar papéis/cargos"); dono do Servidor mantém bypass total, consistente com as demais capacidades desse catálogo.
**Alternativa considerada**: tratar "instalar bot" como uma acção dentro da própria página de permissões de canal (ACL) — rejeitada porque um bot é uma entidade com ciclo de vida própria (token, expiração, múltiplos canais), não uma simples entrada de ACL; merece a sua própria página de gestão, só reaproveitando a ACL por baixo (D3) para a elegibilidade de chave.

## Risks / Trade-offs

- **[Risco] Token de bot comprometido expõe decifragem dos canais onde está instalado** → Mitigação: escopo por instalação (D3) já limita o raio de explosão a esses canais, não ao Servidor inteiro (o próprio objectivo desta mudança); o dono do bot pode ainda limitar a janela de exposição definindo uma expiração na criação (D7) — não há, porém, rotação automática nesta versão, só expiração.
- **[Risco] Confundir a tabela `channel_key` (custódia de gravação, já existente) com o novo `key_envelope` por canal** → Mitigação: nomeada explicitamente neste documento e no `proposal.md`; `tasks.md` deve incluir um passo explícito de não tocar em `channel_key`/`e2ee_audit_log`.
- **[Risco] Carregamento lazy (D4) introduz um estado de espera visível ("sincronizando chave do canal") que não existia por canal antes** → Mitigação: o padrão já existe hoje por Servidor (`Membership.key_handoff_status = pending`); replica-se o mesmo padrão de UI, só escopado a canal.
- **[Trade-off] Sem forward secrecy**: remover um membro ou bot de um canal não invalida retroactivamente uma `channel_key` já sincronizada localmente por quem saiu → aceite como limitação conhecida (ver Non-Goals); documentar explicitamente na UI de remoção para não sugerir uma garantia que não existe.

## Interacção com `password-recovery`

O change `password-recovery` (aplicado antes deste, recomendado em `proposal.md`) introduziu, hoje escopados por Servidor, três mecanismos que este change precisa de adaptar em vez de duplicar:

- `apply_identity_replacement(tx, account_id, pubkey, vault)` (`backend/src/api/mod.rs`): único ponto que substitui identidade, partilhado por `PUT /auth/identity` e pelo reset do operador. Hoje itera `membership` por Servidor (apaga `key_envelope` da conta, marca `key_handoff_status = pending`, calcula os `synced` a notificar). Tem de passar a iterar por Canal elegível (via ACL, D3) quando a PK de `key_envelope` mudar para `(channel_id, account_id)` — não é só trocar o identificador: a elegibilidade deixa de ser "todo membro do Servidor" e passa a depender da ACL por canal, inclusive privados.
- Guarda transaccional de `post_envelope` (`backend/src/api/key_envelopes.rs`): verifica o envelope próprio existente, aceita repetição idempotente, recusa sobrescrita (409) e só depois verifica outros membros no mesmo escopo. A mesma lógica de "primeiro escritor vence" vale por Canal; só a consulta de escopo muda de `server_id` para `channel_id`.
- `GET .../key-envelopes/exists` (indicador de existência sem expor a chave, consumido por `ensureServerKey`/`ensureChannelKey` no cliente): a mesma rota, reescopada por Canal.
- Escala (5.x de `password-recovery`, incluindo `idx_key_envelope_account` e o fan-out de `key_handoff.requested`): os números medidos lá assumem Servidor; depois desta migração, a mesma conta tem potencialmente N× mais linhas/eventos (um por Canal em vez de um por Servidor) — vale medir de novo com o volume real de canais por Servidor antes de assumir que os critérios da spec `crypto/key-envelope-integrity` continuam a cumprir.

Nenhum destes três mecanismos deve ser reescrito do zero; as tarefas 2.1–2.4 (§ acima) devem explicitamente reaproveitar/adaptar o código já existente dessas três peças.

## Migration Plan

Dado o contexto de "sem dados de produção a preservar" (ver `proposal.md`):

1. Aplicar a migração de schema (nova forma de `key_envelope`, tabela `bot`, `password_hash` nullable) directamente, sem período de dupla-leitura.
2. Para cada Canal existente no ambiente de teste: gerar uma `channel_key` nova e resselar aos membros correntemente elegíveis (via ACL), tudo numa só passagem administrativa — não há "big bang" a evitar porque não há carga de produção concorrente.
3. Dados cifrados sob a `server_key` antiga (mensagens, custódia de voz anteriores) ficam ilegíveis após a migração — aceite explicitamente (ver spec `crypto/channel-keys`, requisito "Migração sem caminho retroativo").
4. Sem plano de rollback para o conteúdo antigo — rollback possível só revertendo a migração de schema antes de gerar as novas chaves (janela estreita, ambiente de teste).
