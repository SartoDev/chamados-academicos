# Geração de Unidades — Plano e Perguntas

Base: `../domain-design/components.md` (7 blocos, 10 entidades, dois ciclos declarados), `../domain-design/decisions.md` (ADR-001 a ADR-007), `../requirements-analysis/requirements.md` (FR1–FR12, NFR1–NFR9, restrições C1–C8) e `../user-stories/stories.md` (20 histórias).

Esta etapa agrupa os blocos do Desenho de Domínio em **unidades de trabalho** — pedaços que podem ser construídos e testados por inteiro — e descreve **o que depende de quê**. Ela **não** escolhe a ordem de construção nem o caminho crítico: isso é trabalho do Planejamento de Entrega, que usa o grafo produzido aqui como entrada.

Já está fixado e não é perguntado:

- **Modelo de implantação.** Tudo roda localmente com um único `docker compose up` (C3), com um backend (`apps/api`) e um frontend (`apps/web`) no mesmo repositório (C2). Cada unidade é um conjunto de módulos **embutidos** nessas duas aplicações; nenhuma unidade é um serviço implantado à parte.
- **Sem unidade de esqueleto.** A prática afirmada em `team.md` diz que a primeira unidade já atravessa a pilha inteira (React, NestJS, Prisma, Postgres, Docker Compose). A estrutura do projeto — workspaces, Dockerfiles, Compose, envelope de erro, guard global, validação de variáveis de ambiente — entra na primeira unidade de negócio, e não numa unidade só de infraestrutura.
- **Comunicação no chamado é unidade própria.** Regra afirmada em `project.md`. Isso responde à questão em aberto que `requirements.md` deixou para esta etapa.
- **Auth, Users e Catalog ficam na mesma unidade.** Os dois ciclos declarados em ADR-004 passam por esses três blocos, e o grafo de unidades não pode ter ciclo. Separá-los exigiria quebrar o ciclo, o que ADR-004 rejeitou.
- **Indicadores ficam em unidade separada.** A Q7 do Desenho de Domínio e ADR-005 separaram Reporting justamente para poder cortá-lo inteiro.
- **Comunicação entre unidades por chamada direta de serviço**, sem camada de eventos (Q5 do Desenho de Domínio).

---

## Q1. As unidades incluem as telas, ou o frontend vira unidade à parte?

O catálogo de blocos cobre só o backend (ADR-007) e deixou para esta etapa decidir onde o frontend entra. A resposta define se cada unidade termina com algo que dá para usar na tela, ou só com uma API testada.

- A. Fatias verticais: cada unidade entrega o módulo do backend, as telas que o consomem e os testes das duas camadas. Uma unidade pronta é uma funcionalidade usável de ponta a ponta.
- B. Backend e frontend separados: as unidades de backend vêm primeiro, e todas as telas formam uma unidade de interface única no fim — exceto a tela de login, que entra na primeira unidade por causa da prática afirmada de atravessar a pilha.
- C. Backend por unidade, e frontend em unidades de interface por perfil (Solicitante, Atendimento, Administração), cada uma dependendo das unidades de backend que consome.
- X. Other (please specify)

[Answer]: A. Fatias verticais: cada unidade entrega o módulo do backend, as telas que o consomem e os testes das duas camadas. Uma unidade pronta é uma funcionalidade usável de ponta a ponta.

---

## Q2. Quantas unidades, e onde ficam chamados e notificações?

O bloco Tickets é o maior do sistema (dez histórias). E há uma armadilha: Tickets chama Notifications para gravar o aviso, e a notificação aponta para o chamado. Se os dois ficarem em unidades diferentes, uma precisa existir antes da outra, e isso só fecha sem ciclo se a notificação guardar o identificador do chamado sem chave estrangeira no banco.

Todas as opções mantêm a fundação (Auth, Users, Catalog), a conversa e os indicadores como unidades próprias, conforme fixado acima.

- A. Quatro unidades: fundação; chamados (Tickets inteiro mais Notifications — abertura, acompanhamento, fila, atendimento, transições, histórico, reabertura e sino de notificações); conversa; indicadores. Menos fronteiras e nenhum ciclo, mas a unidade de chamados fica muito grande.
- B. Cinco unidades, com o chamado dividido por lado: fundação; abertura e acompanhamento (lado do solicitante, mais Notifications); atendimento (fila, assumir, atribuir, transferir, andamento e reabertura); conversa; indicadores. Unidades menores, mas o bloco Tickets fica espalhado em duas unidades e a segunda altera o código da primeira — a fronteira por ator que ADR-001 rejeitou para os blocos volta no nível das unidades.
- C. Cinco unidades, com notificações à parte: fundação; notificações (antes dos chamados, guardando o identificador do chamado sem chave estrangeira); chamados (Tickets inteiro); conversa; indicadores. Um bloco por unidade fora a fundação, ao custo de a notificação não ter a referência ao chamado garantida pelo banco.
- D. Seis unidades: a divisão do chamado de B combinada com as notificações à parte de C.
- X. Other (please specify)

[Answer]: A. Quatro unidades: fundação; chamados (Tickets inteiro mais Notifications — abertura, acompanhamento, fila, atendimento, transições, histórico, reabertura e sino de notificações); conversa; indicadores. Menos fronteiras e nenhum ciclo, mas a unidade de chamados fica muito grande.

---

## Q3. Onde entram as três histórias Could have (painel, listagens filtradas, avaliação)?

O painel e as listagens filtradas (US6.1, US6.2) só leem dados. A avaliação do atendimento (US6.3) grava um dado novo ligado ao chamado, e só faz sentido com o painel pronto, porque a avaliação compõe os indicadores (FR12.2). O Planejamento de Entrega pode cortar qualquer Could have; a pergunta é onde fica a linha de corte.

