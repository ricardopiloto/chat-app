# Spec Delta

## MODIFIED Requirements

### Requirement: Pré-entrada com escolha de participação
O sistema SHALL entrar automaticamente numa chamada ao abrir um canal de voz acessível, sem pré-entrada nem confirmação. Quem pode falar SHALL entrar em modo de fala com microfone conforme a preferência guardada (ligado por omissão) e câmara desligada independentemente da preferência de câmara guardada. Quem apenas pode ouvir SHALL entrar em escuta sem publicar microfone nem câmara. O acesso SHALL seguir o nível efectivo calculado pelo servidor, sem depender de cargo atribuído. «Testar vídeo» sintético SHALL NOT aparecer.

#### Scenario: Convidado sem cargo entra a falar
- **WHEN** um convidado sem cargo e com acesso para falar abre um canal de voz sem preferência de microfone guardada
- **THEN** entra directamente com microfone ligado e câmara desligada

#### Scenario: Testar vídeo sem expor a câmara real
- **WHEN** um falante com preferência anterior de câmara ligada abre um canal de voz
- **THEN** entra com câmara desligada e a opção «Testar vídeo» sintético não é oferecida; pode testar a câmara nas definições

#### Scenario: Utilizador só com permissão de ouvir
- **WHEN** uma pessoa com permissão apenas de ouvir abre um canal de voz
- **THEN** entra directamente em escuta sem microfone ou câmara

#### Scenario: Cargo sem permissão de falar
- **WHEN** o cargo do utilizador não inclui falar ou o canal apenas permite ouvir
- **THEN** entra directamente em modo de escuta sem publicar microfone ou câmara

#### Scenario: Falha de entrada
- **WHEN** o join automático falha
- **THEN** aparece o motivo, uma acção de tentar novamente e acesso às definições de dispositivos, sem nova tentativa automática

### Requirement: Pré-entrada e roster fiéis aos mockups
O sistema SHALL preservar o roster de voz na sidebar e o acesso às definições de dispositivos fora da chamada. A checklist de fidelidade da pré-entrada do mockup SHALL deixar de se aplicar. Telemetria, codec, ruído neural, eco e AGC SHALL NOT ser implementados.

#### Scenario: Comparação de fidelidade
- **WHEN** há ocupantes num canal de voz que ainda não foi aberto
- **THEN** o roster na sidebar mostra quem já está no canal sem tela de pré-entrada

### Requirement: Paridade funcional da sessão de voz
O sistema SHALL manter as funcionalidades existentes desta área compatíveis com entrada directa: escuta para quem não pode falar, entrada só áudio se a câmara falhar quando ligada, libertação do hardware ao sair, mudança de canal, controlos de chamada, blur em três níveis, indicadores de fala, roster na sidebar, duração, E2EE desligada com faixa e Religar, saída por canal ou servidor apagado, e áudio remoto contínuo ao navegar. A pré-entrada, a entrada com câmara ligada e «Testar vídeo» sintético deixam de ser requisitos de paridade.

#### Scenario: Funcionalidades existentes
- **WHEN** os itens ainda aplicáveis de `docs/v2/parity-checklist.md` são exercidos
- **THEN** produzem os resultados documentados para a entrada directa

### Requirement: Desligar a câmara liberta a câmara
O sistema SHALL, quando o utilizador desliga a câmara (controlo da chamada ou teste da página de Áudio & Vídeo), parar a captura da câmara física, parar o processamento de vídeo associado (incluindo o desfoque) e deixar de enviar vídeo aos outros participantes. Ao voltar a ligar a câmara, o sistema SHALL retomar o desfoque escolhido sem reiniciar a chamada. Nenhuma faixa de captura de vídeo SHALL ficar ativa depois de a câmara ser desligada.

#### Scenario: Desligar a câmara na chamada com desfoque
- **WHEN** o utilizador está numa chamada com Blur forte e carrega em desligar a câmara
- **THEN** o indicador da câmara do navegador apaga-se, não resta nenhuma faixa de captura de vídeo ativa e os outros participantes veem o avatar em vez do vídeo, sem imagem congelada

#### Scenario: Desligar a câmara sem desfoque
- **WHEN** o utilizador está numa chamada com Sem blur e desliga a câmara
- **THEN** o mesmo: câmara física libertada e nenhum vídeo enviado

#### Scenario: Voltar a ligar
- **WHEN** o utilizador volta a ligar a câmara depois de a desligar
- **THEN** o vídeo volta, com o desfoque escolhido aplicado, sem reentrar na chamada

#### Scenario: Pré-entrada e página de Áudio & Vídeo
- **WHEN** o utilizador para o teste de câmara nas definições, com desfoque ativo
- **THEN** a câmara física é libertada e a pré-visualização fica vazia

#### Scenario: Sair da chamada
- **WHEN** o utilizador sai da chamada com a câmara ligada
- **THEN** nenhuma faixa de captura de vídeo fica ativa
