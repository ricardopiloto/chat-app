# Proposal

## Why

`frontend/src/voice/VoicePage.tsx` entra automaticamente na chamada sempre que o componente monta para um canal de voz acessível (comentário no topo do arquivo: "A voice channel joins once when its keyed screen mounts"), sem distinguir entre a pessoa a navegar para o canal agora mesmo e a aplicação a abrir já com essa rota activa. Como a rota vem directamente da URL do browser (`useLocation()`), qualquer recarregamento da página, reabertura de uma aba restaurada pelo browser, ou link profundo que aponte para um canal de voz dispara o mesmo `join()` automático — reconectando a pessoa a uma chamada (com o microfone ligado, se essa for a preferência guardada) sem nenhuma acção explícita dela nesse momento. O fecho da aba/app já liberta o lugar correctamente no servidor (`callSession.tsx`, handler de `pagehide`), mas nada no cliente impede reentrar sozinho ao reabrir. O utilizador pede que isto nunca aconteça sem o seu consentimento explícito.

## What Changes

- `VoicePage` só entra automaticamente na chamada quando o canal de voz é alcançado por uma navegação ocorrida **durante a sessão já aberta da aplicação** (ex.: clicar num canal de voz na sidebar, comportamento actual de `direct-join-call-entry`, inalterado). Quando o canal de voz já é a rota activa no primeiro render da aplicação nesse carregamento de página — recarregar com a URL já nessa rota, reabrir uma aba restaurada pelo browser, ou abrir um link directo para o canal — a entrada automática **não** acontece; em vez disso, aparece um modal pedindo confirmação explícita, com as opções de entrar ou recusar, antes de qualquer ligação ao LiveKit. Ao recusar, a pessoa é levada para o primeiro canal de texto do servidor em que estava (ou para a vista do servidor, sem canal, se ele não tiver nenhum canal de texto).
- **BREAKING (comportamento do requirement existente):** `openspec/specs/frontend-v2/voice-session/spec.md`, requirement "Pré-entrada com escolha de participação", hoje diz "O sistema SHALL entrar automaticamente numa chamada ao abrir um canal de voz acessível, sem pré-entrada nem confirmação" sem excepção — esta change acrescenta a excepção do carregamento de página com a rota já activa, mantendo a entrada automática para navegação dentro da sessão.
- Sem mudança no popout nativo (`CallPopoutWindow.tsx`): ele liga-se a uma chamada já em curso via `call.watch(...)`, accionado apenas por uma acção explícita dentro da sessão (abrir o popout), nunca por restauração de rota no arranque — fora do escopo desta change.
- Sem mudança no comportamento do servidor nem na libertação do lugar ao fechar a aba (`pagehide`) — já correcto hoje.

## Capabilities

### Modified Capabilities
- `frontend-v2/voice-session`: o requirement "Pré-entrada com escolha de participação" passa a excluir a entrada automática quando o canal de voz já é a rota activa no primeiro carregamento da página, exigindo confirmação explícita nesse caso.

## Impact

- `frontend/src/voice/VoicePage.tsx`: `onMount` precisa de um sinal que diga se esta rota já era a activa no arranque desta execução da página (antes de qualquer navegação interna), para decidir entre `join()` automático e um novo modal de confirmação explícita com opção de recusar.
- Possivelmente `frontend/src/shell/state.tsx` ou um novo módulo pequeno, para expor esse sinal de "rota de arranque" de forma reutilizável (capturado uma única vez, fora da reactividade da rota actual).
- `frontend/src/components/ui/Overlay.tsx` (`Dialog`, já existente): reutilizado para o modal, sem mudança no componente em si.
- `frontend/src/i18n/catalogs/voice.en.ts`/`voice.pt-BR.ts`: chaves novas para o título/corpo do modal e os rótulos de entrar/recusar.
- Nenhuma mudança de backend, API ou infra-estrutura.
