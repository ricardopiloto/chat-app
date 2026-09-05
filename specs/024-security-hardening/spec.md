# Feature Specification: Endurecimento de segurança e higiene de código

**Feature Branch**: `024-security-hardening`

**Created**: 2026-09-04

**Status**: Draft

**Input**: User description: "Análise crítica de toda a aplicação (desenvolvedor sénior + analista de segurança): falhas de segurança, superfícies de ataque, e processos/métodos a reaproveitar. Consolidar numa spec."

**Depends on**: instância self-hosted existente (autenticação local, canais de texto/voz, pré-visualização de ligações, convites, sessão por cookie).

## Origem

Revisão de prontidão para produção (exposição pública, acesso indevido, reuso de código) à data **2026-09-04**. Esta spec traduz os achados em requisitos de produto. Não altera o modelo de E2EE (o servidor continua sem ler o conteúdo das mensagens); endurece o *perímetro* à volta desse modelo.

**Veredicto da revisão**: instância **não pronta** para a internet pública com a configuração e os comportamentos por omissão actuais. Uso em LAN de confiança continua possível, mas os mesmos defeitos facilitam abuso se a API ou o serviço de voz forem alcançáveis fora dessa LAN.

## Clarifications

O modelo de ameaça desta feature é **instância alcançável por atores não confiáveis** (VPS, port-forward, LAN partilhada). MFA, recuperação de palavra-passe e SSO ficam **fora de âmbito**.

### Session 2026-09-04

- Q: Introduzir web → BFF → API → base para reduzir superfície de ataque? → A: Não. Um único serviço atrás de TLS/proxy opcional; endurecer esse serviço. Sem BFF nem API interna com token de máquina nesta entrega.
- Q: De onde vem a URL de sinalização de voz (telemóvel na LAN / produção)? → A: Sempre a URL configurada da instância. O pedido HTTP nunca escolhe o anfitrião. LAN: o operador põe o IP da rede; produção: o hostname público.
- Q: Nesta entrega, tirar as chaves de canal do armazenamento do browser ou só fechar o perímetro (política de conteúdo, fontes, frames)? → A: Só perímetro no browser. Chaves de canal no mesmo armazenamento; não redesenhar o sítio das chaves E2EE.
- Q: Quando é que as credenciais de mídia de exemplo são recusadas? → A: Só com perfil de produção explícito. Sem esse perfil, o guia LAN/desenvolvimento ainda pode arrancar com o par de exemplo. Com o perfil, o arranque falha se as credenciais forem as de exemplo.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Publicar sem «chaves de fábrica» nem exposição por omissão (Priority: P1)

Como operador que sobe a instância para o mundo (ou para uma rede que não controlo), quero que a instalação **recuse** credenciais de mídia conhecidas publicamente e que a documentação **não** me empurre a escutar em todas as interfaces nem a cookies de sessão sem marca segura em HTTPS — para um desconhecido na internet não entrar no serviço de voz nem roubar sessões em trânsito. A borda continua a ser **um** serviço (o browser fala com ele; um proxy TLS à frente é opcional), não uma cadeia web→BFF→API.

**Why this priority**: Credenciais de mídia iguais em todas as instâncias que seguem o guia actual permitem mintar acesso a salas de voz. Escuta em todas as interfaces e cookie sem «seguro» em HTTPS são a combinação clássica de superfície pública + sessão interceptável.

**Independent Test**: Instância com **perfil de produção** explícito (HTTPS, credenciais únicas). Sem as variáveis «de exemplo» do guia de desenvolvimento, o serviço de voz **não** arranca. Cookie de sessão só viaja em ligações HTTPS. A API não escuta em todas as interfaces a menos que o operador o peça de forma explícita e consciente. Sem o perfil de produção, o caminho rápido na LAN ainda pode usar o par de exemplo.

**Acceptance Scenarios**:

1. **Given** o perfil de produção activo e as credenciais de mídia ainda iguais às do guia de desenvolvimento, **When** o serviço tenta arrancar, **Then** falha de forma clara e **não** fica a servir voz.
2. **Given** o perfil de produção **não** activo, **When** o operador segue o guia rápido na LAN com o par de exemplo, **Then** a instância ainda pode arrancar (desenvolvimento).
3. **Given** o operador activa HTTPS, **When** inicia sessão, **Then** o cookie de sessão está marcado para não ser enviado em HTTP claro.
4. **Given** o operador não escolheu explicitamente «escutar em todas as interfaces», **When** o processo API arranca, **Then** não fica alcançável em todos os endereços da máquina por omissão.
5. **Given** o guia de operação de produção, **When** o operador o segue, **Then** activa o perfil explícito, usa credenciais únicas, e não copia o par de exemplo nem cookie inseguro em HTTPS.

