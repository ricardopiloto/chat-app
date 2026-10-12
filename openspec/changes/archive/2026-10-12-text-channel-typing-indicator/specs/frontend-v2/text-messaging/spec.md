# Spec Delta

## ADDED Requirements

### Requirement: Indicação de digitação no canal de texto

O sistema SHALL mostrar, a quem estiver a ver um canal de texto, os nomes dos outros membros desse canal que estejam activamente a digitar uma mensagem. O indicador SHALL aparecer imediatamente acima da caixa de composição, integrado no rodapé, sem cobrir mensagens, a resposta em composição, sugestões, ou o controlo «Saltar para o presente». O próprio utilizador SHALL NOT aparecer no seu indicador.

#### Scenario: Um membro começa a digitar

- **WHEN** um membro autorizado começa a digitar no canal de texto que outra pessoa está a ver
- **THEN** o nome desse membro e uma indicação de digitação aparecem acima da caixa de composição dessa pessoa, sem mostrar o texto digitado

#### Scenario: Vários membros digitam

- **WHEN** duas ou mais pessoas digitam no mesmo canal de texto
- **THEN** o indicador identifica os membros activos, resumindo a lista quando não houver espaço para todos os nomes, sem criar rolagem horizontal

#### Scenario: Indicador e salto coexistem

- **WHEN** o indicador está visível e a pessoa está a ler mensagens antigas com «Saltar para o presente» visível
- **THEN** ambos os controlos ficam legíveis e utilizáveis, sem sobreposição, também numa janela estreita

#### Scenario: Resposta e sugestões coexistem

- **WHEN** há uma resposta em composição ou uma lista de sugestões aberta enquanto outro membro digita
- **THEN** o indicador mantém a sua posição acima da caixa e não cobre a resposta nem as sugestões

### Requirement: Presença de digitação efémera e restrita ao canal

O sistema SHALL transportar apenas o identificador do canal, a identidade autenticada de quem digita e o estado de digitação, sem transportar o rascunho nem persistir este estado. Só membros com permissão de escrita no canal SHALL poder anunciar digitação; apenas membros com acesso de leitura SHALL receber o evento. O indicador SHALL desaparecer ao cessar a digitação, ao enviar a mensagem, ao mudar de canal ou após um curto período sem actividade, mesmo se a ligação cair.

#### Scenario: Parar ou enviar

- **WHEN** um membro limpa o campo, deixa de digitar ou envia a mensagem
- **THEN** a sua indicação desaparece dos outros clientes do canal em tempo útil

#### Scenario: Ligação interrompida

- **WHEN** a ligação do membro que digitava termina sem aviso de paragem
- **THEN** a indicação desaparece automaticamente após o período de expiração

#### Scenario: Outro canal ou acesso negado

- **WHEN** alguém vê outro canal, ou não tem acesso de leitura ao canal onde ocorre a digitação
- **THEN** não vê o indicador desse canal nem recebe dados de digitação de um canal inacessível

#### Scenario: Utilizador sem permissão de escrita

- **WHEN** uma pessoa sem permissão para escrever tenta anunciar digitação no canal
- **THEN** o sistema não divulga essa presença aos outros membros
