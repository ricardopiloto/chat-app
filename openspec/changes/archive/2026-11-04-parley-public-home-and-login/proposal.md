# Proposal

## Why

Hoje quem chega ao Parley cai direto num formulário de login: no navegador, um visitante sem conta não vê o que é o produto nem como hospedá-lo; no aplicativo desktop, a primeira tela é um campo de endereço sem contexto. Foram desenhados dois protótipos HTML (`propostas/parley-home` e `propostas/parley-electron`, com a variante `conta-salva`) que resolvem isso com uma página pública e uma tela inicial do desktop. A linguagem visual das telas de entrada (login, desbloqueio, instância) precisa acompanhá-los, sem tocar no sistema de design e sem quebrar o cadastro nem o login.

## What Changes

- **Nova página pública (web)**, servida em `/` para visitantes sem sessão no navegador: cabeçalho com «Entrar», hero com ilustração, princípios, recursos, privacidade, passos para hospedar, perguntas frequentes e rodapé, como no protótipo `parley-home`. «Entrar» leva ao login existente; «Hospedar» leva ao guia de instalação do projeto.
- **Nova tela inicial do desktop (Electron)**, com mascote, painel «Instância selecionada», «Entrar» e «Criar uma conta», como em `parley-electron`. O campo de endereço da instância passa a ser um diálogo aberto a partir dela, no lugar da tela cheia atual.
- **Desbloqueio como «conta salva»** (`conta-salva`): a tela de desbloqueio ganha o cartão da conta, o painel da instância e o campo de senha do cofre com «Mostrar», mantendo todas as ações que ela já oferece.
- **Tela de login e de cadastro alinhadas à proposta**: viram um cartão único em que a pessoa escolhe «Entrar» ou «Criar conta»; marca, textos e preferências de tema e idioma seguem o protótipo, e o conteúdo de «Criar conta» obedece ao modo de registro da instância (aberto: e-mail verificado; fechado: convite; primeira conta: cadastro inicial). Os formulários continuam com os mesmos campos e a mesma máquina de estados.
- **Coesão dos controles**: botões, alternadores (tema, idioma, «Mostrar senha», segmentado) e caixas de texto das telas de entrada passam a ter a mesma altura, o mesmo raio e as mesmas cores, usando só os componentes e tokens existentes. O alternador de tema e o de idioma, hoje com raios diferentes, ficam iguais.
- **Fronteira web × aplicativo**: a página pública (marketing) existe só no navegador. O aplicativo desktop NÃO tem página de marketing: a primeira tela é o login simplificado (mascote, instância, «Entrar» e «Criar uma conta»), seguido do login e do cadastro. O cadastro com e-mail verificado continua disponível nas duas plataformas, pela mesma tela `Auth`.
- **Fora de escopo e proibido**: nenhuma alteração em `tokens.css`, `tailwind.config.ts`, `ui.css` nem em `components/ui/*` (o sistema de design não é tocado); nenhuma alteração no backend, nos contratos de API nem nas regras de cadastro; o fluxo de cadastro (com e-mail verificado, com convite, primeira conta da instância) e o de login não mudam de comportamento.
- Não entram: barra de título customizada do protótipo Electron (o shell usa decoração nativa), o seletor de tema como `<select>`, o canto de 9px dos botões (o sistema usa botões em pílula) e os diálogos demonstrativos do protótipo.

## Capabilities

### New Capabilities
- `frontend-v2/entry-screens`: regras comuns às telas de entrada: qual tela aparece em cada situação (web, desktop, sessão), invariantes dos fluxos de cadastro e login, coesão visual dos controles e proibição de alterar o sistema de design.
- `frontend-v2/web-public-home`: página pública do navegador em `/`, seu conteúdo, navegação, acessibilidade e responsividade.
- `frontend-v2/electron-home`: tela inicial do desktop, seleção de instância em diálogo e a variante de conta salva.

### Modified Capabilities
- `frontend-v2/auth`: o requisito «Ecrãs de autenticação fiéis aos mockups» passa a descrever a fidelidade à nova proposta (login, cadastro e desbloqueio), com os desvios documentados.
- `frontend-v2/instance-connect`: o pedido do endereço da instância no desktop passa a ocorrer em diálogo a partir da tela inicial, e «Trocar de instância» volta a essa tela.

## Impact

- **Frontend** (`frontend/src`): novas páginas `WebPublicHome` e `ElectronHome`; `index.tsx` (`Gate`) escolhe a tela de entrada; `auth/AuthFrame.tsx`, `pages/Auth.tsx`, `pages/Unlock.tsx`, `pages/Recover.tsx` e `auth/InstanceConnect.tsx` recebem apenas mudanças de apresentação e de navegação; `shell/ThemeSwitch.tsx` e `shell/LanguageSwitch.tsx` igualam o raio; catálogos `i18n/catalogs/{pt-BR,en}.ts` ganham as chaves novas; novos ativos de mascote em `src/assets/`.
- **Electron** (`frontend/electron`): reaproveita o tratamento existente de links externos (abrem no navegador do sistema); sem mudança de janela nem de preload.
- **Scripts de verificação**: novo `verify:entry-screens`; os `verify:*` existentes (`instance-setup`, `email-registration`, `email-reset`, `i18n`, `i18n-keys`, `brand`, `instance`, `icons`) continuam passando.
- **Sem impacto** em backend, banco, contratos, dependências ou infraestrutura.
- **Coordenação**: a change em andamento `rebrand-parley` troca os arquivos de logo (`logo.png`, `emblem.png`); esta change só consome `Logo` e não os altera.
