# Spec Delta

## MODIFIED Requirements

### Requirement: Renomear canal
O sistema SHALL permitir renomear um canal directamente na lista de canais (edição inline), normalizando espaços para hífens e aplicando um limite de 32 caracteres. Ao passar o ponteiro sobre um canal, SHALL destacar visualmente toda a linha da sidebar, incluindo a área do nome e dos controlos contextuais. Os controlos de renomear e opções SHALL permanecer accionáveis e não SHALL impedir que o utilizador seleccione o canal ao clicar na área do nome, mesmo quando este é curto.

#### Scenario: Renomear com sucesso
- **WHEN** o utilizador edita o nome de um canal e confirma um valor válido
- **THEN** o novo nome é persistido e reflectido imediatamente na sidebar

#### Scenario: Hover destaca toda a linha
- **WHEN** o ponteiro entra na linha de um canal na sidebar
- **THEN** toda a linha recebe o realce visual de hover, em vez de apenas o texto do nome

#### Scenario: Seleccionar canal com nome curto e controlos visíveis
- **WHEN** os controlos contextuais aparecem sobre a linha de um canal com nome curto e o utilizador clica na área do nome
- **THEN** o canal é seleccionado e aberto, sem activar renomeação nem opções

#### Scenario: Abrir controlos contextuais
- **WHEN** o utilizador clica especificamente no controlo de renomear ou de opções
- **THEN** a acção correspondente é aberta sem seleccionar o canal

#### Scenario: Controlos visíveis num nome longo
- **WHEN** os controlos aparecem sobre a linha de um canal com nome longo
- **THEN** o nome continua a ser truncado com reticências, os controlos não deixam texto ilegível por trás de si e clicar no resto do nome abre o canal

#### Scenario: Sem permissão de gestão
- **WHEN** o utilizador não pode gerir canais
- **THEN** a linha tem o mesmo realce e a mesma área clicável, sem controlos de renomear e opções
