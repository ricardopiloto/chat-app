# Feature Specification: Optimização do frontend (dedupe + build)

**Feature Branch**: `053-frontend-build-optimize`

**Created**: 2026-09-06

**Status**: Draft

**Input**: User description: "Com base na última build no servidor de produção vamos otimizar o código. Como Arquiteto de Soluções, avaliar o código à procura de funções duplicadas que poderiam ser unificadas em métodos ou bibliotecas locais; o build Vite avisa que o chunk principal JS (~963 kB / ~277 kB gzip) ultrapassa 500 kB."

## Clarifications

### Session 2026-09-06

- Q: Critério duro de sucesso do build (entry &lt; 500 kB vs só gzip vs ambos vs só silenciar aviso) → A: Entry principal &lt; 500 kB obrigatório; o aviso Vite deixa de aparecer nesse chunk
- Q: UX enquanto o código de voz carrega sob demanda → A: Estado de carregamento visível; em falha, mensagem clara com acção de tentar de novo
- Q: Profundidade da deduplicação nesta feature → A: Inventário completo do que parecer duplicado, com unificação agressiva nesta mesma entrega
- Q: CSS no âmbito desta feature → A: Fora de âmbito — só JS/helpers/divisão de chunks JS
- Q: Quando pode o stack de voz/vídeo carregar → A: No primeiro join ou enquanto houver chamada activa (PiP/estado global permitido); não no mero abrir da shell

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Menor carga inicial da app (Priority: P1)

Como utilizador que abre o Mesa (login ou shell), quero que a primeira descarga de JavaScript seja mais leve, para a interface ficar utilizável mais depressa — sobretudo em ligações modestas — sem perder funcionalidades quando entro em voz ou noutros ecrãs.

**Why this priority**: O build de produção actual concentra quase todo o JS num único chunk grande; este é o sinal mais visível de custo para quem chega à app e o aviso explícito do pipeline de build.

**Independent Test**: Comparar o relatório de build (tamanhos e número de chunks) e o tempo até a UI autenticada ficar interactiva, antes e depois; fluxos de chat e de voz continuam a funcionar.

**Acceptance Scenarios**:

1. **Given** um build de produção, **When** o relatório é gerado, **Then** o chunk de entrada principal fica **abaixo de 500 kB** e o aviso Vite de «chunk > 500 kB» **não** se aplica a esse entry (código pesado de voz/vídeo pode viver noutro(s) chunk(s) sob demanda).
2. **Given** um utilizador autenticado que só usa texto e **não** está em chamada, **When** abre a shell e um canal de texto, **Then** a experiência de chat funciona sem exigir que o stack completo de voz tenha sido carregado só por abrir a shell.
3. **Given** um utilizador que entra num canal de voz/vídeo, **When** o código sob demanda ainda não está disponível, **Then** vê um estado de carregamento; se a descarga falhar, vê mensagem com opção de tentar de novo; quando o código carrega, a funcionalidade de voz/vídeo fica completa (ligar, media, sair).
4. **Given** um utilizador em chamada activa que navega para um canal de texto, **When** a UI mostra o PiP / estado de chamada, **Then** a chamada continua utilizável (o stack pode permanecer carregado durante a chamada).
5. **Given** um utilizador que entra num canal de voz/vídeo com o código já em cache, **When** inicia a chamada, **Then** a experiência permanece completa sem regressão face à build anterior.

---

### User Story 2 - Menos duplicação de lógica partilhada (Priority: P1)

Como mantenedor do produto, quero um **inventário completo** de funções/padrões duplicados no frontend e a **unificação agressiva** desses clusters em métodos ou módulos locais nesta mesma entrega, para que a base de código fique mais fácil de manter sem deixar cópias divergentes «para depois».

**Why this priority**: Duplicação aumenta risco de regressões e custo de manutenção; o pedido de arquitectura é unificar em métodos/bibliotecas **locais**, com âmbito alargado (não só três helpers pontuais).

**Independent Test**: Inventário publicado na feature; cada cluster inventariado está unificado ou explicitamente justificado como falso-positivo / divergência intencional; smoke dos ecrãs afectados passa.

**Acceptance Scenarios**:

