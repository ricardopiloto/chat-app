# Análise Comparativa de Mercado — Permissionamento e Perfis do Discord

## 1. Objetivo

Este documento analisa tecnicamente o modelo de perfis, cargos, permissões, hierarquia e controle de acesso do Discord, com foco em identificar:

- como o modelo funciona;
- quais entidades participam da autorização;
- como as permissões efetivas são calculadas;
- como canais e categorias alteram o acesso;
- como voice/video e comandos entram no modelo;
- quais são as limitações arquiteturais;
- quais conceitos devem ser reproduzidos, modificados ou evitados no Mesa.

A análise trata o Discord como referência de produto e arquitetura para um aplicativo self-hosted de comunicação voltado a grupos de RPG.

---

## 2. Resumo executivo

O modelo de autorização do Discord pode ser entendido como uma combinação de:

1. **RBAC (Role-Based Access Control)**;
2. **ACL/permission overwrites por canal**;
3. **hierarquia de cargos para operações administrativas**;
4. **permissões representadas como bit flags**;
5. **estados operacionais temporários**, como timeout;
6. **permissões específicas para comandos/interações**.

O ponto fundamental é que o Discord não trabalha simplesmente com:

```text
User -> Permissions
```

O modelo é mais próximo de:

```text
User
  |
  v
Guild Member
  |
  +---- Roles
  |       |
  |       +---- Permissions
  |
  +---- Member-specific state
  |
  v
Base Permissions
  |
  v
Channel Permission Overwrites
  |
  v
Effective Permissions
```

A hierarquia dos cargos não significa herança de permissões. Ela é principalmente utilizada para determinar quem pode administrar ou agir sobre entidades posicionadas abaixo de seu maior cargo.

Para o Mesa, a recomendação é manter a familiaridade do modelo do Discord, mas evoluí-lo para:

```text
RBAC + ACL + Policy/ABAC + Context + Audit Explanation
```

Isso permitiria manter uma experiência familiar para usuários vindos do Discord sem reproduzir integralmente suas limitações.

---

# 3. Entidades fundamentais

## 3.1 User

`User` representa a identidade global.

Exemplo conceitual:

```text
User
├── id
├── username
├── avatar
└── global profile
```

Um mesmo usuário pode participar de vários servidores.

---

## 3.2 Guild Member

`Guild Member` representa a participação daquele usuário em um servidor específico.

```text
User
 |
 +-- Guild A
 |     |
 |     +-- Member A
 |           ├── nickname
 |           ├── roles
 |           └── server-specific state
 |
 +-- Guild B
       |
       +-- Member B
             ├── nickname
             ├── roles
             └── server-specific state
```

Essa separação é importante para o Mesa porque permite que uma mesma pessoa tenha diferentes funções e identidades dentro de diferentes comunidades ou campanhas.

---

# 4. Roles

Um `Role` combina principalmente três dimensões:

- autorização;
- organização;
- apresentação.

Um role pode possuir:

```text
Role
├── id
├── name
├── permissions
├── position
├── color
├── icon
├── hoist
├── mentionable
└── managed
```

Exemplo:

```text
GM
├── VIEW_CHANNEL
├── SEND_MESSAGES
├── CONNECT
├── SPEAK
├── MANAGE_CHANNELS
└── MUTE_MEMBERS
```

Um usuário pode possuir múltiplos roles.

```text
User
└── Roles
    ├── Player
    ├── Warhammer
    └── Veteran
```

---

# 5. Permissões como bit flags

As permissões do Discord são representadas tecnicamente como flags de bits.

Conceitualmente:

```text
VIEW_CHANNEL    = 1 << N
SEND_MESSAGES   = 1 << N
MANAGE_CHANNELS = 1 << N
ADMINISTRATOR   = 1 << N
```

Um conjunto de permissões pode ser armazenado como uma combinação OR:

```text
permissions =
    VIEW_CHANNEL
  | SEND_MESSAGES
  | CONNECT
  | SPEAK
```

Essa abordagem é eficiente e adequada para o Mesa.

### Recomendação

Utilizar um campo inteiro de 64 bits ou equivalente:

```text
permissions BIGINT
```

ou um tipo equivalente na tecnologia escolhida.

Isso permite adicionar novas permissões sem alterar a estrutura de roles.

---

# 6. Agregação de permissões

