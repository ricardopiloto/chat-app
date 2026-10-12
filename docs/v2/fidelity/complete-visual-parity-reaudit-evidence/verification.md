# Reauditoria visual com evidência — complete-visual-parity-reaudit-evidence

Registo novo. O relatório de `2026-10-12-visual-parity-full-reaudit` fica histórico e não é reescrito.

Protocolo: `docs/v2/fidelity-protocol.md`. Tema escuro, pt-BR, zoom 100%. Cada captura usa a largura do `screen.png` da entrada. Uma entrada só pode ser **Fiel** com captura desta sessão, tabela `Elemento | Mockup | v2 | Observação` e, se houve correcção, nova captura. Sem captura, ou chamada ao vivo bloqueada, a classificação é **Não verificada**.

Entradas 17 e 18 ficam fora de escopo (AUDIT §6 / TR §7: cofre MLS e dispositivos). Não entram na aceitação.

## Estado do código nesta sessão

Comparação contra o código presente no worktree, incluindo alterações ainda não commitadas (convite HTTPS, glifo `group` de três pessoas, popout sem áudio do viewer). A change `user-panel-identity-parity` não estava aplicada no início. A faixa em repouso foi medida nesse código e depois alinhada ao rodapé do shell (secção 7).

Ambiente desta sessão: `HEAD` `97f2a02` mais o worktree não commitado. Backend descartável em `127.0.0.1:8080` (`sqlite:///tmp/mesa-parity-evidence.db`), Vite em `https://127.0.0.1:1421`, LiveKit já a escutar em `7880` (o socket Docker não está acessível a este utilizador; `GET /` responde `OK`). Chromium headless, `deviceScaleFactor` 1, `prefers-color-scheme: dark`, `pt-BR`. Conta `mesa_evidence`, servidor `Valenforge`. A primeira captura, `01-login.png`, mede 1280×958, a mesma largura e altura de `mesa_autentica_o_e_registo_login_criar_conta/screen.png`.

## Matriz

