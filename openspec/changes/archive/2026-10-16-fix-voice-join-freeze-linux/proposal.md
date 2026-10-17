# Proposal

## Why

Bug grave reportado em teste real (AppImage Linux, `v1.3.3`, 2026-10-13): entrar em qualquer canal de voz/vídeo trava a aplicação por completo. A barra de tarefas mostra o indicador do sistema de câmara/microfone em uso, mas fica "blinking" — a janela deixa de responder a eventos do gestor de janelas. A única acção possível é fechar a aplicação. Isto bloqueia voz/vídeo por completo no Linux, não é um caso limite. Ver `docs/bugs.md`.

Esta sessão já tinha uma pista anterior, na investigação de `fix-pip-call-navigation-freeze`: uma tentativa de reproduzir o travamento de PiP com `--remote-debugging-port`/`--inspect` morreu 1.7s depois de anexar à janela principal, exactamente ao tentar entrar numa chamada — na altura atribuída, sem confirmar, às próprias flags de depuração. Este relato confirma que acontece **sem** essas flags, no pacote normal — não é um artefacto do modo de depuração.

Como no `fix-pip-call-navigation-freeze`, um travamento (processo preso, não uma excepção) não se diagnostica só lendo código — precisa de reprodução ao vivo com instrumentação (DevTools, logs do sistema, ou isolamento de qual recurso trava). Esta change ainda não tem causa raiz confirmada.

## What Changes

- Diagnosticar com instrumentação real (não só leitura de código) onde exactamente a aplicação fica presa ao entrar numa chamada — se é a aquisição de câmara, de microfone, a ligação ao LiveKit, ou algo no processo principal do Electron.
- Isolar se é específico à câmara (testar entrada só com microfone, sem câmara) para separar o pipeline de vídeo do de áudio.
- Corrigir a causa confirmada — sem adivinhar.

## Capabilities

### Modified Capabilities

(nenhuma — `skip_specs: true`. Correcção de uma regressão/defeito de implementação; o requisito de poder entrar numa chamada de voz/vídeo já existe implicitamente.)

## Impact

- `frontend/src/voice/callSession.tsx` (`joinOnce`, `startCamera`, `setMic` — candidatos principais, ponto onde `room.localParticipant.setCameraEnabled()`/`setMicrophoneEnabled()` são chamados).
- Possivelmente `frontend/electron/main.ts` (sem `setPermissionRequestHandler` configurado — confirmado por leitura; não se sabe ainda se isso é relevante).
- Possivelmente fora do controlo da aplicação (driver de câmara/microfone, PipeWire, ou um bug do Chromium/Electron em si) — se for o caso, esta change documenta o achado e as mitigações possíveis, não uma correcção de código da Mesa.
