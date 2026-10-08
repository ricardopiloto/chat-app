# Termo de Referência — Recuperação de senha esquecida (item 18)

**Data:** 2026-10-04
**Autor:** análise assistida (Claude Code), a pedido de Ricardo Sobral
**Tipo:** documento de análise/escopo — **não contém desenvolvimento**; alimenta a proposta OpenSpec desta demanda (`/opsx:propose`).
**Fontes analisadas:** `docs/backlog/backlog.md` (itens 10, 17, 18), `docs/backlog/TR-item10-bots-chave-por-canal.md`, `openspec/changes/bots-channel-key-integration/`, `docs/v2/contracts/{crypto-formats,backend-change-policy}.md`, `docs/v2/TR-frontend-v2.md` (§7), `backend/migrations/{0001_init,0002_identity_vault}.sql`, `backend/src/api/auth/{mod,login,register,session}.rs`, `backend/src/api/{key_envelopes,invites}.rs`, `backend/src/db/{account,session,key_envelope}.rs`, `backend/src/{rate_limit,config}.rs`, `backend/src/ws/mod.rs`, `backend/tests/contract/auth_session.rs`, `frontend/src/crypto/{vault,identity,keyHandoff}.ts`, `frontend/src/session/session.tsx`, `frontend/src/pages/{Auth,Unlock,Account}.tsx`, `frontend/src/i18n/catalogs/*.ts`.

---

## 1. Objeto

Definir o que precisa mudar no backend, no cliente e nos contratos para existir um caminho de "esqueci a senha" que **funcione de facto** neste modelo de criptografia, sem prometer ao utilizador mais do que entrega.

Este documento não escolhe o mecanismo — apresenta as opções, o que cada uma exige da estrutura actual e uma recomendação, para decisão antes da proposta OpenSpec.

---

## 2. Contexto e correcções ao registo do backlog

O item 18 do backlog está correcto no essencial (a password é também a chave do cofre, logo um reset ingénuo não devolve identidade). A leitura do código acrescenta quatro factos que mudam o desenho:

1. **A password de login e a do cofre são a mesma string.** `register` envia `password` ao servidor (hash Argon2 em `account.password_hash`) e, no cliente, usa essa mesma string em `wrapVault` (`session.tsx:register`). Não há segredo separado.
2. **Já existe "recuperar identidade", mas só com sessão activa.** `PUT /api/auth/identity` (`auth/mod.rs:put_identity`) + `session.recover()` + botão em `Unlock.tsx` geram um novo par de chaves e um cofre novo. Quem esqueceu a password **não chega a esse ecrã**, porque não consegue fazer login. A lacuna real é o **caminho sem autenticação**: trocar `password_hash` sem provar a password antiga.
3. **Não existe sequer "alterar senha" com a antiga conhecida.** Nenhuma rota actualiza `password_hash` depois do registo. Alterar e recuperar partilham a mesma primitiva (novo hash + cofre re-embrulhado), por isso convém decidir os dois em conjunto (ver §8, pergunta 5).
4. **Não há nenhum canal fora de banda com o utilizador.** `account` tem só `handle`, `password_hash`, `identity_pubkey`, `identity_vault`, `is_initial_operator`, `display_name`; não há e-mail, telefone nem SMTP no backend (`grep` por `email|smtp|mailer` em `backend/` e `frontend/src` não devolve nada; `Account.tsx` documenta "there is no recovery e-mail"). O modelo clássico "link por e-mail" **não é aplicável** sem introduzir um campo e um serviço de envio.

### 2.1 O que se perde de facto com "nova identidade" (nuance ao backlog)

O backlog diz que a nova identidade perde "qualquer histórico que dependa só da identidade antiga". Na prática, como a chave simétrica é **partilhada por todos os membros** do Servidor (`key_envelope` por `(server_id, account_id)`), a identidade antiga não é insubstituível: qualquer membro `synced` pode re-selar a mesma `server_key` para a nova `identity_pubkey` (`key_handoff.requested`, `handleHandoffEvent`). O histórico **volta a ser legível** se houver pelo menos um membro com a chave online. Perde-se de forma definitiva apenas:

