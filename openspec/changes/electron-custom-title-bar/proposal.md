# Proposal

## Why

O utilizador quer uma barra de título customizada na janela principal do Electron, visualmente no estilo VSCode/Discord (área de arraste integrada com o topo da UI do app, em vez da barra de título padrão do sistema operativo), para a aplicação desktop parecer mais "uma app só" e ganhar a identidade visual própria que apps de referência deste tipo têm.

Isto reverte deliberadamente um requisito já aceite em `openspec/specs/desktop/shell/spec.md` ("A janela usa decoração nativa, sem chrome personalizado"), cujo princípio era o shell desktop ser um wrapper fino — exactamente o `frontend/dist` do build web, sem nenhum elemento visual acrescentado pelo shell. A partir desta change isso deixa de ser verdade: o chrome customizado só existe no desktop (o build web não tem, nem pode ter, uma janela do SO para desenhar por cima), então o desktop passa a divergir do web abaixo da linha do título, por decisão deliberada. Esta reversão, e não a implementação em si, é o ponto que mais precisa de confirmação antes de avançar para `design.md`.

## What Changes

- **BREAKING** (de requisito, não de API pública): a janela principal do Electron deixa de usar a decoração nativa do SO e passa a ter uma barra de título desenhada pelo próprio app, com área de arraste e controlos de minimizar/maximizar/fechar próprios.
- Abordagem técnica recomendada (a confirmar em `design.md`, com alternativas e porquês): `titleBarStyle: 'hidden'` + `titleBarOverlay` no Windows (preserva snap/Aero nativos); macOS mantém os "semáforos" nativos só reposicionados (`trafficLightPosition`); Linux (maior risco de regressão de arrastar/redimensionar em janelas Electron sem frame nativo) precisa de verificação manual real.
- Escopo limitado à janela principal (`createWindow` em `frontend/electron/main.ts`). O diálogo de partilha de ecrã (`pickScreenSource`) e a janela de popout de chamada mantêm decoração nativa — não fazem parte desta change.
- A área de arraste e os controlos de janela ficam numa faixa própria, acima de qualquer ecrã que a janela principal mostre (login, desbloqueio, tela inicial do desktop, app) — não integrados na topbar existente do `AppShell` (`frontend/src/shell/Topbar.tsx`, capacidade `frontend-v2/app-shell`), porque essa topbar só existe no ecrã já autenticado; os outros ecrãs, incluindo o primeiro que a pessoa vê, não a têm. Ver `design.md` (D1) para o porquê. `frontend-v2/app-shell` não muda nesta change.

## Capabilities

### Modified Capabilities

- `desktop/shell`: o requisito "A janela usa decoração nativa, sem chrome personalizado" deixa de se aplicar à janela principal — passa a permitir chrome desenhado pela aplicação nela, mantendo decoração nativa nas restantes janelas (picker, popout).

## Impact

- `frontend/electron/main.ts` (`createWindow`, por volta da linha 236 — hoje tem o comentário `// Native window decorations are the default; do not set frame: false.`, que deixa de ser verdade).
- Possível novo componente de UI para a barra de título customizada em `frontend/src/shell/` (área de arraste, botões de janela, comunicação via IPC/preload com o processo principal para minimizar/maximizar/fechar).
- `frontend/electron/preload.cjs` (ou equivalente) — expor os controlos de janela ao renderer, se ainda não existir uma ponte IPC para isso.
- Risco multiplataforma (Windows/macOS/Linux) tratado em detalhe no `design.md`; verificação manual real necessária, não só leitura de código.
- Sem impacto em `openspec/specs/frontend-v2/app-shell/spec.md` — a topbar do `AppShell` não é tocada (ver `design.md`, D1).
