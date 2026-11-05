# Design

## Context

Motivação e escopo em `proposal.md`; requisitos em `specs/`.

**Ordem de entrega:** esta change é a **segunda** da sequência `parley-server-standalone` → `instance-settings` → `desktop-local-host`. Ela depende do que a standalone entrega: servir o frontend pelo próprio backend, `TLS_MODE=self`/`acme`, **desligamento ordenado** (sinal, fechamento do `WsHub`, encerramento de filhos), supervisor do LiveKit e o binário publicado. A standalone **não** tem comando `init`; o primeiro arranque automático e a configuração pelo navegador nascem aqui.

Estado atual relevante:

- `Config::from_env()` lê todas as variáveis uma vez; `AppState.config` é `Arc<Config>` imutável, consultado em **58 ocorrências em 15 arquivos** (`voice.rs`, `auth/email.rs`, `auth/register.rs`, `auth/recovery*.rs`, `key_reminders.rs`, `invites.rs`, `token`, `lib.rs`, `security_headers.rs` e outros). `Config::validate()` aplica o perfil de produção antes do bind.
- Os testes existentes leem e alteram `state.config` (`tests/common/mod.rs`, `contract/auth_email_registration.rs`, `contract/auth_key_reminders.rs`) e `contract/production_boot.rs` monta `Config { ... }` por literal.
- `db::bootstrap(&Config)` abre o banco por `config.database_url`.
- A conta do primeiro cadastro é marcada em `account.is_initial_operator` (coluna existente); `GET /api/instance/status` devolve `{ initial_setup }`; o cadastro da primeira conta é feito em transação `BEGIN IMMEDIATE` em `register.rs`.
- O backend usa SQLite (`sqlx`, modo WAL) com migrações em `backend/migrations/` (última: `0027`). Não há dependência de cifragem AEAD nem `arc-swap`; há `argon2`, `sha2`, `rand`, `ed25519-dalek`.
- O limitador de pedidos (`rate_limit.rs`) conta pelo IP do peer TCP e ignora `X-Forwarded-For`; atrás de um proxy todos aparecem como `127.0.0.1`.
- O frontend não tem rotas: `index.tsx` usa um `Route path="*"` e `entryScreen(...)`, função pura coberta por `verify:entry-screens`. O estado inicial só é consultado com `!native && pathname === "/"`. `Account.tsx` já recebe `is_initial_operator`.

## Goals / Non-Goals

**Goals:**
- Configurar tudo pelo navegador ou pelo app, sem acesso à máquina, depois de iniciar o processo uma vez.
- Nenhuma mudança de comportamento para quem opera com variáveis de ambiente.
- Fechar a corrida pela primeira conta de administrador.
- Nenhuma configuração ruim derruba a instância de forma que exija acesso à máquina.

**Non-Goals:**
- Atualização do binário, backup/restauração, vários administradores, papéis finos de administração.

## Sequência de arranque

```
processo inicia  (parâmetro obrigatório: --data-dir / PARLEY_DATA_DIR)
  |
  1. BootPaths:  variável de ambiente > <dados>/bootstrap.json > <dados>/...
  |     (database, attachments, avatars)  + aplica caminho pendente (cópia verificada, D12)
  2. abre o banco  (migrações)
  3. lê configurações gravadas  -> Config efetiva  (ambiente > banco > padrão)
  |
  4. tenta subir com a configuração PENDENTE (porta, TLS, LiveKit)
  |     ok  -> grava como "última boa" e segue
  |     erro-> volta à "última boa" NESSE MESMO arranque, marca a pendente como falha
  5. abre o listener  (HTTPS autoassinado na fase de configuração)
  6. primeiro arranque? cria chave mestra, chaves do LiveKit, token (D5)
```

O diretório de dados `<dados>` é um só para as duas changes: parâmetro `--data-dir` ou variável `PARLEY_DATA_DIR`, com o mesmo significado. Padrão: o diretório do arquivo do banco quando `DATABASE_URL` está definida (na produção atual, `/opt/mesa/data`) e, senão, um padrão por sistema.

Estados da instalação: `vazia` → `em configuração` (token ativo) → `configurada` (trancada). Instâncias com contas já nascem `configurada`.

