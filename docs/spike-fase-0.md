# Spike Técnico — Fase 0

**Autor:** Mary (PO Virtual / Business Analyst)
**Data:** 2026-08-24 (revisado após `arquitetura-tecnica.md`)
**Status:** Em andamento
**Fontes:** `product-brief.md`, `pesquisa-mercado-e-tecnica.md`, `arquitetura-tecnica.md`
**Local do spike:** `spike/` (infra em `spike/infra/`, cliente em `spike/client/`)

---

## 0. O que mudou nesta revisão

Ao cruzar o escopo original do spike com o desenho de arquitetura (`arquitetura-tecnica.md`), duas correções importantes surgiram:

1. **O cliente Tauri não usa um SDK Rust de mídia.** Na arquitetura, a UI é uma SPA web (HTML/JS/TS) rodando dentro do webview nativo do Tauri — o Rust do lado cliente é só shell/integração com o SO. A captura de câmera/microfone e o join na sala LiveKit acontecem via **LiveKit JS/TS Client SDK** dentro do webview, não via `livekit-rust` no lado cliente. Isso **reduz** um risco que o escopo original citava ("SDK Rust do LiveKit menos maduro") — o SDK JS é o mais maduro de todos.
2. **Isso desloca o risco de Rust para outro lugar: o lado servidor.** O componente `TokenSvc` da arquitetura emite tokens de acesso ao LiveKit a partir do backend Rust, via **LiveKit Server SDK/API**. Esse é o único ponto onde Rust realmente toca o LiveKit diretamente, e ainda não foi validado — foi adicionado ao escopo (seção 2, item 5).
3. **Um risco novo e não documentado antes:** Insertable Streams (a API que a arquitetura assume para E2EE de mídia) é implementada de forma desigual entre motores de webview — o Tauri usa o motor nativo do SO (WebKitGTK no Linux, WebView2/Chromium no Windows, WKWebView no macOS), não um Chromium embutido único como o Electron. Suporte incompleto num desses motores comprometeria a decisão de arquitetura "E2EE por padrão" para aquela plataforma. Isso não estava no escopo original e foi adicionado como item de validação de maior prioridade (seção 2, item 6).

Consequência prática: **o escopo do spike cresceu**. A estimativa original de 1-2 semanas provavelmente fica mais próxima de 2-3 semanas, ou o spike deve ser dividido em duas ondas (ver seção 7). Fica como decisão do usuário confirmar o trade-off de prazo vs. cobertura.

## 1. Objetivo

Validar, antes de iniciar o MVP, os riscos técnicos centrais identificados na pesquisa técnica e no desenho de arquitetura: conectividade WebRTC via LiveKit self-hosted atrás de NAT, viabilidade de um cliente mínimo (Tauri + webview) capaz de exibir vídeo em posições fixas de câmera, emissão de tokens de acesso a partir de um backend Rust mínimo, e viabilidade técnica do mecanismo assumido para E2EE de mídia. O spike é deliberadamente descartável — não é código de produção, é prova de conceito para reduzir incerteza antes de comprometer a arquitetura do MVP.

## 2. Escopo — o que o spike precisa provar

1. **LiveKit self-hosted sobe localmente via Docker Compose** e aceita conexões de dois clientes distintos numa mesma sala.
2. **Conectividade NAT traversal funciona de fato** — não apenas localhost/mesma rede, mas dois clientes em redes diferentes. Isso exige validar TURN, não só o caminho feliz de conexão direta.
3. **Cliente mínimo (webview do Tauri + LiveKit JS/TS SDK)** consegue: capturar câmera e microfone locais, entrar numa sala LiveKit, publicar e assinar streams de **áudio e vídeo** de dois participantes.
4. **Grade de câmeras em posições fixas** — layout simples (2 a 4 posições fixas por usuário) renderizado no cliente, provando que o modelo "posição atrelada à pessoa" é tecnicamente viável na camada de vídeo antes de existir qualquer UI de administração.
5. **Emissão de token via backend Rust mínimo** — um serviço headless (não precisa ser o binário completo do produto) que usa o LiveKit Server SDK/API para gerar um JWT de acesso válido, replicando o papel do `TokenSvc` da arquitetura. Prova que o backend consegue mediar o acesso sem expor a API secret ao cliente.
6. **Viabilidade de Insertable Streams / WebRTC Encoded Transforms no webview do Tauri** — checagem de API disponível (não é necessário implementar a criptografia inteira, só confirmar que `RTCRtpScriptTransform`/`createEncodedStreams` funcionam no motor de webview usado nesta máquina, WebKitGTK/Linux). **Gap conhecido:** validação em Windows (WebView2) e macOS (WKWebView) fica fora do alcance desta máquina de desenvolvimento e precisa ser feita antes de comprometer definitivamente a decisão de E2EE para essas plataformas.
7. **Orçamento de recursos** — medir RAM do cliente Tauri idle e em chamada, RAM do servidor LiveKit local, e RAM do serviço de token Rust mínimo (item 5) — este último é baixo risco (servidor HTTP em Rust é bem conhecido), mas vale registrar como baseline.

