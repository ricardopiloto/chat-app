# Verificação da implementação

Backend local com banco descartável, dev server v2 (`https://localhost:1421`) e Chrome. Contas de teste `tester1` (dono), `guest1` e `guest2` (convidados). Servidores criados pela UI; as verificações de comportamento foram feitas contra o backend real.

## Verificado no navegador

- 1.1 Criar servidor: botão bloqueado sem a checkbox de custódia, liberado com ela; cria `geral` + canal de voz e navega para o servidor.
- 1.2/1.3 Criar canal: alternância Texto/Voz; voz exige custódia, texto não; nome normalizado (espaços → hífens, 32 caracteres); privado e "visível para novos membros" refletidos em `GET /channels`.
- 2.1 Membros: pesquisa, seletor de cargo, remover; linha do dono sem seletor nem remover.
- 2.2 Cargos: criar, reordenar ↑/↓ (não sobe acima do cargo de sistema), apagar; cargo de sistema só leitura; três grupos de permissão.
- 2.3 Aviso ao apagar cargo com membros; cargo sem "enviar mensagens" atribuído a `guest1` aparece em "Inspecionar acesso" como "nível reduzido".
- 3.1 Visão Geral como landing, já populada; imagem rejeitada no cliente (>1 MiB), PNG válido enviado e removido.
- 3.2 Boas-vindas: o backend exige `{nome}` no modelo e o erro aparece; com canal e modelo salvos, um novo membro por convite recebe "Seja bem-vindo, guest2!" em `#geral`.
- 3.3 Apagar servidor: botão só ativa com o nome exato (maiúsculas/minúsculas e parcial não valem).
- 4.1 Renomear inline: normalização, 32 caracteres, vazio/só hífens recusados.
- 4.2 Apagar canal: não crítico some da sidebar; último de texto e último de voz mostram a mensagem de 409 `last_channel_of_type`.
- 4.3 ACL: regra de cargo e de membro adicionadas, salvas e removidas (conferido em `GET /acl`).
- 4.4 Inspecionar acesso: mostra visibilidade, nível efetivo e as camadas everyone, cargo e membro.
- 4.5 Silenciar: 5/10/15/30 min e minutos personalizados, tempo restante, dessilenciar antes do fim.
- 5.1 Convite em dois passos: servidor com `geral` pula o passo 1; sem `geral` nem boas-vindas pede o canal; botão copiar mostra "Copiado".
- 5.2 Convite: pré-visualização sem sessão com registro inline; sessão ativa só aceita; código inválido mostra mensagem específica.
- 5.3 Ponta a ponta: convite → registro anônimo → membro aparece na lista → boas-vindas publicada.
- 6.1 Ciclo completo percorrido em `Gamma` (servidor, canais de texto e voz, convidado, cargo restrito atribuído, inspeção).
- 6.2 `git status frontend/` sem alterações.

## Decisões e divergências

- `/invite/:code` agora abre a tela de convite (pré-visualização e registro inline), substituindo o preenchimento do cadastro da fase auth-shell. `?invite=<code>` continua preenchendo o cadastro.
- `t()` aceita parâmetros (`{nome}`) para as mensagens com valores.
- `src/crypto/` ganhou `serverKey.ts`, `channelKey.ts` e `keyHandoff.ts` (só `publishOwnEnvelope`), necessários para criar servidor/canal com custódia; o restante do handoff fica para a fase de chat.
- Rail e sidebar mostram engrenagem, convite e "+" de canal conforme permissões do utilizador no servidor.
- Tempo restante do silenciamento arredonda para cima, como na v1.

## Observação

O ACL e o inspetor foram verificados em um canal privado e outro público; a negação de "ver" em canal público é bloqueada na UI, como na v1.

## Alterações de backend necessárias (8.3)

Uma, tarefa 8.4: `GET /api/invites/{code}/handle-available?handle=`, para a disponibilidade do handle no onboarding (o mockup a exige; a política de backend tratava-a como fora de escopo e o responsável do projecto decidiu acrescentar o endpoint). Aditiva, só responde para um convite utilizável e tem limite de pedidos próprio; testes de contrato em `backend/tests/contract/invites.rs`. Todos os restantes fluxos usam os endpoints existentes.

