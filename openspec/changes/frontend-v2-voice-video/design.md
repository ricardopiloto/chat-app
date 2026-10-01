# Design

## Context

Esta é a fase de maior risco técnico da reescrita: integra LiveKit (SFU de voz/vídeo), criptografia de chave de canal (Insertable Streams para E2EE), e a composição de câmeras que é a funcionalidade diferenciadora do produto. Constrói sobre `frontend-v2-foundation`, `frontend-v2-auth-shell` (shell, painel do utilizador, sidebar) e `frontend-v2-server-admin` (canais de voz e ACL já existem).

A referência de comportamento é a aplicação v1 em execução (caixa-preta), a documentação de LiveKit e os contratos do backend e de `docs/v2/contracts/` (chave de canal). O código de `frontend/` não é consultado nem reaproveitado.

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

### D1 — Integração LiveKit e camada de mídia reescritas, com modelo declarativo
**Revoga** a decisão anterior de portar a v1 "quase 1:1". `frontend-v2/src/voice/` é desenhado de raiz a partir da documentação de LiveKit e dos requisitos: uma sessão de chamada (estado de ligação, faixas locais, ocupação, fala activa, heartbeat, saída garantida ao fechar o separador) exposta como estado reactivo, e uma camada de apresentação **declarativa** em que cada tile recebe a faixa de mídia como propriedade e a anexa ao seu próprio elemento, em vez de uma camada imperativa que move elementos `<video>` por DOM entre contentores. Cobre explicitamente os casos de borda que a aplicação actual trata e que fazem parte da paridade (D8): falha de permissão de câmara com entrada só áudio, libertação do hardware ao sair/mudar de canal, desconexão inesperada, reconexão de áudio de quem fala ao navegar, partilha de ecrã terminada pelo navegador, ouvintes sem publicação.
**Porquê**: a auditoria mostrou 87–100% de sobreposição com a v1 nesta camada. O risco de regressões é gerido por D8 (checklist de comportamentos) e por testes manuais com duas sessões, não por cópia de código.
**Alternativa considerada**: componentes prontos `@livekit/components-*`. Continua fora desta fase (pergunta em aberto abaixo).

### D2 — Chave de canal: mesmo modelo de custódia da v1, sem MLS
`frontend-v2/src/crypto/channelKey` implementa, a partir de `docs/v2/contracts/crypto-formats.md`, o modelo existente: chave simétrica gerada no cliente na criação do canal (já coberto pela Fase 2), custódia confirmada por checkbox, e a faixa "E2EE desligada"/"Religar E2EE" desta fase consome essa mesma chave — nunca um protocolo de grupo MLS/epochs (fora de escopo, TR §7).

### D3 — Layouts nomeados mapeados directamente, cena única
Os três layouts existentes (Mestre em Destaque, Painel, Faixa) mapeiam directamente para o layout "Mestre em Destaque" já desenhado nos mockups (`mesa_editor_de_cenas_de_composi_o_*`, `mesa_palco_de_voz_v_deo_composi_o_de_c_meras`); os outros dois (Painel/quad, Faixa) **não têm mockup próprio** — esta fase desenha-os por extrapolação directa da mesma linguagem visual (grelha de posições, chips, banco), sem pedir mockups novos, conforme já acordado (`docs/v2/TR-frontend-v2.md` §10 pergunta 3). Os nomes de preset usados nos mockups do editor de cena ("Roda da Taverna", "Duelo Tático") são conteúdo de demonstração do mockup, não os nomes reais de layout da aplicação — esta fase usa os nomes reais (Mestre em Destaque/Painel/Faixa).
Mantém-se **uma única cena editável por canal** (não uma lista de múltiplas cenas, que nunca foi uma funcionalidade real — ver `docs/backlog/backlog.md` item 2).

