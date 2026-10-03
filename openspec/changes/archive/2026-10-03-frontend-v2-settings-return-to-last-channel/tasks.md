# Tasks

## 1. Memória do último canal

- [x] 1.1 Criar `frontend/src/shell/lastChannel.ts` com a memória `mesa.lastChannel.v1` (`{ [accountId]: { last, byServer } }`) sobre `readJson`/`writeJson`, espelhada num sinal reativo; funções para registar `(serverId, channelId)`, ler o último de um servidor, ler o último global e esquecer um canal. Verificar em Node (padrão dos `scripts/verify-*.mjs`): registar dois canais em dois servidores, ler por servidor e global, esquecer um canal, e armazenamento que lança erro sem falhar
- [x] 1.2 Registar o canal em `shell/state.tsx`: `createEffect` que grava quando `route()` tem servidor e canal **e** o canal existe em `channels.data`; abrir configurações ou conta não grava. Verificar no navegador: abrir canais em dois servidores e conferir a chave local; abrir `/account` e as configurações e confirmar que não mudam
- [x] 1.3 Esquecer o canal no tratamento de `channel.deleted` de `shell/state.tsx`. Verificar com duas sessões: apagar o canal lembrado por outra sessão remove-o da memória

## 2. Destino ao sair das configurações

- [x] 2.1 Implementar `channelTarget(serverId)` e `accountTarget()` (D3): devolvem a rota do canal só se ele estiver em `channels.data` do servidor (para a conta, também só se o servidor ainda existe), senão `/servers/<id>` e `/`; quando a lista de canais ainda não carregou, o destino espera por ela. Verificar em Node a escolha entre canal lembrado, canal inexistente, sem memória e servidor inexistente
- [x] 2.2 Ligar as configurações do servidor: ícone de fechar em `admin/settings/SettingsSidebar.tsx` e Esc em `admin/settings/SettingsPage.tsx` (mantendo a regra de não sair com diálogo aberto) ao destino de `channelTarget`. Verificar no navegador: voltar ao canal em que estava, por ícone e por Esc; Esc com diálogo aberto não sai
- [x] 2.3 Ligar a conta: botão "Voltar à Mesa" e Esc em `pages/Account.tsx` ao destino de `accountTarget` (Esc continua a não sair durante a edição do nome). Verificar: voltar ao último canal do servidor em que estava; passar antes pelas configurações do servidor não muda o destino; Esc durante a edição do nome só cancela a edição

## 3. Casos limite

- [x] 3.1 Verificar o canal de voz como último canal (volta à pré-entrada, ou ao palco com a chamada em curso, sem entrar na chamada por si) e o canal apagado ou sem acesso (cai no servidor sem canal aberto, sem erro)
- [x] 3.2 Verificar entrar direto no endereço das configurações com um canal lembrado de uma sessão anterior (desbloqueio e fecho abrem esse canal) e recarregar logo antes de sair (a lista de canais ainda a carregar não faz cair no servidor vazio)
- [x] 3.3 Verificar que o botão "Voltar" do navegador continua a regressar ao endereço anterior do histórico

## 4. Fecho

- [x] 4.1 Executar `tsc --noEmit`, `eslint src` e `npm run verify:i18n-keys`; confirmar que não há texto novo por traduzir. (`npm run check:v1-overlap` obsoleto: a v1 foi removida na virada e o script falha em todos os ficheiros; tsc, eslint e verify:i18n-keys passam.)
- [x] 4.2 Acrescentar a funcionalidade a `docs/v2/parity-checklist.md` (secção 13, acréscimos) com os itens verificados acima
