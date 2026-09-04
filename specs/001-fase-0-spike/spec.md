# Feature Specification: Spike Fase 0 — Viabilidade da Chamada

**Feature Branch**: `001-fase-0-spike`

**Created**: 2026-08-24

**Status**: Draft

**Input**: User description: "Leia o `docs/spike-fase-0.md` e especifique o spike técnico da Fase 0: validar, antes do MVP, conectividade de chamada self-hosted atrás de NAT, cliente mínimo com grade de câmeras em posições fixas, emissão de credencial de acesso por um processo separado do cliente, viabilidade do mecanismo de criptografia de mídia no webview desktop desta máquina, e orçamento de recursos."

## Clarifications

### Session 2026-08-24

- Q: Quando o spike está “done”? → A: Onda 1 encerra o caminho “chamada funciona”; Onda 2 é obrigatória antes de congelar criptografia ponta-a-ponta e o emissor de credencial na arquitetura (pode ser em paralelo).
- Q: O que são as “2 a 4 posições fixas”? → A: Grade da sala com 2–4 slots; cada participante ocupa um slot (uma câmera por pessoa); o slot permanece ao sair e reentrar.
- Q: Até onde vai a prova de criptografia de mídia? → A: O mecanismo existe **e** cifra/decifra um trecho de exemplo entre dois tracks nesta máquina; protocolo completo de chaves continua fora de escopo.
- Q: Como o segundo cliente sai da sua LAN? → A: Hotspot do celular (segundo cliente na rede móvel). Túnel não substitui este teste.
- Q: Qual é o corte de RAM do cliente idle? → A: Idle < 1 GB = go; “poucas centenas de MB” é observação. Em chamada = só baseline.

## User Scenarios & Testing *(mandatory)*

Este trabalho é um **spike descartável**: o valor entregue é uma decisão go/no-go sobre premissas técnicas do MVP, não um produto usável por usuários finais. Os atores são o investigador técnico (quem executa e documenta) e dois participantes de chamada (dois clientes distintos).

**Definição de “done”:** a Onda 1 (User Stories 1–3) encerra o caminho “a chamada funciona” e já autoriza avançar trabalho de MVP que dependa só disso. A Onda 2 (User Stories 4–6) permanece no escopo desta spec e **é obrigatória** antes de congelar, na arquitetura, criptografia ponta-a-ponta por padrão e o emissor de credencial; pode correr em paralelo ou logo após a Onda 1. Um go na Onda 1 não conta como go da Onda 2.

### User Story 1 - Dois participantes se veem e se ouvem na mesma sala (Priority: P1)

O investigador sobe um serviço de mídia self-hosted na máquina de desenvolvimento. Dois clientes distintos entram na mesma sala, capturam câmera e microfone locais, publicam áudio/vídeo e assinam o áudio/vídeo um do outro. A chamada funciona na mesma rede, isolando “o servidor aceita gente” de qualquer teste posterior em redes diferentes.

**Why this priority**: Sem chamada básica entre dois participantes, nenhuma outra premissa do produto (layout de câmera, NAT, credencial, criptografia, RAM) pode ser validada. É o bloqueio de tudo o resto.

**Independent Test**: Subir o serviço local, conectar dois clientes de teste na mesma rede à mesma sala, e confirmar áudio e vídeo bidirecionais. Entrega a prova “a chamada self-hosted funciona”.

**Acceptance Scenarios**:

1. **Given** o serviço de mídia self-hosted está no ar localmente, **When** dois clientes distintos entram na mesma sala na mesma rede, **Then** ambos publicam e recebem áudio e vídeo um do outro.
2. **Given** o serviço ainda não está no ar, **When** o investigador tenta o procedimento de subida documentado, **Then** a porta de sinalização responde e o serviço aceita conexões.
3. **Given** um cliente de exemplo de terceiros (não o cliente do produto) já conseguiu entrar na sala, **When** o cliente mínimo do spike entra na mesma sala, **Then** o problema “servidor vs. cliente construído” fica isolado: se o cliente de exemplo funciona e o nosso falha, a falha é do cliente.

---

### User Story 2 - Grade de câmeras em posições fixas (Priority: P1)

