# Spec Delta

## MODIFIED Requirements

### Requirement: Pré-visualização automática de links
O sistema SHALL detectar até 5 URLs no texto de uma mensagem e apresentar uma pré-visualização para cada uma, obtida após a decifra do conteúdo da mensagem. Para uma URL reconhecida como um dos provedores com oEmbed suportados (YouTube, Vimeo, Spotify, SoundCloud, TikTok), a pré-visualização SHALL mostrar uma miniatura, o nome do provedor e um indicador de reprodução, e SHALL NOT carregar nenhum conteúdo incorporado desse provedor até o utilizador clicar explicitamente nela. Para uma URL que aponta directamente a um arquivo de vídeo, a pré-visualização SHALL ser um player de vídeo reproduzível inline na mensagem. Para qualquer outra URL reconhecível, a pré-visualização SHALL ser o cartão genérico já existente (miniatura, nome do site, título). Uma falha ao obter a pré-visualização de um provedor SHALL degradar para o cartão genérico ou para a ausência de cartão, nunca para um erro visível na mensagem.

#### Scenario: Mensagem com um link
- **WHEN** uma mensagem contém uma URL reconhecível
- **THEN** uma pré-visualização dessa URL é apresentada por baixo do texto da mensagem

#### Scenario: Mensagem com um link de um provedor com embed
- **WHEN** uma mensagem contém uma URL do YouTube, Vimeo, Spotify, SoundCloud ou TikTok
- **THEN** a pré-visualização mostra uma miniatura com o nome do provedor e um indicador de reprodução, sem carregar nenhum iframe do provedor

#### Scenario: Clicar na pré-visualização de um provedor com embed
- **WHEN** o utilizador clica na miniatura de uma pré-visualização de um provedor com embed
- **THEN** o player desse provedor é carregado e embutido no lugar da miniatura, dentro da própria mensagem

#### Scenario: Mensagem com um link directo de arquivo de vídeo
- **WHEN** uma mensagem contém uma URL que aponta directamente a um arquivo de vídeo
- **THEN** a pré-visualização é um player de vídeo reproduzível inline, sem precisar de um clique adicional para carregar

#### Scenario: Pré-visualização indisponível
- **WHEN** a obtenção da pré-visualização de uma URL falha, seja pelo provedor externo ou pela página de destino
- **THEN** a mensagem continua a mostrar o link como texto normal, sem nenhum cartão de erro
