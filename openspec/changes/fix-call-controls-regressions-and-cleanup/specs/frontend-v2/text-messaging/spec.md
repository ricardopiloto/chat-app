# Spec Delta

## MODIFIED Requirements

### Requirement: Anexos de imagem decifrados e com lightbox
O sistema SHALL permitir anexar imagens ao compor uma mensagem (incluindo colar directamente da área de transferência), cifrar cada anexo antes do envio, decifrar anexos recebidos localmente antes de os apresentar como miniaturas, e abrir um lightbox ao clicar numa miniatura com zoom, download, navegação entre anexos da mesma mensagem, e fecho por Escape, por um botão explícito e por clique fora da imagem. A miniatura SHALL NOT apresentar o badge “Decrypted on this device”; SHALL manter o controlo de zoom e a legenda que indica que o anexo foi cifrado antes do envio.

#### Scenario: Anexar por colar
- **WHEN** o utilizador cola uma imagem da área de transferência com o composer em foco
- **THEN** a imagem é adicionada à composição como um anexo pendente, tal como se tivesse sido escolhida por ficheiro

#### Scenario: Fechar o lightbox por clique fora
- **WHEN** o lightbox está aberto e o utilizador clica fora da imagem (no fundo escurecido)
- **THEN** o lightbox fecha

#### Scenario: Thumbnail without decrypted badge
- **WHEN** a decrypted image attachment is displayed in the chat thread
- **THEN** its thumbnail has no “Decrypted on this device” badge, while zoom, download, and encrypted metadata remain available
