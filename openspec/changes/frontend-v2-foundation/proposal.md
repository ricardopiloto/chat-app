# Proposal

## Why

O frontend actual da Mesa (`frontend/`, SolidJS + tema "Nocturne"/"Mesa à Vela") vai ser substituído por um frontend v2 com um novo sistema de design ("Campfire Modernism"), mantendo 100% da paridade funcional com a v1 e sem alterar o backend. Esta é a **Fase 0 de 6** dessa reescrita faseada (ver `docs/v2/TR-frontend-v2.md`): antes de construir qualquer tela de produto (autenticação, chat, voz/vídeo, definições), é preciso existir um projecto novo com tokens de design, biblioteca de componentes base e os clientes de API/WS/i18n portados — sem isso, as 5 fases seguintes não têm uma base comum para construir em cima, e cada uma reinventaria tokens/componentes de forma inconsistente.

## What Changes

- Cria um projecto novo `frontend-v2/` (Vite + SolidJS + TypeScript), **paralelo** ao `frontend/` actual — a v1 continua em produção sem alterações durante toda a reescrita.
- Introduz o sistema de tokens de design "Campfire Modernism" (cor dark+light, tipografia, espaçamento, raio, elevação, breakpoints responsivos) como variáveis consumíveis, reconciliando a divergência encontrada entre os 29 mockups de produto e o guia de componentes (ver `docs/v2/TR-frontend-v2.md` §6.3/§7.4) — os 29 mockups de produto são a fonte de verdade.
- Introduz uma biblioteca base de componentes de UI sem lógica de negócio (botão, campo de texto, radio, checkbox, switch, select, diálogo, toast, menu de contexto, avatar, badge/chip, tooltip), usando Material Symbols Outlined como sistema de ícones.
- Porta o cliente REST e o cliente WebSocket para `frontend-v2/`, consumindo os mesmos 59 endpoints e o mesmo protocolo de eventos que a v1 já usa — **sem nenhuma mudança de contrato com o backend**.
- Porta o motor de i18n (pt-BR/en) para `frontend-v2/`; os catálogos de texto ficam como estrutura vazia/stub nesta fase (são populados pelas fases 1-5, conforme cada uma entrega as suas telas).
- **Fora desta fase**: qualquer tela de produto (login, shell de navegação, chat, voz/vídeo, definições de servidor) — essas são as Fases 1 a 5, cada uma com o seu próprio change OpenSpec.
- **Fora de escopo em todas as fases** (decisão já tomada, ver `docs/v2/TR-frontend-v2.md` §7 e §10): qualquer arquitectura de identidade/criptografia MLS/RFC 9420, gestão de múltiplos dispositivos com atestação de hardware, ou Passkeys/FIDO2 — a v2 mantém o modelo de criptografia da v1 (identidade NaCl, cofre Argon2id, chave de servidor por envelope, chave de canal de voz com custódia), cuja lógica será portada nas fases seguintes conforme necessário.

## Capabilities

### New Capabilities
- `frontend-v2/foundation`: scaffold do projecto `frontend-v2/`, sistema de tokens de design (cor/tipografia/espaçamento/raio/elevação/breakpoints) em modo claro e escuro, biblioteca base de componentes de UI sem lógica de negócio, porte do cliente REST/WS e do motor de i18n, critério de aceite de build/run sem telas de produto.

### Modified Capabilities
_Nenhuma — não existem specs prévias no projecto (`openspec/specs/` está vazio); este é o primeiro change de uma série de 6 que vai popular `openspec/specs/frontend-v2/*`._

## Impact

- **Código novo**: todo sob `frontend-v2/` (diretório novo). `frontend/` (v1) não é tocado.
- **Backend**: nenhum impacto — os clientes REST/WS portados consomem os mesmos contratos já documentados em `README.md` (endpoints `/api/*`, `/ws`, cookie de sessão `SameSite=Strict`).
- **Infra/deploy**: nenhum impacto nesta fase — `frontend-v2/` não é apontado por nenhum Nginx/deploy ainda; a decisão de corte/roteamento fica para a Fase 5 (`frontend-v2-polish-cutover`).
- **Dependências**: mesma stack da v1 (`solid-js`, `@solidjs/router`, `vite`, `typescript`, `livekit-client`, `@livekit/track-processors`, `tweetnacl`, `@noble/hashes`, `hash-wasm`), sem bibliotecas novas nesta fase.
- **Fases seguintes**: `frontend-v2-auth-shell`, `frontend-v2-server-admin`, `frontend-v2-text-chat`, `frontend-v2-voice-video`, `frontend-v2-polish-cutover` — todas dependem desta fundação existir e ser aceite antes de arrancar.
