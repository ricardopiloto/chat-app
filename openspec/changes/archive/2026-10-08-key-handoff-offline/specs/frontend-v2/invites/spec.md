# Spec Delta

## ADDED Requirements

### Requirement: Link de convite com semente
O diálogo de criação de convite SHALL gerar o link com o fragmento de semente quando o criador tem a chave do servidor, e SHALL avisar que o link dá acesso às mensagens e deve ser tratado como segredo, com expiração curta por omissão.

#### Scenario: Link com semente
- **WHEN** o criador tem a chave e confirma a criação
- **THEN** o link copiado inclui o fragmento e o aviso é visível

### Requirement: Aceitação abre a chave localmente
A página de convite SHALL ler o fragmento no cliente, nunca o enviar ao backend, abrir e verificar a chave e publicar o envelope do convidado antes de entrar no servidor.

#### Scenario: Fragmento nunca vai à rede
- **WHEN** o convidado aceita
- **THEN** nenhum pedido de rede contém o valor do fragmento

#### Scenario: Hash limpo após a leitura
- **WHEN** a página leu o fragmento
- **THEN** o endereço do navegador deixa de conter o fragmento

#### Scenario: Fragmento preservado até à leitura
- **WHEN** o link é aberto pelo navegador ou pelo deep link do cliente Tauri
- **THEN** o fragmento chega intacto à página de convite

### Requirement: Espera explícita
Um membro `pending` SHALL ver que aguarda um membro online e SHALL ficar utilizável sem recarregar quando o handoff concluir. A interface SHALL funcionar em largura mobile.

#### Scenario: Espera em mobile
- **WHEN** um membro `pending` abre o servidor num ecrã estreito
- **THEN** a mensagem de espera e o aviso do diálogo são legíveis sem scroll horizontal
