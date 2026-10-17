# Proposal

## Why

Bug encontrado em teste real (AppImage Linux, `v1.3.2`, 2026-10-12): com uma chamada de voz/vídeo activa em segundo plano (mini-player flutuante, o PiP — não o popout em janela separada), navegar para outro canal trava a aplicação inteira. Reproduzido duas vezes pelo utilizador: uma trocando de servidor e voltando, outra só clicando para ir a outro canal, sem chegar a completar a troca. No mesmo teste, com o **popout** em janela separada (não o PiP), o utilizador conseguiu trocar de canal e enviar mensagem normalmente, mas não conseguiu voltar à chamada — sintoma diferente (não trava a navegação, só a recuperação da chamada), mas na mesma área de código.

No Windows, reportado um quarto cenário: com o **popout** aberto, trocar de janela do sistema operativo (ex. Alt+Tab, ou alternar entre a janela principal e o popout) trava a aplicação. Este gatilho é diferente dos anteriores — não é navegação dentro da aplicação, é uma mudança de foco a nível do SO — por isso pode ter uma causa distinta (ex. suspensão do contexto de GPU numa janela em segundo plano no Windows, a mesma classe de problema que já tinha motivado a troca de Tauri para Electron no Linux) e não necessariamente a mesma dos cenários de PiP/navegação. Ver `docs/bugs.md` ("App trava ao navegar com uma chamada no PiP").

Um travamento (não uma excepção capturável) não se diagnostica só lendo código — precisa de reprodução ao vivo com DevTools/profiler para localizar onde a thread principal fica presa. Esta change ainda não tem causa raiz confirmada.

Os dois ficheiros mais prováveis de estarem envolvidos, por serem os únicos tocados na mesma release (`263f2ba`, `v1.3.2`) nesta área exacta — chamada activa + navegação — são:
- `frontend/src/voice/callSession.tsx`: `join()`/`leave()`/`teardown()` foram reescritos em `popout-voice-navigation-handoff` para encadear promises e esperar o fecho real do popout nativo antes de reconectar.
- `frontend/src/shell/Hosts.tsx`: a condição que mostra `FloatingPlayer` (o PiP) também mudou na mesma change, ao remover `CallElsewhere` do nível global.

Nenhum dos dois caminhos foi testado ao vivo, com câmara real, antes de ir para a release — `popout-voice-navigation-handoff` tinha ficado sem as tarefas marcadas por falta exactamente dessa verificação (ver `openspec/changes/popout-voice-navigation-handoff/tasks.md`).

## What Changes

- Reproduzir o travamento ao vivo (Electron com DevTools, ou `--inspect` no processo principal) para capturar onde a aplicação fica presa — thread principal do renderer, processo principal do Electron, ou algo a nível do LiveKit/WebRTC.
- Reproduzir também o cenário do popout ("não consigo voltar") — não é um travamento, por isso pode dar uma pista mais fácil de apanhar (erro na consola, promise que nunca resolve de facto apesar do timeout de 5s em `closePopoutOnce`, ou o IPC `mesa:close-call-popout` a não fechar a janela nativa).
- Reproduzir o cenário do Windows (popout aberto + trocar de janela do SO) numa máquina Windows real — gatilho diferente dos outros três, pode ter causa distinta.
- Corrigir a(s) causa(s) confirmada(s), no caminho de `join`/`leave`/`teardown`/`closePopout`, na renderização do `FloatingPlayer`/`Tile`, ou a nível do processo principal do Electron (se o cenário do Windows apontar para aí) — conforme o que a reprodução indicar, sem adivinhar uma correcção sem reprodução confirmada.
- Verificar especificamente os quatro cenários relatados: trocar de servidor com PiP activo e voltar; navegar para outro canal, no mesmo servidor, com PiP activo; abrir popout, navegar para outro canal, e voltar à chamada; no Windows, trocar de janela do SO com o popout aberto.

## Capabilities

### Modified Capabilities

(nenhuma — `skip_specs: true`. O requisito de navegação com chamada activa já existe implicitamente no comportamento esperado da aplicação; esta change corrige uma regressão de implementação, não introduz nem muda requisito.)

## Impact

- `frontend/src/voice/callSession.tsx` (`join`/`leave`/`teardown`, candidatos principais).
- `frontend/src/shell/Hosts.tsx` (condição do `FloatingPlayer`).
- Possivelmente `frontend/src/voice/FloatingPlayer.tsx`/`tiles.tsx` (`TrackVideo`, anexação/desanexação de faixa de vídeo), se a reprodução apontar para aí.
- Sem impacto conhecido em backend, API ou formato de mensagens.
