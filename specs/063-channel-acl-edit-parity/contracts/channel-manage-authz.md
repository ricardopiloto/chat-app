# Contrato: Autorização de gestão de canal

Âmbito: `GET/PUT /api/channels/{id}/acl`, `GET /api/channels/{id}/access/{accountId}`, `DELETE /api/channels/{id}`, `PATCH /api/channels/{id}` (rename/visibility). Auth: session.

## Gate unificado

Permitir se **qualquer**:

1. Caller é **dono** do servidor, ou  
2. Caller é **criador** do canal, ou  
3. Caller tem `can_manage_channels` **e** `effective_position(caller) > effective_position(channel creator)`.

## PUT ACL — sujeitos

Além do gate acima, se caller **não** é dono nem criador:

- Para cada entrada `account` / `role`: `effective_position(caller) > position(sujeito)`.
- `everyone`: sem check de posição extra.

## Erros

| Caso | HTTP | Notas |
|------|------|--------|
| Sem gate | 403 | Mensagem PT clara |
| Hierarquia (canal ou sujeito) | 403 | Preferir código alinhado a `hierarchy_denied` se já usado no cliente |
| Deny view em público | 400 | Inalterado (`deny_view_public`) |
| Último canal do tipo | 409 | Inalterado (`last_channel_of_type`) |

## Inspect

Mesmo gate unificado (não basta só `can_manage_roles` sem cumprir o gate).

## Rename / patch

Mesmo gate unificado (hierarquia incluída).
