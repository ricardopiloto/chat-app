# Proposal

## Why

O frontend actual da Mesa (`frontend/`, SolidJS + tema "Nocturne"/"Mesa à Vela") vai ser substituído por um frontend v2 com um novo sistema de design ("Campfire Modernism"), mantendo 100% da paridade funcional com a v1 e sem alterar o backend. Esta é a **Fase 0 de 6** dessa reescrita faseada (ver `docs/v2/TR-frontend-v2.md`): antes de construir qualquer tela de produto (autenticação, chat, voz/vídeo, definições), é preciso existir um projecto novo com tokens de design, biblioteca de componentes base e os clientes de API/WS/i18n escritos de raiz — sem isso, as 5 fases seguintes não têm uma base comum para construir em cima, e cada uma reinventaria tokens/componentes de forma inconsistente.

## What Changes

- Cria um projecto novo `frontend-v2/` (Vite + SolidJS + TypeScript), **paralelo** ao `frontend/` actual — a v1 continua em produção sem alterações durante toda a reescrita.
- Introduz o sistema de tokens de design "Campfire Modernism" (cor dark+light, tipografia, espaçamento, raio, elevação, breakpoints responsivos) como variáveis consumíveis, reconciliando a divergência encontrada entre os 29 mockups de produto e o guia de componentes (ver `docs/v2/TR-frontend-v2.md` §6.3/§7.4) — os 29 mockups de produto são a fonte de verdade.
- Introduz uma biblioteca base de componentes de UI sem lógica de negócio (botão, campo de texto, radio, checkbox, switch, select, diálogo, toast, menu de contexto, avatar, badge/chip, tooltip), usando Material Symbols Outlined como sistema de ícones.
- Escreve de raiz o cliente REST e o cliente WebSocket de `frontend-v2/`, derivados dos contratos do backend (`backend/src`, `README.md`) — os mesmos 59 endpoints e o mesmo protocolo de eventos — **sem nenhuma mudança de contrato com o backend** e sem partir do cliente da v1.
- Desenha e implementa de raiz o motor de i18n (pt-BR/en); os catálogos de texto ficam como estrutura vazia/stub nesta fase (são populados pelas fases 1-5, conforme cada uma entrega as suas telas).
- Especifica os **contratos de formato criptográfico** (cofre de identidade, envelope de chave de servidor, chave de canal, cifra de mensagem e anexo) em `docs/v2/contracts/` com vectores de teste, para que as fases seguintes os implementem sem consultar o código da v1.
- Estabelece os **portões de qualidade** das fases seguintes: medição de sobreposição de código com a v1 e protocolo de comparação de fidelidade visual com os mockups.
- Aplica a marca (`docs/v2/mesa_logo`) e a camada de identidade tipográfica mono dos mockups.
- **Fora desta fase**: qualquer tela de produto (login, shell de navegação, chat, voz/vídeo, definições de servidor) — essas são as Fases 1 a 5, cada uma com o seu próprio change OpenSpec.
- **Fora de escopo em todas as fases** (decisão já tomada, ver `docs/v2/TR-frontend-v2.md` §7 e §10): qualquer arquitectura de identidade/criptografia MLS/RFC 9420, gestão de múltiplos dispositivos com atestação de hardware, ou Passkeys/FIDO2 — a v2 mantém o modelo de criptografia existente (identidade NaCl, cofre Argon2id, chave de servidor por envelope, chave de canal de voz com custódia) por compatibilidade com contas reais, implementado de raiz nas fases seguintes a partir de `docs/v2/contracts/`.

## Capabilities

### New Capabilities
- `frontend-v2/foundation`: scaffold do projecto `frontend-v2/`, sistema de tokens de design (cor/tipografia/espaçamento/raio/elevação/breakpoints) em modo claro e escuro, biblioteca base de componentes de UI sem lógica de negócio, cliente REST/WS e motor de i18n escritos de raiz, contratos de formato criptográfico, portões de paridade/fidelidade/independência, critério de aceite de build/run sem telas de produto.

- `frontend-v2/v1-independence`: independência verificável do frontend v1 (sem reaproveitamento de código, estrutura ou estilos).
- `frontend-v2/crypto-contracts`: contratos de formato criptográfico e vectores de teste.
- `frontend-v2/visual-fidelity`: fidelidade visual aos mockups como critério de aceite por tela.
- `frontend-v2/brand-identity`: logo oficial e camada tipográfica mono dos mockups.
- `frontend-v2/functional-parity`: paridade funcional total e política de alteração de backend.

