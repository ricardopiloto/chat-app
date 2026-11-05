# Spec Delta

## Purpose

Permite subir uma instância do Parley com um único artefato de servidor que serve o frontend, gerencia o LiveKit, termina TLS e se desliga de forma ordenada, e permite operá-la também atrás de um proxy ou túnel com LiveKit em outro servidor, sem quebrar as instâncias que já rodam assim.

## ADDED Requirements

### Requirement: Sem modos novos o servidor se comporta como antes
O servidor SHALL manter o comportamento, as variáveis de ambiente, o formato do banco SQLite, o nome do executável (`chat-backend`), os subcomandos existentes (`reset-code`) e os caminhos de dados atuais quando nenhuma das variáveis dos modos novos (`SERVE_FRONTEND`, `STATIC_DIR`, `LIVEKIT_MANAGED`, `TLS_MODE`) estiver definida. Os modos novos SHALL estar desligados por padrão. Esta capacidade SHALL NOT introduzir migração de banco que impeça voltar ao binário anterior.

#### Scenario: Produção atual com o binário novo
- **WHEN** o binário novo é iniciado com o mesmo `/etc/mesa/mesa.env` e o mesmo `chat.db` da produção atual
- **THEN** o servidor sobe, atende a API e o WebSocket como antes e não serve frontend, não inicia LiveKit e não termina TLS

#### Scenario: Subcomando existente
- **WHEN** `chat-backend reset-code <handle>` é executado com as opções atuais
- **THEN** o comportamento e as mensagens são os de antes

#### Scenario: Argumento desconhecido
- **WHEN** o binário recebe um argumento que não é um subcomando conhecido
- **THEN** exibe o uso e termina com erro, como antes

#### Scenario: Voltar ao binário anterior
- **WHEN** o binário anterior é restaurado sobre o mesmo banco depois de rodar o novo sem modos ligados
- **THEN** o servidor anterior inicia normalmente

### Requirement: O servidor pode servir o frontend na mesma origem
O servidor SHALL poder servir o frontend compilado na mesma origem da API, de duas formas: **embutido no próprio binário** (`SERVE_FRONTEND=embedded`, disponível nos binários de release) ou a partir de um diretório (`STATIC_DIR`, que vence sobre o embutido). Para rotas do cliente que não existem como arquivo, SHALL devolver o `index.html`. As rotas `/api`, `/ws`, `/health` e `/rtc` SHALL continuar tendo precedência, e qualquer caminho sob `/api` que não exista SHALL responder 404 da API, nunca o `index.html`. O servidor SHALL NOT servir arquivos fora do frontend. Um binário de release SHALL conter o frontend da mesma versão, e um binário compilado sem o frontend embutido SHALL recusar iniciar com `SERVE_FRONTEND=embedded`, com uma mensagem clara.

#### Scenario: Frontend embutido
- **WHEN** o binário de release inicia com `SERVE_FRONTEND=embedded` e um navegador abre `/`
- **THEN** recebe o `index.html` do frontend embutido, sem nenhum diretório de estáticos no disco

#### Scenario: Diretório vence o embutido
- **WHEN** `STATIC_DIR` aponta para um diretório com o frontend compilado
- **THEN** os arquivos desse diretório são servidos no lugar dos embutidos

#### Scenario: Rota do cliente
- **WHEN** um navegador pede `/channels/abc` e esse caminho não é um arquivo do frontend
- **THEN** recebe o `index.html`

#### Scenario: API não é sombreada
- **WHEN** um cliente pede `/api/inexistente`
- **THEN** recebe 404 da API, não o `index.html`

#### Scenario: Travessia de diretório
- **WHEN** um cliente pede um caminho que tenta sair do diretório de estáticos com `..` ou codificação equivalente
- **THEN** a resposta é 404 e nenhum arquivo fora do frontend é entregue

#### Scenario: Sem modo de frontend
- **WHEN** nem `SERVE_FRONTEND` nem `STATIC_DIR` estão definidos
- **THEN** o servidor não serve arquivos estáticos

#### Scenario: Binário sem frontend embutido
- **WHEN** um binário compilado sem o frontend embutido recebe `SERVE_FRONTEND=embedded`
- **THEN** recusa iniciar com uma mensagem que explica que esse binário não contém o frontend

