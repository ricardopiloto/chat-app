# Spec Delta

## MODIFIED Requirements

### Requirement: Pré-entrada com escolha de participação
O sistema SHALL entrar automaticamente numa chamada ao abrir um canal de voz acessível através de uma navegação ocorrida durante a sessão já aberta da aplicação (ex.: clicar num canal de voz), sem pré-entrada nem confirmação nesse caso. Quando o canal de voz já é a rota activa no primeiro carregamento da página — recarregar a página, reabrir uma aba restaurada pelo browser, ou abrir um link directo apontando para o canal — o sistema SHALL NOT entrar automaticamente; em vez disso SHALL mostrar um modal que exige uma acção explícita da pessoa (entrar ou recusar) antes de ligar ao canal. Quem pode falar, ao entrar (automaticamente ou após confirmação explícita), SHALL entrar em modo de fala com microfone conforme a preferência guardada (ligado por omissão) e câmara desligada independentemente da preferência de câmara guardada. Quem apenas pode ouvir SHALL entrar em escuta sem publicar microfone nem câmara. O acesso SHALL seguir o nível efectivo calculado pelo servidor, sem depender de cargo atribuído. «Testar vídeo» sintético SHALL NOT aparecer.

#### Scenario: Convidado sem cargo entra a falar
- **WHEN** um convidado sem cargo e com acesso para falar abre um canal de voz sem preferência de microfone guardada, navegando para ele durante a sessão já aberta
- **THEN** entra directamente com microfone ligado e câmara desligada

#### Scenario: Testar vídeo sem expor a câmara real
- **WHEN** um falante com preferência anterior de câmara ligada abre um canal de voz, navegando para ele durante a sessão já aberta
- **THEN** entra com câmara desligada e a opção «Testar vídeo» sintético não é oferecida; pode testar a câmara nas definições

#### Scenario: Utilizador só com permissão de ouvir
- **WHEN** uma pessoa com permissão apenas de ouvir abre um canal de voz, navegando para ele durante a sessão já aberta
- **THEN** entra directamente em escuta sem microfone ou câmara

#### Scenario: Cargo sem permissão de falar
- **WHEN** o cargo do utilizador não inclui falar ou o canal apenas permite ouvir, e a pessoa navega para o canal durante a sessão já aberta
- **THEN** entra directamente em modo de escuta sem publicar microfone ou câmara

#### Scenario: Falha de entrada
- **WHEN** o join automático, numa navegação dentro da sessão, falha
- **THEN** aparece o motivo, uma acção de tentar novamente e acesso às definições de dispositivos, sem nova tentativa automática

#### Scenario: Recarregar a página enquanto a rota já aponta para um canal de voz
- **WHEN** a pessoa estava numa chamada, fecha a aba/aplicação ou recarrega a página, e a URL restaurada no carregamento seguinte já aponta para esse canal de voz
- **THEN** a pessoa NÃO é reconectada automaticamente à chamada; vê um modal pedindo confirmação explícita, com as opções de entrar ou recusar, antes de qualquer ligação ao canal

#### Scenario: Link directo para um canal de voz
- **WHEN** a pessoa abre um link que aponta directamente para um canal de voz, sem a aplicação já estar aberta numa outra rota antes
- **THEN** a pessoa NÃO é conectada automaticamente à chamada; vê o mesmo modal de confirmação, com as opções de entrar ou recusar

#### Scenario: Confirmação explícita entra com as mesmas regras de permissão
- **WHEN** a pessoa escolhe entrar no modal de confirmação mostrado por carregamento de página ou link directo
- **THEN** a entrada segue exactamente as mesmas regras de modo (falar/escuta) e dispositivos (microfone conforme preferência, câmara sempre desligada) que a entrada automática por navegação dentro da sessão

#### Scenario: Recusar explicitamente a entrada
- **WHEN** a pessoa escolhe recusar no modal de confirmação, num servidor que tem pelo menos um canal de texto
- **THEN** a pessoa não liga à chamada e é levada para o primeiro canal de texto desse servidor

#### Scenario: Recusar num servidor sem canal de texto
- **WHEN** a pessoa escolhe recusar no modal de confirmação, num servidor sem nenhum canal de texto
- **THEN** a pessoa não liga à chamada e é levada para a vista do servidor, sem nenhum canal seleccionado
