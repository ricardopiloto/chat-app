# Review — Arquiteto de Soluções

**Change:** add-message-reactions
**Data:** 2026-10-09
**Veredito geral:** Bloqueado (um achado bloqueante, de correção simples — ver secção 4)

## 1. Definição da arquitetura técnica
Veredito: OK

- A stack é a mesma já em uso (`design.md` Contexto): Rust/axum/sqlx/SQLite no backend, SolidJS no frontend, reutilizando o padrão `enrich()` de `backend/src/db/message.rs` e o `WsHub`/`send_to_channel_viewers` já existentes. Não há stack nova a justificar.
- Responsabilidades claras: nova tabela `message_reaction` (persistência), dois endpoints REST (mutação), dois eventos WS (fan-out), um componente de UI reaproveitado (`EmojiPicker`). Nenhuma camada nova é introduzida além da já existente (API → Domain → Repo).
- Escalabilidade: a proposta não declara um volume esperado de reações por mensagem/canal, mas a arquitetura de referência (`docs/arquitetura-tecnica.md` §1) assume "comunidades pequenas/médias" — a cardinalidade de uma reação (membros × emoji por mensagem) é ordens de grandeza menor que mensagens, e `tasks.md` 1.3 já prevê uma query de agregação em lote (`reactions_for_messages(message_ids)`) em vez de N+1 por mensagem. Sem risco de escala identificado para o perfil-alvo do projecto.

## 2. Integração com a infraestrutura existente
Veredito: OK

- Nenhum processo, porta ou container novo: tudo corre dentro do mesmo binário/processo servidor já descrito em `arquitetura-tecnica.md` §2.2, sem tocar `infra/docker-compose.yml` nem `infra/livekit.yaml`.
- Mesma origem/mesmo reverse proxy — os novos endpoints são sub-rotas de `/api/channels/{id}/messages/{id}/...`, não introduzem domínio, porta ou regra de proxy nova em `docs/deploy-producao.md`.
- Dados: tabela nova no mesmo SQLite/Postgres pluggável já em uso (`design.md` D1), FK `ON DELETE CASCADE` em `message_id` — sem impacto adicional em backup além do já existente para `message`/`attachment`.

## 3. Qualidade de arquitetura e trade-offs
Veredito: Atenção

- **Segurança/E2EE**: `design.md` D3 preserva corretamente o modelo já estabelecido em `arquitetura-tecnica.md` §4.3 (metadados em claro vs. corpo cifrado) — reações são tratadas como metadado, não como conteúdo, com justificação explícita de por que cifrar não ganharia confidencialidade real (a reação já é visível a todos os membros do canal). Isto está alinhado com o princípio do projecto, não o contradiz.
- **Controlo de acesso**: D6 reutiliza o mesmo `authz::channel_access` (permissão de escrita) do envio de mensagem — consistente com o resto do modelo de permissões do canal.
- **Performance/tempo real**: D4 usa um payload de delta mínimo (`{message_id, channel_id, account_id, emoji_code}`) em vez de reenviar a mensagem inteira — bom trade-off para evitar tráfego desproporcionado a cada clique.
- **Atenção — manutenibilidade da lista canónica de emoji (D7)**: a validação do `emoji_code` no backend depende de uma lista mantida manualmente em sincronia com `frontend/src/chat/logic/emoji.ts`, e o próprio `design.md` já admite isto como responsabilidade manual de quem editar o conjunto no futuro. Num projecto com o objectivo explícito de ser "mantido por uma pessoa só" (`arquitetura-tecnica.md` §1), duas fontes da verdade que podem divergir silenciosamente (ex.: alguém adiciona um emoji no frontend e esquece o backend, ou vice-versa) é um risco de manutenção real, ainda que não bloqueante. Recomendação: considerar gerar a lista do backend a partir de um ficheiro de dados único (ex. JSON partilhado, ou um passo de build que exporta `EMOJI_GROUPS` para um formato consumível pelo Rust), ou, no mínimo, um teste que falhe se as duas listas divergirem.

## 4. Documentação e decisões (ADRs)
Veredito: Bloqueante

- `design.md` segue bem o estilo de ADR já estabelecido no projecto (D1–D7, com alternativas consideradas e motivo), no mesmo formato de changes anteriores (ex. `password-recovery`, `key-handoff-offline`). Isto está bem feito.
- **Bloqueante**: `openspec/specs/frontend-v2/functional-parity/spec.md` (requisito "Backend reaproveitado, alterado só por necessidade do frontend") exige que toda alteração de backend **SHALL estar registada como tarefa explícita do change que a exige e reflectida em `docs/v2/contracts/`** — e `docs/v2/contracts/backend-change-policy.md` mostra que esta é uma prática viva e contínua do projecto, não só um portão pré-corte: duas changes já arquivadas **depois** do corte de produção (`password-recovery` e `key-handoff-offline`, ambas 2026-10-08) acrescentaram linhas a essa tabela. A nova tabela `message_reaction`, os dois endpoints REST e os dois eventos WS desta change são exactamente o tipo de alteração que essa tabela regista — e `tasks.md` actual não tem nenhuma tarefa para isso.
- **Como desbloquear**: adicionar a `tasks.md` (ex. no grupo 2, "API e tempo real") uma tarefa explícita para, ao implementar, acrescentar uma linha à tabela de `docs/v2/contracts/backend-change-policy.md` (data, change, requisito que exige, alteração, retrocompatibilidade, testes) — seguindo exactamente o formato das linhas já existentes. É uma correção de baixo custo (uma tarefa de documentação, não uma mudança de desenho), por isso o bloqueio é facilmente resolvido antes de começar a implementar.

## 5. Ponte entre produto e técnico
Veredito: OK

- O "Why"/"What Changes" do `proposal.md` (pedido do utilizador: reagir com os mesmos emoji já existentes, de forma análoga ao reply) foi traduzido em decisões técnicas concretas e justificadas no `design.md` (D1–D7), sem deixar nada como promessa vaga.
- A proposta já antecipa corretamente o porquê da exclusão anterior (mandato de paridade funcional com a v1, não falta no mockup — `proposal.md` "Why") e trata isto como uma expansão de escopo deliberada, não como "corrigir uma omissão", que é a leitura correta à luz de `openspec/changes/archive/2026-10-02-frontend-v2-text-chat/design.md` D2.
- N/A — funcionalidades específicas de RPG (rolagem de dados, fichas, NPCs): este projecto é uma aplicação de chat/voz tipo Discord para comunidades pequenas, não um sistema de RPG; os emoji 🎲/⚔️ nos mockups são só exemplos de glyphs, sem mecânica de jogo associada. Não se aplica.

## Bloqueantes antes de implementar
- Adicionar a `tasks.md` uma tarefa explícita para registar esta alteração de backend em `docs/v2/contracts/backend-change-policy.md`, conforme exigido por `frontend-v2/functional-parity` (ver secção 4).

**Reconciliação (2026-10-09):** tarefa 2.4 adicionada a `tasks.md` cobrindo exatamente este registo. Bloqueante resolvido antes do início da implementação.
