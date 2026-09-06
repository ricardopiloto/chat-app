# Data Model: 032-voice-join-camera-choice

Sem tabelas novas. Entidades conceptuais e regras sobre estado existente.

## Join camera choice (cliente)

| Campo | Tipo | Notas |
|-------|------|--------|
| intent | `with_camera` \| `without_camera` \| `test` | Escolha da tentativa de join |
| mic_on | bool | Default `true` no join |
| cam_on | bool | `true` só em `with_camera` / `test` |

Não persistido em conta; só na tentativa (e estado da sessão LiveKit após sucesso).

## Voice occupant (existente)

| Campo | Uso nesta feature |
|-------|-------------------|
| `mic_on` / `cam_on` | Join sem câmera → `cam_on = false`; patch ao ligar/desligar |
| channel / session | Inalterado |

## Grid slot / AssignedBy (existente)

| Conceito | Regra 032 |
|----------|-----------|
| Auto-assign no **join** | Só se `cam_on == true` |
| Auto-assign no **PATCH** `cam_on: true` | Só se ainda sem slot **e** `auto_assign_first_empty` permitir (cena activa, sem owner-lock, slot livre) |
| Owner-lock | Qualquer slot `assigned_by = owner` → sem auto-assign (já em `auto_assign_first_empty`) |
| Banco | Participante em chamada (`inCall`) sem `account_id` num slot → `CallBank` / `deriveBank` |

## State transitions

```text
[fora] --pré-join com câmera--> [join cam_on=true] --> [slot auto?] --> [na chamada, cam on]
[fora] --pré-join sem câmera--> [join cam_on=false] --> [banco] -------> [na chamada, cam off]
[banco, cam off] --ligar câmera + auto OK--> [slot]
[banco, cam off] --ligar câmera + auto NOK--> [banco, cam on]
```

## Validation

- Join sem câmera MUST NOT exigir track de vídeo.
- Join com `cam_on: false` MUST NOT ocupar slot via auto-assign.
- Transição para `cam_on: true` MUST NOT forçar slot se owner-lock ou grade cheia.
