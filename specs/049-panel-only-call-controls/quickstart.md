# Quickstart: 049-panel-only-call-controls

Validação manual alinhada a [spec.md](./spec.md) e [contracts/panel-only-call-controls.md](./contracts/panel-only-call-controls.md).

## Prerequisites

- Frontend dev (`npm run dev`) + backend com voz utilizável
- Conta com acesso a um canal de voz (preferir também conta admin para confirmar ausência de Gravar)

## Setup

```bash
cd frontend && ./node_modules/.bin/tsc --noEmit
```

## Scenarios

### A — Na mesa em chamada: painel sim, barra do palco não

1. Entrar num canal de voz e juntar-se à chamada; permanecer na vista da mesa.
2. **Expect**: `.user-panel-calls` presente (mic / deafen / cam / sair utilizáveis).
3. **Expect**: `.call-controls` ausente; sem «Gravar cena…» / «Parar gravação».
4. Mutar pelo painel; sair pelo painel → chamada encerra; grupo some.

### B — Fora da mesa em chamada

1. Em chamada, navegar para um canal de texto.
2. **Expect**: `.user-panel-calls` continua presente e utilizável (inalterado vs 043 off-stage).

### C — Sem chamada

1. Fora de voz (hard refresh se necessário).
2. **Expect**: `document.querySelector('.user-panel-calls') === null` (sem `is-disabled`).

### D — Altura do palco

1. Comparar mentalmente com o layout pré-049: a cena/slots devem usar o espaço onde estava a barra (~altura da antiga `.call-controls`).

### E — Admin / gravação

1. Como owner/admin na mesa em chamada.
2. **Expect**: nenhum controlo de gravação na UI (G1 backlog).

## Done when

- A–E OK + `tsc --noEmit` limpo.
