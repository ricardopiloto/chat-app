# Design

## Context

Esta é a fase de maior risco técnico da reescrita: integra LiveKit (SFU de voz/vídeo), criptografia de chave de canal (Insertable Streams para E2EE), e a composição de câmeras que é a funcionalidade diferenciadora do produto. Constrói sobre `frontend-v2-foundation`, `frontend-v2-auth-shell` (shell, painel do utilizador, sidebar) e `frontend-v2-server-admin` (canais de voz e ACL já existem).

Referências de comportamento na v1: `frontend/src/pages/VoiceChannel.tsx` (1290 linhas), `components/{CameraGrid,SceneEditor,CallBank,CameraBlurMenu}.tsx`, `voice/{VoiceSession,abortFailedJoin,releaseLocalCapture,joinErrors,pipCorner,loadRuntime,runtime}.tsx`, `video/{liveClient,backgroundBlur}.ts`, `crypto/channelKey.ts`, `shell/FloatingVoicePip.tsx`.

Mockups de referência: `mesa_pr_entrada_na_chamada_green_room_testar_v_deo`, `mesa_palco_de_voz_v_deo_composi_o_de_c_meras`, `mesa_editor_de_cenas_de_composi_o_1`/`_2`, `mesa_visualiza_o_por_grade_1`/`_2`, `mesa_grade_com_compartilhamento_de_tela_1`/`_2`, `mesa_chamada_de_voz_v_deo_em_pip_flutuante_mini_player`.

**Achado relevante da auditoria** (`docs/v2/TR-frontend-v2.md` §6.3): nenhum dos 30 mockups mostra o estado "E2EE desligada"/"Religar E2EE" — todos mostram E2EE sempre activa. Esta fase precisa de desenhar esse estado sem mockup de referência (ver D4).

## Goals / Non-Goals

**Goals:**
- Paridade completa com a funcionalidade de voz/vídeo da v1, incluindo o fluxo de excepção consciente de E2EE (desligar/religar).
- As duas vistas (Composição e Grade) e o editor de cena, fiéis aos mockups onde existem.

**Non-Goals:**
- Gravação/Egress (backlog G1) — mesmo a v1 tem esta UI suspensa desde a spec 049; esta fase não a repõe.
- Múltiplas cenas nomeadas (backlog G10), co-diretor (código morto na v1, nunca foi funcionalidade real), templates de cena partilháveis.
- Qualquer arquitectura MLS/multi-dispositivo/Passkeys (TR §7).

## Decisions

### D1 — Integração LiveKit: portar a lógica da v1 quase 1:1, não reescrever do zero
`frontend-v2/src/voice/` replica a forma dos módulos da v1 (`VoiceSession`, `abortFailedJoin`, `releaseLocalCapture`, `joinErrors`, `pipCorner`, `loadRuntime`/`runtime` para carregamento lazy do runtime LiveKit) e `video/{liveClient,backgroundBlur}.ts`.
**Porquê**: esta lógica acumulou correcções ao longo de ~20 specs da v1 (028 a 097 — roster, avatares, erros de entrada, escolha de câmara, indicador de fala, áudio de presença, partilha de ecrã entre pares, etc.). Reescrever do zero arrisca reintroduzir bugs já resolvidos (ver `docs/v2/TR-frontend-v2.md` §8.2, risco já identificado). O único motivo para mudar esta camada seria uma limitação do LiveKit SDK em si, não uma preferência de arquitectura desta reescrita.
**Alternativa considerada**: usar os componentes prontos do LiveKit Components (`@livekit/components-core`/`components-solid` se existir para Solid). Rejeitada por agora — a v1 não os usa (integração manual), e adoptar uma lib de componentes de terceiros mudaria o comportamento fino (erros de entrada, escolha de câmara) de formas não previstas; fica como pergunta em aberto para uma fase futura de polimento, não para esta fase de paridade.

### D2 — Chave de canal: mesmo modelo de custódia da v1, sem MLS
`frontend-v2/src/crypto/channelKey.ts` replica o modelo da v1: chave simétrica gerada no cliente na criação do canal (já coberto pela Fase 2), custódia confirmada por checkbox, e a faixa "E2EE desligada"/"Religar E2EE" desta fase consome essa mesma chave — nunca um protocolo de grupo MLS/epochs (fora de escopo, TR §7).

