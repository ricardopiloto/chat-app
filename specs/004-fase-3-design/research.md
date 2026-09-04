# Research: Fase 3 — Redesign visual (Mesa / Nocturne)

Fecha as decisões de implementação da spec (Clarifications 2026-09-04) sobre o código F1+F2 e o protótipo em `docs/design-ref/`. Nenhum item fica como NEEDS CLARIFICATION.

---

## D1 — Vender Nocturne no frontend (não linkar docs/ em runtime)

- **Decision**: Copiar/adaptar `docs/design-ref/_ds/nocturne-*/styles.css` (tokens + classes `.btn`, `.dialog`, etc.) para `frontend/src/styles/` (ou equivalente). Acrescentar tokens semânticos do protótipo v2 (`--panel`, `--elev`, `--muted`, `--stage`, `--tile`, `--chip`, `--hover`, `--press`, `--sel-*`, `--input-bg`) e o bloco `.app[data-theme="light"]` do HTML do protótipo. A app **não** importa ficheiros de `docs/design-ref/` em produção/dev via path relativo ao DS.
- **Rationale**: `docs/` não é asset do Vite; fidelidade exige a mesma rampa de cores Inter/blurple, mas o bundle tem de ser estável. FR-014 compara com o DS e o protótipo como referência humana.
- **Alternatives considered**: npm package do DS — não existe. iframe do protótipo — rejeitado. Link absoluto a `docs/` — frágil e fora do tree de build.

---

## D2 — Shell Mesa: `data-theme` no contentor raiz

- **Decision**: Um `AppShell` (barra 48px + grelha sidebar|main) envolve rotas autenticadas. `data-theme="dark"|"light"` no contentor `.app` (como o protótipo). Tema: (1) `localStorage` se existir; senão (2) `prefers-color-scheme`; override manual grava no storage. Palco/tiles usam `--stage` / `--tile` que **não** clareiam no tema claro.
- **Rationale**: FR-001, FR-005, SC-003. Espelha o protótipo linha a linha no chrome.
- **Alternatives considered**: Duas folhas CSS completas — rejeitado (tokens semânticos já resolvem). Classe no `body` só — ok equivalente, mas o protótipo usa `.app[data-theme]`.

Sidebar única (~238px no desktop) com Servidor no cabeçalho; **sem** rail. Viewport estreita: gaveta overlay (D6).

---

## D3 — Preferências só em `localStorage` (chaves estáveis)

- **Decision**: Chaves (contrato em [contracts/ui-preferences.md](./contracts/ui-preferences.md)):
  - `mesa.theme` → `light` | `dark`
  - `mesa.viewMode` → `composition` | `grid` (Composição / Grade; **global por dispositivo**, não por canal)
  - opcional `mesa.stageMode` → `0` | `1` (se se quiser lembrar modo palco entre visitas; default off ao sair do canal)
- **Rationale**: Clarify Q4/Q5 — sem API. Isolar prefixo `mesa.` evita colisões.
- **Alternatives considered**: cookie httpOnly — overkill. Preferência por canal — rejeitada na clarify.

Rótulo da barra: string `instância · ${location.hostname}` (ou host da origem); sem endpoint.

---

## D4 — Rascunho de cena só no cliente; Salvar = APIs F2

- **Decision**: Ao entrar no editor, clonar o `layout` (+ `slot_count` / nome se editável) para estado local. Arrastar/teclado muta só o rascunho. **Descartar** restaura o clone inicial (ou último carregado). **Salvar** chama os endpoints já existentes (`PATCH` cena / `PUT` grid da activa conforme F2). Sair com rascunho dirty → diálogo guardar / descartar / cancelar.
- **Rationale**: Clarify Q2; FR-009; evita migration e “draft” no servidor.
- **Alternatives considered**: Endpoint `PUT .../draft` — rejeitado (fora de âmbito de contratos). Aplicação imediata F2 — rejeitada na clarify.

Co-diretor continua sem UI de edição (só activar).

---

## D5 — Vista Grade = composição local de participantes LiveKit

- **Decision**: **Composição** renderiza a cena activa (slots F2 + vazios). **Grade** monta uma grelha automática (ex. até 3×2) com **todos** os participantes presentes na chamada (identities LiveKit / conta), incluindo quem está no banco (sem slot na cena). Não altera `active_scene_id` nem envelopes.
- **Rationale**: PRD §4.3 / FR-008; “o que o participante pode ver” vs cena intencional. Dados já existem no cliente de voz.
- **Alternatives considered**: Grade = refetch servidor — desnecessário. Grade = segunda cena — rejeitado (confundiria com F2).

Banco na vista Composição: lista quem está na chamada e não tem `account_id` num slot da activa.

---

## D6 — Viewport estreita = gaveta overlay

- **Decision**: Breakpoint (ex. &lt;900px ou &lt;768px — fixar na implementação perto da largura do protótipo): sidebar `position: fixed/absolute` a cobrir, backdrop opcional, toggle “canais”. Modo palco força fechada. Desktop: coluna na grelha como o protótipo.
- **Rationale**: Clarify Q3; SC-005.
- **Alternatives considered**: Empilhar vertical — rejeitado. Só desktop — rejeitado.

---

## D7 — Omitir do protótipo o que a spec exclui

- **Decision**: Não portar: “Gravar cena…”, faixa E2EE desligada, checkbox de chave de canal no create, diretório público, `cameraModel` 1e/1f experimental, rail 1a. Mostrar sempre etiqueta/linha “E2EE activa”. Manter regressão `no_e2ee_toggle` no backend.
- **Rationale**: FR-011, SC-008, Out of Scope; avoid fake affordances.
- **Alternatives considered**: Botões disabled “em breve” — rejeitado (ruído e falsa expectativa).

---

## D8 — Auth/Invite no mesmo sistema de tokens

- **Decision**: `Auth.tsx` e `Invite.tsx` usam as mesmas classes/tokens (marca Mesa, campos `.field`/`.input`, botões outline). Fluxos crypto/cookie inalterados.
- **Rationale**: Clarify Q1; FR-010/015; SC-001.
- **Alternatives considered**: Auth “mínima” só cores — rejeitada na clarify.

---

## D9 — Testes e checklist de fidelidade

- **Decision**: Sem Chromatic/Percy nesta fase. Checklist humana [contracts/fidelity-checklist.md](./contracts/fidelity-checklist.md) (≥90% SC-006). Quickstart cobre US1–US4 + regressão F2. `cargo test` + `tsc` antes de validação manual.
- **Rationale**: Spec assume comparação lado a lado com o protótipo; automação visual é custo sem DS em CI.
- **Alternatives considered**: Screenshots CI — adiado.

---

## D10 — Contagem “N de M em cena”

- **Decision**: `N` = slots ocupados na cena activa; `M` = `slot_count` da activa (não o total de pessoas na chamada). Pessoas no banco não incrementam `N`. Contagem na lista de canais de voz: participantes na room se a informação já estiver fácil no cliente; senão omitir até haver sinal barato (MAY na FR-004).
- **Rationale**: Cabeçalho do protótipo (“5 de 6 em cena”) fala da composição, não do banco.
- **Alternatives considered**: M = pessoas na chamada — confunde com Grade.