### Requirement: O frontend servido pelo servidor é compatível com os cabeçalhos de segurança e é eficiente
As respostas estáticas SHALL receber os mesmos cabeçalhos de segurança das demais respostas, e o frontend SHALL funcionar sem violações da política de segurança de conteúdo, o que inclui não depender de fontes ou outros recursos hospedados por terceiros: as fontes SHALL estar empacotadas no frontend. O servidor SHALL comprimir as respostas estáticas compressíveis e SHALL enviar `Cache-Control` de longa duração e imutável para arquivos com hash no nome e sem cache longo para o `index.html`. Para os arquivos embutidos, o servidor SHALL enviar um validador por conteúdo e responder 304 a requisições condicionais.

#### Scenario: Sem violações de política
- **WHEN** o frontend servido pelo servidor é carregado em um navegador com os cabeçalhos reais
- **THEN** nenhuma violação de política de segurança de conteúdo é registrada e as fontes do produto são as empacotadas

#### Scenario: Cache
- **WHEN** um navegador pede um arquivo estático com hash no nome e depois o `index.html`
- **THEN** o primeiro vem com cache longo imutável e o segundo sem cache longo

#### Scenario: Requisição condicional
- **WHEN** um navegador repete o pedido de um arquivo embutido com o validador recebido
- **THEN** a resposta é 304 sem corpo

#### Scenario: Compressão
- **WHEN** um navegador que aceita compressão pede um arquivo JavaScript
- **THEN** a resposta vem comprimida

### Requirement: O servidor se desliga de forma ordenada
Ao receber `SIGTERM` ou Ctrl-C, o servidor SHALL parar de aceitar novas conexões, SHALL encerrar as conexões WebSocket ativas dentro de um prazo definido, SHALL encerrar os processos que gerencia (como o LiveKit) e SHALL terminar com sucesso depois disso. Se o prazo se esgotar, o servidor SHALL forçar o encerramento das conexões restantes e dos processos filhos e SHALL terminar mesmo assim.

#### Scenario: Sinal de término
- **WHEN** o servidor recebe `SIGTERM` com clientes conectados por WebSocket
- **THEN** para de aceitar conexões, fecha os WebSockets dentro do prazo, encerra o LiveKit gerenciado e termina

#### Scenario: Prazo esgotado
- **WHEN** uma conexão não se fecha dentro do prazo
- **THEN** o servidor a encerra à força e termina

#### Scenario: Sem processos órfãos
- **WHEN** o servidor termina por qualquer das vias acima, ou é morto de forma abrupta em Linux
- **THEN** nenhum processo filho do LiveKit continua em execução

### Requirement: O LiveKit pode ser gerenciado pelo servidor
Quando `LIVEKIT_MANAGED` está ligado, o servidor SHALL obter o `livekit-server` da release oficial de uma versão fixada (a mesma da infraestrutura atual e compatível com as bibliotecas do backend), SHALL conferir o SHA-256 antes de executá-lo e SHALL recusar o binário se a conferência falhar. SHALL aceitar `LIVEKIT_BINARY_PATH` para usar um `livekit-server` já presente, conferindo o SHA-256 do mesmo modo. SHALL usar as chaves de `LIVEKIT_API_KEY`/`LIVEKIT_API_SECRET` quando definidas e, caso contrário, SHALL gerar chaves únicas (nunca as de exemplo) e guardá-las em um arquivo do diretório de dados com permissões restritas, reutilizando-as nas execuções seguintes. SHALL gerar a configuração do LiveKit a partir das variáveis do servidor: porta de sinalização (padrão `127.0.0.1:7880`), porta TCP de recurso, mídia por **uma porta UDP única** (padrão 7882) **ou** por uma **faixa de portas UDP** (mutuamente exclusivas, como no LiveKit), TURN opcional com sua porta, e o IP anunciado ou o uso de IP externo. SHALL aceitar `LIVEKIT_CONFIG_FILE`, caso em que usa esse arquivo de configuração do LiveKit como está, sem gerar nenhum, e SHALL recusar iniciar se ele não existir; as chaves da API continuam vindo das variáveis e devem coincidir com as do arquivo, e `LIVEKIT_PORT` deve coincidir com o `port` dele. O servidor SHALL registrar um aviso de arranque quando o `port` do arquivo diferir de `LIVEKIT_PORT` ou quando o nome de `LIVEKIT_API_KEY` não aparecer no bloco `keys` do arquivo (verificação textual simples), e SHALL validar o tipo de cada valor usado na configuração gerada (portas numéricas, faixa com início menor que o fim e dentro de 1024–65535, endereços IP válidos, nome de chave sem espaços nem `:`), recusando iniciar com um valor inválido. O download SHALL ocorrer em segundo plano, sem impedir o servidor de aceitar conexões, e o arquivo SHALL ser gravado de modo que um arquivo parcial nunca seja usado. SHALL executá-lo como processo filho com a saída registrada no log do servidor, reiniciá-lo se ele cair (com espera crescente que volta ao início depois de um período estável e com um limite de tentativas rápidas antes de marcá-lo como indisponível) e encerrá-lo quando o servidor for encerrado. Se o LiveKit estiver indisponível, o chat de texto SHALL continuar funcionando e o pedido de entrar em canal de voz SHALL responder com erro claro de voz indisponível. O modo gerenciado SHALL NOT incluir o serviço de egress do LiveKit. Quando o modo não está ligado, o servidor SHALL usar o LiveKit externo configurado por `LIVEKIT_WS_URL`, como hoje.