- Servidores em que a conta era a **única** detentora da chave (ex.: Servidor de um só membro).
- A **custódia da chave de canal de voz** (`channel_key.sealed_blob`, migração 0006): está selada para a `identity_pubkey` do custodiante e `replace_identity` não a toca — após o reset, o custodiante deixa de a conseguir abrir.

Isto vale a pena corrigir no texto do item 18 e na copy do ecrã (`auth.recoveryWarning` hoje diz que o histórico "deixará de ser legível", o que é pessimista demais para a maioria dos casos e impreciso nos dois casos acima).

---

## 3. Objetivos

### 3.1 Geral

Permitir que um utilizador sem acesso à password volte a entrar na conta, com a menor perda possível e sem enfraquecer a garantia de que o servidor nunca vê a chave privada nem a password.

### 3.2 Específicos

1. Reaver **acesso à conta** (login) sem a password antiga.
2. Quando possível, reaver também a **identidade** (mesmo `identity_pubkey`), preservando Servidores, histórico e custódia sem novo handoff.
3. Quando não for possível, fazer o fallback para **nova identidade** com perda explicada e mínima.
4. Impedir tomada de conta por terceiros (o reset é o ponto mais atacado de qualquer sistema de contas).
5. Reaproveitar o que existe (`PUT /auth/identity`, handoff de chave, `Unlock.tsx`) em vez de duplicar.

---

## 4. Escopo

### 4.1 Dentro

- Mecanismo de autorização do reset (ver §6) e rotas de backend correspondentes.
- Geração, apresentação e armazenamento do segredo de recuperação (se a opção B for escolhida).
- Ecrãs: "Esqueci a senha" (público), fluxo de recuperação, gestão da chave de recuperação em "Minha conta".
- Revogação de sessões ao completar um reset.
- Limitação de tentativas por conta (não só por IP).
- Contratos, docs e testes.

### 4.2 Fora

- Recuperação por e-mail/SMS, passkeys/WebAuthn, MLS e seed BIP-39 do mockup especulativo (`TR-frontend-v2.md` §7.1) — exigem arquitectura não existente.
- Eliminação de conta.
- Forward secrecy / rotação de chave de Servidor.
- Dispositivos e sessões autorizadas (lista/revogação individual).

---

## 5. Situação actual (diagnóstico técnico)

| Peça | Estado | Referência |
|---|---|---|
| Login | `handle` + `password` → verifica Argon2 → cria sessão (cookie `Session`, hash SHA-256 na BD) | `auth/login.rs` |
| Cofre | `identity_vault` = JSON `{v,publicKey,salt,iv,wrapped}`; AES-GCM com chave Argon2id(password, salt); devolvido por `GET /auth/me` a qualquer sessão válida | `crypto/vault.ts`, `domain/account.rs:auth_view` |
| Trocar cofre | `PUT /auth/identity-vault` (mesma identidade, sem validar password) | `auth/mod.rs` |
| Nova identidade | `PUT /auth/identity`: troca pubkey+cofre, apaga os `key_envelope` da conta, marca `membership` como `pending`, emite `key_handoff.requested` aos `synced` | `auth/mod.rs:put_identity` |
| Alterar `password_hash` | **Não existe** | — |
| Revogar sessões | Só a sessão actual (`db::session::revoke(id)`); **sem** "revogar todas da conta" | `db/session.rs` |
| Rate limit | 10 pedidos/60 s **por IP**, em memória; `X-Forwarded-For` ignorado, logo atrás de proxy reverso o balde é **global** | `rate_limit.rs` |
| Operador | `is_initial_operator` é só um flag lido na criação; **não há UI nem CLI de administração** da instância | `register.rs`, `main.rs` |
| Registo | Dois pontos criam conta e cofre: `register` e `joinWithInvite` (via `register_inner`) — ambos teriam de gerar o segredo de recuperação | `session.tsx`, `invites.rs` |