### D3 — Layouts nomeados mapeados directamente, cena única
Os três layouts da v1 (Mestre em Destaque, Painel, Faixa) mapeiam directamente para o layout "Mestre em Destaque" já desenhado nos mockups (`mesa_editor_de_cenas_de_composi_o_*`, `mesa_palco_de_voz_v_deo_composi_o_de_c_meras`); os outros dois (Painel/quad, Faixa) **não têm mockup próprio** — esta fase desenha-os por extrapolação directa da mesma linguagem visual (grelha de posições, chips, banco), sem pedir mockups novos, conforme já acordado (`docs/v2/TR-frontend-v2.md` §10 pergunta 3). Os nomes de preset usados nos mockups do editor de cena ("Roda da Taverna", "Duelo Tático") são conteúdo de demonstração do mockup, não os nomes reais de layout da v1 — esta fase usa os nomes reais (Mestre em Destaque/Painel/Faixa).
Mantém-se **uma única cena editável por canal** (não a lista de múltiplas cenas que alguns componentes órfãos da v1 sugeriam, mas que nunca foi uma funcionalidade real — ver `docs/backlog/backlog.md` item 2).

### D4 — Faixa "E2EE desligada" e diálogo "Religar E2EE": desenhados sem mockup, a partir dos tokens semânticos já definidos
Nenhum dos 30 mockups mostra este estado. Esta fase usa o token semântico de aviso/erro já reconciliado na Fase 0 (não o verde reservado a E2EE activa) para a faixa permanente, com a mesma estrutura de informação que a v1 já tem hoje (quem desligou, quando, acção de religar condicionada a ter a chave). O diálogo de "Religar E2EE" segue o padrão de diálogo base da Fase 0 (Dialog), com um campo para a chave do canal quando esta não está já presente no dispositivo.
**Verificação de qualidade**: por não haver mockup de referência, esta fase inclui uma revisão visual manual deste estado específico antes de ser dada como concluída (tal como a Fase 1 fez para o modo claro do shell).

### D5 — Vista Grade e partilha de ecrã seguem os mockups combinados
`mesa_grade_com_compartilhamento_de_tela_1`/`_2` mostram a partilha de ecrã como um painel dedicado ao lado das câmaras, não uma grelha totalmente unificada tile-a-tile como a v1 faz hoje. Esta fase segue o **comportamento** da v1 (grelha única com câmaras e partilhas juntas, câmaras primeiro) mas pode reaproveitar a disposição visual dos mockups (painel de partilha + coluna de câmaras) como ponto de partida quando uma partilha está em destaque — os dois não são mutuamente exclusivos: grelha unificada por omissão, disposição em destaque quando uma partilha é promovida (spotlight), que é precisamente o que o requisito de "Destaque" da spec já pede.

### D6 — PiP flutuante: nº de posições e temporizador
O mockup do PiP (`mesa_chamada_de_voz_v_deo_em_pip_flutuante_mini_player`) mostra 3 posições (1 partilha de ecrã + 2 câmaras) e omite o temporizador de duração da chamada, divergindo do requisito (até 4 câmaras + duração, conforme a v1 e a spec desta fase). Esta fase implementa o requisito tal como especificado (até 4 posições de câmara, com temporizador), tratando essas duas omissões do mockup como lacunas de mockup, não como uma redução de escopo aceite — ver `docs/v2/TR-frontend-v2.md` §6.3, achado já registado.

## Risks / Trade-offs

- **[Risco] Maior risco técnico de toda a reescrita concentrado numa única fase** (LiveKit + E2EE + composição) → **Mitigação**: portar a lógica de `voice/` e `video/` da v1 quase sem alterações (D1) em vez de reprojectar, reduzindo a superfície de código novo que pode falhar.
- **[Risco] Layouts Painel/Faixa e a faixa de E2EE desligada não têm mockup de referência** → **Mitigação**: revisão visual manual explícita nas tasks desta fase para ambos (D3, D4), tal como a Fase 1 fez para o modo claro.
- **[Risco] Testar voz/vídeo multi-participante exige pelo menos 2 sessões de browser/dispositivo em simultâneo** → **Mitigação**: as tasks desta fase assumem explicitamente 2 contas de teste e 2 sessões de browser abertas em paralelo para verificação.

## Open Questions

- Adoptar `@livekit/components-*` (se existir maturidade suficiente para Solid) numa fase de polimento futura, em vez da integração manual portada da v1? Não muda o comportamento especificado nesta fase — é uma questão de manutenibilidade a avaliar depois de haver paridade.
