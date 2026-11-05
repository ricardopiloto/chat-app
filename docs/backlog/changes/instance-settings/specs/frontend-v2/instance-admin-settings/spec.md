# Spec Delta

## Purpose

Dá ao administrador um assistente de primeiro uso e uma tela de configurações da instância no navegador e no app, que usam o mesmo design system e tornam desnecessário editar arquivos na máquina.

## ADDED Requirements

### Requirement: O assistente conduz a primeira configuração
Na primeira utilização de uma instância sem administrador, o cliente SHALL apresentar um assistente que pede o token de configuração e cria a conta do administrador, e depois conduz por: endereço público e HTTPS, registro (fechado ou aberto), e-mail (opcional), voz e revisão. Cada passo após a criação da conta SHALL ter um padrão seguro e poder ser pulado, e o assistente SHALL poder ser retomado depois pela tela de configurações. O assistente SHALL mostrar, antes de aplicar, o que será configurado e se haverá reinício.

#### Scenario: Primeiro uso
- **WHEN** a pessoa abre a instância sem administrador e informa o token correto
- **THEN** cria a conta de administrador e segue para o próximo passo

#### Scenario: Token ausente
- **WHEN** a pessoa tenta criar a conta sem o token ou com um token errado
- **THEN** o cliente explica o erro sem revelar detalhes além do necessário e permite tentar de novo

#### Scenario: Pular passos
- **WHEN** a pessoa pula todos os passos opcionais
- **THEN** a instância fica funcional com os padrões seguros e a pessoa pode configurar o resto depois

#### Scenario: Revisão com reinício
- **WHEN** as escolhas exigem reinício
- **THEN** a revisão informa isso e a ação «Aplicar e reiniciar» explica que a conexão será interrompida por instantes

### Requirement: O assistente e o cadastro do administrador funcionam na web e no app
O cadastro guiado do primeiro administrador (com o campo do token) SHALL aparecer na instância em configuração tanto no navegador quanto no app nativo com uma instância guardada, independentemente do caminho do documento, e SHALL receber o token automaticamente quando o app estiver hospedando a instância local. O assistente de configuração SHALL abrir uma vez no primeiro login do administrador.

#### Scenario: App nativo com instância em configuração
- **WHEN** o app nativo abre uma instância guardada que está em configuração inicial
- **THEN** mostra o cadastro guiado do administrador

#### Scenario: Primeiro login
- **WHEN** o administrador entra pela primeira vez depois de criar a conta
- **THEN** o assistente de configuração abre uma vez

### Requirement: Ações sensíveis pedem a senha no cliente
Antes de reiniciar, alterar o endereço, o TLS ou o domínio, substituir segredos ou alterar caminhos de dados, o cliente SHALL pedir a senha do administrador em um diálogo e SHALL repetir a ação com a credencial recebida. O cliente SHALL exibir, quando existir, o último erro de aplicação de configuração.

#### Scenario: Reiniciar
- **WHEN** o administrador ativa «Aplicar e reiniciar»
- **THEN** o cliente pede a senha, e só depois envia o pedido

#### Scenario: Configuração que caiu para a anterior
- **WHEN** a última configuração aplicada falhou e o servidor voltou à anterior
- **THEN** a tela mostra o motivo da falha

### Requirement: Mudanças de rede mostram uma janela de confirmação
Ao aplicar uma mudança de endereço público, proxy confiável, TLS/domínio ou endereço de escuta, o cliente SHALL mostrar uma contagem regressiva e um botão «Confirmar» que, ao ser ativado, envia a confirmação. Se a contagem terminar sem confirmação, o cliente SHALL informar que a configuração anterior foi restaurada. O assistente SHALL usar o mesmo mecanismo.

#### Scenario: Confirmar
- **WHEN** o administrador aplica um novo endereço e ativa «Confirmar» antes do fim da contagem
- **THEN** a mudança fica definitiva e a contagem some

#### Scenario: Mudança de origem
- **WHEN** o administrador aplica uma mudança que troca a porta ou o esquema do endereço
- **THEN** o cliente abre a nova origem, confirma de lá dentro do prazo e, se não conseguir alcançá-la, a configuração anterior é restaurada

