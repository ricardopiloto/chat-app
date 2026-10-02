# floating-voice-pip Specification

## Purpose

Mantém uma chamada de voz/vídeo activa visível e controlável enquanto o utilizador navega para outras partes da aplicação, sem obrigar a voltar ao canal de voz para gerir a chamada.

## Requirements

### Requirement: PiP flutuante visível fora do canal de voz activo
O sistema SHALL apresentar um mini-player flutuante e arrastável quando existe uma chamada de voz/vídeo activa e o utilizador navega para um ecrã diferente do canal dessa chamada, mostrando o nome do canal, a duração da chamada, até 4 posições de câmara (local e remotas) ou um texto de recurso "Em chamada" quando não há vídeo disponível.

#### Scenario: PiP aparece ao sair do canal de voz
- **WHEN** o utilizador está numa chamada activa e navega para um canal de texto
- **THEN** o mini-player flutuante aparece sobre o novo ecrã, mostrando o estado actual da chamada

#### Scenario: PiP desaparece ao voltar ao canal
- **WHEN** o utilizador volta a abrir o canal de voz da chamada activa
- **THEN** o mini-player flutuante deixa de ser apresentado, dando lugar ao palco de chamada completo

### Requirement: Posição arrastável com encaixe de canto
O sistema SHALL permitir arrastar o mini-player para qualquer um dos quatro cantos do ecrã, encaixando nesse canto ao soltar, e SHALL lembrar a posição escolhida entre reaberturas do PiP na mesma sessão.

#### Scenario: Reposicionar o PiP
- **WHEN** o utilizador arrasta o mini-player para um canto diferente do actual
- **THEN** o mini-player encaixa nesse canto ao ser largado, e volta a aparecer nesse mesmo canto se a chamada terminar e uma nova começar na mesma sessão

### Requirement: Acções rápidas no PiP
O sistema SHALL apresentar, no mini-player, uma acção para voltar ao palco completo da chamada, uma acção para terminar a chamada e controlos de microfone, ensurdecer e câmara, todos accionáveis sem precisar de expandir o PiP primeiro.

#### Scenario: Terminar chamada a partir do PiP
- **WHEN** o utilizador aciona terminar chamada directamente no mini-player
- **THEN** a chamada termina e o mini-player desaparece, sem exigir navegação prévia até ao canal de voz

### Requirement: PiP fiel ao mockup
O PiP SHALL cumprir a checklist de D7 (cabeçalho arrastável com nome e duração, até 4 tiles com selo de fala, controlos rápidos e Voltar ao palco).

#### Scenario: Comparação de fidelidade
- **WHEN** a tela é comparada lado a lado com `mesa_chamada_de_voz_v_deo_em_pip_flutuante_mini_player` no mesmo estado, em tema escuro
- **THEN** todos os elementos obrigatórios da checklist de `design.md` D7 estão presentes, nenhum elemento excluído foi implementado, e a classificação é **Fiel**

### Requirement: Paridade funcional do PiP
O sistema SHALL manter todas as funcionalidades existentes desta área: visível fora do canal activo, até 4 câmaras ou "Em chamada", duração, arrastar com encaixe nos quatro cantos, memória de posição na sessão, voltar ao palco e terminar sem expandir.

#### Scenario: Funcionalidades existentes
- **WHEN** cada item desta área de `docs/v2/parity-checklist.md` é exercido na v2
- **THEN** produz o mesmo resultado de produto que na aplicação anterior, contra o mesmo backend
