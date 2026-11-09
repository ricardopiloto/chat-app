# Tasks

## 1. Persistência e contrato backend

- [ ] 1.1 Criar migração nullable para o pin no canal e adaptar `db::channel`/`domain::channel`; verificar migração em banco existente e novo e serialização do ID.
- [ ] 1.2 Implementar leitura do estado para espectadores e PUT/DELETE transacionais com `require_channel_manager`, validação de mensagem do mesmo canal e precondição contra troca concorrente; verificar testes de permissão, pin único, alvo inválido e 409.
- [ ] 1.3 Integrar exclusão da mensagem pinada com limpeza do estado e evento; verificar em teste que o canal volta a não ter pin após exclusão e que outra mensagem não é afetada.
- [ ] 1.4 Publicar `channel.pin_changed` apenas para espectadores autorizados após mutações; verificar payload e audiência em testes backend.

## 2. Estado e interface frontend

- [ ] 2.1 Adicionar contrato API/tipos e tratamento de `channel.pin_changed` e ressincronização após reconexão; verificar teste de troca, remoção e evento perdido.
- [ ] 2.2 Adicionar ações de pin/despin à mensagem usando `canManageChannel`, diálogo de substituição antes do PUT, cancelamento sem mutação e tratamento de 409; verificar fluxos em teste de interface.
- [ ] 2.3 Renderizar informativo persistente para todos os espectadores, sem expor texto claro do servidor, e limpar após despinar/excluir; verificar visibilidade para membro comum e gestor.
- [ ] 2.4 Conectar o clique ao `?msg=` e ao destaque existentes, cobrindo clique repetido e mensagem além de dez páginas; verificar salto até mensagem antiga com centralização e destaque e estado de erro se alvo indisponível.
- [ ] 2.5 Adicionar rótulos e mensagens de confirmação/erro em pt-BR e en e estilos responsivos; verificar chaves i18n e visualização em viewport estreito e largo.

## 3. Integração

- [ ] 3.1 Executar testes backend/frontend e `openspec validate pinned-channel-messages --strict`; verificar cenário com dois gestores, um membro comum, exclusão da pinada e reconexão.
