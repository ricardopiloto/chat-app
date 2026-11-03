# Tasks

## 1. Pré-requisitos e levantamento

- [ ] 1.1 Instalar o Mesa atual (NSIS) numa máquina Windows e registrar a chave de desinstalação em `HKCU`/`HKLM` (nome da chave, `DisplayName`, `UninstallString`, argumento silencioso); registrar também os caminhos no macOS e no Linux (`install-mesa.sh`); verificação: valores anotados em `design.md`.
- [ ] 1.2 Pesquisar colisão do nome Parley (INPI, GitHub, npm, domínio, lojas) incluindo o aplicativo Parley do KDE; registrar o resultado em `design.md`; verificação: resultado anotado e decisão de seguir confirmada pelo autor.
- [ ] 1.3 Receber os arquivos do novo logo: mestre 1024 px com fundo transparente, emblema, versão legível a 16 px e versão de uma cor; verificação: arquivos numa pasta de entrada com origem/licença anotadas.

## 2. Limpeza da instalação anterior (desktop)

- [ ] 2.1 Em `frontend/electron/`, módulo de limpeza com detecção por plataforma isolada atrás de funções injetáveis (sistema de arquivos, registro, execução); testes Node para: nenhuma instalação, instalação encontrada, caminho igual ao do executável atual (ignorado), pacote Linux (só aviso); verificação: o script de verificação do módulo passa.
- [ ] 2.2 Fluxo no `main.ts`: só empacotado, depois de a janela abrir, diálogo de confirmação, remoção, marca de execução única em `userData`, erros só em log com passo manual; verificação: testes do módulo cobrem recusa, aceite, falha e segunda execução sem diálogo.
- [ ] 2.3 Garantir que a pasta de dados do Mesa não é tocada e que o modo desenvolvimento não executa a limpeza; verificação: teste que falha se o módulo referir caminho de dados.
- [ ] 2.4 Teste manual obrigatório no Windows: instalar o Mesa, depois o Parley, abrir e aceitar; confirmar que o Mesa some de Aplicativos instalados e que a pasta de dados continua. Repetir a recusa e a falha (desinstalador indisponível). Se o desinstalador silencioso não funcionar de forma confiável, decidir o plano B do NSIS (design, decisão 3). Teste manual equivalente no macOS e no Linux (AppImage); verificação: resultados anotados em `design.md`.

## 3. Variáveis de ambiente

- [ ] 3.1 Backend (`backend/src/config.rs`): ler `PARLEY_PRODUCTION`, `PARLEY_ENV`, `PARLEY_RATE_LIMIT_DISABLED` e recusar partir se `MESA_PRODUCTION`, `MESA_ENV` ou `MESA_RATE_LIMIT_DISABLED` existirem, com mensagem que cita o nome novo; testes unitários para os cenários da spec; verificação: `cargo test` passa.
- [ ] 3.2 Atualizar as mensagens de erro de produção em `config.rs` e os testes de contrato que citam as variáveis; verificação: `cargo test` passa com `PARLEY_PRODUCTION=1`.
- [ ] 3.3 Trocar `MESA_BACKEND`, `MESA_BACKEND_WS`, `MESA_DEV_PORT` em `frontend/vite.config.ts` e `MESA_ELECTRON_DEV` em `frontend/electron/main.ts` e no script `electron:dev` do `package.json`; verificação: `npm run build` passa e `npm run electron:dev` abre em modo desenvolvimento.

## 4. Nome visível e intocáveis

- [ ] 4.1 Substituir "Mesa" nos catálogos i18n (`pt-BR`, `en`, `settings.*`, `mgmt.*`, `chat.*`, `legacy/*`), em `index.html` e no `alt` de `Logo.tsx`, linha a linha (sem busca e troca global), ajustando o gênero em pt-BR; verificação: `npm run verify:i18n` e `npm run verify:i18n-keys` passam e `grep -rni mesa` nesses arquivos só devolve identificadores intocáveis.
- [ ] 4.2 Renomear o download da recovery key para `parley-recovery-key.txt`; verificação: teste ou verificação do componente confere o nome.
- [ ] 4.3 Backend: nome do canal de voz padrão em `api/servers.rs`, User-Agent `Parley-Unfurl/…` em `api/unfurl.rs` e prefixo do arquivo de gravação em `api/voice.rs`; ajustar `backend/tests/contract/servers.rs:73` e `channels.rs:67,77`; verificação: `cargo test` passa e um servidor novo tem o canal com o nome novo.
- [ ] 4.4 Fixar os intocáveis: confirmar que `frontend/scripts/contracts/reference.mjs` cobre `mesa-recovery-v1` e `mesa-invite-seed-v1` e adicionar a verificação se faltar; verificação: `npm run test:contracts` passa e falha ao alterar um dos rótulos (teste de sanidade).
- [ ] 4.5 Confirmar que `git diff` não toca chaves `mesa.*` do `localStorage`, `mesa://`, `mesa:*`, `x-mesa-media-type` nem `__MESA_NATIVE__`; verificação: revisão do diff e suíte do frontend passando.

