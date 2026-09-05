# Quickstart: 018-scene-camera-count

Validar N variável no editor de cena e palco após guardar.

## Pré-requisitos

- Backend + frontend a correr.
- Conta **dona**/admin de um servidor com canal de voz; poder abrir **Editar cena**.

## 1. Controlo de N + rascunho

1. Entrar no canal de voz → **Editar cena**.
2. Alterar número de câmeras para **6** (sem guardar).
3. **Esperado**: pré-visualização com 6 slots; palco ao vivo (se visível noutro cliente/aba) ainda com N antigo.
4. Descartar → N volta ao guardado.

## 2. Mestre + N=6

1. Layout **Mestre em destaque**, N=6, guardar.
2. **Esperado**: 1 tile maior (posição fixa) + 5 menores; palco ao vivo actualiza após save.

## 3. Faixa N-up

1. Layout **Faixa**, N=6 → rótulo tipo **Faixa 6-up**; 6 tiles iguais em faixa; guardar.
2. N=3 → três tiles; não ficam cinco vazios fixos.

## 4. Reduzir N

1. Com N=6 e pelo menos um slot ocupado nos «a mais», baixar para 4.
2. **Esperado**: UI pede escolher slots a remover; após confirmar, 4 slots; ocupantes removidos no banco.
3. Com excesso só vazio, baixar N → remove vazios **sem** diálogo.

## 5. Painel

1. Layout Painel + N=6 → grelha de 6 sem destaque mestre; N=4 → grelha equilibrada tipo 2×2.

## 6. Checks

```bash
cd frontend && npx tsc --noEmit
cd backend && cargo test --test contract
```

Ver contratos em [contracts/](./contracts/).