A sala tem uma grade de **2 a 4 slots** (não 2 a 4 câmeras por pessoa). Cada participante ocupa **um** slot, com **uma** câmera. O slot é atrelado à identidade da pessoa: ao sair e reentrar, volta ao mesmo lugar. Slots sem ocupante ficam visíveis e vazios — o layout não compacta. O visual pode ser feio; o que precisa ficar provado é o modelo “posição atrelada à pessoa” na camada de vídeo, antes de existir UI de administração. Várias fontes de vídeo por pessoa (rosto + mesa, cenas) ficam fora deste spike.

**Why this priority**: É a cunha de entrada do produto (mesas de RPG / composição visual). Sem essa prova, o restante do spike valida um chat de vídeo genérico, não o diferencial do MVP.

**Independent Test**: Com dois participantes na sala, renderizar uma grade de 2 a 4 slots e verificar que cada pessoa permanece no slot atribuído ao entrar, sair e reentrar; slots extras ficam vazios.

**Acceptance Scenarios**:

1. **Given** dois participantes na mesma sala e uma grade de 2 a 4 slots, **When** a grade é exibida, **Then** cada um ocupa um slot fixo visível para ambos, com uma câmera por pessoa.
2. **Given** um participante sai e volta, **When** a grade é atualizada, **Then** essa pessoa reaparece no mesmo slot (posição atrelada à identidade, não à ordem de chegada).
3. **Given** um participante está sem câmera, ou a grade tem mais slots que participantes, **When** a grade é renderizada, **Then** o slot reservado permanece no lugar e o restante do layout não “pula” para preencher o buraco.

---

### User Story 3 - Chamada atravessa redes diferentes (Priority: P1)

Dois clientes em redes distintas entram na mesma sala. O segundo cliente **sai da LAN via hotspot do celular** (rede móvel), não via túnel. Quando a conexão direta não é possível, o áudio e o vídeo ainda fluem via relé. Este é o caminho real de uso: um participante na rede local do serviço, outro numa rede de operadora.

**Why this priority**: Uma chamada que só funciona na mesma rede não prova o produto self-hosted. Sem essa prova, o MVP arrisca descobrir tarde demais que o caminho feliz de localhost não se replica na internet.

**Independent Test**: Colocar o segundo cliente no hotspot do celular e confirmar áudio/vídeo quando o caminho direto falha. Túnel não conta como este teste.

**Acceptance Scenarios**:

1. **Given** um cliente na LAN do serviço e outro no hotspot do celular, **When** ambos entram na mesma sala, **Then** áudio e vídeo fluem nos dois sentidos.
2. **Given** a conexão direta entre os clientes não é possível, **When** a sessão é estabelecida, **Then** a mídia passa por relé e a chamada continua utilizável.
3. **Given** o teste na mesma rede já passou (User Story 1), **When** o teste via hotspot falha, **Then** o relatório isola a falha em travessia de NAT / relé, não em “o servidor não sobe”.
4. **Given** o hotspot não está disponível no momento do teste, **When** a Onda 1 é encerrada, **Then** a User Story 3 fica como bloqueio de ambiente documentado — não como go, e não é substituída por um teste via túnel.

---

### User Story 4 - Credencial de acesso sai de um processo separado (Priority: P2)

Um serviço mínimo, separado do cliente, emite a credencial de entrada na sala. O cliente recebe só essa credencial de curta duração; o segredo de administração do serviço de mídia nunca é enviado ao cliente. Isso replica o papel do emissor de tokens da arquitetura, sem ser o backend completo do produto.

**Why this priority**: Fecha o loop igual à arquitetura real (o cliente não carrega o segredo). Pode rodar depois — ou em paralelo — da chamada básica, porque a Onda 1 ainda pode usar credencial de teste gerada à mão.

**Independent Test**: Pedir a credencial ao serviço separado, entrar na sala com ela, e verificar que o segredo de administração não aparece em nenhum tráfego ou configuração do cliente.

**Acceptance Scenarios**:

1. **Given** o serviço emissor está no ar, **When** o cliente solicita entrada numa sala, **Then** recebe uma credencial válida e o serviço de mídia aceita o join.
2. **Given** um observador inspeciona o cliente (configuração, logs, tráfego), **When** a sessão é estabelecida, **Then** o segredo de administração do serviço de mídia não está presente no cliente.
3. **Given** a credencial é inválida ou expirada, **When** o cliente tenta entrar, **Then** o join é recusado e a falha é visível para o investigador.

