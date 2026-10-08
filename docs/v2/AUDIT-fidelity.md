# Auditoria de fidelidade — frontend v2 vs. mockups vs. v1

Data: 2026-10-01 · Escopo: fases 0–4 entregues em `frontend-v2/` (fundação, auth/shell, admin, chat de texto, voz/vídeo).

## 1. Conclusão

A v2 adotou os **tokens** do design (paleta Campfire Modernism, Plus Jakarta Sans/Inter, Material Symbols), mas **não a interface desenhada**. Em quase todas as telas a estrutura é mais simples e mais genérica que o mockup. Na Fase 4 (voz/vídeo) a base de código é, além disso, **cópia da v1**.

| Dimensão | Resultado |
|---|---|
| Tokens de cor e tipografia | Adotados (`styles.css` espelha o `DESIGN.md`) |
| Fidelidade visual por tela (31 mockups) | 0 fiéis · 15 parciais · 11 genéricas · 5 ausentes (dos 31 itens numerados; 2 arquivos extras não são telas) |
| Código copiado da v1 | 59% dos tokens de código. Fase 4: 87–100% nos componentes. Fases 0–3: lógica de domínio copiada, UI majoritariamente nova |
| CSS reaproveitado da v1 (nomes de classe) | Fases 0–3: 13–25%. Voz (`voice.css`): 74% |
| Fonte mono (JetBrains Mono) | Usada em 3 lugares. Os mockups a usam em quase todo rótulo técnico |
| Logo | A v2 usa um "M" em quadrado como placeholder; `mesa_logo` não foi usado |

O problema não é só "parecer a v1". É também que **o resultado não parece o design entregue**: faltam a densidade de informação, as camadas (chips de estado, cartões, rodapés técnicos) e a hierarquia visual dos mockups.

## 2. Método e limites

1. **Código vs. v1.** Para cada arquivo `.ts/.tsx` da v2 (≥ 80 tokens), medi a fração de sequências de 6 tokens que aparecem em algum arquivo da v1 (sem comentários nem espaços). A métrica é generosa: tipos de API, utilitários e i18n contam como cópia, e não distingue "copiado" de "reimplementado igual". Serve para ordem de grandeza.
2. **CSS vs. v1.** Fração de nomes de classe de cada `.css` da v2 presentes no CSS da v1.
3. **Fidelidade visual.** Li os 31 `screen.png` e comparei com a v2 rodando (backend, LiveKit e Vite locais; tema escuro, pt-BR, 1300×850). Telas capturadas ao vivo: Auth, criar servidor, chat de texto, configurações (visão geral, cargos, membros), diálogo de convite, permissões de canal, popover de conta, busca. Voz/vídeo foi capturada na verificação da Fase 4 (tema claro). Itens marcados **(DOM)** foram verificados só por inspeção do DOM/código, sem captura visual lado a lado.
4. **Escala de fidelidade.**
   - **Fiel**: estrutura, hierarquia e detalhes do mockup reproduzidos.
   - **Parcial**: estrutura principal presente, mas faltam camadas visuais e informação.
   - **Genérica**: cumpre a função com componentes básicos; só as cores lembram o mockup.
   - **Ausente**: tela inexistente na v2.
5. **Limites.** Não comparei pixel a pixel nem testei responsivo/modo claro. "Fora de escopo" segue `TR-frontend-v2.md` §4.2 e §7 (MLS, multi-dispositivo, Passkeys, rolagem de dados, métricas de rede etc.).

## 3. Sobreposição de código com a v1, por área

