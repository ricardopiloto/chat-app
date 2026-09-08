# Feature Specification: Janela de 5 minutos para códigos de convite

**Feature Branch**: `046-invite-5min-window`

**Created**: 2026-09-06

**Status**: Draft

**Input**: Análise PO + Tech Lead do fluxo actual de convite/registo vs comportamento esperado: convite → criar conta; código temporário **5 minutos**; **N pessoas** podem cadastrar-se nesse intervalo; após o intervalo o código deixa de funcionar; convite só dá acesso ao **servidor** onde foi criado.

## Clarifications

### Session 2026-09-06

- Q: Quão rígidos são os 5 minutos (UI / API / env)? → A: Padrão de produto 5 min — UI sempre 5 min; sem permanente; env pode alterar o default da instância
- Q: Teto de usos (N) na janela? → A: Teto fixo de produto — **10 usos**; depois o código morre (mesmo dentro da janela temporal)
- Q: O que fazer com convites já emitidos (7 dias / permanentes)? → A: Forçar expiração no deploy — convites existentes ainda utilizáveis passam a inválidos; donos geram novos

## Contexto (as-is vs to-be)

### Comportamento actual (repositório)

- Após a primeira conta da instância, o registo exige código de convite.
- O dono do servidor cria convites (`POST /api/servers/{id}/invites`); o link é `/invite/{code}`.
- O convite está **sempre associado a um `server_id`** — já cumpre o âmbito “só aquele servidor”.
- TTL por omissão da instância: **7 dias** (`DEFAULT_INVITE_TTL_SECS`, default `604800`); a UI do dono **não** envia TTL e permite, via API, convites **permanentes** (`expires_in_seconds: null`).
- O mesmo código é **multi-uso ilimitado** enquanto válido (sem contador de usos) — falta teto de 10 e janela curta.
- Após expirar ou revogar, o código deixa de ser utilizável.

### Lacunas vs esperado

| Esperado | Actual |
|----------|--------|
| Código válido **5 minutos** | Default **7 dias**; permanente possível |
| Até **10** cadastros na janela | Multi-uso **ilimitado** enquanto válido |
| Depois ninguém usa o código | Expiração existe; **sem** teto de usos |
| Só o servidor de origem | **Já correcto** |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Convidado cria conta com link fresco (Priority: P1)

Como pessoa convidada, quero abrir um link de convite gerado há pouco e criar a minha conta, entrando automaticamente no servidor correcto, para participar da mesa sem pedido manual ao admin além do convite.

**Why this priority**: Fluxo principal de onboarding pós-bootstrap.

**Independent Test**: Dono gera convite → convidado abre link dentro de 5 minutos → regista-se → fica membro só daquele servidor.

**Acceptance Scenarios**:

1. **Given** o dono gerou um convite para o servidor S, **When** um utilizador sem conta abre o link e completa o registo **antes** de expirar a janela, **Then** a conta é criada e a pessoa fica membro de S.
2. **Given** o mesmo código ainda está dentro da janela temporal e com usos restantes, **When** outras pessoas completam o registo com o mesmo código, **Then** cada uma obtém conta/adesão a S até ao **10.º uso** bem-sucedido.
3. **Given** o registo concluiu via convite de S, **When** a pessoa inspecciona os seus servidores, **Then** só vê adesão a S por esse convite (não a outros servidores).
4. **Given** o código já atingiu **10 usos** bem-sucedidos, **When** outra pessoa tenta usá-lo (ainda dentro dos 5 minutos), **Then** o sistema recusa.

---

### User Story 2 - Código morto após 5 minutos (Priority: P1)

Como dono / operador, quero que um código deixe de funcionar **5 minutos após ser gerado**, para links partilhados não ficarem abertos por dias.

**Why this priority**: Requisito explícito de segurança/operacional; maior gap vs produto actual.

**Independent Test**: Gerar convite; após >5 minutos (ou relógio de teste), preview/registo/accept falham; dentro da janela funcionam.

**Acceptance Scenarios**:

1. **Given** um convite gerado no instante T, **When** alguém tenta usá-lo em T+5 minutos ou depois, **Then** o sistema recusa (não cria conta nem adesão com esse código).
2. **Given** um convite gerado no instante T, **When** alguém o usa em T+4 minutos, **Then** o uso ainda é aceite (desde que não revogado).
3. **Given** o dono gera um novo convite pela UI habitual, **When** o sistema define a validade, **Then** a validade efectiva é a janela de **5 minutos** (não 7 dias nem “sem expiração”).

---

### User Story 3 - Convite continua só daquele servidor (Priority: P1)

Como dono do servidor S, quero que o meu convite **nunca** dê acesso a outro servidor, para controlar quem entra na minha mesa.

**Why this priority**: Já parcialmente cumprido; a feature MUST preservar e tornar o critério de aceitação explícito.

**Independent Test**: Convite de S usado no registo → membership apenas em S; código de S não adiciona a S′.

**Acceptance Scenarios**:

1. **Given** um convite criado no servidor S, **When** é usado para registo ou aceitação, **Then** a adesão criada é exclusivamente a S.
2. **Given** um utilizador já autenticado aceita o convite de S, **When** a operação conclui, **Then** passa a ser membro de S e não de outros servidores por esse código.

---

### Edge Cases

