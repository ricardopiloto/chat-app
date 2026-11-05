# Review — Desenvolvedor Fullstack

**Change:** instance-settings (segunda revisão, após a incorporação da primeira)
**Data:** 2026-11-05
**Veredito geral:** Aprovado com ressalvas

Contexto lido: `design.md`, `tasks.md` e os specs desta change; `backend/src/{security_headers,main,config,rate_limit}.rs`, `backend/src/ws/mod.rs`, `backend/migrations/0001_init.sql`, `backend/tests/common/mod.rs`, `frontend/src/pages/Account.tsx`; `parley-server-standalone/{design,tasks}.md` para o contato entre as duas changes. Sem CI de testes no projeto (só o workflow de release): `cargo test` e `verify:*` rodam localmente.

Os dois bloqueantes da primeira rodada foram resolvidos: o desligamento ordenado é agora entregue pela standalone (tarefa 3.1 dela) e a refatoração de testes está corretamente descrita (`BootPaths`, `Default` em `Config`, `TestApp::with_config`, 58 ocorrências).

## 1. Desenvolvimento do backend
Veredito: Atenção
- **Onde guardar a credencial de reautenticação não está definido.** A tabela `session` (`0001_init.sql`) não tem coluna para isso, e o design diz só «presa à sessão». Duas opções simples: um mapa em memória `session_id → expiração` (some no reinício, o que é aceitável para 5 minutos) ou uma coluna nova. — escolher e registrar em D7; a opção em memória evita migração.
- **HSTS acompanha o perfil derivado.** `security_headers.rs:22` emite `strict-transport-security: max-age=31536000; includeSubDomains` quando `cookie_secure || production`. Com o D13, configurar um `PUBLIC_BASE_URL` HTTPS passa a ligar a produção e, portanto, o HSTS de um ano. Com certificado **autoassinado** em um nome de domínio, o navegador deixa de permitir o «continuar mesmo assim», e a pessoa fica sem conseguir abrir a tela até o certificado ser corrigido; ao desfazer a mudança, o navegador mantém o HSTS em cache. (IPs não recebem HSTS, então o host local por IP não é afetado.) — o HSTS deve depender de o certificado ser confiável (ACME ou proxy declarado), não do mero perfil; usar `max-age` curto no início e sem `includeSubDomains`.
- `COOKIE_SECURE` derivado precisa ser calculado na materialização da `Config` (campo `cookie_secure`), porque o código lê `config.cookie_secure` direto em `login.rs:39` e `recovery_key.rs:280`, e `security_headers.rs` lê `cookie_secure || production`. — acrescentar à tarefa 1.4 uma asserção de que o valor materializado é o usado pelos três pontos.
- O desligamento do `WsHub` é viável: cada conexão já tem um `watch::Sender<bool>` de cancelamento (`ws/mod.rs`) e há `close_sessions`; um `close_all()` com prazo é uma extensão pequena. É trabalho da standalone, já na tarefa 3.1 dela. OK.
- Rotas `/api/admin/*` sobre o `AuthUser` existente, validação do token na transação `BEGIN IMMEDIATE` e `VACUUM INTO` com WAL são implementáveis como descritas. OK.

## 2. Desenvolvimento do frontend
Veredito: OK
- O desenho de roteamento (`setup` em `entryScreen`, assistente no primeiro login pelo padrão `welcomeAccountId`, configurações a partir da conta com `is_initial_operator`) é compatível com o código e foi refletido nas tarefas 6.1 a 6.3. OK.
- O diálogo de reautenticação e o «último erro de aplicação» têm tarefa própria (6.2c). OK.
- Se for adotado o padrão «aplicar com confirmação» sugerido pelo Arquiteto, o cliente precisa de uma contagem regressiva e de um botão «Confirmar» que faça uma nova requisição; hoje não há tarefa para isso. — acrescentar à 6.2c.

## 3. Deploy e operação
Veredito: Atenção
- **Dois nomes para o diretório de dados.** Esta change usa `--data-dir` e a standalone usa `PARLEY_DATA_DIR`, com padrões diferentes. Na implementação isso vira dois parâmetros diferentes lidos por módulos diferentes. — unificar (parâmetro e variável com o mesmo significado, padrão = diretório do banco quando `DATABASE_URL` existe) e citar nas tarefas 1.x e 4.x.
- A produção continua preservada pelo `mesa.env`; falta uma checagem de que o usuário `mesa` consegue criar `secret.key` e `bootstrap.json` em `/opt/mesa/data`. — acrescentar à 7.4.
- Observabilidade: o `diagnostics` com o último erro de aplicação cobre o novo caminho de falha; faltam logs estruturados do arranque (qual fonte venceu para cada campo, qual estágio falhou). — acrescentar às tarefas 5.2/4.1 um log de origem por campo, sem valores de segredos.

## 4. Qualidade de código
Veredito: Atenção
- A cobertura de testes ficou boa (precedência, validação atômica, concorrência, cifragem, token com atraso, trancamento, cópia verificada, reautenticação, fallback sem supervisor, primeiro arranque interrompido).
- Faltam casos de borda previstos pelos achados novos: (a) HSTS não emitido com certificado autoassinado em domínio; (b) reautenticação aceita após criação/login recente; (c) limite de tentativas do `/api/admin/reauth` por sessão/conta, não por IP; (d) comportamento de IP privado no predicado de «host público» do perfil derivado (`https://192.168.x.x`); (e) rollback automático quando o administrador não confirma uma mudança de endereço/proxy/TLS. — acrescentar como asserções às tarefas 1.4, 5.1b, 5.2 e 4.5.
- A tarefa 5.2 ficou grande (reinício, fallback, diagnóstico, três plataformas). — dividir em: (i) sequência de arranque com queda para a última boa; (ii) reinício integrado ao desligamento; (iii) verificação manual por plataforma.

## 5. Execução das decisões arquiteturais
Veredito: OK
- O design segue as decisões acordadas sem reabri-las: ordem 1 → 2 → 3, variável vence e trava, segredos mascarados, padrões preenchidos, caminhos de dados com nota de reinício no host, as seis decisões da rodada anterior. OK.
- As duas limitações novas (HSTS acompanhando o perfil; mudanças ao vivo que podem trancar o administrador) pertencem ao Arquiteto e estão listadas abaixo.

## Bloqueantes antes de implementar
- nenhum

## Limitações técnicas a reportar ao Arquiteto
- O perfil de produção derivado liga o HSTS de um ano (`security_headers.rs`); com certificado autoassinado em domínio, isso impede o acesso pelo navegador e não pode ser desfeito do lado do servidor.
- Mudanças ao vivo (`PUBLIC_BASE_URL`, proxy, TLS) podem inutilizar a sessão atual sem que a queda para a última boa dispare; precisam de «aplicar com confirmação».
- O diretório de dados está definido de duas maneiras nas duas changes (`--data-dir` e `PARLEY_DATA_DIR`).
