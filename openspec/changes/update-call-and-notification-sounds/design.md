# Design

## Context

`frontend/src/sound/effects.ts` conhece dois efeitos; `triggers.ts` acompanha menções, e `callSession.tsx` toca a entrada própria após conexão e a entrada remota no evento LiveKit `ParticipantConnected`. A change já implementada `sync-join-sound-with-participant-arrival` estabeleceu essa fonte para a entrada remota. O Vite copia todos os MP3 de `assets/audio/` para `frontend/public/audio/`. As gravações v2 na pasta de origem foram aparadas externamente para cerca de 2 segundos cada e copiadas diretamente sob os nomes estáveis dos efeitos publicados.

## Goals / Non-Goals

**Goals:** produzir três arquivos finais pequenos a partir das gravações v2 e ligar o terceiro efeito aos eventos reais da chamada, preservando a experiência silenciosa em falhas.

**Non-Goals:** alterar eventos do servidor, tocar para quem vê apenas o roster ou mudar a política atual de notificações visuais.

## Decisions

1. Publicar as gravações v2, já aparadas externamente para cerca de 2 segundos cada, copiando-as diretamente como `mention.mp3`, `call-join.mp3` e `call-leave.mp3`; manter as fontes v2 separadas para edição futura. Isso preserva os caminhos já usados para os dois efeitos existentes.
2. Acrescentar `callLeave` ao registro de efeitos, preload, janela de silêncio e pré-escuta. Usar janela de silêncio própria para saída, para não bloquear menções ou entradas próximas. A preferência e a escolha de dispositivo continuam compartilhadas.
3. Detectar saídas remotas em `frontend/src/voice/callSession.tsx` com um handler próprio de `E.ParticipantDisconnected`, no mesmo `Room` que já trata `E.ParticipantConnected`. A change já implementada `sync-join-sound-with-participant-arrival` fundamenta esta decisão: segundo seu `proposal.md`, a ocupação HTTP e os tiles LiveKit têm tempos distintos, por isso a entrada passou a seguir o evento LiveKit. Espelhar `seenRemotes`/`announceArrivals`: remover a identidade de `seenRemotes` no disconnect, mas tocar `callLeave` apenas para uma identidade anteriormente vista após a ativação dos avisos, na sessão ainda válida (`alive()`), na janela proprietária (`!viewer`), sem ensurdecimento (`!deafened()`) e com `status() === "live"`. Atualizar os participantes antes do som e adiá-lo com `queueMicrotask`, repetindo as guardas após o commit Solid para que o tile desapareça antes do toque; evitar avisos de saída durante preparação, teardown e reconexão interna sem saída real. Detectar a saída própria no comando voluntário que encerra a sessão, não na limpeza interna da conexão.
4. Manter os nomes de arquivos publicados estáveis para entrada e menção; acrescentar o arquivo novo ao mecanismo de cópia existente. Atualizar os rótulos de pré-escuta em português e inglês e a documentação de áudio.

## Risks / Trade-offs

- [Os trechos Suno podem conter ataque alto ou silêncio inicial] → ouvir, aparar e medir duração/ganho dos arquivos finais antes da integração.
- [Desconexão LiveKit durante reconexão pode parecer saída real] → exigir sessão válida e ativa, identidade remota previamente vista e guardas repetidas após o refresh; testar reconexão com dois clientes.
- [Saída própria pode gerar toque duplicado ou não tocar após teardown] → disparar uma vez no caminho de saída voluntária antes da limpeza da sessão, sem usar o callback genérico de desconexão.

## Migration Plan

Substituir os dois MP3 publicados, adicionar `call-leave.mp3` e atualizar o cliente no mesmo build. Em rollback, a versão anterior do cliente continua a usar apenas os dois caminhos antigos; os arquivos extras são ignorados.
