# Feature Specification: Fase 3 — Redesign visual (Mesa / Nocturne)

**Feature Branch**: `004-fase-3-design`

**Created**: 2026-09-04

**Status**: Draft

**Input**: User description: "Mudar a terceira fase: refazer o design da aplicação com base em docs/design-ref/design-prd.md e nos protótipos da mesma pasta (Conceito — Wireframes, Mesa — Protótipo v1 Modernist, Mesa — Protótipo v2 Nocturne), garantindo fidelidade técnica máxima à direção de design vigente (Nocturne v2)."

**Referências de design (fonte da verdade visual)**:
- `docs/design-ref/design-prd.md` — decisões de produto/UX da aplicação web
- `docs/design-ref/Mesa - Protótipo v2.dc.html` — protótipo vigente (Nocturne)
- `docs/design-ref/_ds/nocturne-*/` — tokens e componentes do design system
- `docs/design-ref/Mesa - Protótipo.dc.html` e `Conceito - Wireframes.dc.html` — exploração (não são a direção a implementar)

## Clarifications

### Session 2026-09-04

- Q: Ecrãs de autenticação e desbloqueio de chaves entram no redesign Nocturne? → A: Sim — incluir login, registo, aceitar convite e desbloquear chaves no visual Nocturne.
- Q: Editor de cena — Salvar/Descartar ou aplicação imediata? → A: Rascunho local + Salvar/Descartar; ao Salvar, persiste (cena activa = efeito ao vivo para todos).
- Q: Layout em ecrã estreito / telemóvel? → A: Sidebar em gaveta sobreposta; modo palco esconde-a.
- Q: Preferência Composição/Grade lembra como? → A: Por pessoa neste dispositivo (igual em todos os canais).
- Q: Texto da Instância na barra? → A: “instância ·” + hostname/origem do browser (sem campo novo no servidor).

## User Scenarios & Testing *(mandatory)*

A Fase 1 entregou a Instância utilizável (contas, Servidores, canais, grade, E2EE sempre ligada). A Fase 2 entregou cenas trocáveis e co-diretor. A interface actual, porém, é funcional e utilitária: não reflecte a metáfora do **palco**, a hierarquia Instância → Servidor → Canal, nem o sistema visual escolhido.

A Fase 3 **não inventa a cunha de produto**: reaplica o chrome e os fluxos já existentes para ficarem **visual e interactivamente próximos** do protótipo Nocturne v2 e do PRD de design, sem regressar nas capacidades das Fases 1 e 2.

**Definição de “done”:** um revisor coloca o protótipo v2 e a app lado a lado e reconhece a mesma shell (barra superior, sidebar única, palco escuro, tema claro/escuro); um mestre completa “entrar → canal de vídeo → ver/trocar cena” com a nova UI; texto, voz, cenas e co-diretor continuam a funcionar como nas Fases 1–2.

### User Story 1 - Shell e navegação no padrão Mesa (Priority: P1)

Uma pessoa autenticada vê a barra superior com marca **Mesa**, procedência da Instância de Hospedagem (texto discreto), alternador de tema claro/escuro e chip do utilizador. A sidebar é **única** (~largura do protótipo): cabeçalho com o Servidor actual e troca de Servidor no topo; lista de canais em duas secções (**Texto**, **Voz e vídeo**); acções “Criar canal” / “Criar servidor”; rodapé com membros / self-hosted. Em chamada, pode activar **Modo palco**, que recolhe a sidebar por completo e devolve a área ao vídeo.

**Why this priority**: Sem a shell correcta, o resto do redesign não se lê como o produto desenhado. É o primeiro pixel que distingue “MVP cru” de “Mesa”.

**Independent Test**: Abrir a SPA após login e comparar com o protótipo v2: mesma hierarquia visual; trocar tema; entrar num canal de voz e activar modo palco; trocar de Servidor pelo cabeçalho da sidebar (sem rail de ícones).

**Acceptance Scenarios**:

