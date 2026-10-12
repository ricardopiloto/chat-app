# Review — Desenvolvedor Fullstack

**Change:** switch-saved-instance
**Data:** 2026-10-12
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend

Veredito: N/A

- `proposal.md` ("Impact") e `design.md` ("Non-Goals") são explícitos: sem alteração de API, sem endpoint novo. Nada em `backend/src/api` precisa mudar.

## 2. Desenvolvimento do frontend

Veredito: Aprovado com ressalvas (uma ressalva, não bloqueante)

- Viabilidade confirmada lendo o código real, não só o design.md: `clearInstance()` (`frontend/src/api/instance.ts:137-149`) já zera `baseUrl` e `sessionToken` num só passo; `Gate()` em `frontend/src/index.tsx:38-47` já assina `subscribeInstance` e troca para `InstanceConnect` quando `baseUrl` fica vazio. `Auth.tsx` não precisa de nenhuma lógica de roteamento nova — só chamar `clearInstance()`.
- Achado interessante (reforça a viabilidade, não é um problema): dentro do `Switch` de `Gate()`, o `Match` de `Auth` só é alcançado depois dos `Match` de `pickInstance() === true` e `pickInstance() === null`. Ou seja, em modo nativo, `Auth.tsx` só renderiza quando já existe uma instância guardada — a condição "com uma instância já guardada" do `tasks.md` é automaticamente verdadeira sempre que `Auth` aparece em modo nativo. A guarda a usar é simplesmente `Show when={isNative()}`, igual ao padrão já replicado em `frontend/src/shell/AccountMenu.tsx:93` e `frontend/src/pages/Unlock.tsx:156`. Nenhum estado novo (`createSignal`) é necessário.
- Texto já existe: a chave `instance.switch` ("Trocar de instância" / "Switch instance") já está nos dois catálogos (`frontend/src/i18n/catalogs/pt-BR.ts:229`, `en.ts:228`) e já é usada nos outros dois pontos — reaproveitável sem adicionar chave nova.
- **Ressalva:** nem `proposal.md` nem `tasks.md` dizem onde, visualmente, o link/botão entra no layout de `Auth.tsx`. O componente tem um único formulário com `Segmented` (login/registo) e, no rodapé, uma linha de protocolo/cifra (`Auth.tsx` linhas ~150-157) — não há duas telas distintas de "entrar" e "criar conta" como o texto do proposal sugere ("no ecrã de entrar e no de criar conta"), é o mesmo componente com um toggle de modo. Isso não bloqueia a implementação (o link pode ficar visível nos dois modos, fora do `Show when={registering()}`), mas o `tasks.md` não dá esse detalhe de posicionamento/estilo (link de texto como em `Unlock.tsx`, ou item separado) e fica a critério de quem implementa.

## 3. Deploy e operação

Veredito: N/A

- Sem variável de ambiente, porta, serviço ou passo de deploy novo. `docs/deploy-producao.md` e `docs/operar-instancia.md` não são afetados.

## 4. Qualidade de código

Veredito: OK

- O projeto não tem harness de teste de componentes SolidJS (sem `vitest`/`@testing-library` no `frontend/package.json`; só scripts `verify-*.mjs` que testam lógica pura via `esbuild`, e um único `*.test.mjs`). A verificação manual descrita em `tasks.md` 1.1 ("Verificar no cliente nativo que a acção aparece...") é, portanto, consistente com o que o projeto já faz hoje para comportamento de UI equivalente (ex.: os botões de "Trocar de instância" em `AccountMenu.tsx`/`Unlock.tsx` também não têm teste automatizado) — não é uma lacuna introduzida por esta change.
- A tarefa única segue o padrão "tarefa + como verificar" já usado em changes anteriores (ex. `openspec/changes/archive/2026-10-12-https-instance-and-invite-link/tasks.md`).
- Tratamento de erro: `clearInstance()` já engloba sua própria chamada à bridge nativa num `try/catch` interno (`instance.ts:140-146`), então `Auth.tsx` não precisa de tratamento de erro adicional — chamada direta e síncrona de UI, sem nova superfície de falha.
- Escopo contido: nenhuma mudança de módulo/estrutura fora de `Auth.tsx`.

## 5. Execução das decisões arquiteturais

Veredito: OK

- `design.md` decide explicitamente não tocar a validação de endereço (`normalizeInstanceUrl`, HTTPS-only) nem o comportamento do menu de conta/desbloqueio — `tasks.md` não reabre nenhuma dessas decisões.
- Nenhuma limitação técnica nova encontrada ao ler o código real que contradiga a arquitetura proposta.

## Bloqueantes antes de implementar

- nenhum

## Limitações técnicas a reportar ao Arquiteto

- nenhuma
