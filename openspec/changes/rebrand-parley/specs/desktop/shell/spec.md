# Spec Delta

## MODIFIED Requirements

### Requirement: O ícone da aplicação é a marca oficial, em todas as plataformas

O sistema SHALL usar a marca oficial do Parley (a mesma fonte de `openspec/specs/frontend-v2/brand-identity/spec.md`) como ícone da aplicação em Windows, macOS e Linux, gerado numa resolução adequada a cada formato nativo (`.ico`, `.icns`, conjunto de PNGs), e SHALL NOT apresentar um ícone genérico, de placeholder ou da marca anterior em nenhuma plataforma. O nome de apresentação da aplicação (janela, atalho, dock, instalador) SHALL ser "Parley".

#### Scenario: Ícone correcto no instalador e na barra de tarefas

- **WHEN** a aplicação é instalada ou executada em qualquer uma das três plataformas
- **THEN** o ícone mostrado (barra de tarefas/dock, janela, atalho) é a marca oficial do Parley, na mesma forma usada no favicon e na topbar do build web, e o nome mostrado é "Parley"
