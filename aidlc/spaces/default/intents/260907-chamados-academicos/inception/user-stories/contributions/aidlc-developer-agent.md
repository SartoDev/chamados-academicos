**Collaborator:** aidlc-developer-agent

## Contribution

Revisão cega, ângulo de implementabilidade e dimensionamento. O rascunho é bom: a rastreabilidade por história é honesta, os Critérios Transversais são a decisão de modelagem mais acertada do documento, e as pendências de US6.1 e US6.3 estão marcadas em vez de escondidas. O que segue são os pontos em que o texto custa mais do que aparenta, ou em que a ordem declarada não é a ordem em que o código pode ser escrito.

---

### 1. Dimensionamento

**Premissa de capacidade**: 10 a 20 h/semana, um desenvolvedor, com a Postura de Testes afirmada em `team.md` (Jest + `@swc/jest`, Postgres real via Supertest, 90% de ramo em guards e regras de autorização, 80% em services, teste negativo de autorização obrigatório por endpoint e teste de IDOR por recurso com dono). O custo de teste não é acessório aqui: em histórias de autorização ele chega a 40% do esforço. As faixas abaixo já o incluem e são ordens de grandeza, não compromissos.

| História | Faixa (h) | Veredito | Motivo |
|---|---|---|---|
| US1.1 | 16–22 | **Dividir** | Arrasta todo o arranque de plataforma (ver 1.1) |
| US1.2 | 8–10 | OK | Bem calibrada |
| US1.3 | 14–18 | **Dividir** | Listagem e detalhe com três abas são duas capacidades (ver 1.2) |
| US1.4 | 8–10 | OK | — |
| US1.5 | 10–12 | OK, com CT | Depende de mover a gravação para transversal (ver 3.1) |
| US1.6 | 6–8 | OK | — |
| US2.1 | 12–16 | **Mover AC2.1.3** | Cai para 10–12 sem ela |
| US2.2 | 10–12 | **Mover AC2.2.4 e AC2.2.5** | Encerrar é transição e pertence a US2.3 |
| US2.3 | 12–16 | OK, maior risco de regra | AC2.3.2 é o critério mais caro do documento |
| US2.4 | 8–10 | OK | Custa uma tabela nova (ver 5.1) |
| US3.1 | 4–6 | Menor do conjunto | Candidata a fusão com US2.2 (ver 1.4) |
| US4.1 | 16–20 com interface / 6–8 só API e carga inicial | **Dividir** | ver 1.3 |
| US4.2 | 20–26 com interface / 4–6 só carga e leitura | **Dividir** | ver 1.3 — e contraria regra afirmada |
| US5.1 a US5.4 | não agendáveis | **Converter em CT** | ver 1.5 |

Soma do Must como está escrito: **cerca de 145 a 190 h**, ou 10 a 14 semanas de calendário na média da capacidade. Com as divisões de 1.3 aplicadas (interface administrativa recuada para Should): **cerca de 105 a 135 h**, 7 a 9 semanas. Essa diferença de três a cinco semanas é o maior efeito isolado de dimensionamento em todo o documento, e é a razão pela qual 1.3 não é preciosismo.

#### 1.1 US1.1 carrega o arranque de plataforma e o documento não diz isso

`team.md` § Walking Skeleton dispensou o Bolt de esqueleto com o argumento de que "a primeira unidade de trabalho já atravessa toda a pilha". Concordo com a decisão, mas ela tem uma consequência que o grafo não mostra: **a primeira história pagará Docker Compose, Prisma, migração inicial, `PrismaService`, filtro global de exceção com o envelope de CT2, guard global de negação por padrão, decorador de perfil, validação de variáveis de ambiente (CT5), roteador e cliente React Query no `apps/web`, e a fábrica de fixtures de teste**. Nada disso é critério de aceitação de nenhuma história, e tudo é pré-requisito de todas.

Sugestão concreta: acrescentar ao topo do grafo um nó explícito **US0 — Arranque da plataforma**, cujos critérios de aceitação são exatamente CT2, CT4 e CT5 (que hoje flutuam sem dono), mais um: *dado o repositório recém-clonado, quando executo o comando de composição e a suíte, então a aplicação sobe e ao menos um teste de integração conecta em Postgres real*. Sem esse nó, o Planejamento de Entrega vai subestimar o primeiro Bolt em algo entre 12 e 20 h.