As permissões de roles são acumulativas.

Exemplo:

```text
Player
├── VIEW_CHANNEL
├── SEND_MESSAGES
└── SPEAK

GM
├── MANAGE_CHANNELS
└── MUTE_MEMBERS
```

Um usuário que possui os dois cargos recebe:

```text
VIEW_CHANNEL
SEND_MESSAGES
SPEAK
MANAGE_CHANNELS
MUTE_MEMBERS
```

Conceitualmente:

```text
P_effective =
    P_@everyone
    OR P_role1
    OR P_role2
    OR ...
```

Isso significa que a posição do role não transforma automaticamente um cargo superior em um cargo que substitui os demais.

---

# 7. Hierarquia de roles

A hierarquia de roles é uma das partes mais importantes do modelo do Discord.

Exemplo:

```text
OWNER
  |
ADMIN
  |
MODERATOR
  |
GM
  |
PLAYER
  |
@everyone
```

Porém:

> A hierarquia não significa herança de permissões.

Se:

```text
Player -> SPEAK
GM     -> MANAGE_CHANNELS
```

o GM não recebe `SPEAK` simplesmente por estar acima de Player.

O GM precisa receber `SPEAK` por outro role ou diretamente por sua configuração de permissões.

A hierarquia existe principalmente para controlar operações administrativas sobre entidades inferiores.

Exemplos:

- atribuir ou remover roles;
- administrar roles;
- banir membros;
- expulsar membros;
- alterar determinadas propriedades de membros;
- impedir que um moderador inferior administre alguém acima dele.

---

# 8. RBAC versus hierarquia

O Discord é melhor descrito como:

```text
RBAC + Hierarchical Administration
```

e não como uma árvore de herança de roles.

A pergunta:

```text
"Quais permissões este usuário possui?"
```

é diferente de:

```text
"Este usuário pode administrar aquele outro usuário?"
```

A primeira depende principalmente das permissões efetivas.

A segunda depende das permissões + posição hierárquica.

---

# 9. Channel Permission Overwrites

Essa é provavelmente a principal característica do sistema de autorização do Discord.

Um servidor pode possuir:

```text
Player
    SEND_MESSAGES
```

enquanto determinado canal pode possuir:

```text
#gm-secrets

Player
    VIEW_CHANNEL = DENY
```

Resultado:

```text
Servidor:
Player -> pode escrever

#gm-secrets:
Player -> não pode visualizar
```

Os permission overwrites podem ser aplicados a:

- `@everyone`;
- roles;
- membros individuais.

---

# 10. Resolução de permissões de canal

O modelo pode ser representado de forma simplificada como:

```text
Base Permissions
       |
       v
@everyone overwrite
       |
       v
Role overwrites
       |
       v
Member overwrite
       |
       v
Effective Channel Permissions
```

A lógica conceitual é:

```python
permissions = base_permissions(member)

if administrator(permissions):
    return ALL_PERMISSIONS

apply_everyone_overwrite()
apply_role_overwrites()
apply_member_overwrite()

return permissions
```

O ponto importante é que os overwrites de roles são agregados antes do overwrite individual do membro.

---

# 11. Member-specific overrides

O Discord permite configurar exceções para membros específicos.

Exemplo:

```text
#secret-room

GM role:
    VIEW_CHANNEL = ALLOW

Player role:
    VIEW_CHANNEL = DENY

Ricardo:
    VIEW_CHANNEL = ALLOW
```

Resultado:

```text
GM      -> permitido
Player  -> negado
Ricardo -> permitido
```

Isso transforma o modelo em algo além de RBAC puro:

```text
RBAC
+
ACL
```

---

# 12. ADMINISTRATOR

`ADMINISTRATOR` é uma permissão especial.

Ela concede acesso administrativo extremamente amplo e bypassa os permission overwrites de canais.

Conceitualmente:

```text
if ADMINISTRATOR:
    effective_permissions = ALL
```

Isso significa que:

```text
@everyone
    VIEW_CHANNEL = DENY

Administrator
    ADMINISTRATOR
```

não resulta no administrador sendo bloqueado pelo canal.

### Recomendação para o Mesa

Considerar separar:

```text
OWNER
```

de:

```text
ADMINISTRATOR
```

onde:

```text
OWNER
    = autoridade absoluta

ADMINISTRATOR
    = todas as permissões administrativas normais
```

