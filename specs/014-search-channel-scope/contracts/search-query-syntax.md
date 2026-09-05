# Contrato: Sintaxe e âmbito da pesquisa

Âmbito: `frontend/` — parser + `SearchPanel`. Reutiliza listagem/mensagens existentes (sem API nova).

## Formato da consulta

| Input (exemplos) | mode | channelName | term |
|------------------|------|-------------|------|
| `hello` | global | — | `hello` |
| `#geral hello` | scoped | `geral` | `hello` |
| `#geral` | scoped | `geral` | `""` (não pesquisa) |
| `#mesa oi mundo` | scoped | `mesa` | `oi mundo` |

## Âmbito de execução

1. **global**: para cada servidor membro, cada canal `type === "text"`, buscar mensagens, decifrar, filtrar por `term` (case-insensitive), ≥2 chars no term, debounce ~250 ms.
2. **scoped**: resolver canais texto com `name` equalIgnoreCase a `channelName` entre os acessíveis; pesquisar **apenas** esses. Se zero texto mas há voz com esse nome → empty `voice_only`. Se zero canais com o nome → `channel_not_found`. Se texto ok e zero hits → `no_results`.
3. Nunca incluir canais de voz nos hits.
4. Nunca pedir servidores fora de `GET /api/servers` do utilizador.

## Empty states (obrigatórios e distintos)

| Reason | Mensagem (PT, ou equivalente claro) |
|--------|-------------------------------------|
| `channel_not_found` | Canal não encontrado |
| `voice_only` | Só canais de texto |
| `no_results` | Sem resultados |

## Placeholder

O input expandido MUST mostrar hint que cubra pesquisa global e `#canal termo` (ex.: `Pesquisar… ou #canal termo`).

## Resultados

Clicar num hit navega como na 013 (`/channels/{id}?server=...&type=...`) e recolhe a pesquisa.
