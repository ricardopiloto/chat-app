# invite-key-seed Specification

## Purpose

Permitir que um convite transporte a chave do servidor de forma que o convidado fique utilizável na aceitação, sem depender de um membro sincronizado online e sem o backend ver a chave.

## Requirements

### Requirement: Convite com semente de chave
O sistema SHALL permitir que um membro `synced` crie um convite que transporta a `server_key` selada para uma chave efémera, cuja parte privada vive apenas no fragmento (`#`) do link e nunca é enviada ao backend. O backend SHALL guardar apenas o blob selado, opaco.

#### Scenario: Criação com semente
- **WHEN** um membro `synced` cria um convite com semente
- **THEN** o link contém o fragmento com a chave efémera e o backend recebe apenas o blob selado

#### Scenario: Criador sem chave
- **WHEN** um membro `pending` cria um convite
- **THEN** o convite é criado sem semente e o criador é avisado de que o convidado dependerá do handoff online

### Requirement: Aceitação sincroniza sem membro online
Quando o convite tem semente e o link traz o fragmento, o convidado SHALL abrir a `server_key` localmente, verificá-la, publicar o seu próprio envelope e ficar `synced` sem que nenhum outro membro esteja online. Isto SHALL valer tanto para o utilizador com sessão como para o visitante que se regista na aceitação.

#### Scenario: Entrada com todos os membros offline
- **WHEN** um convidado aceita um convite com semente e nenhum membro está online
- **THEN** o convidado fica `synced` e consegue ler e enviar mensagens

#### Scenario: Visitante novo
- **WHEN** um visitante sem conta aceita o convite registando-se no mesmo pedido
- **THEN** recebe a semente na resposta da aceitação e fica `synced` sem membro online

#### Scenario: Fragmento ausente
- **WHEN** o convidado aceita o convite sem o fragmento (link truncado)
- **THEN** a aceitação ocorre sem abrir a chave e o convidado fica `pending` à espera de handoff online

#### Scenario: Falha parcial
- **WHEN** a chave aberta não passa a verificação, ou a publicação do envelope falha
- **THEN** o convidado entra no servidor como `pending`, nenhum envelope inválido é publicado e o handoff online continua disponível

### Requirement: Confidencialidade e elegibilidade da semente
O backend SHALL devolver a semente apenas na resposta da aceitação autenticada, nunca no preview anónimo nem na listagem, e SHALL NOT devolvê-la a quem já era membro. A publicação do envelope próprio SHALL ser permitida apenas a um membro `pending` que entrou por um convite com semente e ainda não tem envelope.

#### Scenario: Preview anónimo
- **WHEN** um visitante sem sessão consulta o convite
- **THEN** a resposta não inclui o blob selado

#### Scenario: Quem já é membro
- **WHEN** um membro existente volta a aceitar o mesmo convite
- **THEN** recebe a membership sem a semente

#### Scenario: Sem convite com semente
- **WHEN** um membro `pending` que não entrou por convite com semente tenta publicar o envelope próprio com o servidor já com chave
- **THEN** o backend recusa com 409

#### Scenario: Segundo envelope
- **WHEN** a mesma conta tenta publicar um segundo envelope diferente
- **THEN** o backend recusa

### Requirement: Revogação do convite
A revogação SHALL impedir novas aceitações com semente, e SHALL NOT retirar a elegibilidade de quem já aceitou e ainda não publicou o envelope.

#### Scenario: Nova aceitação após revogar
- **WHEN** o convite é revogado e alguém tenta aceitá-lo
- **THEN** a aceitação é recusada

#### Scenario: Aceitou antes de revogar
- **WHEN** um convidado aceitou e o convite é revogado antes de ele publicar o envelope
- **THEN** ele ainda consegue publicar o envelope próprio
