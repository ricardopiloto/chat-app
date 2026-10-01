# Termo de Referência — Frontend v2 da Mesa

**Data:** 2026-09-30 (revisão 2)
**Autor:** análise assistida (Claude Code), a pedido de Ricardo Sobral
**Tipo:** documento de análise/escopo — **não contém desenvolvimento**, nem decisões já tomadas; serve para embasar a decisão de arrancar o frontend v2.
**Revisão 2 — o que mudou:** a revisão 1 (2026-09-30) analisou os 10 mockups iniciais gerados no Google Stitch e encontrou 12 lacunas de cobertura (telas/diálogos sem nenhum mockup). O utilizador acrescentou **20 novos mockups** especificamente para fechar essas lacunas. Esta revisão reanalisa o conjunto completo (30 mockups) e substitui a revisão 1 por inteiro. **Achado principal desta revisão**: a maioria das lacunas foi de facto fechada, mas 4 dos 20 novos mockups introduzem uma **arquitetura de criptografia inteiramente nova** (MLS/RFC 9420, múltiplos dispositivos com atestação de hardware, Passkeys/FIDO2) que **não existe no backend actual nem foi pedida** — isto é mais grave do que uma lacuna de design por preencher; é um desvio de escopo com impacto directo no backend, que a revisão 1 tinha dado como "sem alterações esperadas".
**Fontes analisadas:** `docs/v2/campfire_modernism/DESIGN.md`, os 30 mockups em `docs/v2/mesa_*/code.html` + `screen.png`, `docs/design-system/stitch-prompt.md`, `docs/backlog/backlog.md`, `frontend/`, `backend/`, `infra/`, `docs/deploy-producao.md`, `docs/operar-instancia.md`, `CHANGELOG.md`, `README.md`.

---

## 1. Objeto

Definir o escopo, os limites e o impacto de reescrever **do zero** o frontend da Mesa (v2), substituindo integralmente a UI actual, mantendo:

- o **backend** (Rust/Axum + SQLite + LiveKit) sem alterações estruturais;
- a **stack tecnológica do frontend** (SolidJS + Vite + TypeScript + LiveKit client + criptografia client-side);
- **100% das funcionalidades hoje em produção** (inventariadas em [`docs/design-system/stitch-prompt.md`](../design-system/stitch-prompt.md) §3), sem adicionar nem remover escopo funcional;
- um **novo sistema visual** ("Campfire Modernism"), já iniciado via Google Stitch e documentado em `docs/v2/`.

Este documento não decide "vamos fazer" — decide **o que é preciso resolver antes de decidir**, e mapeia o que muda, o que não muda, e o que falta ou excede o escopo pedido.

---

## 2. Contexto

A v1 do frontend (SolidJS, tema "Nocturne"/"Mesa à Vela") está em produção, versão `0.8.1`, com ~17,3k linhas de TypeScript/TSX cobrindo ~35 telas/fluxos distintos. O backend (~10,6k linhas Rust, 59 rotas REST + WS) é estável. A criptografia da v1 é: par de chaves NaCl por identidade, cofre local cifrado por Argon2id, chave simétrica de servidor distribuída por "envelopes" selados, chave simétrica por canal de voz com custódia (checkbox "guardei a chave"). **Não há MLS, ratchet tree, epochs, nem modelo de múltiplos dispositivos** em lado nenhum do backend ou das specs actuais — confirmado por pesquisa em todo o repositório.

Foi produzido um prompt de design system (`docs/design-system/stitch-prompt.md`) cobrindo exaustivamente as funcionalidades actuais, com uma instrução explícita de **não acrescentar funcionalidades novas**. Esse prompt gerou 10 mockups iniciais. A revisão 1 deste TR cruzou esses 10 mockups com a necessidade funcional real e encontrou 12 lacunas — a maior parte na área de definições de servidor/conta e diálogos. Em resposta, foram gerados **20 mockups adicionais**. Esta revisão reanalisa o conjunto todo.

---

## 3. Objectivos

### 3.1 Geral
Avaliar a viabilidade e o impacto de construir um frontend v2 a partir do zero, com um novo design system, preservando 100% da paridade funcional com a v1 e sem exigir mudanças não-planeadas no backend.

