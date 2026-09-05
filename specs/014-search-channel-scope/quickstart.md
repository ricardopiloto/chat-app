# Quickstart: 014-search-channel-scope

Validação manual do atalho e da sintaxe `#canal`. Backend inalterado.

## Pré-requisitos

- Backend + frontend a correr (`README.md`).
- Conta com ≥1 servidor, ≥2 canais de texto (ex. `geral`, outro) e ≥1 canal de voz.
- Mensagens conhecidas em pelo menos dois canais de texto.

## 1. Atalho Ctrl+F / Cmd+F

1. Abrir um **canal de texto** (ex. `geral`).
2. Pressionar Ctrl+F (ou Cmd+F no macOS).
3. **Esperado**: campo de pesquisa expande; conteúdo `#geral ` (nome + espaço); foco no fim; browser find **não** abre.
4. Digitar um termo conhecido nesse canal (≥2 chars após o espaço).
5. **Esperado**: resultados só de `geral`.
6. Abrir um **canal de voz**; Ctrl+F.
7. **Esperado**: campo abre/foca **sem** prefixo `#` obrigatório.
8. Com o campo já preenchido noutro termo, voltar a um canal de texto e Ctrl+F.
9. **Esperado**: texto **substituído** por `#<nome-actual> `.

## 2. Sintaxe `#canal` e global

1. Expandir pesquisa (ícone ou atalho).
2. Confirmar placeholder menciona `#canal` / pesquisa global.
3. Digitar termo **sem** `#` presente em dois canais → hits dos dois (só texto).
4. Digitar `#geral <termo>` → só esse canal.
5. Digitar `#nome-fantasma ab` → **Canal não encontrado**; zero hits de outros canais.
6. Digitar `#<nome-do-canal-de-voz> ab` → **Só canais de texto** (ou copy equivalente).
7. Digitar `#geral zzzzinexistente` (canal ok) → **Sem resultados**.

## 3. Checks rápidos

```bash
cd frontend && npx tsc --noEmit
```

Ver: [search-query-syntax.md](./contracts/search-query-syntax.md), [search-shortcut.md](./contracts/search-shortcut.md).
