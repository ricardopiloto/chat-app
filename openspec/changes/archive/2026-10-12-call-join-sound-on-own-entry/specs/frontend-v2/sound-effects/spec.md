# Spec Delta

## MODIFIED Requirements

### Requirement: Som de chegada a uma chamada em andamento

O sistema SHALL tocar o efeito sonoro de chegada, ao utilizador que está ligado a uma chamada de voz/vídeo, quando outra pessoa entra nessa chamada. O sistema SHALL também tocar o mesmo efeito para o próprio utilizador sempre que ele entra com sucesso numa chamada, quer esteja vazia quer já tenha gente — excepto numa reconexão interna da própria sessão sem acção da pessoa (ex. o canal muda de E2EE a meio da chamada). Não SHALL tocar para quem não está nessa chamada.

#### Scenario: Outra pessoa entra na minha chamada

- **WHEN** o utilizador está numa chamada ativa e uma pessoa que não estava nela passa a constar nos ocupantes
- **THEN** o efeito de chegada toca uma vez

#### Scenario: A minha própria entrada

- **WHEN** o utilizador entra com sucesso num canal de voz/vídeo, vazio ou já ocupado
- **THEN** o efeito de chegada toca uma vez, para o próprio utilizador

#### Scenario: Reconexão interna não conta como entrada

- **WHEN** o canal muda a definição de E2EE a meio da chamada e a sessão volta a ligar-se ao LiveKit internamente, sem a pessoa ter saído nem voltado a entrar
- **THEN** nenhum som de chegada toca por causa dessa reconexão

#### Scenario: Chamada em que não estou

- **WHEN** outra pessoa entra numa chamada à qual o utilizador não está ligado, mesmo que a veja na sidebar
- **THEN** nenhum som toca

#### Scenario: Reconexão não repete

- **WHEN** a ligação em tempo real cai e volta e a lista de ocupantes é recarregada com as mesmas pessoas
- **THEN** nenhum som de chegada toca
