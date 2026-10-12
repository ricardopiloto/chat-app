# Spec Delta

## MODIFIED Requirements

### Requirement: Trocar de instância é uma acção explícita e termina a sessão

No cliente nativo, com uma instância já guardada, o sistema SHALL oferecer "Trocar de instância" no ecrã de entrar e no de criar conta, antes de autenticar, e SHALL continuar a oferecê-la depois de autenticado, junto de "Trocar de conta" e de terminar sessão, e no ecrã de desbloqueio. Escolher a acção SHALL terminar a sessão corrente, quando existir, SHALL esquecer a instância guardada e SHALL voltar ao ecrã que pede o endereço. O sistema SHALL NOT guardar mais do que uma instância activa em simultâneo. O browser servido pela própria instância SHALL NOT mostrar esta acção.

#### Scenario: Trocar de instância

- **WHEN** um utilizador autenticado escolhe "Trocar de instância"
- **THEN** a sessão corrente termina (equivalente a logout), a instância guardada é substituída pela escolha seguinte, e os dados em cache da instância anterior deixam de ser usados

#### Scenario: Trocar antes de entrar

- **WHEN** o cliente nativo já tem uma instância guardada e a pessoa está no ecrã de entrar ou de criar conta e escolhe "Trocar de instância"
- **THEN** o endereço guardado é esquecido e o ecrã que pede a instância volta a aparecer, sem usar o endereço anterior

#### Scenario: O browser não mostra a acção

- **WHEN** a aplicação é aberta num browser servido pela própria instância
- **THEN** não existe "Trocar de instância" no ecrã de entrar
