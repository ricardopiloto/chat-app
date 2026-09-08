# Contrato: Picker de menções no composer

Âmbito: UI do canal de texto. Sem mudança de schema.

## Abertura

| Condição | Picker |
|----------|--------|
| Caret numa menção activa (`@` + query sem espaço) | Aberto |
| Texto normal / sem `@` activo | Fechado |
| Canal sem outros mentionables | Aberto com estado vazio OU fechado com empty — preferir aberto + empty (FR-009) |

## Conteúdo

- Lista de [MentionableMember](../data-model.md) filtrada por `query` (substring case-insensitive em handle).
- **Exclui** o utilizador actual.
- Mostra handle (avatar opcional).

## Selecção

- Rato/toque ou teclado (↑↓ + Enter).
- Substitui o fragmento `@`+query pelo `@handle` completo (trailing space recomendado).
- Fecha o picker.
- Enter no picker **não** deve enviar a mensagem.

## Cancelamento

- Escape ou perda de contexto de menção → fecha sem enviar.

## Fora deste contrato

- Persistência, E2EE, replies.
