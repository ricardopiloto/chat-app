# Proposal

## Why

A faixa de identidade no fundo da sidebar (avatar, nome, handle e botão de definições) continua diferente do mockup do shell. A correcção da 1.3.0 pintou o handle de verde (`text-secondary`) a partir da barra destacada de `mesa_menu_de_conta_popover_modal_de_sair`, que é outro estado. No shell em repouso, `mesa_shell_da_aplica_o_chat_de_texto`, o handle é `text-on-surface-variant` e a faixa é mais baixa e mais compacta do que a barra de 240×64 px que a aplicação mostra hoje.

## What Changes

- A faixa em repouso passa a seguir o bloco do shell, não a barra destacada do menu de conta: nome a 12 px em Plus Jakarta Sans e cor on-surface; handle a 11 px em JetBrains Mono e cor on-surface-variant, sem o sufixo "• Online"; avatar de 32 px; botão `tune` de 18 px com cantos de 8 px; linha com `px-1.5 py-1` e `gap-2`, em vez de `px-3 py-3` e `gap-3`.
- O contentor da faixa deixa de ser uma barra com `border-t` e `bg-surface-container`. No mockup o fundo do rodapé da sidebar é `bg-surface-container-lowest`, com `p-2`, e a linha da identidade não tem borda própria.
- O ponto de presença do avatar desta faixa usa 10 px e um anel da cor da superfície atrás dele (`surface-container-lowest`). Os outros avatares da aplicação não mudam.
- A forma do glifo `tune` continua fora de critério, pela excepção Lucide já na spec de fidelidade visual.

## Capabilities

### New Capabilities

- (nenhuma)

### Modified Capabilities

- `frontend-v2/app-shell`: o painel do utilizador em repouso passa a ter um requisito visual próprio para a faixa de identidade, alinhado a `mesa_shell_da_aplica_o_chat_de_texto`. O menu de conta e o modal de saída não mudam.

## Impact

- `frontend/src/shell/UserPanel.tsx` e, se o anel de presença não puder ficar só nesta faixa, o estilo local desse avatar.
- Sem alteração de API, de menu de conta, de controlos de chamada, nem do tamanho dos avatares no resto da aplicação.
