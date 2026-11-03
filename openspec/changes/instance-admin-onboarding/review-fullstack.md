# Review — Desenvolvedor Fullstack

**Change:** instance-admin-onboarding
**Data:** 2026-11-03
**Veredito geral:** Aprovado com ressalvas

Contexto lido: artefatos da change, `review-architect.md`, `backend/src/api/mod.rs`, `backend/src/api/invites.rs` (`handle_available`), `backend/src/db/account.rs` (`count`), `backend/src/rate_limit.rs`, `backend/tests/common/mod.rs`, `frontend/src/pages/{Auth,Account}.tsx`, `frontend/src/auth/{RecoverySetup,InstanceConnect}.tsx`, `frontend/package.json`. Sem CI de testes; a verificação é `cargo test` e `npm run build/lint/verify:*/test:contracts`.

## 1. Desenvolvimento do backend
Veredito: OK
- Implementável com o que existe: `db::account::count` já serve, a rota entra em `api::router` sob `/api` (junto de `auth::router()`), `/health` fica intacto na raiz. Sem migração, sem alterar `register`.
- **Limite por IP:** copiar o padrão de `handle_available` (`allow_handle_check`); essa função cria a chave `handle-check:{ip}`, então usar um balde novo (`instance-status:{ip}`) para não consumir o balde de verificação de handle. Atrás de proxy o IP é o do Nginx (ponto já levantado pelo arquiteto); testar com `MESA_RATE_LIMIT_DISABLED` desligado, como em `auth_rate_limit.rs`.
- Resposta `{"initial_setup": bool}`; sem cache. Em erro de base, 500 como os outros handlers; o cliente tem fallback.
- Teste: `TestApp::new()` cria base vazia, logo cobre os dois estados chamando `TestApp::register` entre as consultas; registar o módulo em `tests/contract/mod.rs` (a task 1.1 já cita o ficheiro; falta dizer que se regista).

## 2. Desenvolvimento do frontend
Veredito: Atenção
- **Onde entra a variante.** `pages/Auth.tsx` já concentra login, registro, convite e `RecoverySetup`; acrescentar a variante inicial no mesmo componente aumenta uma tela já densa. Extrair a decisão para uma função pura (`resolveSetupVariant`) e a apresentação para um componente (`auth/InstanceSetupIntro.tsx` com título, explicação do papel e aviso), mantendo `Auth.tsx` com poucas linhas novas.
- **Segmented login/registro.** Em `initial_setup` não faz sentido oferecer «Entrar»; a variante deve forçar `mode = register` e esconder o `Segmented` (hoje sempre visível). Dizer na task 2.2 e na spec (nenhum cenário trata o seletor).
- **Chave de recuperação «em destaque».** `recoveryChoice` começa em `"later"` e a opção «agora» obriga a um primeiro submit que gera a chave e um segundo que envia (`recoveryDraft`, `recoverySaved`). Para a variante inicial definir: padrão `"now"` e rótulos adaptados, reaproveitando o mesmo fluxo de dois passos. Detalhar na task 2.2.
- **Consulta do estado.** Fazê-la só depois de haver URL de instância (no Electron, depois de `InstanceConnect`), e só quando o modo registro é aberto ou a tela é a de cadastro, para não chamar a cada render nem no login. Tratar 429/erro como «normal» (spec já cobre).
- **Boas-vindas «uma vez».** Depois do cadastro `Auth` desmonta (o `Gate` troca para o shell), então a mensagem não pode viver em `Auth`. Definir o local: aviso na `Account.tsx` e/ou toast/banner no shell, com o marcador em `localStorage` (conveniência, com `try/catch` pois pode estar bloqueado) por conta. Hoje a task 2.3 não diz onde.
- **Selo e nota na conta.** `Account.tsx` tem secção `#profile`; o selo cabe no cabeçalho do perfil, usando `me().is_initial_operator` (já em `types.ts:19`). OK.
- Sem teste de componente no projeto: a task 2.2 usa `verify-instance-setup.mjs` sobre a função pura; correto, desde que a decisão esteja realmente isolada na função.
- Responsividade e acessibilidade: a spec exige 360 px na task; acrescentar foco no título da variante e `role`/ordem de leitura do aviso.

## 3. Deploy e operação
Veredito: OK
- Sem porta, serviço ou variável nova. Docs na task 3.1. Observabilidade: não precisa de log próprio; vale um `tracing::info!` quando a primeira conta é criada («instância configurada»), útil para depurar «quem reclamou a instância» (backend, `register_inner`, ponto trivial e opcional).

## 4. Qualidade de código
Veredito: Atenção
- Cobrir a corrida do fallback: teste de contrato do `register` que prova a recusa do convite em falta na segunda conta já existe; a variante da UI depende desse erro 403, então a função pura de decisão deve ter um caso «403 do servidor → voltar ao cadastro normal».
- `?invite=` ignorado só quando `initial_setup`; testar que com a instância pronta o convite continua a ser usado.
- Não há refactor não declarado, desde que a decisão da variante fique em função pura (ver §2).
- i18n: atualizar também as strings que dizem «operador» para a primeira conta, listadas pela task 2.4; usar `verify:i18n-keys` e `verify:i18n` já existentes.

## 5. Execução das decisões arquiteturais
Veredito: OK
- A change respeita as decisões do projeto (backend como fonte de verdade, `is_initial_operator` mantido, sem alterações ao contrato de registro). A limitação do limite por IP atrás de proxy é a mesma já registrada em `email-registration`.

## Bloqueantes antes de implementar
- nenhum

## Limitações técnicas a reportar ao Arquiteto
- Limite por IP do endpoint atrás do Nginx é global (mesmo ponto de `email-registration`); se `RealClientIp`/`TRUSTED_PROXY` forem implementados antes, usar o mesmo extractor aqui.
- A mensagem de boas-vindas «uma vez» depende de armazenamento local, que pode estar bloqueado; aceitável por ser conveniência.
