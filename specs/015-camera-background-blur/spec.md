# Feature Specification: Blur de fundo da câmara

**Feature Branch**: `015-camera-background-blur`

**Created**: 2026-09-04

**Status**: Draft

**Input**: User description: "Vamos criar uma funcionalidade para as cameras, vamos adicionar a possibilidade do usuário adicionar blur no fundo com dois modos, blur leve e blur forte."

**Depends on**: canal de voz/vídeo com câmara ao vivo já existente ([006](../006-prototype-ui-parity/), [012](../012-shell-iconography-typography/) para controlos de chamada).

## Clarifications

### Session 2026-09-04

- Q: O blur pode ser escolhido com a câmara desligada? → A: Sim; o controlo permanece utilizável com a câmara desligada e o modo escolhido aplica-se desde o primeiro frame ao ligar (sem flash do quarto nítido).
- Q: Se o blur falhar a meio da chamada? → A: Falha fechada: enquanto leve/forte estiver escolhido, nunca se publica fundo nítido; o vídeo congela ou pára até recuperar, com mensagem clara.
- Q: Como se escolhe o modo na barra de chamada? → A: Extra no botão Câmara (seta/menu colado à câmara); sem botão «Fundo» próprio.
- Q: Como abrir o menu sem desligar a câmara? → A: Controlo partido: área principal (ícone + «Câmara») liga/desliga a câmara; seta separada abre o menu de blur.
- Q: Dá para ver se o blur está ligado sem abrir o menu? → A: A seta muda de aspecto quando o modo é leve ou forte (não só por cor); leve vs forte distingue-se no menu. O ícone da câmara continua a significar só ligada/desligada.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Aplicar blur de fundo na própria câmara (Priority: P1)

Como participante numa chamada de voz/vídeo com a câmara ligada, quero **desfocar o fundo** da minha imagem (não a minha pessoa) para que as outras pessoas na sala — e uma eventual gravação da cena — **não vejam nitidamente o espaço atrás de mim**.

**Why this priority**: Pedido explícito; é o valor central da funcionalidade (privacidade do ambiente sem desligar a câmara).

**Independent Test**: Dois participantes na mesma chamada; A liga a câmara e activa blur; B vê o feed de A com fundo desfocada e a pessoa nítida; A desliga o blur e B volta a ver o fundo nítido.

**Acceptance Scenarios**:

1. **Given** estou na chamada com a câmara ligada e o blur está desligado, **When** escolho **blur leve**, **Then** o fundo da minha câmara fica suavemente desfocada (formas e cores grandes ainda se percebem) e o meu rosto/corpo permanece nítido, tanto no meu tile como no tile que os outros vêem.
2. **Given** estou na chamada com a câmara ligada, **When** escolho **blur forte**, **Then** o fundo fica **claramente mais desfocada** do que no modo leve (o espaço atrás de mim fica difícil de reconhecer) e a pessoa permanece nítida, tanto para mim como para os outros.
3. **Given** o blur está activo (leve ou forte), **When** outro participante olha para o meu tile, **Then** vê o **mesmo** modo de blur que eu escolhi — não um fundo nítido só para os outros.
4. **Given** o blur está activo e alguém inicia ou está a gravar a cena, **When** a gravação captura o meu feed, **Then** o fundo aparece desfocada no mesmo modo (a privacidade do fundo não se perde na gravação).

---

### User Story 2 - Escolher entre sem blur, leve e forte sem sair da chamada (Priority: P1)

Como participante na chamada, quero **alternar** entre **sem blur**, **blur leve** e **blur forte** a qualquer momento (câmara ligada ou desligada), sem sair da sala.

**Why this priority**: Os dois modos pedidas só têm valor se forem escolhíveis e reversíveis ao vivo; «sem blur» é o estado de partida e a forma de desligar.

**Independent Test**: Na chamada, seleccionar os três estados com a câmara ligada e desligada; com a câmara ligada cada mudança reflecte-se em poucos segundos no próprio tile e no tile remoto, sem a câmara desligar.

**Acceptance Scenarios**:

