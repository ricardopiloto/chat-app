# Review — Arquiteto de Soluções

**Change:** dice-appearance-preferences  
**Data:** 2026-11-10  
**Veredito geral:** Aprovado com ressalvas

## 1. Definição da arquitetura técnica

Veredito: OK

- Stack alinhada: Axum/SQLite + SolidJS + `@3d-dice/dice-box-threejs` já em uso; sem dependência nova de serviço.
- Componentes claros: preferência `(account, channel)` → snapshot no `dice_roll` → overlay aplica snapshot (D1–D4).
- Escala: uma linha por membro×canal e um JSON pequeno no payload; compatível com instância única / salas de RPG sem fan-out extra.

## 2. Integração com a infraestrutura existente

Veredito: OK

- Só REST + migração SQLite; sem porta, container ou proxy novos.
- Segue o padrão de preferências (`account_dice_toolbar`) e o de roll (`POST …/dice` + `message.new`).
- Backup: tabela pequena no mesmo SQLite; impacto negligível.

## 3. Qualidade de arquitetura e trade-offs

Veredito: Atenção

- **E2EE:** `dice_roll` já vai em `content_plaintext` (não cifra de mensagem). O snapshot de aparência continua nesse modelo — coerente, mas reforça que rolls (e agora skins) são legíveis no servidor. Aceitável se produto assume transparência da mesa; documentar mentalmente no apply.
- **Som partilhado (snapshot):** todos os overlays tocam o som do rolador. Risco de UX/acessibilidade; `design.md` Risks e Non-Goal de mute local estão certos — **Atenção**, não bloqueante.
- Authz GET/PUT `/me` deve espelhar acesso ao canal (membro que vê o canal); PUT não precisa de write se só edita preferência própria, mas roll continua a exigir write — OK se tasks fecharem o bar concreto.

## 4. Documentação e decisões (ADRs)

Veredito: OK

- D1–D5 com alternativas rejeitadas (global vs per-channel, toolbar vs channel API, lookup vs snapshot).
- Sem diagrama: fluxo linear preferência → roll → overlay; complexidade não exige mermaid.

## 5. Ponte entre produto e técnico

Veredito: Atenção

- Pedido (todos vêem cor; per user/channel; cor/material/textura; presets+picker; som) está reflectido em proposal/spec/design.
- **Lacuna de produto aceite:** UI só em Dados; canais de Texto recebem snapshot no roll mas sem editor nesta ronda (Non-Goal / task 3.2). Ressalva: utilizador que só rola em Texto não customiza sem API — alinhado ao Non-Goal, mas vale confirmar na apply se quiserem um atalho mínimo no popover depois.
- Listas curadas de preset/texture adiadas à implementação — OK se o allow-list servidor↔cliente for o mesmo ficheiro de constantes.

## Bloqueantes antes de implementar

- Nenhum.
