# Research: Fase 1 — MVP (cliente web)

Cada decisão fecha uma lacuna deixada em aberto por `docs/arquitetura-tecnica.md` §8 ("Decisões em Aberto") ou pelo Technical Context desta feature, à luz do que o spike Fase 0 (`specs/001-fase-0-spike/results.md`) já validou como go/no-go. Nenhum item fica como NEEDS CLARIFICATION — onde a spec já decidiu (seção Clarifications), a decisão técnica só instrumenta o que já foi resolvido no produto.

---

## D1 — Sem binário único cliente/servidor dual-mode nesta fase

- **Decision**: `backend/` (Rust/axum, headless) e `frontend/` (SPA TypeScript) são dois artefatos de build separados. O backend serve a API REST + WebSocket + arquivos estáticos da SPA em produção; não há shell Tauri nem flag `--server`/`--headless` num binário compartilhado.
- **Rationale**: O documento de arquitetura desenhou o binário dual-mode pensando no cliente desktop (Tauri) como alvo igualmente prioritário. O spike Fase 0 provou que o WebKitGTK de estoque no Linux desta máquina **não** sustenta WebRTC nem Insertable Streams — por isso a spec da Fase 1 (Assumptions, FR-016) já cortou o cliente nativo do done. Construir o dual-mode agora seria desenhar para um requisito que a própria spec adiou (YAGNI).
- **Alternatives considered**: Manter o binário único com o modo cliente vazio/stub — rejeitado: complexidade de build (empacotar Tauri) sem consumidor nesta fase.

## D2 — Framework de frontend: SolidJS

- **Decision**: SPA em TypeScript com SolidJS + Vite (mesma toolchain de build do spike, trocando vanilla TS por componentes Solid).
- **Rationale**: Decisão em aberto explícita no doc de arquitetura (§8.1: "Svelte, SolidJS ou outro — avaliar leveza"). SolidJS: sem VDOM, granular reactivity, bundle pequeno (alinhado à meta de leveza do produto), curva de adoção baixa vindo de TS vanilla (o padrão do spike), boa integração com `livekit-client` (mesma API imperativa usada no spike).
- **Alternatives considered**: Svelte (também leve, mas exige compilador próprio e rescreve mais do padrão do spike); React (ecossistema maior, mas VDOM e bundle mais pesados — contra a meta de leveza); continuar vanilla TS (evita decisão, mas a superfície da Fase 1 — múltiplas telas, estado de servidor/canal/grade — já justifica um framework reativo).

## D3 — Sessão: token opaco server-side em cookie httpOnly

- **Decision**: Login gera um token de sessão opaco (aleatório, alta entropia), guardado hasheado em SQLite com `expires_at`, entregue ao navegador via cookie `httpOnly; Secure; SameSite=Strict`. Logout apaga a linha da sessão — invalidação imediata.
- **Rationale**: Decisão em aberto no doc de arquitetura (§8.2: "JWT de sessão vs. cookie de sessão opaco"). A spec exige que sair encerre a sessão de fato ("**When** sai, **Then** precisa autenticar de novo" — Acceptance Scenario US1.5). JWT stateless dificulta revogação imediata sem uma lista de bloqueio adicional; token opaco com linha em banco resolve logout e expiração com uma única fonte de verdade, sem componente extra.
- **Alternatives considered**: JWT assinado sem estado no servidor — rejeitado por exigir *ainda* uma tabela de revogação para logout instantâneo, i.e., a mesma complexidade do token opaco sem o benefício de statelessness.

## D4 — Chave de identidade do usuário: gerada e mantida só no navegador

- **Decision**: No cadastro, o cliente gera um par de chaves de identidade (X25519, via Web Crypto/`@noble/curves`). A chave privada fica só no navegador (IndexedDB), cifrada em repouso com uma chave derivada da senha (Argon2id, client-side). O servidor guarda **só a chave pública**. Não há backup server-side de recovery nesta fase.
- **Rationale**: A spec já resolveu recuperação de senha nesta fase via Edge Cases: "nesta fase não há recuperação por e-mail; o operador inicial pode redefinir ou recriar a conta". Isso dispensa a `IDENTITY_RECOVERY_BACKUP` (blob cifrado no servidor) que o doc de arquitetura desenhou para uma fase com recovery — implementá-la agora seria construir para um requisito fora do escopo desta fase.
- **Alternatives considered**: Backup opt-in no servidor (como no doc de arquitetura) — adiado; não é exigido por nenhum FR/SC da Fase 1 e adiciona superfície de criptografia (derivação de senha, formato de blob, fluxo de restore) sem consumidor agora.

## D5 — E2EE de texto e mídia: uma chave simétrica por Servidor, handoff online entre clientes

