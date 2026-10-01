# functional-parity Specification

## Purpose

Garante que nenhuma funcionalidade actual da aplicação se perde na reescrita e que o backend só muda quando o frontend o exige.

## Requirements

### Requirement: Paridade funcional com a aplicação actual
O sistema SHALL manter todas as funcionalidades que a aplicação tem hoje, sem exceção, salvo as explicitamente excluídas do escopo (`docs/v2/TR-frontend-v2.md` §4.2 e §7). O inventário SHALL estar registado em `docs/v2/parity-checklist.md`, com cada funcionalidade atribuída a uma fase e a um critério de verificação, e cada fase SHALL verificar os seus itens antes de ser dada como concluída.

#### Scenario: Funcionalidade existente continua disponível
- **WHEN** uma funcionalidade listada em `docs/v2/parity-checklist.md` é exercida na v2 (ex.: silenciar membro num canal, anexar imagem por colar, partilhar ecrã)
- **THEN** funciona com o mesmo resultado de produto que na aplicação actual, contra o mesmo backend

#### Scenario: Omissão só com exclusão explícita
- **WHEN** uma funcionalidade do inventário não está implementada
- **THEN** existe uma exclusão registada em `docs/v2/TR-frontend-v2.md` §4.2/§7 que a justifica; caso contrário a fase não é aceite

### Requirement: Backend reaproveitado, alterado só por necessidade do frontend
O sistema SHALL usar o backend existente sem alterações. Uma alteração de backend SHALL só ser feita quando um requisito do frontend v2 a exigir e não houver alternativa no cliente, SHALL ser aditiva e retrocompatível com a v1 enquanto o rollback for possível, SHALL estar registada como tarefa explícita do change que a exige e reflectida em `docs/v2/contracts/`, e SHALL passar os testes do backend.

#### Scenario: Frontend exige uma alteração
- **WHEN** um requisito do frontend não pode ser satisfeito com os endpoints actuais
- **THEN** a alteração de backend necessária é planeada como tarefa do change, com contrato actualizado e testes, antes de a funcionalidade ser dada como concluída

#### Scenario: Nenhuma alteração gratuita
- **WHEN** um elemento de mockup exigiria dados ou endpoints inexistentes
- **THEN** o elemento é tratado como fora de escopo e o backend não é alterado por causa dele
