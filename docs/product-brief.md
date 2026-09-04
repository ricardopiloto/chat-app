# Product Brief — Chat App Self-Hosted com Câmeras Fixas

**Autor:** Mary (PO Virtual / Business Analyst)
**Data:** 2026-08-23
**Status:** Rascunho para revisão
**Fontes:** `brainstorming/brainstorming-session-2026-08-23-2035.md`, `pesquisa-mercado-e-tecnica.md`

---

## 1. Problem Statement

Comunidades que se reúnem por voz/vídeo em torno de atividades com composição visual relevante — o caso mais claro sendo mesas de RPG que fazem streaming — hoje precisam costurar duas ferramentas separadas: um app de chat/chamada (tipicamente Discord) e um software de produção de vídeo à parte (OBS, vMix) pra controlar quem aparece onde na tela. Nenhum concorrente pesquisado (Discord, Fluxer, Stoat, Matrix/Element, Rocket.Chat, Mattermost, Spacebar) oferece controle nativo de posicionamento de câmera dentro da própria ferramenta de chamada — essa dor não tem solução no mercado hoje.

Paralelamente, a confiança no Discord está em baixa (pressão de IPO, monetização crescente via Nitro, backlash de verificação de idade), e o self-hosting está crescendo como movimento (~14,6% CAGR no mercado de plataformas cloud self-hosted), mas as alternativas self-hosted existentes carregam complexidade operacional real (bancos de dados separados, deploy multi-serviço) que barra grande parte de quem só quer hospedar pra um grupo pequeno de amigos.

## Conceitos e Terminologia (corrigido em 2026-08-23)

O produto tem **3 camadas de conceito**, e a nomenclatura precisa ser usada de forma consistente em toda a documentação e no código:

1. **Instância de Hospedagem** — a máquina/processo que um sysadmin roda (local ou servidor real), o "binário único em modo servidor". Pode hospedar **múltiplos Servidores simultaneamente** (multi-tenancy) — não é o mesmo conceito de "servidor" no sentido Discord.
2. **Servidor** — no sentido Discord: criado por qualquer usuário, com dono/admin próprio, contém canais. É a unidade social que as pessoas reconhecem e entram via convite.
3. **Canal** — de voz/vídeo ou só texto, vive dentro de um Servidor.

**Regras de isolamento:**
- Usuários de um Servidor não veem nada de outro Servidor na mesma Instância de Hospedagem, a menos que convidados
- Dentro de um mesmo Servidor, canais individuais também podem ser privados/restritos — visíveis só a quem foi convidado especificamente àquele canal, não ao servidor inteiro

_Nota: em versões anteriores deste documento e da sessão de brainstorming original, "Servidor" foi usado (incorretamente) para se referir ao que aqui se chama "Instância de Hospedagem". Ver nota de atualização no final do `brainstorming-session-2026-08-23-2035.md`._

## 2. Proposed Solution and Key Features (MVP Scope)

Uma ferramenta de comunicação em tempo real (texto, voz, vídeo) no espírito do Discord — servidores, canais, cargos — mas **open-source, self-hosted por padrão, e com controle nativo de composição visual de câmera**, distribuída como um binário único que roda tanto em modo cliente quanto em modo servidor (local ou headless).

