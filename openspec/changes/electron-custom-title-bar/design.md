# Design

## Context

Ver `proposal.md` para a motivação e a reversão do requisito de `desktop/shell`. Estado actual relevante, confirmado por leitura directa do código nesta sessão:

- `frontend/src/index.tsx` tem um único ponto de comutação de ecrã, `Gate()`, que decide via `entryScreen(...)` qual componente renderizar: `foundation`, `home-desktop`, `home-web`, `loading`, `invite`, `recover`, `auth`, `call-popout`, `unlock` ou `app`. Isto corre dentro da MESMA janela Electron (excepto `call-popout`, que é uma `BrowserWindow` à parte — ver `pickScreenSource`/popout em `frontend/electron/main.ts`).
- Cada um desses ecrãs tem o seu próprio cabeçalho, sem nada em comum hoje: `AppShell`/`Topbar.tsx` (só no destino `app`, uma barra já densa — logo, nome da instância, badge E2EE, pesquisa, tema, membros, notificações, avatar, em `h-14`) e `AuthFrame.tsx` (nos destinos `auth`/`unlock`, um cabeçalho mais simples — logo, nome, alternador de idioma/tema). `home-desktop` (`ElectronHome`) e `loading` não usam nenhum dos dois.
- Conclusão desta leitura: **não existe um único "topbar" para reaproveitar** — qualquer barra de título teria de aparecer por cima de ecrãs que hoje não partilham cabeçalho nenhum. Isto descarta a ideia inicial de "fundir a área de arraste na topbar do `AppShell`": essa topbar só existe no destino `app`; nos outros destinos (incluindo o ecrã de login, que é onde a pessoa passa o primeiro momento na app) não haveria barra de título nenhuma.

## Goals / Non-Goals

**Goals:**
- Barra de título personalizada, visível em todos os destinos renderizados na janela principal (incluindo `loading`, `auth`, `unlock`, `home-desktop`, `app` — não só depois de autenticar).
- Preservar redimensionar, maximizar/restaurar e encaixe de janela (snap) em Windows/macOS/Linux apesar de deixar de ter decoração nativa.
- Zero impacto no build web: nada disto deve renderizar ou carregar fora de `isNative()`.

**Non-Goals:**
- Não mexer na janela de popout de chamada nem no diálogo de partilha de ecrã — mantêm decoração nativa (ver `proposal.md`).
- Não reduzir a altura das barras existentes (`Topbar.tsx`, cabeçalho do `AuthFrame`) nesta change, mesmo que a nova barra de título crie alguma redundância visual com elas (ex.: logo repetido). Ver "Open Questions".
- Não recriar os "semáforos" do macOS do zero — ficam nativos, só reposicionados.

## Decisions

### D1: Um componente partilhado no nível do `Gate()`, não dentro de `Topbar.tsx`/`AuthFrame.tsx`

A barra de título fica num componente novo (`frontend/src/shell/TitleBar.tsx`, nome indicativo) renderizado uma vez, a envolver o resultado do `<Switch>` dentro de `Gate()` em `frontend/src/index.tsx`, condicionado a `isNative()` e a excluir o destino `call-popout` (janela própria, fora de escopo). Fica como uma faixa fina e fixa no topo, por cima de qualquer que seja o ecrã renderizado abaixo.

Alternativa descartada: integrar a área de arraste e os botões de janela dentro da `Topbar.tsx` existente. Rejeitada porque a `Topbar.tsx` só existe no destino `app` — os destinos `auth`, `unlock`, `loading` e `home-desktop` (que incluem o primeiro ecrã que a pessoa vê ao abrir a app) ficariam sem barra de título nenhuma. Duplicar a lógica de arraste/botões em `Topbar.tsx` E em `AuthFrame.tsx` foi considerada e também descartada: duplica a ponte IPC e o estado de maximizado/restaurado em dois sítios, com risco real de um ficar dessincronizado do outro.