---

### User Story 5 - Mecanismo de criptografia de mídia é utilizável neste desktop Linux (Priority: P2)

O investigador confirma se o mecanismo que a arquitetura assume para criptografia ponta-a-ponta de áudio/vídeo por padrão está **utilizável** no aplicativo desktop desta máquina (Linux): não basta o mecanismo existir — é preciso cifrar e depois decifrar um trecho de exemplo entre dois tracks e obter o conteúdo original. Chaves podem ser de teste, geradas no próprio experimento; não há troca real de chaves entre os dois clientes do spike nem custódia. Windows e macOS ficam como gap explícito.

**Why this priority**: Se o mecanismo não existir **ou** falhar ao processar mídia neste aplicativo desktop, a premissa “criptografia ponta-a-ponta por padrão” fica inválida para Linux antes do MVP. Como a Onda 2 trava o congelamento dessa premissa, um falso positivo (“a API aparece”) não basta.

**Independent Test**: No aplicativo desktop desta máquina, ligar o mecanismo a uma conexão de teste, cifrar um trecho em um track, decifrá-lo em outro, e verificar que o trecho original reaparece. Registrar o resultado mesmo se for negativo.

**Acceptance Scenarios**:

1. **Given** o cliente desktop aberto nesta máquina Linux, **When** o investigador cifra e decifra um trecho de exemplo entre dois tracks, **Then** o resultado (round-trip ok, ou ausente/incompleto/falhou) fica documentado.
2. **Given** o mecanismo está ausente, liga sem erro mas falha ao processar o trecho, ou o round-trip não devolve o original, **When** a Onda 2 termina, **Then** isso é registrado como bloqueio de arquitetura a resolver antes de congelar criptografia ponta-a-ponta — não como “não testamos” nem como go.
3. **Given** o teste foi feito só no Linux desta máquina, **When** o relatório da Onda 2 é escrito, **Then** o gap de Windows e macOS aparece como item explícito a fechar antes de comprometer criptografia ponta-a-ponta nessas plataformas.

---

### User Story 6 - Orçamento de recursos fica registrado (Priority: P2)

O investigador mede e registra RAM do cliente desktop parado e em chamada, RAM do serviço de mídia local, e RAM do serviço emissor de credencial. **Corte de go/no-go:** cliente idle abaixo de 1 GB = go; 1 GB ou mais = no-go da premissa de leveza. “Poucas centenas de MB” é a faixa desejada, registrada como observação, não como linha de corte. RAM em chamada e RAM do serviço de mídia / emissor são só baseline — sem meta neste spike.

**Why this priority**: Leveza é restrição de produto. Sem número real, a meta “abaixo de 1 GB” continua chute. Não bloqueia a prova de que a chamada funciona, então fica na Onda 2 / fechamento.

**Independent Test**: Medir os três processos nas condições idle e em chamada (dois participantes) e anexar os números ao relatório; classificar a premissa de leveza como go ou no-go só com o idle do cliente.

**Acceptance Scenarios**:

1. **Given** o cliente desktop aberto sem chamada, **When** a RAM é medida, **Then** o valor é registrado; se for < 1 GB a premissa de leveza é go, se for ≥ 1 GB é no-go.
2. **Given** dois participantes em chamada com áudio e vídeo, **When** a RAM do cliente e do serviço de mídia é medida, **Then** ambos os valores entram no relatório como baseline, sem corte de go/no-go.
3. **Given** o serviço emissor de credencial está no ar, **When** a RAM dele é medida, **Then** o valor é registrado como baseline, mesmo que esperado baixo.
4. **Given** o idle do cliente está abaixo de 1 GB mas acima de “poucas centenas de MB”, **When** o relatório é escrito, **Then** a premissa continua go, com a faixa observada anotada (não é ressalva que vira no-go).

---

### Edge Cases

