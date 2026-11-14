# Review — Arquiteto de Soluções

**Change:** call-controls-visual-feedback
**Data:** 2026-11-11
**Veredito geral:** Aprovado com ressalvas

## 1. Definição da arquitetura técnica

Veredito: OK

- Mudança é puramente CSS/visual, sobre uma classe já partilhada (`.call-control`) entre painel do utilizador e PiP — sem markup, estado ou dependência nova.
- Nenhuma mudança de build (continua CSS simples processado pelo mesmo pipeline Vite já existente; não introduz Tailwind `@apply` novo nesse ficheiro, que hoje é CSS plano).

## 2. Integração com a infraestrutura existente

Veredito: OK

- Sem backend, sem rotas, sem dependência nova. O único ponto de integração é visual: a mesma classe `.call-control` é usada em `CallControls.tsx` (36px hoje) e em `FloatingPlayer.tsx` (32px/30px via media queries do PiP) — o design já reconhece isto e restringe o aumento de tamanho só ao painel principal (D3), o que está correcto.

## 3. Qualidade de arquitetura e trade-offs

Veredito: Atenção

- **D1 (hover/active por variante via `color-mix`):** a receita proposta funciona bem para o neutro e para `.off` (que já usa `color-mix` sobre `--surface-container-high`), mas fica subespecificada para `.on` e `.hangup`, que hoje são cores sólidas de marca (`--secondary-container`, `--error-container`), não misturas de superfície. "Calcular a partir do token base" sem uma fórmula concreta deixa espaço para quem implementar inventar uma mistura ad-hoc por variante, arriscando contraste diferente em cada uma e trabalho de manter 3–4 receitas diferentes sincronizadas entre os dois temas. **Sugestão:** um único mecanismo de "camada de estado" aplicado a todas as variantes por igual — por exemplo `filter:brightness(1.08)` no hover e `brightness(.94)` no active, por cima do fundo que já estiver activo (neutro, off, on ou hangup) — garante o mesmo comportamento perceptual em todas as cores sem recalcular `color-mix` variante a variante, e é mais fácil de validar visualmente nos dois temas de uma vez.
- **D4 (divisor "acoplado"):** a imagem de referência (`conceito-tokens.png`) mostra o botão da câmara e o botão de definições (chevron) como **um único contentor arredondado**, com um traço fino separando as duas metades por dentro — não dois botões independentes, cada um com os seus quatro cantos arredondados, lado a lado com um espaço entre eles. A correcção proposta em D4 (`border-left` no `.small`, mantendo o `gap:2px` actual entre dois botões totalmente arredondados) não produz esse resultado: fica uma linha fina flutuando dentro de um espaço vazio de 2px, com dois botões ainda visivelmente separados, não "acoplados" como o README pede textualmente ("botão secundário acoplado ao botão da câmera, separado por um divisor fino"). Isto precisa de ser corrigido antes da implementação — ver ressalva equivalente no review do Fullstack para a correcção concreta de CSS.

## 4. Documentação e decisões (ADRs)

Veredito: OK

- D1–D5 com alternativas rejeitadas (outline vs box-shadow para foco; tamanho só no painel principal vs também no PiP) — nível de detalhe equivalente aos changes anteriores.
- Falta só reflectir, depois de corrigidas, as duas ressalvas acima nas próprias decisões (D1 e D4), para a documentação não ficar a descrever uma solução que não corresponde à imagem de referência.

## 5. Ponte entre produto e técnico

Veredito: OK

- A proposta cobre os pontos pedidos no README (hover, pressionado, foco, desligado/indisponível, compartilhamento activo, transições 120–160ms, `prefers-reduced-motion`, aplicação ao painel e ao PiP) — falta só a fidelidade do "acoplado" (secção 3) para bater certo com a imagem.

## Bloqueantes antes de implementar

- Nenhum tecnicamente bloqueante, mas recomendo corrigir D4 (divisor/"acoplado") antes do apply — do contrário o resultado visual não vai corresponder à imagem de referência que motivou a proposta, o que é o próprio objectivo da change.
