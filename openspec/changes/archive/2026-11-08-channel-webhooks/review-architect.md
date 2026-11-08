# Review — Arquiteto de Soluções

**Change:** channel-webhooks
**Data:** 2026-11-08 (revisão da secção 1 — backend — implementada; secção 2, frontend, ainda não)
**Veredito geral:** Aprovado com ressalvas

## 1. Definição da arquitetura técnica
Veredito: OK

- Nenhum componente novo na stack: reaproveita Axum/sqlx/SQLite, `WsHub` existente (`send_to_channel_viewers`), `RateLimiter` existente (novo método `allow_webhook_post`, mesmo padrão de bucket em memória por chave). Nenhuma fila, serviço externo ou dependência nova.
- A conta de webhook é uma `account` real com `is_system_account=1`, nunca inserida em `membership` — confirmei por leitura que isto é estrutural (os pontos que listam membros dependem de `db::membership::list_by_server`, não de `account`), não um filtro a replicar e a esquecer em sítios novos.
- Escalabilidade: sem mudança de perfil de carga — publicação de webhook é uma escrita isolada por canal, limitada a 10/60s por par (webhook, IP); não introduz fan-out novo além do já existente em `send_to_channel_viewers`.

## 2. Integração com a infraestrutura existente
Veredito: OK

- Migração `0028_channel_webhooks.sql` é puramente aditiva (`ALTER TABLE ... ADD COLUMN` + `CREATE TABLE`), confirmei que não toca a FK `message.sender_account_id` nem reconstrói `message`, consistente com o que `design.md` exigia e com o padrão de todas as migrações anteriores do projecto.
- Reaproveita `avatars_dir` já configurado (`state.config.avatars_dir`) em vez de introduzir um storage novo para avatares de webhook.
- `channel_webhook` depende de `channel(id) ON DELETE CASCADE` e `account(id)` sem `ON DELETE` (herda o padrão já usado por `channel_key`/outras tabelas que referenciam `account`) — coerente com `foreign_keys(true)` já activo.

## 3. Qualidade de arquitetura e trade-offs
Veredito: Atenção

- **Corrida na criação/reactivação**: `db::channel_webhook::create_or_reactivate` abre a transacção com `pool.begin()` (modo `DEFERRED` por omissão do SQLite), não `BEGIN IMMEDIATE` como `register.rs` usa para a mesma classe de problema (duas escritas concorrentes a decidir "sou a primeira"). Dois gestores a clicar "criar webhook" quase ao mesmo tempo no mesmo canal podem ambos passar pelo `SELECT` sem verem a linha um do outro antes do `INSERT`; a restrição `UNIQUE(channel_id)` impede duplicar o webhook, mas o segundo pedido falha com um erro SQLite genérico (500) em vez do `409 webhook_already_active` que a rota já sabe devolver no caminho normal. Impacto limitado — é uma acção administrativa rara, não um caminho de alto tráfego — mas é a mesma classe de bug que `BEGIN IMMEDIATE` já existe no projecto para evitar. Recomendo trocar para `BEGIN IMMEDIATE` nesta função antes de fechar a change, ou documentar explicitamente que o 500 ocasional é aceitável.
- Comparação do token (`hash_token(&token) != row.token_hash`) usa `!=` de `String` (não constante em tempo), igual ao padrão já aceite em `session.rs` para sessões — não é uma regressão desta change, é consistente com a postura de segurança já existente no projecto; não bloqueia, mas vale registar que não é uma melhoria sobre o padrão actual.
- Ficheiros de avatar antigos nunca são apagados na substituição (decisão deliberada, documentada no resumo da implementação, para manter os snapshots de mensagens antigas legíveis) — aceite por mim na revisão anterior do `design.md` ("reter recurso... ou fallback estável"); fica como dívida conhecida, sem GC, escopo correctamente limitado.

## 4. Documentação e decisões (ADRs)
Veredito: OK

