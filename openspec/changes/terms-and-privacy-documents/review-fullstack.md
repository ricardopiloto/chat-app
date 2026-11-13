# Review — Desenvolvedor Fullstack

**Change:** terms-and-privacy-documents
**Data:** 2026-11-13
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend

Veredito: N/A

- Confirmado no código, não só no texto da proposta: `terms_accepted` já é validado (`backend/src/api/auth/email.rs:105-106`, responde `terms_required` em `BAD_REQUEST`) e persistido como `terms_accepted_at` (`backend/src/db/account.rs:23,55-56,118,132`; `backend/src/api/auth/register.rs:229`). O delta de `auth/email-registration` está correcto ao dizer que esse comportamento "SHALL permanecer como já especificado" — não há nenhuma lacuna de backend aqui, e a proposta acerta em não pedir nenhuma mudança de API.

## 2. Desenvolvimento do frontend

Veredito: Atenção

- **Achado (routing, com correcção ao ponto levantado pelo arquiteto)**: confirmei em `docs/deploy-producao.md` (bloco de configuração do Nginx, por volta da linha 305-316) que a produção já resolve exactamente o caso que o `review-architect.md` levantou como em aberto: `location = /` serve `home.html` (match exacto só na raiz), e `location /` (catch-all) faz `try_files $uri /index.html` — ou seja, `/terms` e `/privacy` caem naturalmente no bundle principal (`index.html`/SPA) em produção, sem precisar de nenhuma regra nova de Nginx. Isto **resolve** a preocupação do arquiteto sobre `home.html` vs `index.html` serem bundles separados — não é bloqueante, já funciona pela infraestrutura existente. O que falta é só tornar isto explícito em `tasks.md`: a task 2.2 ("Ligar rotas no router/`Gate`") devia dizer que `/terms`/`/privacy` entram como destinos independentes de `phase` em `entryScreen()` (mesmo precedente de `/__foundation`, `frontend/src/auth/entryScreen.ts:14`), não um router declarativo — quem pegar a task sem saber isso vai procurar uma tabela de rotas que não existe.
- **Achado (i18n, mesmo ponto do arquiteto, do lado da implementação)**: D4 ("label inclui `<a href>`") pede um padrão que não existe neste código — confirmei que `frontend/src/i18n/messages.ts` só interpola `{placeholder}` em texto puro, sem suporte a HTML, e não há nenhum uso de `dangerouslySetInnerHTML` em lado nenhum do catálogo. Implementar D4 ao pé da letra exigiria ou inventar uma nova convenção de i18n (mais trabalho e risco do que a task 3.1 sugere com "linkar termos e privacidade (i18n)", que soa a mudança de uma linha), ou compor JSX em volta de segmentos de texto traduzidos separados — o padrão já usado no resto do projecto. Recomendo que a task 3.1 diga isso explicitamente, para não subestimar o esforço real.
- Sem problema de responsividade/mobile: as páginas são texto estático, o requisito de `legal-documents/spec.md` já pede "legíveis em desktop e mobile" e isso não exige nenhum componente novo além de CSS já existente no projecto.

## 3. Deploy e operação

Veredito: Atenção

- **Achado**: confirmei que a convenção actual de customização self-host neste projecto é **inteiramente por variável de ambiente** (`docs/operar-instancia.md`, `docs/deploy-producao.md`: `BIND`, `LIVEKIT_*`, `EMAIL_*`, `REGISTO_MODO`). O mecanismo proposto — operador edita ficheiros Markdown com `SUBSTITUIR_*` antes do build — levanta uma pergunta operacional concreta que nem `design.md` nem `tasks.md` respondem: **como** é que um operador que já segue o fluxo Docker Compose documentado edita um ficheiro fonte dentro da imagem **sem fazer rebuild** da imagem? Se a resposta for "faz fork do repo e builda a própria imagem com o Markdown substituído", isso é uma barreira de operação bem maior do que mudar uma variável de ambiente, e devia estar dito explicitamente em `docs/operar-instancia.md` (task 4.1), não implícito. Esta é uma limitação que acho que devia voltar para o Arquiteto (ver secção final) em vez de eu decidir aqui qual é o mecanismo certo.
- Fora isso, nenhuma porta, serviço ou variável de ambiente nova; nenhuma migração de banco.

## 4. Qualidade de código

Veredito: OK

- `tasks.md` segue o padrão "tarefa + como verificar" já usado noutras changes deste projecto, com grupos ordenados por dependência (conteúdo → páginas/rotas → aceite/homes → docs).
- Dado que este projecto não tem framework de teste e2e/browser (confirmado: só scripts `verify:*.mjs` em Node, nenhum deles toca rotas/DOM renderizado), as verificações manuais descritas ("navegação sem sessão mostra o documento", "cliques chegam às páginas legais") são o nível de rigor já consistente com o resto do repositório — não é uma lacuna introduzida por esta change.
- Tratamento de erro: não se aplica de forma relevante — são páginas de leitura, sem estado de rede além do carregamento do próprio bundle.

## 5. Execução das decisões arquiteturais

Veredito: Atenção

- `tasks.md` segue D1, D3 e D5 sem reabrir nada. D2 e D4, como já detalhado acima, têm lacunas de execução (mecanismo de routing não descrito correctamente, mecanismo de i18n-com-link que não existe no código) que vêm directamente de como essas duas decisões foram escritas no `design.md` — não é um problema introduzido pela implementação, é algo que o próprio desenho devia descrever com mais precisão antes de virar tasks.

## Bloqueantes antes de implementar
- nenhum

## Limitações técnicas a reportar ao Arquiteto
- O mecanismo de substituição do template self-hosted (D2/D3) precisa de uma resposta concreta para o fluxo de deploy Docker já documentado neste projecto — hoje não há como um operador trocar os placeholders sem rebuildar a imagem, e isso contradiz a praticidade do resto da configuração self-host (toda por env var). Vale decidir se os valores escalares do placeholder (nome/contacto/jurisdição) também vão por variável de ambiente antes de escrever as tasks de implementação.
