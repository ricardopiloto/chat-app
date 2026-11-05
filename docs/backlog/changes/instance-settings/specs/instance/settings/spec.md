# Spec Delta

## Purpose

Permite que o administrador configure a instância pelo próprio sistema, sem acesso à máquina, preservando a configuração por variáveis de ambiente de quem já opera dessa forma e protegendo os segredos.

## ADDED Requirements

### Requirement: O valor efetivo de cada configuração segue uma precedência fixa
Cada configuração da instância SHALL ter como valor efetivo, nesta ordem: o valor da variável de ambiente correspondente, se definida; o valor gravado pelo administrador; o valor padrão. A resposta de configuração SHALL informar, para cada chave, o valor efetivo (exceto segredos), a origem (`env`, `db` ou `default`) e se o campo está travado. Um campo cuja origem é `env` SHALL estar travado e SHALL recusar alteração pela API.

#### Scenario: Variável definida
- **WHEN** `REGISTO_MODO` está definida no ambiente e o administrador tenta alterá-la pela API
- **THEN** a alteração é recusada, a resposta indica que o campo é definido por variável de ambiente e o valor efetivo continua o da variável

#### Scenario: Sem variável
- **WHEN** a variável não está definida e o administrador grava um valor
- **THEN** o valor efetivo passa a ser o gravado e a origem é `db`

#### Scenario: Padrão
- **WHEN** nem variável nem valor gravado existem
- **THEN** o valor efetivo é o padrão e a origem é `default`

#### Scenario: Produção existente
- **WHEN** o servidor novo inicia com o `mesa.env` atual da produção
- **THEN** todos os campos presentes nesse arquivo aparecem travados com os mesmos valores de antes e o comportamento da instância não muda

### Requirement: As configurações são validadas antes de serem gravadas
O sistema SHALL validar cada alteração (tipo, faixa e coerência entre campos) antes de gravá-la e SHALL recusar a alteração inteira, sem gravar nada, se qualquer valor for inválido. As regras do perfil de produção (por exemplo, registro aberto exige e-mail configurado, endereço público HTTPS e proxy confiável) SHALL valer sobre o conjunto efetivo. A resposta de erro SHALL indicar quais campos falharam e por quê.

#### Scenario: Valor inválido
- **WHEN** o administrador envia `REGISTO_MODO` com um valor que não é `fechado` nem `aberto`
- **THEN** a alteração é recusada e nada é gravado

#### Scenario: Combinação incoerente
- **WHEN** o administrador tenta abrir o registro sem e-mail configurado em um perfil de produção
- **THEN** a alteração é recusada com a lista dos campos que faltam

#### Scenario: Alteração atômica
- **WHEN** um pedido altera dois campos e um deles é inválido
- **THEN** nenhum dos dois é gravado

### Requirement: Segredos são só de escrita e cifrados em repouso
Os segredos (chave do provedor de e-mail, segredo do captcha e segredo do LiveKit) SHALL ser gravados cifrados com uma chave mestra guardada em arquivo fora do banco de dados, SHALL NOT ser devolvidos por nenhuma resposta da API (apenas um indicador de «configurado») e SHALL NOT aparecer em logs. Um backup ou cópia somente do banco SHALL NOT revelar os segredos. A chave mestra SHALL ser criada no primeiro arranque com permissões restritas ao usuário do servidor.

#### Scenario: Leitura de um segredo
- **WHEN** o administrador consulta a configuração
- **THEN** os segredos aparecem apenas como configurados ou não, nunca com o valor

#### Scenario: Banco copiado sem a chave
- **WHEN** o arquivo do banco é lido sem a chave mestra
- **THEN** os valores dos segredos não são recuperáveis

#### Scenario: Substituir um segredo
- **WHEN** o administrador envia um novo valor para um segredo
- **THEN** o novo valor passa a ser usado e o anterior deixa de existir

#### Scenario: Logs
- **WHEN** uma configuração é alterada
- **THEN** o log registra a chave alterada e quem alterou, nunca o valor de um segredo

#### Scenario: Segredo que não pode ser decifrado
- **WHEN** a chave mestra está ausente ou não corresponde ao segredo gravado
- **THEN** o segredo é tratado como não configurado, o servidor inicia normalmente e a tela avisa que o segredo precisa ser informado de novo

