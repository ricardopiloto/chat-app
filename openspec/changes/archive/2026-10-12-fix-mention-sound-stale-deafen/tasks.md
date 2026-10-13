# Tasks

## 1. Repor `deafened` ao sair da chamada

- [x] 1.1 Em `teardown()` (`frontend/src/voice/callSession.tsx`), acrescentar `setDeafened(false)` junto aos outros resets de estado (`setMicState(false)`, `setCamState(false)`, etc.). Implementado. Verificação manual (ensurdecer, sair, ser mencionado fora da chamada; e que ensurdecer+mencionar dentro da chamada continua sem som) ainda por fazer — requer sessão real com duas contas.
- [x] 1.2 Rodar `npm run build` em `frontend/` para confirmar que compila sem erros. Build passou.
