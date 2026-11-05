# Proposal

## Why

Hoje quase toda a configuração de uma instância vive em variáveis de ambiente (`/etc/mesa/mesa.env`), lidas uma vez no arranque. Quem hospeda precisa de acesso à máquina para tudo: modo de registro, e-mail, captcha, endereço público, voz. O guia de produção tem 459 linhas por causa disso, e o host local (`desktop-local-host`) herdaria o mesmo peso. Queremos o modelo de instalador web (como o phpBB): na primeira abertura, o administrador configura tudo pelo navegador ou pelo app, e depois ajusta numa tela de configuração acessível só a ele. A máquina só entra em casos extremos (reiniciar o serviço ou a máquina, diagnóstico).

Como a conta de administrador passa a controlar a instância de verdade, a corrida pela primeira conta, hoje inofensiva, deixa de ser: quem alcançasse uma instância nova antes do dono assumiria a configuração. Esta change fecha isso com um token de configuração inicial.

**Ordem de entrega:** esta change é a segunda da sequência `parley-server-standalone` → `instance-settings` → `desktop-local-host`. Ela depende do que a standalone entrega (frontend servido pelo próprio backend, TLS embutido, desligamento ordenado e supervisor do LiveKit); a standalone não tem comando `init`, e o primeiro arranque automático nasce aqui.

## What Changes

- **Configuração em banco, com precedência da variável de ambiente.** Nova tabela de configurações da instância e um registro tipado de chaves (tipo, padrão, validação, se exige reinício, se é segredo). O valor efetivo é: variável de ambiente (se definida) > banco > padrão. Campo definido por variável aparece **travado** na tela com «definido por variável de ambiente». A produção atual segue exatamente como está.
- **Configuração viva.** O estado de configuração deixa de ser um `Arc<Config>` imutável e passa a ser recarregável sem reiniciar para a maioria das chaves; as que exigem reinício (porta, TLS, LiveKit gerenciado) são marcadas, e a tela oferece «Aplicar e reiniciar», com o próprio servidor se reiniciando. Se a configuração pendente não subir (porta ocupada, TLS que falha, LiveKit que não inicia), o servidor volta à última configuração boa **no mesmo arranque**, sem depender de supervisor, e mostra o motivo ao administrador.
- **Segredos só de escrita e cifrados em repouso**: `EMAIL_API_KEY`, `TURNSTILE_SECRET` e `LIVEKIT_API_SECRET` ficam no banco cifrados com uma chave mestra em `<dados>/secret.key` (fora do `chat.db`). A API nunca devolve o valor. Na tela o campo aparece mascarado (asteriscos), pode ser editado e salvo, e copiá-lo copia apenas os asteriscos, pois o valor nunca chega ao navegador.
- **Primeiro arranque automático e retomável**: ao iniciar sem dados, o servidor cria o diretório, o banco, a chave mestra, as chaves do LiveKit e um token de configuração (e completa o que faltar se o primeiro arranque for interrompido); imprime a URL e o token no log e grava o token em `<dados>/setup-token`. `PARLEY_SETUP_TOKEN` pode definir o token de fora (implantações automatizadas). Enquanto não há administrador, só o estado, a validação do token e o cadastro da primeira conta respondem, e o cadastro exige o token. Tentativas erradas recebem atraso progressivo global (sem bloqueio por IP, que atrás de um proxy trancaria o próprio dono fora). Depois de criada a conta, o instalador **se tranca** e o token é invalidado.
- **Assistente de configuração no primeiro login**: criar a conta de administrador (com o token), endereço público e HTTPS, registro, e-mail, voz e revisão, com padrões seguros e cada passo pulável. Depois, a mesma tela fica em «Configurações da instância», visível apenas ao administrador.
- **Perfil de produção derivado**: passa a ser ligado quando `PARLEY_PRODUCTION` está definida ou quando o `PUBLIC_BASE_URL` é HTTPS com host público, para que uma instalação feita pelo navegador (sem `.env`) não fique sem as proteções de produção (validações, cookies `Secure`).
- **Reautenticação e auditoria**: reiniciar, trocar endereço/TLS/domínio, substituir segredos e alterar caminhos de dados exigem a senha do administrador de novo; cada alteração fica registrada em um histórico (chave, conta, horário, valores anterior e novo, nunca valores de segredos).
- **Administrador com poder real**: a conta marcada como operador inicial (`is_initial_operator`, que já existe) passa a poder ler e alterar a configuração por `/api/admin/*`. Nenhuma outra conta tem acesso. A produção atual já tem esse administrador.
- **Padrões já preenchidos e editáveis**: cada campo mostra o valor efetivo pré-preenchido (por exemplo, o caminho do banco, dos anexos e dos avatares dentro do diretório de dados), com a origem «padrão», e o administrador pode alterá-lo. `DATABASE_URL`, `BIND` e `TLS_MODE` continuam aceitas como variáveis e, se definidas, travam o campo.
- **Caminhos de dados (banco, anexos, avatares)**: como o caminho do banco não pode ficar dentro do banco, esses três valores ficam em `<dados>/bootstrap.json`. Alterá-los vale só no próximo arranque do backend, que copia e verifica os dados existentes para o novo local antes de trocar (com volta ao local anterior em caso de falha). A tela avisa que essa alteração exige reiniciar o backend diretamente no host; o botão «Aplicar e reiniciar» não se aplica a ela.
- **Não entram**: mover dados enquanto o servidor está no ar, atualizar o binário do servidor pela tela, backup e restauração, transferência ou múltiplos administradores, papéis de administração além do operador inicial, edição de configuração por conta que não seja a do operador, e abrir portas ou firewall (a tela só mostra o que abrir e diagnostica o alcance).