### 3.2 Específicos
1. Confirmar se as 12 lacunas da revisão 1 foram fechadas pelos 20 novos mockups, e com que fidelidade face ao que a v1 realmente faz.
2. Identificar qualquer funcionalidade **nova** introduzida pelos mockups que não exista na v1 nem no prompt original — e o seu impacto (sobretudo no backend, se o desvio for adoptado).
3. Medir a escala do trabalho e dimensionar o esforço.
4. Levantar riscos técnicos e de produto específicos de uma reescrita total.
5. Propor decisões que precisam de ser tomadas pelo dono do produto antes do início do desenvolvimento.

---

## 4. Escopo

### 4.1 Dentro do escopo desta reescrita
- Todo o código em `frontend/src/` — reescrito do zero, mesma stack.
- O novo sistema de design visual completo: tokens, componentes, iconografia, temas, responsividade.
- Todos os ~35 ecrãs/fluxos listados em `docs/design-system/stitch-prompt.md` §3 — continua a ser a **fonte de verdade funcional** para a v2.

### 4.2 Fora do escopo desta reescrita
- **Backend** (`backend/`): sem alterações de schema, rotas, contratos REST/WS ou modelo de permissões — **excepto se o utilizador decidir explicitamente adoptar** algum dos desvios de escopo descritos em §7, caso em que o impacto no backend deixa de ser nulo (ver §7.1).
- **Infraestrutura** (`infra/`, LiveKit, coturn): sem alterações.
- **Funcionalidades do backlog** (`docs/backlog/backlog.md`): gravação/egress, múltiplas cenas, co-diretor, templates de cena, diretório público, canvas livre, papéis nos tiles, badges numéricos, federação, plugins/API, importador Discord, stats sociais, migração de identidade, empacotamento Tauri, preferências de notificação, TTL de convite configurável.
- **Os desvios de escopo identificados em §7.3** (modelo de identidade MLS, multi-dispositivo com atestação, Passkeys/FIDO2), salvo decisão explícita em contrário — ver §10.

---

## 5. Situação actual (diagnóstico) — sem alterações face à revisão 1

### 5.1 Frontend v1
~17.300 linhas TS/TSX (`pages` 4.319, `components` 4.068, `shell` 2.904, `lib` 1.100, `i18n` 1.094, `voice` 1.009, `api` 867, `preferences` 486, `crypto` 394, `video` 300, `App.tsx` 400, restantes 349). Stack: `solid-js ^1.9.9`, `@solidjs/router ^0.15.3`, `vite ^6.3.0`, `typescript ~5.8.0`, `livekit-client ^2.15.0`, `@livekit/track-processors ^0.7.2`, `tweetnacl ^1.0.3` + `@noble/hashes` + `hash-wasm`. Sem testes automatizados. Build → `frontend/dist/`, servido pelo Nginx (backend não serve estáticos nem tem CORS).

### 5.2 Backend
~10,6k linhas Rust (Axum + SQLx/SQLite), 59 rotas REST + WS. Modelo de criptografia: identidade NaCl + cofre Argon2id, chave simétrica de servidor por envelopes, chave simétrica por canal de voz com custódia. **Sem conceito de dispositivos múltiplos, sessões autorizadas por dispositivo, MLS ou Passkeys.**

### 5.3 Contratos a preservar
`/api/auth/*`, `/api/servers/*`, `/api/channels/*`, convites, mensagens, voz/grade/cenas, `key-envelopes`, protocolo WS — inalterados, **desde que a v2 não adopte os desvios de §7.3**.

---

## 6. O design system entregue — inventário consolidado (30 mockups)

### 6.1 O que foi entregue
**10 mockups originais** (shell+chat, autenticação básica, editor de cena "Mestre em Destaque" ×2, grade de câmaras ×2, grade+partilha de ecrã ×2, palco de composição, guia de tokens/componentes) + **20 mockups novos**, divididos em dois grupos:

**Grupo A — Definições e conta (10 ficheiros):** Cofre de Chaves E2EE/MLS, Dispositivos & Sessões Autorizadas, Minha Conta/Perfil Soberano, Áudio & Vídeo, Definições do servidor — Cargos e Permissões, Definições do servidor — Membros, Definições do servidor — Visão Geral & Boas-vindas, Menu de conta (popover) + modal de sair, Desbloqueio de conta/Recuperação de identidade, Convite/onboarding de convidado.

