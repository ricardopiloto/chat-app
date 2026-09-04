# Feature Specification: Fase 2 — Cenas de câmera trocáveis

**Feature Branch**: `003-fase-2-cenas`

**Created**: 2026-09-04

**Status**: Validated (2026-09-04)

**Input**: User description: "faça a spec da Fase 2 do projeto"

## Clarifications

### Session 2026-09-04

- Q: A gravação/exportação no servidor e o desligar da proteção ponta-a-ponta entram nesta fase? → A: Não. Só cenas ao vivo (US1 obrigatória) e co-diretor (P2). Gravação, exportação e desligar proteção saem desta spec.
- Q: De onde nasce o mapa de uma cena nova? → A: Os dois caminhos: cópia da composição visível agora (cena ativa) e duplicar qualquer cena já nomeada na lista. Criar ou duplicar não troca a cena ativa.
- Q: Quem concede e revoga o papel de co-diretor? → A: Quem administra o canal de vídeo (incluindo o dono do Servidor). Co-diretor não nomeia outros co-diretores.
- Q: O que acontece ao tentar apagar a cena que está no ar? → A: Recusar. É preciso ativar outra cena e só então apagar a anterior. O canal nunca fica sem cena ativa.

## User Scenarios & Testing *(mandatory)*

A Fase 1 entrega uma **grade fixa** por canal de vídeo: o dono mapeia pessoas a slots e esse mapa vale até alguém alterar. A Fase 2 entrega o diferencial seguinte da cunha de produto: **várias composições nomeadas no mesmo canal**, trocáveis ao vivo, para que a mesa (ou o grupo) mude o quadro sem reconstruir a grade a cada momento da sessão.

Exemplo de uso: uma cena “mesa completa” com quatro pessoas; uma cena “foco no mestre”; uma cena “dois jogadores em destaque”. Quem assiste a chamada vê a composição ativa; quem troca a cena não derruba a chamada.

A proteção ponta-a-ponta **permanece sempre ligada**, como na Fase 1. Não há nesta fase modo de desligar essa proteção nem de gravar/exportar a cena no servidor.

O cliente desta fase continua sendo o **navegador**. Convite por link, contas, Servidores e a grade de 2–4 slots já existem na Fase 1 e não são reespecificados aqui.

**Definição de “done”:** num canal de vídeo da Fase 1 já funcional, o dono cria pelo menos duas cenas, troca entre elas durante a chamada, e **todas** as pessoas na chamada passam a ver a mesma composição em poucos segundos, sem perder áudio. Opcionalmente (P2), alguém com papel de co-diretor também troca cenas.

### User Story 1 - Guardar e trocar cenas ao vivo (Priority: P1)

O dono (ou quem já administra o canal na Fase 1) trata a grade atual como uma **cena**: dá um nome, salva, e pode criar outras cenas no mesmo canal. Cada cena é um mapa completo da grade daquele canal (quantos slots, quem ocupa qual posição, quais slots ficam vazios de propósito). Uma cena nova nasce de um destes caminhos: **cópia da composição visível agora** (a cena ativa) ou **duplicata de qualquer cena já nomeada** da lista. Criar ou duplicar **não** muda o quadro ao vivo — a cena ativa só muda quando alguém a troca de propósito. Durante a chamada, quem tem permissão escolhe a cena ativa. Todos os participantes passam a ver **a mesma** composição; a chamada não reinicia.

A cena ativa sobrevive a recarregar o cliente e a sair e voltar. Quem entra no meio da sessão vê a cena que está ativa, não uma grade “de chegada” diferente da dos outros.

**Why this priority**: É o salto da cunha: composição intencional **trocável**, não só um mapa único. Sem isso a Fase 2 não existe.

**Independent Test**: Duas pessoas numa chamada; a grade atual já é a cena “Mesa”; o dono copia o quadro visível para uma cena nova, ajusta essa cópia para “Foco no mestre” (só uma pessoa no primeiro slot) **sem** o quadro ao vivo mudar ainda; troca para “Foco no mestre”; os dois clientes mostram essa composição; troca de volta para “Mesa”. Também duplica “Mesa” a partir da lista e confirma que o quadro ao vivo continua em “Mesa” até alguém ativar a duplicata. Entrega valor mesmo sem co-diretor.

**Acceptance Scenarios**:

