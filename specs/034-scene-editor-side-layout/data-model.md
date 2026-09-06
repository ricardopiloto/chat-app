# Data Model: 034-scene-editor-side-layout

Sem entidades de persistência. Modelo **visual** do painel.

## Scene editor side panel

| Parte | Conteúdo | Regra de altura |
|-------|----------|-----------------|
| Slot count block | «Câmeras na cena» + select N (2–8) | Compacto = conteúdo; no topo; ≤120px tipicamente (SC-001) |
| Layout block | «Layout da cena» + lista de opções | Altura = conteúdo da lista |
| Bank block | «No banco» + tokens / empty state | Altura = conteúdo |

## Relationships

```text
.scene-editor-side
  ├── block.slots   (flex: none)
  ├── block.layout  (flex: none)
  └── block.bank    (flex: none)
```

Painel: `display: flex; flex-direction: column; justify-content: flex-start; overflow: auto`.

## State transitions

Nenhuma — só apresentação. Rascunho de cena / save / drag banco↔slot inalterados (US3).

## Validation

- Nunca `flex-grow` nas três secções para preencher a coluna.
- Espaço sobrante da coluna fica **vazio no fundo** (ou scroll se conteúdo > viewport), **não** dentro do bloco de slots.
