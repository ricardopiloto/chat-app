# Contrato: Handoff da chave do Servidor (E2EE)

Ver decisão [D5](../research.md#d5--e2ee-de-texto-e-mídia-uma-chave-simétrica-por-servidor-handoff-online-entre-clientes) e a entidade [KeyEnvelope](../data-model.md#keyenvelope). Protocolo pelo qual um novo membro recebe a `server_key` (AES-256-GCM, única por Servidor, reusada para texto e como frame key de mídia) sem o backend jamais vê-la em claro.

## Passo a passo

1. **Criação do Servidor**: o cliente do dono gera `server_key` localmente e cria seu próprio `KeyEnvelope` (`sealed_key` = `server_key` envelopada para a própria `identity_pubkey`) via `POST /servers/{id}/key-envelopes`. `Membership.key_handoff_status = synced` para o dono desde o início.
2. **Convite aceito**: `POST /invites/{code}/accept` cria a `Membership` do novo membro com `key_handoff_status = pending` e publica `key_handoff.requested` (payload: `account_id`, `identity_pubkey` do novo membro) para todo cliente do Servidor já `synced` — ver [ws-events.md](./ws-events.md).
3. **Handshake**: o primeiro cliente `synced` que estiver online recebe o evento, desenvelopa sua própria cópia de `server_key` (já tem localmente, não precisa pedir a ninguém), a envelopa para a `identity_pubkey` recebida (`crypto_box_seal`) e chama `POST /servers/{id}/key-envelopes` com o resultado.
4. **Persistência opaca**: o backend grava o `KeyEnvelope` (bytes opacos) e atualiza `Membership.key_handoff_status = synced` para o novo membro; publica `key_handoff.completed` para ele.
5. **Consumo**: o novo membro busca seu `KeyEnvelope` (endpoint de leitura implícito em `GET /auth/me` ou dedicado — detalhar em `tasks.md`/implementação), desenvelopa com sua chave privada (nunca sai do navegador) e guarda `server_key` em memória/IndexedDB local para cifrar/decifrar mensagens e a mídia LiveKit deste Servidor.

## Propriedades garantidas

- O backend só manipula `sealed_key` (ciphertext assimétrico) — nunca decifra, nunca vê `server_key` em claro. Cumpre FR-015/SC-006.
- Corrida entre múltiplos clientes `synced` respondendo ao mesmo `key_handoff.requested`: idempotente — `POST /servers/{id}/key-envelopes` faz upsert por `(server_id, account_id)`; o último envelope aceito vale (todos envelopam a mesma `server_key`, então não há divergência de conteúdo, só bytes de cifragem diferentes).

## Limitação conhecida (não bloqueia o done desta fase)

Se **nenhum** cliente `synced` estiver online no momento do aceite do convite, `key_handoff.requested` não tem quem o atenda imediatamente; o novo membro permanece `pending` (UI mostra "sincronizando") até que algum membro já sincronizado abra o cliente — o servidor reenvia `key_handoff.requested` a qualquer cliente `synced` que conectar enquanto houver `Membership` `pending` no Servidor. Nenhum Acceptance Scenario da spec exercita esse caminho; registrado aqui para não deixar a lacuna implícita na implementação.