### 5.1 Risco já existente que o reset agrava

`ensureServerKey` (`keyHandoff.ts`) gera uma **nova** `server_key` quando o utilizador é dono do Servidor e não consegue carregar envelope. Após `PUT /auth/identity` os envelopes da conta são apagados; se o dono entrar antes de um membro `synced` re-selar a chave, o cliente **cria uma chave nova** e faz upsert do próprio envelope (o handoff dos outros passa a ser recusado: `cannot overwrite a synced key envelope`). Resultado: a chave do Servidor bifurca e o histórico antigo fica ilegível para o dono. Isto já pode acontecer hoje com o botão "Recuperar identidade"; o reset sem sessão torna-o mais provável (dono que perdeu a senha é o caso típico). Tem de ser tratado nesta demanda ou assumido como risco aceite — ver §7.

---

## 6. Opções de desenho

### Opção A — Reset assistido pelo operador → nova identidade

O operador da instância gera um **código de reset de uso único e curta validade** para um `handle`, entrega-o por fora (mensagem directa, voz). O utilizador abre "Esqueci a senha", introduz handle + código + nova senha; o cliente gera novo par de chaves e cofre; o backend troca `password_hash`, aplica a mesma lógica de `put_identity` e revoga as sessões.

- **Prós:** sem estado novo no cliente, sem segredo a guardar; encaixa no contexto self-hosted de grupos pequenos onde o operador conhece as pessoas; funciona para **todas** as contas já existentes.
- **Contras:** perde identidade (§2.1); depende de um humano disponível; confiança total no operador (que já é confiável por definição neste produto); exige ferramenta de operador, que não existe.
- **Forma mínima da ferramenta:** subcomando do binário (`chat-backend reset-code <handle>`), porque o operador já tem shell no host e isso evita criar UI/autorização de "admin de instância" que hoje não existe. Alternativa (UI) só se houver decisão de produto sobre papel de operador.

### Opção B — Chave de recuperação gerada no registo → recuperação real da identidade

No registo, o cliente gera um **código de recuperação** de alta entropia (≥128 bit) mostrado uma única vez ao utilizador. Dele derivam-se, com separação de domínio, duas coisas independentes:

1. `recovery_wrap_key` → embrulha a `secretKey` em `account.recovery_vault` (mesmo formato do cofre, nova instância de `wrapVault`).
2. `recovery_proof` → o servidor guarda apenas o seu hash (`account.recovery_proof_hash`); prova que quem pede o reset conhece o código, sem o servidor o conhecer.

Fluxo: `POST /auth/recover/start {handle, proof}` → servidor valida, devolve `recovery_vault`; o cliente abre-o com o código, re-embrulha com a nova senha e envia `POST /auth/recover/complete {…, new_password, identity_vault}`; o servidor troca `password_hash` e `identity_vault`, **mantém `identity_pubkey`**, revoga sessões.

- **Prós:** preserva a identidade → **nenhum** handoff, nenhuma perda, nenhum dos riscos de §5.1 nem da custódia de voz; autónomo (sem operador); é o que a direcção 2 do backlog descreve.
- **Contras:** UX de "guarde isto, sem ele não há recuperação"; contas existentes não têm o segredo (precisam de o gerar em "Minha conta" estando desbloqueadas); novo formato criptográfico a registar no contrato e a cobrir com vectores; novo material sensível no servidor (`recovery_vault`, protegido por segredo forte, não por senha humana).
- **Entropia:** o código tem de ser aleatório gerado pela app, **não** escolhido pelo utilizador — um código fraco tornaria o `recovery_vault` brute-forçável offline por quem tenha a BD.

