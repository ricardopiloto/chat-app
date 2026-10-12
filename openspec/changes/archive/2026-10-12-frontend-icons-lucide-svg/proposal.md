# Proposal

## Why

O utilizador pediu para seguir a proposta de ícones em `docs/v2/mesa_sistema_de_design_tokens_componentes_guia_de_ui/code.html` (secção "06 // Iconografia & Controlos de Chamada", linha 820): ícones SVG inline desenhados à mão, estilo Lucide — grelha 24×24, traço (`stroke`) 2px, `fill="none"`, com o estado (activo/mudo/etc.) comunicado por cor e fundo do contentor, não por uma variante "cheia" do próprio glifo.

Isto reverte uma decisão anterior, já documentada e deliberada: `docs/v2/TR-frontend-v2.md` identificou este ficheiro-guia como a **única** fonte, em todo o corpus de 30 mockups de produto + guia, a usar um sistema de ícones divergente (os outros 30 mockups, e a aplicação actual, usam Material Symbols Outlined de forma consistente) e tratou isso como "achado positivo, já não é um risco a gerir" (§6.3) — ou seja, decidiu ignorar a secção de ícones deste guia. Essa decisão está hoje codificada como requisito vinculativo em `openspec/specs/frontend-v2/foundation/spec.md` (Scenario "Ícones consistentes", linha 38-40): *"o ícone é renderizado através do conjunto Material Symbols Outlined, nunca como... um conjunto de SVG customizado"*. O utilizador, ao ser confrontado com esta divergência, confirmou explicitamente que quer avançar com a troca de qualquer forma — esta change existe para registar essa reversão como uma decisão nova e explícita, não para a esconder.

## What Changes

- `frontend/src/components/ui/Icon.tsx`: deixa de renderizar um `<span class="material-symbols-outlined">` com o nome como ligature de uma fonte variável, e passa a renderizar um ícone Lucide (pacote `lucide-solid`) como `<svg>` inline — grelha 24×24, `stroke-width="2"`, `fill="none"` por omissão.
- Uma tabela de mapeamento nome-Material-Symbols → componente-Lucide para os ≈130 nomes distintos em uso hoje (ver `grep` em `tasks.md`), cobrindo tanto os `<Icon name="...">` literais como os nomes vindos de dados (ex. `props.icon`, `item.icon`, configurações de secções de definições).
- O prop `filled` do `Icon` muda de significado: deixa de accionar o eixo variável `FILL` da fonte (`font-variation-settings: 'FILL' 1`) e passa a accionar `fill="currentColor"` no SVG Lucide (em vez de `fill="none"`) — o contrato do prop (`filled?: boolean`) não muda, só a implementação por trás dele.
- A selecção de tamanho por contexto, hoje feita via a classe CSS `.material-symbols-outlined` em `frontend/src/styles.css`, `voice.css`, `mgmt.css`, `chat.css` e `components/ui.css`, passa a usar uma classe nova e estável, independente da biblioteca de ícones (`.ui-icon`), para que as regras de tamanho existentes por contexto continuem a funcionar sem reescrever cada uma individualmente.
- Remove o `<link>` do Google Fonts para "Material Symbols Outlined" de `frontend/index.html` (deixa de ser necessário) — mantém os `<link>` de `Inter`/`JetBrains Mono`/`Plus Jakarta Sans`, inalterados.

## Capabilities

### Modified Capabilities
- `frontend-v2/foundation`: o Scenario "Ícones consistentes" (requisito "Biblioteca base de componentes sem lógica de negócio") passa a exigir o conjunto Lucide (SVG inline, traço 2px, grelha 24×24) em vez de Material Symbols Outlined.
- `frontend-v2/visual-fidelity`: o requisito "Fidelidade visual aos mockups como critério de aceite" passa a excluir explicitamente a forma do glifo de ícone (Lucide vs. Material Symbols) do critério de classificação Fiel/Parcial/Genérica — sem este ajuste, toda tela já certificada Fiel ficaria, pela letra actual do requisito, com um "elemento em falta" só por causa desta troca.

## Impact

- **Frontend** (`frontend/src/components/ui/Icon.tsx`, `frontend/index.html`, `frontend/src/styles.css` e as 4 outras folhas CSS que referenciam `.material-symbols-outlined`, mais a nova dependência `lucide-solid`): ≈130 nomes de ícone a mapear, ≈51+ ficheiros com `<Icon name=...>` a continuar a funcionar sem alteração no call-site (só o nome passado muda de vocabulário, não a assinatura do componente).
- **Sem impacto**: backend, paleta de cores (inalterada — só a Decisão de cores dos tokens, não de ícones, está fora desta change).