Isso evita que uma única flag se torne um bypass universal obrigatório.

---

# 13. Categories

Categorias agrupam canais:

```text
Campaign
|
+-- #general
+-- #rules
+-- #rolls
+-- #gm-secrets
+-- Voice
```

Uma categoria pode possuir permission overwrites.

Os canais podem permanecer sincronizados com a categoria.

```text
CATEGORY
   |
   +-- Channel A [SYNCED]
   +-- Channel B [SYNCED]
   +-- Channel C [SYNCED]
```

Se um canal receber configurações diferentes, ele pode deixar de estar sincronizado.

Isso é melhor entendido como:

```text
Permission Syncing
```

e não como uma herança tradicional.

---

# 14. Por que isso importa para o Mesa

Uma implementação baseada em herança poderia parecer:

```text
Category permissions
        +
Channel permissions
```

Mas o modelo do Discord funciona melhor conceitualmente como:

```text
Category configuration
        |
        v
Channel synchronized configuration
```

Essa diferença evita ambiguidades quando uma configuração do canal diverge da categoria.

---

# 15. Voice permissions

Para um produto de comunicação como o Mesa, as permissões de voz são fundamentais.

O Discord separa ações como:

```text
VIEW_CHANNEL
CONNECT
SPEAK
STREAM
USE_VAD
PRIORITY_SPEAKER
MUTE_MEMBERS
DEAFEN_MEMBERS
MOVE_MEMBERS
```

Isso cria uma separação importante:

```text
Ver sala
   !=
Entrar
   !=
Falar
   !=
Transmitir
   !=
Moderar
```

### Recomendação para Mesa

Manter essa separação.

Para RPGs, ela permite criar perfis como:

```text
Player
    VIEW
    CONNECT
    SPEAK
    STREAM

Spectator
    VIEW
    CONNECT

GM
    VIEW
    CONNECT
    SPEAK
    STREAM
    MUTE
    MOVE
```

---

# 16. Threads

Threads introduzem uma pequena especialização do modelo.

A thread normalmente está ligada a um canal pai, mas ações dentro da thread podem exigir permissões próprias.

A distinção importante é:

```text
SEND_MESSAGES
```

versus:

```text
SEND_MESSAGES_IN_THREADS
```

Isso é uma boa indicação para o Mesa não tratar todos os recursos textuais como idênticos.

---

# 17. Application Commands

O Discord possui também autorização específica para comandos/interações.

Conceitualmente:

```text
User
 |
 +-- Roles
 |
 +-- Channel permissions
 |
 +-- Command permissions
 |
 v
Can execute /command?
```

Exemplos para o Mesa:

```text
/roll
    Player
    GM

/scene
    GM

/kick
    Moderator
    Admin

/secret-roll
    GM
```

Isso deve ser tratado como uma camada de autorização própria, mas alimentada pelo mesmo motor de permissões.

---

# 18. Timeout e estado operacional

O Discord possui estados temporários que afetam o comportamento do membro.

Timeout é um exemplo importante.

Isso demonstra que a autorização não depende exclusivamente de:

```text
roles
```

Também existe:

```text
member state
```

Para o Mesa:

```text
Member
├── roles
├── permissions
├── timeout_until
├── voice_state
└── moderation_state
```

é uma estrutura mais adequada.

---

# 19. Perfis

É importante separar três conceitos:

## Identidade global

```text
User
```

## Perfil dentro do servidor

```text
Guild Member
```

## Autorização

```text
Roles + Permissions
```

Não é recomendável misturar essas três responsabilidades.

Um usuário pode ter:

```text
Global Profile
    Ricardo

Campaign A
    Nickname: Rocco
    Role: Player

Campaign B
    Nickname: Storyteller
    Role: GM
```

---

# 20. Oportunidade específica para RPG

O Discord possui uma abstração genérica:

```text
User
Role
Channel
```

O Mesa pode adicionar contexto de domínio:

```text
User
 |
 +-- Campaign
       |
       +-- Character
       |
       +-- Roles
       |
       +-- Permissions
```

Exemplo:

```text
User
└── Campaign: Warhammer
    ├── Character: Rocco Niekisch
    └── Role: Player
```

Enquanto:

```text
User
└── Campaign: World of Darkness
    ├── Character: Giovanni
    └── Role: Storyteller
```