### Requirement: A maioria das alterações vale sem reiniciar
Configurações que não alteram sockets ou processos (registro, convites, sessão, e-mail, captcha, endereço público, proxy confiável) SHALL passar a valer para os pedidos seguintes sem reinício do servidor. Configurações que exigem reinício (porta de escuta, TLS, LiveKit gerenciado, diretórios) SHALL ser gravadas, SHALL ser marcadas como «pendentes de reinício» e SHALL ter efeito só depois dele.

#### Scenario: Alteração ao vivo
- **WHEN** o administrador muda o modo de registro
- **THEN** o próximo pedido de cadastro já usa o novo modo

#### Scenario: Alteração que exige reinício
- **WHEN** o administrador muda a porta de escuta
- **THEN** a configuração é gravada, aparece como pendente de reinício e o servidor continua na porta atual até reiniciar

### Requirement: O administrador pode reiniciar o servidor
O sistema SHALL oferecer ao administrador uma ação de reinício que encerra o servidor de forma ordenada (terminando conexões e processos que ele gerencia) e o inicia de novo sozinho, sem acesso à máquina, em um servidor executado diretamente, por systemd, por contêiner ou pelo app desktop. Se as novas configurações impedirem o reinício (por exemplo, porta ocupada), o sistema SHALL voltar, no mesmo arranque, às últimas configurações que funcionaram, registrar o motivo e exibi-lo ao administrador, sem exigir acesso à máquina nem um supervisor.

#### Scenario: Aplicar e reiniciar
- **WHEN** o administrador confirma «Aplicar e reiniciar»
- **THEN** o servidor reinicia, volta a responder e as configurações pendentes passam a valer

#### Scenario: Configuração que não sobe
- **WHEN** a configuração pendente não pode ser aplicada no arranque (por exemplo, porta ocupada, TLS que falha ou LiveKit que não inicia)
- **THEN** o servidor, no mesmo arranque e sem depender de um supervisor, sobe com as últimas configurações que funcionavam, marca a pendente como falha e informa o motivo ao administrador

### Requirement: Só o administrador da instância acessa a configuração
O sistema SHALL permitir ler e alterar a configuração e reiniciar o servidor exclusivamente à conta marcada como administrador da instância (operador inicial), em rotas administrativas. Qualquer outra conta, autenticada ou não, SHALL receber recusa de permissão, e as respostas SHALL NOT revelar valores de configuração. Cada alteração SHALL ser registrada em um histórico com a chave, a conta, o horário e os valores anterior e novo, sem nunca registrar valores de segredos (apenas o fato de terem sido substituídos).

#### Scenario: Conta comum
- **WHEN** uma conta que não é a do administrador pede a configuração
- **THEN** a resposta é 403 e nada da configuração é revelado

#### Scenario: Sem sessão
- **WHEN** um cliente sem sessão pede a configuração
- **THEN** a resposta é 401

#### Scenario: Registro de alterações
- **WHEN** o administrador altera uma configuração
- **THEN** o histórico ganha uma entrada com a chave, a conta, o horário e os valores anterior e novo

#### Scenario: Histórico de um segredo
- **WHEN** o administrador substitui um segredo
- **THEN** o histórico registra a substituição sem nenhum valor do segredo

### Requirement: O arranque ordena o uso do banco e da configuração
O servidor SHALL ler os caminhos de dados (banco, anexos, avatares) de um arquivo de arranque no diretório de dados e abrir o banco antes de ler as configurações gravadas, SHALL usar como único parâmetro obrigatório de arranque o diretório de dados (parâmetro `--data-dir` ou variável `PARLEY_DATA_DIR`, com o mesmo significado; padrão: o diretório do banco quando `DATABASE_URL` está definida e, senão, um padrão por sistema), e SHALL continuar aceitando `DATABASE_URL`, `ATTACHMENTS_DIR`, `AVATARS_DIR`, `BIND` e `TLS_MODE` como variáveis que, se definidas, vencem e travam o campo.

#### Scenario: Só o diretório de dados
- **WHEN** o servidor inicia apenas com o diretório de dados
- **THEN** usa o banco desse diretório e os padrões de porta e TLS

