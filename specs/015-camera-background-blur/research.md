# Research: 015-camera-background-blur

## 1. Onde processar (local vs CSS vs servidor)

**Decision**: Desfocar no **cliente de quem envia**, no `MediaStreamTrack` de câmara, **antes** de `publishTrack`. O tile local, os remotos e o Egress vêem o mesmo frame.

**Rationale**: FR-005/FR-006. CSS/`backdrop-filter` no `<video>` local não altera o que os outros recebem. Processar no servidor quebraria E2EE e o modelo «o servidor não decodifica».

**Alternatives considered**: Filtro só no preview local — rejeitado na spec. Egress/compositor no LiveKit — exigiria E2EE off e não cobre a sala em tempo real.

## 2. Biblioteca de segmentação

**Decision**: Dependência **`@livekit/track-processors`** (`BackgroundProcessor` + `supportsBackgroundProcessors` / `supportsModernBackgroundProcessors`), alinhada a `livekit-client` ^2.x já no frontend.

- Modo `background-blur` com `blurRadius` distinto para leve vs forte.
- `switchTo({ mode: 'background-blur', blurRadius })` para mudar intensidade sem `setProcessor` repetido.
- `switchTo({ mode: 'disabled' })` **só** quando o utilizador escolhe **Sem blur** (passthrough explícito).
- **Não** usar fundos virtuais (`imagePath`) — fora de âmbito.

**Rationale**: Já estamos no SDK LiveKit; o processor usa MediaPipe Image Segmenter (selfie) + WebGL, com API `LocalVideoTrack.setProcessor`. Evita reimplementar a pipeline.

**Alternatives considered**: BodyPix/TF.js — mais pesado e menos mantido para este caso. Canvas + blur de frame inteiro — desfoca a pessoa (falha FR-003). Processor próprio só com MediaPipe — duplica o que o pacote já faz.

## 3. Primeiro frame nítido (FR-009 / FR-014 / SC-007)

**Decision**: **Não publicar** (ou manter a publicação de vídeo **muted**) até existir pelo menos um frame **já processado** com blur. O `BackgroundProcessor` oficial **passa o primeiro frame sem efeito** de propósito (evitar “flash” cinzento) — isso **viola** a spec de privacidade; o wrapper Mesa **descarta** esse frame e só então publica/unmuta.

Fluxo ao ligar câmara com leve/forte já escolhido:

1. `createLocalVideoTrack()` (getUserMedia).
2. `setProcessor(BackgroundProcessor({ mode: 'background-blur', blurRadius }))` com `assetPaths` locais.
3. Esperar processor ready + **ignorar o 1.º output** (passthrough conhecido).
4. `publishTrack` / `setCameraEnabled(true)` / unmute.
5. Preview local anexa o track **processado** (nunca o raw).

Ao activar blur com a câmara **já** a publicar nítido: **mutar vídeo** → `switchTo` blur → esperar frame processado → unmutar. Não enviar o passthrough.

**Rationale**: Clarificação A da sessão; SC-007. O pacote LiveKit optimiza UX de loading, não privacidade do quarto.

**Alternatives considered**: Publicar raw e aplicar depois — rejeitado. Congelar ecrã preto até o 1.º blur — aceitável como variante se o mute não bastar; preferir mute curto a frame nítido.

## 4. Falha fechada (FR-015 / SC-008)

**Decision**: Enquanto o modo for leve/forte, se o processor lançar erro, WASM falhar, ou deixar de produzir frames:

- **Não** fazer `switchTo('disabled')` nem publicar raw.
- **Parar o vídeo enviado**: `setCameraEnabled(false)` / mute da publicação de câmara (o spec permite «congela ou pára»). Áudio **não** se toca.
- Mensagem visível para quem envia (ex. «Blur de fundo falhou — o vídeo está em pausa»).
- O modo em memória/`localStorage` **mantém-se** leve/forte.
- «Sem blur» → unmutar/raw (utilizador optou por abrir o quarto).
- Recuperação com leve/forte ainda escolhido → mesmo gate do §3 (só unmutar após frame processado).

Recorte imperfeito (silhueta má) **não** é falha — o vídeo continua.

