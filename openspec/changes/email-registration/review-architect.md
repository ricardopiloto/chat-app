# Review — Arquiteto de Soluções

**Change:** email-registration
**Data:** 2026-11-03
**Veredito geral:** Bloqueado

Contexto lido: README, `docs/arquitetura-tecnica.md`, `docs/deploy-producao.md`, `docs/operar-instancia.md`, `backend/src/{config,rate_limit}.rs`, `api/auth/*`, `api/mod.rs`, `openspec/specs/auth/*`. A stack proposta (Rust/axum/sqlx/reqwest) é a existente; não há dependência nem processo novo além do HTTP de saída para Resend/Turnstile.

## 1. Definição da arquitetura técnica
Veredito: Atenção
- **Stack e componentes coerentes.** `EmailSender` como trait em `AppState`, tabela própria de verificação e `register_inner` reaproveitado mantêm as responsabilidades claras (design.md, Decisões 1, 4, 9).
- **Carga não declarada.** Nem proposal nem design dizem quantos pedidos de verificação por dia se espera nem o teto do plano Resend. O risco aparece só em «Riscos». Declarar a meta (ex.: N registros/dia) e o limite do plano.
- **Tarefa em background sem durabilidade** (Decisão 5): o `tokio::spawn` após o `202` perde o envio se o processo reiniciar. Aceitável para um e-mail reenviável, mas deve ficar escrito como trade-off.

## 2. Integração com a infraestrutura existente
Veredito: **Bloqueante**
- **Limite por IP inútil atrás do Nginx.** `ClientIp` usa só o peer TCP e ignora `X-Forwarded-For` de propósito; `docs/deploy-producao.md` (linhas ~40–43) admite que atrás do Nginx local todos chegam como `127.0.0.1`. O balde de 5/hora por IP do design (Decisão 7) vira um limite **global da instância**: cinco pedidos por hora no total, e um atacante o esgota para todos (DoS do registro). Em produção o desenho não funciona. O design precisa de uma de: lista de proxies confiáveis (`TRUSTED_PROXY` + cabeçalho definido pelo Nginx, validado no arranque como no interactive-map, Decisão 9), ou limite no Nginx (`limit_req`) com o balde da aplicação só por e-mail. Decidir e especificar.
- **Link do e-mail e cliente desktop.** `PUBLIC_BASE_URL` aponta para a SPA servida pelo Nginx; o cliente Electron tem instância configurável. O link abre no navegador, o cadastro termina na web e a pessoa entra depois no desktop. Registrar isso (ou prever deep link) no design.
- **Documentação de deploy desatualizada** (`frontend-v2/dist`, porta `1420` v1) frente ao README (`frontend/` é o v2). A change cita `frontend/`; confirmar o caminho real antes de tarefas 5.x e do runbook.
- **Dados:** SQLite único, migração `0026` aditiva e backup já cobertos por `operar-instancia.md`. OK. A migração precisa fazer parte do que o operador faz ao atualizar.

## 3. Qualidade de arquitetura e trade-offs
Veredito: **Bloqueante**
- **Token no URL vai para o log do Nginx.** A Decisão 2 diz «fragmento/query». Com `?email_token=` o token cai no access log do proxy e no `Referer`. Fixar **fragmento** (`#`), que não é enviado ao servidor, e o frontend lê o fragmento. Sem isso o token de uso único (5 h) fica em logs persistentes.
- **E-mail em claro num produto E2EE.** `docs/arquitetura-tecnica.md` §4.3 lista os metadados em claro. A change introduz um dado pessoal novo no servidor e no `auth_view`. Falta: (a) atualizar §4.3 e a política de privacidade; (b) garantir que `email` **não** aparece em listas de membros, mencionáveis, WebSocket nem respostas para outras contas, só em `/auth/me`; (c) dizer quem (operador) o vê. Hoje a spec só diz que `auth_view` o expõe de forma aditiva (tarefa 4.2).
- **Abuso de recursos com registro aberto.** `POST /servers` só exige autenticação (`create_server`). Em `aberto`, qualquer e-mail verificado cria servidores, anexos e avatares, sem cota. O interactive-map já registrou o risco equivalente. Registrar como risco explícito e decidir se `aberto` restringe a criação de servidor, ou mantém o risco e o documenta.
- **Segurança do pedido:** resposta genérica, hash do token, uso único, canonicalização e índice único parcial estão bem desenhados. Atenção ao canal lateral de tempo: o design iguala resposta, mas `Resend` pode falhar mais devagar no caminho «novo»; como corre em background, OK.
- **Estado do modo:** `fechado` como padrão preserva a segurança atual. OK.

## 4. Documentação e decisões (ADRs)
Veredito: Atenção
- `design.md` justifica a maioria das decisões, mas só rejeita alternativas nas Decisões 1 e 11. Faltam alternativas para: tarefa em background vs. envio síncrono (5), limite em memória vs. tabela (7), e canal do token (2).
- Diagrama de sequência presente e suficiente. Um diagrama de estados do token (ativo / substituído / consumido / expirado) ajudaria, mas não bloqueia.
- Docs a atualizar listadas só em 1.3/6.2; incluir `arquitetura-tecnica.md` §4.3, `contratos-e-fluxos.md` (novos endpoints) e `deploy-producao.md` (Nginx + IP real).

## 5. Ponte entre produto e técnico
Veredito: Atenção
- O pedido («criar conta por e-mail como no interactive-map») está traduzido de forma viável, e o desvio (sem conta pendente, por causa do vault E2E) está explicado.
- **Lacuna de contrato:** em `aberto`, o que acontece se vier `email_token` válido **e** convite inválido/expirado? A spec não diz (recusar vs. criar conta sem servidor). Definir.
- **Conta sem servidor:** o frontend já tem o estado vazio `noServers` (`shell/Content.tsx`), o que reduz o risco da tarefa 4.3; falta só confirmar o fluxo de entrada por convite depois do cadastro (aceitar convite com conta existente).
- Termos/privacidade citados como pendência jurídica, mas o aceite é requisito do pedido; manter como bloqueio de **ativação** do modo `aberto`, não de implementação.

## Bloqueantes antes de implementar
1. Resolver o limite por IP atrás do Nginx (proxy confiável ou limite no proxy) e refletir na spec, no design, na validação de arranque e no runbook.
2. Fixar o token no **fragmento** da URL (ou outro canal que não chegue ao log do proxy) e atualizar spec, design e tarefa 5.3.
3. Definir a exposição do e-mail (apenas na própria conta), atualizar o inventário de metadados em claro e especificá-lo como requisito testável.