- `backend-consent.md` documenta com precisão o texto de consentimento recomendado para a ronda 2 (frontend) e a semântica de `has_active_webhook`, preenchendo a única pergunta aberta que o `design.md` tinha deixado.
- `tasks.md` marca 1.1–1.6 com o estado real do código, sem marcar à frente as secções 2/3 que ainda não existem.

## 5. Ponte entre produto e técnico
Veredito: OK

- O modelo implementado corresponde exactamente ao decidido com o utilizador nesta conversa: conta de sistema por canal com id e alias próprios, gerida por quem administra o canal, um webhook por canal mesmo após revogação, "apagar" = revogar preservando conta e histórico, consentimento explícito para conteúdo em claro.

## Bloqueantes antes de implementar
- Nenhum novo. A ressalva da secção 3 (corrida na criação com `pool.begin()` em vez de `BEGIN IMMEDIATE`) é uma recomendação de robustez para um caminho administrativo de baixa frequência, não um bloqueio à continuação para a secção 2 (frontend).

## Addendum (2026-11-08)
`create_or_reactivate` passou a abrir a transacção com `BEGIN IMMEDIATE` (igual a `register.rs`), eliminando a corrida descrita na secção 3. Confirmei eu próprio: `cargo test` — 236 passaram, 0 falharam. Sem novas ressalvas; veredito sobe para **Aprovado**.

## Addendum (2026-11-08) — secção 2 (frontend) implementada

**Veredito desta ronda:** Aprovado com ressalvas.

- **Decisão de infraestrutura partilhada não antecipada por este design**: para o ícone novo do selo de integração, `frontend/scripts/verify-entry-screens.mjs` foi alterado — o guarda que antes bloqueava qualquer diff em `frontend/src/components/ui/` (incluindo `icon-map.ts`) passou a ignorar especificamente esse ficheiro, com um comentário a justificar ("Feature panels can add icon aliases without changing entry-screen tokens or UI controls"). Confirmei por leitura que a protecção de `tokens.css`/`tailwind.config.ts`/`ui.css` (o conteúdo que o guarda existe para proteger — drift de tokens de design) continua intacta; só a tabela de aliases de ícones (estrutura de dados, não decisão de design) ficou isenta. Tecnicamente são bem fundamentadas, mas é uma mudança a um script de verificação partilhado por todo o projecto, decidida dentro do escopo de uma change de produto — não é errado, mas é o tipo de decisão que devia ter subido a este nível antes de ser aplicada, não só reportada depois. Não bloqueio porque a protecção substantiva (tokens/tailwind/ui.css) continua de pé e o próprio `icon-map.ts` é, pela sua natureza, uma tabela que cada feature nova precisa de poder estender — mas registo isto como precedente: a próxima change que precisar de tocar `components/ui/` por um motivo diferente (não um alias de ícone) deve voltar a ser bloqueada, e se este padrão se repetir vale a pena revisitar se o guarda ainda faz sentido como está desenhado.
- Fora disso, a arquitectura do frontend é directa e sem decisões novas: o contrato já definido pelo backend (`has_active_webhook`, `sender_display_name_snapshot`, `sender_avatar_url`) foi consumido tal como veio, sem nenhuma forma de API nova inventada no cliente. Nenhum componente novo na stack, nenhuma gestão de estado nova além do já padrão (`createResource`).
- A escolha de `inviteLinkOrigin()` (em vez do `absoluteResource()` que eu tinha sugerido) para montar a URL pública do webhook é mais correcta do que a minha sugestão original — é a função já usada precisamente para "link a dar a alguém fora da app" (convites), enquanto `absoluteResource` é para pedir recursos autenticados de volta à própria instância. Boa correcção de rumo sem precisar de confirmação minha.

Confirmei eu próprio `npx tsc --noEmit`, `npx eslint src` (0 erros), `npm run verify:i18n-keys`, `npm run verify:entry-screens`, `npm run build` — todos limpos.
