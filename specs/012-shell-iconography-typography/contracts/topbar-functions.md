# Contrato: Pesquisa, notificações e definições na TopBar

Âmbito: apenas `frontend/`. Nenhum endpoint ou evento novo no backend — reutiliza:

- `GET /api/servers`, `GET /api/servers/{id}/channels`, `GET /api/channels/{id}/messages` (pesquisa)
- Eventos WS já emitidos: `message.new`, `channel.deleted`, `server.deleted` (notificações)
- `GET /api/auth/me`, `POST /api/auth/logout`, `theme.ts` (definições)

## Pesquisa (`IconSearch`)

1. Abre um campo de pesquisa (overlay ou expansão inline na topbar).
2. Só dispara pedidos com ≥2 caracteres, com debounce (ex.: 250 ms).
3. Para cada servidor devolvido por `GET /api/servers` do utilizador atual:
   - para cada canal de texto desse servidor, pedir `GET /api/channels/{id}/messages`;
   - decifrar cada mensagem com a chave do servidor já carregada em sessão;
   - filtrar por correspondência de texto (case-insensitive) no conteúdo decifrado.
4. Resultados aparecem progressivamente por canal (não bloqueiam a UI); clicar um resultado navega para `/channels/{id}?server=...`.
5. **Nunca** pedir a servidores/canais fora da lista devolvida por `GET /api/servers` do utilizador — isto é o mecanismo que garante FR-014 (o próprio endpoint já aplica o controlo de acesso existente).
6. Erro de rede/decifra num canal específico: ignora esse canal, continua os restantes (sem crash, sem interromper a pesquisa).

## Notificações (`IconBell`)

1. `App.tsx` já mantém um registo de listeners WS (`onWs`); a `TopBar` (ou um contexto acima dela) subscreve-se a esse mesmo canal.
2. Ao receber `message.new` com `channel_id` ≠ canal atualmente focado (rota `/channels/:id` ativa): marca esse `channel_id` como "não visto" (ver `NotificationState` em [data-model.md](../data-model.md)).
3. Ao focar/abrir um canal: remove-o do conjunto de "não vistos".
4. Ao receber `channel.deleted` ou `server.deleted`: remove o(s) canal(is) correspondentes do conjunto (evita indicador "fantasma").
5. O ícone mostra um indicador visual (ex.: ponto/badge) apenas quando o conjunto de "não vistos" não está vazio — sem contagem exata de mensagens, só de canais com atividade.
6. Este estado não é persistido — perde-se num refresh (documentado nas Assumptions do spec); não requer nenhuma mudança de backend.

## Definições (`IconSettings`)

1. Abre um `Dialog` (`SettingsPanel`, reaproveitando `components/Dialog.tsx`) com duas secções:
   - **Tema**: mesmo controlo `theme-seg` (Escuro/Claro) hoje solto na topbar, agora dentro do painel.
   - **Sessão**: handle do utilizador atual (`GET /api/auth/me`, já carregado) + botão "Terminar sessão" que chama `POST /api/auth/logout` (mesma chamada que hoje corre ao clicar no `user-chip`).
2. O `user-chip` da topbar deixa de disparar logout num único clique; passa a abrir o `SettingsPanel` (reduz risco de logout acidental — ver research.md §6).
3. Nenhum novo campo de configuração é introduzido nesta spec — o painel só reagrupa o que já existe.
