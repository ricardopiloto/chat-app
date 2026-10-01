# Política de alteração de backend durante a reescrita do frontend

O backend da v1 (`backend/`) é reaproveitado como está. O frontend v2 consome os mesmos endpoints REST, o mesmo protocolo WebSocket e o mesmo modelo de dados.

## Quando uma alteração de backend é admitida

Só quando **todas** as condições se verificam:

1. Um requisito de um spec do frontend v2 (ou um item de `docs/v2/parity-checklist.md`) não pode ser satisfeito com os endpoints actuais.
2. Não existe alternativa razoável no cliente (por exemplo, compor chamadas existentes).
3. A necessidade vem do frontend. Elementos de mockup que exigiriam dados ou endpoints inexistentes são **fora de escopo** (AUDIT-fidelity §6) e não justificam alteração.

## Como a alteração tem de ser feita

- **Aditiva e retrocompatível**: novos campos opcionais, novos endpoints, novos eventos. Nenhum campo ou rota existente muda de significado ou é removido enquanto o rollback para a v1 (`frontend/dist`) estiver disponível.
- **Tarefa própria** no `tasks.md` do change que a exige, com o requisito que a motiva.
- **Contrato registado** na tabela abaixo e, se mudar a forma de dados, em `specs/002-fase-1-mvp/contracts/` (REST/WS) ou nesta pasta (formatos criptográficos).
- **Testes**: `cargo test` do backend a passar, com testes novos para o comportamento acrescentado.
- **Migração**: se houver migração de base de dados, é aditiva e aplicável sobre dados existentes.

## Registo de alterações

| Data | Change | Requisito que a exige | Alteração | Retrocompatível | Testes |
|---|---|---|---|---|---|
| — | — | Nenhuma alteração de backend registada até à data. | — | — | — |

O `frontend-v2-polish-cutover` reconcilia esta tabela antes do corte (tarefa 4A.4).
