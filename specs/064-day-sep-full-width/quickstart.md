# Quickstart: 064-day-sep-full-width

Validação visual sobre 061. Frontend + backend de desenvolvimento.

## Prerequisites

- App a correr (`npm run dev` + `cargo run` ou stack habitual).
- Conta com canal de texto e mensagens em **≥2 dias civis** (ou relógio/mensagens antigas) para ver separadores + sticky.
- Janela **larga** o suficiente para a coluna 74ch ser claramente mais estreita que `.text-scroll`.

## Commands

```bash
cd frontend && ./node_modules/.bin/tsc --noEmit
```

Sem contrato backend.

## Scenarios

### A — Inline full-width (US1 / FR-001)

1. Abrir canal de texto com ≥1 `.day-sep` num painel largo.
2. **Expect**: lines esquerda/direita chegam à largura do conteúdo dentro do padding lateral; **não** param no limite 74ch; **não** tocam a borda exterior do cartão/painel por fora do padding.
3. Redimensionar janela → lines acompanham; rótulo centrado.

### B — Mensagens inalteradas (US2 / FR-004)

1. Comparar bolhas/linhas de mensagem com o hábito pré-064.
2. **Expect**: mensagens **não** forçadas a full-bleed; só as dash lines inline atravessam o painel de conteúdo.

### C — Sticky flush (US3 / FR-007–008)

1. Scroll até o sticky aparecer (inline do dia já fora do topo).
2. **Expect**: chip colado ao **topo** da área de scroll (sem vão óbvio); forma pílula; **sem** dash full-width no sticky.
3. Scroll até o inline do mesmo dia voltar ao topo → sticky esconde-se (061).
4. Cruzar dias → sticky actualiza e continua flush.

### D — Overflow / temas

1. Painel estreito ≈ coluna de mensagens → sem scroll horizontal novo.
2. Tema claro e escuro → lines + rótulos legíveis.

### E — Regressão 061

- Separadores só em dias com mensagens; Hoje/Ontem/data; sem dias vazios — checklist 061 ainda válida ([061 quickstart](../../061-channel-day-separators/quickstart.md)).

## Pass criteria

- [ ] A–E OK em revisão ≤ poucos minutos (SC-001, SC-005).
- [ ] `tsc --noEmit` limpo.
