# Spec Delta

## ADDED Requirements

### Requirement: PiP adapta-se a janelas pequenas

O sistema SHALL reduzir ou reposicionar o PiP quando o espaço disponível for pequeno, sem ocultar a selecção de canal nem os controlos de configuração, preservando a visualização da chamada, os controlos rápidos e o encaixe nos quatro cantos.

#### Scenario: Janela abaixo de Full HD

- **WHEN** o utilizador mantém a chamada em PiP numa janela de 1366×768 ou 1600×900
- **THEN** consegue aceder à selecção de canal e aos controlos de configuração sem precisar de fechar o PiP

#### Scenario: Janela redimensionada

- **WHEN** a janela muda de tamanho com o PiP aberto
- **THEN** o PiP permanece integralmente visível e utilizável no canto escolhido
