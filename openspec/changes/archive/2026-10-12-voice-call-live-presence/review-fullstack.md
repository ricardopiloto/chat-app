# Review — Desenvolvedor Fullstack

**Change:** voice-call-live-presence
**Data:** 2026-10-12
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend

Veredito: N/A — `proposal.md:28` confirma que o backend já emite `voice.occupancy` ao entrar e ao mudar câmara/microfone/partilha; esta change não acrescenta endpoint nem migração.

## 2. Desenvolvimento do frontend

Veredito: OK

- Confirmei em `frontend/src/shell/Sidebar.tsx:23,99`, `frontend/src/voice/GreenRoom.tsx:25,27` e `frontend/src/voice/Stage.tsx:24` que a barra lateral, a pré-entrada e o palco já lêem directamente `shell.voiceRoster()`/`shell.voiceCalls()` — sinais reactivos do SolidJS actualizados por `applyOccupancy` em qualquer evento `voice.occupancy`, independentemente de o utilizador estar ou não nesse canal agora. Isto significa que a Tarefa 1.1 pode, na prática, já funcionar hoje para estes três ecrãs — o que é coerente com a Decisão 2 de `design.md` ("No second fetch on channel enter... If the binding does not repaint, fix that binding"), que já prevê essa possibilidade em vez de assumir que está tudo partido.
- Confirmei em `frontend/src/voice/callSession.tsx:494-513` que `wire()` já assina `ParticipantConnected` e `TrackSubscribed`, ambos chamando `refresh()` — a Tarefa 2.1 também pode já passar sem alteração de código, para quem já está dentro da sala LiveKit. A formulação da tarefa como "verificar com dois clientes" em vez de "implementar X" está certa para este caso.
- **O trabalho novo real está na Tarefa 1.2**: confirmei em `state.tsx:87-91` que `applyOccupancy` não tem hoje nenhum contador de geração, nem `mergeVoiceOccupancy` (`shell/voice-state.ts:20-37`) — ambos os caminhos (REST por servidor, `state.tsx:96-99`; WS, `state.tsx:170`) chamam `applyOccupancy` sem nenhuma noção de qual chegou depois. Implementar a Decisão 1 exige granularidade por **canal**, não por servidor: o pedido REST devolve todos os canais de um servidor de uma vez (`voiceApi.occupancy(each.id)` → `snapshot.channels`), mas o evento WS chega por canal — por isso o filtro "descartar só os canais que a actualização ao vivo já tocou" tem de comparar canal a canal dentro da resposta REST, não a resposta inteira. `design.md` não precisa de especificar o mecanismo exacto (ex. `Record<channelId, timestamp>` de última actualização ao vivo, comparado contra o instante em que cada pedido REST foi disparado) — é nível de implementação — mas vale registar que não é um simples "se-else", é um merge parcial por chave.

## 3. Deploy e operação

Veredito: N/A — sem porta, serviço, variável de ambiente ou script novo; é client-side apenas.

## 4. Qualidade de código

Veredito: Atenção

- A Tarefa 1.2 pede para verificar "que, se a resposta antiga chega depois, a pessoa que entrou continua na lista" — isto é uma condição de corrida, e reproduzi-la de forma confiável à mão exige forçar a ordem (ex. atirar a aba de rede do browser para "Slow 3G" só no pedido de ocupação, ou uma pausa temporária de depuração no código, antes de disparar o evento ao vivo). `tasks.md` não diz como forçar essa ordem durante a verificação manual — não é bloqueante, mas vale decidir a técnica de reprodução antes de marcar a tarefa como verificada, para não a confirmar por sorte de temporização.
- Fora isso, as duas tarefas seguem "tarefa + como verificar com critério concreto" e cabem nos módulos existentes (`state.tsx`, `voice-state.ts`), sem refactor não declarado.

## 5. Execução das decisões arquiteturais

Veredito: OK

- Nenhuma tensão com decisão existente. Nenhuma limitação técnica nova a reportar ao Arquiteto — o SQLite/backend nem entra no caminho desta change.

## Bloqueantes antes de implementar

- nenhum

## Limitações técnicas a reportar ao Arquiteto

- nenhuma
