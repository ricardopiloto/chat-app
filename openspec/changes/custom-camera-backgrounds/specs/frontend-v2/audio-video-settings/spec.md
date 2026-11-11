# Spec Delta

## ADDED Requirements

### Requirement: Gestão de planos de fundo personalizados da câmara

O sistema SHALL permitir a cada conta autenticada enviar imagens próprias (`image/jpeg`, `image/png` ou `image/webp`, até um tamanho máximo por imagem e um número máximo de imagens por conta), listá-las e remover qualquer uma delas, guardadas no backend e disponíveis em qualquer dispositivo onde a conta entra. O sistema SHALL rejeitar envios fora do tipo, tamanho ou limite de contagem suportados, e SHALL expor leitura e remoção apenas ao próprio dono de cada imagem.

#### Scenario: Enviar e listar um fundo

- **WHEN** a conta envia uma imagem válida como plano de fundo
- **THEN** a imagem passa a aparecer na lista de fundos da conta, em qualquer dispositivo onde essa conta entrar

#### Scenario: Remover um fundo

- **WHEN** a conta remove um dos seus fundos
- **THEN** a imagem deixa de aparecer na lista e já não pode ser usada como plano de fundo activo

#### Scenario: Limite de tamanho ou contagem excedido

- **WHEN** a conta tenta enviar uma imagem acima do tamanho máximo, ou já atingiu o número máximo de fundos guardados
- **THEN** o envio falha com um erro de validação e nenhum fundo novo é criado

#### Scenario: Acesso de outra conta

- **WHEN** uma conta tenta listar, obter ou remover um fundo que pertence a outra conta
- **THEN** o sistema responde como se o fundo não existisse para quem pediu

### Requirement: Selecção de plano de fundo nas definições e no menu de blur da chamada

O sistema SHALL permitir escolher, nas definições de Áudio & Vídeo e no menu de blur da chamada, entre "Sem blur", os níveis de blur já existentes, ou um dos fundos personalizados da conta, substituindo o fundo da câmara pela imagem escolhida enquanto esse efeito estiver activo. A escolha activa SHALL ser lembrada no dispositivo (como já acontece com o nível de blur) e SHALL ser usada ao entrar numa chamada. Se o fundo escolhido localmente já não existir (por ter sido removido), o sistema SHALL usar "Sem blur" em seu lugar.

#### Scenario: Escolher um fundo personalizado

- **WHEN** a pessoa escolhe um dos seus fundos personalizados nas definições ou no menu de blur da chamada
- **THEN** a câmara passa a mostrar esse fundo em vez do ambiente real, e a escolha é lembrada para a próxima chamada nesse dispositivo

#### Scenario: Fundo activo removido

- **WHEN** o fundo escolhido localmente deixou de existir (removido noutro dispositivo ou nas definições)
- **THEN** o sistema aplica "Sem blur" em vez de falhar ou travar a câmara

#### Scenario: Ambiente sem suporte ao efeito

- **WHEN** o navegador não suporta os processadores de vídeo necessários
- **THEN** a página mostra o mesmo aviso inline já usado para o blur não suportado, tanto para blur como para fundos personalizados
