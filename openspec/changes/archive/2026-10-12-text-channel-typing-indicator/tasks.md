# Tasks

## 1. Evento efémero e autorização no servidor

- [x] 1.1 Aceitar no `/ws` somente quadros de digitação com tamanho e campos limitados, mantendo `ping`; derivar a identidade da sessão, validar canal de texto, permissão de escrita e silenciamento, e verificar em teste de contrato que quadros inválidos ou contas impedidas não geram eventos.
- [x] 1.2 Difundir `typing.updated` só aos leitores autorizados do canal por `send_to_channel_viewers`, com limite de frequência por conta/canal e sem conteúdo digitado ou persistência; verificar em teste com dois canais e canal privado que apenas leitores recebem `{channel_id, account_id, active}` e que identidade fornecida no quadro não é aceite.

## 2. Emissão e recepção no frontend

- [x] 2.1 Adicionar envio tipado de estado de digitação a `RealtimeConnection` e expô-lo no shell apenas quando o socket estiver aberto, sem fila em reconnect; verificar que o envio não lança erro quando desligado e que os eventos recebidos chegam aos assinantes existentes.
- [x] 2.2 Ligar o composer ao estado local: anunciar início, renovar com cadência limitada enquanto houver digitação recente e parar ao limpar, enviar, perder foco, ficar oculto, mudar de canal ou entrar em modo restrito; verificar com relógio controlado que a inactividade pára o anúncio e que não há emissões repetidas por tecla.
- [x] 2.3 Manter no `ChannelPage` apenas membros activos do canal actual, excluir a própria conta, resolver nomes da lista de membros e expirar entradas após perda de renovação ou reconnect; verificar em teste que eventos de outro canal, sem nome ou expirados não aparecem.

## 3. Indicador e integração visual

- [x] 3.1 Criar a linha estável imediatamente acima do composer no fluxo de `.ch-foot`, com tokens visuais existentes, nomes resumidos, truncamento responsivo e textos pt-BR/en; verificar um, dois e três ou mais membros em larguras normais e estreitas, sem rolagem horizontal.
- [x] 3.2 Verificar manualmente com duas sessões que o indicador aparece e desaparece, e que na vista com mensagens antigas, «Saltar para o presente», resposta em composição e sugestões abertas todos permanecem legíveis e utilizáveis; executar `npm run build` em `frontend` e os testes de contrato do backend afectados.
