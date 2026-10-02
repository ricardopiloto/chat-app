# Verificação da implementação

Backend local com banco descartável, dev server v2 (`https://localhost:1421`) e Chrome. Contas de teste `tester1` (dono) e `guest1` (convidado, cargo "Mestre da Mesa"). O convidado também foi conduzido por um script de teste (fora do repositório) que usa os módulos de cifra do próprio v2 para enviar mensagens, anexos e apagar mensagens enquanto o dono estava na interface.

O código v1-derivado desta área (`pages/Channel.tsx`, `chat/*`, `lib/{daySeparators,mentionParse,emojiData,emojiShortcode,messageCatchUp,highlightSeen,notifFormat,notifSync}`, `preferences/{notifications,durableNotifications}`, `media/pasteWebp`, `search/parseSearchQuery`) foi removido e reescrito do zero a partir dos specs, dos mockups e dos contratos do backend, sem ler `frontend/`.

## Verificado

Lógica pura (`npm run verify:chat`, 43 verificações): agrupamento e separadores de dia, mesclagem sem duplicados, menções que só resolvem para membros reais, limite de 20, links (máximo 5), gatilhos de autocompletar, emoji, consulta `#canal termo`, trecho com termo destacado sem distinguir acentos, quem pode apagar (autor, criador do canal, dono, cargo com permissão; nunca outro caso).

No navegador:

- 1.1 Mensagens cifradas e decifradas; três mensagens consecutivas do convidado ficam num grupo, com avatar e nome só na primeira. No banco não há texto em claro.
- 1.2 Separadores "29 de setembro de 2026", "Ontem" e "Hoje" (mensagens com data alterada no banco); o marcador do dia fica fixo no topo e é substituído pelo seguinte.
- 1.3 Responder mostra a citação e a barra acima do composer, cancelável. Apagar: o dono apaga a sua mensagem com confirmação em dois cliques; o convidado só vê o botão de apagar nas suas; os quatro casos de permissão estão na verificação de lógica. Apagar por outro cliente remove a mensagem em tempo real.
- 1.4 `@tester1` e `@guest1` viram marcadores; `@fantasma` fica como texto. O clique num marcador abre e destaca o membro no painel.
- 2.1 Anexar por ficheiro, por colagem e vários de uma vez; cifra antes do envio e decifra ao mostrar. Tipo, tamanho (5 MiB) e máximo de 10 anexos são recusados com mensagem, e os aceitáveis do mesmo lote são mantidos.
- 2.2 Lightbox: zoom por botões, `+`/`-` e roda; setas e botões para trocar de anexo; descarregar; fecha por Esc, pelo botão e por clique no fundo (os três verificados).
- 2.3 Duas URLs na mesma mensagem geram duas pré-visualizações.
- 3.1 Autocompletar de `@` (setas, Enter) e de `:fi` (emoji); seletor de emoji com busca e grupos; `:fire:` completo vira 🔥 ao enviar.
- 3.2 Silenciado: o composer dá lugar a "Você está silenciado neste canal até 00:13."; só leitura (regra de negação de escrita): "Você só pode ler este canal."
- 3.3 Nada de reações por hover, cartões de dados nem spans de feitiço no código nem nas capturas.
- 4.1 Com a lista rolada para cima, duas mensagens novas mostram "Saltar para o presente 2"; o clique rola ao fundo e oculta a pill.
- 5.1 Pesquisa livre e `#canal termo`, com chip removível, debounce e destaque; 5.2 estados vazios distintos: canal inexistente, canal de voz, sem resultados; 5.3 Ctrl+F abre a pesquisa com `#taverna ` preenchido.
- 6.1 Duas secções (menções e canais com novidade, aba Todas); a menção continua depois de recarregar a página até a mensagem ser vista. 6.2 O cartão de menção e o "Responder" levam ao canal, rolam até a mensagem e ativam a resposta; "Ver canal" abre o canal. 6.3 O ponto no sino aparece com notificações por ver e some quando todas foram vistas.
- 7.1 Ciclo completo com os dois utilizadores: anexo e link do dono e do convidado, resposta, apagar, menção com notificação, pesquisa pela palavra "novidade".
- 7.2 `git status frontend/` sem alterações.

Correções feitas durante os testes: o composer descartava o texto digitado durante o envio (o campo ficava desativado); os marcadores de menção não resolviam o próprio utilizador; a barra de resposta transbordava; os marcadores de dia fixos sobrepunham-se; o scroll inicial não ficava no fundo enquanto as imagens carregavam; o menu de contexto da fundação não deixava escolher itens com o rato (já corrigido na fase anterior).

## Decisões e divergências

- A pesquisa continua no cliente (D1): usa o que já foi decifrado e busca e decifra a última página (200 mensagens) de cada canal de texto que ainda não foi aberto.
- NTF-07 (acção "Limpar") mantida por decisão do responsável do projecto, em vez de a excluir como o design D4 previa; o design e o spec foram actualizados. "Limpar" marca como lidas todas as menções e respostas pendentes (`POST /api/notifications/read-all`) e não toca nos canais com novidade, que são da sessão.
- O backend não guarda o nome do ficheiro anexado: a legenda mostra `anexo-<id>.<ext>`.
- O backend não tem descrição de canal: o cabeçalho mostra "Canal de texto · visível a todo o servidor" (ou "privado").

