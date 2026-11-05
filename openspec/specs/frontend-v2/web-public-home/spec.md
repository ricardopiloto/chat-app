# web-public-home Specification

## Purpose

Apresenta o Parley a quem chega pelo navegador sem sessão, explica o que é e como hospedar, e encaminha quem já tem acesso ao login, separando a apresentação pública do acesso à aplicação.

## Requirements

### Requirement: Página pública em `/` para visitantes sem sessão
No navegador, quando as regras de `entry-screens` escolhem a página pública, o sistema SHALL mostrar uma página com: cabeçalho (marca, links «Seu espaço», «Privacidade», «Como começar» e o botão «Entrar»); apresentação principal com título, texto de apoio, ação principal «Hospedar meu espaço», ação secundária «Conhecer o Parley» e uma linha de resumo; captura de tela do aplicativo em uso, com dados de demonstração, no lugar da ilustração, ocupando o espaço do hero, com texto alternativo descritivo e sem dados de uma instância real; princípios do produto; três recursos (conversar, encontrar, compor); faixa de privacidade; passos para começar com o mascote; perguntas frequentes; e rodapé com acesso ao login. A página SHALL funcionar sem sessão, SHALL NOT fazer pedidos autenticados e SHALL NOT mostrar dados da instância além do que o login já mostra.
Somente nessa rota `/`, a página SHALL definir `<meta name="robots" content="noindex">`; outras rotas SHALL NOT herdar essa diretiva por causa desta change.

#### Scenario: Conteúdo completo
- **WHEN** um visitante sem sessão abre `/`
- **THEN** a página mostra todas as seções listadas, na ordem do protótipo, e a captura de tela do app ocupa o hero com texto alternativo e é identificada como amostra com dados de demonstração

#### Scenario: Sem pedidos autenticados
- **WHEN** a página pública é exibida
- **THEN** nenhum pedido com credencial é enviado e nenhum dado de conta ou de servidor aparece

#### Scenario: Indexação da página pública
- **WHEN** a página pública em `/` é exibida
- **THEN** a diretiva `noindex` está ativa apenas nessa rota

### Requirement: «Entrar» leva ao login existente
Todos os acessos de «Entrar» da página (cabeçalho, perguntas frequentes e rodapé) SHALL levar ao login da aplicação por navegação comum, sem diálogo intermediário e sem pedir credencial na própria página. O login aberto assim SHALL se comportar como o login de hoje, incluindo o retorno à página pública por um link «Voltar ao início».

#### Scenario: Entrar pelo cabeçalho
- **WHEN** o visitante ativa «Entrar» no cabeçalho
- **THEN** o login da aplicação abre em modo de entrada, e a página pública não coleta nenhum dado

#### Scenario: Voltar ao início
- **WHEN** o visitante está no login aberto pela página pública e ativa «Voltar ao início»
- **THEN** a página pública volta a ser exibida

#### Scenario: Convite recebido
- **WHEN** o visitante abre diretamente um link de convite
- **THEN** o cadastro abre como especificado em `entry-screens`, sem passar pela página pública

### Requirement: Hospedar leva ao guia do projeto
As ações «Hospedar meu espaço» e «Quero hospedar o Parley» SHALL levar a `https://github.com/ricardopiloto/chat-app/blob/main/docs/deploy-producao.md`, abrindo em nova aba com `rel="noopener noreferrer"`; a ação «Conhecer o Parley» SHALL rolar até a seção «Como começar». O endereço do guia SHALL estar definido num único lugar do código.

#### Scenario: Abrir o guia
- **WHEN** o visitante ativa a ação de hospedar
- **THEN** o guia de instalação abre em nova aba e a página pública permanece aberta

#### Scenario: Conhecer o Parley
- **WHEN** o visitante ativa «Conhecer o Parley» ou um link do menu
- **THEN** a página rola até a seção indicada e o foco do teclado vai para ela

### Requirement: Texto de privacidade fiel ao produto
As afirmações da página sobre criptografia, servidor e dados SHALL corresponder ao comportamento documentado do produto: conversas com criptografia de ponta a ponta, instância que não lê o conteúdo, e o aviso de que quem participa de uma conversa pode compartilhar ou gravar o que recebe. A página SHALL NOT prometer anonimato, ausência de registros, recuperação por e-mail da chave de identidade nem recursos que o produto não tenha.

#### Scenario: Revisão do texto
- **WHEN** o texto da página é conferido contra `docs/e2ee-gaps.md` e as specs de `crypto` e `auth`
- **THEN** nenhuma afirmação contradiz o comportamento documentado e as limitações relevantes aparecem nas perguntas frequentes

### Requirement: Página acessível, responsiva e traduzida
A página SHALL ter uma hierarquia de títulos coerente (um único título principal), regiões de navegação rotuladas, links de salto para o conteúdo, perguntas frequentes operáveis por teclado, texto alternativo no mascote e movimento reduzido quando a pessoa pede `prefers-reduced-motion`. SHALL ser utilizável sem rolagem horizontal em 390, 768 e 1280 px de largura, nos temas claro e escuro, e SHALL oferecer os alternadores de tema e idioma. Todo texto visível SHALL existir em pt-BR e en pelo motor de internacionalização.

#### Scenario: Largura de celular
- **WHEN** a página é aberta com 390 px de largura
- **THEN** não há rolagem horizontal, o cabeçalho cabe e a imagem do hero não esconde o texto

#### Scenario: Teclado
- **WHEN** a pessoa navega só com teclado
- **THEN** alcança menu, ações, perguntas frequentes e rodapé na ordem visual, com foco visível

#### Scenario: Idioma e tema
- **WHEN** a pessoa troca idioma ou tema
- **THEN** todo o texto muda de idioma, a escolha é lembrada como no restante do app e o contraste continua legível
