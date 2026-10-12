# Spec Delta

## MODIFIED Requirements

### Requirement: Biblioteca base de componentes sem lógica de negócio

O sistema SHALL fornecer um conjunto de componentes de UI genéricos e reutilizáveis (botão em variantes primário/secundário/perigo/ícone, campo de texto, radio, checkbox, switch, select, diálogo/modal, toast, menu de contexto, avatar, badge/chip, tooltip), cada um consumindo exclusivamente os tokens de design — nenhum componente desta camada SHALL conter lógica específica de um domínio de produto (ex.: sessão de utilizador, canal, mensagem).

#### Scenario: Componente renderiza nos dois temas

- **WHEN** qualquer componente da biblioteca base é renderizado sob o tema escuro e sob o tema claro
- **THEN** o componente apresenta uma aparência coerente com os tokens de cada tema, sem necessitar de props específicas de tema

#### Scenario: Ícones consistentes

- **WHEN** um componente da biblioteca base precisa de um ícone
- **THEN** o ícone é renderizado como um SVG inline do conjunto Lucide (grelha 24×24, traço 2px, `fill="none"` por omissão, estado activo/inactivo comunicado por cor e fundo do contentor, não por uma variante preenchida do glifo), nunca como emoji nem como ligature de uma fonte de ícones
