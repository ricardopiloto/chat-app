# Review — Desenvolvedor Fullstack

**Change:** rebrand-parley
**Data:** 2026-11-04
**Veredito geral:** Aprovado com ressalvas

Revisão refeita contra o código atual (as três changes de e-mail e a de onboarding já estão commitadas e arquivadas, árvore limpa). Contexto lido: artefatos da change e `review-architect.md`, `backend/src/{config,main,lib,email_templates}.rs`, `backend/tests/contract/auth_email_reset.rs`, `frontend/{package.json,electron-builder.yml,vite.config.ts}`, `frontend/electron/{main.ts,tsconfig.json,icons/}`, `frontend/src/{i18n,crypto,api,assets}`, `frontend/scripts/*`, `scripts/install-mesa.sh`, `.github/workflows/desktop-release.yml`, `docs/deploy-producao.md`. Verificação no repo: `openspec validate rebrand-parley --strict` passa. Não há CI de testes, só o workflow de release; o gate local são `cargo test` e os `npm run …`.

## 1. Desenvolvimento do backend
Veredito: Atenção
- **Onde fica a recusa de partida.** `Config::from_env()` devolve `Self` (sem `Result`) e `validate()` é chamado em `main.rs` e em `lib.rs::build_state`. A recusa por `MESA_*` tem de valer **mesmo sem `PARLEY_PRODUCTION`** (é o ponto da spec), então não pode ficar dentro de `validate()` depois de uma checagem de produção. Especificar uma função separada (por exemplo `Config::legacy_env_error()`), chamada em `main.rs` antes de `validate()`, e que **recebe o ambiente por parâmetro**: testes que mexem em variáveis de ambiente reais são racionais só em série e a suíte corre em paralelo. Tasks 3.1/3.2 não dizem isto.
- **Contratos e testes que citam variáveis e textos.** A 3.2 cita «os testes de contrato que citam as variáveis», mas há também os que fixam **textos de e-mail**: `auth_email_reset.rs` confere «Senha do Mesa alterada» (linhas ~301 e ~372) e vários testes constroem remetentes `"Mesa <mesa@example.org>"`. Trocar os templates (22 ocorrências de «Mesa» em `email_templates.rs`) sem isto quebra a suíte. Incluir na 4.3 a lista desses testes.
- **Uma ocorrência é só dado de teste**: `create_server_body("Mesa")` em vários testes não tem relação com a marca; não renomear.
- Sem migração nem mudança de API. `User-Agent` do unfurl, prefixo da gravação e nome do canal de voz são strings simples (4.3).

## 2. Desenvolvimento do frontend
Veredito: Atenção
- **Varredura de «Mesa» precisa de um guarda automático, não só leitura.** São ~56 ocorrências em `frontend/src` e `backend/src`, mais catálogos `legacy/*` e textos novos das changes de e-mail e de onboarding. A tarefa 4.1 usa «linha a linha» e `grep` manual. Acrescentar um `scripts/verify-brand.mjs` com **lista de permissão** dos identificadores intocáveis (`mesa.*`, `mesa://`, `mesa:*`, `x-mesa-media-type`, `__MESA_NATIVE__`, `mesa-recovery-v1`, `mesa-invite-seed-v1`) que falha com qualquer outro «Mesa/mesa» visível; fica no mesmo padrão dos `verify-*.mjs`.
- **Ícones:** `frontend/src/assets/{logo,emblem}.png` e `frontend/public/*` existem; `frontend/electron/icons/` ainda tem `android/`, `ios/`, `Square*Logo.png`, `StoreLogo.png` e `icon.icns` (sobras do Tauri), como a 5.2 já prevê. A 5.2 corretamente manda confirmar por `grep` que nada os referencia.
- **Teste do módulo de limpeza.** O padrão `node --experimental-strip-types` dos `verify-*.mjs` só roda TypeScript com **sintaxe apagável** (sem `enum`, sem parâmetros-propriedade). O módulo de `electron/` é compilado por `tsc` (`module: Node16`, `noUnusedLocals`) e importado por `main.ts` com `.js`; o teste importaria o `.ts` direto. Escrever o módulo só com tipos e funções puras (já previsto: funções injetáveis) e dizer isso na 2.1 evita retrabalho.
- Sem UI nova além do diálogo nativo de confirmação (`dialog` do Electron, que `main.ts` ainda não importa).

