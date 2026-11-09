# Review — Arquiteto de Soluções

**Change:** spotlight-bottom-cameras-and-fullscreen
**Data:** 2026-11-08
**Veredito geral:** Aprovado

## 1. Definição da arquitetura técnica
Veredito: OK

- Confirmei por leitura de `node_modules/lucide-solid/dist/esm/icons/`: `maximize.mjs` e `minimize.mjs` existem como exportações distintas de `maximize-2.mjs`/`minimize-2.mjs` — a escolha de D4 (`Maximize`/`Minimize` para o botão novo, separados de `Maximize2`/`Minimize2` já usados pelo alternador de destaque) é implementável exactamente como especificado, sem risco de colisão de nomes nem de ícone inexistente.
- A Fullscreen API nativa do browser é a escolha certa — não há motivo para uma biblioteca de terceiros para isto, e é consistente com o resto do projecto (sem dependências novas para funcionalidades de UI que o browser já oferece).

## 2. Integração com a infraestrutura existente
Veredito: OK

- Sem backend, sem infraestrutura nova. D1 (faixa inferior) é puramente CSS, reaproveitando uma regra que já existe no projecto para outro breakpoint — baixo risco de regressão por ser extensão de um padrão já testado visualmente (ainda que só no mobile).

## 3. Qualidade de arquitetura e trade-offs
Veredito: OK

- D3 (sincronizar pelo evento `fullscreenchange`, nunca pela resolução da promessa) é a decisão correcta — é precisamente o padrão recomendado para esta API, porque a saída por Esc ou gesto do sistema nunca passa pelo código da aplicação. Boa antecipação de um bug fácil de introduzir (estado dessincronizado) numa API que o projecto nunca usou antes.
- D3 também já antecipa o caso do tile ser desmontado em tela-cheia (chamar `exitFullscreen()` no `onCleanup`) — evita a app ficar "presa" em tela-cheia de um elemento removido, um bug real e fácil de esquecer na primeira integração desta API.
- Risco assinalado correctamente nos Risks/Trade-offs: `requestFullscreen()` pode ser rejeitado fora de um gesto directo do utilizador; o `.catch(() => {})` já previsto evita uma promessa rejeitada sem tratamento.

## 4. Documentação e decisões (ADRs)
Veredito: OK

- `design.md` está ao nível das melhores changes desta sessão: 4 decisões, cada uma com o porquê, incluindo a nota de implementação sobre mover o chip "Em transmissão" para dentro do `<figure>` (um detalhe fácil de passar ao lado sem o registar explicitamente).
- A reversão do requirement de fidelidade ao mockup está registada tanto no `proposal.md` (marcada **BREAKING**) como no próprio spec delta (cenário de comparação ajustado para excluir especificamente a posição da faixa) — é o padrão certo, mesmo já usado em `electron-custom-title-bar`.

## 5. Ponte entre produto e técnico
Veredito: OK

- As duas peças do pedido do utilizador (câmaras em baixo; opção de tela-cheia) estão ambas traduzidas em decisões técnicas concretas e implementáveis, sem lacuna nem promessa vaga.

## Bloqueantes antes de implementar
- Nenhum.