| Área | Arquivos (v2 ← v1) | Sobreposição |
|---|---|---|
| Voz/vídeo (Fase 4) | `voice/VoiceSession`, `video/*`, `voice/*` helpers | 100% |
| | `voice/CameraGrid` ← `components/CameraGrid` | 97% |
| | `voice/FloatingVoicePip` ← `shell/FloatingVoicePip` | 95% |
| | `voice/SceneEditor` ← `components/SceneEditor` | 89% |
| | `pages/VoiceChannel` ← `pages/VoiceChannel` | 87% |
| Fundação (Fase 0) | `api/client`, `api/ws`, `crypto/identity` | 95–99% (lógica de domínio) |
| | `components/ui/index.tsx` | 25% |
| Shell/auth (Fase 1) | `shell/AppShell` | 20% |
| | `pages/Auth` | 41% |
| | `pages/Invite` | 61% |
| Admin (Fase 2) | `admin/ServerSettings` | 34% |
| | `admin/ChannelSettingsDialog` | 41% |
| | `admin/CreateChannelDialog`, `CreateServerDialog`, `InviteDialog` | 38–46% |
| Chat (Fase 3) | `pages/Channel` | 33% |
| | `chat/MessageBody`, `Attachments`, `Pickers` | 67–76% |
| | `chat/SearchPanel`, `Lightbox`, `NotificationsPanel` | 46–47% |

Leitura: a lógica de domínio (API, cripto, parsing) pode legitimamente ser a mesma. O que preocupa é a **camada de componentes de voz (87–97%)** e o fato de os componentes de chat, mesmo reescritos, terem sido modelados nos da v1 (67–76% em três deles).

## 4. Tabela por mockup

Legenda de origem: **N** = estrutura nova · **C** = estrutura copiada da v1 · **M** = mista.

