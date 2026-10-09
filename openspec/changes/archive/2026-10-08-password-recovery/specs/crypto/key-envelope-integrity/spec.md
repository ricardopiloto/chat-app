# Spec Delta

## Purpose

Garante que a chave simétrica de um Servidor não bifurca quando o envelope de um membro, em particular o do dono, é refeito depois de uma substituição de identidade, e que o handoff de chave continua a escalar em Servidores com centenas de membros.

## ADDED Requirements

### Requirement: Um membro não cria uma segunda chave para um Servidor que já tem chave
O servidor SHALL consultar primeiro o **próprio** envelope existente: SHALL aceitar repetição idempotente dos mesmos bytes, mesmo quando outro membro tem envelope, e SHALL recusar sobrescrita diferente com 409. Se não existe envelope próprio, SHALL recusar com 409 quando outro membro já tem envelope no mesmo escopo. Verificação, inserção e mudança de handoff SHALL ser atómicas, com semântica de primeiro escritor vencedor entre dispositivos concorrentes. A gravação do envelope **de outro** membro para uma participação pendente SHALL conservar as regras de autorização existentes.

#### Scenario: Dono refaz o envelope depois de substituir a identidade
- **WHEN** o dono de um Servidor com outros membros que têm envelope tenta gravar o próprio envelope com uma chave nova
- **THEN** o servidor responde 409 e não altera nenhum envelope

#### Scenario: Primeiro envelope de um Servidor novo
- **WHEN** o dono grava o próprio envelope num Servidor sem nenhum outro envelope
- **THEN** o servidor aceita e a participação do dono fica sincronizada

#### Scenario: Repetição de criação interrompida
- **WHEN** o dono já gravou o próprio envelope, nenhum outro membro tem envelope, e repete exactamente o mesmo envelope
- **THEN** o servidor aceita sem alterar a chave

#### Scenario: Repetição idempotente depois do handoff
- **WHEN** o próprio envelope já existe, outros membros têm envelope e o cliente repete exactamente os bytes do próprio
- **THEN** o servidor aceita sem alterar a chave nem gerar outro evento de handoff

#### Scenario: Dois dispositivos do único dono
- **WHEN** dois dispositivos tentam criar simultaneamente envelopes diferentes para o dono de um Servidor vazio
- **THEN** apenas um envelope é aceite; o outro recebe 409 e não distribui a chave derrotada

#### Scenario: Handoff para uma participação pendente continua a funcionar
- **WHEN** um membro sincronizado grava o envelope de um membro pendente
- **THEN** o servidor aceita, como hoje

### Requirement: O cliente espera o handoff em vez de gerar uma chave nova
Ao não conseguir carregar o envelope de um Servidor de que é dono, o cliente SHALL gerar uma chave nova apenas se o backend confirmar que nenhum envelope existe no escopo. Essa confirmação SHALL vir de indicador autoritativo calculado dos envelopes, não de `key_handoff_status`. Caso contrário SHALL NOT gerar chave, SHALL mostrar estado por sincronizar e SHALL carregar a chave quando o handoff terminar. Um 409 SHALL fazer o cliente descartar a chave candidata, tentar carregar o próprio envelope e, se ausente, esperar handoff, sem distribuir a candidata.

#### Scenario: Dono recupera a conta com outro membro offline
- **WHEN** o dono entra com uma identidade nova, nenhum membro sincronizado está online e existem outros membros com envelope
- **THEN** o cliente não gera chave, o Servidor aparece como a sincronizar e a mensagem antiga fica legível assim que um membro sincronizado se liga e reseala a chave

#### Scenario: Dono é o único membro
- **WHEN** o dono entra com uma identidade nova num Servidor em que nenhum outro membro tem envelope
- **THEN** o cliente gera uma chave nova, e o histórico anterior permanece ilegível (perda já documentada)

#### Scenario: Recusa do servidor
- **WHEN** a gravação do envelope próprio recebe 409
- **THEN** o cliente não tenta de novo e espera o handoff

#### Scenario: Cache de chave obsoleto
- **WHEN** a conta muda, a identidade é substituída ou um reset é concluído no navegador
- **THEN** o cache em memória é invalidado antes de carregar envelopes; nenhuma chave da conta ou identidade anterior é usada para cifrar ou decifrar

### Requirement: A integridade acompanha o escopo criptográfico activo
Antes da migração `bots-channel-key-integration`, existência de envelope, guarda, handoff e cache SHALL operar por Servidor. Após a migração, SHALL operar por canal, respeitando ACL de canais privados e sem oferecer recuperação humana a contas de bot. O rollback de dados cifrados após a migração SHALL seguir o plano daquela mudança, não uma promessa genérica desta.

#### Scenario: Dois canais com ACL diferente
- **WHEN** a mesma conta participa em dois canais do mesmo Servidor após a migração, sendo um deles privado
- **THEN** existência de envelope e elegibilidade de handoff são avaliadas separadamente por canal, e nenhum membro sem ACL recebe chave ou evento do canal privado

### Requirement: O handoff escala para Servidores com 300 ou mais membros
O handoff de chave (pedido, resposta e conclusão) SHALL cumprir, num Servidor com 300 membros sincronizados, e com a medição repetida a 1000, os critérios de aceitação medidos por teste de carga com dados sintéticos:
- a substituição de identidade de uma conta com participação em 20 Servidores, cada um com 300 membros, conclui em p95 ≤ 1 s no backend (excluindo o custo do hash da password);
- o `DELETE` dos envelopes de uma conta não faz varrimento completo da tabela de envelopes (usa índice);
- a guarda de envelope próprio responde em p95 ≤ 5 ms com 1000 envelopes no Servidor;
- depois de a primeira resposta de handoff concluir, as respostas redundantes de membros sincronizados (manada) são recusadas sem degradar os pedidos concorrentes: p95 do `POST` de envelope ≤ 250 ms com 300 respostas concorrentes;
- a reposição de pedidos pendentes quando um membro sincronizado se liga emite no máximo um evento por membro pendente e conclui em p95 ≤ 100 ms para um Servidor com 300 membros dos quais 50 pendentes.
Se algum critério falhar, o número de destinatários de `key_handoff.requested` por substituição de identidade SHALL ser limitado a um conjunto pequeno de membros sincronizados, com os restantes cobertos pela reposição na ligação.

#### Scenario: Substituição de identidade em Servidores grandes
- **WHEN** uma conta em 20 Servidores de 300 membros substitui a identidade num ambiente de teste
- **THEN** o pedido conclui dentro do critério de latência e os envelopes da conta são apagados por índice

#### Scenario: Manada de respostas
- **WHEN** 300 membros sincronizados online respondem ao mesmo pedido de handoff em simultâneo
- **THEN** exactamente uma resposta grava o envelope, as restantes são recusadas e a latência dos pedidos concorrentes respeita o critério

#### Scenario: Critério falhado activa a mitigação
- **WHEN** a medição de uma substituição de identidade excede um critério de latência ou emite mais eventos do que o limite
- **THEN** o fan-out de `key_handoff.requested` passa a ser limitado e a medição é repetida até cumprir o critério

#### Scenario: Resultado documentado
- **WHEN** a validação de escala termina
- **THEN** os números medidos e o ambiente ficam registados em `docs/` antes de o change ser arquivado
