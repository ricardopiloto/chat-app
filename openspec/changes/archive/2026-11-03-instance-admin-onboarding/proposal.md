## Why

Numa instância recém-criada (sem nenhuma conta), a primeira pessoa a se cadastrar torna-se, sem que isso seja dito, o administrador da instância (`is_initial_operator`). Hoje a tela de cadastro é igual à de qualquer outro usuário, e a pessoa não sabe que está criando a conta que, no futuro, administrará a instância. Isso importa sobretudo no self-host local, em que a pessoa instala a instância na própria máquina e usa só o cliente: ela precisa saber que esta conta é a de administração e cuidar dela (senha forte, chave de recuperação).

## What Changes

- Novo endpoint público `GET /api/instance/status` que informa se a instância está em **configuração inicial** (nenhuma conta existe). Muda sozinho para «pronta» assim que a primeira conta é criada.
- Quando a instância está em configuração inicial, o cliente mostra um cadastro específico: título «Configurar a instância / Criar a conta de administrador», texto que explica o papel, ausência do campo de convite (que não se aplica à primeira conta) e criação da chave de recuperação recomendada de forma destacada.
- Depois do cadastro, a conta mostra o selo «Administrador da instância» na tela de conta e uma mensagem de boas-vindas única que explica o que é e o que ainda não faz.
- **Sem efeito de permissões por ora**: a conta de administrador não ganha nenhum acesso diferente. O marcador `is_initial_operator` já existente continua a ser a base; a UI passa a chamá-lo «Administrador da instância» (o termo «operador» fica para o operador no host, na CLI).
- Preparação para o futuro: a administração da instância (configuração e gestão sem entrar em nenhum servidor) será uma change própria; esta change só fixa o conceito, o termo e o marcador.

Fora de escopo: qualquer permissão ou tela administrativa, transferência ou promoção de administradores, token de setup, painel de configuração da instância.

## Capabilities

### New Capabilities
- `auth/instance-admin-onboarding`: estado de configuração inicial da instância, cadastro guiado da conta de administrador e a identificação dessa conta na interface.

### Modified Capabilities

## Impact

- Backend: novo handler `GET /api/instance/status` (`api/mod.rs`), usando a contagem de contas que `register_inner` já usa; sem migração e sem alterar `register`.
- Frontend (`frontend/`, SPA e Electron): `pages/Auth.tsx` (variante de configuração inicial), `api/endpoints`, tela de conta (selo), i18n pt-BR/en, script de verificação.
- Docs: README (primeira conta = administrador), `docs/operar-instancia.md` (primeiro uso e exposição antes da configuração), `docs/contratos-e-fluxos.md`.
- Compatível com `email-registration`: a primeira conta continua isenta de convite e de e-mail verificado.
