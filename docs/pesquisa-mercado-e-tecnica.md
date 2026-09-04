# Pesquisa de Mercado e Técnica — Chat App Self-Hosted

**Analista:** Mary (PO Virtual / Business Analyst)
**Data:** 2026-08-23
**Contexto:** Pesquisa realizada como continuação da sessão de brainstorming (`brainstorming/brainstorming-session-2026-08-23-2035.md`), sobre uma ferramenta de comunicação estilo Discord — apps nativos (Windows/Mac/Linux + navegador), servidores/canais, voz/vídeo/texto, câmeras fixas configuráveis em videochamadas, e suporte a self-hosting (arquitetura cliente <> servidor, sem federação entre instâncias).

---

## Parte 1 — Pesquisa de Mercado

### Conclusão

O mercado de "alternativas self-hosted ao Discord" está no seu melhor momento em anos — e mesmo assim, ninguém oferece o diferencial central deste projeto. Discord enfrenta backlash real de monetização e uma pressão de IPO que está empurrando usuários a considerar alternativas pela primeira vez em anos. Concorrentes open-source surgiram e ganharam tração rapidamente nos últimos 12-18 meses (Fluxer: 125 mil usuários ativos, quase 8 mil stars no GitHub, lançado em beta há poucos meses). Mas **nenhum concorrente — nem os mais próximos, nem os mais maduros — oferece controle de composição visual da chamada** (câmeras fixas, cenas trocáveis). Isso não é um recurso que falta pra alcançar paridade; é um espaço em branco genuíno no mercado.

### Pilar 1: Panorama Competitivo

| Concorrente | Posicionamento | Ponto forte | Lacuna vs. o projeto |
|---|---|---|---|
| **Fluxer** | Discord-like completo (voz, vídeo, screen share), AGPLv3, feito por 1 dev sueco desde 2020, beta desde out/2025 | 125k usuários ativos, quase 8k stars no GitHub — prova que 1 pessoa consegue construir isso | Sem controle de layout de câmera; foco é paridade de features com Discord, não diferenciação visual |
| **Stoat** (ex-Revolt) | Réplica mais próxima da UI do Discord, feito em Rust (leve/rápido), 100% grátis, financiado por doações | Familiaridade visual imediata pra quem migra do Discord | "Privacidade + self-host sozinhos não bastam pra migração em massa" — sem gancho funcional forte |
| **Matrix/Element** | Protocolo federado (não produto), adoção institucional forte (Forças Armadas alemãs, governo francês com 375k MAU) | Criptografia ponta-a-ponta, história de confiança/soberania de dados | Federado (contradiz decisão de instâncias isoladas do projeto), self-host mais complexo, público é governo/corporativo, não comunidade/RPG |
| **Rocket.Chat / Mattermost** | Chat de equipe self-hosted, alternativa ao Slack | Rocket.Chat tem marketplace com 200+ apps | Operação mais pesada (MongoDB no Rocket.Chat), público é TI/empresas, não comunidades sociais/gaming |
| **Spacebar** | Reimplementação open-source da API do Discord (compatível com bots/clients existentes) | Compatibilidade com o ecossistema Discord já existente | Desenvolvimento lento desde 2020, paridade de features ainda incompleta |

**Adjacentes (não concorrentes diretos):** Jitsi Meet (infraestrutura de vídeo SFU open-source — possível peça técnica) e Mumble/TeamSpeak (voz pura, sem vídeo nem estrutura de canais rica).

**Insight-chave:** em nenhum dos roundups de "melhores alternativas ao Discord em 2026" apareceu qualquer feature de posicionamento/composição de câmera. O padrão da indústria pra RPG/streaming continua sendo "Discord + OBS separado" — exatamente a dor identificada no brainstorm.

### Pilar 2: Dor do Cliente Ainda Não Resolvida

- A dor funcional mirada (mestre de RPG montando cena manualmente em software separado) não tem solução nativa em nenhum concorrente pesquisado.
- "Não existe substituto perfeito" pro Discord em 2026 — cada alternativa troca uma coisa (privacidade) por outra (recursos, familiaridade, maturidade).
- Self-hosters valorizam **facilidade de instalação** acima de tudo — a complexidade operacional do Rocket.Chat (MongoDB) e do Matrix/Synapse é citada repetidamente como barreira. O plano de instalador one-liner multiplataforma ataca exatamente essa lacuna.

