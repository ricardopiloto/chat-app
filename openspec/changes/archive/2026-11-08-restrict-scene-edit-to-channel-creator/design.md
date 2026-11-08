# Design

## Context

`channel.created_by_account_id` existe na base e no modelo. A migração 0006 preencheu canais antigos com o dono do servidor. O backend verifica hoje `is_channel_admin(server.owner_account_id, account_id)` para operações de cena; a UI usa `shell.owner()`.

## Goals / Non-Goals

**Goals:** uma só regra de autorização para edição da cena, verificada no servidor e reflectida na UI.

**Non-Goals:** inferir o criador histórico real dos canais pré-migração ou mudar permissões de ACL/gestão do canal.

## Decisions

### D1: Comparar com o criador persistido

Usar `channel.created_by_account_id == account.id` nas mutações de cena, incluindo patch e activação quando aplicável, e a mesma comparação para apresentar o editor. Verificar que leituras continuam disponíveis a membros autorizados. Alternativa: usar permissão `can_manage_channels` ou dono do servidor; rejeitada porque amplia o conjunto para além do criador.

### D2: Canais históricos

Respeitar o valor persistido pelo backfill; não há dado fiável para recuperar outro criador histórico. Documentar essa limitação no teste de migração.

## Risks / Trade-offs

- O dono pode deixar de editar cenas de canais criados por terceiros; é a restrição pedida.
- Qualquer rota de mutação não coberta pela verificação comum seria uma fuga de autorização; auditar todas as rotas.
