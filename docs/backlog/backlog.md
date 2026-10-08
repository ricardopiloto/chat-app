# Backlog — funcionalidades futuras (fora do novo design system)

**Contexto**: gerado em 2026-09-30 como parte da preparação do [prompt de design system para o Google Stitch](../design-system/stitch-prompt.md). Este ficheiro reúne tudo o que é **funcionalidade futura, diferida ou não implementada** no frontend actual — portanto, **não deve ser incluído** no prompt de criação do novo design system. O prompt cobre apenas o que já está em produção hoje.

Fontes cruzadas: `README.md`, `docs/product-brief.md`, `docs/backlog-prototype-v2-gaps.md`, `CHANGELOG.md` e inspecção directa de `frontend/src/` (ficheiros de componentes existentes mas não importados/usados = "código morto", tratados como não implementados).

> Nota de higiene: alguns itens abaixo já estavam listados como diferidos em `docs/backlog-prototype-v2-gaps.md` (IDs G1, G3, G7–G10). Esse ficheiro continua a ser a fonte de detalhe técnico para esses; aqui ficam resumidos e unificados com os restantes itens diferidos encontrados no README e no product-brief.

---

## 1. Gravação de cena / Egress (G1)

Botão/diálogo "Gravar cena" com aviso de desligar E2EE, indicador permanente e religar após gravar. A API (`startEgress`/`stopEgress`) existe no cliente, mas **nenhuma UI chama estas funções** — foi suspensa na spec 049 e nunca reposta.

**Porquê ainda não**: decisão consciente de simplificar o palco de voz depois da 049; gravação exige fluxo de custódia de chave + auditoria já parcialmente desenhado.

## 2. Múltiplas cenas por canal de voz (G10)

Criar, listar, duplicar, activar e apagar **várias** cenas nomeadas por canal (em vez de uma única cena editável). O componente `SceneList.tsx` já existe e está funcionalmente pronto, mas não está montado em nenhuma página — só `SceneEditor.tsx` (cena única) está em uso.

**Porquê ainda não**: diferido desde a spec 007, que reduziu o fluxo a "uma cena, editável". É o item mais "pronto a ligar" do backlog — UI já existe, falta integrá-la.

## 3. Co-diretor

Papel de "co-diretor" com permissão para operar a composição de câmeras em conjunto com o dono do canal. Existe um ficheiro `CoDirectorPanel.tsx`, mas não está importado em lado nenhum — não é uma funcionalidade real hoje.

## 4. Templates de cena partilháveis

Guardar/exportar/importar layouts de cena entre canais ou servidores. Não existe qualquer código relacionado.

## 5. Diretório público de servidores (G3)

Listagem pública/opt-in de servidores hospedados numa instância, para descoberta sem convite directo. Sem modelo de dados nem UI.

## 6. Metáfora de posição livre / canvas (G7)

Alternativa ao grid de slots nomeados (Mestre em destaque / Painel / Faixa): posicionamento livre de câmeras num canvas. Descartado no MVP; backlog original marca como "diferido, provável nunca".

## 7. Papéis nos chips dos tiles de câmera (G8)

Mostrar um papel de mesa (ex.: "Mestre") no chip de nome sobre cada câmera, além do handle. Não existe entidade de "papel de mesa" (distinto de papéis/permissões de servidor) no modelo actual.

## 8. Contagens/badges numéricos na lista de canais (G9)

Badges com contagem (ex.: mensagens não lidas por canal) na lista de canais/rodapé. Hoje só existem indicadores binários (ponto de não-lido, ponto de voz activa) — sem números.

## 9. Federação entre instâncias

Comunicação entre instâncias de hospedagem distintas (ao estilo Matrix). Decisão de produto explícita de **não** fazer — isolamento total é intencional — mas mantido aqui para registo, caso a decisão seja revisitada.

## 10. Sistema de plugins / API pública

Superfície de extensão para terceiros (plugins, webhooks, bots). Sem qualquer código ou contrato hoje. Três casos de uso concretos (hoje resolvidos via bots externos no Discord real) motivam o desenho, e cobrem padrões de integração bem diferentes:

