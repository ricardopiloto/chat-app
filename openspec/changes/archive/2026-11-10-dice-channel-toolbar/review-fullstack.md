# Review — Desenvolvedor Fullstack

**Change:** dice-channel-toolbar
**Data:** 2026-11-10
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend

Veredito: Atenção

- Tabela `account_dice_toolbar` (D2) e migração aditiva (Tarefa 1.1) são implementáveis no padrão actual (`REFERENCES account(id) ON DELETE CASCADE`, PK em `account_id`). Validação de whitelist no PUT (Tarefa 1.2) é o sítio certo — sem CHECK SQL frágil sobre JSON.
- Default em memória sem inserir linha até o primeiro PUT: coerente e fácil de testar (GET sem row → `[4,6,8,10,12,20,100]`).
- **Onde registar a rota**: D3/`tasks` 1.3 pedem `/api/account/dice-toolbar` em `api/mod.rs`. Hoje preferências próprias estão no `auth::router()` (`backend/src/api/auth/mod.rs`, ex. `/auth/key-reminders`). Quem implementar ou cria um módulo/`Router` novo sob `/account`, ou alinha a `/auth/dice-toolbar`. Sem essa decisão no apply, há risco de inconsistência com o cliente frontend e com o review de arquitectura.
- Authz: basta `AuthUser` da sessão (mesmo extractor de `key_reminders`) — sem capability de canal; correcto porque a preferência não é por servidor/canal.
- Sem realtime: correcto; não há padrão de broadcast para prefs pessoais.

## 2. Desenvolvimento do frontend

Veredito: Atenção

- Montagem: `ChannelPage.tsx` (~497) tem `<Match when={props.channel.type === "dice"}><DiceComposer …/></Match>`. A Tarefa 2.2 precisa de um wrapper (fragment/componente de rodapé) com **barra + composer**; trivial, mas o Match actual só aceita um filho sem fragmento explícito — ok em Solid com `<>...</>`.
- **Lacuna de contrato UI entre barra e composer**: `DiceComposer.tsx` guarda `notation`/`modifier`/`label` só em sinais internos — não expõe props controladas nem callback `onNotationChange`. D4/D5 e Tarefa 2.4 exigem que a barra escreva `${count}d${sides}` no formulário. Sem tarefa explícita de “elevar estado / props controladas / handle”, o implementador tem de improvisar. Recomendação: acrescentar à 2.4 (ou 2.2) o refactor mínimo de `DiceComposer` para aceitar notação controlada ou `setNotation` externo, preservando edição manual (D5: formulário manda no submit).
- Touch/`pointer: coarse` com ± (Tarefa 2.4) cobre o risco do design — bom.
- Compactação CSS (2.5) ancora-se a classes reais (`.ch-dice-field`, `.ch-composer` em `frontend/src/chat.css`) — verificável visualmente; manter unchecked até validação visual, como em `chat-dice-rolling`.
- Popover de Texto fora de escopo: confirmado — `Composer.tsx` não deve importar a toolbar.

## 3. Deploy e operação

Veredito: OK

- Só migração + rotas no mesmo binário; scripts de migrate existentes bastam.
- Sem variáveis de ambiente, contentores ou health checks novos.
- Debug: falhas de PUT/GET aparecem como HTTP 4xx/5xx normais; preferência pessoal não afecta canais de outros.

## 4. Qualidade de código

Veredito: OK

- Tarefas 1.2/1.3 pedem testes de contrato (default, PUT válido, inválido, sem sessão) — alinhado a `backend/tests/contract/dice.rs` e restantes.
- Tratamento de erro de rede no frontend na 2.3 não está explícito (falha do PUT após toggle na checklist): recomendação menor — manter checklist optimista com rollback ou mostrar `errorText` no rodapé; não bloqueia.
- Estrutura de módulos: `db/` + `api/` + endpoint frontend encaixa sem refactor transversal.

## 5. Execução das decisões arquiteturais

Veredito: OK

- Tasks respeitam Non-Goals (sem multi-face, sem barra em Texto, sem persistir `count`, sem overlay/RNG).
- D6 (dependência de `chat-dice-rolling`) está implícita nas tasks de integração 3.1/3.2 — suficiente se o apply correr depois do composer Dados estável.
- Não reabre protocolo `NdM+K`.

## Bloqueantes antes de implementar

- Nenhum.

## Limitações técnicas a reportar ao Arquiteto

- Nenhuma pendente após follow-up.

## Follow-up (2026-11-10)

- Rota alinhada a `/api/auth/dice-toolbar` (padrão `/auth/...`).
- Tarefa 2.2 acrescentada: refactor mínimo de `DiceComposer` para notação controlável; sync da barra passa a 2.5.
