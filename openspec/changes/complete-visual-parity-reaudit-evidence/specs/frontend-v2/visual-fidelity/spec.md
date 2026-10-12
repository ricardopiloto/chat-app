# Spec Delta

## ADDED Requirements

### Requirement: Evidência completa em reauditorias visuais
Uma reauditoria visual SHALL identificar todas as telas em escopo e os estados exigidos de cada uma. Uma tela SHALL ser classificada **Fiel** no registo da reauditoria apenas se houver captura atual da v2 no estado e na largura do mockup, referência ao `screen.png`, comparação elemento a elemento e confirmação de que as derivas encontradas foram corrigidas e verificadas novamente. Uma captura de outro estado ou tela SHALL NOT substituir a evidência exigida. Telas impossíveis de executar ou capturar SHALL ser registradas como não verificadas, sem classificação **Fiel**.

#### Scenario: Tela com todos os estados verificados
- **WHEN** uma tela e todos os seus estados exigidos são reproduzidos e comparados com os mockups correspondentes
- **THEN** o registo inclui as capturas atuais, a tabela `Elemento | Mockup | v2 | Observação` para cada estado e uma classificação sustentada pelas comparações

#### Scenario: Estado sem captura ou comparação
- **WHEN** falta a captura ou a comparação elemento a elemento de um estado exigido
- **THEN** o registo identifica a evidência em falta e não classifica a tela como **Fiel** nessa reauditoria

#### Scenario: Ambiente impede a execução
- **WHEN** um serviço ou recurso necessário impede reproduzir uma tela, como uma chamada de voz em curso
- **THEN** o registo indica o bloqueio e mantém a tela como não verificada até a execução e comparação serem concluídas

#### Scenario: Deriva encontrada
- **WHEN** uma comparação revela elemento obrigatório ausente ou divergência de hierarquia, token, ícone, posição, tamanho ou estado
- **THEN** a tela recebe a classificação correspondente à evidência e só passa a **Fiel** após correção e nova comparação
