# channel-management Specification

## Purpose

Permite criar, renomear, apagar e controlar o acesso a canais individuais dentro de um servidor, incluindo silenciar membros num canal específico.

## Requirements

### Requirement: Criar canal com visibilidade e custódia de voz

O sistema SHALL permitir criar um canal fornecendo um nome, escolhendo visibilidade Público ou Privado (com uma opção adicional "visível para novos membros" quando público), escolhendo o tipo entre Texto, Voz/Vídeo ou Dados — e, quando o tipo é voz/vídeo, SHALL exigir a mesma confirmação de custódia de chave usada na criação de servidor (chave apresentada, checkbox obrigatória) antes de permitir a criação. Um canal do tipo Dados SHALL NOT gerar nem exigir nenhuma chave de canal, pela mesma razão que o seu conteúdo nunca é E2EE (ver `frontend-v2/text-messaging`, requisito de rolagem de dados).

#### Scenario: Canal de voz exige custódia

- **WHEN** o utilizador escolhe criar um canal de voz/vídeo
- **THEN** o botão de criar permanece desactivado até a checkbox de custódia de chave ser marcada

#### Scenario: Canal de texto não exige custódia

- **WHEN** o utilizador escolhe criar um canal de texto
- **THEN** o botão de criar fica disponível assim que um nome válido é fornecido, sem exigir nenhuma confirmação de chave

#### Scenario: Canal de Dados não exige custódia nem gera chave

- **WHEN** o utilizador escolhe criar um canal do tipo Dados
- **THEN** o botão de criar fica disponível assim que um nome válido é fornecido, sem exigir nenhuma confirmação de chave, e nenhuma chave de canal é gerada

### Requirement: Renomear canal
O sistema SHALL permitir renomear um canal directamente na lista de canais (edição inline), normalizando espaços para hífens e aplicando um limite de 32 caracteres. Ao passar o ponteiro sobre um canal, SHALL destacar visualmente toda a linha da sidebar, incluindo a área do nome e dos controlos contextuais. Os controlos de renomear e opções SHALL permanecer accionáveis e não SHALL impedir que o utilizador seleccione o canal ao clicar na área do nome, mesmo quando este é curto.

#### Scenario: Renomear com sucesso
- **WHEN** o utilizador edita o nome de um canal e confirma um valor válido
- **THEN** o novo nome é persistido e reflectido imediatamente na sidebar

#### Scenario: Hover destaca toda a linha
- **WHEN** o ponteiro entra na linha de um canal na sidebar
- **THEN** toda a linha recebe o realce visual de hover, em vez de apenas o texto do nome

#### Scenario: Seleccionar canal com nome curto e controlos visíveis
- **WHEN** os controlos contextuais aparecem sobre a linha de um canal com nome curto e o utilizador clica na área do nome
- **THEN** o canal é seleccionado e aberto, sem activar renomeação nem opções

#### Scenario: Abrir controlos contextuais
- **WHEN** o utilizador clica especificamente no controlo de renomear ou de opções
- **THEN** a acção correspondente é aberta sem seleccionar o canal

#### Scenario: Controlos visíveis num nome longo
- **WHEN** os controlos aparecem sobre a linha de um canal com nome longo
- **THEN** o nome continua a ser truncado com reticências, os controlos não deixam texto ilegível por trás de si e clicar no resto do nome abre o canal

#### Scenario: Sem permissão de gestão
- **WHEN** o utilizador não pode gerir canais
- **THEN** a linha tem o mesmo realce e a mesma área clicável, sem controlos de renomear e opções

### Requirement: Apagar canal com protecção do último canal do tipo
O sistema SHALL permitir apagar um canal mediante confirmação, e SHALL apresentar uma mensagem de erro clara quando o backend recusar a eliminação por ser o último canal desse tipo no servidor (HTTP 409 `last_channel_of_type`), sem deixar o utilizador sem explicação do porquê da recusa.

#### Scenario: Apagar o último canal de texto
- **WHEN** o utilizador tenta apagar o único canal de texto restante no servidor
- **THEN** o backend recusa com 409 `last_channel_of_type` e o sistema apresenta uma mensagem explicando que o servidor precisa de manter pelo menos um canal de cada tipo

#### Scenario: Apagar canal não-crítico
- **WHEN** o utilizador apaga um canal que não é o último do seu tipo
- **THEN** o canal é removido e deixa de aparecer na sidebar para todos os membros

### Requirement: ACL de canal com construtor de regras e inspector de acesso

