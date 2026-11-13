# desktop/packaging Specification

## Purpose
Compila e empacota o shell desktop da Mesa (`desktop/shell`, Electron desde `desktop-electron-shell`) para Windows, macOS e Linux a partir de CI, nos formatos de instalador decididos, e publica os artefactos numa release do GitHub — sem exigir que o maintainer compile manualmente em cada plataforma.

## Requirements

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

### Requirement: A compilação não é accionada em cada push

O sistema SHALL só accionar a compilação/empacotamento das três plataformas por despacho manual ou por criação de uma tag de versão (`v*`), e SHALL NOT compilar automaticamente em cada push para a branch principal.

#### Scenario: Push normal não compila

- **WHEN** um commit é enviado para a branch principal sem criar uma tag `v*`
- **THEN** o workflow de empacotamento não corre

#### Scenario: Tag de versão compila as três plataformas

- **WHEN** uma tag `v*` é criada
- **THEN** o workflow corre nas três plataformas e produz os artefactos de todas elas

### Requirement: Artefactos ficam disponíveis numa release do GitHub

Quando o workflow é accionado por uma tag de versão, o sistema SHALL publicar todos os artefactos produzidos (as três plataformas) como anexos de uma única GitHub Release correspondente a essa tag.

#### Scenario: Release com os artefactos das três plataformas

- **WHEN** uma tag `v*` acciona o workflow e as três plataformas terminam com sucesso
- **THEN** existe uma GitHub Release para essa tag com os artefactos de Windows, macOS e Linux anexados

### Requirement: O instalador macOS declara o uso de câmara e microfone

O sistema SHALL incluir, no `Info.plist` do pacote macOS, as chaves `NSCameraUsageDescription` e `NSMicrophoneUsageDescription` com texto explicativo, e SHALL NOT depender do comportamento por omissão do empacotador (sem essas chaves, o macOS recusa o pedido de câmara/microfone sem sequer mostrar o diálogo de permissão ao utilizador).

#### Scenario: Pedido de câmara mostra o diálogo do sistema

- **WHEN** a aplicação instalada a partir do `.dmg`/`.app` pede acesso à câmara pela primeira vez
- **THEN** o macOS mostra o diálogo de permissão do sistema (não recusa silenciosamente)

### Requirement: Binários sem assinatura são um limite documentado, não escondido

O sistema SHALL produzir os instaladores de Windows e macOS sem assinatura de código/notarização, e SHALL documentar esta limitação (avisos esperados do SmartScreen/Gatekeeper no primeiro arranque) em vez de a apresentar como resolvida.

#### Scenario: Limitação documentada

- **WHEN** alguém lê a documentação de distribuição desta aplicação
- **THEN** encontra, de forma explícita, que os binários de Windows/macOS não são assinados e o que isso implica para quem os instala
