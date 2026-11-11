# Plano de Bolts — Sistema de Chamados Acadêmicos

Derivado de `unit-of-work.md`, `unit-of-work-dependency.md` e `unit-of-work-story-map.md` (em `../units-generation/`), `contract-summary.md` (em `../contract-design/`), `requirements.md`, `stories.md`, `components.md` e `team-practices.md`, com as respostas confirmadas em `delivery-planning-questions.md`.

Um **Bolt** é uma passada de construção sobre uma unidade de trabalho — desenho funcional, geração de código, build e teste — que termina em algo que roda localmente e tem uma Definição de Pronto própria. Este plano diz em que ordem os Bolts acontecem, o que cada um precisa cumprir para contar como pronto, e o que cada um prova.

## Visão Geral

| Ordem | Bolt | Unidade | Prioridade | Condicional | Tamanho | Parte atacada primeiro |
|-------|------|---------|-----------|-------------|---------|------------------------|
| 1 | `b1-foundation` | U1 `u1-foundation` | Must | não | L | Montagem do projeto; guard de negação por padrão |
| 2 | `b2-tickets` | U2 `u2-tickets` | Must | não | XL | Regra de visibilidade do chamado e seus testes negativos |
| 3 | `b3-conversation` | U3 `u3-conversation` | Must | não | M | Regra de acesso à conversa, inclusive setores de passagem |
| — | ponto de decisão | — | — | — | — | Seguir para os Could have ou parar |
| 4 | `b4-reporting` | U4 `u4-reporting` | Could | sim | M | Números do painel restritos à visibilidade de quem consulta |
| — | ponto de decisão | — | — | — | — | Seguir para a avaliação ou parar |
| 5 | `b5-rating` | U5 `u5-rating` | Could | sim | S | Extensão aditiva sem alterar contratos de U2 e U4 |

- **Um Bolt por vez** (Q4). Nenhum Bolt começa antes de o anterior estar em `main`.
- **Uma unidade por vez na construção** (Q6). O desenho funcional, o código, o build e os testes de uma unidade terminam antes de começar o desenho funcional da seguinte.
- **Construção nesta sessão**, pelo agente de desenvolvimento, com o autor aprovando ao longo do caminho (Q7). Detalhes em `team-allocation.md`.
- **Nenhuma dependência externa** trava qualquer Bolt. Detalhes em `external-dependency-map.md`.
- Por que esta ordem, e os riscos que ela ataca: `risk-and-sequencing-rationale.md`.

## Regras que Valem para Todo Bolt

- **Ramo e merge.** Cada Bolt abre um ramo curto a partir de `main`, nomeado pelo identificador do Bolt, e termina com squash-merge em `main` (`team.md`, Way of Working).
- **Portão real.** O hook local de pre-push roda lint e os testes rápidos antes de qualquer `git push`; o CI audita e registra, mas não bloqueia merge (`team.md`).
- **Postura de teste.** Test-after por camada: cada camada testável é implementada e em seguida testada, antes da próxima (`team.md`, Testing Posture).
- **Cobertura.** Cada critério de aceitação das histórias do Bolt tem ao menos um teste automatizado, registrado na tabela requisito → teste do repositório; os critérios de inspeção manual (AC5.3.x e AC5.4.x, conforme `stories.md`) têm uma entrada datada no roteiro de inspeção. Limiares mecânicos: 90% de cobertura de ramo em guards e regras de autorização, 80% em services.
- **Autorização.** Todo endpoint não público novo tem ao menos um teste negativo de 403; todo recurso com dono novo tem ao menos um teste de acesso a registro alheio (NFR1, NFR2).
- **Contratos.** O OpenAPI gerado do código é atualizado e commitado no próprio Bolt; qualquer divergência em relação a `contract-summary.md` é registrada no Desenho Funcional da unidade.
- **Migrações.** Como só um Bolt roda por vez, só uma unidade gera migração de cada vez.
- **Questões em aberto.** Cada Bolt resolve, no Desenho Funcional da sua unidade, as questões que `unit-of-work.md` e `contract-summary.md` atribuíram a ela, antes de gerar código.

---

## Bolt 1 — `b1-foundation`

