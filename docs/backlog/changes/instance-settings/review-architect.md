# Review — Arquiteto de Soluções

**Change:** instance-settings (segunda revisão, após a incorporação da primeira)
**Data:** 2026-11-05
**Veredito geral:** Aprovado com ressalvas

Contexto: artefatos lidos do disco (`proposal`, `design`, `tasks`, `specs/**`), mais `parley-server-standalone/{design,proposal}.md`, `web-home-page/{proposal,design}.md`, `desktop-local-host/design.md` e o código citado na revisão anterior (`config.rs`, `rate_limit.rs`, `security_headers.rs`, `main.rs`).

Os dois bloqueantes e as atenções da primeira rodada foram tratados: queda para a última boa no mesmo arranque (D8), atraso progressivo em vez de 429 por IP (D5), perfil de produção derivado (D13), reautenticação e histórico de auditoria (D7), segredo ilegível tratado como não configurado (D4), sequência de arranque desenhada e a ordem 1 → 2 → 3 explícita.

## 1. Definição da arquitetura técnica
Veredito: OK
- A sequência de arranque (`BootPaths` → banco → configurações → tentativa pendente/última boa → listener) ficou clara e cobre os casos de falha sem supervisor. OK.
- O estado da instalação (`vazia` → `em configuração` → `configurada`) e o tratamento de instâncias com contas já existentes preservam a produção atual. OK.
- Escala: sem impacto (snapshot por pedido, sem I/O). N/A.

## 2. Integração com a infraestrutura existente
Veredito: Atenção
- **O diretório de dados é definido de duas formas diferentes nas duas changes.** `instance-settings` fala em «`--data-dir` (parâmetro obrigatório, padrão por sistema)»; a `parley-server-standalone` (D1) o define como `PARLEY_DATA_DIR`, «com padrão no diretório do arquivo do banco». Na produção atual (`DATABASE_URL=sqlite:///opt/mesa/data/chat.db`) os dois resultados são diferentes se nada for configurado, e `secret.key`, `bootstrap.json`, certificado e binário do LiveKit passariam a viver em lugares distintos conforme a change que os cria. — unificar: um único parâmetro (`--data-dir` e `PARLEY_DATA_DIR`), com a regra de padrão «diretório do banco quando `DATABASE_URL` está definida, senão o padrão por sistema», e escrever essa regra no spec de `instance/settings`.
- A produção atual (systemd, `/etc/mesa/mesa.env`, dados em `/opt/mesa/data`) é preservada: variáveis vencem, campos travados, administrador existente vê a tela. O usuário `mesa` precisa poder gravar `secret.key` e `bootstrap.json` em `/opt/mesa/data` (já grava ali). — acrescentar à tarefa 7.4 a conferência de permissões.
- Backup: banco + `secret.key` + `bootstrap.json` e a regra do `VACUUM INTO` estão documentados nas tarefas. OK.
- A referência a `PUBLIC_HOME` na `web-home-page` (proposta e Nginx) não está definida em nenhum spec da standalone; esta change a lista na D11 como campo. — registrar que `PUBLIC_HOME` é criada por `web-home-page`/standalone e só aparece na tela quando existir, sem criar dependência em ciclo.

## 3. Qualidade de arquitetura e trade-offs
Veredito: Atenção
- **Mudanças aplicadas ao vivo que podem trancar o próprio administrador fora.** Alterar `PUBLIC_BASE_URL`, o proxy confiável ou o TLS muda o perfil de produção e o `Secure` dos cookies sem reiniciar. Se o administrador salvar uma URL `https` enquanto o acesso real é por outro caminho (HTTP atrás de um proxy não declarado, ou domínio ainda não apontado), a sessão atual deixa de funcionar e a queda para a «última boa» **não dispara**, porque o servidor continua de pé. O objetivo «sem acesso à máquina» fica comprometido. — adotar o padrão «aplicar com confirmação»: as mudanças de endereço, proxy e TLS ficam ativas por um prazo curto e voltam sozinhas à configuração anterior se o administrador não confirmar por uma nova requisição bem-sucedida; vale também para o assistente.
- **Reautenticação logo depois de criar a conta.** O assistente muda endereço e TLS (ações sensíveis) minutos depois de o administrador ter acabado de criar a conta com senha; pedir a senha outra vez é atrito sem ganho de segurança. — considerar a criação da conta/login recente (por exemplo, nos últimos 5 minutos) como reautenticação válida.
- **O endpoint `/api/admin/reauth` é um oráculo de senha.** Se usar o limitador de login por IP, atrás de um proxy cai no mesmo balde compartilhado do IP `127.0.0.1` (o problema que motivou D5). — limitar por sessão/conta e não por IP, com atraso progressivo.
- O atraso progressivo global no token (D5) tem teto curto e a entropia de 256 bits como defesa; o risco de o dono ser atrasado por um abusador é aceito e documentado. OK.
- Segredos cifrados, máscara sem valor no cliente, `InstanceAdmin` sem acesso a conteúdo e auditoria sem valores de segredo estão coerentes com a garantia `no_plaintext_at_rest` do projeto. OK.
- Perfil de produção derivado (D13): a regra de «host público» reutiliza o predicado já existente em `Config::validate`, o que evita divergência. Atenção para IPs privados (LAN/host local): `https://192.168.x.x:8443` conta como «público» pelo predicado atual (só exclui `localhost`/loopback), o que liga as exigências de produção para o host local do app desktop. — decidir explicitamente (e testar) o comportamento para IPs privados.

## 4. Documentação e decisões (ADRs)
Veredito: OK
- O `design.md` agora tem sequência de arranque, estados da instalação e alternativas descartadas nas decisões novas (D5, D8, D9, D12, D13). Os ADRs restantes (D6, D7, D10, D11) não listam alternativas, o que é aceitável pelo tamanho. OK.
- Falta atualizar `desktop-local-host` (ainda cita `init` e variáveis); já conhecido e fora desta change. — rastrear como pendência.

## 5. Ponte entre produto e técnico
Veredito: OK
- O pedido (configurar tudo pelo navegador, máquina só em casos extremos, `.env` assumido e travado, segredos mascarados, padrões preenchidos, nota de reinício no host para caminhos) está traduzido em requisitos testáveis. O ponto «máquina só em casos extremos» depende de resolver a atenção da seção 3 (mudanças que podem trancar o administrador).

## Bloqueantes antes de implementar
- nenhum
