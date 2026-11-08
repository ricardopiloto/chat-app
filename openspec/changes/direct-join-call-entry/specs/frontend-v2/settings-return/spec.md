# Spec Delta

## MODIFIED Requirements

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
- **THEN** ao voltar, abre o palco se a pessoa continua nessa chamada; caso contrário, inicia a entrada directa nesse canal