| # | Mockup | Rota v2 | Fidelidade | Origem | Principais divergências |
|---|---|---|---|---|---|
| 1 | `autentica_o_e_registo` | `/auth` | Genérica | N | Um cartão central simples. Faltam: painel esquerdo com proposta de valor e cartões de recursos, prefixo `@` no handle, "Esqueceu o cofre?", botão "Criar uma nova conta", selo de protocolo, chips de topo (instância, E2EE, idioma, tema). Botão sem ícone, não em pílula. |
| 2 | `desbloqueio_de_conta_recupera_o_de_identidade` | `Auth.tsx` (modo Unlock) | Genérica **(DOM)** | N | Formulário com senha, Desbloquear, Recuperar identidade, Trocar conta. Faltam: painel lateral, cartão de identidade com avatar e sessão, aviso de enclave, secção "Recuperar identidade" com ações. "Mesa Bridge"/QR/seed 24 palavras são fora de escopo. |
| 3 | `convite_onboarding_de_convidado` | `/invite/:code` | Genérica | M (61%) | Só handle e senha. Faltam: cartão do servidor convidante (membros, histórico, mestre), campo "Nome de exibição", validação "Disponível", barra de força da senha, checkbox E2EE, rodapé de validade. |
| 4 | `shell_da_aplica_o_chat_de_texto` | shell + `#canal` | Genérica | N (shell) / M (chat 33%) | Topbar sem chip de E2EE, busca com Ctrl+K, alternador de tema em ícones, notificação com badge. Sem painel **Membros** à direita. Cabeçalho de canal só com título e subtítulo (faltam chip E2EE com hash, fixar, busca, membros). Sem cartão de boas-vindas ao canal nem banner de instância cifrada. Mensagens sem badges de papel nem layout de cartão. Sidebar sem seção de ferramentas. Roster de voz e controlos de chamada estão presentes (Fase 4). Dados/dados rolagem e "Mesa Rápida D20": fora de escopo. |
| 5 | `dropdown_de_notifica_es_e_busca_global` | busca e notificações | Genérica | M (46%) | Busca: campo único num popover, sem chips de escopo nem resultados com contexto cifrado. Notificações: painel com duas secções, sem abas (Todas/Menções/Cripto), sem ações "Responder / Ver canal", sem "marcar todas". |
| 6 | `lightbox_de_anexos_de_imagem_no_chat_geral` | `chat/Lightbox` | Parcial **(DOM)** | M (46%) | Tem anterior/seguinte, zoom, download, fechar. Falta: faixa de miniaturas com metadados, indicador de verificação, atalhos visíveis, "Enquadrar / 1:1". |
| 7 | `menu_de_conta_popover_modal_de_sair` | popover no painel do utilizador | Genérica | N | Popover com campo de nome, `<input type=file>` nativo, idioma e "Sair…". O mockup é um menu com ações e um modal de saída com explicação do bloqueio de cofre e opção de cache. Modal de saída da v2 é um diálogo simples. |
| 8 | `defini_es_do_servidor_vis_o_geral_e_boas_vindas` | `/servers/:id/settings` | Genérica | M (34%) | Abas simples + 3 cartões. Faltam: navegação lateral de configurações com seções, cabeçalho com chips (E2EE, "Acesso exclusivo do dono", host), campo de nome com contador, assinatura pública da guilda, pré-visualizar boas-vindas, zona crítica com confirmação por chave. Painéis de métricas (lançamentos de D20, armazenamento): fora de escopo. |
| 9 | `defini_es_do_servidor_membros` | `/settings/members` | Genérica | M | Busca + lista. Faltam: cartões de total/online/chaves, colunas Identidade/Cargo/Ações com seletor de cargo, silenciar, remover, filtro por cargo, "Convidar pessoas", paginação, rodapé de arquitetura. |
| 10 | `defini_es_do_servidor_cargos_e_permiss_es` | `/settings/roles` | Parcial | M (34%) | Duas colunas (lista + detalhe) como no mockup. Faltam: toggles (v2 usa checkbox), seletor de cor, barra de alterações por guardar, setas de ordem, matriz de membros, aviso de custódia, grupos com contador. |
| 11 | `modais_de_gest_o_de_canal` | `ChannelSettingsDialog` (abas Silenciar/Geral) | Parcial **(DOM)** | M (41%) | Função presente (silenciar, apagar). Mockup é par de modais com cabeçalho de risco, escopo do silenciamento, chips de duração, motivo, confirmação por nome do canal. Renomear não tem mockup. |
| 12 | `modal_criar_canal_de_voz_cust_dia_e2ee` | `CreateChannelDialog` | Genérica **(DOM)** | M (38%) | Tipo (abas), nome, visibilidade, custódia. Faltam: ícone no campo de nome, validação visual, cartões de visibilidade, bloco de custódia com chave e Copiar, rodapé de protocolo. |
| 13 | `modal_criar_servidor_cust_dia_e2ee` | `CreateServerDialog` | Genérica | M (46%) | Nome + chave + checkbox. Faltam: seletor de sigilo/ícone, contador de caracteres, título "Fundar uma Nova Mesa", gradiente de topo, nota de configuração padrão. |
| 14 | `di_logo_de_convidar_fluxo_encadeado_de_2_passos` | `InviteDialog` | Parcial | M (40%) | Lógica de 2 passos presente, mas dialog mínimo: sem indicador de passos, sem cartões de canal de boas-vindas, sem alternância de histórico, sem QR, sem opções de expiração, sem "Gerar outro convite". |
| 15 | `di_logo_inspecionar_acesso_efetivo_fator_a_fator` | aba "Inspecionar acesso" | Parcial **(DOM)** | M | Função presente. Falta a matriz P1/P2/P3 com veredito, cartões por fator e inspeção de chave (esta última fora de escopo). Há duas UX no design (§7.4 do TR) e nenhuma decisão foi registrada. |
| 16 | `di_logo_permiss_es_de_canal_acl_inspecionar_acesso` | `ChannelSettingsDialog` (aba Permissões) | Parcial | M (41%) | Abas, visibilidade e "adicionar regra" presentes. Faltam: cartões de visibilidade, rótulos numerados, lista de "regras ativas compiladas" com ícones/prioridade, cabeçalho com chips, rodapé de aviso de rotação. |
| 17 | `configura_es_de_conta_e_cofre_de_chaves_e2ee_mls` | — | Ausente | — | Fora de escopo (TR §7). |
| 18 | `configura_es_dispositivos_sess_es_autorizadas` | — | Ausente | — | Fora de escopo (TR §7). |
| 19 | `configura_es_minha_conta_perfil_soberano` | popover de conta | Ausente (parcial) | — | Só nome e avatar existem, dentro do popover. Perfil, status, bio, visibilidade P2P, credenciais: fora de escopo, mas não há página "Minha conta". |
| 20 | `configura_es_udio_v_deo` | — | Ausente | — | Parte é **dentro do escopo** (seletor de dispositivos e blur, mapeados na v1). A v2 só tem o menu de blur dentro da chamada; sem seleção de microfone/câmera/saída. |
| 21 | `pr_entrada_na_chamada_green_room_testar_v_deo` | canal de voz (não conectado) | Genérica | C (87%) | Cartão simples com área escura e dois botões. Faltam: pré-visualização 16:9 com blur, VU, controlos sobrepostos, painel de calibração de dispositivos, lista "No canal agora", três ações em cartões (Entrar / Testar vídeo / Só ouvir). "Entrar (ouvir)" só aparece para quem não pode falar. |
| 22 | `palco_de_voz_v_deo_composi_o_de_c_meras` | canal de voz, Composição | Parcial | C (87–97%) | Segmentos e banco presentes. Tiles de mesma densidade, sem selo "A falar" nem metadados de vídeo, sem seletor de cena, sem modo tela cheia, sem "Adicionar câmera". |
| 23 | `editor_de_cenas_de_composi_o_1` | editor de cena | Parcial | C (89%) | Slots, banco e seletor de layout presentes. Falta o inspetor do slot (fonte, proporção, borda de fala, sobreposições) — em parte fora de escopo (backlog) — e a barra de transição/pré-visualizar. |
| 24 | `editor_de_cenas_de_composi_o_2` | editor de cena | Parcial | C (89%) | Igual a 23 (variante com layout largo). |
| 25 | `visualiza_o_por_grade_1` | canal de voz, Grade | Parcial | C (97%) | Grade com glow de fala. Faltam: selo "A falar", resolução/fps, glifos de mic/câmera em cada tile, rodapé "Na escuta", "Compartilhar tela" e "Convidar" na barra. Níveis/CA/PV: fora de escopo. |
| 26 | `visualiza_o_por_grade_2` | idem | Parcial | C (97%) | Variante de 25. |
| 27 | `grade_com_compartilhamento_de_tela_1` | Grade + spotlight | Parcial | C (97%) | Partilha em destaque + faixa de câmaras (v2: faixa **inferior**; mockup: coluna **lateral**). Sem barra de zoom/laser/tela cheia (VTT-específica, fora de escopo). |
| 28 | `grade_com_compartilhamento_de_tela_2` | idem | Parcial | C (97%) | Variante de 27. |
| 29 | `chamada_de_voz_v_deo_em_pip_flutuante_mini_player` | `FloatingVoicePip` | Parcial | C (95%) | Mini-player arrastável com nome, duração, até 4 câmaras, "Voltar ao palco" e terminar. Mockup tem mais: botões de mic/surdo/câmera/ecrã, selo de fala por tile, expandir/minimizar, rodapé de E2EE. A spec da Fase 4 pede só voltar+terminar, então a diferença é de acabamento. |
| 30 | `sistema_de_design_tokens_componentes_guia_de_ui` | `components/ui`, `styles.css` | Parcial | N | Tokens de cor/tipo/raio adotados. Componentes básicos (Button, Dialog, Switch…) existem, mas o guia mostra variantes mais ricas (chips mono, badges de estado, cartões de custódia). |
| 31 | `mesa_logo` | — | Ausente | — | A marca não é usada; há um "M" em quadrado como placeholder. |
| — | `campfire_modernism/DESIGN.md` | — | n/a | — | Fonte dos tokens. |
| — | `high_quality_...battle_map...` | — | n/a | — | Imagem de conteúdo. |

