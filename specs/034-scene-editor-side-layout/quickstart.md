# Quickstart: 034-scene-editor-side-layout

Validação visual do painel lateral do editor de cena.

## Prerequisites

- Frontend em `npm run dev`; conta dona com canal de voz; abrir **Editar cena**.

## Automated

```bash
cd frontend && ./node_modules/.bin/tsc --noEmit
```

Sem testes de contrato BE.

## Manual — User Story 1 (slots compactos)

1. Janela alta (≥ ~800px de altura útil do painel lateral).
2. Confirmar que «Câmeras na cena» + select ficam no **topo** com pouca altura (DevTools: ≤120px no bloco).
3. Não deve haver faixa vazia grande **dentro** do bloco de slots.

## Manual — User Story 2 (layout + banco)

1. «Layout da cena» e «No banco» imediatamente abaixo dos slots.
2. Com lista de layouts + várias pessoas no banco, scroll na **coluna lateral** (não expandir slots).
3. Viewport estreita (&lt;901px): slots compactos no topo da secção lateral empilhada.

## Manual — User Story 3 (regressão)

1. Mudar N (2–8), mudar layout, arrastar banco→slot, Guardar / Descartar.
2. Reduce-N com ocupados (se aplicável) continua a funcionar.

## Fora

Redesign de thumbnails; novos controlos no toolbar.
