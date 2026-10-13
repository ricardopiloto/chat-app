# Bugs

Defeitos conhecidos do produto, à parte do [backlog de funcionalidades](backlog/backlog.md).

## Em aberto

### App trava ao navegar com uma chamada no PiP (desktop, AppImage e Windows)

Com uma chamada de voz/vídeo activa em segundo plano (mini-player flutuante, PiP — não o popout em janela separada), navegar para outro canal trava a aplicação inteira. Reportado em 2026-10-12, contra a `v1.3.2`, no AppImage Linux. Também reportado no Windows, com o popout (não o PiP) aberto.

**Como reproduzir**:
1. Entrar numa chamada de voz/vídeo, sair do canal para ver o PiP flutuante (não abrir "Abrir em nova janela").
2. Trocar de servidor e depois tentar voltar ao canal original — trava.
3. Reprodução mais simples, no mesmo relato: com o PiP activo, só clicar para ir a outro canal (sem chegar a trocar de servidor) já trava, sem precisar de mais nenhuma acção.
4. Com o **popout** em janela separada (não o PiP): dá para trocar de canal e enviar mensagem normalmente, mas não é possível voltar à chamada — reportado no mesmo teste, mesma sessão.
5. **No Windows**: com o popout aberto, trocar de janela (ex. Alt+Tab para outra aplicação, ou entre a janela principal e o popout) trava a aplicação.

**Esperado**: navegar para outro canal ou servidor com uma chamada em PiP continua a funcionar sem travar; com o popout aberto, "Trazer de volta" (`CallElsewhere`) continua a devolver a chamada à janela principal.

**Nota**: os cenários 1-3 (PiP) travam a aplicação; o cenário 4 (popout) não trava a navegação, só a recuperação da chamada — ambos na mesma área de código (`join`/`leave`/`closePopout` em `callSession.tsx`), possivelmente a mesma causa a manifestar-se de forma diferente consoante o caminho (PiP vs. popout).

**Ainda não diagnosticado**: um travamento (não uma excepção) precisa de reprodução ao vivo com DevTools/profiler para apanhar onde a thread principal fica presa — não dá para confirmar só lendo o código. Os ficheiros mais prováveis, por serem os únicos tocados nesta área na mesma release (`263f2ba`, `v1.3.2`) onde o bug apareceu, são `frontend/src/voice/callSession.tsx` (`join`/`leave`/`teardown`, reescritos em `popout-voice-navigation-handoff` para esperar o fecho real do popout e encadear promises) e `frontend/src/shell/Hosts.tsx` (condição de exibição do `FloatingPlayer`, também alterada na mesma change). Spec: [fix-pip-call-navigation-freeze](../openspec/changes/fix-pip-call-navigation-freeze/proposal.md).

## Resolvidos

### Histórico do canal diz que o canal não existe a quem não é membro

Uma conta autenticada que não pertence ao servidor recebia «não encontrado» ao pedir o histórico de um canal que existe. A lista de canais desse mesmo servidor já respondia «sem permissão». O teste `integration::server_isolation::servers_do_not_leak_across_membership` esperava essa mesma recusa no histórico e falhava (404 em vez de 403).

**Como reproduzir**: a conta A cria o servidor Alpha e um canal de texto. A conta C pertence só a outro servidor. C pede o histórico do canal de Alpha.

**Esperado**: recusa de permissão, igual à lista de canais de Alpha. Um canal que não existe continua «não encontrado». Um membro sem permissão de ver aquele canal também continua «não encontrado», para o canal ficar oculto.

**Resolução**: `channel_access` devolve 403 quando a conta não é membro do servidor. O 404 fica para canal inexistente e para membro sem permissão de ver. Spec: [fix-outsider-message-history](../openspec/changes/archive/2026-10-09-fix-outsider-message-history/proposal.md).

### Agrupamento de mensagens ignorava o intervalo de tempo

O chat juntava visualmente todas as mensagens consecutivas do mesmo remetente, mesmo quando o intervalo entre elas era longo.

**Como reproduzir** (2026-10-08): no mesmo canal, o mesmo remetente enviou uma mensagem às 09:24, outra às 09:26 e outra às 09:46. As três ficaram no mesmo grupo.

**Esperado**: as de 09:24 e 09:26 podem ficar juntas (dois minutos de diferença). A de 09:46, vinte minutos depois, deve abrir um grupo novo, com o seu próprio avatar e cabeçalho.

**Resolução**: `buildTimeline` agora continua o grupo apenas quando a mensagem chega até 5 minutos depois da anterior. O spec de texto exige a mesma janela, e `frontend/scripts/verify-chat.mjs` cobre o exemplo acima.
