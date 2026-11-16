# Review — Arquiteto de Soluções

**Change:** camera-blur-segmentation-model
**Data:** 2026-11-16
**Veredito geral:** Aprovado com ressalvas

## 1. Definição da arquitetura técnica

Veredito: OK

- A change continua a não introduzir stack, serviço ou dependência nova: fica inteiramente dentro do pacote `@livekit/track-processors` já usado pelo frontend SolidJS, apenas definindo `assetPaths.modelAssetPath` — confirmado agora no próprio `.d.ts` do pacote (`BackgroundProcessorCommonOptions.assetPaths`), não só na documentação externa citada no `design.md`.
- Escalabilidade não se aplica: segmentação roda no cliente, por participante; não há impacto em carga de backend/LiveKit.
- Escopo contido: `design.md` continua a excluir corretamente `delegate`, os dois presets de intensidade e o runtime WASM (`tasksVisionFileSet`) do escopo.

## 2. Integração com a infraestrutura existente

Veredito: OK

- Vendorizar em `frontend/public/mediapipe/` segue o padrão já estabelecido (`frontend/public/dice-box-threejs/`); nenhum processo, porta ou container novo; sem impacto em `infra/docker-compose.yml`, backend ou banco de dados.

## 3. Qualidade de arquitetura e trade-offs

Veredito: Atenção

- **Segurança**: N/A, sem mudança de superfície.
- **Performance**: sem alteração de avaliação — `selfie_segmenter_landscape` (144×256) continua a ter menos pixels de entrada que o default atual (256×256), expectativa de desempenho igual ou melhor.
- **Achado (Atenção, confirmado agora — materializou o risco já antecipado na revisão anterior de 2026-11-13)**: desde a última revisão, o ponto de integração mudou de forma real, não só de número de linha. Reli agora `frontend/src/voice/callSession.tsx` e `frontend/src/voice/preview.ts`: o commit `0915045` ("1.13.0", 2026-11-14 — um dia depois da revisão anterior) tocou `callSession.tsx` e deslocou a chamada `processors.BackgroundProcessor(options)` da linha 231 citada no `proposal.md`/`design.md` para a linha **358** hoje. Mais relevante que o deslocamento em si: o objeto `options` que chega até essa chamada é **o mesmo objeto, já tipado como `SwitchBackgroundProcessorOptions`**, reutilizado tanto para `backgroundProcessor.switchTo(options)` (quando já existe um processor) quanto para `processors.BackgroundProcessor(options)` (quando não existe) — um padrão introduzido pela change `custom-camera-backgrounds` (commit `3cb582d`, 2026-11-11) para alternar entre blur e fundo virtual sem reabrir a câmara. Confirmei no `.d.ts` do pacote (`frontend/node_modules/@livekit/track-processors/dist/src/index.d.ts`) que `assetPaths` **não existe** em `SwitchBackgroundProcessorOptions` — só em `BackgroundProcessorCommonOptions`, o tipo que compõe `BackgroundProcessorOptions` (o aceito pelo construtor). Ou seja, a instrução "passar `assetPaths` para dentro da chamada `processors.BackgroundProcessor(options)`" não pode ser feita adicionando o campo ao `options` já existente (quebraria o tipo de `switchTo`, que não aceita `assetPaths`) — precisa de um objeto separado (`{ ...options, assetPaths: ASSET_PATHS }`) só no ponto de construção. Isto não invalida nenhuma das decisões D1/D2/D3 do `design.md`, mas é uma lacuna real de implementabilidade que nem a proposta nem a tarefa 2.2 do `tasks.md` cobrem hoje.
- **Manutenibilidade**: D3 (constante única em `devices.ts`) continua correta e, aliás, mais importante agora do que quando foi escrita: `BLUR_RADIUS` está duplicado em ambos os arquivos exatamente como antes (`callSession.tsx:66`, `preview.ts:10`), então repetir esse padrão para `assetPaths` seria piorar uma duplicação que já existe em dois lugares que agora têm uma lógica de switching mais complexa.

## 4. Documentação e decisões (ADRs)

Veredito: Atenção

- As decisões D1/D2/D3 do `design.md` continuam válidas e bem justificadas (convenção do projeto respeitada).
- **Achado (Atenção)**: `proposal.md` (Impact) e `design.md` (Context) citam `callSession.tsx:231`/`preview.ts:148` como os pontos de integração. `preview.ts:148` ainda está correto por coincidência, mas `callSession.tsx:231` já não aponta para a chamada relevante (está em 358 hoje). Recomendação: atualizar as duas referências antes de iniciar a implementação, e já deixar registado no `design.md` que o `options` passado para `BackgroundProcessor` é compartilhado com `switchTo` e por isso precisa de um objeto derivado (ver achado da dimensão 3) — hoje essa nuance não está documentada.

## 5. Ponte entre produto e técnico

Veredito: OK

- A resposta à pergunta original do usuário continua tecnicamente sólida e verificável.
- O achado de "Atenção" da revisão anterior (risco de a change paralela `custom-camera-backgrounds` deslocar as linhas citadas) materializou-se exatamente como previsto — e foi além: não foi só `custom-camera-backgrounds` que deslocou as linhas, foi um commit de release posterior (`1.13.0`) que também tocou o mesmo arquivo. Isso reforça a recomendação, já feita antes, de reconfirmar os pontos de integração no início da implementação em vez de confiar nos números de linha do texto da proposta.

## Bloqueantes antes de implementar
- nenhum (os achados de documentação/implementabilidade acima são de "Atenção": devem ser corrigidos antes ou no início da implementação, mas não bloqueiam a validade da arquitetura escolhida)
