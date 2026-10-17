# Review — Arquiteto de Soluções

**Change:** fix-voice-join-freeze-linux
**Data:** 2026-10-13
**Veredito geral:** Aprovado com ressalvas

## 1. Definição da arquitetura técnica

Veredito: N/A

Não há stack, componente ou protocolo novo envolvido. É uma correcção de um bug de reactividade no cliente SolidJS já existente (`frontend/src/shell/Content.tsx`, `Composer.tsx`, `ChannelPage.tsx`), dentro da árvore de ficheiros e padrões já estabelecidos (`.openspec.yaml` declara `skip_specs: true` — correctamente, não é uma capacidade nova, é a correcção de um defeito na capacidade "entrar num canal/chamada" já implícita no produto).

## 2. Integração com a infraestrutura existente

Veredito: N/A

Nenhum impacto em deploy, proxy, LiveKit, base de dados ou qualquer coisa fora do processo de renderer do Electron. O `proposal.md` já identifica isto correctamente (`Impact`: só ficheiros de frontend).

## 3. Qualidade de arquitetura e trade-offs

Veredito: Atenção

- **Causa raiz bem isolada, correcção final simples**: a versão actual em `Content.tsx` — um único `<Show keyed>` pela `id` do canal (string estável, não o objecto, que é o que causava o ciclo de remontagem) com leitura directa de `shell.channel()!` nos três pontos de uso — é a opção mais simples das testadas nesta sessão. É sustentável por uma pessoa só: não introduz abstração nova, só corrige a chave de identidade usada pelo `Show` e evita um padrão (passar o *accessor* resolvido de um `Show` para um prop lido fora do fluxo de render) que o próprio Solid desaconselha.
- **Achado de maior relevância para arquitetura**: a secção "Regressão nova e correcção" do `design.md` documenta que esta mesma change, a meio da sessão, chegou a aplicar uma correcção intermédia (um `<Show>` interno não chaveado) que criou uma *segunda* regressão — travar a troca de servidor por completo. Isto é exactamente o tipo de ciclo "corrigir sem reproduzir/validar" que o próprio `design.md` da change (secção de contexto) diz evitar ("Decision 1: Reproduction before correction"). A correcção final é boa, mas o processo que levou lá não seguiu a própria disciplina da change até ser interrompido externamente — registo para reforçar, não é um bloqueante técnico porque a versão final no disco está correcta.
- **Risco residual, não bloqueante**: a auditoria mais ampla (citada no `design.md`) encontrou o mesmo padrão de releitura de `channelId`/`channel` depois de um `await` em `thread.ts`, `Composer.tsx` (envio de anexos), `sceneStore.ts` e `E2ee.tsx`. O `design.md` argumenta correctamente que, nesses pontos, a releitura é uma guarda deliberada ("ainda estou no mesmo canal?") e deixou de lançar a excepção explícita do Solid porque a fonte passou a ser um memo simples em vez do *accessor* de um `Show`. Isto é uma correcção de causa, não um adiamento — mas fica como dívida não resolvida (nenhuma tarefa rastreável a cobrir isto) e deveria, no mínimo, ser referida em `docs/bugs.md` ou numa tarefa futura, para não se perder.

## 4. Documentação e decisões (ADRs)

Veredito: Atenção

- O `design.md` está bem instrumentado como registo de investigação (evidência de processos, logs, timestamps) e documenta as duas iterações da correcção com a razão de cada troca — isto é exactamente o padrão ADR que o projecto já usa (`D1`, `D2`... embora aqui sem essa numeração formal). Seria mais fácil de auditar no futuro se as secções "Causa confirmada" → "Validação de origem" → "Regressão nova e correcção" tivessem cabeçalhos `### Decisão` numerados em vez de títulos cronológicos livres, mas o conteúdo em si é suficiente.
- `tasks.md` tem a Tarefa 4.1 (verificação manual repetida de entrada em chamada) ainda aberta, correctamente — não foi marcada como feita sem confirmação real, o que segue a disciplina do projecto.
- Falta uma tarefa explícita (mesmo que em `fix-pip-call-navigation-freeze` ou numa change separada) para o risco residual apontado no ponto 3 acima (releitura pós-`await` noutros ficheiros). Sem isso, o achado fica só em prosa no `design.md` e pode perder-se quando a change for arquivada.

## 5. Ponte entre produto e técnico

Veredito: OK

O `proposal.md` descreve bem o sintoma relatado pelo utilizador e não assume causa antes de a confirmar — a correcção final em disco está alinhada com a causa documentada (ciclo de remontagem por chave errada no `Show`), sem promessas vagas.

## Bloqueantes antes de implementar

- nenhum — a implementação já está feita e corrigida; o bloqueante seria processual (aplicar sem passar por esta revisão primeiro), já endereçado ao accionar esta skill agora.

## Recomendação antes de arquivar

- Marcar a Tarefa 4.1 só depois de o utilizador confirmar manualmente (repetidamente) que entrar numa chamada de voz/vídeo no Linux, e trocar de servidor com um canal de texto aberto, já não trava.
- Abrir uma tarefa (nesta change ou em `docs/bugs.md`) para o risco residual do ponto 3: releitura de `channelId`/`channel` pós-`await` em `thread.ts`, `Composer.tsx` (anexos), `sceneStore.ts`, `E2ee.tsx` — não é urgente, mas não deveria ficar só documentado em prosa.
