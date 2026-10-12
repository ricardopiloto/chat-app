# Spec Delta

## ADDED Requirements

### Requirement: O botão de membros usa o glifo de grupo de três pessoas

O controlo que mostra ou esconde o painel de membros SHALL usar o glifo Lucide de uma pessoa à frente e duas ao lado, o mais próximo do Material Symbols `group` desenhado no cabeçalho do canal em `docs/v2/mesa_shell_da_aplica_o_chat_de_texto`. O sistema SHALL NOT usar, nesse controlo, o glifo de duas pessoas lado a lado. O mesmo glifo SHALL aparecer em qualquer controlo que já peça o nome de ícone `group`, incluindo o botão da barra de topo e o do cabeçalho do canal.

#### Scenario: O botão de membros mostra três pessoas

- **WHEN** o painel de membros pode ser mostrado ou escondido
- **THEN** o botão desenha uma pessoa à frente e duas ao lado, e não duas pessoas lado a lado
