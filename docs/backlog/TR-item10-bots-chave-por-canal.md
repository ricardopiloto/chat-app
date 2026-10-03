# Termo de Referência — Camada de integração de bots + chave por canal (item 10)

**Data:** 2026-10-03
**Autor:** análise assistida (Claude Code), a pedido de Ricardo Sobral
**Tipo:** documento de análise/escopo — **não contém desenvolvimento**; alimenta a proposta OpenSpec desta demanda (`/opsx:propose`).
**Decisão de contexto que habilita este TR:** a aplicação está hoje em testes localizados com um grupo pequeno de pessoas, **não em uso real de produção** — não há dados de utilizador a preservar. Isto remove a restrição de "sem migração big-bang" que a recomendação anterior do item 10 (`docs/backlog/backlog.md`) assumia por cautela de produção; este TR reavalia o desenho assumindo que apagar e recomeçar os dados de teste é aceitável, e por isso recomenda ir direto ao modelo geral (chave por canal para **todos** os canais) em vez da promoção lazy por canal proposta antes.
**Fontes analisadas:** `docs/backlog/backlog.md` (item 10 e análises anteriores), `specs/002-fase-1-mvp/{data-model,contracts/key-handoff}.md`, `specs/006-prototype-ui-parity/contracts/voice-e2ee-egress.md`, `specs/047-server-channel-permissions/spec.md`, `specs/063-channel-acl-edit-parity/spec.md`, `docs/e2ee-gaps.md`, `backend/migrations/{0001_init,0006_channel_e2ee_key_delete}.sql`, `backend/src/{db,domain}/{key_envelope,channel_key,channel_acl,membership}.rs`, `frontend/src/crypto/{serverKey,keyHandoff,identity}.ts`, `frontend/src/voice/callSession.tsx`, e os projectos externos do autor `discord-bot/` ("Bertroldo") e `discord-transcription/` ("Cronista").

---

## 1. Objeto

Definir o escopo técnico necessário para (a) migrar o modelo de criptografia de "uma chave simétrica por Servidor" para "uma chave simétrica por Canal", e (b) introduzir, apoiada nessa chave, uma camada de integração de bots de terceiros — com prioridade nos dois casos já decididos (bot de música/ingress de áudio e bot de conversa/comandos de texto), deixando o bot de transcrição fora desta primeira versão.

Este documento não decide a forma final da API de bots — decide **o que precisa de mudar na base de dados, no backend e no cliente antes de qualquer bot poder existir com segurança**, para alimentar uma proposta OpenSpec concreta.

---

## 2. Contexto

O item 10 do backlog (`Sistema de plugins / API pública`) nasceu como uma linha sem código nem contrato. Uma série de análises anteriores (registadas no próprio `backlog.md`) estabeleceu:

1. **Casos de uso concretos**, com precedente real no Discord: bot de música (equivalente ao Kenku), bot de conversa com RAG (o bot "Bertroldo" do autor) e bot de transcrição (o bot "Cronista" do autor) — os dois primeiros priorizados para a versão inicial, o terceiro diferido.
2. **O modelo de permissões de bots do Discord tem quatro camadas independentes** (concessão na instalação, papel+overwrite por canal, intents de gateway, permissões por comando) — o item 10 deveria replicar essa separação.
3. **Um descompasso de segurança pré-existente**: desde a spec [047](../../specs/047-server-channel-permissions/spec.md) há canais privados com ACL, mas essa ACL é só autorização de aplicação — criptograficamente, qualquer membro do Servidor já tem a chave que decifraria qualquer canal, privado ou não.
4. **Confirmação por investigação do projecto `discord-transcription/` do próprio autor**: um bot que recebe áudio sob o E2EE nativo do Discord (DAVE/MLS) só consegue isso por participar do protocolo como cliente legítimo — não há bypass. Isso validou que a via correcta é "o bot é um detentor real de chave", não um listener passivo.
5. **Decisão explícita do autor nesta sessão**: bot de transcrição não é prioridade da versão inicial; música e conversa são. Em paralelo, como a app está só em testes localizados, **não há impeditivo para apagar tudo e recomeçar** — o que muda a recomendação de "migração lazy por canal ao instalar um bot" para "migrar já todos os canais para chave própria".

---

## 3. Objetivos

