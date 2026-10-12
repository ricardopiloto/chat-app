# Proposal

## Why

O botão que mostra ou esconde os membros usa o glifo de duas pessoas. No mockup do shell, `mesa_shell_da_aplica_o_chat_de_texto`, esse botão usa o Material Symbols `group`: uma pessoa à frente e duas ao lado. A forma geral de traço Lucide continua aceite; este nome ficou mapeado para o glifo errado.

## What Changes

- O nome de ícone `group` passa a desenhar o grupo de três pessoas do Lucide, o mais próximo do `group` do mockup.
- O botão da barra de topo e o do cabeçalho do canal, que já pedem esse nome, passam a mostrar esse glifo.
- O nome `groups` (vários grupos, usado noutro ecrã) não muda.

## Capabilities

### New Capabilities

- (nenhuma)

### Modified Capabilities

- `frontend-v2/app-shell`: o controlo de membros usa o glifo de três pessoas, não o de duas.

## Impact

- `frontend/src/components/ui/icon-map.ts`, entrada `group`.
- Sem alteração de comportamento do painel, só do desenho do ícone.
