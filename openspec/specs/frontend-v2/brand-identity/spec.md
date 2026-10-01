# brand-identity Specification

## Purpose

Aplica a marca oficial da Mesa e a camada tipográfica técnica dos mockups de forma consistente em toda a aplicação.

## Requirements

### Requirement: Marca e identidade tipográfica aplicadas
O sistema SHALL usar o logo oficial (`docs/v2/mesa_logo`) em todas as superfícies de marca (topbar, ecrãs de autenticação, favicon) e SHALL fornecer, na biblioteca base, a camada técnica dos mockups: rótulos curtos em fonte mono, chips de estado e rótulos em caixa alta, reutilizáveis por todas as fases.

#### Scenario: Logo em vez de placeholder
- **WHEN** qualquer ecrã que mostra a marca é renderizado
- **THEN** apresenta o logo oficial e nunca um quadrado com letra provisório

#### Scenario: Chips e rótulos mono reutilizáveis
- **WHEN** uma tela precisa de um chip de estado (ex.: E2EE ligada, AO VIVO) ou de um rótulo técnico em mono
- **THEN** usa o componente da biblioteca base, sem estilos locais ad-hoc
