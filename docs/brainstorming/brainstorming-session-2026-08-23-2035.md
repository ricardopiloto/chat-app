---
stepsCompleted: [1, 2, 3, 4]
session_active: false
workflow_completed: true
inputDocuments: []
session_topic: 'Ferramenta de comunicação estilo Discord (voz, vídeo, texto) com apps nativos desktop (Windows/Linux/Mac), servidores/canais, arranjo fixo de câmeras em chamadas de vídeo, e suporte a self-hosting (arquitetura cliente <> servidor)'
session_goals: 'Explorar amplamente o espaço de ideias antes de comprometer com escopo: diferenciais de produto, arquitetura técnica, modelo de self-hosting, UX de chamadas de vídeo com posições fixas de câmera, e oportunidades de mercado'
selected_approach: 'ai-recommended'
techniques_used: ['What If Scenarios', 'SCAMPER Method', 'Six Thinking Hats']
ideas_generated: [22]
context_file: ''
---

# Brainstorming Session Results

**Facilitator:** Mary
**Date:** 2026-08-23

## Session Overview

**Topic:** Ferramenta de comunicação estilo Discord (voz, vídeo, texto) com apps nativos desktop (Windows/Linux/Mac), servidores/canais, arranjo fixo de câmeras em chamadas de vídeo, e suporte a self-hosting (arquitetura cliente <> servidor)

**Goals:** Explorar amplamente o espaço de ideias antes de comprometer com escopo: diferenciais de produto, arquitetura técnica, modelo de self-hosting, UX de chamadas de vídeo com posições fixas de câmera, e oportunidades de mercado

### Context Guidance

_Nenhum arquivo de contexto fornecido._

### Session Setup

O usuário já trouxe um conceito inicial bem definido:
- Apps nativos desktop (Windows, Linux, Mac)
- Conceito de servidores e canais (modelo Discord)
- Chamadas de vídeo, chamadas de voz, chat de texto
- Sem compartilhamento de tela (por enquanto)
- Diferencial: dono/admin do canal pode arranjar as câmeras dos usuários em posições fixas durante videochamadas
- Requisito de arquitetura: suporte a self-hosting (local ou servidor real), portanto arquitetura cliente <> servidor

## Technique Selection

**Approach:** AI-Recommended Techniques
**Analysis Context:** Ferramenta estilo Discord com apps nativos desktop, self-hosting e câmeras fixas em videochamadas, com foco em explorar produto, arquitetura e mercado antes de fechar escopo

**Recommended Techniques:**

- **What If Scenarios (creative):** abre o espaço de possibilidades sem travar em restrições técnicas — ideal para começar, já que o tópico mistura produto, engenharia de tempo real e modelo de negócio (self-host vs. hospedado)
- **SCAMPER Method (structured):** aplica as 7 lentes (Substituir, Combinar, Adaptar, Modificar, Outros usos, Eliminar, Reverter) diretamente sobre o conceito já trazido — especialmente rico para explorar o diferencial das câmeras fixas e o que mais pode ser "discord, mas diferente"
- **Six Thinking Hats (structured):** fecha a sessão avaliando as ideias geradas sob múltiplos ângulos (fatos, riscos, benefícios, processo) sem travar a criatividade durante a geração — prepara terreno para a próxima etapa de priorização

**AI Rationale:** O tópico é técnico e multidimensional (produto, UX de videochamada, arquitetura cliente-servidor, self-hosting, mercado), então a sequência começa ampla e divergente (What If), passa por uma exploração estruturada e sistemática do conceito central (SCAMPER), e termina organizando as ideias por perspectiva sem descartar nada ainda (Six Hats). Isso equilibra a linguagem direta e estruturada que você usou ao descrever o projeto com espaço real para ideias fora da caixa.

**Total Estimated Time:** ~55-65 min (20 + 25 + 15-20 min)
**Session Focus:** Divergência ampla seguida de exploração sistemática do produto e fechamento avaliativo multi-perspectiva

