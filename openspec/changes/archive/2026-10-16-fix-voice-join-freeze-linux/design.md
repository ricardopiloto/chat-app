# Design

## Context

Ver `proposal.md`. Estado real do código, confirmado por leitura:

- `joinOnce()` (`frontend/src/voice/callSession.tsx`) liga ao LiveKit (`await next.connect(...)`), depois `await next.localParticipant.setMicrophoneEnabled(true)` (se `wantMic`) e `await startCamera()` (se `wantCam`), nessa ordem.
- `startCamera()` (`:236-248`) chama `await room.localParticipant.setCameraEnabled(true, ...)`, que internamente passa por `navigator.mediaDevices.getUserMedia()` via LiveKit.
- `frontend/electron/main.ts` não define `session.defaultSession.setPermissionRequestHandler` para câmara/microfone — só `setDisplayMediaRequestHandler` (partilha de ecrã, caminho diferente). Pedidos de câmara/microfone seguem o comportamento por omissão do Electron, sem um handler da aplicação a intercepetá-los.
- Ao entrar numa chamada, o sistema operativo arranca processos utilitários separados do Chromium (`--type=utility --utility-sub-type=video_capture.mojom.VideoCaptureService` e `audio.mojom.AudioService`, confirmados a arrancar em teste real nesta sessão) — a aquisição de câmara/microfone não corre no processo do renderer nem no principal, corre nesses processos à parte, com IPC entre eles.

**Pista já registada** (`fix-pip-call-navigation-freeze/design.md`, secção "Tentativa de reprodução do cenário PiP"): uma tentativa de capturar um profile via CDP, ao tentar entrar numa chamada, viu o alvo fechar 1.7s depois de anexar, e a porta de depuração (9222) parar de responder a pedidos HTTP a partir daí. Isto é consistente com um travamento a nível nativo (Chromium/Electron), não um bloqueio síncrono de JavaScript no renderer — um bloqueio síncrono de JS não derrubaria a própria porta de depuração do processo.

Não há, nesta leitura, nenhuma chamada da aplicação que explique um travamento desta natureza — o código de `joinOnce()`/`startCamera()` é `async`/`await` directo, sem laços nem bloqueios óbvios. As hipóteses mais prováveis, nenhuma confirmada:
1. O `VideoCaptureService` ou `AudioService` do Chromium trava a adquirir o dispositivo (driver, PipeWire, ou um bug do Chromium nesta versão do Electron).
2. A promise de `getUserMedia()` nunca resolve nem rejeita, e algo no caminho de `joinOnce()` acaba por bloquear a UI apesar de ser `await` (menos provável em JS puro, mas um deadlock a nível nativo pode impedir o processo principal de despachar eventos de UI mesmo que o JS do renderer continue tecnicamente "à espera").
3. Um problema específico da máquina do utilizador (driver de câmara, versão do kernel, PipeWire) que não reproduz noutro hardware.

## Goals / Non-Goals

**Goals:**
- Isolar se é câmara, microfone, ou os dois, antes de qualquer outra instrumentação.
- Confirmar com evidência (log do sistema, ou comportamento diferente ao desactivar um recurso) antes de propor uma correcção.

**Non-Goals:**
- Reescrever o fluxo de aquisição de câmara/microfone sem causa confirmada.
- Assumir que é o mesmo problema do `fix-pip-call-navigation-freeze` — são sintomas diferentes (este trava ao *entrar*, antes de qualquer navegação; aquele trava ao *navegar* com uma chamada já activa) e ficam como changes separadas até prova em contrário.

## Decisions

### 1. Isolar câmara vs microfone antes de instrumentar a fundo

Pedir ao utilizador para repetir a entrada numa chamada só com microfone (sem câmara, se a pré-entrada permitir escolher) antes de qualquer captura de profile — é a forma mais rápida e barata de reduzir o espaço de procura, dado que o processo de câmara (`VideoCaptureService`) e o de áudio (`AudioService`) são processos separados no Chromium. Alternativa descartada: ir direto a um profile CPU/CDP como no `fix-pip-call-navigation-freeze` — descartada como primeiro passo porque a tentativa anterior já mostrou que a própria porta de depuração morre junto com o travamento, tornando a captura de profile pouco fiável sem primeiro reduzir o escopo do que está a travar.

