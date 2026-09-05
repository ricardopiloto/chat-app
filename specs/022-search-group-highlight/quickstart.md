# Quickstart: 022-search-group-highlight

Validação manual. Ver [contracts/search-group-highlight.md](./contracts/search-group-highlight.md).

## Pré-requisitos

- App a correr; canal de texto com histórico.
- Ideal: mensagens agrupadas (mesmo autor, várias seguidas) + pelo menos um hit pesquisável.

## §1 Grupo com uma mensagem

1. Pesquisar termo de uma mensagem isolada no seu grupo.
2. Clicar no hit → mensagem centrada; **grupo** (avatar+meta+texto) destacado ~3 s.
3. Confirmar que o destaque **não** é só a linha de texto.

## §2 Grupo com várias mensagens

1. Hit numa mensagem que não é a primeira do grupo do mesmo autor.
2. Todo o grupo destacado; **sem** estilo extra só na bolha do hit.
3. Mensagem do hit visível/centrada.

## §3 Timer e substituição

1. Destacar um grupo; esperar ~3 s → some.
2. Dois hits seguidos → só o último grupo fica destacado.

## §4 Falha (regressão 017)

1. Hit para mensagem apagada / id inválido → toast; nenhum grupo com highlight.

## Automação

```bash
cd frontend && npx tsc --noEmit
```
