# Spec Delta

## MODIFIED Requirements

### Requirement: Primeira execução no shell nativo pede a instância

Quando a aplicação corre dentro do shell nativo e não há nenhuma instância guardada, o sistema SHALL apresentar a tela inicial do desktop com o painel «Instância selecionada» vazio e SHALL pedir o endereço base de uma instância Mesa, num diálogo aberto por «Escolher», «Entrar» ou «Criar uma conta», antes de qualquer ecrã de autenticação. O sistema SHALL validar o endereço contactando `GET /health` dessa instância, e SHALL recusar avançar enquanto essa validação não for bem-sucedida, mostrando o motivo da falha (endereço inacessível, resposta inesperada, etc.).

#### Scenario: Primeira execução, endereço válido

- **WHEN** a aplicação nativa arranca sem instância guardada e o utilizador introduz, no diálogo, um endereço cujo `/health` responde com sucesso
- **THEN** o endereço é guardado como a instância activa, o diálogo fecha e o ecrã de autenticação pedido (entrar ou criar conta) é apresentado a seguir

#### Scenario: Endereço inacessível

- **WHEN** o utilizador introduz um endereço que não responde, ou responde com erro, em `/health`
- **THEN** o sistema mostra uma mensagem explicando a falha no diálogo e não guarda esse endereço nem avança para a autenticação

### Requirement: Trocar de instância é uma acção explícita e termina a sessão

No cliente nativo, com uma instância já guardada, o sistema SHALL oferecer «Trocar de instância» no ecrã de entrar e no de criar conta, antes de autenticar, e SHALL continuar a oferecê-la depois de autenticado, junto de «Trocar de conta» e de terminar sessão, e no ecrã de desbloqueio; a tela inicial do desktop SHALL oferecer a mesma troca pela acção «Alterar» do painel da instância. Escolher a acção SHALL terminar a sessão corrente, quando existir, SHALL esquecer a instância guardada e SHALL voltar à tela inicial do desktop com o painel vazio e o diálogo do endereço aberto. O sistema SHALL NOT guardar mais do que uma instância activa em simultâneo. O browser servido pela própria instância SHALL NOT mostrar esta acção.

#### Scenario: Trocar de instância

- **WHEN** um utilizador autenticado escolhe "Trocar de instância"
- **THEN** a sessão corrente termina (equivalente a logout), a instância guardada é substituída pela escolha seguinte, e os dados em cache da instância anterior deixam de ser usados

#### Scenario: Trocar antes de entrar

- **WHEN** o cliente nativo já tem uma instância guardada e a pessoa está no ecrã de entrar ou de criar conta e escolhe "Trocar de instância"
- **THEN** o endereço guardado é esquecido e a tela inicial volta com o diálogo do endereço aberto, sem usar o endereço anterior

#### Scenario: Alterar a partir da tela inicial

- **WHEN** a pessoa ativa «Alterar» no painel da instância da tela inicial
- **THEN** o diálogo do endereço abre e, se um novo endereço válido for confirmado, ele substitui o anterior

#### Scenario: O browser não mostra a acção

- **WHEN** a aplicação é aberta num browser servido pela própria instância
- **THEN** não existe "Trocar de instância" no ecrã de entrar