### 3.1 Geral

Avaliar o que é necessário mudar no modelo de dados, no backend e no cliente para que (a) cada Canal tenha a sua própria chave simétrica, substituindo a `server_key` única, e (b) um bot possa ser instalado com acesso escopado exactamente aos canais para que foi autorizado, cobrindo primeiro os casos de música e conversa.

### 3.2 Específicos

1. Diagnosticar com precisão o estado actual da criptografia (`server_key`/`KeyEnvelope`) e não confundi-lo com o mecanismo de custódia já existente (`channel_key` de recuperação pós-gravação, migração 0006) — são coisas diferentes com o mesmo tipo de nome.
2. Especificar a mudança de schema e de API para chave por canal, reaproveitando o mecanismo de handoff já construído (`crypto_box_seal`, eventos WS `key_handoff.*`) em vez de inventar um novo.
3. Especificar o que é um "bot" no modelo de contas (schema, autenticação, ciclo de vida) e como ele recebe e usa a chave de um canal.
4. Mapear a camada de permissão do bot sobre a ACL de canal humana já existente (047/063), em vez de duplicar um segundo sistema de permissões.
5. Dimensionar o MVP técnico mínimo que destrava **só** música e conversa, deixando explícito o que fica fora.
6. Levantar riscos e decisões pendentes do dono do produto antes de abrir a proposta OpenSpec.

---

## 4. Escopo

### 4.1 Dentro do escopo desta demanda

- Migração do modelo de chave de Servidor para chave de Canal (schema + backend + cliente), para **todos** os canais (não só os que recebem bot — dado o contexto de reset).
- Conceito de "conta de bot" (schema, autenticação própria, ciclo de vida de instalação/revogação).
- Handoff de chave de canal para um bot instalado, reaproveitando o mecanismo de `KeyEnvelope`.
- Bot de música: entrada num canal de voz como participante LiveKit real, publicação de faixa de áudio cifrada com a chave do canal.
- Bot de conversa: leitura/escrita de mensagens de um canal de texto autenticada por token de bot, decifrando/cifrando com a chave desse canal.
- Mapeamento da ACL de canal humana (047/063) para também governar o que um bot pode fazer no canal em que está instalado.

### 4.2 Fora do escopo desta demanda

- Bot de transcrição/egress por participante (diferido; depende ainda do item 1 — Gravação/Egress).
- Permissões por comando (camada 4 da referência Discord) — não há slash-commands nesta versão.
- "Intents" como um sistema geral e configurável — nesta versão, o escopo de dados que um bot recebe é implícito ao tipo de bot (voz vs texto), não uma matriz configurável.
- Directório público de bots/marketplace, federação, importador de estrutura do Discord (itens 5, 9, 11 do backlog — inalterados).
- Resolver revogação com forward secrecy completa (rotação de chave ao remover um membro/bot) — fica registado como limitação conhecida, não como bloqueio desta demanda.

---

## 5. Situação actual (diagnóstico)

### 5.1 Criptografia hoje: uma chave por Servidor

- `server` tem uma `server_key` (AES-256-GCM) implícita — não há coluna própria; a chave só existe cifrada em `key_envelope`.
- `key_envelope` tem PK `(server_id, account_id)` ([0001_init.sql](../../backend/migrations/0001_init.sql)) — um envelope por par servidor×conta, cifrado com `crypto_box_seal` para a `identity_pubkey` de cada conta.
- `message.content_ciphertext` e a frame key de voz/vídeo do LiveKit usam a **mesma** `server_key` ([data-model.md](../../specs/002-fase-1-mvp/data-model.md)).
- Handoff: `POST /api/servers/{id}/key-envelopes`, eventos WS `key_handoff.requested`/`key_handoff.completed` ([key-handoff.md](../../specs/002-fase-1-mvp/contracts/key-handoff.md); backend em [db/key_envelope.rs](../../backend/src/db/key_envelope.rs)).
- Cliente: `Map<serverId, key>` em memória ([serverKey.ts](../../frontend/src/crypto/serverKey.ts)); carregado a **eager para todos os servidores** da conta no login ([keyHandoff.ts](../../frontend/src/crypto/keyHandoff.ts)); a voz já busca a chave "pelo canal" mas resolve por `channel.server_id` ([callSession.tsx](../../frontend/src/voice/callSession.tsx)) — ponto de uso já é por-canal, só a origem é por-servidor.

