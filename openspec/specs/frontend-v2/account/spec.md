# account Specification

## Purpose

Dá ao utilizador um lugar dedicado para gerir a sua identidade pública na Mesa (nome a mostrar, avatar, idioma) sem expor funcionalidades que o backend não suporta.

## Requirements

### Requirement: Página mínima de Minha Conta
O sistema SHALL oferecer uma página "Minha conta", acessível a partir do menu de conta, com cabeçalho (avatar, nome a mostrar editável, handle), alteração e remoção de avatar (JPEG/PNG/WebP, até 1 MiB) e selector de idioma (pt-BR/en). SHALL NOT apresentar perfil estendido, biografia, e-mail de recuperação, Passkeys, visibilidade na malha P2P, métricas de autonomia nem acções de destruição de identidade.

#### Scenario: Editar o nome a mostrar
- **WHEN** o utilizador altera o nome a mostrar e guarda
- **THEN** o nome é persistido no backend e reflectido no painel do utilizador, no painel de Membros e nas mensagens, sem alterar o handle

#### Scenario: Avatar inválido
- **WHEN** o ficheiro escolhido excede 1 MiB ou não é JPEG/PNG/WebP
- **THEN** o sistema rejeita-o com uma mensagem clara sem o enviar ao backend

#### Scenario: Ausência de itens fora de escopo
- **WHEN** o utilizador percorre a página
- **THEN** não existe nenhuma opção de recuperação por e-mail, Passkeys, dispositivos ou visibilidade P2P

### Requirement: Página de conta fiel ao subconjunto do mockup
A página SHALL seguir a estrutura visual de `mesa_configura_es_minha_conta_perfil_soberano` no subconjunto em escopo (cabeçalho de perfil, cartões com cabeçalho, navegação lateral de configurações) e SHALL ser classificada **Fiel** para esse subconjunto.

#### Scenario: Comparação de fidelidade
- **WHEN** a página é comparada com o mockup considerando só os elementos em escopo
- **THEN** a estrutura de cabeçalho, cartões e navegação lateral corresponde ao mockup
