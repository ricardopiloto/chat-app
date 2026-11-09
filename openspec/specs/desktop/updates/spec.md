# desktop/updates Specification

## Purpose
TBD - created by archiving change desktop-install-and-update. Update Purpose after archive.

## Requirements

### Requirement: Instalação por linha de comando com integridade verificada

O sistema SHALL fornecer scripts/install-mesa.sh para Linux/macOS e scripts/install-mesa.ps1 para Windows. Cada script SHALL consultar a última GitHub Release publicada, selecionar o instalador adequado à plataforma e arquitetura, verificar seu SHA-256 contra o manifesto publicado na mesma release e interromper antes de instalar em caso de divergência. Reexecutar o script SHALL instalar a versão publicada mais recente. Linux SHALL criar entrada de menu com ícone para o AppImage.

#### Scenario: Instalação Linux
- **WHEN** o script corre em Linux x86_64
- **THEN** instala o AppImage verificado e cria atalho com ícone

#### Scenario: Instalação macOS
- **WHEN** o script corre em macOS numa arquitetura suportada
- **THEN** monta o DMG verificado e copia a aplicação para Applications

#### Scenario: Instalação Windows
- **WHEN** o script corre em Windows numa arquitetura suportada
- **THEN** executa o instalador NSIS verificado

#### Scenario: Hash inválido
- **WHEN** o SHA-256 descarregado difere do manifesto
- **THEN** o script falha com mensagem clara sem executar ou instalar o artefacto

### Requirement: Aviso persistente de nova versão

Em aplicação empacotada, o sistema SHALL consultar a última release publicada uma única vez por abertura do aplicativo, depois que a janela principal carregou, sem repetir a consulta por intervalo. Nas formas de instalação que não se atualizam sozinhas (macOS, Linux `.deb` e `.rpm` e Windows `.msi`), quando a release for mais recente que a versão instalada, o sistema SHALL apresentar toast persistente com a versão, a ligação à release e a instrução de atualização manual, que a pessoa pode dispensar até a próxima abertura. Nessas formas o sistema SHALL NOT descarregar ou aplicar automaticamente uma atualização. Nas formas que se atualizam sozinhas (Windows NSIS e Linux AppImage), o comportamento é o da capacidade `desktop/self-update`. Erros de rede SHALL manter a aplicação funcional.

#### Scenario: Nova release
- **WHEN** uma release publicada tem versão posterior à instalada e o aplicativo foi instalado como DMG, `.deb`, `.rpm` ou `.msi`
- **THEN** o toast permanece visível durante a sessão até ser dispensado

#### Scenario: Sem versão nova
- **WHEN** a versão publicada é igual ou anterior à instalada
- **THEN** não há aviso

#### Scenario: Falha de rede
- **WHEN** a consulta da release não responde
- **THEN** a aplicação continua e tenta novamente apenas na próxima abertura

### Requirement: Documentação de instalação e atualização

O README e `docs/desktop-release.md` SHALL cobrir script, AppImage/deb/rpm, NSIS/MSI e DMG, deixando claro quais formatos se atualizam sozinhos (Windows NSIS e Linux AppImage, a partir da primeira versão que traz o atualizador) e quais exigem atualização manual (macOS DMG, `.deb`, `.rpm` e `.msi`), que a verificação ocorre só na abertura do app, que o reinício é sempre uma ação da pessoa (ou ocorre ao fechar o app) e que os instaladores não são assinados.

#### Scenario: Consulta das opções
- **WHEN** alguém lê a seção de instalação
- **THEN** encontra formatos, quais se atualizam sozinhos, os passos de atualização manual dos demais e os limites de cada plataforma
