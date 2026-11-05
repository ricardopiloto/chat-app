# Changes do OpenSpec em backlog

Changes completas (proposta, specs, design e tarefas) que foram **pausadas** e retiradas de `openspec/changes/` para não aparecerem como trabalho ativo. As pastas estão intactas, inclusive `.openspec.yaml` e os relatórios de revisão.

| Change | Pausada em | Observação |
|---|---|---|
| `instance-settings` | 2026-11-05 | Configuração da instância pelo navegador (instalador web, tela do administrador, segredos cifrados). Assumia vários itens da `parley-server-standalone` (frontend servido pelo backend, TLS embutido, desligamento ordenado, LiveKit gerenciado). Decisão: implementar primeiro a standalone, em entregas menores, e só depois retomar esta change, revalidando-a contra o código então existente. A revalidação contra a `main` (sem a standalone) está na conversa de 2026-11-05: HTTPS no setup via proxy confiável, chaves do LiveKit só por ambiente, reinício por `exec` no Unix, desligamento ordenado dentro da própria change |
| `desktop-local-host` | 2026-11-05 | Hospedar uma instância local pelo app desktop. Depende da `parley-server-standalone` e da `instance-settings`; a decisão sobre a sondagem de portas na instância oficial continua em aberto. A revisão da standalone apontou o contrato de parada pelo processo pai no Windows (`--stop-on-stdin-eof`) e o código de saída de reinício, que esta change exigirá |

## Como retomar
```
mv docs/backlog/changes/<change> openspec/changes/<change>
openspec validate <change> --strict
```
Antes de retomar, revalide as dependências contra o código então existente: os contratos descritos nas próprias changes (motivo da parada, fonte das chaves do LiveKit, estado do LiveKit, padrões de instalação nova) só valem se a standalone for implementada como foi desenhada.
