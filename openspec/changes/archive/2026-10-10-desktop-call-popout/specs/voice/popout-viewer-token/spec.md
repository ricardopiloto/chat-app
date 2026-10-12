# Spec Delta

## Purpose

Emite um token LiveKit só-de-visualização (oculto, sem publicar) para uma conta que já está activa como ocupante de um canal de voz/vídeo, para uma segunda ligação (janela de popout) à mesma sala — sem repetir os efeitos de entrada já aplicados pela ligação principal.

## ADDED Requirements

### Requirement: Emitir token de visualização só para quem já está no canal

O sistema SHALL emitir um token de visualização (`POST /api/channels/{id}/voice/popout-token`) só quando a conta autenticada já está registada como ocupante activo desse canal, e SHALL recusar o pedido (sem emitir token) quando a conta não está no canal ou está noutro canal.

#### Scenario: Conta já na chamada pede o token

- **WHEN** uma conta já registada como ocupante do canal pede o token de visualização
- **THEN** o sistema emite um token válido para a mesma sala

#### Scenario: Conta fora do canal é recusada

- **WHEN** uma conta que não está (ou já não está) registada como ocupante desse canal pede o token de visualização
- **THEN** o pedido é recusado e nenhum token é emitido

### Requirement: O token é oculto e não permite publicar

O token emitido SHALL ter a permissão `hidden` activa (o participante não aparece na lista de participantes de mais ninguém na sala) e SHALL ter `can_publish` desactivado — a ligação de popout SHALL NOT conseguir publicar áudio/vídeo próprio, só subscrever o que já está a ser publicado.

#### Scenario: Outros participantes não veem o popout como alguém novo

- **WHEN** uma janela de popout liga-se à sala com o token de visualização
- **THEN** os outros participantes da chamada não veem uma entrada nova na lista de participantes por causa dessa ligação

#### Scenario: O popout não consegue publicar

- **WHEN** a ligação de popout tenta publicar uma faixa de áudio/vídeo
- **THEN** o LiveKit recusa, porque o token não tem permissão de publicar

### Requirement: Identidade distinta da ligação principal

O token emitido SHALL usar uma identidade derivada da conta (ex.: `"{account_id}:popout"`), distinta da identidade usada pela ligação principal da mesma conta na mesma sala, para que a segunda ligação não desligue a primeira (o LiveKit exige identidade única por sala e desliga a ligação anterior quando a mesma identidade volta a ligar-se).

#### Scenario: A ligação principal não é afectada

- **WHEN** uma conta já ligada à sala pela janela principal pede e usa um token de visualização numa janela de popout
- **THEN** a ligação principal continua activa, sem interrupção

### Requirement: Emitir o token não repete os efeitos de entrada no canal

O sistema SHALL NOT, ao emitir o token de visualização, repetir nenhum dos efeitos da entrada normal num canal (registo de ocupação, atribuição de slot na grade, difusão de `grid.updated` a membros do servidor) — esses efeitos já foram aplicados pela ligação principal que tornou a conta ocupante.

#### Scenario: Nenhum evento de grade é disparado

- **WHEN** uma conta já na chamada pede um token de visualização
- **THEN** nenhum evento `grid.updated` é difundido e nenhum slot de grade é reatribuído como consequência desse pedido