## 3. Fora de escopo (adiado para o MVP ou depois)

- Implementação completa do protocolo de E2EE (derivação de chaves, custódia por canal, backup) — o spike valida só a **disponibilidade da API** de Insertable Streams, não o protocolo inteiro.
- Autenticação real, permissões, servidores/canais, persistência (SQLite/Postgres) — o serviço de token do item 2.5 é um stub, não o backend completo.
- Cenas trocáveis, Room Composite Egress, gravação/streaming.
- Instalador guiado, empacotamento multiplataforma final.
- Validação de Insertable Streams em Windows/macOS (gap explícito, ver item 2.6).
- UI polida — o cliente do spike pode (e deve) ser feio; é ferramenta de validação, não produto.

## 4. Pré-requisitos de ambiente

- [ ] **Docker operacional:** habilitar o daemon (`sudo systemctl enable --now docker`) e adicionar o usuário ao grupo `docker` (`sudo usermod -aG docker ricardosobral`). Pendente de confirmação do usuário.
- [ ] **Toolchain Rust** instalada (rustup, cargo) — necessária para o shell Tauri e para o serviço de token mínimo.
- [ ] **Toolchain de frontend** (Node.js + gerenciador de pacotes) — necessária para a SPA que roda dentro do webview.
- [ ] **Dependências de sistema do Tauri** para Linux (WebKitGTK e afins) — variam por distro (Fedora, nesta máquina).
- [ ] **coturn ou TURN embutido do LiveKit** — decisão pendente (seção 6, item 1 da versão original, mantida).

## 5. Estado atual (2026-08-24)

**Já feito:**
- `spike/infra/docker-compose.yml` — serviço `livekit` configurado, portas TCP 7880/7881 e faixa UDP 50000-50100 expostas.
- `spike/infra/livekit.yaml` — config mínima local, chave de API de teste (`spikekey`), TURN embutido desabilitado por enquanto.
- Este documento revisado com o escopo ampliado após o desenho de arquitetura.

**Ainda não feito:**
- Setup de Docker/grupo no host (bloqueando subir o LiveKit).
- Toolchain Rust/Tauri/Node no host.
- `spike/client/` está vazio — nenhum código do cliente mínimo, nem do serviço de token, criado ainda.
- Nenhum teste de conectividade cross-rede realizado.
- Nenhuma checagem de Insertable Streams realizada.
- Nenhuma medição de RAM realizada.

## 6. Decisões em aberto para o spike

1. **TURN: coturn separado vs. TURN embutido do LiveKit.** Recomendação: começar com o TURN embutido do LiveKit (menos peças móveis para validar o cliente primeiro) e só adicionar coturn separado no momento de testar NAT traversal real entre redes.
2. **Como simular duas redes diferentes** para o teste de NAT traversal — hotspot do celular, VM/dispositivo remoto, ou serviço de túnel.
3. **Ferramenta de medição de RAM** — `ps`/`smem` para os processos locais e `docker stats` para o container LiveKit.
4. **Escopo da checagem de Insertable Streams:** confirmar com o usuário se basta um teste isolado de API (um `RTCPeerConnection` de teste no webview verificando se os métodos existem e não lançam erro) ou se vale a pena ir um passo além e cifrar/decifrar um payload de exemplo entre dois tracks — a segunda opção é mais conclusiva, mas consome mais tempo do spike.
5. **Prazo:** confirmar se o spike segue como uma onda única (2-3 semanas, escopo ampliado) ou se divide em Fase 0a (LiveKit + cliente + TURN + grade de câmeras — o essencial para "a chamada funciona") e Fase 0b (token service Rust + Insertable Streams — os riscos de arquitetura mais específicos). Ver seção 7.

