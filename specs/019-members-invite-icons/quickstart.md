# Quickstart: 019-members-invite-icons

Validar ícone de membros + ícone de convite (só dono). Sem API nova.

## Pré-requisitos

- Backend + frontend a correr (`README.md`).
- Conta **dona** de um servidor com canal de texto e de voz.
- Segunda conta **membro** (não dona) no mesmo servidor (convite já aceite).

## 1. Membros (caminho feliz)

1. Como dono ou membro, abrir um canal de **texto**.
2. No cabeçalho do canal: **ícone de grupo**, sem a palavra «Membros».
3. Clicar → painel direito abre; o botão fica **seleccionado** (fundo distinto, mesmo ícone).
4. Clicar de novo → painel fecha; o chrome volta ao estado normal.
5. Pairar / leitor de ecrã: nome «Membros».
6. Abrir um canal de **voz**: o mesmo ícone, mesma função; os outros controlos (composição, palco, E2EE) na mesma ordem.

## 2. Convite (dono)

1. Como **dono**, seleccionar o servidor.
2. Cabeçalho da coluna: nome à esquerda, **pessoa+** à direita (dica «Convite»).
3. Fundo da lista de canais: **sem** botão «Convite».
4. Clicar o ícone → diálogo de convite actual (URL); um clique.

## 3. Convite oculto

1. Sem servidor seleccionado («Sem servidor»): **sem** ícone de convite.
2. Como **membro não-dono**, no mesmo servidor: nome visível, **sem** ícone de convite. Lista de membros no canal **continua** a funcionar.

## 4. Distinção

1. Como dono, com canal aberto: grupo no **canal**, pessoa+ no **servidor**.
2. Temas claro e escuro: ambos os ícones legíveis.

## 5. Checks

```bash
cd frontend && npx tsc --noEmit
```

Confirmar `git diff -- backend/` vazio para esta feature.

Ver: [members-trigger.md](./contracts/members-trigger.md), [invite-trigger.md](./contracts/invite-trigger.md).
