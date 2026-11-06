# Design

## Context

`frontend/src/sound/effects.ts` conhece dois efeitos, e `triggers.ts` acompanha menções e entradas por alterações na lista de ocupantes. `callSession.tsx` toca a entrada própria após conexão. O Vite copia todos os MP3 de `assets/audio/` para `frontend/public/audio/`. As gravações v2 já estão na pasta de origem, mas duram aproximadamente 4,0 s (saída), 5,0 s (entrada) e 5,9 s (menção); não atendem ao limite de um aviso curto sem edição.

## Goals / Non-Goals

**Goals:** produzir três arquivos finais pequenos a partir das gravações v2 e ligar o terceiro efeito aos eventos reais da chamada, preservando a experiência silenciosa em falhas.

**Non-Goals:** alterar eventos do servidor, tocar para quem vê apenas o roster ou mudar a política atual de notificações visuais.

## Decisions

1. Selecionar o trecho audível apropriado de cada gravação v2, aplicar fade-in/fade-out e ajustar ganho percebido. Publicar como `mention.mp3`, `call-join.mp3` e `call-leave.mp3`; manter as fontes v2 separadas para edição futura. Comparar os três em volume de conversa, não apenas por pico medido. Isso preserva os caminhos já usados para os dois efeitos existentes.
2. Acrescentar `callLeave` ao registro de efeitos, preload, janela de silêncio e pré-escuta. Usar janela de silêncio própria para saída, para não bloquear menções ou entradas próximas. A preferência e a escolha de dispositivo continuam compartilhadas.
3. Detectar saídas remotas por diferença entre listas consecutivas de ocupantes do mesmo canal, excluindo o próprio usuário. Ignorar a primeira lista, snapshots de reconexão e canais alheios como já se faz com entradas. Detectar a saída própria no comando voluntário que encerra a sessão, não na limpeza interna da conexão.
4. Manter os nomes de arquivos publicados estáveis para entrada e menção; acrescentar o arquivo novo ao mecanismo de cópia existente. Atualizar os rótulos de pré-escuta em português e inglês e a documentação de áudio.

## Risks / Trade-offs

- [Os trechos Suno podem conter ataque alto ou silêncio inicial] → ouvir, aparar e medir duração/ganho dos arquivos finais antes da integração.
- [Atualização do roster após perda de conexão pode parecer saída] → só comparar listas contínuas válidas para o mesmo canal; testar o fluxo de reconexão.
- [Saída própria pode gerar toque duplicado ou não tocar após teardown] → disparar uma vez no caminho de saída voluntária antes da limpeza da sessão, sem usar o callback genérico de desconexão.

## Migration Plan

Substituir os dois MP3 publicados, adicionar `call-leave.mp3` e atualizar o cliente no mesmo build. Em rollback, a versão anterior do cliente continua a usar apenas os dois caminhos antigos; os arquivos extras são ignorados.
