# Spec Delta

## ADDED Requirements

### Requirement: O instalador inclui o servidor do Parley
Cada instalador do app desktop SHALL incluir o executável do servidor do Parley compilado para a plataforma e a arquitetura do instalador, na mesma versão do app. O componente de mídia (LiveKit) SHALL NOT fazer parte do instalador e SHALL ser obtido sob demanda pela função de hospedagem. A contagem de seis instaladores e o `SHA256SUMS` da release SHALL continuar considerando apenas os instaladores.

#### Scenario: Servidor dentro do instalador
- **WHEN** um instalador é gerado pelo workflow de release
- **THEN** o pacote contém o executável do servidor da plataforma e da arquitetura correspondentes

#### Scenario: Versão alinhada
- **WHEN** a versão do app é lida junto com a do servidor embutido
- **THEN** as duas coincidem

#### Scenario: Instalador sem componente de mídia
- **WHEN** o conteúdo do instalador é inspecionado
- **THEN** o `livekit-server` não está presente
