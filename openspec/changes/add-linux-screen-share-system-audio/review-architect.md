# Review — Arquiteto de Soluções

**Change:** add-linux-screen-share-system-audio
**Data:** 2026-11-17
**Veredito geral:** Aprovado com ressalvas

## 1. Definição da arquitetura técnica

Veredito: Atenção

- A proposta corretamente não compromete uma stack/mecanismo final antes de provar viabilidade (D1 é um gate de spike, não uma implementação assumida). Isso é a decisão certa dado o nível real de incerteza — confirmei eu mesmo que `frontend/electron/main.ts` hoje só passa `audio: "loopback"` quando `process.platform === "win32"`, e que o portal `org.freedesktop.portal.ScreenCast` (conforme a documentação pública citada no `design.md`) não expõe nenhuma opção de áudio em `SelectSources` — a ausência de um caminho óbvio já comprovado justifica o gate em vez de um design fechado.
- **Achado (Atenção, não bloqueante)**: por ser gated, esta dimensão fica formalmente "incompleta" até a task 1.3 — isso é esperado e correto para este tipo de change, mas significa que o veredito desta revisão cobre a *estrutura* da investigação, não uma arquitetura final. Recomendo que, se a spike (D1) passar com uma rota puramente via APIs já existentes (sem addon nativo), o Arquiteto seja consultado de novo antes de D2 avançar para código de produção — o `design.md` já pede isso implicitamente via D3, mas vale deixar explícito que esta revisão aprova o *gate*, não a implementação condicional em si.
- Escalabilidade: N/A — captura e publicação continuam no cliente, por participante, como na change já mesclada.

## 2. Integração com a infraestrutura existente

Veredito: Atenção

- **Achado confirmado por mim**: `frontend/package.json` fixa `electron": "^38.1.0"` e o lockfile resolve para `38.8.6` — bate exatamente com o que o `design.md` cita. `frontend/electron-builder.yml` só tem `linux: target: [AppImage]`, e não encontrei nenhum precedente de dependência nativa (`node-gyp`, `prebuild`, `.node`, N-API) em `frontend/package.json` — confirmo que D3 está certo ao chamar isso de "a primeira dependência nativa própria do app". Isso é um achado real de infraestrutura: um addon nativo contra `libpipewire` exigiria recompilar por ABI do Electron, cobrir a(s) arquitetura(s) que o AppImage já publica, e decidir se a biblioteca é empacotada dentro do AppImage ou assumida como já presente no host — nenhuma dessas três perguntas tem resposta hoje no projeto. O `design.md` (D3) já reconhece isso e corretamente não autoriza um addon sem uma revisão de build/packaging separada — essa é a postura correta dada a ausência total de precedente.
- Sem mudança de backend, banco ou protocolo LiveKit — confirmado, nenhuma task toca `backend/`.

## 3. Qualidade de arquitetura e trade-offs

Veredito: OK

- Segurança/privacidade: a captura de áudio continua "whole-desktop" (não isolada por janela), exatamente a mesma política já aceita e documentada para o Windows na change anterior — não é uma nova decisão de produto, é extensão simétrica de uma política já aprovada; corretamente registrado no `design.md` ("System audio remains whole-desktop regardless of the selected video source").
- Performance: N/A, sem caminho crítico de servidor.
- Manutenibilidade: D3 define corretamente que uma eventual dependência nativa é um "separate build decision" — isso evita que a complexidade de manter um addon específico de plataforma seja assumida de forma implícita por uma equipe pequena como a que este repositório sugere.

## 4. Documentação e decisões (ADRs)

Veredito: OK

- D1/D2/D3 seguem o padrão já estabelecido (decisão + alternativa rejeitada + motivo), com um nível de honestidade acima da média: D1 define um critério de sucesso explícito ("only with an audible remote-client result, track lifecycle evidence, and a documented detection rule" — "An API type check or an observed monitor name alone is insufficient") em vez de aceitar uma prova superficial.
- Sem diagrama — aceitável nesta fase: não há componentes novos desenhados ainda, só um gate de investigação.

## 5. Ponte entre produto e técnico

Veredito: OK

- O pedido do usuário ("quero suporte real no Linux, não só uma mensagem melhor") foi traduzido em uma investigação estruturada com critério de sucesso claro, em vez de uma promessa de entrega que a evidência atual (portal sem opção de áudio documentada, Electron com loopback só em Windows) não sustenta. Isso é exatamente a tradução correta quando o "o que foi pedido" ultrapassa o que "é tecnicamente sustentável" hoje sem investigação.

## Bloqueantes antes de implementar
- nenhum — a estrutura de gate (task 1.3) já é o controle correto; nenhuma implementação de produção deve avançar além do spike sem essa checagem passar.
