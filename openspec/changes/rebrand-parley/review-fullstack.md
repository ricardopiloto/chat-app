# Review — Desenvolvedor Fullstack (revisão final)

**Change:** rebrand-parley
**Data:** 2026-11-03
**Veredito geral:** Aprovado com ressalvas

O bloqueante da revisão anterior (rótulos criptográficos `mesa-recovery-v1` e `mesa-invite-seed-v1` sem proteção) está resolvido: `design.md` decisão 1, spec `brand-identity` e tarefa 4.4, que usa o `test:contracts` já existente (`frontend/scripts/contracts/reference.mjs`). As demais recomendações foram incorporadas (recusa de partida do backend, documentos e runbook, varredura de e-mails, ordem de implementação, plano de ícones).

## 1. Desenvolvimento do backend
Veredito: OK
- Superfície pequena e clara: `backend/src/config.rs` (hoje linhas 69, 70, 106 e as mensagens 150 e 155), `api/servers.rs:85`, `api/unfurl.rs:52`, `api/voice.rs:602`. A recusa de partida cabe em `Config` (a validação já devolve erro de string, como em `config.rs:155`).
- Variáveis novas da change `email-registration` (`EMAIL_*`, `PUBLIC_BASE_URL`, `REGISTO_MODO`, `TURNSTILE_*`) não usam o prefixo `MESA_`, então não entram na recusa nem precisam de troca.
- `backend/src/email_templates.rs` (da change em andamento) tem "Mesa" fixo em assuntos e corpos (linhas 6, 8, 19, entre outras) e `production_boot.rs:85` usa `"Mesa <noreply@example.com>"`. Estão cobertos pela varredura da tarefa 4.3; como são arquivos ainda não commitados, só dá para trocá-los depois do commit da `email-registration`.
- Testes de contrato `servers.rs:73` e `channels.rs:67,77` já estão listados na 4.3.

## 2. Desenvolvimento do frontend
Veredito: Atenção
- Catálogos i18n: `en.ts` e `pt-BR.ts` estão sendo alterados agora pela `email-registration`; trocar o nome nesses dois arquivos antes do commit dela gera conflito. Já coberto pela nota de ordem, mas a lista de arquivos em conflito deve constar nela.
- `Logo.tsx` mantém as duas variantes; o emblema do urso dentro do disco foi visto legível a 16 px. Nada mais a fazer além da tarefa 5.4.
- Módulo da limpeza (`frontend/electron/`): o `tsconfig.json` do Electron tem `"include": ["main.ts", "preload.ts"]` e `module: Node16`, com `electron/package.json` do tipo ESM. Um arquivo novo precisa entrar nesse `include` e ser importado com extensão `.js` a partir do `main.ts`. Isto não está nas tarefas. Incluir na 2.1.

## 3. Deploy e operação
Veredito: Atenção
- Runbook da instância (tarefa 8.1): além de `MESA_PRODUCTION` para `PARLEY_PRODUCTION`, conferir o nome de exibição em `EMAIL_FROM` no `/etc/mesa/mesa.env` real e qualquer outra variável que cite o nome antigo. A verificação por `/health` não pega erro de e-mail; adicionar um envio de teste do e-mail de confirmação.
- CI: não há esteira de testes, só `desktop-release.yml`. A verificação dos ícones de Windows e macOS depende de uma tag de teste (6.2), porque `.icns` e instalador NSIS/MSI não são gerados na máquina de desenvolvimento Linux. Deixar explícito na 5.2 que o `electron-builder --dir` local cobre só Linux.
- Mudança de `mac.icon` e `win.icon` em `electron-builder.yml` (hoje `icon.ico` e `icon.icns`): se o macOS passar a usar PNG de 1024, remover o `icon.icns` antigo para não coexistirem duas fontes.
- Versão 1.4.0 em três arquivos (`package.json` do frontend já está modificado pela change em andamento).

## 4. Qualidade de código
Veredito: Atenção
- **Limpeza no Windows.** O desinstalador NSIS do electron-builder costuma reexecutar-se de uma cópia temporária, então iniciar o processo e esperar o `exit` não prova que a remoção terminou. Ele também falha ou pede para fechar o app se o Mesa estiver aberto. A tarefa 2.2 deve: (a) confirmar o resultado pela ausência da chave do registro ou da pasta depois de uma espera com limite de tempo; (b) avisar no diálogo para fechar o Mesa; (c) cair no passo manual quando o limite estoura. Os testes do módulo (2.1) devem cobrir "desinstalador retorna sem remover".
- **Identificação da chave de registro** (tarefa 1.1): fixar o critério (nome da chave e `DisplayName`) para nunca executar um desinstalador de outro programa.
- **Testabilidade:** o padrão do projeto é `node --experimental-strip-types` sobre arquivos `.mjs` que importam `.ts` (`scripts/invite-handoff.test.mjs`). Para o módulo da limpeza funcionar nesse padrão, ele não pode importar `electron`; recebe tudo por injeção (já previsto em 2.1). Adicionar o script correspondente em `package.json` (por exemplo `verify:legacy-cleanup`) à tarefa, para a verificação ser reproduzível.
- A recusa de partida do backend (3.1) tem testes previstos para os cenários da spec; confirmar que cobrem a variável `MESA_*` definida junto com `PARLEY_*`.

## 5. Execução das decisões arquiteturais
Veredito: OK
- Tarefas seguem o `design.md`: intocáveis preservados, `appId` novo, pacote `parley-chat-app`, variáveis sem legado, servidor atual não renomeado, limpeza com confirmação e plano B (NSIS) previsto.
- Sem novo conflito de arquitetura; os pontos acima são de implementação.

## Bloqueantes antes de implementar
- nenhum

## Limitações técnicas a reportar ao Arquiteto
- Desinstalador NSIS assíncrono e Mesa em execução: o design assume remoção síncrona; a tarefa 2.2 precisa de confirmação por estado, com o plano B do NSIS (decisão 3) se não funcionar de forma confiável.
- A lista de arquivos em conflito com `email-registration` é ampla (`README.md`, docs de deploy e operação, `frontend/package.json`, catálogos i18n, `Auth.tsx`, `config.rs`, testes de contrato). A nota de ordem deve citá-la.
