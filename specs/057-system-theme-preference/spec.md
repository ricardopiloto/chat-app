# Feature Specification: Tema alinhado ao sistema com override guardado

**Feature Branch**: `057-system-theme-preference`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User description: "Vamos alinhar a tela de login e todo o tema ao tema do navegador do usuário, se ele estiver no modo escuro, nós vamos utilizar o modo escuro e vice-versa, mas, vamos salvar a configuração do usuário (se ele optar por utilizar outro modo que não seja o padrão do navegador), nós vamos salvar."

## Clarifications

### Session 2026-09-08

- Q: Onde o utilizador muda o tema? → A: Só na app autenticada (topbar / chrome existente); login só **aplica** o tema resolvido
- Q: Como se apresenta o controlo de 3 estados (Sistema / Claro / Escuro)? → A: Um botão que **cicla** pelos 3 estados (ícone + rótulo acessível actualizam)
- Q: Como persistir a preferência «Sistema»? → A: Persistir valor explícito `system` quando o utilizador escolhe seguir o sistema
- Q: Outros separadores abertos da Mesa, quando mudas o tema num deles? → A: Outros separadores da mesma origem **actualizam em directo** quando a preferência muda

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Login e app seguem o tema do navegador (Priority: P1)

Como visitante ou membro sem preferência própria guardada, quero que a **tela de login** e o **resto da aplicação** usem automaticamente o modo claro ou escuro do meu navegador/sistema, para a Mesa não parecer «errada» face ao resto do ambiente.

**Why this priority**: É o comportamento pedido por defeito; cobre login e app autenticada.

**Independent Test**: Sem preferência Mesa guardada, definir o SO/navegador para claro → login e app em claro; mudar para escuro → ambas em escuro (sem recarregar obrigatório se o SO mudar, ou no máximo no próximo paint/refresh — ver FR de reacção ao sistema).

**Acceptance Scenarios**:

1. **Given** o utilizador **não** tem preferência de tema Mesa guardada e o navegador prefere **escuro**, **When** abre a tela de login, **Then** a login aparece em **modo escuro** (não forçada a um tema fixo contrário ao sistema).
2. **Given** as mesmas condições, **When** inicia sessão e entra na app, **Then** o tema da app autenticada é **escuro**.
3. **Given** o utilizador **não** tem preferência Mesa guardada e o navegador prefere **claro**, **When** abre login e depois a app, **Then** ambas usam **modo claro**.
4. **Given** preferência Mesa ausente e o utilizador **muda** a preferência de cor do SO/navegador enquanto a Mesa está aberta, **When** a mudança é detectável, **Then** o tema visível da Mesa actualiza para acompanhar (login ou app, conforme a vista actual).

---

### User Story 2 - Escolher e guardar um tema diferente do sistema (Priority: P1)

Como utilizador **autenticado**, quero poder **optar** por um tema claro ou escuro **diferente** do padrão do navegador (via controlo no chrome da app, tipicamente topbar) e que essa escolha **fique guardada**, para a Mesa respeitar a minha decisão nas visitas seguintes — incluindo na tela de login, que aplica o tema guardado **sem** oferecer o seletor.

**Why this priority**: É a segunda metade do pedido (persistir override).

**Independent Test**: Com SO em escuro, escolher claro na topbar da app → recarregar → continua claro; reabrir login na mesma origem também em claro; o controlo na app reflecte a escolha guardada.

**Acceptance Scenarios**:

1. **Given** o sistema está em escuro e a Mesa seguia o sistema, **When** o utilizador autenticado escolhe **tema claro** no controlo da app, **Then** a interface passa a claro **imediatamente** e a escolha fica **persistida**.
2. **Given** o utilizador guardou tema claro, **When** fecha e reabre a Mesa (incluindo a tela de login na mesma origem), **Then** continua em **claro** mesmo que o navegador prefira escuro.
3. **Given** o utilizador guardou tema escuro com o sistema em claro, **When** navega entre login e app autenticada, **Then** ambas respeitam o **escuro** guardado.
4. **Given** a tela de login, **When** o visitante procura um controlo para mudar o tema, **Then** **não** encontra seletor de tema; a login apenas reflecte o tema já resolvido (sistema ou override guardado).

