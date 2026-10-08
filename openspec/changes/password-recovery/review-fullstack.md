# Review — Desenvolvedor Fullstack

**Change:** password-recovery
**Data:** 2026-10-08 (revalidação após reset de `tasks.md` e adição de nota em `design.md`)
**Veredito geral:** Bloqueado

Metodologia: reli `proposal.md`, `design.md`, `tasks.md` (agora com as 30 tarefas em `[ ]` e notas inline), `.openspec.yaml` e os 5 `specs/**/spec.md`. Reconfrontei com o código, e desta vez ampliei a busca de testes para **todo** `backend/tests/`, não só `tests/contract/auth_recovery.rs` — isso corrigiu uma lacuna da minha primeira revisão (ver "Correções desta revalidação" abaixo). Rodei `cargo test --test contract` completo (153 passaram, 0 falharam) e `cargo test --test integration` (ainda não compila neste ambiente: `error: linker \`cc\` not found` — segue sendo limitação de ambiente, não do código).

## Correções desta revalidação (achados da primeira revisão que estavam errados)

Na primeira revisão eu só tinha olhado `tests/contract/auth_recovery.rs` e concluído que as tarefas 1.3, 1.4 e 1.5 estavam parcialmente ou não testadas. Isso estava **errado** — a cobertura existe, só está em `tests/contract/auth_session.rs`:

- **1.3** (`revoke_all_for_account`): há um teste dedicado, `revoke_all_for_account_can_preserve_one_session_or_none`, cobrindo exactamente o critério da tarefa (duas sessões, `except` preserva uma, sem `except` invalida ambas).
- **1.4** (WS por `session_id` e corrida handshake/revogação): há `revoked_websocket_closes_and_revoked_handshake_is_rejected`, um teste de WebSocket **real** (via `tokio_tungstenite`) que abre duas sessões, revoga uma, confirma o fecho do socket e a rejeição do handshake com cookie revogado, e ainda dispara uma conexão **concorrente** com a revogação para testar a corrida directamente. Isto é exactamente o que a tarefa pede — a nota que acrescentei no `tasks.md` dizendo que faltava esse teste estava incorrecta.
- **1.5** (`apply_identity_replacement`): há `identity_replacement_clears_recovery_and_rolls_back_on_handoff_failure`, que força rollback via trigger SQL e confirma que nada muda e nenhum evento sai antes do commit, depois confirma o caminho feliz completo (`has_recovery_key` muda para `false`, evento só depois do commit, `recovery_vault`/`recovery_ticket` limpos).
- **1.1/1.2**: confirmado em `docs/backlog/TR-item18-recuperacao-de-senha.md` §11 — há uma nota de estado de base datada (2026-10-08) com as contagens exactas (`10` unitários, `147` contrato, `1/1` integração com a falha pré-existente `server_isolation` nomeada) e a verificação da migração `0023` sobre cópia da BD real com `EXPLAIN QUERY PLAN` confirmando o uso do índice. Ambas cumprem o critério de verificação das próprias tarefas.

**Lição para o `/opsx:apply`:** 1.1–1.5 estão genuinamente prontas e verificadas — não precisam de retrabalho, só confirmação rápida. O esforço real que falta está concentrado em 1.6, 1.7, 4.1 e no frontend (abaixo).

## 1. Desenvolvimento do backend
**Veredito: Bloqueante** (mesmo achado da primeira revisão, reconfirmado)

- **Continua sem rate limit por conta em `POST /api/auth/recovery/code/redeem`.** Reconfirmei por grep: `RateLimiter::start_recovery_attempt` só é referenciado dentro do próprio `rate_limit.rs` (incluindo seus testes unitários, que testam o limiter isolado, não a rota). O handler em `recovery.rs` continua sem chamá-lo; handle inexistente ou sem reset activo nunca é limitado. Viola o requirement "Limitação de tentativas por conta" da spec.
- Resto da lógica (código, troca atómica, `apply_identity_replacement`) continua correcta e agora com cobertura confirmada mais ampla do que eu tinha achado na primeira revisão (ver acima).

