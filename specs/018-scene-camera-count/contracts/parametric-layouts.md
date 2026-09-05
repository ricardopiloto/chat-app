# Contrato: Layouts paramétricos (FE)

Âmbito: `frontend/src/components/sceneLayouts.ts` (+ consumidores `SceneEditor`, `CameraGrid`).

## API de geometria

```text
layoutGeometry(layout_key, n) → { label, cols, rows, cells: [{ slotIndex, col, row }] }
cellStyle(layout_key, slotIndex, n) → CSS grid-column / grid-row
```

- `n` ∈ [2, 8]
- `cells.length === n`
- Labels: Faixa → `Faixa ${n}-up`; Mestre → «Mestre em destaque»; Painel → nome estável (ex. «Painel») sem «2×2» engañoso quando n≠4

## Regras por família

1. **mestre**: slot `0` é o único tile maior (posição geométrica fixa); `1..n-1` preenchem o resto.
2. **faixa**: n colunas iguais, uma linha.
3. **quad**: grelha equilibrada sem tile «mestre» obrigatório.

## Consumo

- Pré-visualização e palco usam `slot_count` do layout actual (draft ou live), não um `slotCount` fixo do catálogo antigo.
- Trocar só a família não altera `n`.