1. **Given** um canal de vídeo da Fase 1 com mapa de slots já definido, **When** a Fase 2 passa a valer nesse canal, **Then** esse mapa existe como cena nomeada e é a cena ativa (ninguém perde o layout atual).
2. **Given** uma cena ativa, **When** o dono cria uma cena nova como cópia do quadro visível agora e lhe dá um nome, **Then** a lista ganha essa cena com o mesmo mapa da ativa; a cena ativa **não** muda.
3. **Given** pelo menos uma cena nomeada na lista, **When** o dono duplica essa cena e dá um nome à cópia, **Then** a lista ganha a duplicata com o mesmo mapa da origem; a cena ativa **não** muda, mesmo que a origem não fosse a ativa.
4. **Given** um canal com pelo menos duas cenas, **When** quem tem permissão ativa a segunda cena durante a chamada, **Then** todos os participantes veem a composição da segunda cena (mesmos slots ocupados e vazios) sem precisar sair da chamada.
5. **Given** uma cena ativa, **When** um participante recarrega o cliente ou sai e volta, **Then** vê a cena ativa atual, não um mapa automático de “primeiro vazio”.
6. **Given** uma pessoa na chamada que não tem slot na cena ativa, **When** a troca acontece, **Then** ela continua ouvindo e vendo a grade; não ganha um slot extra; o layout não compacta.
7. **Given** um membro sem permissão de administrar o canal nem de co-dirigir, **When** tenta criar, duplicar, editar, apagar ou ativar uma cena, **Then** a ação é recusada e a composição não muda para ninguém.
8. **Given** quem administra o canal apaga uma cena que **não** está ativa e não é a única, **When** a lista é atualizada, **Then** a cena some e a cena ativa permanece.
9. **Given** uma cena está ativa (haja ou não outras na lista), **When** alguém tenta apagá-la, **Then** a exclusão é recusada e o quadro ao vivo não muda. **Given** é a única cena do canal, **When** alguém tenta apagá-la, **Then** a exclusão também é recusada.

---

### User Story 2 - Co-diretor troca cenas sem ser o dono (Priority: P2)

Quem **administra o canal de vídeo** (o mesmo papel da Fase 1 que mapeia slots, o que inclui o dono do Servidor) concede a um membro o papel de **co-diretor** naquele canal. Podem existir vários co-diretores ao mesmo tempo. O co-diretor pode ativar cenas já existentes durante a sessão. Não precisa administrar o canal para “cortar” o quadro no momento certo (ex.: o mestre joga; outra pessoa opera as cenas).

Criar, duplicar, editar o mapa de uma cena e apagar cenas continua restrito a quem administra o canal. O co-diretor, neste papel mínimo, **só troca** a cena ativa: não cria, não duplica, não edita, não apaga e **não** nomeia nem revoga outros co-diretores.

**Why this priority**: O brief do produto lista co-diretor junto com cenas. A mesa realista tem quem joga e quem opera o quadro. Pode vir depois da troca pelo administrador já funcionar.

**Independent Test**: Quem administra o canal cria duas cenas e marca um membro como co-diretor; esse membro ativa a outra cena; todos veem a troca. Um terceiro membro sem o papel tenta a mesma ação e falha. O co-diretor tenta nomear outra pessoa e falha. Remover o papel faz a próxima tentativa do ex-co-diretor falhar.

**Acceptance Scenarios**:

1. **Given** um membro do Servidor, **When** quem administra aquele canal de vídeo concede co-direção nesse canal, **Then** esse membro passa a poder ativar cenas já existentes.
2. **Given** um co-diretor, **When** ativa uma cena durante a chamada, **Then** o efeito é o mesmo da US1 (todos veem a nova composição).
3. **Given** um co-diretor, **When** tenta criar, duplicar, editar ou apagar uma cena, ou conceder/revogar co-direção, **Then** a ação é recusada.
4. **Given** quem administra o canal revoga a co-direção, **When** o ex-co-diretor tenta ativar uma cena, **Then** a ação é recusada.
5. **Given** um membro que não administra o canal, **When** tenta conceder ou revogar co-direção, **Then** a ação é recusada.

---

### Edge Cases