---

### User Story 2 - A instância não é um proxy para a rede interna (Priority: P1)

Como operador, não quero que um membro autenticado consiga fazer o **servidor** ir buscar URLs da minha rede interna, metadados de nuvem, ou ficheiros gigantes — a pré-visualização de ligações no chat não pode ser um túnel SSRF nem um esgotamento de memória.

**Why this priority**: Qualquer conta na instância (obtida por convite) pode hoje pedir ao servidor que visite um URL. Hosts que não são um IP literal privado passam; o corpo remoto não tem tecto antes de entrar em memória; a imagem da pré-visualização pode apontar para um endereço perigoso no browser do membro.

**Independent Test**: Membro autenticado pede pré-visualização de (a) endereço de loopback/privado, (b) nome que resolve para rede interna após redireccionamento, (c) recurso enorme. (a)(b) recusados; (c) não derruba o processo. Cartões de ligação não carregam imagens cujo destino seja rede privada ou esquema não HTTP(S).

**Acceptance Scenarios**:

1. **Given** um membro autenticado, **When** pede pré-visualização de um URL cujo destino é loopback, rede privada, link-local ou metadados de nuvem (incluindo após redireccionamentos e resolução de nome), **Then** o produto recusa e **não** contacta esse destino.
2. **Given** um URL público cujo corpo é muito maior que o necessário para um cartão, **When** o servidor pré-visualiza, **Then** deixa de ler após um limite pequeno e previsível; o processo não cresce sem tecto.
3. **Given** um cartão com imagem, **When** o cliente a mostra, **Then** só usa um endereço HTTP(S) público já validado — não esquemas perigosos nem destinos internos.
4. **Given** um visitante sem sessão, **When** tenta o mesmo pedido de pré-visualização, **Then** é recusado (continua a exigir conta).

---

### User Story 3 - Contas e primeiro operador não caem a força bruta nem a corrida (Priority: P1)

Como operador, quero que login e registo não possam ser martelados à vontade, que handles não se confirmem demasiado depressa a um atacante, e que **duas** pessoas a registarem-se ao mesmo tempo numa instância vazia não criem dois «operadores iniciais».

**Why this priority**: Sem limite de tentativas, palavra-passe de 8 caracteres é adivinhável offline-online. Conflito de handle no registo vs «credenciais inválidas» no login permite enumerar contas. Corrida no primeiro registo pode criar dois donos de instância.

**Independent Test**: Dezenas de logins falhados seguidos a partir do mesmo sítio são limitados. Dois registos simultâneos na instância vazia: no máximo um operador inicial. Mensagens de erro de autenticação não distinguem «handle inexistente» de «palavra-passe errada».

**Acceptance Scenarios**:

1. **Given** muitas tentativas de login ou registo falhadas em pouco tempo a partir da mesma origem, **When** o limite é atingido, **Then** novos pedidos são recusados temporariamente sem revelar se o handle existe.
2. **Given** instância ainda sem contas e dois registos em paralelo, **When** ambos completam, **Then** existe no máximo **um** operador inicial; o segundo ou falha de forma segura ou torna-se conta normal com convite.
3. **Given** login com handle desconhecido vs palavra-passe errada, **When** o atacante compara as respostas, **Then** não consegue distinguir os dois casos pelo texto ou código estável.
4. **Given** registo com handle já usado, **When** o produto responde, **Then** a enumeração é aceite como risco residual **ou** a mensagem é genericamente a mesma família que o login (a spec prefere não facilitar enumeração no login; o conflito de handle no registo pode permanecer explícito porque o utilizador precisa de escolher outro nome).

---

### User Story 4 - O token de voz não vai para um servidor escolhido pelo atacante (Priority: P1)

Como membro a entrar num canal de voz, quero ligar-me **só** ao serviço de voz desta instância — não a um anfitrião injectado no pedido — para o meu comprovativo de entrada não ser entregue a um terceiro.

