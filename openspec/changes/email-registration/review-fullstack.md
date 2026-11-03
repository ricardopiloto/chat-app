# Review — Desenvolvedor Fullstack

**Change:** email-registration
**Data:** 2026-11-03
**Veredito geral:** Bloqueado

Contexto lido: `backend/Cargo.toml`, `src/{lib,config,rate_limit,error}.rs`, `api/auth/{mod,register}.rs`, `domain/account.rs`, `backend/tests/{common,contract}`, `frontend/package.json`, `frontend/src/{api,pages,session}`, `frontend/scripts/`, `.github/workflows/desktop-release.yml`, `docs/operar-instancia.md`. Não há CI de testes (só o workflow de release desktop); o gate de qualidade são `cargo test` e os scripts `npm run build/lint/verify:*`.

## 1. Desenvolvimento do backend
Veredito: Atenção
- **Cobertura sólida do contrato**: endpoints, transação com consumo do token, índice único parcial e erro de conflito estão claros o bastante para codar (design.md, Decisões 1–4).
- **`Config` é construído por literal em testes.** `backend/src/token/mod.rs:48` e `backend/tests/contract/production_boot.rs:7` listam todos os campos; adicionar 8 campos novos (tarefa 1.1) quebra a compilação desses testes. Incluir na tarefa 1.1 a atualização desses literais (ou um `Default`/`..` para testes) e a verificação por `cargo test`.
- **`AppState` também ganha campo** (`Arc<dyn EmailSender>`) e é construído em `build_state` e no `TestApp`; falta dizer como o teste injeta o `LogSender` e lê o link (hoje `TestApp::with_config` só customiza `Config`). Especificar o ponto de injeção (ex.: `EMAIL_LOG_FILE` em diretório temporário, ou um sender em memória exposto no `TestApp`).
- **Ordem de erros do cadastro.** `register_inner` hoje valida convite antes do handle. Com token, a precedência (token inválido vs. handle duplicado vs. e-mail já usado vs. convite inválido) não está especificada; o cenário «convite inválido + token válido» não existe. Definir a tabela de precedência na spec, senão cada pessoa decide diferente e os testes ficam ambíguos.
- **Corrida no consumo do token**: `UPDATE … WHERE consumed_at IS NULL` com checagem de 1 linha dentro de `BEGIN IMMEDIATE` está correto; o índice único de e-mail cobre a corrida entre dois tokens do mesmo e-mail. Mapear a violação para um código estável (`conflict_code`) para o frontend distinguir de «handle ocupado».
- **Resposta `202` e estado de erro.** `ApiError` não tem 202 nem helper de 429 com código; `too_many_requests()` existe. Definir o corpo (`{"ok": true}`) e usar `ApiError::bad_request_code` com códigos estáveis (`registration_closed`, `terms_required`, `email_domain_blocked`) para o frontend mapear mensagens sem texto livre.
- **Dependências**: nenhuma crate nova obrigatória; `reqwest` serve Resend e Turnstile. Para o JSON do pedido basta `serde`. OK.

## 2. Desenvolvimento do frontend
Veredito: **Bloqueante**
- **Não existe framework de teste de componente.** `frontend/package.json` não tem vitest/jest/testing-library; a verificação é feita por scripts `scripts/verify-*.mjs` e `test:contracts`. As tarefas 5.1–5.3 exigem «teste de componente», que não é executável hoje. Reescrever a verificação em termos do que existe: `tsc --noEmit` (build), `eslint`, um `verify-email-registration.mjs` no padrão dos outros, extensão de `scripts/contracts` para os novos endpoints, e fluxo manual documentado. Ou declarar a introdução de um harness como tarefa própria.
- **Roteamento**: `Auth.tsx` trata `/invite/:code` e `?invite=`; o `?email_token=` (ou o fragmento, ver review do arquiteto) precisa de leitura na mesma página e de limpeza do URL com `history.replaceState`. A tarefa 5.3 cobre, mas o fragmento exige ler `location.hash`, que o `useLocation` do router não expõe como `search` — registrar.
- **Fluxo e estado de `Auth.tsx`** já é denso (modo login/register, rascunho de recuperação, convite). O passo «pedir e-mail» deve virar componente separado para não inflar o arquivo; hoje a tarefa 5.2 não diz onde fica. Indicar `auth/EmailRequest.tsx`.
- **Tipos e i18n**: `RegisterBody` (`api/types.ts:28`) e `session.register` precisam do campo `email_token`/`emailToken`; os catálogos i18n e `verify:i18n-keys` já existem e podem validar a 5.4. OK.
- **Cliente desktop (Electron)**: registro por e-mail termina na web; no desktop o passo «pedir e-mail» abriria com a instância configurada. Decidir se o desktop mostra o pedido (o e-mail chegaria a um link web) ou só o login.
- **Responsividade**: a tela de auth já tem layout próprio (`AuthFrame`); nenhuma tarefa menciona mobile. Atenção menor: validar 360 px.

