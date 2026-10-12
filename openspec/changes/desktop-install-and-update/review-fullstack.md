# Review — Desenvolvedor Fullstack

**Change:** desktop-install-and-update
**Data:** 2026-10-12
**Veredito geral:** Aprovado com ressalvas

*Nota: segunda revisão, contra o desenho actual (aviso-only + atualização manual, sem `electron-updater`). Ver `review-architect.md` para o porquê.*

## 1. Desenvolvimento do backend

Veredito: N/A — `proposal.md:21` confirma, e o código confirma, que nenhum endpoint de backend é tocado.

## 2. Desenvolvimento do frontend

Veredito: Atenção — **achado principal desta revisão**

Lendo o código real (não assumindo pelo `tasks.md`), quase todas as tarefas marcadas `[ ]` já estão implementadas:

- **Tarefa 1.1** (consulta no arranque + 6h, só fora de dev): `frontend/electron/main.ts:10-11,37-54` — `LATEST_RELEASE`, `UPDATE_INTERVAL_MS = 6*60*60*1000`, `checkForUpdate()` com timeout de 10s, descarta `draft`/`prerelease`, valida `tag_name`/`html_url`. Implementado.
- **Tarefa 1.2** (IPC/preload + faixa no shell): `main.ts:56-58` (`registerUpdateIpc`), `frontend/electron/preload.ts:33,36-37` (`availableUpdate()`, `onUpdateAvailable`), `frontend/src/shell/AppShell.tsx:19,25-26,40-43` (sinal, subscrição, faixa com `t("shell.updateAvailable")`/`t("shell.updateManually")` e link externo). Implementado.
- **Tarefa 1.3** (mensagens pt-BR/en): `frontend/src/i18n/catalogs/pt-BR.ts:175-176` e `catalogs/en.ts:174-175` já têm as duas chaves. Implementado.
- **Tarefa 2.1/2.2** (`scripts/install-mesa.sh`/`.ps1`): ambos existem e são implementações completas, não esqueletos — validação de URL contra o domínio da release, verificação SHA-256 antes de instalar, extracção de ícone do AppImage, `ditto`/`sudo ditto` para o DMG, `/S` para o NSIS silencioso, `trap`/`finally` de limpeza nos dois. Implementado.
- **Tarefa 3.1/3.2/3.3** (SHA256SUMS no workflow, README, docs/desktop-release.md): `.github/workflows/desktop-release.yml:177` gera o manifesto; `README.md:379-389` e `docs/desktop-release.md:3-5` já documentam exactamente este modelo. Implementado.

**O que resta genuinamente em aberto** (exige hardware real ou um corte de release, não código): Tarefa 2.3 (hash incorrecto + reinstalação sobre versão antiga), 2.4 (Arch-based), 2.5 (Windows/macOS reais), 3.4 (release de teste coordenada). Recomendo marcar 1.1-1.3, 2.1-2.2 e 3.1-3.3 como `[x]` antes de continuar — o `tasks.md` não reflecte o estado real do repositório.

Achado menor de qualidade, não bloqueante: em `scripts/install-mesa.ps1:33-34`, a regex de correspondência da linha do `SHA256SUMS` embute um salto de linha literal dentro da classe de caracteres (`[^` + newline + `]+`) em vez de `\n` escapado — funciona porque `Get-Content` já devolve linhas sem newline, mas é frágil a reformatação futura do ficheiro.

## 3. Deploy e operação

Veredito: OK

- Sem segredo novo (API pública do GitHub não exige token para `releases/latest` num repositório público). Workflow já gera o manifesto no mesmo job que já publica os instaladores — sem passo novo de infra.

## 4. Qualidade de código

Veredito: OK

- Os dois scripts tratam os mesmos casos de erro de forma simétrica (asset ausente/duplicado, hash ausente/inválido, URL fora do domínio esperado) — boa consistência entre plataformas apesar de serem linguagens diferentes (`sh` vs `PowerShell`).
- `isNewerVersion`/`versionParts` em `main.ts` rejeita silenciosamente tags fora do formato `vMAJOR.MINOR.PATCH` (pre-release/beta), consistente com "aceitando tags estáveis" do `design.md` — comportamento intencional, não lacuna.

## 5. Execução das decisões arquiteturais

Veredito: OK

- O código implementado cumpre as três Decisões de `design.md` sem desvio: sem `electron-updater`, scripts idempotentes com hash publicado, `draft: true`/`--publish never` inalterados.

## Bloqueantes antes de implementar

- nenhum — na prática, quase nada falta "implementar"; falta marcar o progresso real e executar as tarefas de verificação em hardware.

## Limitações técnicas a reportar ao Arquiteto

- O ponto de rate-limit não-autenticado da API do GitHub (ver `review-architect.md` §3) é a única lacuna de registo que vale fechar antes de arquivar.
