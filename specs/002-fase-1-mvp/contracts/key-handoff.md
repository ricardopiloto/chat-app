# Contrato: Handoff da chave do Servidor (E2EE)

Ver decisão [D5](../research.md#d5--e2ee-de-texto-e-mídia-uma-chave-simétrica-por-servidor-handoff-online-entre-clientes) e a entidade [KeyEnvelope](../data-model.md#keyenvelope). Protocolo pelo qual um novo membro recebe a `server_key` (AES-256-GCM, única por Servidor, reusada para texto e como frame key de mídia) sem o backend jamais vê-la em claro.

## Passo a passo

1. **Criação do Servidor**: o cliente do dono gera `server_key` localmente e cria seu próprio `KeyEnvelope` (`sealed_key` = `server_key` envelopada para a própria `identity_pubkey`) via `POST /servers/{id}/key-envelopes`. `Membership.key_handoff_status = synced` para o dono desde o início.
2. **Convite aceito**: `POST /invites/{code}/accept` cria a `Membership` do novo membro com `key_handoff_status = pending` e publica `key_handoff.requested` (payload: `account_id`, `identity_pubkey` do novo membro) para todo cliente do Servidor já `synced` — ver [ws-events.md](./ws-events.md). Se o convite traz semente (`docs/v2/contracts/crypto-formats.md` §11) e o link traz o fragmento, o cliente abre a `server_key` localmente, publica o próprio envelope e fica `synced` sem ninguém online. Sem fragmento, o membro fica `pending`.
3. **Handshake**: o primeiro cliente `synced` que estiver online recebe o evento, desenvelopa sua própria cópia de `server_key` (já tem localmente, não precisa pedir a ninguém), a envelopa para a `identity_pubkey` recebida (`crypto_box_seal`) e chama `POST /servers/{id}/key-envelopes` com o resultado.
4. **Persistência opaca**: o backend grava o `KeyEnvelope` (bytes opacos) e atualiza `Membership.key_handoff_status = synced` para o novo membro; publica `key_handoff.completed` para ele.
5. **Consumo**: o novo membro busca seu `KeyEnvelope` (endpoint de leitura implícito em `GET /auth/me` ou dedicado — detalhar em `tasks.md`/implementação), desenvelopa com sua chave privada (nunca sai do navegador) e guarda `server_key` em memória/IndexedDB local para cifrar/decifrar mensagens e a mídia LiveKit deste Servidor.

## Propriedades garantidas

- O backend só manipula `sealed_key` (ciphertext assimétrico) — nunca decifra, nunca vê `server_key` em claro. Cumpre FR-015/SC-006.
- Corrida entre múltiplos clientes `synced` respondendo ao mesmo `key_handoff.requested`: o handoff para um membro pendente continua autorizado. A criação da primeira chave do servidor é o primeiro escritor. Repetir o próprio envelope com os mesmos bytes responde 201 e não emite `key_handoff.completed`. Bytes diferentes no próprio envelope, ou um segundo envelope quando o servidor já tem chave e a conta ainda não tem o seu, respondem 409 `{ "error": "key already exists" }`. `GET /servers/{id}/key-envelopes/exists` devolve `{ "exists": true|false }` sem a chave.

## Fallback quando não há semente

Convites antigos, link sem fragmento e a recuperação de senha por código do operador continuam neste handoff online. Se nenhum cliente `synced` estiver online no aceite, o novo membro permanece `pending` e a interface diz que aguarda um membro online. Quando um membro `synced` liga, o servidor reenvia `key_handoff.requested` de todos os `pending` dos servidores dele. O cliente atende esses pedidos de forma idempotente.