Contagem dos 31 itens: **15 parciais** (6, 10, 11, 14, 15, 16, 22–30), **11 genéricas** (1–5, 7–9, 12, 13, 21), **5 ausentes** (17–20, 31), **0 fiéis**. Várias linhas são variantes do mesmo mockup (23/24, 25/26, 27/28); por tela distinta são 9 parciais.

## 5. Padrões transversais

1. **Cabeçalho global (topbar).** Todos os mockups de produto trazem: logo, instância com versão, chip de E2EE com hash/epoch, busca com atalho, alternador de tema (3 ícones), notificações com badge, avatar. A v2 tem marca em texto, rótulo da instância, "Pesquisar", "Notificações" e um select de tema.
2. **Camada técnica em fonte mono.** Rótulos pequenos (IDs, hashes, estados "Online", "Ativo & Sincronizado") são parte da identidade. A v2 praticamente não os tem.
3. **Cartões e secções.** Os mockups organizam tudo em cartões com cabeçalho (ícone + rótulo em caixa alta + título). A v2 usa campos soltos e `fieldset`.
4. **Chips de estado.** E2EE, "AO VIVO", "Mudo", "Falando", papéis. Na v2 existem só os de E2EE e presença básica.
5. **Controles.** Mockups: toggles, botões em pílula com ícone, seletores segmentados. V2: checkboxes nativos, botões retangulares, `<input type=file>` nativo no popover de conta.
6. **Barras laterais e navegação interna de Configurações.** O mockup tem sidebar própria de configurações (Servidor/Papéis/Pessoas/Zona crítica). A v2 usa abas horizontais.
7. **Imagens.** Os mockups mostram avatares e miniaturas reais; a v2 usa iniciais.
8. **Responsivo e modo claro.** Sem mockup (TR §8.5). Não auditado aqui.

