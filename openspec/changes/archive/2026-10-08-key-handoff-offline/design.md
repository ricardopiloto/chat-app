# Design

## Context

- Chave única por servidor (`server_key`), selada por membro com `crypto_box_seal` para a `identity_pubkey` dele. O backend só guarda bytes opacos.
- `replay_pending_handoffs` (`backend/src/ws/mod.rs`) já reenvia `key_handoff.requested` de **todos** os `pending` a cada membro `synced` que conecta. O fallback em lote já existe no servidor.
- Convites: até `INVITE_MAX_USES = 10` usos, expiração opcional, revogáveis. O código vai no caminho `/invite/<code>`; o backend vê o código.
- `accept_invite` tem dois ramos: utilizador com sessão, e visitante que se regista no mesmo pedido via `register_inner`.
- `POST /servers/{id}/key-envelopes` devolve 409 quando o servidor já tem chave e a conta ainda não tem o seu envelope, e recusa sobrescrever o envelope de um membro `synced`. O backend não consegue validar a `server_key`.
- O backend já envia `Referrer-Policy: no-referrer` (`security_headers.rs`).

## Goals / Non-Goals

**Goals:** o convidado fica `synced` na aceitação, sem ninguém online; o backend nunca vê a chave em claro nem a chave efémera; degradação segura para o handoff online.

**Non-Goals:** rotação de chave ao remover membros; recuperação de identidade (a recuperação por código do operador continua no handoff online); mudar o formato do envelope.

## Fluxo

```mermaid
sequenceDiagram
    participant C as Criador (synced)
    participant B as Backend
    participant G as Convidado
    C->>C: gera par efémero; sela server_key para a pública
    C->>B: POST invites {key_seed: blob selado}
    C-->>G: link /invite/CODE#k=privada efémera (fragmento não vai à rede)
    G->>B: POST invites/CODE/accept (sessão ou registo)
    B-->>G: membership + key_seed (só aqui)
    G->>G: lê #k, limpa o hash, abre a server_key, verifica a chave
    G->>B: POST key-envelopes (envelope próprio)
    B-->>G: synced
```

## Decisions

**D1 — Semente no fragmento.** O criador (que tem a `server_key`) gera um par efémero X25519, sela a `server_key` para a pública efémera (`seed_sealed`) e coloca `#k=<privada efémera b64url>` no link. Alternativa descartada: pôr o blob inteiro no fragmento (link ~100 bytes maior, mas viável); escolhido guardar o blob no convite para manter o link curto.

**D2 — Semente entregue só na resposta do `accept`.** `POST /servers/{id}/invites` aceita `key_seed` opcional (base64, tamanho limitado). A resposta de `accept_invite` devolve `key_seed` em **ambos** os ramos (sessão e visitante via `register_inner`). Quem já é membro (`exists`) recebe a membership sem a semente. O preview anónimo e a listagem nunca a devolvem. Convites sem `key_seed` seguem o handoff online. Aditivo, sem breaking. Alternativa descartada: devolvê-la no preview (expõe o blob a anónimos).

**D3 — Elegibilidade derivada, sem token.** `post_envelope` aceita o envelope **próprio** de uma conta quando: é membro `pending`, `joined_via_invite_id` aponta para um convite que teve semente, e a conta ainda não tem envelope. Isto é avaliado dentro do `BEGIN IMMEDIATE` já existente, antes do ramo `own`, e tem precedência sobre a regra `others > 0` que produz o 409 de "key already exists". Alternativas descartadas: `seed_token` de uso único (tabela, expiração e limpeza extra para o mesmo efeito); aceitar o envelope próprio de qualquer `pending` (permitiria a um `pending` sem convite escrever uma chave arbitrária).