O sistema SHALL apresentar, para quem tem permissão de gerir canais, um painel de permissões por canal com: visibilidade (Público/Privado) e a opção "visível para novos membros"; um construtor de regras que permite escolher um tipo de sujeito (Membro, Cargo, ou Todos os membros), o sujeito específico, um efeito (Permitir/Negar) e um nível de acesso apropriado ao tipo de canal (leitura/escrita para texto, ouvir/falar para voz, leitura/rolar para canais do tipo Dados); uma lista das regras activas, cada uma removível; e um sub-painel "Inspecionar acesso" que, para um membro escolhido, mostra o resultado de acesso resolvido com uma explicação factor-a-factor de como esse resultado foi alcançado.

#### Scenario: Adicionar uma regra de permissão

- **WHEN** o utilizador escolhe um sujeito, um efeito e um nível, e confirma "Adicionar"
- **THEN** uma nova regra aparece na lista de regras activas e passa a afectar imediatamente a resolução de acesso desse canal

#### Scenario: Remover uma regra

- **WHEN** o utilizador remove uma regra da lista de regras activas
- **THEN** essa regra deixa de afectar a resolução de acesso do canal

#### Scenario: Inspecionar acesso de um membro

- **WHEN** o utilizador escolhe um membro no sub-painel de inspecção
- **THEN** o sistema mostra se esse membro vê o canal, o seu nível de acesso efectivo, e uma explicação com a ordem de precedência dos factores que levaram a esse resultado (sobrescrita directa de membro > cargo > `@everyone`)

### Requirement: Silenciar e dessilenciar membro num canal
O sistema SHALL permitir, a quem tem a permissão correspondente, silenciar um membro num canal específico por uma duração escolhida entre opções predefinidas (5, 10, 15 e 30 minutos) ou uma duração customizada em minutos, mostrando o tempo restante enquanto o silenciamento estiver activo, e SHALL permitir dessilenciar antes do tempo expirar.

#### Scenario: Silenciar com duração predefinida
- **WHEN** o utilizador escolhe uma das durações predefinidas e confirma
- **THEN** o membro fica silenciado nesse canal pelo tempo escolhido, com o tempo restante visível

#### Scenario: Dessilenciar antes do fim
- **WHEN** o utilizador confirma dessilenciar um membro antes do tempo expirar
- **THEN** o silenciamento é removido imediatamente e o membro recupera a permissão de falar/escrever nesse canal

### Requirement: Criação e permissões de canal fiéis aos mockups

O diálogo de criar canal SHALL ter controlo segmentado Texto/Voz/Dados, cartões de visibilidade e bloco de custódia (voz); a sidebar SHALL ter uma secção "Ferramentas VTT" com a entrada de canais do tipo Dados, conforme `docs/v2/mesa_shell_da_aplica_o_chat_de_texto`; o painel de permissões SHALL ter abas Políticas/Inspecionar acesso, construtor em quatro passos e lista de regras activas; o inspector SHALL mostrar veredito e matriz por precedência.

#### Scenario: Comparação de fidelidade

- **WHEN** a tela é comparada lado a lado com `mesa_modal_criar_canal_de_voz_cust_dia_e2ee, mesa_di_logo_permiss_es_de_canal_acl_inspecionar_acesso, mesa_di_logo_inspecionar_acesso_efetivo_fator_a_fator e mesa_shell_da_aplica_o_chat_de_texto` (secção "Ferramentas VTT") no mesmo estado, em tema escuro
- **THEN** todos os elementos obrigatórios da checklist de `design.md` D4 estão presentes, nenhum elemento excluído (à excepção do segmento Dados, agora implementado) foi implementado, e a classificação é **Fiel**

### Requirement: Silenciar e apagar canal fiéis ao mockup
Os diálogos SHALL seguir a estrutura visual do mockup com as durações de silenciamento da aplicação actual e confirmação de apagar digitando o nome do canal; escopo "em todo o reino", motivo de auditoria e estatísticas SHALL NOT ser implementados.

#### Scenario: Comparação de fidelidade
- **WHEN** a tela é comparada lado a lado com `mesa_modais_de_gest_ao_de_canal` no mesmo estado, em tema escuro
- **THEN** todos os elementos obrigatórios da checklist de `design.md` D4 estão presentes, nenhum elemento excluído foi implementado, e a classificação é **Fiel**

### Requirement: Paridade funcional da gestão de canal
O sistema SHALL manter todas as funcionalidades existentes desta área: criar texto/voz, renomear inline, apagar com protecção do último canal do tipo, ACL com regras de membro/cargo/todos, inspector de acesso, silenciar e dessilenciar com tempo restante.

#### Scenario: Funcionalidades existentes
- **WHEN** cada item desta área de `docs/v2/parity-checklist.md` é exercido na v2
- **THEN** produz o mesmo resultado de produto que na aplicação anterior, contra o mesmo backend

