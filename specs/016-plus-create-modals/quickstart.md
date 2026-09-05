# Quickstart: 016-plus-create-modals

Validação visual dos modais «+» e herança de tema. Sem backend novo.

## Pré-requisitos

- Backend + frontend a correr (`README.md`).
- Conta **dona** de um servidor (para ver «+» de canais).
- Saber alternar tema na topbar (013).

## 1. Criar canal — look Mesa

1. Abrir um servidor como dono.
2. Clicar **+** em **Texto** → modal «Criar canal de texto».
3. **Esperado**: overlay e painel com aspecto Mesa (superfície/raios/botões do shell); input de nome com o mesmo estilo de inputs da app; Cancelar/Criar como `.btn*`.
4. Repetir com **+** em **Voz e vídeo**.
5. Cancelar / clicar fora → fecha; shell intacto.

## 2. Tema claro/escuro ao vivo

1. Tema **escuro** → abrir criar canal → legível.
2. **Sem fechar** o modal, alternar para **claro** na topbar.
3. **Esperado**: modal e input actualizam de imediato para o tema claro (não ficam «escuros presos»).
4. Alternar de volta para escuro com o modal ainda aberto → actualiza de novo.
5. Fechar, tema claro, reabrir → continua coerente.

## 3. Criar servidor via +

1. Clicar **+** no rail de servidores.
2. **Esperado**: mesmo família visual/tema que os modais de canal.

## 4. Regressão funcional rápida

1. Criar um canal de texto com nome válido → sucesso como antes.
2. (Opcional) Criar servidor de teste → sucesso como antes.

## 5. Checks

```bash
cd frontend && npx tsc --noEmit
```

Ver: [dialog-surface.md](./contracts/dialog-surface.md), [form-controls-theme.md](./contracts/form-controls-theme.md).
