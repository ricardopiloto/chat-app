# Review — Desenvolvedor Fullstack

**Change:** bots-channel-key-integration
**Data:** 2026-10-12
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend

Veredito: Atenção

- A migração de schema (task 1.1–1.3) é implementável, mas `tasks.md:5` só cobre o caso simples: `key_envelope` muda de PK `(server_id, account_id)` para `(channel_id, account_id)` — isso exige **recriar a tabela** em SQLite (não existe `ALTER TABLE ... DROP/CHANGE PRIMARY KEY`), igual ao padrão que a própria task 1.2 já reconhece explicitamente para `password_hash` ("ou equivalente SQLite de recriar a tabela"). Nenhuma migração existente em `backend/migrations/` faz hoje esse tipo de recreate-with-FK-change (as mais próximas, ex. `0014_single_role_per_member.sql`, só adicionam coluna e deduplicam linhas). Recomendação: a task 1.1 deveria ter a mesma ressalva explícita que a 1.2 já tem, incluindo `PRAGMA foreign_keys=OFF` fora de qualquer transação (gotcha conhecido do SQLite) antes do create-copy-drop-rename.
- **Achado concreto (o mais relevante desta revisão):** o design (D3) assume que a elegibilidade para handoff "consulta a mesma resolução de ACL que já existe para 'quem pode ver este canal'" — mas, por leitura real do código, essa resolução **não existe hoje na direção necessária**. `backend/src/db/channel_acl.rs::list_grants_for_account` só responde "esta conta específica tem acesso?" (um `account_id` de entrada). As tasks 2.4/2.5 e a reescrita de `apply_identity_replacement` (hoje em `backend/src/api/auth/mod.rs:129`, não em `backend/src/api/mod.rs` como `design.md:95` cita) precisam da pergunta inversa — "dado este `channel_id`, quais contas (entre todas as do Servidor) são elegíveis?" — para decidir a quem perguntar pelo reseal e a quem anunciar o pedido. Essa função de resolução reversa (honrando overwrites allow/deny por conta e por papel, e o nível "everyone") precisa de ser **escrita do zero**, não só "reaproveitada". Isso não está marcado em nenhuma task — 2.4 descreve o resultado esperado ("membro sem ACL não aparece como elegível") mas não o trabalho de construir a função que produz essa lista.
- O mesmo buraco aparece no cliente: `ensureServerKey` (`frontend/src/crypto/keyHandoff.ts:43-61`, confirmado por leitura) hoje usa `GET /api/servers/{id}/members` (lista plana de todos os membros do Servidor) para saber a quem selar a chave recém-criada. Depois da migração, criar a `channel_key` de um canal privado exige uma lista equivalente **escopada ao canal** (não ao Servidor) — não existe hoje nenhum endpoint `GET /api/channels/{id}/members`-equivalente. Isso é trabalho de backend novo (endpoint) que `tasks.md` não lista explicitamente nas tarefas de secção 2.
- Autenticação de bot (3.2): "reaproveitando `backend/src/token/`" (`design.md:55`) é uma referência de módulo errada — esse caminho é o emissor de JWT do LiveKit (`backend/src/token/mod.rs::mint`), não a máquina de sessão de conta. O ponto real a reaproveitar é `backend/src/api/auth/session.rs` + `backend/src/db/session.rs` (sessão por `token_hash`, igual ao que `bot.token_hash` precisa reusar). Não bloqueia a implementação, mas uma referência errada num design.md é o tipo de coisa que custa uma tarde perdida a quem começa a implementar pela task 3.2.
- Fora isso, a extensão WS (`key_handoff.*` carregando `channel_id`, task 2.3) é uma mudança mecânica directa sobre o hub já existente — sem lacuna.

## 2. Desenvolvimento do frontend

Veredito: OK

- A UI de gestão de bots (tasks 5.1–5.4) encaixa no padrão já existente da shell de definições (mesmo mecanismo de capacidade de papel, mesmo padrão de diálogo modal para criação curta, já usado por convites/canais) — viável com SolidJS + TanStack Query sem novo padrão de dados.
- `channelKey.ts`/`ensureChannelKey` (tasks 4.1/4.2) são uma generalização direta de `serverKey.ts`/`keyHandoff.ts` (ambos lidos nesta revisão) — troca de chave de indexação do `Map` e do gatilho de carregamento (eager→lazy), sem mudança de forma. O ponto fraco já identificado (dimensão 1: falta endpoint "membros elegíveis do canal") é o único obstáculo real aqui.
- `callSession.tsx` (task 4.3): a troca de `channel.server_id` por `channel.id` em `mediaKeyFor` (linha 57, lida nesta revisão) é literalmente uma palavra — o comentário já presente no código ("using it for frames would leave its creator unable to decrypt anyone else's media") mostra que quem escreveu o código já tinha isso mapeado; baixo risco de implementação.
- Responsividade: a página "Bots" e o diálogo de criação reaproveitam componentes já responsivos da shell de definições; nenhuma UI nova de alto risco.