A **fábrica de fixtures** merece ser critério dessa história e não um detalhe: são cinco perfis, dois setores e chamados nos quatro status. Se cada história construir o seu próprio preparo de dados, o custo de teste de US5.1 se multiplica por treze.

#### 1.2 US1.3 é duas histórias

AC1.3.1, AC1.3.2, AC1.3.3 e AC1.3.5 são a listagem. AC1.3.4 e AC1.3.6 são a tela de detalhe com abas — e a aba de mensagens só existe depois de US1.4, e a aba de histórico só tem conteúdo depois que US2.3 (AC2.3.6) grava alguma coisa. Como está, US1.3 não pode fechar na posição em que o grafo a coloca.

Proposta preservando os identificadores existentes: manter US1.3 como **listagem** (AC1.3.1, AC1.3.2, AC1.3.3, AC1.3.5) e criar **US1.7 — Ver o detalhe completo do chamado** ao final do grupo, herdando AC1.3.4 e AC1.3.6 com os identificadores inalterados. US1.7 entra depois de US1.4 e US2.3 no grafo.

#### 1.3 US4.1 e US4.2 promovem interface administrativa a Must, e US4.2 contraria regra afirmada

`project.md` § Mandated afirma: *"restringir a Área Administrativa dedicada ao nível Should have, garantindo que categorias e setores sejam administráveis pelo modelo de dados no corte mínimo (Must have) mesmo sem a interface de administração completa"*.

US4.2 está rotulada **(Must)** e cobre FR9.2 e FR9.3, que são Should. AC4.2.6 (diálogo de confirmação explicando o efeito) é literalmente FR9.3, isto é, interface. AC4.2.3 é redigido do ponto de vista da tela do solicitante. O resultado é que a história promove por agregação o CRUD administrativo de quatro entidades ao corte mínimo — 20 a 26 h de trabalho que a regra afirmada colocou fora dele. US4.1 faz o mesmo, mas ao menos declara o conflito em nota; US4.2 não declara nada.

Correção proposta, que também conserta o grafo (ver 3.2):

- **US4.2 (Must) — Catálogos disponíveis**: modelo de dados administrável, carga inicial (AC4.2.5, os quatro status e as três prioridades, mais setores e categorias iniciais) e situação ativo/inativo respeitada na leitura (AC4.2.3, AC4.2.4). 4 a 6 h. É isto que US1.2 precisa.
- **US4.3 (Should) — Interface de manutenção de catálogos**: listagem, criação, edição e desativação por tela para as quatro entidades, incluindo AC4.2.6. 16 a 20 h.
- **US4.1 (Must) — Contas e acessos por API, com administrador inicial semeado**: AC4.1.1 a AC4.1.7 no backend, com o primeiro administrador criado pela carga inicial. 6 a 8 h.
- **US4.4 (Should) — Interface de gestão de usuários**: as mesmas capacidades por tela. 10 a 12 h.

Isso responde de forma implementável ao achado R-01 e R-02 da revisão de requisitos, que pedia *"documentar um caminho não-UI para FR2"* ou *"reclassificar FR9.1 como Must explicitamente"*. A carga inicial é o caminho não-UI, e ela é obrigatória de qualquer forma por CT4: o sistema tem de subir utilizável com um comando, e um banco vazio sem administrador não é utilizável.

#### 1.4 US3.1 é pequena demais para entrada própria — opcionalmente

US3.1 é um endpoint de atualização do responsável, um seletor na tela e quatro testes de autorização. É a menor história funcional do conjunto. Assumir (AC2.2.1), atribuir (AC3.1.1) e reatribuir (AC3.1.3) são a mesma escrita no mesmo campo, com a mesma atualização condicional (ver 2.1) e a mesma linha de histórico — mudam apenas o ator e a regra de autorização. Fundi-las em uma história de "definição de responsável" economizaria uma rodada de andaime e alguns testes duplicados.

**Não estou pedindo a fusão**: manter separado é defensável porque o ator e o valor de negócio diferem, e a Gestora é persona própria. Registro como opção consciente, não como defeito.

#### 1.5 US5.1 a US5.4 não são histórias

