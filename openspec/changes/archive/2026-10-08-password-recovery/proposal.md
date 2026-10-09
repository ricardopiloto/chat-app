# Proposal

## Why

Hoje um utilizador que perde a password fica sem acesso à conta: não existe rota no backend nem ecrã no frontend para "esqueci a senha" (item 18 do backlog). O problema não é um reset convencional, porque a password é também a chave do cofre de identidade (`account.identity_vault`): trocar só o `password_hash` devolve login mas não devolve nenhum Servidor já sincronizado. Também não existe "alterar senha" com a antiga conhecida, e o botão actual "Recuperar identidade" só é alcançável com sessão activa, isto é, por quem ainda consegue entrar.

A análise (`docs/backlog/TR-item18-recuperacao-de-senha.md`) mostrou ainda um defeito pré-existente que o reset torna mais provável: depois de a identidade do **dono** de um Servidor ser substituída, `ensureServerKey` gera uma `server_key` nova em vez de esperar o handoff, e a chave do Servidor bifurca (o dono deixa de ler os outros e os outros deixam de o ler). Como o dono que perdeu a senha é o caso típico de reset, o defeito tem de ser corrigido na mesma demanda.

## What Changes

**Fase 1 — base comum + opção A (reset assistido pelo operador → nova identidade)**
- Novo subcomando de operador no binário do backend, `reset-code <handle>`, que emite um código de reset de uso único e validade curta (sem UI; a tela de admin é o item 19 do backlog).
- `POST /api/auth/recovery/code/redeem`: com handle + código + nova senha + novo par de chaves e cofre, troca `password_hash` e identidade (mesma lógica de `PUT /auth/identity`), revoga **todas** as sessões da conta e abre uma sessão nova.
- Revogação de todas as sessões de uma conta (hoje só existe a sessão actual) e fecho efectivo dos WebSockets das sessões revogadas.
- Limitação de tentativas **por conta**, além do limite por IP existente (que atrás de proxy é global).
- `PUT /api/auth/password` (autenticada, exige a senha actual): alterar senha re-embrulhando o cofre, sem mudar de identidade.
- Ecrã público "Esqueci a senha" (`/recover`), ligado ao link de login, que hoje diz "Esqueceu o cofre?" e só explica o desbloqueio.
- Correcção da copy de "Recuperar identidade", que hoje afirma que o histórico "deixará de ser legível" (não é verdade enquanto algum membro sincronizado reselar a chave) e não menciona a custódia da chave de voz.

**Fase 2 — opção B (chave de recuperação → recupera a identidade, sem handoff)**
- O cliente gera um código de recuperação aleatório (≥128 bit), mostrado uma única vez; dele derivam-se uma chave que embrulha a identidade e uma chave de assinatura. O servidor guarda só o verificador público; o código e a chave privada nunca chegam ao servidor.
- `POST /api/auth/recovery/key/challenge`, `.../key/start` e `.../key/redeem`: assinaturas de desafio e ticket de uso único provam posse do código sem prova estática reutilizável; o cliente re-embrulha a **mesma** identidade com a nova senha, mantendo `identity_pubkey` e envelopes.
- `PUT /api/auth/recovery-key` (autenticada, exige a senha actual): criar ou rodar a chave para contas existentes, **opcional** (sem bloqueio no login).
- Interstício pré-registo, com confirmação de guarda antes do POST (também no caminho de convite) e cartão "Chave de recuperação" / "Alterar senha" em "Minha conta".
- Novo formato criptográfico em `docs/v2/contracts/crypto-formats.md`, com vectores.

**Correcção da bifurcação da chave do Servidor (duas camadas)**
- Cliente: `ensureServerKey` só gera uma chave nova se o backend confirmar que não há nenhum envelope no escopo; caso contrário carrega o seu ou espera handoff.
- Servidor: `POST /api/servers/{id}/key-envelopes` aplica primeiro escritor vencedor numa transacção; recusa (409) novo envelope próprio quando existe chave no escopo e sobrescrita não idempotente do envelope próprio.

**Validação de escala (Servidores com 300+ membros)**
- Tarefas de medição com dados sintéticos (300 e 1000 membros) para o fan-out de `key_handoff.requested`, a manada de respostas de handoff, `replay_pending_handoffs`, a nova checagem do servidor e o `DELETE` de envelopes por conta (hoje sem índice em `account_id`).
- Critérios de aceitação numéricos; mitigação (fan-out limitado) implementada só se os critérios falharem.

Retrocompatibilidade: armazenamento, rotas e campos novos são aditivos. A guarda 409 e a limpeza de recuperação em `PUT /auth/identity` alteram rotas existentes; exigem testes de compatibilidade com clientes antigos, incluindo repetição e concorrência.

## Capabilities

### New Capabilities
- `auth/password-recovery`: reset de senha assistido por operador (código de uso único, CLI), recuperação por chave de recuperação, alteração de senha, revogação de sessões e limitação de tentativas por conta, do lado do servidor.
- `crypto/key-envelope-integrity`: garantia de que a chave de um Servidor não bifurca quando o envelope de um membro (em particular o dono) é refeito, e requisitos de escala do handoff para Servidores grandes.

### Modified Capabilities
- `frontend-v2/auth`: passa a existir o ecrã público "Esqueci a senha"; o registo (incluindo por convite) gera e apresenta a chave de recuperação; a copy de "Recuperar identidade" é corrigida.
- `frontend-v2/account`: "Minha conta" ganha "Chave de recuperação" e "Alterar senha" (hoje o requisito proíbe qualquer recuperação por e-mail/Passkeys; mantém-se, e acrescenta-se o que passa a ser permitido).
- `frontend-v2/crypto-contracts`: acrescenta o formato do cofre de recuperação, do verificador público e das assinaturas de desafio/ticket ao conjunto de formatos com vectores.

## Impact

- **Backend** (`backend/`): migração aditiva com número livre (`recovery_vault`, `recovery_verifier_pubkey`, `recovery_generation`, `recovery_set_at`, tabelas de reset/desafio/ticket e índice de envelope); rotas em `api/auth/`; `db/session.rs` (revogar todas); `rate_limit.rs` (balde por conta com cota); `api/key_envelopes.rs` (guarda transaccional); `main.rs` (subcomando); `ws/` (fecho por sessão); extracção da lógica de `put_identity` para função partilhada.
- **Frontend** (`frontend/`): `crypto/vault.ts` (derivação do código), `crypto/keyHandoff.ts` (correcção do dono), `session/session.tsx`, `pages/{Auth,Unlock,Account}.tsx`, nova página `Recover`, catálogos i18n `pt-BR` e `en`, router.
- **Contratos e docs**: `docs/v2/contracts/{crypto-formats,backend-change-policy}.md` e vectores; `specs/002-fase-1-mvp/contracts/` (REST); `docs/operar-instancia.md` (procedimento do operador); `docs/e2ee-gaps.md`.
- **Interacção com `bots-channel-key-integration`** (em curso, 0/30 tarefas): esse change move `key_envelope` para `(channel_id, account_id)` e reescreve o handoff. A Fase 2 (B) preserva envelopes; a Fase 1 (A), guarda, indicador de existência, cache, replay e escala exigem variante por canal, testes de ACL/canais privados e reconciliação do plano de migração/rollback.
- **Fora do reset humano**: item 17 (cópia de chave no servidor), item 19 (tela de admin, só registado), credenciais de contas de bot (não têm cofre nem senha); envelopes/handoff de bots são cobertos pela reconciliação por canal.
