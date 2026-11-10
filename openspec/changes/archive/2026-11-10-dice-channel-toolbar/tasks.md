# Tasks

## 1. Backend: preferência por conta

- [x] 1.1 Criar migração após a última existente com tabela `account_dice_toolbar` (`account_id` PK FK `account`, `visible_sides` TEXT NOT NULL, `updated_at` TEXT NOT NULL) conforme Decisão D2 de `design.md`. Verificar: migração aplica em SQLite limpa e em DB com contas existentes.
- [x] 1.2 Implementar `db` + domínio para ler/gravar a preferência; default em memória `[4,6,8,10,12,20,100]` quando não há linha; validar e normalizar o conjunto permitido no PUT. Verificar: testes unitários/contrato cobrem default, PUT válido, PUT com face inválida/`sides` duplicado → `400`.
- [x] 1.3 Expor `GET` e `PUT /api/auth/dice-toolbar` autenticados (Decisão D3), registados em `backend/src/api/auth/mod.rs` no `auth::router()` (mesmo padrão de `/auth/key-reminders`). Verificar: `cargo test` nos testes novos passa; pedido sem sessão é recusado.

## 2. Frontend: API e toolbar

- [x] 2.1 Adicionar cliente em `frontend/src/api/endpoints/` para GET/PUT da preferência e tipos em `types.ts`. Verificar: `tsc` / build do frontend sem erro de tipos.
- [x] 2.2 Refactor mínimo de `DiceComposer` para notação controlável a partir do exterior (props de notação/`onNotationChange` ou sinal partilhado no wrapper do rodapé Dados — Decisão D5), sem mudar o submit nem o popover de Texto. Verificar: edição manual da notação continua a funcionar; `tsc` passa.
- [x] 2.3 Criar `DiceToolbar` (barra + checklist das 7 faces) e montá-lo só no ramo Dados de `ChannelPage` junto ao `DiceComposer` (wrapper/fragmento no `Match` de Dados). Verificar: canal Dados mostra barra; canal Texto / popover não.
- [x] 2.4 Carregar a checklist no mount; ao alterar a checklist, PUT imediato (ou debounce curto) e actualizar a barra. Verificar: recarregar a app reaplica as faces gravadas; array vazio deixa só o formulário.
- [x] 2.5 Clique esquerdo aumenta `count` (máx. 20), direito diminui (mín. 1, sem menu de contexto); face clicada torna-se activa e sincroniza a notação do `DiceComposer` (`NdM`) via a API da Tarefa 2.2, preservando modificador/rótulo. Em `pointer: coarse`, expor controlos ± equivalentes. Verificar manualmente os cenários do spec (aumentar, mínimo 1, um só tipo por rolagem).
- [x] 2.6 Compactar o layout do `DiceComposer` / CSS do rodapé Dados para encaixar formulário + barra (Decisão D4). Verificar visualmente: ambos cabem sem cortar controlos nem empurrar a timeline de forma desproporcional; tokens do design system.
- [x] 2.7 Localizar strings novas (barra, checklist, aria-labels) em pt-BR e en. Verificar: nenhuma string fixa no componente; i18n existente passa.

## 3. Integração e não-regressão

- [x] 3.1 Confirmar que lançar a partir do formulário (com notação vinda da barra) continua a usar `POST /channels/{id}/dice` e produz cartão/overlay como em `chat-dice-rolling`. Verificar: uma rolagem `2d20+1` via barra+modificador publica o resultado correcto.
- [x] 3.2 Confirmar que Texto (composer + popover) e limites de notação não mudaram. Verificar: `cargo test` relevante + smoke manual no popover de Texto.