1. **Given** uma conta com pelo menos um Servidor, **When** abre a app, **Then** vê barra superior (marca Mesa, “instância ·” + hostname/origem actual, tema, utilizador) e sidebar única com canais agrupados em Texto / Voz e vídeo — **não** um rail permanente de Servidores.
2. **Given** dois Servidores, **When** troca pelo cabeçalho da sidebar, **Then** a lista de canais passa a ser só do Servidor escolhido; o outro Servidor continua isolado.
3. **Given** está num canal de voz/vídeo em chamada, **When** activa Modo palco, **Then** a sidebar recolhe a 0 de largura útil e o controlo passa a “Mostrar canais”; **When** mostra de novo, **Then** a sidebar volta.
4. **Given** o tema escuro (padrão visual do protótipo), **When** escolhe claro, **Then** o chrome (barra, sidebar, diálogos) muda e o **palco de vídeo permanece escuro**; a escolha persiste neste dispositivo.
5. **Given** viewport estreita (telemóvel ou janela estreita), **When** abre a lista de canais, **Then** a sidebar aparece como gaveta sobreposta; **When** activa Modo palco (ou fecha a gaveta), **Then** o conteúdo principal recupera a largura.

---

### User Story 2 - Canal de texto e canal de voz com chrome do protótipo (Priority: P1)

No canal de texto, mensagens agrupadas por autor (avatar, nome, hora), largura de leitura confortável (~74ch), composer com Enter para enviar, e etiqueta discreta de **E2EE activa** no cabeçalho. No canal de voz/vídeo: cabeçalho com nome, cena activa e contagem “N de M em cena”; **palco** com tiles da composição (dica de slot + chip com nome/estado); controlos de microfone, câmara e sair; linha de estado de privacidade; **banco** para quem está na chamada sem slot. Alternador **Composição / Grade**: Composição mostra a cena activa (o quadro intencional); Grade mostra todos os participantes numa grelha automática (incluindo quem está no banco). Cada pessoa escolhe a vista localmente.

**Why this priority**: É onde o produto “acontece” para mestres e jogadores; o PRD trata o palco como o produto.

**Independent Test**: Duas contas no mesmo canal de texto e depois no de voz; comparar layout com o protótipo; alternar Composição/Grade; confirmar que a cena activa (Fase 2) alimenta a Composição e que o banco lista quem não tem slot.

**Acceptance Scenarios**:

1. **Given** um canal de texto com mensagens, **When** o abre, **Then** vê lista agrupada por autor, composer e etiqueta de E2EE activa no cabeçalho — sem chrome de “dashboard” a competir com a leitura.
2. **Given** uma chamada com cena activa de 4 slots e alguém só no banco, **When** está em Composição, **Then** vê só os slots da cena (vazios visíveis); **When** muda para Grade, **Then** vê também quem está no banco.
3. **Given** a preferência Composição ou Grade, **When** recarrega o cliente ou abre outro canal de voz, **Then** a mesma escolha por pessoa neste dispositivo é restaurada (não uma preferência distinta por canal).
4. **Given** E2EE sempre ligada (Fases 1–2), **When** está em qualquer canal, **Then** o estado de privacidade aparece como etiqueta discreta “E2EE activa” (ou equivalente do protótipo); **MUST NOT** aparecer faixa de “E2EE desligada”, diálogo “Gravar cena…” nem acção para desligar protecção nesta fase.

---

### User Story 3 - Editor de cena e lista de cenas no visual do protótipo (Priority: P2)

Quem administra o canal (e, para activar, o co-diretor) usa a UI de cenas da Fase 2 **revestida** pelo padrão do editor do protótipo: palco editável com slots do layout; ocupado mostra identidade; vago mostra borda a tracejado em acento e convite a soltar; painel com miniaturas de layout (2–4) e **No banco** com pessoas arrastáveis (ou equivalente por teclado). Enquanto edita, as alterações ficam num **rascunho local**: **Salvar** persiste no Servidor (se a cena for a activa, o efeito é ao vivo para todos); **Descartar** abandona o rascunho e volta ao último mapa guardado. Criar/duplicar cenas continua a não activar sozinho (Fase 2). A lista de cenas e a co-direção permanecem.

**Why this priority**: A cunha visual já existe na Fase 2; esta história só fecha a distância entre “API + UI mínima” e o editor que o design validou.

**Independent Test**: Dono edita uma cena, descarta e confirma que nada mudou; edita de novo, salva e activa; co-diretor só activa; membro sem papel não edita. Comparar painel direito e slots com o protótipo v2.

**Acceptance Scenarios**:

