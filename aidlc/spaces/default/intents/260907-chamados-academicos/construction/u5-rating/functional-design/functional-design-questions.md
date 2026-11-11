# Desenho Funcional — U5 Avaliação (`u5-rating`) — Plano e Perguntas

Base: `../../../inception/units-generation/unit-of-work.md` (U5: extensão dos blocos Tickets e Reporting), `../../../inception/units-generation/unit-of-work-story-map.md` (US6.3), `../../../inception/requirements-analysis/requirements.md` (FR12), `../../../inception/contract-design/contract-summary.md` (X-01, API-U5, SVC-06, SVC-07, SVC-08, DB-01) e o desenho e o código já existentes de U1, U2, U3 e U4.

U5 é a única unidade que não traz bloco próprio: ela acrescenta um dado ligado ao chamado, uma ação no detalhe de chamado encerrado e um número no painel, estendendo por adição os módulos de U2 e de U4.

Já está fixado e não é perguntado:

- **Quem avalia:** só o solicitante do próprio chamado, e só com o chamado encerrado. Chamado alheio ou invisível responde 404, igual ao inexistente (FR12.1, NFR4, AC6.3.1).
- **Avaliação é opcional:** o encerramento acontece sem ela, e nada cobra a avaliação (AC6.3.2).
- **A avaliação compõe o painel** de indicadores, com o mesmo recorte de período das outras leituras (FR12.2, AC6.3.3).
- **Visibilidade:** quem pode ver o chamado continua sendo decidido pelo serviço público de U2; U5 não reimplementa essa regra e não consulta tabela de outra unidade (ADR-005, DB-01).
- **Extensão aditiva:** a avaliação entra no módulo de chamados e o número entra no de indicadores, sem alterar nenhum método nem resposta existente (SVC-07, SVC-08).
- **Sem notificação e sem exportação:** avaliar não gera aviso a ninguém, e não há rota de download.
- **Não há tela desenhada** para a avaliação nos wireframes: ela vive no detalhe do chamado encerrado, e o desenho desta unidade fixa a forma.

---

## Q1. Qual é a escala da nota?

O contrato diz apenas que a nota é um número inteiro e deixa a escala para esta etapa. A média aparece no painel.

- A. De 1 a 5, com um rótulo em texto para cada valor (de "muito ruim" a "muito bom"); a média aparece com uma casa decimal.
- B. De 1 a 10, sem rótulo por valor; a média aparece com uma casa decimal.
- C. Duas opções apenas — atendimento satisfatório ou não —, guardadas como 1 e 0; o painel mostra o percentual de satisfação em vez de média.
- X. Other (please specify)

[Answer]: A. De 1 a 5, com um rótulo em texto para cada valor (de "muito ruim" a "muito bom"); a média aparece com uma casa decimal.

---

## Q2. A avaliação pode ser trocada depois de enviada?

O contrato deixa essa decisão para esta etapa. A reabertura do chamado é possível em até 72 horas, e um chamado reaberto pode ser encerrado de novo.

- A. Não pode ser trocada: a primeira avaliação vale, e uma segunda tentativa é recusada. Se o chamado for reaberto e encerrado de novo, a avaliação anterior continua valendo e não há nova avaliação.
- B. Pode ser trocada enquanto o chamado puder ser reaberto (72 horas desde o encerramento); depois disso, fica definitiva.
- C. Pode ser trocada a qualquer momento, e a última avaliação é a que vale; a reabertura e o novo encerramento não mudam isso.
- X. Other (please specify)

[Answer]: A. Não pode ser trocada: a primeira avaliação vale, e uma segunda tentativa é recusada. Se o chamado for reaberto e encerrado de novo, a avaliação anterior continua valendo e não há nova avaliação.

---

## Q3. A avaliação tem comentário?

O contrato traz um campo de comentário opcional, sem limite nem regra de leitura.

- A. Sim, opcional, de até 500 caracteres, texto puro; aparece para quem vê o chamado e nunca no painel, que mostra só números.
- B. Sim, opcional, de até 2000 caracteres, com as mesmas regras de leitura.
- C. Não: só a nota. O campo de comentário sai do contrato, por decisão desta etapa.
- X. Other (please specify)

[Answer]: A. Sim, opcional, de até 500 caracteres, texto puro; aparece para quem vê o chamado e nunca no painel, que mostra só números.

---

## Q4. Quem pode ler a avaliação de um chamado?

O contrato marca a leitura como "autenticado" e deixa a regra de ator para esta etapa. A nota é um julgamento do atendimento que aquele setor prestou.

- A. Quem vê o chamado: o solicitante, o responsável, os atendentes e gestores do setor atual e dos setores por onde ele passou, e o Administrador em leitura.
- B. O solicitante e o Gestor do setor atual. O responsável não vê a nota do próprio atendimento; o Administrador vê.
- C. O solicitante e o atendimento do setor atual, sem os setores de passagem e sem o Administrador.
- X. Other (please specify)

[Answer]: A. Quem vê o chamado: o solicitante, o responsável, os atendentes e gestores do setor atual e dos setores por onde ele passou, e o Administrador em leitura.

---

## Q5. Como a avaliação entra no painel?

O painel de U4 tem cartões e dois gráficos, e recorta por período. As contagens recortam pela abertura do chamado e os tempos médios pelo encerramento.

- A. Um cartão novo com a média das avaliações e a quantidade de avaliações ao lado, recortado pelo **encerramento** do chamado, junto com os cartões de tempo, que usam o mesmo recorte.
- B. Um cartão novo recortado pela **data da avaliação**, que é quando o solicitante respondeu, e não quando o chamado fechou.
- C. Um cartão novo mais um gráfico de barras com a distribuição das notas, os dois recortados pelo encerramento.
- X. Other (please specify)

[Answer]: A. Um cartão novo com a média das avaliações e a quantidade de avaliações ao lado, recortado pelo **encerramento** do chamado, junto com os cartões de tempo, que usam o mesmo recorte.

---

## Consolidated Summary Confirmation

Resumo consolidado das respostas:

- Escala: de 1 a 5, com rótulo em texto para cada valor, de "muito ruim" a "muito bom"; a média aparece com uma casa decimal (Q1).
- Substituição: a avaliação não pode ser trocada. A primeira vale, uma segunda tentativa é recusada, e a reabertura seguida de novo encerramento não abre nova avaliação (Q2).
- Comentário: opcional, de até 500 caracteres, texto puro; visível a quem vê o chamado e nunca exibido no painel (Q3).
- Leitura: quem vê o chamado — solicitante, responsável, atendentes e gestores do setor atual e dos setores de passagem — e o Administrador em leitura (Q4).
- Painel: um cartão com a média e a quantidade de avaliações ao lado, recortado pelo encerramento do chamado, junto com os cartões de tempo (Q5).

Já fixado antes das perguntas, e incorporado sem pergunta: só o solicitante avalia, e só com o chamado encerrado, com 404 para chamado alheio; a avaliação é opcional e o encerramento não depende dela; a avaliação compõe o painel; a visibilidade do chamado continua decidida pelo serviço de U2, sem regra nova nem consulta a tabela alheia; a extensão é aditiva nos módulos de U2 e de U4; avaliar não gera notificação e não existe exportação; a ação vive no detalhe do chamado encerrado, porque não há tela desenhada para ela.

- Looks correct
- Request changes

[Answer]: Looks correct