## 5. Logo e ícones

- [ ] 5.1 Colocar `logo.png`, `emblem.png`, `favicon.png` e `apple-touch-icon.png` novos; verificação: `Logo.tsx` renderiza as duas variantes (capturas de login e topbar).
- [ ] 5.2 Gerar o conjunto de `frontend/electron/icons/` (`icon.ico`, `icon.icns`, `icon.png`, `Square*Logo.png`, `StoreLogo.png`, pastas `android/` e `ios/`) a partir do mestre com um passo documentado e reproduzível; verificação: o comando documentado regenera os arquivos sem diferenças.
- [ ] 5.3 Acrescentar a `frontend/scripts/verify-icons.mjs` a checagem dos arquivos de ícone do app (hoje valida só ícones de UI): falha se faltar arquivo ou se o mestre tiver dimensão menor que a exigida; verificação: passa, e falha ao remover um ícone de teste.
- [ ] 5.4 Verificação visual a 16 px (favicon e bandeja), em fundo claro e escuro; verificação: capturas aprovadas pelo autor.

## 6. Empacotamento, CI e instaladores

- [ ] 6.1 `electron-builder.yml` e `frontend/electron/package.json`: `appId: com.parley.desktop`, `productName`, `copyright`, `author`, descrições, permissões de câmara e microfone do macOS, `artifactName` do Windows `Parley-…`; Linux `parley-chat-app` em `packageName`, `executableName`, `desktopName` e `artifactName`; verificação: `electron-builder --dir` produz o app com o nome novo e o `appId` novo.
- [ ] 6.2 `.github/workflows/desktop-release.yml`: nomes dos artefatos e da release; verificação: execução numa tag de teste publica os artefatos `Parley-…` e `parley-chat-app-…` com `SHA256SUMS`.
- [ ] 6.3 `scripts/install-mesa.sh`: mensagens, `Name=Parley` e nomes `parley-chat-app` no atalho e ícone, remoção de `Mesa.app` no macOS; verificação: instalação num Linux de teste cria o atalho "Parley".
- [ ] 6.4 `scripts/install-mesa.ps1`: filtro do instalador por `Parley`, mensagens e User-Agent; verificação: execução contra a release de teste seleciona o `.exe` correto.

## 7. Documentação e versão

- [ ] 7.1 README: título, descrições, tabela de artefatos, instalação e atualização (incluir "reexecute o script a partir do repositório", a remoção do Mesa e a pasta de dados antiga) e a tabela de variáveis com `PARLEY_*`; verificação: leitura sem referências a "Mesa" fora dos intocáveis e das notas de migração.
- [ ] 7.2 `docs/deploy-producao.md` e `docs/operar-instancia.md`: trocar `MESA_PRODUCTION` e `MESA_ENV` por `PARLEY_*` e adotar o nome novo em instalações novas, mantendo a nota de que a instância atual conserva usuário/diretórios `mesa`; verificação: nenhum trecho cita `MESA_*` como configuração válida.
- [ ] 7.3 `docs/desktop-release.md`: reescrever a justificativa do `appId`, de `productName` e do prefixo dos pacotes Linux (agora `parley-chat-app` e `com.parley.desktop`); verificação: o documento não afirma mais que `appId` e `productName` não mudam.
- [ ] 7.4 `CHANGELOG.md` e versão 1.4.0 (`package.json`, `Cargo.toml`, `frontend/electron/package.json`); verificação: versões consistentes nos três arquivos e entrada com os itens BREAKING.

## 8. Deploy e integração final

- [ ] 8.1 Runbook de deploy na instância real: editar `/etc/mesa/mesa.env` (`MESA_PRODUCTION` para `PARLEY_PRODUCTION`) **antes** de reiniciar, publicar backend e `dist`, reiniciar; verificação: `systemctl status` ativo, log sem erro de configuração e a instância responde em `/health`.
- [ ] 8.2 Passada completa: `openspec validate rebrand-parley --strict`, `cargo test`, `npm run build`, `npm run test:contracts`, `npm run verify:*`, build empacotada em pelo menos uma plataforma; verificação: tudo passa e o teste manual 2.4 repetido na build final.