## Capabilities

### New Capabilities
- `instance/settings`: registro e armazenamento das configurações, precedência ambiente > banco > padrão, campos travados, segredos cifrados e só de escrita, validação, aplicação ao vivo e reinício, autorização do administrador e auditoria sem valores.
- `instance/first-run-setup`: primeiro arranque automático, token de configuração, HTTPS durante a configuração, trancamento do instalador e comportamento em instâncias já existentes.
- `frontend-v2/instance-admin-settings`: assistente de primeiro uso e tela de configurações da instância.

### Modified Capabilities
- `auth/instance-admin-onboarding`: o estado inicial informa se o token é exigido, o cadastro guiado pede o token, o administrador passa a ter poder de configuração e o contrato de registro ganha o token de forma aditiva.
- `auth/email-registration`: o modo de registro e o proxy confiável podem vir da configuração da instância (não só do ambiente), com a variável vencendo.

## Impact

- **Backend** (`backend/src`): nova camada de configurações (`settings`), migrações para `instance_setting`, `instance_setting_audit` e o estado de instalação, `AppState` com configuração recarregável (as 58 ocorrências de `config.*` em 15 arquivos passam por um acessor, e os testes que leem ou alteram `state.config` ganham um auxiliar), estrutura de arranque `BootPaths`, cifragem de segredos, rotas `/api/admin/settings`, `/api/admin/restart`, `/api/admin/reauth`, `/api/admin/diagnostics` e `/api/setup/*`, token de configuração, reinício integrado ao desligamento ordenado da standalone; `main.rs` com o primeiro arranque; novas dependências `arc-swap`, `chacha20poly1305` e `subtle`.
- **Frontend** (`frontend/src`): destino `setup` em `entryScreen` (cadastro guiado com token, também no app nativo), assistente no primeiro login do administrador e tela de configurações no shell autenticado, acessada pela página de conta, diálogo de reautenticação, catálogos `pt-BR` e `en`.
- **Documentação**: `docs/deploy-producao.md` e `docs/operar-instancia.md` (instalação pelo navegador, tabela de variável ↔ campo), README e CHANGELOG.
- **Dependências entre changes**: depende de `parley-server-standalone` (estático, TLS embutido, desligamento ordenado, supervisor do LiveKit); `desktop-local-host` vem depois e passa só o diretório de dados e o token ao servidor, entregando o token ao próprio cliente. O campo `PUBLIC_HOME` da `web-home-page` entra como um campo desta tela.
- **Produção atual**: sem impacto até instalar o binário novo; com as variáveis existentes, tudo fica travado e idêntico; o administrador existente passa a ver a tela.