## 3. Deploy e operação
Veredito: Atenção
- **Roteiro de produção (8.1) assume uma topologia que mudou.** `docs/deploy-producao.md` descreve `systemd` + `/etc/mesa/mesa.env` + Nginx servindo `dist`; foi informado que o Nginx atende só o LiveKit e a entrada do tráfego da app está por confirmar (backlog, item 20). Confirmar onde a variável `MESA_PRODUCTION` está de fato definida antes de escrever o roteiro, porque **uma variável esquecida impede o backend de subir** (é o desenho), então a ordem «editar o ambiente antes de reiniciar» é crítica.
- **CI:** `desktop-release.yml` usa nomes `mesa-linux`, `mesa-windows`, `mesa-macos` (artefatos) e `pattern: mesa-*` no download, além do nome da release «Mesa …». A 6.2 diz «nomes dos artefatos e da release»; precisa renomear **os dois lados do par upload/download** e o `pattern` juntos, senão o job de publicação não encontra nada. A tag precisa casar com `frontend/electron/package.json` (1.4.0).
- **Scripts de instalação:** `install-mesa.sh` tem ~10 mensagens com o prefixo «Mesa:», o nome do AppImage (`mesa-chat-app.AppImage`), `Name=Mesa` do atalho e o ícone; o filtro do instalador no Python usa extensão e arquitetura (`encontrados {len(candidates)}`). Os nomes dos **próprios ficheiros** `install-mesa.sh/.ps1` não estão na decisão; manter ou renomear é escolha de produto (URLs antigas deixam de existir se renomear). Registrar.
- **`electron-builder.yml`:** além de `appId`, `productName`, `copyright` e `artifactName`, há `extraMetadata.name: mesa`, `author`, `maintainer: Mesa`, `desktopName: mesa-chat-app.desktop`, `deb/rpm.packageName`. A 6.1 não lista `extraMetadata.name` nem `maintainer`/`desktopName` explicitamente; incluir para não restar «mesa».
- **Observabilidade:** a limpeza grava só em log; para depurar «não removeu o Mesa» num usuário, definir onde esse log fica (arquivo em `userData` do Parley, não só console) e que o diálogo de falha mostra o passo manual.

## 4. Qualidade de código
Veredito: Atenção
- Testes previstos: módulo de limpeza (2.1–2.3), recusa de variáveis (3.1), contratos (4.4), ícones (5.3). Faltam: o `verify-brand.mjs` acima, o ajuste dos testes de e-mail (§1) e um teste do `electron-builder --dir` em CI para o `appId` novo (hoje só a tag de teste da 6.2).
- **Cenário que a spec não tem e o código revela:** o `localStorage` do desktop vive em `userData`, e `userData` muda de nome (ver review do arquiteto). A spec garante preservação só para o cliente web; sem decisão, nenhuma tarefa cobre o que acontece com `mesa.channelKey.*` e com a sessão do desktop.
- Resiliência: o desinstalador NSIS assíncrono está bem tratado (estado em vez de código de retorno, espera com limite). Concorrência: a marca de execução única em `userData` impede dupla execução entre janelas.
- Tarefas manuais (1.1, 2.4, 5.4, parte da 6.2) exigem Windows, macOS e um runner de CI; não há dono. Não bloqueiam o resto, mas a 2.4 decide o plano B do NSIS, então o grupo 2 deve começar pela 1.1.

## 5. Execução das decisões arquiteturais
Veredito: OK
- As decisões (intocáveis, `appId`, limpeza na primeira execução, recusa de `MESA_*`, pacotes `parley-chat-app`) estão coerentes com o código real. A lista de intocáveis confere, e a chave `mesa.instance-admin-welcome:<id>` da change de onboarding já segue o prefixo preservado.
- Limitações técnicas que a implementação revelaria e a arquitetura não endereça estão abaixo.

## Bloqueantes antes de implementar
- nenhum

## Limitações técnicas a reportar ao Arquiteto
- **`userData` do desktop:** a mudança de nome deixa o novo perfil sem `mesa.channelKey.*` (chaves de canal de voz coladas à mão) e sem a sessão; decidir aceitar/fixar/migrar e registrar cenário na spec.
- **Topologia de produção** do roteiro 8.1 (Nginx só para LiveKit; entrada da app por confirmar).
- **Notas de ordem desatualizadas** em `tasks.md`, no Risks e no plano de migração (as changes de e-mail já estão commitadas).
- **Pesquisa de colisão do nome (1.2)** ainda aberta e irreversível depois de publicar `appId`/pacotes: fazer antes de implementar.
