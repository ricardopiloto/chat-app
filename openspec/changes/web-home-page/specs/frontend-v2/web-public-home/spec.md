# Spec Delta

## MODIFIED Requirements

### Requirement: Página pública em `/` para visitantes sem sessão
No navegador, quando as regras de `entry-screens` escolhem a página pública e o servidor entregou o documento padrão (não o de marketing, ver `marketing-home`), o sistema SHALL mostrar uma página com: cabeçalho (marca, links «Seu espaço», «Privacidade», «Como começar» e o botão «Entrar»); apresentação principal com título, texto de apoio, ação principal «Hospedar meu espaço», ação secundária «Conhecer o Parley» e uma linha de resumo; captura de tela do aplicativo em uso, com dados de demonstração, no lugar da ilustração, ocupando o espaço do hero, com texto alternativo descritivo e sem dados de uma instância real; princípios do produto; três recursos (conversar, encontrar, compor); faixa de privacidade; passos para começar com o mascote; perguntas frequentes; e rodapé com acesso ao login. A página SHALL funcionar sem sessão, SHALL NOT fazer pedidos autenticados e SHALL NOT mostrar dados da instância além do que o login já mostra.
Somente nessa rota `/`, e somente com o documento padrão, a página SHALL definir `<meta name="robots" content="noindex">`; outras rotas SHALL NOT herdar essa diretiva por causa desta change. Quando o servidor entrega o documento de marketing, esta página SHALL NOT ser exibida em `/`.

#### Scenario: Conteúdo completo
- **WHEN** um visitante sem sessão abre `/` e o servidor entregou o documento padrão
- **THEN** a página mostra todas as seções listadas, na ordem do protótipo, e a captura de tela do app ocupa o hero com texto alternativo e é identificada como amostra com dados de demonstração

#### Scenario: Sem pedidos autenticados
- **WHEN** a página pública é exibida
- **THEN** nenhum pedido com credencial é enviado e nenhum dado de conta ou de servidor aparece

#### Scenario: Indexação da página pública
- **WHEN** a página pública em `/` é exibida a partir do documento padrão
- **THEN** a diretiva `noindex` está ativa apenas nessa rota

#### Scenario: Documento de marketing entregue
- **WHEN** o servidor entrega o documento de marketing em `/`
- **THEN** esta página não é exibida e a home de marketing aparece no lugar
