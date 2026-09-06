# Quickstart: 028-voice-call-roster

Pré-requisitos: instância a correr (backend + frontend + LiveKit) como no README. Duas contas no mesmo servidor (convite).

## 1. Lista só com mídia ligada

1. A junta-se à mesa com mic ou câmara ligados.
2. B, num canal de **texto**, vê A aninhado sob o canal de voz e um cronómetro a andar.
3. A desliga **mic e câmara**. Em &lt;3 s a linha de A some; o cronómetro **continua**.
4. A liga o mic de novo → a linha volta.

## 2. Sessão da mesa (não pessoal)

1. A entra sozinha; anotar o tempo (~00:10).
2. B entra na mesa. B e A vêem **o mesmo** tempo (não 00:00 para B), ±2 s.

## 3. Permanecer no texto

1. A na mesa (mic on). A abre um canal de texto **sem** Sair.
2. B continua a ver A na lista; A vê a **barra** (nome do canal + tempo + Sair / voltar).
3. A **Sair** na barra → lista e cronómetro desaparecem para B se A era a última.

## 4. Mover de canal de voz

1. A na mesa do canal V1. A clica no canal V2 (e junta-se).
2. Em &lt;3 s A desaparece de V1 e aparece em V2 (se tiver mídia ligada). O cronómetro de V1 pára se A era a última.

## 5. Canal vazio

Sem ninguém na mesa: sem nomes aninhados e sem cronómetro nesse canal.

## 6. Membros do servidor

Painel Membros continua a listar todos os membros; a lista aninhada tem só quem transmite.

## Comandos

```bash
cd backend && cargo test --test contract voice_occupancy
cd frontend && npx tsc --noEmit
```
