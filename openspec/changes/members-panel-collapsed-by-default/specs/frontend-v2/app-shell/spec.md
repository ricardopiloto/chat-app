# Spec Delta

## MODIFIED Requirements

### Requirement: Painel de Membros do servidor
O sistema SHALL apresentar, num painel lateral direito alternável, os membros do servidor activo agrupados por cargo e por presença (online/offline) com contagem de online, avatar, nome e indicador de presença, actualizado pelos eventos `presence.update`. O painel SHALL começar colapsado por omissão, incluindo em viewport largo, e SHALL permanecer oculto por omissão em viewport estreito.

#### Scenario: Presença em tempo real
- **WHEN** um membro fica online ou offline com o painel aberto
- **THEN** o painel move o membro de grupo e actualiza a contagem sem recarregar

#### Scenario: Painel alternável
- **WHEN** o utilizador alterna o painel de Membros no cabeçalho do canal
- **THEN** o painel abre ou fecha e a preferência é lembrada na sessão

#### Scenario: Estado inicial numa sessão nova
- **WHEN** o utilizador entra num servidor pela primeira vez numa sessão, sem ter alternado o painel antes
- **THEN** o painel de Membros começa colapsado, mesmo em viewport largo
