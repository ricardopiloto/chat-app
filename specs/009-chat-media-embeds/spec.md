# Feature Specification: Mídia e resolução de links no chat de texto

**Feature Branch**: `009-chat-media-embeds`

**Created**: 2026-09-04

**Status**: Draft

**Input**: User description (contexto `008-shell-chrome-members`): "vamos adicionar suporte ao envio de imagens, gifs e resolution of links (vídeos, imagens e links) no chat"

**Nota de âmbito**: Feature **nova** (009). A 008 continua só chrome (botões, composer largura, palco, membros). Esta feature cobre **conteúdo rico** no canal de texto.

## Clarifications

### Session 2026-09-04

- Q: Anexos e unfurl vs E2EE? → A: Anexos cifrados no cliente (opacos no disco); unfurl no servidor quando o cliente pede preview de um URL (após decifrar)
- Q: Quando pedir o unfurl? → A: Ao visualizar a mensagem (lazy): cada cliente pede preview após decifrar
- Q: Quantos anexos por mensagem? → A: Até **10** anexos (imagem/GIF) por mensagem

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Enviar imagem ou GIF no canal de texto (Priority: P1)

Como membro de um canal de texto, quero anexar e enviar **imagens** e **GIFs** na conversa, para partilhar capturas, memes e referências visuais sem sair da Mesa.

**Why this priority**: Pedido explícito; muda o valor do chat além de texto puro.

**Independent Test**: Num canal de texto, escolher uma imagem ou GIF permitida, enviar, ver a pré-visualização na própria mensagem; outro membro do mesmo servidor vê a mesma mídia após abrir o canal.

**Acceptance Scenarios**:

1. **Given** membro num canal de texto, **When** anexa um ficheiro de imagem ou GIF dentro dos tipos/tamanhos permitidos e envia, **Then** a mensagem aparece no histórico com a mídia visível (não só um nome de ficheiro opaco).
2. **Given** outro membro do mesmo servidor no mesmo canal, **When** carrega o histórico, **Then** consegue ver a imagem/GIF enviada.
3. **Given** um ficheiro fora dos tipos permitidos ou acima do limite de tamanho, **When** tenta enviar, **Then** o envio é rejeitado com feedback claro e nenhuma mensagem parcial inválida fica no histórico.
4. **Given** um não-membro, **When** tenta obter a mídia por URL adivinhada, **Then** não obtém o conteúdo decifrado (acesso só a membros autorizados com capacidade de decifrar).
5. **Given** o operador com acesso ao disco da instância, **When** inspecciona o blob do anexo sem chaves de cliente, **Then** não obtém a imagem/GIF em claro.
---

### User Story 2 - Resolução / preview de links (Priority: P1)

Como membro, quero que URLs partilhadas no chat mostrem um **cartão de preview** (página, imagem ou vídeo reconhecível), para eu perceber o destino sem abrir o link às cegas.

**Why this priority**: Pedido explícito de “resolution of links” (vídeos, imagens e links).

**Independent Test**: Enviar mensagem com URL público; ao **abrir/visualizar** o histórico, após decifrar, o cliente pede preview e aparece cartão (título/miniatura/domínio se disponível); link continua clicável. Sem abrir a mensagem/canal, a instância não recebe o URL só por o texto existir cifrado.

**Acceptance Scenarios**:

1. **Given** uma mensagem com URL de página pública já no histórico, **When** um membro visualiza e decifra a mensagem, **Then** o cliente pede unfurl e, se bem-sucedido, vê um cartão com pelo menos domínio e, se disponível, título e/ou miniatura.
2. **Given** uma URL que aponta directamente para uma imagem, **When** o preview resolve no momento da visualização, **Then** a imagem é pré-visualizada no fio (ou cartão equivalente).
3. **Given** uma URL de vídeo de um fornecedor suportado (ou página com metadados de vídeo), **When** o preview resolve na visualização, **Then** o cartão indica vídeo (miniatura/título/domínio) e o link permanece utilizável.
4. **Given** URL inválida, privada, ou falha de resolução, **When** o preview não está disponível, **Then** a mensagem mostra o link em texto sem cartão partido; o chat não bloqueia.
5. **Given** mensagem com URL ainda não visualizada por ninguém nesta sessão, **When** só existe no servidor como ciphertext, **Then** nenhum unfurl automático corre no servidor sem pedido de cliente.
---

### User Story 3 - Composer e histórico legíveis com mídia (Priority: P2)

Como utilizador, quero anexar mídia a partir do composer e percorrer o histórico sem layout partido (imagens grandes, vários anexos).

**Why this priority**: Qualidade de uso; depende de US1/US2.

**Independent Test**: Enviar texto+imagem; scroll no histórico; viewport estreito — mídia redimensiona dentro do painel sem overflow horizontal grave.

**Acceptance Scenarios**:

1. **Given** o composer do canal de texto, **When** o utilizador escolhe anexar até 10 imagens/GIFs, **Then** vê indicação de cada ficheiro seleccionado antes de enviar (e pode remover anexos individuais).
2. **Given** mensagens com imagens grandes ou vários anexos, **When** visualiza o histórico, **Then** as imagens cabem na largura do painel (escala responsiva) sem partir a coluna.
3. **Given** mensagem só com mídia (sem texto), **When** é enviada, **Then** é válida e aparece no histórico.
4. **Given** tentativa de anexar um 11.º ficheiro, **When** o utilizador tenta adicionar, **Then** é bloqueado com feedback claro.
---

### Edge Cases

