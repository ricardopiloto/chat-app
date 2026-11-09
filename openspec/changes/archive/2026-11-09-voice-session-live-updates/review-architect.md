# Review — Arquiteto de Soluções

**Change:** voice-session-live-updates
**Data:** 2026-11-07 (revisão do código implementado)
**Veredito geral:** Aprovado com ressalvas

## 1. Definição da arquitetura técnica
Veredito: OK

- Implementação confirma e amplia o achado da revisão da proposta: não só `put_member_role` e `delete_member` (`backend/src/api/roles.rs`) ficaram sem broadcast, como mais cinco rotas de cargo (`create_role`, `patch_role`, `delete_role`, `put_role_positions`, `set_role_members`) e duas de canal (`patch_channel` visibilidade, `put_acl`) tinham a mesma lacuna. Todas corrigidas reaproveitando `state.ws.send_to_server_members`, o mesmo padrão já usado em `channel_roles.rs`. Nenhum mecanismo novo foi introduzido — é extensão directa do padrão existente.
- `delete_member` usa correctamente `send_to_accounts(&[member_id], ...)` **além** de `send_to_server_members`, porque a membership já foi apagada quando o broadcast corre — sem isto, a própria pessoa removida nunca saberia. Detalhe de concorrência bem resolvido.

## 2. Integração com a infraestrutura existente
Veredito: N/A

Sem infraestrutura nova.

## 3. Qualidade de arquitetura e trade-offs
Veredito: OK

- D2 ("actualizar os controlos da chamada activa") está implementado com protecção de concorrência genuína: `refreshAccess()` em `callSession.tsx` introduz `accessGeneration`, verificado contra o `epoch` da própria chamada e o `channel()?.id`, antes de aplicar qualquer resultado — protege contra exactamente o cenário que `design.md` (Risks) temia (eventos fora de ordem/respostas antigas).
- Quando a permissão é revogada, `refreshAccess()` chama `setMicrophoneEnabled(false)`/`setCameraEnabled(false)`/`setScreenShareEnabled(false)` directamente no `localParticipant` do LiveKit — a restrição chega à ligação real, não só ao estado local da UI, exactamente o que D2 exigia.
- `member.removed` dirigido à própria conta activa termina a chamada (`lost("kicked")`), reaproveitando o mesmo mecanismo já usado para `channel.deleted`/`server.deleted` — consistente.
- Reconexão: `CallProvider` ganhou um `resync` opcional ligado a `shell.resync` em `AppShell.tsx`, disparando `refreshAccess()` depois de cada reconexão — resolve a reconciliação de D1 também para o acesso efectivo, não só para a ocupação.
- **Achado novo, não bloqueante**: o `case "member.removed"` em `state.tsx` invalida `members`/`roles`/`channels` do servidor, mas não invalida `queryKeys.servers` nem navega a própria pessoa removida para fora, ao contrário do padrão já usado em `case "server.deleted"` (`navigate("/")`). Se a pessoa removida estiver a navegar o servidor fora de uma chamada de voz, a lista de servidores na barra lateral não actualiza nem ela é tirada da página — só o caminho "estou numa chamada activa" (`callSession.tsx`) está coberto. É um efeito colateral fora do escopo original do relato (que era sobre chamada de voz), mas vale uma tarefa de seguimento.

## 4. Documentação e decisões (ADRs)
Veredito: OK

- `tasks.md` 1.1 tem uma nota precisa e honesta sobre o que foi reproduzido (probe de dois clientes, API+WS) e o que continua pendente (reconexão com perda real de evento). `implementation-summary` (resumo do Codex) documenta os quatro nomes de evento escolhidos.

## 5. Ponte entre produto e técnico
Veredito: OK

- Os dois sintomas do relato original (lista de voz desactualizada; permissão editada não reflecte) estão ambos endereçados ponta a ponta — não só o aviso, mas a aplicação real da restrição na ligação de chamada activa.

## Bloqueantes antes de implementar
- Nenhum. O achado da secção 3 (navegação da pessoa removida fora de uma chamada) é uma recomendação de seguimento, não um bloqueio desta change.
