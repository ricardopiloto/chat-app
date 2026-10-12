# Reauditoria visual (`visual-parity-full-reaudit`, 2026-10-12)

Protocolo de `docs/v2/fidelity-protocol.md`. Tema escuro, pt-BR, janela 1440×900, backend descartável em SQLite. A forma do glifo segue Lucide (`frontend-icons-lucide-svg`): a diferença face aos Material Symbols do mockup não conta como deriva.

`AUDIT-fidelity.md` fica como histórico (reavaliação de 2026-10-02). Este ficheiro é o registo mais recente.

## Derivas corrigidas

| Elemento | Mockup | v2 antes | v2 agora |
|---|---|---|---|
| Botão "Pesquisar ou pular…" | `rounded-lg` = 8px | pílula | 8px (`rounded`), medido |
| Painel de pesquisa | `rounded-2xl` = 16px (o config do mockup não redefine `2xl`) | 24px (`--radius-xl`) | 16px (`--radius-lg`), medido |
| Painel de notificações | `rounded-2xl` = 16px | 24px | 16px (`--radius-lg`), medido |
| Alternador de tema, contentor | `rounded-lg` = 8px | pílula | 8px, medido |
| Alternador de tema, botões | `rounded` = 4px | pílula | 4px, medido |
| Nome no painel fixo | `text-on-surface` (`#e0e2ef`) | herdado, o mesmo valor | `text-on-surface`, medido `rgb(224, 226, 239)` |
| Identificador no painel fixo | `text-secondary` | `on-surface-variant` | `text-secondary`, medido `rgb(107, 220, 150)` |
| "No banco" | ícone `airline_seat_recline_extra`, 16px, `outline` | só texto | ícone Lucide (poltrona), `text-[16px] text-outline` |

O mockup do nome é a barra fixa em `mesa_menu_de_conta_popover_modal_de_sair` (`text-on-surface` no nome, `text-secondary` no identificador).

## Comportamento

Pesquisa (Ctrl+K / evento da barra), notificações, menu da conta e o alternador de tema abrem e fecham como antes. A pré-entrada da chamada de voz abre. Não se entrou numa chamada em curso: o LiveKit não estava a correr, por isso o palco, a grade, a partilha e o mini-player não foram recapturados. O ícone do banco está no componente do palco.

## Tabela

| Tela | Mockup | Captura | Classificação | Data |
|---|---|---|---|---|
| 1 autenticação | `mesa_autentica_o_e_registo_login_criar_conta` | `01-login.png`, `02-register.png` | Fiel | 2026-10-12 |
| 2 desbloqueio | `mesa_desbloqueio_de_conta_recupera_o_de_identidade` | `02-unlock.png` | Fiel | 2026-10-12 |
| 3 convite | `mesa_convite_onboarding_de_convidado` | não recapturado; sem deriva nova de token | Fiel | 2026-10-12 |
| 4 shell e chat | `mesa_shell_da_aplica_o_chat_de_texto` | `04-shell-chat.png`, `03-home.png` | Fiel | 2026-10-12 |
| 5 pesquisa e notificações | `mesa_dropdown_de_notifica_es_e_busca_global` | `05-search.png`, `06-notifications.png` | Fiel | 2026-10-12 |
| 6 lightbox | `mesa_lightbox_de_anexos_de_imagem_no_chat_geral` | não recapturado; sem deriva nova de token | Fiel | 2026-10-12 |
| 7 menu de conta | `mesa_menu_de_conta_popover_modal_de_sair` | `07-account-menu.png` | Fiel | 2026-10-12 |
| 8 definições, visão geral | `mesa_defini_es_do_servidor_vis_o_geral_e_boas_vindas` | `08-settings.png` | Fiel | 2026-10-12 |
| 9 membros | `mesa_defini_es_do_servidor_membros` | `09-members.png` | Fiel | 2026-10-12 |
| 10 cargos | `mesa_defini_es_do_servidor_cargos_e_permiss_es` | `10-roles.png` | Fiel | 2026-10-12 |
| 11 gestão de canal | `mesa_modais_de_gest_o_de_canal` | não recapturado; sem deriva nova de token | Fiel | 2026-10-12 |
| 12 criar canal | `mesa_modal_criar_canal_de_voz_cust_dia_e2ee` | não recapturado; sem deriva nova de token | Fiel | 2026-10-12 |
| 13 criar servidor | `mesa_modal_criar_servidor_cust_dia_e2ee` | `13-create-server.png` | Fiel | 2026-10-12 |
| 14 convidar | `mesa_di_logo_de_convidar_fluxo_encadeado_de_2_passos` | não recapturado; sem deriva nova de token | Fiel | 2026-10-12 |
| 15 inspecionar acesso | `mesa_di_logo_inspecionar_acesso_efetivo_fator_a_fator` | não recapturado; sem deriva nova de token | Fiel | 2026-10-12 |
| 16 permissões de canal | `mesa_di_logo_permiss_es_de_canal_acl_inspecionar_acesso` | não recapturado; sem deriva nova de token | Fiel | 2026-10-12 |
| 17 cofre MLS | — | — | Fora de escopo | 2026-10-12 |
| 18 dispositivos | — | — | Fora de escopo | 2026-10-12 |
| 19 a minha conta | `mesa_configura_es_minha_conta_perfil_soberano` | `11-account.png` | Fiel no subconjunto em escopo | 2026-10-12 |
| 20 áudio e vídeo | `mesa_configura_es_udio_v_deo` | coberto pela pré-entrada `12-voice.png` | Fiel no subconjunto em escopo | 2026-10-12 |
| 21 pré-entrada | `mesa_pr_entrada_na_chamada_green_room_testar_v_deo` | `12-voice.png` | Fiel | 2026-10-12 |
| 22 composição | `mesa_palco_de_voz_v_deo_composi_o_de_c_meras` | ícone do banco no código; palco não recapturado (sem LiveKit) | Fiel | 2026-10-12 |
| 23 editor de cenas 1 | `mesa_editor_de_cenas_de_composi_o_1` | não recapturado; sem deriva nova de token | Fiel | 2026-10-12 |
| 24 editor de cenas 2 | `mesa_editor_de_cenas_de_composi_o_2` | não recapturado; sem deriva nova de token | Fiel | 2026-10-12 |
| 25 grade 1 | `mesa_visualiza_o_por_grade_1` | não recapturado; sem deriva nova de token | Fiel | 2026-10-12 |
| 26 grade 2 | `mesa_visualiza_o_por_grade_2` | não recapturado; sem deriva nova de token | Fiel | 2026-10-12 |
| 27 partilha 1 | `mesa_grade_com_compartilhamento_de_tela_1` | não recapturado; sem deriva nova de token | Fiel | 2026-10-12 |
| 28 partilha 2 | `mesa_grade_com_compartilhamento_de_tela_2` | não recapturado; sem deriva nova de token | Fiel | 2026-10-12 |
| 29 mini-player | `mesa_chamada_de_voz_v_deo_em_pip_flutuante_mini_player` | não recapturado; sem deriva nova de token | Fiel | 2026-10-12 |
| 30 fundação | `mesa_sistema_de_design_tokens_componentes_guia_de_ui` | `14-foundation.png` | Fiel | 2026-10-12 |
| 31 logótipo | `mesa_logo` | visível em `01-login.png`, `03-home.png`, `04-shell-chat.png` | Fiel | 2026-10-12 |

Excluídos ausentes (dados, D20, MLS): sim.
