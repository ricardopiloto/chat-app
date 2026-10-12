# Design

## Context

Ver `proposal.md` — Why. Pontos de código que ancoram os quatro exemplos já confirmados:

- **Colisão de nomes entre escalas de raio** (herdado da versão anterior deste design, continua válido): `frontend/tailwind.config.ts:14` (`rounded-lg`=16px na app) vs. o `tailwind.config` embutido em `docs/v2/mesa_shell_da_aplica_o_chat_de_texto/code.html` (`rounded-lg`=8px no mockup) — mesma classe, valores diferentes. Todas as correcções desta change são especificadas por **valor**, nunca por nome de classe copiado do mockup.
- `frontend/src/shell/Topbar.tsx:37` (botão de pesquisa, `rounded-full`) e `frontend/src/chat.css:201` (`.ch-search`, `--radius-xl`=24px) vs. o botão equivalente do mockup (`rounded-lg`=8px nesse ficheiro).
- `frontend/src/shell/ThemeSwitch.tsx:15,25` (contentor e botões, `rounded-full` em ambos) vs. o alternador equivalente do mockup (`rounded-lg`=8px no contentor, `rounded`=4px nos botões).
- `frontend/src/shell/UserPanel.tsx:22` (nome do utilizador, sem classe de cor explícita) — reportado com cor diferente da proposta; a comparação exacta (qual mockup, qual estado, qual valor) fica para a Tarefa 2, não adivinhada aqui.
- `frontend/src/voice/CompositionView.tsx:31-32` (indicador "No banco", só texto) vs. `docs/v2/mesa_palco_de_voz_v_deo_composi_o_de_c_meras/code.html:145-147` (ícone `airline_seat_recline_extra` antes do rótulo).
- `docs/v2/fidelity-protocol.md` §§1-4 e `docs/v2/AUDIT-fidelity.md` §§1-9: metodologia e histórico de classificação já estabelecidos — a reaplicar por inteiro a todas as telas já mapeadas, não a reinventar nem a encolher para um subconjunto.

## Goals / Non-Goals

**Goals:**
- Os quatro exemplos já reportados corrigidos (três já com correcção exacta conhecida; a cor do nome de utilizador com a comparação feita explicitamente antes de decidir o valor).
- Reaplicação de `fidelity-protocol.md` a **todas** as telas já mapeadas em `AUDIT-fidelity.md` (tokens, ícones, estrutura — tudo no mesmo passo, não só raio/espaçamento).
- Um registo final novo (`docs/v2/fidelity/visual-parity-full-reaudit/verification.md`) que substitui `AUDIT-fidelity.md` §9 como a referência mais recente.

**Non-Goals:**
- Cobrir telas fora do conjunto já mapeado em `AUDIT-fidelity.md` (ex. telas de changes ainda não arquivadas desta sessão, como o popout de chamada ou o novo tipo de canal de Dados) — essas ficam para a sua própria verificação de fidelidade, dentro das suas próprias changes.
- Mudar a escala de tokens em si, ou a biblioteca de ícones em si (já decidida em `frontend-icons-lucide-svg`) — esta auditoria usa o que já existe/está decidido, não inventa nada novo.
- Garantir responsividade mobile ou modo claro (já cobertos por `frontend-v2/theming-and-responsiveness`, fora do escopo desta auditoria especificamente de tema escuro/desktop).

## Decisions

### 1. Âmbito: todas as telas já mapeadas, não um subconjunto por categoria

Em vez de seleccionar só "superfícies de alto tráfego visual" (versão anterior deste design), esta change percorre a mesma lista de telas de `AUDIT-fidelity.md` §4 por inteiro — porque os quatro exemplos já confirmados vêm de pelo menos três áreas diferentes da aplicação (pesquisa/tema no shell, nome de utilizador no painel fixo, ícone no palco de composição de voz), o que já invalida a hipótese de que a deriva está concentrada num subconjunto previsível.

### 2. Cor do nome de utilizador: comparar antes de corrigir, não assumir um valor

Ao contrário dos outros três exemplos (onde o mockup e o valor-alvo já estão confirmados por leitura de código), a Tarefa 2.1 exige encontrar o mockup e o estado exactos onde a cor esperada aparece, capturar lado a lado, e só então decidir a correcção — evitando repetir o erro da ronda anterior (corrigir por suposição em vez de por valor confirmado).

### 3. Reaproveitar `fidelity-protocol.md` por inteiro, não só a tabela

Mesma estrutura completa: estado/tema/largura iguais ao mockup, uma captura por tela, tabela `Elemento|Mockup|v2|Observação`, classificação Fiel/Parcial/Genérica, registo final — para as telas já mapeadas em `AUDIT-fidelity.md`, não um formato novo nem um subconjunto de critérios (só tokens).

## Risks / Trade-offs

- [Corrigir por nome de classe copiado do mockup, em vez de por valor, repete o erro que motivou a versão anterior desta change] → Mitigação: toda correcção de raio/espaçamento/cor é feita por valor confirmado, nunca por nome de classe do mockup.
- [Auditar toda a aplicação de novo é um esforço maior do que auditar só tokens de algumas superfícies] → Mitigação: aceite — foi exactamente o que o utilizador pediu ao corrigir o escopo; `fidelity-protocol.md` já é o processo mais eficiente disponível para isto (reaproveitado, não reinventado).
- [Esta change e `frontend-icons-lucide-svg` tocam código visual ao mesmo tempo] → Mitigação inalterada: sem sobreposição de ficheiros na prática; aplicar uma de cada vez se implementadas na mesma sessão.
- [Dependência de ordem com `frontend-icons-lucide-svg`, achado das revisões: se esta reauditoria correr **depois** de `frontend-icons-lucide-svg` estar aplicada, todo ícone da aplicação terá uma forma de traço diferente da do mockup (Lucide vs. Material Symbols) nas capturas lado a lado] → Mitigação: `frontend-icons-lucide-svg` já regista essa excepção em `visual-fidelity/spec.md` ("Scenario: Forma do glifo de ícone não é critério") — quem for preencher a tabela `Elemento|Mockup|v2|Observação` desta auditoria (Tarefa 3.1) aplica essa excepção se `frontend-icons-lucide-svg` já estiver aplicada nessa altura, e ignora-a (não se aplica ainda) se não estiver. Não é preciso forçar uma ordem específica entre as duas changes, só interpretar o resultado correctamente em qualquer uma das duas ordens.

## Migration Plan

Correcções de UI em superfícies existentes, sem mudança de comportamento. Pode ser aplicada e revista tela a tela, sem depender de nenhuma outra change em curso — à excepção de telas que só existem depois de outra change desta sessão ser aplicada primeiro (ex. a nova categoria "Ferramentas VTT" de `chat-dice-rolling`, que terá a sua própria verificação de fidelidade dentro dessa change, não aqui).
