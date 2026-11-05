# Spec Delta

## MODIFIED Requirements

### Requirement: Ecrãs de autenticação fiéis aos mockups
Os ecrãs de login, de registo e de desbloqueio SHALL seguir a proposta visual `propostas/parley-electron` (tela inicial e conta salva) e a identidade da página pública `propostas/parley-home`. O login e o registo SHALL ser apresentados num cartão único, em que o controlo segmentado alterna «Entrar» e «Criar conta»; o cartão SHALL usar o mascote, a marca «Parley», o título e o texto da proposta e a linha «Conversas com criptografia de ponta a ponta». O conteúdo de «Criar conta» SHALL obedecer ao modo de registo da instância já lido pela aplicação: com registo aberto, o pedido de verificação por e-mail (com «Tenho um convite» como alternativa e o token do link abrindo o formulário com o e-mail verificado); com registo fechado, o formulário com convite, sem pedir e-mail; na primeira conta da instância, o registo inicial sem convite e sem o controlo segmentado; se a configuração ainda não chegou ou falhou, o comportamento anterior à change. O desbloqueio e o diálogo da instância mantêm a apresentação própria. O cabeçalho SHALL oferecer os alternadores de tema e de idioma do sistema e, no desktop, o ecrã SHALL mostrar a instância em uso com a acção de a alterar. Os formulários SHALL manter os mesmos campos (handle com prefixo `@`, senha, convite, chave de recuperação), o controlo segmentado entrar/criar conta, o link «Esqueci a senha», o separador e a acção secundária, sem elementos novos de credencial (o e-mail NÃO é pedido no login). O ecrã de desbloqueio SHALL cumprir também o requisito «Conta salva neste dispositivo» de `electron-home` quando mostrado no desktop, e, no navegador, SHALL apresentar o mesmo cartão da conta e o mesmo campo de senha do cofre sem o painel da instância. Os ecrãs `/recover` e de chave de recuperação do registo SHALL continuar **Adaptados**, construídos só com componentes e tokens do sistema de design existente. Os desvios em relação aos protótipos (botões em pílula em vez de canto de 9 px, tokens do sistema em vez do creme do protótipo, alternadores do sistema em vez de `<select>`, decoração nativa da janela em vez de barra de título própria, handle em vez de e-mail no login) SHALL ser registados no relatório de fidelidade.

#### Scenario: Comparação de fidelidade
- **WHEN** o ecrã de login, de registo ou de desbloqueio é comparado com o protótipo no mesmo estado, em tema escuro e em tema claro
- **THEN** todos os elementos obrigatórios do protótipo estão presentes, nenhum elemento fora de escopo foi acrescentado e os únicos desvios são os registados no relatório de fidelidade

#### Scenario: Login continua com handle
- **WHEN** o ecrã de login é exibido
- **THEN** pede handle e senha, mantém «Esqueci a senha» e não pede nem envia e-mail como credencial

#### Scenario: Voltar ao início no sistema de design
- **WHEN** o cartão mostra «Voltar ao início» (navegador fora da primeira conta, ou desktop)
- **THEN** a ação é um botão do sistema de design com ícone, na altura comum dos controles e no cabeçalho do cartão, e não um link com estilo próprio

#### Scenario: Alternador visível no cadastro por e-mail
- **WHEN** o registo está aberto e a pessoa está em «Criar conta» no pedido de verificação por e-mail
- **THEN** o controlo segmentado «Entrar»/«Criar conta» continua visível no topo do cartão, com «Criar conta» selecionado, e escolher «Entrar» mostra o formulário de login

#### Scenario: Cartão segue o modo de registo
- **WHEN** a pessoa escolhe «Criar conta» no cartão numa instância com registo aberto, depois com registo fechado, e depois numa instância em configuração inicial
- **THEN** vê, respetivamente, o pedido de verificação por e-mail, o formulário com convite sem e-mail, e o registo inicial sem convite nem controlo segmentado

#### Scenario: Ecrã estreito
- **WHEN** o ecrã de autenticação é aberto com 390 px de largura
- **THEN** o cartão ocupa a largura disponível, o controlo segmentado e os formulários cabem sem rolagem horizontal e os controlos mantêm a altura comum definida em `entry-screens`
