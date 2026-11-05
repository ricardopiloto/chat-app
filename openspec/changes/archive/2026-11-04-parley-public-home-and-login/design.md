# Design

## Context

Estado atual observado (commit `39febc2`):

- `frontend/src/index.tsx` (`Gate`) decide a tela só pela fase da sessão. Sem sessão, tudo (menos `/invite/*` e `/recover`) cai em `Auth`. No desktop sem instância guardada, `InstanceConnect` ocupa a tela inteira.
- `Auth`, `Unlock` e `InstanceConnect` usam `AuthFrame` (cabeçalho + painel de marca + tarefa) e `AuthField`. Os controles vêm de `components/ui` (`Button` em pílula, `Segmented`, `Switch`) e das classes de `ui.css`.
- Os links de e-mail apontam para `/register#email_token=…` (verificação) e `/account#recovery` (lembrete). O cadastro lê o token do fragmento em `Auth`.
- `isNative()` é verdadeiro no Electron ou, em desenvolvimento, com `?native=1`; isso permite verificar a tela do desktop num navegador.
- A janela do Electron usa decoração nativa e já abre links externos no navegador do sistema (`openOutside` em `electron/main.ts`). A spec `desktop/shell` proíbe barra de título própria.
- `ThemeSwitch` usa `rounded` e `LanguageSwitch` usa `rounded-full`; lado a lado no cabeçalho, as duas pílulas diferem.
- Os protótipos são HTML independentes (cores e raios próprios, diálogos nativos `<dialog>`, e-mail no login). A paleta deles equivale aos tokens atuais (`#181b24` ≈ `surface-container-low`, `#e07a5f` = `primary-container`, `#ffb4a1` = `primary`); o creme `#f4e6c8` não é token.
- Em andamento: `rebrand-parley` (troca de logos e nomes). Não há outra change em andamento que toque estas telas.

Premissas assumidas (sem pergunta ao autor; o revisor pode corrigi-las):

1. «Duas novas páginas» = a página pública web (`parley-home`) e a tela inicial do desktop (`parley-electron`); `conta-salva` é a variante de desbloqueio da segunda.
2. «Alterar a tela de login para respeitar a nova proposta» troca o layout de dois painéis do login e do cadastro por um cartão único, no qual a pessoa escolhe «Entrar» ou «Criar conta» (decisão do autor, 2026-11-04), com a linguagem do protótipo (mascote, marca, textos, preferências, painel da instância). O cartão obedece ao modo de registro da instância (D6). O formulário continua com handle, porque o contrato de login usa handle. O desbloqueio mantém o cartão da conta salva (D7).
3. «Não mexe nela» = não alterar o sistema de design (tokens, Tailwind, `ui.css`, `components/ui/*`).
4. O guia de hospedagem abre em `https://github.com/ricardopiloto/chat-app/blob/main/docs/deploy-producao.md`.

## Goals / Non-Goals

**Goals:**
- Página pública e tela inicial do desktop fiéis aos protótipos, dentro do sistema de design.
- Escolha da tela de entrada previsível e testável, sem quebrar links de convite, confirmação de e-mail, primeira conta e recuperação.
- Controles coesos nas telas de entrada, medidos na página renderizada.

**Non-Goals:**
- Qualquer mudança em backend, API, banco, regras de cadastro, criptografia ou sessão.
- Novos tokens, novos componentes em `components/ui`, novo roteador ou nova dependência.
- Tela de entrada para o navegador em instâncias que já têm sessão; login por e-mail; recuperação de senha por e-mail; barra de título própria; hospedagem de páginas fora da instância.

## Decisions

**D1. A escolha da tela vira uma função pura.** `src/auth/entryScreen.ts` recebe `{ native, baseUrl, phase, pathname, search, hash, initialSetup, nativeEntry }` e devolve `"home-web" | "home-desktop" | "auth" | "recover" | "invite" | "foundation" | "call-popout" | "loading" | "unlock" | "app"`. O módulo contém apenas a função e tipos, sem importar SolidJS ou `api/instance`; o sinal `nativeEntry` fica em outro módulo. `Gate` chama a função e renderiza. Convite, token de e-mail, `/__foundation` e `#/call-popout/…` mantêm as precedências existentes; pop-out só vale com sessão `locked` ou `ready`. `native && !baseUrl` escolhe a tela inicial antes da fase `loading`; no desktop a escolha ignora `pathname`, inclusive `/index.html`. O módulo e o que ele importa usam só sintaxe apagável e importações relativas com extensão `.ts`, para rodar em Node com `--experimental-strip-types`. A página pública NUNCA é escolhida quando `native` é verdadeiro. Precedência (a primeira linha que casa vence):

