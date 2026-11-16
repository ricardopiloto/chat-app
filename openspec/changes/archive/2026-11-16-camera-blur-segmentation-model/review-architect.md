# Review — Arquiteto de Soluções

**Change:** camera-blur-segmentation-model
**Data:** 2026-11-16
**Veredito geral:** Aprovado com ressalvas

## 1. Definição da arquitetura técnica

Veredito: OK

- A change continua a não introduzir stack, serviço ou dependência nova: fica inteiramente dentro do pacote `@livekit/track-processors` já usado pelo frontend SolidJS, apenas definindo `assetPaths.modelAssetPath` — confirmado no próprio `.d.ts` do pacote (`BackgroundProcessorCommonOptions.assetPaths`), não só na documentação externa citada no `design.md`.
- Escalabilidade não se aplica: segmentação roda no cliente, por participante; não há impacto em carga de backend/LiveKit.
- Escopo contido: `design.md` continua a excluir corretamente `delegate`, os dois presets de intensidade e o runtime WASM (`tasksVisionFileSet`) do escopo.

## 2. Integração com a infraestrutura existente

Veredito: OK

- Vendorizar em `frontend/public/mediapipe/` segue o padrão já estabelecido (`frontend/public/dice-box-threejs/`); nenhum processo, porta ou container novo; sem impacto em `infra/docker-compose.yml`, backend ou banco de dados.

## 3. Qualidade de arquitetura e trade-offs

Veredito: Atenção

- **Segurança**: N/A, sem mudança de superfície.
- **Performance**: `selfie_segmenter_landscape` (144×256) continua a ter menos pixels de entrada que o default atual (256×256), expectativa de desempenho igual ou melhor.
- **Achado (Atenção, confirmado no código atual de `develop`)**: reli `frontend/src/voice/callSession.tsx` e `frontend/src/voice/preview.ts` nesta data. A chamada `processors.BackgroundProcessor(options)` está em `callSession.tsx:358` hoje, não na linha 231 citada em `proposal.md`/`design.md`/`tasks.md` (deslocamento causado pelo commit `0915045`, "1.13.0"). Mais relevante que o deslocamento: o `options` que chega a essa chamada é **o mesmo objeto, tipado como `SwitchBackgroundProcessorOptions`**, reutilizado tanto para `backgroundProcessor.switchTo(options)` quanto para `processors.BackgroundProcessor(options)` — padrão introduzido por `custom-camera-backgrounds` para alternar efeitos sem reabrir a câmera. Confirmei no `.d.ts` do pacote que `assetPaths` **não existe** em `SwitchBackgroundProcessorOptions` — só em `BackgroundProcessorCommonOptions`, o tipo aceito pelo construtor. A tarefa 2.2 do `tasks.md` ("Pass that constant as `assetPaths: {...}` into the `processors.BackgroundProcessor(options)` call") não pode ser feita adicionando o campo ao `options` já existente, pois isso quebraria o tipo usado por `switchTo`. É preciso um objeto derivado (`{ ...options, assetPaths: ASSET_PATHS }`) só no ponto de construção, em ambos os arquivos (`callSession.tsx:358`, `preview.ts:148`). Não invalida D1/D2/D3, mas é uma lacuna real de implementabilidade que a proposta/tasks não cobrem hoje.
- **Manutenibilidade**: D3 (constante única em `devices.ts`) continua correta — `BLUR_RADIUS` está duplicado em ambos os arquivos (`callSession.tsx:66`, `preview.ts:10`); repetir esse padrão para `assetPaths` pioraria uma duplicação já existente.

## 4. Documentação e decisões (ADRs)

Veredito: Atenção

- As decisões D1/D2/D3 do `design.md` continuam válidas e bem justificadas.
- **Achado (Atenção)**: `proposal.md` (Impact) e `design.md` (Context) citam `callSession.tsx:231`/`preview.ts:148`. `preview.ts:148` ainda está correto por coincidência; `callSession.tsx:231` não aponta mais para a chamada relevante (está em 358). Recomendação: atualizar as referências e documentar no `design.md` que o `options` passado para `BackgroundProcessor` é compartilhado com `switchTo` e por isso precisa de um objeto derivado (achado da dimensão 3).

## 5. Ponte entre produto e técnico

Veredito: OK

- A resposta à pergunta original do usuário continua tecnicamente sólida e verificável.
- O risco já antecipado (a change paralela `custom-camera-backgrounds` deslocar as linhas citadas) materializou-se, e foi além: um commit de release posterior (`1.13.0`) também tocou o mesmo arquivo. Reforça reconfirmar os pontos de integração no início da implementação em vez de confiar no texto da proposta.

## Bloqueantes antes de implementar
- nenhum (os achados acima são de "Atenção": devem ser corrigidos durante a implementação, não bloqueiam a validade da arquitetura escolhida)