- Canal de vídeo da Fase 1 sem cenas nomeadas ainda: na primeira abertura da Fase 2, o mapa atual vira automaticamente a cena padrão (nome visível, editável), para ninguém perder o layout que já usava.
- Troca de cena no mesmo instante por duas pessoas autorizadas: vale a última confirmação aceita; todos convergem para uma única cena ativa (sem metade dos clientes numa composição e metade noutra).
- Dono edita o mapa da cena **ativa** (mexe slots ou o N de 2–4): o efeito é imediato para todos, como na Fase 1; não cria uma cena nova sem o dono pedir uma cópia ou duplicata.
- Dono edita uma cena que **não** está ativa: só aquela cena muda; o quadro ao vivo não se altera até alguém ativá-la.
- Criar cena como cópia da ativa, ou duplicar uma cena da lista, não troca a cena ativa.
- Dono reduz slots numa cena e uma conta estava num slot que deixa de existir: essa conta fica na chamada sem slot de câmera até ser colocada de novo, igual à Fase 1.
- Pessoa sem câmera numa cena em que tem slot: o slot permanece no lugar, vazio de vídeo, sem compactar.
- Terceiro (ou quinto) participante quando a cena ativa já encheu os slots: vê e ouve; não ganha slot extra; a Fase 2 **não** amplia o máximo de 4 slots.
- Cena que referencia uma conta que saiu do Servidor: o slot fica vazio até o dono remapear; a cena não quebra a chamada.
- Dois dispositivos da mesma conta: continua um único slot (regra da Fase 1); a cena aponta para a conta, não para o aparelho.
- Instância cai no meio da chamada: ao voltar, a cena ativa persistida é a que vale.
- Alguém procura desligar a proteção ponta-a-ponta ou gravar/exportar a cena no servidor: essa opção **não existe** nesta fase.
- Co-diretor tenta conceder ou revogar co-direção: recusada.
- Apagar a cena ativa: sempre recusado, mesmo que existam outras; quem opera ativa outra e só então apaga a anterior. Apagar a única cena do canal: recusado. O canal nunca fica sem cena ativa.
- Templates de cena copiados entre Servidores ou entre instâncias: fora desta fase.
- Sobreposições tipo programa de transmissão (texto, imagens, fundo virtual além da grade): fora desta fase.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Cada canal de voz/vídeo MUST ter uma **cena ativa** o tempo todo. Na primeira vez em que a Fase 2 se aplica a um canal existente, o mapa de slots da Fase 1 MUST virar a cena padrão desse canal, sem o dono perder o layout atual.
- **FR-002**: Quem administra o canal MUST poder criar cenas nomeadas no mesmo canal por dois caminhos: (1) cópia da composição visível agora (cena ativa) e (2) duplicata de qualquer cena já nomeada da lista. Cada cena MUST ter um mapa completo da grade (2–4 slots, ocupação por conta, slots vazios visíveis). O número máximo de slots MUST permanecer 4, como na Fase 1. Criar ou duplicar MUST NOT alterar a cena ativa.
- **FR-003**: Quem administra o canal MUST poder editar o nome e o mapa de uma cena e MUST poder apagar cenas que **não** estejam ativas, desde que reste pelo menos uma cena. MUST NOT ser possível apagar a cena ativa (é preciso ativar outra antes). MUST NOT ser possível deixar o canal sem nenhuma cena. Editar uma cena inativa MUST NOT alterar o quadro ao vivo.
- **FR-004**: Quem administra o canal e quem for co-diretor MUST poder ativar uma cena existente. A ativação MUST aplicar a composição a **todos** os participantes da chamada daquele canal, sem exigir que saiam e entrem de novo.
- **FR-005**: Membros sem administração do canal e sem co-direção MUST NOT criar, duplicar, editar, apagar nem ativar cenas.
- **FR-006**: A cena ativa MUST persistir: recarregar o cliente, sair e voltar, e um recém-chegado à chamada MUST ver a mesma composição que os demais.
- **FR-007**: Contas na chamada sem slot na cena ativa MUST continuar a ouvir e a ver a grade; MUST NOT receber um slot extra; a grade MUST NOT compactar.
- **FR-008**: Quem administra o canal de vídeo MUST poder conceder e revogar o papel de **co-diretor** a membros do Servidor, por canal. Podem existir vários co-diretores no mesmo canal. Co-diretor MUST poder ativar cenas existentes e MUST NOT, só com esse papel, criar, duplicar, editar ou apagar cenas, nem conceder ou revogar co-direção.
- **FR-009**: Texto, voz e vídeo MUST permanecer protegidos de ponta a ponta em todos os canais, como na Fase 1. Nesta fase MUST NOT existir controle para desligar essa proteção nem para gravar ou exportar a composição no servidor.
- **FR-010**: O cliente desta fase MUST continuar sendo o navegador; o restante do produto da Fase 1 (contas, convites, Servidores, texto, grade fixa, um slot por conta, proteção ponta-a-ponta sempre ligada) MUST continuar a valer, salvo o que esta spec substitui (mapa único → cenas).