- Canal de voz: **fora de âmbito** para envio de anexos nesta feature (só canal de texto), salvo se o produto já unificar composers — default: só texto.
- Membro sem permissão de escrita: não envia anexos (mesmas regras que mensagem de texto).
- Histórico limitado por convite sem histórico: anexos antigos seguem a mesma regra de visibilidade das mensagens.
- Vários anexos: máximo **10** imagens/GIFs por mensagem; o 11.º é rejeitado.
- Vários URLs na mesma mensagem: resolver até um limite razoável (ex. primeiros 5); resto fica só como link.
- GIF animado: deve animar quando o cliente o permitir; se não, pelo menos frame estático.
- Operador da instância: **não** lê bytes de anexos em claro (cifrados no cliente); **pode** ver URLs quando um cliente pede unfurl.
- Unfurl: **lazy ao visualizar** (pedido do cliente após decifrar); falha → só o link em texto.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Membros MUST poder anexar e enviar **imagens** e **GIFs** em canais de **texto**, associados a uma mensagem do histórico, até **10** anexos por mensagem.
- **FR-002**: O produto MUST rejeitar tipos e tamanhos fora da política permitida, e MUST rejeitar mais de 10 anexos numa mensagem, com mensagem compreensível.
- **FR-003**: A mídia enviada MUST ser recuperável e decifrável por outros membros autorizados do canal/servidor e MUST NOT ser servida a quem não é membro; o blob persistido MUST permanecer cifrado em relação ao operador da instância.
- **FR-004**: Mensagens que contenham URLs MUST poder apresentar **preview/resolução** para: links de página, URLs de imagem, e links/vídeos suportados, quando a resolução for bem-sucedida.
- **FR-005**: Falha de preview MUST NOT impedir o envio nem a leitura da mensagem; o URL em texto permanece.
- **FR-006**: O composer MUST permitir escolher um ou mais anexos (imagem/GIF, até 10), pré-visualizar/remover cada um antes do envio, e enviar texto, mídia, ou ambos.
- **FR-007**: Previews e imagens no histórico MUST respeitar a largura do painel (sem overflow horizontal sistemático em desktop e telemóvel).
- **FR-008**: Anexos de imagem/GIF MUST ser cifrados no cliente antes de persistir; o armazenamento na instância MUST tratar o blob como opaco (o operador MUST NOT obter a imagem em claro só por aceder ao disco da instância).
- **FR-009**: A resolução de links (unfurl) MUST ser **lazy na visualização**: após o cliente decifrar a mensagem, pede preview ao servidor para URLs detectados. MUST NOT unfurlar no momento do envio só porque a mensagem foi aceite. O texto permanece E2EE; URLs enviadas ao serviço de unfurl tornam-se visíveis à instância nesse pedido (excepção documentada e mínima).
- **FR-010**: O produto MUST NOT fazer unfurl automático no servidor a partir do ciphertext sem o cliente revelar o URL.

### Out of Scope

- Envio de ficheiros genéricos (PDF, zip, etc.) — só imagem/GIF nesta feature.
- Stickers / biblioteca de GIFs de terceiros (Tenor/Giphy embed search) — só upload e unfurl de URLs.
- Editar/apagar mídia após envio (além do que já existir para mensagens).
- Chrome 008 (botões pílula, palco, painel membros).
- Gravação de voz / Egress.

### Key Entities

- **Mensagem de texto**: pode incluir ciphertext e **0–10** anexos de mídia; pode referenciar previews de URL.
- **Anexo de mídia**: imagem ou GIF ligado a uma mensagem; bytes cifrados no cliente; acessível só a membros que consigam decifrar + autorizar.
- **Preview de link**: cartão obtido via unfurl no servidor a pedido do cliente (URL revelado nesse pedido); domínio, título, miniatura, indicação de vídeo quando aplicável.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em teste com 5 imagens e 2 GIFs válidos, **100%** aparecem no histórico do remetente e de um segundo membro em ≤5 s após envio (rede local).
- **SC-002**: Em teste com ficheiro não permitido ou acima do limite, **100%** das tentativas mostram erro e **0** mensagens órfãs inválidas.
- **SC-003**: Em teste com 3 URLs públicos (página, imagem directa, vídeo/página com vídeo), **≥2** produzem cartão de preview útil; falhas degradam para link texto sem partir o UI.
- **SC-004**: Em viewport estreito (~375px), **0** mensagens de amostra com imagem causam scroll horizontal da página inteira.
- **SC-005**: Pedido não autenticado ou de não-membro a um anexo → **100%** negado (sem conteúdo útil da mídia).
- **SC-006**: Em revisão de privacidade: anexo no disco sem chaves de cliente → **0** decodificações bem-sucedidas da imagem em claro; unfurl só ocorre após pedido autenticado do cliente com URL explícito (lazy na visualização).
- **SC-007**: Mensagem com URL no servidor sem nenhum cliente a visualizar → **0** pedidos de unfurl gerados só pelo facto de existir ciphertext.

## Assumptions

- Privacidade (produto): anexos **cifrados no cliente**; unfurl **lazy no servidor sob pedido do cliente** após decifrar (URLs desse pedido visíveis à instância). Texto da mensagem continua E2EE.
- Unfurl **não** corre no envio; só quando um membro visualiza/decifra a mensagem.
- Tipos iniciais: JPEG, PNG, WebP, GIF; até **10** anexos por mensagem; limite de tamanho por anexo da ordem de poucos MB (valor exacto no plan — ex. 5–10 MB).
- Vídeo: preview via **link** (unfurl), não upload de ficheiro de vídeo nesta feature.
- Unfurl: até **5** URLs por mensagem na visualização (resto só link texto).
- Unfurl limitado a URLs http(s) públicos; sem garantir sites que bloqueiem scrapers.
- 008 (chrome) pode decorrer em paralelo; composer full-width da 008 beneficia esta feature mas não a bloqueia.
- Membros = mesma regra de quem já pode publicar mensagens de texto.
- Âmbito: **canais de texto** apenas.
