# Spec Delta

## ADDED Requirements

### Requirement: Instalação por linha de comando em todas as plataformas

O sistema SHALL fornecer um script de instalação por linha de comando para Linux e macOS (`scripts/install-mesa.sh`) e para Windows (`scripts/install-mesa.ps1`) que detecta o sistema operativo e a arquitectura, consulta a última release publicada (não-rascunho) do repositório, descarrega o artefacto apropriado, verifica o seu hash contra o publicado pelo empacotador, e instala a aplicação sem exigir interacção gráfica.

#### Scenario: Instalar em Linux por linha de comando

- **WHEN** o script `install-mesa.sh` corre numa máquina Linux sem a aplicação instalada
- **THEN** descarrega o AppImage da última release publicada, verifica o hash, e deixa a aplicação pronta a correr

#### Scenario: Instalar em macOS por linha de comando

- **WHEN** o script `install-mesa.sh` corre numa máquina macOS
- **THEN** descarrega o `.dmg` da última release publicada, verifica o hash, e copia a aplicação para `/Applications`

#### Scenario: Instalar em Windows por linha de comando

- **WHEN** o script `install-mesa.ps1` corre num PowerShell do Windows
- **THEN** descarrega o instalador NSIS da última release publicada, verifica o hash, e corre a instalação

#### Scenario: Hash inválido interrompe a instalação

- **WHEN** o artefacto descarregado não corresponde ao hash publicado
- **THEN** o script interrompe antes de instalar e explica o motivo, sem executar o ficheiro descarregado

### Requirement: Actualização automática onde a plataforma suporta

O sistema SHALL verificar, no arranque e periodicamente a cada 6 horas enquanto a aplicação corre, se existe uma release mais recente publicada (não-rascunho), e SHALL descarregar e validar essa actualização (hash SHA-512 dos ficheiros de feed do empacotador) nas combinações de plataforma/formato suportadas pelo mecanismo de actualização em uso (Linux: AppImage, `.deb`, `.rpm`; Windows: apenas o instalador NSIS). O sistema SHALL NOT tentar nem simular actualização automática em macOS nem na instalação por `.msi` do Windows — nesses casos SHALL apresentar uma indicação clara de como actualizar manualmente (o mesmo script de instalação por linha de comando, ou a página de releases).

#### Scenario: Actualização automática disponível (Linux ou Windows NSIS)

- **WHEN** existe uma release mais recente publicada e a instalação actual é Linux (qualquer formato) ou Windows NSIS
- **THEN** a actualização é descarregada e validada em segundo plano, sem interromper o uso da aplicação

#### Scenario: Sem actualização automática em macOS

- **WHEN** a aplicação corre em macOS e existe uma release mais recente
- **THEN** a aplicação indica que há uma versão nova e como a obter manualmente, sem tentar descarregar/aplicar automaticamente

#### Scenario: Sem actualização automática em instalação MSI

- **WHEN** a aplicação foi instalada via `.msi` no Windows e existe uma release mais recente
- **THEN** a aplicação indica que há uma versão nova e como a obter manualmente, sem tentar descarregar/aplicar automaticamente

### Requirement: Nunca reiniciar ou instalar sem aviso visível

Quando uma actualização tiver sido descarregada e validada com sucesso, o sistema SHALL mostrar uma indicação visível e persistente antes de a aplicar, com uma acção explícita para reiniciar e aplicar agora, e SHALL NOT reiniciar a aplicação nem substituir ficheiros instalados sem essa acção do utilizador.

#### Scenario: Actualização descarregada mostra aviso

- **WHEN** uma actualização é descarregada e validada com sucesso
- **THEN** aparece uma indicação visível com uma acção para reiniciar e aplicar, e a aplicação continua a funcionar normalmente até essa acção

#### Scenario: Aplicar ao reiniciar manualmente

- **WHEN** o utilizador não reinicia pela acção explícita, mas fecha e volta a abrir a aplicação mais tarde
- **THEN** a actualização já descarregada é aplicada nesse arranque

### Requirement: Documentação cobre todas as vias de instalação e actualização

O `README.md` SHALL descrever, numa secção dedicada, todas as vias de instalação disponíveis (linha de comando, `.deb`/`.rpm` directo, `.msi`/instalador NSIS, `.dmg`) e o comportamento de actualização de cada uma (automática, manual, ou sem suporte), sem apresentar uma via como mais completa do que realmente é.

#### Scenario: README descreve todas as vias

- **WHEN** alguém lê a secção de instalação do `README.md`
- **THEN** encontra as quatro vias de instalação e, para cada uma, se a actualização é automática, manual, ou não suportada
