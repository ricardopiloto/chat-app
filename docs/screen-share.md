# PRD — Compartilhamento de Tela (Screen Share)

**Produto:** Mesa (chat-app)
**Área:** Canal de voz/vídeo
**Status:** Rascunho para validação técnica (spike pendente)
**Depende de:** LiveKit (SFU), sistema de grade/cenas existente, Insertable Streams (E2EE)

---

## 1. Contexto

O Mesa já suporta canais de voz/vídeo com dois modos de visualização:

- **Modo composição (cena)**: layout curado manualmente, salvo como `scene`.
- **Modo grade**: layout automático dos participantes.

Hoje não existe compartilhamento de tela. Esta feature adiciona essa capacidade ao canal de voz **existente** (não é um tipo de canal novo), reaproveitando o SFU (LiveKit) já em produção.

## 2. Problema

Mestres e jogadores frequentemente precisam mostrar conteúdo de tela (ficha de personagem, mapa, regras, iniciativa) durante a sessão. Sem essa função, dependem de ferramentas externas (Discord, OBS) — o que contraria o objetivo do Mesa de unificar chat + vídeo + composição numa única aplicação self-hosted.

## 3. Objetivo

Permitir que qualquer participante de um canal de voz compartilhe sua tela, com o canal reagindo visualmente de forma previsível para todos, sem quebrar a experiência de quem está numa cena composta pelo dono.

## 4. Fora de escopo (por ora)

- **Gravação (Egress)**: não é uma preocupação nesta fase — o produto ainda não está em uso com gravação ativa. A composição do que seria gravado com screen share ativo fica para uma iteração futura.
- Anotações sobre a tela compartilhada (desenhar, apontar).
- Compartilhar uma janela/aba específica com curadoria de UI além do que o browser já oferece nativamente via `getDisplayMedia`.
- Permissões granulares (ex.: só o mestre pode compartilhar) — no MVP, qualquer participante do canal pode.

## 5. Requisitos funcionais

### 5.1 Captura e publicação

- Usa a API nativa do browser (`getDisplayMedia`) via SDK do LiveKit (`setScreenShareEnabled`), publicando a tela como uma track de mídia adicional do participante.
- Suporta captura de áudio do sistema/aba quando o browser permitir.
- A track de tela deve usar `contentHint: 'detail'`, para o encoder priorizar nitidez (texto legível) em vez de fluidez de movimento.
- **Múltiplos participantes podem compartilhar tela simultaneamente** — não há exclusividade. Não existe conceito de "fila" ou bloqueio.

### 5.2 Estado de compartilhamento (canônico, no servidor)

O canal de voz mantém um conjunto de participantes compartilhando tela no momento:

```
voice_occupancy {
  ...
  active_screen_shares: [participant_id, ...]   // 0..N
}
```

- `POST /api/channels/{id}/voice/screen-share/start` — adiciona o participante ao conjunto.
- `POST /api/channels/{id}/voice/screen-share/stop` — remove o participante do conjunto.
- Ambos idempotentes (chamar start já estando no conjunto, ou stop já estando fora, não é erro).

### 5.3 Modo de layout do canal (canônico, no servidor)

O canal mantém um estado de layout independente do conjunto de compartilhamentos:

```
channel_layout {
  mode: "grid" | "scene"
  active_scene_id: string | null      // relevante só quando mode = "scene"
  pre_share_scene_id: string | null   // cena a restaurar quando os compartilhamentos acabarem
}
```

**Regras de transição** (baseadas na cardinalidade de `active_screen_shares`, não em eventos individuais de start/stop):

| Transição do conjunto | Efeito no `channel_layout` |
|---|---|
| 0 → 1 (primeiro compartilhamento) | Se `mode == "scene"`: salva `pre_share_scene_id = active_scene_id`, muda `mode = "grid"`. Se já estava em `"grid"`, não altera nada. |
| 1 → N, N → M (com N,M ≥ 1) | Nenhuma mudança de modo — o canal permanece em `"grid"`. |
| N → 0 (último compartilhamento termina) | Se `pre_share_scene_id != null`: restaura `mode = "scene"`, `active_scene_id = pre_share_scene_id`, limpa `pre_share_scene_id`. Se `pre_share_scene_id == null` (já estava em grid antes de qualquer share), permanece em `"grid"`. |

- Essa troca de modo é **global**: afeta a visão padrão de todos os participantes do canal.
- O dono/qualquer participante continua podendo trocar de cena manualmente a qualquer momento através dos controles já existentes — isso não é bloqueado pela feature.

