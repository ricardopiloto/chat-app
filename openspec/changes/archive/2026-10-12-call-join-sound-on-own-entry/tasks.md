# Tasks

## 1. Som para quem entra, sempre

- [x] 1.1 Em `join()` (`frontend/src/voice/callSession.tsx`), acrescentar um parâmetro opcional `silent?: boolean`, passado por omissão como `false`. Em `joinOnce()`, substituir a condição actual (`!viewer && next.remoteParticipants.size === 0`) por `!viewer && !silent`, mantendo a chamada a `notify("callJoin")` logo após `setStatus("live")`.
- [x] 1.2 Em `onE2eeChanged`, passar `join(request, { silent: true })` (ou a forma equivalente do novo parâmetro) para que a reconexão interna por mudança de E2EE não toque o som.
- [x] 1.3 Confirmar que `GreenRoom.tsx:57` continua a chamar `call.join({...})` sem o novo parâmetro (som toca, comportamento por omissão).
- [ ] 1.4 Verificar manualmente: entrar sozinho numa chamada vazia — toca; entrar numa chamada já ocupada — toca, para quem entra, e continua a tocar para quem já lá estava (efeito já existente, sem regressão); mudar o E2EE do canal a meio de uma chamada activa — não toca para quem está a reconectar internamente. **Tentativa de verificação automatizada nesta sessão (duas contas de teste + Playwright com câmara/microfone falsos, interceptando `HTMLMediaElement.play()`) interrompida**: a segunda conta numa instância de teste nova exige um código de convite que o fluxo ainda não tinha montado — sem bloqueio real, só faltou tempo. Utilizador vai verificar directamente em produção.
- [x] 1.5 Rodar `npm run build` em `frontend/` para confirmar que compila.

## 2. Sincronizar a spec

- [x] 2.1 Confirmar que `openspec/changes/call-join-sound-on-own-entry/specs/frontend-v2/sound-effects/spec.md` reflecte o comportamento implementado antes de arquivar a change.
