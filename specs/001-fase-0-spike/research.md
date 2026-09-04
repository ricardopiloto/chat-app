# Research: Spike Fase 0 — Viabilidade da Chamada

**Date**: 2026-08-24  
**Spec**: [spec.md](./spec.md)

Todas as decisões abaixo resolvem o *como* da spec. Nenhuma ficou como NEEDS CLARIFICATION.

---

## 1. Serviço de mídia self-hosted

**Decision**: LiveKit Server em Docker Compose, reusando `spike/infra/`. Imagem `livekit/livekit-server` (pinar tag no momento da implementação e registrar digest no relatório). Portas já mapeadas: TCP 7880 (sinalização), TCP 7881 (ICE/TCP), UDP 50000–50100 (mídia).

**Rationale**: É o SFU da arquitetura. O compose e o `livekit.yaml` já existem. Isolar “o servidor sobe” de “o cliente nosso funciona” usando um cliente de exemplo oficial antes do Tauri.

**Alternatives considered**:
- Pion/Ion-SFU direto — fora da arquitetura.
- LiveKit Cloud — não prova self-host.
- Imagem `latest` sem pin — ok para o primeiro `up`; o relatório deve gravar a versão que rodou.

---

## 2. Relé NAT (TURN)

**Decision**: Onda 1 mesma-rede com TURN **desligado** (config atual). Para User Story 3 (hotspot): ligar o TURN **embutido** do LiveKit (`turn.enabled: true`, `udp_port: 3478`) e `rtc.use_external_ip: true` (ou `node_ip` se o STUN não achar o IP público). Coturn separado só se o embutido falhar no teste do hotspot.

**Rationale**: Spec e spike pedem menos peças móveis primeiro. O LiveKit já autentica o TURN com a sessão. Célula/operadora costuma exigir relé; sem IP público anunciado o cliente no hotspot não acha o SFU.

**Alternatives considered**:
- Coturn desde o dia 1 — mais ops, adiado.
- Túnel (ngrok etc.) — **proibido** pela spec como substituto do teste cross-rede.
- Só ICE/TCP 7881 sem TURN — insuficiente contra NAT de operadora.

**Pré-requisito operacional da US3**: o host precisa ser alcançável da rede móvel (port-forward no roteador: 7880/tcp, 7881/tcp, 3478/udp, 50000–50100/udp). Sem isso a US3 é bloqueio de ambiente, não go.

---

## 3. Cliente desktop

**Decision**: Tauri 2 + Vite + TypeScript **vanilla** (sem Svelte/Solid/React) em `spike/client/`, via `create-tauri-app`. Mídia via **livekit-client** (JS/TS) no webview. Rust do Tauri é só shell.

**Rationale**: A arquitetura já separa shell Rust vs. SDK JS. Vanilla reduz RAM e curva de aprendizado; o spike é descartável e **não** escolhe o framework do MVP.

**Alternatives considered**:
- Svelte/Solid agora — decisão de produto (arquitetura §8.1), fora do spike.
- SDK Rust `livekit` no cliente — rejeitado pela arquitetura e pelo spike revisado.
- Electron — mais pesado; contradiz a meta de leveza.

**Deps Fedora (host atual)**: `webkit2gtk4.1-devel`, `openssl-devel`, toolchain C, `libappindicator-gtk3-devel`, `librsvg2-devel` — conforme Tauri 2 (WebKitGTK 4.1).

---

## 4. Cliente de exemplo (isolamento servidor vs. cliente)

**Decision**: Antes do Tauri, dois joins na mesma sala com o exemplo oficial (Meet / conexão custom com URL `ws://<host>:7880`) ou `livekit-cli` (`lk`) gerando token + um client web de exemplo.

**Rationale**: FR-002 / US1 cenário 3: se o exemplo oficial entra e o Tauri não, a falha é do cliente.

**Alternatives considered**: Dois processos Tauri de cara — mistura dois riscos.

---

## 5. Emissor de credencial (TokenSvc stub)

**Decision**: Serviço Rust mínimo em `spike/token/`: **axum** + crate oficial **`livekit-api`** (`AccessToken` + `VideoGrants`). Bind `0.0.0.0:8080`. Segredo só em env/`livekit.yaml` no processo do token, **nunca** no bundle do cliente. TTL curto (~10 min). Sem auth de usuário (stub).

