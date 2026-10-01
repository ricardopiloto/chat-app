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

- **Código novo**: página de canal de texto, lista de mensagens, composer, lightbox, pesquisa e notificações, escritos de raiz; a divisão em componentes segue a estrutura dos mockups, não a da v1.
- **Backend**: nenhum impacto previsto (qualquer alteração exige tarefa própria, ver regra 4 da revisão) — consome `GET/POST /api/channels/{id}/messages` e a pesquisa é resolvida no cliente (decifra e filtra localmente — não há endpoint de pesquisa full-text no backend).
- **Depende de**: `frontend-v2-foundation`, `frontend-v2-auth-shell` (shell, topbar com pontos de entrada), `frontend-v2-server-admin` (canais precisam de existir e ter ACL para haver conteúdo e permissões a testar).
- **Desbloqueia**: nada directamente — é consumível de forma independente da Fase 4, mas ambas completam a paridade funcional total.

## Revisão: reescrita do zero e fidelidade visual (2026-10-01)

Esta revisão resulta de `docs/v2/AUDIT-fidelity.md`, que concluiu que o frontend v2 entregue até aqui adoptou os tokens do design mas **não** a interface desenhada, e que grande parte do código descende da v1 (59% em média; 87–100% na voz/vídeo). Passam a valer quatro regras, transversais a todas as fases:

1. **Independência do frontend v1.** Nada de `frontend/` é reaproveitado: nenhum ficheiro, componente, folha de estilo, hook, estrutura de pastas nem decisão de implementação é copiado, adaptado ou usado como modelo, e `frontend/` não é lido para implementar. O que permanece da v1 é **só o backend** (contratos REST/WS, regras de acesso e modelo de dados), nos pontos em que é necessário e reaproveitável sem alteração. A aplicação v1 em execução pode ser usada como caixa-preta para observar comportamento de produto. Formatos criptográficos persistidos (cofre de identidade, envelope de chave de servidor, chave de canal, cifra de mensagem/anexo) são **contratos de dados** com contas existentes: são especificados em `docs/v2/contracts/` com vectores de teste (ver `frontend-v2-foundation`) e a v2 implementa a partir dessa especificação.
2. **Fidelidade visual por tela.** Uma tela só é dada como concluída quando comparada lado a lado com o `screen.png` do mockup correspondente, cumpre a lista de elementos obrigatórios do design deste change e obtém a classificação **Fiel** na escala de `docs/v2/AUDIT-fidelity.md` §2. A comparação fica registada em `verification.md`. Elementos desenhados nos mockups mas fora de escopo (AUDIT §6) não contam como em falta.

3. **Paridade funcional total.** Todas as funcionalidades que a aplicação tem hoje continuam a funcionar na v2, sem exceção. O inventário de referência é `docs/design-system/stitch-prompt.md` §3 mais o comportamento observável da v1 em execução, consolidado em `docs/v2/parity-checklist.md` (ver `frontend-v2-foundation`). Cada change verifica as funcionalidades da sua área contra essa checklist; uma funcionalidade só pode ser omitida se estiver explicitamente excluída do escopo (`docs/v2/TR-frontend-v2.md` §4.2 e §7). Renovar a interface nunca é motivo para retirar uma funcionalidade existente.
4. **Backend só muda por necessidade do frontend.** O backend da v1 é reaproveitado como está. Uma alteração de backend só é admitida quando um requisito do frontend v2 a exige e não há alternativa no cliente; nesse caso é uma tarefa explícita neste change, com o contrato actualizado em `docs/v2/contracts/`, compatível com a v1 enquanto o rollback for possível (alterações aditivas) e verificada com os testes de backend existentes (`cargo test`).

**Consequência para o estado actual:** o código existente em `frontend-v2/` para esta fase é descartável e será substituído; as tarefas foram reabertas e as `verification.md` anteriores ficam como histórico superado.