## 2. Desenvolvimento do frontend
**Veredito: N/A (nada implementado ainda)** — reconfirmado, sem mudança.

- `auth.forgotVault`/`forgotVaultHelp` e `auth.recoveryWarning` ainda têm o texto antigo em `pt-BR.ts`/`en.ts` (D10 ainda não aplicado); nenhuma rota `/recover`, nenhum `Recover.tsx`, nenhum endpoint de recuperação em `frontend/src/api/endpoints/auth.ts`.

## 3. Deploy e operação
**Veredito: OK**, com a mesma ressalva de antes — `docs/operar-instancia.md` ainda não documenta `reset-code` (tarefa 2.4; reconfirmado por grep, zero menções).

## 4. Qualidade de código
**Veredito: Atenção** (melhor do que a primeira revisão indicava, mas ainda com lacunas reais)

- A cobertura de teste é mais sólida do que eu tinha relatado (ver correções acima). As lacunas que **continuam reais**:
  - Tarefa 2.3: os 3 testes de `auth_recovery.rs` cobrem sucesso/uso único/expirado/5 falhas/resposta uniforme; faltam senha curta, limpeza de recuperação anterior **no caminho do redeem especificamente**, falha induzida com rollback **do redeem** (o padrão de trigger SQL usado em `identity_replacement_clears_recovery_and_rolls_back_on_handoff_failure` já existe como modelo a copiar) e a corrida entre dois resgates do mesmo código.
  - Tarefa 3.1: só o caminho feliz testado; faltam senha actual errada e cofre de outra identidade.
  - `finish_credential_change` (D2) continua não existindo; `redeem_code` e `change_password` continuam duplicando a lógica transaccional em vez de um helper único — risco de divergência quando a Fase 2 adicionar um terceiro caminho.
- `cargo test --test contract`: 153/153 passam. `cargo test --test integration`/`--lib` continuam não compilando neste ambiente por falta do linker `cc` — limitação de ambiente, não do código; `docs/backlog/TR-item18-recuperacao-de-senha.md` §11 já documenta a baseline real (10 unitários, 147 contrato, 1 falha de integração pré-existente e nomeada) de uma execução anterior nesta máquina/sessão.

## 5. Execução das decisões arquiteturais
**Veredito: Atenção** — mesmo achado da primeira revisão, reconfirmado.

- D7 continua não implementada: `post_envelope`/`key_envelope::upsert` (reconfirmei: nenhum teste em `backend/tests/` cobre 409/guarda de envelope, só `tests/contract/key_envelopes.rs` para os fluxos de autorização já existentes) continuam gravando sem nenhuma verificação. O defeito de bifurcação do "Why" continua reproduzível.
- A nova linha em `design.md` (Risks/Trade-offs) sobre a coordenação unilateral com `bots-channel-key-integration` está registada, mas a acção (espelhar no outro change) ainda não foi feita — fora do escopo desta revisão de código, reportado também pelo Arquiteto.

## Bloqueantes antes de implementar
- Rate limit por conta (429), incluindo handles inexistentes, ausente em `POST /api/auth/recovery/code/redeem` (tarefa 1.6).
- D7 (guarda 409 do envelope do Servidor, tarefa 4.1) ainda não implementada.
- (Não bloqueante, mas notar) `cargo test` completo (lib + integration) não verificável neste ambiente por falta de `cc`; usar a baseline já documentada em `docs/backlog/TR-item18-recuperacao-de-senha.md` §11 como referência e confirmar num ambiente com toolchain completa antes de fechar a tarefa 8.4.

## Limitações técnicas a reportar ao Arquiteto
- Mesma de antes: D2 (`finish_credential_change`) não foi seguida na ordem real de implementação — confirmar se a Fase 2 deve esperar a tarefa 1.7 antes de abrir um terceiro caminho duplicado.
- Nenhuma limitação nova encontrada nesta revalidação.
