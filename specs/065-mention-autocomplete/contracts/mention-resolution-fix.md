# Contrato: Resolução de menção no envio (fix)

Âmbito: cliente no send path + alinhamento com 062. Extende [mentions-replies-api](../../062-message-mentions-replies/contracts/mentions-replies-api.md).

## Garantias

| Regra | Obrigatório |
|-------|-------------|
| Antes de resolver, o cliente MUST ter um conjunto de candidatos mentionable carregado (não só `me` por falha silenciosa) | Sim |
| Extrair `@handle` do plaintext pré-cifra e mapear para `account_id` | Sim |
| Excluir self dos IDs enviados | Sim |
| Handles que não batem em nenhum mentionable → sem ID (sem notificação fantasma) | Sim |
| `@handle` válido de outro mentionable → ID incluído → notificação 062 | Sim |
| Mesmo resultado quer o handle tenha sido digitado ou inserido pelo picker | Sim |

## Parse

- Alinhar charset/comprimento do extract com handles válidos do produto (hoje tipicamente `[a-zA-Z0-9_]{2,32}` com boundary à esquerda).
- Se o registo permitir outros caracteres, actualizar extract em conjunto.

## Observabilidade UX (mínimo)

- Não é obrigatório chip visual no histórico nesta feature; sucesso = notificação + destaque no destinatário (062).
- Opcional: não bloquear envio se mentionables falharem a carregar — mas então documentar risco; preferir retry/load members no open do canal.

## Fora deste contrato

- UI do picker ([mention-composer-picker.md](./mention-composer-picker.md)).
