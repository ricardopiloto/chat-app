# Review — Desenvolvedor Fullstack

**Change:** parley-public-home-and-login
**Data:** 2026-11-04 (segunda validação, sobre os artefatos já ajustados após a primeira)
**Veredito geral:** Aprovado com ressalvas

Código relido do disco: `frontend/src/index.tsx` (`Gate`), `pages/Auth.tsx` (`onMount`, `instance.status()`, `takeEmailTokenFragment`), `auth/AuthFrame.tsx`, `shell/ThemeSwitch.tsx` (`rounded`), `shell/LanguageSwitch.tsx` (`rounded-full`), `api/instance.ts` (`clearInstance`, `loadInstance`, `isNative`), `session/session.tsx` (`phase`, `restore`), `electron/main.ts` (`openOutside`, protocolo `mesa`), `scripts/verify-instance-setup.mjs`, `package.json` (`verify:*`). Backend não é tocado pela change.

## Itens da primeira revisão: situação

| Item anterior | Situação |
|---|---|
| Sessão presa em `loading` sem `baseUrl` no desktop | Corrigido em D1 / tarefa 1.2 / 5.3. |
| `/invite/<código>` vs. `/?invite=` | Corrigido na spec e em 1.3. |
| `entryScreen` incompleta (foundation, pop-out, loading) | Corrigido: o tipo de retorno de D1 lista os 10 destinos. |
| Rate limit / 429 | Corrigido em D3; ver ressalva de dono do estado abaixo. |
| Ferramenta de medição indefinida | Mudou para tarefa 1.6, mas a premissa dela não se confirma (ver §4). |
| `nativeEntry` não reiniciava em logout/troca | Corrigido em D4 e 5.3. |

## 1. Desenvolvimento do backend
Veredito: N/A

- Nenhuma rota, migração, contrato ou regra nova. Os pedidos usados já existem (`instance.status()`, `registrationConfig()`, `verifyEmail()`, `GET /health`). Coerente com o "Sem impacto" do `proposal.md`.
- Único contato indireto: o limite de 60/min de `instance/status` (ver §5).

## 2. Desenvolvimento do frontend
Veredito: Atenção

- **Consulta de estado precisa sair de `Auth.tsx` (D3, tarefa 4.2).** Hoje o pedido vive dentro do `onMount` de `Auth`, com `cancelled` local. Para a página pública consultar em segundo plano e `Auth` reaproveitar o resultado, é preciso um módulo/sinal fora de `Auth` (promessa em andamento + resultado + expiração). `verify-instance-setup.mjs:18-21` casa o texto exato `onMount(() => { if (isNative() && !currentInstance().baseUrl) return;`, exige ausência de `createEffect` e extrai o bloco do `onMount` por regex; qualquer extração quebra essas asserções. A tarefa 3.4 já prevê "atualizar conscientemente as asserções"; mantenha isso e prefira, na mesma tarefa, trocar as asserções textuais por uma verificação de comportamento do módulo novo.
- **`/login` como caminho.** `Auth` hoje decide o modo por `presetInvite` e `signin` (linha 40); não lê `pathname`. Tarefa 3.3 diz que `Auth` "inicia no modo pedido (`/login`, desktop `login` ou `register`)": detalhar que `/login` apenas cai no ramo `anonymous → Auth` do `Gate` e que o modo inicial do desktop vem de `nativeEntry`. Também confirmar o que acontece depois de entrar em `/login` com sucesso: a sessão vira `ready` e o `AppShell` abre sob o caminho `/login`; verificar que o roteador/atalhos do shell não tratam isso como rota inválida, e se convém levar a `/` (sem `replace` quebrar o histórico).
- **«Voltar ao início» na primeira conta (web).** Em instância com `initial_setup: true`, `/` redireciona de novo ao cadastro: o link volta, a página pública aparece um instante e é substituída outra vez. Sem erro, mas parece laço. Decidir: ocultar «Voltar ao início» quando `variant === "setup"`, ou aceitar e documentar.
- **`lazy`/`Suspense` é novo no projeto** (`grep lazy` só acha `loading="lazy"` em imagens). Tem custo: separação de chunk pelo Vite e comportamento no esquema `mesa://app` do Electron, cujo `protocol.handle("mesa")` precisa servir os arquivos dos chunks. Provável que funcione (o handler serve `dist`), mas a tarefa 5.3 deve incluir carregar o chunk de `ElectronHome` no Electron real ou com `?native=1` e fazer `npm run build` mostrar os chunks gerados.
- **Alternadores:** igualar `ThemeSwitch` (`rounded`, botões `rounded-sm`, `h-7 w-7`) e `LanguageSwitch` (`rounded-full`, `px-2.5 py-1`) exige trocar também o raio dos botões internos e a altura; a tarefa 1.5 fala em "pílula, borda, preenchimento, estado ativo", suficiente. Lembrar que os dois são usados fora das telas de entrada (`AppShell`/menu); a mudança aparece lá também. Aceitável, mas dizer isso no relatório de fidelidade.
- **`AuthField`** não aceita `class` (a tarefa 3.2 já registra). Alterar o wrapper de `AuthField` para `entry-control` afeta toda tela que o use; confirmar que só as telas de entrada o usam (`grep AuthField`) antes de aplicar por composição.
- Responsividade e temas: cobertos nas tarefas 4.4 e 3.1 (390/768/1280, claro/escuro).

## 3. Deploy e operação
Veredito: OK