- **Primeira conta da instância** (bootstrap): pode continuar sem convite para não bloquear instalação; após existir ≥1 conta, o convite passa a ser obrigatório para novos registos (comportamento actual preservado, salvo decisão futura).
- Convite **revogado** pelo dono antes dos 5 minutos MUST ficar inutilizável de imediato.
- Link com código inexistente / expirado MUST falhar de forma clara para o utilizador (sem criar conta).
- Relógio: a expiração MUST basear-se no tempo do servidor (não no relógio do browser do convidado).
- Contas já existentes que usem “aceitar convite” MUST respeitar a mesma janela temporal, o mesmo teto de usos e o mesmo âmbito de servidor.
- Cada registo **ou** aceitação bem-sucedida MUST consumir **um** uso do código face ao teto de 10.
- No momento da activação desta feature (deploy/migração), convites **já existentes** que ainda seriam utilizáveis (permanentes ou com validade futura) MUST passar a **inválidos**; o dono MUST criar um novo convite para continuar a convidar.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Novos convites criados pelo fluxo de produto (UI do dono) MUST expirar segundo o **TTL padrão da instância**, que por omissão de produto é **5 minutos** após a criação.
- **FR-002**: Enquanto o convite estiver dentro da janela temporal, não revogado e com **usos restantes**, MUST permitir novos registos/aceitacoes com o mesmo código até ao máximo de **10 usos** bem-sucedidos (teto fixo de produto).
- **FR-003**: Após expirar a janela temporal **ou** esgotar os 10 usos, o mesmo código MUST ser rejeitado para preview, registo e aceitação.
- **FR-004**: Cada convite MUST continuar associado a exactamente um servidor; uso bem-sucedido MUST criar/adesão **apenas** a esse servidor.
- **FR-005**: A criação de convite pela UI do dono MUST resultar num link cuja validade segue o TTL padrão da instância (**5 minutos** por omissão) e MUST NOT oferecer convite permanente.
- **FR-006**: O fluxo de produto MUST NOT criar convites **permanentes** (`expires_at` vazio). O TTL padrão da instância MUST ser **5 minutos**; a configuração de ambiente da instância MAY alterar esse default (labs/testes), sem reabrir permanente na UI.
- **FR-007**: Revogação manual pelo dono MUST invalidar o código imediatamente, independentemente do tempo ou usos restantes.
- **FR-008**: Utilizadores autenticados que aceitam o convite e utilizadores que se registam com o código MUST partilhar as mesmas regras de validade, teto de usos e âmbito de servidor.
- **FR-009**: A API de criação, quando o cliente omite TTL (como a UI), MUST aplicar o TTL padrão da instância (5 min por omissão); pedidos explícitos de convite permanente MUST ser rejeitados no comportamento de produto alinhado a esta feature.
- **FR-010**: O produto MUST contar usos bem-sucedidos (registo ou aceitação que criem adesão) e MUST recusar novos usos quando `usos ≥ 10`, mesmo que a janela temporal ainda não tenha expirado.
- **FR-011**: Na activação desta feature, convites pré-existentes ainda utilizáveis (incluindo permanentes e com expiração futura longa) MUST ser invalidados de forma que deixem de funcionar para preview/registo/aceitação; apenas **novos** convites criados depois seguem TTL padrão + teto 10.

### Key Entities

- **Convite**: código, servidor de origem, criador, momento de criação, momento de expiração (criação + TTL padrão), estado revogado, **contador de usos** / usos restantes face ao teto de 10.
- **Janela de validade**: por omissão de produto, 5 minutos a partir da criação; o default da instância MAY ser alterado por configuração de ambiente (clarificado 2026-09-06).
- **Teto de usos**: máximo fixo de **10** utilizações bem-sucedidas por código (clarificado 2026-09-06).
- **Uso do convite**: registo de nova conta ou aceitação por conta existente → adesão ao servidor do convite (consome 1 uso).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em teste controlado, 100% dos usos de um código dentro de 4 minutos após a criação (não revogado) concluem adesão/registo no servidor correcto.
- **SC-002**: Em teste controlado, 100% das tentativas com o mesmo código após 5 minutos falham (sem nova adesão/conta via esse código).
- **SC-003**: Com o mesmo código válido, exactamente 10 registos/aceitacoes sucessivos no mesmo servidor concluem com sucesso; a 11.ª tentativa falha (prova do teto).
- **SC-004**: 0 adesões a servidor diferente do servidor do convite em suite de testes do fluxo de convite.
- **SC-005**: Convite gerado pela UI do dono apresenta validade efectiva de 5 minutos (default de produto) em 100% das criações do fluxo standard (sem permanente / 7 dias).
- **SC-006**: Tentativa de uso após esgotar 10 usos, ainda dentro da janela temporal: 100% de recusas em teste controlado.
- **SC-007**: Após a migração/activação, 100% dos códigos pré-existentes que estavam utilizáveis deixam de permitir novos registos/aceitacoes (sem depender de revogação manual).

## Assumptions

- TTL de produto (clarificado 2026-09-06): **padrão 5 minutos**; UI sempre usa o default da instância e **sem permanente**; a configuração de ambiente MAY alterar o default (labs/testes).
- Teto de usos (clarificado 2026-09-06): **10 usos** bem-sucedidos por código; depois inválido mesmo dentro da janela temporal.
- Convites legados (clarificado 2026-09-06): no deploy/activação, **forçar invalidação** de convites existentes ainda utilizáveis (permanentes ou longos); donos geram novos sob as regras novas.
- A **primeira conta** da instância pode continuar sem convite (bootstrap de instalação).
- Revogação manual pelo dono permanece disponível.
- Âmbito de servidor já correcto; esta feature **não** muda o modelo de membership além de validade temporal, defaults, contagem de usos e limpeza de legados.

## Out of Scope

- Teto de usos **configurável** pelo dono por convite (fica fixo em 10).
- Convites multi-servidor ou “convite de instância” global.
- Alterar permissões de quem pode criar convites (continua o dono).
- Redesenho completo das páginas Auth/Invite (só o necessário para refletir validade de 5 minutos e/ou usos).
