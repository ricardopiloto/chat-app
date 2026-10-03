# Spec Delta

## MODIFIED Requirements

### Requirement: Cargos com permissões agrupadas
O sistema SHALL permitir criar, reordenar e apagar cargos (excepto cargos de sistema, que SHALL ser apresentados como só-leitura sem opção de reordenar ou apagar), e editar as permissões de cada cargo agrupadas em três secções: Geral (ver canais, gerir canais, gerir cargos, criar convites, remover membros, silenciar membros, **gerir bots**), Texto (enviar mensagens, apagar mensagens, anexar ficheiros, mencionar @todos) e Voz (ligar, falar).

#### Scenario: Cargo de sistema é só-leitura
- **WHEN** o utilizador selecciona um cargo de sistema (ex. `@everyone`) para edição
- **THEN** todos os interruptores de permissão aparecem desactivados e não existem botões de reordenar ou apagar para esse cargo

#### Scenario: Guardar alteração de permissão
- **WHEN** o utilizador alterna uma permissão de um cargo não-sistema e guarda
- **THEN** a alteração é persistida e passa a afectar imediatamente o acesso de quem tem esse cargo

#### Scenario: Apagar cargo com membros associados
- **WHEN** o utilizador apaga um cargo que tem membros associados
- **THEN** o sistema avisa explicitamente que os membros associados perdem as permissões desse cargo antes de confirmar a eliminação

#### Scenario: Permissão de mencionar @todos
- **WHEN** o utilizador abre as permissões de um cargo não-sistema
- **THEN** a secção Texto mostra o interruptor "Mencionar @todos", desligado num cargo novo, com uma explicação de que notifica todos os membros do canal

#### Scenario: Permissão de gerir bots
- **WHEN** o utilizador abre as permissões de um cargo não-sistema
- **THEN** a secção Geral mostra o interruptor "Gerenciar bots", desligado num cargo novo, com uma explicação de que permite criar, listar e revogar bots do servidor

### Requirement: Definições do servidor fiéis aos mockups
As definições SHALL ter navegação lateral própria (Servidor, Papéis, Pessoas, **Bots**, Zona crítica), a lista de membros SHALL ser uma tabela com cartões Total/Online, filtros e paginação, e os cargos SHALL usar interruptores agrupados com contador, barra de alterações por guardar e matriz de membros. Cor de cargo e métricas de D20/armazenamento SHALL NOT ser implementadas.

#### Scenario: Comparação de fidelidade
- **WHEN** a tela é comparada lado a lado com `mesa_defini_es_do_servidor_vis_o_geral_e_boas_vindas, mesa_defini_es_do_servidor_membros e mesa_defini_es_do_servidor_cargos_e_permiss_es` no mesmo estado, em tema escuro
- **THEN** todos os elementos obrigatórios da checklist de `design.md` D4 estão presentes, nenhum elemento excluído foi implementado, e a classificação é **Fiel**

#### Scenario: Item "Bots" só aparece para quem tem a capacidade
- **WHEN** a navegação lateral de definições é apresentada a alguém sem a capacidade "Gerenciar bots" e que não é o dono do servidor
- **THEN** o item "Bots" não aparece nessa navegação, consistente com o tratamento já existente para outros itens restritos por capacidade
