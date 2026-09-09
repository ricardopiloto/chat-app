# Feature Specification: Multi-idioma (EN + PT-BR) — base para 0.6.0

**Feature Branch**: `074-i18n-en-ptbr`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User description: "Agora vamos preparar a release 0.6.0. Multi-idioma, nós temos que fazer a aplicação compatível com multi-idioma, vamos começar com inglês e PT-BR inicialmente, depois vamos adicionar outros idiomas."

**Milestone**: Contribui para a **release 0.6.0** (Keep a Changelog / versões de produto). Esta especificação cobre a **fundação multi-idioma** com os dois primeiros idiomas; outros idiomas entram em features posteriores sobre a mesma base.

**Problem**: A interface Mesa está essencialmente num único idioma (português do produto). Utilizadores e operadores que preferem inglês (ou outro idioma no futuro) não conseguem usar a app no idioma deles. Sem uma base multi-idioma, cada ecrã novo continua a embutir texto fixo e torna caro adicionar locales depois.

## Clarifications

### Session 2026-09-08

- Q: Onde o utilizador muda o idioma? → A: Detecção automática no ecrã de autenticação (browser/sistema); alteração manual na área autenticada
- Q: Qual a cobertura de ecrãs EN/PT-BR para o MVP 0.6.0? → A: Toda a UI visível da app (100% das strings de produto) nesta feature
- Q: Preferência de idioma — só dispositivo ou também na conta? → A: Só local (mesmo browser/dispositivo); não sincroniza com a conta nesta fase
- Q: Nomes de papéis de sistema (ex. Dono) mudam com o idioma? → A: Traduzir só papéis de sistema do produto; custom ficam como escritos
- Q: Onde fica o controlo de idioma na área autenticada? → A: Menu / painel da conta (user menu)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Usar a app em PT-BR ou inglês (Priority: P1)

Como utilizador autenticado (ou na autenticação), quero poder usar a interface em **português do Brasil (PT-BR)** ou em **inglês (EN)**, para compreender labels, botões, estados vazios e mensagens de produto no idioma que escolhi.

**Why this priority**: Entrega o valor multi-idioma da 0.6.0 com os dois locales iniciais.

**Independent Test**: Com a app a correr, escolher EN → chrome principal (auth, shell, canais, definições comuns) em inglês; escolher PT-BR → o mesmo em português do Brasil; recarregar a página mantém a escolha.

**Acceptance Scenarios**:

1. **Given** a app oferece PT-BR e EN, **When** selecciono **inglês** (área autenticada) ou o default detectado é EN, **Then** **toda** a UI de produto visível aparece em inglês (sem strings de chrome em PT-BR misturadas).
2. **Given** estou em inglês, **When** selecciono **PT-BR**, **Then** **toda** a UI de produto visível volta a português do Brasil.
3. **Given** escolhi um idioma, **When** atualizo a página (F5) com a mesma sessão/dispositivo, **Then** o idioma escolhido **permanece** (não volta sem motivo ao outro).

---

### User Story 2 - Idioma automático na auth e escolha na área autenticada (Priority: P1)

Como utilizador, quero que na **tela de autenticação** o idioma seja **escolhido automaticamente** com base no browser/sistema (entre os suportados), e que **depois de autenticado** eu possa **alterar** o idioma manualmente, para começar já no idioma certo e poder mudar se quiser.

**Why this priority**: Sem controlo pós-login e sem default sensato na auth, o multi-idioma não é utilizável.

**Independent Test**: Abrir auth com browser em inglês → UI de auth em EN (sem ter escolhido manualmente); após login, mudar para PT-BR na área autenticada → chrome passa a PT-BR e persiste.

**Acceptance Scenarios**:

1. **Given** abro a autenticação pela primeira vez (sem preferência guardada) e o browser/sistema indica inglês, **When** vejo o ecrã de auth, **Then** a UI desse ecrã está em **EN** (entre os locales suportados).
2. **Given** o browser/sistema indica português (ou outro caso mapeado para pt-BR), **When** vejo o ecrã de auth sem preferência guardada, **Then** a UI está em **PT-BR**.
3. **Given** estou autenticado, **When** abro o menu / painel da conta e altero o idioma, **Then** a interface actualiza para o locale escolhido **sem** obrigar logout só por causa do idioma, e a escolha **persiste**.
4. **Given** já guardei uma preferência manual, **When** volto à auth ou recarrego, **Then** essa preferência prevalece sobre a detecção automática do browser.
---

