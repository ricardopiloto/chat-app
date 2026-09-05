# Data Model: 019-members-invite-icons

Sem entidades de persistência novas. Estado de UI já existente + visibilidade derivada.

## `MembersTrigger` (chrome do canal)

| Campo | Fonte | Notas |
|-------|--------|-------|
| `expanded` | `membersOpen` (já sincronizado com o painel 008) | `aria-expanded`; chrome seleccionado quando `true` |
| `available` | canal com `server_id` | hoje o botão desactiva-se sem servidor; manter |
| `icon` | grupo (`IconUsers`) | um só desenho aberto/fechado |

Não há ciclo de vida novo: toggle continua a `toggleMembersPanel()`.

## `InviteTrigger` (chrome do servidor)

| Campo | Tipo | Notas |
|-------|------|--------|
| `visible` | boolean | `true` iff há servidor seleccionado **e** `owner_account_id === me.id` |
| `icon` | pessoa+ (`IconUserPlus`) | só montado se `visible` |

### Visibilidade

| Condição | Ícone convite |
|----------|----------------|
| Sem servidor | Oculto |
| Servidor seleccionado, utilizador = dono | Visível |
| Servidor seleccionado, utilizador ≠ dono | Oculto |

Activar (quando visível) → mesmo fluxo: `POST` convite + diálogo com URL (sem mudança de payload).

## Relação

- **Membros**: qualquer membro do servidor, no cabeçalho do **canal**.
- **Convite**: só dono, no cabeçalho da **coluna do servidor**.
- Painel de membros e diálogo de convite: entidades de UI inalteradas.

## Validação

- Não-dono: zero nós de gatilho de convite no header.
- Dono: um gatilho; clicar abre o diálogo existente.
- Membros: zero rótulo visível «Membros» no botão; painel continua a poder ter o título «Membros».
