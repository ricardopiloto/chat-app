# Spec Delta

## MODIFIED Requirements

### Requirement: Fidelidade visual aos mockups como critério de aceite

O sistema SHALL tratar como concluída uma tela mapeada a um mockup de `docs/v2/mesa_*` apenas quando, comparada lado a lado com o `screen.png` no mesmo estado e tema escuro, cumpre a checklist de elementos obrigatórios do respectivo change e é classificada **Fiel** na escala de `docs/v2/AUDIT-fidelity.md` §2. Elementos desenhados nos mockups mas excluídos do escopo (AUDIT §6, à excepção da rolagem de dados — ver capability `frontend-v2/text-messaging`, agora implementada) SHALL NOT ser implementados nem contados como em falta.

#### Scenario: Registo de comparação

- **WHEN** uma tela é submetida a aceite
- **THEN** `verification.md` contém a captura da v2, a referência ao mockup e uma tabela elemento-a-elemento com o resultado, e a classificação final

#### Scenario: Elemento fora de escopo

- **WHEN** um mockup mostra um elemento listado em AUDIT §6 (ex.: MLS, métricas de rede, painel "Mesa Rápida D20" do roster de voz)
- **THEN** a v2 não o implementa e a ausência não reduz a classificação da tela