---

### User Story 3 - Voltar a seguir o tema do sistema (Priority: P2)

Como utilizador que tinha um tema fixo guardado, quero poder **voltar a seguir o tema do navegador**, para deixar de forçar claro/escuro e limpar o override.

**Why this priority**: Sem isto, a primeira escolha manual prende o utilizador para sempre ao override; é o complemento natural do «só guardar quando opta por outro modo».

**Independent Test**: Com override claro guardado e SO escuro → escolher «Sistema» (ou equivalente) → UI passa a escuro e deixa de persistir override; refresh confirma seguimento do sistema.

**Acceptance Scenarios**:

1. **Given** o utilizador tem um tema claro ou escuro **explicitamente** guardado, **When** cicla o botão de tema na topbar até à opção de **seguir o sistema**, **Then** a UI passa a reflectir a preferência actual do navegador e fica persistido o valor **`system`** (não apenas limpar a chave).
2. **Given** voltou a «Sistema» (valor `system` guardado), **When** o SO muda de claro↔escuro, **Then** a Mesa acompanha de novo (como na US1).
3. **Given** preferência Sistema, Claro ou Escuro, **When** o utilizador activa o botão de tema, **Then** a preferência avança para o próximo estado na ordem Sistema → Claro → Escuro → Sistema… e o affordance (ícone/aria) actualiza em conformidade.
4. **Given** o utilizador **nunca** definiu preferência (chave ausente), **When** a app resolve o tema, **Then** comporta-se como seguir o sistema **sem** escrever `light`/`dark`/`system` só por carregar; o botão de tema apresenta-se no estado Sistema até o utilizador ciclar.

---

### Edge Cases

- Controlo de tema: **apenas** na app autenticada; ecrãs de auth aplicam o tema resolvido sem seletor.
- Preferência guardada inválida ou corrompida: tratar como **ausente** e seguir o sistema.
- Utilizadores com preferência antiga só «claro»/«escuro»: manter como **override explícito** (não apagar na migração).
- Controlo de tema indisponível em algum ecrã: o tema resolvido (sistema ou guardado) MUST aplicar-se na mesma; a ausência do botão não muda a regra de resolução.
- Vários separadores: mudança de tema num separador MUST reflectir-se **em directo** noutros separadores da mesma origem (FR-009); não basta alinhar só no próximo reload.
- Flash incorrecto no primeiro paint (ex. login a mostrar escuro um instante e depois claro): MUST ser minimizado — o tema correcto do sistema ou guardado deve aplicar-se o mais cedo possível na carga da página.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A aplicação MUST resolver o tema efectivo como: (1) preferência Mesa **explícita** `light`/`dark` se existir; (2) se a preferência for `system` **ou** a chave estiver ausente, preferência de cor do **navegador/sistema**. Ausência de chave e valor `system` MUST produzir o mesmo tema efectivo; diferem só porque `system` foi escolhido e persistido pelo utilizador.
- **FR-002**: A **tela de login** (e ecrãs de autenticação associados na mesma app) MUST usar o mesmo tema resolvido que o resto da Mesa — não MUST forçar um tema fixo independente. A login MUST **não** expor um seletor de tema; apenas aplica o tema resolvido.
- **FR-003**: O shell autenticado e superfícies principais (topbar, painéis, diálogos) MUST usar o mesmo tema resolvido. O controlo para **alterar** a preferência de tema MUST estar disponível na **app autenticada** (chrome existente, tipicamente topbar), não nos ecrãs de auth.
- **FR-004**: Quando o utilizador **escolhe** tema claro ou escuro de forma explícita, o sistema MUST **persistir** essa escolha localmente e aplicá-la nas sessões seguintes.
- **FR-005**: Quando **não** existe escolha explícita (chave ausente / nunca definida), o sistema MUST **não** gravar um tema fixo só por ter seguido o sistema na carga. Após o utilizador ciclar até **Sistema**, MUST persistir o valor explícito `system` (não basta apagar a chave).
- **FR-006**: O utilizador MUST poder seleccionar **seguir o sistema** (além de claro e escuro). Na topbar, isto MUST ser feito por um **único botão que cicla** a preferência pelos estados Sistema → Claro → Escuro → Sistema…; o ícone e o nome acessível (aria/title) MUST reflectir o estado de preferência actual (não só o tema efectivo quando a preferência é Sistema). Escolher Sistema MUST gravar `system` e o tema efectivo MUST voltar a FR-001 ramo (2).
- **FR-007**: Enquanto a preferência for `system` ou a chave estiver ausente, mudanças na preferência de cor do SO/navegador MUST actualizar o tema visível da Mesa sem exigir que o utilizador volte a escolher manualmente.
- **FR-008**: Preferências Mesa já guardadas como claro ou escuro MUST continuar a ser honradas após esta feature (migração sem reset surpresa para o sistema).
- **FR-009**: Quando a preferência de tema muda num separador, **outros separadores abertos** da mesma origem MUST actualizar o tema visível (e o estado do controlo, se presente) **em directo**, sem exigir reload manual.