**Grupo B — Diálogos e modais (10 ficheiros):** PiP flutuante de chamada, Diálogo de convidar (2 passos), Diálogo "inspecionar acesso efetivo" (standalone), Diálogo de permissões de canal/ACL (com sub-aba de inspeção), Dropdown de notificações + busca global, Lightbox de anexos de imagem, Modais de gestão de canal (mute + apagar), Modal criar canal de voz (custódia E2EE), Modal criar servidor (custódia E2EE), Pré-entrada de chamada ("green room").

Todos os 30 ficheiros usam o **mesmo sistema de tokens M3-style** (`background #10131c`, `primary-container #e07a5f`, `secondary #6bdc96`, etc.) — os 20 novos mockups **não** derivaram para o sistema divergente do guia de componentes (achado positivo, já não é um risco a gerir). Ícones: Material Symbols Outlined em 100% dos ficheiros de produto (só 2 emojis pontuais usados como conteúdo decorativo, não como ícone de interface). Todos os 30 ficheiros são **exclusivamente modo escuro** — nenhum demonstra modo claro além de um botão decorativo/não-funcional num único mockup. Nenhum dos 30 ficheiros resolve a **shell da aplicação em largura de telemóvel** — o rail de 72px + sidebar de 240–312px nunca colapsa em nenhum ficheiro, mesmo quando o conteúdo interno de diálogos reflui correctamente.

### 6.2 Tabela de cobertura — as 12 lacunas da revisão 1

| # | Lacuna (revisão 1) | Estado agora | Fechada por | Observações |
|---|---|---|---|---|
| 1 | Definições → Membros (pesquisa, cargo por membro, remover, linha do dono bloqueada) | **Fechada** | `mesa_defini_es_do_servidor_membros` | Linha do dono correctamente bloqueada (sem dropdown nem remover); uma segunda linha ("anfitrião E2EE") é bloqueada por toast em vez de controlo desactivado — inconsistência de padrão a resolver. |
| 2 | Definições → Cargos (criar, reordenar, botão permissões, apagar) | **Fechada, com desvio de IA** | `mesa_defini_es_do_servidor_cargos_e_permiss_es` | Criar/reordenar/apagar presentes tal como pedido. **Não existe um botão "Permissões" separado por cargo** — a edição é inline na mesma página (master-detail), não uma navegação para outro ecrã como a v1 faz hoje. |
| 3 | Definições → Permissões do cargo (Geral/Texto/Voz) | **Fechada** | mesmo ficheiro | Grupos exactos: "Permissões Gerais" (6), "Permissões de Texto" (3), "Permissões de Voz & Vídeo" (2). |
| 4 | Definições → Imagem do servidor | **Fechada, mas agregada** | `mesa_defini_es_do_servidor_vis_o_geral_e_boas_vindas` | Todos os elementos pedidos presentes, mas como um cartão dentro de uma página combinada, não uma tela própria. |
| 5 | Definições → Boas-vindas | **Fechada, mas agregada** | mesmo ficheiro | Selector de canal + template com tokens de inserção. |
| 6 | Definições → Apagar servidor | **Fechada, mas agregada** | mesmo ficheiro | Confirmação em dois passos (nota de chave mestra + digitar o nome exacto). Sem tela própria, apesar do menu lateral de definições sugerir uma rota dedicada. |
| 7 | Definições — landing/estado vazio | **Parcialmente fechada** | implícito no mesmo ficheiro | "Visão Geral" funciona como landing populada; nenhum estado vazio/skeleton foi desenhado. |
| 8 | Menu de conta (nome, avatar, idioma, sair) | **Fechada** | `mesa_menu_de_conta_popover_modal_de_sair` | Todos os 4 elementos presentes, incluindo o radio pt-BR/EN pedido. |
| 9 | Diálogo de confirmação de logout | **Fechada** | mesmo ficheiro | Modal completo com aviso de bloqueio de cofre, checkbox de cache, Cancelar/Confirmar. |
| 10 | Fluxo de desbloqueio de conta (novo dispositivo) | **Fechada** | `mesa_desbloqueio_de_conta_recupera_o_de_identidade` | Sem estado de erro (senha errada) demonstrado — o JS de demonstração nunca falha. |
| 11 | Fluxo de recuperar identidade | **Fechada, mas não condicionada a falha** | mesmo ficheiro | Apresentada como caminho sempre disponível, não como consequência de um desbloqueio falhado (não há estado de falha para a accionar). |
| 12 | Ecrã de aceitar convite | **Fechada** | `mesa_convite_onboarding_de_convidado` | Corresponde de perto ao pedido, com bónus de estado de convite inválido/expirado. |

