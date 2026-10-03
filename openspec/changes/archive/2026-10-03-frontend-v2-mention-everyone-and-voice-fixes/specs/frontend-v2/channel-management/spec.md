# Spec Delta

## ADDED Requirements

### Requirement: Acesso por omissão e exclusividade dos canais
O sistema SHALL dar, por omissão, a todo o membro de um servidor, tenha ou não um cargo atribuído, acesso para ver e enviar mensagens em qualquer canal de texto e para entrar, falar e ligar a câmara em qualquer canal de voz. Este acesso SHALL só ser reduzido quando o canal é privado ou tem regras de acesso (criadas por quem criou o canal, pelo dono, ou por quem tem permissão de gerir canais com cargo acima do criador), quando o cargo da pessoa retira a permissão de enviar mensagens, falar ou ligar à voz, ou quando a pessoa está silenciada no canal. Tornar um canal exclusivo de cargos ou membros específicos SHALL ser feito com a visibilidade privada e regras de permitir.

#### Scenario: Membro sem cargo num canal de texto público
- **WHEN** um membro sem cargo abre um canal de texto público
- **THEN** vê as mensagens e pode enviar mensagens

#### Scenario: Membro sem cargo num canal de voz público
- **WHEN** um membro sem cargo abre um canal de voz público
- **THEN** pode entrar na chamada, falar e ligar a câmara

#### Scenario: Membro sem cargo anexa imagens
- **WHEN** um membro sem cargo escreve num canal de texto público
- **THEN** o botão de anexar imagens está disponível, porque anexar ficheiros também vem ligado por omissão

#### Scenario: Canal exclusivo
- **WHEN** quem criou o canal o torna privado e permite só o cargo "Mestres"
- **THEN** só os membros com esse cargo (e o dono) veem e usam o canal; os restantes nem o veem na lista

#### Scenario: Cargo sem permissão
- **WHEN** o cargo de um membro não inclui enviar mensagens
- **THEN** esse membro vê os canais de texto mas o composer aparece como somente leitura
