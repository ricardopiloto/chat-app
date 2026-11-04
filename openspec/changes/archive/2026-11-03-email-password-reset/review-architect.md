# Review — Arquiteto de Soluções

**Change:** email-password-reset
**Data:** 2026-11-03
**Veredito geral:** Bloqueado

Contexto lido: artefatos da change, `docs/parecer-recuperacao-senha.md`, `openspec/specs/auth/password-recovery/spec.md`, `backend/src/api/auth/{recovery,recovery_key}.rs`, `frontend/src/crypto/keyHandoff.ts`, `frontend/src/pages/Recover.tsx`, e as artefatos de `email-registration`.

## 1. Definição da arquitetura técnica
Veredito: Atenção
- **Reuso correto das primitivas.** `finish_credential_change` e `apply_identity_replacement` já são a base dos dois resets existentes; a change só acrescenta uma forma de autorização (design.md, Decisão 2). Coerente com a stack.
- **Papel do token no caminho com chave está indefinido.** design.md diz que o token «só é exigido adicionalmente como prova de posse do e-mail», mas o fluxo `key/challenge → start → redeem` é público por handle e não recebe token; tasks 2.3 só prova que o token *não* basta. Ou o token é exigido (então `key/start`/`redeem` ganham campo, o que altera um endpoint existente e a spec `password-recovery`), ou não é (então o link é só conveniência que pré-preenche o handle). Decidir e escrever.
- **Carga:** igual à do registro; sem meta declarada. Aceitável.

## 2. Integração com a infraestrutura existente
Veredito: OK
- Reaproveita `EmailSender`, `RealClientIp`, `TRUSTED_PROXY`, baldes e `PUBLIC_BASE_URL` de `email-registration`; nenhuma porta ou processo novo. Migração aditiva. Backup/migração cobertos pelo SQLite existente.
- Depende de que `email-registration` esteja ativa: a ordem de implementação deve ficar explícita em tasks/proposal (hoje só o Impact diz «depende»).

## 3. Qualidade de arquitetura e trade-offs
Veredito: **Bloqueante**
- **Reset por e-mail sem chave entrega as chaves de servidor ao dono da caixa de e-mail.** `apply_identity_replacement` marca as participações como `pending` e envia `key_handoff.requested` aos membros sincronizados; `handleHandoffEvent` (`frontend/src/crypto/keyHandoff.ts`) responde **automaticamente** com `sendEnvelope` para a nova chave pública. Logo, quem controla o e-mail (SIM-swap de caixa, e-mail comprometido, alias reaproveitado) cria uma identidade nova e recebe, sem aprovação humana, a chave de cada servidor da vítima. No reset por código do operador há um humano a validar quem pede; aqui desaparece, e `docs/parecer-recuperacao-senha.md` posiciona o código do operador como contingência justamente por isso. A mitigação proposta («validade curta, aviso, revogação de sessões») não toca neste ponto: o roubo de chaves ocorre em segundos pelos outros clientes online. É preciso uma contenção explícita, por exemplo: (a) o reset por e-mail sem chave **não dispara handoff automático** e deixa a conta em «aguardando aprovação» de um membro ou do dono do servidor; ou (b) período de espera (24–72 h) com e-mail de cancelamento antes de a identidade ser substituída; ou (c) dispensar o caminho sem chave e manter só o código do operador. A decisão altera spec e design.
- **Enumeração e abuso:** a resposta uniforme, o limite por IP/e-mail e o balde por handle estão bem pensados. O endpoint `verify` devolve `handle` e `has_recovery_key` a quem tiver o token, o que é aceitável (o token é a posse da caixa).
- **Canal lateral do e-mail de aviso:** o aviso pós-reset vai para o e-mail da conta, que é o mesmo vetor do ataque; não substitui a contenção acima. Considerar também aviso no momento do **pedido** do link (não só do reset concluído).
- **Segurança do token:** fragmento, `POST`, hash, uso único e 30 min seguem o padrão de `email-registration`. OK.

## 4. Documentação e decisões (ADRs)
Veredito: Atenção
- design.md rejeita uma alternativa (link dispensando a chave) mas não registra alternativas para: autorização por e-mail vs. só código do operador, handoff automático vs. aprovado, e validade de 30 min.
- Falta diagrama de sequência dos dois destinos do link (com chave / sem chave); a complexidade o justifica.
- Atualizar `docs/parecer-recuperacao-senha.md` (que define A e B) com o novo caminho e a justificativa de segurança; hoje só a task 4.1 menciona o arquivo.

## 5. Ponte entre produto e técnico
Veredito: Atenção
- O pedido («e-mail → link para restaurar, associado à chave») está traduzido, mas o termo «associado à chave» ficou ambíguo (ver §1). Alinhar com o produto: o link **leva** ao fluxo com chave, e a chave continua a ser o único segredo que preserva o histórico.
- Contas antigas sem e-mail (todas, até existir a change de «e-mail em contas existentes») não ganham nada; dizer isso na proposta como limitação relevante, já que a maioria das contas atuais fica fora.

## Bloqueantes antes de implementar
1. Definir a contenção do reset por e-mail **sem chave** para impedir a entrega automática das chaves de servidor ao dono da caixa de e-mail (aprovação humana, período de espera, ou remover o caminho), e refletir na spec e nas tasks.
2. Definir se o token é exigido no fluxo com chave (alterando `key/*`) ou se o link é só conveniência, e corrigir design, spec e tasks 2.3.
