# Tasks

## 1. Correcção dos três exemplos já confirmados

- [x] 1.1 `frontend/src/shell/Topbar.tsx:37`: `rounded-full` → `rounded` (8px). Verificar contra `docs/v2/mesa_shell_da_aplica_o_chat_de_texto/screen.png`, botão "Pesquisar ou pular...".
- [x] 1.2 `frontend/src/chat.css:201` (`.ch-search`): o painel no mockup é `rounded-2xl` (16px na escala por omissão; o config do mockup não redefine `2xl`). Token da app: `var(--radius-lg)`. O `var(--radius)` de 8px da redacção da tarefa é o raio do botão da topbar, não do painel.
- [x] 1.3 `frontend/src/shell/ThemeSwitch.tsx:15`: contentor, `rounded-full` → `rounded` (8px). `ThemeSwitch.tsx:25`: botões internos, `rounded-full` → `rounded-sm` (4px).
- [x] 1.4 `frontend/src/voice/CompositionView.tsx:31-32`: adicionar o ícone `airline_seat_recline_extra` antes do rótulo `{t("call.bench")}` no `<footer class="call-bench">`, com a mesma classe de tamanho/cor do mockup (`text-[16px]`, tom `outline`/`on-surface-variant`). Verificar contra `docs/v2/mesa_palco_de_voz_v_deo_composi_o_de_c_meras/screen.png`.

## 2. Cor do nome de utilizador (requer comparação antes de corrigir)

- [x] 2.1 Localizar o mockup e o estado exactos onde a cor do nome de utilizador, no painel fixo do fundo da sidebar, difere do actual `frontend/src/shell/UserPanel.tsx:22`. Capturar os dois lado a lado (mesmo tema escuro, mesma largura). Registar o valor exacto do mockup (token de cor, não `px`/hex solto).
- [x] 2.2 Corrigir `UserPanel.tsx:22` para o token de cor confirmado na Tarefa 2.1. Verificar visualmente contra a captura da Tarefa 2.1.

## 3. Reauditoria completa, tela a tela

- [x] 3.1 Seguir `docs/v2/fidelity-protocol.md` §§1-3 para cada tela já listada em `docs/v2/AUDIT-fidelity.md` §4 (mesmo conjunto de ~26-31 entradas) — estado/tema/largura iguais ao mockup, captura, tabela `Elemento|Mockup|v2|Observação`, cobrindo tokens (raio, espaçamento, cor, tipografia), ícones presentes/ausentes e estrutura.
- [x] 3.2 Para cada deriva encontrada, corrigir usando um token/ícone já existente (nunca um valor ad-hoc nem uma biblioteca de ícone fora da já decidida em `frontend-icons-lucide-svg`) — se nada corresponder ao mockup, registar como achado em vez de inventar.
- [x] 3.3 Classificar cada tela (Fiel/Parcial/Genérica, `fidelity-protocol.md` §4) e guardar capturas + tabelas em `docs/v2/fidelity/visual-parity-full-reaudit/`.

## 4. Registo final

- [x] 4.1 Escrever `docs/v2/fidelity/visual-parity-full-reaudit/verification.md` (mesma estrutura de `AUDIT-fidelity.md` §9) com a tabela `Tela|Mockup|Captura|Classificação|Data` para todas as telas auditadas — torna-se o registo de fidelidade mais recente, sem apagar `AUDIT-fidelity.md` (fica como histórico).
- [x] 4.2 Confirmar que nenhuma correcção desta change altera comportamento (só visual) — percorrer manualmente pesquisa, alternador de tema, painel de utilizador e o modo de composição de voz para confirmar que continuam a funcionar como antes.
