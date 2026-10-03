# Spec Delta

## MODIFIED Requirements

### Requirement: Cargos com permissões agrupadas
O sistema SHALL permitir criar, reordenar e apagar cargos (excepto cargos de sistema, que SHALL ser apresentados como só-leitura sem opção de reordenar ou apagar), e editar as permissões de cada cargo agrupadas em três secções: Geral (ver canais, gerir canais, gerir cargos, criar convites, remover membros, silenciar membros), Texto (enviar mensagens, apagar mensagens, anexar ficheiros, mencionar @todos) e Voz (ligar, falar).

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
