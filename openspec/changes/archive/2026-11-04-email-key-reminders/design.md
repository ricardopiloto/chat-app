# Design

## Context

O E2EE gera a identidade no cliente; o servidor guarda só o cofre cifrado pela senha e, opcionalmente, o `recovery_vault` cifrado pelo código de recuperação (`openspec/specs/auth/password-recovery`). As chaves de canal chegam aos membros em envelopes cifrados para a identidade de cada um (`key_envelope`). Logo o servidor não possui chaves em claro para enviar, e um e-mail com elas quebraria o contrato de `crypto-contracts`/`password-recovery` («o servidor SHALL NOT receber a chave secreta de identidade ou o código de recuperação»). Ver proposal.md.

## Goals / Non-Goals

**Goals:**
- Lembrar, no momento certo, de criar e guardar a chave de recuperação.
- Não aumentar a superfície de segredos: os e-mails são só texto e links.

**Non-Goals:**
- Qualquer envio de chave, cifrada ou não; deep link para abrir o cliente; digest periódico.

## Decisions

1. **Sem material de chave nos e-mails.** *Alternativas rejeitadas:* chave de recuperação em claro por e-mail — o servidor e o provedor passam a vê-la e a caixa de entrada vira ponto único de falha; chave cifrada pela senha — o servidor teria de receber o código de recuperação do cliente, contra a spec; chave de canal — inútil para acesso e expõe o canal.
2. **Gatilho do cadastro:** `register_inner` agenda o e-mail só **depois do commit**, em background, para contas com e-mail verificado (na prática, só o cadastro com `email_token`; `register_inner` também serve `accept_invite`, que cria contas sem e-mail e não envia nada). Conteúdo: boas-vindas, estado da chave (`has_recovery_key`) e link para `PUBLIC_BASE_URL/account`.
3. **Gatilho do canal:** o **handler** `channels::create_channel` (não `channel_provision::provision_channel`, que também serve a criação de servidores e canais de boas-vindas) agenda o lembrete depois da resposta, num `tokio::spawn`, ao criador, se: `key_reminders` está activo, `has_recovery_key` é falso no momento, `key_reminder_count < 3` e `last_key_reminder_at` é nulo ou anterior a 24 h. A reserva é um `UPDATE … SET last_key_reminder_at=?, key_reminder_count=key_reminder_count+1 WHERE id=? AND key_reminders=1 AND key_reminder_count<3 AND (last_key_reminder_at IS NULL OR last_key_reminder_at<?)` e o e-mail só sai se `rows_affected()==1`. Falhas de envio nunca afectam a criação do canal. *Alternativas rejeitadas:* gancho em `provision_channel` — enviaria e-mail por canais automáticos; um único lembrete vitalício — deixa de ajudar quem ignora o primeiro; um por canal — spam.
4. **Preferência por conta.** `account.key_reminders` (padrão 1) e `PATCH /auth/key-reminders {enabled}`, que devolve `AuthAccount`; cada e-mail aponta para a página de conta, onde está o interruptor e a criação da chave. Sem cancelamento anónimo nesta change (exigiria um segredo HMAC novo); trade-off aceite por serem avisos de segurança com teto de 3 e só para contas sem chave.
5. **Interruptor só com o recurso activo.** `GET /api/auth/register/config` (já público e usado pelo cliente) ganha o campo aditivo `key_reminders: bool`, com o valor da flag `KEY_REMINDERS`; `Account.tsx` só mostra o interruptor quando é verdadeiro, para não oferecer um controlo sem efeito. A preferência continua a ser guardada e editável pela API independentemente da flag. *Alternativa rejeitada:* campo novo em `AuthAccount` — o estado da instância não pertence à conta.
6. **Reutiliza** `EmailSender`, logs sem e-mail/token e `PUBLIC_BASE_URL` de `email-registration`.

## Risks / Trade-offs

- [Spam percebido por quem cria muitos canais] → tecto de 1/24 h por conta e só enquanto não há chave.
- [Pessoa acredita que o e-mail contém a chave] → texto explícito: «nós nunca recebemos nem enviamos a sua chave».
- [Phishing a imitar o lembrete] → o e-mail nunca pede senha nem código e só liga a `PUBLIC_BASE_URL`.

## Migration Plan

Migração aditiva `0027` (três colunas; depois da `0026` de `email-registration`). Sem `email-registration` não há contas com e-mail, logo inerte. Rollback: `KEY_REMINDERS=false` na configuração da instância.

## Open Questions

- Redacção final dos textos; não altera specs.