**Unidade:** U1 `u1-foundation`.
**Histórias principais:** US1.1, US4.1, US4.2, US5.1, US5.3, US5.4.
**Esqueleto:** este Bolt é a primeira fatia que atravessa a pilha inteira — React, NestJS, Prisma, Postgres e Docker Compose. Não existe um Bolt de esqueleto separado antes dele: a prática afirmada em `team.md` recusa essa entrega à parte, porque este Bolt já cobre o mesmo risco de integração.

**Parte atacada primeiro** (Q1, Q5):

1. Montagem do projeto: npm workspaces, Dockerfiles, Compose com Postgres para teste, validação das variáveis obrigatórias, hook de pre-push e a suíte de testes rodando contra Postgres real.
2. Guard global de negação por padrão, com o teste de enumeração de rotas e o primeiro teste negativo de 403, antes de qualquer tela de administração.

**Definição de Pronto:**

- `docker compose up` sobe frontend, backend e banco sem passo manual (NFR8); a aplicação falha ao iniciar se faltar variável obrigatória (NFR9).
- Lint, formatação, `tsc --noEmit` em modo estrito e testes passam no hook de pre-push.
- Todo critério de aceitação das histórias principais tem teste ou entrada no roteiro de inspeção manual, e a tabela requisito → teste está atualizada.
- Todo endpoint não público de U1 tem teste negativo de 403, e o teste de enumeração de rotas passa.
- Toda resposta de erro usa o envelope único, sem erro nativo do Prisma (NFR3).
- O OpenAPI gerado cobre API-U1 e as convenções de X-01.
- As questões em aberto de U1 estão resolvidas no Desenho Funcional: criação do primeiro administrador, `Priority.key`, criação de novos status, busca da barra superior, resposta ao login de usuário desativado, limite de tentativas de login e duração do cookie de sessão.
- O Bolt está em `main` por squash-merge.

**Hipótese de confiança.** A pilha inteira funciona junta com o guard de negação por padrão ativo, e um administrador consegue, só pela interface, cadastrar setor, categoria e um atendente que em seguida entra no sistema. A hipótese cai se alguma camada exigir passo manual para subir, ou se uma rota sem marcação de perfil responder qualquer coisa diferente de 403.

**Demonstração esperada.** Clonar o repositório, rodar `docker compose up`, entrar com o administrador da carga inicial, criar um setor, uma categoria e um usuário atendente, sair, entrar como o atendente e ver a tela de administração recusada.

**Dono:** `aidlc-developer-agent`, com o autor aprovando.

---

## Bolt 2 — `b2-tickets`

**Unidade:** U2 `u2-tickets`.
**Histórias principais:** US1.2, US1.3, US1.5, US1.6, US2.1, US2.2, US2.3, US2.4, US3.1, US5.2. Também realiza critérios de US4.1, US4.2, US5.1, US5.3 e US5.4, conforme `unit-of-work-story-map.md`.
**Esqueleto:** não.

**Parte atacada primeiro** (Q1, Q5):

1. A regra de visibilidade do chamado — o que cada perfil vê, inclusive os chamados que já passaram pelo setor —, filtrada dentro da consulta, com os testes de acesso a registro alheio e de 404 indistinguível escritos antes das operações de atendimento.
2. A decisão do mecanismo de transação entre serviços (achado R-01 da revisão dos contratos, aceito como risco), tomada no Desenho Funcional antes de qualquer código de transição, histórico ou notificação.

**Definição de Pronto:**

- Todo critério de aceitação das histórias principais tem teste; os critérios que `unit-of-work-story-map.md` atribui a U3 estão marcados como realizados em U3.
- A máquina de transições é um módulo puro, com teste para cada uma das nove transições válidas da tabela completa de `stories.md` — incluindo Aguardando solicitante → Encerrado, que faltava na lista de FR8.1 (achado R-11) — e para a recusa de qualquer outra.
- A janela de reabertura é testada nos dois lados do limite, em 71h59 e em 72h00, com fonte de tempo injetada.
- Toda mudança de status, responsável, setor e prioridade gera histórico; toda transferência gera passagem por setor; todo evento notificável grava notificação no momento em que ocorre (CT9).
- Chamados e notificações têm, cada um, teste de acesso a registro alheio e de 404 indistinguível (AC5.2.2).
- Transferência e passagem por setor, e transição e notificação, são gravadas de forma atômica, conforme X-01 de `contract-summary.md`.
- O OpenAPI gerado cobre API-U2, e o serviço público de Tickets expõe os métodos de SVC-03, SVC-05 e SVC-07.
- As questões em aberto de U2 estão resolvidas no Desenho Funcional: formato do identificador visível, quem pode abrir chamado, limites de tamanho, o que o administrador vê, valores de campo do histórico e de tipo de notificação, e o mecanismo de transação.
- O Bolt está em `main` por squash-merge.

