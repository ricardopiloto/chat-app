# Contrato: Separador de dia sticky

Âmbito: overlay/região fixa no topo de `.text-scroll` no canal de texto. Sem API.

## Quando aparece

| Condição | Sticky |
|----------|--------|
| Canal sem mensagens | Oculto |
| Inline `.day-sep` do dia em vista **visível** perto do topo do scrollport | Oculto (anti-duplicação) |
| Mensagens do dia D em vista e o `.day-sep` de D **já não** está visível no topo | Visível com rótulo de D |
| Scroll cruza de D1 → D2 | Rótulo passa a D2 (salvo se inline de D2 estiver visível no topo → oculto) |

## Forma

- Classe sugerida `.day-sep-sticky`.
- Mesmo texto de rótulo que o inline ([day-label-format.md](./day-label-format.md)).
- Fundo opaco/scrim suficiente para legibilidade sobre mensagens.
- Não substitui nem remove os separadores inline.

## Semântica

- Não conta para SC-001.
- Evitar anúncios repetidos de leitor de ecrã a cada pixel de scroll; preferir ocultar sticky da árvore a11y quando o inline correspondente está visível.

## Fora deste contrato

- Persistência, API, voz.
- Redesign geral do scroll/virtualização.
