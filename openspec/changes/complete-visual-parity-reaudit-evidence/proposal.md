# Proposal

## Why

A mudança arquivada `visual-parity-full-reaudit` marcou a reauditoria completa como concluída, mas classificou 15 telas em escopo como **Fiel** sem nova captura, omitiu as tabelas por tela e não verificou uma chamada em composição. O registo atual não sustenta o aceite visual que declara.

## What Changes

- Completar a comparação da aplicação atual com todas as telas em escopo de `docs/v2/AUDIT-fidelity.md` §4, incluindo os estados de desbloqueio e as superfícies de voz que ficaram sem captura.
- Guardar, para cada tela e estado exigido, captura na largura do mockup, referência ao `screen.png`, tabela `Elemento | Mockup | v2 | Observação` e classificação baseada nessa evidência.
- Corrigir derivas confirmadas com os tokens e ícones existentes; repetir a comparação após cada correção. Registrar explicitamente qualquer bloqueio de ambiente ou classificação inferior a **Fiel**, sem declarar a tela concluída.
- Verificar manualmente pesquisa, alternador de tema, painel do utilizador e composição de voz após as correções visuais.
- Publicar um novo registo de verificação, mantendo a documentação da reauditoria arquivada como histórico.

## Capabilities

### New Capabilities

- Nenhuma.

### Modified Capabilities

- `frontend-v2/visual-fidelity`: explicitar que uma reauditoria só pode classificar uma tela como **Fiel** quando há evidência atual para cada estado exigido, com tabela por tela; ausência de captura ou impedimento de execução não equivale a aceite.

## Impact

- Capturas e `verification.md` em `docs/v2/fidelity/complete-visual-parity-reaudit-evidence/`; eventuais correções visuais no `frontend/src` apenas onde a comparação demonstrar deriva.
- Ambiente descartável para UI e chamada em curso (incluindo LiveKit ou recurso equivalente de teste); sem mudança de API ou de comportamento funcional prevista.
- A mudança em curso `user-panel-identity-parity` altera o mesmo painel: a comparação deve usar o estado de código mais recente e evitar refazer a correção concorrente sem verificar o mockup correspondente.
