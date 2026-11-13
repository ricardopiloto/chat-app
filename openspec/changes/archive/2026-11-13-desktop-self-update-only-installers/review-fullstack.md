# Review — Desenvolvedor Fullstack

**Change:** desktop-self-update-only-installers  
**Data:** 2026-11-13  
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend
Veredito: N/A

- Sem API, migrações, auth ou LiveKit. Confirmado pelo proposal Impact e Non-Goals do design.

## 2. Desenvolvimento do frontend
Veredito: OK

- Runtime: D3 correcto — `frontend/electron/updateMode.ts` já devolve `auto` só com `Uninstall Parley.exe` (NSIS) ou `APPIMAGE` gravável; MSI/deb/rpm caem em `notify` sem código novo.
- UI: no máximo copy de marketing/i18n (task 3.3). Toast/updater no renderer fora de escopo — adequado.
- Sem mudanças SolidJS de chat/voz.

## 3. Deploy e operação
Veredito: Atenção

- Mudanças em `electron-builder.yml` + `desktop-release.yml` são o núcleo e estão bem listadas (tasks 1.1–2.1). Remover `apt-get install rpm` no job Linux é o detalhe fácil de esquecer — já está na 1.2.
- Task 5.1 permite “documentar no PR o plano de smoke” em vez de correr `workflow_dispatch` — **Atenção**: para uma change **BREAKING** de artefactos, o smoke real do workflow (mesmo só `workflow_dispatch`) é a verificação mais fiável; recomendar não marcar 5.1 `[x]` só com plano escrito se for possível disparar o run.
- Logs/debug: feeds `latest.yml` / `latest-linux.yml` e `parley-updater.log` já existentes bastam; nada novo a inventar.

## 4. Qualidade de código
Veredito: Atenção

- Tasks seguem o padrão “fazer + Verificar:” — OK.
- Não há ficheiro de teste dedicado a `updateMode` no frontend; task 4.2 apoia-se em `tsc` / “sem regressão documentada”. **Atenção** (não bloqueante): se existirem asserts manuais rápidos (tabela plataforma→modo), bastam na descrição do PR; não exige framework novo.
- Task 1.2 pede grep sem `deb`/`rpm`/`msi` no workflow — correcto no âmbito do YAML; **não** limpar `legacy-cleanup.ts` / detecção Mesa em `main.ts` (Non-Goal D3/cleanup) — o implementador deve restringir o grep ao workflow/docs oficiais, não a todo o repo.
- CHANGELOG/`Unreleased` não está nas tasks — **Atenção** menor: no apply, acrescentar entrada **BREAKING** sob Unreleased (ou na release seguinte) alinhada ao proposal.

## 5. Execução das decisões arquiteturais
Veredito: OK

- Tasks mapeiam D1→1.x, D2→2.1, D4→3.x, D3/D5→4.x, validação→5.1 sem reabrir Non-Goals (signing, auto macOS).
- Limitação futura de contagem multi-arch (nota do arquiteto) não impede o apply actual com um artefacto por runner.

## Bloqueantes antes de implementar
- nenhum

## Limitações técnicas a reportar ao Arquiteto
- Contagem fixa “3” no job `release` é frágil se o layout de arquitecturas mudar — alinhado ao achado de Atenção do arquiteto; sem pedido de redesign agora.
- Smoke 5.1 opcional por documentação: preferível exigir run de `workflow_dispatch` quando a conta/permisões o permitirem.
