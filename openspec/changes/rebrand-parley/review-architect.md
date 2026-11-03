# Review — Arquiteto de Soluções (revisão final)

**Change:** rebrand-parley
**Data:** 2026-11-03
**Veredito geral:** Aprovado com ressalvas

Os três bloqueantes da revisão anterior estão resolvidos nos artefatos atuais:
1. Rótulos criptográficos `mesa-recovery-v1` e `mesa-invite-seed-v1` declarados intocáveis (`design.md`, decisão 1; spec `brand-identity`, requisito "Identificadores internos…"; tarefa 4.4 com teste em `test:contracts`).
2. Chaves `mesa.*` do `localStorage` e `mesa://` declarados intocáveis, com a justificativa de perda de chaves E2E do cliente web.
3. Escopo reescrito para a premissa (uma instância, usuários de teste): capacidades de continuidade de dados e de fallback de variáveis removidas; recusa de partida do backend com `MESA_*`; documentos e runbook incluídos.

## 1. Definição da arquitetura técnica
Veredito: OK
- Sem mudança de stack ou de componentes. A identidade muda no cliente, no empacotamento e em poucas linhas do backend; coerente com `README.md` (Axum + SQLite, SPA SolidJS, Electron, LiveKit).
- A nova capacidade `desktop/legacy-install-cleanup` é um componente novo e pequeno, no processo principal do Electron, isolado em módulo com dependências injetáveis (tarefa 2.1). Aceitável para o porte do projeto.

## 2. Integração com a infraestrutura existente
Veredito: Atenção
- **Escopo da colisão em andamento é maior do que a nota diz.** O working tree com `email-registration` (12 tarefas feitas, 10 pendentes, sem commit) já modifica, além de `backend/src/config.rs`: `README.md`, `docs/deploy-producao.md`, `docs/operar-instancia.md`, `frontend/package.json`, `frontend/src/i18n/catalogs/en.ts` e `pt-BR.ts`, `frontend/src/pages/Auth.tsx`, `backend/tests/contract/production_boot.rs`. São arquivos que os grupos 3, 4, 6 e 7 do rebrand também editam. A pré-condição "só depois de `email-registration` commitada" está certa; a nota deve citar essa lista, não só `config.rs`.
- **Runbook da instância precisa de mais um item.** `email-registration` introduz variáveis sem prefixo `MESA_` (`EMAIL_API_KEY`, `EMAIL_FROM`, `PUBLIC_BASE_URL`, `REGISTO_MODO`, `TURNSTILE_*`), então a recusa de partida não as afeta. Mas o nome de exibição em `EMAIL_FROM` (por exemplo `Mesa <noreply@…>`) vai para `/etc/mesa/mesa.env` da instância real e hoje cita o nome antigo. Entrar na tarefa 8.1.
- Origem `mesa://app` e domínio `chat.1nodado.com.br` não mudam, então CORS, cookies e links de e-mail (`PUBLIC_BASE_URL`) seguem válidos.
- Pacote Linux `parley-chat-app` evita colisão com o Parley do KDE. Windows/macOS usam `Parley`.

## 3. Qualidade de arquitetura e trade-offs
Veredito: Atenção
- **Segurança da recusa de partida:** correta e fail-closed (`MESA_PRODUCTION`, `MESA_ENV`, `MESA_RATE_LIMIT_DISABLED` recusam partida mesmo se a `PARLEY_*` também existir). Evita o único modo de falha silenciosa.
- **Limpeza da instalação anterior (principal risco novo):**
  - A remoção só ocorre com confirmação do usuário, só em app empacotado, uma vez, sem tocar no executável em execução e sem apagar dados. Os limites estão bem postos.
  - O desinstalador NSIS do electron-builder costuma copiar-se para a pasta temporária e reexecutar-se, então o processo iniciado pelo app pode retornar antes de a remoção terminar; e ele recusa ou pede para fechar se o Mesa estiver aberto. O design registra o plano B (hook NSIS) mas não trata estes dois casos. Recomendo exigir, na tarefa 2.2, que o resultado seja confirmado pela ausência da chave de registro/do diretório após a espera, e que a pergunta avise para fechar o Mesa antes.
  - Executar um comando lido do registro é aceitável porque vem de `HKCU`/`HKLM` do próprio usuário e a chave é identificada pelo nome do app anterior; a tarefa 1.1 deve fixar o critério de correspondência (nome da chave e `DisplayName`) para não executar qualquer desinstalador.
- Marcar a limpeza como feita mesmo quando recusada ou falha é a decisão certa para não incomodar; o README cobre o passo manual.
- **`.icns`:** o caminho do macOS (PNG de 1024 como `mac.icon`, convertido pelo electron-builder) é viável, mas só é exercitado no runner macOS do CI, não na máquina de desenvolvimento. Aceitável, desde que a verificação final dependa do artefato da tag de teste (tarefa 6.2).

## 4. Documentação e decisões (ADRs)
Veredito: OK
- `design.md` registra alternativas rejeitadas (hook NSIS, fallback de variáveis, `appId` mantido) e a decisão de "intocáveis" com motivos. Tem Risks, Migration Plan e pré-condição de ordem.
- Sem diagrama: a complexidade não o exige.

## 5. Ponte entre produto e técnico
Veredito: OK
- Objetivo (renomear, novo logo, sem deixar o Mesa instalado) traduzido em tarefas verificáveis. Logo aprovado e entregue em `docs/v2/parley_logo/`; tarefa 1.3 concluída. A varredura dos textos de e-mail é justificada: `backend/src/email_templates.rs` (da change em andamento) já traz "Mesa" em assuntos e corpos, e `production_boot.rs:85` usa `"Mesa <noreply@example.com>"`.

## Bloqueantes antes de implementar
- nenhum

## Recomendações (não bloqueantes)
1. Ampliar a nota de ordem com a lista de arquivos em conflito com `email-registration`.
2. Incluir o nome de exibição de `EMAIL_FROM` no runbook (tarefa 8.1).
3. Na tarefa 2.2, tratar o desinstalador assíncrono e o Mesa em execução; na 1.1, fixar o critério de identificação da chave.
