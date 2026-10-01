# Verificação da implementação

Backend local com banco descartável, dev server v2 (`https://localhost:1421`) e Chrome. Contas `tester1` (dono), `guest1` (segundo utilizador) e `guest2`. A sessão do navegador é uma só por origem, então os dois utilizadores foram usados em sequência; mensagens "do outro utilizador" anteriores à entrada dele foram semeadas no SQLite com texto cifrado pela chave real do servidor.

## Verificado no navegador

- 1.1 Mensagens cifradas no cliente: a API só guarda `content_ciphertext`; três mensagens consecutivas do mesmo remetente aparecem agrupadas, com avatar e nome uma vez.
- 1.2 Separadores "Hoje", "Ontem" e data completa (28 September 2026) com mensagens de três dias; o marcador fixo no topo é `position: sticky`.
- 1.3 Responder (citação acima do composer, cancelável) e apagar nos quatro casos: própria, dono/criador do canal, utilizador sem permissão (sem botão) e utilizador com `can_delete_messages` (apagou mensagem de outro).
- 1.4 `@guest1` vira chip clicável (abre cartão do membro) e `@naoexiste` fica texto; o backend recebe só o id válido em `mentioned_account_ids`.
- 2.1 Anexo por ficheiro e por colar: o backend guarda bytes cifrados (não PNG), a miniatura decifra localmente. Colar uma imagem PNG malformada mostra o erro "Failed to prepare pasted image".
- 2.2 Lightbox: zoom, download, anterior/seguinte e fecho por Esc, botão e clique no fundo; clicar na imagem não fecha.
- 2.3 Pré-visualização de links: duas URLs → dois cartões; o extractor limita a 5.
- 3.1 Autocompletar `@` (setas, Enter), `:shortcode:` e o seletor de emoji.
- 3.2 Composer "somente leitura" (cargo sem enviar mensagens) e "silenciado até HH:MM".
- 3.3 Checklist negativo: sem barra de reações por hover, sem cartões de dado nem spans de feitiço (busca no código sem ocorrências).
- 4.1 Pill "Jump to present (2)" com mensagens novas fora da vista; o clique rola ao fundo e a esconde.
- 5.1 Pesquisa global e `#canal termo` com debounce; 5.2 estados vazios distintos (canal não encontrado, só texto, sem resultados); 5.3 Ctrl+F abre a pesquisa com `#geral `.
- 6.1 Notificações em duas secções fixas; a de menção persiste após recarregar a página e some quando a mensagem é vista.
- 6.2 Deep link de uma menção, de uma resposta e de "canais com novidade": navega, rola e destaca a mensagem.
- 6.3 O indicador no sino aparece com notificação não vista e some quando todas são vistas.
- 7.1 Ciclo com dois utilizadores: mensagem com anexo e link de cada um, responder e apagar, menção real do `guest1` gerou notificação para `tester1` e a pesquisa encontrou as mensagens.
- 7.2 `git status frontend/` sem alterações.

## Limitações da verificação

- "Canais com novidade" é alimentada por eventos WebSocket de outros utilizadores; como só há uma sessão por navegador, esse caso foi exercitado chamando `markUnseen` diretamente (módulo real). As menções/respostas vieram do backend.
- As chaves de `guest1` e `guest2` foram gravadas direto no SQLite (o handoff por WebSocket exige o dono online na hora da entrada).

## Decisões

- `src/crypto/keyHandoff.ts` ganhou `loadServerKey`, `ensureServerKey`, `loadAllServerKeys` e `handleHandoffEvent`; o AppShell carrega todas as chaves ao iniciar e responde a pedidos de handoff.
- Pesquisa continua no cliente (D1); notificações seguem as duas secções da v1 (D4), sem "limpar tudo".
- Chips de menção abrem um cartão simples do membro (não há painel de membros nesta fase).
