# Review — Desenvolvedor Fullstack

**Change:** camera-blur-segmentation-model
**Data:** 2026-11-13
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend

Veredito: N/A

- Confirmado no `proposal.md` ("No backend/API impact") e no código: `BackgroundProcessor` roda inteiramente no cliente (`frontend/src/voice/callSession.tsx`, `preview.ts`). Nenhuma rota, tabela ou serviço do `backend/` (Axum/SQLite) é tocado.

## 2. Desenvolvimento do frontend

Veredito: OK

- **Implementabilidade confirmada no código real**, não só no texto da proposta: reli agora `frontend/src/voice/callSession.tsx:222-234` e `frontend/src/voice/preview.ts:136-149` — os dois `processors.BackgroundProcessor(options)` citados existem exatamente nessas linhas, nenhum terceiro ponto de construção do processor existe em `frontend/src` (único outro hit de `BackgroundProcessor` é a anotação de tipo `BackgroundProcessorWrapper`, não uma chamada de construção).
- `frontend/src/voice/devices.ts:7-8` tem `BlurLevel`/`CameraEffect` exatamente onde a task 2.1 diz que estão — a instrução é precisa, não genérica.
- A stack (SolidJS/Vite) já serve `frontend/public/` como está (confirmado pelo padrão já em uso por `frontend/public/dice-box-threejs/`), então `frontend/public/mediapipe/<arquivo>.tflite` funciona sem nenhuma mudança de build/config — `vite.config.ts` não precisa de ajuste.
- Sem componente mobile/responsivo aqui: é um valor de configuração de um processor de vídeo, não uma mudança de UI visível.

## 3. Deploy e operação

Veredito: OK

- Nenhuma porta, variável de ambiente, container ou serviço novo. O arquivo `.tflite` vendorizado é só mais um asset estático copiado pelo Vite no build, igual aos já existentes em `public/` — nenhuma mudança em `infra/docker-compose.yml` ou nos scripts de deploy.
- Nada a monitorar em produção além do que já existe hoje para blur (não há log/telemetria específico de segmentação, e a change não introduz nenhum).

## 4. Qualidade de código

Veredito: Atenção

- **Achado**: a task 1.1 pede verificar o asset "`npm run dev` ... e.g. `curl -I` the local dev URL for that path". O servidor Vite deste projeto roda em HTTPS com certificado autoassinado (`vite.config.ts`, `https: {}`, confirmado nesta sessão), então um `curl -I https://127.0.0.1:1421/...` sem `-k`/`--insecure` falha por erro de certificado, não por 404 — o resultado seria enganoso (falha de TLS, não confirma nem nega que o arquivo existe). Recomendação: ajustar a redação da task 1.1 para incluir `curl -Ik` (ou testar pelo navegador/devtools em vez de `curl`), para não gerar um falso negativo na verificação.
- **Achado**: a task 1.1 pede "record its license/attribution next to it", mas não há nenhum precedente real no repositório para isso — verifiquei `frontend/public/dice-box-threejs/` (o padrão que o próprio `design.md` cita como precedente de vendorização) e não existe nenhum `NOTICE`/`LICENSE`/menção de licença lá, nem em nenhum outro lugar do repo para assets vendorizados. Ou seja, "seguir o mesmo padrão" não cobre a parte de atribuição — quem implementar vai ter que inventar a convenção do zero. Recomendação (não bloqueante): a task poderia ser mais concreta, por exemplo "criar um `frontend/public/mediapipe/NOTICE.md` curto com nome do modelo, URL de origem e licença", em vez de deixar "record... attribution" em aberto sobre onde/como.
- Fora esses dois pontos, o padrão "tarefa + como verificar" de `tasks.md` está alinhado com o uso já visto em outras changes deste projeto, e os grupos estão ordenados por dependência (vendorizar → ligar nos dois call sites → verificação manual → validação da spec).
- Tratamento de erro: não muda — o `try/catch` que já existe em `applyEffect`/`render` (ambos já revertem para "off" e mostram `t("call.blur.unsupported")` em caso de falha) continua a cobrir uma falha de carregamento do novo modelo exatamente como cobre hoje uma falha do modelo atual; a change não precisa de tratamento de erro novo.

## 5. Execução das decisões arquiteturais

Veredito: OK

- `tasks.md` segue fielmente as decisões do `design.md`: D1 (modelo `selfie_segmenter_landscape`, não multiclass), D2 (vendorizar em `frontend/public/mediapipe/`) e D3 (constante única em `devices.ts`) aparecem nas tasks sem reabrir nenhuma delas.
- Nenhuma limitação técnica nova foi encontrada na implementação real que não estivesse já antecipada no `design.md` — os dois achados acima são de precisão/redação das tasks, não de viabilidade da arquitetura escolhida.

## Bloqueantes antes de implementar
- nenhum

## Limitações técnicas a reportar ao Arquiteto
- nenhuma