Isso é uma diferenciação importante de produto.

---

# 21. O que o Discord faz muito bem

| Capacidade | Avaliação |
|---|---:|
| RBAC básico | ⭐⭐⭐⭐⭐ |
| Permissões por canal | ⭐⭐⭐⭐⭐ |
| Overrides por membro | ⭐⭐⭐⭐ |
| Hierarquia administrativa | ⭐⭐⭐⭐⭐ |
| Voice permissions | ⭐⭐⭐⭐⭐ |
| Moderação | ⭐⭐⭐⭐⭐ |
| Delegação administrativa | ⭐⭐⭐⭐⭐ |
| ACL complexa | ⭐⭐⭐⭐⭐ |
| Comandos | ⭐⭐⭐⭐ |
| Clareza conceitual | ⭐⭐⭐ |
| Auditoria de autorização | ⭐⭐⭐⭐ |
| Políticas contextuais | ⭐ |
| ABAC | ⭐ |
| Regras temporais genéricas | ⭐⭐ |

---

# 22. O que o Discord não cobre bem

## 22.1 ABAC

Não existe como primitiva central uma regra do tipo:

```text
allow if user.level >= 5
```

ou:

```text
allow if campaign.status == "active"
```

---

## 22.2 Contexto

Políticas como:

```text
GM pode acessar os segredos somente durante uma sessão ativa.
```

não são uma primitive central do modelo.

---

## 22.3 Permissões temporais genéricas

Um sistema como:

```text
Player
    access GM-room
    from 19:00
    until 23:00
```

não é uma característica geral do modelo.

---

## 22.4 Herança semântica de roles

Não existe:

```text
GM extends Player
```

no sentido tradicional.

A composição ocorre através de múltiplos roles e permissões.

---

## 22.5 Policies declarativas

Não existe uma camada central equivalente a:

```yaml
allow:
  role: gm

deny:
  role: player

condition:
  campaign_active: true
```

Isso é uma oportunidade para o Mesa.

---

# 23. Problema de complexidade

A flexibilidade do Discord cria um problema operacional.

Imagine:

```text
35 usuários
17 roles
80 canais
```

com múltiplos overrides.

Uma pergunta simples:

```text
"Por que João consegue acessar esta sala?"
```

pode depender de:

```text
Role A
+
Role B
+
@everyone overwrite
+
Role overwrite
+
Member overwrite
+
Administrator
+
hierarchy
+
member state
```

Quanto maior a comunidade, mais difícil fica a auditoria.

---

# 24. Recomendação: Authorization Engine

Para o Mesa, a lógica deveria ficar centralizada em um mecanismo de autorização.

Conceitualmente:

```text
                 User
                   |
                   v
                Member
                   |
          +--------+--------+
          |                 |
        Roles           Attributes
          |                 |
          v                 |
    Permissions             |
          |                 |
          +--------+--------+
                   |
                   v
                Policies
                   |
          +--------+--------+
          |                 |
       Channel           Command
          |                 |
          +--------+--------+
                   |
                   v
          Effective Access
```

A interface principal poderia ser:

```text
Can(
    principal,
    action,
    resource,
    context
)
```

Exemplo:

```text
Can(
    Ricardo,
    "voice.speak",
    "voice.main-table",
    campaign=warhammer
)
```

---

# 25. Audit Explanation

Uma melhoria importante sobre o modelo do Discord seria retornar não apenas:

```json
{
  "allowed": false
}
```

mas:

```json
{
  "allowed": false,
  "reason": [
    "role:player",
    "missing_permission:voice.speak",
    "channel:main-table"
  ]
}
```

Ou:

```text
Acesso negado.

O cargo "Espectador" não possui:
    voice.speak

Sala:
    Mesa Principal
```

Isso simplifica enormemente a administração.

---

# 26. Modelo recomendado para o Mesa

Uma arquitetura inicial poderia ser:

```text
Workspace / Server
|
+-- Users
|
+-- Members
|
+-- Roles
|
+-- Permissions
|
+-- Categories
|
+-- Channels
|
+-- Channel ACL
|
+-- Commands
|
+-- Policies
|
+-- Audit Logs
```

Relações:

```text
Member
  |
  +-- Roles[]
          |
          +-- Permissions

Channel
  |
  +-- ACL[]
       |
       +-- Role
       +-- Member
```

---

# 27. Capability model