### Pilar 3: Momento de Mercado (Macro)

- **Discord com confiança em baixa:** filing confidencial de IPO (início de 2026), backlash de monetização (paywalls de Nitro, cosméticos), recuo em verificação de idade após pressão pública — narrativa de "enshittification" domina a cobertura da plataforma.
- **Self-hosting crescendo de verdade:** mercado de plataformas cloud self-hosted em ~US$ 18-22 bi (2025-2026), crescendo ~14,6% ao ano, impulsionado por soberania de dados e regulação. "2026 pode ser lembrado como o ano em que self-hosting virou mainstream."
- **Mercado mais amplo de colaboração em equipe:** US$ 17-44 bi em 2026 (estimativas variam por metodologia), crescendo 9-14% ao ano — mede principalmente ferramentas corporativas (Slack/Teams), não perfeitamente o nicho social/gaming/RPG; tratar como contexto direcional, não TAM exato.
- **Prova de viabilidade solo:** Fluxer é prova de que 1 desenvolvedor consegue construir um concorrente funcional e ganhar tração real.

### Recomendações Estratégicas

1. Não tentar ser "Discord pra todo mundo" de cara — o wedge de RPG/streaming é a única dor sem solução nativa hoje.
2. Usar facilidade de instalação como arma competitiva — a dor de "self-host é complicado" (Rocket.Chat, Matrix) é real e não atendida.
3. A decisão de instâncias isoladas (sem federação) é segura pro público-alvo (RPG/amigos) — federação importa mais pra governo/enterprise.
4. Aproveitar a janela de desconfiança no Discord na comunicação, mas diferenciar por "resolvemos a produção visual da sua sessão", não por "somos mais éticos" (discurso já saturado entre Fluxer/Stoat).
5. Observar o Spacebar como possível inspiração técnica para compatibilidade de bots, já que o sistema de plugins/API do projeto toca no mesmo espaço.

### Fontes (Mercado)