### D4 — Faixa "E2EE desligada" e diálogo "Religar E2EE": desenhados sem mockup, a partir dos tokens semânticos já definidos
Nenhum dos 30 mockups mostra este estado. Esta fase usa o token semântico de aviso/erro já reconciliado na Fase 0 (não o verde reservado a E2EE activa) para a faixa permanente, com a mesma estrutura de informação que a v1 já tem hoje (quem desligou, quando, acção de religar condicionada a ter a chave). O diálogo de "Religar E2EE" segue o padrão de diálogo base da Fase 0 (Dialog), com um campo para a chave do canal quando esta não está já presente no dispositivo.
**Verificação de qualidade**: por não haver mockup de referência, esta fase inclui uma revisão visual manual deste estado específico antes de ser dada como concluída (tal como a Fase 1 fez para o modo claro do shell).

### D5 — Vista Grade e partilha de ecrã seguem os mockups combinados
`mesa_grade_com_compartilhamento_de_tela_1`/`_2` mostram a partilha de ecrã como um painel dedicado ao lado das câmaras, não uma grelha totalmente unificada tile-a-tile como a v1 faz hoje. Esta fase segue o **comportamento** actual (grelha única com câmaras e partilhas juntas, câmaras primeiro) e, quando uma partilha está em destaque (spotlight), adopta a disposição dos mockups `mesa_grade_com_compartilhamento_de_tela_*`: partilha no palco principal e **coluna lateral direita** de câmaras (não faixa inferior) — os dois não são mutuamente exclusivos: grelha unificada por omissão, disposição em destaque quando uma partilha é promovida (spotlight), que é precisamente o que o requisito de "Destaque" da spec já pede.

### D6 — PiP flutuante: nº de posições e temporizador
O mockup do PiP (`mesa_chamada_de_voz_v_deo_em_pip_flutuante_mini_player`) mostra 3 posições (1 partilha de ecrã + 2 câmaras) e omite o temporizador de duração da chamada, divergindo do requisito (até 4 câmaras + duração, conforme a spec desta fase). Esta fase implementa o requisito tal como especificado (até 4 posições de câmara, com temporizador), tratando essas duas omissões do mockup como lacunas de mockup. Além disso, segue o mockup nos controlos rápidos de **microfone, ensurdecer e câmara** (que já existem no painel do utilizador) e no selo de fala por tile — ver `docs/v2/TR-frontend-v2.md` §6.3, achado já registado.

### D7 — Checklists de fidelidade desta fase
Elementos obrigatórios por tela (ver `docs/v2/AUDIT-fidelity.md` §4). Fora de escopo e **não** implementados: telemetria de rede (RTT, jitter, perda), codec/GPU/ruído neural/eco/AGC, nível/CA/PV de personagem, tabuleiro VTT e ferramentas associadas (zoom, laser, tela cheia de conteúdo), inspector de slot com proporção/borda/sobreposições/ganho, "Adicionar câmera" no banco, MLS, espelhar câmara.

- **Green room (`mesa_pr_entrada_na_chamada_green_room_testar_v_deo`)**: cartão de cabeçalho (ícone do canal, nome, chip E2EE, participantes e duração); pré-visualização 16:9 com a câmara real quando o utilizador a liga (padrão sintético em "Testar vídeo"), selector de blur (Nítido/Suave/Desfocado) sobreposto, alternadores de câmara e microfone e medidor de nível do microfone; painel de calibração com selecção de microfone, saída e câmara (D9); três ações em cartões — Entrar, Testar vídeo e Entrar (ouvir), esta última única opção para quem só pode ouvir; lista "No canal agora" com estado (a falar, mudo, ouvinte, partilha); nota de que as escolhas respeitam as definições guardadas.
- **Palco de composição (`mesa_palco_de_voz_v_deo_composi_o_de_c_meras`)**: cabeçalho com título, selo AO VIVO, duração e participantes; segmentos Composição/Grade, chip E2EE e acção de editar cena (quem administra); palco com tile principal e tiles laterais com selo "A falar", avatar quando sem vídeo, chips de microfone/câmara/mudo e nome; faixa "No banco" com os participantes sem posição.
- **Editor de cenas (`mesa_editor_de_cenas_de_composi_o_1` e `_2`)**: cabeçalho com nome da cena, chip "modo edição", Descartar e Salvar; palco de edição com slots numerados e drag-and-drop; painel lateral com número de posições, layouts com pré-visualização e banco; confirmação de alterações por guardar. Sem inspector de slot.
- **Grade (`mesa_visualiza_o_por_grade_1` e `_2`)**: barra com título, AO VIVO, duração, segmentos, "Compartilhar tela" e "Convidar"; tiles com glow e selo de fala, glifos de microfone/câmara, nome e rodapé "Na escuta" com ouvintes.
- **Grade com partilha (`mesa_grade_com_compartilhamento_de_tela_1` e `_2`)**: partilha no palco principal, coluna lateral direita de câmaras, indicador "A transmitir" e acção de destaque por partilha.
- **PiP (`mesa_chamada_de_voz_v_deo_em_pip_flutuante_mini_player`)**: cabeçalho arrastável com nome, duração e acções de expandir; tiles (até 4) com selo de fala; controlos de microfone, ensurdecer, câmara e Sair; Voltar ao palco.
- **E2EE desligada e Religar**: sem mockup (D4); revisão visual manual mantida.

