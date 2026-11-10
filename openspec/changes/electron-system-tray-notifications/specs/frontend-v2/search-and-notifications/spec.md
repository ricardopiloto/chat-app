# Spec Delta

## ADDED Requirements

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