## 6. Itens fora de escopo que aparecem nos mockups

Para evitar "corrigir" o que não deve ser implementado: rolagem de dados e bandeja de dados, MLS/ratchet/epochs, semente BIP-39, QR/Mesa Bridge, múltiplos dispositivos, Passkeys, métricas de rede (RTT, jitter), RNNoise/AEC/AGC, seletor de codec, nível/CA/PV de personagem nos tiles, VTT/Tabuleiro Tático, inspetor de slot com proporção e sobreposições, diretório/bio/badges.

## 7. Ordem sugerida para refazer

Critério: maior distância do mockup × maior exposição ao utilizador × menor dependência.

1. **Shell e topbar** (4, 7). É o que aparece em todas as telas e destrava as demais. Inclui painel de Membros, cabeçalho de canal, cartão de boas-vindas, banner de instância, menu de conta e modal de saída.
2. **Auth, desbloqueio e convite** (1, 2, 3). Primeira impressão; layouts de duas colunas bem definidos.
3. **Voz/vídeo** (21–29). Reescrever interface **e** a camada de mídia (hoje 87–97% v1): green room, palco, grade, spotlight, PiP e editor de cena, a partir dos mockups.
4. **Chat** (4, 5, 6). Mensagens com badges, notificações com abas, busca com contexto, lightbox com miniaturas.
5. **Admin** (8–16). Configurações com sidebar própria, membros em tabela, cargos com toggles/cor/barra de alterações, convite em duas etapas, modais de canal.
6. **Telas ausentes dentro do escopo** (20, 19 parcial): Áudio & Vídeo (seleção de dispositivos + blur) e uma página mínima de conta.
7. **Marca** (31): aplicar o logo.

## 8. Decisões pendentes que bloqueiam trabalho

- Qual UX é canônica para "inspecionar acesso" (diálogo 15 vs. aba 16)? (TR §7.4)
- As telas 17–19 e partes de 20 continuam fora de escopo? (TR §10, pergunta 1)
- O `design.md` da Fase 4 (D1) autoriza portar a v1 "quase 1:1". Para a interface isso precisa ser revogado, mantendo a regra só para a lógica de LiveKit/E2EE.
- As `tasks.md` hoje verificam comportamento ("o botão existe"). Precisam de um critério de fidelidade visual por tela (comparação lado a lado com o `screen.png`), senão a regressão para UI genérica se repete.

