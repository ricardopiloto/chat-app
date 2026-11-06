# Spec Delta

## Purpose

Faz o aplicativo desktop empacotado do Parley atualizar-se sozinho no Windows (instalador NSIS) e no Linux (AppImage), com aviso e reinício seguros, e informa as demais formas de instalação de que há versão nova, sem alterar a instalação de ninguém sem a ação da pessoa.

## ADDED Requirements

### Requirement: O modo de atualização depende da plataforma e do formato de instalação
O aplicativo empacotado SHALL escolher entre dois modos. No modo **automático** (Windows instalado pelo instalador NSIS e Linux executado como AppImage em diretório gravável), SHALL baixar e instalar atualizações. No modo **aviso** (macOS, Linux `.deb` e `.rpm`, Windows instalado pelo `.msi` e qualquer caso em que o formato não possa ser identificado com segurança), SHALL apenas informar a versão nova. Na dúvida SHALL escolher o modo aviso. Em desenvolvimento (aplicativo não empacotado) SHALL NOT verificar nem baixar nada.

#### Scenario: Windows com instalador NSIS
- **WHEN** o aplicativo foi instalado pelo `.exe` NSIS
- **THEN** o modo é automático

#### Scenario: Windows com instalador MSI
- **WHEN** o aplicativo foi instalado pelo `.msi`
- **THEN** o modo é aviso, e nenhum instalador NSIS é baixado sobre a instalação do MSI

#### Scenario: Linux AppImage gravável
- **WHEN** o aplicativo roda como AppImage e o diretório do arquivo do AppImage é gravável (o atualizador substitui o arquivo dentro desse diretório)
- **THEN** o modo é automático

#### Scenario: AppImage instalado pelo script mantém o caminho
- **WHEN** o AppImage foi instalado por `install-mesa.sh` (arquivo `parley-chat-app.AppImage`, sem versão no nome) e a atualização é instalada
- **THEN** o arquivo novo ocupa o mesmo caminho e o atalho do menu continua válido

#### Scenario: Linux AppImage sem permissão de escrita ou pacote deb/rpm
- **WHEN** o diretório do AppImage não é gravável (ainda que o arquivo seja), ou o aplicativo foi instalado por `.deb` ou `.rpm`
- **THEN** o modo é aviso

#### Scenario: macOS
- **WHEN** o aplicativo roda no macOS
- **THEN** o modo é aviso, porque a instalação automática exige assinatura que o projeto não tem

#### Scenario: Desenvolvimento
- **WHEN** o aplicativo roda sem estar empacotado
- **THEN** nenhuma verificação de atualização é feita

### Requirement: A verificação acontece uma única vez, na abertura do app
O aplicativo empacotado SHALL verificar se há versão publicada mais nova uma única vez por abertura, depois que a janela principal terminou de carregar. SHALL NOT repetir a verificação por intervalo, SHALL NOT usar a API REST do GitHub e SHALL NOT oferecer interruptor para desativá-la. Falha de rede, resposta inesperada ou ausência dos arquivos do feed SHALL manter o aplicativo funcional, sem aviso e sem nova tentativa até a próxima abertura. Apenas releases publicadas, que não sejam rascunho nem pré-lançamento, SHALL ser consideradas, e nunca uma versão menor ou igual à instalada.

#### Scenario: Abertura com versão nova publicada
- **WHEN** o app é aberto e existe uma release publicada com versão maior que a instalada
- **THEN** a verificação ocorre uma vez e o aviso ou o download do modo atual começa

#### Scenario: App aberto por muito tempo
- **WHEN** o app fica aberto por dias depois da verificação
- **THEN** nenhuma nova verificação é feita; a próxima ocorre na abertura seguinte

#### Scenario: Sem rede
- **WHEN** a verificação falha por falta de rede ou resposta inválida
- **THEN** a aplicação continua normalmente e nada é mostrado

#### Scenario: Versão publicada igual ou menor
- **WHEN** a release publicada tem versão igual ou menor que a instalada
- **THEN** nada é baixado nem mostrado

#### Scenario: Release em rascunho
- **WHEN** a release mais recente ainda é um rascunho
- **THEN** nenhuma atualização é oferecida ou baixada

### Requirement: No modo automático a atualização é baixada em segundo plano e avisada com «Reiniciar agora»
No modo automático, o aplicativo SHALL baixar a versão nova em segundo plano, sem interromper o uso, e SHALL verificar a integridade do arquivo contra o digest publicado no feed da release antes de aceitá-lo. Quando o download terminar, SHALL mostrar um toast persistente «A versão X está pronta» com as ações «Reiniciar agora» e «Depois». Se a pessoa escolher «Depois» ou ignorar o toast, a atualização SHALL ser instalada quando o aplicativo for fechado. O aplicativo SHALL NOT reiniciar sozinho em nenhuma circunstância.

#### Scenario: Download concluído
- **WHEN** o download da versão nova termina com o digest conferido
- **THEN** um toast persistente mostra a versão pronta com «Reiniciar agora» e «Depois»

