# Review — Arquiteto de Soluções

**Change:** desktop-install-and-update
**Data:** 2026-10-12
**Veredito geral:** Aprovado com ressalvas

*Nota: esta é uma segunda revisão. A revisão anterior (Aprovado) foi feita contra um desenho que usava `electron-updater`/download e instalação automática. O utilizador substituiu essa decisão por um modelo de aviso-only + atualização manual, já reflectido no `design.md` actual — esta revisão avalia o desenho novo.*

## 1. Definição da arquitetura técnica

Veredito: OK

- O processo principal consulta `api.github.com/.../releases/latest` via `net.fetch` do Electron (não `electron-updater`, confirmado em `frontend/electron/main.ts:10,37-54`) — sem stack nova. `registerUpdateIpc` (`main.ts:56-58`) segue exactamente o mesmo padrão dos outros handlers já existentes (`mesa:load-instance`, `mesa:save-instance-url`), sem desenhar um mecanismo paralelo.
- Validação da versão restrita a tags estáveis `vMAJOR.MINOR.PATCH` (`versionParts`/`isNewerVersion`, `main.ts:22-35`) e a URL do aviso validada contra `github.com/ricardopiloto/chat-app/releases/tag/` antes de ser aceite (`main.ts:48`) — bom detalhe de segurança, já implementado, que o próprio `design.md` descreve mas não credita como decisão própria.

## 2. Integração com a infraestrutura existente

Veredito: OK

- Sem serviço, porta ou processo novo — é uma chamada HTTPS de saída a uma API pública, sem backend envolvido. Consistente com o Impact do `proposal.md:21` ("Não exige... serviço adicional").

## 3. Qualidade de arquitectura e trade-offs

Veredito: Atenção

- `design.md` Risks só lista "API indisponível" e os dois riscos de hash/validação em máquina real — falta nomear que a consulta é **não-autenticada** a `api.github.com`, cujo limite de taxa (60 pedidos/hora) é por **IP**, não por instalação. Para a escala da Mesa (grupos pequenos de RPG) isto é irrelevante na prática, mas várias instalações atrás do mesmo NAT (ex. um escritório, uma mesa com vários jogadores na mesma rede) partilham esse orçamento — uma linha no `design.md` reconhecendo isto e por que não é um problema a esta escala fecharia a lacuna, no mesmo padrão de risco explícito que o resto do `design.md` já usa para os outros casos.
- Fora isso: sem impacto em E2EE, sem latência de tempo real afectada, mecanismo simples de manter por uma pessoa só.

## 4. Documentação e decisões (ADRs)

Veredito: Atenção

- As três Decisões não seguem o formato "Alternativa considerada: X. Rejeitada porque Y" que o resto do projecto usa consistentemente nesta sessão (ex. `password-recovery`, `https-instance-and-invite-link`, `voice-call-live-presence`). A Decisão 1 em particular justifica-se só pelo "Why" do `proposal.md` (a decisão do utilizador), sem registar que a alternativa anterior (`electron-updater`) foi considerada e por que foi descartada agora — vale a pena completar isto no `design.md`, mesmo que a resposta já esteja implícita no histórico da change.

## 5. Ponte entre produto e técnico

Veredito: OK

- O "Why" é directo: o utilizador decidiu actualização manual em todas as plataformas, substituindo o plano anterior — e o `design.md`/`tasks.md` traduzem isso sem ambiguidade (nenhum download nem execução de instalador em segundo plano, confirmado também no código real).

## Bloqueantes antes de implementar

- nenhum

## Achado fora das 5 dimensões, relevante para o utilizador

A implementação real já cobre a quase totalidade do que `tasks.md` descreve como pendente (`[ ]`) — ver `review-fullstack.md` para o detalhe ficheiro a ficheiro. Isto não é um problema de arquitectura, mas muda o que falta fazer de verdade antes de arquivar esta change.
