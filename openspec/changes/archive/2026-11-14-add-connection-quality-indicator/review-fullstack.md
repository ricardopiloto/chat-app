# Review — Desenvolvedor Fullstack

**Change:** add-connection-quality-indicator
**Data:** 2026-11-14
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend

Veredito: N/A

- Confirmado: nenhuma rota, evento WS ou tabela tocada.

## 2. Desenvolvimento do frontend

Veredito: OK

- Confirmei o padrão de chip existente em `tiles.tsx` (chips "speaking"/"muted"/"you", todos `<span class="call-chip X">{t("call.y")}</span>` simples, sem `title`/tooltip hoje) — o novo chip de qualidade encaixa directamente nesse padrão de marcação.
- Nota menor (não bloqueante): `design.md` (D2) pede um `title`/tooltip explicando a estimativa — isso é uma pequena extensão ao padrão actual dos chips vizinhos, que não usam tooltip. Não é um problema, só vale a tarefa 2.1 deixar claro que introduz esse atributo pela primeira vez neste conjunto de chips, para quem revisar o código não estranhar a inconsistência com os chips irmãos.
- Sem impacto de responsividade específico além do já coberto (Risks: omitir em strip/mini).

## 3. Deploy e operação

Veredito: N/A

- Sem infraestrutura nova.

## 4. Qualidade de código

Veredito: Atenção

- **Achado:** confirmei que o projeto já tem um verificador automático de paridade de chaves de i18n (`frontend/scripts/verify-i18n-keys.mjs`, que corri e confirma hoje "all passed" com `en`/`pt-BR` em 1471 chaves cada). Esta change precisa de pelo menos 5 chaves novas (Excellent/Good/Poor/Lost/Unknown) mais possivelmente uma de tooltip, nas duas locales. `tasks.md` não menciona correr `npm run verify:i18n-keys` (ou `verify:i18n`) depois de adicionar as novas chaves, apesar de ser exactamente o tipo de verificação barata e já existente que este projeto usa para não deixar uma locale incompleta. Recomendo adicionar isso à tarefa 2.1 ou 3.1.
- Testes: tarefa 1.2 já pede "verify with simulated quality events and a real reconnect" — correcto exigir ambos, já que a lógica de reset é pura e testável isoladamente (no estilo `verify-sound.mjs`/`arrivals()` já usado noutra change desta leva), mas a tarefa não obriga explicitamente a um teste determinístico, só à verificação manual/simulada. Não é bloqueante — ao contrário da mudança de som, aqui a superfície é pequena (um `createSignal` com reset), então a verificação descrita já é proporcional; menciono apenas como opção, não como achado obrigatório.
- Organização: cabe nos ficheiros já previstos.

## 5. Execução das decisões arquiteturais

Veredito: OK

- `tasks.md` segue D1/D2 fielmente, incluindo a salvaguarda do popout (tarefa 2.2) que o Arquiteto já observou ser de risco baixo na prática mas correcta de manter como verificação.

## Bloqueantes antes de implementar

- nenhum

## Limitações técnicas a reportar ao Arquiteto

- nenhuma