#### Scenario: Contagem esgotada
- **WHEN** a contagem termina sem confirmação
- **THEN** o cliente informa que a configuração anterior foi restaurada e mostra o motivo

### Requirement: A tela de configurações é exclusiva do administrador
O cliente SHALL oferecer «Configurações da instância» somente à conta do administrador, agrupando as configurações por assunto (endereço e rede, registro e convites, sessão, e-mail, anti-abuso, voz). Contas comuns SHALL NOT ver o acesso nem conseguir abrir a rota. Cada campo SHALL mostrar sua origem e, quando definido por variável de ambiente, SHALL aparecer travado com a explicação. Segredos SHALL aparecer em campos mascarados (asteriscos) que podem ser editados e salvos, SHALL NOT conter o valor real em nenhum momento (nem no DOM, nem no estado do cliente, nem na área de transferência) e, ao serem copiados, SHALL copiar apenas a máscara. Campos com valor padrão SHALL aparecer já preenchidos com o padrão e poder ser editados. Alterações que exigem reinício SHALL ser sinalizadas como pendentes; as alterações de caminhos de dados (banco, anexos, avatares) SHALL exibir uma nota informando que exigem reiniciar o backend diretamente no host e que o botão «Aplicar e reiniciar» não as aplica.

#### Scenario: Conta comum
- **WHEN** uma conta que não é a do administrador procura as configurações
- **THEN** não encontra o acesso e abrir a rota diretamente mostra uma recusa

#### Scenario: Campo travado
- **WHEN** um campo é definido por variável de ambiente
- **THEN** aparece desabilitado com «definido por variável de ambiente»

#### Scenario: Segredo configurado
- **WHEN** o e-mail já tem chave configurada
- **THEN** o campo mostra asteriscos, permite substituir e não exibe o valor atual

#### Scenario: Copiar um segredo
- **WHEN** o administrador seleciona e copia o campo de um segredo
- **THEN** a área de transferência recebe apenas os asteriscos e nunca o valor real

#### Scenario: Segredo definido por variável de ambiente
- **WHEN** um segredo vem de variável de ambiente
- **THEN** o campo aparece mascarado e travado, com a origem indicada

#### Scenario: Padrão preenchido
- **WHEN** o administrador abre a seção de dados
- **THEN** os caminhos do banco, dos anexos e dos avatares aparecem preenchidos com o padrão e editáveis

#### Scenario: Nota de reinício no host
- **WHEN** o administrador altera o caminho do banco
- **THEN** a tela mostra que a mudança exige reiniciar o backend diretamente no host, oferece copiar ou não os dados existentes e não oferece «Aplicar e reiniciar» para essa alteração

#### Scenario: Alteração pendente
- **WHEN** o administrador altera a porta
- **THEN** a tela mostra a alteração como pendente de reinício e oferece «Aplicar e reiniciar»

### Requirement: A tela orienta sobre o que a interface não pode fazer
A tela SHALL listar as portas que precisam estar abertas no firewall e no roteador para o estado atual, SHALL mostrar o resultado do diagnóstico de alcance quando existir e SHALL explicar que abrir portas é ação do dono da máquina. A tela SHALL NOT oferecer atualizar o programa do servidor, fazer backup ou restaurar dados.

#### Scenario: Portas necessárias
- **WHEN** o administrador abre a seção de endereço e rede
- **THEN** vê as portas necessárias e a orientação para abri-las

### Requirement: As telas seguem o design system, a acessibilidade e as traduções
O assistente e a tela SHALL usar os tokens, componentes e temas do aplicativo, SHALL ser operáveis por teclado com foco visível, SHALL funcionar sem rolagem horizontal em 390, 768 e 1280 px e SHALL ter todo texto visível em pt-BR e en pelo motor de internacionalização.

#### Scenario: Teclado e largura
- **WHEN** a tela é usada só por teclado em 390 px
- **THEN** todos os campos e ações são alcançáveis, na ordem visual, sem rolagem horizontal

#### Scenario: Idioma
- **WHEN** a pessoa troca o idioma
- **THEN** todos os textos, rótulos e mensagens de erro da tela mudam
