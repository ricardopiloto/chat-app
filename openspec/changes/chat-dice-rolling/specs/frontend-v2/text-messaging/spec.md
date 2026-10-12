# Spec Delta

## MODIFIED Requirements

### Requirement: Canal de texto fiel ao mockup

O canal de texto SHALL apresentar cabeçalho de canal com chip E2EE, busca e alternância do painel de Membros, cartão de boas-vindas, banner de canal cifrado, mensagens com badge de cargo, legenda de anexo e reações com emoji, e composer com rodapé de ajuda, e cartões de rolagem de dados conforme a capability `rolagem de dados` deste documento. Spans de feitiço SHALL NOT ser implementados.

#### Scenario: Comparação de fidelidade

- **WHEN** a tela é comparada lado a lado com `mesa_shell_da_aplica_o_chat_de_texto` no mesmo estado, em tema escuro
- **THEN** todos os elementos obrigatórios da checklist de `design.md` D5 estão presentes, nenhum elemento excluído (à excepção da rolagem de dados, agora implementada) foi implementado, e a classificação é **Fiel**

## ADDED Requirements

### Requirement: Rolagem de dados em canais de texto e de Dados

Qualquer membro com permissão de escrever/rolar no canal (a mesma permissão exigida para enviar mensagens num canal de texto, ou a permissão equivalente num canal do tipo Dados — ver `frontend-v2/channel-management`) SHALL poder lançar uma notação `NdM+K` (`count` 1-20, `sides` 2-1000, `modificador` -100 a 100) num canal de texto ou num canal do tipo Dados, e o sistema SHALL gerar o resultado no servidor (nunca no cliente), SHALL publicar o resultado como uma mensagem normal do canal (com remetente, avatar e reacções, tal como qualquer outra mensagem), em tempo real para todos os membros, mostrando a notação, cada dado individual, o modificador e o total. Para uma notação `1d20` sem outros dados, um resultado natural de 20 ou de 1 SHALL ser destacado distintamente dos outros valores. Um canal do tipo Dados SHALL NOT aceitar mensagens de texto normais — só rolagens.

#### Scenario: Lançar uma notação simples num canal de texto

- **WHEN** um membro envia a notação `1d20+5` a partir do composer de um canal de texto
- **THEN** uma mensagem nova aparece no canal, em tempo real para todos os membros, com a notação, o valor do dado, o modificador e o total, embutida na conversa normal desse canal

#### Scenario: Lançar uma notação num canal de Dados

- **WHEN** um membro envia a notação `2d6+3` num canal do tipo Dados ("Histórico de Dados")
- **THEN** a mesma mensagem de resultado aparece nesse canal, em tempo real para todos os membros

#### Scenario: Vinte ou um natural em d20

- **WHEN** um membro lança `1d20` (sem outros dados) e o resultado do dado é 20, ou é 1
- **THEN** o resultado é destacado distintamente de um resultado intermédio

#### Scenario: Notação inválida ou fora dos limites

- **WHEN** um membro tenta lançar uma notação fora dos limites aceites (ex. `21d20`, `1d2000`) ou malformada, em qualquer um dos dois tipos de canal
- **THEN** o pedido é recusado com um erro claro, e nenhuma mensagem é publicada

#### Scenario: Sem permissão de escrever/rolar

- **WHEN** um membro silenciado, ou sem permissão de escrever/rolar nesse canal, tenta lançar uma notação
- **THEN** o pedido é recusado, da mesma forma que uma tentativa de enviar uma mensagem de texto seria

#### Scenario: Canal de Dados recusa mensagens de texto normais

- **WHEN** um membro tenta enviar uma mensagem de texto normal (não uma rolagem) num canal do tipo Dados
- **THEN** o pedido é recusado com um erro claro
