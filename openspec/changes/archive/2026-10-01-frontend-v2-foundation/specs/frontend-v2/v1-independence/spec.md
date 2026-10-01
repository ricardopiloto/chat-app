# Spec Delta

## Purpose

Garante que o frontend v2 é uma reescrita real, sem código, estrutura ou estilos herdados do frontend v1, e que isso é verificável.

## ADDED Requirements

### Requirement: Independência do frontend v1
O sistema SHALL ser implementado sem reaproveitar nenhum ficheiro, componente, folha de estilo ou estrutura do frontend v1 (`frontend/`). Apenas o backend e os contratos documentados em `docs/v2/contracts/` SHALL servir de base de compatibilidade. A sobreposição de código com a v1 SHALL ser medida por um script e SHALL respeitar os limiares definidos em `design.md` D7.

#### Scenario: Medição de sobreposição no fecho de uma fase
- **WHEN** uma fase de produto é dada como concluída
- **THEN** o script de sobreposição corre sobre `frontend-v2/src` e nenhum ficheiro de UI excede 15% nem ficheiro de lógica excede 30% de sequências coincidentes com `frontend/src`, ou a excepção está justificada no registo de verificação

#### Scenario: Nenhuma dependência de caminho da v1
- **WHEN** se pesquisa `frontend-v2/` por imports ou referências a `frontend/`
- **THEN** não existe nenhuma