## Decisions

### D1. Registro tipado de configurações, não um mapa livre
Módulo `settings` com uma tabela estática de definições: `key`, `env_var`, `kind` (bool, int com faixa, enum, string, URL, segredo), `default`, `restart: bool`, `secret: bool`, `validate`. Tudo o que hoje é lido de `env::var` em `Config::from_env` passa a ser uma definição. Isso dá a lista de campos, a validação, a origem e a marcação de reinício num único lugar, e a tela é gerada a partir dessa lista.
*Alternativa descartada:* tabela chave/valor aceitando qualquer chave. Permitiria gravar lixo, perderia validação e tornaria a tela e os testes frágeis.

### D2. Armazenamento e precedência
Tabela `instance_setting(key TEXT PRIMARY KEY, value TEXT NOT NULL, is_secret INTEGER NOT NULL, updated_at TEXT NOT NULL, updated_by TEXT)` mais uma linha de estado (`setup_complete`, hash do token) e a tabela de histórico `instance_setting_audit` (D7). Valor efetivo = ambiente (se definido e não vazio) > banco > padrão. O resultado é materializado em uma `Config` (a struct atual), de modo que o resto do código continue a ler `config.registo_modo` etc. Os caminhos de dados ficam em `<dados>/bootstrap.json` (D12).

### D3. Configuração recarregável e `BootPaths`
`AppState.config` deixa de ser `Arc<Config>` e passa a ser um `ConfigHandle` (`ArcSwap<Config>`) com `state.config()` devolvendo `Arc<Config>` (snapshot por pedido). Ao gravar, o servidor valida o conjunto efetivo, grava em transação e troca o snapshot (gravação e troca são atômicas; duas alterações concorrentes são serializadas). Chaves com `restart: true` são gravadas mas o snapshot só as aplica no arranque; a API devolve `pending_restart`.
Uma estrutura mínima `BootPaths` (banco, anexos, avatares) é resolvida **antes** de existir uma `Config` completa; `db::bootstrap` e `issue_reset_code` passam a receber `BootPaths`.
A mudança nas **58 ocorrências** é mecânica (`state.config.x` → `state.config().x`). Os testes que leem ou alteram `state.config` passam a usar um auxiliar (`TestApp::with_config(|c| ...)`), `Config` ganha `Default` para os literais de teste, e `from_env()` mantém o comportamento de hoje. A meta é a mesma cobertura e as mesmas asserções, não «nenhum teste alterado».
Dependências novas: `arc-swap`, um AEAD (`chacha20poly1305`) e `subtle` (comparação em tempo constante); `rcgen`/`rustls` vêm da standalone.
*Alternativa descartada:* reiniciar sempre ao gravar. Pior experiência e derruba chamadas por mudanças triviais (convite, registro).

### D4. Segredos: AEAD com chave mestra em arquivo
`<dados>/secret.key` (32 bytes aleatórios, permissão 0600 / ACL restrita no Windows), criada no primeiro arranque. Os segredos são gravados como `enc:v1:` + nonce + texto cifrado (XChaCha20-Poly1305). A API devolve `{ "configured": true }` e nunca o valor; logs registram só a chave. Na interface, o campo de segredo mostra um valor fixo mascarado que não corresponde ao segredo; como a API nunca devolve o valor, nada sensível existe no DOM, no cache nem na área de transferência, e copiar o campo copia só a máscara. Editar envia o novo valor; deixar a máscara intacta não altera o segredo; o `<input>` usa `autocomplete="new-password"` para o gerenciador de senhas não o preencher. Segredos vindos do ambiente continuam sendo lidos de lá e nunca são copiados para o banco.
Se um segredo gravado **não puder ser decifrado** (chave mestra ausente ou diferente, banco restaurado de outro backup), ele é tratado como «não configurado», o servidor sobe normalmente e a tela avisa que o segredo precisa ser informado de novo.
*Alternativa descartada:* guardar em texto no banco. Um backup do `chat.db` vazaria as chaves de e-mail e do LiveKit. *Alternativa descartada:* derivar a chave de uma senha do administrador. Impediria reiniciar sem a senha.