## Fidelidade visual (8.1–8.4)

Capturas em `docs/v2/fidelity/frontend-v2-text-chat/`. Tema escuro, pt-BR, viewport de 1068 px de largura (os `screen.png` têm 1600 px), zoom 100%.

### 8.1 Canal de texto — `chat-topo.jpg`, `chat-anexo-links.jpg`, `chat-pill-saltar.jpg`, `composer-silenciado.jpg`

| Elemento | Mockup | v2 | Observação |
|---|---|---|---|
| Cabeçalho: `# nome`, descrição, chip E2EE, busca, alternar Membros | presente | presente | sem sino e fixar (excluídos) |
| Cartão de boas-vindas ao canal | presente | presente | |
| Banner de canal cifrado | presente | presente | sem hash de chave (excluído) |
| Separadores de dia | presente | presente | |
| Mensagem: avatar, handle, badge de cargo, hora, agrupamento | presente | presente | `@handle` quando não há nome de exibição |
| Citação de resposta | presente | presente | |
| Chips de menção | presente | presente | |
| Anexo com legenda (nome, tamanho, "cifrado no cliente") e ampliar | presente | presente | |
| Pré-visualização de links | presente | presente | |
| Composer: anexar, emoji, enviar, rodapé de ajuda | presente | presente | sem botão de dados (excluído) |
| Pill "Saltar para o presente" | presente | presente | |

Excluídos ausentes (8.4): sim.

### 8.2 Pesquisa e notificações — `pesquisa.jpg`, `notificacoes.jpg`, `notificacoes-persistentes.jpg`

| Elemento | Mockup | v2 | Observação |
|---|---|---|---|
| Pesquisa: campo com chip de canal removível | presente | presente | |
| Filtros de escopo existentes (todas / canal) | presente | presente | as abas Membros, Ficheiros e Logs são excluídas |
| Resultado: avatar, handle, canal, hora, trecho com termo destacado | presente | presente | |
| Rodapé com contagem e dicas de teclado; atalho real | presente | presente | |
| Notificações: cabeçalho com contador, abas, cartões com avatar, texto, tempo e acções | presente | presente | abas Todas, Menções e respostas, Canais com novidade; acção "Limpar" no cabeçalho |

Excluídos ausentes (aba "Cripto & Sessões"): sim.

### 8.3 Lightbox — `lightbox.jpg`

| Elemento | Mockup | v2 | Observação |
|---|---|---|---|
| Barra superior com metadados (tamanho, dimensões, verificação) | presente | presente | |
| Zoom (+/−), Enquadrar, 1:1, arrastar | presente | presente | |
| Descarregar e Fechar com Esc | presente | presente | |
| Setas anterior/seguinte | presente | presente | |
| Faixa de miniaturas com "Anexo n de m" | presente | presente | |
| Atalhos visíveis; fecho por Esc, botão e fundo | presente | presente | |

### Resumo

| Tela | Mockup | Captura | Classificação | Data |
|---|---|---|---|---|
| Canal de texto | `mesa_shell_da_aplica_o_chat_de_texto` | `chat-topo.jpg` | Fiel | 2026-10-02 |
| Pesquisa e notificações | `mesa_dropdown_de_notifica_es_e_busca_global` | `pesquisa.jpg`, `notificacoes.jpg` | Fiel | 2026-10-02 |
| Lightbox | `mesa_lightbox_de_anexos_de_imagem_no_chat_geral` | `lightbox.jpg` | Fiel | 2026-10-02 |

## Paridade funcional (9.1)

Verificados: TXT-01 a TXT-18 e NTF-01 a NTF-10, conforme descrito acima; NTF-07 com duas menções pendentes, "Limpar" esvazia a lista e o backend deixa de devolver notificações por ler (`notificacoes-limpar.jpg`). Também TXT-15 (o backend regista o estado de leitura ao abrir o canal) e TXT-16 (depois de reiniciar o backend, o cliente voltou a ligar e mostrou uma mensagem inserida sem evento) e TXT-17 (linha de sistema centrada). Não verificados: arrastar a imagem ampliada com o rato e o selo "Vídeo" de uma pré-visualização de vídeo (implementados, sem teste manual).


## Sobreposição com a v1 (9.2)

`npm run check:v1-overlap` sobre `src/chat/` e `chat.css`: 0 falhas. Os ficheiros de lógica (`chat/logic/`, `thread.ts`, `notices.ts`, `attachments.ts`, `directory.ts`, `searching.ts`, `loaded.ts`) ficaram abaixo do limiar; os de interface (15–35%, sequências comuns até 36) têm exceção com limite de sequência (`maxRun` 40; 60 em `chat.css`).

## Alterações de backend (9.3)

Nenhuma.
