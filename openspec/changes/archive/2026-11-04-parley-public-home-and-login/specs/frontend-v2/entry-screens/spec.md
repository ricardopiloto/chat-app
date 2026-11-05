# Spec Delta

## Purpose

Define qual tela de entrada aparece em cada situação (navegador, desktop, sessão), quais comportamentos de cadastro e login permanecem intactos e como os controles das telas de entrada mantêm uma aparência coesa usando apenas o sistema de design existente.

## ADDED Requirements

### Requirement: A tela de entrada segue a situação do visitante
O sistema SHALL preservar os caminhos especiais antes de escolher a entrada: `/invite/<código>` abre a prévia `Invite`; `/?invite=<código>`, `/register`, `?signin`, `#email_token=` e `/recover` abrem o fluxo de autenticação correspondente. Com sessão válida, SHALL abrir a aplicação ou o desbloqueio, conforme o estado da identidade; o pop-out de chamada e `/__foundation` SHALL manter suas telas existentes. Enquanto a sessão está carregando, SHALL mostrar o estado de carregamento existente, exceto no desktop sem instância guardada, que SHALL mostrar a tela inicial imediatamente. No desktop com sessão anônima, SHALL mostrar a tela inicial independentemente do `pathname` (inclusive `/index.html`), até a pessoa escolher entrar ou criar conta. No navegador sem sessão, `/` SHALL mostrar a página pública imediatamente e consultar o estado da instância em segundo plano: somente `initial_setup: true` SHALL levar automaticamente ao cadastro da primeira conta. Depois de criada a primeira conta, `/` SHALL permanecer na página pública até a pessoa escolher «Entrar». Outros caminhos SHALL abrir o login. Falha, resposta `429` ou tempo limite na consulta SHALL ser tratados como instância já configurada.

A página pública SHALL existir somente no navegador; no aplicativo desktop SHALL NOT ser exibida em nenhuma situação, e a primeira tela do aplicativo é o login simplificado (tela inicial do desktop). A decisão SHALL seguir uma ordem única e testável por função pura, e o login aberto por `/login` SHALL retornar a `/` (com `replace`) depois de entrar.

#### Scenario: Aplicativo sem página pública
- **WHEN** o aplicativo desktop abre, com ou sem instância guardada e com qualquer `pathname`
- **THEN** a página pública não aparece; aparece a tela inicial do desktop (sessão anônima) ou o fluxo de sessão existente

#### Scenario: Trocar de conta
- **WHEN** a pessoa escolhe «Trocar de conta» no desbloqueio ou no menu da conta
- **THEN** a sessão termina e a web abre `/login`; no desktop, `nativeEntry` volta a `"home"` e a tela inicial abre com a instância atual selecionada

#### Scenario: Voltar ao início na primeira conta
- **WHEN** a instância está em configuração inicial no navegador
- **THEN** o cadastro não mostra «Voltar ao início», evitando retornar a uma página que redireciona de volta

#### Scenario: Link de convite
- **WHEN** um visitante sem sessão abre `/invite/<código>`
- **THEN** a prévia `Invite` abre, sem passar pela página pública

#### Scenario: Convite pela query
- **WHEN** um visitante sem sessão abre `/?invite=<código>`
- **THEN** o cadastro abre com o código preenchido, sem passar pela página pública

#### Scenario: Link de confirmação de e-mail
- **WHEN** um visitante abre `/register#email_token=<token>`
- **THEN** o cadastro abre com o e-mail verificado, e a página pública não aparece nem consome o token

#### Scenario: Instância nova
- **WHEN** um visitante abre `/` numa instância cujo estado informa `initial_setup: true`
- **THEN** a página pública aparece imediatamente e é substituída pelo cadastro da primeira conta quando a consulta confirma `initial_setup: true`

#### Scenario: Visitante comum no navegador
- **WHEN** um visitante sem sessão abre `/` numa instância já configurada
- **THEN** a página pública aparece e nenhum pedido autenticado é feito

#### Scenario: Instância já configurada
- **WHEN** a primeira conta já existe e um visitante sem sessão abre `/`
- **THEN** a página pública permanece até a pessoa escolher «Entrar»

#### Scenario: Estado da instância ilegível
- **WHEN** a leitura do estado da instância falha, responde `429` ou excede o tempo limite
- **THEN** a página pública aparece, e «Entrar» continua levando ao login

#### Scenario: Desktop sem instância
- **WHEN** o desktop abre `mesa://app/index.html` sem instância guardada e a sessão ainda está carregando
- **THEN** a tela inicial do desktop aparece independentemente do caminho `/index.html`

#### Scenario: Sessão existente
- **WHEN** a pessoa já tem sessão e abre `/`
- **THEN** a aplicação (ou o desbloqueio, se a identidade estiver bloqueada) abre, e a página pública não aparece