| # | Condição | Destino |
|---|---|---|
| 1 | `pathname === "/__foundation"` | `foundation` |
| 2 | `native && !baseUrl` | `home-desktop` (mesmo em `loading`, ignorando `pathname`) |
| 3 | `phase === "loading"` | `loading` |
| 4 | `/invite/*` sem `signin` e fase `anonymous` ou `ready` | `invite` |
| 5 | fase `anonymous` e `/recover` | `recover` |
| 6 | fase `anonymous` e (`/?invite=`, `/register`, `?signin`, `#email_token=`, `/login`) | `auth` |
| 7 | fase `anonymous`, `native` e `nativeEntry === "home"` | `home-desktop` |
| 8 | fase `anonymous`, `native` (`nativeEntry` `login`/`register`) | `auth` |
| 9 | fase `anonymous`, web, `pathname === "/"` e `initial_setup !== true` | `home-web` |
| 10 | fase `anonymous`, web, demais casos (inclui `/` com `initial_setup: true`) | `auth` |
| 11 | fase `locked`/`ready` e pop-out | `call-popout` |
| 12 | fase `locked` | `unlock` |
| 13 | fase `ready` | `app` |

Motivo: as regras de `entry-screens` têm ordem e exceções; como função pura, o `verify:entry-screens` as testa sem navegador, no padrão `node --experimental-strip-types` dos demais `verify:*`. Alternativa descartada: espalhar `Match` novos no `Gate`; as regras ficariam implícitas e sem teste.

**D2. Web: a rota `/` é a página pública; o resto segue como hoje.** A página pública só aparece quando `pathname === "/"`, sem `invite`, `signin` nem fragmento `#email_token=`. «Entrar» navega para `/login` (caminho explícito que cai em `Auth` em modo de entrada; `Auth` não lê o `pathname`, apenas o ramo `anonymous → Auth` do `Gate` o recebe). Depois de entrar com sucesso em `/login`, a navegação leva a `/` com `replace`, para que o `AppShell` não abra sob um caminho de entrada. «Voltar ao início» só aparece no navegador quando a instância não está em configuração inicial (`variant !== "setup"`), para não gerar o laço visual `/` → cadastro inicial → `/`. Os links de e-mail (`/register#…`) e de convite não mudam. Alternativa descartada: página pública em rota própria (`/inicio`) e `/` continuar sendo o login; deixaria quem digita o endereço da instância sem a apresentação.

A ação explícita «Trocar de conta», no desbloqueio e no menu da conta, encerra a sessão e navega para `/login` na web; no desktop reinicia `nativeEntry` em `"home"` e abre a tela inicial. «Sair da conta» mantém a navegação anônima já especificada, inclusive a página pública em `/` na web.

**D3. Primeira conta tem precedência quando o estado confirma uma instância nova.** Em `/`, a página pública aparece imediatamente e `instance.status()` é consultado em segundo plano, com tempo limite de 3 segundos. Somente `initial_setup: true` substitui a página pelo cadastro da primeira conta. Com `initial_setup: false`, a página permanece até a pessoa escolher «Entrar». Falha, `429` ou tempo limite são tratados como instância configurada. O resultado da consulta é compartilhado com `Auth`, evitando uma segunda chamada na mesma visita. O dono do resultado é um módulo pequeno novo (`src/auth/instanceStatus.ts`, sem importar SolidJS), que guarda a promessa em andamento e o resultado da visita; resultado ilegível, `429` ou expirado (mais de 60 s) NÃO é reaproveitado, e `Auth` refaz a consulta nesse caso. A consulta sai do `onMount` de `Auth` e passa a usar esse módulo; a guarda `isNative() && !baseUrl` permanece em `Auth`. O tempo limite usa `AbortSignal.timeout(3000)` passado à requisição (não `Promise.race`), e a razão da falha vai para `console.debug` (suporte). O risco residual (429 no primeiro acesso do administrador de uma instância nova atrás do Nginx sem `TRUSTED_PROXY=true`) é aceito; a recomendação operacional continua sendo `TRUSTED_PROXY=true` (`docs/deploy-producao.md`), e isentar a leitura de `initial_setup` do limite seria mudança de backend, fora desta change. Motivo: o endpoint público tem limite de 60 pedidos por minuto por IP e, atrás do Nginx sem `TRUSTED_PROXY=true`, visitantes compartilham o mesmo IP percebido pelo backend. O comportamento não depende da consulta para mostrar a página pública. O tempo limite é testado de modo coerente com `verify:http-timeout`.