### Opção C — B como caminho principal, A como fallback (recomendada)

B cobre quem guardou o código (sem perda, sem operador). A cobre quem não guardou, e **todas as contas actuais** enquanto não gerarem o código. As duas convergem no mesmo endpoint de conclusão, diferindo só em saber se a `identity_pubkey` muda.

**Recomendação:** C, implementada em duas fases dentro da mesma spec: (1) A + base comum (rotas, revogação de sessões, rate limit por conta, ecrãs) — resolve o problema já, com baixo risco; (2) B por cima, sem alterar a base. Se for preciso cortar, cortar B (A sozinha é consistente), nunca A (sem ela, contas sem código ficam sem saída).

---

## 7. Impacto — o que precisa mudar na estrutura actual

### 7.1 Backend

| Mudança | Opção | Nota |
|---|---|---|
| Migração `0023`: `account.recovery_vault BLOB`, `account.recovery_proof_hash TEXT`, `account.recovery_set_at TEXT` | B | Aditiva e anulável (política `backend-change-policy.md`). |
| Migração `0023`: tabela `password_reset (id, account_id, code_hash, expires_at, used_at, created_at)` | A | Guardar só hash do código; uso único; TTL curto (ex.: 15–30 min). |
| `POST /api/auth/recover/start`, `POST /api/auth/recover/complete` (públicas) | A+B | Resposta **uniforme** para handle inexistente/sem código (anti-enumeração); `login` já é genérico. |
| `PUT /api/auth/recovery` (autenticada): criar/rodar o segredo de recuperação | B | Necessária para contas existentes e para "gerar novo código". |
| `PUT /api/auth/password` (autenticada, exige senha actual) | opcional (§8.5) | Mesma primitiva de `complete`. |
| `db::session::revoke_all_for_account` | A+B | Hoje inexistente; reset **tem** de invalidar sessões abertas (o atacante pode ter uma). |
| Extrair a lógica de `put_identity` (apagar envelopes, `pending`, `key_handoff.requested`) para função partilhada | A | Hoje está inline no handler; será chamada por dois caminhos. Alinhar com o change do item 10, que a faz iterar canais em vez de servidores. |
| Rate limit por `handle`/conta além do por IP | A+B | `rate_limit.rs` só tem balde por IP e, atrás de proxy, ele é global. Limitar tentativas de código por conta (ex.: 5/hora) e invalidar o código após N falhas. |
| Subcomando de operador `reset-code <handle>` em `main.rs` | A | Sem UI de admin; ver §6. |
| Atingir `AuthAccount`/`auth_view` | B | Expor apenas `has_recovery_key: bool`, **nunca** devolver `recovery_vault` em `/auth/me`. O `recovery_vault` só sai em `recover/start` após prova válida. |
| Tratar o fork de chave do dono (§5.1) | A | Mínimo: o cliente não gera chave nova se o Servidor tem outros membros `synced`; deve esperar o handoff. Idealmente decisão do servidor (recusar upsert próprio do dono quando já existem envelopes `synced` de outros). |
| Custódia de voz (`channel_key`) após nova identidade | A | Decidir: avisar na UI, ou migrar o `sealed_blob` quando o custodiante reentra com a chave em `localStorage`. Mínimo aceitável: avisar. |

### 7.2 Frontend

