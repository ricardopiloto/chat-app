# Design

## Context

Ver `proposal.md` — Why. Hoje a sessão vive inteiramente num token opaco guardado na tabela `session` (`backend/src/db/session.rs`: `id`, `account_id`, `token_hash`, `expires_at`, `revoked_at`), comparado por `hash_token` (SHA-256). O transporte tem hoje **dois pontos de leitura independentes da `CookieJar`**, ambos a substituir: `load_user` (`backend/src/api/auth/session.rs:20-34`, usado por `AuthUser`/`OptionalAuth` nos pedidos REST) e `current_session_id` (`backend/src/api/auth/session.rs:64-76`, usado só pelo `ws_handler` em `backend/src/api/mod.rs:249-259` para resolver o `session_id` depois de `OptionalAuth` já ter resolvido a conta). Os quatro fluxos que criam sessão (`register()`, `login()`, `redeem_code()` em `recovery.rs`, `redeem()` em `recovery_key.rs`) convergem todos em `AccountRecord::auth_view()` → `AuthAccount` (`backend/src/domain/account.rs:41-53`) para a resposta JSON — é esse o ponto único onde o token em claro deve ser acrescentado, não quatro edições independentes. Não há CORS configurado (feature `cors` do `tower-http` presente mas sem `CorsLayer` em uso). A decisão de arquitectura para o cliente desktop (ver AskUserQuestion já respondido) é "só cliente, sem backend embutido" — um binário Tauri que se liga a instâncias Mesa arbitrárias escolhidas pelo utilizador em runtime, pela mesma origem pública que o browser já usa hoje (produção: `https://<domínio>` via Nginx; LAN: `http://<IP-LAN>:8080` directo, ver `docs/operar-instancia.md`) — nunca contornando o invariante de `docs/deploy-producao.md` de que o processo Axum não é exposto directamente em produção.

## Goals / Non-Goals

**Goals:**
- Um cliente nativo conseguir autenticar-se contra qualquer instância Mesa sem depender de cookies cross-origin.
- Zero mudança de comportamento ou de postura de segurança para o cliente web existente.
- Reutilizar inteiramente o mecanismo de sessão já existente (mesma tabela, mesmo hash, mesma expiração/revogação) — nenhuma tabela nova, nenhum novo tipo de credencial.

**Non-Goals:**
- Resolver CORS (não é necessário — ver Decisão 1).
- Introduzir refresh tokens, expiração diferenciada por tipo de cliente, ou revogação granular por dispositivo (continua um token por sessão, como hoje).
- Qualquer UI, armazenamento no OS keychain, ou lógica de "qual transporte usar" do lado do cliente — isso é consumido pela change `frontend-instance-connect` e implementado pelo shell Tauri, fora desta change.

## Decisions

### 1. Header `Authorization: Bearer` em vez de CORS + cookie cross-site

Alternativa descartada: adicionar `CorsLayer` com origem(ns) permitida(s) e relaxar o cookie para `SameSite=None; Secure`. Foi rejeitada porque (a) `Secure` exige HTTPS, e muitas instâncias Mesa self-hosted correm só em HTTP numa LAN (o próprio `docs/deploy-producao.md` descreve o cenário doméstico); (b) `SameSite=Strict` é hoje a única defesa CSRF do cliente web — relaxá-la para acomodar um cliente que nem usa o browser engine for fetch degrada a segurança de quem não precisa dessa mudança. O cliente nativo vai usar um transporte HTTP do lado Rust (plugin HTTP do Tauri, detalhe da change `frontend-instance-connect`), que não está sujeito a CORS de todo — logo CORS nunca é a questão certa a resolver aqui. O header `Authorization` é suficiente e não exige HTTPS para funcionar (embora continue a ser recomendado para instâncias expostas à internet, como já é hoje).

### 2. Devolver o token em claro no corpo, não um token diferente

Alternativa descartada: gerar um token/credencial separado "para API" distinto da sessão de cookie (ex.: um PAT de longa duração). Foi rejeitada por introduzir um segundo ciclo de vida de credencial (emissão, listagem, revogação própria) sem necessidade real no MVP — o cliente nativo só precisa de uma sessão como qualquer outra. Devolver o mesmo token que já vai no `Set-Cookie`, desta vez também no corpo, mantém uma única fonte de verdade (a tabela `session`) e um único caminho de revogação (logout).

### 3. Nota de reconciliação com `docs/arquitetura-tecnica.md`

`docs/arquitetura-tecnica.md` §1/§2.2 descreve a visão de um único binário Rust em modo cliente (Tauri) ou servidor (headless), e §2.3 deixa "sessão via token" como decisão de implementação em aberto. A decisão de produto já confirmada para esta iniciativa (cliente desktop **só cliente**, sem backend embutido — ver `proposal.md`) é um âmbito mais restrito do que esse binário único, alinhado com o que `docs/backlog/backlog.md` item 14 já chama de "visão de longo prazo" ainda não implementada. Esta change resolve a questão em aberto de §2.3 ("os dois transportes, mesmo token") de forma compatível com os dois cenários (cliente-só agora, binário único depois, se vier a acontecer). Fica registado aqui para que `arquitetura-tecnica.md` §2.3/§8 possa ser actualizado a apontar para esta change em vez de continuar a listar a pergunta como aberta.

### 4. Precedência cookie → header, não o inverso

Quando ambos estão presentes (não deve acontecer em uso normal, mas pode em testes/ferramentas), o cookie tem precedência. Isto preserva exactamente o comportamento actual do cliente web (que nunca envia `Authorization`) e torna a adição aditiva por construção — nenhum teste existente que dependa só do cookie pode mudar de comportamento.

## Risks / Trade-offs

- [Expor o token em claro no corpo da resposta aumenta a superfície onde pode vazar — ex.: logs de acesso, ferramentas de debug do cliente] → Mitigação: o backend já trata o token como segredo (só o hash é persistido); esta change não muda isso. Fica registado como responsabilidade do cliente nativo não gravar o token em logs e o guardar em storage protegido do OS (keychain), que é tratado na change seguinte.
- [Um cliente web malicioso poderia tentar ler o token do corpo da resposta de login via JS e reenviá-lo manualmente por header, contornando `HttpOnly`] → Mitigação: isto não é uma regressão — qualquer script que já corre no contexto da página de login tem acesso total à sessão de qualquer forma (XSS já seria crítico sem esta change); `HttpOnly` protege contra roubo de cookie por scripts de terceiros em páginas diferentes, não contra o próprio JS da aplicação na página de login.
- [Esquecer um dos pontos de extracção (REST vs WS) e deixá-lo só-cookie por omissão] → Mitigação: a spec lista explicitamente os três pontos (`AuthUser`/`OptionalAuth`, `ws_handler`) como requisitos com cenário próprio; `tasks.md` cobre os três.

## Migration Plan

Mudança aditiva e retrocompatível — não há passo de migração de dados (schema da tabela `session` inalterado) nem janela de corte. Pode ser aplicada e implantada de forma independente das changes seguintes (`frontend-instance-connect`, `desktop-tauri-shell`, `desktop-packaging-ci`), que dependem desta mas não o inverso.
