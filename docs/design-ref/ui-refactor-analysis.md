# Mesa — Análise de Repositório e Proposta de Refactor de UI

**Inspiração declarada:** Discord (navegação social, chrome de chamada) e TeamSpeak (árvore de presença, utilitarismo)
**Baseado em:** leitura do código real (`frontend/src`), `CHANGELOG.md` completo e `README.md` — não apenas nos screenshots do protótipo, que o próprio README assinala como desatualizados.

---

## 1. Contexto importante antes de propor qualquer mudança

O `CHANGELOG.md` mostra **81 specs já implementadas**, várias delas já explicitamente inspiradas em Discord. Isto muda o tipo de proposta que faz sentido aqui: não é um redesign do zero, é **identificar o que ainda não foi feito, o que foi feito e revertido (com lição a preservar), e onde o código já está a pagar juros técnicos que se refletem na UI.**

### 1.1 O que já está feito — não repetir

| Já implementado | Spec | Nota |
|---|---|---|
| Painel de membros à direita | 008 | O README lista como "em especificação 008" — **está desatualizado**, já existe e está ligado no `AppShell.tsx`. |
| Barra de utilizador flutuante (avatar, mic, câmara+blur, sair) no fundo da sidebar | 039 | Explicitamente "Discord-like visual polish" |
| Miniatura flutuante de chamada (PiP) ao sair da mesa para o texto, drag-snap aos 4 cantos | 038 | Equivalente ao popout call window do Discord |
| Indicador de "a falar" (aura) no roster e no botão de mic | 033, 036 | Alimentado pelos active speakers do LiveKit |
| Pílula de não-lidas + indicador de voz ativa na server rail | 037 | |
| Tipografia Inter, glifos preenchidos, cantos arredondados unificados | 037, 044, 045 | |
| Roster aninhado por canal de voz (quem está a transmitir, mic/headphones) | 028 | Isto **já é o padrão TeamSpeak** de árvore de presença — só que por agora limitado ao canal de voz, não a todos os canais ao mesmo tempo |
| Barra "ainda ligado" persistente | 028 | **Removida** em 040 a favor do PiP — decisão já tomada e validada |
| **Modo palco** (visão imersiva full-bleed) | implementado e depois retirado (081: "stage mode retired — force off on any request/toggle") | Ver §6 — não reintroduzir sem entender porquê foi revertido |

Isto é relevante porque uma parte do instinto natural ao pedir "inspira-te em Discord" seria propor exatamente estas coisas — já estão feitas e afinadas ao longo de dezenas de iterações.

### 1.2 Discrepância doc vs código

O `README.md` (secção "O que ainda não é") está desatualizado em pelo menos dois pontos (painel de membros, e implicitamente o modo palco que já foi tentado). Vale a pena atualizá-lo a par deste refactor — não é um item de UI, mas é debt encontrado na mesma varredura.

---

## 2. O que é genuinely único da Mesa (não copiar de nenhum dos dois)

Nem Discord nem TeamSpeak têm o conceito de **Composição vs Grade** — a dualidade entre uma cena curada (estilo OBS/vMix, com slots posicionados) e uma grade automática de participantes. Isto é o coração diferenciador do produto (mestres que gravam/transmitem sessões). O refactor deve **reforçar** esta identidade visual própria, não dissolvê-la em busca de paridade com apps de chat genéricos.

---

## 3. Achados técnicos que justificam um refactor (não só estético)

Isto não é só "a UI podia ficar mais bonita" — há debt de estrutura que se manifesta como fricção de UI:

### 3.1 `shell/Sidebar.tsx` é um monólito de 1287 linhas

Um único componente `Sidebar(props)`, sem subcomponentes internos, com **29 `createSignal`** próprios. Mistura pelo menos estas responsabilidades numa função só: lista de canais de texto, lista de canais de voz + roster aninhado, menus de criação («+»), context menus, e provavelmente estado de drag/hover. Isto é o tipo de estrutura onde qualquer alteração de UI (ex: permitir colapsar uma secção) tem alto risco de efeitos colaterais, porque tudo partilha o mesmo escopo de estado.

