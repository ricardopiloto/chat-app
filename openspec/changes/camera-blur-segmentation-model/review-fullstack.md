# Review — Desenvolvedor Fullstack

**Change:** camera-blur-segmentation-model
**Data:** 2026-11-16
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend

Veredito: N/A

- Confirmado de novo agora: `BackgroundProcessor` roda inteiramente no cliente. Nenhuma rota, tabela ou serviço do `backend/` é tocado por esta change.

## 2. Desenvolvimento do frontend

Veredito: Atenção

- **Achado (novo, confirmado no código atual)**: desde a revisão anterior (2026-11-13), o commit `0915045` ("1.13.0", 2026-11-14) alterou `frontend/src/voice/callSession.tsx` e deslocou a chamada relevante da linha 231 (citada em `proposal.md`/`design.md`/`tasks.md`) para a **linha 358** hoje. Em `preview.ts` a linha 148 ainda está correta, mas por coincidência.
- **Achado (Atenção, mais importante que o deslocamento de linha)**: reli `callSession.tsx:334-368` e `preview.ts:100-154` por completo, não só as linhas da chamada. Em ambos os arquivos, a variável `options` é declarada uma única vez por função, tipada explicitamente como `SwitchBackgroundProcessorOptions` (ex. `callSession.tsx:352`), e depois usada em dois caminhos diferentes:
  ```ts
  if (backgroundProcessor) await backgroundProcessor.switchTo(options);
  else { const processor = processors.BackgroundProcessor(options); ... }
  ```
  Conferi `frontend/node_modules/@livekit/track-processors/dist/src/index.d.ts`: `assetPaths` **não existe** em `SwitchBackgroundProcessorOptions` (o tipo de `switchTo`) — só existe em `BackgroundProcessorCommonOptions`, que compõe o tipo aceito pelo construtor `BackgroundProcessor(...)`. A tarefa 2.2 do `tasks.md` diz "Pass that constant as `assetPaths: {...}` into the `processors.BackgroundProcessor(options)` call", mas, como está escrita, isso sugere adicionar o campo ao `options` já existente — o que não compila, porque esse mesmo `options` também é passado para `switchTo`. É preciso um objeto derivado só no ramo do `else`, por exemplo `processors.BackgroundProcessor({ ...options, assetPaths: ASSET_PATHS })`, sem tocar na variável `options` original. Essa nuance não existia (ou não era visível da mesma forma) quando o `design.md` foi escrito — é consequência direta da lógica de troca sem reabrir a câmera introduzida por `custom-camera-backgrounds` (commit `3cb582d`, 2026-11-11). Recomendação: reescrever a tarefa 2.2 para deixar explícito esse detalhe, para quem implementar não perder tempo com um erro de tipo que parece trivial mas não é óbvio pela redação atual.
- Fora esse ponto, a viabilidade de implementação no restante se mantém: `frontend/src/voice/devices.ts:7-8` ainda tem `BlurLevel`/`CameraEffect` (hoje como union type, não mais o único `BlurLevel` simples citado antes — mas a tarefa 2.1 ("add the shared asset-path constant... import it from callSession.tsx and preview.ts") continua implementável do mesmo jeito, já que é só uma constante de string nova, independente do tipo de `CameraEffect`).
- `frontend/public/` continua a servir estático como está; nenhuma mudança de build/config necessária.

## 3. Deploy e operação

Veredito: OK

- Sem alteração: nenhuma porta, variável de ambiente, container ou serviço novo. Asset estático igual aos já existentes em `public/`.

## 4. Qualidade de código

Veredito: Atenção

- **Achado (ainda não endereçado desde a revisão anterior)**: a task 1.1 continua a pedir `curl -I` para verificar o asset servido; o servidor Vite deste projeto roda em HTTPS com certificado autoassinado (`vite.config.ts`, `https: {}`), então `curl -I` sem `-k` falha por TLS, não confirma nem nega a existência do arquivo. Ainda não corrigido no `tasks.md`.
- **Achado (ainda não endereçado)**: a task 1.1 continua a pedir "record its license/attribution next to it" sem apontar onde/como — não há precedente real no repositório (`frontend/public/dice-box-threejs/` não tem `NOTICE`/`LICENSE`). Recomendação ainda válida: tornar a tarefa concreta (ex. `frontend/public/mediapipe/NOTICE.md`).
- **Achado (novo)**: ver dimensão 2 — a task 2.2 como está redigida hoje não é implementável sem um passo extra (objeto derivado) que não está escrito. Mesma categoria dos dois achados acima: redação da task insuficientemente concreta, não falha de arquitetura.
- Tratamento de erro: confirmado de novo, sem mudança necessária — os `try/catch` em `applyEffect`/`render` continuam a cobrir falha de carregamento do novo modelo do mesmo jeito que cobrem hoje.

## 5. Execução das decisões arquiteturais

Veredito: OK

- D1/D2/D3 do `design.md` continuam implementáveis como decididas; nenhuma delas precisa ser reaberta pelos achados acima — são todos de precisão de redação/implementabilidade das tasks, não de viabilidade da arquitetura.

## Bloqueantes antes de implementar
- nenhum

## Limitações técnicas a reportar ao Arquiteto
- O ponto de integração (`callSession.tsx`/`preview.ts`) já mudou de forma real duas vezes desde que a proposta foi escrita (custom-camera-backgrounds em 2026-11-11, depois 1.13.0 em 2026-11-14), e a chamada relevante agora compartilha a mesma variável `options` tipada com `switchTo()`, que não aceita `assetPaths`. Isso não invalida a decisão de usar `assetPaths.modelAssetPath`, mas confirma — pela segunda vez — que os números de linha e o "formato" do ponto de integração citados em `proposal.md`/`design.md` precisam ser reconfirmados no início da implementação, não assumidos do texto.
