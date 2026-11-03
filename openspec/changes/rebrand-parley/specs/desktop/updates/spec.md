# Spec Delta

## MODIFIED Requirements

### Requirement: Instalação por linha de comando com integridade verificada

O sistema SHALL fornecer scripts/install-mesa.sh para Linux/macOS e scripts/install-mesa.ps1 para Windows. Cada script SHALL consultar a última GitHub Release publicada, selecionar o instalador adequado à plataforma e arquitetura, verificar seu SHA-256 contra o manifesto publicado na mesma release e interromper antes de instalar em caso de divergência. Reexecutar o script SHALL instalar a versão publicada mais recente. Linux SHALL criar entrada de menu com ícone para o AppImage, com o nome "Parley". Os scripts SHALL continuar a localizar o instalador depois da mudança de nome dos artefactos da release, e as suas mensagens SHALL usar o nome "Parley". Em macOS, o script SHALL remover a aplicação com o nome anterior (`Mesa.app`) de `/Applications` ao instalar a nova, para não deixar duas cópias. Em Linux e Windows, a remoção da instalação anterior fica a cargo da limpeza na primeira execução (capacidade `desktop/legacy-install-cleanup`).

#### Scenario: Instalação Linux
- **WHEN** o script corre em Linux x86_64
- **THEN** instala o AppImage verificado e cria atalho com ícone, chamado "Parley"

#### Scenario: Instalação macOS
- **WHEN** o script corre em macOS numa arquitetura suportada, com ou sem `Mesa.app` instalada
- **THEN** monta o DMG verificado, copia a aplicação para Applications e remove `Mesa.app` se existir

#### Scenario: Instalação Windows
- **WHEN** o script corre em Windows numa arquitetura suportada, sobre uma release cujo instalador se chama `Parley-<versão>.exe`
- **THEN** seleciona esse instalador NSIS, verifica-o e executa-o

#### Scenario: Hash inválido
- **WHEN** o SHA-256 descarregado difere do manifesto
- **THEN** o script falha com mensagem clara sem executar ou instalar o artefacto
