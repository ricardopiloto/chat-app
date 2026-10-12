# Spec Delta

## ADDED Requirements

### Requirement: Câmara, microfone e colar imagem funcionam de forma fiável

O sistema SHALL suportar captura de câmara e microfone (`getUserMedia`, usada para entrar em canais de voz/vídeo) e colar uma imagem da área de transferência (usada para anexar imagens no compositor de mensagens) com o mesmo nível de fiabilidade que o build web num browser comum, em todas as três plataformas — SHALL NOT depender de contornos específicos de hardware/driver para funcionar.

#### Scenario: Entrar numa chamada com câmara

- **WHEN** um utilizador com câmara disponível aprova o pedido de permissão e entra num canal de voz/vídeo
- **THEN** a chamada estabelece-se e a câmara é capturada, sem erro `NotAllowedError`/`SecurityError` nem falha de negociação de capacidades do dispositivo

#### Scenario: Colar imagem no compositor

- **WHEN** um utilizador cola (Ctrl+V) uma imagem copiada da área de transferência no campo de mensagem
- **THEN** a imagem é reconhecida como anexo, tal como já acontece no build web

## MODIFIED Requirements

### Requirement: A rede do shell permite ligar a qualquer instância configurada pelo utilizador

O sistema SHALL permitir que o tráfego de rede do cliente nativo (pedidos REST, ligação de tempo real, carregamento de imagens) alcance qualquer endereço que o utilizador configure como instância Mesa em runtime (ver `frontend-v2/instance-connect`), SHALL NOT restringir essas ligações a uma lista fixa de domínios conhecidos em build-time, e SHALL manter a configuração de segurança da janela sem abrir excepções além das necessárias para esse tráfego — em particular, SHALL NOT permitir que a janela carregue ou execute conteúdo de uma origem que não seja o próprio pacote da aplicação (`frontend/dist`) ou a instância configurada pelo utilizador.

#### Scenario: Ligação a uma instância qualquer

- **WHEN** o utilizador configura uma instância num endereço só conhecido em runtime (ex.: um IP de LAN ou um domínio próprio)
- **THEN** os pedidos REST, a ligação de tempo real, e o carregamento de imagens (avatares, anexos) alcançam esse endereço sem serem bloqueados pela configuração de rede do shell

#### Scenario: A janela nunca navega para conteúdo de terceiros

- **WHEN** a configuração de segurança da janela é inspeccionada
- **THEN** a única origem que a janela carrega como documento principal é o pacote da própria aplicação; pedidos de rede a partir desse documento para a instância configurada são permitidos, mas a janela não navega nem executa scripts de nenhuma outra origem

#### Scenario: CSP não abre excepções desnecessárias

- **WHEN** a configuração de rede/segurança do shell é inspeccionada (título mantido do requisito original; o mecanismo deixou de ser CSP do Tauri e passou a ser o âmbito da injecção de header do Electron — ver `design.md` Decisão 1)
- **THEN** a única excepção presente é a injecção do token de sessão nos pedidos dirigidos à origem da instância configurada — nenhuma outra origem recebe esse header, e nenhuma outra protecção de rede é relaxada além do necessário para esse tráfego
