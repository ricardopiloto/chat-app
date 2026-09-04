# UI Shell Contract — Mesa / Nocturne

Contrato de **estrutura e tokens** da SPA face ao protótipo v2. Não é OpenAPI.

## Referências

- Protótipo: `docs/design-ref/Mesa - Protótipo v2.dc.html`
- DS: `docs/design-ref/_ds/nocturne-*/styles.css`
- Pesquisa: [../research.md](../research.md) D1–D2

## Contentor

```html
<div class="app" data-theme="dark|light">
  <header><!-- TopBar ~48px --></header>
  <div class="shell"><!-- grid: sidebar | main --></div>
</div>
```

## TopBar (obrigatório)

| Elemento | Conteúdo |
|----------|----------|
| Marca | Marca visual + texto **Mesa** |
| Instância | `instância ·` + hostname ([ui-preferences.md](./ui-preferences.md)) |
| Tema | Segmented Escuro / Claro |
| Utilizador | Chip com handle (iniciais ok) |

## Sidebar (navegação 1b)

| Zona | Conteúdo |
|------|----------|
| Cabeçalho | Nome do Servidor + controlo de troca (sem rail) |
| Secção Texto | Lista `#` canais texto; activo com fundo press / weight 600 |
| Secção Voz e vídeo | Lista canais voz; activo igual |
| Acções | Criar canal, Criar servidor (pílula / outline) |
| Rodapé | Membros se disponível; `self-hosted · sem federação` |

**Desktop**: coluna fixa na grelha.  
**Estreito**: gaveta overlay; toggle explícito; modo palco → fechada.

## Main — canal de texto

- Cabeçalho com nome + etiqueta **E2EE activa**
- Mensagens agrupadas por autor (avatar/iniciais, nome, hora)
- Largura de leitura ~74ch
- Composer Enter = enviar

## Main — canal de voz/vídeo

- Cabeçalho: nome, cena activa, `N de M em cena` (ocupados / slot_count)
- Toggle **Composição | Grade**
- Palco escuro (`--stage`); tiles com dica de slot + chip
- Banco (Composição): contas na chamada sem slot
- Controlos: microfone, câmara, sair; linha “E2EE activa · …”
- **Proibido**: Gravar cena, faixa E2EE desligada

## Editor de cena

- Palco editável + painel layouts 2–4 + banco arrastável
- Cabeçalho: Descartar / Salvar
- Equivalente teclado a atribuir slot (documentar no quickstart)

## Auth / Invite / Dialogs

- Mesmos tokens; botões primários **outline** (acento), não flood
- Um objectivo por diálogo

## Token minimum set

O bundle MUST expor (nomes equivalentes aceites se documentados):

`--color-bg`, `--color-surface`, `--color-text`, `--color-accent` (#9184d9 family), rampas neutral/accent, `--font-body` / `--font-heading` (Inter), `--radius-md` (~8px), `--panel`, `--stage`, `--tile`, `--muted`, `--hover`, `--press`, `--sel-bg`, `--sel-fg`.

Foco: `:focus-visible` outline 2px acento.
