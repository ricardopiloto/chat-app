# Review — Arquiteto de Soluções

**Change:** dice-channel-toolbar
**Data:** 2026-11-10
**Veredito geral:** Aprovado com ressalvas

## 1. Definição da arquitetura técnica

Veredito: OK

- Escopo pequeno e coerente com a stack actual (Axum + SQLite + Solid): preferência de UI por conta + atalho de composer, sem mexer em RNG, overlay 3D, ACL ou protocolo `NdM+K`.
- Componentes claros: persistência (`account_dice_toolbar`) → REST autenticado → `DiceToolbar` + `DiceComposer` compactado só no canal Dados. Responsabilidades não se sobrepõem ao domínio de rolagem.
- Escalabilidade: N/A relevante — payload minúsculo (array ≤ 7 inteiros) por conta; sem fan-out realtime. Compatível com o modelo self-host / SQLite descrito em `docs/arquitetura-tecnica.md`.

## 2. Integração com a infraestrutura existente

Veredito: Atenção

- Migração aditiva, sem serviço/porta/env novos — alinhado ao padrão do projecto (migrações sequenciais após `0031_channel_dice_type.sql`).
- **Namespace de API desalinhado do precedente real**: Decisão D3 fixa `GET`/`PUT /api/account/dice-toolbar` e rejeita `/api/me/...` “para alinhar com o domínio `account`”. No código actual, preferências da **própria** conta vivem sob **`/auth/...`** (`/auth/key-reminders`, `/auth/display-name`, `/auth/avatar`, `/auth/me`). O prefixo `/accounts/{account_id}/...` existe para recursos **de outro** utilizador (avatar). Não há hoje um router `/api/account/...`. Introduzir esse prefixo cria um terceiro padrão sem ADR que o justifique face a `/auth/dice-toolbar` (espelho de `key_reminders`).
- Recomendação: ou (a) mover o contrato para `/auth/dice-toolbar` (GET+PUT/PATCH) e actualizar proposal/design/tasks/spec wording se necessário, ou (b) manter `/api/account/...` mas documentar em D3 que se está a **introduzir** um namespace de preferências de conta fora de `/auth`, com motivo explícito (não “alinhar com o que já existe”).
- `proposal.md` Impact ainda cita “ex. sob `/api/me/...` ou `/api/account/...`” enquanto D3 já escolheu um caminho — inconsistência menor de documentação produto↔design.

## 3. Qualidade de arquitetura e trade-offs

Veredito: OK

- Segurança: só a sessão autenticada lê/grava a própria linha (`account_id` da sessão); sem dados de canal/E2EE; validação de whitelist de faces no servidor. Adequado.
- Performance: sem N+1 nem caminho crítico; GET no mount do canal Dados é barato.
- Manutenibilidade: reutiliza o endpoint de rolagem; Non-Goals (multi-face, barra em Texto, persistir `count`) evitam expansão silenciosa. Trade-offs D1/D5 e risco touch/L-R estão nomeados — bom.
- Dependência explícita de `chat-dice-rolling` (D6) é correcta; não inventa canal/composer em paralelo.

## 4. Documentação e decisões (ADRs)

Veredito: Atenção

- D1–D6 seguem o formato decisão + alternativa + motivo, coerente com changes anteriores.
- A ressalva da dimensão 2 (justificativa de D3 vs rotas `/auth` reais) é uma lacuna de ADR: a alternativa rejeitada documentada (`/api/me`) não é a alternativa que o código sugere (`/auth/...`).
- Diagrama: N/A — fluxo demasiado linear para exigir mermaid.

## 5. Ponte entre produto e técnico

Veredito: OK

- Pedido do utilizador (barra + formulário, um tipo, checklist, persistência server-side por utilizador) está reflectido fielmente em proposal/spec/design/tasks, sem diluir multi-face “para depois” dentro desta ronda.
- Spec com cenários testáveis (L/R-click, mínimo 1, só Dados, preferência por conta) fecha a ponte produto→aceitação.

## Bloqueantes antes de implementar

- Nenhum.

## Follow-up (2026-11-10)

- Utilizador optou pela rota menos complexa: D3/proposal/tasks actualizados para `GET`/`PUT /api/auth/dice-toolbar` no `auth::router()`. Ressalva do namespace `/api/account` encerrada.
