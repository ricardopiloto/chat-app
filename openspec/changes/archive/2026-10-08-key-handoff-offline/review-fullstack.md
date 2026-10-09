# Review — Desenvolvedor Fullstack

**Change:** key-handoff-offline
**Data:** 2026-10-08
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend
Veredito: Atenção
- Implementável com o que existe: `CreateInviteBody` (`api/invites.rs:22`) aceita um campo opcional; `accept_invite` (`:250`) já é o ponto atómico (membership + `try_increment_use` numa transação). Entregar `key_seed` na resposta do `accept` é o caminho mais curto.
- A resposta do `accept` hoje é a `Membership` serializada. Acrescentar `key_seed` como campo opcional é aditivo, mas há **dois ramos**: utilizador com sessão e visitante que se regista no mesmo pedido (`register_inner`, `:276`). O segundo devolve a membership noutro ponto; ambos precisam do campo. `tasks.md` 2.3 não menciona o ramo do visitante, que é o caso mais comum de convite.
- O ramo que já é membro (`exists`, `:301`) devolve a membership existente: não deve devolver a semente de novo. Especificar.
- O `seed_token` (D3) exige tabela ou coluna nova, expiração e limpeza. Concordo com o arquiteto: derivar a elegibilidade de `joined_via_invite_id` + convite com semente + ausência de envelope próprio, dentro do `BEGIN IMMEDIATE` que `post_envelope` já usa. Menos superfície e testável com os helpers de `backend/tests/common`.
- `post_envelope` hoje devolve 409 quando o servidor já tem chave e a conta não tem o seu envelope, e depois exige `synced` no chamador para escrever o alheio. A nova ramificação "membro pending com convite com semente publica o próprio" precisa entrar antes do ramo `own` e testada contra a regra `others > 0`. É o ponto de maior risco de regressão; coincide com as alterações não commitadas de `password-recovery` nesse ficheiro.
- Migração: coluna anulável em `invite` (último é `0023_password_recovery.sql`; esta seria `0024`). Sem índice necessário.

## 2. Desenvolvimento do frontend
Veredito: Atenção
- `InviteDialog.tsx` monta o URL em `generate()` com `invite.code`; precisa obter a `server_key` (`loadServerKey`), gerar o par efémero e enviar o blob no `create`, mas o fragmento só é conhecido no cliente. Viável.
- `Invite.tsx` + `session.tsx::joinWithInvite` (`:113`): a identidade nasce no registo. Ordem correta: registar/aceitar → receber `key_seed` → abrir com a efémera do fragmento → `sendEnvelope` para a própria `identity_pubkey` → `rememberServerKey`. Se o passo de abrir/publicar falhar, tem de cair em `pending` sem quebrar a entrada. Falta no spec um cenário de falha parcial.
- `state.tsx:120` chama `loadAllServerKeys` ao arrancar e `ensureServerKey` pode tentar gerar chave nova para o dono: confirmar que o convidado não passa por esse ramo (só se `owned`, então não). OK.
- Rota do fragmento: ler `location.hash` antes de qualquer navegação do roteador e limpar com `history.replaceState`. O backend já envia `Referrer-Policy: no-referrer` (`security_headers.rs:17`), então a fuga por Referer está coberta; falta só limpar o hash.
- Estado "aguardando um membro online": `chat/thread.ts:149` já trata `noKey` e `key_handoff.completed`; a task 3.5 deve reutilizar esse estado em vez de criar outro.
- Responsividade: a mensagem de espera e o aviso do diálogo precisam de teste em largura mobile; não consta nas tasks.

## 3. Deploy e operação
Veredito: OK
- Sem porta, serviço ou variável nova; migração aditiva aplicada pelo arranque existente. Rollback documentado.
- Observabilidade: sem log do blob nem do token. Sugestão: um contador/log `info` de "convite aceito com semente" vs. "sem semente" ajuda a depurar quem ficou `pending`, sem expor segredo.

## 4. Qualidade de código
Veredito: Atenção
- `tasks.md` segue o padrão tarefa + verificação e agrupa testes por grupo. Bom.
- Falta teste do caso hostil: convidado publica envelope inválido (bytes aleatórios) e fica `synced` com chave errada, que o código atual não deixa corrigir. Decidir (verificação no cliente antes de publicar, ou permitir reescrita enquanto a conta não tiver mensagens decifradas) e cobrir com teste.
- Falta tarefa de registo na tabela de `docs/v2/contracts/backend-change-policy.md`, que a política exige, com o requisito do frontend que motiva a alteração.
- `backend/tests/contract/invites.rs` e `key_envelopes.rs` são os destinos naturais dos testes 2.2 e 2.3; indicar os nomes.
- Concorrência cliente (D6): o limite de 4 em voo e a deduplicação por sessão precisam de teste com `ws` simulado; a task 3.4 prevê 20 pedidos, bom.

## 5. Execução das decisões arquiteturais
Veredito: Atenção
- A task 2.3 implementa D3 com o token, que o arquiteto recomenda simplificar; resolver antes de codar.
- Inconsistência D2/D3 sobre onde a semente é entregue (preview vs. accept): fixar no `accept`.
- `scale.rs` e as alterações de `password-recovery` em `key_envelopes.rs`/`keyHandoff.ts` ainda estão fora do `main`: definir a ordem de merge antes de começar.

## Bloqueantes antes de implementar
- nenhum

## Limitações técnicas a reportar ao Arquiteto
- Envelope próprio inválido bloqueia o membro: o backend recusa sobrescrever envelope de membro `synced` e não consegue validar a chave. Precisa de decisão (verificação no cliente ou reparação).
- O ramo de visitante em `accept_invite` devolve a resposta por outro caminho (`register_inner`); a entrega da semente precisa ser desenhada para os dois.
- Revogar apaga a semente: decidir o efeito sobre quem já aceitou mas ainda não publicou o envelope.
