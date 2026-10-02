# channel-management Specification

## Purpose

Permite criar, renomear, apagar e controlar o acesso a canais individuais dentro de um servidor, incluindo silenciar membros num canal específico.

## Requirements

### Requirement: Criar canal com visibilidade e custódia de voz
O sistema SHALL permitir criar um canal fornecendo um nome, escolhendo visibilidade Público ou Privado (com uma opção adicional "visível para novos membros" quando público), e — quando o tipo é voz/vídeo — SHALL exigir a mesma confirmação de custódia de chave usada na criação de servidor (chave apresentada, checkbox obrigatória) antes de permitir a criação.

#### Scenario: Canal de voz exige custódia
- **WHEN** o utilizador escolhe criar um canal de voz/vídeo
- **THEN** o botão de criar permanece desactivado até a checkbox de custódia de chave ser marcada

#### Scenario: Canal de texto não exige custódia
- **WHEN** o utilizador escolhe criar um canal de texto
- **THEN** o botão de criar fica disponível assim que um nome válido é fornecido, sem exigir nenhuma confirmação de chave

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
O sistema SHALL apresentar, para quem tem permissão de gerir canais, um painel de permissões por canal com: visibilidade (Público/Privado) e a opção "visível para novos membros"; um construtor de regras que permite escolher um tipo de sujeito (Membro, Cargo, ou Todos os membros), o sujeito específico, um efeito (Permitir/Negar) e um nível de acesso apropriado ao tipo de canal (leitura/escrita para texto, ouvir/falar para voz); uma lista das regras activas, cada uma removível; e um sub-painel "Inspecionar acesso" que, para um membro escolhido, mostra o resultado de acesso resolvido com uma explicação factor-a-factor de como esse resultado foi alcançado.

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
O diálogo de criar canal SHALL ter controlo segmentado Texto/Voz, cartões de visibilidade e bloco de custódia (voz); o painel de permissões SHALL ter abas Políticas/Inspecionar acesso, construtor em quatro passos e lista de regras activas; o inspector SHALL mostrar veredito e matriz por precedência.

#### Scenario: Comparação de fidelidade
- **WHEN** a tela é comparada lado a lado com `mesa_modal_criar_canal_de_voz_cust_dia_e2ee, mesa_di_logo_permiss_es_de_canal_acl_inspecionar_acesso e mesa_di_logo_inspecionar_acesso_efetivo_fator_a_fator` no mesmo estado, em tema escuro
- **THEN** todos os elementos obrigatórios da checklist de `design.md` D4 estão presentes, nenhum elemento excluído foi implementado, e a classificação é **Fiel**

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
