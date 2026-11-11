# Planejamento de Entrega — Plano e Perguntas

Base: `../units-generation/unit-of-work.md`, `../units-generation/unit-of-work-dependency.md` e `../units-generation/unit-of-work-story-map.md` (5 unidades e o grafo entre elas), `../contract-design/contract-summary.md` (contratos e questões em aberto), `../user-stories/stories.md`, `../requirements-analysis/requirements.md`, `../domain-design/components.md` e `../practices-discovery/team-practices.md`.

Esta etapa escolhe a **ordem de construção**. A unidade de planejamento é o **Bolt**: uma passada de construção sobre uma ou mais unidades de trabalho, que termina em algo que roda e tem uma Definição de Pronto. O grafo da Geração de Unidades diz o que *pode* vir antes de quê; aqui se decide o que *vai* vir antes, e por quê.

Já está fixado e não é perguntado:

- **U1 é o primeiro Bolt.** Todas as outras unidades dependem dela.
- **Não há Bolt de esqueleto separado.** O escopo desta iniciativa liga a cerimônia de esqueleto — uma fatia mínima de ponta a ponta, aprovada à parte, antes das funcionalidades. Mas a prática afirmada em `team.md` diz que o time não constrói essa fatia como entrega separada, porque a primeira unidade já atravessa a pilha inteira. A regra mais específica prevalece: U1 cumpre esse papel.
- **U2 vem logo depois de U1.** U3, U4 e U5 dependem dela.
- **Nenhuma dependência externa trava a construção.** O autor é o único que aprova (D06), o prazo acadêmico não restringe o planejamento (D11), e tudo roda localmente, com ferramentas públicas.
- **Capacidade:** de 10 a 20 horas por semana, um único desenvolvedor (D12).
- **Quem constrói:** a etapa de formação de equipe não faz parte deste plano, então os Bolts são construídos pelo agente de desenvolvimento, com o autor aprovando.

---

## Q1. Qual lógica decide a ordem dos Bolts?

A ordem está quase toda forçada: U1 e U2 vêm primeiro pelo grafo, e `stories.md` diz que as histórias Could have só são construídas depois de todas as Must estarem concluídas e testadas — o que põe U3 antes de U4, e U4 antes de U5. A pergunta é que lógica registrar e o que fazer dentro de cada Bolt.

- A. Sem pontuação formal: fundação primeiro, Must antes de Could, e o grafo decide o resto (U1, U2, U3, U4, U5). Dentro de cada Bolt, a parte mais incerta é atacada primeiro e aparece na Definição de Pronto.
- B. Pontuação formal WSJF — valor, urgência e redução de risco divididos pelo tamanho — registrada para cada unidade, mesmo que a ordem resultante seja a mesma.
- C. Sem pontuação e sem antecipar incerteza: cada Bolt segue a ordem interna de histórias já registrada no mapa de histórias.
- X. Other (please specify)

[Answer]: A. Sem pontuação formal: fundação primeiro, Must antes de Could, e o grafo decide o resto (U1, U2, U3, U4, U5). Dentro de cada Bolt, a parte mais incerta é atacada primeiro e aparece na Definição de Pronto.

---

## Q2. As unidades Could have — U4 (indicadores) e U5 (avaliação) — entram no plano?

`stories.md` diz que elas só são construídas se houver folga, e nunca antes de todas as histórias Must estarem concluídas e testadas.

- A. Entram como Bolts condicionais depois do último Bolt Must, cada um com um ponto de decisão explícito — seguir ou parar — antes de começar.
- B. Só U4 entra, como Bolt condicional; U5 fica fora do plano, registrada como possibilidade futura.
- C. Nenhuma entra: o plano termina em U3, e U4 e U5 ficam registradas fora do plano.
- X. Other (please specify)

[Answer]: A. Entram como Bolts condicionais depois do último Bolt Must, cada um com um ponto de decisão explícito — seguir ou parar — antes de começar.

---

## Q3. Quantas unidades vão em cada Bolt?

U2 é a maior unidade (XL). Um Bolt não divide uma unidade: dividir U2 exigiria voltar à Geração de Unidades.

- A. Um Bolt por unidade. U2 vira o Bolt mais longo, com esse risco registrado.
- B. U4 e U5 juntas num único Bolt Could; as demais, uma por Bolt.
- C. Voltar à Geração de Unidades para dividir U2 antes de planejar.
- X. Other (please specify)

[Answer]: A. Um Bolt por unidade. U2 vira o Bolt mais longo, com esse risco registrado.

---

## Q4. Os Bolts podem rodar em paralelo?

A Geração de Unidades permitiu paralelismo onde o grafo deixa (U3 com U4, e U3 com U5). Mas a regra de `stories.md` — Could só depois de todas as Must — faz U4 e U5 esperarem U3 terminar, o que elimina esse paralelismo.