| # | Mockup | Rota / estado exigido | Largura | Exclusão | Captura | Classificação |
|---|---|---|---|---|---|---|
| 1 | `mesa_autentica_o_e_registo_login_criar_conta` | login; registo | 1280 | — | `01-login.png`, `01-register.png` (1280×958) | Fiel |
| 2 | `mesa_desbloqueio_de_conta_recupera_o_de_identidade` | cofre remoto; sem cofre; senha errada | 1600 | Mesa Bridge, QR, semente de 24 palavras | `02-remote-vault.png`, `02-missing-vault.png`, `02-bad-password.png` (1600×1294) | Fiel |
| 3 | `mesa_convite_onboarding_de_convidado` | aceitar convite | 1600 | — | `03-invite.png` (1600×1280) | Parcial |
| 4 | `mesa_shell_da_aplica_o_chat_de_texto` | shell com canal de texto | 1600 | bandeja de dados, VTT, fixar | `04-shell.png`, `04-shell-away.png`, `04-shell-attachment.png` (1600×1540) | Fiel |
| 5 | `mesa_dropdown_de_notifica_es_e_busca_global` | busca; notificações | 1600 | — | `05-search.png`, `05-notifications.png` | em aberto |
| 6 | `mesa_lightbox_de_anexos_de_imagem_no_chat_geral` | lightbox aberto | 1600 | — | `06-lightbox.png` (1600×1280) | Fiel |
| 7 | `mesa_menu_de_conta_popover_modal_de_sair` | menu de conta; modal de saída | 1600 | cache encriptada no logout | `07-account-menu.png`, `07-signout.png` (1600×1280) | Fiel |
| 8 | `mesa_defini_es_do_servidor_vis_o_geral_e_boas_vindas` | visão geral | 1549 | métricas de D20 e armazenamento | `08-overview.png` (1549×1600) | Fiel |
| 9 | `mesa_defini_es_do_servidor_membros` | membros | 1600 | — | `09-members.png` (1600×1280) | Fiel |
| 10 | `mesa_defini_es_do_servidor_cargos_e_permiss_es` | cargos | 1027 | — | `10-roles.png` (1027×1600) | Fiel |
| 11 | `mesa_modais_de_gest_o_de_canal` | silenciar; apagar | 1600 | — | | |
| 12 | `mesa_modal_criar_canal_de_voz_cust_dia_e2ee` | criar canal de voz | 1280 | — | | |
| 13 | `mesa_modal_criar_servidor_cust_dia_e2ee` | criar servidor | 1600 | rótulo MLS na chave | `13-create-server.png` (1600×1280) | Fiel |
| 14 | `mesa_di_logo_de_convidar_fluxo_encadeado_de_2_passos` | passo do canal; passo do link | 1600 | — | `14-invite-1.png` (passo 2, 1600×1468) | em aberto |
| 15 | `mesa_di_logo_inspecionar_acesso_efetivo_fator_a_fator` | inspecionar acesso | 1503 | inspeção de chave | | |
| 16 | `mesa_di_logo_permiss_es_de_canal_acl_inspecionar_acesso` | permissões do canal | 1600 | — | | |
| 17 | `mesa_configura_es_de_conta_e_cofre_de_chaves_e2ee_mls` | — | 1258 | fora de escopo | — | Fora de escopo |
| 18 | `mesa_configura_es_dispositivos_sess_es_autorizadas` | — | 1033 | fora de escopo | — | Fora de escopo |
| 19 | `mesa_configura_es_minha_conta_perfil_soberano` | minha conta (nome, avatar, idioma) | 1254 | bio, visibilidade P2P, perfil estendido | | |
| 20 | `mesa_configura_es_udio_v_deo` | definições de áudio e vídeo | 968 | RNNoise, AEC, AGC, codec, métricas de rede | | |
| 21 | `mesa_pr_entrada_na_chamada_green_room_testar_v_deo` | green room, antes de entrar | 1600 | não substitui 20 nem 22–29 | | |
| 22 | `mesa_palco_de_voz_v_deo_composi_o_de_c_meras` | composição ao vivo, ícone do banco | 1486 | — | | |
| 23 | `mesa_editor_de_cenas_de_composi_o_1` | editor, layout estreito | 1280 | inspetor de slot (proporção, sobreposições) | | |
| 24 | `mesa_editor_de_cenas_de_composi_o_2` | editor, layout largo | 1600 | idem 23 | | |
| 25 | `mesa_visualiza_o_por_grade_1` | grade | 1280 | nível, CA, PV | | |
| 26 | `mesa_visualiza_o_por_grade_2` | grade, variante larga | 1600 | idem 25 | | |
| 27 | `mesa_grade_com_compartilhamento_de_tela_1` | partilha em destaque | 1280 | zoom, laser, VTT | | |
| 28 | `mesa_grade_com_compartilhamento_de_tela_2` | partilha, variante larga | 1600 | idem 27 | | |
| 29 | `mesa_chamada_de_voz_v_deo_em_pip_flutuante_mini_player` | mini-player | 1600 | — | | |
| 30 | `mesa_sistema_de_design_tokens_componentes_guia_de_ui` | `/__foundation` | 1280 | — | `30-foundation.png` (1280×1600, topo) | em aberto |
| 31 | `mesa_logo` | marca no login e no shell | 1024 | — | | |

As secções abaixo recebem a captura, a tabela e a classificação. Ficam vazias até a evidência existir.

## 1. Autenticação

Estados: login (`01-login.png`); criar conta (`01-register.png`). Ambos 1280×958. Referência: `docs/v2/mesa_autentica_o_e_registo_login_criar_conta/screen.png`.

| Elemento | Mockup | v2 | Observação |
|---|---|---|---|
| Painel esquerdo com marca, proposta, três cartões e rodapé | presente | presente | |
| Abas Entrar / Criar conta | presente | presente | |
| Handle com prefixo `@` e exemplo | presente | presente | |
| Senha e chave mestra, com visibilidade | presente | presente | |
| Ligação do cofre | presente | presente | A spec já fixa o texto «Esqueci a senha» |
| Botão primário em pílula com ícone | presente | presente | |
| Separador «ou» e acção de criar conta | presente | presente | |
| Selo de protocolo | presente | presente | NaCl box · Argon2id / AES-256-GCM. O Double Ratchet do mockup está excluído |
| Chips de topo (instância, E2EE, idioma, tema) | presente | presente | Tema em três ícones |
| Simulador de estado | excluído | ausente | |
| Excluídos ausentes | sim | sim | |