### Key Entities

- **Theme preference**: Modo persistido — `system` | `light` | `dark`. Valores `light`/`dark` são overrides. Valor `system` é override explícito de «seguir o navegador» (distinto de chave **ausente**, que também resolve como seguir o sistema na primeira visita). Preferências antigas só `light`/`dark` mantêm-se (FR-008).
- **Effective theme**: Resultado visível (`light` ou `dark`) após resolver preferência: se `light`/`dark` → esse valor; se `system` ou ausente → sinal do navegador.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% dos testes manuais com preferência Mesa ausente, login e app autenticada coincidem com a preferência claro/escuro do navegador na carga inicial.
- **SC-002**: Após escolher um tema diferente do sistema, um refresh (e reabertura da login na mesma origem) mantém o tema escolhido em ≥95% das tentativas de verificação (falhas só por limpeza de dados locais).
- **SC-003**: Utilizadores com override antigo claro/escuro não vêem o tema «resetado» ao sistema só por actualizar a app (regressão zero nesse caso de teste).
- **SC-004**: Com preferência «Sistema», uma mudança da preferência de cor do SO reflecte-se na UI da Mesa em menos de 2 segundos após a mudança (sem reload manual), em ambiente de teste controlado.
- **SC-005**: Nenhum ecrã de autenticação coberto pela app mostra um tema fixo que contradiga o tema resolvido quando a preferência Mesa está ausente.
- **SC-006**: Com dois separadores abertos da mesma origem, alterar o tema num deles faz o outro reflectir o mesmo tema efectivo (e, se autenticado, o mesmo estado do botão) em menos de 2 segundos, sem reload manual.

## Assumptions

- O controlo de tema na **topbar da app autenticada** é um **botão único que cicla** Sistema → Claro → Escuro (ícone + aria/title actualizam); ciclo binário só claro↔escuro **não** basta. Ecrãs de login/auth **não** incluem este controlo.
- Persistência é **local ao dispositivo/navegador** (como a preferência de tema actual), não sincronizada por conta no servidor na v1.
- «Tema do navegador» = preferência de esquema de cores do sistema operacional / `prefers-color-scheme` exposta ao browser.
- Login e app partilham a mesma origem e o mesmo armazenamento de preferências locais; mudanças de preferência propagam-se entre separadores dessa origem (FR-009).
- Não se pede redesign visual das paletas claro/escuro — apenas **quando** cada uma é aplicada.
- Fora de âmbito: temas personalizados além de claro/escuro; sync multi-dispositivo via backend. Minimização de flash no primeiro paint fica para o plano técnico (melhor esforço obrigatório, sem exigir script inline específico neste spec).
