# Design

## Context

O encaminhamento é pelo URL (`/servers/:serverId[/channels/:channelId | /settings[/:section]]` e `/account`), lido em `shell/state.tsx` (`route()`), e `shell.go(path)` navega com o router. Hoje:

- O ícone de fechar das configurações do servidor (`admin/settings/SettingsSidebar.tsx`) e a tecla Esc (`admin/settings/SettingsPage.tsx`) vão para `/servers/<id>`, que mostra "Escolha um canal" porque nada abre um canal por si.
- O botão "Voltar à Mesa" e a tecla Esc da conta (`pages/Account.tsx`) vão para `/`, a página inicial vazia. O botão só aparece a partir de `desktop`.
- Não há nenhum registo do último canal. O estado de voz (`voice/callSession.tsx`) é independente do URL e não muda com esta alteração.

Já existe um padrão de preferências locais (`lib/localPrefs.ts`, `readJson`/`writeJson`, com acesso protegido).

## Goals / Non-Goals

**Goals:**
- Voltar das configurações leva ao canal onde a pessoa estava.
- Falhar para o comportamento atual, nunca para um erro.

**Non-Goals:**
- Abrir o último canal ao clicar num servidor na rail, restaurar scroll ou rascunhos, e mexer no histórico do navegador.

## Decisions

### D1 — Registar no estado do shell, ao ver o canal
Um `createEffect` em `shell/state.tsx` regista `(serverId, channelId)` quando `route()` tem as duas coisas **e** o canal existe na lista do servidor (`channels.data`). Assim um URL inválido ou um canal que ainda carrega não fica lembrado. Abrir configurações não toca na memória (`route().channelId` é indefinido nessas páginas), o que cumpre sozinho "as configurações não substituem o último canal".
**Alternativa:** guardar no momento do clique em "configurações". Rejeitada: não cobre quem entra direto no endereço das configurações nem a conta aberta pelo menu.

### D2 — Memória em `mesa.lastChannel.v1`, por conta
Forma: `{ [accountId]: { last: { serverId, channelId }, byServer: { [serverId]: channelId } } }`, com `readJson`/`writeJson`, para cobrir "qualquer servidor" (conta) e "este servidor" (configurações do servidor) com o mesmo registo. Por conta, para que duas pessoas no mesmo navegador não se vejam. Um sinal reativo espelha o armazenamento, como em `sound/effects.ts`, para o estado funcionar sem armazenamento.
**Alternativa:** `sessionStorage`. Rejeitada: o utilizador espera continuar onde estava depois de recarregar, e recarregar já pede só o desbloqueio.

### D3 — Resolver o destino ao sair, com validação
Duas funções no módulo novo `shell/lastChannel.ts`, usadas pelos controlos: `channelTarget(serverId)` devolve `/servers/<s>/channels/<c>` se `c` está em `channels.data` do servidor; senão `/servers/<s>`. `accountTarget()` faz o mesmo com `last` e cai em `/`. A validação usa a lista de canais já carregada (`channels.data`); quando a lista do servidor ainda não está carregada, o destino espera por ela (não cai no servidor vazio por ainda não saber). Se o servidor do `last` já não existe, cai em `/`.
**Porquê:** um canal apagado ou sem acesso não aparece na lista (`GET /channels` filtra por acesso), por isso a mesma validação trata os dois casos sem pedidos extra.

### D4 — Esquecer ao apagar
O tratamento de `channel.deleted` em `state.tsx` (que já limpa as novidades) também remove o canal da memória. Mesmo sem isto a validação de D3 cobre o caso, mas evita que a chave cresça com ids mortos.

### D5 — Pontos de saída
Quatro, todos a chamar o destino de D3: ícone de fechar (`SettingsSidebar`), Esc (`SettingsPage`), botão "Voltar à Mesa" (`Account`) e Esc (`Account`, mantendo a regra de não sair durante a edição do nome). O botão do navegador fica como está (usa o histórico).

### D6 — Canais de voz
Tratados como qualquer canal. Voltar abre a rota do canal; a pré-entrada ou o palco aparecem conforme o estado da chamada já existente. Nenhum código de voz muda.

## Risks / Trade-offs

- **[Lista de canais ainda a carregar]** Se a pessoa sai das configurações logo após recarregar, `channels.data` pode ainda não existir. → Mitigação: D3 espera pela lista; é o único ponto com assincronia e fica coberto por um cenário de verificação.
- **[Canal lembrado sem acesso novo]** Perder o acesso entre sessões cai no servidor vazio. → Aceite: é o comportamento atual.
- **[Chave de armazenamento nova]** Pequena e por conta; limpa com `channel.deleted`. Sem migração.

## Open Questions

- O botão "Voltar à Mesa" da conta só aparece a partir do breakpoint `desktop` (1025 px, classe `hidden desktop:inline-flex`); abaixo disso a saída é pela navegação do shell e pela tecla Esc. Esta change não muda isso. Decisão registada com o responsável do projeto: a spec fica só com o destino do regresso.
- Clicar num servidor na rail devia abrir o último canal dele? Fora de escopo aqui, mas usa a mesma memória e seria uma extensão natural.