1. **Given** o inventário completo de clusters candidatos, **When** a entrega fecha, **Then** cada item está marcado como unificado, falso-positivo documentado, ou divergência intencional com razão — sem «adiar» clusters óbvios sem justificação.
2. **Given** ecrãs que mapeavam falhas de API, gates de permissão, prefs locais, chrome de painéis, wrappers de rota/shell e helpers de media de voz de forma ad hoc, **When** a unificação agressiva está feita, **Then** esses pontos usam os módulos locais partilhados (salvo divergência intencional documentada).
3. **Given** duas cópias que pareciam iguais mas divergem de propósito, **When** o inventário as analisa, **Then** não são fundidas à força; a razão fica no inventário.
---

### User Story 3 - Comportamento preservado após otimização (Priority: P2)

Como operador da instância em produção, quero que a otimização não altere o contrato funcional da app (auth, canais, permissões, voz), para poder atualizar o frontend sem surpresas para os utilizadores.

**Why this priority**: Optimização sem regressão é condição de deploy; valor só conta se a build mais leve for segura.

**Independent Test**: Suite de regressão existente (tipagem frontend + contratos/smoke relevantes) e checklist manual dos fluxos críticos após o build otimizado.

**Acceptance Scenarios**:

1. **Given** a build otimizada instalada, **When** um utilizador faz login, navega canais, usa permissões e voz, **Then** o comportamento observável coincide com o da build anterior (exceto performance/tamanho).
2. **Given** falha de rede ou erro de API conhecido, **When** o utilizador vê o feedback, **Then** a mensagem permanece compreensível e não introduz regressões de UX.

---

### Edge Cases

- Utilizador com rede lenta: ao abrir voz/vídeo, MUST ver estado de **carregamento** enquanto o código sob demanda chega; em falha de descarga, MUST ver mensagem clara com acção de **tentar de novo**, sem deixar a shell quebrada.
- Preferência «movimento reduzido» / blur / tema: unificação de prefs não pode perder valores já guardados.
- Rotas profundas (abrir directo um canal de voz): o código necessário deve carregar (com loading/retry) antes da funcionalidade ser usada; não exige carga no login.
- Chamada activa + navegação para texto: stack de voz pode permanecer carregado; PiP/controlos continuam a funcionar.
- Build em CI/produção: o pipeline continua a falhar em erros de tipagem; o gate de sucesso do tamanho é **entry &lt; 500 kB** (não basta silenciar o aviso).
- Não unificar código «parecido» que diverge de propósito (ex.: mensagens de auth vs falhas de join de voz) sem um mapeamento claro por contexto.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A equipa MUST produzir um **inventário completo** dos clusters de duplicação no frontend (incluindo, sem se limitar a: erros de API, permissões/capacidades, prefs locais, chrome de painéis, wrappers de rota/shell, anexar/reproduzir media de voz e outros padrões repetidos encontrados na revisão).
- **FR-002**: O produto MUST **unificar de forma agressiva** os clusters inventariados em módulos/helpers locais do frontend nesta feature; falso-positivos e divergências intencionais MUST ficar documentados no inventário (não é obrigatório publicar pacotes externos).
- **FR-002a**: Unificação agressiva MUST NOT fundir comportamentos que divergem de propósito; MUST NOT alterar contratos funcionais observáveis (ver FR-005).
- **FR-003**: A entrega de JavaScript de produção MUST deixar o **chunk de entrada principal abaixo de 500 kB** (baseline ~963 kB), tipicamente através de separação sob demanda do código de voz/vídeo e/ou divisão de fornecedores pesados — sem remover funcionalidades. Subir artificialmente o limiar de aviso **não** conta como cumprimento.
- **FR-004**: Utilizadores que só usam texto MUST conseguir usar a shell e canais de texto sem carregar antecipadamente todo o stack de voz/vídeo. O código pesado de voz/vídeo MUST carregar no **primeiro join** ou enquanto existir **chamada activa** (incluindo PiP / estado global ao navegar para texto); MUST NOT carregar só porque a shell autenticada abriu.
- **FR-004a**: Ao entrar num canal de voz/vídeo cujo código ainda não está carregado, a UI MUST mostrar um estado de carregamento; se a descarga falhar, MUST oferecer mensagem compreensível e acção de **tentar de novo** (sem pré-carregar voz só para evitar o atraso, se isso impedir o gate de entry &lt; 500 kB).
- **FR-004b**: Uma chamada já activa MUST permanecer utilizável ao mudar para canal de texto (PiP / controlos existentes), o que implica que o stack possa permanecer carregado durante a chamada — sem forçar carga eager no login.- **FR-005**: Após unificação e divisão de carga, o comportamento funcional existente MUST permanecer equivalente (auth, listagem/envio em texto, permissões/ACL/papéis já entregues, convites, voz/vídeo).
- **FR-006**: A otimização MUST permanecer limitada ao **frontend JavaScript** (helpers, módulos locais, divisão de chunks) nesta feature; alterações de API/backend só são permitidas se forem estritamente necessárias e sem mudança de contrato para clientes.
- **FR-006a**: Modularização ou deduplicação agressiva de **CSS/tema** está **fora de âmbito**; apenas ajustes CSS mínimos incidentalmente necessários a loading/retry de voz ou a helpers JS são permitidos, sem redesign.
- **FR-007**: Qualquer helper unificado de erro ou permissão MUST documentar (brevemente, no próprio módulo ou na nota de entrega) o comportamento esperado e os ecrãs migrados.
- **FR-008**: Preferências já persistidas no dispositivo do utilizador MUST continuar a ser lidas correctamente após a unificação de acesso ao armazenamento local.