Classificação: **Fiel** (2026-10-12).

## 2. Desbloqueio

Estados, todos a 1600×1294: cofre remoto (`02-remote-vault.png`, chip «cofre local em falta»), sem cofre (`02-missing-vault.png`, aviso de que não há cofre no navegador nem no servidor), senha errada (`02-bad-password.png`). Referência: `docs/v2/mesa_desbloqueio_de_conta_recupera_o_de_identidade/screen.png`.

| Elemento | Mockup | v2 | Observação |
|---|---|---|---|
| Painel esquerdo | presente | presente | |
| Chip de sessão e cofre | presente | presente | «Bloqueado» com cofre local; «em falta» sem cópia local |
| Cartão de identidade e Trocar de conta | presente | presente | |
| Aviso de enclave e campo de senha com visibilidade | presente | presente | |
| Desbloquear, separador e Recuperar identidade | presente | presente | |
| Trocar de conta no rodapé | presente | presente | |
| Mesa Bridge, QR, semente de 24 palavras | excluído | ausente | |
| Excluídos ausentes | sim | sim | |

Classificação: **Fiel** (2026-10-12).

## 3. Convite

`03-invite.png`, 1600×1280, numa sessão sem conta. Referência: `docs/v2/mesa_convite_onboarding_de_convidado/screen.png`.

| Elemento | Mockup | v2 | Observação |
|---|---|---|---|
| Cartão do servidor, histórico e nome | presente | presente | Valenforge, selo Histórico |
| Validade do convite | presente | ausente | `InvitePreview` não traz `expires_at`; não é uma correcção de token |
| Handle, nome de exibição e senha com força | presente | presente | «Disponível» aparece depois de escrever o handle |
| Checkbox do cofre e Aceitar convite | presente | presente | |
| Ligação para quem já tem conta | presente | presente | |
| Excluídos ausentes | sim | sim | |

Classificação: **Parcial** (2026-10-12).

## 4. Shell e chat

Estado capturado: canal `#geral` com uma mensagem (`04-shell.png`, 1600×1540). Referência: `docs/v2/mesa_shell_da_aplica_o_chat_de_texto/screen.png`. Citação, menção, anexo, pré-visualização de link e a pílula «Saltar para o presente» ainda não foram reproduzidos neste estado, por isso a entrada não fecha.

| Elemento | Mockup | v2 | Observação |
|---|---|---|---|
| Topbar (logo, instância, E2EE, busca com atalho, tema em três ícones, notificações, avatar) | presente | presente | |
| Rail, sidebar (texto e voz, convidar, definições) e painel de membros | presente | presente | |
| Cabeçalho do canal, boas-vindas, banner cifrado | presente | presente | O hash da chave está fora de escopo |
| Separador de dia, mensagem com avatar, handle, badge de cargo e hora | presente | presente | Badge «DONO» |
| Composer (anexar, emoji, enviar, rodapé Enter / Shift+Enter) | presente | presente | |
| Citação, menção e pré-visualização de link | presente | presente | `04-shell.png` |
| Anexo com nome, tamanho e «cifrado no cliente» | presente | presente | `04-shell-attachment.png` |
| Pílula «Saltar para o presente» | presente | presente | `04-shell-away.png`, depois de afastar o scroll |
| Bandeja de dados, VTT, fixar | excluído | ausente | |
| Faixa de identidade em repouso | presente | presente | Ver secção 7 |
| Excluídos ausentes | sim | sim | |

Classificação: **Fiel** (2026-10-12).

## 5. Busca e notificações

Busca com resultado (`05-search.png`, 1600×1280). Notificações só no estado vazio (`05-notifications.png`).

| Elemento | Mockup | v2 | Observação |
|---|---|---|---|
| Campo, escopos e chip de canal | presente | presente | |
| Resultado com avatar, handle, canal, hora e termo destacado | presente | presente | «catacumbas» |
| Rodapé com contagem e atalhos | presente | presente | |
| Abas Todas / Menções e respostas / Canais com novidade | presente | presente | Aba Cripto excluída |
| Cartões com Responder, Ver canal e Limpar | presente | não capturado | Não havia notificações para mostrar |
| Excluídos ausentes | sim | sim | |

