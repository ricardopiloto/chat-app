# Review — Arquiteto de Soluções

**Change:** electron-system-tray-notifications
**Data:** 2026-11-10
**Veredito geral:** Aprovado com ressalvas

## 1. Definição da arquitetura técnica

Veredito: OK

- Escopo limitado ao shell Electron + bridge de notificações já existentes no renderer — alinhado com a stack real (`frontend/electron`, sem backend novo).
- Fronteiras claras: main = tray/ciclo de vida/Notification OS; renderer = quando anunciar (mesmos eventos in-app); web = no-op via `__MESA_NATIVE__`.
- Escalabilidade: N/A de servidor; risco de volume é no cliente (muitas notificações OS) — ver dimensão 3.

## 2. Integração com a infraestrutura existente

Veredito: OK

- Reutiliza ícones em `frontend/electron/icons/` e IPC/`mesaNative` já estabelecidos.
- Compatível com `electron-custom-title-bar` (D5): `mesa:close` passa a significar hide — decisão correcta e documentada.
- Sem impacto em deploy/Docker/API; só o binário desktop.

## 3. Qualidade de arquitetura e trade-offs

Veredito: Atenção

- Segurança: main decide se mostra Notification com base em foco; não se expõe WebSocket ao main — bom (D3).
- **Volume de notificações OS em “canais com novidade”:** `noteNews` em `shell/state.tsx` corre a cada `message.new` noutro canal. Espelhar 1:1 para o SO gera um toast nativo **por mensagem** enquanto a janela está unfocused, embora o painel in-app **agregue** por canal (`count`). O risco em `design.md` menciona spam mas a mitigação (“só sem foco”) não aborda agregação. Recomendação: coalescer novidade de canal (ex. no máximo uma OS notification por `channelId` até a janela recuperar foco, ou só o primeiro `noteNews` por canal na sessão unfocused); manter 1:1 para `addNotice` (menção/resposta), que já é evento de produto mais raro.
- **Texto da notificação:** o payload de `Notification` (`kind`, ids) não traz título/corpo legíveis; o design assume “derivados do payload” sem ADR de como obter handle/nome do canal. Não bloqueia arquitectura, mas precisa de decisão explícita no design/tasks (templates i18n + lookup local).
- Hide-on-close + tray é o padrão certo; risco de UX “X não sai” já mitigado no design.

## 4. Documentação e decisões (ADRs)

Veredito: OK

- D1–D5 com alternativas rejeitadas e riscos nomeados; Non-Goals claros (sem deep-link OS, sem DND).
- Open Question de locale das strings da tray é aceitável como detalhe de implementação.

## 5. Ponte entre produto e técnico

Veredito: OK

- Pedido do utilizador (tray Abrir/Fechar, X esconde, OS só sem foco, clique = foco) está reflectido fielmente em proposal/specs/design/tasks.
- BREAKING desktop no proposal está bem marcado.

## Bloqueantes antes de implementar

- Nenhum.

## Follow-up (2026-11-10)

- Utilizador confirmou: design/spec/tasks actualizados com coalesce de `noteNews` por canal e montagem de título/corpo no renderer (D3/D3b).
