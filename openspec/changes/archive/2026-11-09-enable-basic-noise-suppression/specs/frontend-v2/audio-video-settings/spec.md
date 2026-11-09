# Spec Delta

## MODIFIED Requirements

### Requirement: Definições fiéis ao subconjunto do mockup
A página SHALL seguir a estrutura de `mesa_configura_es_udio_v_deo` no subconjunto em escopo (cartões de dispositivos de entrada e saída com medidor, cartão de câmara com pré-visualização e blur, navegação lateral de configurações) e SHALL ser classificada **Fiel** para esse subconjunto. PTT e atalhos, cancelamento de eco, AGC, codec, aceleração GPU, espelhar câmara e telemetria de rede SHALL NOT ser implementados.

#### Scenario: Comparação de fidelidade
- **WHEN** a página é comparada com o mockup considerando só os elementos em escopo
- **THEN** a estrutura de cartões, o medidor e a pré-visualização correspondem ao mockup e nenhum elemento excluído foi acrescentado

## ADDED Requirements

### Requirement: Supressão de ruído nativa no microfone
O sistema SHALL pedir supressão de ruído nativa do navegador na captura de microfone das chamadas e no teste local do microfone nas definições, com ou sem dispositivo escolhido. A chamada já satisfaz este requisito por omissão do LiveKit; esta change torna o pedido explícito nesse caminho e passa a pedi-lo no `getUserMedia` directo do teste local. SHALL NOT exigir processamento próprio nem um controlo de supressão nesta fase.

#### Scenario: Chamada com microfone por omissão ou escolhido
- **WHEN** o utilizador entra numa chamada com o microfone por omissão ou escolhido
- **THEN** a captura pede a constraint de supressão de ruído nativa, como já acontece por omissão do LiveKit

#### Scenario: Teste local do microfone por omissão ou escolhido
- **WHEN** o utilizador testa nas definições o microfone por omissão ou escolhido
- **THEN** a captura directa do preview pede a constraint de supressão de ruído nativa para esse microfone
