# Review — Desenvolvedor Fullstack

**Change:** tune-speaking-indicator-latency
**Data:** 2026-11-14
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend

Veredito: N/A

- Não há código de backend/API envolvido; é configuração de um serviço externo (LiveKit) já orquestrado por `infra/docker-compose.yml`.

## 2. Desenvolvimento do frontend

Veredito: N/A

- `design.md` (D2) explicitamente não altera o pipeline evento→UI do frontend nesta primeira iteração; confirmei que não há tarefa de frontend em `tasks.md`. Correto deixar fora do escopo até a medição (tarefa 2.1) mostrar necessidade.

## 3. Deploy e operação

Veredito: Atenção

- **Achado (disrupção operacional):** aplicar a nova secção `audio` em `infra/livekit.yaml` a uma instância já em produção exige recriar/reiniciar o contentor LiveKit (`docs/deploy-producao.md:143`, "Suba o LiveKit"; o Compose usa `network_mode: host`, então não há troca gradual/rolling). Reiniciar o LiveKit **derruba todas as chamadas activas** nessa instância no momento do restart — incluindo, potencialmente, a instância oficial. `tasks.md` não tem nenhuma tarefa para isso (janela de manutenção, aviso prévio, ou pelo menos uma nota de que o deploy desta mudança deve ser agendado fora do horário de maior uso). Recomendo adicionar essa tarefa explicitamente, em vez de deixá-la implícita em "add the tested audio stanza" (tarefa 1.2).
- Isto é o mesmo gap que o Arquiteto já registou do ângulo de propagação/documentação para operadores (ver `review-architect.md`, dimensão 2) — aqui é o ângulo operacional (reinício = interrupção), não só "o operador precisa saber".
- Scripts/CI: não há pipeline automatizado para LiveKit; o fluxo manual já documentado em `docs/deploy-producao.md`/`docs/operar-instancia.md` é suficiente e a tarefa 1.1 (confirmar chaves aceites pela imagem fixada) é a verificação certa antes de aplicar.

## 4. Qualidade de código

Veredito: Atenção

- **Achado (método de medição não especificado):** a tarefa 2.1 pede "Measure speech onset-to-indicator latency and release flicker before/after in a two-client call" sem dizer COMO medir. Para uma change cujo critério de sucesso é inteiramente perceptual/numérico (não há teste automatizado possível aqui, correctamente), o método de medição é o detalhe de implementação mais importante — sem ele, duas pessoas podem medir de formas diferentes e chegar a conclusões opostas sobre se `update_interval: 200`/`smooth_intervals: 2` é bom. Recomendo que a tarefa especifique um método concreto e repetível (ex.: gravar tela+áudio dos dois clientes e contar quadros/ms entre o início real da fala no áudio gravado e a borda aparecer no vídeo, ou usar o painel de Performance do browser para marcar o timestamp do evento `ActiveSpeakersChanged` contra o início da captura de áudio local do outro lado).
- Correcto não propor teste automatizado aqui — ao contrário de mudanças anteriores revisadas nesta sessão, isto é ajuste de percepção humana sobre um serviço externo, não lógica determinística do próprio app; forçar um script seria over-engineering.
- Sem refactor de código, sem organização de módulos afectada.

## 5. Execução das decisões arquiteturais

Veredito: OK

- `tasks.md` segue D1 (tunar o SFU primeiro) e D2 (não tocar o frontend ainda) na ordem certa, sem reabrir nenhuma decisão.

## Bloqueantes antes de implementar

- nenhum

## Limitações técnicas a reportar ao Arquiteto

- Confirmo e complemento o achado do Arquiteto sobre propagação para operadores: para a instância oficial especificamente, aplicar esta mudança não é só "editar um ficheiro" — exige reiniciar o LiveKit, o que interrompe chamadas activas nessa instância. Vale o Arquiteto decidir se isso entra como tarefa nesta change ou como nota operacional separada (ex.: agendar para uma janela de manutenção já usada para outras mudanças de infra).
