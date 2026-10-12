# Review — Arquiteto de Soluções

**Change:** switch-saved-instance
**Data:** 2026-10-12
**Veredito geral:** Aprovado

## 1. Definição da arquitetura técnica

Veredito: N/A

- A change não introduz stack, componente, protocolo ou fluxo de dados novo. É um botão adicional em `Auth.tsx` que reutiliza `clearInstance()` (`frontend/src/api/instance.ts:137`), já consumida hoje por `frontend/src/shell/AccountMenu.tsx:105` e `frontend/src/pages/Unlock.tsx:168` no mesmo padrão (`Show when={isNative()}`). Não há decisão de stack a avaliar.
- Escalabilidade não se aplica: é uma troca de estado local (localStorage/ficheiro do processo principal do Electron), sem tocar o homeserver, Servidores ou Canais.

## 2. Integração com a infraestrutura existente

Veredito: N/A

- `proposal.md` ("Impact") e `design.md` ("Non-Goals") confirmam: sem alteração de API, sem novo processo/porta, sem impacto em `deploy-producao.md`/`operar-instancia.md`. O browser servido pela própria instância continua sem o passo (mesma guarda `isNative()` já usada nos outros dois pontos), portanto a origem única por trás do reverse proxy não é afetada.

## 3. Qualidade de arquitetura e trade-offs

Veredito: OK

- Segurança: `clearInstance()` zera `baseUrl` **e** `sessionToken` no mesmo passo (`instance.ts:137-149`), cobrindo "esquecer o endereço e a sessão guardados" mesmo sem chamar `session.logout()` — coerente com a decisão 1 do `design.md` ("There is no session on that screen"), já que no ecrã de entrar `session.phase()` é `anonymous` e não há identidade E2EE desbloqueada em memória para vazar.
- O retorno ao ecrã de endereço já é tratado pelo mecanismo existente: `Gate()` em `frontend/src/index.tsx:41-46` assina `subscribeInstance` e troca para `InstanceConnect` quando `baseUrl` fica vazio — confirmado lendo o código, não é uma suposição do design.md. Nenhum roteamento novo precisa ser escrito em `Auth.tsx`.
- Performance/manutenibilidade: trivial, reusa uma função pura e um padrão de UI já replicado duas vezes; mantível por uma pessoa só.

## 4. Documentação e decisões (ADRs)

Veredito: OK

- `design.md` registra as duas decisões relevantes com alternativa rejeitada e motivo (campo de endereço extra no formulário de login vs. reusar `clearInstance`; manter o menu de conta/desbloqueio como estão). Não segue a numeração `D1`/`D2` de `password-recovery/design.md`, mas o conteúdo cumpre a função.
- Não há diagrama — correto, a complexidade (um botão, uma função já existente, um listener já existente) não justifica um.
- Ponto positivo: `design.md` cita explicitamente a dependência da change arquivada `https-instance-and-invite-link` ("a HTTPS assumption ... stays the screen the person returns to") em vez de reabrir a validação de endereço — ver seção 5.

## 5. Ponte entre produto e técnico

Veredito: OK

- O "Why" (quem erra o endereço fica preso) mapeia directamente para o "What Changes" e para o delta de `specs/frontend-v2/instance-connect/spec.md`, que estende o requisito já existente ("Trocar de instância é uma acção explícita...") com os dois novos cenários (antes de autenticar, browser não mostra a acção) sem reescrever o cenário pós-autenticação já aceite no spec principal.
- Verifiquei o spec principal (`openspec/specs/frontend-v2/instance-connect/spec.md`) e a change arquivada `openspec/changes/archive/2026-10-12-https-instance-and-invite-link/design.md`: `normalizeInstanceUrl` já recusa `http://` e essa é a mesma função usada tanto no primeiro arranque quanto em "Trocar de instância" ("The same function serves the first-launch screen and 'Trocar de instância'", conforme o design daquela change). O design.md desta change trata isso corretamente como Non-Goal ("Changing how the address is validated... stays the screen"), sem contradição nem necessidade de ajuste — a troca só devolve a pessoa ao mesmo ecrã de endereço HTTPS-only, não reabre essa decisão.
- Sem features específicas de RPG envolvidas nesta change.

## Bloqueantes antes de implementar

- nenhum
