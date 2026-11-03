# Spec Delta

## MODIFIED Requirements

### Requirement: Marca e identidade tipográfica aplicadas
O sistema SHALL usar o logo oficial do Parley em todas as superfícies de marca (topbar, ecrãs de autenticação, favicon, apple-touch-icon) e o nome "Parley" em todo o texto visível ao utilizador (títulos de página, textos dos catálogos pt-BR e en, texto alternativo do logo), e SHALL fornecer, na biblioteca base, a camada técnica dos mockups: rótulos curtos em fonte mono, chips de estado e rótulos em caixa alta, reutilizáveis por todas as fases.

#### Scenario: Logo em vez de placeholder
- **WHEN** qualquer ecrã que mostra a marca é renderizado
- **THEN** apresenta o logo oficial do Parley e nunca um quadrado com letra provisório nem o logo anterior

#### Scenario: Nome do produto nos textos
- **WHEN** qualquer ecrã, em pt-BR ou en, refere o produto pelo nome
- **THEN** o nome mostrado é "Parley"

#### Scenario: Chips e rótulos mono reutilizáveis
- **WHEN** uma tela precisa de um chip de estado (ex.: E2EE ligada, AO VIVO) ou de um rótulo técnico em mono
- **THEN** usa o componente da biblioteca base, sem estilos locais ad-hoc

## ADDED Requirements

### Requirement: Identificadores internos e rótulos criptográficos não mudam com a marca

O sistema SHALL manter inalterados os rótulos de derivação de chave `mesa-recovery-v1` e `mesa-invite-seed-v1`, as chaves de armazenamento local com prefixo `mesa.`, o protocolo `mesa://`, os canais de comunicação internos do shell com prefixo `mesa:`, o cabeçalho `x-mesa-media-type` e o marcador `__MESA_NATIVE__`, independentemente do nome do produto.

#### Scenario: Chaves derivadas continuam válidas
- **WHEN** uma recovery key ou um convite criado antes do rebrand é usado depois dele
- **THEN** a chave derivada é idêntica e o acesso funciona

#### Scenario: Chaves de canal do cliente web preservadas
- **WHEN** um usuário do cliente web, com chaves de canal guardadas localmente, abre a versão com o nome novo
- **THEN** o histórico cifrado continua legível sem pedir a recovery key

#### Scenario: Rótulos fixados por teste
- **WHEN** o teste de contratos corre e algum dos dois rótulos criptográficos difere do valor de referência
- **THEN** o teste falha
