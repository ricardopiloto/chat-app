# Resultado da implementação

- `frontend/electron/main.ts`: janela principal com `titleBarStyle: hidden` e overlay de 32 px no Windows, semáforos reposicionados no macOS e `frame: false` no Linux. Registo dos controlos e eventos da janela principal, incluindo quando é recriada por `activate`. `pickScreenSource` e o popout continuam sem `frame`/`titleBarStyle`.
- `frontend/electron/preload.ts`: expõe `mesaPlatform` de `process.platform` e métodos de controlo/assinatura no objecto `mesaNative`. A referência de runtime a `preload.cjs` em `main.ts` permanece como artefacto compilado.
- `frontend/src/env.d.ts`: tipos da ponte e da plataforma.
- `frontend/src/shell/TitleBar.tsx`: faixa de 32 px com arraste; três botões próprios apenas no Linux; escuta alterações de maximização e remove o listener ao desmontar.
- `frontend/src/index.tsx`: envolve o ecrã do `Gate` na barra somente em modo nativo e fora de `call-popout`; import dinâmico cria um chunk separado, que o caminho web não carrega em execução.
- `openspec/changes/electron-custom-title-bar/tasks.md`: 1.1–1.4 e 2.1–2.4 marcadas; secções 3 e 4 continuam pendentes.

Canais IPC finais: `mesa:minimize`, `mesa:toggle-maximize`, `mesa:close` (`invoke`/`handle`) e `mesa:window-maximized` (evento booleano). A plataforma é um valor síncrono no preload, sem canal IPC.

Verificações: `npx tsc --noEmit` passou; `npx eslint src` terminou com 0 erros e 1 aviso preexistente em `src/voice/callSession.tsx:47`; `npm run verify:entry-screens` passou (18 casos e guard dos ficheiros protegidos); `npm run build` passou. O build web emite um chunk `TitleBar-*.js` separado, referenciado por import dinâmico no bundle principal, mas o ramo `isNative() === false` não o carrega nem o renderiza. `npx tsc -p electron/tsconfig.json` e `npx tsc -p electron/tsconfig.preload.json` passaram; foi usada esta alternativa a abrir a janela Electron, pois a verificação visual ficou reservada à secção 3. `openspec validate electron-custom-title-bar --strict` passou.

Desvios: a detecção de plataforma usa `process.platform` exposto pelo preload, conforme a correcção da revisão. O artefacto web continua a conter o chunk separado, pois o mesmo build serve também o Electron; não há exclusão física desse ficheiro no build web. A verificação manual nas três plataformas permanece pendente.