## Technique Execution Results

### What If Scenarios

**Interactive Focus:** Começou sem restrições técnicas/de mercado, explorou o diferencial de câmeras fixas até virar sistema de cenas trocáveis ao vivo, depois pivotou para arquitetura de self-hosting (instâncias isoladas, binário único cliente/servidor, instalação), e fechou em confiança/privacidade (denúncia, gravação opt-in, diretório público) e na estrutura de dados servidor/canal.

**Key Ideas Generated:**

- **[Produto #1]** Layouts de Câmera Fixos por Usuário ("modo Diretor de Cena")
- **[Produto #2]** Cenas de Câmera Salvas e Trocáveis ao Vivo (switcher nativo)
- **[Produto #3]** Co-Diretor de Cena (papel de permissão separado de moderação)
- **[Produto #4]** Templates de Cena Compartilháveis (import/export comunitário)
- **[Plataforma #5]** Sistema de Plugins/API estilo Discord Bots
- **[Arquitetura #6]** Núcleo Enxuto + Automação via Plugin (princípio: o que é core vs. plugin)
- **[Arquitetura #7]** Modelo de Instâncias Isoladas (sem federação entre servidores, nem mesmo a instância oficial)
- **[Arquitetura #8]** Binário Único, Dois Modos (Cliente Local com GUI vs. Servidor Headless via CLI)
- **[Arquitetura #9]** Cliente Universal como Console de Administração (local ou remoto)
- **[Self-host #10]** Instalação em Duas Trilhas — Simples (instalador guiado) e Docker
- **[Self-host #11]** Instalador One-Liner Multiplataforma (Windows + Linux), HTTPS por conta do usuário
- **[Self-host #12]** Comando de Diagnóstico (`doctor`) — testa conectividade, TURN, certificado antes de convidar
- **[Confiança #13]** Canal de Denúncia ao Mantenedor — vale para qualquer instância, listada ou não
- **[Privacidade #14]** Gravação Opt-in por Canal, Reversível, com Indicador Visual obrigatório
- **[Confiança #15]** Diretório Público Opt-in de Servidores (base para ação em denúncias)
- **[Estrutura #16]** Hierarquia Servidor > Canal — qualquer usuário pode criar/possuir um canal, mas herda as regras de conduta do servidor _(⚠️ terminologia corrigida em 2026-08-23 — ver "Nota de Atualização" no final do documento: o que esta ideia chama de "Servidor" corresponde ao que passou a se chamar "Instância de Hospedagem")_

**Creative Breakthroughs:**

- A separação entre **"servidor" (instância/infraestrutura)** e **"canal" (unidade social com dono próprio)** — mais autônomo que no Discord, mas sempre subordinado às regras do servidor
- O princípio arquitetural **"núcleo enxuto + inteligência via plugin"** como critério para decidir o que entra no core
- **Binário único** que muda de papel (cliente local / servidor local / servidor headless / console de admin remoto) em vez de produtos separados

**Your Creative Contributions:** Definição do modelo sem federação (decisão consciente), separação servidor/canal, política de gravação opt-in e reversível, decisão de indicador visual obrigatório, e o insight de que "bot diretor automático" pertence à camada de plugin, não ao core.

**Energy Level:** Alta e consistente — sessão avançou por 4 sub-domínios (produto/UX, arquitetura de plataforma, self-hosting/instalação, confiança/privacidade) sem perder ritmo, com respostas cada vez mais estruturais/decisivas.

### SCAMPER Method

**Interactive Focus:** Aplicação sistemática das 7 lentes sobre o conceito já construído — convites, migração do Discord, estatísticas sociais, escopo core-vs-plugin, e estrutura de canais.

**Key Ideas Generated:**

- **[UX #17]** Convite por Link (URI customizada) em vez de IP:Porta — expira por padrão, admin pode gerar permanente, com fallback web `https://` para quem não tem o app instalado
- **[Onboarding #18]** Importador de Estrutura do Discord (via OAuth + Bot oficial) — traz só o esqueleto de canais/categorias, sem membros nem permissões
- **[Produto #19]** Painel de Estatísticas Sociais do Canal (quem mais fala, quem mais chama, quem conversa com quem) — com opt-out individual obrigatório por usuário
- **[Decisão de Escopo]** Estatísticas saem do núcleo — viram plugin opcional ou ficam fora do produto, seguindo o princípio "núcleo enxuto" (#6)
- **[Estrutura #20]** Dois Tipos de Canal — Texto Puro, e Voz/Vídeo+Texto (mantendo a mecânica já validada do Discord nesse ponto)

**Creative Breakthroughs:**

- O **Importador do Discord (#18)** virou o primeiro caso de uso concreto pro sistema de bots/API (#5) — de "feature nice-to-have" pra "ferramenta de aquisição de usuários"
- O princípio **núcleo enxuto + plugin (#6)** provou sua utilidade na prática: quando uma ideia própria do usuário (estatísticas) trouxe risco de complexidade/privacidade, o critério já existente resolveu o dilema sem precisar de nova discussão

**Your Creative Contributions:** Convite por link com fallback web, importador do Discord via OAuth, painel de estatísticas com opt-out, decisão de tirar estatísticas do core, confirmação da estrutura de dois tipos de canal.

**Energy Level:** Começou alta (Substituir, Combinar geraram ideias ricas), esfriou um pouco em Modificar/Outros Usos (respostas mais curtas, sem nova direção forte), e voltou a ficar decisiva em Eliminar/Reverter (duas decisões estruturais claras).

### Six Thinking Hats

**Interactive Focus:** Avaliação das apostas mais importantes da sessão (câmeras fixas/cenas, modelo sem federação, binário único, plugins/API, importador do Discord) sob 6 ângulos — fatos, emoção, benefício, risco, criatividade/mitigação, processo.

**Key Ideas Generated:**

- **[Fato]** Restrições reais do projeto: dev solo, nativo Win/Mac/Linux, também precisa rodar no navegador, precisa ser leve
- **[Emoção]** Câmeras fixas = maior orgulho e maior medo simultaneamente (sinal de que é a aposta central)
- **[Benefício]** Elimina a necessidade de software de produção separado (OBS/vMix) para controlar a visualização da chamada
- **[Risco]** Escopo técnico grande demais para um desenvolvedor solo (nativo x3 + web + leve + WebRTC com controle de layout)
- **[Mitigação de Risco]** Faseamento consciente: v1 com grade fixa simples (cenas trocáveis viram v2) + apoiar em SFU/lib WebRTC pronta (LiveKit, mediasoup, Jitsi) em vez de construir transporte de vídeo do zero
- **[Arquitetura #22]** Migração de Identidade entre Servidores via código de exportação único e de uso único — copia perfil, não conteúdo, não exclui a conta original

**Creative Breakthroughs:**

- Nomear o medo (escopo técnico) abriu espaço pra uma decisão de roadmap concreta (fasear + apoiar em infra pronta) em vez de ficar como ansiedade não-endereçada
- A migração de identidade resolve a maior desvantagem do modelo "sem federação" (decidido no What If) sem contradizer a decisão original — migração pontual, não ponte permanente

**Your Creative Contributions:** Todas as restrições factuais do projeto, a identificação honesta do medo técnico, a escolha das duas estratégias de mitigação, e o desenho completo da migração de identidade (o quê migra, como, segurança).

**Energy Level:** Reflexiva e honesta — essa técnica trouxe as restrições reais (solo dev) e riscos que as duas técnicas anteriores, mais divergentes, não haviam forçado à superfície.

## Idea Organization and Prioritization

**Thematic Organization:**

**Tema 1 — Produção Visual (Câmeras & Cenas):** #1 Layouts de Câmera Fixos, #2 Cenas Trocáveis ao Vivo, #3 Co-Diretor de Cena, #4 Templates de Cena Compartilháveis, Mitigação de Risco (v1 simples + SFU pronto). O diferencial-bandeira do produto — também o de maior risco técnico.

**Tema 2 — Arquitetura de Plataforma:** #6 Núcleo Enxuto + Plugin, #7 Instâncias Isoladas (sem federação), #8 Binário Único Dois Modos, #9 Cliente Universal como Console Admin, #20 Dois Tipos de Canal, #22 Migração de Identidade. Decisões que definem a filosofia do produto e resolvem as próprias desvantagens que essas escolhas trazem.

**Tema 3 — Self-Hosting & Instalação:** #10 Instalação em Duas Trilhas, #11 Instalador One-Liner Multiplataforma, #12 Comando `doctor`. Reduzir atrito de hospedar é tão importante quanto o produto em si.

**Tema 4 — Confiança & Privacidade:** #13 Canal de Denúncia ao Mantenedor, #14 Gravação Opt-in com Indicador Visual, #15 Diretório Público Opt-in. Liberdade total pro admin, com uma válvula de escape mínima.

**Tema 5 — Aquisição & Ecossistema:** #5 Sistema de Plugins/API, #17 Convite por Link, #18 Importador do Discord. O importador do Discord é o primeiro uso real da API de plugins.

**Decisão de Escopo:** #19 Painel de Estatísticas Sociais → plugin futuro ou fora do core.

**Breakthrough Concepts:** #2 (switcher de produção nativo), #18 (importador como ferramenta de aquisição), #22 (migração de identidade resolve a fraqueza do modelo sem federação).

**Prioritization Results:**

- **Top Priority (escolhida pelo usuário):** Temas 1 e 3 — Produção Visual e Self-Hosting/Instalação são os que definem se o produto tem razão de existir e se alguém consegue de fato usá-lo.
- **Quick Win Opportunities:** #17 Convite por Link, #14 Gravação Opt-in, #20 Dois Tipos de Canal — baixa complexidade, alto valor percebido.
- **Breakthrough Concepts para depois do MVP:** #2 Cenas Trocáveis, #18 Importador do Discord, #5 Sistema de Plugins/API.

**Action Planning:**

**Prioridade #1 — MVP: Grade Fixa Simples de Câmeras + Self-Hosting Básico**

_Escopo do MVP:_
- #1 Layouts de câmera fixos (grade simples, sem cenas trocáveis)
- Mitigação: apoiar em SFU/lib WebRTC pronta (LiveKit, mediasoup ou Jitsi) em vez de construir transporte de vídeo do zero
- #8 Binário único com modo cliente/servidor
- #10 + #11 Pelo menos uma trilha de instalação fácil
- #17 Convite por link

_Fora do MVP (adiado conscientemente):_
- #2, #3, #4 Cenas trocáveis, co-diretor, templates → v2
- #5, #18 Plugins/API e importador do Discord → depois do core estável
- #13, #14, #15 Denúncia, gravação, diretório público → importantes, não bloqueiam
- #19 Estatísticas → plugin futuro ou fora

_Próximos Passos Imediatos:_
1. Escolher e validar a lib de WebRTC/SFU (spike técnico de alguns dias, testando encaixe com "leve + nativo + navegador")
2. Prototipar a grade fixa de câmera em cima de uma chamada básica funcionando

_Obstáculos Potenciais:_
- Achar uma SFU realmente leve o suficiente pra self-host
- Garantir que "nativo + web" não vire dois códigos-base separados pra manter sozinho

_Métrica de Sucesso:_
- Subir um servidor local, convidar via link, entrar numa chamada com câmeras em posições fixas — de ponta a ponta, sem gambiarra manual

## Session Summary and Insights

**Key Achievements:**

- 22 ideias/decisões geradas cobrindo produto, arquitetura, self-hosting, confiança/privacidade e aquisição
- Modelo de arquitetura completo definido: instâncias isoladas sem federação, binário único cliente/servidor, hierarquia servidor > canal com donos distintos
- Filosofia de produto consolidada: núcleo enxuto + extensibilidade via plugins
- Risco técnico principal identificado (escopo grande demais pra dev solo) e mitigado com decisão concreta de faseamento (v1 grade simples + SFU pronto, v2 cenas trocáveis)
- MVP escopado e priorizado, com próximos passos técnicos imediatos definidos

**Session Reflections:**

A sessão seguiu um arco natural: divergência ampla (What If) revelou o modelo de arquitetura e a filosofia do produto; SCAMPER sistematizou lacunas (onboarding, migração do Discord, tipos de canal); Six Thinking Hats trouxe as restrições reais à tona (dev solo) e converteu o maior medo da sessão (escopo técnico) numa estratégia de mitigação concreta em vez de deixá-lo como ansiedade não-endereçada. A câmera fixa em posições — ponto de partida da sessão — permanece o diferencial central do produto, agora com um caminho de execução realista pra uma pessoa só construir.

---

## Nota de Atualização Pós-Sessão (2026-08-23)

Numa conversa de acompanhamento (após as pesquisas de mercado e técnica, e a criação do product brief), ficou claro que a terminologia usada nesta sessão pra "Servidor" e "Canal" estava ambígua e precisava de correção. O modelo original ficou registrado como **2 camadas** (Servidor = instância de hospedagem; Canal = unidade social com dono, ver ideia #16). O modelo correto, confirmado pelo usuário, tem **3 camadas**:

1. **Instância de Hospedagem** — a máquina/processo que um sysadmin roda (local ou servidor real); o "binário único em modo servidor" da ideia #8. Pode hospedar **múltiplos** Servidores simultaneamente (multi-tenancy).
2. **Servidor** — no sentido Discord: criado por qualquer usuário, com dono/admin próprio, contém canais. É a unidade social que as pessoas reconhecem e entram via convite.
3. **Canal** — de voz/vídeo ou só texto, vive dentro de um Servidor.

**Regras de isolamento confirmadas:**
- Usuários de um Servidor não veem nada de outro Servidor na mesma Instância de Hospedagem, a menos que convidados
- Dentro de um mesmo Servidor, canais individuais também podem ser restritos/privados — visíveis só a quem foi convidado especificamente àquele canal (não ao servidor inteiro)

**Onde isso corrige ideias anteriores desta sessão:**
- **Ideia #16** ("Hierarquia Servidor > Canal"): o "Servidor" ali descrito corresponde à **Instância de Hospedagem** no modelo corrigido — a ideia central (autonomia do dono do canal, herança de regras) continua válida, só o nome da camada superior mudou
- **Ideia #7** (Instâncias Isoladas sem federação): continua válida como estava — o isolamento é entre Instâncias de Hospedagem diferentes. A novidade é que agora sabemos que uma única instância pode hospedar múltiplos Servidores internamente, isolados entre si por permissão (não é federação, é multi-tenancy)
- **Ideia #22** (Migração de Identidade entre "servidores"): a migração acontece entre **Instâncias de Hospedagem** diferentes (ex: sair da instância oficial e entrar na de um amigo), não entre Servidores dentro da mesma instância

**Implicação nova não explorada ainda:** multi-tenancy numa Instância de Hospedagem abre a possibilidade de alguém oferecer "hospedagem como serviço" — um sysadmin hospeda Servidores de terceiros na própria infraestrutura, meio caminho entre self-host puro e um SaaS. Vale explorar numa sessão futura se isso interessa como modelo de negócio.

Os documentos `product-brief.md` e `pesquisa-mercado-e-tecnica.md` foram atualizados com a terminologia corrigida.