**Hipótese de confiança.** O ciclo de vida completo do chamado — abrir, entrar na fila, ser assumido, aguardar o solicitante, ser transferido duas vezes, ser encerrado e reaberto — mantém a regra de visibilidade intacta em todo caminho de acesso, e cada mudança deixa histórico e notificação. A hipótese cai se qualquer usuário conseguir ler, por identificador, um chamado que não deveria ver, ou se alguma resposta permitir distinguir chamado inexistente de chamado inacessível.

**Demonstração esperada.** Uma aluna abre um chamado; o atendente do setor o vê na fila, assume e marca que aguarda a solicitante; a gestora transfere para outro setor, e o setor de origem continua consultando; um aluno diferente tenta abrir o chamado pelo endereço e recebe 404; a aluna encerra e reabre; o sino mostra as notificações de cada passo.

**Dono:** `aidlc-developer-agent`, com o autor aprovando.

**Risco de tamanho.** É o maior Bolt do plano, e um Bolt não divide uma unidade (Q3). A ordem interna das histórias segue `unit-of-work-story-map.md`. Se o Desenho Funcional mostrar que U2 não cabe numa passada, a saída é voltar à Geração de Unidades, e não fatiar o Bolt.

---

## Bolt 3 — `b3-conversation`

**Unidade:** U3 `u3-conversation`.
**Histórias principais:** US1.4. Também realiza critérios de US1.3, US1.5, US2.1, US2.2, US2.3, US4.1, US5.1, US5.2, US5.3 e US5.4, conforme `unit-of-work-story-map.md`.
**Esqueleto:** não.

**Parte atacada primeiro** (Q1, Q5): a regra de acesso à conversa — solicitante, responsável atual, atendentes e gestores do setor atual ou de setor por onde o chamado passou —, com o teste de 404 sem nenhuma mensagem no corpo para quem está fora (AC2.1.7), antes do envio de mensagens.

**Definição de Pronto:**

- Todo critério de aceitação que o mapa atribui a U3 tem teste.
- Não existe rota de edição nem de exclusão de mensagem, verificado pelo teste de enumeração de rotas.
- Mensagem em chamado encerrado é recusada com `MESSAGE_TICKET_CLOSED`.
- A mensagem do solicitante num chamado que aguarda o solicitante devolve o chamado à análise na mesma transação que grava a mensagem.
- O recurso de mensagens tem teste de acesso a registro alheio e de 404 indistinguível.
- A questão em aberto de U3 — se o administrador lê mensagens — está resolvida no Desenho Funcional.
- O Bolt está em `main` por squash-merge.

**Hipótese de confiança.** Solicitante e atendimento conversam dentro do chamado sem que a regra de acesso da conversa vaze para quem não deve, inclusive depois de transferências, e a resposta do solicitante devolve o chamado à análise sem passo manual. A hipótese cai se alguém fora da regra ler uma mensagem, ou se a mensagem ficar gravada sem a transição correspondente.

**Demonstração esperada.** O atendente pede uma informação e o chamado passa a aguardar a solicitante; a solicitante responde e o chamado volta à análise; o atendente recebe a notificação; depois de transferido, o setor de origem ainda lê a conversa, e um aluno qualquer recebe 404 no endereço das mensagens.

**Dono:** `aidlc-developer-agent`, com o autor aprovando.

---

## Ponto de Decisão antes dos Could Have

Depois do Bolt 3, o autor decide explicitamente se segue para o Bolt 4 ou encerra o plano ali (Q2).

**Condições para seguir:** os Bolts 1, 2 e 3 estão em `main`; todos os critérios de aceitação das histórias Must estão cobertos por teste ou por entrada no roteiro de inspeção manual (a regra de `stories.md`: Could have nunca antes de US1 a US5 concluídas e testadas); e o autor julga que há folga de tempo.

**Parar aqui entrega:** o sistema completo do corte mínimo. Nenhuma unidade Must depende de U4 ou U5, então nada fica pela metade.

---

## Bolt 4 — `b4-reporting` (condicional)