## 3. Deploy e operação
Veredito: **Bloqueante**
- **Limite por IP não funciona atrás do Nginx** (`rate_limit.rs` ignora `X-Forwarded-For`; `docs/deploy-producao.md` admite que todos chegam como `127.0.0.1`). O balde de 5/hora vira global; um atacante bloqueia o registro de todos e, no mesmo balde `allow_auth`, não mexemos — mas o novo balde precisa de chave real. Mesmo ponto bloqueante do arquiteto; sem decisão não há como implementar a tarefa 3.1.
- **Variáveis novas** estão listadas em 1.1/1.3, mas falta o **trecho Nginx** (cabeçalho do IP real, `limit_req` se for a escolha) e a nota de que `PUBLIC_BASE_URL` deve coincidir com o domínio servido pelo Nginx. Acrescentar à tarefa 1.3.
- **Observabilidade**: o design promete logs sem token/e-mail, mas não define o que é registrado para depurar «não recebi o e-mail» (código HTTP do Resend, id do envio, hash curto do canónico). Definir campos de log e uma linha no runbook de como diagnosticar.
- **Arranque**: a limpeza periódica e o `tokio::spawn` entram em `main.rs` ao lado do `spawn_stale_occupancy_sweeper`; padrão existente, OK. Migração `0026` roda no `db::bootstrap`; OK.
- **Segredos**: `EMAIL_API_KEY` e `TURNSTILE_SECRET` nunca podem aparecer no `Debug` de `Config` (a struct deriva `Debug`). Exigir redação (tipo `Secret` ou `Debug` manual); hoje seria vazado em qualquer `{:?}`.

## 4. Qualidade de código
Veredito: Atenção
- `tasks.md` segue o padrão do projeto (testes de contrato em `backend/tests/contract`, um arquivo por tema) e cada tarefa traz verificação. Falta **arquivo de teste nomeado**: sugerir `auth_email_registration.rs` e registrá-lo em `tests/contract/mod.rs`.
- **Testes de tempo/expiração**: tokens de 5 h e limpeza de 24 h precisam de relógio controlável ou inserção direta de `expires_at` no teste; dizer qual (inserção direta via `pool`, como nos testes de convite).
- **Resiliência**: Resend fora do ar, timeout e resposta não-2xx estão no desenho (nunca propaga), mas não há tarefa que teste a falha do provedor com `ResendSender` (mock HTTP). Acrescentar teste com servidor local falso.
- **Concorrência SQLite**: o `tokio::spawn` do pedido escreve na tabela enquanto outros pedidos escrevem; o `bootstrap` já usa pool único/`BEGIN IMMEDIATE`; confirmar `busy_timeout` e não segurar a transação durante a chamada HTTP ao Resend (gravar, commit, depois enviar). Incluir na tarefa 3.3.
- **Refactor não declarado**: tornar `Config` extensível e injetar `EmailSender` toca `lib.rs`, `main.rs` e `TestApp`; é pequeno, mas deve constar no design.

## 5. Execução das decisões arquiteturais
Veredito: **Bloqueante**
- A implementação revela duas limitações que a arquitetura não endereça (detalhe abaixo): IP real atrás do proxy e token em log de proxy. Ambas já estão no review do arquiteto; aqui confirmam-se como **impeditivas** para a tarefa 3.1 e 5.3.
- As demais decisões (token hash, tabela própria, modo, resposta genérica) são implementáveis como escritas e coerentes entre design, spec e tasks.
- A tarefa 4.3 («confirmar conta sem servidor») está pendente de verificação, mas o estado vazio `noServers` já existe em `shell/Content.tsx`; baixar para checagem manual.

## Bloqueantes antes de implementar
1. Decisão sobre o IP real do cliente atrás do Nginx (balde por IP hoje seria global) e a especificação correspondente (config, validação, trecho Nginx).
2. Reescrever as verificações do frontend (5.1–5.3) para o que o projeto tem (`tsc`, `eslint`, `verify-*.mjs`, `test:contracts`), ou prever o harness de componentes como tarefa.
3. Definir a tabela de precedência de erros do cadastro (token × convite × handle × e-mail) e os códigos de erro estáveis.
4. Tarefa 1.1 incluir: atualizar literais de `Config` (`token/mod.rs`, `production_boot.rs`), `AppState`/`TestApp` e a redação de segredos no `Debug`.

## Limitações técnicas a reportar ao Arquiteto
- IP do cliente atrás do Nginx: o limite por IP do design não é implementável como escrito.
- Token na query: fica no access log do Nginx; precisa de fragmento ou outro canal.
- Segredos em `Config` derivando `Debug`: decidir o padrão de redação para a instância.
- Desktop (Electron): onde o pedido de e-mail acontece e como o link volta ao cliente.
