# Proposal

## Why

Hoje a câmara só suporta desfocar o fundo (Sem blur / Blur leve / Blur forte). O utilizador não consegue substituir o fundo por uma imagem própria (quarto arrumado, logo, cenário de mesa). A biblioteca de processadores de vídeo já usada para o blur (`@livekit/track-processors`) já suporta fundo virtual por imagem, faltando só a gestão dessas imagens e a UI para escolher entre elas.

## What Changes

- Cada conta pode enviar as suas próprias imagens para usar como plano de fundo da câmara (upload, listagem e remoção), guardadas no backend e disponíveis em qualquer dispositivo onde a conta entra.
- Nas definições de Áudio & Vídeo e no menu de blur da chamada, a escolha deixa de ser só "Sem blur / Leve / Forte" e passa a incluir os planos de fundo personalizados do utilizador (como miniaturas), mantendo as opções de blur existentes.
- A escolha de **qual** efeito está activo (blur ou um fundo específico) continua a ser uma preferência local do dispositivo, exactamente como o blur hoje — só as imagens em si (o conteúdo enviado) passam a ser guardadas no backend.
- Limite de tamanho e número de imagens por conta, e tipos de imagem aceites, alinhados com os limites já usados para avatares/anexos.
- Sem suporte a partilhar o fundo de um utilizador com outros, sem editor de imagem (recorte/zoom) nesta ronda, e sem mudar o comportamento do blur existente.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `frontend-v2/audio-video-settings`: gestão de planos de fundo personalizados (upload/listagem/remoção) e selecção de plano de fundo (blur ou imagem) nas definições e no menu de blur da chamada.

## Impact

- **Backend:** nova tabela de planos de fundo por conta, pasta de armazenamento dedicada (padrão de `avatars_dir`), endpoints `POST`/`GET`/`DELETE` em `/api/auth/camera-backgrounds` (mesmo padrão de `/api/auth/avatar`) para gerir as imagens da conta autenticada; validação de tipo/tamanho/limite por conta.
- **Frontend:** UI de upload/galeria/remoção nas definições de Áudio & Vídeo; extensão do menu de blur da chamada para listar fundos personalizados; troca do processador de vídeo para `BackgroundProcessor` (modo `virtual-background`) quando um fundo de imagem está activo, mantendo `background-blur` para os níveis existentes; i18n.
- **Armazenamento:** `@livekit/track-processors` (`^0.7.2`) já suporta `mode: "virtual-background"` com `imagePath`; não é necessária nova dependência.
