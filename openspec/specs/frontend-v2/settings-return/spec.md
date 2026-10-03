# settings-return Specification

## Purpose

Faz com que sair das configurações (da conta ou de um servidor) devolva a pessoa ao canal em que estava, em vez de a deixar numa página vazia.

## Requirements

### Requirement: Memória do último canal aberto
O sistema SHALL lembrar, por servidor, o último canal que a pessoa abriu, e o último canal aberto em qualquer servidor. A memória SHALL ficar neste dispositivo, separada por conta, SHALL sobreviver a recarregar a página e SHALL ser esquecida para um canal quando este é apagado. Abrir as configurações SHALL NOT alterar a memória.

#### Scenario: Canal aberto fica lembrado
- **WHEN** a pessoa abre o canal `geral` do servidor A e depois o canal `mesa` do servidor B
- **THEN** o último canal do servidor A é `geral`, o do servidor B é `mesa` e o último canal aberto em geral é `mesa`

#### Scenario: Sobrevive a recarregar
- **WHEN** a pessoa abre um canal, recarrega a página e volta a entrar na aplicação
- **THEN** o último canal continua lembrado

#### Scenario: Armazenamento indisponível
- **WHEN** o navegador bloqueia o armazenamento local
- **THEN** a memória funciona durante a sessão e a aplicação não falha

#### Scenario: Canal apagado
- **WHEN** o canal lembrado é apagado
- **THEN** deixa de ser lembrado

### Requirement: Voltar das configurações do servidor
O sistema SHALL, ao sair das configurações de um servidor, abrir o último canal que a pessoa tinha aberto nesse servidor. Isto vale para o ícone de fechar das configurações e para a tecla Esc. Se não houver canal lembrado, ou se ele já não existir ou já não for acessível, o sistema SHALL abrir o servidor sem canal aberto, sem mensagem de erro.

#### Scenario: Voltar ao canal em que estava
- **WHEN** a pessoa está no canal `geral`, abre as configurações do servidor e carrega em fechar
- **THEN** o canal `geral` volta a estar aberto

#### Scenario: Esc também volta
- **WHEN** a pessoa está nas configurações do servidor, sem diálogo aberto, e carrega em Esc
- **THEN** abre o último canal desse servidor

#### Scenario: Entrou direto nas configurações
- **WHEN** a pessoa abriu a aplicação diretamente no endereço das configurações, sem nunca ter aberto um canal nesse servidor nesta sessão, mas com um canal lembrado de uma sessão anterior
- **THEN** ao fechar, abre esse canal lembrado

#### Scenario: Sem canal lembrado
- **WHEN** a pessoa nunca abriu um canal nesse servidor
- **THEN** ao fechar, abre o servidor sem canal aberto, como antes

#### Scenario: Canal já não acessível
- **WHEN** o canal lembrado foi apagado ou a pessoa perdeu o acesso a ele
- **THEN** ao fechar, abre o servidor sem canal aberto, sem erro

#### Scenario: Canal de voz
- **WHEN** o último canal era de voz
- **THEN** ao voltar, abre a pré-entrada desse canal (ou o palco, se a pessoa continua na chamada), sem entrar na chamada por si

### Requirement: Voltar da conta
O sistema SHALL, ao sair da página de Minha conta pelo botão "Voltar à Mesa" ou pela tecla Esc, abrir o último canal que a pessoa tinha aberto em qualquer servidor, no servidor a que pertence. A tecla Esc SHALL continuar a não sair da página enquanto a pessoa edita o nome. Se não houver canal lembrado, ou se ele já não existir ou já não for acessível, o sistema SHALL abrir a página inicial, sem mensagem de erro.

#### Scenario: Voltar da conta ao canal
- **WHEN** a pessoa está no canal `mesa` do servidor B, abre Minha conta e carrega em "Voltar à Mesa"
- **THEN** o canal `mesa` do servidor B volta a estar aberto

#### Scenario: Passou pelas configurações de um servidor antes
- **WHEN** a pessoa abriu o canal `geral`, abriu as configurações do servidor, abriu Minha conta e carrega em "Voltar à Mesa"
- **THEN** abre `geral` (as configurações não substituem o último canal)

#### Scenario: Esc durante a edição do nome
- **WHEN** a pessoa está a editar o nome a mostrar em Minha conta e carrega em Esc
- **THEN** a edição é cancelada e a página não sai

#### Scenario: Sem canal lembrado
- **WHEN** a pessoa nunca abriu um canal
- **THEN** "Voltar à Mesa" abre a página inicial, como antes

### Requirement: O navegador continua a funcionar como antes
O sistema SHALL manter o comportamento do botão "Voltar" do navegador, que regressa ao endereço anterior do histórico. A memória do último canal SHALL só servir aos controlos de saída das configurações.

#### Scenario: Botão do navegador
- **WHEN** a pessoa abre as configurações a partir de um canal e usa o botão "Voltar" do navegador
- **THEN** regressa ao endereço anterior do histórico, que é esse canal