1. **Given** dono no canal de vídeo, **When** entra no modo de editar cena, **Then** vê palco + painel (layouts + banco) no espírito do protótipo; alterações ainda não persistidas até Salvar.
2. **Given** rascunho com mudanças, **When** Descartar, **Then** o mapa volta ao último estado guardado e o quadro ao vivo (se a cena era a activa) não reflecte as mudanças abandonadas.
3. **Given** rascunho com mudanças numa cena activa, **When** Salvar, **Then** o mapa persiste e todos os participantes vêem a nova composição; numa cena inactiva, **When** Salvar, **Then** o mapa daquela cena actualiza-se sem mudar o quadro ao vivo.
4. **Given** pessoa no banco, **When** o dono a atribui a um slot no rascunho (arrastar ou teclado), **Then** sai de qualquer slot anterior no rascunho e ocupa o novo; clicar num slot ocupado (ou acção equivalente) devolve a pessoa ao banco.
5. **Given** co-diretor, **When** usa a UI, **Then** pode activar cenas e **MUST NOT** obter controlos de criar/duplicar/editar mapa/apagar/nomear co-diretores.
6. **Given** teclado apenas, **When** atribui pessoa a slot, **Then** existe caminho sem rato (requisito do PRD §8).

---

### User Story 4 - Auth, convite e diálogos de criar (Priority: P2)

Login, registo, aceitar convite e desbloquear chaves usam o visual Nocturne (tipografia, tokens, botões outline, um objectivo por ecrã) — a primeira impressão deixa de ser o formulário utilitário das Fases 1–2. Criar Servidor, criar canal e gerar/copiar convite usam o mesmo sistema. Fluxos existentes (senha, cofre, convite 7 dias ou permanente) mantêm-se; só a apresentação muda. Não se exige o checkbox de “salvei a chave de E2EE do canal” do PRD §4.6: a custódia segue o modelo das Fases 1–2.

**Why this priority**: Fecha a primeira impressão (entrar e criar mesa) no visual certo, sem reabrir o modelo criptográfico.

**Independent Test**: Registar ou entrar; desbloquear chaves; abrir convite; criar Servidor/canal; copiar convite; comparar tipografia e hierarquia com o protótipo.

**Acceptance Scenarios**:

1. **Given** visitante sem sessão, **When** vê login/registo (ou desbloqueio com sessão sem chaves), **Then** o ecrã segue Nocturne (marca Mesa, tokens, botões) e os fluxos de auth/cofre continuam correctos.
2. **Given** link de convite, **When** aceita ou cria conta pelo convite, **Then** o ecrã de convite está alinhado ao Nocturne e o ingresso no Servidor funciona como na Fase 1.
3. **Given** utilizador na instância, **When** cria um Servidor pelo fluxo novo, **Then** completa nome (e opções já suportadas) num diálogo alinhado ao Nocturne.
4. **Given** dono, **When** cria canal texto ou voz/vídeo, **Then** o diálogo distingue os tipos como no protótipo; o canal de voz nasce com a cena padrão da Fase 2.
5. **Given** convite gerado, **When** copia o link, **Then** vê feedback explícito de cópia.

---

### Edge Cases

