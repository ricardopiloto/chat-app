# Design

## Context

`register_inner` (`backend/src/api/auth/register.rs`) conta as contas dentro da transacção `BEGIN IMMEDIATE`: com `count == 0` não exige convite e grava `is_initial_operator = true`. Esse booleano já viaja em `AuthAccount` e em `frontend/src/api/types.ts`. A UI (`pages/Auth.tsx`) mostra o mesmo cadastro em todos os casos e os textos falam em «operador» tanto para quem corre a instância no host (CLI `reset-code`) como para a primeira conta. No cliente Electron a instância é escolhida em `InstanceConnect` (verificada por `GET /health`). Não existe hoje nenhum endpoint que diga se a instância está vazia.

## Goals / Non-Goals

**Goals:**
- A pessoa que cria a primeira conta sabe, antes de submeter, que cria a conta de administrador da instância.
- O estado «configuração inicial» é derivado do dado (nenhuma conta), sem flag nova para manter.
- Fixar o termo e o marcador para a futura administração da instância.

**Non-Goals:**
- Permissões, telas ou API administrativas; vários administradores; transferir o papel.
- Proteger a instância recém-criada contra quem a alcance primeiro (token de setup) — ver Riscos.
- Mudar o contrato de `POST /auth/register`.

## Decisões

1. **Estado derivado, endpoint próprio.** `GET /api/instance/status` → `{"initial_setup": bool}`, `true` quando `db::account::count == 0`. Sem tabela nem flag de configuração. *Alternativas rejeitadas:* acrescentar o campo a `/health` — `/health` é usado como sonda de disponibilidade pelo cliente e por operações, e mudar o seu corpo arrisca clientes antigos; campo em `/auth/register/config` (de `email-registration`) — criaria dependência entre as changes sem necessidade.
2. **Divulgação aceitável.** O estado é público e não autenticado porque o cliente precisa dele antes do login; revela apenas se a instância está vazia, o que já é inferível tentando registar. Limite por IP com um balde próprio (`instance-status:{ip}`, no padrão de `allow_handle_check`, sem consumir o de verificação de handle) para impedir varredura. Atrás do Nginx o IP é o do proxy e o limite é global (mesma limitação de `email-registration`); quando `RealClientIp`/`TRUSTED_PROXY` existirem, usar o mesmo extractor aqui. O endpoint **não** deve ser tratado como sinal de segurança. Entra em `api::router` sob `/api`; `/health` não muda.
3. **A UI decide pela API, não pelo URL, em código isolado.** A decisão fica numa função pura `resolveSetupVariant` (estado da consulta + erro do servidor → `setup` | `normal`) e a apresentação num componente `auth/InstanceSetupIntro.tsx`; `Auth.tsx` ganha poucas linhas. A consulta só ocorre depois de existir URL de instância (no Electron, depois de `InstanceConnect`) e só na tela de cadastro, não no login. Se `initial_setup`: força `mode = register` e esconde o seletor «Entrar / Cadastrar» (não há contas para entrar), mostra título, explicação do papel e a nota «por ora sem permissões extras» em primeiro lugar, sem campo de convite (mesmo que venha `?invite=`), e a chave de recuperação com padrão «agora» (reaproveitando o fluxo de dois passos de `RecoverySetup`/`recoveryDraft`). O foco inicial vai para o título da variante. Se a consulta falhar ou der 429, mostra o cadastro normal (a regra do backend continua a ser a fonte de verdade). Corrida: se outra pessoa criar a primeira conta entre a consulta e o envio, o backend recusa por convite em falta (403) e `resolveSetupVariant` devolve `normal`; com a instância já pronta, `?invite=` continua a ser usado. *Alternativa rejeitada:* acrescentar tudo a `Auth.tsx` — já concentra login, registo, convite e recuperação.
4. **Termo: «Administrador da instância»** na interface; `is_initial_operator` mantém-se no contrato (renomear seria uma quebra). «Operador» fica para a pessoa no host (CLI, runbook). No self-host local as duas coincidem, e o texto da variante diz isso.
5. **Selo e boas-vindas na conta.** `Account.tsx` mostra o selo quando `is_initial_operator` é verdadeiro, com texto «esta conta administrará a instância; por ora não tem permissões extras». Como `Auth.tsx` desmonta assim que a sessão abre, a mensagem de boas-vindas não vive nela: aparece uma vez como aviso no topo de `Account.tsx` e como toast no shell, com o marcador por conta em `localStorage` (só conveniência, em `try/catch` porque pode estar bloqueado).
6. **Relação com o backlog e com outras specs.** A futura administração está no item 19 de `docs/backlog/backlog.md`; o termo «operador» da spec `password-recovery` designa quem tem acesso ao host (CLI `reset-code`) e permanece, enquanto a UI passa a dizer «administrador da instância» para a conta. A mesma limitação de IP atrás de proxy está registada em `email-registration`.
7. **Ponto de extensão.** A futura administração usará `is_initial_operator` (ou um papel de instância derivado dele) e não dependerá de pertencer a servidores: nenhuma lógica desta change associa a conta de administrador a um servidor.

## Riscos / Trade-offs

- [Instância exposta antes da configuração pode ser «reclamada» por quem chegar primeiro] → já é verdade hoje; a variante da UI avisa para configurar antes de expor, o runbook manda manter `BIND=127.0.0.1` até criar a conta. Um token de setup fica como change futura (backlog, item 19), e o endpoint não é um mecanismo de segurança. Opcional: um `tracing::info!` quando a primeira conta é criada, para depurar quem configurou a instância.
- [Termo «administrador» gera expectativa de poderes] → o texto diz explicitamente que por ora não há permissões extras.
- [Varredura do endpoint] → limite por IP; resposta mínima.
- [Cliente antigo] → ignora o endpoint e continua a funcionar.

## Plano de migração

Sem migração. Rollback: o cliente volta a mostrar o cadastro normal ignorando o endpoint.

## Questões em aberto

- Texto final dos avisos; não altera a spec.
