# Parley — identidade aprovada (opção D)

A marca aprovada é o urso com cabeça em forma de balão de conversa. Estes arquivos substituem a identidade anterior. Os nomes dos seis masters foram preservados para facilitar a implementação.

## Arquivos para implementação

- `parley-emblem.svg`: símbolo vetorial no badge circular escuro, sem texto.
- `parley-emblem-1024.png`: mesmo símbolo, 1024 × 1024, RGBA; transparente fora do círculo.
- `parley-logo.svg`: assinatura vertical com símbolo e palavra Parley em creme; letras convertidas em caminhos, sem dependência de fontes.
- `parley-logo-1024.png`: mesma assinatura, 1024 × 1024, RGBA; transparente fora do círculo.
- `parley-mono.svg`: símbolo preto com olhos vazados, sem badge, em fundo transparente.
- `parley-mono-1024.png`: mesmo símbolo monocromático, 1024 × 1024, RGBA.
- `parley-preview-sheet.png`: referência de renderização a 256, 64, 32 e 16 px; colorido sobre escuro e monocromático sobre creme. Os tamanhos são reais quando a imagem é vista a 100%.
- `mascote/parley-mascote-aventureiro.png`: prancha original aprovada do personagem completo; ver as orientações da pasta.

## Uso

Preferir SVG na interface. Usar o emblema para avatar da aplicação e ícones; a assinatura completa para espaços que comportem o nome. Em fundo claro, usar a versão monocromática. Não recolorir o retângulo inteiro do PNG monocromático: aplicar a cor apenas pela máscara alfa ou pelo preenchimento do SVG, preservando os olhos transparentes.

Os ícones derivados (ICO, ICNS, favicon e touch icon) devem ser gerados pelos scripts do projeto a partir dos masters de 1024 px. Não usar a prancha de preview ou a ilustração do mascote como fonte desses ícones. A capa e a bolsa pertencem ao personagem completo; não fazem parte do emblema.

## Construção

Paleta dos logos: fundo/badge `#181b24`, figura e palavra `#f4e6c8`; preto `#000000` na versão monocromática. Terracota `#e07a5f` aparece no figurino do mascote. Logos com preenchimentos planos, sem gradientes, filtros, sombras, imagens incorporadas ou texto vivo. Emblema com dois caminhos geométricos e círculo de suporte; respiro de aproximadamente 12% na maior dimensão. Palavra baseada em Comfortaa Bold e convertida em geometria.

Os arquivos A, B e C não fazem parte desta entrega aprovada.
