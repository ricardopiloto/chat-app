# Quickstart: 043-panel-calls-in-call-only

Validação manual do contrato [panel-calls-visibility.md](./contracts/panel-calls-visibility.md).

## Prerequisites

- Backend + frontend a correr (ver [README](../../README.md) / [docs/operar-instancia.md](../../docs/operar-instancia.md)).
- Conta autenticada; servidor com canal de voz e de texto.
- **Hard refresh** do browser (Ctrl+Shift+R) após pull/rebuild — evita bundle pré-042 com `is-disabled`.

## Typecheck

```bash
cd frontend && npx tsc --noEmit
```

Expect: exit 0.

## Source sanity (optional)

```bash
rg -n 'is-disabled|showCallGroup|user-panel-calls' frontend/src/shell/UserPanel.tsx frontend/src/styles/mesa-theme.css
```

Expect: `showCallGroup` tied to `live && !onStage`; **no** `is-disabled` on the call group path.

## Scenario A — Sem chamada (FR-001 / SC-001)

1. Garantir que **não** estás em voz (sair se necessário).
2. Abrir DevTools → Elements.
3. Confirmar: **não** existe `.user-panel-calls` sob `.user-panel`.
4. Confirmar: identidade (handle/avatar) permanece.

## Scenario B — Em chamada, fora da mesa (FR-002 / SC-002)

1. Entrar num canal de voz até sessão activa.
2. Navegar para um canal de **texto** do mesmo servidor.
3. Confirmar: `.user-panel-calls` presente; controlos clicáveis; sair disponível.
4. Sair da chamada (painel ou PiP).
5. Confirmar: `.user-panel-calls` **desaparece** de imediato.

## Scenario C — Na mesa (FR-003)

1. Em chamada, permanecer na rota do canal de voz activo.
2. Confirmar: painel **sem** `.user-panel-calls`; controlos no palco presentes.

## Pass criteria

- A–C alinhados com a matriz do contrato.
- Se A falha mas o source está correcto → reiniciar Vite / hard refresh e repetir antes de alterar código.
- Se source ainda tiver path `is-disabled` → corrigir em implement (restaurar predicado 042).
