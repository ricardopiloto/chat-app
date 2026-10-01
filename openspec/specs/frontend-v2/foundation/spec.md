# foundation Specification

## Purpose

Fornece a base técnica e visual comum (projecto, tokens de design, componentes de UI genéricos, clientes de API/WS, motor de i18n) sobre a qual as fases seguintes do frontend v2 da Mesa constroem as telas de produto, sem duplicar nem divergir decisões de fundação entre fases.

## Requirements

### Requirement: Projecto v2 isolado da v1
O sistema SHALL existir como um projecto de frontend novo e independente (`frontend-v2/`), que builda e corre sem depender de nenhum ficheiro de `frontend/` (v1), e SHALL NOT exigir qualquer alteração em `frontend/` para funcionar.

#### Scenario: Build isolado
- **WHEN** alguém executa a build de produção de `frontend-v2/`
- **THEN** a build conclui com sucesso sem ler, importar ou depender de qualquer caminho dentro de `frontend/`

#### Scenario: v1 continua intacta
- **WHEN** o projecto `frontend-v2/` é criado, alterado ou construído
- **THEN** nenhum ficheiro dentro de `frontend/` é modificado como efeito colateral

### Requirement: Tokens de design consumíveis em dois temas
O sistema SHALL expor um conjunto único de tokens de design (cor, tipografia, espaçamento, raio, elevação/sombra, breakpoints responsivos) consumível por toda a UI, com um conjunto de valores para modo escuro e um conjunto de valores para modo claro, mesmo que nenhuma tela de produto em modo claro tenha sido desenhada nos mockups de referência.

#### Scenario: Alternância de tema não requer novo código de tela
- **WHEN** o tema activo muda de escuro para claro (ou vice-versa)
- **THEN** qualquer componente construído sobre os tokens actualiza a sua aparência sem que o componente precise de lógica condicional própria de tema

#### Scenario: Paleta de origem única
- **WHEN** um token de cor é definido (ex.: cor de acção primária, cor de fundo de superfície)
- **THEN** o valor corresponde ao conjunto de tokens M3-style usado nos 29 mockups de produto em `docs/v2/mesa_*/code.html` (não ao conjunto divergente do guia de componentes), conforme registado em `docs/v2/TR-frontend-v2.md` §6.3

### Requirement: Biblioteca base de componentes sem lógica de negócio
O sistema SHALL fornecer um conjunto de componentes de UI genéricos e reutilizáveis (botão em variantes primário/secundário/perigo/ícone, campo de texto, radio, checkbox, switch, select, diálogo/modal, toast, menu de contexto, avatar, badge/chip, tooltip), cada um consumindo exclusivamente os tokens de design — nenhum componente desta camada SHALL conter lógica específica de um domínio de produto (ex.: sessão de utilizador, canal, mensagem).

#### Scenario: Componente renderiza nos dois temas
- **WHEN** qualquer componente da biblioteca base é renderizado sob o tema escuro e sob o tema claro
- **THEN** o componente apresenta uma aparência coerente com os tokens de cada tema, sem necessitar de props específicas de tema

#### Scenario: Ícones consistentes
- **WHEN** um componente da biblioteca base precisa de um ícone
- **THEN** o ícone é renderizado através do conjunto Material Symbols Outlined, nunca como emoji ou como um conjunto de SVG customizado

### Requirement: Cliente de API compatível com os contratos existentes
O sistema SHALL comunicar com o backend existente (Rust/Axum) usando exactamente os mesmos endpoints REST, formatos de pedido/resposta, formato de erro (`{ "error", "code"?, "message"? }`) e cookie de sessão (`Session`, httpOnly, `SameSite=Strict`) tal como definidos pelo backend e documentados em `README.md`, sem exigir qualquer alteração de contrato no backend. O cliente SHALL ser derivado desses contratos e SHALL NOT derivar de código do frontend v1.

#### Scenario: Pedido autenticado
- **WHEN** o cliente de API v2 faz um pedido a um endpoint que exige sessão (ex.: `GET /api/auth/me`)
- **THEN** o pedido é aceite pelo backend actual sem qualquer alteração no backend, usando o cookie de sessão definido pelo backend

#### Scenario: Erro de API reconhecido
- **WHEN** o backend responde com um erro no formato `{ "error": "...", "code"?: "...", "message"?: "..." }`
- **THEN** o cliente de API v2 interpreta esse formato correctamente, conforme o contrato de erro do backend

### Requirement: Cliente de WebSocket compatível com o protocolo de eventos existente
O sistema SHALL ligar-se ao endpoint `GET /ws` existente e reconhecer o mesmo envelope de eventos (`{ "event", "server_id"?, "payload" }`) e o mesmo conjunto de eventos (`message.new`, `voice.occupancy`, `presence.update`, `channel.e2ee_changed`, `channel.deleted`, `server.deleted`, `key_handoff.requested`, `key_handoff.completed`, entre outros já documentados) sem exigir qualquer alteração no backend.

#### Scenario: Evento reconhecido
- **WHEN** o backend emite um evento WS já existente hoje (ex.: `message.new`)
- **THEN** o cliente WS v2 reconhece o tipo de evento e disponibiliza o seu payload para consumo pelas fases de produto seguintes

### Requirement: Motor de internacionalização com suporte a pt-BR e en
O sistema SHALL fornecer um motor de i18n capaz de carregar catálogos de texto para Português (Brasil) e Inglês e de alternar entre eles em tempo de execução, com detecção de idioma do navegador como valor por omissão — mesmo que os catálogos de texto em si comecem vazios ou incompletos nesta fase (a serem populados pelas fases de produto seguintes).

#### Scenario: Alternância de idioma
- **WHEN** o idioma activo muda de pt-BR para en (ou vice-versa)
- **THEN** qualquer texto já registado no catálogo correspondente é apresentado no idioma seleccionado, sem necessitar de recarregar a página

#### Scenario: Chave de tradução em falta não quebra a aplicação
- **WHEN** um texto é solicitado para uma chave ainda não populada no catálogo de um idioma
- **THEN** o sistema apresenta um valor de recurso (fallback) em vez de falhar ou deixar a interface em branco

### Requirement: Estado de aceitação sem telas de produto
O sistema SHALL ser demonstrável através de uma execução de desenvolvimento (`npm run dev`) que apresenta uma tela de verificação mostrando os tokens de design e a biblioteca de componentes base renderizados nos dois temas, sem implementar nenhuma tela de produto (autenticação, shell de navegação, chat, voz/vídeo, definições de servidor) — essas ficam reservadas às fases seguintes.

#### Scenario: Verificação visual da fundação
- **WHEN** `frontend-v2/` é executado em modo de desenvolvimento
- **THEN** é possível navegar para uma tela que exibe cada variante de cada componente da biblioteca base, em ambos os temas, sem que nenhuma rota de produto (ex.: `/servers/:id`, `/login`) precise de existir ainda