**Unidade:** U4 `u4-reporting`.
**Histórias principais:** US6.1, US6.2. Também realiza critérios de US5.1, US5.3 e US5.4.
**Esqueleto:** não.

**Parte atacada primeiro** (Q1, Q5): os números restritos à visibilidade de quem consulta, obtidos pelo serviço público de U2 e nunca por consulta direta às tabelas de chamados (ADR-005). Antes disso, o Desenho Funcional fixa os marcos de início e fim dos tempos médios (achado R-06).

**Definição de Pronto:**

- Todo critério de aceitação de US6.1 e US6.2 tem teste.
- Um teste mostra que os números vistos por um gestor excluem chamados que ele não conseguiria abrir.
- Não existe rota de exportação nem de download, verificado pelo teste de enumeração de rotas.
- O painel expõe o ponto de composição de indicadores descrito em SVC-08.
- As questões em aberto de U4 estão resolvidas: marcos dos tempos médios e se o administrador consulta a listagem filtrada.
- O Bolt está em `main` por squash-merge.

**Hipótese de confiança.** Os números do painel batem com os chamados que o gestor consegue abrir, e nunca incluem chamado de outro setor. A hipótese cai se uma contagem divergir da listagem visível ao mesmo perfil no mesmo período.

**Demonstração esperada.** A gestora escolhe um período e vê as contagens por status, categoria e setor, e os tempos médios; num período sem chamados, vê o estado vazio explicativo; as contagens batem com a listagem filtrada.

**Dono:** `aidlc-developer-agent`, com o autor aprovando.

---

## Ponto de Decisão antes da Avaliação

Depois do Bolt 4, o autor decide explicitamente se segue para o Bolt 5 ou encerra o plano (Q2). Condições para seguir: o Bolt 4 está em `main` — U5 depende de U4 — e o autor julga que há folga.

---

## Bolt 5 — `b5-rating` (condicional)

**Unidade:** U5 `u5-rating`.
**Histórias principais:** US6.3. Também realiza critérios de US5.1, US5.2, US5.3 e US5.4.
**Esqueleto:** não.

**Parte atacada primeiro** (Q1, Q5): o 404 para avaliação de chamado alheio e a restrição a chamado encerrado do próprio solicitante; antes disso, o Desenho Funcional fixa a escala da nota e se uma avaliação pode ser substituída.

**Definição de Pronto:**

- Todo critério de aceitação de US6.3 tem teste, inclusive o encerramento acontecendo normalmente sem avaliação (AC6.3.2).
- O recurso de avaliação tem teste de acesso a registro alheio e de 404 indistinguível.
- A avaliação entra no painel pelo ponto de composição de SVC-08, sem alterar nenhum indicador nem endpoint existente de U4.
- O serviço público de Tickets ganha apenas o método aditivo previsto em SVC-07; nenhum método existente muda.
- O Bolt está em `main` por squash-merge.

**Hipótese de confiança.** Uma extensão puramente aditiva consegue acrescentar um dado e um indicador novos sem alterar nenhum contrato existente de U2 e de U4. A hipótese cai se qualquer teste de U2 ou de U4 precisar mudar para acomodar a avaliação.

**Demonstração esperada.** A aluna avalia um chamado encerrado; a gestora vê a média de avaliações no painel, no mesmo período dos outros indicadores; um aluno diferente recebe 404 ao tentar ler a avaliação.

**Dono:** `aidlc-developer-agent`, com o autor aprovando.

---

## Assumptions & Open Questions

- [assumption] O critério "há folga" nos pontos de decisão é o julgamento do autor, sem limiar numérico: não existe data de entrega que restrinja o plano (D11).
- [assumption] O workflow de Integração Contínua é produzido pela etapa de pipeline de CI, que vem depois da construção neste plano. Durante os Bolts, o portão é o hook local de pre-push.
- [assumption] O escopo desta iniciativa liga a cerimônia de esqueleto. Se o fluxo de construção pedir aprovação à parte do Bolt 1 e perguntar como seguir com os demais, isso é compatível com este plano: o Bolt 1 é a primeira fatia pela pilha, e os seguintes rodam um de cada vez.
- [assumption] Os identificadores `b1-foundation` a `b5-rating` seguem a regra de nomes de unidade em inglês registrada em `project.md`.
- Questões em aberto que este plano atribui a um Bolt, sem resolvê-las: ver a Definição de Pronto de cada Bolt e a tabela de questões em aberto de `contract-summary.md`.