O próprio rascunho admite que elas não entram no grafo e que "seus critérios se aplicam a todas as demais". Isso é a definição de critério transversal, não de história. O risco é operacional: o Planejamento de Entrega vai tentar agendá-las, e o resultado será um Bolt vazio ou, pior, uma "passada de acessibilidade" no fim, quando as treze telas já existirem. Adaptar navegação por teclado e o recorte de 375px depois de construído custa múltiplas vezes o que custa fazer junto, e nesta capacidade isso não se paga.

Proposta: converter em **CT6** (autorização negativa e IDOR), **CT7** (404 indistinguível), **CT8** (WCAG 2.1 A) e **CT9** (funcional em 375px), com os critérios atuais preservados palavra por palavra. Elas passam a integrar a definição de pronto de toda história, que é como serão verificadas de fato.

---

### 2. Implementabilidade: critérios que a pilha torna caros ou que serão construídos errado

#### 2.1 AC2.2.2 e AC3.1.1 induzem busca-e-compara, que CT1 proíbe e que tem corrida

*"Dado um chamado já assumido por outro atendente, quando tento assumi-lo, então a ação é recusada"* será implementado como uma busca por identificador, seguida de comparação do responsável, seguida de atualização. Isso viola CT1 na letra e tem janela de corrida real — dois atendentes clicando ao mesmo tempo, cenário provável na persona do Carlos, que trabalha a fila o dia inteiro.

Forma correta, e igualmente barata: **atualização condicional**, com o predicado inteiro dentro do `where` (identificador, responsável nulo, status de origem, setor do ator) e decisão pela contagem de linhas afetadas — zero significa conflito. O mesmo padrão vale para AC1.6.1 (reabertura dentro da janela), AC2.3.1 e AC2.4.1. Vale registrar isso uma vez em Domain Design, porque se não for dito será construído das duas formas em pontos diferentes.

#### 2.2 AC4.1.3 e AC4.1.5 exigem carga do usuário a cada requisição, contra a leitura natural do JWT

AC4.1.3 diz que a mudança de perfil *"vale na requisição autenticada seguinte"*. AC4.1.5 e AC1.1.3 dizem que o usuário desativado não entra. Com JWT em cookie, sem renovação e sem invalidação no servidor (prática afirmada), se o perfil viajar como declaração dentro do token, **nenhum dos três critérios passa** até a expiração natural, que é de horas.

Única implementação que os satisfaz: o token carrega apenas o identificador do usuário, e o guard carrega perfil, setor e situação do banco a cada requisição — uma consulta indexada por chave primária, custo desprezível no volume assumido (suposição A2). Isso *fortalece* a consequência aceita em `team.md` (um token roubado de conta desativada deixa de funcionar) sem contrariá-la. Precisa estar dito, porque a alternativa de colocar o perfil no token é a primeira coisa que qualquer tutorial de NestJS com JWT faz.

#### 2.3 AC5.2.2 é quase de graça se CT1 for respeitado, e caro se não for

*"Um identificador inexistente e um existente porém inacessível produzem respostas indistinguíveis"*: com o ator dentro do `where` (CT1), os dois casos retornam nulo da **mesma** consulta e sobem pelo **mesmo** caminho de erro. Indistinguível por construção. Se alguém buscar primeiro e comparar depois, passam a existir dois caminhos com duas respostas, e o critério vira trabalho de alinhamento manual.

Duas ressalvas que o critério não cobre: o campo `details` do envelope não pode variar entre os casos; e um identificador malformado será rejeitado pela validação com 400, o que é distinguível de 404 — aceitável, porque lixo sintático não prova existência, mas convém dizer que a indistinguibilidade é exigida apenas entre identificadores bem formados.

#### 2.4 AC5.4.2 significa duas renderizações por listagem, não uma tabela responsiva

*"Em 375px ela se apresenta como cartões, e não como tabela com colunas cortadas"*. Isso não é CSS: são dois componentes de apresentação por tela de listagem — meus chamados, fila do setor, e depois as listagens administrativas. Custo real, multiplicado pelo número de listagens. Está correto como decisão de produto; só não é barato, e o dimensionamento de 1 já o inclui.

#### 2.5 AC1.5.2 não pede tempo real, e convém dizê-lo

