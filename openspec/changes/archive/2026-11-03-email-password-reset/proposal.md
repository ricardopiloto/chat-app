## Why

Quem esquece a senha hoje precisa lembrar o handle e ter a chave de recuperação, ou pedir ao operador um código de reset. Com e-mail verificado na conta (change `email-registration`), a pessoa pode começar a recuperação só com o e-mail: recebe uma mensagem com o seu handle e um link para a tela de recuperação por chave, onde a chave (que só ela tem) faz o resto. O servidor continua sem conhecer qualquer chave e o e-mail sozinho **nunca** repõe uma senha.

## What Changes

- Novo pedido público «esqueci a senha» com o e-mail; resposta sempre genérica, sem revelar se o e-mail tem conta.
- Conta com e-mail verificado **e** chave de recuperação: recebe um e-mail com o handle e um link para `…/recover#handle=…`, que abre a tela `Recover` já no caminho «com a chave» e com o handle preenchido. A senha só é reposta com o código de recuperação, pelo fluxo por chave existente (identidade e histórico preservados).
- Conta com e-mail verificado **sem** chave de recuperação: recebe um e-mail que diz que não há chave, que o reset exige o código do operador, e como criar a chave depois de entrar. Nenhum link de reset.
- O e-mail **não** autoriza reset nenhum: não há token, nem reset de senha ou de identidade só por e-mail. Motivo: uma identidade nova faria os clientes online entregarem automaticamente as chaves de servidor a quem controla a caixa de e-mail.
- Concluído um reset (por chave ou por código do operador), a conta com e-mail verificado recebe um aviso.
- Mesma protecção do registo: limites por IP (`TRUSTED_PROXY`) e por e-mail, resposta uniforme, honeypot.

Fora de escopo: reset por e-mail sem chave (fica para a futura administração da instância, em `docs/backlog/backlog.md` item 19: exige aprovação humana do handoff ou período de espera), qualquer token de reset, enviar ou guardar chaves por e-mail, adicionar e-mail a contas existentes.

## Capabilities

### New Capabilities
- `auth/email-password-reset`: pedido de recuperação por e-mail que encaminha para o fluxo com chave, sem autorizar o reset por si só, e o aviso de senha alterada.

### Modified Capabilities

## Impact

- Depende de `email-registration` (EmailSender, colunas de e-mail, `RealClientIp`, baldes, `TRUSTED_PROXY`) e dá valor ao `email-key-reminders`.
- Backend: um endpoint `POST /auth/recovery/email/request` e o aviso pós-reset nos dois caminhos de reset; sem tabela nova e sem alterar `key/*`, `finish_credential_change` nem `CredentialWrite`.
- Frontend: `pages/Recover.tsx` (e sub-componente de pedido), `api/endpoints/auth.ts`, i18n, script de verificação.
- Docs: `docs/parecer-recuperacao-senha.md`, `contratos-e-fluxos.md`, runbook.
- Contas sem e-mail verificado não são afectadas.
