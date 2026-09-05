# Feature Specification: Colar imagens, WebP e limite 5 MB

**Feature Branch**: `010-media-paste-webp`

**Created**: 2026-09-04

**Status**: Draft

**Input**: User description: "Melhorias no chat-media-embeds, vamos capturar o comando de colar, então se o usuário estiver colando imagem também, nós vamos aceitar. Imagens coladas no chat, serão salvas como webp para reduzir o tamanho. Imagens anexadas ao chat, terão que ter um limite máximo de 5mb."

**Depends on**: [009-chat-media-embeds](../009-chat-media-embeds/) (envio de anexos de imagem/GIF no canal de texto já existente).

## Clarifications

### Session 2026-09-04

- Q: GIF animado colado — WebP ou manter GIF? → A: Se animado → manter GIF; se estático → WebP
- Q: Colar texto e imagem ao mesmo tempo? → A: Imagem → anexos pendentes; texto → campo do composer
- Q: Onde escutar o colar de imagem? → A: Em todo o painel do canal de texto (composer + área de mensagens)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Colar imagem no composer (Priority: P1)

Como membro num canal de texto, quero colar uma imagem da área de transferência (captura, browser, etc.) no composer e enviá-la como anexo, sem ter de guardar o ficheiro e escolher «anexar».

**Why this priority**: Fluxo diário mais rápido; pedido explícito de capturar o comando colar.

**Independent Test**: No painel do canal de texto (composer ou área de mensagens), colar uma imagem → aparece na pré-visualização de anexos pendentes → enviar → a mídia aparece no histórico para o remetente e para outro membro.

**Acceptance Scenarios**:

1. **Given** o painel do canal de texto aberto (composer ou área de mensagens), **When** o utilizador cola conteúdo que inclui uma imagem, **Then** essa imagem é aceite como anexo pendente (pré-visualização), mesmo sem o campo do composer estar focado; colar só texto não cria anexo fantasma.
2. **Given** colar com imagem e texto juntos, **When** o utilizador cola, **Then** a(s) imagem(ns) vão para anexos pendentes e o texto da colagem é inserido no campo do composer (editável antes de enviar).
3. **Given** colar só texto, **When** o utilizador cola, **Then** o comportamento de texto actual mantém-se (sem forçar anexo).
4. **Given** já existem 10 anexos pendentes, **When** tenta colar mais uma imagem, **Then** é bloqueado com feedback claro (mesmo limite de anexos por mensagem da 009).

---

### User Story 2 - Imagens coladas guardadas como WebP (Priority: P1)

Como operador/utilizador, quero que imagens **coladas** sejam enviadas em formato **WebP** (após conversão no cliente), para reduzir o tamanho face a PNG/JPEG típicos de capturas.

**Why this priority**: Pedido explícito de redução de tamanho nas colagens.

**Independent Test**: Colar uma captura PNG/JPEG → na pré-visualização/envio o anexo tratado como WebP; outro membro vê a imagem; o blob cifrado no disco corresponde a conteúdo WebP após decifrar.

**Acceptance Scenarios**:

1. **Given** o utilizador cola uma imagem raster estática (ex. PNG ou JPEG), **When** a imagem é aceite no composer, **Then** é convertida para WebP antes do envio (o tipo enviado/armazenado reflecte WebP).
2. **Given** o utilizador cola um **GIF animado**, **When** a imagem é aceite, **Then** permanece como GIF (animação preservada) e **não** é forçada a WebP.
3. **Given** o utilizador cola um GIF **estático** (um frame / sem animação detectável), **When** a imagem é aceite, **Then** é convertida para WebP como as outras imagens estáticas.
4. **Given** a conversão WebP, **When** a qualidade visual é avaliada em capturas típicas de ecrã, **Then** a imagem permanece legível no histórico (sem artefactos graves que inviabilizem leitura de texto na captura).
5. **Given** falha na conversão WebP (ou no tratamento do GIF), **When** o cliente não consegue preparar o anexo, **Then** o utilizador recebe feedback claro e o anexo não é enviado em estado inválido.

---

### User Story 3 - Limite máximo de 5 MB por imagem anexada (Priority: P1)

Como membro, quero um limite claro de **5 MB** por imagem anexada (seletor de ficheiros e, após conversão, colagens), para a instância e a rede não carregarem com ficheiros grandes.

**Why this priority**: Pedido explícito; altera a política da 009 (antes ~8 MiB).

**Independent Test**: Tentar anexar ficheiro >5 MB → rejeição com mensagem clara; ficheiro ≤5 MB válido passa; colagem cujo WebP resultante exceda 5 MB também é rejeitada ou pedida redução.

**Acceptance Scenarios**:

1. **Given** o seletor de anexos, **When** o utilizador escolhe uma imagem ou GIF **acima de 5 MB**, **Then** o anexo é rejeitado com feedback claro e não entra na lista pendente.
2. **Given** uma imagem ≤5 MB (e tipos já permitidos), **When** anexa e envia, **Then** o envio funciona como na 009.
3. **Given** uma imagem colada convertida para WebP, **When** o resultado (ou a origem, conforme a regra do produto) ultrapassa 5 MB, **Then** o utilizador é informado e o envio desse anexo não prossegue.
4. **Given** a política antiga de 8 MB, **When** esta feature está activa, **Then** o limite efectivo para novos anexos é **5 MB** (cliente e servidor alinhados).