Não há WebSocket, SSE nem fila na pilha. O contexto de uso de P1 em `personas.md` — *"o aviso in-app precisa estar visível quando ela volta, e não apenas no momento do evento"* — autoriza a solução barata: React Query com recarga ao focar a janela. Sem essa frase explícita, "o contador do sino mostra a quantidade" é lido como notificação ao vivo, e alguém acrescenta um transporte que ninguém pediu.

#### 2.6 AC1.1.2 tem um canal lateral de enumeração de e-mail, corrigível em três linhas

Mensagem única para os dois casos está certa, mas um e-mail inexistente pula a comparação de hash e responde mais rápido que uma senha errada — a diferença é mensurável com Argon2 ou bcrypt. Correção: executar sempre uma comparação contra um hash fictício quando o usuário não existe. Baixo custo, e o repositório é público, o que torna o padrão visível a quem ler o código do TCC.

---

### 3. Ordenação: o grafo não corresponde à ordem de construção

#### 3.1 As setas de notificação apontam para o lado errado

Oito critérios em seis histórias exigem que uma notificação seja gravada: AC1.4.5, AC2.2.3, AC2.2.4, AC2.3.1, AC2.3.2, AC2.4.5, AC3.1.5 e AC1.6.3. Todos pertencem a histórias que o grafo coloca **antes** de US1.5. Como está, nenhuma dessas histórias pode passar nos próprios testes, porque a tabela de notificação ainda não existe.

Inverter as setas cria um ciclo, porque os próprios critérios de US1.5 (AC1.5.1) descrevem eventos que só existem em US2.2, US2.3, US2.4 e US3.1.

Resolução limpa, coerente com o tratamento que o rascunho já dá a autorização e a erro: **promover a gravação a critério transversal**.

> **CT6** — Todo evento que altera um chamado (nova mensagem, mudança de status, de responsável ou de setor) grava uma notificação in-app para os destinatários definidos no critério da história do evento; nenhum canal externo é acionado. *(FR7.1, FR7.2, FR7.3, FR7.4)*

US1.5 fica sendo a **experiência de leitura** — sino, contador, navegação para o chamado, marcar lida, marcar todas, isolamento por usuário (AC1.5.2 a AC1.5.6) — e pode ser construída em qualquer ponto após US1.2. AC1.5.1 vira CT6. O ciclo desaparece, cada história emissora testa a própria emissão, e a modelagem da notificação entra junto com a primeira história emissora.

#### 3.2 Arestas erradas

- `US4.2 → US1.2` e `US4.1 → US1.1`: com a divisão de 1.3, o que US1.2 precisa é da **carga inicial** de catálogos, e o que US1.1 precisa é de **usuários no banco** — não da interface administrativa. Como estão, essas duas arestas jogam 36 a 46 h de CRUD administrativo à frente do primeiro login e do primeiro chamado, que é exatamente o oposto do que a ordem "fundação primeiro" pretendia.
- `US2.1 → ... → US2.4` com AC2.1.3 dentro de US2.1: o critério de visibilidade do setor de origem só é testável depois que transferências existirem, três histórias adiante. Mover AC2.1.3 para US2.4, onde a tabela de passagem por setor é escrita de qualquer forma (ver 5.1), resolve sem tocar em nenhum identificador.

#### 3.3 Arestas faltando

- `US1.4 → US1.7` e `US2.3 → US1.7`: a tela de detalhe com abas de mensagens e histórico (ver 1.2).
- `US1.2 → US1.5`: a central de notificações precisa de chamado para notificar, substituindo `US2.2 → US1.5`.
- Nó **US0** de arranque, precedendo tudo (ver 1.1).

#### 3.4 Caminho crítico corrigido

**US0 → US4.2 (carga) → US4.1 (API e administrador semeado) → US1.1 → US1.2 → US2.1 → US2.2**. É a cadeia que precisa existir antes de qualquer coisa funcionar de ponta a ponta, e ela começa em um nó que o documento hoje não tem.

---

### 4. Trabalho oculto: critérios baratos na prosa, caros no código

