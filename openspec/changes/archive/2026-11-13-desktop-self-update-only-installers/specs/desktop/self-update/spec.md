# Spec Delta

## MODIFIED Requirements

### Requirement: O modo de atualização depende da plataforma e do formato de instalação

O aplicativo empacotado SHALL escolher entre dois modos. No modo **automático** (Windows instalado pelo instalador NSIS e Linux executado como AppImage em diretório gravável), SHALL baixar e instalar atualizações. No modo **aviso** (macOS, AppImage em diretório não gravável, e qualquer instalação cujo formato não possa ser identificado com segurança — incluindo instalações legadas `.deb`/`.rpm`/MSI ainda presentes no dispositivo), SHALL apenas informar a versão nova. Na dúvida SHALL escolher o modo aviso. Em desenvolvimento (aplicativo não empacotado) SHALL NOT verificar nem baixar nada. As releases oficiais novas SHALL NOT publicar `.deb`, `.rpm` nem `.msi`; o caminho suportado com atualização automática é NSIS ou AppImage gravável.

#### Scenario: Windows com instalador NSIS

- **WHEN** o aplicativo foi instalado pelo `.exe` NSIS
- **THEN** o modo é automático

#### Scenario: Linux AppImage gravável

- **WHEN** o aplicativo roda como AppImage e o diretório do arquivo do AppImage é gravável (o atualizador substitui o arquivo dentro desse diretório)
- **THEN** o modo é automático

#### Scenario: AppImage instalado pelo script mantém o caminho

- **WHEN** o AppImage foi instalado por `install-mesa.sh` (arquivo `parley-chat-app.AppImage`, sem versão no nome) e a atualização é instalada
- **THEN** o arquivo novo ocupa o mesmo caminho e o atalho do menu continua válido

#### Scenario: AppImage sem permissão de escrita

- **WHEN** o diretório do AppImage não é gravável (ainda que o arquivo seja)
- **THEN** o modo é aviso

#### Scenario: Instalação legada deb, rpm ou MSI

- **WHEN** o aplicativo ainda corre a partir de uma instalação legada `.deb`, `.rpm` ou `.msi` (não publicada em releases novas)
- **THEN** o modo é aviso e nenhum instalador automático substitui essa instalação sem ação do utilizador

#### Scenario: macOS

- **WHEN** o aplicativo roda no macOS
- **THEN** o modo é aviso, porque a instalação automática exige assinatura que o projeto não tem

#### Scenario: Desenvolvimento

- **WHEN** o aplicativo roda sem estar empacotado
- **THEN** nenhuma verificação de atualização é feita
