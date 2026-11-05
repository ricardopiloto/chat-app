# Tasks

## 1. Build e seleção do modo

- [ ] 1.1 Criar `frontend/home.html` a partir do `index.html` com `<html data-home="marketing">` e o `<head>` de SEO (D4), e configurar `build.rollupOptions.input` com as duas entradas em `vite.config.ts`; verificar que `npm run build` gera `dist/index.html` e `dist/home.html` compartilhando os mesmos chunks de JavaScript
- [ ] 1.2 Criar `homeMode()` e escolher `MarketingHome` ou `WebPublicHome` na `Match` de `"home-web"` em `index.tsx` (D2), sem alterar `entryScreen`; criar `scripts/verify-marketing-home.mjs` e `npm run verify:marketing-home` cobrindo a seleção pelo marcador, o retorno ao padrão sem marcador e que `index.html` e `home.html` só diferem em `head` e `data-home`; verificar que `npm run verify:marketing-home` e `npm run verify:entry-screens` passam
- [ ] 1.3 Garantir que os caminhos especiais (`/invite/…`, `/login`, `/register`, `/recover`, `?invite=`) abrem o fluxo correto a partir do `home.html`; verificar servindo `dist` com o `home.html` em `/` e abrindo cada caminho no navegador

## 2. Conteúdo, estilo e i18n

- [ ] 2.1 Escrever os textos `marketing.*` em `pt-BR.ts` e `en.ts` para todas as seções (hero, o que você leva, por dentro, privacidade, dois jeitos de começar, download, epílogo, rodapé), conferindo as afirmações contra `docs/e2ee-gaps.md` e as specs de `crypto`/`auth` e sem mencionar recursos não entregues; verificar `npm run verify:i18n-keys` e `npm run verify:i18n` e uma revisão do texto registrada na própria tarefa
- [ ] 2.2 Criar `MarketingHome` e os componentes de seção usando `components/ui`, `LanguageSwitch`, `ThemeSwitch`, o logo oficial e o mascote transparente, mais `marketing.css` só com variáveis de `tokens.css` (D7); verificar `npm run build`, `npm run verify:tokens` e `npm run verify:brand`, e no navegador as seções na ordem do spec nos temas claro e escuro
- [ ] 2.3 Gerar as capturas de tela com dados de demonstração (chat, chamada com composição de câmeras, tela de entrada; escuro e claro) e a imagem `og-home.png` 1200×630, com largura/altura e texto alternativo; verificar visualmente que nenhuma contém dados de uma instância real e que as imagens têm dimensões declaradas

## 3. Download, SEO e publicação

- [ ] 3.1 Implementar a seção de download (D6): detecção de sistema que apenas destaca um cartão, links para a release `latest` em nova aba com `rel="noopener noreferrer"`, aviso de instaladores não assinados, endereço definido num único lugar; verificar no navegador com user agents de Windows, macOS, Linux e desconhecido, e que nenhuma requisição ao GitHub é feita (aba Network)
- [ ] 3.2 Completar o `<head>` do `home.html` (título, descrição, canonical, hreflang, Open Graph, `twitter:card`, JSON-LD, `<noscript>`) e gerar `sitemap.marketing.xml` e `robots.marketing.txt` no build (D8); verificar com `curl` no HTML servido que os metadados estão presentes sem executar JavaScript, que não há `noindex` e que o JSON-LD é válido
- [ ] 3.3 Atualizar `document.title` e `lang` ao trocar de idioma na home; verificar trocando pt-BR/en e conferindo o título e o atributo `lang`

## 4. Acessibilidade e responsividade

- [ ] 4.1 Conferir hierarquia de títulos (um único `h1`), regiões rotuladas, link de salto, foco visível, contraste nos dois temas e `prefers-reduced-motion`; verificar com navegação só por teclado e uma auditoria de acessibilidade (por exemplo Lighthouse) sem erros críticos
- [ ] 4.2 Verificar a ausência de rolagem horizontal em 390, 768 e 1280 px nos dois temas, com capturas de tela de cada combinação anexadas ao registro da tarefa

## 5. Operação e documentação

- [ ] 5.1 Documentar em `docs/deploy-producao.md` o bloco do Nginx da instância oficial (`location = /` para `home.html`, `robots.txt`, `sitemap.xml`) e o passo de volta, e atualizar README e CHANGELOG; verificar executando os passos em um Nginx local contra um `dist` e conferindo `curl -s /` (`data-home="marketing"`), `/login` (padrão) e `/robots.txt`
- [ ] 5.2 Nota de revisão: registrar em `docs/` ou no CHANGELOG que a seção «Dois jeitos de começar» precisa ser revisada quando `desktop-local-host` e `parley-server-standalone` forem entregues; verificar que a nota existe

## 6. Validação final

- [ ] 6.1 Rodar `openspec validate web-home-page --strict`, `npm run build`, `npm run verify:marketing-home`, `npm run verify:entry-screens`, `npm run verify:i18n-keys`, `npm run verify:tokens` e `npm run verify:brand` e confirmar que passam
- [ ] 6.2 Teste de integração: servir `dist` com `home.html` em `/` e `index.html` em `/login` e `/invite/abc`; confirmar que `/` mostra a home de marketing sem piscar a página padrão, que o cadastro e o login seguem funcionando e que, servindo `index.html` em `/`, a página enxuta com `noindex` volta
- [ ] 6.3 Na instância oficial, depois de publicar: verificar `/`, o compartilhamento do link (pré-visualização com título, descrição e imagem) e o Search Console aceitando `sitemap.xml`