### User Story 3 - Base preparada para mais idiomas (Priority: P2)

Como produto, quero que a app esteja **estruturada para multi-idioma**, de modo que adicionar um terceiro idioma (ex. ES) no futuro não exija reescrever cada ecrã — apenas novos recursos de texto e registo do locale.

**Why this priority**: Alinha com «depois vamos adicionar outros idiomas»; reduz retrabalho pós-0.6.0.

**Independent Test**: Revisão de prontidão: textos de UI da fase não estão «presos» só a um idioma hardcoded sem caminho de extensão; há lista/enumeração clara dos locales suportados (hoje EN + PT-BR).

**Acceptance Scenarios**:

1. **Given** os locales activos são só EN e PT-BR, **When** um revisor inspecciona a capacidade multi-idioma, **Then** fica documentado/visível no produto que **apenas estes dois** estão disponíveis nesta fase (sem opções fantasma de idiomas não traduzidos).
2. **Given** a fundação está entregue, **When** se planear um idioma novo, **Then** o trabalho esperado é **adicionar** traduções + activar o locale — não redesenhar cada fluxo só por causa de strings (critério qualitativo de arquitectura de produto).

---

### User Story 4 - Conteúdo do utilizador vs. interface (Priority: P2)

Como utilizador, quero que **mensagens, nomes de canais/servidores e outros conteúdos que eu (ou outros) escrevi** **não** sejam traduzidos automaticamente pela mudança de idioma da interface.

**Why this priority**: Evita corromper chat e identidade de canais; separa UI de conteúdo.

**Independent Test**: Mudar EN ↔ PT-BR com histórico e canais visíveis → nomes e corpos de mensagem permanecem como foram escritos.

**Acceptance Scenarios**:

1. **Given** há mensagens e um canal com nome em português, **When** mudo a UI para inglês, **Then** o texto das mensagens e o nome do canal **não** mudam.
2. **Given** labels de produto (ex. «Notificações», «Definições»), **When** mudo para inglês, **Then** esses labels de chrome **sim** mudam.
3. **Given** existe o papel de sistema «Dono» e um papel custom «Moderação», **When** mudo a UI para inglês, **Then** o sistema mostra o equivalente de produto (ex. Owner) e «Moderação» **permanece** «Moderação».

---

### Edge Cases

- Idioma do browser diferente de EN/PT-BR: a app escolhe um **default** suportado (ver Assumptions) e permite mudar depois.
- Tradução em falta para uma string: MUST haver fallback previsível (ex. mostrar a string no outro locale suportado ou uma chave legível) — nunca ecrã em branco por string em falta.
- Datas/relativos («Hoje», «Ontem») e formatos curtos: MUST seguir o idioma da UI (ou locale associado), não ficar fixos só em PT quando a UI está em EN.
- Erros de rede/autorização visíveis ao utilizador: mensagens de produto cobertas pelo catálogo MUST respeitar o idioma; erros técnicos crus sem mapeamento podem permanecer como estão nesta fase (Assumption).
- Voz, LiveKit e strings de fornecedores externos: fora do âmbito obrigatório se não forem controladas pelo produto; preferir traduzir o que a Mesa controla.
- Acessibilidade: o controlo de idioma MUST ser operável por teclado e ter nome acessível.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O produto MUST suporte pelo menos os locales **`pt-BR`** e **`en`** (inglês) na interface do utilizador.
- **FR-002**: Na **área autenticada**, o utilizador MUST poder **seleccionar** manualmente entre os locales suportados através de um controlo no **menu / painel da conta** (user menu).
- **FR-002a**: No ecrã de **autenticação**, o locale MUST ser determinado por **detecção automática** do idioma do browser/sistema (mapeado para um locale suportado), **excepto** quando já existir preferência de idioma guardada — nesse caso a preferência MUST prevalecer.
- **FR-002b**: O ecrã de autenticação MUST NOT exigir um selector de idioma como único caminho para obter EN/PT-BR na primeira visita (a detecção automática cobre isso); o controlo de alteração explícita situa-se no menu da conta após autenticar.
- **FR-003**: A preferência de idioma MUST **persistir** entre visitas no **mesmo browser/dispositivo** (até o utilizador mudar ou limpar dados do site). Nesta fase MUST **não** ser obrigatório sincronizar a preferência com a conta no servidor (não segue automaticamente noutro dispositivo).
- **FR-004**: **Todas** as strings de **interface de produto** visíveis na app (chrome, formulários, estados vazios, toasts de produto, labels de definições, fluxos de auth, voz, permissões, etc.) MUST ser apresentadas no locale activo; não há ecrãs de produto «só em PT» nesta entrega.
- **FR-005**: Conteúdo gerado por utilizadores (mensagens, nomes de canais/servidores, handles, nomes de papéis **não-sistema**, etc.) MUST **não** ser traduzido pela mudança de idioma da UI.
- **FR-005a**: Nomes de papéis **de sistema** do produto (ex. «Dono») MUST ter equivalente no locale activo quando apresentados como label de produto; papéis criados por utilizadores mantêm o nome guardado.
- **FR-006**: A lista de idiomas oferecidos no selector MUST incluir **apenas** locales com suporte real nesta fase (EN e PT-BR); MUST NOT listar idiomas futuros não traduzidos.
- **FR-007**: A arquitectura de strings MUST permitir **adicionar** novos locales no futuro sem redesenhar cada ecrã apenas por causa de texto (fundação multi-idioma).
- **FR-008**: Se uma tradução estiver em falta no locale activo, o produto MUST aplicar um **fallback** definido (outro locale suportado ou equivalente) sem quebrar o ecrã.
- **FR-009**: Elementos de data/relativos de produto alinhados ao idioma da UI (ex. separadores «Hoje»/«Ontem» ou equivalentes em inglês) MUST reflectir o locale activo.
- **FR-010**: Mudar o idioma MUST NOT exigir por si só um novo desbloqueio de identidade nem logout (salvo se o utilizador já estiver noutro fluxo que o exija).

