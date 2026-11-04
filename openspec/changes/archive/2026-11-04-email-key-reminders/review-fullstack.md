# Review — Desenvolvedor Fullstack

**Change:** email-key-reminders
**Data:** 2026-11-03
**Veredito geral:** Aprovado com ressalvas

Contexto lido: artefatos da change, `backend/src/api/{channels,invites,auth/register}.rs`, `backend/src/db/account.rs`, `domain/account.rs`, `frontend/src/pages/Account.tsx`, `frontend/package.json`.

## 1. Desenvolvimento do backend
Veredito: Atenção
- **`AccountRecord` e `ACCOUNT_COLS`.** `db/account.rs` tem uma lista fixa de colunas (`has_recovery_key` calculada) e `register_inner` constrói `AccountRecord` por literal. Duas colunas novas obrigam a atualizar o struct, a lista e todos os literais; sem isso não compila. Incluir na tarefa 1.1. As colunas de `email-registration` fazem o mesmo; combinar a ordem para não conflitar migrações (`0026` é dela; esta usa `0027`).
- **UPDATE condicional atómico:** `UPDATE account SET last_key_reminder_at=? WHERE id=? AND key_reminders=1 AND (last_key_reminder_at IS NULL OR last_key_reminder_at < ?)` e enviar só se `rows_affected()==1`. Especificar também a leitura de `has_recovery_key` no momento (a chave pode ter sido criada depois do cadastro).
- **Contagem vitalícia:** coluna `key_reminder_count` (teto 3) para a Decisão de cadência.
- **Envio fora do caminho crítico:** `tokio::spawn` depois da resposta 201 do canal; erro apenas logado. Dizer na task 2.3.
- **Gancho:** colocar no handler `create_channel`, não em `provision_channel`.
- **Preferência:** `PATCH /auth/key-reminders` precisa de corpo `{enabled: bool}` e resposta `AuthAccount` actualizada; igual ao padrão de `patch_display_name`.

## 2. Desenvolvimento do frontend
Veredito: Atenção
- `Account.tsx` já gere a criação da chave de recuperação (`recoveryCode`, `prepareRecoveryKey`); o interruptor entra na mesma tela. Confirmar a rota que o e-mail abre e que ela leva ao bloco da chave (âncora ou `#recovery`), senão o link não ajuda.
- Sem teste de componente no projeto: a task 3.1 já usa `build`, `lint`, `test:contracts` e `verify:i18n-keys`; OK.

## 3. Deploy e operação
Veredito: OK
- Flag `KEY_REMINDERS` e variáveis herdadas de `email-registration`; documentadas nas tasks 4.1. Logs herdam os campos de diagnóstico.

## 4. Qualidade de código
Veredito: Atenção
- Testes cobrem os casos principais. Acrescentar: teto vitalício; conta que cria a chave entre dois canais; criação de canal por convite/servidor automáticas não enviam; e que `create_channel` responde igual com o provedor falhado (servidor falso).
- Ficheiro `auth_key_reminders.rs` registado em `tests/contract/mod.rs`.

## 5. Execução das decisões arquiteturais
Veredito: OK
- Segue as decisões de `email-registration` (EmailSender, pós-commit, sem dados sensíveis em logs).

## Bloqueantes antes de implementar
- nenhum

## Limitações técnicas a reportar ao Arquiteto
- Cancelamento anónimo (um clique) exigiria segredo HMAC novo; adiado e registrado como trade-off.
