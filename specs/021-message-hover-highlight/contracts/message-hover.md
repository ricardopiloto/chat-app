# Contrato: Destaque de alvo no bloco de mensagem

Âmbito: histórico de canal de texto (`.text-scroll` → `.msg-block`). Sem API.

## Gatilhos

| Evento | Resultado |
|--------|-----------|
| Ponteiro sobre `.msg-block` | Destaque de alvo no **esse** bloco (texto + anexos + pré-visualizações + «Apagar») |
| Foco dentro de `.msg-block` (`:focus-within`) | Igual ao hover |
| Ponteiro sobre `.msg-avatar` ou `.msg-meta` apenas | **Nenhum** destaque de alvo |
| Ponteiro sai do bloco | Destaque de alvo some |

## Estilo

- Superfície `--hover` (ou equivalente subtil), `border-radius` alinhado ao bloco.
- MUST NOT reutilizar o mesmo anel accent de `.msg-highlight`.
- MUST cobrir a altura total do bloco (anexos incluídos).
- MUST permanecer legível em claro/escuro; «Apagar» continua visível no hover/foco.

## Relação com 017

- `.msg-highlight` inalterado (3 s, centrar, toast).
- Sobreposição na mesma mensagem: salto continua o mais marcado.

## Fora deste contrato

- Composer, pendentes, voz, lista de membros.
- Selecção persistente / multi-select.