## 9. Reavaliação final (`frontend-v2-polish-cutover`, 2026-10-02)

Protocolo de `docs/v2/fidelity-protocol.md` aplicado às 31 entradas do §4. Método: cada tela em escopo foi capturada de novo na v2 atual (tema escuro, pt-BR, janela de 1440×900, backend descartável com duas contas e uma chamada em curso) e comparada lado a lado com o `screen.png` do mockup, contra a lista de elementos obrigatórios que cada fase registou no seu `verification.md` (`openspec/changes/archive/`). As capturas estão em `docs/v2/fidelity/frontend-v2-polish-cutover/`. As capturas de cada fase ficam como registo detalhado. Esta passagem serve para confirmar que nada regrediu desde o fecho de cada fase (efeitos sonoros, ajustes de contraste e alvos de toque desta fase, remoção do `admin.css`).

Resultado: **26 telas em escopo, todas Fiel; 5 entradas fora de escopo ou excluídas, justificadas. Nenhuma Parcial ou Genérica.**

| # | Mockup | Classificação | Registo |
|---|---|---|---|
| 1 | `autentica_o_e_registo` | Fiel | `login.jpg`, `register.jpg`; auth-shell 9.1 |
| 2 | `desbloqueio_de_conta_recupera_o` | Fiel | auth-shell 9.2 (três estados) |
| 3 | `convite_onboarding_de_convidado` | Fiel | `invite-onboarding.jpg`; server-admin 7.7 |
| 4 | `shell_da_aplica_o_chat_de_texto` | Fiel | `shell-chat.jpg`; text-chat |
| 5 | `dropdown_de_notifica_es_e_busca_global` | Fiel | `search.jpg`, `notifications.jpg`; text-chat |
| 6 | `lightbox_de_anexos_de_imagem` | Fiel | `lightbox.jpg`; text-chat |
| 7 | `menu_de_conta_popover_modal_de_sair` | Fiel | `account-menu.jpg`, `signout.jpg`; auth-shell 9.4 |
| 8 | `defini_es_do_servidor_vis_o_geral` | Fiel | `settings-overview.jpg`; server-admin 7.3 |
| 9 | `defini_es_do_servidor_membros` | Fiel | `settings-members.jpg`; server-admin 7.4 |
| 10 | `defini_es_do_servidor_cargos` | Fiel | `settings-roles.jpg`; server-admin 7.4 |
| 11 | `modais_de_gest_o_de_canal` | Fiel | server-admin 7.6 |
| 12 | `modal_criar_canal_de_voz` | Fiel | `create-channel.jpg`; server-admin 7.2 |
| 13 | `modal_criar_servidor` | Fiel | `create-server.jpg`; server-admin 7.1 |
| 14 | `di_logo_de_convidar` | Fiel | `invite-1.jpg`; server-admin 7.7 |
| 15 | `di_logo_inspecionar_acesso` | Fiel | server-admin 7.5 |
| 16 | `di_logo_permiss_es_de_canal_acl` | Fiel | `channel-settings.jpg`; server-admin 7.5 |
| 17 | `configura_es_de_conta_e_cofre_de_chaves_e2ee_mls` | Fora de escopo | TR §7 (MLS, cofre MLS) |
| 18 | `configura_es_dispositivos_sess_es` | Fora de escopo | TR §7 (multidispositivo) |
| 19 | `configura_es_minha_conta_perfil_soberano` | Fiel no subconjunto em escopo | `account.jpg`; nome, avatar e idioma. Perfil estendido, bio e P2P excluídos (§6) |
| 20 | `configura_es_udio_v_deo` | Fiel no subconjunto em escopo | `av-settings.jpg`; voice-video 10.4 |
| 21 | `pr_entrada_na_chamada_green_room` | Fiel | `green-room.jpg`; voice-video |
| 22 | `palco_de_voz_v_deo_composi_o` | Fiel | `stage.jpg`; voice-video |
| 23 | `editor_de_cenas_de_composi_o_1` | Fiel | `editor.jpg`; voice-video |
| 24 | `editor_de_cenas_de_composi_o_2` | Fiel | `editor.jpg`; voice-video |
| 25 | `visualiza_o_por_grade_1` | Fiel | `grid.jpg`; voice-video |
| 26 | `visualiza_o_por_grade_2` | Fiel | `grid.jpg`; voice-video |
| 27 | `grade_com_compartilhamento_de_tela_1` | Fiel | voice-video (`grade-share-1280.png`) |
| 28 | `grade_com_compartilhamento_de_tela_2` | Fiel | voice-video (`grade-share-1600.png`) |
| 29 | `chamada_de_voz_v_deo_em_pip` | Fiel | `pip.jpg`; voice-video |
| 30 | `sistema_de_design_tokens_componentes` | Fiel | `foundation.jpg`; foundation 10.2 |
| 31 | `mesa_logo` | Fiel | logo em autenticação, convite, cabeçalho, barra de servidores e estado inicial |

