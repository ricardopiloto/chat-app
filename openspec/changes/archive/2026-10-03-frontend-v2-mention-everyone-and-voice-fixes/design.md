# Design

## Context

**Menções.** As mensagens são cifradas no cliente: o servidor só vê `content_ciphertext` e a lista `mentioned_account_ids` que o cliente declara. Para cada id válido (membro que vê o canal) o servidor grava `message_mention` e cria uma `user_notification` do tipo `mention`, entregue por WebSocket (`notification.created`). O limite é `MAX_MENTIONS_PER_MESSAGE = 20` (`backend/src/api/messages.rs`). As permissões dos cargos vivem em `RoleCapabilities` (`backend/src/domain/server_role.rs`), uma coluna `INTEGER` por permissão em `server_role` (precedente: migração `0015_channel_mute_and_cap.sql`, `can_mute_members`), com `open_defaults()` para quem não tem cargo e `owner_all()` para o dono. Na UI, os interruptores estão agrupados em `admin/settings/Roles.tsx`.

**Câmara.** A chamada abre a câmara com `setCameraEnabled(true)` e aplica o desfoque como um processador (`@livekit/track-processors`) sobre a faixa (`callSession.tsx`, `applyBlur`). Desligar chama `setCameraEnabled(false)` **sem parar o processador**. No `livekit-client` instalado, `LocalVideoTrack.mute()` só pára a faixa de captura (`_mediaStreamTrack`); o processador tem a sua própria faixa de saída (`processor.processedTrack`) e `LocalTrack.stopProcessor()` é que a pára. A pré-visualização (`voice/preview.ts`) faz uma cópia da faixa (`source.clone()`) para o desfoque e guarda-a em `processed`.

**Convidado sem cargo.** O servidor trata quem não tem cargo com `RoleCapabilities::open_defaults()` (falar e ligar à voz ligados), de modo que o seu acesso a um canal de voz público é `speak` e `POST .../voice/join` devolve `can_speak: true`. O cliente é que decide outra coisa: `GreenRoom.tsx` calcula `canSpeak = owner || (my_permission === "speak" && shell.can("can_speak_voice"))`, e `shell.can` só devolve verdadeiro se a pessoa tiver um **cargo** com a capacidade (`memberHasCapability`). Sem cargo, `can(...)` é sempre falso, mesmo para capacidades ligadas por omissão, e a pessoa fica "só ouvir".

## Goals / Non-Goals

**Goals:**
- `@todos` com permissão própria, verificada no servidor, que notifica todos os que veem o canal.
- Desligar a câmara liberta tudo, com ou sem desfoque.
- Um membro sem cargo entra e participa nos canais de voz públicos.

**Non-Goals:**
- `@here`, `@cargo`, limite de frequência de `@todos`, alterar o limite de 20 menções individuais, e alterar as regras de ACL.

## Decisions

### D1 — Capacidade `can_mention_everyone`, desligada por omissão
Coluna nova `can_mention_everyone INTEGER NOT NULL DEFAULT 0` em `server_role` (migração `0022`), campo `#[serde(default)]` em `RoleCapabilities`, `false` em `open_defaults()`, `true` em `owner_all()`, e `||` na agregação, como `can_mute_members`. A API de cargos já devolve e aceita `capabilities`, por isso só ganha o campo. Cargos existentes ficam sem a permissão (o `DEFAULT 0` cobre-os). **Alternativa:** reutilizar "gerir canais" ou "apagar mensagens". Rejeitada: pedido explícito de uma permissão própria, e as outras têm outro significado.

### D2 — O cliente declara `mention_everyone`, o servidor decide
Como o texto é cifrado, o servidor não pode procurar `@todos`. O corpo de `POST .../messages` ganha `mention_everyone: bool` (opcional, `false` por omissão). O servidor aplica-o **só** se quem escreve é o dono ou tem `can_mention_everyone`; caso contrário ignora-o em silêncio (a mensagem segue como texto simples). Quando aplica: junta aos alvos todos os membros do servidor com `access.view` no canal (mesma verificação `channel_access` que já filtra as menções individuais), exclui quem escreve e cria as notificações de uma vez, numa transação, com o evento `notification.created` para cada. Não conta para o limite de 20.
**Alternativa:** o cliente expandir `@todos` em ids. Rejeitada: o limite de 20, o custo de enviar a lista, e a permissão ficaria só no cliente.

### D3 — Marca na mensagem: `mentions_everyone`
Coluna nova `mentions_everyone INTEGER NOT NULL DEFAULT 0` em `message` (mesma migração) e campo `mentions_everyone: bool` no `Message` (omitido quando falso, como os outros opcionais), presente no `message.new` e nas listagens. É isto que permite aos outros clientes destacar `@todos` **só** quando o servidor o autorizou, em vez de adivinharem pelo texto.

