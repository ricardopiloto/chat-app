# Review — Desenvolvedor Fullstack

**Change:** channel-webhooks
**Data:** 2026-11-08 (revisão da secção 1 — backend — implementada; secção 2, frontend, ainda não)
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend
Veredito: OK

- Corri eu próprio `cargo test` (workspace completo, fora do sandbox do Codex que tinha restrição de socket) — **236 passaram, 0 falharam**, incluindo os 4 testes de contrato novos (`backend/tests/contract/channel_webhooks.rs`) e os 9 que dependiam de WebSocket real. `cargo fmt --check` passou.
- Li o código final linha a linha contra `design.md`: `map_row` em `db/message.rs` só trata `kind == "system"` como caso que esconde `sender_account_id`/cifra vazia — `kind == "webhook"` passa por fora dessa condição e devolve o `sender_account_id` real da conta dedicada, exactamente como D3 pede (ao contrário das mensagens de sistema, que o escondem). Confirmei isto é deliberado e correcto, não uma omissão.
- `db::account::count` filtra `is_system_account = 0`; confirmei por leitura que `api/mod.rs::instance_status` e `auth/register.rs::register_inner` (que chamam esta função) não precisaram de mudança própria — o filtro na função basta, e o teste `system_account_does_not_block_first_human_registration` cobre exactamente este caminho.
- `login.rs` recusa `is_system_account` com o mesmo erro genérico de credenciais inválidas, no ponto certo (depois do `find_by_handle`, antes da verificação de password) — testado (`lifecycle_preserves_identity_and_history` faz login com o handle do webhook e confirma 401).
- Migração `0028_channel_webhooks.sql` é aditiva, sem tocar a FK `message.sender_account_id`; `channel_webhook.channel_id UNIQUE` garante um webhook por canal mesmo revogado, confirmado pelo teste de reactivação (`account_id` idêntico antes/depois).
- **Mesma ressalva que o Arquiteto levantou**: `create_or_reactivate` usa `pool.begin()` (modo `DEFERRED`) em vez de `BEGIN IMMEDIATE`, que é o padrão já usado em `register.rs` para a mesma classe de decisão concorrente ("sou a primeira escrita"). Não é um bloqueante — é uma acção administrativa rara, e o pior caso é um 500 ocasional em vez de 409 sob corrida real — mas é inconsistente com o padrão já estabelecido no projecto para este tipo de operação, e seria barato de corrigir agora antes de fechar a change.

## 2. Desenvolvimento do frontend
Veredito: N/A (ainda não implementado — tarefas 2.1-2.3 continuam em aberto)

- O backend já deixa o contrato pronto para a ronda de frontend: `Message.sender_avatar_url` (string já formatada como `/api/messages/{id}/webhook-avatar`, não filename/content_type crus), `Message.sender_display_name_snapshot`, `Message.kind == "webhook"`, e `Channel.has_active_webhook` para o aviso a todos os leitores — todos campos prontos a consumir directamente em `MessageRow.tsx`/na gestão do canal sem mais nenhuma decisão de forma de API pendente. `backend-consent.md` já dá o texto recomendado para o aviso de consentimento e para o indicador do canal, reduzindo a ambiguidade da tarefa 2.1 a trabalho de implementação, não de design.

## 3. Deploy e operação
Veredito: OK

- Migração nova segue a numeração e o padrão (`ALTER TABLE ... ADD COLUMN`, `CREATE TABLE` aditiva) de todas as anteriores; nenhuma variável de ambiente, porta ou serviço novo.
- Reaproveita `avatars_dir` já configurado — sem storage novo a provisionar/documentar.
- `openspec validate channel-webhooks --strict` confirmado por mim: passa.

## 4. Qualidade de código
Veredito: Atenção

- Cobertura de teste é sólida para o que foi pedido: consentimento obrigatório, segredo mostrado uma vez, listagem sem segredo, publicação válida/token errado/revogado, rotação invalidando o token antigo, revogação preservando histórico, reactivação reaproveitando a mesma conta, rate limit com `Retry-After`, rejeição em canal de voz, ausência de `membership`, e o caso de onboarding com conta de sistema pré-existente — bate ponto a ponto com a matriz que a tarefa 2.3 do `tasks.md` já antecipava (ainda que os testes automatizados tenham sido escritos nesta ronda de backend, não na 2, antecipando-a correctamente).
- `cargo clippy --all-targets -- -D warnings` não passa, mas confirmei que os avisos apontados são todos pré-existentes (ficheiros fora do escopo desta change: `auth/email.rs`, `auth/key_reminders.rs`, `channel_provision.rs`, `domain/attachment.rs`, `domain/avatar.rs`, `domain/permissions.rs`, `token/mod.rs`) — a função nova `create_webhook` já resolveu o seu próprio aviso com `#[allow(clippy::too_many_arguments)]`, justificado pela assinatura de nove parâmetros pedida. Não é uma regressão desta change, mas fica registado como dívida pré-existente não resolvida.
- Ver a ressalva de concorrência na secção 1 (`BEGIN IMMEDIATE`) — é também um achado de qualidade de código, não só de arquitectura.