- **Bot de música (ingress de áudio) — prioridade da versão inicial**: hoje existe um bot no Discord que serve de entrada para o Kenku, usado para tocar música durante sessões de RPG. O equivalente nesta plataforma seria um bot (modelo Kenku ou mais simples) controlável pelo utilizador, que entra num canal de voz e toca áudio a partir de um link (YouTube ou similar). Do ponto de vista de quem escuta não quebra E2EE — o bot publica uma faixa de áudio como qualquer participante humano publicaria.
- **Bot de conversa/comandos (texto + conhecimento) — prioridade da versão inicial**: exemplo próprio — o bot "Bertroldo" (`discord-bot/` do autor) escuta mensagens num canal autorizado do Discord, mantém histórico por utilizador, injecta conhecimento via RAG e contexto de personagem por discord-id, e responde através de uma LLM externa. O equivalente aqui exigiria API de leitura/escrita de mensagens num canal, mais identificação estável de utilizador — não envolve áudio nem E2EE de voz.
- **Bot de transcrição (egress de áudio por participante) — não obrigatório na versão inicial da camada de integração**: hoje existe um bot ("Cronista", `discord-transcription/` do autor) que entra num canal de voz do Discord, escuta e identifica cada participante por discord-id, e envia o áudio para um serviço externo (whisper) que faz a transcrição da sessão. Investigação à parte confirmou que este bot **não contorna o E2EE do Discord (DAVE/MLS)** — ele participa do protocolo como um cliente de voz legítimo (via bindings `davey`, inclusive dependendo de uma PR não-mergeada da biblioteca `py-cord` para decodificar sob DAVE) e decifra localmente, tal como qualquer humano. Isso confirma que a via tecnicamente correcta aqui é o bot tornar-se um **participante E2EE real** (recebe envelope de chave como qualquer membro), não um listener passivo no servidor. Mesmo assim, fica fora do escopo da primeira versão do item 10; o caso de música e o de conversa não dependem desta resolução. Este caso **continua a depender do item 1 (Gravação/Egress)** quando for retomado — do ponto de vista de segurança é uma gravação selectiva e contínua, exigindo o mesmo aviso de desligar E2EE, indicador permanente e fluxo de custódia de chave já desenhados (parcialmente) para a gravação de cena.

**Porquê ainda não**: não existe sequer um contrato de "bot"/aplicação externa (autenticação própria, modelo de permissões distinto de utilizador humano, superfície de API separada para texto vs. media). O caso de transcrição em particular não pode avançar sem resolver primeiro a tensão com E2EE já registada no item 1.

### Referência: como o Discord resolve isto (camadas de permissão de bots)

O Discord não tem um único "nível de permissão" para bots — são **quatro camadas independentes**, e o desenho do item 10 deveria replicar essa separação em vez de um único bitfield global:

1. **Concessão na instalação (OAuth2 `bot` + `permissions=N`)**: ao gerar o link de convite, o criador da app escolhe um bitfield de permissões (as mesmas ~50 flags usadas por papéis humanos — `SEND_MESSAGES`, `CONNECT`, `SPEAK`, `MANAGE_MESSAGES`, etc.). O servidor que instala o bot vê esse pedido e autoriza-o; o Discord cria/atribui um papel ao bot com essas permissões. É um "pedido de escopo" explícito e visível no momento de instalar, não um acesso implícito total.
2. **Papel + overwrite por canal (igual ao de utilizadores humanos)**: as permissões do bot combinam-se por OR entre os papéis que tem, e depois sofrem overwrites allow/deny por canal (para o papel do bot ou para o bot como membro específico), com ordem de resolução fixa: base de papéis do servidor → overwrite `@everyone` do canal → overwrite de papel do canal → overwrite específico do membro/bot. `ADMINISTRATOR` ignora todos os overwrites; negar `VIEW_CHANNEL` nega tudo o resto implicitamente. **Esta camada já existe nesta plataforma** para papéis humanos (spec [047](../../specs/047-server-channel-permissions/spec.md) — toggles Geral/Texto/Voz por papel + ACL por canal, explicitamente modelado "padrão tipo Discord"); o gap é só estender o mesmo mecanismo a um principal do tipo "bot".
3. **Intents de gateway (o que o bot *recebe*, não o que pode *fazer*)**: eixo ortogonal às permissões — controla que eventos o processo do bot recebe da ligação (ex.: conteúdo de mensagens, presença, lista de membros). Os mais sensíveis (`GUILD_MEMBERS`, `GUILD_PRESENCES`, `MESSAGE_CONTENT`) são "privilegiados": têm de ser activados explicitamente no portal de developer, e bots grandes (100+ servidores) passam por revisão manual da Discord para os manter. Isto é o equivalente a dizer "o bot pode falar no canal" (permissão) vs. "o bot sequer recebe o áudio/texto desse canal" (intent) — a segunda é defesa em profundidade: um bug no bot de transcrição não expõe canais para os quais nunca pediu `intent` de áudio, mesmo que tecnicamente tivesse permissão de `CONNECT`.
4. **Permissões por comando (Application Command Permissions v2)**: uma terceira camada, mais fina, por cima das anteriores — o administrador do servidor restringe, por comando individual (ex.: `/tocar`, `/transcrever`), que papéis/membros/canais podem invocá-lo, via Server Settings → Integrations. É independente das permissões do próprio bot: um utilizador pode ter acesso ao comando `/tocar` sem que isso mude o que o bot em si pode fazer no canal.
5. **Revogação atómica**: o administrador pode em qualquer momento remover a integração inteira (Server Settings → Integrations → Remove), o que invalida de imediato todas as camadas acima para aquele servidor — sem precisar de editar papéis um a um.

