# Spec Delta

## MODIFIED Requirements

### Requirement: Editor de cena com atribuição por arrastar e selector de layout

O sistema SHALL permitir exclusivamente ao criador registado do canal entrar no modo de edição da cena, atribuir e retirar ocupantes das posições, escolher de 2 a 8 posições e um dos três layouts nomeados, e guardar ou descartar alterações. O servidor SHALL recusar mutações de cena por qualquer outra conta, incluindo o dono do servidor quando não for o criador desse canal.

#### Scenario: Criador edita a cena

- **WHEN** o criador do canal abre a Composição
- **THEN** a acção «Editar cena» está disponível e as alterações válidas podem ser guardadas

#### Scenario: Dono que não criou o canal

- **WHEN** o dono do servidor abre um canal criado por outra conta
- **THEN** não vê a acção de edição e qualquer pedido directo de mutação da cena é recusado

#### Scenario: Fechar o editor com alterações por guardar

- **WHEN** o criador tenta sair do modo de edição com alterações ainda não guardadas
- **THEN** o sistema apresenta uma confirmação com Cancelar, Descartar e Guardar

#### Scenario: Reduzir o número de posições com ocupantes atribuídos

- **WHEN** o criador reduz as posições para menos do que as posições ocupadas
- **THEN** o sistema pede que escolha quais posições remover antes de aplicar a redução
