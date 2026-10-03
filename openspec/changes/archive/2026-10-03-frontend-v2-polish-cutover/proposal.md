# Proposal

## Why

Com as Fases 0-4 entregues, a `frontend-v2` tem paridade funcional completa com a v1, mas com duas dívidas conscientes acumuladas ao longo de todas as fases anteriores (modo claro e responsividade mobile, ambos resolvidos "de extrapolação" fase a fase, sem nenhum mockup de referência completo) e uma decisão ainda não executada: substituir a v1 em produção. Esta é a **Fase 6 (última) de 6** da reescrita faseada (`docs/v2/TR-frontend-v2.md`) — fecha essas dívidas e executa o corte.

## What Changes

- Auditoria e correcção de modo claro em 100% das telas de produto (não só o shell da Fase 1) — cada fase anterior implementou modo claro por extrapolação dos tokens, sem comparação com um mockup; esta fase revê o conjunto completo.
- Auditoria e correcção de responsividade mobile em 100% das telas de produto — idem, cada fase anterior resolveu isto localmente sem uma auditoria de conjunto.
- Paridade de i18n completa: todos os textos de todas as fases anteriores cobertos nos catálogos pt-BR e en (cada fase anterior só populou o necessário para as suas próprias telas).
- Decisão e execução do corte de produção: apontar o Nginx para `frontend-v2/dist` em vez de `frontend/dist`, ou uma estratégia de routing intermédia, conforme decidido nesta fase.
- Critério de aceite formal de "pronta para substituir a v1": **100% das funcionalidades de `docs/v2/parity-checklist.md` verificadas**, **100% das telas mapeadas a mockup classificadas Fiel** (`docs/v2/AUDIT-fidelity.md`), **independência da v1 comprovada** por medição de sobreposição, e checklist final contra `docs/design-system/stitch-prompt.md` §3.
- Reconciliação do backend: lista final das alterações de backend feitas durante a reescrita (esperada: nenhuma ou só aditivas), confirmadas retrocompatíveis com o rollback.
- **Fora desta fase**: qualquer funcionalidade nova — esta fase é só polimento, verificação de paridade/fidelidade e corte, não introduz comportamento novo.

## Capabilities

### New Capabilities
- `frontend-v2/theming-and-responsiveness`: modo claro e responsividade mobile como requisito transversal de aceite, cobrindo todas as capabilities das Fases 1-4.
- `frontend-v2/production-cutover`: critério de corte de produção e configuração de deploy.

### Modified Capabilities
_Nenhuma — todas as fases anteriores ainda não foram arquivadas. Esta fase adiciona requisitos transversais de qualidade e o corte de produção; não modifica os requisitos funcionais já especificados nas Fases 0-4 (esses continuam válidos tal como especificados)._

## Impact

- **Código**: revisão/correcção em `frontend-v2/` (todas as áreas das Fases 1-4), sem código novo de funcionalidade; telas que não alcancem **Fiel** voltam à fase de origem.
- **Infra/deploy**: `infra/` e a configuração Nginx de `docs/deploy-producao.md` passam a apontar para `frontend-v2/dist`; `frontend/` pode ser arquivada ou removida após o corte, conforme decisão registada em design.md.
- **Documentação**: `README.md`, `docs/operar-instancia.md`, `docs/deploy-producao.md`, `CHANGELOG.md` actualizados para reflectir a v2 como a versão em produção.
- **Depende de**: todas as fases anteriores (`frontend-v2-foundation`, `frontend-v2-auth-shell`, `frontend-v2-server-admin`, `frontend-v2-text-chat`, `frontend-v2-voice-video`) entregues e aceites.

## Revisão: reescrita do zero e fidelidade visual (2026-10-01)

Esta revisão resulta de `docs/v2/AUDIT-fidelity.md`, que concluiu que o frontend v2 entregue até aqui adoptou os tokens do design mas **não** a interface desenhada, e que grande parte do código descende da v1 (59% em média; 87–100% na voz/vídeo). Passam a valer quatro regras, transversais a todas as fases:

1. **Independência do frontend v1.** Nada de `frontend/` é reaproveitado: nenhum ficheiro, componente, folha de estilo, hook, estrutura de pastas nem decisão de implementação é copiado, adaptado ou usado como modelo, e `frontend/` não é lido para implementar. O que permanece da v1 é **só o backend** (contratos REST/WS, regras de acesso e modelo de dados), nos pontos em que é necessário e reaproveitável sem alteração. A aplicação v1 em execução pode ser usada como caixa-preta para observar comportamento de produto. Formatos criptográficos persistidos (cofre de identidade, envelope de chave de servidor, chave de canal, cifra de mensagem/anexo) são **contratos de dados** com contas existentes: são especificados em `docs/v2/contracts/` com vectores de teste (ver `frontend-v2-foundation`) e a v2 implementa a partir dessa especificação.
2. **Fidelidade visual por tela.** Uma tela só é dada como concluída quando comparada lado a lado com o `screen.png` do mockup correspondente, cumpre a lista de elementos obrigatórios do design deste change e obtém a classificação **Fiel** na escala de `docs/v2/AUDIT-fidelity.md` §2. A comparação fica registada em `verification.md`. Elementos desenhados nos mockups mas fora de escopo (AUDIT §6) não contam como em falta.

3. **Paridade funcional total.** Todas as funcionalidades que a aplicação tem hoje continuam a funcionar na v2, sem exceção. O inventário de referência é `docs/design-system/stitch-prompt.md` §3 mais o comportamento observável da v1 em execução, consolidado em `docs/v2/parity-checklist.md` (ver `frontend-v2-foundation`). Cada change verifica as funcionalidades da sua área contra essa checklist; uma funcionalidade só pode ser omitida se estiver explicitamente excluída do escopo (`docs/v2/TR-frontend-v2.md` §4.2 e §7). Renovar a interface nunca é motivo para retirar uma funcionalidade existente.
4. **Backend só muda por necessidade do frontend.** O backend da v1 é reaproveitado como está. Uma alteração de backend só é admitida quando um requisito do frontend v2 a exige e não há alternativa no cliente; nesse caso é uma tarefa explícita neste change, com o contrato actualizado em `docs/v2/contracts/`, compatível com a v1 enquanto o rollback for possível (alterações aditivas) e verificada com os testes de backend existentes (`cargo test`).

**Consequência para o estado actual:** o código existente em `frontend-v2/` para esta fase é descartável e será substituído; as tarefas foram reabertas e as `verification.md` anteriores ficam como histórico superado.
