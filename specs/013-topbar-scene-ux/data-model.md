# Data Model: 013-topbar-scene-ux

Sem alterações de schema SQLite nem de contratos REST/WS. Apenas estado de UI no cliente.

## Preferência de tema (existente)

| Campo | Tipo | Persistência | Notas |
|-------|------|--------------|-------|
| `theme` | `"light" \| "dark"` | `localStorage` chave `mesa.theme` | Via `theme/theme.ts`; toggle na topbar escreve e aplica |
| Ícone | — | — | `IconSun` se `light`; `IconMoon` se `dark` (estado **actual**) |

### Transições

```
tema = dark, clique toggle → writeTheme("light") + applyTheme + ícone = IconSun
tema = light, clique toggle → writeTheme("dark") + applyTheme + ícone = IconMoon
reload → resolveTheme() restaura preferência
```

## `AccountMenuState` (cliente)

| Campo | Tipo | Persistência | Notas |
|-------|------|--------------|-------|
| `open` | `boolean` | Sinal local | Popover ancorado ao `user-chip` |
| `confirmLogoutOpen` | `boolean` | Sinal local | Dialog de confirmação |

### Transições

```
clique user-chip → open = true
Escape / clique fora (menu) → open = false
escolher «Terminar sessão» → confirmLogoutOpen = true (menu pode fechar ou ficar atrás do dialog)
cancelar diálogo → confirmLogoutOpen = false; sessão intacta
confirmar diálogo → onLogout(); confirmLogoutOpen = false; open = false
```

Conteúdo do menu: `handle` (só leitura, de `Account`) + acção Terminar sessão. Sem edição de perfil.

## `InlineSearchState` (cliente; refina SearchState da 012)

| Campo | Tipo | Notas |
|-------|------|-------|
| `expanded` | `boolean` | Ícone em repouso vs campo inline visível |
| `query` | `string` | Mínimo 2 caracteres antes de pesquisar |
| `status` | `"idle" \| "searching" \| "done"` | Igual à 012 |
| `results` | `SearchHit[]` | Igual à 012; lista anexada ao campo expandido |

### Transições

```
clique IconSearch → expanded = true; focus input
Escape / clique fora (sem obrigar logout) → expanded = false; limpa query/results (ou só recolhe — preferir limpar ao recolher)
query length < 2 → results = []; status = idle
query length ≥ 2 + debounce → status = searching → resultados progressivos
escolher hit → navigate; expanded = false
```

## Catálogo de ícones (delta)

| Ícone | Acção |
|-------|--------|
| `IconSun` | Novo — tema claro activo |
| `IconMoon` | Novo — tema escuro activo |
| `IconSettings` | Remover uso; apagar ficheiro se órfão |
| `IconSearch` | Mantém; activa expansão inline |

## Layout do editor (UI, sem entidade de domínio nova)

| Zona | Comportamento |
|------|----------------|
| Toolbar | Cabeçalho fixo: título + Descartar/Salvar |
| Body | Desktop: `1fr` (stage) + `296px` (side); narrow: stack + scroll |
| Stage / Side | Mesmos controlos de layout/banco já existentes |

`SceneDraft` / `GridLayout` (003) **não mudam**.

## Validação (UI)

- Toggle: ícone e `data-theme` no `.app` nunca dessincronizados após clique.
- Logout: impossível encerrar só com abrir o menu ou só com escolher o item sem confirmar o diálogo.
- Pesquisa: sem `Dialog` envolvente para o campo de digitação; âmbito de servidores inalterado.
- Editor: em ≥1200px, body preenche o painel de voz (sem cartão centrado com grande margem vazia).
