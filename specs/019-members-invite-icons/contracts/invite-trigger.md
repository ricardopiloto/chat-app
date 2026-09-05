# Contrato: Gatilho de convite no cabeçalho do servidor

Âmbito: `Sidebar.tsx` header. Reutiliza `POST /api/servers/{id}/invites` (já só dono). Sem contrato REST novo.

## Controlo

| Aspecto | Contrato |
|---------|----------|
| Sítio | Cabeçalho da coluna do servidor: **nome à esquerda**, ícone à **direita**, mesma linha |
| Visual | Ícone só — pessoa com mais. Distinto do grupo de membros |
| Nome | `aria-label` + `title` = `Convite` |
| Visível | Iff servidor seleccionado **e** utilizador é dono. Caso contrário **não renderizar** (não basta `disabled`) |
| Acção | Mesmo fluxo que o botão «Convite» actual (`createInvite` + diálogo URL) |
| Removido | Botão textual no fundo da lista (`.sidebar-actions`) |

## API existente (intocada)

- `POST /api/servers/{server_id}/invites` — body `{ include_history }`; **403** se não dono.
- O chrome deixa de expor o gatilho a quem receberia 403.

## Layout

- Nome do servidor continua a poder truncar com reticências; o ícone não deve ser esmagado.
- Em Modo Palco com coluna colapsada, o header (e o ícone) pode desaparecer com o chrome actual — sem segundo atalho.

## Fora deste contrato

- Redesign do diálogo «Convite».
- Permitir convites a não-donos.
- Atalho «Convidar» no painel de membros.
