# Design

## Context

Constrói sobre `frontend-v2-foundation`, `frontend-v2-auth-shell` (shell com pontos de entrada de pesquisa/notificações já na topbar) e `frontend-v2-server-admin` (canais e permissões já existem). A referência de comportamento é a aplicação v1 em execução (caixa-preta) e os contratos do backend e de `docs/v2/contracts/` (cifra de mensagem e anexo); o código de `frontend/` não é consultado.

Mockups de referência: `mesa_shell_da_aplica_o_chat_de_texto` (mensagens, composer, reações, anexo decifrado), `mesa_lightbox_de_anexos_de_imagem_no_chat_geral`, `mesa_dropdown_de_notifica_es_e_busca_global`.

## Goals / Non-Goals

**Goals:**
- Paridade completa com a funcionalidade de chat de texto da v1.
- Pesquisa e notificações preenchendo os pontos de entrada já existentes desde a Fase 1.

**Non-Goals:**
- Voz/vídeo (Fase 4).
- Qualquer conteúdo de mensagem além do que a v1 já suporta (sem reações emoji persistidas como entidade própria — ver D2; sem threads, sem bots/integrações, fora do backlog).

## Decisions

### D1 — Pesquisa continua client-side, sem endpoint novo no backend
A pesquisa decifra e filtra o histórico já obtido pelo cliente (não existe índice full-text no backend). Esta fase **não** introduz um endpoint de pesquisa no servidor.
**Porquê**: é o comportamento actual da v1, documentado como tal; mudar para pesquisa server-side seria uma mudança de contrato de backend fora do escopo desta reescrita (que mantém o backend inalterado).
**Trade-off aceite**: a pesquisa só encontra o que já foi carregado/decifrado no cliente (histórico recente), não um índice exaustivo — limitação já existente na v1, não introduzida por esta fase.

### D2 — Reações de emoji nos mockups não entram nesta fase
`mesa_shell_da_aplica_o_chat_de_texto` mostra uma barra de reações rápidas ao passar o rato sobre uma mensagem (hover) e contagens de reacção com emoji — a aplicação actual **não** tem esta funcionalidade (o picker de emoji insere emoji no texto da mensagem ou como `:shortcode:`, não regista reacções agregadas por mensagem como uma entidade separada).
**Decisão**: esta fase **não** implementa reações agregadas por mensagem — mantém-se fiel ao mandato de paridade funcional (`docs/design-system/stitch-prompt.md` §0), não ao que o mockup acrescentou. O botão de emoji do composer e o autocompletar `:shortcode:` (que a aplicação já tem) são implementados; a barra de reação por hover com contagens, não.
**Porquê registar isto explicitamente**: é exactamente o tipo de desvio de escopo que o TR (`docs/v2/TR-frontend-v2.md` §7) já identificou noutras áreas — aqui é um caso menor (não exige mudança de backend nem de arquitectura de segurança), mas ainda assim é uma funcionalidade nova não pedida, por isso fica fora.

### D3 — Dice-roll e spans estilizados de "nome de feitiço" nos mockups não entram nesta fase
`mesa_shell_da_aplica_o_chat_de_texto` mostra um "cartão de rolagem de dado" embutido e spans estilizados para nomes de feitiços — ambos são conteúdo temático de RPG específico do mockup de demonstração, não uma funcionalidade da v1.
**Decisão**: fora de escopo. A v1 trata todo o corpo de mensagem como texto+menções+emoji; não há um sistema de "cartões" de conteúdo estruturado embutidos na mensagem.

