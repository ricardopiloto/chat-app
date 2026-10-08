# Review — Arquiteto de Soluções

**Change:** key-handoff-offline
**Data:** 2026-10-08
**Veredito geral:** Aprovado com ressalvas

## 1. Definição da arquitetura técnica
Veredito: Atenção
- A stack é coerente: reutiliza `crypto_box_seal`, o envelope existente e o hub WS; sem dependência nova. Nenhum componente novo além de uma coluna anulável em `invite`.
- `design.md` D1/D2/D3 descrevem o fluxo, mas há inconsistência interna: D2 diz que `key_seed` é devolvido "após aceitação autenticada em `GET /invites/{code}`", D3 diz que a **aceitação** devolve `key_seed` e `seed_token`. Fixar um só ponto de entrega (recomendo a resposta do `accept`, que já é autenticada e atómica com `try_increment_use`).
- O `seed_token` (D3) é complexidade evitável. A elegibilidade pode ser derivada do estado já existente: membro `pending` com `joined_via_invite_id` apontando para um convite com semente e sem envelope próprio. Evita nova tabela/segredo de uso único. Se a semente for apagada na revogação (D4), o convidado legítimo que ainda não publicou o envelope perde o acesso: decidir se a revogação apaga a semente só para novas aceitações (recomendado) ou também para quem já aceitou.
- Escala: a change não declara números. Os limites existentes (10 usos por convite) já delimitam o pior caso; registar isso em D6 e o teto de concorrência escolhido (4) como parâmetro, com o cenário de centenas de pendentes já coberto por `backend/tests/scale.rs` do `password-recovery`.

## 2. Integração com a infraestrutura existente
Veredito: OK
- Sem processo, porta ou serviço novo; o fragmento `#` nunca chega ao Nginx nem aos logs de acesso, o que combina com o padrão de mesma origem de `deploy-producao.md`.
- Dados: uma coluna anulável no SQLite existente, migração aditiva, sem impacto no backup além de o blob selado entrar nele (inócuo sem a chave efémera).
- Ponto a verificar no Tauri/SPA: o handler de deep link e o roteador precisam preservar o fragmento até `Invite.tsx` ler. Falta tarefa para isso.

## 3. Qualidade de arquitetura e trade-offs
Veredito: Atenção
- E2EE preservado: o backend guarda só ciphertext e nunca vê a chave efémera. O novo risco é o link ser segredo de capacidade (até 10 usos). D4 mitiga com expiração, revogação e aviso; está bem argumentado.
- Falta mitigação do lado do cliente: depois de ler o fragmento, `Invite.tsx` deve removê-lo com `history.replaceState` e definir `Referrer-Policy: no-referrer` na página para não vazar via histórico, extensões ou navegação. Adicionar como requisito e tarefa.
- Risco de envelope corrompido: o servidor não valida a `server_key`. Um convidado com semente adulterada fica `synced` com chave errada, e o código atual recusa sobrescrever envelope de membro `synced` (`key_envelopes.rs`, "cannot overwrite a synced key envelope"). Mitigar com uma verificação no cliente antes de publicar (decifrar uma mensagem existente do servidor, ou um valor de verificação da chave) e um caminho de reparação, ou aceitar explicitamente o risco no design.
- `include_history` continua apenas uma política do servidor: com a chave única por servidor, quem recebe a semente decifra todo o histórico que o servidor lhe entregar. Já é assim no handoff online; registar em D4 para não parecer garantia criptográfica.
- Manutenibilidade: simples o suficiente para uma pessoa; D6 reduz a tempestade de `POST`.

## 4. Documentação e decisões (ADRs)
Veredito: Atenção
- Estilo D1…D7 respeitado, com alternativas em D1 e D3. D4–D7 não listam alternativas rejeitadas (ex.: D6 vs. coordenação no servidor; D7 vs. notificação por e-mail).
- Diagrama de sequência (criador → backend → convidado, com o fragmento fora da rede) justifica-se pela natureza de segurança do fluxo; hoje não existe.
- `backend-change-policy.md` exige entrada na tabela de registo e "tarefa própria" com o requisito do frontend que a motiva. `tasks.md` não tem essa tarefa. Adicionar.

## 5. Ponte entre produto e técnico
Veredito: Atenção
- O "Why" cobre convite e recuperação, mas a solução só resolve o **convite**. A recuperação por código do operador (Fase 1 do `password-recovery`) continua dependente de membro online; só a chave de recuperação (Fase 2) a resolve. O `proposal.md` deve dizer isso explicitamente para não prometer a recuperação offline.
- Sem funcionalidades específicas de RPG envolvidas: N/A.

## Bloqueantes antes de implementar
- nenhum (resolver as inconsistências D2/D3 e decidir o `seed_token` antes de começar a tarefa 2.3)