- Sair do editor com rascunho por guardar: pedir confirmação (guardar / descartar / cancelar) — não silenciar a perda.
- Janela estreita / telemóvel: sidebar em **gaveta sobreposta** (não empilhada acima do conteúdo); Modo palco mantém-na fechada; alvos de toque dos controlos de chamada ≥ 40px.
- Servidor sem canais: lista vazia com acções de criar ainda óbvias — não um ecrã “em branco” sem orientação.
- Mais pessoas na chamada do que slots da cena: excedente no banco; layout **não** muda sozinho.
- Tema claro na primeira visita: respeitar preferência do sistema do dispositivo, com override manual persistente.
- Queda de rede / reconexão: estados mínimos legíveis (mensagem ou faixa) sem partir o chrome Nocturne — polish aceite se o essencial (reconectar à chamada) já existir.
- Participante sem câmara num slot: tile continua a mostrar identidade; não colapsa a grade.
- Comparação lado a lado com o protótipo: diferenças aceites só onde o produto já restringiu âmbito (sem gravação, sem desligar E2EE, sem diretório público, sem canal privado se ainda não existir na Fase 1).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A interface web MUST adoptar a direcção visual **Nocturne** do protótipo v2 (fundo azul-acinzentado dessaturado, tipografia Inter 400–600, raios 8–16px, acento blurple usado como linha/marca/realce — nunca como preenchimento de área grande; densidade compacta). Tokens semânticos do chrome (`panel`, `elev`, `muted`, `stage`, `tile`, `chip`, hover/press/selecção, inputs) MUST espelhar o par claro/escuro do protótipo; o palco de vídeo MUST permanecer escuro nos dois temas.
- **FR-002**: A shell MUST seguir a navegação **1b** do PRD: sidebar única com troca de Servidor no topo; MUST NOT reintroduzir rail permanente de Servidores (1a). Modo palco MUST recolher a sidebar como no protótipo.
- **FR-003**: A barra superior MUST mostrar marca Mesa, procedência da Instância como texto discreto no formato “instância ·” + hostname (ou origem) do browser que o utilizador está a usar, alternador de tema e identidade do utilizador autenticado. A Instância MUST aparecer como procedência, não como item de navegação principal. MUST NOT exigir configuração nova no servidor para esse rótulo nesta fase. O rodapé da sidebar MAY repetir a nota “self-hosted · sem federação”.
- **FR-004**: Listas de canais MUST separar **Texto** e **Voz e vídeo**; item activo com peso/ênfase como no protótipo; canais de voz MAY mostrar contagem de pessoas quando a informação existir.
- **FR-005**: Utilizadores MUST poder escolher tema claro ou escuro; a escolha MUST persistir no dispositivo; a primeira visita MUST respeitar a preferência de esquema de cores do sistema, salvo override manual já guardado.
- **FR-006**: Canal de texto MUST apresentar mensagens agrupadas por autor, composer e indicador discreto de E2EE activa, com largura de leitura limitada (~74ch) no espírito do protótipo.
- **FR-007**: Canal de voz/vídeo MUST apresentar cabeçalho (nome, cena activa, ocupação), palco derivado da cena activa (Fase 2), controlos de chamada, linha de estado de privacidade (E2EE activa) e banco de participantes sem slot.
- **FR-008**: Cada participante MUST poder alternar localmente entre vista **Composição** (cena activa) e **Grade** (todos na chamada, incluindo banco). A preferência MUST persistir neste dispositivo **por pessoa** (uma escolha global, não por canal).
- **FR-009**: O editor / gestão de cenas MUST alinhar-se ao protótipo (slots, banco, layouts 2–4, Salvar/Descartar) mantendo as regras de permissão e comportamento da Fase 2 (criar/duplicar/activar/apagar, co-diretor só activa). Edições MUST residir em rascunho local até Salvar; Descartar MUST restaurar o último mapa persistido. Salvar uma cena activa MUST publicar o efeito ao vivo; Salvar uma inactiva MUST NOT alterar o quadro ao vivo. Atribuição de slot MUST ter equivalente por teclado.
- **FR-010**: Ecrãs de login, registo, aceitar convite e desbloquear chaves, bem como diálogos de criar Servidor, criar canal e convite, MUST usar o sistema visual Nocturne (um objectivo por ecrã/diálogo, feedback de cópia). MUST NOT alterar as regras de auth/cofre das Fases 1–2 nem bloquear criação de canal com novos requisitos de “chave de E2EE do canal” incompatíveis com o modelo já em produção.
- **FR-015**: A fidelidade visual da primeira visita (auth e convite) MUST contar para SC-001/SC-006 no mesmo critério que a shell autenticada.
- **FR-011**: Nesta fase MUST NOT existir UI para desligar E2EE, gravar/exportar cena no servidor, diretório público, nem canvas livre de câmeras (1e). O protótipo v2 que mostra esses controlos é referência visual; esses fluxos ficam fora do âmbito (roadmap posterior).
- **FR-016**: Em viewports estreitas (telemóvel / janela estreita), a sidebar MUST comportar-se como gaveta sobreposta (abre e fecha por controlo explícito), sem roubar permanentemente a largura do palco ou da leitura; Modo palco MUST mantê-la fechada. Alvos de toque dos controlos de chamada MUST ter pelo menos 40px.
- **FR-012**: Foco de teclado visível (anel em acento), contraste sem depender só de cor para estado de privacidade, e alvos de toque ≥ 40px nos controlos de chamada MUST ser respeitados.
- **FR-013**: Capacidades já entregues nas Fases 1 e 2 (auth, convites, Servidores, texto cifrado, voz/vídeo, grade/cenas, co-diretor, E2EE sempre ligada) MUST continuar a funcionar após o redesign; regressões funcionais contam como falha desta fase.
- **FR-014**: A fidelidade visual MUST ser verificável por comparação com `Mesa - Protótipo v2.dc.html` e o design system Nocturne em `docs/design-ref/_ds/nocturne-*` (espaçamento, raios, acento outline em botões primários, tipografia, tokens de tema). Desvios só são aceites por restrição de âmbito já documentada ou por acessibilidade.

