# Contrato: UX ao reduzir N

Âmbito: `SceneEditor` + `sceneDraft` (rascunho apenas).

## Controlo de N

- Controlo numérico ou select **2–8** no painel do editor (visível a quem já edita cena).
- Alterar N → actualiza rascunho + pré-visualização; **não** PATCH até Guardar.

## Aumentar N

- Acrescentar slots vazios; dirty.

## Diminuir N

Seja `delta = oldN - newN` (`delta > 0`).

1. **Se** existem pelo menos `delta` slots **vazios**:
   - Remover automaticamente `delta` vazios (preferência: índices mais altos).
   - Reindexar restantes para `0..newN-1` preservando ordem e `account_id`.
   - Sem diálogo.

2. **Senão** (seria necessário remover ≥1 ocupado):
   - Abrir UI de escolha: o editor marca exactamente `delta` slots a eliminar (ocupados e/ou vazios).
   - Confirmar → remover escolhidos; reindexar restantes; dirty.
   - Cancelar → N do rascunho permanece `oldN`.

## Guardar / Descartar

- Guardar: envia layout completo (API).
- Descartar / fechar sem guardar: restaura `baseLayout` (N e slots).
