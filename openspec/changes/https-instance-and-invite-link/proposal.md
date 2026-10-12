# Proposal

## Why

No cliente nativo o link de convite sai com a origem `mesa://app`, porque a janela da aplicação não é o site do servidor. Quem recebe esse link não consegue abrir o convite nem criar a conta. No mesmo cliente, o ecrã inicial exige que a pessoa escreva `https://`, embora toda a instância tenha de ser HTTPS para a cifra.

## What Changes

- O link de convite copiado usa o endereço HTTPS da instância a que o cliente está ligado (por exemplo `https://chat.1nodado.com.br/invite/…`), no browser e no cliente nativo. A origem `mesa://` deixa de aparecer nesse link. O fragmento com a semente da chave continua no link e continua a não ir para o servidor.
- No ecrã em que se indica a instância, a pessoa escreve só o host (`chat.1nodado.com.br`). O cliente trata isso como `https://` e guarda a origem HTTPS depois de `GET /health` responder. Um endereço colado que já comece por `https://` continua válido. Um endereço `http://` é recusado.

## Capabilities

### New Capabilities

- (nenhuma)

### Modified Capabilities

- `frontend-v2/invites`: o link gerado passa a usar o endereço da instância, não a origem da janela nativa.
- `frontend-v2/instance-connect`: o endereço da instância assume HTTPS quando o esquema não é escrito.

## Impact

- `frontend/src/admin/InviteDialog.tsx` deixa de usar `location.origin` no cliente nativo.
- `frontend/src/api/instance.ts` (`normalizeInstanceUrl`) e o texto do ecrã em `frontend/src/auth/InstanceConnect.tsx` e nos catálogos de idioma.
- Sem alteração de API, do esquema `mesa://` da janela da aplicação, nem do formato do fragmento do convite.