- A. Um Bolt por vez, sempre. A regra de `stories.md` prevalece, e o paralelismo do grafo fica sem uso.
- B. U4 pode começar junto com U3, como exceção à regra de `stories.md`, se houver folga.
- X. Other (please specify)

[Answer]: A. Um Bolt por vez, sempre. A regra de `stories.md` prevalece, e o paralelismo do grafo fica sem uso.

---

## Q5. O que mais preocupa nesta construção? (select all that apply)

A resposta define quais incertezas são atacadas primeiro dentro de cada Bolt e quais entram como risco registrado.

- A. O tamanho de U2 para 10 a 20 horas por semana.
- B. As regras de autorização e visibilidade (403 por perfil, 404 para o que não se pode ver, acesso a registro alheio) ficarem furadas.
- C. A transação entre serviços de U2 e U3, apontada na revisão dos contratos.
- D. A montagem inicial do projeto: monorepo, Docker Compose, hook de pre-push e testes contra Postgres real.
- E. A máquina de transições de status e a janela de reabertura de 72 horas.
- X. Other (please specify)

[Answer]: B, D

---

## Q6. Na construção, cada unidade é desenhada e construída por inteiro antes da próxima?

Cada unidade passa por desenho funcional, geração de código e build e teste. Há dois jeitos de percorrer isso.

- A. Uma unidade por vez: desenho funcional e código de U1 prontos antes de começar o desenho de U2. O primeiro código funcionando chega mais cedo, e o que se aprende construindo U1 corrige o desenho de U2. As aprovações de cada etapa da unidade se acumulam no fim do bloco dela.
- B. Etapa por etapa: o desenho funcional de todas as unidades primeiro, depois o código de todas. Os desenhos ficam mais coerentes entre si, mas nenhum código existe antes de todos os desenhos estarem aprovados.
- X. Other (please specify)

[Answer]: A. Uma unidade por vez: desenho funcional e código de U1 prontos antes de começar o desenho de U2. O primeiro código funcionando chega mais cedo, e o que se aprende construindo U1 corrige o desenho de U2. As aprovações de cada etapa da unidade se acumulam no fim do bloco dela.

---

## Q7. Como a construção vai ser conduzida?

Posso construir cada unidade aqui mesmo, uma de cada vez, com você aprovando ao longo do caminho; ou, se houver vários times, cada time pode ser dono de uma unidade e aprovar o próprio trabalho.

- A. Aqui, uma unidade por vez, com você aprovando ao longo do caminho.
- B. Vários times, cada um dono de uma unidade e aprovando o próprio trabalho (exige a opção A da Q6).
- X. Other (please specify)

[Answer]: A. Aqui, uma unidade por vez, com você aprovando ao longo do caminho.

---

## Consolidated Summary Confirmation

Resumo consolidado das respostas:

- Lógica de ordem: sem pontuação formal; fundação primeiro, Must antes de Could, e o grafo decide o resto. Ordem resultante: U1, U2, U3, U4, U5. Dentro de cada Bolt, a parte mais incerta vem primeiro e entra na Definição de Pronto (Q1).
- Could have: U4 e U5 entram como Bolts condicionais depois do último Bolt Must, cada um com um ponto de decisão explícito — seguir ou parar — antes de começar (Q2).
- Tamanho: um Bolt por unidade, cinco Bolts ao todo; U2 é o Bolt mais longo, com esse risco registrado (Q3).
- Paralelismo: um Bolt por vez; a regra de `stories.md` prevalece sobre o paralelismo que o grafo permitiria (Q4).
- Maiores preocupações: as regras de autorização e visibilidade (403, 404, acesso a registro alheio) e a montagem inicial do projeto (monorepo, Docker Compose, hook de pre-push, testes contra Postgres real). Elas definem a parte atacada primeiro: em U1, a montagem do projeto e o guard de negação por padrão; em U2, a regra de visibilidade e seus testes negativos (Q5).
- Percurso da construção: uma unidade por vez — desenho funcional, código e testes de uma unidade completos antes do desenho da seguinte (Q6).
- Condução: nesta sessão, uma unidade por vez, com o autor aprovando ao longo do caminho (Q7).

Já fixado antes das perguntas, e incorporado sem pergunta: U1 primeiro e U2 em seguida pelo grafo; sem Bolt de esqueleto separado, porque U1 atravessa a pilha inteira (`team.md`); nenhuma dependência externa (D06, D11); capacidade de 10 a 20 horas por semana (D12); construção pelo agente de desenvolvimento, com o autor aprovando.

Riscos que entram registrados mesmo sem terem sido marcados como preocupação: o tamanho de U2 (XL) e o mecanismo de transação entre U2 e U3 (achado R-01 da revisão dos contratos, aceito no portão), a decidir no Desenho Funcional de U2.

- Looks correct
- Request changes

[Answer]: Looks correct
