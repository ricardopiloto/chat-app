# Spec Delta

## MODIFIED Requirements

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

### Requirement: Criação e permissões de canal fiéis aos mockups

O diálogo de criar canal SHALL ter controlo segmentado Texto/Voz/Dados, cartões de visibilidade e bloco de custódia (voz); a sidebar SHALL ter uma secção "Ferramentas VTT" com a entrada de canais do tipo Dados, conforme `docs/v2/mesa_shell_da_aplica_o_chat_de_texto`; o painel de permissões SHALL ter abas Políticas/Inspecionar acesso, construtor em quatro passos e lista de regras activas; o inspector SHALL mostrar veredito e matriz por precedência.

#### Scenario: Comparação de fidelidade

- **WHEN** a tela é comparada lado a lado com `mesa_modal_criar_canal_de_voz_cust_dia_e2ee, mesa_di_logo_permiss_es_de_canal_acl_inspecionar_acesso, mesa_di_logo_inspecionar_acesso_efetivo_fator_a_fator e mesa_shell_da_aplica_o_chat_de_texto` (secção "Ferramentas VTT") no mesmo estado, em tema escuro
- **THEN** todos os elementos obrigatórios da checklist de `design.md` D4 estão presentes, nenhum elemento excluído (à excepção do segmento Dados, agora implementado) foi implementado, e a classificação é **Fiel**

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
