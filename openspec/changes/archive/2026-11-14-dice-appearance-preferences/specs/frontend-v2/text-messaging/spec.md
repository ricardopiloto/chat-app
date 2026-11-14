# Spec Delta

## ADDED Requirements

### Requirement: Preferência de aparência de dados por membro e canal

O sistema SHALL permitir a cada membro autenticado guardar, por canal (Texto ou Dados), uma preferência de aparência dos dados 3D com: modo de cor (preset nomeado da lista suportada **ou** cor personalizada via color picker), material (`none` | `metal` | `wood` | `glass` | `plastic`), textura (lista suportada incluindo vazio), e som ligado/desligado. Sem preferência guardada, o sistema SHALL usar o padrão do produto (preset branco, material glass, sem textura, som desligado). O sistema SHALL expor leitura e actualização dessa preferência apenas ao próprio membro para o canal indicado, e SHALL rejeitar valores fora das listas/formatos suportados. A UI de edição SHALL estar disponível no canal Dados (área de configuração da barra de dados).

#### Scenario: Guardar e ler preferência do canal

- **WHEN** o membro escolhe preset ou cor personalizada, material, textura e som, e confirma no canal aberto
- **THEN** a preferência fica associada a esse membro e canal, e uma leitura posterior devolve os mesmos valores

#### Scenario: Isolamento por canal

- **WHEN** o membro define aparência no canal A e deixa o canal B sem preferência (ou com outra)
- **THEN** rolagens iniciadas por esse membro em A usam a preferência de A, e em B usam a de B ou o padrão

#### Scenario: Valores inválidos rejeitados

- **WHEN** o cliente envia material, textura, preset ou cor fora do conjunto/formato suportado
- **THEN** a actualização falha com erro de validação e a preferência anterior permanece

### Requirement: Snapshot de aparência na mensagem dice_roll

Ao criar uma mensagem `dice_roll`, o sistema SHALL incluir no conteúdo persistido um snapshot da preferência de aparência do autor para aquele canal (ou o padrão se não houver preferência). Quando o overlay 3D corre para um `dice_roll` recebido ao vivo (conforme os requisitos existentes de animação em Texto/Dados), o frontend SHALL aplicar exactamente esse snapshot (cor, material, textura, som) e SHALL NOT substituí-lo pela preferência local do observador. O cartão estático da mensagem continua a mostrar só notação/resultados; o snapshot serve a animação live e a consistência do payload.

#### Scenario: Todos vêem a aparência do rolador

- **WHEN** o membro A rola no canal e o membro B tem o canal aberto e recebe `message.new` com overlay elegível
- **THEN** o overlay de B usa a cor, material, textura e som do snapshot de A no payload, não a preferência de B

#### Scenario: Som do snapshot

- **WHEN** o snapshot do rolador tem som ligado e o overlay 3D corre no cliente do observador
- **THEN** a biblioteca de dados toca som nessa animação; se o snapshot tem som desligado, a animação corre sem som da biblioteca

#### Scenario: Preferência ausente usa padrão no snapshot

- **WHEN** o autor rola num canal sem preferência guardada
- **THEN** o `dice_roll` inclui o snapshot padrão do produto e os overlays elegíveis usam esse padrão
