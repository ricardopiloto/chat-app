# Proposal

## Why

A release desktop publica seis instaladores, mas só o NSIS (Windows) e o AppImage gravável (Linux) entram no modo automático do self-updater; `.deb`, `.rpm` e MSI ficam em modo aviso (ligação manual). Manter esses formatos aumenta custo de CI, confusão na página de releases e risco de o utilizador escolher um pacote sem actualização automática. Queremos publicar só os formatos alinhados com o self-updater, mantendo o DMG macOS (modo aviso documentado, sem assinatura/notarização).

## What Changes

- **BREAKING**: deixar de produzir e anexar `.deb`, `.rpm` e `.msi` nas releases desktop.
- Manter Linux **AppImage**, Windows **NSIS** (`.exe`) e macOS **DMG**.
- Ajustar `electron-builder.yml`, workflow `desktop-release.yml` (artefactos e contagem do `SHA256SUMS`: 6 → 3) e documentação (`docs/desktop-release.md`, `README.md`, textos de marketing/download se citarem deb/rpm/msi).
- Actualizar requisitos em `desktop/packaging` e alinhar `desktop/self-update` (cenários MSI/deb/rpm deixam de ser formatos oficiais publicados; instalações legadas podem continuar em modo aviso até o utilizador migrar).
- Scripts `install-mesa.sh` / `install-mesa.ps1` já escolhem AppImage e NSIS — confirmar que não dependem dos artefactos removidos; cleanup legado Mesa deb/rpm permanece para desinstalações antigas.

## Capabilities

### New Capabilities

- (nenhuma)

### Modified Capabilities

- `desktop/packaging`: formatos oficiais passam a AppImage + NSIS + DMG apenas.
- `desktop/self-update`: requisitos/cenários deixam de tratar MSI/deb/rpm como formatos de distribuição actuais; macOS continua em modo aviso; auto só NSIS e AppImage gravável.

## Impact

- CI: jobs Linux/Windows mais simples; job release falha se não houver exactamente três instaladores.
- Utilizadores com `.deb`/`.rpm`/MSI: sem pacotes novos nesses formatos; devem migrar para AppImage ou NSIS para self-update (ou continuar a actualizar manualmente a partir de releases antigas).
- Feed `latest.yml` / `latest-linux.yml` e blockmaps NSIS/AppImage inalterados na intenção; MSI deixa de aparecer no feed Windows.
- Sem mudança de API backend ou do runtime Electron para além da resolução de modo (já distingue NSIS vs resto).
