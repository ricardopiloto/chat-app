# Checklist de paridade funcional — frontend v2

Regra (`frontend-v2-foundation`, capability `functional-parity`): **todas as funcionalidades da aplicação actual continuam a funcionar na v2**, salvo as excluídas do escopo com referência (secção 12). O backend é reaproveitado sem alteração; uma alteração só entra se um requisito do frontend a exigir (regra 4 da revisão, ver `docs/v2/contracts/backend-change-policy.md`).

**Fontes**: `docs/design-system/stitch-prompt.md` §3–§5; `README.md`; rotas em `backend/src/api/mod.rs` e `backend/src/api/auth/mod.rs`; contratos `specs/002-fase-1-mvp/contracts/` (`rest-api.yaml`, `ws-events.md`); observação da v1 em execução como caixa-preta.

**Fases**: F = `frontend-v2-foundation`, A = `frontend-v2-auth-shell`, S = `frontend-v2-server-admin`, T = `frontend-v2-text-chat`, V = `frontend-v2-voice-video`, P = `frontend-v2-polish-cutover`.

**Verificação**: coluna "Critério" é o que se observa na v2 contra o mesmo backend. A coluna "Estado" é preenchida por cada fase em `verification.md` (V = verificado contra a aplicação anterior).

## 1. Autenticação e identidade

| ID | Funcionalidade | API / evento | Fase | Critério | Estado |
|---|---|---|---|---|---|
| AUT-01 | Registar conta (handle + password ≥ 8) | `POST /api/auth/register` | A | Conta criada, sessão activa | V (auth-shell) |
| AUT-02 | Registar com código de convite (campo, `/invite/:code`, `?invite=`) | `POST /api/auth/register` (`invite_code`) | A | Código pré-preenchido e editável; convite inválido dá erro traduzido | V (auth-shell) |
| AUT-03 | Iniciar sessão | `POST /api/auth/login` | A | Sessão por cookie `Session` | V (auth-shell) |
| AUT-04 | Terminar sessão com confirmação | `POST /api/auth/logout` | A | Só termina após confirmar | V (auth-shell) |
| AUT-05 | Obter conta actual / restaurar sessão ao recarregar | `GET /api/auth/me` | A | Recarregar mantém a sessão | V (auth-shell) |
| AUT-06 | Gerar identidade e guardar cofre cifrado (local + remoto) | `PUT /api/auth/identity-vault` | A | Nenhum pedido leva a chave secreta em claro | V (auth-shell) |
| AUT-07 | Login em dispositivo com cofre local | — | A | Só pede a password | V (auth-shell) |
| AUT-08 | Desbloquear em dispositivo novo (cofre remoto) | `GET /api/auth/me` (`identity_vault`) | A | Três estados: cofre remoto, sem cofre, password errada | V (auth-shell) |
| AUT-09 | Recuperar identidade (nova identidade) | `PUT /api/auth/identity` | A | Acção sempre visível no desbloqueio | V (auth-shell) |
| AUT-10 | Trocar de conta | `POST /api/auth/logout` | A | Limpa sessão e volta ao login | V (auth-shell) |
| AUT-11 | Mostrar/ocultar password | — | A | Alternância funciona | V (auth-shell) |
| AUT-12 | Mensagens de erro inline (credenciais, sessão expirada, cofre em falta) | — | A | Erros distintos e traduzidos | V (auth-shell) |

## 2. Conta e perfil