- Só `dist` do frontend e nova versão do aplicativo; sem porta, variável de ambiente, serviço ou migração novos. O Nginx documentado serve `/login` por `try_files $uri /index.html`; sem mudança de infraestrutura.
- Reversão simples (restaurar `dist` e versão anterior). Links existentes continuam válidos.
- Depuração em produção: sem log novo, mas a falha silenciosa da consulta em segundo plano (429/tempo limite tratados como "configurada") não deixa rastro. Sugestão: `console.debug` com o motivo na consulta, para suporte de quem relatar "não vi o cadastro da primeira conta".

## 4. Qualidade de código
Veredito: Atenção

- **Tarefa 1.6 parte de uma premissa que não se confirma.** O texto diz "Chromium via Playwright já disponível no ambiente (sem nova dependência no projeto)". Neste ambiente existem os navegadores em `~/.cache/ms-playwright` (chromium-1243/1248), mas o pacote `playwright` não resolve a partir de `frontend/` (`require.resolve('playwright')` falha), não está em `package.json` e não há binário no PATH. A medição ±1 px é o critério central dos requisitos de coesão e de 3.2, 4.5 e 6.2; sem ferramenta, vira verificação manual. Escolher antes de implementar: (a) script que usa `playwright-core` via `npx --yes` fora do `package.json` apontando `executablePath` para o Chromium do cache; (b) `chrome-remote-interface`/DevTools do Chromium já usados na sessão do Electron (porta de depuração) por CDP puro com WebSocket do Node; ou (c) declarar `playwright-core` como `devDependency` e assumir a dependência (contraria "sem nova dependência" de `design.md`). Registrar a escolha na tarefa.
- **Cobertura de testes:** boa. `verify:entry-screens` com tabela de 10 destinos, paridade pt/en, cores literais, arquivos protegidos; reaproveita os `verify:*` de cadastro, e-mail, reset, instância. Falta um teste do módulo de estado compartilhado: um pedido por visita, tempo limite de 3 s, 429, reaproveitamento sem resultado expirado. Mencionar `verify:http-timeout` (D3) é o padrão certo (usa `esbuild` + fake de `fetch`).
- **`--experimental-strip-types`:** `entryScreen.ts` precisa de sintaxe apagável e **importações com extensão `.ts`** relativas, como nos outros `verify:*`; a tarefa 1.2 cita só "sem `enum`". Acrescentar a restrição sobre imports.
- **Resiliência:** o tempo limite de 3 s é novo; o `http.ts` tem 15 s por padrão. Implementar com `AbortSignal.timeout(3000)` passado à requisição (o `request` aceita sinal do chamador), não com `Promise.race` que deixa a chamada pendurada.
- **Acessibilidade e teclado:** requisitos presentes (uma `h1`, `nav` rotulada, salto, `details`, `prefers-reduced-motion`). `noindex` por meta: remover ao sair da rota exige `onCleanup`, que a tarefa 4.2 descreve.
- **Dimensão do ativo:** limite de 60 KB (1.1) é testável em `npm run build`.
- **Tamanho do pacote de trabalho:** 7 grupos, 29 tarefas, em `index.tsx`, `Auth.tsx`, `AuthFrame`, `Unlock`, `InstanceConnect`, catálogos. A ordem proposta (1 → 2/3 → 4 → 5 → 6 → 7) funciona; os grupos 2.1 e 3.1 esperam `rebrand-parley` (D-riscos), mas isso não está escrito em `tasks.md` como dependência. Escrever, para que o implementador saiba que 1, 4, 5 e 6 podem andar antes.

## 5. Execução das decisões arquiteturais
Veredito: OK

- `tasks.md` segue D1–D12 sem reabrir decisão: função pura (1.2), `entry.css` local (1.4, 3.2), sinal `nativeEntry` (3.3, 5.3), diálogo para a instância (5.2), recuperação visível (6.1), `lazy` e `noindex` (4.2, 5.3).
- Verificada a convergência com `review-architect.md`: as quatro correções da primeira rodada estão nos artefatos.
- Limitação que a implementação vai revelar: o limite compartilhado de `instance/status` atrás do Nginx sem `TRUSTED_PROXY=true`. D3 mitiga (página imediata, 429 = configurada), mas o primeiro administrador de uma instância nova pode ver a página pública em vez do cadastro inicial se o limite estourar; o caminho «Entrar» → `Auth` faz outra consulta. Reportado abaixo.

## Bloqueantes antes de implementar
Nenhum.

## Ajustes recomendados (não bloqueantes)
1. Tarefa 1.6: decidir a ferramenta de medição (ver §4); a premissa atual não se confirma neste ambiente.
2. Tarefa 4.2: fixar o módulo que guarda o resultado de `instance.status()` e substituir as asserções textuais de `verify-instance-setup.mjs` por teste do módulo.
3. Tarefa 3.3: esclarecer `/login` (e o que acontece após login em `/login`) e a regra de «Voltar ao início» quando `initial_setup: true`.
4. Tarefa 1.2: exigir imports relativos com `.ts` no módulo testado por Node.
5. Tarefa 5.3: validar o carregamento de chunk `lazy` sob `mesa://app` ou `?native=1`.
6. `tasks.md`: escrever a dependência de 2.1 e 3.1 em `rebrand-parley`.

## Limitações técnicas a reportar ao Arquiteto
- Rate limit de `instance/status` contado por instância atrás do proxy sem `TRUSTED_PROXY=true`: risco residual de 429 no primeiro acesso do administrador de uma instância nova; confirmar que a recomendação operacional (`TRUSTED_PROXY=true`) basta ou se vale isentar a leitura de `initial_setup` do limite (mudança de backend, fora do escopo desta change).
- Ferramenta de medição de alturas ausente (1.6): decisão entre dependência de desenvolvimento e script externo.