- `crypto/vault.ts`: geração do código, derivação com separação de domínio (wrap vs. prova), reaproveitando `wrapVault`/`unlockVault`. Função pura, sem armazenamento, para correr no harness `npm run test:contracts` com vectores novos em `docs/v2/contracts/vectors/`.
- `session/session.tsx`: `register` e `joinWithInvite` passam a gerar o código e a devolvê-lo ao ecrã; novos `recoverAccount` (A e B) e, se aprovado, `changePassword`. `recover()` actual (sessão activa) mantém-se.
- `pages/Auth.tsx`: o link actual **"Esqueceu o cofre?"** (`auth.forgotVault`) é enganador — explica o ecrã de desbloqueio, não recupera senha. Passa a "Esqueci a senha" e abre o novo fluxo; a ajuda existente migra para o `Unlock`.
- Nova rota pública `/recover` (confirmar no router e no guard de sessão que páginas públicas existentes são `Auth`/`Invite`).
- Interstício pós-registo: mostrar o código **uma vez**, com copiar/descarregar e confirmação ("guardei") antes de continuar. Tem de existir nos dois caminhos de criação de conta.
- `pages/Account.tsx`: cartão "Chave de recuperação" (estado, gerar/rodar) e, se aprovado, "Alterar senha".
- `pages/Unlock.tsx` e `auth.recoveryWarning`: corrigir a copy conforme §2.1.
- i18n `pt-BR` e `en`.

### 7.3 Contratos e documentação

- `docs/v2/contracts/crypto-formats.md`: nova secção "Cofre de recuperação" e derivação da prova, com vectores.
- `docs/v2/contracts/backend-change-policy.md`: linha no registo (alteração aditiva e retrocompatível).
- `specs/002-fase-1-mvp/contracts/` (REST): novas rotas.
- `docs/operar-instancia.md` e `README`: procedimento do operador (A) e aviso de produto (B).
- `docs/e2ee-gaps.md`: o servidor passa a guardar um blob que só um segredo do utilizador abre; registar.

### 7.4 Testes

- Contrato (`backend/tests/contract/auth_recovery.rs`): reset com código válido/expirado/reutilizado/errado; bloqueio após N falhas; sessões antigas invalidadas; resposta uniforme para handle inexistente; `recover/start` não vaza `recovery_vault` sem prova; `/auth/me` não expõe o blob.
- Reaproveitar o padrão de `auth_session.rs::replace_identity_updates_vault_and_marks_handoff_pending` para o ramo "nova identidade".
- Vectores criptográficos no harness do frontend.
- Verificação em navegador do fluxo completo (registo → mostrar código → esquecer → recuperar → entrar → Servidores intactos).

### 7.5 Interacção com outros itens

- **Item 10 (change `bots-channel-key-integration` em curso):** muda `key_envelope` para `(channel_id, account_id)` e reescreve o handoff. A Opção B **não toca** em `key_envelope` (mesma pubkey), logo é independente. O ramo "nova identidade" da A chama a lógica de handoff e deve usar a versão por canal — sequenciar com esse change ou isolar a chamada atrás de uma função única.
- **Item 17 (cópia de chave no servidor):** se for aprovado, o servidor poderia re-selar sozinho após um reset, tornando a perda de §2.1 nula; não é pré-requisito, mas quem decidir o 17 deve saber que reduz o valor da opção B.
- **Bots (item 10):** contas de bot não têm cofre nem password; recuperação não se lhes aplica.

---

## 8. Riscos

| Risco | Impacto | Nota |
|---|---|---|
| Tomada de conta pelo próprio mecanismo de reset | Alto | Código de uso único, TTL curto, hash em repouso, limite por conta, resposta uniforme, revogação de todas as sessões ao concluir. |
| Fork da `server_key` do dono após reset (§5.1) | Alto | Já existe hoje; o reset sem sessão agrava. Tratar ou assumir explicitamente. |
| Rate limit por IP inútil atrás de proxy (balde global) | Médio | `X-Forwarded-For` é ignorado de propósito; limite por conta é obrigatório, e um atacante pode esgotar o balde global para bloquear logins legítimos. |
| Utilizador não guarda o código de recuperação | Médio | Mitigar com interstício obrigatório e com o fallback A; é a mesma classe de risco de qualquer cofre E2EE. |
| Código de recuperação fraco/escolhido pelo utilizador | Alto | Gerado pela app, ≥128 bit. |
| Contas existentes sem código | Médio | Dependem de A até gerarem o código em "Minha conta". |
| Copy a prometer mais do que entrega ("recupere a conta") | Médio | Distinguir sempre "recuperar acesso" de "recuperar identidade/histórico". |
| Alterar o fluxo de registo quebra o rollback para a v1 | Médio | A política de backend exige mudança aditiva; campos novos opcionais e `register` aceita corpo sem eles. |

