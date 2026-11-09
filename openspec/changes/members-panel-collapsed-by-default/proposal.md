# Proposal

## Why

O painel lateral de Membros abre por omissão sempre que o viewport é largo o suficiente (`frontend/src/shell/state.tsx:261`, `membersOpen` usa `membersChoice() ?? true`). O utilizador quer o padrão invertido: colapsado por omissão, até alguém abrir explicitamente.

## What Changes

- Trocar o valor por omissão do painel de Membros de aberto para colapsado em qualquer viewport (`frontend/src/shell/state.tsx`, os dois usos de `?? true` em `membersOpen` e em `toggleMembers`, que têm de mudar juntos — senão o primeiro clique do botão de alternância fica inconsistente com o que já está a ser mostrado).
- A preferência continua lembrada só durante a sessão (`sessionStorage`, chave `mesa.membersPanel`, mantida como está); o que muda é só o valor usado quando a pessoa ainda não escolheu nada nessa sessão.
- O comportamento em viewport estreito (sempre escondido) não muda.

## Capabilities

### Modified Capabilities
- `frontend-v2/app-shell`: o requirement "Painel de Membros do servidor" passa a especificar explicitamente que o painel começa colapsado por omissão, também em viewport largo, não só em viewport estreito.

## Impact

- `frontend/src/shell/state.tsx` (único ficheiro de código a mudar).
