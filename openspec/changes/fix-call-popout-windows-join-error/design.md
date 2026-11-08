# Design

## Context

`main.ts` guarda `popoutHandoff` antes de carregar a janela e anuncia abertura imediatamente; o renderer consome o handoff e chama `watch`. `watch` chama `voiceApi.popoutToken` e agrega qualquer falha em `problem=failed`. No Electron nativo, HTTP depende de `currentInstance().baseUrl/sessionToken`; a segunda janela tem estado de módulo próprio. A causa exacta no Windows ainda requer reprodução. Falha de inicialização de instância antes do pedido de token é uma hipótese forte, não um facto confirmado.

## Goals / Non-Goals

**Goals:** primeira abertura consistente no Windows e diagnóstico que distingue autenticação, ocupação, handoff e LiveKit.

**Non-Goals:** mudar o contrato do token ou usar a ligação principal na segunda janela.

## Decisions

### D1: Preparar dependências antes de ligar

No renderer do popout, esperar explicitamente `loadInstance()`/estado de sessão, obter handoff do canal correcto e só então pedir `popout-token`. Não anunciar o popout pronto até a janela aceitar o handoff; preservar a chamada principal durante tentativas. Alternativa: atraso fixo antes de `watch`; rejeitada porque depende da velocidade do Windows e da rede.

### D2: Erros classificados e recuperação limitada

Separar erro de sessão/ocupação, token e conexão LiveKit. Para falha transitória de preparação, uma nova tentativa limitada reobtém o token após confirmar que a chamada principal continua activa. Erro 403 por saída real não deve fazer loop. Alternativa: repetir cegamente todo o join; pode mascarar autorização negada.

## Risks / Trade-offs

- Falha real de rede ou revogação de sessão deve continuar visível e accionável.
- A hipótese de corrida precisa ser validada com logs de primeira abertura no Windows; não codificar uma espera arbitrária sem evidência.