### Key Entities

- **Shell Mesa**: chrome da aplicação (barra superior, sidebar, modo palco, tema) que enquadra Instância, Servidor e Canal.
- **Palco**: área de vídeo sempre escura onde a composição (cena activa) é apresentada.
- **Banco**: participantes na chamada sem slot na composição actual.
- **Vista local Composição/Grade**: preferência única por pessoa neste dispositivo (todos os canais); não altera a cena activa no Servidor.
- **Rascunho de cena**: mapa em edição só no cliente até Salvar; Descartar abandona-o.
- **Tema**: par claro/escuro de tokens; não altera a geometria do palco.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um revisor com o protótipo v2 aberto ao lado da app identifica, em menos de 2 minutos, a mesma linguagem visual (marca Mesa, Nocturne, e depois sidebar única / palco escuro / tema) desde o ecrã de auth até à shell autenticada, sem precisar de explicação.
- **SC-002**: Em 100% dos percursos de regressão F1+F2 cobertos pelo quickstart desta fase (login/registo/desbloqueio, texto, voz, trocar cena, co-diretor), as acções completam-se com a nova UI sem falha funcional nova.
- **SC-003**: Trocar tema claro ↔ escuro actualiza o chrome em menos de 1 segundo percebido; o palco permanece escuro nos dois; após recarregar, o tema escolhido mantém-se.
- **SC-004**: Em chamada com ≥2 pessoas e alguém no banco, 100% dos testadores conseguem alternar Composição ↔ Grade e descrever a diferença (cena fixa vs. todos) na primeira tentativa.
- **SC-005**: Modo palco recupera a largura útil do vídeo (sidebar a 0) e reabre sem perder a chamada em 100% das tentativas do teste manual; em viewport estreita, a gaveta sobreposta fecha sem empurrar o palco para uma coluna estreita.
- **SC-006**: Checklist de fidelidade Nocturne (tokens de cor/acento, raios, botões outline, secções Texto/Voz, chips de tile, diálogos) marca ≥90% dos itens como “alinhado ao protótipo”, com desvios justificados só por fora-de-âmbito.
- **SC-007**: Atribuição de slot no editor completa-se só com teclado num percurso documentado (sem rato); Descartar após editar deixa o mapa persistido inalterado num teste manual.
- **SC-008**: Nenhuma acção de “desligar E2EE” ou “gravar cena” está disponível na UI desta fase (0 ocorrências no percurso de revisão).

## Assumptions

- Fases 1 e 2 estão validadas e permanecem a base funcional; esta fase é **redesign + alinhamento UX**, não reabertura do modelo de dados de cenas nem do protocolo E2EE.
- A direcção vigente é **Nocturne v2**; Modernist v1 e wireframes são histórico de exploração.
- Gravação/Egress e desligar E2EE aparecem no PRD/protótipo mas **ficam fora** desta fase (já excluídos na Fase 2); a UI nova mostra E2EE sempre activa.
- “Chave de E2EE do canal” com checkbox bloqueante do PRD §4.6 **não** se reespecifica: o produto já usa identidade + handoff da chave do Servidor.
- Canais privados, diretório público, denúncia e federação continuam fora (como nas specs anteriores), mesmo que o protótipo os ilustre.
- Cliente continua a ser o **navegador**; sem shell Tauri nesta fase.
- Idioma da UI permanece português; strings preparadas para i18n (sem texto em imagens).
- Preferência Composição/Grade: uma por pessoa neste dispositivo (global aos canais); extensão por canal fica fora desta fase.
- O rótulo da Instância na barra deriva do hostname/origem do browser; não há nome amigável configurável pelo operador nesta fase.

## Out of Scope

- Desligar E2EE, gravação/exportação no servidor, log de auditoria de gravação.
- Diretório público, canais privados/restritos, denúncia ao mantenedor.
- Canvas livre de câmeras; rail duplo de Servidores como padrão.
- Cliente desktop nativo, instalador, partilha de ecrã, plugins.
- Redesign que altere contratos HTTP/WS das Fases 1–2 para além do necessário a preferências locais de UI (tema, vista, modo palco).
- Galeria rica de “cenas prontas” além dos layouts 2–4 já suportados.
- Validação com grupos de RPG reais (métricas do PRD §10) — útil depois; não bloqueia o done de implementação desta spec.
