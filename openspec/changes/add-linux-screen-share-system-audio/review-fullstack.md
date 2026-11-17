# Review — Desenvolvedor Fullstack

**Change:** add-linux-screen-share-system-audio
**Data:** 2026-11-17
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend

Veredito: N/A

- Confirmado: nenhuma task toca `backend/`; tudo fica no cliente Electron/frontend.

## 2. Desenvolvimento do frontend

Veredito: Atenção

- **Achado/sugestão concreta para a task 1.1**: antes de considerar um addon nativo (D3) ou um helper CLI (`pw-record`, rejeitado em D2), vale testar a rota mais barata primeiro: confirmei que `frontend/src/voice/devices.ts:97-99` já chama `navigator.mediaDevices.enumerateDevices()` e já filtra `audioinput` (linha 87, para microfones). Em muitas distros Linux com PipeWire + PulseAudio-compat, o monitor de saída do sistema aparece como um dispositivo `audioinput` comum (algo como "Monitor of Built-in Audio" ou o nome do sink), selecionável via `getUserMedia({ audio: { deviceId: ... } })` exatamente como já é feito hoje para microfones (`devices.ts:116`). Se isso funcionar no host de teste, a "captura" não exige nenhuma API nova nem addon — é só expor esse device como opção, reaproveitando a infraestrutura de enumeração já existente. Recomendo que a task 1.1 teste essa rota especificamente (e documente se o monitor aparece ou não por padrão em cada host/distro) antes de ir para PipeWire de baixo nível ou qualquer coisa nativa — é consistente com a ordem de D2 (rejeita o helper CLI) mas o `design.md` não menciona explicitamente essa rota via `enumerateDevices`/`getUserMedia`, que é mais simples que "captura do monitor de saída via Electron renderer" como está redigido na task 1.1 hoje (ambíguo sobre qual API exatamente).
- Fora esse ponto, a estrutura de implementação condicional (task 2.1–2.2) é viável como descrita: preserva o fluxo de vídeo X11/Wayland existente e só adiciona a tentativa de áudio quando `supported && selected`, seguindo o mesmo padrão de "tentar e cair para vídeo-only" já usado pela change mesclada para Windows.
- Responsividade/UI: N/A, não há mudança de interface nesta change além do resultado (áudio funcionando ou não) do mesmo controle que já existe.

## 3. Deploy e operação

Veredito: Atenção

- **Achado**: a task 1.1 pede testar em "representative PipeWire X11 and Wayland hosts" — isso não é algo que um agente sem display real (como o sandbox usado para implementar changes anteriores nesta leva) consegue fazer. Confirmei que não há CI configurado neste repositório (`.github/workflows` ausente) e o fluxo de implementação já usado nesta sessão depende de verificação manual para qualquer coisa que precise de hardware/display real. Recomendação: deixar explícito em `tasks.md` que a task 1.1 (e em menor grau 3.1) precisa ser executada por um humano com acesso a pelo menos duas distros/compositores diferentes (ex. GNOME/Wayland e uma distro X11), não por um agente de implementação — do contrário a task fica bloqueada sem ninguém perceber até a implementação travar.
- Se D1 passar sem addon nativo (rota `enumerateDevices`, acima), não há nada novo para empacotar — o AppImage já existente cobre. Se exigir addon nativo, isso é tratado corretamente como fora de escopo desta change (D3).

## 4. Qualidade de código

Veredito: OK

- A task 1.3 (checkpoint pass/fail) é exatamente o controle de qualidade certo para não deixar a implementação condicional (seção 2) avançar sobre uma suposição não comprovada — segue o mesmo rigor já visto nas outras changes desta leva (ex. o `curl -Ik` vs `curl -I` encontrado na change do blur).
- Tratamento de erro: D1/D2 exigem fallback silencioso para vídeo-only em caso de falha, consistente com o padrão já estabelecido pela change de áudio no Windows.

## 5. Execução das decisões arquiteturais

Veredito: OK

- `tasks.md` segue fielmente D1 (gate) → D2 (implementação condicional) → D3 (addon como decisão separada) sem reabrir nenhuma prematuramente.
- Nenhuma limitação técnica nova que não estivesse já antecipada — o achado da dimensão 2 (rota via `enumerateDevices`) é uma sugestão de caminho mais simples a testar primeiro, não uma limitação que invalide o design.

## Bloqueantes antes de implementar
- nenhum

## Limitações técnicas a reportar ao Arquiteto
- A task 1.1, como está redigida, não é executável por um agente sem display/hardware real — precisa ser feita por um humano em pelo menos dois ambientes Linux diferentes antes de qualquer código de produção avançar. Isso não é um problema de arquitetura, mas afeta diretamente o cronograma: esta change não pode ser "implementada" de ponta a ponta num único ciclo automatizado como as changes anteriores desta sessão.
