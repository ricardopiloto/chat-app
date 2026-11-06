# Proposal

## Why

Os efeitos atuais cobrem menções e entradas em chamadas, mas não avisam quando alguém sai. Já existem três gravações novas em `assets/audio/`; elas precisam ser preparadas e integradas para que os avisos sejam curtos, suaves e coerentes entre si.

## What Changes

- Substituir os efeitos de menção e entrada pelos trechos úteis de `mention-v2.mp3` e `call-join-v2.mp3`.
- Adicionar um efeito de saída, derivado de `call-ended-v2.mp3`, quando outra pessoa deixa a chamada ativa do usuário ou quando ele próprio a encerra voluntariamente.
- Expor a pré-escuta dos três efeitos nas configurações e manter a preferência, o dispositivo de saída, a supressão ao ensurdecer e os avisos visuais.
- Documentar a preparação dos arquivos e verificar duração, volume, disparos e ausência de toques durante reconexões.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `frontend-v2/sound-effects`: acrescenta o aviso de saída e atualiza o conjunto de efeitos e a pré-escuta.

## Impact

Afeta `assets/audio/`, a cópia para `frontend/public/audio/`, `frontend/src/sound/`, os gatilhos da sessão de voz, as configurações de Áudio & Vídeo, testes e documentação. Não requer alteração de API ou dependência de servidor.