**D4 — O link é um segredo.** Quem tem o link, até aos 10 usos, obtém a chave. Mitigações: expiração curta por omissão quando há semente (24 h), aviso no diálogo, uso limitado. A revogação já impede novas aceitações (o `accept` recusa convites revogados), logo ninguém novo recebe a semente. O blob permanece na coluna, e a elegibilidade de D3 depende de `joined_via_invite_id` apontar para um convite com `key_seed` não nulo, por isso quem já aceitou e ainda não publicou o envelope continua elegível. `include_history` continua a ser **política do servidor**, não garantia criptográfica: com chave única por servidor, a semente dá acesso a todo o histórico que o servidor entregar, tal como o handoff online. Alternativas descartadas: link de uso único (quebra o convite de grupo); semente cifrada com senha (atrito, e a senha teria de viajar por outro canal).

**D5 — Criador sem chave.** Se o criador está `pending`, o diálogo cria o convite sem semente e avisa. Não bloqueia o convite. Alternativa descartada: bloquear a criação (impede convidar durante a indisponibilidade que a change quer tolerar).

**D6 — Fallback em lote e idempotente.** `handleHandoffEvent` passa a deduplicar por `account_id` durante a sessão e a limitar a concorrência (4 envelopes em voo); o 409 de envelope repetido conta como sucesso. Parâmetros fixados porque o teto de 10 usos por convite limita o pior caso por convite e o cenário de centenas de pendentes já é medido por `backend/tests/scale.rs`. Alternativa descartada: coordenação no servidor para eleger quem responde (estado novo no backend, sem ganho: o 409 já torna a corrida inofensiva).

**D7 — Estado "aguardando um membro online".** Reutiliza o estado `noKey` de `chat/thread.ts` (que já reage a `key_handoff.completed`) em vez de criar outro estado, com mensagem explícita em `pt-BR` e `en`. Alternativa descartada: notificar por e-mail (a instância não tem e-mail, ver Technical Review do item 18).

**D8 — Verificação da chave antes de publicar.** Como o backend não valida a `server_key` e não permite sobrescrever o envelope de um membro `synced`, o cliente verifica a chave aberta antes de publicar o envelope: decifra uma mensagem existente do servidor ou, na falta de mensagens, um valor de verificação. Se falhar, não publica, mantém-se `pending` e cai no handoff online. Alternativa descartada: permitir reescrever o envelope de um `synced` (alarga a superfície de ataque do contrato inteiro).

**D9 — Fragmento no cliente.** `Invite.tsx` lê `location.hash` antes de qualquer navegação do roteador e limpa-o com `history.replaceState` logo após a leitura. O roteador e o deep link do Tauri preservam o fragmento até essa leitura. O vazamento por `Referer` já está coberto por `Referrer-Policy: no-referrer`, sem tarefa nova.

**D10 — Observabilidade.** Log `info` de convite aceito com semente e sem semente, sem conteúdo do blob nem da chave, para depurar quem ficou `pending`.

## Risks / Trade-offs

- [Vazamento do link dá a chave] → expiração curta, aviso, 10 usos, revogação para novas aceitações.
- [Semente adulterada deixa o convidado `synced` com chave errada, sem reparação] → verificação do cliente em D8; o risco residual (nenhuma mensagem nem valor de verificação para comparar) cai em `pending` por segurança.
- [Regressão em `post_envelope`, onde `password-recovery` também mexe] → ordem de merge depois de `password-recovery`; testes cobrem a regra `others > 0` e o 409.
- [Aceitação concorrente do mesmo convite] → o incremento de uso continua atómico (`try_increment_use`).
- [Cliente antigo ignora `key_seed`] → cai no handoff online, comportamento atual.

## Migration Plan

Migração aditiva `0024`: coluna `invite.key_seed` anulável. Rollback: ignorar a coluna; links com fragmento deixam de abrir a chave e caem no handoff online. Ordem de merge: depois de `password-recovery`.

## Open Questions

- Mostrar contagem de membros `synced` online na UI (depende de presença já exposta pelo WS).
