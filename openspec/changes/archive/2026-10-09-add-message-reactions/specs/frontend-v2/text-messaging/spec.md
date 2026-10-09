# Spec Delta

## ADDED Requirements

### Requirement: Reações com emoji em mensagens
O sistema SHALL permitir reagir com emoji a qualquer mensagem do canal (de texto simples, com anexo, ou com citação de resposta), reutilizando o mesmo conjunto de emoji e shortcodes já disponível no composer. O sistema SHALL agrupar as reações por emoji, apresentando sob a mensagem uma pill por emoji com a contagem de utilizadores que reagiram, e SHALL alternar (adicionar/remover) a reação do próprio utilizador ao clicar numa pill existente de um emoji com que já reagiu, ou ao escolher esse emoji novamente através do botão de reagir. Um utilizador SHALL ter no máximo uma reação por emoji em cada mensagem, mas MAY reagir com vários emoji diferentes na mesma mensagem.

#### Scenario: Reagir a uma mensagem
- **WHEN** o utilizador clica no botão de reagir de uma mensagem e escolhe um emoji no selector
- **THEN** uma pill com esse emoji e contagem 1 aparece sob a mensagem, com destaque visual indicando que o próprio utilizador reagiu

#### Scenario: Remover a própria reação
- **WHEN** o utilizador clica numa pill de emoji sob uma mensagem à qual já reagiu com esse mesmo emoji
- **THEN** a sua reação é removida, a contagem da pill diminui em 1, e a pill desaparece se a contagem chegar a 0

#### Scenario: Reagir com vários emoji diferentes
- **WHEN** o utilizador reage à mesma mensagem com dois emoji diferentes
- **THEN** duas pills distintas aparecem sob a mensagem, cada uma reflectindo apenas a contagem do seu próprio emoji

#### Scenario: Tooltip com autores da reação
- **WHEN** o utilizador foca ou passa o cursor sobre uma pill de emoji
- **THEN** é apresentada a lista de nomes de quem reagiu com esse emoji, resumida em "e mais N" quando o número de autores excede o limite apresentado

#### Scenario: Sincronização em tempo real
- **WHEN** outro utilizador ligado ao mesmo canal adiciona ou remove uma reação numa mensagem
- **THEN** a pill correspondente actualiza-se em tempo real para todos os clientes ligados ao canal, sem recarregar a página

#### Scenario: Reação restrita ao conjunto fechado de emoji
- **WHEN** o utilizador abre o selector de reagir a uma mensagem
- **THEN** só pode escolher um emoji do mesmo conjunto fechado já usado no composer, nunca introduzir texto livre como reação

## MODIFIED Requirements

### Requirement: Canal de texto fiel ao mockup
O canal de texto SHALL apresentar cabeçalho de canal com chip E2EE, busca e alternância do painel de Membros, cartão de boas-vindas, banner de canal cifrado, mensagens com badge de cargo, legenda de anexo e reações com emoji, e composer com rodapé de ajuda. Cartões de rolagem de dados e spans de feitiço SHALL NOT ser implementados.

#### Scenario: Comparação de fidelidade
- **WHEN** a tela é comparada lado a lado com `mesa_shell_da_aplica_o_chat_de_texto` no mesmo estado, em tema escuro
- **THEN** todos os elementos obrigatórios da checklist de `design.md` D5 estão presentes, nenhum elemento excluído foi implementado, e a classificação é **Fiel**