**Resultado líquido**: as 12 lacunas da revisão 1 têm agora pelo menos um mockup. 3 continuam parcialmente resolvidas (nº 2, 7, 11) por decisões de arquitetura de informação diferentes do pedido original, não por ausência de conteúdo.

### 6.3 Lacunas adicionais verificadas nesta revisão (diálogos do Grupo B)

| Item | Estado | Ficheiro | Observações |
|---|---|---|---|
| Diálogo criar servidor (nome + chave + checkbox obrigatória) | **Fechada** | `mesa_modal_criar_servidor_cust_dia_e2ee` | Checkbox vem **pré-marcada** por omissão — o estado "botão bloqueado" nunca é mostrado visualmente, apesar da lógica JS existir. |
| Diálogo criar canal (nome + emoji + visibilidade + custódia p/ voz) | **Fechada só para voz** | `mesa_modal_criar_canal_de_voz_cust_dia_e2ee` | Alternância Texto/Voz é estática (sem JS); botão de emoji é um glifo fixo, não um picker; variante de canal de texto nunca é mostrada isoladamente. |
| Renomear canal | **Continua em aberto** | — | Nenhum dos 30 ficheiros mostra um modal de renomear nem confirma o padrão inline da v1. |
| Apagar canal + erro 409 (último canal do tipo) | **Parcialmente fechada** | `mesa_modais_de_gest_ao_de_canal` | Fluxo de confirmação completo; o estado de erro 409 nunca é mostrado. |
| Painel de ACL do canal (visibilidade + construtor de regras + lista + inspector de acesso) | **Totalmente fechada** | `mesa_di_logo_permiss_es_de_canal_acl_inspecionar_acesso` | O ficheiro mais completo do lote todo — cada sub-requisito está presente e funcional em JS. |
| Diálogo de silenciar membro (5/10/15/30 min + custom + tempo restante + Dessilenciar) | **Parcialmente fechada, com divergência de forma** | `mesa_modais_de_gest_ao_de_canal` (silenciar) + `mesa_di_logo_inspecionar_acesso_efetivo_fator_a_fator` (dessilenciar) | Durações mostradas são 5min/15min/1h/24h/1sem/Custom — **não** 5/10/15/30min; "Custom" não tem campo numérico visível; o botão "Dessilenciar" está num diálogo completamente diferente e sem relação directa (diagnóstico de acesso de um membro específico), não ao lado do diálogo de silenciar. |
| PiP flutuante (arrastar, nome+duração, até 4 posições/estado "Em chamada", encaixe de canto, Voltar ao palco + terminar) | **Maioritariamente fechada** | `mesa_chamada_de_voz_v_deo_em_pip_flutuante_mini_player` | Sem temporizador de duração da chamada; mostra 3 posições (1 partilha de ecrã + 2 câmaras), não 4 câmaras; arrastar/encaixe é só visual (sem JS de facto); "Voltar ao palco" é um ícone com tooltip, não um botão rotulado como no pedido; terminar chamada funciona. |
| Dropdown de notificações | **Fechada, com taxonomia diferente** | `mesa_dropdown_de_notifica_es_e_busca_global` | Usa "Marcar todas como lidas" em vez de "Limpar"; usa abas de filtro ("Todas/Menções/Cripto & Sessões") em vez das duas secções empilhadas pedidas ("Menções/Respostas" + "Canais com novidades"). |
| Painel de pesquisa (texto livre/`#canal termo`, resultados agrupados, estados vazios) | **Maioritariamente fechada** | mesmo ficheiro | Sem variante de estado vazio (só mostra resultados populados). |
| Lightbox de imagem (zoom, download, navegação, fechar por Esc/backdrop/X, arrastar) | **Fechada, uma lacuna** | `mesa_lightbox_de_anexos_de_imagem_no_chat_geral` | Tudo funcional em JS excepto **fechar ao clicar no fundo/backdrop** — não está ligado. |
| Pré-entrada de chamada ("Entrar"/"Testar vídeo"/"Entrar a ouvir") | **Totalmente fechada, excede o pedido** | `mesa_pr_entrada_na_chamada_green_room_testar_v_deo` | Os 3 botões pedidos presentes e funcionais; acrescenta um painel de calibração de dispositivos, roster ao vivo e teste de som real via WebAudio. |
| **Faixa "E2EE desligada" + diálogo "Religar E2EE"** | **Continua completamente em aberto** | — | Nenhum dos 30 ficheiros mostra o estado de E2EE desligada nem o fluxo de religar — todos os ecrãs mostram E2EE sempre "Ativa". Este é um fluxo central da v1 (§5 do prompt original) e continua sem nenhuma referência visual. |

