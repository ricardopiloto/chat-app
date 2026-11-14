# Spec Delta

## MODIFIED Requirements

### Requirement: A janela usa decoração nativa, sem chrome personalizado

O sistema SHALL apresentar a janela principal da aplicação com uma barra de título desenhada pela própria aplicação (área de arraste e controlos próprios de minimizar/maximizar/fechar), em vez da barra de título padrão do sistema operativo. As restantes janelas abertas pelo shell (o diálogo de partilha de ecrã e o popout de chamada) SHALL continuar a usar a decoração nativa do sistema operativo, sem chrome personalizado. O conteúdo da janela principal abaixo da sua barra de título personalizada SHALL continuar a ser o `frontend/dist` já servido no build web; a divergência introduzida por esta mudança fica limitada à própria barra de título, não ao resto do conteúdo.

#### Scenario: Janela principal com chrome personalizado

- **WHEN** a aplicação é aberta em qualquer uma das três plataformas
- **THEN** a janela principal mostra uma barra de título desenhada pela aplicação, com área de arraste e controlos de minimizar/maximizar/fechar próprios, em vez da barra de título nativa do sistema operativo

#### Scenario: Janela com decoração do SO

- **WHEN** o diálogo de partilha de ecrã ou a janela de popout de chamada são abertos
- **THEN** cada um mostra a barra de título nativa desse sistema operativo, sem chrome personalizado, exactamente como antes desta change

#### Scenario: Redimensionar, maximizar e encaixar continuam a funcionar sem decoração nativa

- **WHEN** o utilizador arrasta os limites da janela principal, faz duplo-clique na barra de título personalizada, ou usa os gestos de encaixe de janela do sistema operativo (por exemplo, arrastar para a margem do ecrã no Windows)
- **THEN** a janela principal redimensiona, maximiza/restaura e encaixa como uma janela nativa equivalente faria, apesar de já não ter a decoração nativa do sistema operativo
