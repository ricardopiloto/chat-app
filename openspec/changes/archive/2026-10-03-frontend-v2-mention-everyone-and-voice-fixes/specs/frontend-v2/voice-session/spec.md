# Spec Delta

## MODIFIED Requirements

### Requirement: Pré-entrada com escolha de participação
O sistema SHALL apresentar, antes de entrar numa chamada, uma pré-visualização (câmara real quando o utilizador a liga, com selector de blur, alternadores de câmara e microfone e medidor de nível do microfone), a lista de quem está no canal e três acções: "Entrar" (com câmara/microfone conforme a preferência guardada do utilizador), "Testar vídeo" (entra usando uma faixa de vídeo sintética/padrão de teste em vez da câmara real), e "Entrar (ouvir)" para utilizadores cuja permissão no canal é apenas ouvir. A decisão de oferecer só "Entrar (ouvir)" SHALL basear-se exclusivamente no nível de acesso que o servidor calculou para o utilizador nesse canal; SHALL NOT depender de o utilizador ter um cargo atribuído.

#### Scenario: Testar vídeo sem expor a câmara real
- **WHEN** o utilizador escolhe "Testar vídeo"
- **THEN** entra na chamada com uma faixa de vídeo sintética, sem activar a câmara física

#### Scenario: Utilizador só com permissão de ouvir
- **WHEN** um utilizador cuja permissão no canal não inclui falar tenta entrar
- **THEN** a única opção disponível é "Entrar (ouvir)", sem opção de activar microfone ou câmara

#### Scenario: Convidado sem cargo entra a falar
- **WHEN** alguém entrou no servidor por convite, não tem nenhum cargo e abre um canal de voz público
- **THEN** a pré-entrada oferece "Entrar", "Testar vídeo" e os alternadores de microfone e câmara, e ele pode ligar microfone e câmara na chamada

#### Scenario: Cargo sem permissão de falar
- **WHEN** o cargo do utilizador não inclui "falar", ou o canal lhe dá apenas o nível de ouvir
- **THEN** só "Entrar (ouvir)" fica disponível, como acima

## ADDED Requirements

### Requirement: Desligar a câmara liberta a câmara
O sistema SHALL, quando o utilizador desliga a câmara (alternador da pré-entrada, controlo da chamada ou teste da página de Áudio & Vídeo), parar a captura da câmara física, parar o processamento de vídeo associado (incluindo o desfoque) e deixar de enviar vídeo aos outros participantes. Ao voltar a ligar a câmara, o sistema SHALL retomar o desfoque escolhido sem reiniciar a chamada. Nenhuma faixa de captura de vídeo SHALL ficar ativa depois de a câmara ser desligada.

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
- **WHEN** o utilizador desliga a câmara na pré-entrada ou para o teste de câmara nas definições, com desfoque ativo
- **THEN** a câmara física é libertada e a pré-visualização fica vazia

#### Scenario: Sair da chamada
- **WHEN** o utilizador sai da chamada com a câmara ligada
- **THEN** nenhuma faixa de captura de vídeo fica ativa