## Sobreposição com a v1 (8.2)

`npm run check:v1-overlap` sobre os ficheiros desta fase: 0 falhas. `crypto/channelKey.ts`, `crypto/serverKey.ts`, `crypto/keyHandoff.ts` e `lib/channelName.ts` estavam em 59–94% e foram reescritos a partir do contrato do backend. Os 17 ficheiros de UI (19–33%) tiveram as sequências longas partilhadas quebradas (estado reorganizado, handlers extraídos, imports reordenados). O resíduo é idioma de framework e formas de chamada à API, coberto por exceções com limite de sequência (`maxRun` 40; 45 em `keyHandoff.ts`; 60 em `mgmt.css`, cujas listas de declarações usam os mesmos nomes de tokens). Os 46 ficheiros que ainda falham no projeto inteiro pertencem a fases futuras (voz, chat).

## Fidelidade visual (7.1–7.8)

Capturas em `docs/v2/fidelity/frontend-v2-server-admin/`. Tema escuro, pt-BR, janela do navegador com viewport de 1068 px de largura (mais estreita que os `screen.png` de 1280–1600 px: a janela da automação não passou desse limite), zoom 100%. Backend descartável, contas de teste `tester1` (dono) e `guest1`.

Correções feitas durante a comparação: rodapé do diálogo de canal (o botão Cancelar sobrepunha-se ao Guardar), prioridade P1/P2/P3 por regra na lista de regras activas, itens do inspector com estado Permitido/Negado/Ignorado (o backend envia `deny write` em texto cru) e apresentação traduzida, bloco de aviso do apagar canal em tom de risco, selos Público/Privado nos cartões de canal do convite, largura do campo de minutos personalizados, e relógio do silenciamento (mostrava 6 min para 5 min).

### 7.1 Criar servidor — `criar-servidor.jpg`

| Elemento | Mockup | v2 | Observação |
|---|---|---|---|
| Eyebrow + título com gradiente de topo | presente | presente | |
| Selector de sigilo/ícone | presente | presente | |
| Nome com contador x/32 | presente | presente | |
| Bloco de chave mestra com Copiar | presente | presente | |
| Checkbox de custódia inicialmente desmarcada, botão bloqueado | presente | presente | |
| Cancelar e nota da configuração padrão | presente | presente | |

Excluídos ausentes: sim.

### 7.2 Criar canal — `criar-canal-voz.jpg`

| Elemento | Mockup | v2 | Observação |
|---|---|---|---|
| Controlo segmentado Texto/Voz interactivo | presente | presente | texto esconde o bloco de custódia |
| Nome com ícone, validação visual e dica | presente | presente | marca de validação aparece com nome válido |
| Cartões Público/Privado com descrição | presente | presente | |
| "Visível na listagem" | presente | presente | |
| Bloco de custódia (só voz) com chave, Copiar e checkbox desmarcada | presente | presente | |
| Rodapé Cancelar e Criar | presente | presente | |

Excluídos ausentes: sim.

### 7.3 Shell das definições e Visão geral — `visao-geral.jpg`

| Elemento | Mockup | v2 | Observação |
|---|---|---|---|
| Sidebar própria (Servidor · Papéis · Pessoas · Zona crítica) | presente | presente | |
| Cabeçalho com breadcrumb, título e chips (E2EE, acesso exclusivo do dono) | presente | presente | |
| Fechar com Esc | presente | presente | Esc fecha as definições |
| Cartão de imagem (pré-visualização, ficheiro, tamanho, validação, Alterar/Remover) | presente | presente | verificado com um PNG gerado |
| Nome com contador | presente | presente | |
| Cartão de boas-vindas (canal, modelo, Pré-visualizar, Guardar) | presente | presente | token `{nome}` (o backend exige-o), não `{user}`/`{server}` |
| Zona crítica com confirmação por nome | presente | presente | |