- Um dos participantes recusa permissão de câmera ou microfone: a sala ainda aceita o join; o slot de vídeo fica vazio ou só com áudio; o outro participante continua visível.
- Um participante cai no meio da chamada: o outro permanece na sala; o slot do ausente não é reatribuído automaticamente.
- Conexão direta impossível (NAT simétrico, firewall): a chamada deve degradar para relé, não falhar em silêncio.
- Serviço de mídia no ar, mas emissor de credencial fora (Onda 2): o cliente não entra; o erro é explícito.
- Mecanismo de criptografia de mídia parcialmente presente (existe, mas o round-trip cifra→decifra falha): tratar como “não utilizável” e documentar, não como sucesso.
- Dois clientes na mesma máquina (dois processos) vs. duas máquinas: o teste da User Story 1 pode usar dois processos locais; o da User Story 3 exige o segundo cliente no hotspot do celular.
- Relé ou faixa de portas de mídia indisponível no host: a subida do serviço ou a travessia entre redes falha de forma observável, registrada no relatório.
- Cliente desktop idle ≥ 1 GB de RAM: no-go da premissa de leveza, mesmo que a chamada funcione.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O spike MUST permitir subir um serviço de mídia self-hosted na máquina de desenvolvimento e confirmar que a porta de sinalização responde.
- **FR-002**: O spike MUST aceitar dois clientes distintos na mesma sala, na mesma rede, com áudio e vídeo bidirecionais.
- **FR-003**: O cliente mínimo MUST capturar câmera e microfone locais, entrar na sala, publicar os próprios streams e assinar os streams do outro participante.
- **FR-004**: O cliente MUST renderizar uma grade da sala com 2 a 4 slots; cada participante MUST ocupar um único slot com uma câmera; o slot MUST permanecer atrelado à identidade da pessoa (não à ordem de chegada); slots vazios MUST continuar visíveis sem compactar o layout.
- **FR-005**: O spike MUST validar chamada entre um cliente na LAN do serviço e outro no hotspot do celular, incluindo o caso em que a conexão direta não é possível e a mídia precisa de relé. Túnel MUST NOT substituir este teste.
- **FR-006**: Um processo separado do cliente MUST emitir a credencial de acesso à sala; o cliente MUST obter só essa credencial e NUNCA o segredo de administração do serviço de mídia.
- **FR-007**: O cliente da Onda 2 MUST passar a obter a credencial desse processo separado, em vez de usar segredo de administração embutido.
- **FR-008**: O spike MUST, nesta máquina Linux, (a) confirmar que o mecanismo assumido para criptografia ponta-a-ponta de mídia existe no aplicativo desktop e (b) cifrar e decifrar um trecho de exemplo entre dois tracks, recuperando o conteúdo original. MUST NOT exigir protocolo completo de chaves, troca de chaves entre os dois clientes do spike, nem custódia.
- **FR-009**: O relatório da Onda 2 MUST registrar explicitamente o gap de validação desse mecanismo em Windows e macOS.
- **FR-010**: O spike MUST medir e registrar RAM do cliente (idle e em chamada), do serviço de mídia local e do emissor de credencial. A premissa de leveza MUST ser go se e somente se a RAM idle do cliente for < 1 GB; RAM em chamada e dos outros processos MUST ser só baseline.
- **FR-011**: O spike MUST produzir um relatório go/no-go **por premissa**, incluindo falhas (resultado negativo conta como sucesso do spike se estiver documentado). Go da Onda 1 (chamada, grade, redes distintas) é independente do go da Onda 2 (credencial, criptografia de mídia, RAM).
- **FR-012**: O código do spike MUST ser tratado como prova de conceito descartável, não como base de produção.
- **FR-013**: Trabalho de MVP que dependa apenas de “a chamada funciona” MAY começar após go da Onda 1. Premissas de criptografia ponta-a-ponta por padrão e de emissor de credencial MUST NOT ser congeladas na arquitetura até go ou no-go documentado da Onda 2.

### Key Entities