---

## 7. Achado crítico: desvio de escopo na arquitectura de identidade/criptografia

Esta secção é nova nesta revisão e é o ponto mais importante do documento.

### 7.1 O que foi encontrado

Quatro dos 20 novos mockups (`mesa_configura_es_de_conta_e_cofre_de_chaves_e2ee_mls`, `mesa_configura_es_dispositivos_sess_es_autorizadas`, `mesa_configura_es_minha_conta_perfil_soberano` em parte, `mesa_configura_es_udio_v_deo` em parte) desenham ecrãs para funcionalidades que **não existem na v1, não foram pedidas no prompt original, e não têm suporte nenhum no backend actual**:

- **Cofre de Chaves E2EE/MLS**: assume um protocolo MLS (RFC 9420) com "árvore de ratchet", "epochs" por canal/servidor, chave pública Ed25519 exposta com verificação por QR entre pares, seed de recuperação BIP-39 de 12 palavras com revelar/ocultar e exportação `.ENC`, exportação PEM/GPG "armored", e acções de rodar/revogar chave por sessão individual.
- **Dispositivos & Sessões Autorizadas**: assume um modelo completo de múltiplos dispositivos por conta — emparelhamento por QR ("Mesa Bridge"), atestação de hardware (TPM 2.0 / Secure Enclave), inspecção de certificado assinado, diagrama de árvore MLS por dispositivo, e um "kill switch" para desconectar todos os outros dispositivos.
- **Minha Conta**: mistura campos legítimos (nome, avatar — já existem na v1) com itens novos: email de recuperação, "canal de recuperação móvel", uma "senha mestra do enclave" distinta da password de login, gestão de Passkeys/FIDO2 (YubiKey), 4 alternadores de "visibilidade na malha P2P", métricas de "autonomia do nó", e eliminação de conta.
- **Áudio & Vídeo**: o selector de dispositivo + blur de fundo correspondem à v1; o resto é novo — alternância Push-to-Talk/activação por voz com editor de atalho, medidor de VU com marcador de limiar, painel estéreo, som de teste, supressão de ruído de 3 vias (RNNoise/Krisp) com intensidade, cancelamento de eco com estatísticas de duplex, AGC com estatísticas de compressor, selector de codec de vídeo (AV1/VP9/H.264) com aceleração GPU, espelhar câmara, e um painel de telemetria de rede ao vivo.

**Confirmação por pesquisa directa no repositório**: os termos "MLS", "ratchet", "RFC 9420" não aparecem em nenhum lugar do `backend/`, `frontend/src/`, `specs/`, `README.md`, `docs/product-brief.md` ou `docs/arquitetura-tecnica.md`. Não é uma funcionalidade já planeada que faltava desenhar — é uma arquitectura de criptografia **diferente da que a aplicação implementa hoje**, inventada pela ferramenta de geração de design sem grounding no backend real.

### 7.2 Por que isto importa mais do que uma lacuna de cobertura normal

O mandato original (`docs/design-system/stitch-prompt.md` §0) foi explícito: *"Não acrescentes funcionalidades novas... Se notares uma lacuna, resolve-a dentro do escopo existente."* Estes 4 mockups não resolveram lacunas dentro do escopo — substituíram silenciosamente o modelo de segurança da aplicação por outro, num ponto do produto (identidade, chaves, dispositivos) onde a diferença entre "desenho" e "implementação real" tem consequência de segurança, não só visual.

Se estes mockups forem tratados como especificação de UI a implementar tal como estão, isso implica **obrigatoriamente** mudanças de backend que contrariam directamente o princípio "manter o backend sem alterações" definido em §4.2 e na revisão 1: um protocolo de grupo MLS real (ou, na melhor das hipóteses, simular a fachada sem a implementação — o que seria enganoso para o utilizador final sobre garantias de segurança que a app não oferece), um registo de dispositivos por conta com revogação remota, e integração com WebAuthn/Passkeys. Nenhuma destas três coisas está desenhada, orçamentada ou sequer mencionada em nenhum documento de produto da Mesa até hoje.

