# Review — Desenvolvedor Fullstack

**Change:** dice-appearance-preferences  
**Data:** 2026-11-10  
**Veredito geral:** Aprovado com ressalvas

## 1. Desenvolvimento do backend

Veredito: Atenção

- API `GET`/`PUT …/dice-appearance/me` + embed em `POST …/dice` é implementável no padrão actual (`dice_toolbar`, `create_dice_roll` com `content_plaintext`).
- Migração: PK composta + `REFERENCES account(id) ON DELETE CASCADE` e `REFERENCES channel(id) ON DELETE CASCADE` (toolbar só tem account — aqui o canal é obrigatório; tasks 1.1 devem explicitar FK do canal).
- Validação allow-list (1.2) é crítica: presets/textures da lib são muitos; subset partilhado backend/frontend evita drift.
- Authz: definir no código se GET/PUT exigem só membership ou o mesmo `require_write_text` do roll — design diz “ler/rolar”; recomendo **membership + can see channel** para GET/PUT, write só no roll.

## 2. Desenvolvimento do frontend

Veredito: Atenção

- Estender `DiceRoll` em `timeline.ts` / parse em `thread.ts` com `appearance` opcional + defaults.
- **Risco real:** `DiceBox` é singleton criado com `{ sounds: false }` em `diceBoxHost.ts`. D4 admite recreate se a lib não actualizar tema em runtime — task 2.2 deve provar cedo (duas skins seguidas) e, se falhar, recriar o box ou expor `updateConfig` se existir na API.
- Assets: `public/dice-box-threejs/{textures,sounds}` já existem — sound on precisa destes ficheiros (já syncados); OK.
- UI no config da toolbar Dados (3.1): presets + color picker nativo + selects — viável; mobile: painel já existe, manter compacto.
- Texto sem UI (3.2): OK como verificação de regressão via API/preferência noutro canal Dados com o mesmo… wait, preference is per-channel, so Text channel needs its own row. Setting Text appearance without UI means only defaults unless we copy or expose API-only. Task 3.2 as written (“preference set via API or Dados”) is slightly misleading for **Text channel id** — setting on Dados channel A does **not** apply when rolling on Text channel B. Recommend verifying Text roll uses **that Text channel’s** stored preference (seeded via PUT in contract/smoke), not Dados preference.

## 3. Deploy e operação

Veredito: OK

- Só migração SQLite + rotas; scripts `cargo test` / `tsc` bastam.
- Sem env/porta novas; logs de validação `bad_request` suficientes.

## 4. Qualidade de código

Veredito: OK

- Tasks com verify (contract + tsc + smoke 4.1); padrão do repo.
- Contratos: novo módulo + assert `appearance` no dice contract existente (1.4).
- Erros: rejeitar body inválido sem corromper row anterior — já no spec.

## 5. Execução das decisões arquiteturais

Veredito: OK

- Tasks seguem D1–D5 sem reabrir “preferência global” ou “lookup no viewer”.
- Limitação a reportar: mutabilidade de tema no singleton da lib (secção 2) — se recreate for necessário, não muda o contrato do snapshot.

## Bloqueantes antes de implementar

- Nenhum.

## Limitações técnicas a reportar ao Arquiteto

- Aplicação de tema no `DiceBox` singleton pode exigir recreate; impacto só de performance/UX momentânea, não de modelo de dados.
- Preferência per-channel implica que UI só em Dados não popula Text channels — produto já marcou Non-Goal; reforçar na task 3.2 o seed via PUT no **mesmo** `channel_id` de Texto.
