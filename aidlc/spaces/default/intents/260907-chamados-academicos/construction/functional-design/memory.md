<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->
- 2026-09-13T01:12:38Z - [u1-foundation] Com status fixos (Q3), removi Status.active do modelo em vez de manter um campo sempre verdadeiro. Isso diverge de components.md e do contrato API-U1 (updateStatus, esquema Status, StatusRef); registrei as divergencias em functional-spec.md, conforme a regra do bolt-plan.
- 2026-09-13T01:12:38Z - [u1-foundation] A contagem de tentativas de login (Q6) conta qualquer e-mail informado, exista ou nao o usuario, e normaliza o e-mail antes de contar. Sem isso, o bloqueio revelaria quais contas existem e seria contornado por variacao de maiusculas.
- 2026-09-14T02:53:22Z - [u2-tickets] O recorte 'nao atribuidos' da fila ficou so com chamados sem responsavel. Incluir os de responsavel indisponivel exigiria ler a tabela de usuarios de U1 na consulta, o que DB-01 proibe; a marca aparece em todos os recortes.
- 2026-09-14T02:53:22Z - [u2-tickets] Os metodos countTickets e getDurationAverages de SVC-05 foram adiados para o Bolt de U4, por adicao, porque U4 e condicional; implementar agora criaria codigo sem consumidor.
- 2026-09-23T01:27:30Z - [u3-conversation] A regra de escrita ficou mais estreita que a de leitura: quem le por passagem de setor, e o Atendente do setor que nao assumiu, recebem 403 e nao 404, porque veem o chamado. O 404 fica so para quem nao alcanca a conversa.
- 2026-09-23T01:27:30Z - [u3-conversation] U3 nao tem maquina de estados propria; o que muda o comportamento da conversa e o status do chamado, que e de U2. Registrei isso como SM1 em vez de inventar estados para a mensagem.
- 2026-09-24T02:00:09Z - [u4-reporting] Os dois recortes de periodo ficaram diferentes de proposito: contagem pela abertura, tempos medios pelo encerramento. A tela precisa dizer isso em texto, senao o numero e lido como se fosse do mesmo recorte.
- 2026-09-24T02:00:09Z - [u4-reporting] O tempo de atendimento tem amostra propria: chamado encerrado que nunca teve responsavel fica fora dessa media, e so dela.

## Deviations
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->
- 2026-09-13T01:12:38Z - [u1-foundation] Acrescentei cinco codigos de erro ao catalogo de X-01 (AUTH_TOO_MANY_ATTEMPTS, USER_SELF_MODIFICATION_FORBIDDEN, USER_LAST_ACTIVE_ADMIN, CATALOG_NAME_TAKEN, CATALOG_DEFAULT_PRIORITY_REQUIRED). O contrato permite adicao; registrei como divergencia aditiva.
- 2026-09-13T01:12:38Z - [u1-foundation] Produzi frontend-components.md embora U1 seja do tipo service, que pela matriz de artefatos nao exige esse arquivo. A unidade e fatia vertical com telas, e a propria etapa pede o arquivo quando a unidade inclui interface.
- 2026-09-14T02:53:22Z - [u2-tickets] O Gestor precisa escolher a quem atribuir, mas U1 so expoe a listagem de usuarios ao Administrador. Registrei um metodo aditivo em UsersPublicService e uma operacao nova em API-U2, implementados no Bolt de U2.
- 2026-09-14T02:53:22Z - [u2-tickets] U1 criou um emissor de eventos internos (AppEvents) contra a decisao de chamada direta sem eventos do Desenho de Dominio; nao estava declarado no resumo de codigo de U1. Registrei nas divergencias de U2 para o portao.
- 2026-09-14T02:53:22Z - [u2-tickets] O comentario de onRequesterMessage em SVC-03 diz que o metodo notifica o responsavel; nao notifica, porque U3 ja grava a notificacao de mensagem para ele na mesma operacao. Registrado como divergencia.
- 2026-09-14T02:53:22Z - [u2-tickets] AC2.4.4 pede a justificativa no historico, mas o contrato so a tinha na passagem por setor. Acrescentei justification a TicketHistoryEntry nas entradas de setor, como campo aditivo.
- 2026-09-23T01:27:30Z - [u3-conversation] O Administrador ve o chamado em leitura por decisao de U2, mas nao le a conversa (Q2). Isso estreita a regra de ator de API-U3 e foi registrado nas divergencias.
- 2026-09-23T01:27:30Z - [u3-conversation] A aba Conversa nao e a primeira do detalhe, como sugeria a Tela 5: U2 implementou o detalhe abrindo em Detalhes, e U3 acrescenta a terceira aba pelo ponto de extensao.
- 2026-09-24T02:00:09Z - [u4-reporting] Os cartoes do painel passaram a ser um por status, com os quatro sempre presentes, mais dois de tempo; a Tela 9 mostrava tres status e um tempo.
- 2026-09-24T02:00:09Z - [u4-reporting] O grafico por setor aparece so para o Administrador. Para o Gestor teria praticamente uma barra so, mesmo com os chamados de passagem.

