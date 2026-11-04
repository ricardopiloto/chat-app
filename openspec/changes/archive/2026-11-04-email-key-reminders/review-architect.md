# Review — Arquiteto de Soluções

**Change:** email-key-reminders
**Data:** 2026-11-03
**Veredito geral:** Aprovado com ressalvas

Contexto lido: artefatos da change, `openspec/specs/auth/password-recovery/spec.md`, `docs/arquitetura-tecnica.md` §4.3, `docs/parecer-recuperacao-senha.md`, `backend/src/api/{channels,invites}.rs`, `backend/src/db/account.rs`, `domain/account.rs`, `frontend/src/pages/Account.tsx`.

## 1. Definição da arquitetura técnica
Veredito: OK
- Dois gatilhos pós-commit, um UPDATE condicional e um EmailSender já existente: simples e coerente com a stack. O pedido original (enviar a chave) foi convertido em lembrete sem chave, com justificativa correta (design.md, Decisão 1).
- Carga: um e-mail por conta nova e, no máximo, um por 24 h enquanto cria canais; irrelevante frente ao limite do provedor.

## 2. Integração com a infraestrutura existente
Veredito: OK
- Sem porta ou processo novo; migração aditiva (duas colunas em `account`). Depende de `email-registration` (e-mail verificado, `PUBLIC_BASE_URL`, `EmailSender`); declarar a ordem de implementação também em tasks.

## 3. Qualidade de arquitetura e trade-offs
Veredito: Atenção
- **Ponto de gancho do canal.** `channels::create_channel` é o handler HTTP; `channel_provision::provision_channel` é compartilhado (criação de servidor, canal de boas-vindas, etc.). Colocar o gatilho no handler, e dizer isso na spec/design, para que canais criados automaticamente não gerem e-mail.
- **Gancho do cadastro.** `register_inner` é reutilizado por `accept_invite` (conta nova via convite). Só contas com e-mail verificado recebem, o que na prática limita ao fluxo com `email_token`; dizer explicitamente para evitar a dúvida.
- **Cadência.** Um lembrete a cada 24 h por conta, para sempre enquanto não houver chave, vira aborrecimento. Acrescentar um teto vitalício (ex.: 3 lembretes de canal por conta).
- **Cancelamento.** O e-mail aponta para as definições (autenticado), sem cancelamento anónimo. Aceitável para aviso de segurança com teto, mas registrar como trade-off e não prometer «cancelar» no e-mail.
- Segurança: ausência de chaves nos e-mails e links só para `PUBLIC_BASE_URL` preservam as garantias de `password-recovery`/`crypto`. OK.

## 4. Documentação e decisões (ADRs)
Veredito: Atenção
- design.md rejeita três alternativas para o conteúdo (Decisão 1) mas não registra alternativas para o ponto de gancho (handler vs. `provision_channel`), para a frequência (24 h vs. única vez) nem para o cancelamento. Acrescentar.
- Sem diagrama; para dois gatilhos simples é aceitável.

## 5. Ponte entre produto e técnico
Veredito: Atenção
- O produto pediu enviar a chave por e-mail; a change entrega um lembrete. A proposta explica por quê; garantir que o produto aceita essa troca (já confirmada na decisão do usuário).
- Valor real depende de a pessoa conseguir criar a chave a partir do link: confirmar que `/account` (ou rota equivalente) existe e abre a criação da chave de recuperação.

## Bloqueantes antes de implementar
- nenhum
