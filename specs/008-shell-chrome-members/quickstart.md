# Quickstart: 008-shell-chrome-members

Validação manual da shell chrome + membros. Sem migração DB.

## Pré-requisitos

- Backend + frontend a correr (ver README).
- Conta autenticada; ≥1 servidor com ≥1 canal de texto e ≥1 de voz; idealmente ≥2 membros no servidor.

## 1. Botões pílula

1. Abrir canal de texto e de voz.
2. Observar Enviar, Convite, Modo palco, Editar cena, controlos de chamada, botões de diálogo.
3. **Esperado**: cantos em pílula (raio máximo), alinhados ao protótipo; sem regressão em grupos já pílula.

## 2. Composer full width

1. Abrir canal de texto em viewport largo.
2. Comparar largura de `form.composer` com a lista de mensagens / cabeçalho.
3. **Esperado**: mesma largura útil; sem faixa estreita centrada (`max-width` 74ch ausente).
4. Reduzir viewport: composer continua a 100% do pane sem overflow horizontal.

## 3. Modo palco colapsado

1. Entrar em canal de voz; activar «Modo palco».
2. **Esperado**: rail de servidores **visível**; coluna de canais em **faixa estreita** com «mostrar canais» (não `display: none` total).
3. Clicar «mostrar canais»: coluna expande; **ainda** em modo palco.
4. Desligar «Modo palco»: layout normal (rail + sidebar + main).

## 4. Membros

1. Em canal de texto: clicar «Membros» no cabeçalho.
2. **Esperado**: painel à direita com membros do servidor.
3. Repetir em canal de voz.
4. Com painel aberto, mudar de servidor no rail.
5. **Esperado**: painel **permanece** aberto; lista actualiza para o novo servidor.
6. Fechar painel; reabrir: lista coerente.

## 5. Checks rápidos

```bash
cd frontend && npx tsc --noEmit
# CSS: tema Mesa carrega sem erro no DevTools
```

Ver contratos: [ui-chrome-stage-composer.md](./contracts/ui-chrome-stage-composer.md), [members-panel.md](./contracts/members-panel.md).
