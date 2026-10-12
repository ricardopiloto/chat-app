# Tasks

## 1. Faixa de identidade em repouso

- [ ] 1.1 Em `UserPanel.tsx`, tirar a borda superior e o fundo `surface-container` do contentor e usar `bg-surface-container-lowest` com padding de 8 px. A linha da identidade fica `justify-between px-1.5 py-1`, com 8 px entre o avatar e o texto. O nome passa a 12 px, Plus Jakarta Sans, peso 400, cor on-surface. O handle fica `@handle` a 11 px, JetBrains Mono, peso 500, cor on-surface-variant, sem "Online". Verificar no ecrã, com o menu de conta fechado, que o nome mede 12 px em on-surface, o handle mede 11 px em on-surface-variant, e a linha deixa de ser a barra de 64 px com padding de 12 px.
- [ ] 1.2 O avatar desta faixa usa o tamanho de 32 px já existente. O ponto de presença desta faixa fica a 10 px, com anel da cor `surface-container-lowest`, sem alterar `.presence` global. O botão de definições fica com cantos de 8 px, padding de 6 px e ícone de 18 px, cor on-surface-variant. Verificar que este avatar mede 32 px e o ícone do botão mede 18 px, e que um avatar de mensagem ou de membro continua a 40 px com o anel anterior.
