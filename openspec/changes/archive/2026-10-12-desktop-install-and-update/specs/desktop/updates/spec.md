# Spec Delta

## ADDED Requirements

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

Em aplicação empacotada, o sistema SHALL consultar a última release publicada no arranque e a cada seis horas. Quando ela for mais recente que a versão instalada, SHALL apresentar faixa persistente com versão, ligação à release e instrução de atualização manual. Erros de rede SHALL manter a aplicação funcional. O sistema SHALL NOT descarregar ou aplicar automaticamente uma atualização, em qualquer plataforma.

#### Scenario: Nova release
- **WHEN** uma release publicada tem versão posterior à instalada
- **THEN** o aviso permanece visível durante a sessão

#### Scenario: Sem versão nova
- **WHEN** a versão publicada é igual ou anterior à instalada
- **THEN** não há aviso

#### Scenario: Falha de rede
- **WHEN** a API de releases não responde
- **THEN** a aplicação continua e tenta novamente no próximo intervalo

### Requirement: Documentação de instalação e atualização

O README SHALL cobrir script, AppImage/deb/rpm, NSIS/MSI e DMG, deixando claro que a atualização é manual em todos os formatos.

#### Scenario: Consulta das opções
- **WHEN** alguém lê a seção de instalação
- **THEN** encontra formatos, passos de atualização e limites de cada plataforma
