# Tasks

## 1. Backend

- [ ] 1.1 Implementar `GET /api/instance/status` (`{"initial_setup": bool}` via contagem de contas) sob `/api` em `api/mod.rs` (`/health` intacto), com balde de limite próprio `instance-status:{ip}`; verificar em `backend/tests/contract/instance_status.rs` (declarar em `tests/contract/mod.rs`; `TestApp::new()` parte de base vazia e `TestApp::register` cria a primeira conta): instância vazia, depois da primeira conta, 429 por IP com `rate_limit_disabled` desligado, e que `auth_register.rs` e `/health` continuam a passar sem alteração.

## 2. Frontend

- [ ] 2.1 Adicionar o endpoint em `frontend/src/api/endpoints` e a função pura `resolveSetupVariant` (estado da consulta + erro do servidor → `setup` | `normal`; 403 do servidor volta a `normal`; falha ou 429 da consulta → `normal`); verificar com `npm run build`, `npm run lint` e `npm run test:contracts`.
- [ ] 2.2 Criar `auth/InstanceSetupIntro.tsx` e ligá-lo a `pages/Auth.tsx`: consulta só na tela de cadastro e depois de haver URL de instância (no Electron, após `InstanceConnect`), `mode` forçado a registo com o seletor escondido, título e nota «sem permissões extras» primeiro, sem convite mesmo com `?invite=`, chave de recuperação com padrão «agora» no fluxo de dois passos existente, foco no título, regresso ao cadastro normal na corrida ou na falha da consulta; validar o layout a 360 px; verificar com `scripts/verify-instance-setup.mjs` (decisão da variante, convite ignorado só em `setup` e usado com a instância pronta, 403 → normal, falha/429 → normal) registado em `package.json` e fluxo manual numa base vazia (web e Electron).
- [ ] 2.3 Mostrar o selo «Administrador da instância» e a nota de «sem permissões extras» em `pages/Account.tsx` e a mensagem de boas-vindas única (aviso no topo de `Account.tsx` e toast no shell, marcador por conta em `localStorage` dentro de `try/catch`, já que `Auth` desmonta ao abrir a sessão); verificar com fluxo manual (primeira conta mostra selo e boas-vindas uma só vez, segunda conta não) e `npm run build`.
- [ ] 2.4 Textos i18n pt-BR/en, alinhando o termo («administrador da instância» na UI; «operador» só para o host); verificar com `npm run verify:i18n-keys` e `npm run verify:i18n`.

## 3. Documentação

- [ ] 3.1 Opcional no backend: `tracing::info!` quando a primeira conta é criada em `register_inner`; verificar nos logs de um `cargo test` ou execução manual.
- [ ] 3.2 Actualizar README, `docs/operar-instancia.md` (primeiro uso, `BIND=127.0.0.1` até criar a conta de administrador, diferença administrador/operador) e `docs/contratos-e-fluxos.md` (novo endpoint) e as ocorrências de «operador» usadas para a primeira conta (por exemplo `docs/operar-instancia.md`), mantendo «operador» só para quem acede ao host; verificar que o endpoint e os termos aparecem nos documentos e `CHANGELOG.md` regista a mudança.