### 5.4 Preferência local de visualização (por participante, não propagada)

Cada cliente mantém estado próprio, que **não é enviado ao servidor** nem afeta outros participantes:

```
local_view_state {
  follow_channel_layout: boolean         // default true
  spotlighted_participant_id: string | null   // default null
}
```

- **`follow_channel_layout`**: quando o canal muda automaticamente para `"grid"` por causa de um compartilhamento, o participante pode optar por continuar vendo a composição anterior localmente (`follow_channel_layout = false`), sem alterar o que os demais veem. Quando o `channel_layout` do servidor transiciona de novo (por qualquer motivo), o override é resetado para `true` — o "voltar pra composição" vale só para aquela janela de compartilhamento.
- **`spotlighted_participant_id`** ("Destacar transmissão"): toggle local, disponível apenas em modo grade, que amplia a tela de um participante específico e reduz o destaque visual das câmeras e das demais telas. Não reflete para os outros participantes.
  - Se o participante destacado parar de compartilhar enquanto está em foco, `spotlighted_participant_id` volta para `null` automaticamente (grid equilibrado) — nunca troca sozinho para destacar outra pessoa.

### 5.5 Regras de layout visual (modo grade com compartilhamentos ativos)

- Telas compartilhadas têm prioridade visual sobre câmeras (ocupam área maior por padrão).
- Entre múltiplas telas ativas sem destaque local, o espaço é dividido igualmente.
- Câmeras ficam em posição secundária (fileira menor), mantendo visibilidade mas sem competir por espaço com as telas.

### 5.6 Eventos WebSocket

| Evento | Payload | Uso |
|---|---|---|
| `voice.screen_share_changed` | `{ channel_id, active_participants: [...] }` | Snapshot completo (não delta) do conjunto de quem está compartilhando. |
| `channel.layout_changed` | `{ channel_id, mode, active_scene_id, reason: "screen_share_start" \| "screen_share_end" \| "manual" }` | Notifica troca de modo/cena. O `reason` permite ao cliente distinguir transição automática (reseta overrides locais) de troca manual do dono. |

## 6. Cenários de aceite

1. **Primeiro compartilhamento em cena composta**: canal em modo `scene` (cena "Taverna"), ninguém compartilhando. Participante A inicia screen share → canal muda para `mode: grid`, `pre_share_scene_id: "taverna"`. Todos os clientes com `follow_channel_layout = true` mudam de view.
2. **Segundo compartilhamento simultâneo**: com A já compartilhando (canal em grid), participante B também inicia → conjunto vira `[A, B]`, `channel_layout` não muda (já estava em grid).
3. **Encerramento parcial**: A para de compartilhar, B continua → conjunto vira `[B]`, canal permanece em grid.
4. **Encerramento total**: B também para → conjunto vira `[]`, canal restaura `mode: scene`, `active_scene_id: "taverna"`.
5. **Opt-out local**: durante o compartilhamento de A, um participante C clica "ver composição" → C continua vendo a cena "Taverna" localmente; quando o compartilhamento termina e o canal restaura a cena automaticamente, o override de C é limpo (ele volta a seguir o canal).
6. **Destaque local**: participante D, em modo grid com A e B compartilhando, destaca a tela de A → vê a tela de A grande, tela de B e câmeras reduzidas. Ninguém mais é afetado. Se A parar de compartilhar, D volta ao grid equilibrado automaticamente.
7. **Sem cena anterior**: canal já estava em modo grid (sem cena ativa) quando alguém compartilha e depois para → nada muda, permanece em grid o tempo todo.

## 7. Riscos e dependências técnicas

- **E2EE via Insertable Streams**: precisa ser confirmado se a implementação atual intercepta qualquer track publicada (genérica por `RTCRtpSender`) ou está amarrada especificamente a câmera/mic. Se for a segunda opção, screen share exige trabalho adicional de engenharia para herdar a cifragem. **Ação recomendada**: validar em `spike/` antes de iniciar a implementação da spec.
- **Layout de N telas + M câmeras**: a regra de divisão igualitária do espaço é suficiente para o MVP; comportamento com muitos compartilhamentos simultâneos (ex. 4+) pode precisar de revisão visual posterior, mas não bloqueia o lançamento.

## 8. Questões em aberto (fora do MVP, mas a considerar depois)

- Como a gravação (Egress) deve compor o modo grid com múltiplas telas, quando essa funcionalidade voltar a ser relevante.
- Se vale introduzir algum limite de compartilhamentos simultâneos por razões de banda/UX, uma vez que haja uso real em sessões grandes (6-8 pessoas).
