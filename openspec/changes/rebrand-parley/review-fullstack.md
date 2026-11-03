# Review — Desenvolvedor Fullstack

**Change:** rebrand-parley
**Data:** 2026-11-03
**Veredito geral:** Aprovado com ressalvas (depende de aplicar os bloqueantes do arquiteto; do lado de implementação não há bloqueante próprio)

**Premissa nova do autor:** uma única instância e só usuários de teste; pode trocar tudo.

## 1. Desenvolvimento do backend
Veredito: Atenção
- Superfície pequena: `backend/src/config.rs` (3 variáveis), `api/servers.rs:85` (canal de voz `"mesa"`), `api/unfurl.rs:52` (User-Agent), `api/voice.rs:602` (prefixo do arquivo). Implementável como está.
- Com a premissa nova, o helper de fallback `PARLEY_*`/`MESA_*` (tarefas 3.1 e 3.2) é desnecessário. Implementação mais barata: ler só `PARLEY_*` e, em `Config::validate`/no arranque, devolver erro se existir qualquer `MESA_PRODUCTION`, `MESA_ENV` ou `MESA_RATE_LIMIT_DISABLED`. Sem isso, esquecer de editar `/etc/mesa/mesa.env` desliga o modo produção em silêncio (`config.rs:40`, `config.rs:93-98`).
- Os testes de contrato (`backend/tests/contract/servers.rs:73`, `channels.rs:67,77`) afirmam que o canal de voz padrão se chama `"mesa"`. Mudar o nome padrão exige ajustar essas asserções; entram na tarefa 4.3. Os nomes de servidor `"Mesa"` nos testes são dado de teste e não precisam mudar.
- `x-mesa-media-type` fica: é contrato entre cliente e servidor, e renomear obriga a publicar frontend e backend juntos sem ganho visível.

## 2. Desenvolvimento do frontend
Veredito: Bloqueante (item único, corrigível)
- Textos: ~45 ocorrências nos catálogos; `verify:i18n` e `verify:i18n-keys` já existem e cobrem paridade pt-BR/en. Em pt-BR "a Mesa" vira "o Parley" (gênero muda); a tarefa 4.1 já lembra, mas precisa de revisão manual, não de busca e troca.
- **Bloqueante, rótulos criptográficos.** `recovery.ts:83` (`"mesa-recovery-v1"`) e `inviteSeed.ts:14` (`"mesa-invite-seed-v1"`) são entradas de derivação de chave. Uma busca e troca de "mesa" por "parley" (o que a tarefa 4.1 e a premissa "trocar tudo" induzem) invalida recovery keys e convites. Já existe `frontend/scripts/contracts/reference.mjs` com esses valores e `test:contracts`, que é a rede de proteção certa; falta tarefa explícita para confirmar que ele cobre os dois rótulos e passa antes e depois.
- O `localStorage` do cliente web guarda `mesa.channelKey.*` e demais chaves `mesa.*` (por exemplo `devices.ts`, `theme.ts`, `instance.ts`). Não renomear: apagaria as chaves E2E de todos os usuários web da instância.
- `Logo.tsx` usa duas imagens (`logo.png` e `emblem.png`); a proposal cita só `logo.png`. Incluir `emblem.png`, confirmado na tarefa 5.1.
- UI responsiva: sem mudança de layout; o logo novo precisa caber nos mesmos tamanhos (28 px emblema, 96 px completo).

## 3. Deploy e operação
Veredito: Atenção
- Não há CI de testes: só `.github/workflows/desktop-release.yml`. A verificação é local (`cargo test`, `npm run build`, `test:contracts`, `verify:*`). As tarefas já usam esses comandos; sem esteira nova.
- A instância real roda com `systemd`, `/etc/mesa/mesa.env` e Nginx servindo `dist` (`docs/deploy-producao.md`). A sequência segura é: editar o env (`MESA_PRODUCTION` para `PARLEY_PRODUCTION`), publicar o backend e só então reiniciar. Adicionar como tarefa de runbook, com verificação: `systemctl status` ativo e o log sem erro de configuração.
- Documentos operacionais com `MESA_PRODUCTION`: `operar-instancia.md:34,58`, `deploy-producao.md:109,182`, `desktop-release.md:38` (este afirma que `appId` e `productName` não mudam). Não estão na lista de impacto da proposal.
- Scripts de desenvolvimento também usam a variável: `package.json` (`electron:dev` define `MESA_ELECTRON_DEV=1`), `vite.config.ts`. Entram no mesmo commit da troca.
- Observabilidade: o log de erro de partida é suficiente para diagnosticar a configuração; nada a acrescentar.
- Release: o tag e o `CHANGELOG.md` devem receber entrada; sugerir versão minor (por exemplo 1.4.0), já que o nome dos instaladores muda.

## 4. Qualidade de código
Veredito: Atenção
- Cada grupo de tarefas tem verificação, bom. Com a simplificação, cai a lógica de helper duplicada (Rust e Node) e seus testes.
- Faltam duas verificações baratas: (a) um teste/script que falha se `mesa-recovery-v1` ou `mesa-invite-seed-v1` mudarem; (b) uma checagem de que o backend recusa partir com `MESA_PRODUCTION` definida sem `PARLEY_PRODUCTION`.
- Windows MSI e NSIS: a mudança de `appId` ou de `productName` afeta como o instalador reconhece uma instalação anterior (ver resposta na conversa). Entra como teste manual na build real; não dá para validar sem Windows.
- Ícones: `verify-icons.mjs` hoje valida o mapa de ícones de UI (Lucide), não os arquivos do app. A tarefa 5.3 fala em "atualizar" o script, mas é um acréscimo novo e deve ser descrito assim.

## 5. Execução das decisões arquiteturais
Veredito: Atenção
- A change segue a stack existente e não reabre decisões. A premissa nova desfaz duas decisões do próprio `design.md` (pasta de dados fixa e fallback de variáveis); isso deve ser reescrito, não só descartado em silêncio.
- Divergência com o arquiteto: ele recomenda `appId` `com.parley.desktop`; do lado de implementação, manter `com.mesa.desktop` é o único jeito de o instalador do Windows atualizar no lugar, sem desinstalação manual. Ver síntese.

## Bloqueantes antes de implementar
- Rótulos criptográficos `mesa-recovery-v1` e `mesa-invite-seed-v1` precisam constar como intocáveis, com a tarefa de verificação por `test:contracts`.

## Limitações técnicas a reportar ao Arquiteto
- Pacote `parley` do KDE existe nos repositórios Debian e Fedora; `parley-chat-app` evita colisão de pacote e de ícone no Linux.
- O `appId` define se o instalador do Windows e do macOS atualiza no lugar ou instala lado a lado. Decisão pendente do autor.
