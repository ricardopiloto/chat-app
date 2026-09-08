# Contrato: UI — Permissões do canal

Âmbito: menu de contexto do canal na sidebar + `ChannelAclPanel`.

## Visibilidade da acção «Permissões do canal»

Mostrar **somente** quando o cliente considera o utilizador autorizado pelo [gate unificado](./channel-manage-authz.md) (aproximação: dono ∪ criador ∪ `can_manage_channels`, e hierarquia se posições conhecidas).

## Painel

- Visibilidade + sobrescritas + inspecção: inalterados em semântica.
- Inspecção: disponível no painel para quem abriu o painel (mesmo gate); falhas de API mostram erro claro.
- Guardar: `PATCH` canal (visibilidade) + `PUT` ACL; 403 → toast/mensagem, sem estado parcial confuso.

## Fora deste contrato

- Página Perfis / RolePermissions (Geral/Texto/Voz).
- Alterar ordem de resolução Allow/Deny.