Notas:
- As telas 27 e 28 (partilha de ecrã) não foram recapturadas: o Chromium de teste não partilha ecrã. Valem a captura e a verificação da fase de voz.
- O shell (menu lateral, painel Membros) é o da v2 e não o dos mockups, como já registado em voice-video. Os elementos excluídos (§6) estão ausentes em todas as capturas.
- Modo claro e viewport <768 px (tarefa 4A.5): as telas Fiel foram revistas nas duas variantes (ver `docs/v2/closing-report.md`). Nenhum elemento obrigatório foi removido nem nenhum excluído foi reintroduzido; só se ajustaram cores de tokens (contraste), alvos de toque e o cabeçalho de autenticação em mobile.

## 10. Change `password-recovery` (2026-10-08)

Verificação no navegador (Claude em Chrome, backend/BD descartáveis) do fluxo completo de recuperação de senha, como exige a spec `frontend-v2/auth` (requisito "Ecrãs de autenticação fiéis aos mockups").

- **#1 `autentica_o_e_registo`** continua **Fiel**, com um único desvio ao mockup, já previsto no `design.md` D10 e confirmado nesta verificação: o link que no mockup diz "Esqueceu o cofre?" passa a **"Esqueci a senha"** e abre `/recover` (antes só explicava o desbloqueio; agora recupera de facto). Nenhum outro elemento obrigatório do mockup (painel esquerdo, controlo segmentado, prefixo `@`, separador, acção secundária) foi alterado ou removido.
- **#2 `desbloqueio_de_conta_recupera_o`** continua **Fiel**; a acção "Recuperar identidade" está sempre visível (não condicional a tentativa falhada) e o texto de aviso foi corrigido (tarefa 6.4) para não afirmar perda total do histórico.
- **`/recover`** (ecrã público "Esqueci a senha", ambos os caminhos — código do operador e chave de recuperação) não tem mockup: classificado **Adaptado**, construído só com componentes e tokens do sistema de design existente (`AuthFrame`, `AuthField`, `Segmented`, `Button`, `Icon`), seguindo o mesmo layout de duas colunas dos ecrãs de autenticação.
- **Passo de chave de recuperação no registo** (`RecoverySetup`, usado em `Auth.tsx` e `Invite.tsx`) também não tem mockup: classificado **Adaptado**, mesmo padrão de `fieldset`/`Card` e botões já usados nos restantes formulários de auth/conta.

Capturado ao vivo nesta verificação: `/auth` com o link "Esqueci a senha"; `/recover` nos dois caminhos (código e chave), incluindo o aviso de identidade nova e os erros genéricos/429; registo e aceitação de convite com "criar agora" (código mostrado uma vez, confirmação "guardei" obrigatória antes do POST); ecrã de desbloqueio com o aviso corrigido. Ver `openspec/changes/password-recovery/tasks.md` tarefas 6.6 e 7.9 para o percurso completo testado.
