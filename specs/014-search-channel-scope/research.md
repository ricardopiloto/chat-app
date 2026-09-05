# Research: 014-search-channel-scope

## 1. Parser da consulta `#canal termo`

**Decision**: Função pura `parseSearchQuery(raw: string)` → `{ mode: "global" | "scoped"; channelName?: string; term: string; raw }`.

- Se o texto (trim) começa por `#`, o token do canal é a primeira sequência sem espaços após `#`; o resto (após o primeiro whitespace) é o `term`.
- Se não começa por `#`, `mode = "global"` e `term = raw.trim()`.
- `#canal` sem termo → `term = ""` (não dispara pesquisa; FR-008).
- Nome: case-insensitive no match; comparação exacta ao `channel.name` (sem fuzzy).

**Rationale**: Spec + clarificações; parser isolado facilita testes manuais/unitários futuros e evita lógica espalhada no JSX.

**Alternatives considered**: Regex única inline no `SearchPanel` — mais frágil; rejeitado. Autocomplete ao digitar `#` — fora de âmbito.

## 2. Resolução de âmbito (texto / voz / inexistente)

**Decision**: Ao pesquisar em modo `scoped`, listar canais acessíveis (mesmo fluxo `GET /api/servers` + channels). Classificar:

1. Algum canal com `type === "text"` e nome equalIgnoreCase → pesquisar **só esses**.
2. Senão, algum canal com nome equalIgnoreCase e `type !== "text"` → estado **`voice_only`** («Só canais de texto»).
3. Senão → estado **`channel_not_found`**.
4. Texto encontrado mas zero hits após decifra → **`no_results`**.
5. Modo global sem hits → **`no_results`**.

**Rationale**: FR-007 / clarificação B para voz; evita misturar estados.

**Alternatives considered**: Tratar voz como «não encontrado» — rejeitado na clarificação.

## 3. Atalho Ctrl+F / Cmd+F

**Decision**: Listener `keydown` no shell autenticado (`TopBar` ou `AppShell`): `(e.ctrlKey || e.metaKey) && e.key === "f"` → `preventDefault()` + expandir pesquisa. Se a rota actual é canal de texto (query/`type=text` ou canal carregado), `setQuery("#" + channelName + " ")` **substituindo** conteúdo; senão expandir sem seed `#`. Focar input e colocar caret no fim (`setSelectionRange`).

**Rationale**: Clarificações A/B (pré-preencher + substituir). `preventDefault` evita find nativo do browser no shell.

**Alternatives considered**: Só focar sem substituir — rejeitado. Prefill sem substituir se campo não vazio — rejeitado.

## 4. Obter canal actual para o seed

**Decision**: `TopBar` (ou pai) lê `useParams` / `useSearchParams` da rota `/channels/:id` e o tipo do canal já conhecido no shell (props do `AppShell` ou lookup na lista de canais do servidor seleccionado). Preferir dados já em memória no shell para evitar fetch extra no atalho.

**Rationale**: Atalho deve ser ≤1 s; não bloquear em rede.

**Alternatives considered**: Sempre `GET /api/channels/:id` no atalho — latência desnecessária.

## 5. Placeholder

**Decision**: Placeholder fixo no input expandido, ex.: `Pesquisar… ou #canal termo` (FR-011). Copy pode variar desde que cubra global + sintaxe `#`.

**Rationale**: Clarificação A; SC-004.

**Alternatives considered**: Hint só no quickstart — rejeitado.