## Risks / Trade-offs

- [Pode ser um problema específico do hardware/driver do utilizador, não reproduzível noutra máquina] → se não reproduzir noutra máquina Linux, documentar como achado específico de ambiente e procurar uma mitigação (ex. flag do Electron para desactivar um caminho de captura problemático) em vez de uma correcção de código da aplicação.
- [O travamento pode impedir qualquer captura de diagnóstico, dado que a porta de depuração também morre] → nesse caso, logs do sistema (`journalctl`, `dmesg`) à volta do momento do travamento são a via alternativa.

## Migration Plan

Correctiva ou documental, sem migração de dados. Depende de isolar a causa antes de qualquer alteração de código — ver Decisão 1.

## Open Questions

- É específico à câmara, ao microfone, ou aos dois?
- Reproduz noutra máquina Linux, ou é específico ao hardware/driver desta?
- O que mostram `journalctl --user` / `dmesg` no momento exacto do travamento?

## Evidência parcial (2026-10-12, 23:22–23:24 -03)

Reproduzido no `electron:dev` desta máquina (Fedora, sessão Wayland com `DISPLAY=:0`), sem `--inspect` nem porta de depuração. O utilizador entrou num canal de voz e a janela deixou de aceitar cliques. A entrada não foi isolada: os dois serviços de captura do Chromium chegaram a arrancar, por isso este passo não responde à Tarefa 1.

Estado dos processos da app (`user-data-dir` `~/.config/Electron`), com a janela ainda aberta:

- O renderer (pid 592515) usava cerca de metade de um núcleo. A thread principal, em três amostras, estava no ciclo de mensagens (`pthread_cond_timedwait`) e, noutras, dentro do binário do Electron, incluindo endereços sem módulo (código JIT do V8). Não estava em estado `D` do kernel.
- `VideoCaptureService` (pid 593209) estava quase parado, à espera em `poll`. Não é um ioctl de câmara preso.
- `AudioService` (pid 592762) estava activo. O `journalctl --user` a partir das 23:22 mostra rajadas de `pipewire-pulse: [Chromium input] underrun`, sem crash de driver, sem `v4l` e sem erro do portal.
- O processo principal (pid 592439) continuava em `poll`. O portal (`xdg-desktop-portal` / KDE / GTK) não estava a consumir CPU.

Conclusão desta passagem: o travamento da interface coincide com trabalho na thread principal do renderer, não com um processo de captura bloqueado no kernel. Os processos e o registo estão em `evidence/`.

## Causa confirmada

A 1.3.2 abre o canal de voz. A 1.3.3, ainda por publicar, trava ao abrir o canal, antes de qualquer botão da pré-entrada. O diff dessa versão em `frontend/src/shell/Content.tsx` passou a usar o objecto do canal como chave do `<Show keyed>`. `GreenRoom` ao montar chama `shell.refreshChannels()`, que substitui a lista e devolve um objecto novo. A chave muda, a página é destruída e montada outra vez, e o ciclo não pára. A thread principal fica em JavaScript. A câmara e o microfone aparecem porque a pré-entrada os pede em cada montagem, não porque o driver os tenha preso.

A correcção volta a chave ao id do canal, que não muda quando a lista é recarregada. O som de entrada e o reset de ensurdecido, também da 1.3.3, não correm ao abrir o canal e ficam.

### Validação de origem (2026-10-13)

Confirmado por leitura directa: a mudança que introduziu o ciclo é exactamente a correcção aplicada nesta mesma sessão para `fix-pip-call-navigation-freeze` (`Content.tsx`, troca de `when={shell.channel()?.id}` para `when={shell.channel()}` no `Show` externo) — a intenção era evitar passar `channel={undefined}` a `ChannelPage`/`VoicePage` quando `shell.channel()` ficasse momentaneamente `undefined` ao trocar de servidor com uma chamada activa. Confirmei também, por leitura de `GreenRoom.tsx:32-34`, que `onMount` chama `void shell.refreshChannels()` sempre que a pré-entrada monta — o gatilho exacto do ciclo.

