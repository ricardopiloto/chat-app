# Tasks

## 1. Lista de mensagens

- [ ] 1.1 Implementar a leitura e decifra de mensagens (`GET /api/channels/{id}/messages`, decifra com a chave do servidor) e a renderização agrupada por remetente consecutivo; verificar com pelo menos 3 mensagens consecutivas do mesmo remetente
- [ ] 1.2 Implementar separadores de dia com rótulo fixo ("Hoje"/"Ontem"/data completa) e o marcador fixo (sticky) no topo durante o scroll; verificar com mensagens de pelo menos 2 dias diferentes
- [ ] 1.3 Implementar responder (citação acima do composer, cancelável) e apagar (condicionado a autor/criador do canal/dono do servidor/permissão `apagar mensagens`); verificar os 4 casos de permissão de apagar
- [ ] 1.4 Implementar a renderização de menções `@handle` como chips clicáveis só quando resolvem para um membro real; verificar com uma menção válida e uma inválida na mesma mensagem

## 2. Anexos e links

- [ ] 2.1 Implementar anexar imagens ao composer (escolha de ficheiro e colar da área de transferência), cifra antes do envio e decifra local antes de apresentar miniaturas; verificar round-trip de uma imagem enviada e recebida
- [ ] 2.2 Implementar o lightbox seguindo `mesa_lightbox_de_anexos_de_imagem_no_chat_geral` (zoom, download, navegação entre anexos, fecho por Esc/botão/clique-fora — **incluindo o fecho por clique no backdrop, que o mockup de referência não tinha ligado**); verificar os 3 métodos de fecho
- [ ] 2.3 Implementar pré-visualização automática de até 5 links por mensagem após decifra; verificar com uma mensagem contendo 2 URLs diferentes

## 3. Composer

- [ ] 3.1 Implementar autocompletar de menção (`@` + navegação por teclado) e de emoji (`:shortcode:`) no campo de composição, mais o selector de emoji dedicado; verificar ambos os autocompletes e a inserção por selecção
- [ ] 3.2 Implementar o estado "somente leitura" (sem permissão de escrita) e "silenciado até HH:MM" substituindo o composer; verificar ambos com um utilizador de teste sem permissão e um silenciado (depende de `frontend-v2-server-admin` para aplicar a permissão/silenciamento)
- [ ] 3.3 Confirmar explicitamente que nenhuma barra de reação por hover com contagens (D2 do design.md) nem cartões de dice-roll/spans de feitiço (D3) foram implementados — checklist negativo antes de fechar este grupo

## 4. Saltar para o presente

- [ ] 4.1 Implementar a pill "Saltar para o presente" com contagem acumulada, visível quando o utilizador está desviado do fundo e chegam mensagens novas; verificar que clicar rola para o fundo e oculta a pill

## 5. Painel de pesquisa

- [ ] 5.1 Implementar o painel de pesquisa (texto livre e sintaxe `#canal termo`) com debounce, decifrando e filtrando localmente o histórico já carregado (D1 do design.md — sem endpoint novo de backend); verificar ambos os modos de pesquisa
- [ ] 5.2 Implementar os 3 estados vazios diferenciados (canal não encontrado / canal é de voz / sem resultados); verificar cada um
- [ ] 5.3 Ligar o atalho de teclado Ctrl/Cmd+F ao ponto de entrada de pesquisa já existente na topbar (Fase 1), pré-preenchendo com o canal actual; verificar a partir de um canal de texto aberto

## 6. Dropdown de notificações

- [ ] 6.1 Implementar as duas secções fixas (Menções/Respostas persistente; Canais com novidade efémero, D4 do design.md — abas do mockup mapeadas às categorias existentes) ligadas ao ponto de entrada já existente na topbar (Fase 1); verificar que uma notificação de menção persiste entre recarregamentos até a mensagem ser vista
- [ ] 6.2 Implementar o deep-link de uma notificação para a mensagem correspondente (navegação + scroll até à mensagem); verificar a partir de pelo menos uma notificação de cada secção
- [ ] 6.3 Verificar que o indicador de novidade no ícone de notificações da topbar (já implementado na Fase 1) reflecte correctamente a existência e ausência de notificações não vistas

## 7. Verificação de fase completa

- [ ] 7.1 Percorrer o ciclo completo: enviar mensagem com anexo e link de dois utilizadores de teste diferentes → responder e apagar mensagens → mencionar o outro utilizador e confirmar que recebe notificação → pesquisar por uma palavra da conversa → confirmar resultado correcto
- [ ] 7.2 Confirmar que nenhuma alteração foi feita a `frontend/` durante esta fase (`git status frontend/` sem alterações)

## 8. Fidelidade visual (critério de aceite por tela)

- [ ] 8.1 Canal de texto: verificar a checklist de D5 contra `mesa_shell_da_aplica_o_chat_de_texto` (cabeçalho, cartão de boas-vindas, banner, badges de cargo, legenda de anexo, composer) e registar a classificação em `verification.md`; só **Fiel** fecha a tarefa
- [ ] 8.2 Pesquisa e notificações contra `mesa_dropdown_de_notifica_es_e_busca_global` (abas por categoria existente, acções por cartão)
- [ ] 8.3 Lightbox contra `mesa_lightbox_de_anexos_de_imagem_no_chat_geral` (barra de metadados, zoom/enquadrar/1:1, faixa de miniaturas)
- [ ] 8.4 Confirmar a ausência dos itens excluídos em D5 (reações, dados, feitiços, telemetria, fixar, hash de chave)

## 9. Paridade funcional e independência

- [ ] 9.1 Verificar cada item desta área de `docs/v2/parity-checklist.md` (D6 do design.md) contra o comportamento da v1 em execução e registar o resultado
- [ ] 9.2 Executar `check-v1-overlap` sobre os ficheiros desta fase e confirmar os limiares ou justificar excepções
- [ ] 9.3 Registar quaisquer alterações de backend necessárias como tarefas próprias (regra 4 da revisão); se nenhuma for necessária, registar "nenhuma"
