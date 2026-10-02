# Spec Delta

## Purpose

Permite a criação de um servidor novo e a sua administração contínua — membros, cargos e permissões, imagem, mensagem de boas-vindas e eliminação — por quem tem os privilégios adequados.

## ADDED Requirements

### Requirement: Criar servidor com custódia de chave obrigatória
O sistema SHALL permitir criar um servidor novo fornecendo um nome, gerando uma chave de cifra client-side, apresentando-a como texto copiável, e SHALL bloquear o botão de confirmação até o utilizador marcar explicitamente que guardou a chave. Ao confirmar, o sistema SHALL invocar o bootstrap (`POST /api/servers`) que cria o servidor com um canal de texto `geral` e um canal de voz por omissão.

#### Scenario: Botão bloqueado sem confirmação
- **WHEN** o utilizador preenche o nome do servidor mas não marca a checkbox de custódia
- **THEN** o botão de criar permanece desactivado

#### Scenario: Criação bem-sucedida
- **WHEN** o utilizador preenche o nome, marca a checkbox de custódia e confirma
- **THEN** um novo servidor é criado com um canal de texto e um canal de voz por omissão, e o utilizador é navegado para esse servidor

### Requirement: Gestão de membros
O sistema SHALL apresentar, para quem tem permissão de gerir membros, uma lista pesquisável dos membros do servidor com o cargo de cada um editável e uma acção de remover — excepto para a linha do dono do servidor, que SHALL ser apresentada sem controlo de cargo nem de remoção.

#### Scenario: Linha do dono bloqueada
- **WHEN** a lista de membros é apresentada
- **THEN** a linha correspondente ao dono do servidor não mostra selector de cargo nem botão de remover, independentemente de quem estiver a ver a lista

#### Scenario: Alterar cargo de um membro
- **WHEN** um administrador selecciona um cargo diferente para um membro que não é o dono
- **THEN** o cargo desse membro é actualizado no backend e reflectido imediatamente na lista

#### Scenario: Remover membro
- **WHEN** um administrador confirma a remoção de um membro que não é o dono
- **THEN** esse membro deixa de aparecer na lista e perde acesso ao servidor

### Requirement: Cargos com permissões agrupadas
O sistema SHALL permitir criar, reordenar e apagar cargos (excepto cargos de sistema, que SHALL ser apresentados como só-leitura sem opção de reordenar ou apagar), e editar as permissões de cada cargo agrupadas em três secções: Geral (ver canais, gerir canais, gerir cargos, criar convites, remover membros, silenciar membros), Texto (enviar mensagens, apagar mensagens, anexar ficheiros) e Voz (ligar, falar).

#### Scenario: Cargo de sistema é só-leitura
- **WHEN** o utilizador selecciona um cargo de sistema (ex. `@everyone`) para edição
- **THEN** todos os interruptores de permissão aparecem desactivados e não existem botões de reordenar ou apagar para esse cargo

#### Scenario: Guardar alteração de permissão
- **WHEN** o utilizador alterna uma permissão de um cargo não-sistema e guarda
- **THEN** a alteração é persistida e passa a afectar imediatamente o acesso de quem tem esse cargo

#### Scenario: Apagar cargo com membros associados
- **WHEN** o utilizador apaga um cargo que tem membros associados
- **THEN** o sistema avisa explicitamente que os membros associados perdem as permissões desse cargo antes de confirmar a eliminação

### Requirement: Imagem, boas-vindas e eliminação do servidor
O sistema SHALL permitir, a quem tem acesso de dono: alterar ou remover a imagem do servidor (JPEG/PNG/WebP, até 1 MiB); configurar uma mensagem de boas-vindas com um canal de texto de destino e um template de texto; e apagar o servidor mediante uma confirmação que exige digitar o nome exacto do servidor antes de o botão destrutivo ficar activo.

#### Scenario: Upload de imagem fora do limite
- **WHEN** o ficheiro de imagem escolhido excede 1 MiB ou não é JPEG/PNG/WebP
- **THEN** o sistema rejeita o upload com uma mensagem de erro explicando o limite, sem chegar a enviar o ficheiro ao backend

#### Scenario: Confirmação de eliminação por nome
- **WHEN** o utilizador tenta apagar o servidor
- **THEN** o botão destrutivo final só fica activo depois de o utilizador digitar o nome exacto do servidor num campo de confirmação

#### Scenario: Boas-vindas aplicadas a membro novo
- **WHEN** um membro novo aceita um convite e entra no servidor (depois desta fase e da capability `frontend-v2/invites` estarem ambas activas)
- **THEN** a mensagem de boas-vindas configurada é publicada no canal de destino escolhido

### Requirement: Landing de definições do servidor
O sistema SHALL apresentar uma página de "Visão Geral" que agrega imagem, boas-vindas e o acesso a apagar o servidor, servindo também como landing da navegação de definições — conforme a estrutura entregue nos mockups (`mesa_defini_es_do_servidor_vis_o_geral_e_boas_vindas`), não como páginas totalmente separadas por função.

#### Scenario: Entrar em definições sem sub-secção escolhida
- **WHEN** o utilizador abre as definições do servidor sem ter seleccionado Membros ou Cargos
- **THEN** a página de Visão Geral é apresentada por omissão, já populada com os dados actuais do servidor (não um estado vazio)

### Requirement: Criação de servidor fiel ao mockup
O diálogo de criar servidor SHALL apresentar selector de sigilo/ícone, nome com contador, bloco de chave com Copiar, checkbox de custódia inicialmente desmarcada e nota da configuração padrão.

#### Scenario: Comparação de fidelidade
- **WHEN** a tela é comparada lado a lado com `mesa_modal_criar_servidor_cust_dia_e2ee` no mesmo estado, em tema escuro
- **THEN** todos os elementos obrigatórios da checklist de `design.md` D4 estão presentes, nenhum elemento excluído foi implementado, e a classificação é **Fiel**

### Requirement: Definições do servidor fiéis aos mockups
As definições SHALL ter navegação lateral própria (Servidor, Papéis, Pessoas, Zona crítica), a lista de membros SHALL ser uma tabela com cartões Total/Online, filtros e paginação, e os cargos SHALL usar interruptores agrupados com contador, barra de alterações por guardar e matriz de membros. Cor de cargo e métricas de D20/armazenamento SHALL NOT ser implementadas.

#### Scenario: Comparação de fidelidade
- **WHEN** a tela é comparada lado a lado com `mesa_defini_es_do_servidor_vis_o_geral_e_boas_vindas, mesa_defini_es_do_servidor_membros e mesa_defini_es_do_servidor_cargos_e_permiss_es` no mesmo estado, em tema escuro
- **THEN** todos os elementos obrigatórios da checklist de `design.md` D4 estão presentes, nenhum elemento excluído foi implementado, e a classificação é **Fiel**

### Requirement: Paridade funcional da administração de servidor
O sistema SHALL manter todas as funcionalidades existentes desta área: criar servidor com bootstrap e custódia, membros (pesquisa, cargo, remover, dono protegido), cargos (criar, reordenar, apagar com aviso, permissões por grupo, cargo de sistema só-leitura), imagem do servidor, boas-vindas e apagar servidor por nome.

#### Scenario: Funcionalidades existentes
- **WHEN** cada item desta área de `docs/v2/parity-checklist.md` é exercido na v2
- **THEN** produz o mesmo resultado de produto que na aplicação anterior, contra o mesmo backend