#### Scenario: Primeira ativação
- **WHEN** `LIVEKIT_MANAGED` é ligado e o binário ainda não existe localmente
- **THEN** o servidor baixa a versão fixada, confere o SHA-256, e só então o executa

#### Scenario: Binário local
- **WHEN** `LIVEKIT_BINARY_PATH` aponta para um `livekit-server` cujo SHA-256 confere
- **THEN** o servidor o usa sem baixar nada

#### Scenario: Chaves geradas e reutilizadas
- **WHEN** `LIVEKIT_MANAGED` é ligado sem chaves definidas por variável e o servidor reinicia depois
- **THEN** as mesmas chaves únicas são reutilizadas e não são as de exemplo

#### Scenario: Configuração equivalente por variáveis
- **WHEN** as variáveis são definidas como na produção real (IP externo ligado, TCP 7881, faixa UDP 50000-60000, TURN em UDP 3478)
- **THEN** a configuração gerada tem os mesmos campos efetivos

#### Scenario: Faixa e porta única são exclusivas
- **WHEN** a faixa de portas e a porta UDP única são definidas ao mesmo tempo
- **THEN** o servidor recusa iniciar com uma mensagem clara

#### Scenario: Arquivo de configuração próprio
- **WHEN** `LIVEKIT_CONFIG_FILE` aponta para o `livekit.yaml` da produção (faixa de portas, TURN com TLS e certificado)
- **THEN** o LiveKit gerenciado sobe com essa configuração sem alterá-la

#### Scenario: Arquivo de configuração inexistente
- **WHEN** `LIVEKIT_CONFIG_FILE` aponta para um arquivo que não existe
- **THEN** o servidor recusa iniciar com uma mensagem clara

#### Scenario: Porta do arquivo diferente
- **WHEN** `LIVEKIT_CONFIG_FILE` define um `port` diferente de `LIVEKIT_PORT`
- **THEN** o servidor registra um aviso de arranque que indica as duas portas

#### Scenario: Chave ausente no arquivo
- **WHEN** o nome de `LIVEKIT_API_KEY` não aparece no bloco `keys` do arquivo
- **THEN** o servidor registra um aviso de arranque que indica que os tokens da voz serão rejeitados

#### Scenario: Valor inválido na configuração gerada
- **WHEN** uma variável de LiveKit contém um valor inválido (por exemplo, um IP com quebra de linha, ou uma faixa com início maior que o fim)
- **THEN** o servidor recusa iniciar com uma mensagem clara e nenhum arquivo de configuração é gerado

#### Scenario: Download não bloqueia o servidor
- **WHEN** o download do LiveKit é lento ou falha
- **THEN** o servidor já atende texto, a voz responde indisponível enquanto baixa, e nenhum arquivo parcial é executado

#### Scenario: SHA-256 divergente
- **WHEN** o arquivo baixado não confere com o SHA-256 esperado
- **THEN** o arquivo é descartado, o LiveKit não é iniciado e o servidor registra o motivo

#### Scenario: LiveKit cai
- **WHEN** o processo do LiveKit termina de forma inesperada
- **THEN** o servidor o reinicia com espera crescente, e o texto segue funcionando durante a queda

#### Scenario: Falhas repetidas
- **WHEN** o LiveKit falha várias vezes seguidas logo após iniciar
- **THEN** o servidor o marca como indisponível, registra o motivo e tenta de novo em intervalos longos, e o texto continua funcionando

