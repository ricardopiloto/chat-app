# Spec Delta

## Purpose

Compila e empacota o shell Tauri da Mesa (`desktop/shell`) para Windows, macOS e Linux a partir de CI, nos formatos de instalador decididos, e publica os artefactos numa release do GitHub — sem exigir que o maintainer compile manualmente em cada plataforma.

## ADDED Requirements

### Requirement: Linux produz AppImage, deb e rpm

O sistema SHALL produzir, a partir de um runner Linux, um `.AppImage`, um pacote `.deb` e um pacote `.rpm`, todos a partir do mesmo crate `frontend/src-tauri`, na mesma execução de CI.

#### Scenario: Três formatos Linux na mesma execução

- **WHEN** o workflow de empacotamento corre no runner Linux
- **THEN** os três artefactos (`.AppImage`, `.deb`, `.rpm`) são produzidos e ficam disponíveis como resultado dessa execução

### Requirement: Windows e macOS produzem instaladores nativos

O sistema SHALL produzir, a partir de um runner Windows, um instalador `.msi` e um `.exe` (NSIS); e, a partir de um runner macOS, um `.app` e um `.dmg`.

#### Scenario: Instaladores Windows

- **WHEN** o workflow corre no runner Windows
- **THEN** são produzidos um `.msi` e um `.exe`

#### Scenario: Instalador macOS

- **WHEN** o workflow corre no runner macOS
- **THEN** são produzidos um `.app` e um `.dmg`

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

### Requirement: Binários sem assinatura são um limite documentado, não escondido

O sistema SHALL produzir os instaladores de Windows e macOS sem assinatura de código/notarização, e SHALL documentar esta limitação (avisos esperados do SmartScreen/Gatekeeper no primeiro arranque) em vez de a apresentar como resolvida.

#### Scenario: Limitação documentada

- **WHEN** alguém lê a documentação de distribuição desta aplicação
- **THEN** encontra, de forma explícita, que os binários de Windows/macOS não são assinados e o que isso implica para quem os instala