### Chave por canal vs. chave por servidor (pré-requisito criptográfico para escopar bots)

Hoje a camada 2 do Discord (overwrite por canal) **não tem equivalente criptográfico** nesta plataforma: existe uma única `server_key` (AES-256-GCM) por Servidor, usada para texto ([Message.content_ciphertext](../../specs/002-fase-1-mvp/data-model.md)) **e** como frame key de voz/vídeo no LiveKit, com um único `KeyEnvelope` por par `(server_id, account_id)` ([key-handoff.md](../../specs/002-fase-1-mvp/contracts/key-handoff.md)). No cliente é um `Map<serverId, key>` carregado a eager para **todos** os servidores do utilizador no login ([keyHandoff.ts](../../frontend/src/crypto/keyHandoff.ts)). Dar a um bot acesso "só a um canal" hoje significaria, na prática, dar-lhe a chave do Servidor inteiro — decifra texto de todos os canais e qualquer voz, para sempre. Analisámos o impacto de mudar o escopo da chave de Servidor para Canal:

- **Resolve um descompasso de segurança que já existe hoje, independente dos bots**: desde a spec [047](../../specs/047-server-channel-permissions/spec.md) há canais privados com ACL, mas essa ACL é só autorização de aplicação (filtra a query do backend) — criptograficamente qualquer membro do Servidor já tem a chave que decifraria um canal privado, se tivesse acesso aos bytes (dump de DB, backup, bug de ACL). Chave por canal torna a privacidade do canal real do ponto de vista criptográfico, não só uma promessa do backend.
- **Texto e voz já são `Channel` separados no modelo** (`type: text | voice_video`), então chave por canal separa automaticamente texto de voz também — hoje ambos partilham a mesma `server_key`.
- **Voz é quase grátis de migrar**: o ponto de uso já resolve a chave "pelo canal" (`channel.server_id` em [callSession.tsx](../../frontend/src/voice/callSession.tsx)) — trocar para `channel.id` é a mudança principal.
- **Texto é onde o custo concentra-se**: handoff passa de 1 evento por novo membro do servidor para 1 evento por `(canal, membro)` — multiplica pelo nº de canais visíveis; criar um canal passa a ser também uma operação criptográfica (gerar `channel_key` + selar para os membros elegíveis); conceder acesso a um canal privado (editar ACL) passa a exigir também um handoff, não só uma edição de ACL; o carregamento eager de chaves no login teria de passar a lazy-por-canal (ou aceitar um burst proporcional ao nº total de canais, não de servidores).
- **Não resolve revogação/forward secrecy por si só**: remover alguém da ACL de um canal não invalida retroativamente a chave que o cliente dele já sincronizou localmente — precisaria de rotação de chave + reselagem aos membros remanescentes a cada remoção, que é o mesmo tipo de complexidade (ratcheting de grupo) que tornou o bot de transcrição do Discord frágil sob DAVE/MLS (ver caso acima). Chave por canal melhora o escopo de acesso a partir de agora; não é, por si, revogação instantânea.
- **Migração não é incremental**: cada Servidor existente precisaria gerar uma `channel_key` por canal e reselar para os membros elegíveis — um "big bang" de handoffs, ou um período de transição com as duas chaves válidas.

**Conclusão para o item 10**: o ganho de segurança (escopar o acesso de um bot a um canal, não ao Servidor inteiro) já justifica a mudança mesmo sem resolver revogação perfeita, e é um pré-requisito melhor dimensionado para os dois casos priorizados (música e conversa) do que reaproveitar a `server_key` tal qual.

### Caminho recomendado (nem ignorar a brecha, nem bloquear tudo numa migração total)