Nenhuma outra mudança desta sessão contribui: `setDeafened(false)` (`fix-mention-sound-stale-deafen`) e `notify("callJoin")`/o parâmetro `silent` (`call-join-sound-on-own-entry`) só correm dentro de `joinOnce()`/`teardown()`, accionados ao clicar "Entrar na chamada" — depois do ponto onde a app já trava ao abrir o canal. Confirmado via `git status`: o único ficheiro de código com alteração não commitada, antes desta correcção, era `Content.tsx`.

**Correcção final aplicada**: mantém a chave externa pelo `id` (resolve o ciclo), e acrescenta um `<Show when={shell.channel()}>` interno, não chaveado, só para evitar passar `channel={undefined}` — sem reintroduzir o ciclo, porque um `Show` não chaveado não remonta a cada troca de referência do objecto, só quando o valor passa de definido para indefinido (ou vice-versa). Isto cobre as duas causas: o ciclo de remontagem (`fix-voice-join-freeze-linux`) e a leitura insegura de `shell.channel()!` que motivou a correcção original (`fix-pip-call-navigation-freeze`). `npm run build` confirmado a passar.

### Regressão nova e correcção (2026-10-13, continuação)

A correcção acima trocou um problema por outro, mais grave: trocar de servidor enquanto um canal está aberto passou a travar a navegação por completo, com `TypeError: Cannot read properties of undefined (reading 'id')` em `ChannelPage.tsx:367` e, a seguir, `Uncaught Attempting to access a stale value from <Show>` — este último é um erro explícito do próprio Solid, lançado deliberadamente quando se lê o valor resolvido de um `<Show>` depois de esse ramo começar a ser destruído.

Causa: o `channel` recebido pelo `<Show>` interno (não chaveado) era passado como prop directamente (`channel={channel()}`, usando o *accessor* devolvido pelo próprio `Show`). Dois pontos a jusante liam esse prop fora do fluxo normal de renderização:
- `Composer.tsx:93` — `onCleanup(() => stopAnnouncing(props.channelId))`, executado exactamente no momento em que o ramo está a ser desmontado.
- `ChannelPage.tsx:216` — um `setTimeout` de 800 ms que só lia `props.channel.id` quando disparava, potencialmente muito depois de trocar de servidor.

Ler o *accessor* do `Show` nesses dois pontos é o que dispara o erro explícito do Solid; o `<Show>` interno, aliás, nunca foi necessário — `shell.channel()?.id` e `shell.channel()` leem o mesmo memo na mesma computação, por isso nunca podiam discordar.

Correcção: removido o `<Show>` interno em `Content.tsx`; fica um único `<Show keyed>` pelo `id`, e os três usos de `channel` passam a ler `shell.channel()!` directamente (um memo normal, sem a verificação de "stale" do `Show`). Em `Composer.tsx`, o `onCleanup` passou a usar um `lastChannelId` capturado por um `createEffect` em vez de reler `props.channelId` no momento da desmontagem. Em `ChannelPage.tsx`, o `setTimeout` do `markRead` passou a capturar `channelId` antes de agendar o temporizador, em vez de o ler quando dispara. `npm run build` confirmado a passar depois desta correcção.

Uma auditoria mais ampla (`thread.ts`, `Composer.tsx` no envio de anexos, `sceneStore.ts`, `E2ee.tsx`) encontrou o mesmo padrão — reler um valor derivado do canal depois de um `await` — em vários outros pontos. Nesses, a releitura é uma guarda deliberada ("ainda estou no mesmo canal depois deste await assíncrono?") e não lança mais o erro do Solid depois desta correcção, porque passou a ler um memo normal; ficam como risco separado, de prioridade menor, não bloqueante para este bug.
