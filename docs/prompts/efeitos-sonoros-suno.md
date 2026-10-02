# Prompts de efeitos sonoros curtos (Suno, modo de efeitos sonoros)

Por ora são só dois efeitos. Os arquivos finais, em **MP3**, ficam em `assets/audio/` com estes nomes:

| Efeito | Quando toca | Arquivo |
|---|---|---|
| Nova menção | Chega uma notificação para o usuário (menção ou resposta) | `assets/audio/mention.mp3` |
| Chegada em chamada | Uma nova pessoa entra numa chamada de voz/vídeo que já está em andamento | `assets/audio/call-join.mp3` |

## Identidade sonora

O Mesa é uma mesa de RPG: calor de luz de vela e fogueira, madeira, comunidade. Os sons devem ser **acolhedores e discretos**, nunca de alerta industrial, e **distinguíveis de olhos fechados**:

- **Chegada em chamada** é *convite*: suave, ascendente, alguém sentando à mesa.
- **Nova menção** é *chamado*: mais curto e mais brilhante, um toque no ombro.

## Como usar no Suno

1. Abra a funcionalidade de **efeitos sonoros** (sound effects) e cole o prompt do efeito no campo de descrição.
2. Defina a **duração** mais curta que a interface permitir (alvo abaixo) e deixe **loop desligado**, se existir a opção.
3. Gere várias versões, escolha por audição e baixe em MP3.
4. Se o resultado for mais longo que o alvo, corte (ver "Ajustes finais").
5. Salve com o nome da tabela acima em `assets/audio/`.

Os prompts estão em inglês porque o Suno responde melhor assim. Cada efeito traz uma variação principal (A) e alternativas (B e C) para o caso de a primeira não agradar.

---

## 1. Nova menção (`mention.mp3`)

**Alvo:** 0,4 a 0,7 s. Uma nota (ou duas muito próximas) de pluck seco, ataque nítido, quase sem cauda. Precisa ser reconhecível com voz e música ao fundo.

**A (principal):**
```
Short notification ping: a single plucked lute note, bright but warm, medieval fantasy tavern feel, dry and crisp with a very quick decay, about half a second, no reverb tail, no melody, no music, no voice
```

**B:**
```
Tiny UI notification sound: one soft kalimba pluck with a faint overtone, gentle, tabletop game night, close and dry, very short, no music, no beat, no voice
```

**C:**
```
Quick attention cue: a single light pizzicato violin note, friendly and wooden, short natural decay, minimal, no reverb tail, no music, no voice
```

**Evitar:** sons parecidos com mensagens de apps conhecidos, beeps eletrônicos, campainha, notas longas, qualquer coisa com duas notas ascendentes em sino (isso é do outro efeito).

---

## 2. Chegada em chamada (`call-join.mp3`)

**Alvo:** 0,6 a 1,0 s. Duas notas curtas ascendentes (intervalo de terça ou quarta), ataque suave, cauda que some em cerca de 300 ms. Região média (C5 a G5), nada grave nem estridente.

**A (principal):**
```
Short welcoming notification sound: two soft ascending notes on a warm wooden chime and soft bell, like someone sitting down at a tavern table, gentle and inviting, dry with a short decay, about one second, no melody, no music, no voice
```

**B:**
```
Very short UI sound: two rising harp plucks with a soft felt attack, warm fantasy tavern, inviting and quiet, close and dry, under one second, no music, no bass, no voice
```

**C:**
```
Brief interface sound effect: two rising notes on a warm glass bell with a soft attack, candlelit and friendly, subtle, short decay, no loop, no music, no voice
```

**Evitar:** sirene, buzzer, chiptune/8-bit, sintetizador agressivo, reverb longo, graves, "whoosh" exagerado, sons de telefone ou de outros apps.

---

## Ajustes finais

- **Duração:** `call-join` até 1,0 s e `mention` até 0,7 s. Corte o silêncio do início (o som tem de sair no instante do evento) e aplique fade-out de 80 a 150 ms para não estalar.
- **Volume:** são avisos de fundo, abaixo da voz da chamada. Alvo de cerca de **-20 LUFS** e pico máximo de **-3 dBFS**; a menção pode ficar ~2 dB acima do outro, não mais.
- **Formato:** MP3 mono, 44,1 kHz, 128 kbps, abaixo de ~30 KB cada.
- **Teste cego:** ouça os dois em sequência e, depois, um de cada vez com uma chamada tocando ao fundo. Se não der para diferenciar, troque a variação de um deles.

Exemplo com ffmpeg (ajuste `-ss`/`-t` ao trecho escolhido):

```bash
ffmpeg -i bruto.mp3 -ss 0.2 -t 0.9 -af "afade=t=out:st=0.78:d=0.12,loudnorm=I=-20:TP=-3:LRA=7" -ac 1 -ar 44100 -b:a 128k call-join.mp3
```