Excluídos ausentes (assinatura da guilda, métricas, armazenamento): sim.

### 7.4 Membros e Cargos — `membros.jpg`, `cargos-lista.jpg`, `cargos-editar.jpg`

| Elemento | Mockup | v2 | Observação |
|---|---|---|---|
| Cartões Total e Online | presente | presente | o cartão "Chaves 100%" é métrica excluída |
| Filtro por texto e por cargo, Convidar pessoas | presente | presente | |
| Tabela Identidade · Cargo · Ações, linha do dono sem controlos | presente | presente | |
| Paginação e rodapé informativo | presente | presente | |
| Criar cargo; lista em ordem com contagem; ↑/↓; cargo de sistema só-leitura | presente | presente | |
| Detalhe com cabeçalho, interruptores Geral/Texto/Voz com contador | presente | presente | |
| Barra de alterações por guardar (Cancelar/Guardar) | presente | presente | fica fixa no topo ao rolar |
| Matriz de membros do cargo | presente | presente | |
| Zona de apagar com aviso | presente | presente | |

Excluídos ausentes (cor de cargo): sim.

### 7.5 Permissões de canal e Inspecionar acesso — `permissoes-canal.jpg`, `inspecionar-acesso.jpg`

| Elemento | Mockup | v2 | Observação |
|---|---|---|---|
| Cabeçalho com chip | presente | presente | um chip (E2EE); os chips MLS/ID do mockup são excluídos |
| Abas "Políticas e ACL activa (n)" / "Inspecionar acesso" | presente | presente | mais a aba Silenciar (D3) |
| Visibilidade em cartões e "visível na listagem" | presente | presente | |
| Construtor de regra em quatro passos numerados | presente | presente | |
| Lista de regras com ícone, efeito, prioridade e remover | presente | presente | prioridade P1/P2/P3 por tipo de sujeito |
| Rodapé com aviso, Cancelar e Guardar | presente | presente | |
| Inspector: membro, veredito geral, matriz por precedência com permitido/negado/ignorado | presente | presente | |

Excluídos ausentes (chaves MLS): sim.

### 7.6 Silenciar e apagar canal — `silenciar-membro.jpg`, `silenciar-lista.jpg`, `apagar-canal-antes.jpg`

| Elemento | Mockup | v2 | Observação |
|---|---|---|---|
| Cartão do membro, durações em pílulas (valores da v1, D2) | presente | presente | |
| Tempo restante e dessilenciar | presente | presente | |
| Apagar: cabeçalho de risco, aviso, confirmação por nome | presente | presente | |

Excluídos ausentes (escopo, motivo, estatísticas): sim.

### 7.7 Convidar e onboarding — `convidar-passo1.jpg`, `convidar-passo2.jpg`, `convite-onboarding.jpg`, `convite-com-sessao.jpg`, `convite-invalido.jpg`

| Elemento | Mockup | v2 | Observação |
|---|---|---|---|
| Indicador de passos 01/02 | presente | presente | |
| Cartões de canais de boas-vindas (radio, selos), histórico, avançar | presente | presente | selos Público/Privado; "Canal principal" em `#geral` |
| Passo 2: URL copiável com "Copiado", destino, Gerar outro, Concluído | presente | presente | |
| Onboarding: cartão do servidor, handle, nome, senha com força, cofre E2EE, aceitar, "já tenho conta" | presente | presente | validade: o convite mostra "Convite ativo e cifrado"; o backend não devolve expiração |
| Handle com disponibilidade | presente | presente | "Disponível" / "Já em uso" via `GET /api/invites/{code}/handle-available` (tarefa 8.4); sem resposta do servidor cai para "Formato válido" |

Excluídos ausentes (QR, expiração configurável): sim.

### 7.8 Itens excluídos ausentes

Confirmado nas capturas: sem cor de cargo, sem QR, sem escopo/motivo de silenciamento, sem assinatura da guilda, sem métricas de D20/armazenamento.

