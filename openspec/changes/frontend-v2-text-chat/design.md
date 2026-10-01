# Design

## Context

Constrói sobre `frontend-v2-foundation`, `frontend-v2-auth-shell` (shell com pontos de entrada de pesquisa/notificações já na topbar) e `frontend-v2-server-admin` (canais e permissões já existem). Referências de comportamento na v1: `frontend/src/pages/Channel.tsx` (1566 linhas), `components/{MessageBody,MessageAttachments,LinkPreviews,ImageLightbox,MentionPicker,EmojiPicker,EmojiSuggest,SearchPanel}.tsx`, `lib/{daySeparators,mentionParse,notifFormat,notifSync,messageCatchUp}.ts`.

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
A pesquisa decifra e filtra o histórico já obtido pelo cliente (como a v1 faz — não existe índice full-text no backend). Esta fase **não** introduz um endpoint de pesquisa no servidor.
**Porquê**: é o comportamento actual da v1, documentado como tal; mudar para pesquisa server-side seria uma mudança de contrato de backend fora do escopo desta reescrita (que mantém o backend inalterado).
**Trade-off aceite**: a pesquisa só encontra o que já foi carregado/decifrado no cliente (histórico recente), não um índice exaustivo — limitação já existente na v1, não introduzida por esta fase.

### D2 — Reações de emoji nos mockups não entram nesta fase
`mesa_shell_da_aplica_o_chat_de_texto` mostra uma barra de reações rápidas ao passar o rato sobre uma mensagem (hover) e contagens de reacção com emoji — a v1 **não** tem esta funcionalidade (o picker de emoji da v1 insere emoji no texto da mensagem ou como `:shortcode:`, não regista reacções agregadas por mensagem como uma entidade separada).
**Decisão**: esta fase **não** implementa reações agregadas por mensagem — mantém-se fiel ao mandato de paridade com a v1 (`docs/design-system/stitch-prompt.md` §0), não ao que o mockup acrescentou. O botão de emoji do composer e o autocompletar `:shortcode:` (que a v1 já tem) são implementados; a barra de reação por hover com contagens, não.
**Porquê registar isto explicitamente**: é exactamente o tipo de desvio de escopo que o TR (`docs/v2/TR-frontend-v2.md` §7) já identificou noutras áreas — aqui é um caso menor (não exige mudança de backend nem de arquitectura de segurança), mas ainda assim é uma funcionalidade nova não pedida, por isso fica fora.

### D3 — Dice-roll e spans estilizados de "nome de feitiço" nos mockups não entram nesta fase
`mesa_shell_da_aplica_o_chat_de_texto` mostra um "cartão de rolagem de dado" embutido e spans estilizados para nomes de feitiços — ambos são conteúdo temático de RPG específico do mockup de demonstração, não uma funcionalidade da v1.
**Decisão**: fora de escopo. A v1 trata todo o corpo de mensagem como texto+menções+emoji; não há um sistema de "cartões" de conteúdo estruturado embutidos na mensagem.

### D4 — Taxonomia de notificações segue a v1 (duas secções fixas), não as abas do mockup
`mesa_dropdown_de_notifica_es_e_busca_global` usa abas de filtro ("Todas/Menções/Cripto & Sessões") e "Marcar todas como lidas". A v1 usa duas secções sempre visíveis (Menções/Respostas persistente; Canais com novidades efémero) e não tem uma acção de "marcar todas como lidas" (as notificações de menção só desaparecem ao visitar a mensagem).
**Decisão**: segue-se a estrutura da v1 (duas secções), não as abas do mockup — a categoria "Cripto & Sessões" do mockup não corresponde a nada que a v1 notifique hoje, e introduzir "marcar todas como lidas" muda a semântica de "só desaparece ao ver a mensagem", que é uma escolha de produto já feita. Reaproveita-se o visual do mockup (cartões de notificação, estilo), não a sua taxonomia.

## Risks / Trade-offs

- **[Risco] Decifrar e pesquisar client-side pode ficar lento com históricos grandes** → **Mitigação**: mesmo comportamento e mesma limitação da v1; não é uma regressão introduzida por esta fase.
- **[Risco] Composer com múltiplos autocompletes (menção + emoji) simultâneos pode ter conflito de foco/teclado** → **Mitigação**: replicar a lógica já testada em `frontend/src/components/{MentionPicker,EmojiSuggest}.tsx`, que já resolve esta interacção na v1.

## Open Questions

Nenhuma.
