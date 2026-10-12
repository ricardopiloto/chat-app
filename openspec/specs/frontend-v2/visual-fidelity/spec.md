# visual-fidelity Specification

## Purpose

Garante que cada tela entregue corresponde ao mockup desenhado, com um critério de aceite objectivo e registado.

## Requirements

### Requirement: Fidelidade visual aos mockups como critério de aceite
O sistema SHALL tratar como concluída uma tela mapeada a um mockup de `docs/v2/mesa_*` apenas quando, comparada lado a lado com o `screen.png` no mesmo estado e tema escuro, cumpre a checklist de elementos obrigatórios do respectivo change e é classificada **Fiel** na escala de `docs/v2/AUDIT-fidelity.md` §2. Elementos desenhados nos mockups mas excluídos do escopo (AUDIT §6) SHALL NOT ser implementados nem contados como em falta. A forma do glifo de um ícone (ex. traço Lucide vs. ligature Material Symbols) SHALL NOT, por si só, reduzir essa classificação — a comparação de ícones incide sobre posição, tamanho e estado (activo/inactivo), não sobre a forma exacta do desenho do glifo.

#### Scenario: Registo de comparação
- **WHEN** uma tela é submetida a aceite
- **THEN** `verification.md` contém a captura da v2, a referência ao mockup e uma tabela elemento-a-elemento com o resultado, e a classificação final

#### Scenario: Elemento fora de escopo
- **WHEN** um mockup mostra um elemento listado em AUDIT §6 (ex.: rolagem de dados, MLS, métricas de rede)
- **THEN** a v2 não o implementa e a ausência não reduz a classificação da tela

#### Scenario: Forma do glifo de ícone não é critério
- **WHEN** uma tela é comparada lado a lado com o seu `screen.png` e um ícone usa a forma de traço do conjunto Lucide em vez da forma do conjunto Material Symbols desenhada no mockup
- **THEN** essa diferença de forma, isolada, não é registada como elemento em falta nem reduz a classificação da tela