### Modified Capabilities
_Nenhuma — não existem specs prévias no projecto (`openspec/specs/` está vazio); este é o primeiro change de uma série de 6 que vai popular `openspec/specs/frontend-v2/*`._

## Impact

- **Código novo**: todo sob `frontend-v2/` (diretório novo). `frontend/` (v1) não é tocado.
- **Backend**: nenhum impacto — os clientes REST/WS consomem os mesmos contratos já documentados em `README.md` (endpoints `/api/*`, `/ws`, cookie de sessão `SameSite=Strict`).
- **Infra/deploy**: nenhum impacto nesta fase — `frontend-v2/` não é apontado por nenhum Nginx/deploy ainda; a decisão de corte/roteamento fica para a Fase 5 (`frontend-v2-polish-cutover`).
- **Dependências**: mesma stack tecnológica da v1 (`solid-js`, `@solidjs/router`, `vite`, `typescript`, `livekit-client`, `@livekit/track-processors`, `tweetnacl`, `@noble/hashes`, `hash-wasm`), sem bibliotecas novas nesta fase. Reutilizar a stack é escolha de dependências, não de código do frontend v1.
- **Fases seguintes**: `frontend-v2-auth-shell`, `frontend-v2-server-admin`, `frontend-v2-text-chat`, `frontend-v2-voice-video`, `frontend-v2-polish-cutover` — todas dependem desta fundação existir e ser aceite antes de arrancar.

## Revisão: reescrita do zero e fidelidade visual (2026-10-01)

Esta revisão resulta de `docs/v2/AUDIT-fidelity.md`, que concluiu que o frontend v2 entregue até aqui adoptou os tokens do design mas **não** a interface desenhada, e que grande parte do código descende da v1 (59% em média; 87–100% na voz/vídeo). Passam a valer quatro regras, transversais a todas as fases:

1. **Independência do frontend v1.** Nada de `frontend/` é reaproveitado: nenhum ficheiro, componente, folha de estilo, hook, estrutura de pastas nem decisão de implementação é copiado, adaptado ou usado como modelo, e `frontend/` não é lido para implementar. O que permanece da v1 é **só o backend** (contratos REST/WS, regras de acesso e modelo de dados), nos pontos em que é necessário e reaproveitável sem alteração. A aplicação v1 em execução pode ser usada como caixa-preta para observar comportamento de produto. Formatos criptográficos persistidos (cofre de identidade, envelope de chave de servidor, chave de canal, cifra de mensagem/anexo) são **contratos de dados** com contas existentes: são especificados em `docs/v2/contracts/` com vectores de teste (ver `frontend-v2-foundation`) e a v2 implementa a partir dessa especificação.
2. **Fidelidade visual por tela.** Uma tela só é dada como concluída quando comparada lado a lado com o `screen.png` do mockup correspondente, cumpre a lista de elementos obrigatórios do design deste change e obtém a classificação **Fiel** na escala de `docs/v2/AUDIT-fidelity.md` §2. A comparação fica registada em `verification.md`. Elementos desenhados nos mockups mas fora de escopo (AUDIT §6) não contam como em falta.

3. **Paridade funcional total.** Todas as funcionalidades que a aplicação tem hoje continuam a funcionar na v2, sem exceção. O inventário de referência é `docs/design-system/stitch-prompt.md` §3 mais o comportamento observável da v1 em execução, consolidado em `docs/v2/parity-checklist.md` (ver `frontend-v2-foundation`). Cada change verifica as funcionalidades da sua área contra essa checklist; uma funcionalidade só pode ser omitida se estiver explicitamente excluída do escopo (`docs/v2/TR-frontend-v2.md` §4.2 e §7). Renovar a interface nunca é motivo para retirar uma funcionalidade existente.
4. **Backend só muda por necessidade do frontend.** O backend da v1 é reaproveitado como está. Uma alteração de backend só é admitida quando um requisito do frontend v2 a exige e não há alternativa no cliente; nesse caso é uma tarefa explícita neste change, com o contrato actualizado em `docs/v2/contracts/`, compatível com a v1 enquanto o rollback for possível (alterações aditivas) e verificada com os testes de backend existentes (`cargo test`).

**Consequência para o estado actual:** o código existente em `frontend-v2/` para esta fase é descartável e será substituído; as tarefas foram reabertas e as `verification.md` anteriores ficam como histórico superado.