**Dentro do MVP:**
- Grade fixa de câmeras por usuário (posições atreladas à pessoa, definidas pelo admin/dono do canal)
- Motor de vídeo/voz baseado em LiveKit (self-hosted), com coturn para NAT traversal
- Canais de texto puro e canais de voz/vídeo+texto (dois tipos, como no Discord)
- Hierarquia Instância de Hospedagem > Servidor > Canal — qualquer usuário pode criar/possuir um Servidor (multi-tenancy: uma instância hospeda vários servidores isolados entre si), e dentro do Servidor, canais individuais podem ser privados/restritos a quem foi convidado
- Binário único, cliente e servidor no mesmo executável (Rust + Tauri), rodando nativo em Windows/Mac/Linux e também no navegador
- Self-hosting em duas trilhas: instalador guiado simples (SQLite embutido) e Docker Compose (para quem já tem infraestrutura)
- Instâncias de Hospedagem isoladas — sem federação entre instâncias, nem mesmo com a instância oficial
- Convite por link (expira por padrão; admin pode gerar permanente), com fallback web
- Confiança/privacidade: gravação de chamada opt-in por canal com indicador visual obrigatório; canal de denúncia ao mantenedor válido para qualquer instância; diretório público de servidores opt-in
- **Criptografia ponta-a-ponta (E2EE) por padrão** em texto, voz e vídeo — via Insertable Streams do LiveKit, o próprio SFU/servidor nunca decodifica o conteúdo, nem o admin da instância tem acesso
- **Exceção consciente de E2EE por canal:** o dono do canal pode desligar a E2EE especificamente quando quiser usar gravação/exportação de cena via Egress do servidor (LiveKit não suporta Egress com E2EE ativo — são mutuamente exclusivos). A troca deve ser explícita e sinalizada, nunca silenciosa
- Shell nativo/servidor em **Rust + Tauri**
- Licença **MIT**

**Fora do MVP (adiado conscientemente):**
- Cenas de câmera trocáveis ao vivo, papel de co-diretor, templates de cena compartilháveis → v2
- Compartilhamento de tela → fora de escopo por enquanto
- Sistema de plugins/API e importador de estrutura do Discord → depois do core estável
- Painel de estatísticas sociais → plugin futuro ou fora do produto
- Migração de identidade entre Instâncias de Hospedagem → v2
- Criptografia ponta-a-ponta (E2EE) → decisão em aberto para fase futura

## 3. Target Users and Primary Use Cases

**Usuário primário (cunha de entrada):** mestres e grupos de RPG que fazem streaming ou gravam suas sessões e hoje precisam de duas ferramentas separadas (chat + produção de vídeo) para conseguir uma boa composição visual.

**Uso primário:** sessão de RPG em chamada de vídeo com câmeras posicionadas de forma fixa e intencional pelo mestre, servindo diretamente como fonte de vídeo apresentável (gravação ou streaming), sem precisar de um segundo software.

**Usuário secundário (expansão natural):** qualquer grupo — comunidade de jogos, podcast, família, amigos — que valorize um Discord self-hosted, com ou sem uso da feature de câmeras.

## 4. Success Metrics (quantitativos — proposta inicial, sujeita a validação)

_Dado o estágio inicial (dev solo, pré-lançamento), métricas de tração substituem métricas de receita nesta fase:_

- **Adoção:** número de instâncias self-hosted ativas (telemetria opt-in ou contagem de downloads/instalações)
- **Ativação:** taxa de sucesso do fluxo "instalar servidor → convidar → primeira chamada com câmera fixa funcionando" ponta a ponta (proxy: tempo até a primeira chamada bem-sucedida)
- **Engajamento do produto-bandeira:** % de chamadas em canais de vídeo que usam layout de câmera fixa (vs. grade automática padrão)
- **Comunidade (proxy de open-source):** GitHub stars, contribuidores externos, issues/PRs — sinal de tração similar ao usado para avaliar Fluxer (125k usuários ativos, ~8k stars) na pesquisa de mercado
- **Servidor oficial:** usuários ativos mensais, como termômetro de demanda pela via "hospedada por vocês"

## 5. Constraints, Non-Goals, and Open Questions

**Constraints:**
- Desenvolvimento solo (pelo menos na fase inicial) — arquitetura precisa favorecer simplicidade operacional sobre flexibilidade máxima
- App precisa ser leve, nativo em Windows/Mac/Linux, e também funcionar no navegador
- Self-hosting é requisito central, não feature opcional — arquitetura cliente↔servidor desde o design

