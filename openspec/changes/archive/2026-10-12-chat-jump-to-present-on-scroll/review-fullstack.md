# Review — Desenvolvedor Fullstack

**Change:** chat-jump-to-present-on-scroll
**Data:** 2026-10-12
**Veredito geral:** Aprovado

## 1. Desenvolvimento do backend

Veredito: N/A — change é puramente frontend, sem endpoint ou evento tocado.

## 2. Desenvolvimento do frontend

Veredito: OK

- Confirmei em `frontend/src/chat/ChannelPage.tsx:119-124` (`onScroll`) que `away` já é posto a `0` sempre que `near` (pinned) é verdadeiro, independentemente desta change — ou seja, a pill já desaparece correctamente ao voltar ao fundo por scroll manual, sem precisar de nenhuma lógica nova. A mudança proposta (Tarefas 1.1/1.2) é mesmo só a condição de dois `Show`, directamente implementável sem efeitos colaterais noutro sítio.
- `Badge` (`components/ui/Display.tsx:21`) aceita `children: JSX.Element` sem nenhuma restrição que impeça envolvê-lo num `<Show when={away() > 0}>` adicional — nenhuma mudança de assinatura necessária.

## 3. Deploy e operação

Veredito: N/A.

## 4. Qualidade de código

Veredito: OK

- `tasks.md` segue o padrão "tarefa + como verificar"; verificação manual é apropriada para uma mudança de condição de UI sem lógica nova a testar automaticamente (coerente com a ausência de um runner de testes de frontend já estabelecida no projecto).

## 5. Execução das decisões arquiteturais

Veredito: OK

- Sem tensão com nenhuma decisão existente; a única Decision de `design.md` é directamente implementável como escrita.

## Bloqueantes antes de implementar

- nenhum

## Limitações técnicas a reportar ao Arquiteto

- nenhuma
