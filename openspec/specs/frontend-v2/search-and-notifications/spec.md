# search-and-notifications Specification

## Purpose

Permite encontrar mensagens antigas em qualquer servidor/canal do utilizador e ser avisado de menções, respostas e canais com novidade, a partir dos pontos de entrada já existentes na topbar desde a Fase 1.

## Requirements

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
O sistema SHALL manter duas categorias de notificação: menções/respostas (que permanecem até a mensagem-alvo ser vista) e canais com novidade (efémeras, da sessão actual), apresentadas num painel com abas (Todas, Menções e respostas, Canais com novidade) a partir do ponto de entrada da topbar, cada notificação com acções "Responder" e "Ver canal" e navegando directamente para a mensagem correspondente.

#### Scenario: Notificação de menção persiste até ser vista
- **WHEN** o utilizador é mencionado numa mensagem e ainda não visitou essa mensagem
- **THEN** a notificação de menção permanece na lista mesmo depois de reabrir a aplicação, até o utilizador navegar até essa mensagem

#### Scenario: Deep-link para a mensagem
- **WHEN** o utilizador clica numa notificação
- **THEN** a aplicação navega para o canal correspondente e desloca a vista até à mensagem referida

#### Scenario: Indicador de novidade sincronizado
- **WHEN** existe pelo menos uma notificação não vista
- **THEN** o indicador visual no ícone de notificações da topbar (já existente desde a Fase 1) reflecte essa condição, e desaparece quando todas as notificações são vistas

### Requirement: Pesquisa e notificações fiéis ao mockup
A pesquisa SHALL ter campo com chip de canal, resultados com avatar, handle, canal, hora e termo destacado, rodapé com contagem e dicas de teclado; as notificações SHALL ter cabeçalho com contador, abas e cartões com acções. O cabeçalho SHALL ter a acção "Limpar", que marca como lidas todas as menções e respostas pendentes. A aba "Cripto & Sessões" SHALL NOT existir.

#### Scenario: Comparação de fidelidade
- **WHEN** a tela é comparada lado a lado com `mesa_dropdown_de_notifica_es_e_busca_global` no mesmo estado, em tema escuro
- **THEN** todos os elementos obrigatórios da checklist de `design.md` D5 estão presentes, nenhum elemento excluído foi implementado, e a classificação é **Fiel**

### Requirement: Paridade funcional da pesquisa e notificações
O sistema SHALL manter todas as funcionalidades existentes desta área: pesquisa livre e por canal com estados vazios diferenciados, atalho de teclado, notificações persistentes e efémeras com deep-link e indicador na topbar.

#### Scenario: Funcionalidades existentes
- **WHEN** cada item desta área de `docs/v2/parity-checklist.md` é exercido na v2
- **THEN** produz o mesmo resultado de produto que na aplicação anterior, contra o mesmo backend

### Requirement: Notificações do sistema operativo no cliente desktop

No cliente desktop (Electron), quando chega um evento **em tempo real** que já cria uma notificação in-app (menção/resposta persistente ou aviso efémero de canal com novidade, conforme os requisitos existentes desta capability), o sistema SHALL também apresentar uma notificação nativa do sistema operativo **se e só se** a janela principal **não** tiver o foco do SO nesse momento (incluindo janela escondida na tray ou minimizada). Com a janela em foco, o sistema SHALL NOT emitir notificação OS para esse evento. O carregamento inicial de notificações já existentes (histórico unread) SHALL NOT disparar notificações OS. O build web continua a usar apenas o painel/indicador in-app.

Para avisos efémeros de **canal com novidade**, o sistema SHALL emitir no máximo **uma** notificação OS por canal enquanto a janela permanecer sem foco (mensagens seguintes no mesmo canal actualizam só o estado in-app). Menções/respostas persistentes MAY gerar uma notificação OS por evento live. O título e o corpo da notificação OS SHALL ser texto legível montado no cliente (com fallback genérico se faltar contexto de membro/canal).

O clique numa notificação OS SHALL **apenas** trazer a aplicação para o foco (mostrar a janela principal se estiver escondida); nesta ronda SHALL NOT navegar automaticamente para o canal ou mensagem.

#### Scenario: Sem foco → notificação OS

- **WHEN** chega uma menção/resposta live e a janela principal não tem foco
- **THEN** aparece uma notificação nativa do SO além da entrada in-app correspondente

#### Scenario: Novidade de canal coalescida

- **WHEN** chegam várias mensagens no mesmo canal (noutro sítio) enquanto a janela não tem foco
- **THEN** o utilizador recebe no máximo uma notificação OS desse canal nesse período unfocused, e o painel in-app continua a agregar a contagem

#### Scenario: Com foco → sem notificação OS

- **WHEN** o mesmo tipo de evento chega e a janela principal tem foco
- **THEN** a notificação in-app comporta-se como hoje e nenhuma notificação OS é emitida por este mecanismo

#### Scenario: Clique na notificação OS só foca

- **WHEN** o utilizador clica numa notificação OS emitida por este mecanismo
- **THEN** a janela principal fica visível e com foco, sem deep-link obrigatório para a mensagem