### Key Entities

- **Cluster de duplicação**: Conjunto de cópias da mesma intenção (ex.: «mensagem a partir de erro de API») espalhadas por ecrãs.
- **Helper / módulo local**: Unidade reutilizável dentro do frontend que concentra essa intenção.
- **Chunk de entrega**: Unidade de JavaScript servida no build de produção (entrada vs sob demanda).
- **Baseline de build**: Relatório de tamanhos da build de produção de referência (chunk principal ~963 kB, ~277 kB gzip).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em build de produção comparável, o **chunk de entrada principal fica abaixo de 500 kB** e o aviso Vite desse limiar **não** se aplica a esse entry (face à baseline ~963 kB). Redução gzip no caminho texto é desejável mas **não** substitui este gate.
- **SC-002**: Existe um inventário completo de clusters; **todos** os itens estão unificados **ou** justificados (falso-positivo / divergência intencional). No mínimo os clusters de erro de API e gates de capacidade estão unificados, com **zero** cópias divergentes não justificadas nos ficheiros migrados.
- **SC-003**: Em **10** aberturas de smoke (login → canal de texto; e login → canal de voz), **10/10** completam sem regressão funcional face à build anterior.
- **SC-004**: Tipagem do frontend e a suite de verificação habitual do projecto para esta área passam após as alterações.
- **SC-005**: Um revisor consegue, em ≤20 minutos, percorrer o inventário e verificar o estado (unificado / justificado) de cada cluster e a localização dos helpers locais.

## Assumptions

- O aviso de build e o tamanho reportados referem-se ao **frontend** Mesa em produção; o foco desta feature é o cliente web, não o binário Rust.
- A maior parte do peso do chunk deve-se a bibliotecas de voz/vídeo e à ausência de divisão por rotas/funcionalidade — a estratégia por omissão é carregar o stack pesado no **primeiro join / chamada activa** (não no login) e unificar helpers JS, não reescrever o produto.
- «Bibliotecas locais» significa módulos internos do repositório, não publicação obrigatória em registo npm.
- A deduplicação nesta feature é **agressiva e completa** no inventário do frontend: não se limita a três helpers; clusters óbvios não ficam «para uma feature futura» sem justificação no inventário.
- Backend, protocolo E2EE e SFU de voz ficam fora de âmbito salvo necessidade pontual sem mudança de contrato.
- Não se exige redesign visual; **CSS/tema fora de âmbito** para inventário/modularização agressiva; só toques CSS mínimos se forem necessários ao loading/retry ou helpers JS.
- A baseline de comparação é a build citada (~962.84 kB / ~277.26 kB gzip no asset principal), ou a build de produção imediatamente anterior se os números forem regenerados no mesmo pipeline.
- Gate de sucesso do bundle: **entry &lt; 500 kB** obrigatório; não contar como feito apenas aumentar `chunkSizeWarningLimit`.
