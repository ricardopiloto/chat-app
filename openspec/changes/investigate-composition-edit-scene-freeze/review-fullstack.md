# Review — Desenvolvedor Fullstack

**Change:** investigate-composition-edit-scene-freeze
**Data:** 2026-11-18
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend

Veredito: N/A — `proposal.md` - Impact já declara corretamente "No backend or protocol change expected; this is a renderer-side reliability bug", e nada na investigação (reativos SolidJS, CSS, IPC Electron) indica o contrário.

## 2. Desenvolvimento do frontend

Veredito: OK

- A instrumentação proposta (DevTools Performance recording, ou profiling V8 via `--inspect` se o DevTools também travar) é viável com a stack real do projeto (SolidJS + Vite + Electron, confirmado em `package.json`) sem nenhuma ferramenta nova. Concordo com o achado já registrado em `review-architect.md` (Dimensão 2): `electron:dev` já invoca o binário `electron` diretamente, então `--inspect` é só um argumento extra.
- Concordo com o achado do Arquiteto (Dimensão 3 de `review-architect.md`) sobre a Prioridade 1 do plano de reprodução: reli `FloatingPlayer.tsx` e `CallElsewhere.tsx` e confirmo que nenhum dos dois renderiza uma track de screen-share, e que o popout é uma `BrowserWindow` separada (processo de renderer distinto), o que estrutural­mente não explicaria um freeze na janela principal. Do ponto de vista de quem vai efetivamente rodar a task 1.2, isso significa que, como está escrito hoje, a task manda o implementador gastar o primeiro ciclo de captura numa hipótese que a leitura de código já enfraquece — vale reescrever a ordem antes de abrir o DevTools.

## 3. Deploy e operação

Veredito: Atenção

- **Achado**: não existe no projeto nenhum crash reporter ou detector de hang para o cliente Electron (procurei por `crashReporter`/Sentry em `frontend/electron` e `frontend/src` — nenhuma ocorrência). Isso significa que, se este freeze voltar a acontecer com outro usuário em produção antes de uma correção, a única forma de o time saber é o próprio usuário notar, lembrar os passos exatos e reportar manualmente — exatamente o que aconteceu aqui. Isto é maior que o escopo desta change (adicionar crash/hang reporting é investimento de infraestrutura, não uma correção pontual), então não deveria bloquear esta change, mas vale registrar como gap a considerar separadamente, já que impacta diretamente a capacidade do time de saber se o bug persiste após o fix em produções sem dev tools acessíveis.
- **Achado (mitigação imediata ausente)**: dado que o bug é severo (freeze total, requer reinício forçado, sem saída segura para o usuário) e a causa raiz ainda não está confirmada (a própria change exige um gate antes de qualquer fix), `tasks.md` não propõe nenhuma mitigação de baixo risco que possa ser aplicada *antes* do root cause estar confirmado — por exemplo, desabilitar/ocultar temporariamente o botão "Editar cena" (ou mostrar um aviso) quando uma screen-share local estiver ativa, reduzindo a janela de exposição dos usuários a esta combinação enquanto a investigação (que pode levar mais de um ciclo, conforme a própria task 1.4 reconhece) está em andamento. Recomendação: considerar esta mitigação como uma task opcional/paralela de baixo risco, independente do fix definitivo, já que o "Non-Goals" do `design.md` não a exclui explicitamente e ela não compromete a investigação.

## 4. Qualidade de código

Veredito: OK

- `tasks.md` segue o mesmo padrão de gate já usado em `add-linux-screen-share-system-audio` (gate de reprodução → checkpoint pass/fail → implementação condicional → regressão), consistente com o precedente do projeto para investigações sem causa confirmada.
- Tratamento de concorrência: a task 1.3/2.2 já cobre adequadamente o gap de `setScreen` sem guarda, incluindo a verificação de que as cenarios existentes de `frontend-v2/voice-session` continuam a passar se essa guarda for adicionada.
- Organização: nenhum refactor não declarado; o escopo de arquivos em `proposal.md` - Impact é consistente com os arquivos realmente lidos na investigação.

## 5. Execução das decisões arquiteturais

Veredito: Atenção

- Converge com `review-architect.md`: a decisão de usar um gate de reprodução antes de qualquer fix está corretamente desenhada e é diretamente executável com as ferramentas já disponíveis no projeto. A única limitação técnica a reportar de volta é a mesma já identificada independentemente pelo Arquiteto — a ordem de prioridade da investigação (Prioridade 1) não é sustentada pela leitura do código e deveria ser revisada antes de `tasks.md` 1.1 começar, para não desperdiçar o primeiro ciclo de captura.

## Bloqueantes antes de implementar
- nenhum.

## Limitações técnicas a reportar ao Arquiteto
- nenhuma nova — convergência total com `review-architect.md` sobre a reordenação da Prioridade 1; os dois achados adicionais desta revisão (ausência de crash/hang reporting; ausência de mitigação temporária) são de operação/produto, não de arquitetura, e já estão registrados acima para quem conduzir a implementação decidir.