1. **Given** estou na chamada (câmara ligada ou desligada), **When** activo a **seta** (área extra) do botão Câmara, **Then** o menu abre com três opções mutuamente exclusivas: **Sem blur**, **Blur leve**, **Blur forte**, a opção actual está marcada, e a câmara **não** muda de ligada/desligada.
2. **Given** estou em blur leve, **When** passo para blur forte (ou o inverso) pelo menu, **Then** a intensidade muda sem a câmara desligar e sem eu sair da chamada.
3. **Given** o blur está activo, **When** escolho **Sem blur**, **Then** o fundo volta a nítido para mim e para os outros.
4. **Given** acabo de mudar de modo, **When** observo o meu tile, **Then** o estado visível corresponde à opção seleccionada em ≤2 segundos.
5. **Given** a câmara está ligada, **When** clico na área principal (ícone + rótulo «Câmara»), **Then** a câmara desliga como hoje e o menu de blur **não** abre.
6. **Given** o modo é leve ou forte, **When** olho para o botão Câmara **sem** abrir o menu, **Then** a **seta** está visualmente distinta do estado «sem blur» (diferença de forma ou marca, não só de cor). **When** o modo é sem blur, **Then** a seta volta ao aspecto por omissão. O ícone da câmara **não** muda por causa do blur.

---

### User Story 3 - Menu no botão Câmara; primeiro frame já com o modo escolhido (Priority: P2)

Como participante, quero escolher o blur **no próprio botão Câmara** (menu/seta colada, sem botão extra na barra), **utilizável mesmo com a câmara desligada**, para que ao ligar a câmara o quarto **não apareça nítido** sequer um instante. Quero também uma indicação clara quando o blur **não está disponível** no dispositivo.

**Why this priority**: Sem descoberta no sítio da câmara a funcionalidade não é usada; sem escolha prévia, a privacidade do fundo falha no momento de ligar a câmara.

**Independent Test**: Câmara desligada → clicar na **seta** do botão Câmara (não no ícone/rótulo) → escolher blur forte → clicar na área principal para ligar a câmara → o primeiro frame visível para os outros já tem fundo desfocada; se o blur não puder ser aplicado no dispositivo, mensagem clara e sem estado «ligado» falso.

**Acceptance Scenarios**:

1. **Given** estou na chamada com a câmara **desligada**, **When** escolho **blur leve** ou **blur forte** e depois ligo a câmara, **Then** o **primeiro** frame que eu e os outros vemos já está no modo escolhido — o quarto nítido não aparece.
2. **Given** a câmara está ligada e o blur **não pode** ser aplicado neste dispositivo ou contexto, **When** tento activar leve ou forte, **Then** vejo uma mensagem clara (ex. «Blur de fundo não disponível») e o feed permanece nítido — sem estado «ligado» falso.
3. **Given** escolhi leve ou forte (câmara ligada ou não), **When** desligo a câmara, **Then** o modo permanece seleccionado; **When** volto a ligar, **Then** o primeiro frame volta a aplicar esse modo se o blur continuar disponível.
4. **Given** uso «Vídeo de teste» em vez da câmara real, **When** estou nessa pré-visualização, **Then** o blur de fundo **não** se aplica a esse vídeo de teste (só à câmara ao vivo da pessoa).
5. **Given** o blur leve ou forte está activo e o efeito **deixa de poder ser aplicado** a meio da chamada, **When** a falha ocorre, **Then** o meu vídeo **congela ou pára** (áudio da chamada continua), vejo uma mensagem clara, e **ninguém** (eu, outros, gravação) vê o quarto nítido. **When** escolho **Sem blur**, **Then** o vídeo nítido pode retomar. **When** o efeito recupera com leve/forte ainda escolhido, **Then** o vídeo retoma já desfocada, sem intervalo nítido.

---

### Edge Cases