#### Scenario: Produção atual sem diretório explícito
- **WHEN** o servidor inicia com `DATABASE_URL=sqlite:///opt/mesa/data/chat.db` e sem `--data-dir`
- **THEN** o diretório de dados é `/opt/mesa/data`, onde passam a viver `secret.key` e `bootstrap.json`

#### Scenario: Variáveis de arranque definidas
- **WHEN** `DATABASE_URL` e `BIND` estão definidas
- **THEN** são usadas como hoje e aparecem travadas na tela

### Requirement: Os valores padrão aparecem preenchidos e podem ser alterados
Para cada configuração que tem padrão, a resposta de configuração SHALL informar o valor padrão efetivo (por exemplo, os caminhos do banco, dos anexos e dos avatares dentro do diretório de dados) com a origem `default`, e o administrador SHALL poder substituí-lo, salvo se o campo estiver travado por variável de ambiente.

#### Scenario: Padrão visível
- **WHEN** o administrador consulta a configuração sem ter alterado o caminho do banco
- **THEN** o campo traz o caminho padrão dentro do diretório de dados com origem `default`

#### Scenario: Padrão substituído
- **WHEN** o administrador grava outro valor para um campo com padrão e o campo não está travado
- **THEN** o valor gravado passa a ser o efetivo, com origem `db` ou arquivo de arranque

### Requirement: Alterar os caminhos de dados exige reinício no host e preserva os dados
Alterar o caminho do banco, dos anexos ou dos avatares SHALL gravar o novo valor como pendente sem alterar nada em execução e SHALL NOT ser aplicado pela ação de reinício automático. A aplicação SHALL ocorrer no próximo arranque do backend feito diretamente no host: antes de abrir o banco, o servidor SHALL copiar os dados existentes para o novo local, conferir a integridade da cópia (banco aberto e consistente; arquivos com o mesmo tamanho e hash) e só então adotar o novo local. Se qualquer etapa falhar, o servidor SHALL voltar ao local anterior, SHALL manter os dados originais intactos e SHALL registrar o motivo. O administrador SHALL poder optar por não copiar quando os dados já tiverem sido movidos manualmente. O destino SHALL ser gravável e estar vazio ou conter uma instância existente; qualquer outro caso SHALL ser recusado antes de gravar.

#### Scenario: Alteração pendente
- **WHEN** o administrador altera o caminho do banco
- **THEN** a alteração é gravada como pendente, a instância continua usando o local atual e a resposta indica que é preciso reiniciar o backend no host

#### Scenario: Cópia verificada no arranque
- **WHEN** o backend é reiniciado no host com uma alteração de caminho pendente
- **THEN** os dados são copiados e conferidos, e a instância passa a usar o novo local com todos os dados anteriores

#### Scenario: Falha na cópia
- **WHEN** a cópia ou a conferência falha (por exemplo, disco cheio)
- **THEN** o servidor volta ao local anterior, os dados originais continuam intactos e o motivo é registrado

#### Scenario: Reinício automático não aplica caminhos
- **WHEN** o administrador usa «Aplicar e reiniciar» com uma alteração de caminho pendente
- **THEN** as demais alterações são aplicadas e a de caminho continua pendente

#### Scenario: Destino inválido
- **WHEN** o destino não é gravável ou contém algo que não é uma instância Parley
- **THEN** a alteração é recusada antes de ser gravada

### Requirement: Ações sensíveis exigem confirmação de senha
Reiniciar o servidor, alterar o endereço público, o TLS ou o domínio, substituir segredos e alterar os caminhos de dados SHALL exigir que o administrador confirme a senha de novo, por uma credencial de curta duração presa à sessão. A criação da conta e um login feitos nos últimos 5 minutos SHALL valer como confirmação. As tentativas de confirmação SHALL ser limitadas por sessão e conta, com atraso progressivo, e não por endereço IP. Sem a credencial válida, o sistema SHALL recusar a ação com um erro que indica que a confirmação é necessária e SHALL NOT aplicar nada.

#### Scenario: Reiniciar sem confirmação
- **WHEN** o administrador pede o reinício sem a credencial de confirmação
- **THEN** o pedido é recusado, indicando que a confirmação de senha é necessária

