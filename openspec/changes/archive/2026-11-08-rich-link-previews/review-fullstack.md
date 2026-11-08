# Review — Desenvolvedor Fullstack

**Change:** rich-link-previews
**Data:** 2026-11-08
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend
Veredito: Atenção

- A API é implementável com o que já existe (`reqwest`, `url`, o próprio `unfurl.rs`) — confirmei a estrutura actual do ficheiro e o padrão de parsing simples (`meta_content`/`attr_after`) que D2 reaproveita.
- **Achado de implementabilidade de teste, a reportar ao Arquiteto**: `tasks.md` 1.2, 1.4 e 2.1 pedem testes com "um servidor HTTP local simulando o endpoint oEmbed"/"uma URL de teste que responde Content-Type: video/mp4". Verifiquei o `tests/contract/unfurl.rs` actual: só existem dois testes hoje — a rejeição SSRF (`169.254.169.254`, que precisa de ser bloqueado, não aceito) e um teste puro do helper `content_length_exceeds_unfurl_cap` sem rede nenhuma. **Não existe nenhum teste de "happy path" com fetch real** no projecto hoje, e há um motivo técnico concreto para isso: `validate_public_url`/`is_blocked_ip` bloqueiam explicitamente `127.0.0.1`/IPs privados — exactamente o endereço de qualquer servidor de teste local que se tentasse arrancar dentro do próprio teste. Isto afecta os três caminhos novos (oEmbed, extracção de `src`, vídeo directo) da mesma forma que já afectaria qualquer teste equivalente do caminho de HTML genérico já existente — não é uma lacuna introduzida por esta change, é uma limitação pré-existente do projecto que esta change é a primeira a tentar testar desta forma.
  - **Recomendação concreta**: dividir cada tarefa em duas partes já no `tasks.md` antes de implementar — (a) teste unitário puro, sem rede, para a parte determinística e offline-testável (1.1 tabela de provedores por host; 1.3 extracção/validação do `src` a partir de um `html` fixo em string, que já não depende de nenhum fetch); (b) para o "happy path" real contra o provedor/host de teste (1.2, 1.4, 2.1), ou aceitar que fica como verificação manual (já previsto em 6.3, que já cobre isto), ou o Arquiteto decide introduzir um mecanismo de override do host/URL base para testes (ex. variável de configuração), o que é uma decisão de arquitectura nova, não algo para eu resolver nesta revisão.
- Autorização: sem lacuna — `AuthUser` já exigido, sem mudança.
- Sem migração de banco, correcto (nenhuma tabela envolvida).

## 2. Desenvolvimento do frontend
Veredito: OK

- `LinkCards.tsx`/`LinkCard` já tem a estrutura certa para receber `kind === "embed"`/`"video"` com `media_url` sem precisar de refactor — é um `Show`/`createResource` já preparado para múltiplos `kind`.
- O clique-para-carregar (5.1) é implementável com um `createSignal` local por `LinkCard` (ex. `const [loaded, setLoaded] = createSignal(false)`), sem precisar de estado novo em `thread.ts`/`timeline.ts` — a pré-visualização já é buscada e cacheada independentemente da mensagem.
- `<video controls preload="metadata">` nativo (5.2) é suportado directamente pelo browser, sem biblioteca nova.

## 3. Deploy e operação
Veredito: OK

- Sem variável de ambiente, porta ou processo novo — só a string da CSP (3.1), já isolada e fácil de confirmar por leitura do header numa resposta.

## 4. Qualidade de código
Veredito: Atenção

- Mesma ressalva da secção 1: ajustar a redacção dos testes em 1.2/1.4/2.1 antes ou durante a implementação para não bloquear a tarefa numa infra de teste que não existe.
- D4 (fallback silencioso em qualquer falha) está correctamente coberto por tarefas que pedem explicitamente os três casos de falha (404, JSON malformado, `src` inválido) — boa cobertura de resiliência para algo que depende de serviços de terceiros fora do nosso controlo.
- Organização: continuar a estender `unfurl.rs` em vez de criar módulo novo é consistente com o tamanho actual do ficheiro (332 linhas antes desta change) — razoável não dividir ainda.

## 5. Execução das decisões arquiteturais
Veredito: OK

- `tasks.md` segue D1-D6 fielmente, sem reabrir nenhuma decisão. A única coisa que volta ao Arquiteto é o achado de teste da secção 1, que é uma limitação técnica revelada pela implementação, não uma objecção à arquitectura em si.

## Bloqueantes antes de implementar
- Nenhum.

## Limitações técnicas a reportar ao Arquiteto
- O projecto não tem hoje mecanismo para testar o caminho de fetch real do `unfurl.rs` sem rede (a validação SSRF bloqueia qualquer servidor de teste local) — afecta as tarefas 1.2, 1.4 e 2.1 tal como redigidas. Recomendo ajustar `tasks.md` para separar unit tests offline (tabela de provedores, extracção de `src`) dos "happy paths" de rede real, que ficam só como verificação manual (já prevista em 6.3), a menos que o Arquiteto prefira introduzir uma forma de override de host para testes — nesse caso é uma decisão de arquitectura nova a tomar antes de implementar, não depois.

## Addendum (2026-11-08)
O Arquiteto resolveu (`review-architect.md`): sem mecanismo de override novo; `tasks.md` 1.2/1.4/2.1 já ajustadas para testes unitários sem rede + verificação manual em 6.3. Concordo com a decisão — é a mesma forma como `content_length_exceeds_unfurl_cap` já é testado hoje. Veredito mantém-se **Aprovado**.

## Addendum (2026-11-08) — código implementado

Confirmei eu próprio, por leitura do diff e execução directa: `cargo test` (236 passaram, 0 falharam), `cargo fmt --check` (implícito, build limpo), `npx tsc --noEmit`, `npx eslint src` (0 erros, 1 aviso pré-existente não relacionado), `npm run verify:i18n-keys`, `npm run build` — todos limpos. Os três testes unitários novos (`provider_hosts`, `oembed_body_decision`, `iframe_hosts_and_rewriting`) cobrem exactamente o que `tasks.md` 1.1-1.3 (ajustadas) pediam, sem nenhuma dependência de rede.

Único achado (já corrigido numa segunda ronda pequena, igual ao padrão já usado nesta sessão para nits de formatação): indentação inconsistente no JSX novo de `LinkCards.tsx`, corrigida com `npm run format`, confirmando por diff que só mudou whitespace.

Implementação segue `tasks.md`/D1-D6 sem desvio nenhum, com uma melhoria de robustez não pedida mas bem-vinda (validação extra de `userinfo`/porta na URL do iframe, caso de teste de confusão de subdomínio). Nada a reportar ao Arquiteto nesta ronda.

Falta só a tarefa 6.3 (verificação manual com display) — fora do alcance desta revisão de código. Veredito mantém-se **Aprovado**.