---

## 9. Perguntas em aberto (decisões antes da proposta OpenSpec)

1. **Opção A, B ou C?** (recomendação: C em duas fases; cortar B se necessário, nunca A).
2. **Quem é o operador para emitir códigos?** Aceita-se CLI no host (`reset-code`), ou é preciso UI (o que obriga a definir "admin de instância", hoje inexistente)?
3. **Contas existentes**: obrigar a gerar a chave de recuperação (banner/bloqueio no próximo login) ou deixar opcional?
4. **Fork de chave do dono (§5.1):** corrigir nesta demanda (e onde — cliente, servidor ou ambos) ou registar como item separado?
5. **"Alterar senha" entra no escopo?** É a mesma primitiva e hoje não existe; proposta: incluir.
6. **Custódia de voz (`channel_key`) após nova identidade:** só avisar, ou migrar automaticamente?
7. **Sequenciamento com o change do item 10**, que reescreve o handoff que o ramo "nova identidade" usa.
8. **Política do código**: formato (grupos de caracteres vs. palavras), TTL do código de operador, número de falhas antes de invalidar.

---

## 10. Próximo passo

Fechadas as perguntas 1–4 (as restantes têm padrão razoável), abrir a spec com `/opsx:propose`. Proposta de fatiamento das tarefas: (1) base comum — migração, revogação de sessões, rate limit por conta, extracção da lógica de nova identidade; (2) opção A — rotas, CLI, ecrãs; (3) opção B — formato, vectores, rotas, interstício e cartão em "Minha conta"; (4) contratos, docs e verificação em navegador.

## 11. Estado de base antes da implementação (2026-10-08)

`cargo test` em `backend/`, antes de qualquer alteração de código deste change:

- Unitários `src/lib.rs`: 10 passaram, 0 falharam; `src/main.rs`: 0 testes.
- Contrato `tests/contract`: 147 passaram, 0 falharam.
- Integração `tests/integration`: 1 passou, 1 falhou. A falha preexistente é `server_isolation::servers_do_not_leak_across_membership` em `server_isolation.rs:101`: resposta observada 404, teste espera 403.
- Resultado global: código de saída 101 somente pela falha de integração acima.

### Migração aditiva 0023

Confirmei que `0023` estava livre. Apliquei `0023_password_recovery.sql` numa cópia temporária de `backend/chat.db` feita com o mecanismo de backup do SQLite; o original não foi modificado. As 2 contas, os 2 cofres de identidade e os 2 hashes de senha presentes na cópia permaneceram. `EXPLAIN QUERY PLAN DELETE FROM key_envelope WHERE account_id = ?` devolveu `SEARCH key_envelope USING INDEX idx_key_envelope_account`. O contrato `auth_session::login_issues_cookie_and_me_works` passou com a migração compilada pelo SQLx. Não conheço as credenciais das contas existentes; por isso não executei login nelas.

## 12. Medição de escala (2026-10-08)

Comando: `cargo test --test scale -- --nocapture` (`backend/tests/scale.rs`). Perfil de compilação debug. Máquina: Linux 7.2.8-200.fc44.x86_64, AMD Ryzen 9 3900X (24 threads), SQLite 3.46.0. Dados: 20 Servidores com 300 membros cada um (a conta medida em todos), um Servidor com 1000 envelopes de 80 bytes, uma manada de 300 respostas e um Servidor de replay com 300 membros dos quais 50 pendentes. p95 de 5 amostras, excepto a guarda (20) e a manada (média das 300 respostas concorrentes).