### D8 — Funcionalidades desta área que têm de continuar a funcionar
Entrar, Testar vídeo e Entrar (ouvir); preferência de câmara/microfone antes de entrar; entrada só áudio quando a câmara falha ou é negada; saída que liberta câmara e microfone; mudar de canal de voz sai do anterior; controlos de chamada no painel do utilizador (microfone, ensurdecer, câmara, partilha de ecrã só em Grade, terminar); blur três níveis com erro inline; indicadores de fala sincronizados (palco, grade, roster); roster de voz na sidebar visível sem abrir o canal; duração da chamada; chip e faixa E2EE desligada e Religar com chave; Composição (3 layouts, 2–8 posições, banco), editor de cena (atribuir, devolver, nº de posições com escolha de remoção, layout, confirmação de alterações), cena única; Grade com câmaras e partilhas, partilha só em Grade, destaque; PiP arrastável com cantos e memória de posição, Voltar ao palco e terminar; ouvintes sem microfone/câmara; saída automática quando o canal ou servidor é apagado; áudio remoto continua ao navegar para outro ecrã. Cada item consta de `docs/v2/parity-checklist.md`.

### D9 — Áudio & Vídeo: definições de dispositivo e blur
Nova capability `frontend-v2/audio-video-settings`, dentro do escopo porque corresponde à selecção de dispositivos e ao blur da aplicação actual (AUDIT §4, item 20). Uma página de definições (acessível pelo menu de conta e pela calibração do green room) permite escolher microfone, saída de áudio (quando o navegador suporta) e câmara, ver o nível do microfone em tempo real, ouvir um som de teste, pré-visualizar a câmara e escolher o blur. As escolhas persistem no dispositivo e são aplicadas ao entrar numa chamada. **Fora**: PTT e atalhos, supressão de ruído, eco, AGC, codec, aceleração GPU, espelhar câmara e telemetria (AUDIT §6).

## Risks / Trade-offs

- **[Risco] Maior risco técnico de toda a reescrita concentrado numa única fase** (LiveKit + E2EE + composição), agora sem partir da implementação existente → **Mitigação**: D8 como checklist de comportamentos de borda, verificação com duas sessões de navegador e LiveKit real, e implementação incremental (sessão → tiles → composição → grade → PiP) com verificação em cada passo.
- **[Risco] Layouts Painel/Faixa e a faixa de E2EE desligada não têm mockup de referência** → **Mitigação**: revisão visual manual explícita nas tasks desta fase para ambos (D3, D4), tal como a Fase 1 fez para o modo claro.
- **[Risco] Testar voz/vídeo multi-participante exige pelo menos 2 sessões de browser/dispositivo em simultâneo** → **Mitigação**: as tasks desta fase assumem explicitamente 2 contas de teste e 2 sessões de browser abertas em paralelo para verificação.

## Open Questions

- Adoptar `@livekit/components-*` (se existir maturidade suficiente para Solid) numa fase de polimento futura, em vez da integração manual própria? Não muda o comportamento especificado nesta fase — é uma questão de manutenibilidade a avaliar depois de haver paridade.