| Critério | O que a prosa esconde | Custo |
|---|---|---|
| **AC2.3.2** | Enviar mensagem é ação da unidade de Comunicação, que `project.md` isola do ciclo de vida. Este critério faz o service de mensagem, na mesma transação, consultar o status, consultar o módulo puro de transição, atualizar o chamado, gravar linha de histórico e emitir notificação. É a **única** dependência de escrita entre as duas unidades, e é o que decidirá se elas são de fato separáveis. | Alto. E abre duas perguntas sem resposta: qual é o **autor** da linha de histórico numa transição automática, o solicitante ou o sistema? E o que acontece se quem escreve em *Aguardando solicitante* for o atendente — nada, presumo, mas nenhum critério diz. |
| **AC2.1.3** | Implica **histórico de setores persistido**. A implementação intuitiva é um campo de "setor anterior" no chamado, e ela **quebra na segunda transferência**: em A → B → C, o setor A perde a visibilidade que o critério lhe garante. | Médio: uma tabela de passagem, escrita na criação e em cada transferência, e um filtro por relação em toda consulta de fila de atendente. |
| **AC1.6.1** | Precisa de um campo de momento do encerramento no chamado, que nenhum outro critério declara, e de **relógio injetável** — sem ele não há como testar "encerrado há 3 dias" sem escrever direto no banco ou esperar três dias. | Baixo se previsto, irritante se descoberto na hora de escrever o teste. |
| **AC1.6.1 com AC2.4.1** | FR8.1 permite Aberto → Encerrado, e AC2.4.1 remove o responsável na transferência. Logo existe chamado encerrado **sem responsável**, e AC1.6.3 ("o último responsável recebe notificação") fica sem destinatário. Nenhum critério cobre o caso. | Baixo em código, mas é buraco de especificação. |
| **AC5.2.2** | Quase de graça se CT1 for honrado; caro se não. Ver 2.3. | Baixo, condicional. |
| **AC1.3.2 e AC2.1.5** | "O filtro persiste ao trocar de página" é barato se o estado de filtro e paginação viver na *query string* da URL, e vira gambiarra de estado local se não viver. Também é o que torna a fila filtrada compartilhável por link. | Baixo se decidido uma vez; alto se decidido duas vezes de formas diferentes. |
| **AC4.2.5** | "Existem exatamente quatro status e três prioridades" é asserção sobre a **carga inicial**, que precisa ser idempotente para sobreviver a execuções repetidas do comando de composição (CT4). | Baixo, mas a idempotência é a parte que se esquece. |
| **AC1.4.3, AC1.1.6, AC6.2.2** | Critérios de **ausência**. São automatizáveis (asserção de 404 ou 405 na rota), e convém dizê-lo: o contrato de cobertura de `team.md` exige ao menos um teste automatizado por requisito, e se estes forem marcados como inspeção manual a tabela de rastreabilidade nasce com furos. | Baixo. |

---

### 5. Consequências de modelo de dados que as histórias implicam mas não declaram

Se não forem explicitadas agora, Domain Design as inventará — e algumas das invenções prováveis estão erradas.

#### 5.1 Uma tabela de passagem por setor serve AC2.1.3 e AC2.4.4 ao mesmo tempo

AC2.4.4 pede histórico com setor de origem, setor de destino, **justificativa**, autor e momento. AC2.1.3 pede saber por quais setores o chamado passou. É o mesmo registro: chamado, setor de origem, setor de destino, justificativa, autor e momento. Modeladas separadamente, viram duas tabelas com os mesmos dados. Vale dizer que são uma.

#### 5.2 O histórico genérico precisa de rótulo congelado, não só de chave estrangeira

AC1.3.6 exibe "valor anterior e valor novo". Se o histórico guardar apenas a chave estrangeira do status ou da prioridade, e o administrador **renomear** "Em análise" para "Em atendimento" (o que US4.2 lhe permite), todo o histórico passado passa a exibir o nome novo — o histórico se reescreve sozinho. AC4.2.4 protege contra *desativação*, mas ninguém protegeu contra *renomeação*. Guardar o rótulo do momento do evento, além da chave, resolve.

O histórico também precisa de: um discriminador do campo alterado (status, responsável, setor, prioridade), um campo opcional de justificativa (AC2.4.4), e **autor anulável ou ator "sistema"** para a transição automática de AC2.3.2.

#### 5.3 Status é tabela administrável, mas a máquina de transições é módulo puro — falta a chave estável

Esta é a consequência mais importante e a que mais custa se for descoberta durante a Construção. `team.md` afirma duas coisas que colidem: *"Status e Priority são tabelas administráveis, não enums fixos"* e *"a máquina de transições de status do chamado vive num módulo puro, sem dependência de Nest e sem dependência de Prisma"*. Um módulo puro não pode raciocinar sobre identificadores gerados pelo banco.

