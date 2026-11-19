# Review — Desenvolvedor Fullstack

**Change:** add-linux-screen-share-native-audio-capture
**Data:** 2026-11-18
**Veredito geral:** Bloqueado

## 1. Desenvolvimento do backend

Veredito: N/A

- Confirmado: nenhuma task toca `backend/`; tudo fica no addon nativo e no cliente Electron/frontend. `backend/Cargo.toml` não tem (nem precisa ter) nenhuma dependência de áudio/mídia.

## 2. Desenvolvimento do frontend

Veredito: Atenção

- O trabalho real de "frontend" aqui é quase todo em `frontend/electron/main.ts` (processo main) e `frontend/src/voice/callSession.tsx` (lifecycle de publish/teardown), não em componentes de UI — não há control novo a desenhar, o controle de áudio já existe (proposto por `add-screen-share-audio-and-popout-controls`). Isso está correto e bem escopado em `tasks.md` 4.1.
- **Achado concreto sobre a ponte IPC (D3)**: confirmei `frontend/electron/preload.ts` por inteiro — hoje ele só expõe `ipcRenderer.invoke`/`.send`/`.on` para mensagens pequenas e serializáveis (strings, objetos de controle como `CallPopoutCommand`). Nenhum canal existente transporta dados binários de alta frequência. `design.md` (D3) diz "over an IPC channel exposed through the existing preload bridge (binary/transferable buffers, not JSON, to keep the per-frame overhead low)", mas não especifica o mecanismo concreto — `ipcRenderer.send`/`.invoke` padrão fazem structured-clone (cópia), não transferência zero-copy. Para PCM contínuo (ex. 48kHz estéreo ~192KB/s em chunks de 10-20ms), isso é overhead real por frame. Recomendo que a task 3.1 especifique explicitamente o uso de `ipcRenderer.postMessage`/`MessagePort` transferível (suportado através de `contextBridge` desde Electron 8), não o padrão `send`/`invoke` já usado para os outros canais deste preload — caso contrário quem for implementar vai improvisar o transporte sem orientação, e é exatamente o tipo de detalhe que pode produzir o "glitch" que a própria D4 pede para testar.
- Fora esse ponto, o fluxo do Web Audio (`AudioWorkletNode` → `MediaStreamAudioDestinationNode` → `MediaStreamTrack`) está descrito com especificidade suficiente para implementar, e corretamente aponta o precedente já existente no código (`AudioContext`/`GainNode` no boost de volume).

## 3. Deploy e operação

Veredito: **Bloqueante**

- **Mesmo achado crítico do Arquiteto, confirmado de forma independente**: `.github/workflows/desktop-release.yml` já existe e seu job `linux` (`runs-on: ubuntu-latest`) é o pipeline real que compila e empacota o AppImage publicado a cada tag `v*`. `tasks.md` (grupo 5) não tem nenhuma task que edite esse workflow para instalar `libpipewire-0.3-dev` via `apt-get` antes do build, nem para garantir uma toolchain Rust utilizável no runner. Sem isso, mesmo que todo o resto seja implementado e funcione localmente, o release automatizado real vai produzir um AppImage sem o addon (ou o build vai falhar sem aviso prévio claro) — é um bloqueador de entrega, não só de documentação.
- Logging: confirmei o padrão já usado em `electron/main.ts` (`console.warn`/`console.error` com mensagem curta + contexto, ex. linha 603 `console.error("screen share sources failed", error)`, sem lib externa de log) — os caminhos de falha silenciosa do addon (ausente, falha ao carregar, falha ao capturar) devem seguir esse mesmo padrão simples; não é necessário introduzir `electron-log` ou equivalente só para isso. `tasks.md` não precisa de ajuste aqui, mas vale deixar explícito na implementação.
- `pipewire-devel` ausente na própria máquina de dev (confirmado nesta sessão) já está corretamente documentado como requisito de setup em `tasks.md` 1.1/5.2 — bom, mas é insuficiente sozinho sem a mudança de CI acima.

## 4. Qualidade de código

Veredito: OK

- `tasks.md` segue o padrão de granularidade já visto nas outras changes desta leva (grupos pequenos, verificação explícita por task). O gate da task 3.3 (D4) é o controle certo e está no lugar certo (antes da integração completa, não depois).
- Tratamento de erro/resiliência: cada ponto de falha (addon ausente, build falhou, captura falhou, host sem PipeWire) está mapeado para o mesmo fallback silencioso video-only — consistente com o padrão já aceito para Windows loopback, sem caminho implícito não coberto.
- Organização: o addon nativo fica isolado (escopo mínimo: captura + entrega de frames), sem reabrir ou duplicar lógica já existente em `fulfillScreenShare`/`callSession.tsx` além do necessário para integrar.

## 5. Execução das decisões arquiteturais

Veredito: OK

- `tasks.md` segue fielmente D1→D5 na ordem certa (scaffold → captura nativa → ponte IPC/WebAudio com gate → integração → empacotamento) sem reabrir nenhuma decisão prematuramente.
- Nenhuma limitação técnica nova além da já reportada à dimensão 3 acima (que também é, no fundo, uma lacuna de arquitetura de infraestrutura de release — convirjo com o que o Arquiteto já marcou como bloqueante).

## Bloqueantes antes de implementar

- Adicionar a `.github/workflows/desktop-release.yml` (job `linux`) a instalação de `libpipewire-0.3-dev` e a verificação/fixação da toolchain Rust, com uma task correspondente em `tasks.md` — mesmo bloqueante já identificado pelo Arquiteto, confirmado de forma independente pela ótica de deploy/operação.
- Tornar D3/task 3.1 explícita sobre o uso de `ipcRenderer.postMessage`/`MessagePort` transferível para os frames de PCM, em vez do padrão `send`/`invoke` já usado nos outros canais deste preload (que faz cópia via structured-clone, não é vocacionado para dados binários de alta frequência).

## Limitações técnicas a reportar ao Arquiteto

- Nenhuma adicional além do que já convergiu acima — o achado de CI já está no relatório do Arquiteto; o achado de transporte IPC é de implementação (apontado aqui), não muda a arquitetura escolhida em D3, só a precisa.