**Why this priority**: A URL de sinalização de voz não pode nascer do anfitrião do pedido. Um proxy ou cliente que envie um anfitrião falso poderia receber um comprovativo válido apontado para a máquina do atacante.

**Independent Test**: Pedido de entrada em voz com um anfitrião declarado falso (incluindo via proxy) devolve **exactamente** a URL configurada da instância. O comprovativo continua a valer só para a sala pedida e por tempo curto. Na LAN, o operador configura o endereço que os telemóveis devem usar.

**Acceptance Scenarios**:

1. **Given** um membro a pedir entrada em voz, **When** o pedido traz um anfitrião declarado que não é o desta instância, **Then** a URL de sinalização devolvida é a configurada — **não** a desse anfitrião.
2. **Given** entrada em voz bem-sucedida, **When** o comprovativo é usado, **Then** só autoriza a sala correspondente e expira em minutos (comportamento actual de curta duração mantém-se).
3. **Given** mesa na LAN com a URL de sinalização apontada ao IP da rede, **When** um telemóvel entra na chamada, **Then** liga a esse endereço configurado (não a um host inventado pelo pedido).

---

### User Story 5 - Menos superfície no browser e nos cabeçalhos (Priority: P2)

Como membro, quero que a app não telefone a terceiros só para carregar tipos de letra, que páginas da instância não sejam embutidas noutros sítios, e que scripts injectados tenham menos espaço para correr — sem mudar onde as chaves de voz do canal vivem no dispositivo.

**Why this priority**: Tipos de letra remotos revelam visitas a um terceiro. Sem política de conteúdo, XSS no cliente pode ler chaves no armazenamento do browser. Cabeçalhos clássicos (frame, HTTPS obrigatório) faltam. Mudar o armazenamento das chaves é outro produto (E2EE); esta entrega fecha o perímetro.

**Independent Test**: A interface carrega tipos de letra **só** da própria instância. Respostas HTML/API de produção incluem política que impede embedding e restringe origens de script. As chaves de canal **não** precisam de mudar de sítio nesta entrega.

**Acceptance Scenarios**:

1. **Given** a app em produção, **When** abro as ferramentas de rede, **Then** não há pedido a um fornecedor externo de tipos de letra.
2. **Given** um sítio terceiro, **When** tenta embeber a instância num iframe, **Then** o browser recusa (cabeçalho ou política equivalente).
3. **Given** HTTPS de produção, **When** um cliente tenta HTTP, **Then** é forçado ou recusado (HSTS ou redireccionamento documentado no guia do operador).
4. **Given** as chaves de voz do canal no dispositivo, **When** esta feature está feita, **Then** o armazenamento dessas chaves é o mesmo de antes; a mitigação é a política de conteúdo e o fim das fontes de terceiros.

---

### User Story 6 - Uma regra de autorização, menos código morto (Priority: P3)

Como equipa que mantém a Mesa, quero que «és membro deste servidor / podes ver o histórico / podes apagar» viva **num** sítio no servidor, e que o visual não mantenha duas folhas de estilo a lutar — para não voltar a divergir a ACL e para reduzir superfície e peso.

**Why this priority**: A mesma verificação de membro e a mesma regra de «histórico a partir do convite» estão repetidas. A ACL de apagar no cliente é um espelho; o servidor já é autoritativo — o risco é divergência futura. Duas folhas de estilo (sistema antigo + tema actual) aumentam CSS morto e um import remoto de tipos.

**Independent Test**: Alterar a regra de histórico-por-convite num único helper afecta listagem de mensagens **e** descarga de anexos. Não há segundo sítio da regra. O tema visível não depende de uma folha legado com tipos remotos.

**Acceptance Scenarios**:

1. **Given** um membro cujo convite não inclui histórico, **When** lista mensagens e quando pede um anexo antigo, **Then** ambas as recusas seguem a **mesma** regra de corte temporal.
2. **Given** um não-membro, **When** acede a qualquer recurso do servidor (canais, grelha, cenas, anexos, envelopes de chave), **Then** é recusado pelo mesmo critério de pertença.
3. **Given** a interface em tema claro/escuro, **When** se inspecciona o CSS servido, **Then** não é necessário um segundo sistema de design legado para o ecrã funcionar.

---

### Edge Cases

