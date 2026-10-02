# Spec Delta

## Purpose

Permite compor a aparência de uma chamada de voz/vídeo atribuindo participantes a posições fixas e nomeadas, para uso como fonte de vídeo apresentável (streaming/gravação externa) sem precisar de um software de produção de vídeo à parte.

## ADDED Requirements

### Requirement: Vista Composição com layouts nomeados
O sistema SHALL apresentar uma vista "Composição" com três layouts nomeados — Mestre em Destaque, Painel e Faixa — suportando entre 2 e 8 posições, cada posição mostrando o vídeo/áudio da pessoa atribuída com um chip de identificação; ocupantes sem posição atribuída SHALL aparecer numa faixa separada "No banco".

#### Scenario: Ocupante sem posição vai para o banco
- **WHEN** um participante entra na chamada e não tem nenhuma posição atribuída na cena activa
- **THEN** esse participante aparece na faixa "No banco", não escondido nem a ocupar uma posição por omissão

#### Scenario: Alternar entre Composição e Grade
- **WHEN** o utilizador alterna do segmento "Composição" para "Grade" (capability `frontend-v2/voice-grid`) e volta
- **THEN** a disposição de Composição é preservada tal como estava antes de alternar

### Requirement: Editor de cena com atribuição por arrastar e selector de layout
O sistema SHALL permitir, a quem tem permissão de administração do canal, entrar num modo de edição que substitui a vista de Composição, permitindo: arrastar (ou tocar-para-atribuir) um ocupante do banco para uma posição numerada; devolver um ocupante ao banco ao clicar na sua posição; escolher o número de posições (2 a 8); escolher qual dos três layouts nomeados está activo (com pré-visualização); e guardar ou descartar as alterações.

#### Scenario: Reduzir o número de posições com ocupantes atribuídos
- **WHEN** o administrador reduz o número de posições para um valor menor do que o número de posições actualmente ocupadas
- **THEN** o sistema pede explicitamente para escolher quais posições remover, antes de aplicar a redução

#### Scenario: Fechar o editor com alterações por guardar
- **WHEN** o administrador tenta sair do modo de edição com alterações ainda não guardadas
- **THEN** o sistema apresenta uma confirmação com as opções Cancelar, Descartar e Guardar, sem perder as alterações silenciosamente

### Requirement: Uma única cena editável por canal
O sistema SHALL editar apenas a cena actualmente activa de cada canal de voz — SHALL NOT apresentar uma lista de múltiplas cenas nomeadas para criar, duplicar, activar ou apagar. Múltiplas cenas por canal é funcionalidade futura registada em `docs/backlog/backlog.md` (item G10).

#### Scenario: Ausência de lista de cenas
- **WHEN** o utilizador abre o menu de opções do canal de voz
- **THEN** não existe nenhuma opção de "Cenas" com uma lista de várias cenas nomeadas — só "Editar cena" para a cena única activa

### Requirement: Palco e editor de cenas fiéis aos mockups
O palco SHALL ter cabeçalho com AO VIVO, duração e segmentos, tiles com selo de fala, avatar e chips, e faixa "No banco"; o editor SHALL ter cabeçalho com modo de edição, palco com slots, painel lateral de posições/layout/banco e confirmação de alterações. O inspector de slot SHALL NOT ser implementado.

#### Scenario: Comparação de fidelidade
- **WHEN** a tela é comparada lado a lado com `mesa_palco_de_voz_v_deo_composi_o_de_c_meras, mesa_editor_de_cenas_de_composi_o_1 e mesa_editor_de_cenas_de_composi_o_2` no mesmo estado, em tema escuro
- **THEN** todos os elementos obrigatórios da checklist de `design.md` D7 estão presentes, nenhum elemento excluído foi implementado, e a classificação é **Fiel**

### Requirement: Paridade funcional da composição
O sistema SHALL manter todas as funcionalidades existentes desta área: três layouts nomeados, 2 a 8 posições, banco, editor de cena (atribuir, devolver, escolha de remoção ao reduzir, confirmação de alterações), cena única por canal e preservação da disposição ao alternar para Grade.

#### Scenario: Funcionalidades existentes
- **WHEN** cada item desta área de `docs/v2/parity-checklist.md` é exercido na v2
- **THEN** produz o mesmo resultado de produto que na aplicação anterior, contra o mesmo backend