| Critério | Base | Com índice e guarda de 4.1 | Limite | Resultado |
| --- | --- | --- | --- | --- |
| `DELETE` dos envelopes da conta | `SCAN key_envelope`, p95 3,455 ms | `SEARCH` por `idx_key_envelope_account`, p95 0,169 ms | usa o índice | cumpre |
| Substituição de identidade, conta em 20 Servidores de 300 | — | p95 27,225 ms; 5980 eventos `key_handoff.requested` (299 sincronizados × 20) | p95 ≤ 1 s | cumpre |
| Guarda do envelope próprio com 1001 envelopes no Servidor | — | p95 0,909 ms, resposta 409 | p95 ≤ 5 ms | cumpre |
| Manada de 300 `POST /key-envelopes` | o upsert anterior aceitava mais do que um escritor | 1 criado, 299 recusados, média 0,827 ms, 1 linha gravada | p95 ≤ 250 ms e exactamente 1 vencedor | cumpre |
| `replay_pending_handoffs`, 50 pendentes num Servidor de 300 | — | p95 9,641 ms; 50 eventos por passagem (250 em 5 passagens) | p95 ≤ 100 ms e ≤ 1 evento por pendente | cumpre |

A tarefa 5.4 fica dispensada: todos os critérios de 5.3 cumprem, por isso o fan-out de `key_handoff.requested` não foi limitado a 5 destinatários. O change dos bots, se passar a envelope por canal, multiplica estas linhas e estes eventos pelo número de canais do Servidor.

## 13. Verificação no navegador da correcção da bifurcação de chave (tarefa 4.3, 2026-10-08)

Backend e SQLite descartáveis (`DATABASE_URL=sqlite:///tmp/mesa-recovery-verify.db`), frontend `npm run dev` já em execução, controlados via Claude em Chrome. Cenário: conta `dono_teste` cria o Servidor "Mesa Teste" (`#geral` + canal de voz), convida `membro_teste` que sincroniza a chave (dono online no momento do convite). `dono_teste` envia uma mensagem em `#geral`, depois termina sessão.

**Dono recupera com o membro offline.** Com `membro_teste` desligado, o operador emite `reset-code dono_teste` via CLI e `dono_teste` recupera em `/recover` → "Tenho um código do operador". Resultado:
- entrou com identidade nova directamente no shell (sem acção extra);
- `#geral` mostrou "Esperando a chave deste servidor. Ela chega quando outro membro estiver online." — **não** gerou chave nova;
- consulta à BD confirmou zero linhas em `key_envelope` para a conta nova nesse Servidor e `membership.key_handoff_status = 'pending'` — sem bifurcação.

**Membro volta a ligar-se.** Login de `membro_teste` (sem nenhuma acção manual de handoff): a consulta à BD, logo depois, mostrou `key_envelope` presente e `key_handoff_status = 'synced'` para **ambas** as contas — o `replay_pending_handoffs` tratou o pedido pendente de `dono_teste` sozinho, via o mesmo mecanismo que sincroniza um membro recém-entrado.

**Legibilidade do histórico.** `dono_teste` voltou a entrar (mesma identidade nova, mesma sessão local já persistida): `#geral` mostrou de imediato "Mensagem antes do reset de senha do dono." — a `server_key` original foi reselada para a identidade nova sem perda, confirmando que o handoff resseala a chave existente, não gera uma chave diferente.

**Não reproduzido no navegador:** a corrida real de "dois dispositivos do único dono" (dois `POST /api/servers/{id}/key-envelopes` concorrentes para a mesma conta antes de qualquer envelope existir) exige duas sessões HTTP verdadeiramente simultâneas, que esta sessão de verificação manual não conseguiu orquestrar com um único perfil de browser. Fica coberta pelos testes de contrato de `post_envelope`/`key_envelope` (tarefa 4.1, já verdes), que exercem exactamente essa concorrência ao nível do backend.