A dúvida em aberto era: para destravar bots, corrigimos a brecha de escopo primeiro (migração completa, bloqueante) ou ignoramos e usamos a `server_key` como está? **Nenhuma das duas** — há um caminho intermédio que reutiliza o mecanismo já existente sem exigir mexer em todos os canais de uma vez:

1. **Chave de canal como capacidade opcional, não substituição obrigatória**: um canal continua em `server_key` por omissão (nenhuma migração "big bang" dos canais existentes). Um canal só "promove" para uma `channel_key` própria no **momento em que o primeiro bot é instalado nele** — reaproveita tal e qual o mecanismo de `KeyEnvelope`/handoff já construído ([key-handoff.md](../../specs/002-fase-1-mvp/contracts/key-handoff.md)), só troca a chave sendo selada de `server_key` para uma `channel_key` gerada na promoção, e resela-a aos membros humanos correntes do canal.
2. **Conteúdo anterior à promoção fica fora de alcance do bot — e isso é desejável, não uma lacuna**: mensagens/áudio de antes da promoção continuam só em `server_key`, que o bot nunca recebe; o bot só lê a partir do momento em que entrou. Isto espelha um padrão que já existe no produto: o corte de histórico por `Membership.joined_at` quando um convite não inclui histórico ([data-model.md:116](../../specs/002-fase-1-mvp/data-model.md)) — um bot instalado é tratado, criptograficamente, como um membro novo sem acesso retroativo.
3. **Escopo exacto por caso de uso**: o bot de música recebe a `channel_key` só do canal de voz onde foi instalado (precisa dela para cifrar a própria faixa com o esquema simétrico do LiveKit — não porque precise de decifrar o resto, mas porque o esquema é simétrico); o bot de conversa recebe a `channel_key` só do canal de texto onde foi instalado. Nenhum dos dois toca na `server_key` nem em qualquer outro canal do Servidor.
4. **Aviso continua necessário, mas é mais leve que o do item 1**: como o bot passa a ser um detentor real da chave daquele canal (não um bypass), os membros desse canal específico devem ver um indicador de que há um bot com acesso de decifragem ali — paralelo ao indicador permanente já desenhado para gravação, mas escopado só ao canal, não ao Servidor nem a um aviso de "E2EE desligado".
5. **Generalizar `channel_key` a todos os canais (resolver o mismatch de ACL privada vs. cripto mesmo sem bots) fica como evolução posterior, não bloqueante** — é o item certo a fazer eventualmente, mas não precisa anteceder o lançamento dos bots de música/conversa.

Isto destrava os dois casos prioritários com escopo real (não server-wide), sem transformar o item 10 numa reescrita da camada de criptografia primeiro.

**Implicação para o desenho do item 10**: os três casos de uso mapeiam-se de forma diferente nestas camadas — o bot de música só precisa das camadas 1–2 (permissão de `CONNECT`/`SPEAK`, sem intents sensíveis); o bot de conversa precisa de 1–2 e de um equivalente a `MESSAGE_CONTENT` (intent explícito, não implícito, já que é leitura de texto de terceiros); o bot de transcrição precisa de 1–2 **e** de um intent de áudio por participante explicitamente aprovado, dado que é o caso com maior risco (equivalente ao `GUILD_MEMBERS`/`MESSAGE_CONTENT` privilegiados, mas para áudio) — reforça a dependência já anotada do item 1. A camada 4 (permissão por comando) só importa se/quando os bots expuserem comandos tipo slash-command.