### D5. Primeiro arranque e token de configuração
Quando não há banco no diretório de dados: cria diretório, banco (migrações), `secret.key`, chaves do LiveKit (guardadas como segredos; se existir o arquivo `<dados>/livekit.keys` criado pela `parley-server-standalone`, as chaves são lidas dele, gravadas cifradas e o arquivo é removido), liga o frontend embutido (`SERVE_FRONTEND=embedded`, da standalone) como padrão de instalação nova para que a interface de instalação seja entregue, certificado autoassinado (standalone, `TLS_MODE=self`) e o token (32 bytes aleatórios em hexadecimal; só o hash é guardado no banco; o valor em texto vai para o log e para `<dados>/setup-token`, 0600). `PARLEY_SETUP_TOKEN`, se definida, substitui o gerado. A comparação é em tempo constante. O primeiro arranque é retomável: se for interrompido a meio, a próxima execução completa o que faltou sem recriar o que já existe.
**Tentativas erradas recebem atraso progressivo global**, não bloqueio com 429: o limitador por IP conta pelo peer TCP e, atrás de um proxy, todos aparecem como `127.0.0.1`; um visitante malicioso esgotaria o balde compartilhado e travaria o dono fora da instalação. A defesa real é a entropia de 256 bits do token. O cadastro da primeira conta valida o token **dentro da mesma transação `BEGIN IMMEDIATE`** que já protege a corrida, e ao criar o administrador marca `setup_complete`, apaga o hash e o arquivo do token.
*Alternativas descartadas:* «primeiro a chegar vence» (qualquer um assume uma instância exposta) e bloqueio por IP (acima).

### D6. Instalador tranca-se; instâncias existentes ficam fora dele
Estado de instalação derivado de `setup_complete` ou da existência de qualquer conta: se há contas, a instância é tratada como configurada e não gera token (produção atual). Antes do administrador, um middleware só deixa passar `/health`, `/api/instance/status`, `/api/setup/*`, o cadastro da primeira conta e os arquivos estáticos; o resto responde 403. Depois, `/api/setup/*` responde 404. Reabrir exige apagar os dados na máquina.

### D7. Autorização, reautenticação e auditoria
Extrator `InstanceAdmin` (casca fina sobre o `AuthUser` existente) que exige sessão válida e `is_initial_operator = true`; 401 sem sessão, 403 caso contrário. As rotas `/api/admin/settings` (GET/PATCH), `/api/admin/restart` (POST), `/api/admin/reauth` (POST) e `/api/admin/diagnostics` ficam atrás dele. O administrador **não** ganha acesso a conteúdo.
**Reautenticação:** reiniciar, trocar `PUBLIC_BASE_URL`/TLS/domínio, substituir segredos e alterar caminhos de dados exigem uma prova recente de senha. `POST /api/admin/reauth` valida a senha (argon2 existente) e registra, em um mapa **em memória** `session_id → expiração` (5 minutos; some no reinício, sem migração), a confirmação presa àquela sessão. Sem ela, 403 com `reauth_required`. **A criação da conta e um login feito nos últimos 5 minutos contam como confirmação**, para o assistente não pedir a senha de quem acabou de digitá-la. O endpoint tem limite **por sessão e conta**, com atraso progressivo, e não por IP (o limitador por IP colapsa atrás de proxy, como em D5).
**Auditoria:** cada alteração grava uma linha em `instance_setting_audit` (chave, conta, horário, valor anterior e novo; **nunca** valores de segredos, apenas o fato de terem sido substituídos) e uma linha de log.

### D8. Reinício e falha de subida
`POST /api/admin/restart` responde 202 e usa o **desligamento ordenado da standalone** (fecha o listener, fecha o `WsHub` com prazo, encerra filhos como o LiveKit) e então, quando o motivo da parada devolvido por `server::run` da standalone é `Restart`, re-executa o executável com os mesmos argumentos (Unix: `exec`, mantendo o PID e o supervisor; Windows: inicia o novo processo e sai; o `host-manager` do app reconhece o novo processo). A sequência de arranque (acima) tenta a configuração pendente e, **se o bind, o TLS ou o LiveKit falharem, cai para a última boa dentro do mesmo arranque**, marca a pendente como falha e registra o motivo; a tela mostra o «último erro de aplicação» em `/api/admin/diagnostics`. Isso não depende de supervisor. A «última boa» é gravada só depois que o novo processo responde a `/health`.
*Alternativas descartadas:* sair e confiar no supervisor (falha em execução direta e no app desktop); restaurar «no arranque seguinte» (não existe arranque seguinte sem supervisor).