**Rationale**: Replica o TokenSvc da arquitetura. `livekit-api` 0.6.x é o SDK oficial (atualizado 2026-08). Axum é o stack HTTP idiomático em Rust e cabe num binário de dezenas de linhas.

**Alternatives considered**:
- Assinar JWT na mão com `jsonwebtoken` — duplica o formato LiveKit.
- Colocar a API secret no frontend na Onda 1 — permitido só até a Onda 2 trocar (FR-007).
- Warp/Actix — equivalente; axum tem mais exemplos recentes.

---

## 6. Identidade e grade (2–4 slots)

**Decision**: Identidade = `participant.identity` do LiveKit, digitada no cliente (ex.: `alice`, `bob`). Mapa estático no cliente:

| Slot | Identity |
|------|----------|
| 0 | `alice` |
| 1 | `bob` |
| 2 | *(vazio)* |
| 3 | *(vazio)* |

Quem entra com identity conhecida ocupa o slot; rejoin com a mesma identity volta ao mesmo slot. Layout CSS grid 2×2; slots vazios visíveis. Sem persistência em disco.

**Rationale**: Prova “posição atrelada à pessoa” sem admin UI. Quatro slots com dois ocupantes cobre o cenário 3 da US2.

**Alternatives considered**:
- Ordem de chegada — rejeitado pela spec.
- Várias câmeras por pessoa — fora de escopo.
- Servidor guarda o mapa — overkill para spike.

---

## 7. Prova de criptografia de mídia (Onda 2)

**Decision**: Duas camadas no webview Tauri (Linux/WebKitGTK 4.1):

1. **Probe de API**: `RTCRtpScriptTransform` (Encoded Transform) e, se existir, `createEncodedStreams` legado.
2. **Round-trip**: E2EE embutido do `livekit-client` (`ExternalE2EEKeyProvider` + worker `livekit-client/e2ee-worker`) com chave de teste compartilhada e hardcoded. Go só se o remoto **vê/ouve** a mídia com E2EE ligado (o SFU não decifra).

Se (2) falhar: um `RTCPeerConnection` local com transform XOR ida/volta para distinguir “API ausente” vs. “worker do LiveKit incompatível com este webview”. Qualquer falha de round-trip = no-go da premissa, documentado. Windows/macOS = gap explícito.

**Rationale**: A spec exige cifra→decifra, não só “a API existe”. Usar o caminho que o produto usará (Insertable Streams via SDK LiveKit) evita um XOR que não prova a arquitetura. O probe separado diagnostica o motor.

**Alternatives considered**:
- Só `typeof RTCRtpScriptTransform` — rejeitado na clarificação B.
- Protocolo completo de chaves/custódia — fora de escopo.
- Testar no Chrome do host em vez do webview Tauri — **não conta** (motor diferente).

---

## 8. Medição de RAM

**Decision**: Script `spike/scripts/measure-ram.sh`: RSS via `ps` (e `smem` se disponível) para Tauri e `spike-token`; `docker stats --no-stream` para o container LiveKit. Condições: idle (janela aberta, fora da sala) e em chamada (dois participantes com A/V). Corte: idle do cliente **< 1 GB = go**; ≥ 1 GB = no-go. Faixa “poucas centenas de MB” = observação. Em chamada e demais processos = baseline.

**Rationale**: Ferramentas já no host; bate com a clarificação A.

**Alternatives considered**: `heaptrack`/perf — excesso para o spike. Medir só o webview sem o processo Tauri — subestima o produto.

---

## 9. Relatório go/no-go

**Decision**: Artefato `specs/001-fase-0-spike/results.md` (criado na execução, não neste plan). Uma linha por premissa: go / no-go / bloqueio de ambiente, com número (RAM) ou evidência (screenshot/log). Onda 1 pode fechar sem a Onda 2; Onda 2 fecha credencial + criptografia + RAM.

**Rationale**: SC-007/SC-008.

---

## 10. Testes automatizados

**Decision**: Quase tudo é validação manual (câmera, hotspot, webview). Único teste de código barato: unit/contract do token (`cargo test` — JWT aceito pelo LiveKit, secret não está no JSON de resposta). Sem suite E2E de browser.

**Rationale**: Spike descartável; hotspot e permissão de câmera não se automatizam bem nesta máquina.

---

## 11. Constituição

**Decision**: Constituição ainda é template. Nenhum gate real se aplica. Este spike **não** espera `/speckit-constitution`. Recomendar ratificar constituição **antes do MVP**, não agora.

**Rationale**: Não inventar princípios no meio do plan.