**Non-Goals (explícitos, não é "esquecido", é decisão consciente):**
- Não é objetivo replicar 100% das features do Discord no MVP (ex: emojis customizados, threads, integrações de música não fazem parte do escopo core)
- Não é objetivo oferecer federação entre Instâncias de Hospedagem (diferente do Matrix) — cada instância é isolada por design; multi-tenancy (vários Servidores numa mesma instância) não é federação
- Não é objetivo moderar conteúdo de terceiros — o admin de cada instância é o responsável final; o mantenedor central só atua via canal de denúncia, sem poder técnico sobre servidores de terceiros

**Decisões tomadas (2026-08-23):**
1. **Licenciamento:** MIT
2. **Modelo de sustentação financeira:** doação
3. **Criptografia:** E2EE por padrão, sem acesso do admin — com exceção consciente por canal quando o dono quiser habilitar gravação/exportação via Egress (ver seção 2)
4. **Orçamento de recursos ("leve"):** referência qualitativa é ficar próximo do TeamSpeak, bem abaixo do Discord. Benchmarks de mercado pra calibrar a meta técnica: cliente TeamSpeak usa ~20-60MB de RAM; servidor TeamSpeak roda confortável com 512MB-2GB pra comunidades de até 100 pessoas, dual-core aguenta até 512 conexões de voz simultâneas. Discord, em contraste, é criticado publicamente por consumir de ~1GB a 4GB de RAM no cliente (efeito do Electron) — a própria Discord testa reiniciar o app automaticamente acima de 4GB. **Meta proposta:** cliente idle bem abaixo de 1GB (ordem de poucas centenas de MB, favorecido pela escolha de Tauri sobre Electron), servidor headless na faixa do TeamSpeak para comunidades pequenas/médias — a validar no spike técnico (Fase 0)
5. **Shell/backend:** Rust + Tauri

**Decisões adicionais sobre E2EE (2026-08-23):**
1. **UX do desligamento:** ao desligar a E2EE de um canal, o aviso é **permanente** (indicador visível continua enquanto a E2EE estiver desligada, não é só um alerta pontual) + **log de auditoria** registrando quem desligou e quando (e, futuramente, quem religou)
2. **Custódia de chave de reativação:** ao criar um canal de voz/vídeo, o **usuário criador recebe a chave de E2EE daquele canal** e deve salvá-la em local seguro. O app precisa alertar ativamente sobre isso no momento da criação — **sem essa chave salva, não é possível reativar a E2EE do canal depois que ela for desligada**

**Decisão adicional — Recovery key de identidade pessoal (2026-08-23):**
Backup **opt-in por padrão** protegido por senha: a chave de identidade do usuário é criptografada no próprio dispositivo (derivação via Argon2id a partir da senha da conta) e o blob já cifrado é enviado ao servidor — o servidor nunca vê a chave em texto puro, só guarda algo que só a senha do usuário consegue abrir. Trocar de dispositivo e lembrar a senha já basta pra recuperar. Uma chave de recuperação manual (frase, ao estilo Signal/Matrix) continua disponível como alternativa pra quem quer não depender de senha nenhuma — mas deixa de ser o único caminho, evitando a fricção real que o Matrix enfrenta (usuários trancados fora de conversas antigas por esquecer a frase).

**Open Questions remanescentes:**
1. Multi-tenancy (uma Instância de Hospedagem rodando vários Servidores) abre a possibilidade de "hospedagem como serviço" — um sysadmin hospeda Servidores de terceiros na própria infraestrutura. Não faz parte do escopo atual, mas vale explorar numa sessão futura como possível modelo de negócio adjacente

---

**Próximos passos sugeridos:**
- Resolver as 5 perguntas em aberto acima (não bloqueiam o início do spike técnico, mas bloqueiam decisões de longo prazo)
- Executar a Fase 0 do plano técnico (spike de 1-2 semanas: LiveKit + coturn + grade fixa de câmera funcionando ponta a ponta)
- Validar o problema com 1-2 grupos de RPG reais antes de expandir além do MVP