| ID | Funcionalidade | API / evento | Fase | Critério | Estado |
|---|---|---|---|---|---|
| CTA-01 | Editar nome a mostrar | `PATCH /api/auth/display-name` | A | Reflectido em painel, membros e mensagens; handle intacto | V (auth-shell) |
| CTA-02 | Enviar avatar (JPEG/PNG/WebP ≤ 1 MiB) | `PUT /api/auth/avatar` | A | Validação antes de enviar; avatar actualizado | V (auth-shell) |
| CTA-03 | Remover avatar | `DELETE /api/auth/avatar` | A | Volta às iniciais | V (auth-shell) |
| CTA-04 | Mostrar avatar de qualquer conta | `GET /api/accounts/{id}/avatar` | A | Imagem ou iniciais | V (auth-shell) |
| CTA-05 | Idioma pt-BR / en, persistente | — | F, A | Troca sem recarregar; lembrado | V (auth-shell) |
| CTA-06 | Tema Sistema / Claro / Escuro, persistente | — | A | Três estados; Sistema segue o SO | V (auth-shell) |

## 3. Shell e navegação

| ID | Funcionalidade | API / evento | Fase | Critério | Estado |
|---|---|---|---|---|---|
| SHL-01 | Listar servidores no rail | `GET /api/servers` | A | Imagem ou iniciais, activo marcado | V (auth-shell) |
| SHL-02 | Imagem do servidor | `GET /api/servers/{id}/image` | A | Imagem ou iniciais | V (auth-shell) |
| SHL-03 | Indicadores de não lido e voz activa por servidor | WS `message.new`, `voice.occupancy` | A | Actualizam sem recarregar | V (auth-shell) |
| SHL-04 | Listar canais (Texto / Voz-vídeo) | `GET /api/servers/{id}/channels` | A | Duas secções, navegáveis | V (auth-shell) |
| SHL-05 | Cadeado em canais privados | — | A | Visível independentemente do acesso | V (auth-shell) |
| SHL-06 | Estados vazios (sem servidores, sem canais, sem canal escolhido) | — | A | Mensagem própria por estado | V (auth-shell) |
| SHL-07 | Presença de membros | `GET /api/servers/{id}/presence`, WS `presence` (`online_account_ids`) | A | Online/offline em tempo real | V (auth-shell) |
| SHL-08 | Painel de Membros alternável | `GET /api/servers/{id}/members` | A | Agrupado, contagem online | V (auth-shell) |
| SHL-09 | Gaveta mobile (< 768 px) | — | A, P | Abre/fecha por botão e backdrop | V (auth-shell) |
| SHL-10 | Menu de contexto por clique-direito e toque-longo | — | F, S | Variante "perigosa" | |
| SHL-11 | Faixa de ligação (reconexão do WS) | WS | A, T | Aviso não-modal enquanto reconecta | V (auth-shell) |
| SHL-12 | Convite e definições a partir do cabeçalho da sidebar | — | A, S | Abrem os diálogos/páginas | parcial: afordâncias (A); diálogos em S |
| SHL-13 | Versão da instância visível | — | A | Mostrada na topbar | V (auth-shell) |

## 4. Servidores