#### Scenario: Encerramento do servidor
- **WHEN** o servidor é encerrado
- **THEN** o processo do LiveKit também é encerrado

#### Scenario: LiveKit externo
- **WHEN** `LIVEKIT_MANAGED` está desligado e `LIVEKIT_WS_URL` aponta para um LiveKit existente, inclusive em outro servidor
- **THEN** o servidor usa esse LiveKit sem iniciar nenhum processo

#### Scenario: Compatível com o Nginx atual
- **WHEN** `LIVEKIT_MANAGED` é ligado em uma instalação que mantém o Nginx com `proxy_pass http://127.0.0.1:7880` para `/rtc`
- **THEN** o LiveKit gerenciado atende nessa porta e a sinalização continua funcionando pelo Nginx

### Requirement: A sinalização do LiveKit passa pelo servidor com poucas portas de mídia
Com o LiveKit gerenciado, o servidor SHALL repassar o WebSocket de sinalização em `/rtc` para o LiveKit local, de modo que a sinalização use a mesma origem e porta do servidor, com verificações de vida (ping) e um limite de ociosidade equivalentes ao do proxy atual (uma hora), e SHALL repassar mensagens grandes e o fechamento de qualquer dos lados. Por padrão a mídia SHALL usar o menor conjunto de portas possível: uma única porta UDP multiplexada e uma porta TCP de recurso. O operador SHALL poder escolher uma faixa de portas UDP no lugar da porta única (por exemplo, para manter as regras de firewall de uma instalação existente). O servidor SHALL permitir ligar o TURN do LiveKit (`LIVEKIT_TURN`) e SHALL registrar um aviso de arranque quando o modo gerenciado estiver sem TURN. `LIVEKIT_WS_URL` SHALL ser derivado do endereço público da instância quando o modo gerenciado está ligado e não foi definido explicitamente. A documentação SHALL listar exatamente as portas a abrir, inclusive a do TURN quando ligado.

#### Scenario: Sinalização por /rtc
- **WHEN** um cliente abre o WebSocket em `/rtc` com o LiveKit gerenciado ligado
- **THEN** a conexão é repassada ao LiveKit local e o cliente entra na chamada

#### Scenario: Sessão longa
- **WHEN** uma conexão de sinalização fica aberta por mais de uma hora com pings
- **THEN** o túnel não a derruba por ociosidade

#### Scenario: Portas expostas
- **WHEN** alguém consulta a documentação de arranque rápido
- **THEN** encontra a porta do servidor, a porta UDP de mídia (ou a faixa escolhida), a porta TCP de recurso e, se o TURN estiver ligado, a porta do TURN

#### Scenario: Sem TURN
- **WHEN** o modo gerenciado inicia com `LIVEKIT_TURN` desligado
- **THEN** o servidor registra um aviso de que redes que bloqueiam UDP podem não conseguir entrar em chamadas

### Requirement: O servidor pode terminar TLS sem depender de proxy
O servidor SHALL aceitar `TLS_MODE` com os valores `off` (padrão), `self` e `files`. Com `off`, a porta de escuta padrão continua a atual (`127.0.0.1:8080`). Com `self`, a porta padrão SHALL ser uma porta alta fixa em todas as interfaces; o servidor SHALL gerar um certificado autoassinado cujos nomes vêm do endereço público configurado e de uma lista opcional e, na falta de ambos, de `localhost`, `127.0.0.1`, do nome da máquina e do endereço de escuta, persisti-lo e reutilizá-lo enquanto os nomes não mudarem, e SHALL expor a impressão digital SHA-256 do certificado (no log de arranque e por um subcomando). Com `files`, SHALL ler o certificado e a chave de `TLS_CERT_FILE` e `TLS_KEY_FILE` no arranque, SHALL recusar iniciar se faltarem ou forem inválidos, e a documentação SHALL descrever a renovação por reinício do serviço. `BIND`, quando definida, SHALL vencer a porta padrão. Com TLS embutido, os cookies de sessão SHALL ser `Secure`, o IP do peer visto pelo limitador de pedidos SHALL ser o do cliente real e `TRUSTED_PROXY` SHALL manter seu significado atual. Com certificado autoassinado, o servidor SHALL NOT emitir `strict-transport-security`. A documentação SHALL descrever a permissão necessária para escutar na porta 443 sem privilégios de administrador e SHALL indicar o Caddy (ou o certbot) como caminho para HTTPS com certificado público automático.

