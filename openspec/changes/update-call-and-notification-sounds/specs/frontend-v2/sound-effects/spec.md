# Spec Delta

## ADDED Requirements

### Requirement: Efeitos curtos e suaves para os três avisos
O sistema SHALL usar efeitos distintos e coerentes para menção, entrada e saída de chamada, cada um com duração máxima de 0,7 segundo, início suave e término sem corte brusco. Os efeitos SHALL ser perceptíveis em volume baixo durante uma conversa, sem fala ou música.

#### Scenario: Reprodução dos três efeitos
- **WHEN** o utilizador pré-escuta cada aviso nas definições
- **THEN** ouve três efeitos distinguíveis, curtos e suaves, sem cauda longa

### Requirement: Som de saída de chamada
O sistema SHALL tocar o efeito de saída quando outra pessoa deixa a chamada de voz/vídeo ativa do utilizador ou quando o próprio utilizador a deixa voluntariamente. Não SHALL tocar para saídas em chamadas de que não participa, na carga inicial de ocupantes ou por reconexão interna sem saída real. O efeito SHALL respeitar as mesmas regras de preferência, ensurdecimento, saída de áudio, falha silenciosa e limitação de frequência dos outros efeitos.

#### Scenario: Outra pessoa sai da minha chamada
- **WHEN** uma pessoa anteriormente presente deixa a chamada ativa do utilizador
- **THEN** o efeito de saída toca uma vez para o utilizador

#### Scenario: Minha saída voluntária
- **WHEN** o utilizador aciona sair e a sessão de chamada é encerrada
- **THEN** o efeito de saída toca uma vez para ele

#### Scenario: Reconexão sem saída real
- **WHEN** a lista de ocupantes é refeita após reconexão ou a sessão é reiniciada internamente sem saída voluntária
- **THEN** nenhum efeito de saída toca por essa atualização

#### Scenario: Saídas em rajada
- **WHEN** várias pessoas deixam a chamada quase ao mesmo tempo
- **THEN** o efeito de saída toca uma só vez para a rajada

#### Scenario: Chamada alheia
- **WHEN** alguém deixa uma chamada em que o utilizador não está
- **THEN** nenhum efeito de saída toca

## MODIFIED Requirements

### Requirement: Preferência de efeitos sonoros
O sistema SHALL permitir ligar ou desligar os efeitos sonoros, vindo ligados por omissão, guardar a escolha no dispositivo e respeitá-la imediatamente, sem recarregar. Com os efeitos desligados nenhum som SHALL tocar, exceto a pré-escuta pedida expressamente nas definições. A pré-escuta SHALL oferecer separadamente os efeitos de menção, entrada e saída.

#### Scenario: Desligar
- **WHEN** o utilizador desliga os efeitos sonoros e chega uma menção
- **THEN** nenhum som toca, e a escolha continua desligada depois de recarregar a aplicação

#### Scenario: Primeira utilização
- **WHEN** o utilizador nunca alterou a preferência
- **THEN** os efeitos estão ligados

#### Scenario: Armazenamento indisponível
- **WHEN** o navegador bloqueia o armazenamento local
- **THEN** a preferência funciona durante a sessão e a aplicação não falha

#### Scenario: Pré-escuta de saída
- **WHEN** o utilizador aciona a pré-escuta de saída nas definições, mesmo com os efeitos desligados
- **THEN** o efeito de saída toca uma vez sem mudar a preferência
