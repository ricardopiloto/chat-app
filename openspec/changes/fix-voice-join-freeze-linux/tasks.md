# Tasks

## 1. Isolar o recurso

- [x] 1.1 Reproduzir a entrada numa chamada só com microfone (câmara desligada na pré-entrada, se possível). Confirmar se trava da mesma forma, trava de forma diferente, ou não trava. A pré-entrada não chega a ser usada: abrir o canal de voz já trava. A 1.3.2, sem esta mudança, abre o canal.
- [x] 1.2 Reproduzir a entrada numa chamada só com câmara (microfone desligado/mudo, se possível), se a Tarefa 1.1 não isolar sozinha. O mesmo bloqueio impede desligar a câmara ou o microfone. A comparação 1.3.2/1.3.3 substitui este isolamento.
- [x] 1.3 Com o resultado das Tarefas 1.1/1.2, confirmar qual recurso (câmara, microfone, ou ligação ao LiveKit em si, sem nenhum dos dois) está envolvido. Nenhum dos três. É o ciclo de remontagem em `Content.tsx`: a chave do `<Show>` era o objecto do canal, e `GreenRoom` refresca a lista ao montar.

## 2. Diagnóstico

- [x] 2.1 No momento do travamento isolado na Tarefa 1, capturar `journalctl --user -S "-2min"` (ou `dmesg | tail -100`) e procurar erros de driver de câmara/microfone, PipeWire, ou crash de processo por volta desse instante. Há underruns do PipeWire no microfone e nenhum crash de driver. Registo em `evidence/`.
- [x] 2.2 Se possível sem o travamento impedir, tentar a captura de profile/CDP como em `fix-pip-call-navigation-freeze` — já há um precedente de que a porta de depuração pode morrer junto; se morrer, isso em si é evidência (travamento a nível nativo, não um bloqueio de JS). Nesta corrida não havia porta CDP. `eu-stack` mostrou a thread principal do renderer em JavaScript, com os processos de captura vivos e à espera. Não é um bloqueio nativo.
- [x] 2.3 Confirmar se reproduz também no `npm run electron:dev` (não só no AppImage empacotado) e, se possível, testar noutra máquina Linux — ajuda a separar "bug da aplicação" de "específico deste hardware/driver". Reproduz no `electron:dev` desta máquina. Não foi testado noutra máquina; a causa está no diff da 1.3.3, não no hardware.

## 3. Correcção ou mitigação

- [x] 3.1 Se a causa for código da aplicação, corrigir especificamente o que foi confirmado. `Content.tsx` volta a chavear o ecrã do canal pelo id.
- [x] 3.2 Se a causa for externa (driver, Chromium, PipeWire), documentar o achado e avaliar uma mitigação viável (ex. flag do Electron, mensagem de erro em vez de travar, timeout com fallback) em vez de forçar uma correcção que não é da aplicação. Não se aplica: a causa é o ciclo em `Content.tsx`.

## 4. Verificação de regressão

- [ ] 4.1 Repetir a entrada numa chamada com câmara e microfone normais, várias vezes seguidas, e confirmar que não trava.
- [x] 4.2 Rodar `npm run build` no frontend como regressão mínima. `tsc --noEmit` e o build do Vite passaram.
