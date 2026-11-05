# Spec Delta

## Purpose

Apresenta o Parley como produto, de forma indexável e compartilhável, na instância oficial, usando o mesmo design system do aplicativo e sem alterar a entrada das demais instâncias.

## ADDED Requirements

### Requirement: A home de marketing só aparece quando o servidor a entrega em `/`
O sistema SHALL mostrar a home de marketing em `/` somente quando o documento HTML entregue pelo servidor para essa rota for o de marketing (o que carrega o marcador de modo «marketing»). Quando o documento entregue for o padrão, `/` SHALL mostrar a página pública de entrada existente (`web-public-home`), como hoje. A escolha SHALL ser determinada pelo documento entregue, sem pedido adicional à API e sem alternar entre as duas páginas depois do carregamento.

#### Scenario: Instância oficial
- **WHEN** um visitante sem sessão abre `/` e o servidor entrega o documento de marketing
- **THEN** a home de marketing aparece, sem troca posterior de página

#### Scenario: Outra instância
- **WHEN** um visitante sem sessão abre `/` e o servidor entrega o documento padrão
- **THEN** a página pública de entrada aparece, com `noindex`, como antes

#### Scenario: Documento de marketing indisponível
- **WHEN** o servidor não tem o documento de marketing
- **THEN** `/` entrega o documento padrão e nada muda para a instância

#### Scenario: Caminhos especiais preservados
- **WHEN** o visitante abre `/invite/<código>`, `/login`, `/register`, `/recover` ou um link com `?invite=`
- **THEN** o fluxo correspondente de `entry-screens` abre normalmente, sem passar pela home de marketing

### Requirement: A home apresenta o produto nas seções definidas
A home de marketing SHALL conter, nesta ordem: cabeçalho (marca, navegação para as seções, alternadores de tema e idioma e o botão «Entrar»); apresentação principal com título, subtítulo, chips («Self-host», «Criptografia ponta a ponta», «Sem anúncios», «AGPL-3.0»), captura de tela do aplicativo e as ações «Baixar o app» e «Entrar na instância oficial»; seção do que o produto oferece (chat, voz e vídeo, composição de câmeras, compartilhamento de tela e popout de chamada); seção «Por dentro» com ao menos três capturas de tela; seção de privacidade; seção «Dois jeitos de começar»; seção de download; epílogo de código aberto; e rodapé. SHALL NOT incluir depoimentos, números de usuários, preços, parceiros afiliados, formulários de captura de e-mail nem rastreadores.

#### Scenario: Conteúdo completo
- **WHEN** um visitante abre a home de marketing
- **THEN** vê todas as seções na ordem definida

#### Scenario: Sem elementos proibidos
- **WHEN** a página é inspecionada
- **THEN** não há depoimentos, contagens, preços, parceiros, formulário de e-mail nem script de rastreamento

#### Scenario: Entrar na instância oficial
- **WHEN** o visitante ativa «Entrar na instância oficial» ou «Entrar»
- **THEN** o login da aplicação abre por navegação comum, sem diálogo intermediário e sem pedir credencial na própria página

### Requirement: As afirmações da página são fiéis ao produto
As afirmações sobre criptografia, servidor, dados, plataformas e recursos SHALL corresponder ao comportamento documentado e entregue: criptografia ponta a ponta, instância que não lê o conteúdo, e o aviso de que quem participa de uma conversa pode compartilhar ou gravar o que recebe. A página SHALL NOT prometer anonimato, ausência de registros, recuperação da chave por e-mail nem recursos que o produto não tenha, e SHALL NOT anunciar recursos de changes ainda não entregues (como hospedar pelo app).

#### Scenario: Revisão do texto
- **WHEN** o texto é conferido contra `docs/e2ee-gaps.md` e as specs de `crypto` e `auth`
- **THEN** nenhuma afirmação contradiz o comportamento documentado

#### Scenario: Recurso ainda não entregue
- **WHEN** a página é lida antes de uma change de hospedagem ser entregue
- **THEN** ela não menciona essa forma de hospedar

### Requirement: As capturas de tela usam dados de demonstração
Toda captura de tela da página SHALL mostrar dados de demonstração, SHALL NOT conter dados, nomes, mensagens ou endereços de uma instância real, SHALL ter texto alternativo descritivo, dimensões declaradas e carregamento adequado, e SHALL estar disponível em tema escuro e claro quando a seção «Por dentro» as exibir.