### Key Entities

- **Cena**: composição nomeada da grade de um canal de vídeo (quantos slots, quais contas em quais posições, quais slots vazios). Várias cenas por canal; uma delas é a ativa. Cena nova nasce como cópia da ativa ou como duplicata de qualquer cena da lista; nenhum dos dois caminhos troca a ativa sozinho.
- **Cena ativa**: a composição que todos os participantes daquele canal veem neste momento; persistida; obrigatória.
- **Co-diretor**: papel por canal de vídeo, concedido por quem administra esse canal (incluindo o dono do Servidor), que autoriza apenas ativar cenas já existentes. Não nomeia outros co-diretores. Vários membros podem ter o papel ao mesmo tempo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Numa chamada com pelo menos 2 pessoas, quem opera as cenas completa “copiar o quadro visível para uma segunda cena + ativá-la” em menos de 2 minutos na primeira vez, sem sair da chamada.
- **SC-002**: Em 100% dos testes com 2 ou mais participantes na mesma chamada, após ativar uma cena, **todos** os clientes mostram a mesma ocupação de slots (incluindo vazios) em menos de 3 segundos após a troca ser confirmada.
- **SC-003**: Em 100% dos testes, recarregar o cliente ou sair e voltar durante uma cena ativa recoloca a pessoa na composição ativa, não num mapa de “primeiro vazio” diferente do restante do grupo.
- **SC-004**: Um co-diretor consegue ativar uma cena que quem administra o canal já criou; um membro sem o papel, no mesmo teste, não altera a composição de ninguém.
- **SC-005**: Em 100% das tentativas nesta fase, não há ação disponível para desligar a proteção ponta-a-ponta nem para gravar/exportar a cena no servidor.
- **SC-006**: Um revisor com acesso de operador à instância, **sem** as chaves das pessoas, não obtém o texto das mensagens nem o áudio/vídeo em claro (mesmo critério da Fase 1).
- **SC-007**: Pelo menos 3 pessoas na mesma chamada avaliam a troca de cena como utilizável ao vivo (não precisam reconectar para “o quadro mudar”); a tarefa “alternar duas cenas duas vezes seguidas” completa-se sem perda permanente de áudio para o grupo.

## Assumptions

- A Fase 1 já está no ar neste repositório (contas, convites, Servidores, canais, grade 2–4, proteção ponta-a-ponta sempre ligada, cliente web). Esta fase **estende** canais de vídeo; não redefine cadastro nem convite.
- **Cena** nesta fase é composição da **grade de câmeras** já existente (quem aparece onde), não um editor tipo estúdio de transmissão (camadas, fundos, logos, texto na imagem).
- O máximo de 4 slots e a regra de um slot por conta continuam; cenas não servem para “caber mais gente na grade”.
- Co-diretor é um papel mínimo (só troca a cena ativa). Quem administra o canal (Fase 1) concede e revoga esse papel; co-diretor não delega. Administração completa do canal (criar/duplicar/editar mapas, número de slots) permanece com quem já administra na Fase 1.
- Gravação/exportação no servidor e a exceção consciente de proteção por canal **não** entram nesta fase; continuam no roadmap do produto para uma fase posterior.
- Instalador gráfico / one-liner, cliente nativo, compartilhamento de tela, templates de cena compartilháveis entre Servidores ou instâncias, mais de 4 slots e federação **não** entram nesta spec (o mercado chegou a listar instalador na mesma “Fase 2”; aqui o recorte é a cunha visual, que ainda não existe).
- Convite por link já é Fase 1; não se reespecifica.
- A constituição do repositório ainda é o modelo não ratificado; não impõe ciclo de testes além do que as histórias já tornam verificável.

## Out of Scope

- Gravação, exportação da composição no servidor e desligar a proteção ponta-a-ponta por canal (fica para fase posterior, com sinalização explícita).
- Instalador one-liner ou gráfico Windows+Linux.
- Cliente desktop nativo.
- Templates de cena compartilháveis entre Servidores ou entre Instâncias de Hospedagem.
- Mais de 4 slots, várias câmeras por pessoa, compartilhamento de tela.
- Editor de cena com sobreposições, fundos virtuais, logos ou texto desenhado sobre o vídeo.
- Publicação automática para plataforma externa de transmissão.
- Federação, diretório público, denúncia ao mantenedor, plugins, canais privados/restritos.
- Papéis ricos além de dono / administrador de canal / co-diretor / membro.
