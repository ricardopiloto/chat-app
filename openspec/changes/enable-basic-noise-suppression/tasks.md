# Tasks

## 1. Captura e documentação

- [x] 1.1 Em `callSession.tsx`, tornar explícito em `audioCaptureDefaults` o `noiseSuppression: true` que a Room do LiveKit já aplica por omissão, mantendo `deviceId` condicional; verificar a opção da Room com e sem dispositivo escolhido e confirmar que `watch()` não publica áudio. Esta tarefa documenta a intenção no código, sem activar comportamento observável novo; esse efeito pertence à tarefa 1.2.
- [x] 1.2 Em `preview.ts`, pedir `noiseSuppression: true` no `getUserMedia` do microfone escolhido ou por omissão; verificar medidor funcional e libertação da faixa ao terminar.
- [x] 1.3 Registar o item 21 em `docs/backlog/backlog.md`, citando esta change e algoritmo avançado sem prazo; verificar a entrada no documento.

## 2. Integração e revisão

- [ ] 2.1 Numa chamada real, inspeccionar de forma best-effort `track.getConstraints()` e, quando reportado, `track.getSettings()` no DevTools: a constraint já deve estar presente antes de alterar o código, como baseline do LiveKit. Repetir no preview, comparando antes e depois da tarefa 1.2, e confirmar áudio utilizável. A eficácia acústica não é verificável automaticamente.
- [x] 2.2 Revisão dupla dos artefactos e, após implementação, do código (arquiteto + fullstack, skills `spec-review-architect`/`spec-review-fullstack`); registar pareceres e confirmar eco/AGC fora do escopo.
- [x] 2.3 Executar `openspec validate enable-basic-noise-suppression --strict` e confirmar aprovação.
