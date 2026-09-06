# Contract: Empilhamento do `.scene-editor-side`

**Feature**: [034-scene-editor-side-layout](../spec.md)

Superfície de UI; sem rotas novas.

## Layout rules

| Regra | Requisito |
|-------|-----------|
| Slots no topo | Bloco «Câmeras na cena» / N no topo; altura ≈ conteúdo |
| Sem terços iguais | As três secções MUST NOT partilhar a altura útil em partes iguais |
| Stack por conteúdo | Layout e banco logo abaixo; altura = conteúdo |
| Scroll | Se não couber, scroll em `.scene-editor-side` (painel inteiro) |
| SC-001 | Painel ≥600px → bloco slots ≤120px (rótulo+controlo+margens locais) |

## Markup (esperado)

Três wrappers distintos sob `.scene-editor-side` (nomes exactos à implementação), cada um `flex: none` (ou equivalente).

## Fora

- Mudança de API de cena, limites N, reduce-N picker, thumbnails de layout, toolbar Salvar/Descartar.
- Animação no palco / preview à esquerda.