- Operador **quer** escutar em todas as interfaces na LAN: permitido se for **explícito**, não o arranque silencioso.
- Telemóvel na mesma Wi‑Fi: a sinalização de voz **não** se adivinha pelo anfitrião do pedido; o operador MUST configurar o endereço alcançável (IP da LAN ou nome).
- Pré-visualização de imagem directa (o URL já é a imagem): continua a poder mostrar a imagem **se** o destino for público HTTP(S).
- Convite público (pré-visualização do nome do servidor sem sessão): mantém-se; códigos de convite continuam longos e aleatórios — não é enumeração prática.
- Membro malicioso a substituir o envelope de chave de outro membro: **dentro desta spec** o servidor MUST impedir que um membro grave um envelope **para outra conta** excepto o fluxo de handoff já desenhado (dono/sincronizados a selar para o recém-chegado). Se o produto hoje permite overwrite livre, isso é um bug de autorização a corrigir nesta história P1/P2 de envelopes — ver FR-012.
- Falha da pré-visualização: o texto do link no chat permanece; não há cartão.
- `prefers-reduced-motion` / temas: fora de âmbito (não são superfície de ataque).
- Pasta de spike / protótipos: continua descartável; MUST NOT ser o caminho de produção.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Com **perfil de produção explícito**, o produto MUST NOT arrancar se as credenciais de mídia forem as de exemplo do guia de desenvolvimento. O operador MUST definir credenciais únicas; a falha MUST ser clara. Sem esse perfil, o par de exemplo MAY ainda arrancar (caminho LAN/desenvolvimento). O guia de produção MUST dizer como activar o perfil.
- **FR-002**: O endereço de escuta da API MUST omissão ser local (loopback) ou exigir uma escolha explícita do operador para escutar em todas as interfaces.
- **FR-003**: Com HTTPS, o cookie de sessão MUST ser marcado para não viajar em HTTP. httpOnly e SameSite estrito MUST permanecer.
- **FR-004**: O guia de operação de **produção** MUST documentar como activar o perfil explícito, credenciais únicas, HTTPS, escuta, e MUST NOT copiar o par de chaves de exemplo como receita de produção.
- **FR-005**: Pedidos de pré-visualização de URL MUST exigir sessão. Destinos privados, loopback, link-local, metadados de nuvem, e redireccionamentos para esses destinos MUST ser recusados **depois de resolver o nome**, não só quando o anfitrião já é um IP literal.
- **FR-006**: A leitura do corpo remoto na pré-visualização MUST ter um tecto pequeno e explícito (ordem de centenas de kilobytes, não megabytes ilimitados).
- **FR-007**: URLs de imagem nos cartões MUST ser HTTP(S) público validado; o cliente MUST NOT carregar destinos internos ou esquemas não web.
- **FR-008**: Login e registo MUST ter limitação de ritmo por origem (e, se prático, por identificador) suficiente para tornar força bruta de palavra-passe de 8+ caracteres impraticável em linha.
- **FR-009**: Respostas de login falhado MUST ser indistinguíveis quanto a «conta existe ou não».
- **FR-010**: O primeiro operador da instância MUST ser atribuído de forma concorrente-segura (no máximo um).
- **FR-011**: A URL de sinalização de voz devolvida ao cliente MUST ser **sempre** a URL configurada da instância. MUST NOT ser construída, reescrita ou escolhida a partir do anfitrião declarado no pedido (incluindo o anunciado por um proxy). O guia de operação MUST dizer ao operador para definir esse endereço (loopback no PC, IP da LAN, ou hostname público).
- **FR-012**: Um membro MUST NOT poder substituir o envelope de chave de **outra** conta excepto no fluxo de handoff autorizado (selar para o recém-chegado). Overwrite arbitrário MUST ser recusado.
- **FR-013**: A interface de produção MUST NOT carregar tipos de letra de um terceiro na internet.
- **FR-014**: Respostas da app em produção MUST incluir protecção contra embedding (frames) e uma política de conteúdo que limite scripts e origens à própria instância. MUST NOT, nesta entrega, obrigar a mudar o armazenamento das chaves de canal no cliente.
- **FR-015**: Regras de «é membro», «histórico visível desde o convite» e «pode apagar esta mensagem» no **servidor** MUST ter uma única implementação partilhada pelos sítios que as aplicam hoje em duplicado.
- **FR-016**: Esta feature MUST NOT enfraquecer E2EE, convites, nem a sessão por cookie; MUST NOT exigir MFA nesta entrega.
- **FR-017**: Esta entrega MUST NOT introduzir um segundo processo HTTP de aplicação (BFF) nem uma API interna autenticada só com token de máquina. O browser MUST continuar a falar com o mesmo serviço que guarda a sessão e os dados (um proxy TLS/inverso à frente é permitido e recomendado em produção).

