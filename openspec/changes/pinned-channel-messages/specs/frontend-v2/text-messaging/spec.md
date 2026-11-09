# Spec Delta

## ADDED Requirements

### Requirement: Mensagem pinada única por canal de texto
O sistema SHALL manter no máximo uma mensagem pinada em cada canal de texto. A mensagem pinada SHALL pertencer ao próprio canal e SHALL continuar disponível após recarregar a aplicação. Quando a mensagem original for excluída, o pin SHALL ser removido.

#### Scenario: Pinar mensagem
- **WHEN** uma mensagem do canal é pinada com sucesso
- **THEN** ela passa a ser a única mensagem pinada nesse canal e o estado persiste após recarregar

#### Scenario: Mensagem inelegível
- **WHEN** alguém tenta pinar uma mensagem de webhook ou de outro canal
- **THEN** o sistema recusa a ação e o pin atual não muda

#### Scenario: Mensagem excluída
- **WHEN** a mensagem pinada é excluída
- **THEN** o canal deixa de ter mensagem pinada e o informativo desaparece para seus membros

### Requirement: Informativo e navegação para mensagem pinada
O sistema SHALL mostrar a todos os membros com acesso ao canal um informativo visual persistente enquanto houver uma mensagem pinada. Ao ativá-lo, SHALL navegar até a mensagem original, carregar o histórico necessário, centralizar a mensagem e destacá-la temporariamente. O informativo SHALL refletir alterações do pin em tempo real e após reconexão.

#### Scenario: Membro acessa a mensagem pinada
- **WHEN** um membro clica no informativo de pin
- **THEN** a mensagem original aparece no histórico com destaque temporário, mesmo que não estivesse na página inicialmente carregada

#### Scenario: Pin fora do histórico visível
- **WHEN** a mensagem pinada é anterior ao histórico visível do membro (convite sem histórico compartilhado)
- **THEN** o informativo é mostrado como indisponível, sem conteúdo, autor nem navegação, e nenhum endpoint revela a mensagem

#### Scenario: Clique repetido
- **WHEN** o membro clica no informativo mais de uma vez para o mesmo pin
- **THEN** a mensagem é centralizada e destacada a cada clique

#### Scenario: Conteúdo ilegível
- **WHEN** o cliente não consegue descriptografar a mensagem pinada
- **THEN** o informativo mostra um rótulo genérico e continua permitindo a navegação

#### Scenario: Troca ou remoção remota
- **WHEN** outro gestor troca ou remove o pin enquanto o membro está conectado
- **THEN** o informativo atualiza sem recarregar a página

#### Scenario: Reconexão
- **WHEN** o cliente reconecta após perder um evento de pin
- **THEN** o informativo passa a refletir o estado persistido do canal
