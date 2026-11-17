# Spec Delta

## MODIFIED Requirements

### Requirement: Vista Composição com layouts nomeados
O sistema SHALL apresentar uma vista "Composição" com três layouts nomeados — Mestre em Destaque, Painel e Faixa — suportando entre 2 e 8 posições, cada posição mostrando o vídeo/áudio da pessoa atribuída com um chip de identificação; ocupantes sem posição atribuída SHALL aparecer numa faixa separada "No banco". O ícone e texto do cabeçalho “No banco” SHALL alinhar-se verticalmente e manter um espaço visível entre si.

#### Scenario: Ocupante sem posição vai para o banco
- **WHEN** um participante entra na chamada e não tem nenhuma posição atribuída na cena activa
- **THEN** esse participante aparece na faixa "No banco", não escondido nem a ocupar uma posição por omissão

#### Scenario: Alternar entre Composição e Grade
- **WHEN** o utilizador alterna do segmento "Composição" para "Grade" (capability `frontend-v2/voice-grid`) e volta
- **THEN** a disposição de Composição é preservada tal como estava antes de alternar

#### Scenario: Bench heading alignment
- **WHEN** a composition view shows its bench footer
- **THEN** the seat icon and “On the bench” label are vertically centered together with consistent spacing