**D4. Desktop: sinal de entrada em módulo, não rota.** O desktop carrega `mesa://app/index.html` (sem URL por tela). Um sinal separado da função pura (`nativeEntry: "home" | "login" | "register"`) começa em `"home"` e muda quando a pessoa ativa «Entrar» ou «Criar uma conta». `Auth` recebe o modo inicial desse sinal e mostra «Voltar ao início», que o devolve a `"home"`. Recarregar a janela, terminar a sessão ou trocar de conta ou instância reinicia o sinal em `"home"`; com instância guardada ainda em `initial_setup`, a tela inicial aparece primeiro, e «Criar uma conta» leva ao cadastro inicial. Motivo: o `Auth` já tem a máquina de estados do cadastro; só o ponto de entrada muda. Alternativa descartada: rotas de hash no desktop; adicionaria superfície para links externos e para o `will-navigate` do shell.

**D5. A instância do desktop passa a ser um diálogo.** `InstanceConnect` deixa de ser tela cheia: a lógica (`checkInstance`, `saveInstanceUrl`, tradução dos erros) é reaproveitada num diálogo (`Dialog` de `components/ui/Overlay`) aberto pela tela inicial. «Trocar de instância» (em `Auth`, `Unlock`, menu da conta) continua chamando `clearInstance()`; como o `Gate` volta à tela inicial sem instância, o diálogo abre sozinho. Motivo: manter um único código de validação e o contrato `GET /health`.

**D6. Login e cadastro em cartão único, guiado pelo modo de registro.** `Auth` (e `Recover`, `EmailRequest`) passam a um cartão único e centralizado: cabeçalho com marca, mascote, alternadores de tema e idioma e, no desktop, o painel da instância com «Alterar»; dentro do cartão, o controle segmentado `Segmented` existente alterna «Entrar» e «Criar conta». O layout é uma variante de apresentação em `AuthFrame` (o desbloqueio e o diálogo da instância continuam a usá-lo como hoje), não um componente novo que reescreva as telas de uma vez. Lógica, ordem das etapas, mensagens e a máquina de estados de `Auth` não mudam. O que o cartão mostra em «Criar conta» é decidido, como hoje, pelo estado já lido (`registrationConfig().mode` e `variant`), sem variável nova: (i) registro `aberto` → pedido de verificação por e-mail (`EmailRequest`), com «Tenho um convite» como alternativa e o token `#email_token=` abrindo direto o formulário com o e-mail verificado; (ii) registro `fechado` → formulário com convite, sem pedir e-mail; (iii) `variant === "setup"` (primeira conta) → sem segmentado nem convite, com a introdução da instância e a chave de recuperação; (iv) convite pré-preenchido (`?invite=`) → formulário com convite. A configuração é lida de `registrationConfig()`; enquanto ela não chega ou se falha, o cartão se comporta como hoje (sem oferecer e-mail). «Voltar ao início» é um `Button` do sistema (`variant="secondary"` — o sistema só tem `primary`, `secondary`, `danger` e `icon`, e não se cria variante nova —, com o ícone `arrow_back` e o mesmo `entry-control`), colocado no cabeçalho do cartão, alinhado à marca e acima do segmentado, nunca um `<button>` com classes soltas nem texto sublinhado fora dos componentes; o mesmo vale para «Trocar de instância» nas telas de entrada. O controle segmentado «Entrar»/«Criar conta» permanece visível em TODOS os estados do cartão, inclusive quando «Criar conta» mostra o pedido de verificação por e-mail (`EmailRequest`, registro aberto) e quando o token do link abre o formulário com e-mail verificado; só some na primeira conta (`variant === "setup"`). Escolher «Entrar» nele volta ao login sem perder o estado do cadastro por e-mail em andamento além do que o `Auth` já mantém. O botão «Já tenho conta · Entrar» de `EmailRequest` continua existindo (requisito de `auth/email-registration`). O que o painel de marca de duas colunas mostrava (recursos e texto longo) migra para a página pública (web) e para a tela inicial do desktop. Alternativa descartada: manter os dois painéis; o autor aceitou o cartão único. A versão anterior de coluna única (`AuthPage`) foi revertida porque reescrevia as telas de uma vez; aqui o risco é contido por manter `Auth` e só trocar a apresentação, e pela tarefa 3.1 verificar cada modo de registro.

