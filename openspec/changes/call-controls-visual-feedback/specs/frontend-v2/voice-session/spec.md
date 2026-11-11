# Spec Delta

## ADDED Requirements

### Requirement: Estados visuais dos controlos de chamada

O sistema SHALL dar resposta visual imediata aos controlos de chamada (microfone, surdo, câmara, menu de blur, partilha de ecrã, encerrar chamada) ao passar o cursor, ao pressionar e ao focar pelo teclado, tanto no painel do utilizador como no mini-player flutuante (PiP), usando apenas as cores do tema activo (claro ou escuro). Um controlo desactivado SHALL NOT reagir a hover ou a pressionar. O contorno de foco pelo teclado SHALL ficar visível e separado do botão em ambos os temas, e SHALL NOT aparecer ao clicar com o rato.

#### Scenario: Hover e pressionar num controlo activo

- **WHEN** o utilizador passa o cursor sobre um controlo de chamada activo, ou o pressiona
- **THEN** o controlo muda de aparência de forma imediata e reversível, sem alterar o seu estado real (ligado/desligado) até o clique ser concluído

#### Scenario: Foco pelo teclado

- **WHEN** o utilizador navega pelos controlos de chamada usando o teclado
- **THEN** o controlo com foco mostra um contorno visível e separado do botão; o mesmo controlo clicado com o rato não mostra esse contorno

#### Scenario: Controlo indisponível não reage

- **WHEN** o utilizador passa o cursor ou tenta pressionar um controlo desactivado (por exemplo, microfone em modo de só ouvir)
- **THEN** o controlo não muda de aparência além do seu estado "indisponível" já apresentado

#### Scenario: Movimento reduzido

- **WHEN** o sistema operativo do utilizador pede movimento reduzido
- **THEN** pressionar um controlo de chamada não aplica deslocamento nem mudança de escala, mantendo apenas a mudança de cor