- A. Duas unidades Could: indicadores (painel e listagens) e avaliação (depende de chamados e de indicadores). O painel pode ser entregue sem a avaliação, e a avaliação pode ser cortada sozinha.
- B. Uma unidade Could só, com as três histórias. Cortar os Could remove tudo de uma vez, mas não dá para entregar o painel sem levar a avaliação junto.
- C. Indicadores só com painel e listagens; a avaliação entra na unidade de chamados, marcada como Could dentro dela. Menos unidades, mas uma unidade Must passa a carregar uma parte opcional.
- X. Other (please specify)

[Answer]: A. Duas unidades Could: indicadores (painel e listagens) e avaliação (depende de chamados e de indicadores). O painel pode ser entregue sem a avaliação, e a avaliação pode ser cortada sozinha.

---

## Q4. Unidades sem dependência entre si podem ser construídas ao mesmo tempo?

Você desenvolve sozinho, mas a construção assistida pode trabalhar duas unidades independentes em paralelo, em cópias separadas do repositório. O ponto de conflito certo é o esquema do banco: todas as unidades acrescentam modelos e migrações ao mesmo esquema do Prisma. Esta resposta não escolhe a ordem — só diz se o grafo pode ser percorrido em paralelo onde ele permite.

- A. Pode, onde o grafo permitir, com as migrações do banco serializadas: só uma unidade por vez gera migração, na ordem em que as unidades entram em `main`.
- B. Não: uma unidade por vez, sempre. O grafo registra onde haveria paralelismo, mas ele não é usado.
- C. Pode, sem restrição, resolvendo conflitos de esquema e de migração na hora de juntar em `main`.
- X. Other (please specify)

[Answer]: A. Pode, onde o grafo permitir, com as migrações do banco serializadas: só uma unidade por vez gera migração, na ordem em que as unidades entram em `main`.

---

## Q5. Como uma unidade referencia dados que pertencem a outra?

É um banco só, mas as entidades apontam para entidades de outras unidades — o chamado aponta para categoria e usuário, a mensagem aponta para o chamado. O Desenho de Domínio decidiu que um bloco obtém dados de outro chamando o serviço dele, e não lendo a tabela alheia (ADR-004). A pergunta é o que isso significa no banco e nas listagens.

- A. Chave estrangeira real entre tabelas de unidades diferentes, sempre no sentido de uma unidade da qual se depende no grafo; ler dados de outra unidade continua sendo pela chamada ao serviço dela. Integridade garantida pelo banco, e a regra de ADR-004 fica intacta.
- B. Sem chave estrangeira entre unidades: só o identificador, com a integridade garantida pelas chamadas de serviço. Mais fácil de separar depois, mas o banco não impede um chamado apontando para uma categoria inexistente.
- C. Chave estrangeira real, e listagens podem trazer dados de outra unidade na mesma consulta ao banco (por exemplo, o nome da categoria junto do chamado), só para leitura; a escrita continua exclusiva da unidade dona. Mais simples para listagens, mas revisa a consequência registrada em ADR-004 de que nenhum bloco lê a tabela de outro.
- X. Other (please specify)

[Answer]: A. Chave estrangeira real entre tabelas de unidades diferentes, sempre no sentido de uma unidade da qual se depende no grafo; ler dados de outra unidade continua sendo pela chamada ao serviço dela. Integridade garantida pelo banco, e a regra de ADR-004 fica intacta.

---

## Consolidated Summary Confirmation

Resumo consolidado das respostas:

- Telas: fatias verticais. Cada unidade entrega o módulo do backend, as telas que o consomem e os testes das duas camadas (Q1).
- Divisão: fundação (Auth, Users, Catalog), chamados (Tickets inteiro mais Notifications), conversa e indicadores como unidades próprias (Q2).
- Could have: indicadores (painel e listagens filtradas) e avaliação do atendimento em duas unidades separadas, com a avaliação dependendo de chamados e de indicadores (Q3). Com isso, o total de unidades passa de quatro para cinco.
- Paralelismo: permitido onde o grafo deixar, com migrações do banco serializadas — uma unidade por vez gera migração, na ordem de entrada em `main` (Q4).
- Dados entre unidades: chave estrangeira real, sempre no sentido do grafo; leitura de dado de outra unidade continua pela chamada ao serviço dela, mantendo ADR-004 (Q5).

Já fixado antes das perguntas, e incorporado sem pergunta: implantação local com as unidades embutidas em `apps/api` e `apps/web`; nenhuma unidade de esqueleto; conversa como unidade própria; Auth, Users e Catalog na mesma unidade por causa dos ciclos de ADR-004; comunicação entre unidades por chamada direta de serviço.

Plano aprovado (Approve Plan):

- U1 `u1-foundation` — estrutura do projeto, Auth, Users, Catalog, login, casca de layout e telas de administração; tipo `service`; tamanho L.
- U2 `u2-tickets` — Tickets inteiro e Notifications; tipo `service`; tamanho XL.
- U3 `u3-conversation` — mensagens do chamado; tipo `service`; tamanho M.
- U4 `u4-reporting` — painel e listagens filtradas, somente leitura; tipo `service`; tamanho M.
- U5 `u5-rating` — avaliação do atendimento, compondo o painel; tipo `service`; tamanho S.
- Grafo sem ciclo: U2 depende de U1; U3 e U4 dependem de U1 e U2; U5 depende de U1, U2 e U4. Paralelismo possível entre U3 e U4, e entre U3 e U5.
- Cada história tem uma unidade principal; uma história também é mapeada a outra unidade quando algum critério de aceitação dela só se realiza lá.

- Looks correct
- Request changes

[Answer]: Looks correct