- **Sala**: espaço compartilhado onde dois (ou mais) participantes trocam áudio e vídeo; identificada de forma simples no spike (sem hierarquia Servidor/Canal do produto).
- **Participante**: um cliente distinto numa sala, com identidade estável o bastante para amarrar uma posição de câmera.
- **Posição de câmera (slot)**: um retângulo na grade da sala (2 a 4 no total). Pertence a no máximo um participante, com uma câmera; não é um índice de chegada nem um conjunto de câmeras da mesma pessoa.
- **Credencial de acesso**: permissão de curta duração para entrar numa sala, emitida fora do cliente.
- **Segredo de administração**: credencial mestra do serviço de mídia; nunca pode residir no cliente.
- **Medição de recursos**: registro pontual de RAM por processo/condição (idle vs. chamada), usado no go/no-go de leveza.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um cliente na LAN do serviço e outro no hotspot do celular completam uma chamada na mesma sala self-hosted com áudio e vídeo nos dois sentidos, inclusive quando a conexão direta não está disponível.
- **SC-002**: Os dois participantes veem a mesma grade de 2 a 4 slots, cada um numa única posição fixa (uma câmera por pessoa), inclusive após sair e reentrar; slots sem ocupante permanecem visíveis.
- **SC-003**: 100% das entradas em sala na Onda 2 usam credencial emitida por um processo separado; inspeção do cliente não encontra o segredo de administração.
- **SC-004**: Nesta máquina Linux, um trecho de exemplo cifra e decifra com sucesso entre dois tracks **ou** a falha/ausência fica documentada como bloqueio de arquitetura; o gap Windows/macOS está listado — nenhum dos dois resultados fica implícito.
- **SC-005**: RAM idle do cliente desktop < 1 GB ⇒ go da premissa de leveza; ≥ 1 GB ⇒ no-go. Valores na faixa de poucas centenas de MB são anotados como observação, sem mudar o go. RAM em chamada não entra no corte.
- **SC-006**: RAM do serviço de mídia local e do emissor de credencial está registrada como baseline (pelo menos uma medição idle e uma em chamada de dois participantes).
- **SC-007**: Um leitor do relatório consegue decidir go/no-go em cada premissa (chamada, redes distintas, grade, credencial, criptografia de mídia neste desktop Linux, RAM) sem precisar reler o código do spike.
- **SC-008**: Após a Onda 1 documentada, fica explícito se o caminho “chamada funciona” é go ou no-go — sem exigir que a Onda 2 já tenha terminado. Após a Onda 2 documentada, fica explícito se criptografia ponta-a-ponta por padrão e o emissor de credencial podem ou não ser congelados na arquitetura.

## Assumptions

- O spike cobre o **escopo ampliado** do documento de Fase 0 (chamada + NAT + grade + emissor de credencial + checagem do mecanismo de criptografia de mídia + RAM), em duas ondas: Onda 1 = User Stories 1–3; Onda 2 = User Stories 4–6. A Onda 1, sozinha, encerra o caminho “chamada funciona”. A Onda 2 não é opcional para congelar arquitetura de credencial/criptografia, mas não precisa terminar no mesmo prazo que a Onda 1 (pode ser paralela).
- Relé de NAT: começar pelo relé embutido do serviço de mídia (menos peças móveis) e só introduzir relé separado no momento do teste cross-rede, se o embutido não bastar.
- Segunda rede para o teste de NAT: **hotspot do celular** (segundo cliente na rede móvel). Túnel não substitui. Se o hotspot não estiver disponível, a User Story 3 é bloqueio de ambiente, não go.
- Profundidade da checagem de criptografia de mídia: round-trip nesta máquina (existe + cifra/decifra um trecho entre dois tracks). Troca de chaves entre os dois clientes do spike e o protocolo completo (derivação, custódia, backup) continuam fora de escopo.
- Fora de escopo (adiado para o MVP ou depois): protocolo completo de criptografia ponta-a-ponta (derivação de chaves, custódia, backup); autenticação real, permissões, servidores/canais, persistência; várias câmeras por pessoa (rosto + mesa) e cenas trocáveis; gravação/streaming; instalador e empacotamento multiplataforma; validação do mecanismo de criptografia de mídia em Windows/macOS; interface polida.
- Pré-requisitos de ambiente (serviço de mídia empacotado no host, toolchain de cliente desktop e de emissor de credencial, dependências do aplicativo desktop no Linux) são condição de execução, não histórias de usuário. Bloqueios de ambiente entram no relatório, não são “falha da premissa de chamada”.
- Medição de RAM: ferramentas locais de processo para o cliente e o emissor, e estatísticas do serviço de mídia empacotado. Corte: idle do cliente < 1 GB = go; em chamada e demais processos = baseline. “Poucas centenas de MB” é observação, não teto.
- Constituição do projeto ainda está no template padrão e não impõe restrições adicionais a este spike.
- Fontes de verdade para o *como* (stack, portas, layout de pastas `spike/`): `docs/spike-fase-0.md` e `docs/arquitetura-tecnica.md`. Esta spec define o *quê* precisa ficar provado e o critério de go/no-go.