### Requirement: Acesso por omissão e exclusividade dos canais

O sistema SHALL dar, por omissão, a todo o membro de um servidor, tenha ou não um cargo atribuído, acesso para ver e enviar mensagens em qualquer canal de texto, para entrar, falar e ligar a câmara em qualquer canal de voz, e para ver e rolar dados em qualquer canal do tipo Dados. Este acesso SHALL só ser reduzido quando o canal é privado ou tem regras de acesso (criadas por quem criou o canal, pelo dono, ou por quem tem permissão de gerir canais com cargo acima do criador), quando o cargo da pessoa retira a permissão de enviar mensagens, falar, ligar à voz ou rolar dados, ou quando a pessoa está silenciada no canal. Tornar um canal exclusivo de cargos ou membros específicos SHALL ser feito com a visibilidade privada e regras de permitir.

#### Scenario: Membro sem cargo num canal de texto público

- **WHEN** um membro sem cargo abre um canal de texto público
- **THEN** vê as mensagens e pode enviar mensagens

#### Scenario: Membro sem cargo num canal de voz público

- **WHEN** um membro sem cargo abre um canal de voz público
- **THEN** pode entrar na chamada, falar e ligar a câmara

#### Scenario: Membro sem cargo num canal de Dados público

- **WHEN** um membro sem cargo abre um canal do tipo Dados público
- **THEN** vê o histórico de rolagens e pode rolar

#### Scenario: Membro sem cargo anexa imagens

- **WHEN** um membro sem cargo escreve num canal de texto público
- **THEN** o botão de anexar imagens está disponível, porque anexar ficheiros também vem ligado por omissão

#### Scenario: Canal exclusivo

- **WHEN** quem criou o canal o torna privado e permite só o cargo "Mestres"
- **THEN** só os membros com esse cargo (e o dono) veem e usam o canal; os restantes nem o veem na lista

#### Scenario: Cargo sem permissão

- **WHEN** o cargo de um membro não inclui enviar mensagens
- **THEN** esse membro vê os canais de texto mas o composer aparece como somente leitura

### Requirement: Gestão da mensagem pinada
O sistema SHALL permitir pinar, substituir e despinar mensagens de texto apenas a quem tem permissão efetiva de gestão do canal, segundo as regras de hierarquia já usadas nas demais ações de gestão. Membros sem essa permissão SHALL poder ver e acessar o pin, mas SHALL ser impedidos de alterá-lo.

#### Scenario: Substituição confirmada
- **WHEN** um gestor tenta pinar outra mensagem enquanto existe um pin
- **THEN** o sistema informa que o pin anterior será removido e só efetua a troca após confirmação

#### Scenario: Substituição cancelada
- **WHEN** o gestor cancela a confirmação
- **THEN** o pin anterior permanece e nenhuma troca é enviada

#### Scenario: Despinar
- **WHEN** um gestor remove o pin atual
- **THEN** o canal fica sem mensagem pinada para todos os membros

#### Scenario: Acesso sem gestão
- **WHEN** um membro sem permissão tenta alterar o pin por meio da interface ou da API
- **THEN** a ação de gestão não fica disponível na interface e a API recusa a alteração

### Requirement: Interruptor de animação de dados por canal de Texto

O sistema SHALL disponibilizar, nas definições de cada canal de Texto, um interruptor `dice_animations_enabled` desligado por omissão para canais novos e existentes. Apenas quem já tem permissão de gerir o canal SHALL poder alterá-lo; não existe permissão granular nova por cargo ou membro. A definição SHALL NOT afectar canais de Dados, que mostram sempre a animação, nem canais de Voz, aos quais a rolagem não se aplica.

#### Scenario: Valor por omissão

- **WHEN** um canal de Texto é criado ou um canal de Texto existente recebe a migração
- **THEN** o interruptor aparece desligado nas definições e o canal não apresenta overlay de rolagem

#### Scenario: Gestor liga e desliga

- **WHEN** quem pode gerir o canal de Texto liga ou desliga o interruptor e guarda as definições
- **THEN** o valor é persistido e apresentado aos membros do canal através da actualização existente de canais

#### Scenario: Membro sem permissão de gerir

- **WHEN** um membro sem permissão de gerir o canal tenta aceder ao controlo ou enviar o campo por PATCH
- **THEN** não consegue alterar a definição e o PATCH é recusado

#### Scenario: Tipos não aplicáveis

- **WHEN** as definições de um canal de Dados ou Voz são abertas
- **THEN** o interruptor não aparece; um PATCH que inclua o campo é recusado, e a animação em Dados permanece sempre activa