- Câmara ligada mas a pessoa sai parcialmente do enquadramento: o blur continua no fundo visível; não é necessário «seguir» perfeitamente o recorte da silhueta em todos os frames — recortes imperfeitos são aceitáveis; a pessoa não deve ficar ela própria desfocada de forma persistente.
- Iluminação má, fundo muito parecido com a roupa, ou movimento rápido: o recorte pode falhar por momentos (silhueta imperfeita); isso **não** é uma falha do efeito — o modo mantém-se e o vídeo **não** congela só por recorte imperfeito.
- Falha do efeito (não consegue produzir frames com fundo desfocada): vídeo congela ou pára; mensagem visível para quem envia; o modo leve/forte **não** passa sozinho a «sem blur»; o quarto nítido **não** é publicado. Áudio continua. A pessoa pode escolher «Sem blur» para retomar nítido, ou esperar a recuperação.
- Mudança de modo (leve ↔ forte ↔ off) a meio de uma gravação: a gravação reflecte o modo **a partir desse momento**; não reescreve o que já foi gravado.
- Vários participantes com blur independente: o modo de A não altera o fundo de B; cada um controla só o seu feed.
- Participante só com áudio (câmara nunca ligada): o tile de placeholder/avatar não recebe blur.
- Sair da chamada e voltar: a preferência local do último modo (sem / leve / forte) aplica-se de novo desde o primeiro frame quando a câmara volta a ligar, se o blur estiver disponível.
- Entrar na chamada já com a câmara a ligar (ex. «Ligar câmara e microfone») e preferência leve/forte guardada: o primeiro frame publicado já vai no modo guardado.
- Viewport estreita / Modo palco: a seta do botão Câmara permanece alcançável nos controlos de chamada (alvo distinto da área de toggle; utilizável com o dedo).
- Clique na seta com a câmara ligada: o menu abre e a câmara **permanece** ligada. Clique na área principal com o menu aberto: o menu pode fechar; o toggle da câmara comporta-se como hoje (não misturar as duas acções no mesmo clique).
- Leve e forte partilham o mesmo «ligado» na seta; só o menu distingue a intensidade. Daltonismo: a diferença seta ligada/desligada não depende só de cor.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Com a câmara ao vivo ligada, o utilizador MUST poder aplicar **blur de fundo** ao **seu** feed, com exactamente dois modos de intensidade: **leve** e **forte**.
- **FR-002**: O utilizador MUST poder deixar o fundo **sem blur** (estado inicial e forma de desligar). Os três estados — sem blur, leve, forte — são mutuamente exclusivos.
- **FR-003**: O blur MUST afectar só o **fundo**; a pessoa (rosto e corpo visíveis) MUST permanecer substancialmente nítida em ambos os modos.
- **FR-004**: O modo **forte** MUST ser visualmente **mais intenso** do que o **leve** (fundo mais difícil de reconhecer no forte).
- **FR-005**: O blur MUST ser visível para **os outros participantes** da mesma chamada no tile dessa pessoa, não apenas na pré-visualização local.
- **FR-006**: Quando a cena está a ser gravada, o feed dessa pessoa MUST aparecer na gravação com o **mesmo** modo de blur que os participantes vêem.
- **FR-007**: Mudar de modo (incluindo desligar) MUST NÃO exigir desligar a câmara nem sair da chamada.
- **FR-008**: O blur MUST ser escolhido num **menu colado ao botão Câmara**. MUST NOT haver um botão separado «Fundo» na barra. O menu MUST listar as três opções mutuamente exclusivas (sem blur / leve / forte) com a actual marcada. O rótulo visível da área principal continua **Câmara** (ícone + texto fixo, como hoje).
- **FR-016**: O botão Câmara MUST ser um controlo **partido**: a área principal (ícone + «Câmara») MUST apenas ligar/desligar a câmara; uma **seta (ou equivalente) separada** MUST apenas abrir/fechar o menu de blur. Abrir o menu, escolher um modo ou fechar o menu MUST NOT ligar nem desligar a câmara. A seta MUST estar disponível com a câmara ligada e desligada.
- **FR-017**: Com modo leve ou forte, a seta MUST mostrar à vista que o blur está **ligado**, sem abrir o menu. A distinção MUST NÃO depender só de cor (forma ou marca equivalente). Leve vs forte MUST continuar a distinguir-se **no menu**. O ícone da câmara MUST continuar a representar apenas ligada/desligada (não muda de forma por causa do blur). Com «sem blur», a seta MUST usar o aspecto por omissão.
- **FR-009**: Com a câmara desligada, o controlo de blur MUST permanecer **utilizável** (escolher sem / leve / forte). O modo escolhido MUST aplicar-se desde o **primeiro frame** publicado ao ligar a câmara: MUST NOT haver um intervalo em que o quarto nítido seja visível para os outros (nem na pré-visualização local) enquanto o modo for leve ou forte.
- **FR-010**: Se o blur **nunca** estiver disponível neste dispositivo ou contexto (não é possível activar), o sistema MUST informar de forma clara e MUST NÃO marcar o modo como leve/forte. A câmara pode permanecer nítida porque o utilizador **não** ficou com blur seleccionado.
- **FR-011**: A preferência de modo (sem / leve / forte) MUST persistir neste dispositivo para aquele utilizador (sobrevive a desligar/ligar a câmara, a sair e voltar à chamada, e a recarregar a aplicação), tal como a preferência de tema.
- **FR-012**: O blur MUST aplicar-se apenas à **câmara ao vivo da própria pessoa**. MUST NOT desfocar câmaras de outros, tiles sem vídeo, nem o «Vídeo de teste».
- **FR-013**: Cada participante MUST controlar **apenas** o blur do seu próprio feed; não há modo «desfocar todos» nem o director a impor blur nos outros nesta entrega.
- **FR-014**: Ligar a câmara com modo leve ou forte já seleccionado (incluindo preferência persistida) MUST publicar o feed já nesse modo desde o primeiro frame; MUST NOT publicar primeiro nítido e «aplicar depois».
- **FR-015**: Enquanto o modo for leve ou forte, o sistema MUST NOT publicar (nem mostrar localmente, nem gravar) o quarto nítido. Se o efeito falhar a meio, o vídeo MUST congelar ou parar até recuperar ou até o utilizador escolher **Sem blur**; MUST mostrar mensagem clara a quem envia; o áudio da chamada MUST continuar; o modo MUST NÃO mudar sozinho para «sem blur».

