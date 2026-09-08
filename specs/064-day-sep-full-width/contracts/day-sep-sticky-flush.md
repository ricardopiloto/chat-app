# Contrato: Sticky de dia alinhado ao topo

Âmbito: `.day-sep-sticky` / host no topo de `.text-scroll`. Sem API. Extende [061 day-separator-sticky](../../061-channel-day-separators/contracts/day-separator-sticky.md) quanto a **alinhamento vertical** e forma.

## Alinhamento

| Regra | Obrigatório |
|-------|-------------|
| Com sticky visível, o chip fica **alinhado ao topo** da área de scroll (flush; sem vão vertical óbvio) | Sim |
| Padding lateral do painel pode permanecer; o problema a corrigir é descolamento **vertical** | Sim |
| Regras 061 de mostrar/esconder sticky (anti-duplicação com inline no topo) | Mantêm-se |

## Forma

- Chip/pílula compacta (rótulo apenas).
- **Sem** dash line full-width própria no sticky.
- Scrim/fundo suficiente para legibilidade sobre mensagens; padding **superior** do overlay não deve criar gap perceptível sob o topo da caixa.

## Fora deste contrato

- Extensão horizontal das lines inline (ver [day-sep-inline-full-width.md](./day-sep-inline-full-width.md)).
- Mudança de labels ou timezone.