### 3.2 `styles/mesa-theme.css` é um único ficheiro de ~3935 linhas

Não há separação por componente ou por domínio (shell vs voz vs mensagens vs modais). Isso dificulta saber que regras afetam o quê, e é a razão provável por trás de bugs já corrigidos como o do menu de blur cortado por `overflow: hidden` (023).

### 3.3 O cabeçalho do canal de voz está sobrecarregado

Lido diretamente de `pages/VoiceChannel.tsx`, o `<header class="pane-header">` do canal de voz contém, na mesma linha, **seis grupos de controlo distintos**:

1. Título + subtítulo (ocupação + timer de chamada)
2. Segmented control Composição/Grade
3. Botão «Editar cena» (admin)
4. Ícone de Membros
5. Select inline de blur de câmara (só quando em chamada)
6. Chip de estado E2EE

Isto é mais densidade do que o cabeçalho de canal do Discord (nome + poucos ícones) ou a toolbar do TeamSpeak (minimalista por design). Cresceu organicamente ao longo de várias specs (015, 018, 019, 020…), cada uma a acrescentar um controlo sem revisitar o conjunto.

### 3.4 Funcionalidade multi-cena existe na API mas está escondida na UI

Desde 007: *"Voice channel chrome: single-scene UX — multi-scene list/create/switch hidden; Editar cena edits the active scene only."* Isto é uma dívida de produto conhecida (backlog G10), não uma descoberta minha, mas relevante para uma proposta de refactor de UI porque a arquitetura de informação da área de voz foi construída **assumindo** que isto ia voltar.

---

## 4. Quadro comparativo — o que vale aprender de cada referência

| Padrão | Discord | TeamSpeak | Estado na Mesa | Vale adotar? |
|---|---|---|---|---|
| Hierarquia servidor → canal | Rail + sidebar | Árvore única | Já feito (rail + sidebar) | — |
| Popout de chamada ao navegar | Sim | Não (janela única) | Já feito (PiP, 038) | — |
| Painel de membros lateral | Sim | Substituído pela árvore em si | Já feito (008) | — |
| Colapsar secções/categorias | Sim | Colapsar sub-canais | **Não** (078 força sempre expandido) | Sim — ver §5.2 |
| Árvore de presença sempre visível, mesmo fora do canal atual | Não (só vês quem está onde se entrares) | **Sim**, é o cerne do TeamSpeak | Parcial — só vês roster do canal de voz que está montado na sidebar do servidor atual | Sim — ver §5.4 |
| Toolbar utilitária mínima por canal | Poucos ícones | Muito poucos | Cabeçalho de voz está denso (§3.3) | Sim — ver §5.1 |
| Context menu rico (clique direito) para ações rápidas | Sim | **Muito rico** — é o principal modo de interação | Existe `ContextMenu.tsx`, uso não mapeado por mim em detalhe | Vale auditar cobertura |
| Composição visual de câmaras (estilo OBS) | Não existe | Não existe | **Único da Mesa** | Reforçar identidade própria (§2) |

---

## 5. Proposta de refactor

### 5.1 Reagrupar o cabeçalho do canal de voz *(prioridade alta, risco baixo)*

Manter sempre visíveis apenas os elementos com carga informativa contínua: título/ocupação, segmented Composição/Grade, chip E2EE (é sinalização de segurança, não deve ficar escondida atrás de um menu). Mover **Editar cena** e o **select de blur** para um botão de overflow (`⋯`) ou para dentro do próprio modo de edição/menu de contexto do avatar local — reduz de 6 para 4 grupos visíveis por omissão, sem remover nenhuma funcionalidade.

### 5.2 Permitir colapsar secções da sidebar *(prioridade média)*

078 forçou "sempre expandido" deliberadamente — vale confirmar o motivo original antes de reverter (pode ter sido para simplificar um bug de sincronização de estado, não necessariamente uma decisão de produto definitiva). Se for reintroduzido, o padrão Discord (chevron por secção, estado por servidor) é diretamente aplicável e o hook `writeChannelsListExpanded` já existe no código — a funcionalidade foi *desligada*, não removida.

