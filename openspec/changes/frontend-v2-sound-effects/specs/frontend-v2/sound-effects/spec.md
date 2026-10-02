# Spec Delta

## Purpose

Avisa por som curto o utilizador quando lhe chega uma nova notificação e quando outra pessoa entra na chamada em que ele está, sem nunca ser a única forma de aviso e sem incomodar quem não o quer.

## ADDED Requirements

### Requirement: Som de nova menção
O sistema SHALL tocar o efeito sonoro de menção quando chega ao utilizador uma nova notificação em tempo real (menção ou resposta), exceto nos casos de supressão definidos neste spec. O aviso visual (sino e indicadores de não lido) SHALL manter-se igual, com ou sem som.

#### Scenario: Menção chega com a janela em segundo plano
- **WHEN** chega uma notificação nova e o separador está em segundo plano ou o utilizador está noutro canal
- **THEN** o efeito de menção toca uma vez e a notificação aparece no sino como antes

#### Scenario: Resposta também avisa
- **WHEN** a nova notificação é uma resposta a uma mensagem do utilizador
- **THEN** o mesmo efeito de menção toca

#### Scenario: Canal à vista e janela em foco
- **WHEN** a notificação é de um canal que o utilizador está a ver agora, com a janela em foco
- **THEN** nenhum som toca, porque a mensagem já está à vista

#### Scenario: Notificações já existentes não tocam
- **WHEN** a aplicação abre, reconecta ou recarrega a lista de notificações por pedido normal
- **THEN** nenhum som toca para notificações que já existiam

### Requirement: Som de chegada a uma chamada em andamento
O sistema SHALL tocar o efeito sonoro de chegada, ao utilizador que está ligado a uma chamada de voz/vídeo, quando outra pessoa entra nessa chamada. Não SHALL tocar para quem não está nessa chamada, para a entrada do próprio utilizador, nem para as pessoas que já estavam na chamada quando o utilizador entrou.

#### Scenario: Outra pessoa entra na minha chamada
- **WHEN** o utilizador está numa chamada ativa e uma pessoa que não estava nela passa a constar nos ocupantes
- **THEN** o efeito de chegada toca uma vez

#### Scenario: A minha própria entrada
- **WHEN** o utilizador entra numa chamada onde já há pessoas
- **THEN** nenhum som de chegada toca por causa dessas pessoas nem da sua própria entrada

#### Scenario: Chamada em que não estou
- **WHEN** outra pessoa entra numa chamada à qual o utilizador não está ligado, mesmo que a veja na sidebar
- **THEN** nenhum som toca

#### Scenario: Reconexão não repete
- **WHEN** a ligação em tempo real cai e volta e a lista de ocupantes é recarregada com as mesmas pessoas
- **THEN** nenhum som de chegada toca

### Requirement: Supressão e limite de frequência
O sistema SHALL não tocar nenhum efeito enquanto o utilizador estiver ensurdecido na chamada, e SHALL juntar uma rajada de eventos do mesmo efeito num único toque, deixando passar no máximo um toque do mesmo efeito a cada poucos segundos.

#### Scenario: Utilizador ensurdecido
- **WHEN** o utilizador está ensurdecido e chega uma menção ou entra alguém na chamada
- **THEN** nenhum som toca

#### Scenario: Rajada de menções
- **WHEN** chegam várias notificações em poucos segundos
- **THEN** o efeito de menção toca uma só vez para a rajada

#### Scenario: Várias pessoas entram juntas
- **WHEN** várias pessoas entram na chamada quase ao mesmo tempo
- **THEN** o efeito de chegada toca uma só vez

#### Scenario: Efeitos diferentes não se bloqueiam
- **WHEN** uma menção chega logo depois de alguém ter entrado na chamada
- **THEN** o efeito de menção toca mesmo assim

### Requirement: Saída de áudio e falhas silenciosas
O sistema SHALL tocar os efeitos na saída de áudio escolhida em Áudio & Vídeo quando o navegador permite escolher saída, e na saída por omissão caso contrário. Quando o navegador recusa a reprodução (por exemplo, por política de autoplay), ou quando o ficheiro de som não existe ou não carrega, o sistema SHALL falhar em silêncio, sem mensagem de erro e sem afetar a chamada, as notificações ou o resto da aplicação.

#### Scenario: Saída escolhida
- **WHEN** o utilizador escolheu uma saída específica em Áudio & Vídeo
- **THEN** os efeitos tocam nessa saída

#### Scenario: Saída guardada indisponível
- **WHEN** a saída guardada já não existe
- **THEN** os efeitos tocam na saída por omissão, sem erro

#### Scenario: Autoplay bloqueado
- **WHEN** o navegador recusa tocar o som porque o utilizador ainda não interagiu com a página
- **THEN** nenhum erro é mostrado, e os toques seguintes funcionam assim que o navegador o permitir

#### Scenario: Ficheiro em falta
- **WHEN** o ficheiro de um dos efeitos não está disponível
- **THEN** esse efeito não toca, nada é mostrado ao utilizador e o outro efeito continua a funcionar

### Requirement: Preferência de efeitos sonoros
O sistema SHALL permitir ligar ou desligar os efeitos sonoros, vindo ligados por omissão, guardar a escolha no dispositivo e respeitá-la imediatamente, sem recarregar. Com os efeitos desligados nenhum som SHALL tocar, exceto a pré-escuta pedida expressamente nas definições.

#### Scenario: Desligar
- **WHEN** o utilizador desliga os efeitos sonoros e chega uma menção
- **THEN** nenhum som toca, e a escolha continua desligada depois de recarregar a aplicação

#### Scenario: Primeira utilização
- **WHEN** o utilizador nunca alterou a preferência
- **THEN** os efeitos estão ligados

#### Scenario: Armazenamento indisponível
- **WHEN** o navegador bloqueia o armazenamento local
- **THEN** a preferência funciona durante a sessão e a aplicação não falha

### Requirement: Os efeitos nunca são o único aviso
O sistema SHALL manter inalterados todos os avisos visuais existentes (sino, contadores, roster de voz, PiP), de modo que a ausência de som, por qualquer motivo, não faça perder informação.

#### Scenario: Sem som, o aviso visual mantém-se
- **WHEN** os efeitos estão desligados, falham ou são suprimidos e chega uma menção
- **THEN** o sino de notificações mostra a menção exatamente como antes
