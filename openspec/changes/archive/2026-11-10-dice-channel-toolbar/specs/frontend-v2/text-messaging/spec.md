# Spec Delta

## ADDED Requirements

### Requirement: Barra de dados no canal de Dados

Num canal do tipo Dados, o sistema SHALL apresentar, junto ao composer dedicado de rolagem, uma barra de dados configurável visível apenas nesse tipo de canal. O composer existente (notação, modificador explícito, rótulo e botão de lançar) SHALL permanecer disponível e SHALL reduzir de tamanho/layout para encaixar a barra no mesmo rodapé, sem remover controlos.

A barra SHALL listar apenas as faces que o utilizador marcou como visíveis numa checklist de faces padrão (`d4`, `d6`, `d8`, `d10`, `d12`, `d20`, `d100`). Para cada face visível, o clique esquerdo SHALL aumentar a quantidade a rolar dessa face, e o clique direito SHALL diminuir essa quantidade, com mínimo 1 e máximo igual ao limite de `count` já aceite pela rolagem (1–20). Nesta ronda, apenas **um** tipo de face activo SHALL alimentar a rolagem: interagir com um dado da barra SHALL tornar essa face a notação activa (`NdM`) sincronizada com o campo de notação do formulário; o lançamento continua a usar o endpoint e a notação `NdM+K` existentes, sem pools multi-face.

A checklist de faces visíveis SHALL ser persistida no servidor associada à conta autenticada e SHALL ser reaplicada ao reabrir a aplicação ou outro cliente da mesma conta. Quantidades por face na barra MAY ser apenas estado de sessão (não é obrigatório persistir `count`). Canais de Texto e o popover “Lançar dados” SHALL NOT mostrar esta barra.

#### Scenario: Barra só no canal de Dados

- **WHEN** um membro abre um canal do tipo Dados
- **THEN** vê a barra de dados e o composer dedicado no mesmo rodapé, com o formulário compactado para caber com a barra

#### Scenario: Barra ausente em Texto

- **WHEN** um membro está num canal de Texto (com ou sem popover de dados aberto)
- **THEN** a barra de dados do canal de Dados não aparece

#### Scenario: Checklist define faces visíveis

- **WHEN** o utilizador marca `d20` e `d6` na checklist e desmarca as restantes
- **THEN** a barra mostra apenas esses dois dados, e a preferência fica disponível após recarregar a sessão na mesma conta

#### Scenario: Clique esquerdo aumenta quantidade

- **WHEN** o utilizador faz clique esquerdo num `d20` visível cuja quantidade actual é 1
- **THEN** a quantidade desse dado passa a 2 e a notação activa do formulário reflecte `2d20` (mantendo o modificador do formulário)

#### Scenario: Clique direito respeita mínimo 1

- **WHEN** o utilizador faz clique direito num dado da barra cuja quantidade actual é 1
- **THEN** a quantidade permanece 1

#### Scenario: Um só tipo por rolagem

- **WHEN** o utilizador tem `d6` e `d20` na barra e interage com o `d6` antes de lançar
- **THEN** a rolagem publicada usa apenas o tipo activo (`Nd6+K`), não a soma de vários tipos

#### Scenario: Preferência por conta no servidor

- **WHEN** o utilizador altera a checklist noutro dispositivo ou após novo login com a mesma conta
- **THEN** as faces visíveis coincidem com o último valor gravado no servidor para essa conta
