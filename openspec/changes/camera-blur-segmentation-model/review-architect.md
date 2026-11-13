# Review — Arquiteto de Soluções

**Change:** camera-blur-segmentation-model
**Data:** 2026-11-13
**Veredito geral:** Aprovado com ressalvas

## 1. Definição da arquitetura técnica

Veredito: OK

- A change não introduz stack, serviço ou dependência nova: fica inteiramente dentro do pacote `@livekit/track-processors` já usado pelo frontend SolidJS (`frontend/package.json`), apenas passando `assetPaths.modelAssetPath` — uma opção já suportada pelo pacote — em vez de deixar o valor por omissão.
- Escalabilidade não se aplica neste caso: a segmentação roda no cliente, por participante, não no servidor — trocar de modelo não muda a carga do backend/LiveKit de forma alguma.
- Escopo bem contido: `design.md` declara explicitamente como Non-Goal não tocar no `delegate` (GPU/CPU), nos dois presets de intensidade existentes, nem no runtime WASM (`tasksVisionFileSet`) — reduz a superfície de regressão a um valor de configuração e um arquivo estático novo.

## 2. Integração com a infraestrutura existente

Veredito: OK

- Vendorizar o modelo em `frontend/public/mediapipe/` reaproveita um padrão já estabelecido no próprio repositório (`frontend/public/dice-box-threejs/`) em vez de inventar um mecanismo novo de distribuição de assets — é a escolha correta e o `design.md` (D2) cita a precedência corretamente.
- A mudança reforça, em vez de contradizer, a filosofia de self-host já declarada no `README.md` ("Instances do not federate, and the server cannot read conversation content under normal operation"): remover uma dependência de rede de saída obrigatória para uma feature de câmera é coerente com esse posicionamento, mesmo não sendo uma garantia de segurança/E2EE em si — é sobre disponibilidade/autonomia da instância.
- Nenhum processo, porta ou container novo; nenhum impacto em `infra/docker-compose.yml`, backend, banco de dados ou migração.

## 3. Qualidade de arquitetura e trade-offs

Veredito: Atenção

- **Segurança**: não há mudança de superfície — sem novo fluxo de dados, autenticação ou E2EE envolvido. N/A para essa sub-dimensão.
- **Performance**: a troca para `selfie_segmenter_landscape` (144×256) tem **menos pixels de entrada** que o modelo quadrado actual (256×256), então a expectativa de desempenho é igual ou melhor, não pior — o `design.md` não afirma isso explicitamente como uma vantagem de performance, só como motivo de escolha por adequação ao formato; vale registar essa inferência como argumento a favor, não é um risco.
- **Achado (Atenção)**: o `design.md` já lista corretamente como risco a falta de confirmação por escrito da licença do modelo MediaPipe vendorizado, e a tarefa 1.1 do `tasks.md` cobre isso ("record its license/attribution next to it") — correto não deixar isso como afterthought. Mas a licença exata (Apache 2.0, esperado para modelos MediaPipe, mas não confirmado no texto da proposta) continua um item em aberto até a implementação; não é bloqueante, mas é uma dependência real de uma tarefa de verificação externa (ler os termos de uso publicados pela Google), não só de código.
- **Manutenibilidade**: a decisão D3 (um único `assetPaths` compartilhado em `devices.ts` em vez de duplicar como `BLUR_RADIUS` já está duplicado) é a escolha certa e evita piorar uma duplicação que já existe.

## 4. Documentação e decisões (ADRs)

Veredito: OK

- `design.md` segue a convenção `D1`/`D2`/`D3` já estabelecida em changes anteriores deste projeto (ex. `password-recovery`), com alternativas rejeitadas e motivo para cada decisão — nível de detalhe adequado.
- Sem diagrama — correto não incluir um aqui: não há fluxo de dados novo entre componentes, só um valor de configuração e um arquivo estático a mais; a ausência de diagrama não é uma lacuna.

## 5. Ponte entre produto e técnico

Veredito: OK

- A pergunta aberta do usuário ("consigo melhorar o modelo de blur?") foi traduzida numa decisão técnica concreta e verificável (modelo oficial do MediaPipe, citado com a descrição publicada pela própria Google de para que ele serve), em vez de uma resposta vaga de "vamos pesquisar modelos melhores" — é exatamente o tipo de tradução produto→técnico que esta dimensão cobra.
- **Achado (Atenção, não bloqueante)**: a change em curso `custom-camera-backgrounds` (9/14 tarefas concluídas, ainda não arquivada) também adiciona requisitos à mesma capability `frontend-v2/audio-video-settings` e mexeu recentemente nos mesmos pontos de chamada (`processors.BackgroundProcessor(options)` em `callSession.tsx`/`preview.ts`, para suportar fundos personalizados). Não há colisão de conteúdo entre os dois deltas (tópicos diferentes: upload/seleção de fundo vs. modelo de segmentação), mas como `custom-camera-backgrounds` ainda tem 5 tarefas pendentes, os números de linha exactos citados em `camera-blur-segmentation-model` (`callSession.tsx:231`, `preview.ts:148`) podem deslocar-se antes da implementação desta change. Recomendação: reconfirmar essas linhas no início da implementação, não é motivo para bloquear o planeamento agora.

## Bloqueantes antes de implementar
- nenhum
