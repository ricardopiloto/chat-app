# Spec Delta

## Purpose

Garante que cada Canal tem a sua própria chave simétrica de cifragem, distribuída só a quem tem acesso a esse Canal, substituindo a chave única por Servidor e tornando a confidencialidade de canais privados real do ponto de vista criptográfico, não só de autorização de aplicação.

## ADDED Requirements

### Requirement: Chave simétrica própria por Canal
O sistema SHALL ter uma chave simétrica (`channel_key`) própria por Canal, usada para cifrar o conteúdo de mensagens desse Canal e, quando o Canal for de voz/vídeo, como frame key da sessão LiveKit desse Canal. Nenhum Canal SHALL partilhar a sua chave com outro Canal, incluindo outro Canal do mesmo Servidor.

#### Scenario: Dois canais do mesmo servidor têm chaves distintas
- **WHEN** um Servidor tem um canal de texto A e um canal de voz B
- **THEN** a chave usada para cifrar mensagens de A é diferente da chave usada como frame key de B, mesmo pertencendo ao mesmo Servidor

#### Scenario: Mensagem cifrada só é legível com a chave do seu próprio canal
- **WHEN** um cliente tenta decifrar uma mensagem do canal A usando a chave do canal B
- **THEN** a decifragem falha

### Requirement: Envelope de chave escopado ao Canal, não ao Servidor
O sistema SHALL distribuir a `channel_key` por envelope selado (`crypto_box_seal`) por par `(channel_id, account_id)`, nunca em claro para o backend, reaproveitando o mesmo mecanismo de handoff hoje usado para a chave de Servidor (pedido/resposta assíncrona entre clientes já sincronizados).

#### Scenario: Backend nunca vê a chave de canal em claro
- **WHEN** um envelope de `channel_key` é armazenado pelo backend
- **THEN** o backend só persiste bytes opacos (`sealed_key`) e não consegue decifrá-los

#### Scenario: Novo membro com acesso ao canal recebe o envelope
- **WHEN** uma conta ganha acesso a um Canal (via ACL de canal) e nenhum envelope existe para o par `(channel_id, account_id)`
- **THEN** o sistema publica um pedido de handoff para esse Canal, e qualquer cliente já sincronizado com a `channel_key` desse Canal pode responder selando-a para a conta nova

### Requirement: Elegibilidade para receber a chave segue a ACL de canal existente
O sistema SHALL determinar quem deve receber o envelope de um Canal consultando a ACL de canal já existente (visibilidade pública/privada e overwrites allow/deny), em vez de assumir que todo membro do Servidor é elegível.

#### Scenario: Membro sem acesso ao canal privado não recebe o envelope
- **WHEN** uma conta é membro do Servidor mas não tem acesso (ACL) a um Canal privado específico
- **THEN** o sistema não distribui a esse par `(channel_id, account_id)` nenhum envelope da `channel_key` desse Canal

#### Scenario: Acesso concedido a canal privado desencadeia handoff
- **WHEN** um gestor concede acesso (ACL) de um Canal privado a uma conta que antes não o tinha
- **THEN** o sistema trata essa concessão como um pedido de handoff da `channel_key` desse Canal para essa conta

### Requirement: Migração sem caminho retroativo
O sistema SHALL, ao aplicar esta mudança, gerar uma `channel_key` nova por Canal existente e reselar aos membros elegíveis correntes, sem preservar nem tentar tornar legível o conteúdo previamente cifrado sob a antiga `server_key`.

#### Scenario: Conteúdo anterior à migração não precisa ser legível
- **WHEN** a migração para chave por Canal é aplicada
- **THEN** o sistema não é obrigado a oferecer nenhum mecanismo para decifrar mensagens ou sessões de voz anteriores cifradas sob a `server_key` antiga