### D4 — Notificações: apresentação do mockup, categorias que existem
`mesa_dropdown_de_notifica_es_e_busca_global` usa abas, cartões com acções e contador "N novas". Segue-se a **apresentação** do mockup (cabeçalho com contador, abas, cartões com avatar, texto, tempo e acções "Responder" e "Ver canal"), mas as abas mapeiam só categorias que existem: **Todas**, **Menções e respostas** (persistentes até a mensagem ser vista) e **Canais com novidade** (efémeras). A aba "Cripto & Sessões" fica fora: não corresponde a nada que a aplicação notifique. A acção **"Limpar"** (que a aplicação actual tem, NTF-07) mantém-se, com o rótulo "Limpar" no cabeçalho do painel: marca como lidas todas as menções e respostas pendentes (`POST /api/notifications/read-all`); não afecta os canais com novidade, que são da sessão. Decisão do responsável do projecto, para manter a paridade.

### D5 — Checklists de fidelidade desta fase
Elementos obrigatórios por tela (ver `docs/v2/AUDIT-fidelity.md` §4). Fora de escopo e **não** implementados: reações por hover, cartões de rolagem de dados, spans de feitiço, bandeja de dados, "Mesa telemetria", fixar mensagens, impressão digital/hash de chave no cabeçalho.

- **Canal de texto (`mesa_shell_da_aplica_o_chat_de_texto`)**: cabeçalho de canal (`# nome`, descrição, chip E2EE, busca no canal, alternar painel de Membros); cartão de boas-vindas ao canal; banner informativo de canal cifrado; separadores de dia; mensagens com avatar, handle, **badge de cargo**, hora e agrupamento; citação de resposta; chips de menção; anexo com legenda (nome, tamanho, "cifrado no cliente") e acção de ampliar; pré-visualização de links; composer com anexar, emoji, enviar e rodapé de ajuda (Enter envia · Shift+Enter nova linha); pill "Saltar para o presente".
- **Pesquisa (`mesa_dropdown_de_notifica_es_e_busca_global`)**: campo com chip de canal removível, filtros de escopo existentes (todas as mensagens / canal), resultados com avatar, handle, canal, hora e trecho com termo destacado, rodapé com contagem de resultados e dicas de teclado, etiqueta de atalho que corresponde ao atalho real.
- **Notificações (mesmo mockup)**: conforme D4.
- **Lightbox (`mesa_lightbox_de_anexos_de_imagem_no_chat_geral`)**: barra superior com metadados (tamanho, dimensões, estado de verificação), controlos de zoom (+/−), Enquadrar e 1:1, Descarregar, Fechar com Esc; setas anterior/seguinte; faixa de miniaturas com "Anexo n de m"; atalhos visíveis; fecho por Esc, botão e clique no fundo.

### D6 — Funcionalidades desta área que têm de continuar a funcionar
Enviar mensagem cifrada; ler e decifrar histórico; agrupamento por remetente e separadores de dia com marcador fixo; responder com citação; apagar por permissão; menções clicáveis só quando resolvem a membro; anexar imagens por ficheiro e colar, cifra e decifra, lightbox (zoom, download, navegação, fecho por Esc/botão/clique-fora); pré-visualização de até 5 links; autocompletar `@` e `:shortcode:` e selector de emoji; composer "somente leitura" e "silenciado até HH:MM"; pill "Saltar para o presente"; pesquisa livre e `#canal termo` com estados vazios diferenciados; atalho Ctrl/Cmd+F; notificações persistentes de menção/resposta e efémeras de canais com novidade com deep-link; indicador na topbar; recuperação de mensagens após reconexão. Cada item consta de `docs/v2/parity-checklist.md`.

## Risks / Trade-offs

- **[Risco] Decifrar e pesquisar client-side pode ficar lento com históricos grandes** → **Mitigação**: mesmo comportamento e mesma limitação da v1; não é uma regressão introduzida por esta fase.
- **[Risco] Composer com múltiplos autocompletes (menção + emoji) simultâneos pode ter conflito de foco/teclado** → **Mitigação**: desenhar um único gestor de autocompletar com um só foco e um só mapa de teclas, coberto por casos de teste manuais explícitos (menção e emoji alternados, Esc, Enter, setas).

## Open Questions

Nenhuma.