### Requirement: Os fluxos de cadastro e de login permanecem intactos
As mudanças visuais e de navegação desta change SHALL NOT alterar o comportamento dos fluxos de autenticação: login com identificador (handle) e senha; cadastro com e-mail verificado quando o registro está aberto; cadastro com convite; cadastro da primeira conta; escolha da chave de recuperação; recuperação de senha; desbloqueio e recuperação de identidade. Os campos enviados, a ordem das etapas, as mensagens de erro por código, a verificação do token de e-mail e as regras de convite SHALL permanecer como especificados em `auth` e `auth/email-registration`. A tela de login SHALL continuar pedindo o identificador da conta (não o e-mail) e SHALL NOT exibir nem enviar o e-mail como credencial.

#### Scenario: Login
- **WHEN** a pessoa informa identificador e senha corretos na tela de login
- **THEN** a sessão é estabelecida pelo mesmo contrato de antes, sem campo ou etapa nova

#### Scenario: Cadastro com e-mail
- **WHEN** o registro está aberto e a pessoa pede a verificação, abre o link recebido e conclui o cadastro
- **THEN** o e-mail verificado é exibido, o convite é opcional e a conta é criada como antes

#### Scenario: Cadastro com e-mail no aplicativo
- **WHEN** o aplicativo desktop abre «Criar uma conta» numa instância com registro aberto
- **THEN** o mesmo cadastro com pedido de verificação por e-mail do navegador é exibido, com os mesmos campos, etapas e mensagens, sem tela de marketing antes dele

#### Scenario: Cadastro sem e-mail
- **WHEN** o registro está fechado ou a pessoa usa «Tenho um convite»
- **THEN** o formulário com convite aparece e cria a conta como antes, sem pedir e-mail

#### Scenario: Primeira conta da instância
- **WHEN** a instância está em configuração inicial
- **THEN** o cadastro mostra a introdução da instância, dispensa o convite e propõe a chave de recuperação, como antes

#### Scenario: Recuperação continua acessível
- **WHEN** a pessoa está no login ou no desbloqueio
- **THEN** «Esqueci a senha» (login) e «Recuperar identidade» (desbloqueio) continuam visíveis sem exigir uma tentativa falha

### Requirement: Controles das telas de entrada têm uma só escala visual
Nas telas de entrada (página pública, tela inicial do desktop, login, cadastro, desbloqueio, recuperação e seus diálogos) os botões, os alternadores e as caixas de texto SHALL vir dos componentes e classes já existentes do sistema de design, com os mesmos tokens de cor, raio, borda e foco. Botões e caixas de texto lado a lado ou empilhados no mesmo grupo SHALL ter a mesma altura, com diferença de no máximo 1 px medida na página renderizada. O alternador de tema e o de idioma SHALL ter o mesmo formato (pílula), a mesma borda e o mesmo estado ativo. O estado de foco por teclado SHALL ser visível e igual em todos esses controles. Nenhuma cor SHALL ser escrita como valor literal nos componentes novos; todas SHALL vir dos tokens, nos dois temas.

#### Scenario: Botão e caixa no mesmo grupo
- **WHEN** um botão de ação e uma caixa de texto aparecem juntos (por exemplo, o endereço da instância e «Usar esta instância»)
- **THEN** ambos têm a mesma altura renderizada (diferença de até 1 px)

#### Scenario: Alternadores de tema e idioma
- **WHEN** o cabeçalho de uma tela de entrada mostra os dois alternadores
- **THEN** ambos são pílulas com a mesma borda, o mesmo preenchimento e o mesmo destaque do item ativo

#### Scenario: Dois temas
- **WHEN** a pessoa alterna entre tema claro e escuro em qualquer tela de entrada
- **THEN** todos os controles mantêm contraste legível e nenhum usa cor fixa fora dos tokens

#### Scenario: Foco por teclado
- **WHEN** a pessoa percorre a tela com Tab
- **THEN** cada botão, link, alternador e campo mostra o mesmo indicador de foco

### Requirement: O sistema de design não é alterado
Esta change SHALL NOT modificar `tokens.css`, `tailwind.config.ts`, `components/ui.css` nem os arquivos de `components/ui/`. Os elementos que o protótipo desenha de forma diferente do sistema (canto de 9 px nos botões, cor creme, `<select>` de tema, barra de título própria) SHALL seguir o sistema existente; qualquer necessidade nova de estilo SHALL ser atendida por composição das classes existentes ou por estilo local da tela, nunca por mudança nos arquivos acima.

#### Scenario: Diferença contra a base
- **WHEN** se compara o resultado da change com o estado anterior
- **THEN** os arquivos do sistema de design listados acima não aparecem como modificados

#### Scenario: Botão do protótipo
- **WHEN** o protótipo mostra um botão com canto de 9 px
- **THEN** a implementação usa o botão em pílula do sistema, e o desvio fica registrado no relatório de fidelidade