#### Scenario: Certificado autoassinado estável
- **WHEN** o servidor roda em `TLS_MODE=self` duas vezes seguidas com os mesmos nomes
- **THEN** a impressão digital do certificado é a mesma nas duas execuções

#### Scenario: Sem endereço público
- **WHEN** `TLS_MODE=self` inicia sem `PUBLIC_BASE_URL` nem lista de nomes
- **THEN** o certificado inclui `localhost`, `127.0.0.1`, o nome da máquina e o endereço de escuta

#### Scenario: Nomes alterados
- **WHEN** o endereço público muda entre duas execuções em `TLS_MODE=self`
- **THEN** um novo certificado é gerado e a nova impressão digital é informada

#### Scenario: Certificado por arquivo
- **WHEN** `TLS_MODE=files` com `TLS_CERT_FILE` e `TLS_KEY_FILE` válidos
- **THEN** o servidor atende HTTPS com esse certificado

#### Scenario: Arquivos ausentes
- **WHEN** `TLS_MODE=files` e um dos arquivos não existe ou é inválido
- **THEN** o servidor recusa iniciar com uma mensagem clara e não aceita conexões sem TLS

#### Scenario: Sem HSTS com certificado autoassinado
- **WHEN** o servidor responde em `TLS_MODE=self` com o perfil de produção ligado
- **THEN** a resposta não contém `strict-transport-security`

#### Scenario: Cookie seguro
- **WHEN** o servidor termina TLS e uma sessão é criada
- **THEN** o cookie de sessão é `Secure`

#### Scenario: Sem TLS embutido atrás de proxy
- **WHEN** `TLS_MODE=off` atrás de Nginx, Caddy ou túnel com `TRUSTED_PROXY`
- **THEN** o comportamento é o atual

#### Scenario: Limite por IP do cliente
- **WHEN** o servidor termina TLS e dois clientes de IPs diferentes excedem o limite de autenticação
- **THEN** o limite é aplicado separadamente a cada IP

### Requirement: O perfil de produção continua validado com os modos novos
O servidor SHALL aplicar a validação do perfil de produção (chaves LiveKit que não sejam as de exemplo, `COOKIE_SECURE` verdadeiro, requisitos de e-mail e `PUBLIC_BASE_URL`) também quando os modos novos estiverem ligados. As chaves geradas pelo modo gerenciado SHALL NOT ser as de exemplo. `LIVEKIT_MANAGED` sem endereço público (`PUBLIC_BASE_URL` ou `LIVEKIT_WS_URL`) SHALL recusar iniciar.

#### Scenario: Chaves de exemplo
- **WHEN** o servidor inicia em produção com chaves LiveKit de exemplo, com ou sem modos novos
- **THEN** recusa iniciar com a mensagem atual

#### Scenario: Chaves geradas
- **WHEN** o modo gerenciado gera as chaves e o servidor inicia em produção
- **THEN** a validação passa sem intervenção

#### Scenario: Modo gerenciado sem endereço
- **WHEN** `LIVEKIT_MANAGED` está ligado sem `PUBLIC_BASE_URL` nem `LIVEKIT_WS_URL`
- **THEN** o servidor recusa iniciar com uma mensagem clara

### Requirement: O servidor é distribuído para Linux como binário autônomo e como imagem de contêiner
O release SHALL publicar o servidor para Linux com o frontend embutido e uma imagem de contêiner que execute como usuário sem privilégios, guarde todos os dados (banco, anexos e avatares) em um volume, declare as portas necessárias, tenha uma verificação de saúde que não dependa de ferramentas externas (o subcomando `healthcheck` do próprio servidor, que também funciona com certificado autoassinado ao consultar o próprio loopback) e termine de forma ordenada ao receber `SIGTERM`. O build do frontend SHALL preceder o do servidor no processo de release. Os binários do servidor SHALL fazer parte da mesma release `vX.Y.Z` do aplicativo (a mesma tag e o mesmo rascunho), SHALL NOT criar outro arquivo `SHA256SUMS` (os checksums do servidor ficam em arquivo separado), SHALL ter nomes que não casem com os filtros de seleção de instalador dos scripts de instalação do aplicativo, e a versão da tag SHALL coincidir com a de `backend/Cargo.toml`.

#### Scenario: Binário autônomo
- **WHEN** o binário de release é baixado e iniciado em uma máquina Linux sem o repositório
- **THEN** sobe e serve o frontend embutido

