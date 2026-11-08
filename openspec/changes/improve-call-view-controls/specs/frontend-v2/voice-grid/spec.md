# Spec Delta

## MODIFIED Requirements

### Requirement: Partilha de ecrã disponível apenas na vista Grade

O sistema SHALL permitir iniciar e terminar a partilha de ecrã a partir dos controlos da chamada tanto em Composição como em Grade, quando o utilizador pode falar. Ao iniciar a partilha com sucesso, SHALL activar automaticamente a vista Grade e apresentar a partilha com indicador de ecrã e identidade de quem partilha. Se a captura falhar ou for cancelada, SHALL conservar a vista anterior.

#### Scenario: Partilha iniciada em Composição

- **WHEN** o utilizador inicia com sucesso uma partilha enquanto vê Composição
- **THEN** a vista muda para Grade e mostra a nova partilha

#### Scenario: Captura cancelada

- **WHEN** o utilizador cancela a escolha de ecrã em Composição
- **THEN** permanece em Composição sem partilha activa

#### Scenario: Partilha de ecrã indisponível em Composição

- **WHEN** a vista activa é «Composição» e o utilizador pode falar
- **THEN** o controlo de partilha está disponível e, após início bem-sucedido, a vista muda para Grade

### Requirement: Destaque (spotlight) de uma partilha de ecrã

O sistema SHALL permitir promover uma partilha activa ao palco principal, com as restantes câmaras/partilhas numa faixa lateral, e SHALL identificar visual e textualmente o participante dono da partilha destacada, inclusive se a sua câmara estiver desligada.

#### Scenario: Dono da partilha destacado

- **WHEN** uma partilha é promovida a spotlight na Grade
- **THEN** o palco principal mostra uma indicação clara de quem partilha e o tile correspondente, quando presente, tem um destaque visual distinto dos outros

#### Scenario: Spotlight terminado

- **WHEN** o utilizador desactiva o spotlight
- **THEN** o destaque de participante é removido e a Grade normal regressa

#### Scenario: Promover uma partilha a destaque

- **WHEN** o utilizador activa o destaque numa partilha de ecrã
- **THEN** essa partilha ocupa o palco principal e as restantes câmaras/partilhas passam à faixa lateral, sem interromper transmissões

### Requirement: Grade e partilha fiéis aos mockups

A Grade SHALL ter barra com "Compartilhar tela" e "Convidar", tiles com glow e selo de fala e rodapé "Na escuta"; a partilha SHALL estar disponível em Composição e Grade; com destaque, a partilha SHALL ocupar o palco principal e as câmaras SHALL ficar numa coluna lateral direita. Zoom, laser e ferramentas de tabuleiro SHALL NOT ser implementados.

#### Scenario: Comparação de fidelidade

- **WHEN** a tela é comparada lado a lado com `mesa_visualiza_o_por_grade_1/_2 e mesa_grade_com_compartilhamento_de_tela_1/_2` no mesmo estado, em tema escuro
- **THEN** todos os elementos obrigatórios da checklist de `design.md` D7 estão presentes, nenhum elemento excluído foi implementado, e a classificação é **Fiel**

### Requirement: Paridade funcional da Grade

O sistema SHALL manter todas as funcionalidades existentes desta área: grelha unificada de câmaras e partilhas, partilha de ecrã em Composição e Grade com indicador, destaque de uma partilha sem interromper transmissões.

#### Scenario: Funcionalidades existentes

- **WHEN** cada item desta área de `docs/v2/parity-checklist.md` é exercido na v2
- **THEN** produz o mesmo resultado de produto que na aplicação anterior, contra o mesmo backend
