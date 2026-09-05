# Quickstart: 015-camera-background-blur

Validação manual do blur de fundo. Backend intocado. Precisa de **câmara real** (não «Vídeo de teste») e, para SC-001/006, **duas contas**.

## Pré-requisitos

- Backend + frontend (`README.md`).
- Browser com suporte a processadores (Chrome/Edge recomendado).
- Canal de voz; duas contas se possível (A e B).
- Webcam disponível.

```bash
cd frontend && npx tsc --noEmit
```

## 1. Split e menu (US2)

1. Entrar na chamada (câmara pode ficar desligada).
2. Clicar na **área principal** Câmara → liga/desliga só a câmara; menu **não** abre.
3. Clicar na **seta** → menu com Sem blur / Blur leve / Blur forte; câmara **não** muda.
4. Com blur leve ou forte, a seta tem **forma** distinta (pip); o ícone da câmara não muda por causa do blur.
5. Escape / clique fora fecha o menu.

## 2. Blur visível para o outro (US1)

1. Conta A: câmara ligada, escolher **Blur leve**.
2. Conta B: o tile de A mostra fundo suavizado, pessoa nítida (≤5 s).
3. A escolhe **Blur forte** → B vê fundo **mais** escondido; A não sai da chamada.
4. A escolhe **Sem blur** → B vê o quarto nítido.

## 3. Primeiro frame (US3 / SC-007)

1. Câmara **desligada**. Seta → **Blur forte**.
2. Ligar a câmara pela área principal.
3. **Esperado** (A e B): o primeiro frame visível já está desfocada; nenhum flash do quarto nítido.
4. Recarregar a app, voltar ao canal, ligar câmara (preferência persistida) → mesmo critério.

## 4. Fora de âmbito / indisponível

1. «Vídeo de teste» → sem blur no canvas de teste.
2. (Opcional) Browser sem suporte: escolher leve/forte → mensagem «não disponível»; modo não fica ligado; câmara nítida OK.

## 5. Falha fechada (se for possível forçar)

1. Com blur activo, simular falha do processor (throttling extremo / bloquear `/mediapipe/` no DevTools).
2. **Esperado**: vídeo de A pára ou congela para B; **sem** quarto nítido; áudio continua; mensagem em A.
3. A escolhe Sem blur → nítido pode voltar.

## 6. Gravação (se Egress configurado)

1. Blur forte em A; director grava cena.
2. O artefacto mostra o fundo de A desfocada no mesmo modo.

Ver: [background-blur-processor.md](./contracts/background-blur-processor.md), [camera-split-control.md](./contracts/camera-split-control.md).
