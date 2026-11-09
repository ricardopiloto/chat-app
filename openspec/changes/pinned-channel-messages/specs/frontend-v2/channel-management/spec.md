# Spec Delta

## ADDED Requirements

### Requirement: Gestão da mensagem pinada
O sistema SHALL permitir pinar, substituir e despinar mensagens de texto apenas a quem tem permissão efetiva de gestão do canal, segundo as regras de hierarquia já usadas nas demais ações de gestão. Membros sem essa permissão SHALL poder ver e acessar o pin, mas SHALL ser impedidos de alterá-lo.

#### Scenario: Substituição confirmada
- **WHEN** um gestor tenta pinar outra mensagem enquanto existe um pin
- **THEN** o sistema informa que o pin anterior será removido e só efetua a troca após confirmação

#### Scenario: Substituição cancelada
- **WHEN** o gestor cancela a confirmação
- **THEN** o pin anterior permanece e nenhuma troca é enviada

#### Scenario: Despinar
- **WHEN** um gestor remove o pin atual
- **THEN** o canal fica sem mensagem pinada para todos os membros

#### Scenario: Acesso sem gestão
- **WHEN** um membro sem permissão tenta alterar o pin por meio da interface ou da API
- **THEN** a ação de gestão não fica disponível na interface e a API recusa a alteração
