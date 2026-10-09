# Review — Arquiteto de Soluções

**Change:** frontend-instance-connect
**Data:** 2026-10-09 (revisão 4 — amendment durante a implementação: 3.3 corrigida para fetch autenticado + object URL; 5.4 adiada para `desktop-tauri-shell`; 6.2 marcada fora de escopo)
**Veredito geral:** Aprovado

## 1. Definição da arquitetura técnica

Veredito: OK

- A correcção da Decisão 2.2 (object URL via `requestBytes`, em vez de só mudar a URL) reaproveita um padrão já existente no código (`fetchAttachmentBlob`) em vez de inventar um mecanismo novo — boa prática de reuso, consistente com o resto desta change.

## 2. Integração com a infraestrutura existente

Veredito: OK

- Confirmado por código real (`backend/src/api/avatars.rs:114-124,186-194`) que os dois endpoints exigem `AuthUser` — a correcção está ancorada no comportamento real do backend, não numa suposição. Sem esta correcção, a change não cumpriria "mesmas funcionalidades" para avatares/imagens de servidor em modo nativo.

## 3. Qualidade de arquitectura e trade-offs

Veredito: OK

- Segurança: a alternativa descartada (token na query string) está correctamente rejeitada pelo mesmo motivo que já fundamentou a escolha do header em `native-client-auth` — coerência entre changes.
- A 5.4 adiada para `desktop-tauri-shell` é a decisão certa: testar `@tauri-apps/plugin-websocket` exige o runtime real do Tauri, que a simulação em browser desta change nunca teve como objectivo cobrir (já reconhecido na Decisão 4 original). Adiar, não inventar um mock parcial, mantém a verificação honesta.
- A 6.2 fora de escopo é correcta — não é tarefa desta change remendar uma ferramenta de verificação que ficou obsoleta por um motivo anterior e não relacionado (remoção da árvore v1).

## 4. Documentação e decisões (ADRs)

Veredito: OK

- A Decisão 2.2 documenta explicitamente que a versão original estava incompleta e porquê — modelo exemplar de como registar uma correcção descoberta durante a implementação sem esconder o histórico da decisão.

## 5. Ponte entre produto e técnico

Veredito: OK

- "Mesmas funcionalidades" (pedido original do utilizador) continua a ser cumprido depois da correcção — sem ela, ficaria uma regressão visível (avatares/imagens rebentadas) em modo nativo.

## Bloqueantes antes de implementar

- nenhum