### 5.2 Mecanismo relacionado mas distinto — não confundir

Já existe uma tabela `channel_key` ([0006_channel_e2ee_key_delete.sql](../../backend/migrations/0006_channel_e2ee_key_delete.sql)), com PK **`channel_id` único** (não por conta) — guarda `custodian_account_id` + `sealed_blob`. Isto **não é** uma chave própria do canal: é a custódia, por **um** membro designado, de uma cópia selada da `server_key` existente, usada para religar E2EE depois de uma gravação ([voice-e2ee-egress.md](../../specs/006-prototype-ui-parity/contracts/voice-e2ee-egress.md)). A chave de canal que este TR propõe é um conceito novo e não deve reaproveitar esta tabela — precisa do seu próprio `KeyEnvelope` por `(channel_id, account_id)`, não um custodiante único.

### 5.3 ACL de canal hoje: só autorização de aplicação

Desde a spec [047](../../specs/047-server-channel-permissions/spec.md)/[063](../../specs/063-channel-acl-edit-parity/spec.md) existem canais públicos/privados com overwrites allow/deny por papel/membro (`db/channel_acl.rs`, `domain/channel_acl.rs`). Isto filtra **consultas** no backend — não implica nenhuma chave própria. Qualquer membro do Servidor com a `server_key` poderia, em tese, decifrar o conteúdo de um canal privado se tivesse acesso aos bytes.

### 5.4 Não existe nenhum conceito de "bot" ou "aplicação externa"

`account` tem só `handle`, `password_hash`, `identity_pubkey`, `is_initial_operator`, `identity_vault` ([0001_init.sql](../../backend/migrations/0001_init.sql)). Não há campo de tipo/papel de conta, nem tabela de aplicação/token de API, nem noção de "conta que não faz login com password".

### 5.5 Precedente externo validado

`discord-transcription/` (Cronista) confirma que um bot sob E2EE real (DAVE/MLS do Discord) só funciona por participar do protocolo como cliente — e que essa via é frágil quando depende de bibliotecas de terceiros a replicar um protocolo complexo (dependência de PR não-mergeada). O esquema desta app (AES-GCM simétrico estático, sem ratchet) é mais simples de replicar para um bot do que o MLS do Discord.

---

## 6. Desenho proposto

### 6.1 Chave por canal, para todos os canais (não lazy)

- `key_envelope` passa a ter PK `(channel_id, account_id)`; `server_id` deixa de ser a chave de particionamento da cripto (continua a existir como FK de `channel`, só não governa mais a chave).
- Rotas passam de `/api/servers/{id}/key-envelopes` para `/api/channels/{id}/key-envelopes`; eventos WS `key_handoff.*` passam a carregar `channel_id` em vez de `server_id`.
- `message.content_ciphertext` passa a ser cifrado com a `channel_key` do seu próprio canal; a frame key de voz/vídeo do LiveKit idem (ganho directo: `channel.server_id` → `channel.id` em [callSession.tsx](../../frontend/src/voice/callSession.tsx), já quase pronto).
- Dado o reset de dados: a migração **não precisa ser incremental** — gera-se uma `channel_key` por canal e resela-se a todos os membros com acesso (via ACL 047/063) no momento da migração, sem período de transição com duas chaves.
- Quem deve receber o envelope de um canal é determinado pela **ACL já existente** (047/063), não por uma tabela nova de "membership de canal" — reaproveita o que já há.

### 6.2 Conta de bot

- Nova distinção de tipo de conta (`account.kind`: `human` | `bot`, ou tabela `bot` separada referenciando `account.id` + `owner_account_id` + `token_hash`). A decidir na proposta: campo simples vs. entidade própria — ver §9.
- Autenticação por token próprio (não password/vault) — um bot não tem `identity_vault` nem faz unlock por password; tem a sua própria `identity_pubkey` para participar do handoff de chave como qualquer membro.
- Instalação = criar a conta de bot + conceder-lhe ACL nos canais escolhidos (reaproveita 047/063) + accionar handoff da `channel_key` desses canais para a `identity_pubkey` do bot.
- Revogação = remover a conta de bot (cascade already existente via `ON DELETE CASCADE` em `key_envelope`/`membership`) — atómico, sem precisar editar canal a canal.

