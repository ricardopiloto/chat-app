# Spec Delta

## Purpose

Dá ao aplicativo desktop uma primeira tela acolhedora que mostra a instância escolhida, leva a entrar ou criar conta e, para quem já tem conta neste dispositivo, apresenta o desbloqueio como retorno à conversa.

## ADDED Requirements

### Requirement: Tela inicial do desktop
No shell nativo, com sessão anônima ou sem instância guardada, a primeira tela SHALL mostrar a marca com o mascote, o título e o texto de boas-vindas, o painel «Instância selecionada», as ações «Entrar» e «Criar uma conta», a nota de que a conta pertence à instância do grupo, o acesso «Conheça o Parley» e o rodapé com o aviso de criptografia de ponta a ponta. Sem instância guardada, a tela SHALL aparecer mesmo enquanto a sessão está em `loading`. A escolha da tela SHALL ignorar o `pathname` do documento nativo (`/index.html`). A tela SHALL usar a decoração nativa da janela e SHALL NOT desenhar barra de título própria. O tema e o idioma SHALL ser alteráveis na tela pelos alternadores do sistema.

#### Scenario: Primeira execução
- **WHEN** o aplicativo abre sem instância guardada
- **THEN** o painel mostra que nenhuma instância foi escolhida, oferece «Escolher», e a tela não exibe barra de título própria

#### Scenario: Instância já guardada
- **WHEN** o aplicativo abre com instância guardada e sessão anônima
- **THEN** o painel mostra o endereço guardado (apenas o host) com a ação «Alterar», e «Entrar» e «Criar uma conta» seguem para a autenticação dessa instância

#### Scenario: Conheça o Parley
- **WHEN** a pessoa ativa «Conheça o Parley»
- **THEN** o guia do projeto abre no navegador do sistema e a janela do aplicativo permanece como estava

### Requirement: Escolher a instância em diálogo, com validação
«Escolher» e «Alterar» no painel, e «Entrar» ou «Criar uma conta» sem instância guardada, SHALL abrir um diálogo que pede o endereço, valida-o contactando `GET /health` da instância e só então o guarda. Falhas (vazio, protocolo, endereço inválido, inacessível, resposta inesperada) SHALL mostrar o motivo no diálogo sem guardar nada. Depois de guardar com sucesso o diálogo SHALL fechar e, se a pessoa tinha pedido «Entrar» ou «Criar uma conta», a autenticação correspondente SHALL abrir.

#### Scenario: Endereço válido após «Entrar»
- **WHEN** a pessoa ativa «Entrar» sem instância, informa um endereço cujo `/health` responde
- **THEN** a instância é guardada e o login abre em modo de entrada

#### Scenario: Endereço inacessível
- **WHEN** o endereço não responde ou responde com erro
- **THEN** o diálogo explica a falha, nada é guardado e a pessoa pode corrigir o endereço

#### Scenario: Cancelar
- **WHEN** a pessoa fecha o diálogo sem confirmar
- **THEN** a instância anterior (ou nenhuma) permanece e a tela inicial continua exibida

### Requirement: Entrar e criar conta abrem a autenticação da instância
Com instância guardada, «Entrar» SHALL abrir o login e «Criar uma conta» SHALL abrir o cadastro, ambos como especificado em `auth` e `auth/email-registration`, incluindo o cadastro por e-mail verificado ou por convite conforme o modo da instância. A tela de autenticação aberta assim SHALL oferecer «Voltar ao início», que retorna à tela inicial do desktop sem esquecer a instância.

#### Scenario: Cadastro com e-mail no aplicativo
- **WHEN** a pessoa ativa «Criar uma conta» numa instância com registro aberto
- **THEN** o cadastro abre com o pedido de verificação por e-mail, como no navegador, e o comportamento do link recebido (aberto no navegador do sistema) permanece o de hoje

#### Scenario: Sem página de marketing
- **WHEN** a pessoa abre o aplicativo
- **THEN** a primeira tela é o login simplificado desta spec; nenhuma página de apresentação do produto é exibida dentro do aplicativo

#### Scenario: Criar conta
- **WHEN** a pessoa ativa «Criar uma conta» numa instância com registro aberto
- **THEN** o cadastro abre no passo de pedir o e-mail, com a opção «Tenho um convite», como antes

#### Scenario: Voltar ao início
- **WHEN** a pessoa ativa «Voltar ao início» na autenticação
- **THEN** a tela inicial volta, com a mesma instância selecionada

#### Scenario: Recarregar e terminar sessão
- **WHEN** a janela é recarregada, a sessão termina ou a pessoa troca de conta ou instância
- **THEN** a próxima entrada anônima começa na tela inicial, sem preservar a escolha anterior de login ou cadastro

### Requirement: Conta salva neste dispositivo
Quando existe sessão da instância mas a identidade está bloqueada, o desktop SHALL abrir a tela de desbloqueio com o visual de «conta salva»: título de retorno, cartão com nome e identificador da conta e a etiqueta «Neste dispositivo», painel da instância da conta (apenas leitura, com «Usar outra conta ou instância»), campo da senha do cofre com «Mostrar/Ocultar» operável por teclado e «Desbloquear». A tela SHALL manter todas as ações e avisos do desbloqueio especificado em `auth`: a recuperação de identidade permanece visível, com o aviso exato das consequências; o aviso de cofre ausente continua aparecendo quando aplicável; e «Trocar de conta» continua disponível. A tela SHALL NOT sugerir que trocar a senha da conta recupera as chaves do cofre.

#### Scenario: Senha correta
- **WHEN** a pessoa informa a senha do cofre correta
- **THEN** a identidade é desbloqueada como antes e a aplicação abre

#### Scenario: Senha incorreta
- **WHEN** a senha não abre o cofre
- **THEN** a tela mostra o erro genérico de senha incorreta ou cofre ilegível, sem revelar qual das condições falhou

#### Scenario: Recuperar identidade continua visível
- **WHEN** a tela de conta salva é exibida
- **THEN** a ação de recuperar identidade está visível sem exigir tentativa falha, e sua confirmação traz o aviso exato já especificado

#### Scenario: Usar outra conta ou instância
- **WHEN** a pessoa ativa «Usar outra conta ou instância»
- **THEN** a sessão atual termina como em «Trocar de conta», e a tela inicial abre com a instância atual selecionada, com a ação de alterá-la à vista