#### Scenario: Download termina depois de dispensar o aviso
- **WHEN** a pessoa dispensou o toast de aviso e o download termina depois
- **THEN** o toast «pronta» aparece

#### Scenario: Reiniciar agora
- **WHEN** a pessoa escolhe «Reiniciar agora» sem chamada em andamento
- **THEN** o aplicativo fecha, instala a versão nova e abre de novo

#### Scenario: Depois
- **WHEN** a pessoa escolhe «Depois» ou nunca interage com o toast
- **THEN** o aplicativo continua na versão atual e a atualização é instalada quando ele for fechado

#### Scenario: Digest divergente
- **WHEN** o arquivo baixado não confere com o digest do feed
- **THEN** o arquivo é descartado, nada é instalado e o toast de aviso com o link da release é mostrado

### Requirement: Reiniciar nunca derruba uma chamada sem confirmação
Se houver chamada de voz ou vídeo em andamento quando a pessoa escolher «Reiniciar agora», o aplicativo SHALL pedir confirmação explícita, explicando que reiniciar encerra a chamada, e SHALL reiniciar somente se ela confirmar. Cancelar SHALL manter a chamada e o toast.

#### Scenario: Em chamada
- **WHEN** a pessoa está numa chamada e escolhe «Reiniciar agora»
- **THEN** um diálogo avisa que a chamada será encerrada e pede confirmação

#### Scenario: Cancelar durante a chamada
- **WHEN** a pessoa cancela o diálogo
- **THEN** a chamada continua e o toast de atualização pronta permanece disponível

### Requirement: No modo aviso um toast informa a versão nova com o link da release
No modo aviso, e como queda quando o download do modo automático falha, o aplicativo SHALL mostrar um toast persistente com a versão nova e uma ação «Baixar e instalar a atualização» que abre a página da release no navegador do sistema. O toast SHALL poder ser dispensado até a próxima abertura do app. O aplicativo SHALL NOT baixar nem instalar nada nesse modo.

#### Scenario: macOS com versão nova
- **WHEN** a versão publicada é mais nova e o modo é aviso
- **THEN** o toast mostra a versão e o link da release, e nada é baixado

#### Scenario: Dispensar
- **WHEN** a pessoa dispensa o toast
- **THEN** ele some até a próxima abertura do aplicativo

#### Scenario: Falha no download automático
- **WHEN** o download do modo automático falha por qualquer motivo
- **THEN** o aplicativo mostra o toast do modo aviso com o link da release e continua funcional

### Requirement: O feed de atualização vem só da release oficial e os arquivos são conferidos
O aplicativo SHALL consultar somente as releases do repositório `ricardopiloto/chat-app` no GitHub, por HTTPS, e SHALL NOT aceitar outro endereço de feed em produção. A única exceção SHALL ser uma variável de ambiente de teste que aceita apenas endereços de loopback (`127.0.0.1`, `localhost`); sem ela o comportamento é o de produção. O instalador baixado SHALL ser aceito somente se o seu digest SHA-512 conferir com o do arquivo de feed publicado na mesma release. Os instaladores Windows e macOS não são assinados, e esta limitação SHALL estar documentada.

#### Scenario: Endereço de feed fora do repositório
- **WHEN** alguém tenta apontar o feed para outro host por configuração em produção
- **THEN** o aplicativo ignora o pedido e usa o feed oficial

#### Scenario: Feed de teste em loopback
- **WHEN** a variável de teste aponta para `http://127.0.0.1:<porta>`
- **THEN** a verificação usa esse feed local, e qualquer outro host é recusado

#### Scenario: Aviso de ausência de assinatura
- **WHEN** alguém lê a documentação de release
- **THEN** encontra que os instaladores não são assinados e que a confiança está no HTTPS, no digest do feed e no controle do repositório

### Requirement: A release publica o feed sem alterar os instaladores nem os scripts
O fluxo de release SHALL incluir na mesma release os arquivos `latest.yml`, `latest-linux.yml` e os `.blockmap` gerados pelo empacotamento, além dos seis instaladores. A verificação de seis instaladores e o `SHA256SUMS` SHALL continuar considerando apenas os instaladores. Os scripts `install-mesa.sh` e `install-mesa.ps1` SHALL continuar a funcionar sem mudança. A release SHALL continuar sendo criada em rascunho, e as tags SHALL ter a forma `vX.Y.Z`, igual à versão de `frontend/electron/package.json`.

#### Scenario: Release com feed
- **WHEN** o workflow termina numa tag `vX.Y.Z`
- **THEN** a release em rascunho contém os seis instaladores, `SHA256SUMS`, `latest.yml`, `latest-linux.yml` e os `.blockmap`

#### Scenario: Contagem de instaladores
- **WHEN** o job de release confere os instaladores
- **THEN** exatamente seis instaladores são contados e os arquivos do feed não entram no `SHA256SUMS`

#### Scenario: Tag fora do formato
- **WHEN** a tag não é `vX.Y.Z` de três números
- **THEN** o workflow falha antes de produzir instaladores

#### Scenario: Publicar a release
- **WHEN** a release em rascunho é publicada
- **THEN** só a partir desse momento os aplicativos passam a enxergar a versão nova