#### Scenario: Confirmação válida
- **WHEN** o administrador confirma a senha e repete a ação dentro do prazo
- **THEN** a ação é aceita

#### Scenario: Confirmação expirada
- **WHEN** a credencial expira ou pertence a outra sessão
- **THEN** a ação é recusada

#### Scenario: Conta recém-criada
- **WHEN** o administrador acabou de criar a conta ou fez login há menos de 5 minutos e executa uma ação sensível
- **THEN** a ação é aceita sem pedir a senha de novo

#### Scenario: Muitas tentativas de confirmação
- **WHEN** a mesma sessão erra a confirmação várias vezes
- **THEN** as respostas ficam progressivamente mais lentas, e outras sessões ou IPs não são afetados

### Requirement: O perfil de produção é derivado do endereço público
O sistema SHALL considerar o perfil de produção ligado quando a variável `PARLEY_PRODUCTION` está definida ou quando o endereço público configurado é HTTPS com um nome de domínio público (sem `localhost`, loopback, endereço IP literal, consulta ou fragmento). O perfil SHALL governar as validações de produção, o atributo `Secure` dos cookies de sessão e o valor de `COOKIE_SECURE`. Quando `COOKIE_SECURE` ou `PARLEY_PRODUCTION` vêm do ambiente, o cabeçalho `strict-transport-security` SHALL permanecer como hoje; quando o perfil é apenas derivado, o cabeçalho SHALL ser emitido somente se o certificado for confiável (ACME ou TLS terminado por proxy declarado), com validade de um dia e sem estender-se a subdomínios. Uma instalação feita pelo navegador, sem variáveis de ambiente, SHALL receber essas proteções assim que um endereço público HTTPS for configurado.

#### Scenario: Endereço HTTPS público
- **WHEN** o administrador configura `https://chat.exemplo.com` como endereço público
- **THEN** o perfil de produção fica ligado e os cookies de sessão passam a ter `Secure`

#### Scenario: Endereço local ou HTTP
- **WHEN** o endereço público é `http://…`, `localhost` ou loopback e a variável não está definida
- **THEN** o perfil de produção continua desligado

#### Scenario: Variável vence
- **WHEN** `PARLEY_PRODUCTION` está definida
- **THEN** o perfil de produção fica ligado independentemente do endereço

#### Scenario: Endereço por IP
- **WHEN** o endereço público é `https://` com um IP literal (público ou privado) e a variável não está definida
- **THEN** o perfil de produção derivado continua desligado

#### Scenario: Certificado autoassinado em domínio
- **WHEN** o perfil é apenas derivado e o certificado é autoassinado
- **THEN** o cabeçalho `strict-transport-security` não é emitido

#### Scenario: Produção atual
- **WHEN** `COOKIE_SECURE` ou `PARLEY_PRODUCTION` vêm do ambiente
- **THEN** o cabeçalho `strict-transport-security` continua como antes

### Requirement: Mudanças de rede e de endereço são aplicadas com confirmação
Alterações de endereço público, proxy confiável, TLS/domínio e endereço de escuta SHALL entrar em uma janela de confirmação: o sistema SHALL guardar os valores anteriores e um prazo, SHALL aplicar o novo valor e SHALL exigir uma confirmação feita pelo administrador por uma requisição autenticada que só é alcançável se a nova configuração funcionar para ele. Se a confirmação não chegar até o prazo, o sistema SHALL restaurar sozinho os valores anteriores (reiniciando, quando a mudança exigiu reinício) e SHALL registrar o motivo. A janela SHALL sobreviver a um reinício do servidor. A confirmação SHALL tornar a mudança definitiva.

#### Scenario: Confirmação recebida
- **WHEN** o administrador aplica um novo endereço público e confirma antes do prazo
- **THEN** a mudança passa a ser definitiva

#### Scenario: Sem confirmação
- **WHEN** o administrador aplica um endereço que torna a instância inalcançável para ele e o prazo se esgota
- **THEN** o servidor volta sozinho ao endereço anterior e registra o motivo

#### Scenario: Reinício durante a janela
- **WHEN** o servidor reinicia enquanto uma janela de confirmação está aberta
- **THEN** o prazo e os valores anteriores são preservados e a reversão ainda ocorre se não houver confirmação