### 7.3 Recomendação

Estes 4 mockups **não devem ser tratados como escopo aprovado da v2** só por existirem como ficheiro — precisam de uma decisão explícita do dono do produto antes de entrarem em qualquer plano de implementação (ver pergunta em §10). Duas leituras possíveis:
1. **Tratar como exploração especulativa fora de escopo** (mais alinhado com o mandato original) — a v2 usa a versão "Minha Conta"/"Áudio & Vídeo" só na parte que já mapeia para campos reais da v1 (nome, avatar, idioma, selector de dispositivo, blur), e os ecrãs de Cofre MLS e Dispositivos/Sessões não entram nesta reescrita.
2. **Tratar como uma proposta de evolução de produto genuína**, a avaliar separadammente (product brief + spec própria + análise de arquitectura de segurança) — nesse caso deixa de ser parte do TR do "frontend v2 com paridade da v1" e passa a ser o seu próprio projecto, com o seu próprio impacto no backend a ser medido do zero.

Este TR não escolhe entre as duas — é a decisão nº 1 de §10, e provavelmente a mais importante de todo o documento.

### 7.4 Outros achados de consistência do design system (não bloqueantes, mas a resolver)

- **Cores reservadas usadas como decoração**: o ecrã de Cargos e Permissões oferece as cores `secondary` (esmeralda, reservada a estado E2EE/presença) e `tertiary` (violeta, reservada a partilha de ecrã) como opções genéricas de cor de badge de cargo — colide visualmente com indicadores de estado reais no resto da app. Recomenda-se remover essas duas opções do selector de cor de cargo, ou relaxar explicitamente a regra "estritamente reservada" do `DESIGN.md`.
- **Duas UX diferentes para o mesmo conceito** de "inspecionar acesso efectivo": o diálogo standalone de diagnóstico de um membro (`mesa_di_logo_inspecionar_acesso_efetivo_fator_a_fator`) e a sub-aba de auditoria dentro do painel de ACL do canal (`mesa_di_logo_permiss_es_de_canal_acl_inspecionar_acesso`) resolvem o mesmo problema com formas de interacção diferentes — precisa de uma decisão de qual é a canónica antes da implementação.
- **`mesa_modais_de_gest_ao_de_canal` não inclui renomear**, apesar do nome do ficheiro sugerir um pacote de gestão de canal — só empacota silenciar + apagar. Renomear continua sem nenhuma referência visual em todo o conjunto de 30 ficheiros.
- **Checkboxes de custódia de chave (criar servidor / criar canal de voz) vêm pré-marcadas** nos mockups estáticos — o estado "botão Criar bloqueado até marcar" nunca é demonstrado visualmente, apesar da lógica JS estar correcta.
- Inconsistência menor de atributo `lang` (mistura `en`/`pt-BR` com conteúdo sempre em português) em vários ficheiros — cosmético, cuidado de limpeza antes de entregar como especificação final.

---

## 8. Análise de impacto no código actual

### 8.1 Impacto no backend
**Nenhum esperado**, com a ressalva explícita de §7: qualquer decisão de adoptar os mockups de Cofre MLS / Dispositivos & Sessões / Passkeys muda esta conclusão por completo — passaria a exigir desenho de schema novo (registo de dispositivos, tokens de revogação), possivelmente um protocolo de grupo diferente do actual, e trabalho de arquitectura de segurança antes de qualquer UI.

### 8.2 Impacto no frontend
Sem alterações face à revisão 1: reescrita total confirmada; a lógica de domínio da v1 (protocolo de criptografia client-side, integração LiveKit, resolução de permissões/ACL) deve ser preservada como conhecimento mesmo que o código seja reescrito; decisão de convivência `frontend/` vs. `frontend-v2/` em aberto; catálogos i18n (951 linhas) precisam de ser portados; sem suite de testes automatizados hoje.

### 8.3 Impacto no fluxo Speckit (`specs/`)
Sem alterações face à revisão 1 — decisão em aberto sobre spec guarda-chuva própria vs. fluxo à parte.

### 8.4 Impacto em infra/deploy
Sem alterações face à revisão 1 — `docs/deploy-producao.md` e Nginx assumem um único build de frontend; convivência v1/v2 exige decisão de roteamento; backend continua sem servir estáticos nem CORS, exigindo mesma origem.

