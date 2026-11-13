# Tasks

## 1. Packaging config

- [x] 1.1 Em `frontend/electron-builder.yml`, deixar `linux.target` só com `AppImage`, `win.target` só com `nsis`, manter `mac`/`dmg`; remover blocos `deb:`/`rpm:` órfãos. Verificar: ficheiro sem referências a deb/rpm/msi como targets.
- [x] 1.2 Em `.github/workflows/desktop-release.yml`, empacotar `--linux AppImage` e `--win nsis`; actualizar paths de upload-artifact (sem deb/rpm/msi); remover instalação de `rpm` no job Linux se já não for necessária. Verificar: grep no workflow sem `deb`/`rpm`/`msi` nos passos de package/upload (excepto menções históricas em comentários, se existirem — preferir zero).

## 2. Release checksums

- [x] 2.1 No job `release`, o `find` de instaladores e a asserção de contagem passam a exactamente **3** (AppImage, exe, dmg); actualizar a mensagem de erro. Verificar: leitura do YAML mostra `ne 3` (ou equivalente) e extensões só AppImage/exe/dmg.

## 3. Docs e copy

- [x] 3.1 Actualizar `docs/desktop-release.md` (seis → três; tabela de plataformas; texto do updater sem MSI/deb/rpm oficiais). Verificar: doc descreve AppImage + NSIS + DMG e SHA256SUMS de três ficheiros.
- [x] 3.2 Actualizar `README.md` (e `docs/arquitetura-tecnica.md` se ainda citar seis instaladores / deb / rpm / MSI oficiais). Verificar: tabelas de download e status do updater coerentes com esta change.
- [x] 3.3 Procurar copy de marketing/i18n que nomeie `.deb`/`.rpm`/MSI como downloads oficiais e corrigir se existir. Verificar: `rg` em `frontend/src` sem prometer esses formatos.

## 4. Runtime / scripts smoke

- [x] 4.1 Confirmar que `scripts/install-mesa.sh` e `scripts/install-mesa.ps1` não dependem de deb/rpm/msi; ajustar só se algum caminho quebrar. Verificar: scripts referem AppImage e NSIS `.exe` apenas.
- [x] 4.2 Confirmar que `resolveUpdateMode` (e testes unitários existentes, se houver) continua a marcar NSIS e AppImage gravável como `auto` e macOS/legado como `notify`. Verificar: `tsc` no Electron e/ou testes de `updateMode` passam; sem regressão documentada.

## 5. Validação CI

- [x] 5.1 Correr `workflow_dispatch` **Desktop release** (ou documentar no PR o plano de smoke) e confirmar artifacts: um AppImage, um `.exe`, um `.dmg`, feeds `latest.yml`/`latest-linux.yml`, sem deb/rpm/msi. Verificar: lista de artifacts do run corresponde a três instaladores (+ feeds/blockmaps).

### Smoke plan (5.1)

`gh` CLI não está disponível neste ambiente. Após merge (ou a partir do branch com estas alterações):

1. Em GitHub Actions → **Desktop release** → **Run workflow** (`workflow_dispatch`).
2. Confirmar artifacts `parley-linux` (só `.AppImage` + `latest-linux.yml` / blockmaps), `parley-windows` (só `.exe` + `latest.yml` / blockmaps), `parley-macos` (`.dmg`).
3. Numa tag `vX.Y.Z` posterior, confirmar que o job `release` gera `SHA256SUMS` com exactamente três linhas de instaladores.
