# Contract: Ícone de identidade (lista de voz + texto)

**Feature**: [030-voice-roster-avatars](../spec.md)

Superfície de UI; sem rotas novas além das de 028/029.

## Lista aninhada (coluna de canais)

- Cada linha visível (`mic_on` **ou** `cam_on`): círculo à esquerda + handle.
- `has_avatar` true → foto `GET /api/accounts/{account_id}/avatar` (`object-fit: cover`).
- `has_avatar` false → iniciais (mesmo algoritmo que chip/membros).
- Handle continua `title` / nome acessível; o círculo é decorativo (`aria-hidden`).
- Palco com canais colapsados: a lista (ícones incluídos) continua oculta como em 028.

## Grupos de mensagens (canal de texto)

- Um círculo por **grupo**, à esquerda do handle, alinhado ao nome ([01-canal-texto.jpg](../../../docs/screenshots/01-canal-texto.jpg)).
- Fonte: `has_avatar` do mapa de membros do servidor ao abrir o canal.
- Sem distintivos de papel, sem lista de «quem está no `#`».

## Falha da foto

Se a imagem não carregar, o círculo mostra iniciais (nunca vazio).

## Fora

- Ícones de mic/câmera/a falar/anfitrião por linha.
- Barra «ainda na chamada» (pode ficar só texto).
- Actualização instantânea da foto sem refetch (FR-009).
