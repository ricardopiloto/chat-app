# Contrato: Apagar canal — paridade

Âmbito: `DELETE /api/channels/{id}` + acção apagar na sidebar.

## Autorização

Mesmo [gate unificado](./channel-manage-authz.md) que ACL/rename (inclui hierarquia na via «Gerenciar canal»).

## UI

- Acção apagar visível sob as mesmas condições que permissões/rename (helper partilhado).
- Confirmação existente mantém-se.
- Não apaga o servidor.

## Regras de negócio inalteradas

- Não apagar o último canal de um tipo (texto / voz) nem o último canal do servidor (`409` existentes).

## FE vs BE (estado pré-feature)

- BE já aceitava `can_manage_channels` sem hierarquia; FE restringia a dono/criador.
- Esta feature: FE alarga; BE adiciona hierarquia FR-010a.