| ID | Funcionalidade | API / evento | Fase | Critério | Estado |
|---|---|---|---|---|---|
| SRV-01 | Criar servidor (nome + chave gerada, custódia obrigatória) | `POST /api/servers` | S | Botão bloqueado sem checkbox; cria canal de texto e de voz | |
| SRV-02 | Copiar chave com feedback "Copiado" | — | S | Feedback temporário | |
| SRV-03 | Apagar servidor confirmando o nome | `DELETE /api/servers/{id}` | S | Botão só activa com o nome exacto | |
| SRV-04 | Evento de servidor apagado limpa selecção | WS `server.deleted` | S | Sai do servidor | |
| SRV-05 | Imagem do servidor: enviar / remover (JPEG/PNG/WebP ≤ 1 MiB) | `PUT/DELETE /api/servers/{id}/image` | S | Validação local | |
| SRV-06 | Boas-vindas: canal e modelo | `GET/PATCH /api/servers/{id}/welcome` | S | Guardar com toast; mensagem publicada ao entrar | |
| SRV-07 | Landing de definições (Visão geral) | — | S | Abre populada | |
| SRV-08 | Listar membros com pesquisa | `GET /api/servers/{id}/members` | S | Filtra por handle/nome | |
| SRV-09 | Alterar cargo de membro | `PUT /api/servers/{id}/members/{account}/role` | S | Reflectido na lista; dono sem controlo | |
| SRV-10 | Remover membro | `DELETE /api/servers/{id}/members/{account}` | S | Dono não removível | |
| SRV-11 | Listar cargos | `GET /api/servers/{id}/roles` | S | Ordem e contagem | |
| SRV-12 | Criar cargo | `POST /api/servers/{id}/roles` | S | Aparece na lista | |
| SRV-13 | Reordenar cargos | `PUT /api/servers/{id}/roles/positions` | S | ↑/↓; sistema bloqueado | |
| SRV-14 | Editar permissões do cargo (Geral/Texto/Voz) | `PATCH /api/servers/{id}/roles/{role}` | S | Afecta acesso real; sistema só-leitura | |
| SRV-15 | Apagar cargo com aviso | `DELETE /api/servers/{id}/roles/{role}` | S | Avisa sobre membros associados | |
| SRV-16 | Atribuir membros a um cargo | `PUT /api/servers/{id}/roles/{role}/members` | S | Lista de membros do cargo actualiza | |
| SRV-17 | Criar convite (dois passos) | `POST /api/servers/{id}/invites` | S | Escolhe canal de boas-vindas se faltar; URL copiável | |
| SRV-18 | Pré-visualizar convite sem sessão | `GET /api/invites/{code}` | S | Nome, histórico, inválido/expirado | |
| SRV-19 | Aceitar convite com registo inline ou com sessão | `POST /api/invites/{code}/accept` | S | Entra no servidor | |
| SRV-20 | Aviso de convite consumido | WS `invite.consumed` | S | Reflecte o uso | |

## 5. Canais

| ID | Funcionalidade | API / evento | Fase | Critério | Estado |
|---|---|---|---|---|---|
| CHN-01 | Criar canal de texto ou voz (visibilidade, "visível a novos") | `POST /api/servers/{id}/channels` | S | Voz exige custódia | |
| CHN-02 | Obter canal | `GET /api/channels/{id}` | S, T, V | Dados e permissão do utilizador | |
| CHN-03 | Renomear inline (hífens, 32 caracteres) | `PATCH /api/channels/{id}` | S | Normaliza e persiste | |
| CHN-04 | Apagar canal; 409 `last_channel_of_type` explicado | `DELETE /api/channels/{id}` | S | Mensagem clara | |
| CHN-05 | Evento de canal apagado | WS `channel.deleted` | S, T, V | Sai do canal | |
| CHN-06 | ACL: visibilidade e regras (membro/cargo/todos, efeito, nível) | `GET/PUT /api/channels/{id}/acl` | S | Adicionar e remover regras | |
| CHN-07 | Inspector de acesso efectivo | `GET /api/channels/{id}/access/{account}` | S | Veredito e precedência | |
| CHN-08 | Silenciar membro (5/10/15/30 min ou custom) | `PUT /api/channels/{id}/mutes/{account}` | S | Tempo restante visível | |
| CHN-09 | Dessilenciar | `DELETE /api/channels/{id}/mutes/{account}` | S | Imediato | |
| CHN-10 | Listar silenciamentos | `GET /api/channels/{id}/mutes` | S | Mostra quem está silenciado | |
| CHN-11 | Saber se eu estou silenciado | `GET /api/channels/{id}/mutes/me` | S, T | Composer mostra "silenciado até" | |
| CHN-12 | Membros mencionáveis do canal | `GET /api/channels/{id}/mentionables` | T | Autocompletar de menção | |
| CHN-13 | Mudança de papéis de canal | WS `channel_role.changed` | S | Actualiza permissões | |

## 6. Chat de texto

