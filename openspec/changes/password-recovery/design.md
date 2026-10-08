# Design

## Context

Motivação e escopo em `proposal.md`; requisitos em `specs/`. Estado actual que condiciona o desenho (verificado no código, detalhe em `docs/backlog/TR-item18-recuperacao-de-senha.md`):

- A password de login e a do cofre são a mesma string. `account.identity_vault` guarda a `secretKey` X25519 embrulhada por AES-GCM com chave Argon2id(password); é devolvido por `GET /auth/me` a qualquer sessão válida.
- `PUT /auth/identity` já substitui identidade (apaga envelopes da conta, marca participações `pending`, emite `key_handoff.requested` aos `synced`), mas só com sessão. Nenhuma rota altera `password_hash`.
- `account` não tem e-mail nem contacto; não há SMTP. Não há papel de operador na API: `is_initial_operator` só é lido na criação.
- `session` tem `revoke(id)` e nada que revogue por conta. `WsHub` mantém `account_id → remetentes` em memória.
- `RateLimiter` é um mapa em memória por chave; `allow_auth` usa só o IP TCP e ignora `X-Forwarded-For`, logo atrás de proxy reverso o balde é global.
- `key_envelope` tem PK `(server_id, account_id)` e **nenhum índice em `account_id`**. `POST .../key-envelopes` permite a qualquer membro gravar o próprio envelope sem verificar se o Servidor já tem chave.
- O change `bots-channel-key-integration` (0/30 tarefas) reescreve `key_envelope` para `(channel_id, account_id)` e o handoff por canal.

## Goals / Non-Goals

**Goals:**
- Um único caminho de conclusão de reset (sessões, rate limit, resposta uniforme) partilhado pelas opções A e B.
- Recuperação sem perda (B) que não toca em `key_envelope`.
- Medir antes de optimizar: critérios numéricos para 300+ membros e mitigação condicional.
- Isolar substituição de identidade, guarda de envelope, indicador de existência, handoff e cache por escopo, com variantes explícitas por Servidor e por canal.

**Non-Goals:**
- Tela de admin (item 19), e-mail/SMS, Passkeys, MLS, lista de dispositivos.
- Forward secrecy ou rotação de chave de Servidor.
- Migrar a custódia da chave de canal de voz (`channel_key`, 0006) para a nova identidade (só aviso; ver Open Questions).

## Decisions

### D1. O reset do operador é um código de uso único, emitido por CLI no host
Subcomando `reset-code <handle> [--ttl-minutes N]` em `main.rs`, lido de `std::env::args` (o binário não tem parser de argumentos e um subcomando não justifica uma dependência). Liga-se ao `DATABASE_URL` da `Config`, corre as migrações pendentes como o arranque normal, grava e imprime o código.

- Código: 16 bytes aleatórios, apresentados em Crockford base32 (26 caracteres) agrupados de 4 para ditado/cópia. 128 bits tornam o hash rápido (SHA-256) suficiente; não precisa de Argon2.
- Tabela `password_reset (id, account_id UNIQUE, code_hash, expires_at, attempts, used_at, created_at)`. `UNIQUE(account_id)` + `INSERT OR REPLACE` implementa "novo código invalida o anterior".
- Falhas: `attempts` incrementa em cada código errado para a conta; ≥5 invalida (apaga a linha).
- *Alternativa rejeitada:* endpoint HTTP de operador. Exigiria definir "admin de instância" (item 19). O operador já tem shell no host (é quem corre o binário).

### D2. Rotas novas, separadas por mecanismo, e um único passo de conclusão
- `POST /api/auth/recovery/code/redeem` — opção A, uma chamada.
- `POST /api/auth/recovery/key/challenge`, `/key/start` e `/key/redeem` — opção B, desafio e ticket curtos e de uso único; nenhuma prova estática é reenviada.
- `PUT /api/auth/recovery-key` e `PUT /api/auth/password` — autenticadas, exigem a senha actual (verificada com o mesmo Argon2 do login).

