# Spec Delta

## MODIFIED Requirements

### Requirement: Saltar para o presente

O sistema SHALL apresentar uma pill "Saltar para o presente" sempre que o utilizador está desviado do fundo da lista de mensagens (independentemente de terem chegado mensagens novas), SHALL mostrar uma contagem junto à pill quando houver mensagens novas acumuladas desde que o utilizador se desviou do fundo, e SHALL rolar para o fundo e ocultar a pill ao ser clicada.

#### Scenario: Scroll para mensagens antigas sem mensagens novas

- **WHEN** o utilizador rola para cima, para ler mensagens antigas, e nenhuma mensagem nova chega enquanto isso
- **THEN** a pill de saltar para o presente aparece, sem nenhuma contagem visível

#### Scenario: Mensagens novas fora da vista

- **WHEN** o utilizador está a ler mensagens antigas (scroll para cima) e chega uma mensagem nova
- **THEN** a pill de saltar para o presente aparece (ou já visível, actualiza) com a contagem de mensagens novas acumuladas
