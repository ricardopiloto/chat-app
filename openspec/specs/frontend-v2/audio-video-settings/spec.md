# audio-video-settings Specification

## Purpose

Permite escolher e testar os dispositivos de áudio e vídeo e o fundo da câmara antes e fora de uma chamada, de modo que a entrada numa chamada use as escolhas do utilizador.

## Requirements

### Requirement: Selecção e teste de dispositivos
O sistema SHALL oferecer uma página de definições de Áudio & Vídeo que lista os microfones, câmaras e (quando o navegador suporta) saídas de áudio disponíveis, permite escolher cada um, mostra o nível do microfone em tempo real, reproduz um som de teste na saída escolhida e pré-visualiza a câmara escolhida. As escolhas SHALL persistir no dispositivo e SHALL ser usadas ao entrar numa chamada.

#### Scenario: Escolher microfone
- **WHEN** o utilizador escolhe outro microfone na lista
- **THEN** o medidor de nível passa a reflectir esse microfone e a escolha é lembrada para a próxima chamada

#### Scenario: Sem permissão de dispositivos
- **WHEN** o navegador não concedeu acesso a câmara ou microfone
- **THEN** a página explica como conceder acesso e não apresenta listas vazias sem explicação

#### Scenario: Dispositivo desligado
- **WHEN** o dispositivo guardado já não está disponível
- **THEN** o sistema usa o dispositivo por omissão e informa o utilizador

### Requirement: Blur de fundo nas definições
O sistema SHALL permitir escolher Sem blur, Blur leve ou Blur forte nas definições, partilhando a escolha com o menu de blur da chamada, e SHALL mostrar erro inline quando o ambiente não suporta o efeito.

#### Scenario: Preferência partilhada
- **WHEN** o utilizador escolhe Blur leve nas definições
- **THEN** a próxima chamada e o menu de blur da chamada mostram Blur leve como escolhido

### Requirement: Definições fiéis ao subconjunto do mockup
A página SHALL seguir a estrutura de `mesa_configura_es_udio_v_deo` no subconjunto em escopo (cartões de dispositivos de entrada e saída com medidor, cartão de câmara com pré-visualização e blur, navegação lateral de configurações) e SHALL ser classificada **Fiel** para esse subconjunto. PTT e atalhos, supressão de ruído, cancelamento de eco, AGC, codec, aceleração GPU, espelhar câmara e telemetria de rede SHALL NOT ser implementados.

#### Scenario: Comparação de fidelidade
- **WHEN** a página é comparada com o mockup considerando só os elementos em escopo
- **THEN** a estrutura de cartões, o medidor e a pré-visualização correspondem ao mockup e nenhum elemento excluído foi acrescentado

### Requirement: Secção de efeitos sonoros nas definições
O sistema SHALL apresentar na página de Áudio & Vídeo uma secção "Efeitos sonoros" com um interruptor para ligar ou desligar os efeitos e um botão por efeito (nova menção e chegada à chamada) que o reproduz na saída de áudio escolhida, para o utilizador o ouvir e ajustar a saída.

#### Scenario: Pré-escuta
- **WHEN** o utilizador carrega no botão de um efeito
- **THEN** esse efeito toca na saída escolhida, mesmo que os efeitos estejam desligados, e não afeta o limite de frequência dos avisos reais

#### Scenario: Interruptor reflete a preferência
- **WHEN** o utilizador abre a página
- **THEN** o interruptor mostra o estado guardado e alterá-lo tem efeito imediato
