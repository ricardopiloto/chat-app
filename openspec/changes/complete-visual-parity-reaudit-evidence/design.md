# Design

## Context

Ver `proposal.md` — Why. O conjunto de referência é `docs/v2/AUDIT-fidelity.md` §4, com 31 entradas: 17 e 18 fora de escopo e as demais conforme o subconjunto aplicável. O protocolo existente é `docs/v2/fidelity-protocol.md`; a reauditoria arquivada deixou 15 entradas em escopo sem nova captura, não produziu tabelas por tela e não entrou numa chamada em curso. O requisito base está em `openspec/specs/frontend-v2/visual-fidelity/spec.md`.

## Goals / Non-Goals

**Goals:**
- Produzir uma trilha verificável que relacione cada entrada em escopo, seus estados, capturas, tabela de elementos e classificação.
- Reavaliar também as telas que receberam captura em 2026-10-12, pois a ausência das tabelas impede confirmar sua classificação e o código pode mudar entre as duas passagens.
- Verificar interações afetadas pelas correções visuais, inclusive composição de voz durante uma chamada.

**Non-Goals:**
- Reabrir o escopo funcional de elementos excluídos por `AUDIT-fidelity.md` §6 ou das entradas 17 e 18.
- Alterar API, backend de produto, escala de tokens ou biblioteca de ícones por conveniência visual.
- Corrigir antecipadamente a faixa de identidade do utilizador já tratada em `user-panel-identity-parity`; esta auditoria compara o código efetivamente presente na sua execução.

## Decisions

### 1. Novo registo, histórico preservado

Criar `docs/v2/fidelity/complete-visual-parity-reaudit-evidence/verification.md` e capturas associadas. Não reescrever a evidência da change arquivada: o novo registo indica claramente a data, o commit ou estado de código auditado e substitui o anterior como referência corrente. Alternativa rejeitada: completar silenciosamente o relatório de 2026-10-12, o que confundiria evidência produzida em datas diferentes.

### 2. Matriz de cobertura antes das capturas

Derivar uma matriz das 31 entradas de `AUDIT-fidelity.md` §4 e das checklists de `design.md`/`verification.md` das fases arquivadas. Registrar estados exigidos antes de executar. No mínimo, distinguir login/registo, os três estados de desbloqueio, pesquisa/notificações, menu de conta/modal de saída, variantes de editor/grade/partilha e os estados de diálogos que têm telas próprias. A entrada 20 (Áudio e Vídeo) exige sua própria evidência; a captura da pré-entrada só pode valer se mostrar todos os elementos obrigatórios da entrada 20 e a tabela justificar a equivalência. Alternativa rejeitada: inferir cobertura pela contagem de arquivos PNG.

### 3. Mesma condição de comparação para cada estado

Usar tema escuro, pt-BR, zoom 100%, largura do `screen.png` e dados equivalentes. Registrar dimensões reais da captura e diferenças inevitáveis de conteúdo. Para voz, preparar backend descartável, LiveKit e duas contas/dispositivos de teste para obter palco, grade, partilha, editor e mini-player; uma pré-entrada não substitui chamada em curso. Comparar tokens, tipografia, ícones (posição/tamanho/estado) e estrutura. A forma Lucide versus Material Symbols segue a exceção da spec vigente.

### 4. Critério de saída honesto

Cada tela em escopo recebe `Fiel`, `Parcial`, `Genérica` ou `Não verificada` no registo corrente, com causa explícita para a última. Uma tela com deriva é corrigida com token/ícone existente e recapturada; se não houver correção válida no escopo, registrar a pendência e não concluir a tarefa de aceite. A tabela-resumo liga diretamente às capturas e às tabelas por tela. As entradas fora de escopo mantêm essa classificação.

## Risks / Trade-offs

- [LiveKit ou permissões de mídia indisponíveis] → preparar o ambiente de teste antes de classificar as telas de voz; se a execução falhar, registrar `Não verificada` e deixar o aceite pendente.
- [Mudanças concorrentes de UI alteram as capturas durante a auditoria] → fixar o estado de código auditado e refazer a comparação da superfície afetada após integrar mudanças relevantes, especialmente `user-panel-identity-parity`.
- [Um mockup contém dados ou elementos excluídos] → usar as exclusões já documentadas; registrar a exclusão na tabela da tela, sem inventar dados nem novos requisitos funcionais.

## Migration Plan

Adicionar apenas documentação e correções visuais comprovadas. O registo anterior permanece como histórico; o novo passa a ser a referência corrente quando todas as entradas em escopo tiverem evidência suficiente. Se uma tela permanecer não verificada ou abaixo de **Fiel**, manter a mudança aberta e registrar a pendência.
