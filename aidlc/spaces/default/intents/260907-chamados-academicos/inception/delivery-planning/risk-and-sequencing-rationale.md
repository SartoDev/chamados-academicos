# Riscos e Justificativa da Sequência — Sistema de Chamados Acadêmicos

Derivado de `bolt-plan.md`, `unit-of-work-dependency.md` (em `../units-generation/`), `contract-summary.md` (em `../contract-design/`), `stories.md` (em `../user-stories/`), `requirements.md` (em `../requirements-analysis/`) e das respostas confirmadas em `delivery-planning-questions.md`.

Um **Bolt** é uma passada de construção sobre uma unidade de trabalho que termina em algo que roda localmente. Este documento explica por que os Bolts estão na ordem em que estão, e quais riscos essa ordem ataca.

## Heurística Usada

**Sem pontuação formal** (Q1). A ordem vem de três argumentos explícitos, aplicados em sequência:

1. **Dependência primeiro.** O grafo da Geração de Unidades obriga U1 antes de todas e U2 antes de U3, U4 e U5.
2. **Valor Must antes de Could.** `stories.md` diz que as histórias Could have só são construídas depois de todas as Must estarem concluídas e testadas. Isso põe U3 (Must) antes de U4 e U5 (Could).
3. **Incerteza primeiro, dentro de cada Bolt.** A parte mais incerta de cada Bolt é atacada antes do resto e entra na Definição de Pronto. É o critério de risco e de conhecimento novo da priorização de Cohn (*Agile Estimating and Planning*), aplicado dentro do Bolt, já que a ordem entre Bolts está forçada.

**Por que não WSJF.** A pontuação WSJF (Reinertsen; SAFe) — valor, urgência e redução de risco divididos pelo tamanho — foi considerada e rejeitada (Q1-B): com a ordem forçada pelos dois primeiros argumentos, a pontuação só reproduziria a mesma sequência, e os números seriam cerimônia sem decisão por trás.

**Por que não seguir a ordem interna do mapa sem antecipar incerteza.** Também rejeitada (Q1-C): as duas maiores preocupações declaradas (Q5) atravessam histórias diferentes, e seguir o mapa as espalharia pelo meio de cada Bolt em vez de enfrentá-las no começo.

## Sequência e Desvio da Ordem Topológica

O grafo permite três ordenações:

| Ordenação | Status | Motivo |
|-----------|--------|--------|
| U1, U2, U3, U4, U5 | **escolhida** | Respeita o grafo e a regra Must antes de Could |
| U1, U2, U4, U3, U5 | rejeitada | Constrói U4 (Could) antes de U3 (Must), contra `stories.md` |
| U1, U2, U4, U5, U3 | rejeitada | Constrói U4 e U5 (Could) antes de U3 (Must), contra `stories.md` |

**Nenhum desvio da ordem topológica:** a sequência escolhida é uma das ordenações que o grafo permite.

## Argumento sobre o Esqueleto

Um **esqueleto ambulante** é uma primeira entrega mínima, de ponta a ponta, aprovada à parte, que só prova que a arquitetura se sustenta. O escopo desta iniciativa liga essa cerimônia por padrão. A prática afirmada em `team.md` a recusa como entrega separada, porque o sequenciamento "fundação primeiro" já cobre o mesmo risco: a primeira unidade atravessa React, NestJS, Prisma, Postgres e Docker Compose antes de qualquer funcionalidade mais profunda. Vale a regra mais específica. O Bolt 1 é a primeira fatia pela pilha inteira, e não existe um Bolt 0.

## Paralelismo

**Um Bolt por vez** (Q4). A Geração de Unidades permitiu paralelismo onde o grafo deixa (U3 com U4, U3 com U5), mas a regra Must antes de Could elimina as duas oportunidades: U4 e U5 só começam depois de U3 estar em `main`. Consequência: a serialização das migrações do banco, exigida pela Geração de Unidades, fica satisfeita trivialmente.

## Percurso da Construção

**Uma unidade por vez** (Q6): desenho funcional, código, build e teste de uma unidade antes de começar o desenho funcional da próxima.

- **Por quê.** O primeiro código funcionando chega depois de um único desenho funcional, o que honra o papel de primeira fatia do Bolt 1. E o que se aprende construindo U1 — o mecanismo dos ciclos de ADR-004, a infraestrutura de teste, o formato real do OpenAPI gerado — corrige o desenho de U2 antes de ele ser escrito.
- **Alternativa rejeitada.** Etapa por etapa: o desenho funcional de todas as unidades primeiro, depois o código de todas. Daria desenhos mais coerentes entre si, mas deixaria o projeto inteiro sem código funcionando até cinco desenhos serem aprovados, e cristalizaria no desenho de U2 suposições que U1 ainda não testou.
- **Custo aceito.** As aprovações de cada etapa se acumulam no fim do bloco de cada unidade.

