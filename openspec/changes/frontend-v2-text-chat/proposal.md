# Proposal

## Why

Com o shell, a autenticação e a administração de servidor/canal prontos (Fases 0-2), os canais de texto já existem e são navegáveis, mas ainda não têm conteúdo: não é possível ler, enviar, responder ou pesquisar mensagens. Esta é a **Fase 3 de 6** da reescrita faseada (`docs/v2/TR-frontend-v2.md`) e entrega a funcionalidade "chat" propriamente dita — o uso mais frequente da aplicação no dia-a-dia, e a única forma de os pontos de entrada de pesquisa e notificações (já existentes na topbar desde a Fase 1) terem conteúdo real.

## What Changes

- Lista de mensagens: separadores de dia, agrupamento por remetente, responder (com citação), apagar (conforme permissão), menções `@handle` como chips clicáveis, anexos de imagem decifrados no cliente com lightbox (zoom, download, navegação), pré-visualizações de link auto-geradas.
- Composer: anexar imagens (com colar directo), autocompletar de menção e de emoji por `:shortcode:`, picker de emoji dedicado, envio, e os estados alternativos "somente leitura" (sem permissão de escrever) e "silenciado até HH:MM".
- Pill "Saltar para o presente" quando há mensagens novas fora da vista.
- Painel de pesquisa (conteúdo aberto do ponto de entrada já existente na topbar): texto livre ou `#canal termo`, resultados agrupados por servidor/canal, estados vazios diferenciados.
- Dropdown de notificações (conteúdo aberto do ponto de entrada já existente): secções de menções/respostas e canais com novidades, com deep-link para a mensagem.
- **Fora desta fase**: conteúdo de canais de voz/vídeo (Fase 4).

## Capabilities

### New Capabilities
- `frontend-v2/text-messaging`: lista de mensagens, composer, anexos+lightbox, link previews, jump-to-bottom.
- `frontend-v2/search-and-notifications`: painel de pesquisa e dropdown de notificações.

### Modified Capabilities
_Nenhuma — `frontend-v2-auth-shell` (que já expõe os pontos de entrada de pesquisa/notificações na topbar) ainda não foi arquivado; esta fase preenche esses pontos de entrada por convenção de projecto, não por delta formal de spec._

## Impact

- **Código novo**: `frontend-v2/src/pages/Channel.tsx`, `frontend-v2/src/components/{MessageBody,MessageAttachments,LinkPreviews,ImageLightbox,MentionPicker,EmojiPicker,EmojiSuggest,SearchPanel}.tsx`.
- **Backend**: nenhum impacto — consome `GET/POST /api/channels/{id}/messages` e a pesquisa é resolvida no cliente (decifra e filtra localmente, como a v1 já faz — não há endpoint de pesquisa full-text no backend).
- **Depende de**: `frontend-v2-foundation`, `frontend-v2-auth-shell` (shell, topbar com pontos de entrada), `frontend-v2-server-admin` (canais precisam de existir e ter ACL para haver conteúdo e permissões a testar).
- **Desbloqueia**: nada directamente — é consumível de forma independente da Fase 4, mas ambas completam a paridade funcional total.