## Tradeoffs
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->
- 2026-09-13T01:12:38Z - [u1-foundation] A verificacao de ultimo administrador (Q9) foi especificada como atomica junto com a alteracao. Custa uma operacao transacional numa tela de baixo volume, mas sem ela dois administradores rebaixando um ao outro ao mesmo tempo deixariam o sistema sem administrador.
- 2026-09-13T01:12:38Z - [u1-foundation] Bloqueio por e-mail (Q6) em memoria permite que um terceiro bloqueie o login de outra pessoa por ate 15 minutos. Aceito por ser sistema local; registrado nas implicacoes de seguranca.
- 2026-09-14T02:53:22Z - [u2-tickets] Uma notificacao por destinatario por operacao, com o tipo mais significativo, em vez de uma por aspecto alterado. Evita tres avisos numa transferencia; custo e o solicitante nao ver separadamente a volta a Aberto.
- 2026-09-14T02:53:22Z - [u2-tickets] O retorno automatico por mensagem do solicitante nao gera notificacao propria; o responsavel ja recebe a de mensagem gravada por U3. Evita aviso duplicado.
- 2026-09-23T01:27:30Z - [u3-conversation] Num chamado sem responsavel, so o solicitante escreve; quem quiser responder assume antes. Custa um passo ao atendimento e mantem claro quem e o dono do caso.
- 2026-09-23T01:27:30Z - [u3-conversation] Sem atualizacao automatica da conversa (Q5): evita conexao permanente e consulta periodica, ao custo de a pessoa precisar do botao Atualizar para ver mensagem nova.
- 2026-09-24T02:00:09Z - [u4-reporting] O painel faz quatro consultas em vez de uma so que devolvesse tudo. Cada numero fica explicavel pela propria operacao; custo e quatro idas ao servidor por carga.
- 2026-09-24T02:00:09Z - [u4-reporting] A visibilidade do Gestor inclui os chamados que passaram pelo setor (Q3), para o painel bater com a listagem que ele ja abre. Um chamado transferido para fora continua contando para o setor de origem.

## Open questions
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->
- 2026-09-13T01:12:38Z - [u1-foundation] A senha do administrador inicial fica na configuracao local para sempre, porque as variaveis sao obrigatorias em toda subida. Vale confirmar na geracao de codigo se a exigencia pode cair depois que existir administrador ativo.
- 2026-09-14T02:53:22Z - [u2-tickets] Notificacao antiga continua listada para quem perdeu visibilidade do chamado, mostrando titulo e numero. Aceito por ter havido acesso legitimo no evento; confirmar no portao.
- 2026-09-23T01:27:30Z - [u3-conversation] Nao existe marca de leitura por mensagem, entao a aba nao mostra contagem de nao lidas; o sino de U2 cumpre esse papel. Confirmar no portao se isso basta.
- 2026-09-24T02:00:09Z - [u4-reporting] Um grupo com contagem 1 revela que existe exatamente um chamado daquele tipo no recorte visivel. Aceito porque o ator pode abrir esse chamado; confirmar no portao.
