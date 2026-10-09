# Spec Delta

## MODIFIED Requirements

### Requirement: Lista de mensagens agrupada e separada por dia
O sistema SHALL apresentar as mensagens agrupadas por remetente consecutivo (mostrando o avatar apenas uma vez por grupo) e separadas por marcadores de dia (com rótulos "Hoje"/"Ontem"/data completa), incluindo um marcador fixo no topo da vista enquanto se percorre um dia com scroll. O agrupamento por remetente consecutivo SHALL só continuar enquanto o intervalo entre a mensagem e a mensagem imediatamente anterior do mesmo remetente for de 5 minutos ou menos; passado esse intervalo, a mensagem SHALL iniciar um novo grupo (com o seu próprio avatar e cabeçalho), mesmo sendo o mesmo remetente e o mesmo dia.

#### Scenario: Agrupamento por remetente
- **WHEN** o mesmo remetente envia várias mensagens em sequência sem intervenção de outro remetente, cada uma até 5 minutos depois da anterior
- **THEN** essas mensagens aparecem agrupadas visualmente, com o avatar e o nome mostrados apenas na primeira

#### Scenario: Separador de dia
- **WHEN** existem mensagens de dias diferentes na mesma vista
- **THEN** um separador visual com o rótulo do dia aparece entre elas

#### Scenario: Intervalo longo quebra o agrupamento
- **WHEN** o mesmo remetente envia uma mensagem mais de 5 minutos depois da sua mensagem anterior, no mesmo dia
- **THEN** a nova mensagem inicia um novo grupo, com o seu próprio avatar e cabeçalho
