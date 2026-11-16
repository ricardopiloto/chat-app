# Review — Desenvolvedor Fullstack

**Change:** camera-blur-segmentation-model
**Data:** 2026-11-16
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend

Veredito: N/A

- `BackgroundProcessor` roda inteiramente no cliente. Nenhuma rota, tabela ou serviço do `backend/` é tocado por esta change.

## 2. Desenvolvimento do frontend

Veredito: Atenção

- **Achado (confirmado no código atual de `develop`)**: a chamada relevante está hoje em `callSession.tsx:358`, não na linha 231 citada em `proposal.md`/`design.md`/`tasks.md` (deslocamento causado pelo commit `0915045`, "1.13.0"). Em `preview.ts` a linha 148 ainda está correta, por coincidência.
- **Achado (Atenção, o mais importante)**: em ambos os arquivos, a variável `options` é declarada uma única vez por função, tipada como `SwitchBackgroundProcessorOptions` (`callSession.tsx:352`, `preview.ts:109,145`), e usada em dois caminhos: `backgroundProcessor.switchTo(options)` quando já existe um processor, e `processors.BackgroundProcessor(options)` quando não existe. Conferi `frontend/node_modules/@livekit/track-processors/dist/src/index.d.ts`: `assetPaths` não existe em `SwitchBackgroundProcessorOptions` — só em `BackgroundProcessorCommonOptions`, que compõe o tipo aceito pelo construtor `BackgroundProcessor(...)`. A task 2.2 do `tasks.md`, como redigida, sugere adicionar `assetPaths` ao `options` já existente — isso não compila, porque esse mesmo `options` também alimenta `switchTo`. É preciso um objeto derivado só no ramo de construção, por exemplo `processors.BackgroundProcessor({ ...options, assetPaths: ASSET_PATHS })`, sem tocar na variável `options` original. Recomendação: reescrever a task 2.2 para deixar esse detalhe explícito.
- Fora esse ponto, a viabilidade se mantém: `frontend/src/voice/devices.ts:7-8` tem `BlurLevel`/`CameraEffect`; a task 2.1 (constante de asset-path nova, independente do tipo de `CameraEffect`) continua implementável como está.
- `frontend/public/` continua a servir estático sem mudança de build/config necessária.

## 3. Deploy e operação

Veredito: OK

- Nenhuma porta, variável de ambiente, container ou serviço novo. Asset estático igual aos já existentes em `public/`.

## 4. Qualidade de código

Veredito: Atenção

- **Achado**: a task 1.1 pede `curl -I` para verificar o asset servido. O servidor Vite deste projeto roda em HTTPS com certificado autoassinado (`vite.config.ts`, `https: {}`), então `curl -I` sem `-k` falha por TLS, não confirma nem nega a existência do arquivo. Recomendação: usar `curl -Ik` ou verificar pelo navegador/devtools.
- **Achado**: a task 1.1 pede "record its license/attribution next to it" sem apontar onde/como — não há precedente real no repositório (`frontend/public/dice-box-threejs/` não tem `NOTICE`/`LICENSE`). Recomendação: tornar a tarefa concreta, por exemplo um `frontend/public/mediapipe/NOTICE.md` curto com nome do modelo, URL de origem e licença.
- **Achado**: ver dimensão 2 — a task 2.2 como redigida hoje não é implementável sem o passo extra (objeto derivado) descrito ali.
- Tratamento de erro: sem mudança necessária — os `try/catch` em `applyEffect`/`render` continuam a cobrir falha de carregamento do novo modelo do mesmo jeito que cobrem hoje.

## 5. Execução das decisões arquiteturais

Veredito: OK

- D1/D2/D3 do `design.md` continuam implementáveis como decididas; os achados acima são de precisão de redação das tasks, não de viabilidade da arquitetura.

## Bloqueantes antes de implementar
- nenhum

## Limitações técnicas a reportar ao Arquiteto
- O ponto de integração já mudou de forma real desde que a proposta foi escrita (commit `0915045`, "1.13.0"), e a chamada relevante compartilha a mesma variável `options` com `switchTo()`, que não aceita `assetPaths`. Não invalida a decisão de usar `assetPaths.modelAssetPath`, mas confirma que os números de linha e o "formato" do ponto de integração citados em `proposal.md`/`design.md` precisam ser reconfirmados no início da implementação.
