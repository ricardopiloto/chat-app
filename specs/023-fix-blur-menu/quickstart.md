# Quickstart: 023-fix-blur-menu

Validação manual. Ver [contracts/blur-menu-visibility.md](./contracts/blur-menu-visibility.md).

## Pré-requisitos

- App a correr; entrar num canal de voz/vídeo (chamada ao vivo).
- Preferência de blur pode estar on ou off.

## §1 Abrir o menu (layout normal)

1. Clicar na **seta** junto ao ícone de câmera.
2. Ver menu com **Sem blur**, **Blur leve**, **Blur forte** — legível, não cortado.
3. Confirmar `aria-expanded` / aspecto de aberto na seta.

## §2 Escolher / fechar

1. Escolher uma opção → menu fecha; seta reflecte blur on/off.
2. Reabrir → Escape fecha; reabrir → clique fora fecha.
3. Clique no **ícone** de câmera (não a seta) → só toggle câmera, sem abrir menu.

## §3 Modo palco (reporte)

1. Activar modo palco / canais expandidos como no bug report.
2. Repetir §1–§2: menu visível e clicável.

## Automação

```bash
cd frontend && npx tsc --noEmit
```
