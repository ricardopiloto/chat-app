# Proposal

## Why

O Parley tem apenas uma página pública enxuta (`WebPublicHome`, 28 linhas, `noindex`) servida em `/` por **qualquer** instância. Ela serve como entrada de uma instância, não como apresentação do produto: não conta a história (composição de câmeras, criptografia ponta a ponta, app desktop, self-host), não aparece em buscadores e, nos links compartilhados, aparece sem título nem imagem. Queremos uma home de marketing no estilo de sites de produto como o prologue.chat, com o mesmo design system e identidade do app, **somente na instância oficial** (`parley.1nodado.com.br`), sem transformar as instâncias de outras pessoas em propaganda do Parley.

## What Changes

- **Nova home de marketing**, indexável, com as seções: hero (título, subtítulo, chips «Self-host», «E2EE», «Sem anúncios», «AGPL-3.0», captura de tela e CTAs «Baixar o app» e «Entrar na instância oficial»); o que você leva (chat, voz e vídeo, **composição de câmeras**, compartilhamento de tela, popout de chamada); «Por dentro» (capturas reais em tema escuro e claro); privacidade; «Dois jeitos de começar» (entrar na instância oficial ou hospedar); baixar (detecta o sistema e destaca o instalador certo, com link para a release); epílogo de código aberto (AGPL-3.0, GitHub, documentação, relato de problemas); rodapé. Textos em pt-BR e en.
- **Mesmo design system**: `tokens.css`, `components/ui`, Plus Jakarta Sans e Inter, mascote, temas claro e escuro, alternadores de tema e idioma, `entry-control` e o resto do kit existente. Nenhum token ou componente visual novo fora do que a página precisa (seções, grade de capturas, bloco de download).
- **Quem mostra o quê é decidido pelo HTML que o servidor entrega em `/`**, não por uma chamada de API: o build gera, além do `index.html`, um `home.html` com os metadados de SEO (título, descrição, Open Graph, `twitter:card`, JSON-LD, `hreflang`, canonical) e um marcador de modo «marketing». A instância oficial serve `home.html` em `/` (Nginx hoje; `PUBLIC_HOME=marketing` no servidor da change `parley-server-standalone` depois). Qualquer outra instância continua servindo o `index.html` e a `WebPublicHome` enxuta, que permanece `noindex`. Sem o arquivo, ou em instâncias antigas, nada muda.
- **Metadados sem renderização no servidor**: o `home.html` carrega o mesmo bundle da aplicação; o corpo é renderizado no cliente. Os metadados estáticos bastam para as pré-visualizações de link e para a indexação; a renderização completa no build fica fora de escopo.
- **A seção «Dois jeitos de começar» é escrita só com o que existe**: entrar na instância oficial, hospedar pelo guia clássico e baixar o app. As opções «hospedar pelo app» e «`init` + `run`» (changes `desktop-local-host` e `parley-server-standalone`) entram quando essas changes forem entregues, por uma edição de texto, sem mudar a estrutura.
- **`sitemap.xml` e `robots.txt`** para a instância oficial, publicados junto com o `home.html`.
- **Não entram**: blog, preços, depoimentos e contagens de usuários, parceiros de hospedagem ou afiliados, analytics e cookies de rastreamento, formulários de captura de e-mail, renderização completa no servidor, download direto de um arquivo específico (os nomes dos instaladores levam a versão) e qualquer mudança em backend, banco ou contratos de API.

## Capabilities

### New Capabilities
- `frontend-v2/marketing-home`: a home de marketing da instância oficial, seus conteúdos, a seleção pelo HTML servido em `/`, SEO e pré-visualização de links, detecção do sistema para o download, acessibilidade, responsividade e tradução.

### Modified Capabilities
- `frontend-v2/web-public-home`: a página enxuta continua sendo a entrada de qualquer instância e permanece `noindex`, mas deixa de ser a página de `/` quando o servidor entrega a home de marketing.

## Impact

- **Frontend** (`frontend/src`): nova `pages/MarketingHome.tsx` e componentes de seção; seleção do modo em `index.tsx`/`entry`; catálogos `i18n/catalogs/{pt-BR,en}.ts`; capturas e imagens em `assets/`; `entry.css` ou novo `marketing.css` com os tokens existentes.
- **Build** (`frontend/vite.config.ts`, `frontend/index.html`, novo `frontend/home.html`): segunda entrada de HTML e geração do `sitemap.xml`/`robots.txt`; sem novas dependências de runtime.
- **Operação**: configuração do Nginx da instância oficial para servir `home.html` em `/` (documentada em `docs/deploy-producao.md`); depois, `PUBLIC_HOME` no servidor standalone.
- **Documentação**: `docs/deploy-producao.md`, README, CHANGELOG.
- **Sem impacto** em backend, banco, contratos de API, nas demais instâncias nem nas telas do app.
- **Dependências**: nenhuma obrigatória; a seção «Dois jeitos de começar» é atualizada quando `desktop-local-host` e `parley-server-standalone` saírem.