Classificação: em aberto até uma notificação real.

## 6. Lightbox

`06-lightbox.png`, 1600×1280, com dois anexos na mesma mensagem. Referência: `docs/v2/mesa_lightbox_de_anexos_de_imagem_no_chat_geral/screen.png`.

| Elemento | Mockup | v2 | Observação |
|---|---|---|---|
| Metadados, verificação, zoom, Enquadrar e 1:1 | presente | presente | |
| Descarregar e Fechar com Esc | presente | presente | |
| Setas anterior/seguinte | presente | presente | Visíveis com dois anexos |
| Faixa «Anexo n de m» e atalhos | presente | presente | |
| Excluídos ausentes | sim | sim | |

Classificação: **Fiel** (2026-10-12).

## 7. Menu de conta e saída

Menu: `07-account-menu.png`. Saída: `07-signout.png`. Ambos 1600×1280.

A faixa em repouso foi medida antes da correcção: handle `text-secondary` (`rgb(107, 220, 150)`), nome `strong` 14 px, avatar 40 px, botão tune 36 px circular. O rodapé do shell (`code.html`, bloco antes de `</aside>`) pede handle `text-on-surface-variant`, nome 12 px peso 400, avatar 32 px e tune com ícone de 18 px. Essa cor verde pertence ao mockup do menu, não ao rodapé. `UserPanel.tsx` passou a usar os tokens do rodapé. Na recaptura do shell: handle `rgb(219, 193, 186)`, nome 12 px / peso 400, avatar 32 px, tune 30 px, presença 10 px com anel `rgb(11, 14, 23)` (`surface-container-lowest`).

| Elemento | Mockup | v2 | Observação |
|---|---|---|---|
| Menu com Minha conta, idioma, tema e Sair | presente | presente | Sem `<input type=file>` |
| Modal com ícone, explicação do cofre, Cancelar (Esc) e confirmar com ícone | presente | presente | |
| Opção de cache encriptada | excluído | ausente | |
| Faixa em repouso (nome, handle, avatar, tune) | presente | presente | Cor do handle é `on-surface-variant`, não a do menu |
| Excluídos ausentes | sim | sim | |

Classificação do menu e do modal: **Fiel** (2026-10-12).

## 8. Definições — visão geral

`08-overview.png`, 1549×1600.

| Elemento | Mockup | v2 | Observação |
|---|---|---|---|
| Sidebar, breadcrumb e chips E2EE / acesso do dono | presente | presente | |
| Imagem, nome com contador | presente | presente | 10 / 32 |
| Boas-vindas: canal, modelo, pré-visualizar, guardar | presente | presente | A variável real é `{nome}` |
| Zona crítica com confirmação pelo nome | presente | presente | |
| Métricas de D20 e armazenamento | excluído | ausente | |
| Excluídos ausentes | sim | sim | |

Classificação: **Fiel** (2026-10-12).

## 9. Definições — membros

`09-members.png`, 1600×1280.

| Elemento | Mockup | v2 | Observação |
|---|---|---|---|
| Cartões Total e Online, filtro e cargo | presente | presente | |
| Convidar pessoas | presente | presente | |
| Tabela identidade / cargo / ações, dono sem controlos | presente | presente | |
| Paginação e rodapé | presente | presente | |
| Excluídos ausentes | sim | sim | |

Classificação: **Fiel** (2026-10-12).

## 10. Definições — cargos

`10-roles.png`, 1027×1600. A página tem 12 interruptores (`role=switch`).

| Elemento | Mockup | v2 | Observação |
|---|---|---|---|
| Criar cargo, lista e cargo de sistema só de leitura | presente | presente | |
| Interruptores agrupados com contagem | presente | presente | |
| Matriz de membros e aviso de custódia | presente | presente | |
| Excluídos ausentes | sim | sim | |

Classificação: **Fiel** (2026-10-12).

## 11. Gestão de canal

Estados: silenciar; apagar.

| Elemento | Mockup | v2 | Observação |
|---|---|---|---|

Classificação:

## 12. Criar canal de voz

| Elemento | Mockup | v2 | Observação |
|---|---|---|---|

Classificação:

## 13. Criar servidor