### D4 — `@todos` como palavra reservada no cliente
O composer só envia `mention_everyone: true` se a pessoa pode (`shell.owner()` ou `shell.can("can_mention_everyone")`) **e** o texto contém `@todos` como palavra inteira, sem distinguir maiúsculas. O autocompletar acrescenta a entrada "todos" no topo, só para quem pode. `splitMentions` (`chat/logic/mentions.ts`) passa a produzir uma parte `everyone` quando a mensagem tem `mentionsEveryone` e o texto contém `@todos`; sem a marca, `@todos` fica texto simples. Se existir um membro com o handle `todos`, para quem pode a palavra reservada prevalece (ver Open Questions).

### D5 — Câmara: parar a cópia do desfoque da pré-visualização e fechar a corrida ao desligar
Medido na tarefa 1.1 (navegador de teste com câmara falsa, contando as faixas de vídeo vivas): **a câmara física é libertada** ao desligar na chamada (com e sem desfoque) e ao sair da chamada, e ao desligar na pré-entrada sem desfoque. A hipótese inicial (o processador de desfoque da chamada manter a câmara) **não se confirmou**. Encontraram-se duas fugas reais:

1. **Cópia do desfoque na pré-visualização** (`voice/preview.ts`, `render()`). Com desfoque ativo, a pré-visualização cria `LocalVideoTrack(source.clone())` e aplica o processador. Parar o `LocalVideoTrack` não pára essa cópia, e uma cópia viva mantém a câmara aberta mesmo depois de a faixa original ser parada. Medido: na pré-entrada com Blur, ligar, desligar, ligar e desligar deixa 1 cópia viva; na página de Áudio & Vídeo, "Parar teste" deixa as cópias vivas e continuam depois de sair da página.
2. **Corrida ao desligar na chamada** (`voice/callSession.tsx`). Desligar, ligar e desligar depressa, com desfoque, deixa a faixa de captura viva e o vídeo deixa de chegar aos outros.

Correção: em `preview.ts`, guardar a cópia, e ao limpar parar o processador e a cópia explicitamente (e nunca deixar um `render()` já cancelado, depois de um `await`, publicar uma faixa nova: verificar o bilhete da corrida depois de cada `await`). Em `callSession.ts`, serializar as ações da câmara (ligar/desligar numa fila ou com um bilhete), de modo que a última ação pedida é a que fica, e parar o processador ao desligar para a faixa processada não sobreviver. A medição da tarefa 1.1 passa a ser o teste de aceitação.

### D6 — "Só ouvir" depende só do acesso efetivo
`GreenRoom.canSpeak = owner || my_permission === "speak"`. O `my_permission` já vem do servidor com a interseção das capacidades do cargo e das regras do canal (`Perfil sem falar — nível reduzido`), de modo que a verificação extra `shell.can("can_speak_voice")` só servia para errar a quem não tem cargo. `shell.can` tinha o mesmo defeito para as outras permissões ligadas por omissão (por exemplo, anexar imagens: um convidado sem cargo não via o botão de anexar). Corrige-se na origem: quem não tem cargo usa os valores por omissão do servidor (`DEFAULT_ROLE_CAPABILITIES`), e só um cargo os altera. As permissões de administração continuam falsas por omissão. Não há mudança de backend.

### D7 — Defaults do acesso: registar, não alterar
O comportamento já está certo no backend. O requisito novo em `channel-management` fixa-o e a verificação (tarefa 4.x) usa um convidado sem cargo, para o erro não voltar.

## Risks / Trade-offs

- **[Volume de notificações]** `@todos` num servidor grande cria N linhas e N eventos. → Mitigação: uma transação, e a permissão desligada por omissão limita quem o faz. Limite de frequência fica como possível evolução.
- **[Cargos já existentes]** Ninguém ganha a permissão sozinho. → Esperado; o dono ativa-a onde quiser.
- **[Clientes desatualizados]** Um cliente antigo não envia a marca, logo nunca notifica todos, e a mensagem nova chega com um campo extra que ignora. → Aditivo e retrocompatível, como a política de backend exige.
- **[Câmara]** As fugas foram medidas com uma câmara falsa; uma câmara real pode comportar-se de outra forma. → A medição fica como script de verificação repetível e deve ser repetida à mão com uma câmara real.

## Migration Plan

Migração `0022` aditiva e aplicada no arranque (`db::bootstrap`), sem passos manuais. Rollback: a v1 já não existe no repositório; o backend anterior ignora as colunas novas.

## Open Questions

- **Handle `todos`:** o que acontece se já existir (ou for registado) um membro com o handle `todos`? Pressuposto desta change: para quem pode, `@todos` é sempre a palavra reservada e esse membro só se menciona sem a palavra reservada ativa; não se bloqueia o registo. Se se quiser impedir o handle, é uma restrição à parte no registo.
- **Texto da permissão:** "Mencionar @todos" e a explicação ("notifica todos os membros que veem o canal") são o texto proposto; a revisão é do responsável do projeto.
