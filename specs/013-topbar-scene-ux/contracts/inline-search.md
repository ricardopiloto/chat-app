# Contrato: Pesquisa inline na TopBar

Âmbito: `frontend/`. Substitui o fluxo «ícone → Dialog modal» da 012 para a **digitação**; o algoritmo de pesquisa permanece o de [012 topbar-functions](../../012-shell-iconography-typography/contracts/topbar-functions.md) (secção Pesquisa).

## Interacção

1. Em repouso: botão com `IconSearch` na topbar.
2. Activar o ícone: expande um **campo de texto inline** na própria topbar e foca-o. **MUST NOT** abrir um `Dialog`/modal só para introduzir texto.
3. Resultados: lista/pop-over **anexado** ao campo expandido (não um segundo formulário modal obrigatório para digitar).
4. Escape ou clique fora: recolhe o campo expandido (e limpa query/resultados de forma previsível).
5. Escolher um resultado: navega para o canal (mesmo padrão de URLs da 012) e recolhe a pesquisa.

## Algoritmo (inalterado em espírito)

1. Só dispara com ≥2 caracteres + debounce (~250 ms).
2. Âmbito: apenas servidores/canais de `GET /api/servers` do utilizador actual.
3. Decifra client-side; falha por canal não aborta os restantes.
4. Canais de texto apenas (comportamento actual da 012).

## Fora deste contrato

- Notificações (`IconBell`) — inalteradas.
- Índice FTS no backend — fora de âmbito.