Fontes: [Discord Developer Docs — Permissions](https://docs.discord.com/developers/topics/permissions), [OAuth2](https://docs.discord.com/developers/topics/oauth2), [Gateway Intents](https://docs.discord.com/developers/events/gateway#gateway-intents), [Application Command Permissions](https://docs.discord.com/developers/interactions/application-commands#permissions).

## 11. Importador de estrutura do Discord

Fluxo de importação de servidores/canais/cargos a partir de uma exportação do Discord. Sem qualquer código hoje.

## 12. Painel de estatísticas sociais

Dashboard de métricas de uso/engajamento por servidor. Sem qualquer código hoje.

## 13. Migração de identidade entre instâncias

Mover a identidade criptográfica de um utilizador de uma instância de hospedagem para outra. Sem qualquer código hoje; permanece em aberto no product-brief.

## 14. Empacotamento desktop único (Tauri) + self-host a partir do client

Distribuição como binário único cliente+servidor via Tauri, para Windows/Mac/Linux nativos. Hoje a aplicação é uma SPA web separada do backend Rust/Axum — não há qualquer integração Tauri no repositório.

**Caso de uso concreto que motiva o item**: o client desktop deve conseguir, a partir da própria aplicação (sem terminal/Docker/configuração manual), **iniciar uma instância do Mesa na máquina do utilizador numa porta específica**, para que outras pessoas se liguem directamente a esse host — hospedagem doméstica de uma mesa de RPG a partir do portátil de quem está a jogar, em vez de depender de um servidor alugado sempre online. Implica: UI para escolher/validar a porta e arrancar/parar o processo do backend embutido no binário Tauri, superfície de rede acessível a quem vai ligar-se (IP local/LAN no mínimo; exposição à internet, se desejada, é um problema à parte de NAT/reverse proxy, fora deste item), e persistência dos dados da instância na máquina do anfitrião enquanto ele a mantiver a correr.

**Porquê ainda não**: depende da parte "binário único" já descrita acima (embutir o backend Rust no empacotamento Tauri) — sem isso não há o que iniciar a partir do client.

## 15. Preferências de notificação configuráveis

Ecrã de definições para controlar o comportamento de notificações (menções, respostas, canais com novidades). Hoje o comportamento é automático e global, sem nenhuma tela de configuração.

## 16. Convites permanentes / TTL configurável via UI

O diálogo de convite actual não expõe nenhum controlo de validade — o backend fixa 5 minutos / 10 usos por omissão. Uma eventual opção de "convite permanente" ou TTL customizável ainda não tem UI (nem se sabe se o backend aceita).

## 17. Cópia de chave no servidor para compliance legal/jurídica

Guardar no servidor (operador da instância) uma cópia da chave de criptografia de cada Servidor/Canal, para o cenário em que o host precise responder a uma ordem legal (polícia/governo/tribunal) que exija entregar os dados daquele Servidor **descriptografados**. Sem qualquer código ou desenho hoje — apenas registado para discussão futura, a pedido explícito do autor (2026-10-03).

**Nota de tensão com o modelo actual**: isto contradiz directamente a garantia de E2EE hoje documentada — *"o operador da instância não obtém áudio/vídeo decodificável sem as chaves dos clientes"* ([docs/e2ee-gaps.md](../e2ee-gaps.md)) e o handoff de chave que hoje é desenhado precisamente para o backend nunca ver a `server_key` em claro ([key-handoff.md](../../specs/002-fase-1-mvp/contracts/key-handoff.md)). Guardar uma cópia no servidor muda a natureza da garantia de "ponta-a-ponta" para algo mais próximo de "cifrado em repouso com custódia pelo operador" — a decidir com cuidado (qual o âmbito legal real, se é por instância/jurisdição, se afecta a promessa de produto feita a utilizadores). Por agora, só registo — sem decisão tomada.

## 18. Fluxo de recuperação de senha esquecida — Implementado (2026-10-08)

**Implementado** pelo change OpenSpec `password-recovery`: as duas fases descritas abaixo (opção A e opção B) estão entregues e testadas (backend: contratos de `auth_recovery`/`auth_recovery_key`; frontend: `npm run build`/lint/`test:contracts` verdes e verificação manual no navegador).

- **Fase 1 (opção A — reset pelo operador, nova identidade):** subcomando `reset-code <handle>` no binário do backend (ver [docs/operar-instancia.md](../operar-instancia.md)); `POST /api/auth/recovery/code/redeem`; `PUT /api/auth/password` (alterar senha com a senha actual, mesma identidade); ecrã público `/recover`, caminho "Tenho um código do operador".
- **Fase 2 (opção B — chave de recuperação, preserva a identidade):** geração da chave de recuperação no registo directo e por convite (confirmação "guardei" antes do POST); cartão "Chave de recuperação" em "Minha conta" para criar/substituir numa conta já existente; `/recover`, caminho "Tenho a chave de recuperação".
- **Correcção associada:** a bifurcação da chave de um Servidor após troca de identidade (dono perde a senha, cliente gerava uma `server_key` nova em vez de esperar o handoff) foi corrigida com uma guarda transaccional no backend (409 em sobrescrita não-idempotente) e o cliente passou a consultar um indicador de existência antes de gerar chave nova.
- **Desvio de UI registado:** o link do ecrã de login que no mockup dizia "Esqueceu o cofre?" passa a **"Esqueci a senha"** e abre `/recover` (ver [docs/v2/AUDIT-fidelity.md §10](../v2/AUDIT-fidelity.md)).
- **Fora desta entrega:** item 19 (tela de admin para emitir códigos, só registo abaixo); item 17 (cópia de chave no servidor); credenciais/recuperação de contas de bot (fora do universo de contas humanas que este fluxo cobre).

Hoje não existe nenhum caminho de "esqueci a senha" — nem rota no backend nem tela no frontend. Um utilizador que perde a password fica sem acesso à conta.

**Porquê isto não é um simples "reset de password" como em apps convencionais**: a password aqui não é só a credencial de login — é também a chave que desencripta a `identity_vault` guardada no servidor (`account.identity_vault`, [0002_identity_vault.sql](../../backend/migrations/0002_identity_vault.sql)), o blob que contém o par de chaves X25519 da identidade do utilizador ([identity.ts](../../frontend/src/crypto/identity.ts), `wrapVault`/`unlockVault`). O servidor nunca vê essa chave privada nem a password em claro. Isto significa que **um "reset" que só troca o `password_hash` no servidor não devolve acesso a nada** — a `identity_vault` antiga continua cifrada com a password antiga e esquecida, logo permanentemente inacessível; a identidade `identity_pubkey` dessa conta deixa de poder ser usada para decifrar qualquer `KeyEnvelope` (chave de servidor/canal) já selado para ela. Um reset "ingénuo" devolveria login, mas não devolveria nenhum Servidor, mensagem ou canal de voz já sincronizado — e isso pode não ser óbvio para quem o implementar ou para quem o usar, se a UI não deixar claro que é uma recuperação de **login**, não de **identidade**.

Duas direcções possíveis para discussão futura:
1. **Reset = nova identidade**: aceitar a perda — gera-se um novo par de chaves e uma `identity_vault` nova; a conta continua a existir (mesmo `handle`), mas entra em cada Servidor como se fosse um novo handoff de chave (precisa de alguém `synced` online para selar de novo). Mais simples de implementar, mas o utilizador perde a decifragem de qualquer histórico que dependa só da identidade antiga.
2. **Recuperação real da identidade**: exige um segredo de recuperação **adicional e independente da password**, gerado no momento da criação da conta (ex. frase/seed, guardada só pelo utilizador), capaz de desencriptar a `identity_vault` sem a password. Isto já apareceu como mockup especulativo ("Desbloqueio de conta/Recuperação de identidade", seed BIP-39) na análise do frontend v2 ([TR-frontend-v2.md §7.1](../v2/TR-frontend-v2.md)) e foi explicitamente marcado como **fora do escopo actual** por não existir suporte nenhum no backend — teria de ser desenhado do zero, com as implicações de UX de "guarde esta frase, se perder não há recuperação" que isso implica.

Sem código nem decisão hoje — registado para discussão futura.

**Análise técnica (2026-10-04):** [TR-item18-recuperacao-de-senha.md](TR-item18-recuperacao-de-senha.md) — mapeia o que a estrutura actual exige, três opções (A operador/nova identidade, B chave de recuperação, C combinação recomendada) e as decisões pendentes antes da spec.

## 19. Tela de administração da instância (emissão de códigos de reset)

Decidido na spec do item 18 (2026-10-04): o operador emite os códigos de reset de senha **via CLI** no host (`reset-code <handle>`), porque hoje não existe nenhum papel nem tela de "admin de instância" (`is_initial_operator` é só um flag lido na criação da conta). Este item regista a tela que substituiria a CLI: listar contas, emitir/revogar códigos de reset com validade, e, por extensão, ser o ponto natural para outras ações de operador.

Pré-requisito de produto a decidir antes: **quem é o operador na UI** (só a conta `is_initial_operator`? transferível? vários?) e como isso se separa do dono de Servidor, que é um conceito por servidor e não por instância. Sem código nem decisão hoje.

---

## Itens a decidir (não são bem "backlog", mas ficam registados para não se perderem)

- **Copy de E2EE ainda menciona "gravação"** (ex.: aviso de custódia de chave: "sem ela não é possível religar a E2EE depois de gravar") apesar de não haver botão de gravar. Quando o item 1 (Gravação/Egress) for reposto, rever esta copy; até lá, o novo design system não deve desenhar um botão de "Gravar" — só o fluxo de ligar/desligar E2EE e religar que já existe.
- **`GridAdmin.tsx`** é um painel administrativo antigo (atribuir conta a slot numerado via `<select>`), substituído pelo `SceneEditor.tsx` actual e não usado em lado nenhum — candidato a remoção de código morto, não a redesenho.
