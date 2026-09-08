# Contrato: Separador inline a largura total do conteúdo do scroll

Âmbito: `.day-sep` no canal de texto. Sem API. Extende [061 day-separator-inline](../../061-channel-day-separators/contracts/day-separator-inline.md) quanto a **largura**; não altera quando o separador aparece.

## Largura

| Regra | Obrigatório |
|-------|-------------|
| As `.day-sep-line` esquerda/direita estendem-se até à largura do **conteúdo** de `.text-scroll` | Sim |
| Essa largura é **dentro** do padding lateral habitual do painel | Sim |
| As lines **não** ficam limitadas ao `max-width` da coluna de mensagens (ex. 74ch) quando o painel é mais largo | Sim |
| As lines **não** colam à borda exterior do painel ignorando o padding | Sim |
| Redimensionar o painel actualiza a largura das lines | Sim |
| Não introduzir scroll horizontal | Sim |

## Forma

- Layout flex: line \| label centrado \| line (inalterado semanticamente).
- Rótulo: Hoje / Ontem / data (061).

## Mensagens

- Coluna de leitura das mensagens permanece independente (não full-bleed por causa deste contrato).

## Fora deste contrato

- Lógica de dias, sticky show/hide, sticky visual (ver [day-sep-sticky-flush.md](./day-sep-sticky-flush.md)).