## 3. Deploy e operação

Veredito: Atenção

- Não introduz porta, serviço ou variável de ambiente nova — os dois bots de referência correm como processos externos ao deploy desta app (fora de `backend/`/`frontend/`), consistente com `docs/deploy-producao.md`/`docs/operar-instancia.md`. `cargo build --release`/`npm run build`/systemd continuam suficientes.
- **Achado (Atenção, operacional):** `docs/deploy-producao.md` (seção "Arquitectura de produção") documenta que o rate limiter (`backend/src/rate_limit.rs`) conta por IP do peer TCP e, atrás do Nginx local, **todos os pedidos chegam como `127.0.0.1`** — ou seja, o limite de 10/60s já é partilhado por todos os visitantes humanos hoje. Um processo de bot que reconecta em loop (crash, token inválido, bug no processo externo referenciado nas tasks 6/7) passa a competir pelo mesmo orçamento partilhado, podendo bloquear momentaneamente logins humanos legítimos. Não é introduzido por esta change per se (já é uma limitação conhecida e documentada), mas a change é o primeiro caso concreto de um cliente automatizado com potencial de reconectar sem intervenção humana — vale uma nota em `docs/operar-instancia.md`/`docs/backlog/backlog.md` (task 8.3) alertando o operador para esse cenário.
- Observabilidade: nenhuma task pede uma linha de log/trace distinguível para "sessão de bot autenticada/recusada" (tasks 3.2/3.3 só pedem teste de integração). Dado que é o próprio dev fullstack quem vai depurar isso em produção sozinho, uma linha de `tracing` explícita (ex. `bot_id`, `channel_ids`, resultado) ajudaria a diagnosticar um bot que não consegue decifrar ou não recebe handoff, sem precisar instrumentar na hora.

## 4. Qualidade de código

Veredito: Atenção

- `tasks.md` segue consistentemente o padrão "tarefa + como verificar" já usado em changes anteriores (ex. `password-recovery/tasks.md`) — boa aderência de forma, com teste unitário/contrato/integração indicado em quase todas as tarefas de schema e backend.
- **Achado:** a task 2.4 testa só o caso binário "tem ACL / não tem ACL" para um canal privado. A função de resolução reversa que essa task precisa (ver dimensão 1) tem uma superfície de teste maior e mais arriscada — overwrite `deny` por conta sobrepondo um `allow` por papel, overwrite por papel quando a conta tem dois papéis (hoje a app é "um papel por membro", migração `0014`, o que simplifica mas vale confirmar que a função nova não assume erradamente múltiplos papéis), e o nível "everyone" combinado com overwrites. Recomendação: expandir a verificação da task 2.4 para cobrir explicitamente deny-overwrite e a precedência allow/deny, não só a ausência total de ACL.
- **Achado (convergente com o review do Arquiteto):** não há task que repita a medição de `cargo test --test scale` com o multiplicador de canais por Servidor, apesar de `docs/e2ee-gaps.md` e a própria spec `crypto/key-envelope-integrity` pedirem essa remedição explicitamente. Do ponto de vista de qualidade de código, isso é a diferença entre "a suite passa" (task 8.1) e "a suite passa dentro dos critérios de p95 já contratados" — são verificações diferentes e só a primeira está nas tasks.
- Resiliência: a lógica de "primeiro escritor vence" (409) em `post_envelope` já é testada e reaproveitada (boa prática, D-0 do password-recovery); nenhuma concorrência nova introduzida pela mudança de escopo `server_id`→`channel_id` além da já coberta.

## 5. Execução das decisões arquiteturais

Veredito: OK

- As tasks seguem fielmente as nove Decisions do `design.md` (D1–D9), sem reabrir nenhuma sem justificar — a tabela satélite `bot` (D1), a elegibilidade via ACL sem tabela de membership nova (D3), o cascade-only de revogação (D6) e a expiração configurável (D7) todos têm tarefa correspondente e coerente.
- Nenhum desvio silencioso de padrão encontrado nas tasks em relação ao `design.md` nesta leitura.

## Bloqueantes antes de implementar

- nenhum

## Limitações técnicas a reportar ao Arquiteto

- A função de resolução reversa de ACL ("dado um canal, quais contas são elegíveis") não existe hoje em `backend/src/db/channel_acl.rs` — é código novo, não reaproveitamento, e precisa tanto no backend (fan-out de handoff, tasks 2.4/2.5) quanto como endpoint novo exposto ao cliente (para `ensureChannelKey` saber a quem selar a chave recém-criada de um canal privado). Isso é relevante para a estimativa de esforço das tasks 2.x/4.x e para a preocupação de escala já levantada por `review-architect.md` dimensão 3 — a nova função é exatamente o código cujo custo por chamada decide se os critérios de p95 da spec `crypto/key-envelope-integrity` continuam a valer depois da migração.