## 7. Checklist de execução (sugerido, em duas ondas)

**Onda 1 — a chamada básica funciona (essencial, bloqueia tudo o resto)**
1. Resolver pré-requisitos de ambiente (seção 4).
2. Subir o LiveKit via `docker compose` e confirmar que a porta 7880 responde.
3. Validar conexão entre dois clientes de teste na mesma rede, usando um cliente web de exemplo do próprio LiveKit (isola "o servidor funciona" de "o cliente construído funciona").
4. Criar o esqueleto do cliente (webview Tauri + LiveKit JS/TS SDK): captura de câmera/microfone, join em sala, publish/subscribe de áudio e vídeo.
5. Implementar grade fixa simples (2-4 posições) no cliente.
6. Testar cross-rede (decisão da seção 6.2) e validar TURN.
7. Medir RAM do cliente (idle e em chamada) e do servidor LiveKit.

**Onda 2 — riscos específicos de arquitetura (podem rodar em paralelo ou logo depois da Onda 1)**
8. Construir o serviço de token Rust mínimo usando o LiveKit Server SDK/API; validar que o token gerado é aceito pelo servidor LiveKit e que a API secret nunca é enviada ao cliente.
9. Trocar o cliente da Onda 1 para obter o token desse serviço em vez de usar a API key/secret diretamente (fecha o loop igual à arquitetura real).
10. Checagem de Insertable Streams/Encoded Transforms no webview desta máquina (Linux/WebKitGTK), no nível de profundidade decidido na seção 6.4.
11. Documentar explicitamente o gap de validação em Windows/macOS como item para revisitar antes do MVP.
12. Documentar resultados finais e decisão go/no-go para as premissas técnicas do MVP.

## 8. Critérios de sucesso

- Dois clientes distintos, em redes diferentes, conseguem se conectar numa mesma sala LiveKit self-hosted, com áudio/vídeo funcionando via TURN quando conexão direta não é possível.
- O layout de câmeras fixas é renderizado corretamente para ambos os participantes.
- O token de acesso ao LiveKit é emitido por um processo Rust separado do cliente, usando o Server SDK/API, e o cliente nunca tem acesso à API secret.
- A API de Insertable Streams/Encoded Transforms está disponível e utilizável no webview desta máquina (Linux/WebKitGTK) — ou, caso não esteja, isso é documentado como bloqueio de arquitetura a resolver antes do MVP, não descoberto tarde demais.
- Uso de RAM do cliente idle fica visivelmente abaixo de 1GB (ordem de poucas centenas de MB).
- Uso de RAM do servidor LiveKit local é registrado como baseline.

## 9. Riscos específicos do spike

| Risco | Mitigação |
|---|---|
| Curva de aprendizado de Rust/Tauri atrasa a Fase 0 | Reservar tempo de ramp-up explícito; começar pelo exemplo oficial do Tauri antes de integrar LiveKit |
| Teste de NAT traversal exige uma segunda rede real, não só localhost | Definir com antecedência como simular a segunda rede (seção 6.2) para não travar essa etapa no fim do spike |
| **Insertable Streams pode ter suporte incompleto em algum motor de webview (WebKitGTK/WKWebView), invalidando a premissa "E2EE por padrão" documentada na arquitetura** | Validar cedo (Onda 2) nesta máquina; tratar Windows/macOS como gap explícito a fechar antes de comprometer a decisão de arquitetura em definitivo |
| LiveKit Server SDK/API em Rust menos testado no fluxo real do produto | Validar geração e aceitação de token na Onda 2 antes de assumir como resolvido |
| Escopo ampliado nesta revisão pode não caber no prazo original de 1-2 semanas | Confirmar com o usuário se aceita estender o prazo ou dividir em Onda 1 / Onda 2 como sugerido |

---

**Próximo passo imediato:** confirmar os dois comandos de setup de Docker (seção 4), a decisão sobre TURN embutido vs. coturn (seção 6.1), e o trade-off de prazo/divisão em ondas (seção 6.5) antes de começar a execução.