---

### Edge Cases

- Colar múltiplas imagens de uma vez: aceitar até ao limite de anexos por mensagem (10); rejeitar o excedente com feedback.
- Colar GIF animado: **manter GIF** (animação preservada); GIF estático → WebP.
- Colar sem o composer focado: paste com imagem MUST funcionar em **todo o painel** do canal de texto (área de mensagens + composer); não é necessário foco no input.
- Texto + imagem na mesma colagem: imagem(ns) → anexos pendentes; texto → campo do composer.
- Limite 5 MB medido no ficheiro/anexo **antes** da cifra (tamanho do media em claro após conversão WebP para colagens estáticas; GIF animado colado medido como ficheiro GIF).
- GIF/JPEG/PNG anexados pelo seletor: não são forçados a WebP nesta feature — só colagens de imagens **estáticas** passam a WebP; anexos por ficheiro mantêm tipo permitido, com teto 5 MB.
- Unfurl e canais de voz: fora de âmbito (inalterados).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O produto MUST capturar a acção de **colar** em **todo o painel** do canal de texto (área de mensagens e composer) e, quando a área de transferência contiver imagem(ns), MUST aceitá-la(s) como anexo(s) pendente(s) elegíveis a envio — mesmo sem o campo do composer estar focado. Quando a mesma colagem incluir texto e imagem(ns), MUST colocar a(s) imagem(ns) nos anexos pendentes e MUST inserir o texto no campo do composer.
- **FR-002**: Colar apenas texto MUST NOT impedir o comportamento normal de inserção de texto.
- **FR-003**: Imagens **estáticas** aceites via **colar** MUST ser convertidas para **WebP** no cliente antes de cifrar e enviar. GIF **animado** colado MUST permanecer como GIF (sem forçar WebP). GIF estático colado MUST seguir a regra WebP das imagens estáticas.
- **FR-004**: Cada imagem anexada (ficheiro escolhido ou resultado de colagem após conversão) MUST respeitar o tamanho máximo de **5 MB**; acima disso MUST ser rejeitada com mensagem compreensível.
- **FR-005**: O limite de 5 MB MUST ser enforceado no cliente e no servidor (substituindo o limite superior anterior para novos uploads).
- **FR-006**: Os restantes limites da 009 (tipos permitidos no seletor, máximo de anexos por mensagem, E2EE de anexos) MUST permanecer, excepto o tamanho máximo actualizado para 5 MB e o fluxo de colar+WebP.
- **FR-007**: Falhas de paste sem imagem útil, conversão WebP ou tamanho MUST NOT corromper o histórico nem criar mensagens órfãs.

### Out of Scope

- Alterar unfurl / resolução de links.
- Forçar WebP em ficheiros escolhidos pelo seletor (só colagens).
- Editor de imagem (recorte, anotações).
- Colar ficheiros não-imagem (PDF, etc.).

### Key Entities

- **Anexo pendente (colar)**: imagem da área de transferência convertida (ou a converter) para WebP, sujeita ao limite de 5 MB e ao máximo de anexos por mensagem.
- **Política de tamanho**: 5 MB por anexo de mídia no chat de texto.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em teste com 5 capturas coladas (PNG/JPEG típicos), **100%** entram como anexos WebP e aparecem no histórico do remetente e de um segundo membro em ≤5 s após envio (rede local), quando ≤5 MB após conversão.
- **SC-002**: Colar só texto em **100%** das tentativas de amostra não cria anexo fantasma.
- **SC-003**: Ficheiro de imagem **>5 MB** no seletor é rejeitado em **100%** das tentativas, com feedback visível e **0** mensagens inválidas no histórico.
- **SC-004**: Após activar a feature, tentativa de upload >5 MB via API/cliente alinhado é rejeitada (**100%**); uploads ≤5 MB válidos continuam a funcionar.
- **SC-005**: Em amostra de capturas de ecrã com texto, revisores consideram o WebP colado **legível** (≥4 em 5 casos).

## Assumptions

- A 009 já está disponível (anexos cifrados, composer, histórico).
- «Imagens anexadas» no pedido do utilizador → limite **5 MB** para uploads de mídia do chat (seletor e colagens após WebP).
- Colagens de imagens **estáticas** → WebP no cliente; qualidade WebP escolhida no plano para equilibrar tamanho e legibilidade.
- Seletor de ficheiros: continua a permitir JPEG/PNG/WebP/GIF até 5 MB, sem conversão obrigatória para WebP.
- GIF **animado** colado: manter GIF; GIF estático colado: WebP (clarificação 2026-09-04).
- Paste com imagem: escutado em **todo o painel** do canal de texto (clarificação 2026-09-04).
- Máximo de 10 anexos por mensagem mantém-se.
