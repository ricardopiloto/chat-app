# Spec Delta

## Purpose
Garantir que, sem semente de convite (convites antigos, link truncado, recuperação de senha por código do operador), os membros pendentes são atendidos de forma previsível assim que um membro sincronizado liga, e que o estado de espera é explícito.

## ADDED Requirements

### Requirement: Atendimento em lote de pendentes
Quando um membro `synced` liga, o sistema SHALL entregar-lhe os pedidos `key_handoff.requested` de todos os membros `pending` dos seus servidores, e o cliente SHALL atendê-los de forma idempotente, deduplicando por conta e limitando a concorrência.

#### Scenario: Vários pendentes
- **WHEN** um membro `synced` liga e há vários membros `pending` no servidor
- **THEN** todos recebem envelope e passam a `synced`

#### Scenario: Atendimento repetido
- **WHEN** dois membros `synced` atendem o mesmo pedido
- **THEN** o segundo pedido idêntico responde com sucesso sem emitir novo `key_handoff.completed`

### Requirement: Estado de espera explícito
O cliente SHALL mostrar, a um membro `pending`, que está a aguardar um membro online, e SHALL ficar utilizável automaticamente quando `key_handoff.completed` chegar, sem recarregar.

#### Scenario: Espera
- **WHEN** um membro `pending` abre o servidor
- **THEN** vê a mensagem "aguardando um membro online" em vez de um canal vazio ou erro

#### Scenario: Conclusão
- **WHEN** chega `key_handoff.completed` para o membro
- **THEN** o histórico é decifrado e o compositor é ativado
