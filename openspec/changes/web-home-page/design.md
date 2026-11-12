# Design

## Context

Motivação e escopo em `proposal.md`; requisitos em `specs/frontend-v2/marketing-home` e `specs/frontend-v2/web-public-home`.

Estado atual relevante:

- `frontend/src/index.tsx` escolhe a tela por `entryScreen(...)` (função pura, coberta por `verify:entry-screens`). Para visitante web sem sessão em `/` o resultado é `"home-web"`, que renderiza `WebPublicHome` (lazy). O `<meta robots noindex>` é inserido por essa página ao montar.
- O frontend é um único bundle estático (`vite build`, entrada `index.html`) servido igual por todas as instâncias: hoje pelo Nginx na produção, e pelo `STATIC_DIR` do backend na change `parley-server-standalone`.
- O `index.html` tem `<title>Parley</title>`, sem descrição, Open Graph nem canonical. Tokens, fontes (Plus Jakarta Sans, Inter, JetBrains Mono), mascote, logo, `components/ui` e alternadores de tema e idioma já existem.
- Os instaladores têm nome com versão; a release oficial é `github.com/ricardopiloto/chat-app/releases`.

## Goals / Non-Goals

**Goals:**
- Home de marketing indexável e com boas pré-visualizações de link, no design system atual.
- Nenhuma mudança de comportamento para outras instâncias e nenhuma mudança em backend, banco ou API.
- Seleção sem piscar: a página certa já é a primeira a ser renderizada.

**Non-Goals:**
- Renderização completa no servidor/pré-render do corpo, analytics, CMS, blog, conteúdo dinâmico (versão, contagens).

## Decisions

### D1. O documento HTML entregue em `/` é o interruptor
Segundo HTML de entrada, `frontend/home.html`, idêntico ao `index.html` salvo: metadados de SEO e `<html data-home="marketing">`. O servidor da instância oficial entrega `home.html` na rota exata `/`; todos os outros caminhos continuam entregando `index.html`. O cliente lê `document.documentElement.dataset.home` uma vez, no carregamento.
*Alternativas descartadas:* (a) campo `public_home` em `/api/instance/status`: exige mudança no backend, uma chamada antes de decidir e provoca troca visível de página (a consulta é feita em segundo plano hoje); (b) variável de build `VITE_HOME`: obrigaria um build separado para a instância oficial, e o artefato de release deixaria de ser igual para todos.

### D2. A função `entryScreen` não muda
O destino continua sendo `"home-web"`. Em `index.tsx`, a `Match` desse destino escolhe o componente: `MarketingHome` se `data-home="marketing"`, senão `WebPublicHome`. Assim `verify:entry-screens` e os caminhos especiais (`/invite/…`, `/login`, `/register`, `/recover`, `?invite=`) permanecem como estão. A escolha é feita por uma função pequena (`homeMode()`), testada em `verify:marketing-home`.

### D3. Build multi-página com bundle compartilhado
`vite.config.ts` ganha `build.rollupOptions.input = { main: "index.html", home: "home.html" }`. Os dois HTMLs referenciam `/src/index.tsx`, então o Vite gera um único conjunto de chunks reaproveitado pelos dois. `MarketingHome` é carregado com `lazy`, para não pesar no `index.html` das outras instâncias.
*Ressalva (revisão 2026-11-12):* o `lazy` evita o JSX/CSS de `MarketingHome` no bundle das outras instâncias, mas não o texto — `frontend/src/i18n/index.ts` importa todos os catálogos de forma estática e eager, então o conteúdo de `marketing.*` (ver D10) entra no bundle de toda instância independente da rota renderizada. Aceito como trade-off dado o volume pequeno de texto frente ao bundle total; revisitar se `i18n` passar a ter carregamento por rota.

### D4. SEO sem renderização no servidor
O `home.html` contém no `<head>`, escritos à mão e revisados: `<title>`, `description`, `link rel=canonical`, `link rel=alternate hreflang` (`pt-BR`, `en`, `x-default`), `og:*` (incluindo `og:image` com dimensões e `og:image:alt`), `twitter:card=summary_large_image` e `application/ld+json` (`SoftwareApplication`, `AGPL-3.0`, categoria, sistemas operacionais). Não há `noindex`. O corpo continua sendo renderizado no cliente; o Google executa JavaScript e os serviços de pré-visualização leem só o `<head>`. Um `<noscript>` com título e frase de apresentação cobre quem não executa JavaScript.
*Alternativa descartada:* pré-renderizar o corpo no build (SSR/SSG com Solid). Aumenta a complexidade do build e do hot reload sem necessidade para o tamanho do site; fica como evolução se a indexação mostrar problema.

### D5. Imagem de pré-visualização e capturas
`og:image` em PNG 1200×630 em `frontend/public/` (`og-home.png`), gerada a partir de uma captura com dados de demonstração. As capturas da seção «Por dentro» em WebP em `frontend/src/assets/home/` (escuro e claro), com largura e altura declaradas e `loading="lazy"` abaixo da dobra. Nenhuma captura vem de uma instância real; as capturas são geradas pelo mesmo procedimento da `app-preview.webp` atual (dados de demonstração).

