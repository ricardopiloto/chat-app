# Design

## Context

`VoicePage.tsx` renderiza Stage, estado «A ligar...», ou GreenRoom. `GreenRoom.enter()` escolhe modo e preferências e chama `call.join()`. A chamada já repõe `status` para `idle` e preenche `problem` após falha. `Sidebar.tsx` já mostra ocupantes de `shell.voiceRoster()` em cada canal antes de entrar. `Content.tsx` mantém `VoicePage` keyed por id; a entrada automática precisa de uma tentativa por activação do canal e não deve repetir a tentativa ao actualizar sinais ou objectos de canal. Ver `proposal.md` para a decisão de produto.

## Goals / Non-Goals

**Goals:** entrada directa previsível; câmara desligada ao entrar; retry explícito após falha; troca de canal e popout sem chamadas paralelas.

**Non-Goals:** alterar permissões do servidor, mudar o default do microfone, criar outro teste de vídeo, ou remover o preview de câmara das definições.

## Decisions

### D1: Câmara sempre desligada no join automático

Passar `cam: false` em todo join automático, mesmo se `prefs.camOn()` guardou `true`. Alterar `devices.ts` para `camOn: () => saved().camOn ?? false` torna o estado inicial coerente quando não há preferência. A preferência guardada pode continuar a representar o último estado nos controlos, mas não autoriza publicar vídeo num novo join; a UI da chamada deve reflectir a faixa realmente desligada. O microfone segue `prefs.micOn()` (default `true`). Alternativa: respeitar `prefs.camOn()` no join; rejeitada porque poderia ligar a câmara sem a acção explícita pedida.

### D2: Falha com retry explícito

`VoicePage` inicia `call.join()` uma vez por activação do canal. Enquanto `connectingHere()` mostra «A ligar...». Se `call.problem()` estiver definido para essa tentativa, mostra um estado de erro pequeno, motivo localizado, botão «Tentar novamente» e link para Áudio & Vídeo. O retry chama a mesma função; nenhuma mudança de sinal deve disparar retry. Preferir componente simples a renderizar `GreenRoom`, pois este abre previews de hardware, reintroduz escolhas e teste de vídeo e pode mascarar falhas. Ao navegar para outro canal, descartar estado de tentativa anterior. Tratar promessas concorrentes e desmontagem para impedir join tardio no canal errado.

### D3: Retirar modo «test» desta superfície

Remover a acção de `GreenRoom` e o caminho `request.mode === "test"`/faixa sintética quando não houver outro chamador. O preview de câmara nas definições cobre a necessidade de testar o dispositivo sem entrar na chamada. Alternativa: conservar um botão de teste após entrar; rejeitada por voltar a publicar faixa sintética numa chamada real e criar um modo especial sem necessidade.

### D4: Acesso e roster

Usar o acesso efectivo (`shell.owner()` ou `channel.my_permission === "speak"`), tal como em `GreenRoom`, para escolher `full` com `mic: prefs.micOn(), cam: false` ou `listen` sem mic/câmara. Actualizações de canais e papéis devem ocorrer antes da decisão se o estado estiver desactualizado; testar convidado sem cargo e alteração de permissão. O roster da sidebar já mostra ocupantes antes de abrir o canal, logo a remoção da lista lateral do GreenRoom não perde essa informação.

## Risks / Trade-offs

- [Efeito reactivo ou remount pode iniciar joins repetidos] → limitar tentativa por activação, guardar tentativa pendente e exigir retry manual após erro.
- [Trocar canal enquanto um join está pendente pode publicar no destino errado] → proteger por id/geração e usar o cancelamento já previsto em `call.join()`.
- [Câmara guardada como ligada pode confundir a UI] → separar preferência persistida do estado real da faixa na chamada e verificar o indicador.
- [Permissão do microfone negada] → mostrar erro accionável e caminho para definições, sem loop de retry.

## Migration Plan

Actualizar deltas de `voice-session`, `call-popout` e `settings-return` e a checklist de paridade na implementação. Sem migração de dados: preferências antigas continuam legíveis, mas a câmara não liga automaticamente. Reversão: restaurar GreenRoom como fallback e retirar o join automático, preservando o formato de preferências.

## Open Questions

Nenhuma que altere o escopo ou a abordagem. O texto exacto do estado de erro pode seguir o catálogo de traduções existente.
