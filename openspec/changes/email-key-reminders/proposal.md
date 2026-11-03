## Why

Num produto com E2EE, perder a chave de recuperação significa perder o histórico, e hoje nada lembra a pessoa de a guardar. Com e-mail verificado na conta (change `email-registration`), o sistema pode lembrá-la nos momentos certos — depois do cadastro e ao criar um canal — **sem nunca enviar uma chave por e-mail**: enviar chaves pelo servidor e pelo provedor de e-mail anularia o E2EE, e uma chave de canal enviada não daria acesso ao canal, que depende do envelope cifrado para a identidade de cada membro.

## What Changes

- Depois de o cadastro ser concluído, e-mail de boas-vindas à conta com e-mail verificado, com um lembrete de criar e guardar a chave de recuperação (texto diferente se a conta já a tem) e um link para a página de conta.
- Quando a conta cria um canal, e-mail de lembrete ao criador explicando que o acesso às mensagens do canal depende da identidade e da chave de recuperação, **apenas se a conta ainda não tem chave de recuperação**, no máximo um por 24 horas e três no total por conta. Só criações de canal pela API de canais do utilizador contam; canais criados automaticamente (servidor novo, boas-vindas) não.
- Nenhum e-mail contém chaves, códigos de recuperação, segredos de identidade ou chaves de canal; o servidor continua sem os conhecer.
- Preferência `key_reminders` por conta (activa por omissão), alterável nas definições autenticadas; os e-mails indicam onde, sem cancelamento anónimo.

Fora de escopo: enviar ou guardar qualquer chave por e-mail, chave cifrada em e-mail, notificações a outros membros do canal.

## Capabilities

### New Capabilities
- `auth/email-key-reminders`: e-mails de lembrete sobre a chave de recuperação após cadastro e criação de canal, e a preferência para os desligar.

### Modified Capabilities

## Impact

- Depende de `email-registration` (EmailSender, e-mail verificado) e usa `has_recovery_key` da change de recuperação existente.
- Backend: colunas `key_reminders`, `last_key_reminder_at` e `key_reminder_count` em `account` (migração `0027`, depois da `0026` de `email-registration`), com `AccountRecord`/`ACCOUNT_COLS` actualizados; ganchos em `register_inner` (após commit) e no handler `channels::create_channel` (não em `provision_channel`); endpoint para a preferência.
- Frontend: opção nas definições da conta, i18n.
- Docs: `contratos-e-fluxos.md`, `arquitetura-tecnica.md` §4.3 (e-mails não carregam chaves), runbook.