#### Scenario: Imagem de contêiner
- **WHEN** a imagem é executada com um volume de dados e enviada `SIGTERM`
- **THEN** inicia como usuário sem privilégios, responde na verificação de saúde e termina de forma ordenada dentro do prazo

#### Scenario: Verificação de saúde com TLS autoassinado
- **WHEN** `healthcheck` é executado contra um servidor em `TLS_MODE=self`
- **THEN** consulta o próprio loopback e termina com sucesso quando o servidor responde

#### Scenario: Release única
- **WHEN** uma tag `vX.Y.Z` é publicada
- **THEN** existe uma única release em rascunho que contém os instaladores do aplicativo, o feed de atualização, um único `SHA256SUMS` e os binários do servidor com seus checksums em arquivo separado

#### Scenario: Scripts de instalação intactos
- **WHEN** `install-mesa.sh` ou `install-mesa.ps1` seleciona o instalador numa release que também contém os binários do servidor
- **THEN** continua encontrando exatamente um instalador e exatamente um `SHA256SUMS`

#### Scenario: Versão divergente
- **WHEN** a tag não coincide com a versão de `backend/Cargo.toml` ou de `frontend/electron/package.json`
- **THEN** o processo de release falha antes de produzir artefatos

### Requirement: A documentação cobre as três topologias e a migração opcional
A documentação SHALL descrever, com passos e portas, as topologias (A) máquina com IP público sozinha, (B) atrás de proxy ou túnel (Nginx, Caddy, Cloudflare Tunnel) com LiveKit em outro servidor, e (C) a clássica com Nginx e LiveKit local; SHALL incluir a receita do Caddy para HTTPS automático e a configuração de cabeçalhos para o servidor ver o IP real do cliente (`X-Real-IP`, que o proxy deve **substituir** e não acrescentar, com o backend acessível só pelo proxy) atrás de Nginx, Caddy e Cloudflare Tunnel; SHALL orientar, para o LiveKit em outro servidor, a manter as mesmas chaves nos dois lados, a servir a sinalização por um proxy com TLS e a não deixar a porta de sinalização exposta fora dele; SHALL orientar que o certificado usado pelo TURN com TLS seja legível pelo usuário do serviço (por exemplo, copiado por um gancho do certbot) e que a faixa larga de portas em contêiner use a rede do host; SHALL descrever a migração da produção em etapas independentes (atualizar o binário; ligar o LiveKit gerenciado escutando em `127.0.0.1:7880` e com o TURN equivalente ao da configuração atual; ligar o frontend pelo backend; remover o Nginx), cada uma com backup prévio e passo de volta; e SHALL manter o guia clássico como caminho suportado. Nenhuma etapa SHALL ser obrigatória.

#### Scenario: Atrás de túnel com LiveKit externo
- **WHEN** um operador usa Caddy e Cloudflare Tunnel e mantém o LiveKit em outro servidor
- **THEN** a documentação mostra como apontar o proxy ao `chat-backend`, como configurar o IP real e como manter `LIVEKIT_WS_URL` externo

#### Scenario: Migração parcial
- **WHEN** um operador liga apenas `LIVEKIT_MANAGED` e mantém o Nginx
- **THEN** a instância funciona e a documentação mostra como reverter para o LiveKit em Docker

#### Scenario: Configuração preservada na migração
- **WHEN** a configuração atual do LiveKit tem faixa de portas e TURN (inclusive com TLS) e o operador migra para o modo gerenciado
- **THEN** a documentação instrui a usar `LIVEKIT_CONFIG_FILE` com o arquivo atual, ou as variáveis de faixa e de TURN para os casos simples, e lista as portas, de modo que o firewall não precise mudar

#### Scenario: Certificado do TURN
- **WHEN** o `livekit.yaml` migrado usa um certificado de `/etc/letsencrypt/live/...` e o serviço roda sem privilégios
- **THEN** a documentação mostra o gancho do certbot que o copia para um caminho legível pelo serviço e como apontar o arquivo para ele

#### Scenario: Faixa larga em contêiner
- **WHEN** um operador usa uma faixa de milhares de portas UDP em contêiner
- **THEN** a documentação e o exemplo de `compose` indicam a rede do host em vez de publicar cada porta

#### Scenario: Quem não migra
- **WHEN** um operador atualiza o binário e não liga nenhum modo
- **THEN** a instância continua no modo clássico, sem mudança de comportamento
