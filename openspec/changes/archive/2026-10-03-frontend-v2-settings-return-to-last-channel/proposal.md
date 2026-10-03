# Proposal

## Why

Quem abre as configurações (as da conta ou as de um servidor) e carrega em "voltar" cai num sítio que não é o de onde saiu: a conta leva à página inicial vazia (`/`) e as configurações do servidor levam ao servidor sem nenhum canal aberto ("Escolha um canal"). A pessoa perde o canal em que estava a conversar e tem de o procurar de novo na sidebar.

## What Changes

- Passa a haver memória do **último canal aberto**, por servidor, mais o último canal aberto em qualquer servidor.
- **Configurações do servidor**: o fecho (ícone de fechar da barra lateral das configurações e a tecla Esc) volta ao último canal desse servidor.
- **Configurações da conta**: o botão "Voltar à Mesa" e a tecla Esc voltam ao último canal que a pessoa tinha aberto, no servidor em que estava.
- Se esse canal já não existe ou deixou de estar acessível, ou se ainda não houve nenhum, o comportamento é o de hoje (servidor sem canal aberto; página inicial na conta), sem erro.
- A memória fica neste dispositivo e sobrevive a recarregar a página.
- **Fora de escopo**: abrir sempre o último canal ao clicar num servidor na rail, restaurar a posição de scroll ou o rascunho, e mudar o comportamento do botão "Voltar" do navegador (que já regressa ao endereço anterior).

## Capabilities

### New Capabilities
- `frontend-v2/settings-return`: memória do último canal aberto e regresso a ele a partir das configurações da conta e do servidor.

### Modified Capabilities
_Nenhuma. O comportamento de "voltar" das configurações não está especificado em nenhum spec atual (`account` e `server-management` não descrevem o destino), por isso a regra nova entra como capacidade própria em vez de alterar requisitos existentes._

## Impact

- **Código**: `frontend/src/shell/state.tsx` (registar o último canal e expor o destino de regresso), `shell/lastChannel.ts` (novo, memória e validação), `pages/Account.tsx` (botão e Esc) e `admin/settings/SettingsSidebar.tsx` e `SettingsPage.tsx` (ícone de fechar e Esc). Texto: nenhum novo (o rótulo "Voltar" já existe).
- **Armazenamento**: uma chave local nova, `mesa.lastChannel.v1`.
- **Backend, API e dependências**: nenhum.
- **Depende de**: nada pendente. O código da v2 vive agora em `frontend/` (a antiga v1 foi removida na virada), e os caminhos desta change são relativos a essa pasta.
