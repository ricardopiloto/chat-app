# Contrato: Separador de dia inline

Âmbito: histórico de canal de texto (`.text-scroll` → timeline). Sem API.

## Quando aparece

| Condição | Resultado |
|----------|-----------|
| Primeira mensagem carregada com `createdAt` válido | Separador inline para o dia civil dessa mensagem **antes** do seu grupo |
| Mensagem cujo dia civil local ≠ dia da mensagem anterior | Separador inline para o **novo** dia antes do seu grupo |
| Duas mensagens consecutivas no mesmo dia civil | **Sem** separador entre elas |
| Dia civil sem mensagens no histórico carregado | **Sem** separador |
| Canal vazio | **Sem** separadores |

## Forma

- Elemento na lista (não é mensagem): classe sugerida `.day-sep`.
- Rótulo centrado + traços/linhas laterais (dash line), mesmo texto que [day-label-format.md](./day-label-format.md).
- `role="separator"` (ou equivalente) + texto/aria legível.
- Legível em tema claro/escuro; não compete visualmente com `.msg-body`.

## Contagem (SC-001)

- Exactamente **um** `.day-sep` inline por dia civil distinto presente nas mensagens carregadas.
- O sticky **não** conta como separador inline.

## Relação com agrupamento

- Fronteira de dia **quebra** agrupamento por remetente: não fundir `.msg-group` através de um `.day-sep`.

## Fora deste contrato

- Sticky (ver [day-separator-sticky.md](./day-separator-sticky.md)).
- Canais de voz/vídeo, composer, membros.