Saída barata que preserva as duas regras: a tabela de status carrega uma **chave estável em inglês** (`OPEN`, `IN_ANALYSIS`, `WAITING_REQUESTER`, `CLOSED`) além do rótulo em português. O módulo puro opera sobre as chaves; o administrador edita rótulo, ordem e apresentação. O mesmo vale para prioridade.

Isso delimita o que "administrável" significa, e é decisão para o humano (ver 6.2). Também implica que os quatro status semeados **não podem ser desativados nem apagados** — se alguém desativar "Encerrado", a máquina para. Nenhum critério cobre isso; sugiro um em US4.2: *dado um status ou prioridade da carga inicial, quando tento desativá-lo, então a ação é recusada*.

#### 5.4 Perfil é enum, ao contrário de status e prioridade

FR2.3 fixa exatamente cinco perfis. Não é catálogo administrável e não deve virar tabela por analogia com status e prioridade. Vale um registro explícito, porque a analogia é sedutora e o custo de desfazê-la depois é uma migração.

#### 5.5 Demais consequências

- **O chamado tem setor próprio**, não derivado por leitura da categoria: o setor é derivado **na criação** (AC1.2.1) mas **muda** na transferência (AC2.4.1). Normalizar isso como leitura da categoria quebra a transferência.
- **O setor do usuário é anulável**: obrigatório para atendente e gestor (AC4.1.6), ausente para solicitante e administrador, com o caso nulo tratado em AC2.1.4.
- **Identificador visível do chamado** (FR4.3, AC1.3.1): UUID ou número sequencial legível? A persona Bruna cita o chamado por telefone e por mensagem, e um UUID é inutilizável nesse uso; um sequencial exige contador. Afeta toda tela e toda notificação. Não decidido em lugar nenhum (ver 6.4).
- **Notificação** precisa de destinatário, chamado, tipo, momento de leitura e momento de criação; AC1.5.4 é uma atualização em lote por destinatário.

---

### 6. Decisões que são do humano, não minhas nem do redator

#### 6.1 O beco sem saída da transferência — bloqueante

AC2.4.1 remove o responsável na transferência, e a transferência não muda o status. Um chamado em **Em análise** transferido fica em Em análise **sem responsável**, na fila de destino sob o recorte "não atribuídos". Mas AC2.2.1 só permite assumir *"um chamado Aberto sem responsável"*, e AC3.1.1 só permite ao gestor atribuir *"um chamado Aberto"*. AC3.1.3 cobre reatribuição de chamado *"já com responsável"*, que não é o caso.

**Ninguém consegue pegar esse chamado.** Ele fica parado indefinidamente na fila de destino — precisamente o problema que o sistema existe para eliminar.

Duas saídas, e ambas mexem em requisito aprovado: (a) a transferência também devolve o chamado a **Aberto**, o que exige acrescentar Em análise → Aberto a FR8.1; ou (b) assumir e atribuir passam a valer para **qualquer chamado sem responsável**, independentemente do status. Prefiro (a), por manter o invariante "responsável preenchido implica Em análise" que sustenta AC2.2.1, AC3.1.1 e FR8.2. Mas é alteração de uma máquina de estados já aprovada, e a escolha é do humano.

#### 6.2 O que "administrável" significa para status e prioridade

Duas leituras, com custos muito diferentes:

- **Rótulos editáveis, conjunto de chaves fixo** (ver 5.3): a máquina de transições é código, testável por função pura, e custa horas.
- **Conjunto aberto**: o administrador acrescenta um quinto status, e as transições viram **dados** — uma tabela de transições permitidas com interface de manutenção. Uma semana adicional, no mínimo, e a máquina deixa de ser pura em espírito.

FR3.3 diz apenas *"não valores fixos em código"*, o que não distingue as duas. Nesta capacidade eu recomendaria a primeira, mas a pergunta é de produto.

#### 6.3 A interface administrativa entra no corte mínimo?

É o achado R-02 da revisão de requisitos, que o rascunho fecha em nota. Como está, US4.1 e US4.2 colocam 36 a 46 h de CRUD administrativo à frente da primeira funcionalidade que qualquer persona usa. A alternativa de 1.3 (carga inicial mais API, interface como Should) entrega o mesmo corte mínimo em 10 a 14 h. Três a cinco semanas de calendário separam as duas respostas em um TCC — decisão do humano, não do redator.