- **Decision**: Ao criar um Servidor, o cliente do dono gera uma chave simétrica (AES-256-GCM) para aquele Servidor — reusada para cifrar corpo de mensagens de todos os canais de texto e como chave de quadro (frame key) do `ExternalE2EEKeyProvider` do `livekit-client` nos canais de voz/vídeo (mesmo mecanismo validado como *go* no navegador no spike Fase 0). Quando alguém aceita um convite, um cliente que já possui a chave do Servidor e está online no momento (o dono, tipicamente) recebe um evento no hub WebSocket, envelopa a chave para a chave pública do novo membro (`crypto_box_seal`/sealed box) e a envia; o servidor só encaminha esse envelope cifrado, nunca vê a chave em claro. Até o handoff completar, o novo membro entra no Servidor mas fica com o indicador "sincronizando chave" nos canais.
- **Rationale**: FR-015 exige E2EE ligado por padrão sem opção de desligar nesta fase — isso simplifica bastante frente ao doc de arquitetura (que já previa alternância E2EE-on/off por canal para Egress, fora do escopo aqui). Uma chave por Servidor (não por canal) casa com FR-005/Key Entities: nesta fase todo membro vê todos os canais do Servidor, então não há razão para segredos por canal. O handoff via WebSocket evita que o servidor jamais precise custodiar a chave em claro (cumpre FR-015/SC-006).
- **Alternatives considered**: Chave por canal — rejeitada, complexidade extra sem ganho de isolamento já que a visibilidade é por Servidor inteiro nesta fase (Assumptions/FR-005). Distribuição de chave assíncrona via servidor guardando a chave envelopada para múltiplos destinatários futuros (pré-computada) — rejeitada: exigiria o dono prever de antemão quem vai entrar, o que o modelo de convite por link não permite.
- **Known limitation (documented, not blocking)**: se nenhum cliente com a chave estiver online quando alguém aceita o convite, o handoff fica pendente até alguém entrar; a UI deve deixar isso visível. Não é testado por nenhum Acceptance Scenario da spec, mas o `data-model.md` modela o estado `pending_key_handoff` para não deixar a lacuna implícita.

## D6 — Sem Postgres nem abstração de repository nesta fase

- **Decision**: Persistência só em SQLite via `sqlx`, acesso direto (sem camada repository genérica pluggável por engine).
- **Rationale**: O doc de arquitetura descreve a camada repository como decisão *de dia 1* para trocar SQLite↔Postgres sem tocar domínio — mas nenhum FR/SC da Fase 1 exige Postgres ou escala além de "grupo pequeno" (Scale/Scope do Technical Context). Introduzir a abstração agora é design para um requisito hipotético (contra a diretriz de não abstrair antes da necessidade real); o critério de migração já documentado no doc de arquitetura (>1000 escritas/s, `database is locked` recorrente, dataset >10GB) serve como gatilho explícito para revisitar isso numa fase futura.
- **Alternatives considered**: Repository pattern desde já — rejeitado por YAGNI, sem consumidor nesta fase.

## D7 — TURN: usar o TURN embutido do LiveKit (não coturn separado)

- **Decision**: `infra/livekit.yaml` habilita o TURN embutido do LiveKit Server (mesma config exercitada na Onda 1/US3 do spike, `spike/infra/livekit.hotspot.yaml`), em vez de um serviço `coturn` separado.
- **Rationale**: O spike já tem a config pronta e validada estruturalmente (só não foi exercitada fim-a-fim por bloqueio de ambiente — hotspot não testado nesta sessão, não é reprovação da abordagem). Um processo a menos no `docker-compose.yml` do operador é consistente com a meta de "simplicidade operacional para self-host" do doc de arquitetura. FR-017 (procedimento de subida documentado, incluindo portas de sinalização e mídia) cobre a necessidade de expor isso claramente ao operador.
- **Alternatives considered**: coturn dedicado — mais flexível para operadores avançados (ex.: TURN compartilhado entre várias instâncias), mas adiciona um serviço a mais no compose sem exigência da spec; fica como opção de infraestrutura avançada documentável depois, não decisão que bloqueia a Fase 1.

## D8 — Testes: `cargo test` no backend + validação manual multi-navegador

- **Decision**: Contratos REST/WS e regras de domínio (primeiro-slot-vazio, convite único para cadastro, isolamento entre Servidores, filtro de histórico por convite) viram testes de contrato/integração Rust (`cargo test`). Os fluxos com dois participantes reais (grade de vídeo, A/V bidirecional, rejoin no mesmo slot) seguem validação manual roteirizada em `quickstart.md`, no mesmo padrão do spike Fase 0.
- **Rationale**: A constituição não está ratificada (não impõe TDD) e a spec não pede automação de E2E de navegador. Automatizar dois contextos de navegador com câmera/microfone falsos (Playwright + `--use-fake-device-for-media-stream`) é viável, mas é investimento de infraestrutura de teste sem FR/SC que o exija nesta fase — fica registrado aqui como melhoria natural para uma fase seguinte, não bloqueio.
- **Alternatives considered**: Playwright completo desde a Fase 1 — adiado, não requisito.
