# Tasks

## 1. PiP

- [x] 1.1 Ajustar dimensões e posicionamento em `FloatingPlayer.tsx`/`voice.css` para janelas pequenas; manter os quatro cantos e os controlos acessíveis.
- [ ] 1.2 Verificar manualmente 1366×768, 1600×900 e 1920×1080 com definições e lista de canais abertas.

## 2. Vista da chamada

- [x] 2.1 Disponibilizar início/paragem da partilha nas duas vistas em `Stage.tsx` e `CallControls.tsx`, respeitando `canSpeak()`.
- [x] 2.2 Depois de iniciar a partilha com sucesso, mudar a vista para Grade; não mudar se a captura for cancelada ou falhar.
- [x] 2.3 Na Grade, dar ao participante dono da partilha em spotlight um destaque visual e textual inequívoco, incluindo quando a câmara está desligada.
- [ ] 2.4 Verificar partilha a partir das duas vistas, paragem, falha/cancelamento e alternância de spotlight.

## 3. Revisão

- [x] 3.1 Revisão dupla (arquiteto + fullstack, skills `spec-review-architect` / `spec-review-fullstack`).
- [x] 3.2 `openspec validate improve-call-view-controls --strict`.