### 6.3 Bot de música (ingress)

Processo externo que autentica com token de bot, obtém a `channel_key` do canal de voz via o mesmo handoff, e entra na sala LiveKit desse canal como participante real (SDK de servidor/Agents), publicando uma faixa de áudio cifrada com essa chave — meramente para satisfazer o esquema simétrico do LiveKit, não porque precise de decifrar o resto.

### 6.4 Bot de conversa (texto + conhecimento)

Processo externo autenticado por token de bot, com a `channel_key` do canal de texto onde foi instalado; lê mensagens novas (via WS ou polling REST — a decidir na proposta), decifra, gera resposta (LLM externa, como o Bertroldo já faz hoje no Discord) e publica de volta cifrada com a mesma chave.

---

## 7. Impacto

### 7.1 Backend

- Migração de schema: `key_envelope` muda de FK (schema breaking, aceitável dado o reset); rotas `key-envelopes` migram de `/servers/{id}` para `/channels/{id}`; novo conceito de conta de bot (coluna ou tabela nova); novas rotas de instalação/revogação de bot.
- `channel_key` (tabela de custódia, 0006) fica inalterada — não se sobrepõe ao novo `key_envelope` por canal.

### 7.2 Frontend

- `serverKey.ts`/`keyHandoff.ts` generalizam-se para "chave por canal"; `loadAllServerKeys` (eager, por servidor) precisa de nova estratégia de carregamento (lazy por canal visitado, ou eager por canal se o volume continuar baixo — a validar).
- `callSession.tsx`: troca pontual de `channel.server_id` por `channel.id`.

### 7.3 Dados existentes

Liberado para "apagar e recomeçar" — não há plano de migração em produção a desenhar. Decisão pendente: quando/onde esse reset acontece (ambiente de teste actual vs. um corte formal antes de abrir a proposta).

### 7.4 Explicitamente fora

Transcrição/egress (depende do item 1), permissões por comando, intents configuráveis, marketplace/directório de bots.

---

## 8. Riscos

| Risco | Impacto | Nota |
|---|---|---|
| Token de bot mal gerido (sem rotação, sem escopo de expiração) | Alto | É a credencial que carrega acesso de decifragem a canais — precisa de desenho de segurança próprio, não só "um token". |
| Confundir o `channel_key` de custódia (0006) com a nova chave de canal | Médio | Nomes parecidos, propósitos diferentes — risco de colisão de schema/nome se não for tratado com cuidado na implementação. |
| Carregamento eager de chaves deixar de escalar ao passar de "por servidor" para "por canal" | Médio | Depende do volume real de canais por servidor nestas mesas — validar antes de assumir que eager continua viável. |
| Revogação sem forward secrecy (chave retida localmente por quem foi removido) | Médio | Conhecido e aceito como limitação nesta versão — não é um "bug" novo introduzido por este desenho, é pré-existente. |
| Âmbito crescer para replicar todas as camadas do Discord de uma vez | Médio | Este TR delimita o MVP a música+conversa; qualquer adição (comandos, intents) deve passar por decisão explícita, não arrastar-se para dentro. |

---

## 9. Perguntas em aberto (decisões antes da proposta OpenSpec)

1. Conta de bot: campo `account.kind` simples ou tabela `bot` própria com `owner_account_id`? Afecta o schema e quem "é dono" do bot para efeitos de UI de gestão.
2. Onde corre o bot de referência de cada tipo — processo do próprio operador da instância (confiável por definição) ou algo instalável por qualquer membro do servidor (exige mais rigor de token/escopo desde o dia 1)?
3. Carregamento de chave no cliente: manter eager (agora por canal) ou passar a lazy-por-canal-aberto? Depende do volume real esperado de canais.
4. Superfície mínima de API para o bot de conversa: WS (como os clientes humanos) ou um REST simples de polling? Afecta a complexidade de implementar o lado do bot.
5. Confirma-se formalmente que os dados de teste actuais podem ser apagados antes de iniciar a implementação, ou isso só acontece num ambiente novo?
6. O `account.identity_vault`/password continua a não aplicar-se a contas de bot (confirmado neste TR), certo — ou algum bot precisa de "login humano" ocasional (ex. para reconfiguração via UI)?