**D7. Desbloqueio: «conta salva» sem esconder a recuperação.** O protótipo troca «Recuperar identidade» por «Não consigo desbloquear», que abre uma ajuda. A spec `auth` exige que a recuperação esteja sempre visível, com o aviso exato das consequências. Decisão: o cartão da conta, o painel da instância e o campo com «Mostrar» seguem o protótipo; a ação de recuperar identidade continua visível na tela e «Não consigo desbloquear» vira o texto de ajuda que explica a diferença entre a senha do cofre e a senha da conta e aponta para ela. O desvio entra no relatório de fidelidade.

**D8. Coesão por altura única, sem tocar na base.** As telas de entrada usam uma classe local `entry-control` (altura mínima de 3,125 rem = 50 px, a altura natural da caixa de texto e dos botões grandes; medida em 1.6) aplicada por composição: nos `Button` (via `class`), no wrapper de `AuthField` e nos diálogos. A classe fica num CSS próprio das telas de entrada (`entry.css`), importado em `index.tsx`, sem `@apply` de utilitários novos na base. `ThemeSwitch` e `LanguageSwitch` (componentes de `shell/`, fora da lista protegida) passam a `rounded-full` e ao mesmo preenchimento. O botão de revelar senha usa o alternador `aria-pressed` já existente, no raio e na cor dos demais. Alternativa descartada: mudar o `ui-button` para a altura de 48 px; alteraria todo o app e a lista protegida. `entry.css` é uma segunda fonte de altura, aceita por causa da proibição de tocar na base; se `components/ui` ganhar uma escala de altura, `entry-control` deve ser removido. `ThemeSwitch` e `LanguageSwitch` também aparecem fora das telas de entrada (menu da conta, `AppShell`); a igualação vale lá e entra no relatório de fidelidade. Antes de mudar o wrapper de `AuthField`, confirmar com `grep` que só as telas de entrada o usam.

**D9. Ativos.** O mascote usado nas telas é a versão com fundo transparente fornecida pelo autor (`docs/v2/parley_logo/mascote/parley-mascote-acenando-transparente.png`), recortada à área visível, reduzida a 640 px de altura e convertida para WebP com canal alfa (`src/assets/parley-mascot.webp`, abaixo de 60 KB); as versões com fundo opaco (inclusive a extraída do protótipo) NÃO são usadas, para funcionar nos dois temas sem moldura escura. O SVG de 567 bytes do protótipo é um emblema e NÃO substitui `Logo`/`emblem.png` (a change `rebrand-parley` cuida deles). O hero exibe um print real do aplicativo em uso (decisão do autor, 2026-11-04), no lugar da ilustração em HTML/CSS: a imagem ocupa a coluna da ilustração, em WebP (abaixo de 150 KB; PNG só se o WebP não ficar menor), em `src/assets/`, com `alt` descritivo, `width`/`height` explícitos (sem salto de layout) e `loading="eager"` por estar acima da dobra. O print é capturado numa instância descartável (banco e portas próprios) com dados de demonstração, nunca de uma instância real, e mostra o tema escuro; se houver variante clara, o tema escolhe a imagem. A moldura (borda e raio) usa só tokens. A página não deixa de funcionar se a imagem falhar (o `alt` e o fundo da moldura permanecem).

**D10. Texto.** Todo texto novo entra nos catálogos pt-BR e en (o protótipo só traz pt-BR; a tradução para en é parte da implementação). As afirmações de privacidade são conferidas contra `docs/e2ee-gaps.md` antes de fechar a change.

**D11. Verificação.** (a) `verify:entry-screens`: tabela de casos de D1, paridade de chaves pt/en das telas novas, ausência de cores literais nos arquivos novos, nenhuma importação nova em `components/ui`; (b) comando de diferença que mostra que os arquivos protegidos não mudaram; (c) medição de alturas na página renderizada (botão × caixa) em 390, 768 e 1280 px, tema claro e escuro; (d) os `verify:*` existentes; (e) percurso manual: convite, cadastro com e-mail (modo aberto), cadastro com convite (modo fechado), primeira conta, login, recuperação, desbloqueio e troca de instância, no navegador e no desktop (`?native=1` quando o Electron não puder abrir).

