# Spec Delta

## ADDED Requirements

### Requirement: Faixa de identidade do painel do utilizador fiel ao shell

Com o menu de conta fechado, a faixa no fundo da sidebar SHALL mostrar o avatar a 32 px com ponto de presença de 10 px, o nome a mostrar a 12 px na fonte de títulos e na cor on-surface, o handle a 11 px na fonte mono e na cor on-surface-variant, e o botão de definições com ícone de 18 px e cantos de 8 px. O handle SHALL ser só `@handle`, sem sufixo de presença. A linha SHALL usar o espaçamento compacto do mockup `mesa_shell_da_aplica_o_chat_de_texto` (cerca de 6 px na horizontal e 4 px na vertical, intervalo de 8 px entre avatar e texto) e SHALL NOT formar uma barra de 64 px com padding de 12 px. O fundo do rodapé SHALL ser surface-container-lowest, com 8 px de padding, e a linha da identidade SHALL NOT ter borda superior própria. O anel do ponto de presença SHALL ser da mesma cor dessa superfície. Avatares fora desta faixa SHALL manter o tamanho e o anel que já têm.

#### Scenario: Faixa em repouso

- **WHEN** o menu de conta está fechado e a sidebar mostra a faixa de identidade
- **THEN** o nome está a 12 px em on-surface, o handle está a 11 px em on-surface-variant e não inclui "Online", o avatar mede 32 px, o botão de definições tem um ícone de 18 px e cantos de 8 px, e a linha não é uma barra de 64 px com padding de 12 px

#### Scenario: A barra destacada do menu de conta não se aplica em repouso

- **WHEN** o menu de conta está fechado
- **THEN** o handle não usa a cor secondary e não mostra "• Online", que pertencem à barra destacada de `mesa_menu_de_conta_popover_modal_de_sair` e não à faixa em repouso do shell

#### Scenario: Outros avatares ficam iguais

- **WHEN** um avatar é mostrado fora da faixa de identidade da sidebar (mensagem, membros, menu)
- **THEN** o tamanho e o anel de presença desse avatar não mudam por causa desta faixa