## 5. Execução das decisões arquiteturais
Veredito: OK

- `tasks.md` 1.1-1.6 reflecte com precisão o que foi implementado; nenhuma decisão de D1-D4 foi reaberta sem justificação. A escolha de não apagar ficheiros de avatar antigos (para preservar snapshots) é a aplicada deliberadamente da alternativa que `design.md` já tinha sancionado ("reter recurso... ou fallback estável"), documentada no resumo da implementação.

## Bloqueantes antes de implementar
- Nenhum.

## Limitações técnicas a reportar ao Arquiteto
- Nenhuma nova — a questão de `BEGIN IMMEDIATE` já está reportada por ambas as revisões nesta ronda; não precisa de voltar a subir.

## Addendum (2026-11-08)
Corrigido: `create_or_reactivate` usa agora `BEGIN IMMEDIATE`. Reconfirmei eu próprio `cargo test` (236 passaram, 0 falharam) e `cargo fmt --check`. Sem achados remanescentes de qualidade de código; veredito sobe para **Aprovado**.

## Addendum (2026-11-08) — secção 2 (frontend) implementada

**Veredito desta ronda:** Aprovado com ressalvas.

- Li o código final ficheiro a ficheiro contra as tarefas 2.1-2.3 e confirmei eu próprio `tsc --noEmit`, `eslint src`, `verify:i18n-keys`, `verify:entry-screens`, `npm run build` — todos limpos (ver também o achado do Arquiteto sobre a alteração ao `verify-entry-screens.mjs`, que concordo não ser bloqueante mas deve ficar registada).
- `MessageRow.tsx`/`SearchPanel.tsx`/`ChannelPage.tsx` tratam `kind=webhook` de forma consistente nos três sítios que mostram remetente (linha principal, citação, resultado de busca), usando sempre o snapshot em vez de `people`, exactamente como `MessageRow.tsx:134` original exigia adaptar. Vai um pouco além do pedido (tratou também a citação e o alvo de resposta, que eu tinha marcado como opcional) sem custo de complexidade visível.
- `WebhookPanel.tsx` implementa o ciclo completo (criar/reactivar com consentimento obrigatório, mostrar segredo uma vez com cópia, renomear, trocar avatar sem apagar o anterior no backend, rodar, revogar com confirmação de dois passos) reaproveitando padrões já existentes no projecto (`createCopy`, `errorText`, `MAX_IMAGE_BYTES`/`PROFILE_IMAGE_MEDIA_TYPES`) em vez de inventar novos.
- Dois achados cosméticos, nenhum bloqueante:
  - Em `WebhookPanel.tsx`, o botão "Salvar nome" fica desactivado até a pessoa digitar algo no campo (`!editName().trim()`), mesmo que o campo já mostre o nome actual por omissão — a pessoa tem de tocar no campo (ex. apagar e re-escrever) antes de poder gravar, o que é um pequeno atrito mas não um bug (evita gravações acidentais de um campo que a pessoa nunca editou).
  - Em `frontend/src/i18n/catalogs/chat.pt-BR.ts`, as duas chaves novas (`webhookActive`, `webhookBadge`) foram escritas com escapes `ç`/`ã` em vez dos caracteres acentuados literais que o resto do ficheiro usa (confirmei: são as únicas duas ocorrências de `\u00` no ficheiro inteiro) — resolve para o mesmo texto em runtime, é só uma inconsistência de estilo de escrita, sem efeito funcional.
- Cobertura de teste: não há teste automatizado novo para `WebhookPanel.tsx`, mas confirmei que `AccessPanel`/`MutePanel` (os painéis de gestão equivalentes já existentes) também não têm — está consistente com o padrão já aceite neste projecto de não testar unitariamente estes painéis de administração, e a cobertura de contrato do backend (4 testes, secção 1) já garante o comportamento observável de ponta a ponta.

## Limitações técnicas a reportar ao Arquiteto (frontend)
- A mesma do Arquiteto: a alteração ao `verify-entry-screens.mjs` é uma decisão de infraestrutura partilhada tomada dentro desta change; não é um problema de implementação, é uma decisão que vale a pena o Arquiteto ter visibilidade explícita (já tem, ver o addendum dele).
