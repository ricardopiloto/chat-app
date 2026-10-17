# Review — Desenvolvedor Fullstack

**Change:** fix-voice-join-freeze-linux
**Data:** 2026-10-13
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend

Veredito: N/A

A change não toca `backend/`. O travamento era puramente no renderer (SolidJS), confirmado por evidência real (processos, `journalctl`, `eu-stack`) antes de qualquer correcção — não há API, autenticação ou dado persistido envolvido.

## 2. Desenvolvimento do frontend

Veredito: Atenção

- A correcção final em `frontend/src/shell/Content.tsx` é implementável como está e é o padrão certo para este caso: um `<Show keyed>` por uma chave primitiva estável (`id`), com leitura directa de `shell.channel()!` (um `createMemo` normal) para os três usos de `channel`, em vez de passar o valor resolvido do próprio `Show` como prop. Testei a lógica lendo o `diff` actual (`Content.tsx`, `Composer.tsx`, `ChannelPage.tsx`) — está consistente com o que o `design.md` descreve.
- As duas correcções acessórias (`Composer.tsx`: `lastChannelId` capturado por um `createEffect` em vez de reler `props.channelId` no `onCleanup`; `ChannelPage.tsx`: `channelId` capturado antes de agendar o `setTimeout` do `markRead`) são o padrão idiomático certo em Solid para evitar ler um prop dentro de um callback diferido — nenhuma das duas precisa de mais nada.
- **Achado que confirma o do Arquiteto**: a auditoria mais ampla (citada no `design.md`) encontrou o mesmo padrão de releitura pós-`await` em `thread.ts` (`open`, `refresh`, `loadOlder`, `onEvent`, `send`, `remove` — via `options.channelId()`), em `Composer.tsx:192` (loop de upload de anexos), `sceneStore.ts:18` e `E2ee.tsx` (`ReenableDialog.confirm()`). Concordo com a leitura do `design.md`: a maioria são guardas deliberadas ("ainda estou no mesmo canal depois deste `await`?") que já não lançam a excepção do `Show` porque a fonte agora é um memo simples. Mas **`Composer.tsx:192` é o único destes que eu reportaria com prioridade diferente**: se o utilizador troca de canal a meio do upload de vários anexos, cada iteração do loop relê `props.channelId` já fora do fluxo síncrono do efeito — se `shell.channel()` for `undefined` nesse instante (ex. trocou de servidor para um sem canal), é um `TypeError` directo (não uma guarda que falha suavemente), porque não há nenhum `if (channelId !== props.channelId) return` ali, é só a chamada `uploadAttachment(props.channelId, ...)` repetida. Isto não é o bug relatado pelo utilizador, mas é alcançável por um caminho real (enviar 2+ imagens e trocar de servidor antes do upload terminar) e fica fora do escopo desta change tal como está definida — não bloqueia esta correcção, mas devia ter uma tarefa própria.

## 3. Deploy e operação

Veredito: N/A

Sem impacto em build, empacotamento ou operação da instância. `npm run build` (único "CI" real disponível aqui) já corre e passa, antes e depois desta correcção.

## 4. Qualidade de código

Veredito: Atenção

- Não há, nem podia razoavelmente haver com o que já existe no repositório (sem `vitest`/`@solidjs/testing-library`, só scripts `verify:*` feitos à mão para lógica isolada), um teste automatizado que exercite ciclo de montagem/desmontagem do `Show` em `Content.tsx` ou o `onCleanup` do `Composer`. A Tarefa 4.1 em `tasks.md` reflecte isso correctamente: fica como verificação manual, não finge ser automatizável. Isto é uma limitação real do projecto (sem framework de testes de componente), não um deslize desta change — mas significa que esta classe de bug (interacção entre `Show` e desmontagem) só vai ser pega de novo por teste manual repetido, da próxima vez que alguém tocar nesta área.
- O comentário deixado em `Content.tsx` explica bem o *porquê* (o ciclo de remontagem E a razão de evitar o *accessor* do `Show`), o que ajuda quem for tocar aqui depois — segue o padrão do projecto de só comentar quando a razão não é óbvia pelo código.
- Tarefa 4.2 (`npm run build`) está marcada `[x]` com o resultado real citado (`tsc --noEmit` e Vite build passaram) — consistente com o que corri de novo agora.

## 5. Execução das decisões arquiteturais

Veredito: Atenção

- Concordo com o ponto do `review-architect.md`: a change passou por uma correcção intermédia que criou uma segunda regressão (travar a troca de servidor) antes de chegar à versão actual. A versão final no disco está correcta e é a mais simples das testadas — não há nada a refazer — mas o processo que levou lá devia ter sido interrompido mais cedo pela própria disciplina de "reproduzir antes de corrigir" que a change cita no seu próprio contexto.
- Nenhuma decisão arquitectural de `fix-pip-call-navigation-freeze` foi reaberta sem motivo — a correcção manteve-se no mesmo ficheiro/padrão (`Show` keyed), só trocou a fonte de leitura do prop.

## Bloqueantes antes de implementar

- nenhum — implementação já feita, `npm run build` passa, nada impede seguir para a verificação manual (Tarefa 4.1).

## Limitações técnicas a reportar ao Arquiteto

- O projecto não tem framework de teste de componente Solid (`vitest`/`@solidjs/testing-library`); bugs desta classe (interacção `Show`/ciclo de vida) só são detectáveis por verificação manual repetida. Não é urgente resolver agora, mas é uma lacuna estrutural de qualidade que vale uma decisão explícita em algum momento (se o Arquiteto achar que compensa, dado que é "uma pessoa só" a manter).
- `Composer.tsx:192` (loop de upload de anexos) tem o mesmo padrão de releitura pós-`await` dos outros pontos citados, mas sem a guarda "ainda é o mesmo canal?" que os outros têm — risco de `TypeError` real (não só um `console.error`) se o utilizador trocar de canal/servidor a meio de um envio com vários anexos. Sugiro uma tarefa separada, não bloqueante para esta change.
