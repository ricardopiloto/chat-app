# Verificação da implementação

Backend local com banco descartável, dev server v2 (`https://localhost:1421`) e Chrome. Contas de teste `tester1` (dono), `guest1` e `guest2` (convidados). Servidores criados pela UI; as verificações de comportamento foram feitas contra o backend real.

## Verificado no navegador

- 1.1 Criar servidor: botão bloqueado sem a checkbox de custódia, liberado com ela; cria `geral` + canal de voz e navega para o servidor.
- 1.2/1.3 Criar canal: alternância Texto/Voz; voz exige custódia, texto não; nome normalizado (espaços → hífens, 32 caracteres); privado e "visível para novos membros" refletidos em `GET /channels`.
- 2.1 Membros: pesquisa, seletor de cargo, remover; linha do dono sem seletor nem remover.
- 2.2 Cargos: criar, reordenar ↑/↓ (não sobe acima do cargo de sistema), apagar; cargo de sistema só leitura; três grupos de permissão.
- 2.3 Aviso ao apagar cargo com membros; cargo sem "enviar mensagens" atribuído a `guest1` aparece em "Inspecionar acesso" como "nível reduzido".
- 3.1 Visão Geral como landing, já populada; imagem rejeitada no cliente (>1 MiB), PNG válido enviado e removido.
- 3.2 Boas-vindas: o backend exige `{nome}` no modelo e o erro aparece; com canal e modelo salvos, um novo membro por convite recebe "Seja bem-vindo, guest2!" em `#geral`.
- 3.3 Apagar servidor: botão só ativa com o nome exato (maiúsculas/minúsculas e parcial não valem).
- 4.1 Renomear inline: normalização, 32 caracteres, vazio/só hífens recusados.
- 4.2 Apagar canal: não crítico some da sidebar; último de texto e último de voz mostram a mensagem de 409 `last_channel_of_type`.
- 4.3 ACL: regra de cargo e de membro adicionadas, salvas e removidas (conferido em `GET /acl`).
- 4.4 Inspecionar acesso: mostra visibilidade, nível efetivo e as camadas everyone, cargo e membro.
- 4.5 Silenciar: 5/10/15/30 min e minutos personalizados, tempo restante, dessilenciar antes do fim.
- 5.1 Convite em dois passos: servidor com `geral` pula o passo 1; sem `geral` nem boas-vindas pede o canal; botão copiar mostra "Copiado".
- 5.2 Convite: pré-visualização sem sessão com registro inline; sessão ativa só aceita; código inválido mostra mensagem específica.
- 5.3 Ponta a ponta: convite → registro anônimo → membro aparece na lista → boas-vindas publicada.
- 6.1 Ciclo completo percorrido em `Gamma` (servidor, canais de texto e voz, convidado, cargo restrito atribuído, inspeção).
- 6.2 `git status frontend/` sem alterações.

## Decisões e divergências

- `/invite/:code` agora abre a tela de convite (pré-visualização e registro inline), substituindo o preenchimento do cadastro da fase auth-shell. `?invite=<code>` continua preenchendo o cadastro.
- `t()` aceita parâmetros (`{nome}`) para as mensagens com valores.
- `src/crypto/` ganhou `serverKey.ts`, `channelKey.ts` e `keyHandoff.ts` (só `publishOwnEnvelope`), necessários para criar servidor/canal com custódia; o restante do handoff fica para a fase de chat.
- Rail e sidebar mostram engrenagem, convite e "+" de canal conforme permissões do utilizador no servidor.
- Tempo restante do silenciamento arredonda para cima, como na v1.

## Observação

O ACL e o inspetor foram verificados em um canal privado e outro público; a negação de "ver" em canal público é bloqueada na UI, como na v1.