### D14. Aplicar com confirmação (mudanças de rede e de endereço)
Mudanças em `PUBLIC_BASE_URL`, `TRUSTED_PROXY`, `TLS_MODE`/domínio e `BIND` podem tornar a instância inalcançável para o próprio administrador sem que o servidor falhe (a queda para a última boa de D8 não dispara). Por isso elas entram em **janela de confirmação**: o servidor guarda os valores anteriores e um prazo (padrão 60 s) em `instance_setting` (sobrevive a reinício), aplica o novo valor e espera `POST /api/admin/confirm`, que só é alcançável se a sessão do administrador funciona no novo endereço. Sem confirmação até o prazo, o servidor **volta sozinho aos valores anteriores** (e se reinicia, quando a mudança exigia reinício). A tela mostra a contagem regressiva e o botão «Confirmar»; o assistente usa o mesmo mecanismo. A confirmação grava a mudança como definitiva. Quando a mudança troca a **origem** (porta ou esquema, por exemplo de `self` em 8443 para `acme` em 443), o cliente deixa de alcançar o servidor na origem antiga: a tela recebe a nova origem, a abre e confirma de lá, que é o que prova que a nova configuração funciona para o administrador. Se o bind na nova porta falhar (por exemplo, sem `CAP_NET_BIND_SERVICE`), a queda para a última boa de D8 mantém a origem antiga.
*Alternativa descartada:* confiar só na validação prévia. Não detecta um endereço que é válido mas inalcançável do lugar do administrador.

### D9. HTTPS durante a configuração
Padrão do primeiro arranque: `TLS_MODE=self` (da standalone), com a impressão digital no log. O assistente leva o administrador a informar o domínio e escolher entre manter o certificado autoassinado e ACME; essa troca é uma mudança com reinício e com reautenticação. Se o servidor estiver atrás de um proxy que termina TLS, a configuração de arranque pode declarar isso (variável, nunca só pela tela) e o servidor serve em HTTP local. Sem TLS embutido disponível (build antigo), o servidor recusa servir a instalação em HTTP puro e explica como declarar o proxy.
*Alternativa descartada:* HTTP com aviso. Expõe o token e a senha na rede durante a instalação.

### D10. Interface, roteamento e app nativo
`entryScreen` ganha o destino `setup` para o cadastro guiado do primeiro administrador (instância em configuração, com o campo do token), com `verify:entry-screens` atualizado. Depois de criar a conta, o administrador entra no shell autenticado e o **assistente** (endereço e HTTPS, registro, e-mail, voz, revisão) abre uma vez no primeiro login, no padrão do `welcomeAccountId` já usado em `Account`. A tela «Configurações da instância» fica no shell autenticado, acessada a partir da página de conta (que já recebe `is_initial_operator`; não há endpoint novo para isso). No app nativo, o estado inicial passa a ser consultado também com instância guardada e sessão anônima, independentemente do `pathname` (`/index.html`), para que o host local use o mesmo fluxo com o token entregue pelo `host-manager`. A lista de campos vem de `GET /api/admin/settings` (metadados da D1: tipo, rótulo i18n, grupo, travado, origem, pendente), então novos campos não exigem tela nova.

