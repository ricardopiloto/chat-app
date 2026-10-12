# Design

## Context

Ver `proposal.md` para a motivação e `specs/frontend-v2/text-messaging/spec.md` para o comportamento. Hoje `frontend/src/api/realtime.ts` usa `/ws` apenas para receber eventos; o servidor ignora quadros de texto excepto `ping`. `ChannelPage` tem a lista de mensagens em `.ch-stage`, com «Saltar para o presente» posicionado dentro dessa área, e o composer num `<footer class="ch-foot">` separado. O backend já dispõe de `require_write_text` e de `send_to_channel_viewers` para aplicar o acesso do canal. O envio de mensagens também verifica silenciamento activo.

## Goals / Non-Goals

**Goals:**

- Usar o canal de eventos existente com custo limitado e sem estado persistente.
- Fazer a indicação reflectir apenas membros autorizados do canal que a pessoa está a ver.
- Preservar a posição da leitura e a operação dos controlos próximos ao composer.

**Non-Goals:**

- Sincronizar rascunhos ou mostrar caracteres digitados.
- Manter histórico de digitação, notificações ou lista de quem já digitou.
- Mostrar o estado em canais de voz ou fora do canal de texto aberto.

## Decisions

1. **Protocolo efémero no WebSocket existente.** O cliente envia um quadro JSON estrito com `type: "typing"`, `channel_id` e `active` booleano. O servidor ignora formatos inválidos, limita o tamanho do quadro e obtém `account_id` da sessão autenticada, nunca do quadro. Após confirmar que é canal de texto, `require_write_text` e ausência de silenciamento activo, difunde `typing.updated` com `{channel_id, account_id, active}` através da filtragem de leitores de `send_to_channel_viewers`. Um quadro `active: false` também passa pela autorização vigente. Alternativa: endpoint HTTP ou mensagens persistidas; ambos adicionariam custo e estado inadequados a um sinal transitório.

2. **Heartbeat curto e expiração no cliente receptor.** O composer anuncia início após entrada de texto não vazio, renova em intervalos limitados enquanto houver entrada recente e envia paragem ao limpar, enviar, perder foco, trocar de canal, ser bloqueado ou ocultar a janela. Uma inactividade de aproximadamente 5 segundos cessa o anúncio local. Cada entrada recebida tem expiração de aproximadamente 6 segundos desde o último `active: true`; `active: false` remove imediatamente. Desconexão ou encerramento limpa a lista local, e nenhum quadro é enfileirado para reenvio. Limitar frequência por canal/conta no servidor evita abuso; o limite deve permitir a cadência escolhida para renovação. Alternativa: manter presença no backend; implicaria gerir timeouts distribuídos e estados por ligação.

3. **Estado e apresentação por canal.** `RealtimeConnection` oferece uma função tipada de envio que só actua com socket aberto; `ShellState` expõe essa função ao `ChannelPage`/`Composer`. `ChannelPage` assina os eventos, aceita só o `channel_id` actual, ignora a própria conta, resolve nomes usando a lista de membros já carregada e descarta entradas sem nome resolvido. A renderização mostra um ou dois nomes e resume os demais como «e mais N», com traduções pt-BR/en. Alternativa: publicar a lista globalmente no shell; teria maior superfície de estado e risco de misturar canais.

4. **Linha no fluxo do rodapé.** Uma linha de altura estável dentro de `.ch-foot`, acima de `.ch-composer`, usa as cores e a largura máxima existentes. O texto trunca em largura estreita. O botão `.ch-jump` continua dentro de `.ch-stage`, portanto não ocupa a mesma camada nem cobre a linha. Verificar também a barra de resposta e as sugestões do composer. Alternativa: posicionar absolutamente sobre a lista; poderia cobrir mensagens e o botão de salto.

## Risks / Trade-offs

- [Paragem perdida em falha de rede] → Expiração local nos receptores e limpeza no reconnect.
- [Muitos eventos ou clientes maliciosos] → Payload limitado, validação estrita, autorização em cada evento e limite de frequência no servidor; renovação espaçada no cliente.
- [Nome ainda não carregado] → Omitir a entrada até os membros serem resolvidos, sem mostrar UUID.
- [Mudança de tamanho do rodapé enquanto se lê] → Reservar uma linha estável e verificar visualmente scroll e botão de salto em tamanhos de janela distintos.

## Migration Plan

Adicionar suporte no servidor antes do cliente: clientes antigos ignoram `typing.updated`, e o servidor antigo ignora o novo quadro. A remoção do suporte cliente devolve o comportamento actual; não há migração de dados.