`13-create-server.png`, 1600×1280. O botão Criar estava desactivado com a caixa por marcar.

| Elemento | Mockup | v2 | Observação |
|---|---|---|---|
| Eyebrow, título e gradiente | presente | presente | |
| Sigilo / ícone e nome com contador | presente | presente | |
| Chave com Copiar e caixa inicialmente desmarcada | presente | presente | O selo diz «gerada neste dispositivo». «MLS Semente» está excluído |
| Cancelar, Criar e nota da configuração padrão | presente | presente | |
| Excluídos ausentes | sim | sim | |

Classificação: **Fiel** (2026-10-12).

## 14. Convidar

`14-invite-1.png` é o passo 2, 1600×1468. O passo 1 não abre quando o servidor já tem `#geral`: o diálogo gera o link directo. A origem do link é `https://localhost:1421`, não `mesa://`.

| Elemento | Mockup | v2 | Observação |
|---|---|---|---|
| Indicador 01 / 02 | presente | presente | |
| Cartões de canal no passo 1 | presente | não capturado | Saltado porque `#geral` já existe |
| URL, copiar, destino, gerar outro e concluir | presente | presente | |
| Excluídos ausentes | sim | sim | |

Classificação: em aberto.

## 15. Inspecionar acesso

Excluída a inspeção de chave.

| Elemento | Mockup | v2 | Observação |
|---|---|---|---|

Classificação:

## 16. Permissões do canal

| Elemento | Mockup | v2 | Observação |
|---|---|---|---|

Classificação:

## 17–18. Fora de escopo

Não capturadas. Não contam para o fecho.

## 19. Minha conta

Subconjunto em escopo: nome, avatar, idioma. Excluídos: bio, P2P, perfil estendido.

| Elemento | Mockup | v2 | Observação |
|---|---|---|---|

Classificação:

## 20. Áudio e vídeo

Página de definições, distinta da green room. Excluídos: RNNoise, AEC, AGC, codec, métricas de rede.

| Elemento | Mockup | v2 | Observação |
|---|---|---|---|

Classificação:

## 21. Green room

Antes de entrar. Não substitui 20 nem 22–29.

| Elemento | Mockup | v2 | Observação |
|---|---|---|---|

Classificação:

## 22. Composição

Chamada ao vivo. Ícone do banco visível.

| Elemento | Mockup | v2 | Observação |
|---|---|---|---|

Classificação:

## 23. Editor de cenas 1

Largura 1280. Excluído o inspetor de slot.

| Elemento | Mockup | v2 | Observação |
|---|---|---|---|

Classificação:

## 24. Editor de cenas 2

Largura 1600.

| Elemento | Mockup | v2 | Observação |
|---|---|---|---|

Classificação:

## 25. Grade 1

Largura 1280. Excluídos nível, CA e PV.

| Elemento | Mockup | v2 | Observação |
|---|---|---|---|

Classificação:

## 26. Grade 2

Largura 1600.

| Elemento | Mockup | v2 | Observação |
|---|---|---|---|

Classificação:

## 27. Partilha 1

Largura 1280. Excluídos zoom, laser e VTT.

| Elemento | Mockup | v2 | Observação |
|---|---|---|---|

Classificação:

## 28. Partilha 2

Largura 1600.

| Elemento | Mockup | v2 | Observação |
|---|---|---|---|

Classificação:

## 29. PiP

| Elemento | Mockup | v2 | Observação |
|---|---|---|---|

Classificação:

## 30. Fundação

`30-foundation.png` é o topo da galeria a 1280×1600. O `screen.png` tem 6027 px de altura. A entrada fica em aberto até a página inteira ser comparada.

| Elemento | Mockup | v2 | Observação |
|---|---|---|---|
| Cabeçalho, tema e idioma | presente | presente | Só o topo foi capturado |
| Resto do guia | presente | não capturado | |

Classificação: em aberto.

## 31. Logótipo

Marca no login e no shell, comparada com `mesa_logo/screen.png`.

| Elemento | Mockup | v2 | Observação |
|---|---|---|---|

Classificação:

## Resumo

| Tela | Mockup | Captura | Classificação | Data |
|---|---|---|---|---|
| 1–16, 19–31 | ver matriz | | | |
| 17–18 | — | — | Fora de escopo | |
