# Review — Desenvolvedor Fullstack

**Change:** add-screen-share-audio-and-popout-controls
**Data:** 2026-11-14
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend

Veredito: N/A

- Confirmado por grep: não existe `active_screen_shares`, endpoints `screen-share/start|stop` nem eventos `voice.screen_share_changed`/`channel.layout_changed` no backend — o único estado de servidor relacionado é o booleano `screen_on` em `backend/src/domain/voice_occupancy.rs:18,29`, já existente e não alterado por esta change. `proposal.md` declara correctamente "No backend or LiveKit protocol change is proposed", e nenhuma task em `tasks.md` toca `backend/`. Nada a implementar aqui.

## 2. Desenvolvimento do frontend

Veredito: Atenção

- Viável com a stack real (SolidJS + `livekit-client` já instalado com `ScreenShareCaptureOptions.audio`). A task 3.1 ("Add the audio choice to `frontend/src/voice/CallControls.tsx`") não nomeia o padrão de UI a reutilizar. Este ficheiro já tem um precedente pronto para exactamente este caso: o botão de blur de câmara abre um pequeno menu secundário (`CallControls.tsx:86-103`, `aria-haspopup="menu"`, `aria-expanded`, lista de opções com `aria-checked`). Recomendo a task 3.1 apontar explicitamente para esse padrão (um botão secundário junto ao de partilhar ecrã, abrindo um menu pequeno com a opção de áudio) em vez de deixar a forma em aberto — evita que a implementação resolva isto de forma ad-hoc e inconsistente com o resto do ficheiro.
- `CallPopoutWindow.tsx` já tem o padrão de botão+`ready()`+`owner()?.x` replicável (`CallControls`/`PopoutControls` lado a lado) — task 4.3 está correctamente especificada.
- Responsividade: task 4.3 já pede para verificar a grelha 240×180 mínima do popout; bom, é o ponto real de aperto de espaço nesta UI.

## 3. Deploy e operação

Veredito: Atenção

- N/A para infraestrutura: sem porta, variável de ambiente, ou serviço novo.
- Achado operacional concreto desta própria sessão: alterações em `frontend/electron/main.ts` (a task 2.2 mexe exactamente aí) só são recarregadas depois de **reiniciar o processo Electron por completo** — o reload normal do Vite não chega ao processo principal. Acabámos de perder um ciclo de diagnóstico noutra change por esquecer isto. Recomendo acrescentar uma nota explícita em `tasks.md` (secção 5, verificação) lembrando quem for implementar de reiniciar o Electron inteiro a cada alteração em `main.ts`/`preload.ts`, não só recarregar a janela.
- Debug em produção: nenhum log ou health-check novo é necessário para esta feature (é local, por chamada); não é uma lacuna.

## 4. Qualidade de código

Veredito: OK

- `tasks.md` já embute verificação em cada task (padrão já usado nas outras changes desta leva), incluindo caminhos de cancelamento/permissão negada (task 2.1: "cancellation and teardown"; task 5.1: "capture rejection, owner loss, and listen-only calls").
- Resiliência: D1 do `design.md` ("derive displayed state from actual local publications rather than the requested flag") evita que a UI afirme um estado que a captura real não confirmou — boa prática já antecipada na arquitetura, nada a acrescentar aqui.
- Concorrência: o relay popout reaproveita os mesmos guardas de canal/chamada-ao-vivo já validados por `add-popout-call-controls` e `add-connection-quality-indicator`; não é lógica nova a testar do zero.
- Organização: cabe nos módulos existentes (`callSession.tsx`, `CallControls.tsx`, `CallPopoutWindow.tsx`, `main.ts`/`preload.ts`/`env.d.ts`), sem refactor não declarado.

## 5. Execução das decisões arquiteturais

Veredito: OK

- `tasks.md` respeita a sequência decidida: secção 1 (revisão de arquiteto+fullstack) antes de qualquer código, exactamente como `design.md` pediu ao deixar as duas perguntas em aberto em vez de as fechar sozinho.
- Nenhuma task reabre D1/D2 ou o escopo excluído (blur/background, output device, segundo popout) sem justificar.

## Bloqueantes antes de implementar

- nenhum

## Limitações técnicas a reportar ao Arquiteto

- A pergunta 1 em aberto (política de fallback de áudio por plataforma) tem uma implicação de teste prático: validar isto exige testar em pelo menos Linux X11, Linux Wayland e, idealmente, Windows antes de fechar a política — não é só uma decisão de produto, é trabalho de QA manual em três ambientes que vale planear com antecedência.