### D11. Mapeamento das variáveis atuais
| Variável | Campo | Reinício | Segredo |
|---|---|---|---|
| `REGISTO_MODO`, `REGISTO_DOMINIOS_BLOQUEADOS` (conteúdo da lista, não o caminho) | Registro | não | não |
| `DEFAULT_INVITE_TTL_SECS`, `SESSION_TTL_SECS` | Convites e sessão | não | não |
| `PUBLIC_BASE_URL` | Endereço (reautenticação) | não | não |
| `COOKIE_SECURE` | Derivado: verdadeiro quando o perfil é produção ou o esquema do endereço público é https (D13) | — | — |
| `EMAIL_FROM`, `EMAIL_API_KEY`, `RESET_EMAIL`, `KEY_REMINDERS` | E-mail | não | sim (chave) |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET` | Anti-abuso | não | sim (segredo) |
| `TRUSTED_PROXY` | Proxy | não | não |
| `LIVEKIT_WS_URL`, `LIVEKIT_EGRESS_FILE_PREFIX` | Voz | não | não |
| `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` | Voz (geradas) | sim | sim |
| `BIND`, `TLS_MODE`, `SERVE_FRONTEND`, `STATIC_DIR` | Rede e interface (reautenticação) | sim | não |
| `LIVEKIT_MANAGED`, `LIVEKIT_TURN`, `LIVEKIT_BINARY_PATH`, IP anunciado do LiveKit | Voz | sim | não |
| `PUBLIC_HOME` (change `web-home-page`) | Página inicial | não | não |
| `DATABASE_URL`, `ATTACHMENTS_DIR`, `AVATARS_DIR` | Caminhos de dados, com padrão em `<dados>/…` pré-preenchido e editável; ficam em `bootstrap.json` (D12) | reinício no host | não |
| `PARLEY_PRODUCTION` | Derivado do endereço público (D13); a variável, se definida, vence | — | — |
| `PARLEY_RATE_LIMIT_DISABLED`, `EMAIL_LOG_FILE` | Somente ambiente (diagnóstico) | — | — |

### D12. Caminhos de dados em `bootstrap.json`, com cópia verificada
O banco, as pastas de anexos e as de avatares são lidos antes de qualquer configuração gravada no banco. Por isso seus valores ficam em `<dados>/bootstrap.json` (campos `database`, `attachments`, `avatars`), com precedência variável de ambiente > `bootstrap.json` > padrão `<dados>/…`. A tela mostra o padrão já preenchido e permite editar (com reautenticação). Ao salvar, o servidor valida (caminho absoluto ou resolvível, pai existente, destino gravável e vazio ou já contendo uma instância Parley) e grava o novo valor como **pendente** em `bootstrap.json` (`pending`), sem mudar nada em execução.
A aplicação acontece no **próximo arranque do backend, feito diretamente no host**: antes de abrir o banco, o servidor copia os dados do local atual para o novo (`VACUUM INTO` para o SQLite, que exige destino inexistente e funciona com o modo WAL; cópia com conferência de tamanho e hash para anexos e avatares), confere o resultado, troca o caminho e só então segue o arranque; falha em qualquer etapa mantém o local anterior (a mesma lógica de queda para a «última boa», D8). Por padrão a cópia é feita; um «não copiar» explícito serve a quem já moveu os arquivos à mão. A tela informa, sempre que um caminho é alterado, que a mudança **exige reiniciar o backend diretamente no host** e que o botão «Aplicar e reiniciar» não a aplica.
*Alternativas descartadas:* (a) apenas apontar sem copiar: um caminho trocado por engano faria a instância parecer vazia; (b) aplicar pelo reinício automático da D8: copiar anexos grandes pode levar muito tempo e é melhor sob controle de quem está no host.

### D13. Perfil de produção derivado
O perfil de produção passa a ser **derivado**: ligado quando `PARLEY_PRODUCTION` está definida, ou quando `PUBLIC_BASE_URL` é HTTPS com um **nome de domínio** público (esquema https, sem `localhost`/`.localhost`/loopback, **sem endereço IP literal**, sem query nem fragmento; o predicado atual de `Config::validate` não exclui IPs privados, então a regra de derivação é mais estrita que ele). Hosts por IP (como o host local do app desktop) não ligam o perfil derivado; quem precisa dele usa a variável. Ele governa as validações de produção, o atributo `Secure` dos cookies e `COOKIE_SECURE`. Assim uma instalação feita pelo navegador, sem `.env`, não fica sem as proteções de produção quando for exposta.
**HSTS:** quando `COOKIE_SECURE` ou `PARLEY_PRODUCTION` vêm do ambiente, o cabeçalho continua exatamente como hoje (`max-age=31536000; includeSubDomains`). Quando o perfil é só derivado, o `strict-transport-security` só é emitido se o certificado for confiável (`TLS_MODE=acme` ou TLS terminado por proxy declarado), com `max-age=86400` e **sem** `includeSubDomains`. Com certificado autoassinado em um domínio o HSTS impediria o «continuar mesmo assim» do navegador e não poderia ser desfeito do servidor.
*Alternativa descartada:* manter só o ambiente. Deixaria sem proteção justamente as instâncias que esta change facilita expor.

### D15. Padrões de instalação nova
A standalone mantém todos os modos desligados para quem opera só com variáveis. O primeiro arranque automático (D5), que é a instalação nova, grava como configuração os padrões que fazem uma instância funcionar sem acesso à máquina: `SERVE_FRONTEND=embedded` (se o binário tem o frontend embutido), `TLS_MODE=self`, `LIVEKIT_MANAGED` ligado (a voz é o núcleo do produto; o passo de voz do assistente permite trocar por um LiveKit externo) e `LIVEKIT_TURN` desligado, com o aviso de redes que bloqueiam UDP exibido no assistente e nos diagnósticos. Variáveis de ambiente continuam vencendo e travando. Instâncias que já têm contas não recebem esses padrões. O LiveKit gerenciado só passa a existir depois que o administrador existe; antes disso, `/rtc` não responde (filtro D6).
*Alternativa descartada:* manter tudo desligado também na instalação nova. A instância ficaria sem interface e sem voz até alguém editar variáveis na máquina, contrariando o objetivo.

## Risks / Trade-offs

- [Refatoração de `config` em 58 pontos e nos testes] → mudança mecânica atrás de `state.config()`, auxiliar de teste, `Default` em `Config`, mesma cobertura.
- [Token vazado no log (terminal compartilhado, log agregado)] → uso único, tranca ao criar o administrador, opção de `PARLEY_SETUP_TOKEN`; documentar para não colar o log em lugares públicos.
- [Reinício deixa a instância fora do ar com configuração ruim] → validação prévia, queda para a última boa no mesmo arranque e teste de falha de bind/TLS.
- [Chave mestra perdida ou restaurada de outro backup] → documentar a inclusão do `secret.key` e do `bootstrap.json` no backup; segredo ilegível vira «não configurado» sem impedir o arranque.
- [Perda da conta de administrador] → a recuperação só é possível no host (`chat-backend reset-code`); documentar o procedimento. Vários administradores ficam fora de escopo.
- [Sessão roubada vira controle da instância] → reautenticação para as ações sensíveis e auditoria.
- [Mudança de endereço/proxy/TLS deixa o administrador sem acesso] → janela de confirmação com reversão automática (D14).
- [HSTS em cache impede o acesso se o certificado deixar de ser confiável] → HSTS só com certificado confiável no perfil derivado, `max-age` curto e sem `includeSubDomains` (D13).
- [`/api/admin/reauth` serve de oráculo de senha] → limite por sessão/conta com atraso progressivo (D7).
- [`PUBLIC_BASE_URL` errado gera e-mails com links quebrados ou para domínio alheio] → validação (HTTPS, host público) e aviso antes de salvar.
- [Campos travados confundem quem tem `.env` antigo] → a tela explica a origem e o guia ensina a migrar uma variável para a tela (remover a linha e reiniciar).
- [A tela vira superfície de ataque] → rotas atrás do extrator do administrador, atraso progressivo no instalador, nenhum segredo em respostas, auditoria.
- [Atraso progressivo global pode ser abusado para atrasar o dono] → o atraso é limitado (teto curto) e o token tem entropia suficiente para não precisar de bloqueio.

## Migration Plan

1. Migração de banco aditiva (`instance_setting`, `instance_setting_audit`, estado de instalação); sem alterar tabelas existentes.
2. Publicar o binário novo na produção sem remover o `mesa.env`: tudo fica travado e idêntico; o administrador existente passa a ver a tela.
3. Opcional, campo a campo: remover uma linha do `mesa.env`, reiniciar e passar a controlar o campo pela tela.
4. Rollback: voltar ao binário anterior (a migração é aditiva e as variáveis continuam valendo).