Os três caminhos que concluem a troca de credenciais (A, B e alteração de senha) passam por `finish_credential_change` numa transacção de escrita (`BEGIN IMMEDIATE`). Helpers de BD aceitam a mesma transacção: gravam `password_hash` e cofre, aplicam opcionalmente identidade nova, limpam a recuperação antiga, apagam envelopes, actualizam handoff, consomem código ou ticket, revogam sessões e criam sessão nova quando cabível. `apply_identity_replacement` também serve `PUT /auth/identity` e devolve eventos sem os emitir. Só após commit o serviço fecha sockets revogados e emite handoff; rollback não altera estado nem emite eventos.

*Alternativa rejeitada:* reaproveitar `/auth/login` com um campo extra. Mistura autenticação normal com recuperação e partilha o balde de rate limit.

### D3. Derivação do código de recuperação (opção B)
`code` = 16 bytes aleatórios, mostrado em base32. Derivação no cliente, em `crypto/vault.ts`, função pura:

1. `salt = BLAKE2b-16("mesa-recovery-v1" ‖ lower(handle))`. Determinístico e público; o código tem 128 bits.
2. `master = Argon2id(code, salt)` com os parâmetros já contratados (p=1, t=3, m=32 MiB).
3. `wrapKey = BLAKE2b-32(master, personal="wrap")` e `signSeed = BLAKE2b-32(master, personal="sign")`: separação de domínio. A chave de assinatura Ed25519 deriva de `signSeed`; só a chave pública verificadora vai ao servidor.
4. `recovery_vault = AES-GCM(wrapKey, iv aleatório, secretKey)` com o mesmo envelope JSON do cofre (`v, publicKey, iv, wrapped`; sem `salt` próprio).
5. O servidor guarda `recovery_verifier_pubkey` e `recovery_generation`. `key/challenge` devolve nonce aleatório sem revelar a existência da conta. `key/start` verifica assinatura sobre a codificação canónica e versionada de `(handle, "start", challenge_id, nonce)`, consome o desafio e devolve cofre e ticket vinculado à conta/geração. `key/redeem` verifica assinatura sobre `(handle, "redeem", ticket, SHA-256(password_nova || cofre_novo))`, usando enquadramento canónico dos campos, e consome o ticket na mesma transacção do reset. Desafio/ticket têm TTL curto e no máximo um uso, inclusive sob concorrência. Não aparecem em logs.

Valores exactos (strings de `personal`, codificação e ordem dos campos, TTLs) ficam em `docs/v2/contracts/crypto-formats.md` com vectores e testes de interoperabilidade.

*Alternativa rejeitada:* frase BIP-39 de 12 palavras (mockup especulativo). Só traz valor se houver verificação por palavras e exportação; 128 bits em base32 dão a mesma entropia com menos código e sem lista de palavras.

### D4. `/auth/me` só expõe `has_recovery_key`
O `recovery_vault` só sai em `key/start` depois de assinatura válida de desafio não reutilizável. Razão: `/auth/me` já devolve `identity_vault` a qualquer sessão; um segundo blob equivalente aumentaria o dano de um roubo de cookie sem necessidade.

### D5. Revogação de sessões e fecho de sockets
`db::session::revoke_all_for_account(account_id, except: Option<Uuid>)`. `PUT /auth/password` preserva a sessão actual; resets revogam todas e criam outra na transacção. O hub associa cada WebSocket à `session_id` e mantém sinal de cancelamento que interrompe também o loop de recepção. Reset fecha todos os sockets antigos; troca de senha fecha apenas os das sessões revogadas. Autenticação do handshake e inscrição no hub revalidam a sessão para cobrir a corrida com a revogação. Como o WebSocket nativo do browser não expõe o HTTP 401 do handshake, após fecho inesperado (inclusive `onclose` 1006) o cliente consulta `/api/auth/me` antes de reconectar; se a sessão for recusada, pára e limpa o estado autenticado. Um close code autenticado do socket já aberto pode acelerar o caminho, mas não substitui a verificação após falha de handshake.

### D6. Rate limit por conta
Novas chaves no `RateLimiter` existente: `recover:{handle_lower}` (5 falhas/hora) para `key/*`, e a contagem `attempts` da tabela para o código do operador. Aplicam-se **antes** de consultar a conta, inclusive a handles inexistentes. O handle é normalizado e limitado em comprimento; o mapa expurga entradas expiradas e tem cota total com rejeição segura. O limite por IP existente mantém-se; sucesso não consome quota de falhas.

