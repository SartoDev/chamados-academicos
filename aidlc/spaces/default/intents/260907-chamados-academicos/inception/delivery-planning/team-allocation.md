# Alocação de Equipe — Sistema de Chamados Acadêmicos

Derivado de `bolt-plan.md`, `unit-of-work.md` (em `../units-generation/`), `team-practices.md` (em `../practices-discovery/`) e das respostas confirmadas em `delivery-planning-questions.md`.

Um **Bolt** é uma passada de construção sobre uma unidade de trabalho — desenho funcional, geração de código, build e teste — que termina em algo que roda localmente. Um **mob** é o grupo que trabalha junto num Bolt, com um conduzindo e os outros orientando; neste projeto, o grupo de cada Bolt é o agente de desenvolvimento, apoiado pelos agentes das etapas de construção, com o autor aprovando.

## Situação

- A etapa de formação de equipe não faz parte deste plano de trabalho: o plano foi enxugado para 18 etapas, sem equipe a formar (D10).
- O projeto tem um único desenvolvedor, o autor, que é também o único stakeholder com autoridade de decisão (D06). Orientador e banca não participam das aprovações.
- A construção é conduzida nesta sessão, uma unidade por vez, com o autor aprovando ao longo do caminho (Q7). Não há vários times, e por isso não há quadro de coordenação entre times (o "Program Board" de programas com várias equipes).

## Alocação por Bolt

| Bolt | Unidade | Constrói | Apoio nas etapas de construção | Aprova |
|------|---------|----------|--------------------------------|--------|
| `b1-foundation` | U1 | `aidlc-developer-agent` | Desenho funcional liderado pelo agente de arquitetura; build e teste liderados pelo agente de qualidade, com o de segurança | autor |
| `b2-tickets` | U2 | `aidlc-developer-agent` | Idem | autor |
| `b3-conversation` | U3 | `aidlc-developer-agent` | Idem | autor |
| `b4-reporting` (condicional) | U4 | `aidlc-developer-agent` | Idem | autor |
| `b5-rating` (condicional) | U5 | `aidlc-developer-agent` | Idem | autor |

Os agentes de apoio seguem o que a definição de cada etapa de construção declara; esta tabela não os substitui.

## Capacidade e Carga

- **Capacidade do autor:** de 10 a 20 horas por semana (D12). O gargalo é a revisão e a aprovação humana, não a velocidade do agente.
- **Um Bolt por vez** (Q4) e **uma unidade por vez na construção** (Q6). O autor nunca revisa duas unidades ao mesmo tempo, e as aprovações das etapas de uma unidade se acumulam no fim do bloco dela.
- **Ponto de decisão** antes de cada Bolt condicional: o autor decide seguir ou parar, conforme `bolt-plan.md`.

## Forma de Interação

- O agente constrói e o autor aprova em cada portão de etapa. Não há revisão assíncrona por outra pessoa: o autor e os agentes de qualidade e segurança cumprem esse papel antes do merge (`team.md`).
- O portão que bloqueia de fato é o hook local de pre-push; o CI audita e registra (`team.md`).

## Assumptions & Open Questions

- [assumption] "Apoio nas etapas de construção" descreve os líderes e apoios declarados nas definições de etapa de desenho funcional, geração de código e build e teste deste framework; se o plano de etapas mudar, a coluna muda junto.
- Nenhuma questão em aberto de alocação: com um único desenvolvedor e condução nesta sessão, não há decisão de dono pendente.