### D6. Download sem API do GitHub
Detecção de sistema por `navigator.userAgentData?.platform` com retorno a `navigator.platform`/`userAgent`, só para destacar um cartão. Todos os botões levam a `https://github.com/ricardopiloto/chat-app/releases/latest` (nova aba, `noopener noreferrer`). Sem chamada de rede para obter a versão. Aviso de instaladores não assinados, texto vindo de `docs/desktop-release.md`. O endereço da release fica definido num único lugar, junto com `HOST_GUIDE`.
*Ressalva (revisão 2026-11-12):* hoje `HOST_GUIDE` e `DOWNLOAD_URL` são constantes locais dentro de `WebPublicHome.tsx`, não um módulo compartilhado. Esta change extrai as duas, mais o domínio canônico (D8), para um módulo único (por exemplo `frontend/src/shell/links.ts`), importado tanto por `WebPublicHome` quanto por `MarketingHome`, para as duas páginas nunca divergirem numa troca futura de URL.
*Alternativa descartada:* consultar a API para o link direto. Vai contra o fim do limite de 60/h que motivou `desktop-self-update` e acrescentaria uma dependência de rede na home.

### D7. Estilos e componentes
Reaproveitar `components/ui` (`Button`, `Badge`, `Logo`), `LanguageSwitch`, `ThemeSwitch`, tokens e utilitários Tailwind já usados por `WebPublicHome`. Novo arquivo `marketing.css` apenas para o que não existe (grade de capturas, seção de download, cartões de recurso), usando só variáveis de `tokens.css`. `verify:tokens` e `verify:brand` passam a cobrir os novos arquivos.

### D8. `sitemap.xml` e `robots.txt` selecionados pelo servidor
O build gera `sitemap.marketing.xml` e `robots.marketing.txt`; o servidor da instância oficial os entrega em `/sitemap.xml` e `/robots.txt` (como faz com `home.html`). As outras instâncias não os expõem. O domínio canônico vem de uma constante única no build (`https://parley.1nodado.com.br`).
*Confirmação (revisão 2026-11-12):* `parley.1nodado.com.br` é de fato o domínio real da instância oficial (confirmado com o usuário), igual ao que `README.md` já afirma. `docs/deploy-producao.md` está desatualizado — ainda inteiramente escrito em torno de `chat.1nodado.com.br` (título, diagrama, `server_name`, certbot, `LIVEKIT_WS_URL`, instruções de DNS) — e deve ser corrigido para `parley.1nodado.com.br` como parte da tarefa 5.1, antes de considerar esse documento como fonte de verdade para o bloco Nginx desta change.

### D9. Operação na instância oficial
Nginx: `location = / { try_files /home.html =404; }` mais `location = /robots.txt` e `location = /sitemap.xml` apontando para os arquivos de marketing, sem tocar nas demais rotas (que caem no `index.html` como hoje). Rollback: remover o bloco. Na change `parley-server-standalone`, o equivalente é `PUBLIC_HOME=marketing` no `STATIC_DIR`; esta change não depende dela.
*Ressalva (revisão 2026-11-12):* `PUBLIC_HOME` ainda não existe em nenhum artefato de `openspec/changes/parley-server-standalone` (que hoje só define `SERVE_FRONTEND`/`STATIC_DIR`, sem noção de modo marketing). Tratar como nome proposto a confirmar quando aquela change for revisada, não como algo já definido — ver tarefa 5.2.

### D10. Conteúdo e i18n
Textos novos sob o namespace `marketing.*`, em catálogos dedicados `marketing.pt-BR.ts`/`marketing.en.ts` (não nos catálogos centrais `pt-BR.ts`/`en.ts`), seguindo a mesma convenção já usada para áreas de conteúdo grandes (`mgmt.*`, `voice.*`). Conferidos por `verify:i18n-keys`. Os metadados do `home.html` têm versão em pt-BR (padrão) e en; o cliente atualiza `document.title` e `lang` conforme o idioma escolhido. A seção «Dois jeitos de começar» usa só as opções existentes hoje; é revisada quando `desktop-local-host` e `parley-server-standalone` forem entregues.
*Ressalva (revisão 2026-11-12):* a home de marketing tem 9 seções com bastante texto, volume comparável a `mgmt.*`/`voice.*`, não ao namespace `public.*` atual (~40 chaves); daí a preferência por catálogo dedicado em vez de inflar `pt-BR.ts`/`en.ts`. Essa escolha exige editar manualmente `frontend/src/i18n/index.ts` (import e `merge()` dos dois novos catálogos) e `scripts/verify-i18n-keys.mjs` (mesma lista fixa de catálogos, replicada num arquivo de entrada temporário) — ver tarefa 2.1.

## Risks / Trade-offs

- [Metadados estáticos só em pt-BR no primeiro HTML] → `hreflang` e URL canônica aponta para a versão padrão; a versão em inglês é escolhida no cliente. Aceitável para o público atual.
- [Corpo renderizado no cliente reduz o valor de SEO] → o `<head>` completo, o `<noscript>` e o JSON-LD cobrem o essencial; revisitar com SSG se a indexação for ruim.
- [Duas entradas HTML podem divergir] → `home.html` derivado do mesmo modelo, com teste que compara os dois (mesmo script, mesma raiz `#root`, só `head`, `data-home` e o `<noscript>` do body, exigido pela D4 só em `home.html`, diferentes).
- [A home da instância oficial depende de configuração de Nginx fora do repositório] → bloco documentado em `docs/deploy-producao.md` e passo de verificação (`curl -s / | grep data-home`).
- [Informação desatualizada na home (recursos, plataformas)] → afirmações revisadas contra specs e `docs/` na tarefa de conteúdo, e revisitadas ao entregar as changes de hospedagem.

## Migration Plan

1. Implementar atrás do `home.html`: nada muda para ninguém até o servidor entregá-lo.
2. Publicar o build; na instância oficial, adicionar o bloco do Nginx e verificar `/`, `/login`, `/invite/…` e as pré-visualizações de link.
3. Rollback: remover o bloco do Nginx; `/` volta a entregar `index.html` e a `WebPublicHome`.