Trade-off: qualquer pessoa pode gastar as 5 tentativas de um handle e atrasar a vítima (negação de serviço dirigida). Aceite: é uma janela de uma hora, o operador emite código novo imediatamente, e a alternativa (sem limite por conta) permite força bruta distribuída.

### D7. Correcção da bifurcação da chave: dois níveis, o do servidor é o que garante
- **Servidor:** `post_envelope` verifica, grava envelope e actualiza handoff numa única transacção de escrita. Primeiro compara o próprio envelope existente: repetição dos mesmos bytes é idempotente e aceite mesmo que outro membro já tenha envelope; sobrescrita diferente recebe 409. Só quando o próprio envelope não existe verifica outros membros e responde 409 se algum já tem envelope. A criação inicial segue primeiro escritor vencedor, inclusive entre dois dispositivos do mesmo dono. Handoff para pendente conserva autorização própria e não sobrescreve envelope sincronizado.
- **Cliente:** `ensureServerKey` consulta indicador autoritativo, calculado pelo backend, de existência de envelope no escopo; `key_handoff_status` não prova que haja envelope. Se há chave, espera handoff. Um 409 prevalece sobre a observação anterior: recarrega o próprio envelope ou espera, sem publicar nem distribuir a chave local derrotada.

Porquê duas camadas: o cliente evita o pedido inútil e mostra o estado certo; a transacção do servidor garante a invariante contra clientes antigos e corridas, inclusive entre dispositivos do mesmo dono.

Fica por tratar o caso "todos os envelopes foram apagados" (todos os detentores resetaram): aí a regra deixa regenerar, e o histórico estava de facto perdido.

### D8. Escala: medir primeiro, limitar o fan-out só se falhar
Pontos de custo identificados (cada um com tarefa de medição, critérios na spec `crypto/key-envelope-integrity`):

1. **`DELETE FROM key_envelope WHERE account_id = ?`** não tem índice: varrimento da tabela inteira. A nova migração acrescenta `idx_key_envelope_account`. Com o change dos bots (envelope por canal) a tabela cresce por um factor igual ao nº de canais; este índice passa de optimização a requisito.
2. **Fan-out de `key_handoff.requested`:** `put_identity` e o novo reset emitem o evento a **todos** os `synced` de **cada** Servidor da conta, em série. Com 300 sincronizados são 300 envios por Servidor; com o change dos bots, por canal.
3. **Manada de respostas:** cada cliente sincronizado online responde ao pedido (`handleHandoffEvent`); a primeira grava, as outras recebem 403 (`cannot overwrite a synced`) depois de 4 consultas cada (`require_member`, `find` do alvo, `find` do servidor, `find` do chamador). Até 299 `POST`s redundantes por pedido e por Servidor.
4. **`replay_pending_handoffs`** corre quando um membro sincronizado se liga e percorre todos os Servidores e todos os pendentes, com uma consulta de conta por pendente (N+1).
5. **Guarda nova de D7:** uma consulta por índice; mede-se só para confirmar.

Mitigação condicional (activada só se a medição falhar um critério): `key_handoff.requested` passa a ir a **no máximo K=5 destinatários**, escolhidos entre os sincronizados online (`WsHub::is_online`), dono primeiro; os restantes membros são cobertos por `replay_pending_handoffs` quando se ligam. Isto não altera o contrato (os clientes reagem do mesmo modo ao evento) e reduz a manada de ~N para ~K. O N+1 de `replay` resolve-se com um único `SELECT` das chaves públicas dos pendentes.

*Alternativa rejeitada:* limitar já. Muda comportamento de uma rota existente sem prova de necessidade; em grupos pequenos o fan-out total responde mais depressa porque há sempre alguém online.

### D9. Interacção com o change dos bots
- Opção B: independente (não toca em `key_envelope`).
- Fase 1: `apply_identity_replacement(tx, ...)` é único para reset A e `PUT /auth/identity`; antes da migração itera Servidores, depois canais elegíveis segundo ACL, com envelopes `(channel_id, account_id)` e eventos/handoff por canal. Contas de bot não entram em rotas de recuperação humana.
- D7: guarda, indicador de existência, cache, elegibilidade, replay e fan-out passam a operar por canal, inclusive privados e múltiplos canais no mesmo Servidor. A adaptação exige testes próprios; não é mera troca de identificador.
- Ordem sugerida: este change antes do dos bots (menor, 0 migração de dados e já resolve um defeito real). Se o dos bots for primeiro, as tarefas 1.5 e 4.1 passam a ser por canal e a medição de escala de 5.x tem de usar "300 membros × N canais".

