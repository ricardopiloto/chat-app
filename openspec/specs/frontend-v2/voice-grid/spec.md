# voice-grid Specification

## Purpose

Apresenta uma visão simples e unificada de todos os participantes e partilhas de ecrã de uma chamada, como alternativa à composição nomeada, e permite partilhar o ecrã e destacar uma partilha específica.

## Requirements

### Requirement: Vista Grade unificada
O sistema SHALL apresentar uma vista "Grade" com uma grelha de todos os participantes (câmaras) seguidos de todas as partilhas de ecrã activas, cada câmara com uma cor de identificação estável e destaque visual de fala, sem exigir nenhuma atribuição manual de posição (ao contrário da vista Composição).

#### Scenario: Grade reflecte entradas e saídas automaticamente
- **WHEN** um participante entra ou sai da chamada
- **THEN** a grelha da vista Grade actualiza automaticamente, sem intervenção de um administrador

### Requirement: Partilha de ecrã disponível apenas na vista Grade
O sistema SHALL permitir iniciar e terminar a partilha de ecrã a partir do painel do utilizador apenas quando a vista activa é "Grade" e o utilizador está numa chamada; a partilha activa SHALL aparecer na grelha com um indicador de "Tela" e o handle de quem partilha.

#### Scenario: Partilha de ecrã indisponível em Composição
- **WHEN** a vista activa é "Composição"
- **THEN** o controlo de partilha de ecrã no painel do utilizador não está disponível

### Requirement: Destaque (spotlight) de uma partilha de ecrã
O sistema SHALL permitir promover uma partilha de ecrã activa a um palco principal maior, com as restantes câmaras/partilhas reduzidas a uma faixa lateral, através de um alternador de destaque por partilha.

#### Scenario: Promover uma partilha a destaque
- **WHEN** o utilizador activa o destaque numa partilha de ecrã
- **THEN** essa partilha passa a ocupar o palco principal e as restantes câmaras/partilhas passam para uma faixa lateral, sem interromper nenhuma transmissão em curso

### Requirement: Grade e partilha fiéis aos mockups
A Grade SHALL ter barra com "Compartilhar tela" e "Convidar", tiles com glow e selo de fala e rodapé "Na escuta"; com destaque, a partilha SHALL ocupar o palco principal e as câmaras SHALL ficar numa coluna lateral direita. Zoom, laser e ferramentas de tabuleiro SHALL NOT ser implementados.

#### Scenario: Comparação de fidelidade
- **WHEN** a tela é comparada lado a lado com `mesa_visualiza_o_por_grade_1/_2 e mesa_grade_com_compartilhamento_de_tela_1/_2` no mesmo estado, em tema escuro
- **THEN** todos os elementos obrigatórios da checklist de `design.md` D7 estão presentes, nenhum elemento excluído foi implementado, e a classificação é **Fiel**

### Requirement: Paridade funcional da Grade
O sistema SHALL manter todas as funcionalidades existentes desta área: grelha unificada de câmaras e partilhas, partilha de ecrã só em Grade com indicador, destaque de uma partilha sem interromper transmissões.

#### Scenario: Funcionalidades existentes
- **WHEN** cada item desta área de `docs/v2/parity-checklist.md` é exercido na v2
- **THEN** produz o mesmo resultado de produto que na aplicação anterior, contra o mesmo backend
