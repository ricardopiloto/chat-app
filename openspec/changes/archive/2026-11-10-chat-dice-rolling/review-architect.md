# Review — Arquiteto de Soluções

**Change:** chat-dice-rolling
**Data:** 2026-11-10
**Veredito geral:** Aprovado com ressalvas

## 1. Definição da arquitetura técnica

Veredito: OK

- A apresentação 3D (C1-C6, ronda anterior) continua bem desenhada: `@3d-dice/dice-box-threejs` por causa de *predetermined outcomes*, fronteira clara entre RNG do servidor (inalterado) e animação local.
- O interruptor de spam (D1-D5, esta ronda) é a escolha arquitectural mais simples possível para o problema: em vez de uma *capability*/permissão nova no sistema de cargos, reaproveita a permissão de gerir canal já existente (`require_channel_manager`) e o mecanismo de definição por canal já existente (`PatchChannelBody`/`patch_channel`, mesmo padrão de `visible_to_new_members`). Isto está correctamente registado como decisão explícita em D2 e como Non-Goal em `design.md` ("Permissão granular por cargo ou membro... aplica-se apenas a permissão existente de gerir o canal") — o pedido do utilizador usou a palavra "permissão", e o design não inventou uma permissão nova onde a existente já resolve.
- Âmbito por tipo de canal (D3: só Texto lê o campo, Dados ignora-o e mostra sempre) está coerente com a Decisão A2 já aceite (canal de Dados existe só para rolar) — não introduz um terceiro comportamento, reaproveita uma distinção de tipo já estabelecida.

## 2. Integração com a infraestrutura existente

Veredito: OK

- A ressalva de CSP (Worker/`blob:`/WASM da biblioteca 3D contra `backend/src/security_headers.rs`) identificada na ronda anterior já está incorporada como Tarefa 6.2, a correr antes do `DiceOverlay` (Tarefa 6.4) — sem pendência nova aqui.
- D1 segue exactamente o precedente de esquema do projecto: `Channel.visible_to_new_members` (`backend/migrations/0012_server_channel_permissions.sql:3`, `INTEGER NOT NULL DEFAULT 1`) para um boolean por canal em SQLite — o novo campo usa `DEFAULT 0`, mesma convenção, migração aditiva isolada, sem tocar dados existentes.
- D5 reaproveita `channel_acl.changed` (já difundido por `patch_channel`) e a invalidação já existente em `frontend/src/shell/state.tsx` — nenhum mecanismo de distribuição novo, nenhuma porta/serviço novo.

## 3. Qualidade de arquitectura e trade-offs

Veredito: Atenção

- Segurança: preservada — o campo é só uma preferência de apresentação, sem relação com E2EE/RNG; a validação (D2, Tarefa 7.3) impede configurar um campo sem efeito num canal de Dados/Voz.
- **Consistência eventual aceitável, mas não nomeada como risco**: o disparo do overlay (Tarefa 7.5) consulta "o valor actual do canal" no momento em que `message.new` chega. Esse valor vem do cache de canais do frontend, actualizado de forma assíncrona pela invalidação de `channel_acl.changed` (D5) — não há garantia de ordem entre "`patch_channel` confirma a mudança" e "o cache do canal já reflecte o novo valor" em todos os clientes. Na pior janela (alguém rola dados no instante seguinte a ligar o interruptor, antes do próprio cache local terminar de revalidar), um cliente pode decidir com o valor anterior por uma rolagem. Impacto baixo (afecta no máximo uma rolagem, não a autoridade do resultado) e provavelmente aceitável, mas `design.md`/`tasks.md` não o nomeiam explicitamente como trade-off aceite, diferente do cuidado já tomado com outros riscos desta change. Recomenda-se acrescentar uma linha em `Risks / Trade-offs` reconhecendo-o, mesmo que a mitigação seja "aceite".
- Manutenibilidade: alto reaproveitamento de padrões existentes (D1-D5 inteiros são "faça como X já faz"), o que é positivo para uma equipa pequena — baixa superfície de conceitos novos.

## 4. Documentação e decisões (ADRs)

Veredito: OK

- D1-D5 seguem o mesmo padrão de decisão-com-precedente-citado já usado em A/B/C — cada decisão aponta ao ficheiro:linha real que a justifica, não apenas à intenção.
- Non-Goals explícitos (permissão granular não criada; Dados/Voz não afectados) evitam a leitura errada de que isto poderia evoluir para permissões por cargo sem decisão nova.

## 5. Ponte entre produto e técnico

Veredito: OK

- O pedido de produto ("gestor decide se o canal de Texto mostra a animação, para não spamar quem conversa") foi traduzido directamente na decisão técnica mais barata disponível no código existente, sem over-engineering (sem permissão nova, sem painel novo, sem evento novo). A distinção Texto-vs-Dados que o utilizador deu ("canais de Dados não têm esse problema") está reflectida fielmente, não generalizada para além do que foi pedido.

## Bloqueantes antes de implementar

- Nenhum. A ressalva da dimensão 3 (consistência eventual do cache ao decidir o overlay) é uma lacuna de documentação de risco, não uma falha de desenho — recomenda-se registá-la em `Risks / Trade-offs`, mas não bloqueia a implementação.