### Out of Scope

- Autenticação de dois factores, passkeys, OAuth, recuperação de palavra-passe.
- Reescrever o protocolo E2EE, mudar o sítio das chaves de canal no cliente, ou deixar de usar o cliente como sítio das chaves.
- Federação, WAF comercial, ou mudar o motor de voz de fornecedor.
- Arquitectura web → BFF → API interna → base (segundo hop de aplicação).
- Auditoria completa de dependências (sinal apenas; não é o entregável).
- Correcções puramente visuais / UX já cobertas por outras specs.

### Key Entities

- **Instância de hospedagem**: processo + dados + serviço de voz; o perímetro desta spec.
- **Credenciais de mídia**: o par que autoriza o serviço de voz; MUST ser único por instância em produção.
- **Sessão**: cookie httpOnly; comprovativo de quem é o utilizador na API.
- **Pré-visualização de ligação**: o servidor visita um URL em nome de um membro autenticado.
- **Comprovativo de voz**: autorização de curta duração para uma sala; MUST só ir para o sinalizador desta instância.
- **Envelope de chave**: blob selado para um membro; só o destinatário legítimo (e o fluxo de handoff) o deve actualizar.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Com perfil de produção explícito e credenciais de exemplo do guia de desenvolvimento, **0** arranques bem-sucedidos do serviço de voz. Sem o perfil, o caminho de desenvolvimento MAY arrancar com esse par.
- **SC-002**: **100%** dos URLs de teste de rede interna / metadados / loopback usados no plano de testes da pré-visualização são recusados; **0** contactos a esses destinos.
- **SC-003**: Um corpo remoto de ≥10 MiB na pré-visualização **não** aumenta a memória do processo na mesma ordem de grandeza; o pedido falha ou trunca dentro do tecto.
- **SC-004**: Após o limite de ritmo, um script de login falha em **≥95%** das tentativas excedentes (recebem recusa temporária).
- **SC-005**: Em 10 corridas de dois registos simultâneos numa instância vazia, **0** produzem dois operadores iniciais.
- **SC-006**: Pedidos de entrada em voz com anfitrião falso devolvem **0** URLs apontando para esse anfitrião; a URL é a configurada em **100%** das amostras.
- **SC-007**: Em revisão de rede da UI de produção, **0** pedidos a fornecedores externos de tipos de letra.
- **SC-008**: Uma alteração à regra de histórico-por-convite no helper partilhado altera o comportamento de mensagens **e** anexos no mesmo teste de contrato (sem segundo sítio a divergir).

## Assumptions

- O operador que segue só o guia «30 minutos na LAN» (sem perfil de produção) pode continuar a usar HTTP, cookie sem Secure, e o par de credenciais de exemplo; produção é o perfil explícito (FR-001, FR-004).
- Palavra-passe mínima de 8 caracteres mantém-se; o limite de ritmo é a mitigação em linha (não se reabre política de complexidade nesta spec).
- Pré-visualização de convite sem sessão (nome do servidor) é intencional e permanece.
- Espelhar no cliente a regra «mostrar Apagar» é aceitável se o servidor for a autoridade; FR-015 cobre o servidor, não obriga a gerar o cliente a partir do mesmo artefacto.
- `spike/` e o HTML do protótipo de design não fazem parte do binário de produção.
- Cabeçalhos de segurança aplicam-se quando a app é servida como produto (API + estático); o servidor de desenvolvimento pode ser mais permissivo.
- Não se exige pentest externo formal para fechar esta spec; testes de contrato + verificação manual dos cenários acima bastam.
- Topologia: **browser → (TLS/proxy opcional) → um serviço → base**. O proxy não substitui o endurecimento do serviço (SSRF, ritmo, credenciais, URL de voz).
- Sinalização de voz: um valor de configuração; o cliente não “descobre” o host pelo pedido HTTP.
- Chaves de canal no armazenamento do browser: fora desta entrega; o perímetro (política de conteúdo, fontes locais) é a mitigação.