**Rationale**: Clarificação A (fail-closed). Mute é o mecanismo LiveKit mais simples e previsível; freeze de último canvas exigiria um generator extra.

**Alternatives considered**: Voltar a nítido com toast — rejeitado. Tile opaco sem pessoa — mais disruptivo; mute chega.

## 5. Assets MediaPipe (privacidade da instância)

**Decision**: Não usar os defaults CDN (`cdn.jsdelivr.net`, `storage.googleapis.com`). Copiar WASM + modelo selfie para `frontend/public/mediapipe/` e passar `assetPaths` no `BackgroundProcessor`. A instância Mesa serve os ficheiros na mesma origem.

**Rationale**: Produto E2EE; a chamada não deve ir buscar modelos a terceiros. Instâncias air-gapped / sem Google continuam a funcionar.

**Alternatives considered**: CDN LiveKit/Google — mais simples, rejeitado por privacidade e operação.

## 6. Raios leve vs forte

**Decision**: Constantes no módulo de blur (não slider):

| Modo | `blurRadius` | Intenção |
|------|----------------|----------|
| `light` | `12` | Fundo suavizado; formas grandes ainda perceptíveis |
| `strong` | `32` | Fundo claramente mais escondido |

Valores ajustáveis só se o quickstart mostrar que não distinguem (SC-002); não expor na UI.

**Rationale**: Dois modos pedidos; default LiveKit é ~10 (perto de «leve»). Forte ~3× para diferença óbvia.

**Alternatives considered**: 8 vs 16 — risco de SC-002 falhar. Slider — fora de âmbito.

## 7. Persistência

**Decision**: `localStorage['mesa.cameraBlur']` ∈ `{ off, light, strong }`. Default `off` se ausente/inválido. Mesmo padrão que `theme/theme.ts` (`mesa.theme`). Por dispositivo; não sincronizar conta.

**Rationale**: FR-011; spec assume paridade com o tema.

**Alternatives considered**: sessionStorage — perde no reload (falha FR-011). Cookie/API — backend fora de âmbito.

## 8. Integração LiveKit vs «Vídeo de teste»

**Decision**: Processor **só** na câmara real. `createTestVideoTrack` (canvas) publica-se como hoje, sem `setProcessor`. Probe de suporte corre na UI mesmo em teste (a seta pode mostrar «não disponível» só quando se tenta aplicar à câmara real).

`joinLiveRoom` passa a aceitar `LocalTrack` (câmara) ou `MediaStreamTrack` (teste). `toggleCam` deixa de ser só `setCameraEnabled` ingénuo: ao **ligar**, se modo ≠ off, aplicar gate §3.

**Rationale**: FR-012. Teste é diagnóstico da sala, não webcam.

## 9. UI: split + seta (forma, não só cor)

**Decision**: Grupo `.call-ctrl-split`: botão principal (ícone câmara + rótulo fixo «Câmara») e botão seta (`aria-haspopup="menu"`). Menu tipo `AccountMenu` (Escape / clique fora). Três `menuitemradio`. Seta **off**: chevron outline. Seta **on** (leve ou forte): o **mesmo** chevron **com uma marca geométrica extra** (ex. pequeno losango/pip preenchido a `currentColor`) — diferença de **forma**. `aria-label` da seta muda («Fundo: sem blur» vs «Fundo: blur ligado»). Ícone da câmara inalterado quanto ao blur.

**Rationale**: Clarificações D + split + indicador à vista. 012: estado não depende só de cor; rótulo «Câmara» não muda.

**Alternatives considered**: Botão Fundo próprio — rejeitado. Clique longo — rejeitado. Mudar o ícone da câmara — rejeitado (FR-017).

## 10. Indisponibilidade (FR-010)

**Decision**: `supportsBackgroundProcessors() === false` (ou falha a carregar WASM/modelo **antes** de o utilizador ficar com leve/forte seleccionado): menu mostra as opções mas escolher leve/forte **não** persiste como ligado; toast/linha de erro «Blur de fundo não disponível»; câmara pode ficar nítida. Se o suporte existir e só falhar **depois** de ligado → §4, não FR-010.

**Rationale**: Distinguir «nunca pôde ligar» de «estava ligado e partiu».