### Key Entities

- **Locale suportado**: identificador de idioma/região activo na UI (`pt-BR`, `en` nesta fase).
- **Preferência de idioma**: escolha do utilizador persistida **localmente no dispositivo** (não sincronizada com a conta nesta fase).
- **Catálogo de strings de interface**: conjunto de textos de produto por locale (não inclui mensagens de chat).
- **Conteúdo de utilizador**: texto criado por pessoas na app; independente do locale da UI.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um revisor percorre os ecrãs visíveis da app em **EN** e em **PT-BR**; **100%** das strings de interface de produto visitadas estão no locale activo (sem chrome no outro idioma).
- **SC-002**: Após escolher EN e fazer F5 **no mesmo browser**, a UI continua em EN em ≥ 95% das tentativas (preferência local persistida; não se exige o mesmo idioma noutro dispositivo).
- **SC-003**: Mudar EN ↔ PT-BR não altera o texto de mensagens nem nomes de canais já existentes (0 alterações de conteúdo de utilizador no teste).
- **SC-004**: O selector mostra exactamente **2** idiomas nesta fase; zero opções «em breve» não funcionais.
- **SC-005**: Documentação de release 0.6.0 pode listar multi-idioma EN + PT-BR como capacidade entregue desta fundação (quando a implementação estiver Done).

## Assumptions

- Controlo de alteração de idioma na área autenticada: **menu / painel da conta** (não settings shell nem topbar como sítio principal).
- Preferência de idioma = **local ao dispositivo** nesta fase (sem sync de conta / outros dispositivos).
- **PT-BR** é o português do produto actual (não é obrigatório um locale `pt-PT` separado nesta fase).
- **EN** = inglês genérico de produto (não é obrigatório variantes en-US/en-GB separadas nesta fase).
- Default na primeira visita (sem preferência guardada): se o idioma do browser/sistema for inglês → **en**; se for português → **pt-BR**; caso contrário → **pt-BR**. Preferência manual (área autenticada) prevalece depois.
- Âmbito 0.6.0 desta feature: **fundação + cobertura completa** das strings de UI de produto visíveis na app (não só um subconjunto de fluxos). Conteúdo de utilizador e strings de terceiros fora de controlo continuam fora (FR-005 / Assumptions).
- Nomes de papéis de sistema (ex. «Dono») têm equivalentes por locale; nomes de papéis custom e restante conteúdo livre do utilizador **não** são traduzidos.
- Mensagens de erro da API: preferir mapear as mais comuns no catálogo; erros não mapeados podem ficar no idioma original nesta fase.
- Esta spec **não** substitui o processo completo de release (tag, notes, bump de versão): descreve a capacidade i18n que a 0.6.0 deve incluir; o release checklist operacional fica para o momento da publicação.
- Idiomas adicionais (ES, etc.) = features futuras sobre FR-007, fora do MVP EN+PT-BR.