### D2: Abordagem por plataforma: `titleBarOverlay` no Windows, `trafficLightPosition` no macOS, faixa própria no Linux

- **Windows**: `titleBarStyle: 'hidden'` + `titleBarOverlay: { color, symbolColor, height }`. O próprio SO desenha os botões de minimizar/maximizar/fechar sobre a faixa, preservando snap/Aero nativos de graça — só a área à esquerda deles é nossa (logo/arraste).
- **macOS**: `titleBarStyle: 'hidden'` + `trafficLightPosition: { x, y }` para reposicionar os "semáforos" nativos dentro da nossa faixa, sem os redesenhar.
- **Linux**: Electron não tem um equivalente a `titleBarOverlay` aqui; a faixa (incluindo os três botões) é toda desenhada pela aplicação, com `-webkit-app-region: drag` na faixa e `-webkit-app-region: no-drag` nos botões/controlos interactivos. É a plataforma de maior risco (ver Risks) e a que tem de ser validada manualmente num ambiente real antes de considerar esta change pronta — o ambiente de desenvolvimento actual é Fedora/KDE (Wayland), que é onde essa validação deve começar.

Alternativa descartada: `frame: false` puro nas três plataformas, sem `titleBarOverlay`/`trafficLightPosition`. Rejeitada porque no Windows isso obriga a desenhar os próprios botões de minimizar/maximizar/fechar e a reimplementar a detecção de "a janela está maximizada?" para o ícone certo, sem ganhar nada sobre usar o overlay nativo — só risco extra sem benefício.

### D3: Ponte IPC para os controlos de janela

`frontend/electron/preload.cjs` passa a expor `minimize()`, `toggleMaximize()` e `close()` para a janela principal (via `ipcRenderer.invoke`), mais um evento para o estado maximizado/restaurado (a janela já emite `maximize`/`unmaximize`; o `main.ts` reencaminha para o renderer, à semelhança do padrão já usado para `mesa:update-state`). No Windows/macOS estes controlos só são precisos para o nosso lado da faixa (o resto vem do overlay/semáforos nativo); no Linux são os únicos controlos que existem.

## Risks / Trade-offs

- [Linux (X11 e, principalmente, Wayland) tem histórico de bugs de arrastar/redimensionar em janelas Electron sem decoração nativa] → mitigado por D2 isolar o Linux como a plataforma validada manualmente primeiro, e por `tasks.md` incluir essa verificação antes de considerar a change pronta nessa plataforma. Sem mitigação automática — é o maior risco real desta change.
- [`titleBarOverlay`/`trafficLightPosition` têm comportamento ligeiramente diferente consoante a versão do Electron] → mitigado por verificar a versão instalada (`package.json`, hoje `^38.1.0`) contra a documentação Electron correspondente durante a implementação, não por suposição.
- [A nova faixa fica por cima de cabeçalhos que já têm logo/marca própria (`Topbar.tsx`, `AuthFrame.tsx`), criando alguma redundância visual] → aceite nesta change (ver Non-Goals); tratar disso é trabalho de uma change futura, não desta.
- [Janela principal perde a barra de tarefas/título do SO que alguns leitores de ecrã ou gestores de janelas Linux usam para identificar a app] → risco a confirmar durante a verificação manual no Linux; sem mitigação planeada além de testar com o gestor de janelas real do utilizador.

## Migration Plan

Incremental, atrás de `isNative()` — o build web nunca executa este código. Implementar e validar Linux primeiro (plataforma de desenvolvimento), só depois Windows/macOS. Reversível: remover o wrapper em `Gate()` e os campos novos do `BrowserWindow` da janela principal repõe a decoração nativa de imediato, sem migração de dados.

## Open Questions

- Agora que existe uma barra de título própria, faz sentido uma change futura encolher ou remover elementos redundantes dos cabeçalhos existentes (`Topbar.tsx`, `AuthFrame.tsx`) para recuperar espaço vertical? Fica deliberadamente em aberto — não muda o escopo, a abordagem nem as tarefas desta change.
