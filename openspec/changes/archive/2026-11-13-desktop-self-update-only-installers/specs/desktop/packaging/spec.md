# Spec Delta

## REMOVED Requirements

### Requirement: Linux produz AppImage, deb e rpm

**Reason**: Só o AppImage entra no self-updater automático; deb/rpm geravam releases sem atualização automática e custo de CI desnecessário.

**Migration**: Utilizadores com `.deb`/`.rpm` devem instalar o AppImage (script `install-mesa.sh` ou download directo) para passar a receber atualizações automáticas quando o diretório for gravável.

### Requirement: Windows e macOS produzem instaladores nativos

**Reason**: Substituído por requisitos separados que excluem o MSI e mantêm NSIS + DMG.

**Migration**: Utilizadores com MSI devem reinstalar com o `.exe` NSIS para self-update automático.

## ADDED Requirements

### Requirement: Linux produz AppImage

O sistema SHALL produzir, a partir de um runner Linux, um `.AppImage` a partir do shell desktop Electron. O sistema SHALL NOT produzir `.deb` nem `.rpm` como artefactos oficiais de release.

#### Scenario: AppImage Linux na execução

- **WHEN** o workflow de empacotamento corre no runner Linux
- **THEN** é produzido um `.AppImage` e ficam disponíveis o feed Linux associado (`latest-linux.yml` e metadados de blockmap embutidos conforme o empacotador)

#### Scenario: Sem deb nem rpm oficiais

- **WHEN** o workflow de empacotamento corre no runner Linux
- **THEN** não são anexados à release oficial pacotes `.deb` nem `.rpm`

### Requirement: Windows produz NSIS e macOS produz DMG

O sistema SHALL produzir, a partir de um runner Windows, um instalador `.exe` (NSIS); e, a partir de um runner macOS, um `.dmg` (com a aplicação `.app` embrulhada dentro). O sistema SHALL NOT produzir `.msi` como artefacto oficial de release.

#### Scenario: Instalador Windows NSIS

- **WHEN** o workflow corre no runner Windows
- **THEN** é produzido um `.exe` NSIS (e o feed `latest.yml` / blockmaps associados)

#### Scenario: Sem MSI oficial

- **WHEN** o workflow corre no runner Windows
- **THEN** não é anexado à release oficial um `.msi`

#### Scenario: Instalador macOS

- **WHEN** o workflow corre no runner macOS
- **THEN** é produzido um `.dmg` contendo a aplicação

### Requirement: Release tagged anexa exactamente três instaladores

Quando o workflow é accionado por uma tag `v*`, o sistema SHALL anexar exactamente três instaladores oficiais (AppImage, NSIS `.exe`, DMG) mais o manifesto `SHA256SUMS` desses três ficheiros, e SHALL falhar a publicação se a contagem de instaladores for diferente de três.

#### Scenario: Contagem correcta

- **WHEN** uma tag `v*` completa os jobs das três plataformas com sucesso
- **THEN** a release draft inclui três instaladores e um `SHA256SUMS` que cobre esses três ficheiros

#### Scenario: Contagem incorrecta

- **WHEN** o job de release encontra um número de instaladores diferente de três
- **THEN** o job falha sem publicar checksums incorrectos
