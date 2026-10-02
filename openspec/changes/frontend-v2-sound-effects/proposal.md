# Proposal

## Why

Hoje, tudo o que a Mesa avisa é visual: uma nova menção acende o sino de notificações e uma pessoa que chega a uma chamada aparece no roster. Quem está noutra janela, com o separador em segundo plano ou concentrado na chamada não repara. Dois sons curtos resolvem os dois casos mais frequentes sem mudar nenhum fluxo. O prompt de criação dos áudios já existe (`docs/prompts/efeitos-sonoros-suno.md`) e os arquivos MP3 virão de `assets/audio/`; falta ligá-los ao frontend v2.

É um acréscimo: a v1 nunca teve sons e o `docs/v2/parity-checklist.md` não os lista, de modo que não afeta a paridade nem a independência da v1.

## What Changes

- **`mention.mp3`** toca quando chega uma notificação para o usuário (evento WS `notification.created`, tipos `mention` e `reply`).
- **`call-join.mp3`** toca para quem está numa chamada quando **outra pessoa entra** nessa chamada (evento WS `voice.occupancy`).
- Regras comuns: o som nunca é o único aviso, não toca com o usuário ensurdecido, toca na saída de áudio escolhida em Áudio & Vídeo, junta rajadas num único toque e trata em silêncio o bloqueio de autoplay do navegador.
- **Preferência** para ligar ou desligar os efeitos, guardada no dispositivo, com seção "Efeitos sonoros" na página de Áudio & Vídeo e botões para ouvir cada efeito.
- Os arquivos continuam a ser mantidos em `assets/audio/`; o frontend os serve a partir de `frontend-v2/public/audio/`, copiados no arranque do Vite.
- **Fora de escopo**: gerar os áudios, outros sons (saída da chamada, mudo, mensagem comum, início de chamada), volume ajustável, sons por servidor ou por canal, notificações do sistema (Notification API) e qualquer alteração de backend.

## Capabilities

### New Capabilities
- `frontend-v2/sound-effects`: reprodução dos efeitos sonoros de nova menção e de chegada a uma chamada em andamento, com as suas regras de supressão, saída de áudio, limite de frequência, preferência e tolerância a falhas.

### Modified Capabilities
- `frontend-v2/audio-video-settings`: a página passa a ter a seção "Efeitos sonoros" (interruptor e botões de teste).

## Impact

- **Código novo**: módulo `frontend-v2/src/sound/` (reprodutor, preferência, detecção de chegadas), ligação nos eventos de `shell/state.tsx`, seção nova em `voice/AudioVideoSettings.tsx` e textos nos catálogos `voice.*` (pt-BR e en).
- **Estáticos**: `frontend-v2/public/audio/` (gerado pela cópia, fora do git) a partir de `assets/audio/`.
- **Backend**: nenhum. Os eventos `notification.created` e `voice.occupancy` já existem e o payload da menção já inclui o necessário.
- **Dependências novas**: nenhuma.
- **Depende de**: `frontend-v2-voice-video` (sessão de chamada, saída de áudio escolhida, página de Áudio & Vídeo), já arquivado, e do sino de notificações do chat.
- **Pendência externa**: os MP3 serão colocados em `assets/audio/` à mão (`mention.mp3`, `call-join.mp3`). Sem eles a funcionalidade fica inerte, sem erro visível.
