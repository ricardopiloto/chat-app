# Spec Delta

## MODIFIED Requirements

### Requirement: Destaque (spotlight) de uma partilha de ecrã
O sistema SHALL permitir promover uma partilha de ecrã activa a um palco principal maior, com as restantes câmaras/partilhas reduzidas a uma faixa inferior, através de um alternador de destaque por partilha. O tile principal do destaque SHALL oferecer uma opção de tela-cheia real do navegador, distinta do alternador de destaque, que sai automaticamente quando o utilizador usa a tecla Esc do navegador.

#### Scenario: Dono da partilha destacado

- **WHEN** uma partilha é promovida a spotlight na Grade
- **THEN** o palco principal mostra uma indicação clara de quem partilha e o tile correspondente, quando presente, tem um destaque visual distinto dos outros

#### Scenario: Spotlight terminado

- **WHEN** o utilizador desactiva o spotlight
- **THEN** o destaque de participante é removido e a Grade normal regressa

#### Scenario: Promover uma partilha a destaque
- **WHEN** o utilizador activa o destaque numa partilha de ecrã
- **THEN** essa partilha passa a ocupar o palco principal e as restantes câmaras/partilhas passam para uma faixa inferior, sem interromper nenhuma transmissão em curso

#### Scenario: Tela-cheia da partilha em destaque
- **WHEN** o utilizador activa a opção de tela-cheia no tile principal do destaque
- **THEN** essa partilha ocupa o ecrã inteiro do dispositivo, mantendo visível a legenda e o indicador de transmissão em curso

#### Scenario: Saída de tela-cheia por Esc
- **WHEN** o utilizador está em tela-cheia de uma partilha em destaque e pressiona Esc
- **THEN** a tela-cheia termina e a vista de Grade com destaque volta a aparecer normalmente, com o botão de tela-cheia reflectindo o estado actual

### Requirement: Grade e partilha fiéis aos mockups
A Grade SHALL ter barra com "Compartilhar tela" e "Convidar", tiles com glow e selo de fala e rodapé "Na escuta"; com destaque, a partilha SHALL ocupar o palco principal e as câmaras SHALL ficar numa faixa inferior, não numa coluna lateral. Zoom, laser e ferramentas de tabuleiro SHALL NOT ser implementados.

#### Scenario: Comparação de fidelidade
- **WHEN** a tela é comparada lado a lado com `mesa_visualiza_o_por_grade_1/_2 e mesa_grade_com_compartilhamento_de_tela_1/_2` no mesmo estado, em tema escuro, excepto quanto à posição da faixa de câmaras em destaque (inferior, por decisão deliberada desta change, divergindo do mockup original)
- **THEN** todos os restantes elementos obrigatórios da checklist de `design.md` D7 estão presentes, nenhum elemento excluído foi implementado, e a classificação é **Fiel** nesses restantes elementos