### D10. Copy do ecrã de login
O link do mockup "Esqueceu o cofre?" passa a "Esqueci a senha" e abre `/recover`. O texto de ajuda antigo (`auth.forgotVaultHelp`) migra para o ecrã de desbloqueio, onde faz sentido. É o único desvio ao mockup e fica registado na spec (`frontend-v2/auth`). *Alternativa:* manter o link e acrescentar outro; rejeitada por duplicar acções de significado quase igual no mesmo ecrã.

### D11. Confirmar a guarda do código antes de activar a recuperação
O registo directo e o convite recolhem a escolha "criar agora"/"fazer depois" antes do POST. Em "criar agora", geram e mostram o código e exigem "guardei" **antes** de enviar cofre/verificador no pedido de registo. Assim, se a conta for criada e a resposta se perder, não fica activada uma recuperação cujo código nunca foi apresentado. O código só fica em memória e uma recarga antes da confirmação abandona a tentativa. Em "fazer depois", omitem os campos de recuperação. Falha do POST não persiste um segredo no navegador; o utilizador pode repetir a criação com novo código.

## Risks / Trade-offs

- [Tomada de conta pelo próprio reset] → código de 128 bits com hash, uso único, TTL curto, invalidação por tentativas, resposta uniforme, limite por conta, revogação de todas as sessões.
- [Atacante com acesso à BD ataca o `recovery_vault`] → protegido por 128 bits + Argon2id, não por senha humana; o código não é escolhido pelo utilizador.
- [Utilizador não guarda o código] → interstício com confirmação e a opção A como saída; contas existentes continuam a depender de A até criarem a chave.
- [DoS dirigido ao reset de um handle] → ver D6; aceite.
- [Guarda do envelope próprio (409) quebra um fluxo legítimo] → só a primeira criação ou repetição idêntica é aceite; testes cobrem criação, convite, repetição interrompida e dois dispositivos concorrentes.
- [`integration::server_isolation` já falha antes deste change (404 em vez de 403)] → não relacionado; registar o estado de base antes de começar para distinguir regressões.
- [Medição de escala com dados sintéticos não reproduz rede real] → o critério é de latência de backend e contagem de eventos, não de rede; documentar o ambiente.
- [Conflito de merge com o change dos bots] → D9: duas variantes explícitas de contrato, reconciliação de migração e testes por canal.
- [Coordenação com `bots-channel-key-integration` é unilateral — só esta change referencia a outra] → espelhar esta dependência (D9) no `design.md`/`proposal.md` de `bots-channel-key-integration` antes de aplicar qualquer uma das duas changes.

## Migration Plan

1. Migração aditiva com número reservado após conferir as migrações presentes no momento da implementação (`0023` apenas se livre): `recovery_vault`, `recovery_verifier_pubkey`, `recovery_generation`, `recovery_set_at` em `account`; tabela `password_reset`, desafios/tickets de recuperação e índice `key_envelope(account_id)`. Aplica-se sobre dados existentes sem acção.
2. Backend primeiro (rotas novas não são chamadas por clientes antigos), depois frontend.
3. Fase 1 e Fase 2 podem ser entregues separadamente; o registo só começa a gerar chave de recuperação com a Fase 2.
4. Rollback isolado: o cliente antigo ignora campos e rotas novos; as colunas ficam sem uso. O 409 do envelope próprio exige testes de compatibilidade com clientes anteriores. Se a migração `bots-channel-key-integration` também tiver sido aplicada, o rollback de dados/chaves depende do plano daquela mudança e não é prometido aqui.
5. Registar a alteração em `docs/v2/contracts/backend-change-policy.md` (tarefa 8.1).

## Open Questions

- Custódia da chave de canal de voz (`channel_key`, 0006) depois de nova identidade: este change só avisa na UI. Migrá-la automaticamente (quando o custodiante reentra com a chave em `localStorage`) pode ser um change próprio.
- Formato exacto de apresentação do código (agrupamento, maiúsculas, ficheiro `.txt` ao descarregar): decide-se na implementação sem mudar spec nem tarefas.