### 5.3 Decompor `Sidebar.tsx` *(prioridade alta para saúde do código, sem mudança visual)*

Extrair, mantendo o comportamento atual pixel a pixel:
- `ChannelList` (secção Texto)
- `VoiceChannelList` (secção Voz e Vídeo, incluindo o roster aninhado — que é o componente mais próximo do "channel tree" do TeamSpeak e merece ser isolado e testado como tal)
- `SidebarCreateMenu` (os «+» de criação)

Isto é pré-requisito prático para o item 5.2 e para qualquer iteração futura na árvore de presença (5.4) — mexer num componente de 1287 linhas e 29 signals para adicionar UI nova é onde bugs de regressão tendem a nascer.

### 5.4 Presença entre servidores ao estilo TeamSpeak *(prioridade média, feature nova)*

A Mesa já mostra um indicador binário "há voz ativa" na server rail (`has_voice`). Um passo TeamSpeak-like natural: **hover/long-press no ícone do servidor na rail mostra um popover leve com quem está em cada canal de voz daquele servidor agora**, sem precisar de trocar de servidor primeiro. Isto usa dados que o backend já expõe (`GET /api/servers/{id}/voice-occupancy`) — é principalmente uma composição de UI nova sobre um contrato existente, não uma feature de API nova.

### 5.5 Modularizar `mesa-theme.css` *(prioridade média, sem mudança visual)*

Dividir por domínio mantendo os tokens (`:root`/`.app` vars) num ficheiro único de origem: `tokens.css`, `shell.css` (rail/sidebar/topbar), `voice.css` (grade/cenas/header de voz), `messages.css`, `modals.css`. Reduz o raio de explosão de qualquer alteração futura e resolve a classe de bug já vista em 023.

### 5.6 Dar à Composição/Grade uma linguagem visual mais assertiva *(prioridade baixa, exploratório)*

Já que este é o elemento sem equivalente direto em Discord/TeamSpeak, vale considerar — quando a UI multi-cena (G10) voltar à mesa — um tratamento visual que a distinga claramente de "só mais um modo de vídeo", por exemplo um separador visual mais forte entre o cabeçalho "de produção" (cenas, slots) e o cabeçalho "de chamada" (mic, câmara, sair), em vez de os dois competirem na mesma linha como hoje.

---

## 6. Cuidados — o que não mexer sem investigar primeiro

- **Não reintroduzir modo palco.** Foi construído e explicitamente revertido em 081 ("never enable stage mode"). Antes de qualquer proposta que se pareça com "vista imersiva de chamada", vale entender a razão da reversão (UX, bug, ou decisão de produto) — não está documentada no `CHANGELOG`, só o resultado.
- **Não assumir que 078 (sidebar sempre expandida) foi só um efeito colateral** — pode ter sido intencional por simplicidade de manutenção numa fase inicial. Vale confirmar antes de reverter.
- Qualquer decomposição do `Sidebar.tsx` deve preservar exatamente o comportamento atual — dado o volume de estado (29 signals), esta refatoração pede testes de regressão manuais cobrindo: seleção de servidor, troca de canal, abertura de menus de criação, e o roster de voz aninhado.

---

## 7. Faseamento sugerido

Seguindo a numeração de specs existente (última é `081`), o trabalho dividir-se-ia naturalmente em specs independentes e sequenciáveis:

1. **082 — Sidebar componentization** (§5.3): puramente estrutural, sem mudança de comportamento visível. Base para tudo o resto.
2. **083 — Voice header decluttering** (§5.1): risco baixo, ganho imediato de clareza.
3. **084 — mesa-theme.css modularization** (§5.5): estrutural, paralelizável com 083.
4. **085 — Sidebar section collapse** (§5.2): depende de 082.
5. **086 — Cross-server voice presence popover** (§5.4): feature nova, depende de 082 para não crescer ainda mais o ficheiro atual.

Isto mantém cada spec pequena e revertível — consistente com o padrão que o resto do `specs/` já segue.