### Out of Scope

- Fundos virtuais (imagem ou vídeo em vez do quarto).
- Intensidade contínua (slider além dos dois modos).
- Blur no ecrã partilhado ou noutros conteúdos que não a câmara.
- O director/mestre a forçar blur nos feeds dos jogadores.
- Blur aplicado pelo espectador às câmaras dos outros (filtro só local de visualização).
- Garantia de recorte perfeito da silhueta em todas as condições de luz.
- Botão próprio «Fundo» (ou chips de blur) na barra de chamada, separado da Câmara.

### Key Entities

- **Modo de blur de fundo**: um de `off` | `leve` | `forte`, por utilizador, aplicado ao feed da própria câmara.
- **Feed de câmara ao vivo**: a imagem que a pessoa envia para a chamada (e que entra na composição/gravação).
- **Controlo de fundo**: seta (área extra) **separada** da área principal do botão **Câmara**; abre o menu de modo; não é um botão independente na barra e não faz toggle da câmara.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em teste com 2 participantes, após A activar blur leve ou forte, **100%** dos observadores (A e B) descrevem o fundo de A como desfocada e a pessoa como nítida, em ≤5 segundos após a escolha.
- **SC-002**: Em comparação lado-a-lado, **100%** dos observadores distinguem blur **leve** de blur **forte** no mesmo enquadramento (o forte esconde mais o fundo).
- **SC-003**: Em **100%** das tentativas de amostra, mudar entre os três modos **ou abrir o menu pela seta** não desliga nem liga a câmara nem tira a pessoa da chamada.
- **SC-004**: Em teste com 5 utilizadores sem guião longo, **≥4** encontram e usam o blur na primeira chamada **a partir do botão Câmara** (sem botão extra na barra).
- **SC-005**: Com blur **indisponível** no dispositivo, **0** casos em que o produto mostre o modo como «ligado» sem efeito real.
- **SC-006**: Quando há gravação da cena, o fundo da pessoa com blur activo aparece desfocada na saída gravada, no mesmo modo que os participantes viam no momento.
- **SC-007**: Em **100%** das tentativas em que leve ou forte está escolhido **antes** de ligar a câmara, observadores não vêem nenhum frame com o quarto nítido (o primeiro frame visível já está no modo escolhido).
- **SC-008**: Em teste de falha do efeito com leve/forte seleccionado, **0** frames nítidos do quarto são vistos por outros ou na gravação; o vídeo pára ou congela; após «Sem blur» o nítido pode voltar; após recuperação com blur ainda escolhido, o nítido continua a não aparecer.
- **SC-009**: Em teste com 5 observadores, **≥4** identificam correctamente se o blur está ligado ou não olhando só para a seta (menu fechado), em ≤2 segundos; a identificação não exige distinguir só uma cor.

## Assumptions

- O estado por omissão é **sem blur**; o utilizador opta explicitamente por leve ou forte (pode fazê-lo com a câmara ainda desligada).
- O blur é uma decisão de **quem envia** a câmara (privacidade do próprio espaço), visível a toda a sala e à gravação — não um filtro só no ecrã de quem vê. Enquanto essa decisão for leve/forte, falhar o efeito não «abre» o quarto: congela ou pára o vídeo.
- O recorte pessoa/fundo pode ser imperfeito; o critério de aceite é «fundo visivelmente desfocada, pessoa reconhecível», não silhueta de estúdio.
- A persistência é **local neste dispositivo** (como o tema); não é uma preferência de conta sincronizada entre browsers nesta entrega.
- «Vídeo de teste» continua a ser uma fonte alternativa para diagnosticar a sala; não entra no âmbito do blur.
- O vocabulário na UI é em português, alinhado aos controlos actuais («Câmara», «Microfone»). O botão continua a chamar-se **Câmara**; as opções do menu são «Sem blur», «Blur leve», «Blur forte» (copy equivalente aceite desde que os três estados sejam óbvios). A seta comunica só «blur ligado / desligado»; não precisa de rótulo de texto próprio além do acessível (nome da acção da seta).
- Viewport estreita e Modo palco reutilizam os controlos de chamada já existentes; o extra de blur vive no botão Câmara; não se cria um painel de definições (removido na 013).
