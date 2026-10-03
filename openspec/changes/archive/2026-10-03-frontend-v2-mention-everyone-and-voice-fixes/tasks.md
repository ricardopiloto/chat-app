# Tasks

## 1. Câmara: reproduzir antes de corrigir

- [x] 1.1 Medir o problema: com um navegador de teste (dispositivos de mídia falsos), instrumentar `getUserMedia`, `clone` e `captureStream` e contar as faixas de vídeo vivas (`readyState === "live"`) depois de desligar a câmara, na pré-entrada (com e sem Blur), na chamada (com e sem Blur, incluindo desligar e ligar depressa), ao sair e na página de Áudio & Vídeo; ver na outra sessão se o tile continua com vídeo. Resultado: D5 atualizado (duas fugas encontradas, a hipótese inicial não se confirmou)
- [x] 1.2 Corrigir as duas fugas de D5: em `voice/preview.ts` parar a cópia do desfoque e o processador ao limpar e impedir que um `render()` cancelado publique uma faixa; em `voice/callSession.tsx` serializar ligar/desligar a câmara (a última ação pedida prevalece) e parar o processador ao desligar. Verificar com a medição de 1.1: zero faixas de vídeo vivas depois de desligar em todas as superfícies, incluindo ligar e desligar depressa com Blur e "Parar teste" na página de Áudio & Vídeo
- [x] 1.3 Verificar o regresso: voltar a ligar a câmara reaplica o desfoque guardado sem reentrar na chamada, sair da chamada com a câmara ligada deixa zero faixas, e o desfoque continua a poder ser mudado durante a chamada

## 2. Convidado sem cargo na voz

- [x] 2.1 Reproduzir com uma conta convidada sem cargo num canal de voz público: confirmar que a pré-entrada só oferece "Entrar (ouvir)" e que `POST .../voice/join` já devolve `can_speak: true`
- [x] 2.2 Corrigir `GreenRoom.canSpeak` para `owner || my_permission === "speak"` (D6). Verificar com o convidado: aparecem "Entrar", "Testar vídeo" e os alternadores, ele entra a falar e liga microfone e câmara; com um cargo sem "falar" continua só "Entrar (ouvir)"
- [x] 2.3 Verificar o acesso por omissão com um convidado sem cargo: vê e escreve num canal de texto público, entra e fala num canal de voz público, e num canal privado com regra de permitir só para um cargo nem o vê (requisito de `channel-management`)

## 3. Permissão @todos: backend

- [x] 3.1 Migração `0022` (coluna `can_mention_everyone` em `server_role` e `mentions_everyone` em `message`), campo em `RoleCapabilities` (`open_defaults` falso, `owner_all` verdadeiro, agregação), leitura e escrita em `db/server_role.rs` e `api/roles.rs`. Teste de contrato: criar cargo sem a permissão, ativá-la, lê-la de volta, e cargos antigos sem ela
- [x] 3.2 Em `api/messages.rs`: aceitar `mention_everyone` no corpo; aplicar só a dono ou a quem tem a capacidade; notificar todos os membros que veem o canal, exceto quem escreve, sem o limite de 20, numa transação, com `notification.created` por membro; gravar e devolver `mentions_everyone` (também no `message.new`). Testes de contrato: com permissão (todos recebem, remetente não), sem permissão (nenhuma notificação, mensagem entregue, marca falsa), canal privado (só quem vê), mais de 20 membros, silenciado (recusa)
- [x] 3.3 Documentar em `specs/002-fase-1-mvp/contracts/rest-api.yaml` e no registo de `docs/v2/contracts/backend-change-policy.md` (aditiva, retrocompatível, testes) e correr `cargo test`

## 4. Permissão @todos: frontend

- [x] 4.1 Tipos (`api/types.ts`): `can_mention_everyone` nas capacidades, `mention_everyone` no corpo e `mentions_everyone` na mensagem. Acrescentar o interruptor "Mencionar @todos" ao grupo Texto de `admin/settings/Roles.tsx` com o texto em `mgmt.pt-BR.ts` e `mgmt.en.ts` (nome e explicação). Verificar: aparece desligado num cargo novo, guarda e persiste, só-leitura no cargo de sistema
- [x] 4.2 Composer: entrada "todos" no topo do autocompletar só para quem pode (`shell.owner()` ou `shell.can("can_mention_everyone")`), e envio de `mention_everyone: true` quando o texto contém `@todos` como palavra inteira e a pessoa pode. Verificar com duas sessões: com permissão a sugestão aparece e o outro membro recebe a notificação; sem permissão não aparece
- [x] 4.3 Mensagens: `splitMentions` e `MessageRow` destacam `@todos` quando a mensagem tem `mentionsEveryone`; sem a marca, texto simples. Verificar: destacado nas duas sessões; quem escreve `@todos` sem permissão vê texto simples e ninguém é notificado
- [x] 4.4 Notificação: aparece em "Menções e respostas", acende o indicador da topbar e toca o efeito de nova menção; verificar com um membro noutro canal e um canal com mais de 20 membros (por API)

## 5. Fecho

- [x] 5.1 Executar `tsc --noEmit`, `eslint src`, `npm run check:v1-overlap`, `npm run verify:i18n-keys` e `cargo test`; confirmar que os testes novos passam e que os 139 de contrato continuam a passar
- [x] 5.2 Acrescentar os itens a `docs/v2/parity-checklist.md` (secção 13) e atualizar `README.md` (permissões de cargos e `@todos`) e `CHANGELOG.md`
