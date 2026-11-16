# Review — Arquiteto de Soluções

**Change:** per-participant-volume-boost
**Data:** 2026-11-13
**Veredito geral:** Aprovado com ressalvas

## 1. Definição da arquitetura técnica

Veredito: OK

- Sem stack ou dependência nova: fica inteiramente dentro do que o browser já oferece (Web Audio API) e do padrão de persistência local já usado neste frontend SolidJS (`readJson`/`writeJson`, confirmado em `frontend/src/lib/localPrefs.ts`/`frontend/src/voice/devices.ts`).
- Escalabilidade não se aplica: é um ajuste 100% client-side, por pessoa que ouve, sem nenhum impacto no LiveKit SFU nem no backend — não há "carga" a dimensionar.
- A nova capability `frontend-v2/voice-participant-volume` (em vez de encaixar isto em `voice-grid` ou `voice-session`) está correta: o comportamento é transversal a grid/stage/strip (não é uma preocupação de layout de grade) e não é sobre os próprios controlos da chamada (`voice-session` já cobre "alternar surdo/ouvir" como algo global, não por participante) — uma capability dedicada e estreita é consistente com o padrão já usado para `floating-voice-pip`/`call-popout` neste repositório.

## 2. Integração com a infraestrutura existente

Veredito: N/A

- Confirmado: nenhum endpoint, tabela, migração ou variável de ambiente nova. É puramente frontend, decisão já confirmada com o utilizador (`design.md` D2) em vez da alternativa sincronizada por conta. Nenhum impacto em `infra/`, backend ou LiveKit.

## 3. Qualidade de arquitetura e trade-offs

Veredito: Atenção

- **Segurança/E2EE**: confirmei que isto não toca na fronteira de E2EE. A decifragem acontece ao nível do `MediaStreamTrack` via Insertable Streams do LiveKit, antes de `track.attach()` criar o `<audio>`; por essa altura o áudio já está decifrado. Rotear esse elemento já decifrado por um `GainNode` da Web Audio API é um ajuste de reprodução puramente local, pós-decifragem — não é um ponto novo de risco para a garantia de E2EE deste produto. Vale a pena este raciocínio estar explícito nalgum lado (mesmo que não precise de mudar nada), já que é exactamente o tipo de pergunta que alguém vai fazer sobre uma mudança no caminho de áudio deste projecto.
- **Achado (Atenção)**: `design.md` não diz se cada participante "boostado" (>100%) cria o seu próprio `AudioContext`, ou se existe um único `AudioContext` partilhado (criado uma vez, lazy) reutilizado para todos os participantes boostados numa chamada. Criar um `AudioContext` por participante é um anti-padrão conhecido (cada instância tem overhead próprio, e browsers têm limites práticos de contextos simultâneos). Recomendo que o `design.md`/`tasks.md` deixem explícito que é **um** `AudioContext` partilhado, criado uma vez e reutilizado, com um `MediaElementAudioSourceNode`+`GainNode` por participante boostado ligados a esse mesmo contexto.
- **Achado (Atenção)**: `design.md` D3 descreve dois caminhos ("0-100% fica no `.volume` do elemento; só >100% passa a Web Audio") como se fossem simétricos e reversíveis, mas `createMediaElementSource(el)` da Web Audio API **não é reversível** — uma vez que um elemento `<audio>` é ligado a um grafo de Web Audio, a sua saída fica permanentemente roteada por esse grafo; não há como "voltar" a usar `.volume` directamente nesse elemento depois. Isto é um caso real dentro desta mesma chamada: alguém sobe um participante para 150% (passa a usar o grafo) e depois desce para 80% (ainda acima de 0%, mas abaixo do limiar de 100%) — o `design.md` não diz o que acontece aqui. A correcção mais simples é: uma vez que um elemento foi envolvido no grafo de Web Audio nessa chamada, ele fica nesse caminho até a chamada terminar (ajustando só o `gain`, incluindo para valores ≤100%), em vez de tentar "desligar" o grafo. Isto precisa de ficar explícito antes da implementação, não descoberto a meio dela.
- **Manutenibilidade**: fora os dois pontos acima, a decisão de reaproveitar `readJson`/`writeJson` e o slot `actions` já existente em `Tile` mantém a mudança pequena e bem localizada — correcto.

## 4. Documentação e decisões (ADRs)

Veredito: OK

- D1-D4 seguem o formato já estabelecido no projecto (decisão + alternativa rejeitada + motivo), com justificação real para cada escolha, incluindo a alternativa sincronizada por conta correctamente registada como rejeitada-mas-possível-follow-up.
- Sem diagrama — correcto não incluir um aqui: não há componente ou fluxo de dados novo entre partes do sistema, só reconfiguração de elementos já existentes.

## 5. Ponte entre produto e técnico

Veredito: OK

- O pedido original do utilizador ("tipo o Discord, aumentar o volume de uma pessoa específica") foi traduzido fielmente: mesmo intervalo (0-200%), mesma semântica (100% = inalterado), e a limitação técnica real de `HTMLMediaElement.volume` (tecto de 1.0) foi correctamente identificada como o motivo técnico concreto para precisar da Web Audio API no caminho acima de 100%, em vez de ficar como uma promessa vaga de "vamos aumentar o volume".
- A decisão de escopo (local-only vs. sincronizado por conta) foi explicitamente levantada ao utilizador antes de escrever a proposta, e a resposta ficou registada tanto no `proposal.md` quanto no `design.md` — exactamente o tipo de decisão produto↔técnico que deve ficar explícita.

## Bloqueantes antes de implementar
- nenhum