## Registro de Riscos

| ID | Risco | Probabilidade | Impacto | Onde é atacado | Mitigação |
|----|-------|---------------|---------|----------------|-----------|
| RSK-01 | As regras de autorização e visibilidade ficam furadas: 403 faltando, 404 que revela existência, leitura de registro alheio (preocupação declarada, Q5) | Média | Alto | Início do Bolt 1 (guard), início do Bolt 2 (visibilidade do chamado), início do Bolt 3 (acesso à conversa) | Teste negativo de 403 por endpoint, teste de acesso alheio por recurso com dono, teste de 404 indistinguível, enumeração de rotas, 90% de cobertura de ramo em guards; regra de visibilidade só em U2 |
| RSK-02 | A montagem inicial do projeto trava ou fica frágil: monorepo, Docker Compose, hook de pre-push, testes contra Postgres real (preocupação declarada, Q5) | Média | Alto — bloqueia todos os Bolts | Primeira parte do Bolt 1 | Montagem e suíte de testes contra Postgres real antes de qualquer funcionalidade; `docker compose up` sem passo manual na Definição de Pronto |
| RSK-03 | U2 é grande demais para uma passada, com 10 a 20 horas semanais | Média | Médio | Bolt 2 | Questões em aberto resolvidas no Desenho Funcional antes do código; ordem interna do mapa de histórias; se não couber, voltar à Geração de Unidades em vez de fatiar o Bolt |
| RSK-04 | O mecanismo de transação entre serviços de U2 e U3 expõe tipos do Prisma ou não garante atomicidade (achado R-01 da revisão dos contratos, aceito como risco) | Média | Médio | Desenho Funcional de U2, no início do Bolt 2 | Decidir o mecanismo antes do código de transição e notificação; a regra de atomicidade de X-01 entra na Definição de Pronto dos Bolts 2 e 3 |
| RSK-05 | A lista de transições de FR8.1 omite Aguardando solicitante → Encerrado (achado R-11 das histórias) | Baixa | Médio | Bolt 2 | A Definição de Pronto exige teste das nove transições da tabela completa de `stories.md` |
| RSK-06 | Nenhum requisito limita tentativas de login | Média | Médio | Desenho Funcional de U1 | Questão em aberto de `contract-summary.md` resolvida antes do código de autenticação |
| RSK-07 | `project.md` ainda classifica a área administrativa como Should have, contra a decisão de US4.1 | Baixa | Baixo | Bolt 1 | O Bolt 1 segue a decisão posterior registrada em `stories.md`; a contradição permanece documentada |
| RSK-08 | Não há folga para os Could have | Média | Baixo | Pontos de decisão depois dos Bolts 3 e 4 | Parar depois do Bolt 3 entrega o corte mínimo completo; nenhuma unidade Must depende de U4 ou U5 |
| RSK-09 | A revisão e a aprovação humana viram gargalo com 10 a 20 horas semanais | Média | Médio | Todos os Bolts | Um Bolt por vez e uma unidade por vez; aprovações acumuladas no fim do bloco de cada unidade |

## Hipóteses de Confiança, em Ordem

| Bolt | O que o Bolt prova |
|------|--------------------|
| `b1-foundation` | A pilha inteira funciona junta com o guard de negação por padrão ativo, e o administrador cadastra pela interface quem vai usar o sistema. |
| `b2-tickets` | O ciclo de vida completo do chamado mantém a regra de visibilidade intacta em todo caminho de acesso, e cada mudança deixa histórico e notificação. |
| `b3-conversation` | A conversa respeita a própria regra de acesso, inclusive depois de transferências, e a resposta do solicitante devolve o chamado à análise sem passo manual. |
| `b4-reporting` | Os números do painel batem com os chamados que o gestor consegue abrir. |
| `b5-rating` | Uma extensão puramente aditiva acrescenta dado e indicador sem alterar contrato existente. |

A ordem das hipóteses acompanha a ordem dos riscos: os dois riscos de impacto alto (RSK-01 e RSK-02) são testados já no Bolt 1 e voltam no começo dos Bolts 2 e 3; os riscos de impacto baixo ficam para os pontos de decisão dos Could have.

## Assumptions & Open Questions

- [assumption] O tamanho de U2 (RSK-03) e o mecanismo de transação (RSK-04) não foram marcados como maiores preocupações na Q5, mas entram no registro porque foram apontados pela Geração de Unidades e pela revisão dos contratos. Não são atacados antes das duas preocupações declaradas.
- [assumption] As probabilidades e impactos são estimativas qualitativas do planejamento, sem base histórica: o projeto não tem Bolt anterior para calibrar.