### 8.5 Responsividade e modo claro — ainda sem nenhuma referência visual
Mesmo após 20 mockups adicionais, **nenhum dos 30 ficheiros** demonstra: (a) a shell da aplicação (rail + sidebar) a colapsar num layout de telemóvel — só conteúdo *dentro* de diálogos individuais reflui; (b) qualquer ecrã em modo claro, apesar de o `DESIGN.md` definir uma paleta clara completa e de quase todos os mockups mostrarem um alternador de tema Sistema/Claro/Escuro (sempre parado em "Escuro"). Estes dois pontos continuam a bloquear o início de desenvolvimento das respectivas áreas, exactamente como na revisão 1.

---

## 9. Riscos (actualizado)

| Risco | Impacto | Nota |
|---|---|---|
| Adoptar os mockups de Cofre MLS / Dispositivos & Sessões / Passkeys como especificação sem decisão explícita | **Crítico** — implica mudança de arquitectura de segurança e de backend não orçamentada, ou UI que promete garantias criptográficas que a app não implementa | Ver §7 |
| Reescrever a criptografia client-side actual (NaCl/Argon2id/envelopes) do zero sem portar a lógica validada da v1 | Alto — risco de segurança, não só de bug de UI | Ver §8.2 |
| Faixa/diálogo de "E2EE desligada ⇄ Religar" continua sem nenhum mockup em 2 rondas de geração | Médio-Alto — é um fluxo de segurança central da v1 (exceção consciente de gravação) e seria fácil esquecê-lo de vez se ninguém o voltar a pedir explicitamente | Ver §6.3 |
| Renomear canal, estado de erro 409, e o par silenciar/dessilenciar continuam sem forma coerente | Médio — retrabalho ou inconsistência se implementado directamente dos mockups actuais | Ver §6.3, §7.4 |
| Nenhum modo claro nem layout mobile desenhado em 30 ficheiros, mas ambos existem na v1 | Médio — paridade funcional incompleta se não resolvido antes do fim do projecto | Ver §8.5 |
| Falta de testes automatizados (herdado da v1) | Baixo/Médio | Ver §8.2 |

---

## 10. Perguntas em aberto (decisões do dono do produto) — actualizado

1. **[Nova, prioritária]** Os mockups de Cofre de Chaves E2EE/MLS, Dispositivos & Sessões Autorizadas e as partes "novas" de Minha Conta/Áudio & Vídeo (§7) — ficam fora de escopo desta reescrita (tratados como exploração especulativa), ou tornam-se um projecto de produto à parte com a sua própria análise de arquitectura de segurança? Nenhuma das duas opções deve ser assumida por omissão.
2. A v2 substitui `frontend/` in-place ou nasce como `frontend-v2/` a correr em paralelo até estar pronta?
3. As decisões de arquitectura de informação divergentes da v1 (cargos sem botão de permissões próprio — editor inline; definições de servidor/imagem/boas-vindas/apagar agregadas numa única página em vez de páginas próprias) são aceites como a nova forma de fazer, ou devem seguir a estrutura de navegação da v1?
4. Falta desenhar: renomear canal, estado de erro 409 ao apagar o último canal de um tipo, o par coerente silenciar/dessilenciar num único fluxo, e a faixa "E2EE desligada"/"Religar E2EE" — encomendam-se mais mockups no Stitch antes de codificar essas partes, ou define-se esse desenho directamente em código a partir dos padrões já estabelecidos?
5. Modo claro e layout mobile — nenhuma das duas rondas de geração as endereçou. Entram nesta ronda do design system, ou ficam para depois (com risco de paridade incompleta no lançamento)?
6. A v2 recebe uma spec Speckit própria (`specs/100-...`) ou corre fora desse fluxo?
7. Vale introduzir testes automatizados como parte da reescrita?
8. Qual o critério de "pronta para substituir a v1"?

---

## Anexo — correcções a registar no README

Confirmado nas duas rondas de auditoria: `README.md` secção "O que ainda não é" está desactualizada em dois pontos — "painel de membros à direita" e "canais privados/permissões finas" **já estão implementados** na v1 (`MembersPanel.tsx`, `ChannelAclPanel.tsx`). Não afecta este TR directamente, mas deve ser corrigido na mesma leva de trabalho.