| ID | Funcionalidade | API / evento | Fase | Critério | Estado |
|---|---|---|---|---|---|
| TXT-01 | Listar mensagens e decifrar | `GET /api/channels/{id}/messages` | T | Texto legível; só ciphertext na rede | |
| TXT-02 | Enviar mensagem cifrada | `POST /api/channels/{id}/messages` | T | Pedido só com `content_ciphertext` | |
| TXT-03 | Nova mensagem em tempo real | WS `message.new` | T | Aparece sem recarregar | |
| TXT-04 | Agrupar por remetente; separadores de dia com marcador fixo | — | T | Avatar uma vez por grupo; Hoje/Ontem/data | |
| TXT-05 | Responder com citação (cancelável) | `POST …/messages` | T | Citação truncada na resposta | |
| TXT-06 | Apagar mensagem por permissão | `DELETE /api/channels/{id}/messages/{id}`, WS `message.deleted` | T | Autor, criador do canal, dono ou permissão | |
| TXT-07 | Menções clicáveis só se resolvem a membro real | — | T | Inválidas como texto | |
| TXT-08 | Anexar imagens por ficheiro e colar; várias; limite; miniaturas removíveis | `POST /api/channels/{id}/attachments` | T | Cifra antes de enviar | |
| TXT-09 | Mostrar anexos decifrados | `GET /api/attachments/{id}` | T | Miniatura legível | |
| TXT-10 | Lightbox: zoom, download, navegação, fecho por Esc/botão/fundo, arrastar ampliado | — | T | Os três fechos | |
| TXT-11 | Pré-visualização de links (até 5) | `POST /api/unfurl` | T | Miniatura, site, título, "Vídeo" | |
| TXT-12 | Autocompletar `@` e `:shortcode:`; selector de emoji pesquisável | — | T | Teclado e selecção | |
| TXT-13 | Composer "somente leitura" e "silenciado até HH:MM" | — | T | Substitui o composer | |
| TXT-14 | Saltar para o presente com contagem | — | T | Rola e oculta | |
| TXT-15 | Marcar canal como lido | `PUT /api/channels/{id}/read` | T | Limpa não lidos | |
| TXT-16 | Recuperar mensagens após reconexão | `GET …/messages` | T | Sem lacunas | |
| TXT-17 | Linhas de sistema (boas-vindas a novo membro) | — | T | Centradas | |
| TXT-18 | Chip E2EE ligada no cabeçalho do canal de texto | — | T | Sempre ligada | |

## 7. Pesquisa e notificações

| ID | Funcionalidade | API / evento | Fase | Critério | Estado |
|---|---|---|---|---|---|
| NTF-01 | Pesquisa livre em todos os canais de texto, decifrando no cliente | — | T | Agrupada por servidor · canal | |
| NTF-02 | Pesquisa `#canal termo` | — | T | Só esse canal | |
| NTF-03 | Estados vazios diferenciados | — | T | Não encontrado / voz / sem resultados | |
| NTF-04 | Atalho Ctrl/Cmd+F pré-preenchido | — | T | Abre com o canal actual | |
| NTF-05 | Notificações de menção/resposta persistentes | `GET /api/notifications`, WS `notification.created` | T | Persistem até a mensagem ser vista | |
| NTF-06 | Marcar notificação como lida | `POST /api/notifications/{id}/read` | T | Ao ver a mensagem | |
| NTF-07 | Marcar todas como lidas (acção "Limpar") | `POST /api/notifications/read-all` | T | Limpa a secção persistente | |
| NTF-08 | Canais com novidade (efémeros) | WS `message.new` | T | Só na sessão actual | |
| NTF-09 | Deep-link para a mensagem | — | T | Navega, rola e destaca | |
| NTF-10 | Indicador de novidade na topbar | — | A, T | Reflecte existência | |

## 8. Voz e vídeo