- [Best Self Hosted Chat Servers in 2026 — Ethora](https://ethora.com/blog/best-self-hosted-chat-servers-in-2026-complete-comparison/)
- [Element vs Mattermost in 2026 — OSSAlt](https://ossalt.com/guides/element-vs-mattermost-2026)
- [Revolt: The Open-Source Discord Alternative — CommunityOne](https://blog.communityone.io/revolt-discord-alternative/)
- [5 self-hosted Discord alternatives — How-To Geek](https://www.howtogeek.com/5-self-hosted-discord-alternatives-that-are-actually-great/)
- [Revolt Review 2026 — European Purpose](https://europeanpurpose.com/tool/revolt)
- [Rocket.Chat vs Mattermost — Meetrix](https://meetrix.io/blogs/rocket-chat-vs-mattermost-team-chat/)
- [Mattermost vs Rocket.Chat — xTom](https://xtom.com/blog/rocketchat-vs-mattermost/)
- [Spacebar Documentation](https://docs.spacebar.chat/)
- [Spacebar Chat — GitHub](https://github.com/spacebarchat/spacebarchat)
- [What is Jitsi? The 2026 Guide — Rock](https://www.rock.so/blog/what-is-jitsi)
- [Complete Guide to Self-Hosted Jitsi Meet 2026 — Pi Stack](https://www.pistack.xyz/posts/self-hosted-video-conferencing-jitsi-guide/)
- [Team Collaboration Software Market Size — Grand View Research](https://www.grandviewresearch.com/industry-analysis/team-collaboration-software-market)
- [Team Collaboration Software Market Size — IMARC Group](https://www.imarcgroup.com/team-collaboration-software-market)
- [Self-Hosting Surges in 2026: Market to Reach $85.2B by 2034 — WebProNews](https://www.webpronews.com/self-hosting-surges-in-2026-market-to-reach-85-2b-by-2034/)
- [Self-Hosted Cloud Platform Market Report — GII Research](https://www.giiresearch.com/report/tbrc1983090-self-hosted-cloud-platform-global-market-report.html)
- [Best Self-Hosted Discord Alternatives 2026 — Zap-Hosting](https://zap-hosting.com/en/blog/2026/02/the-best-self-hosted-discord-alternatives-2026-ranking-pros-cons/)
- [Discord Self-Hosted Alternatives — Digital Biz Talk](https://digitalbiztalk.com/article/discord-enshittification-self-hosted-alternatives-in-2026)
- [Best Self-Hosted Discord Alternatives — Bymar](https://blog.bymar.co/posts/best-self-hosted-discord-alternatives-2026/)
- [Discord Users Slam Growing Monetization — GamingHQ](https://gaminghq.eu/2026/05/07/discord-users-slam-growing-monetization-nitro-push/)
- [Discord's CTO on enshittification — Engadget](https://www.engadget.com/gaming/discords-cto-is-just-as-worried-about-enshittification-as-you-are-173049834.html)
- [Discord delays global rollout of age verification — TechCrunch](https://techcrunch.com/2026/02/24/discord-delays-global-rollout-of-age-verification-after-backlash/)
- [Discord IPO Filing: What 2026 Means for Nitro and User Data — Remio](https://www.remio.ai/post/discord-ipo-filing-what-2026-means-for-nitro-and-user-data)
- [Fluxer: the open source alternative to Discord — Sinologic](https://www.sinologic.net/en/2026-04/fluxer-the-open-source-alternative-to-discord-that-respects-your-privacy.html)
- [Fluxer — OpenAlternative](https://openalternative.co/fluxer)
- [Fluxer Review 2026 — ReviewNexa](https://reviewnexa.com/fluxer-review/)

---

## Parte 2 — Pesquisa Técnica

### 1. Opções de Arquitetura e Trade-offs

#### Shell da aplicação (nativo x3 SOs + também navegador, leve)

| Opção | A favor | Contra |
|---|---|---|
| **Tauri** (Rust) | Apps ~10x menores e 2x mais rápidos que Electron; "Hello World" abaixo de 3MB vs. 150MB+ do Electron; mesmo frontend web roda também como app puramente browser (ex: GeoLibre) | Comunicação com o SO via comandos Rust — exige aprender Rust |
| **Wails** (Go) | Mesma filosofia do Tauri (WebView nativo do SO), backend em Go, bindings TypeScript gerados automaticamente | Binários um pouco maiores (~8MB vs. <1MB no Tauri); ecossistema/comunidade menor |
| **Electron** | Ecossistema maduro | Contradiz o requisito "leve" — exemplo citado do que evitar |

**Recomendação:** Tauri ou Wails resolvem "nativo + leve + também no navegador" — a escolha entre os dois é essencialmente Rust vs. Go.

#### Backend / "binário único, dois modos"

| Opção | A favor | Contra |
|---|---|---|
| **Go** | Compila pra binário estático único, cross-compila fácil pra Win/Mac/Linux sem runtime externo — combina com Wails | Queda de performance sob carga sustentada muito alta (16k+ conexões simultâneas) — relevante só em escala grande |
| **Elixir/Phoenix** | Tecnicamente ideal pra chat realtime — processos isolados, supervisão, Channels/Presence/PubSub prontos | Roda sobre a BEAM, não gera binário estático único simples — contradiz a decisão de "binário único" |
| **Rust** | Combina com Tauri, performance e segurança de memória | Curva de aprendizado mais alta pra dev solo sem fluência prévia |

**Recomendação:** Go (com Wails) ou Rust (com Tauri) são coerentes com a decisão de "binário único, cross-platform" já tomada no brainstorm. Elixir, apesar de tecnicamente ideal, briga com essa decisão de arquitetura.

**Decisão final (2026-08-23):** Rust + Tauri.

#### Motor de vídeo (WebRTC/SFU)

| Opção | A favor | Contra |
|---|---|---|
| **LiveKit** | Recomendação forte pra dev solo — solução completa fora da caixa, não exige expertise profunda em WebRTC; 1 SRE + 1 backend + 1 client engineer bastam pra operar em escala | Menos controle de baixo nível que mediasoup |
| **mediasoup** | Controle total sobre a UX | Exige esforço de desenvolvimento significativo e mais expertise de backend |
| **Jitsi Videobridge** | Maduro, usado em produção há anos | Mais pesado (Java), pensado pra escala institucional |

**Recomendação:** LiveKit mitiga o risco técnico identificado no Chapéu Preto da sessão de brainstorm. Bônus: o recurso **Room Composite Egress** permite configurar layout de gravação/streaming via `custom_base_url` — a mesma interface de "cenas de câmera" pode ser reusada como template de gravação/exportação pra streaming, conectando diretamente com a ideia #2 (cenas trocáveis) e o What If original ("exportar direto pra OBS").

**Decisão de criptografia (2026-08-23):** E2EE por padrão em texto, voz e vídeo, via **Insertable Streams** do LiveKit — o SFU roteia pacotes criptografados sem decodificá-los, nem o admin da instância tem acesso ao conteúdo. **Trade-off documentado:** a própria LiveKit confirma que recursos que exigem processamento de mídia no servidor — como o Room Composite Egress citado acima — "podem ficar limitados ou indisponíveis com E2EE ativo", já que o SFU nunca vê o conteúdo decodificado. **Resolução adotada:** E2EE é o padrão por canal, mas o dono do canal pode desligá-la conscientemente quando quiser usar gravação/exportação via Egress — a troca deve ser explícita e sinalizada na interface, nunca silenciosa. Isso preserva a promessa de privacidade como padrão sem descartar a sinergia da ideia #2/Egress para quem prioriza streaming em vez de confidencialidade num canal específico.

**Detalhamento de UX e custódia de chave (2026-08-23):** o aviso de E2EE desligada é **permanente** (indicador visível continua enquanto estiver desligada, não é só um toast pontual) + **log de auditoria** de quem desligou/religou e quando. Ao criar um canal de voz/vídeo, o **usuário criador recebe a chave de E2EE daquele canal** e deve salvá-la — o app precisa alertar ativamente sobre isso na criação, porque **sem essa chave salva não é possível reativar a E2EE do canal depois de desligada**. Implicação de engenharia: o modelo de chaves é por canal (não só por usuário), então o esquema de key management precisa gerar/persistir uma chave própria por canal de voz/vídeo desde a criação, distinta da chave de identidade pessoal do usuário (ver decisão abaixo).

**Recovery key de identidade pessoal (2026-08-23):** backup **opt-in por padrão**, protegido por senha — a chave de identidade do usuário é criptografada no próprio dispositivo (derivação via Argon2id a partir da senha da conta) e o blob já cifrado é enviado ao servidor. O servidor nunca vê a chave em texto puro, apenas armazena um blob que só a senha do usuário consegue abrir (zero-knowledge do lado do servidor). Trocar de dispositivo e lembrar a senha basta pra recuperar as chaves e o acesso ao histórico E2EE. Uma chave de recuperação manual (frase, estilo Signal/Matrix) continua disponível como alternativa pra quem não quer depender de senha — mas não é mais o único caminho, evitando a fricção documentada como problema real do Matrix (usuários trancados fora de salas criptografadas por perder a frase de recuperação). Isso conecta diretamente com a ideia de migração de identidade (#22): o blob de backup cifrado por senha é o mecanismo natural de portar a identidade entre dispositivos e, potencialmente, entre Instâncias de Hospedagem.

#### Conectividade (NAT traversal)

**Coturn** é o padrão de fato — open source (BSD), suporta TLS/DTLS-SRTP, self-hosting num VPS de US$20/mês custa 70-90% menos que serviços de TURN em nuvem (Twilio). Não é literalmente embutido no binário único (processo separado), mas deve fazer parte do stack Docker Compose do instalador.

### 2. Maturidade Tecnológica e Saúde do Ecossistema

- **Tauri:** projeto maduro, v2 estável, adoção crescente
- **Wails:** v2 estável, v3 em alpha — ecossistema menor mas ativo
- **LiveKit:** Apache 2.0, adoção ampla, documentação forte, comunidade ativa
- **Coturn:** extremamente estável, infraestrutura padrão da indústria há mais de uma década

Nenhuma dependência tem sinal de abandono — pilha tecnológica saudável para 2026.

### 3. Complexidade de Implementação e Timeline (estimativas grosseiras)

- **Fase 0 — Spike técnico (1-2 semanas):** LiveKit + coturn self-hosted localmente, validar conectividade WebRTC atrás de NAT, cliente mínimo numa call
- **Fase 1 — MVP:** core do backend (auth, servidor/canal, permissões), shell Tauri/Wails + frontend compartilhado, integração LiveKit com grade fixa de câmera, uma trilha de instalação (Docker Compose)
- **Fase 2:** cenas trocáveis via Egress customizado, convite por link, instalador one-liner Windows+Linux
- **Fase 3:** sistema de plugins/API, importador do Discord, features de confiança/privacidade

O maior fator de risco de timeline não é nenhuma peça individual — é a **integração entre elas**, especialmente sincronizar o layout de câmera ao vivo (client-side) com o mesmo layout no Egress de gravação (server-side).

### 4. Requisitos de Integração e Dependências

- **Backend ↔ LiveKit:** geração de tokens de acesso, orquestração de salas via SDKs server-side
- **Backend ↔ coturn:** apenas configuração de credenciais TURN nas opções ICE do cliente WebRTC
- **Frontend único ↔ dois alvos de deploy:** mesmo SPA compilado dentro do Tauri/Wails (desktop) e servido como site estático (navegador) — funcionalidades exclusivas de desktop devem degradar graciosamente no navegador

### 5. Armazenamento de Dados (Usuários e Mensagens)

**Onde os dados ficam:** dentro da própria máquina da Instância de Hospedagem — nunca saem de lá, nunca passam por um serviço central. Consequência direta de #7 (instâncias isoladas, sem federação): cada instância é dona completa dos seus próprios dados.

**Implicação da terminologia corrigida (2026-08-23):** uma Instância de Hospedagem pode conter **múltiplos Servidores** (multi-tenancy). Isso significa que o schema precisa escopar toda tabela relevante (canais, mensagens, permissões, membros) por `servidor_id` desde o design inicial — não é um banco por servidor, é um banco por instância com isolamento lógico entre servidores. A portabilidade "copiar a pasta" migra a **instância inteira** (todos os servidores nela); exportar um único Servidor de dentro de uma instância multi-tenant para outra instância é uma capacidade separada, ainda não desenhada (fica como extensão futura da ideia de migração de identidade #22, caso "hospedagem como serviço" vire prioridade).

**Motor de banco recomendado — depende da escala da instância:**

| Cenário | Motor | Por quê |
|---|---|---|
| **Padrão (maioria dos self-hosts):** grupo de amigos, comunidade pequena/média, rodando local ou em VPS modesto | **SQLite embutido** | Todo o banco (usuários, mensagens, canais, permissões, config de cenas) vira **um arquivo só** — copiável, versionável, portável, sem exigir um segundo processo de banco no instalador. Precedente direto: Owncast (streaming/chat self-hosted em Go) usa SQLite com a mesma filosofia de leveza. Contraste com a concorrência: Fluxer usa PostgreSQL e Stoat usa MongoDB — ambos exigem serviço de banco separado no `docker-compose`, a mesma complexidade operacional que a pesquisa de mercado já identificou como barreira de adoção |
| **Trilha avançada / servidor grande (ex: o servidor oficial em grande escala):** milhares de usuários simultaneamente ativos | **Postgres pluggável** | SQLite serializa escritas — só um escritor por vez, mesmo em modo WAL. Throughput teórico é alto (70-100k transações/s em condições ideais), mas o sinal prático de migrar é bem mais baixo: >1000 escritas concorrentes/s sustentadas, erros de "database is locked" recorrentes, ou dataset >10GB com queries lentas. Um caso real documentado já viu esse limite aparecer com apenas ~100k usuários num app de chat-like. Postgres, via MVCC, permite múltiplos escritores simultâneos sem esse gargalo, e é tranquilo em escalas de centenas de milhares de usuários sem precisar de nada mais exótico (sharding, Cassandra/ScyllaDB só entram em jogo em ordens de grandeza maiores, como no próprio Discord) |

**Decisão de arquitetura crítica:** desenhar a camada de armazenamento por trás de uma interface/abstração (padrão repository) desde o dia 1, mesmo rodando só com SQLite no início. Isso transforma a troca SQLite ↔ Postgres em configuração, não reescrita — essencial porque o **servidor oficial global já deve nascer rodando em Postgres**, enquanto o instalador padrão continua oferecendo SQLite como caminho zero-config pra todo mundo.

**O que fica fora do banco relacional:** anexos, avatares e gravações de chamada (opt-in) — blobs grandes não devem viver dentro do SQLite/Postgres; ficam em pasta separada no disco, ao lado dos dados da instância, preservando a portabilidade "copiar a pasta".

**Decisão de privacidade (2026-08-23, atualiza o ponto em aberto anterior):** ao contrário do desenho inicial, mensagens **não** ficam em texto plano acessível pelo admin — E2EE é padrão (ver seção 1, Motor de vídeo/Decisão de criptografia). O banco (SQLite ou Postgres) passa a armazenar conteúdo cifrado por padrão; o admin da instância não tem uma chave capaz de decifrá-lo. Isso aproxima o projeto do modelo de confiança do Matrix/Element (E2EE), superando-o em escopo por cobrir também voz/vídeo via Insertable Streams, não só texto.

**Orçamento de recursos ("leve") — meta proposta (2026-08-23):** referência qualitativa é ficar próximo do TeamSpeak, bem abaixo do Discord. Benchmarks: cliente TeamSpeak usa ~20-60MB de RAM; servidor TeamSpeak roda confortável com 512MB-2GB pra comunidades de até 100 pessoas, dual-core aguenta até 512 conexões de voz simultâneas, banda de 10-30 Kbps por participante falando. Discord, em contraste, é criticado por consumir de ~1GB a 4GB de RAM no cliente (efeito do Electron) — a própria Discord testa reiniciar o app automaticamente acima de 4GB. **Meta de validação na Fase 0 (spike técnico):** cliente Tauri idle bem abaixo de 1GB, servidor headless na faixa do TeamSpeak para comunidades pequenas/médias (o footprint de vídeo do LiveKit em si é um componente à parte, tipicamente dimensionado por número de streams simultâneos, não por usuários cadastrados).

### 6. Riscos-Chave e Mitigações

| Risco | Mitigação |
|---|---|
| Curva de aprendizado de Rust — decisão final foi Tauri, mesmo assim | Reservar tempo de ramp-up explícito na Fase 0; comunidade Tauri é ativa para suporte |
| Dependência de projeto externo (LiveKit) fora do controle do projeto | Baixo risco real — Apache 2.0, self-hostável, comunidade ativa; fixar versões e acompanhar releases |
| TURN é serviço separado, não literalmente "um binário só" | Absorver a complexidade no instalador (Docker Compose automatiza o stack inteiro) |
| Sincronizar layout de câmera ao vivo com layout de gravação (Egress) | Desenhar o sistema de "cenas" como formato de dados único (JSON de posições) consumido tanto pelo client ao vivo quanto pelo template de Egress |
| SQLite trava sob escrita concorrente alta (ex: servidor oficial em grande escala) | Camada de armazenamento abstraída desde o início; servidor oficial roda em Postgres desde o lançamento |
| **E2EE por padrão é incompatível com Room Composite Egress (gravação/streaming server-side)** | Dono do canal pode desligar E2EE conscientemente e de forma sinalizada só quando quiser usar essa feature — nunca automático/silencioso |
| Backup/recuperação de chave de identidade sob E2EE (perder dispositivo = perder histórico) | Desenhar estratégia de recovery key desde o design inicial — mesmo trade-off que Signal/Matrix enfrentam; impacta também a ideia de migração de identidade (#22) |

### Resumo da Recomendação Técnica

**Rust + Tauri** pro shell (nativo+leve+web), esse mesmo binário rodando como servidor headless via flag, **LiveKit self-hosted com E2EE por padrão (Insertable Streams)** como motor de vídeo — com exceção consciente por canal pra habilitar Egress (gravação/streaming) —, **coturn** pra NAT traversal empacotado no instalador Docker, **SQLite embutido como padrão / Postgres pluggável para instâncias grandes** (via camada de armazenamento abstraída desde o dia 1, armazenando conteúdo cifrado), e o sistema de "cenas de câmera" desenhado como formato de dados compartilhado entre a chamada ao vivo e o Egress de gravação/streaming.

### Fontes (Técnica)

- [mediasoup, Janus, LiveKit, Jitsi Videobridge, Pion: Choosing an SFU — Forasoft](https://www.forasoft.com/learn/video-streaming/articles-streaming/sfu-comparison-mediasoup-janus-livekit-jitsi-pion)
- [LiveKit vs Mediasoup vs Janus — Trembit](https://trembit.com/blog/choosing-the-right-sfu-janus-vs-mediasoup-vs-livekit-for-telemedicine-platforms/)
- [Custom recording templates — LiveKit Docs](https://docs.livekit.io/egress-ingress/egress/custom-template/)
- [RoomComposite & web egress — LiveKit Documentation](https://docs.livekit.io/transport/media/ingress-egress/egress/composite-recording/)
- [Tauri in 2026 — DEV Community](https://dev.to/ottoaria/tauri-in-2026-build-cross-platform-desktop-apps-with-web-technologies-better-than-electron-11mo)
- [Tauri vs Electron 2026 — Tech Insider](https://tech-insider.org/tauri-vs-electron-2026/)
- [Tauri v2 vs Electron 2026 — BuildMVPFast](https://www.buildmvpfast.com/blog/tauri-v2-vs-electron-desktop-apps-2026)
- [Desktop Apps from Web: Tauri vs Electron vs Deno vs Wails 2026 — Digital Applied](https://www.digitalapplied.com/blog/desktop-apps-web-stack-tauri-electron-deno-wails-2026)
- [Wails: The Tauri Alternative — Medium](https://medium.com/@trungpv1601/wails-the-tauri-alternative-for-developing-web-desktop-apps-5f006b031817)
- [Tauri/Rust vs Wails/Go — DEV Community](https://dev.to/arashgl/taurirust-vs-wailsgo-4pd6)
- [Elixir vs Go in 2026 — Equantra](https://equantra.in/blog/elixir-vs-go-2026)
- [The Ultimate WebSocket Battle: Elixir vs Go — Medium](https://medium.com/beamworld/the-ultimate-websocket-battle-elixir-vs-go-performance-showdown-5d0ee199edf2)
- [TURN server | WebRTC](https://webrtc.org/getting-started/turn-server)
- [How to setup and configure TURN server using coTURN — Metered](https://www.metered.ca/blog/coturn/)
- [coturn — GitHub](https://github.com/coturn/coturn)
- [SQLite concurrent writes and "database is locked" errors](https://tenthousandmeters.com/blog/sqlite-concurrent-writes-and-database-is-locked-errors/)
- [The Write Stuff: Concurrent Write Transactions in SQLite](https://oldmoe.blog/2024/07/08/the-write-stuff-concurrent-write-transactions-in-sqlite/)
- [SQLite in Production 2026: Real Benchmarks, Limits, and When to Migrate to Postgres — Sesame Disk](https://sesamedisk.com/sqlite-in-production-2026-benchmarks-limits/)
- [SQLite for Production: When and How to Use It Beyond Prototyping — daily.dev](https://daily.dev/blog/sqlite-production-guide-when-how-to-use-beyond-prototyping/)
- [The Surprising Way I Used SQLite to Scale a Side Project to 100K Users — Medium](https://medium.com/@codeandcortex/the-surprising-way-i-used-sqlite-to-scale-a-side-project-to-100k-users-1295dccf1212)
- [We Scaled to 1 Million Users with a Single SQLite Database — Medium](https://medium.com/@maahisoft20/we-scaled-to-1-million-users-with-a-single-sqlite-database-here-is-how-c57e965d580d)
- [Discord admits Windows 11 app hogs RAM — PCWorld](https://www.pcworld.com/article/3005317/discord-admits-windows-11-app-hogs-ram-tries-solving-it-with-auto-restarts.html)
- [Discord admits its Windows 11 app is a resource hog — Windows Latest](https://www.windowslatest.com/2025/12/06/discord-admits-its-windows-11-app-is-a-resource-hog-tests-auto-restart-when-ram-usage-exceeds-4gb/)
- [How to Host a TeamSpeak Server: Setup, Cost & Requirements — Kimsufi Blog](https://www.kimsufi.com/en/blog/host-a-teamspeak-server/)
- [What is the minimum requirements for a TS3 server? — TeamSpeak Support](https://support.teamspeak.com/hc/en-us/articles/360010685817-What-is-the-minimum-requirements-for-a-TS3-server)
- [Encryption overview — LiveKit Documentation](https://docs.livekit.io/transport/encryption/)
- [Trust No One: Implementing True End-to-End Encryption with Insertable Streams — DEV Community](https://dev.to/deepak_mishra_35863517037/trust-no-one-implementing-true-end-to-end-encryption-with-insertable-streams-2ndk)
