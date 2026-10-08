# Parecer técnico: recuperação de senha da Mesa

Análise do código e das propostas existentes em 8 de outubro de 2026. Revisão estática; não foram executados testes nem modificada a aplicação.

## Recomendação

Adotar como caminho principal a **chave de recuperação gerada no cliente**, que preserva a identidade criptográfica (opção B). Manter o **código emitido pelo operador**, que cria nova identidade (opção A), como contingência para contas antigas ou sem chave de recuperação.

A senha de login também cifra o cofre da chave privada (`frontend/src/crypto/vault.ts`, `frontend/src/session/session.tsx`). Portanto, trocar apenas `password_hash` permitiria entrar, mas não abriria a identidade nem as chaves dos servidores.

## Correções necessárias antes da implementação

1. **Protocolo da opção B.** A proposta envia a mesma `proof` em `/key/start` e `/key/redeem` (`openspec/changes/password-recovery/design.md`, D2–D3). Essa prova vira credencial reutilizável de reset se capturada. Derivar do código aleatório duas chaves com separação de domínio: uma para cifrar o cofre de recuperação e outra para assinar desafios. Guardar somente a chave pública verificadora. Usar desafios aleatórios, de uso único e validade curta, assinados com a operação e o hash canônico do pedido. Consumir desafio e alterar credenciais atomicamente.
2. **Não bifurcar a chave do servidor.** `frontend/src/crypto/keyHandoff.ts::ensureServerKey` gera uma chave nova quando o dono não abre o próprio envelope, mesmo se outros membros mantêm a chave antiga. `SELECT EXISTS` seguido de `upsert`, como propõe D7, não impede uma corrida. Verificação e gravação devem integrar uma transação SQLite; a criação inicial do envelope deve ser inserção única, sem sobrescrever sequer o único envelope próprio existente. Quando houver chave estabelecida, esperar o handoff.
3. **Mudança de identidade é transacional.** Hoje `PUT /auth/identity` troca pubkey e cofre, apaga envelopes e altera participações em etapas separadas (`backend/src/api/auth/mod.rs`). Reutilizar uma primitiva transacional para os resets: hash da senha, cofre, identidade opcional, estado dos envelopes, consumo do código/desafio e revogação das sessões. Emitir eventos WebSocket somente após o commit.
4. **Revogar conexões de verdade.** `backend/src/api/mod.rs` autentica WebSocket apenas no handshake. Revogar sessões ou descartar remetentes de `WsHub` não fecha necessariamente o loop de leitura. Adicionar cancelamento e fechamento por conexão, inclusive em múltiplas abas. Corrigir também `unsubscribe(account_id, false)`, que pode remover os remetentes de outras conexões da mesma conta.
5. **Resolver cofre local obsoleto.** `frontend/src/crypto/identity.ts::unlockIdentity` sempre prioriza IndexedDB; após troca de senha noutro dispositivo, a senha nova falha mesmo havendo cofre remoto atualizado. Tentar o cofre remoto autenticado quando o local falhar, conferir que a chave privada aberta corresponde a `account.identity_pubkey` e atualizar o cache.
6. **Invalidar credenciais de recuperação antigas.** Reset A e `PUT /auth/identity` devem remover o cofre/verificador da opção B anterior. Caso contrário, uma chave antiga continuaria autorizando resets após troca de identidade.

## Sequência de entrega

1. Corrigir integridade da chave, transações, WebSockets e cache; testar corrida de dois dispositivos, múltiplas abas e handoff do dono.
2. Criar a primitiva de troca de credenciais e a função autenticada **Alterar senha** (mantém a mesma identidade, atualiza o cofre, revoga as outras sessões).
3. Entregar A para contas existentes: CLI do operador, código aleatório de uso único com validade curta, tela pública e nova identidade. Explicar que o histórico retorna somente se outro membro tiver a chave; a custódia da chave de voz pode exigir tratamento separado.
4. Entregar B como fluxo preferencial: código aleatório mostrado uma vez, opção de ativação em conta existente e no registro, cofre de recuperação e desafio assinado; preservar a identidade e os envelopes.
5. Isolar o handoff por **escopo de chave**, permitindo adaptar servidor → canal quando `bots-channel-key-integration` avançar.

## Ajustes de especificação

- Corrigir a afirmação de que o servidor nunca vê a senha: login e registro a enviam por HTTPS; o servidor não recebe a chave privada em claro.
- Decidir se a pessoa ativará a chave de recuperação **antes** do POST de registro; alternativamente, criar a chave por uma rota autenticada após o registro. As tarefas atuais mandam enviar material no registro e só depois oferecem “fazer depois”.
- Não assumir que `key_handoff_status` chega em `/servers/{id}/members`: o endpoint atual não o retorna. Para impedir bifurcação, verificar a existência efetiva dos envelopes no backend.
- Testar consumo único de código/desafio, respostas uniformes, revogação de sessões e sockets, e preservação da identidade/envelopes na opção B.

## Arquivos consultados

- `openspec/changes/password-recovery/{proposal,design,tasks}.md` e specs associadas;
- `openspec/changes/bots-channel-key-integration/design.md`;
- `backend/src/api/auth/`, `backend/src/api/key_envelopes.rs`, `backend/src/api/mod.rs`, `backend/src/db/{account,session,key_envelope}.rs`, `backend/src/ws/mod.rs`;
- `frontend/src/crypto/{vault,identity,keyHandoff}.ts`, `frontend/src/session/session.tsx` e telas de autenticação.