| ID | Funcionalidade | API / evento | Fase | Critério | Estado |
|---|---|---|---|---|---|
| VOZ-01 | Entrar (câmara/microfone conforme preferência) | `POST /api/channels/{id}/voice/join` | V | Token LiveKit; ocupação actualizada | |
| VOZ-02 | Testar vídeo (faixa sintética) | `POST …/voice/join` | V | Câmara física intocada | |
| VOZ-03 | Entrar (ouvir) para quem só pode ouvir | `POST …/voice/join` | V | Única opção; sem mic/câmara | |
| VOZ-04 | Entrada só áudio quando a câmara falha ou é negada | — | V | Aviso e entra sem vídeo | |
| VOZ-05 | Sair e libertar câmara/microfone | `POST …/voice/leave` | V | Hardware libertado; saída garantida ao fechar o separador | |
| VOZ-06 | Mudar de canal de voz sai do anterior | — | V | Pré-entrada no destino | |
| VOZ-07 | Heartbeat e estado de media (mic/cam/ecrã) | `PATCH …/voice/media` | V | Roster reflecte | |
| VOZ-08 | Ocupação por servidor e roster na sidebar | `GET /api/servers/{id}/voice-occupancy`, WS `voice.occupancy` | V | Visível sem abrir o canal | |
| VOZ-09 | Controlos no painel: microfone, ensurdecer, câmara, partilha (só Grade), terminar | — | V | Só durante a chamada | |
| VOZ-10 | Microfone desactivado com explicação para ouvintes | — | V | Mensagem de permissão | |
| VOZ-11 | Blur de câmara (sem/leve/forte) com erro inline | — | V | Tempo real | |
| VOZ-12 | Indicadores de fala em palco, grade e roster | — | V | Sincronizados | |
| VOZ-13 | Duração da chamada | `voice.occupancy` (`call_started_at`) | V | Cronómetro | |
| VOZ-14 | Chip E2EE e faixa permanente "E2EE desligada" | WS `channel.e2ee_changed` | V | Faixa visível toda a chamada | |
| VOZ-15 | Religar E2EE com chave do canal | `POST …/voice/e2ee` | V | Chave certa religa; errada dá erro | |
| VOZ-16 | Composição: 3 layouts, 2–8 posições, banco | `GET …/grid`, WS `grid.updated` | V | Banco para sem posição | |
| VOZ-17 | Editor de cena: atribuir, devolver, nº de posições com escolha de remoção, layout, confirmação | `PUT …/grid`, WS `scene.changed` | V | Cancelar/Descartar/Guardar | |
| VOZ-18 | Cena única editável por canal | `GET …/scenes` | V | Sem lista de cenas | |
| VOZ-19 | Grade: câmaras e partilhas, cor de assento, glow de fala | — | V | Actualiza sozinha | |
| VOZ-20 | Partilha de ecrã (só Grade) com indicador | — | V | Tile "Tela" | |
| VOZ-21 | Destaque de partilha sem interromper | — | V | Promover e despromover | |
| VOZ-22 | PiP: visível fora do canal, até 4 câmaras, duração, arrastar com cantos e memória, voltar, terminar | — | V | Sem expandir primeiro | |
| VOZ-23 | Áudio remoto continua ao navegar | — | V | Sem corte | |
| VOZ-24 | Saída automática se canal/servidor for apagado | WS `channel.deleted`, `server.deleted` | V | Sai da chamada | |
| VOZ-25 | Chave de canal obtida do dispositivo ou do envelope do servidor | `GET …/key-envelopes/me` | V | Entra com E2EE | |

## 9. Chaves e custódia

