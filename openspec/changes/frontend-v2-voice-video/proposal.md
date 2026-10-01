# Proposal

## Why

Esta é a **Fase 4 de 6** da reescrita faseada (`docs/v2/TR-frontend-v2.md`) e entrega a funcionalidade que dá à Mesa a sua diferenciação central: composição nativa de câmeras em chamadas de voz/vídeo com E2EE por omissão. É também a área funcional mais extensa e tecnicamente arriscada de toda a reescrita (integração LiveKit, criptografia de chave de canal, layouts de composição) — por isso só arranca depois de o shell, a autenticação e a administração de servidor/canal (Fases 1-2) já existirem, e depois do chat de texto (Fase 3) ter validado o padrão de trabalho com conteúdo de canal.

## What Changes

- Pré-entrada ("green room"): Entrar, Testar vídeo (padrão sintético), Entrar (ouvir) para utilizadores só com permissão de escutar.
- Sessão de chamada: integração LiveKit (entrar/sair, upsert de ocupação, heartbeat de media), controlos de chamada no painel do utilizador (mic, surdo/ouvir, câmara, partilha de ecrã, terminar), menu de blur de câmara (sem blur/leve/forte), indicadores de fala em tempo real, e o roster de voz inline na sidebar (ocupantes por canal de voz, visível mesmo sem o canal estar aberto).
- E2EE de canal de voz: chip de estado, faixa permanente "E2EE desligada" com quem/quando, e diálogo "Religar E2EE" que exige a chave do canal.
- Vista Composição: layouts nomeados (Mestre em Destaque, Painel, Faixa) de 2 a 8 posições, faixa "No banco" para ocupantes sem posição, e o editor de cena (admin) com arrastar-e-largar, selector de nº de posições, selector de layout, e confirmação de alterações por guardar.
- Vista Grade: grelha unificada de câmaras e partilhas de ecrã, com destaque de fala e promoção de uma partilha de ecrã a palco principal (spotlight).
- PiP flutuante de chamada: mini-player arrastável com encaixe de canto, visível quando há uma chamada activa e o utilizador navega para outro ecrã.
- **Fora desta fase e de todas as fases**: gravação/egress, múltiplas cenas nomeadas por canal, co-diretor, templates de cena partilháveis, qualquer arquitectura MLS/multi-dispositivo/Passkeys (ver `docs/backlog/backlog.md` e `docs/v2/TR-frontend-v2.md` §7).

## Capabilities

### New Capabilities
- `frontend-v2/voice-session`: pré-entrada, entrar/sair de chamada, controlos de chamada, blur de câmara, indicadores de fala, E2EE de canal de voz (chip, faixa desligada, religar), roster de voz na sidebar.
- `frontend-v2/voice-composition`: vista Composição (layouts nomeados + banco) e editor de cena.
- `frontend-v2/voice-grid`: vista Grade (câmaras + partilha de ecrã unificadas, spotlight).
- `frontend-v2/floating-voice-pip`: mini-player flutuante de chamada.

### Modified Capabilities
_Nenhuma — as fases anteriores ainda não foram arquivadas; esta fase depende delas por convenção de projecto (shell, sidebar, painel do utilizador já existem desde a Fase 1)._

## Impact

- **Código novo**: `frontend-v2/src/pages/VoiceChannel.tsx`, `frontend-v2/src/components/{CameraGrid,SceneEditor,CallBank,CameraBlurMenu}.tsx`, `frontend-v2/src/voice/*` (integração LiveKit), `frontend-v2/src/crypto/channelKey.ts`, `frontend-v2/src/shell/FloatingVoicePip.tsx`.
- **Backend**: nenhum impacto — consome `/api/channels/{id}/voice/*`, `/api/servers/{id}/voice-occupancy`, `/api/channels/{id}/grid`, `/api/channels/{id}/scenes` (só a cena activa — sem UI de múltiplas cenas, ver design.md) e os eventos WS `voice.occupancy`/`presence.update`/`channel.e2ee_changed` exactamente como a v1.
- **Dependências novas**: `livekit-client`, `@livekit/track-processors` (já previstas desde a Fase 0 como parte da stack a manter).
- **Depende de**: `frontend-v2-foundation`, `frontend-v2-auth-shell`, `frontend-v2-server-admin` (canais de voz e as suas permissões/ACL precisam de existir).
- **Desbloqueia**: paridade funcional completa com a v1 nas Fases 0-4; a Fase 5 (`frontend-v2-polish-cutover`) fecha a reescrita.