### Resumo

| Tela | Mockup | Captura | Classificação | Data |
|---|---|---|---|---|
| Criar servidor | `mesa_modal_criar_servidor_cust_dia_e2ee` | `criar-servidor.jpg` | Fiel | 2026-10-01 |
| Criar canal | `mesa_modal_criar_canal_de_voz_cust_dia_e2ee` | `criar-canal-voz.jpg` | Fiel | 2026-10-01 |
| Shell + Visão geral | `mesa_defini_es_do_servidor_vis_o_geral_e_boas_vindas` | `visao-geral.jpg` | Fiel | 2026-10-01 |
| Membros | `mesa_defini_es_do_servidor_membros` | `membros.jpg` | Fiel | 2026-10-01 |
| Cargos | `mesa_defini_es_do_servidor_cargos_e_permiss_es` | `cargos-editar.jpg` | Fiel | 2026-10-01 |
| Permissões de canal / Inspector | `mesa_di_logo_permiss_es_de_canal_acl_inspecionar_acesso`, `mesa_di_logo_inspecionar_acesso_efetivo_fator_a_fator` | `permissoes-canal.jpg`, `inspecionar-acesso.jpg` | Fiel | 2026-10-01 |
| Silenciar / apagar canal | `mesa_modais_de_gest_o_de_canal` | `silenciar-membro.jpg`, `apagar-canal-antes.jpg` | Fiel | 2026-10-01 |
| Convidar | `mesa_di_logo_de_convidar_fluxo_encadeado_de_2_passos` | `convidar-passo1.jpg`, `convidar-passo2.jpg` | Fiel | 2026-10-01 |
| Onboarding de convidado | `mesa_convite_onboarding_de_convidado` | `convite-onboarding.jpg` | Fiel | 2026-10-01 |

## Paridade funcional (8.1)

Itens de `docs/v2/parity-checklist.md` com fase S, contra o backend real.

Verificados no navegador (nesta fase): SRV-01, SRV-02 ("Copiado"), SRV-03, SRV-05, SRV-06, SRV-07, SRV-08, SRV-09, SRV-10, SRV-11, SRV-12, SRV-13, SRV-14, SRV-15, SRV-16 (adicionar membro ao cargo pela matriz), SRV-17, SRV-18, SRV-19, CHN-01, CHN-03, CHN-04, CHN-06, CHN-07, CHN-08, CHN-09, CHN-10, SHL-12, CRP-04, CRP-05.

SHL-10 (menu de contexto): a v2 não o ligava a nada, e o componente `ContextMenu` da fundação não deixava escolher nenhum item com o rato (o `pointerdown` global fechava o menu antes do clique). Corrigido e ligado às linhas de canal da sidebar (Renomear, Definições, Apagar em tom de perigo, que abre direto a confirmação). Verificado com clique-direito; o toque-longo não foi testado.

Concluídos depois, com o backend real e um segundo cliente (script de teste e chamadas à API como convidado e como dono):

- SRV-04 (`server.deleted`): apagar o servidor por outro cliente enquanto o dono está dentro dele leva-o à página inicial. Ligado em `shell/state.tsx`.
- SRV-20 (`invite.consumed`): um membro novo que entra por convite aparece na lista de membros do dono sem recarregar (3 para 4). A lista de membros e as contagens de cargos são atualizadas.
- CHN-05 (`channel.deleted`): apagar por outro cliente o canal que está aberto leva de volta ao servidor; antes ficava em "Carregando o canal…". Corrigido em `shell/state.tsx`.
- CHN-11: o canal mostra "silenciado até HH:MM" ao utilizador silenciado (verificado na fase de chat de texto).
- CHN-13 (`channel_role.changed`): o backend emite o evento ao atribuir co-diretores a um canal de voz e o cliente atualiza canais e cargos do servidor. Os co-diretores em si são da fase de voz.
- CRP-01: dois membros novos registados por convite receberam o envelope da chave do servidor, publicado pelo dono que estava ligado.

Todos os itens da área estão verificados.