| ID | Funcionalidade | API / evento | Fase | Critério | Estado |
|---|---|---|---|---|---|
| CRP-01 | Publicar envelope de chave do servidor para um membro | `POST /api/servers/{id}/key-envelopes` | A, S | Membro novo recebe a chave | |
| CRP-02 | Obter o meu envelope | `GET /api/servers/{id}/key-envelopes/me` | A, T | Decifra mensagens | |
| CRP-03 | Pedido e conclusão de handoff | WS `key_handoff.requested`, `key_handoff.completed` | A, T | Sincroniza a chave | |
| CRP-04 | Chave do servidor visível uma vez na criação, com custódia | — | S | Checkbox obrigatória | |
| CRP-05 | Chave de canal de voz com custódia na criação | `POST …/channels` | S, V | Checkbox obrigatória | |

## 10. Transversal

| ID | Funcionalidade | Fase | Critério | Estado |
|---|---|---|---|---|
| TRV-01 | Diálogos: título, corpo, acções; fecham por Esc e fundo | F | Padrão único | V (/__foundation) |
| TRV-02 | Diálogo de alterações por guardar (Cancelar/Descartar/Guardar) | F, V | Usado no editor de cena | |
| TRV-03 | Toasts de confirmação | F | Acções assíncronas | V (/__foundation) |
| TRV-04 | Feedback "Copiado" | F | Temporário | V (/__foundation) |
| TRV-05 | Estados vazios e de erro por lista | F, todas | Mensagem própria | |
| TRV-06 | Iniciais como fallback de avatar (utilizador e servidor) | F | Sem foto | V (/__foundation) |
| TRV-07 | Modo claro e responsivo em todas as telas | P | Auditoria | |
| TRV-08 | Paridade de i18n pt-BR/en | P | Sem chaves em falta | |
| TRV-09 | Cookie de sessão e mesma origem preservados no corte | P | Sessão sobrevive | |
| TRV-10 | Health | — | `GET /health` responde `ok` | |

## 11. Cobertura de contratos

> Nota: README e `ws-events.md` chamam `presence.update` ao evento de presença; o backend emite `presence` com `{ online_account_ids }`. O backend também **não** emite `channel.created` nem `server.created` (as listas actualizam-se por nova consulta). A fonte de verdade é `backend/src`.

Cada rota REST do backend e cada evento WS emitido aparece numa linha acima ou na secção 12:

- Rotas REST cobertas: auth (7), avatares, servidores, boas-vindas, cargos, membros, presença, canais, ACL/acesso, silenciamento, mensagens, leitura, anexos, notificações, unfurl, convites, voz (join/leave/media/ocupação/e2ee), grid, cena activa, envelopes de chave.
- Eventos WS cobertos: `message.new`, `message.deleted`, `voice.occupancy`, `presence`, `channel.e2ee_changed`, `channel.deleted`, `server.deleted`, `key_handoff.requested`, `key_handoff.completed`, `notification.created`, `invite.consumed`, `channel_role.changed`, `grid.updated`, `scene.changed`.

## 12. Excluído do escopo

Excluído em `docs/v2/TR-frontend-v2.md` §4.2/§7 e `docs/backlog/backlog.md`. A ausência não conta como falta de paridade.

| ID | Rota / funcionalidade | Motivo |
|---|---|---|
| EXC-01 | `POST /api/channels/{id}/egress/start`, `…/egress/stop` | Gravação/egress (backlog G1); sem UI na aplicação actual |
| EXC-02 | `POST/PATCH/DELETE …/scenes`, `…/scenes/{id}`, `…/duplicate`, `…/activate` | Múltiplas cenas por canal (backlog G10); a UI só edita a cena activa |
| EXC-03 | `GET/PUT /api/channels/{id}/roles` (co-director) | Co-director (código morto, backlog) |
| EXC-04 | `GET /api/servers/{id}/invites`, `POST /api/invites/{code}/revoke` | Controlo de validade/permanência de convites (backlog); sem UI na aplicação actual |
| EXC-05 | MLS, multi-dispositivo, Passkeys, cofre MLS, semente BIP-39 | TR §7 |
| EXC-06 | Reações, rolagem de dados, ferramentas VTT, telemetria de rede, perfil estendido | Mockups fora de escopo (AUDIT §6) |
