# Spec Delta

## Purpose

Permite encontrar mensagens antigas em qualquer servidor/canal do utilizador e ser avisado de menções, respostas e canais com novidade, a partir dos pontos de entrada já existentes na topbar desde a Fase 1.

## ADDED Requirements

### Requirement: Pesquisa por texto livre ou âmbito de canal
O sistema SHALL permitir pesquisar mensagens por texto livre em todos os canais de texto de todos os servidores do utilizador, ou restringir a pesquisa a um canal específico usando a sintaxe `#canal termo`, apresentando os resultados agrupados por "servidor · canal" com um excerto da mensagem correspondente.

#### Scenario: Pesquisa sem âmbito
- **WHEN** o utilizador escreve um termo sem prefixo de canal
- **THEN** os resultados incluem correspondências de todos os canais de texto acessíveis ao utilizador, agrupados por servidor e canal

#### Scenario: Pesquisa com âmbito de canal
- **WHEN** o utilizador escreve `#nome-do-canal termo`
- **THEN** os resultados incluem apenas correspondências desse canal específico

#### Scenario: Estados vazios diferenciados
- **WHEN** uma pesquisa não encontra resultados porque o canal indicado não existe, é um canal de voz sem texto, ou simplesmente não há correspondências
- **THEN** o sistema apresenta uma mensagem de estado vazio que distingue esses três casos, em vez de uma mensagem genérica única

### Requirement: Atalho de teclado para pesquisa
O sistema SHALL abrir o painel de pesquisa com um atalho de teclado global (Ctrl/Cmd+F), pré-preenchendo a consulta com o âmbito do canal actualmente aberto.

#### Scenario: Atalho a partir de um canal
- **WHEN** o utilizador está num canal de texto e pressiona Ctrl/Cmd+F
- **THEN** o painel de pesquisa abre com a consulta já preenchida com `#<canal-actual> `

### Requirement: Notificações de menções, respostas e canais com novidade
O sistema SHALL manter duas categorias de notificação: menções/respostas (que permanecem até a mensagem-alvo ser vista) e canais com novidade (efémeras, da sessão actual), apresentadas num painel a partir do ponto de entrada da topbar, cada uma navegando directamente para a mensagem correspondente.

#### Scenario: Notificação de menção persiste até ser vista
- **WHEN** o utilizador é mencionado numa mensagem e ainda não visitou essa mensagem
- **THEN** a notificação de menção permanece na lista mesmo depois de reabrir a aplicação, até o utilizador navegar até essa mensagem

#### Scenario: Deep-link para a mensagem
- **WHEN** o utilizador clica numa notificação
- **THEN** a aplicação navega para o canal correspondente e desloca a vista até à mensagem referida

#### Scenario: Indicador de novidade sincronizado
- **WHEN** existe pelo menos uma notificação não vista
- **THEN** o indicador visual no ícone de notificações da topbar (já existente desde a Fase 1) reflecte essa condição, e desaparece quando todas as notificações são vistas