#### 6.4 Qual é o identificador visível do chamado

UUID ou sequencial legível (ver 5.5). Barato de decidir agora, caro de trocar depois.

#### 6.5 Reabertura: uma vez ou ilimitada?

AC1.6.1 dá 3 dias a partir do encerramento. Se um chamado for encerrado, reaberto e encerrado de novo, a janela reinicia — e nada impede o ciclo indefinidamente. É comportamento razoável, mas é escolha, e a suposição A5 de `requirements.md` não a cobre.

#### 6.6 O setor de origem só lê, ou também escreve?

AC2.1.3 concede leitura ao setor de origem. AC2.3.3 permite alterar prioridade *"de um chamado do meu setor"*, sem dizer se "meu setor" é o setor atual ou qualquer setor por onde o chamado passou. Visibilidade de leitura e permissão de escrita foram tratadas como a mesma coisa em pontos diferentes. Precisa de resposta antes de Functional Design escrever a matriz.

#### 6.7 Autor da transição automática de AC2.3.2

O solicitante que enviou a mensagem, ou o sistema? Muda o que AC1.3.6 exibe no histórico e o que os testes afirmam.

**Não são do humano** — posso e devo resolvê-las na Construção: atualização condicional contra corrida (2.1), carga do usuário por requisição (2.2), filtros na *query string* (4), caminho único de 404 (2.3), comparação de hash fictício (2.6).

---

### 7. Correções pontuais

- **FR2.3 não é coberto por nenhuma história.** Confirmei linha a linha as declarações "Cobre:": FR2.1, FR2.2, FR2.4, FR2.5, FR2.6 e FR2.7 aparecem; FR2.3 (exatamente cinco perfis, um por usuário) não aparece em lugar nenhum. É o único furo de rastreabilidade funcional do documento — todos os demais FR e todos os nove NFR estão cobertos. Cabe em US4.1 com um critério do tipo *dado que crio um usuário, quando escolho o perfil, então há exatamente cinco opções e o usuário fica com exatamente uma*.
- **A nota INVEST sob US1.1 diz "independente (não depende de outra história)"** e o grafo, páginas adiante, mostra `US4.1 → US1.1`. Além disso essa nota só existe em US1.1 — nenhuma outra história a tem. Sugiro removê-la e deixar a seção § Conformidade INVEST fazer esse trabalho para todas.
- **AC1.1.1 termina em "vejo a lista dos meus chamados"**, o que faz US1.1 depender de US1.3 para fechar, embora US1.3 venha duas histórias depois. Trocar por "sou levado à minha área inicial autenticada" torna US1.1 fechável por si.
- **A linha "Estimable" da tabela INVEST afirma "entre 5 e 7 critérios por história"**, o que é falso para US5.1 (3), US5.2 (2), US5.3 (4), US5.4 (3), US6.2 (2) e US6.3 (3). Mais grave: **contagem de critérios não é proxy de tamanho**. AC2.3.2 sozinho custa mais que os cinco critérios de US1.4 somados; AC1.4.4 (estado vazio) custa vinte minutos. A uniformidade de 5 a 7 critérios cria a ilusão de histórias equivalentes, e o Planejamento de Entrega vai empacotar Bolts com base nela.
- **A linha "Small" afirma que "nenhuma história abrange mais de uma capacidade coerente"** — US2.2 abrange três transições distintas (assumir, responder, encerrar) e US4.2 abrange quatro entidades com interface completa.
- **AC2.1.2** está redigido como *"de setor ao qual não pertenço e pelo qual meu setor nunca passou"*. A inversão está trocada: quem passa por setores é o chamado, não o setor. Leria melhor como *"que nunca passou pelo meu setor"*.
- **AC2.2.5 duplica AC1.4.2** (chamado encerrado recusa mensagem), do ponto de vista de dois atores. Não é defeito em BDD, mas convém marcar uma como canônica, para não gerar dois testes da mesma regra e contá-los como cobertura de dois requisitos distintos.
- **AC2.2.4 (encerrar) está numa história chamada "Assumir e responder"**, e encerrar é a transição com mais consequências do sistema: fecha a conversa, abre a janela de reabertura, grava o momento do encerramento e habilita US1.6 e US6.3. Quem ler o título ao montar Bolts vai perder isso. Mover AC2.2.4 e AC2.2.5 para US2.3, onde moram as transições, resolve.
- **AC2.1.6** (estado de erro com "tentar novamente") é o único critério de estado de erro de tela em todo o documento, embora toda listagem tenha a mesma necessidade. Ou vira transversal, ou infla US2.1 arbitrariamente em relação às irmãs.
- **CT2, CT4 e CT5 não têm história dona.** São critérios que alguém precisa implementar uma vez, e hoje flutuam. O nó US0 de 1.1 lhes dá dono.