Uma alternativa limpa é trabalhar com capabilities:

```text
channel.read
channel.write
channel.manage

message.send
message.delete
message.pin

voice.connect
voice.speak
voice.stream
voice.mute
voice.move

role.assign
role.manage

member.kick
member.ban

command.execute
```

Isso evita criar permissões excessivamente acopladas à interface.

---

# 28. Policy Layer

Acima das permissões básicas:

```text
Permission
      |
      v
Capability
      |
      v
Resource
      |
      v
Policy
```

Exemplo:

```yaml
policy:
  resource: channel:gm-secrets

  allow:
    roles:
      - gm

  deny:
    roles:
      - player

  conditions:
    campaign_member: true
```

Outro exemplo:

```yaml
policy:
  action: voice.speak
  resource: voice:main-table

  allow:
    roles:
      - player
      - gm

  deny:
    state:
      muted: true
```

---

# 29. Comparação final

| Aspecto | Discord | Mesa recomendado |
|---|---|---|
| Roles | Sim | Sim |
| Role hierarchy | Sim | Sim |
| Bit permissions | Sim | Sim |
| Channel overrides | Sim | Sim |
| Member overrides | Sim | Sim |
| Category permissions | Sim | Sim |
| Permission sync | Sim | Sim |
| Voice ACL | Sim | Sim |
| Thread ACL | Sim | Sim |
| Command permissions | Sim | Sim |
| Timeout | Sim | Sim |
| Admin bypass | Sim | Opcional |
| Role inheritance | Não | Opcional |
| ABAC | Não | Sim |
| Conditional policies | Limitado | Sim |
| Temporal permissions | Limitado | Sim |
| Campaign context | Não | Sim |
| Character identity | Não | Sim |
| Permission explanation | Limitado | Sim |
| Permission simulation | Parcial | Sim |

---

# 30. Conclusão

O sistema de autorização do Discord é extremamente adequado para comunidades e comunicação em tempo real porque resolve de forma eficiente as perguntas:

- quem pode ver;
- quem pode escrever;
- quem pode falar;
- quem pode entrar em uma sala;
- quem pode transmitir;
- quem pode moderar;
- quem pode administrar;
- quem pode executar determinada ação.

Seu modelo central pode ser resumido como:

```text
RBAC
+
Channel ACL
+
Administrative Hierarchy
+
Bit Permissions
+
Member State
+
Command Permissions
```

O principal limite é que o Discord não foi projetado como um mecanismo geral de políticas contextuais.

Para o Mesa, a melhor estratégia é manter a familiaridade do Discord e evoluir o backend para:

```text
RBAC
+
ACL
+
Policy / ABAC
+
Context
+
Audit Explanation
```

Além disso, o Mesa pode explorar um diferencial específico de RPG:

```text
User
 |
 v
Campaign
 |
 +-- Character
 |
 +-- Roles
 |
 +-- Permissions
 |
 +-- Policies
```

Assim, o produto pode parecer familiar para um usuário do Discord, mas oferecer um modelo de autorização significativamente mais expressivo para campanhas de RPG.

---

# 31. Arquitetura conceitual recomendada

```text
                        USER
                          |
                          v
                       MEMBER
                          |
             +------------+------------+
             |                         |
           ROLES                  ATTRIBUTES
             |                         |
             v                         |
       PERMISSIONS                     |
             |                         |
             +------------+------------+
                          |
                          v
                       POLICY
                          |
              +-----------+-----------+
              |                       |
           RESOURCE                CONTEXT
              |                       |
              +-----------+-----------+
                          |
                          v
                  AUTHORIZATION ENGINE
                          |
             +------------+------------+
             |                         |
          ALLOW                       DENY
             |                         |
             +------------+------------+
                          |
                          v
                  AUDIT / EXPLANATION
```

Essa arquitetura preserva o melhor conceito do Discord — **roles + permissões + overrides** — mas cria espaço para o Mesa evoluir para autorização contextual, campanhas, personagens, sessões e regras específicas de RPG.

---

## Referências técnicas

- Discord Developer Documentation — Permissions
- Discord Developer Documentation — Guilds
- Discord Developer Documentation — Threads
- Discord Developer Documentation — Application Commands
- Discord Support — Permission Hierarchy
- Discord Support — Channel Categories and Permission Syncing
- Discord Support — Server Profiles
