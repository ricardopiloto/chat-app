# Spec Delta

## ADDED Requirements

### Requirement: Secção de efeitos sonoros nas definições
O sistema SHALL apresentar na página de Áudio & Vídeo uma secção "Efeitos sonoros" com um interruptor para ligar ou desligar os efeitos e um botão por efeito (nova menção e chegada à chamada) que o reproduz na saída de áudio escolhida, para o utilizador o ouvir e ajustar a saída.

#### Scenario: Pré-escuta
- **WHEN** o utilizador carrega no botão de um efeito
- **THEN** esse efeito toca na saída escolhida, mesmo que os efeitos estejam desligados, e não afeta o limite de frequência dos avisos reais

#### Scenario: Interruptor reflete a preferência
- **WHEN** o utilizador abre a página
- **THEN** o interruptor mostra o estado guardado e alterá-lo tem efeito imediato