## Positions

- AGREE: A seção § Critérios Transversais — é a melhor decisão de modelagem do rascunho, evita repetir cinco requisitos não funcionais em treze histórias e é exatamente o mecanismo que resolve os problemas de notificação (3.1) e de qualidades (1.5).
- AGREE: O fechamento explícito das lacunas R-01, R-03, R-04 e R-05 com marcação `[assumption]` em vez de silêncio — cada suposição está nomeada e é contestável, que é o comportamento correto num rascunho posto em revisão.
- AGREE: A honestidade sobre US6.1 e US6.3, com as pendências conhecidas registradas antes de a história ser construída, e a regra de que US6 só entra depois de US1 a US5 concluídas e testadas.
- AGREE: AC1.2.5 (o servidor ignora o setor enviado pelo cliente) e AC5.2.1 (404 em vez de 403) — fixam o comportamento correto e o custo de implementá-los na pilha escolhida é praticamente nulo.
- AGREE: A separação da conversa (US1.4) do ciclo de vida do chamado, coerente com a regra afirmada em `project.md` de tratar a comunicação como unidade própria.
- OBJECT: US4.2 rotulada **(Must)** cobrindo FR9.2 e FR9.3 — promove por agregação o CRUD administrativo de quatro entidades ao corte mínimo, contrariando a regra afirmada em `project.md` § Mandated de que apenas o modelo de dados precisa ser administrável no Must.
- OBJECT: AC2.4.1 combinada com AC2.2.1 e AC3.1.1 cria um chamado transferido que ninguém pode assumir nem receber por atribuição — beco sem saída na máquina de estados, e o único achado que considero bloqueante.
- OBJECT: O grafo de dependências coloca US1.5 depois de oito critérios que exigem gravação de notificação — as setas apontam para o lado errado, e invertê-las cria ciclo; a saída é o critério transversal CT6 proposto em 3.1.
- OBJECT: US5.1 a US5.4 estão modeladas como histórias, mas o próprio texto admite que não entram no grafo e valem para todas — são critérios transversais, e mantê-las como histórias fará acessibilidade e recorte de 375px virarem adaptação cara no fim do projeto.
- OBJECT: Nenhuma história é dona de CT2, CT4 e CT5, nem do arranque de plataforma (Prisma, guard global, filtro de exceção, Compose, fábrica de fixtures) que a primeira história inevitavelmente pagará — 12 a 20 h invisíveis no grafo, num orçamento de 10 a 20 h por semana.
- OBJECT: FR2.3 não é coberto por nenhuma declaração "Cobre:" — único furo de rastreabilidade funcional do documento.
- OBJECT: A tabela § Conformidade INVEST afirma como fato "entre 5 e 7 critérios por história" (falso para seis histórias) e usa contagem de critérios como proxy de tamanho, mascarando uma dispersão de custo real superior a dez vezes entre critérios.
- OBJECT: AC1.3.4 e AC1.3.6 exigem abas de mensagens e de histórico que só existem em US1.4 e US2.3, mas o grafo coloca US1.3 imediatamente após US1.2 — a história não pode fechar na posição em que está.
- OBJECT: Nem AC4.1.3 nem AC4.1.5 dizem que perfil e situação do usuário precisam ser lidos do banco a cada requisição; com o perfil dentro do JWT ambos falham silenciosamente por horas, e a leitura natural da prática de sessão afirmada leva justamente ao perfil embutido no token.
- OBJECT: AC1.1.1 encerra o login em "vejo a lista dos meus chamados", tornando US1.1 dependente de US1.3 para ser aceita, o que contradiz a própria nota de independência colocada sob a história.