#### Scenario: Revisão das capturas
- **WHEN** as capturas são inspecionadas
- **THEN** nenhuma contém dados de uma instância real e todas têm texto alternativo

### Requirement: O download leva à release oficial e destaca o sistema do visitante
A seção de download SHALL destacar o instalador adequado ao sistema detectado do visitante (Windows, macOS ou Linux) e SHALL oferecer os demais formatos. Todas as ações de download SHALL levar à página da última release publicada do repositório oficial, abrindo em nova aba com `rel="noopener noreferrer"`. A página SHALL NOT consultar a API do GitHub nem apontar para um arquivo de instalador específico. Quando o sistema não puder ser detectado, SHALL mostrar todas as opções sem destaque. A página SHALL informar que os instaladores de Windows e macOS não são assinados.

#### Scenario: Sistema detectado
- **WHEN** o visitante usa Windows e abre a seção de download
- **THEN** a opção para Windows aparece destacada e as demais continuam disponíveis

#### Scenario: Sistema não detectado
- **WHEN** o sistema do visitante não pode ser identificado
- **THEN** todas as opções aparecem sem destaque

#### Scenario: Sem consulta externa
- **WHEN** a página é exibida
- **THEN** nenhuma requisição à API do GitHub é feita

#### Scenario: Aviso de assinatura
- **WHEN** o visitante lê a seção de download
- **THEN** encontra o aviso de que os instaladores de Windows e macOS não são assinados

### Requirement: A home é indexável e gera boas pré-visualizações de link
O documento de marketing SHALL definir título, descrição, URL canônica, alternativas de idioma, Open Graph (título, descrição, imagem com dimensões e texto alternativo), cartão de resumo para redes sociais e dados estruturados do software, todos no HTML inicial e sem depender de JavaScript. SHALL NOT conter a diretiva `noindex`. A instância oficial SHALL publicar `robots.txt` e `sitemap.xml` que incluam a home. Os metadados SHALL existir em pt-BR e en.

#### Scenario: Pré-visualização de link
- **WHEN** um serviço lê o HTML inicial de `/` da instância oficial sem executar JavaScript
- **THEN** encontra título, descrição e imagem de pré-visualização

#### Scenario: Indexação permitida
- **WHEN** o documento de marketing é inspecionado
- **THEN** não há `noindex` e há uma URL canônica

#### Scenario: Outras instâncias seguem sem indexação
- **WHEN** o documento padrão é inspecionado em outra instância
- **THEN** a diretiva `noindex` continua presente em `/`

### Requirement: A página usa o design system do aplicativo
A home SHALL usar os tokens, a tipografia, os componentes e os temas do aplicativo, SHALL NOT definir paleta, fontes ou componentes visuais próprios fora desse sistema além do necessário para suas seções, e SHALL manter a identidade da marca (logo oficial e mascote com fundo transparente).

#### Scenario: Consistência visual
- **WHEN** a home e as telas de entrada do aplicativo são comparadas
- **THEN** usam as mesmas cores, fontes, botões e alternadores de tema

#### Scenario: Marca
- **WHEN** a marca aparece na página
- **THEN** é o logo oficial, nunca um provisório, e o mascote tem fundo transparente

### Requirement: A home é acessível, responsiva e traduzida
A página SHALL ter um único título principal e hierarquia coerente, regiões de navegação rotuladas, link para saltar ao conteúdo, perguntas e interações operáveis por teclado com foco visível, textos alternativos, contraste adequado nos temas claro e escuro e movimento reduzido quando a pessoa pede `prefers-reduced-motion`. SHALL ser utilizável sem rolagem horizontal em 390, 768 e 1280 px. Todo texto visível SHALL existir em pt-BR e en pelo motor de internacionalização, e a escolha de tema e idioma SHALL ser lembrada como no restante do aplicativo.

#### Scenario: Largura de celular
- **WHEN** a página é aberta com 390 px de largura
- **THEN** não há rolagem horizontal e as capturas e o cabeçalho cabem

#### Scenario: Teclado
- **WHEN** a pessoa navega só por teclado
- **THEN** alcança menu, ações, seções interativas e rodapé na ordem visual, com foco visível

#### Scenario: Idioma e tema
- **WHEN** a pessoa troca idioma ou tema
- **THEN** todo o texto e os metadados visíveis mudam de idioma, a escolha é lembrada e o contraste continua legível

#### Scenario: Movimento reduzido
- **WHEN** a pessoa pede movimento reduzido
- **THEN** a página não executa animações além de mudanças de estado essenciais
