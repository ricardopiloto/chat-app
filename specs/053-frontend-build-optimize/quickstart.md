# Quickstart: 053-frontend-build-optimize

## Prerequisites

- Repo Mesa com `frontend/` instalado (`npm ci` / `npm install`)
- Spec clarificada: entry &lt; 500 kB; voice on join/active call; aggressive JS dedupe; CSS out of scope

## A — Build gate (SC-001)

```bash
cd frontend && npm run build
```

**Expect**:
- Entry JS **&lt; 500 kB** no relatório Vite
- Aviso de chunk &gt; 500 kB **não** referido ao entry (chunks async/vendor podem ser grandes)
- `tsc --noEmit` passa (via script `build`)

Guardar o relatório (tamanhos) para comparar com a baseline ~963 kB.

## B — Texto sem LiveKit eager (FR-004)

1. Build ou `npm run dev`.
2. Login → abrir só canal de **texto** (sem join de voz).
3. Nas DevTools → Network (JS): **não** deve ser necessário descarregar o chunk LiveKit/voz só por abrir a shell/texto.

**Expect**: chat texto utilizável.

## C — Loading + retry (FR-004a)

1. DevTools → Network: throttle / Block URL do chunk de voz (após identificar o nome no build).
2. Navegar para canal de voz / iniciar join.

**Expect**: UI de carregamento; em falha, mensagem + **Tentar de novo**; após desbloquear a rede e retry, voz funciona.

## D — PiP / chamada activa (FR-004b)

1. Entrar em voz com sucesso.
2. Navegar para um canal de texto.

**Expect**: PiP / controlos de chamada no painel continuam a funcionar (stack pode permanecer carregado).

## E — Inventário (SC-002 / SC-005)

1. Abrir `specs/053-frontend-build-optimize/inventory.md`.
2. Verificar que cada cluster tem status terminal e que C1 (erros API) e C3 (capacidades) estão `unified`.

## F — Regressão tipagem

```bash
cd frontend && ./node_modules/.bin/tsc --noEmit
```

**Expect**: exit 0.

## Skip notes

- CSS modularization: fora de âmbito.
- Backend `cargo test`: só se houver alteração acidental de API (não esperado).