**D12. Carregamento e indexação.** `WebPublicHome` e `ElectronHome` são carregadas sob demanda com `lazy` e `Suspense`; durante o carregamento do módulo, usa-se o estado «carregando» existente. A página pública define `noindex` apenas enquanto a rota `/` é exibida, removendo a diretiva ao sair para que `/login`, `/register` e demais rotas não a herdem. A diretiva por meta inserida em JavaScript é de melhor esforço (rastreadores que não executam JavaScript veem o `index.html` sem ela); quem precisar de garantia forte usa `X-Robots-Tag` no Nginx, fora desta change. `lazy`/`Suspense` é novo no projeto: o Vite gera os chunks e o protocolo `mesa://app` do Electron deve servi-los; isso é verificado na tarefa 5.3. O desktop nunca carrega o chunk da página pública.

**D13. Cadastro com e-mail preservado nas duas plataformas.** O pedido de verificação por e-mail, o token (`#email_token=`), o formulário com e-mail verificado, o cadastro com convite e a primeira conta continuam dentro de `Auth`, que é a mesma tela no navegador e no aplicativo. Esta change não cria um segundo cadastro. No aplicativo, «Criar uma conta» abre `Auth` em modo `register`, com o mesmo comportamento que a spec `auth/email-registration` define para o modo da instância (registro aberto: e-mail; fechado: convite). O comportamento do link recebido por e-mail no aplicativo (abre no navegador do sistema, como hoje) não muda e é conferido no percurso manual (tarefas 3.4 e 7.2). O Nginx existente já serve `/login` via `try_files $uri /index.html`, sem mudança de infraestrutura. O guia de hospedagem usa a URL definida na premissa 4.

## Risks / Trade-offs

- [Visitante que já tem conta abre `/` e vê a página pública em vez do login] → «Entrar» fica no cabeçalho, nas perguntas frequentes e no rodapé; sessões existentes continuam abrindo a aplicação direto.
- [Primeira conta bloqueada pela página pública] → D3: a página aparece imediatamente, mas `initial_setup: true` a substitui pelo cadastro; falha, `429` e tempo limite deixam a página pública disponível e «Entrar» continua acessível.
- [Token de e-mail perdido ao passar pela página pública] → a regra de D2 exclui `#email_token=`; teste cobre o fragmento; o token continua sendo lido e removido do histórico só em `Auth`.
- [Alturas divergentes por causa de `AuthField` (borda no wrapper) e `Button`] → `entry-control` no wrapper e no botão, e medição obrigatória na verificação.
- [Texto de privacidade prometer mais do que o produto entrega] → conferência contra `docs/e2ee-gaps.md` e requisito explícito na spec da página.
- [Duas mudanças grandes (páginas e `AuthFrame`) no mesmo arquivo `index.tsx`/`Auth.tsx`] → tarefas em grupos pequenos e verificáveis, `Auth` alterado só em apresentação (cartão único) e no ponto de entrada; cada modo de registro (aberto, fechado, primeira conta, convite) é verificado na tarefa 3.1.
- [Electron instável em ambientes sem GPU] → a verificação principal roda no navegador com `?native=1`; o Electron real é uma verificação adicional, registrada como pendente se não abrir.
- [Limite de `instance/status` por instância atrás do proxy] → D3: página imediata, `429` = configurada, um pedido por visita; recomendação operacional `TRUSTED_PROXY=true`.
- [Colisão com `rebrand-parley` em `AuthFrame` e catálogos] → aplicar depois do grupo 5 daquela change ou resolver o conflito mantendo os textos «Parley».

## Migration Plan

Mudança só de frontend, sem dados nem contratos. Publicação: build do frontend (`dist`) e, para o desktop, uma nova versão do aplicativo. Reversão: restaurar o `dist` anterior e a versão anterior do aplicativo; nada a migrar. Links existentes (convite, e-mail, recuperação) continuam válidos em ambas as versões.

## Open Questions

- Nenhuma. O guia de hospedagem usa a URL do Markdown no GitHub indicada na premissa 4.
