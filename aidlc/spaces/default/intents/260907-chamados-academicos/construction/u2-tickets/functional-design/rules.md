# Regras de Negócio — U2 Chamados (`u2-tickets`)

Derivado de `requirements.md` (FR4, FR5, FR7, FR8, NFR1–NFR6), `stories.md` (US1.2, US1.3, US1.5, US1.6, US2.1–US2.4, US3.1, US5.2, e critérios de US4.1, US4.2, US5.1, US5.3, US5.4), `contract-summary.md` (X-01, API-U2, SVC-01, SVC-03, SVC-05, SVC-07), das regras de U1 (`../../u1-foundation/functional-design/rules.md`) e das respostas confirmadas em `functional-design-questions.md`.

Grupos: BR1 abertura; BR2 visibilidade e autorização; BR3 atendimento; BR4 máquina de transições e reabertura; BR5 histórico e passagens; BR6 notificações; BR7 atomicidade e concorrência; BR8 serviços públicos; BR9 interface.

## Regras

O bloco YAML é a fonte da verdade das regras de U2. Identificadores de regra seguem `BR{grupo}.{sequência}`; códigos de erro, valores de enum e nomes de campo ficam em inglês.

```yaml
rules:
  - id: BR1.1
    statement: Só Aluno e Professor abrem chamado.
    category: authorization
    applies_to: abertura de chamado
    trigger: pedido de abertura
    logic: IF o perfil do ator não é STUDENT nem PROFESSOR THEN recusar antes de ler qualquer dado
    violation: 403 FORBIDDEN
    source: FR4.1, Q2

  - id: BR1.2
    statement: Título e descrição são obrigatórios e respeitam limites de tamanho.
    category: validation
    applies_to: abertura de chamado
    trigger: pedido de abertura
    logic: >
      Espaços nas pontas são removidos antes da validação.
      IF o título tem menos de 5 ou mais de 120 caracteres
      OR a descrição tem menos de 10 ou mais de 2000 caracteres
      THEN recusar indicando cada campo inválido
    violation: 400 VALIDATION_FAILED com details por campo
    source: FR4.1, AC1.2.4, Q3

  - id: BR1.3
    statement: A categoria precisa estar disponível, e o setor do chamado é sempre o setor da categoria.
    category: validation
    applies_to: abertura de chamado
    trigger: pedido de abertura
    logic: >
      A categoria é obtida pelo serviço público de catálogo de U1, que exige categoria e setor ativos (BR8.4 de U1).
      Qualquer setor enviado pelo cliente é descartado; o setor gravado é o da categoria.
    violation: 404 CATALOG_ITEM_NOT_FOUND; 422 CATALOG_ITEM_INACTIVE
    source: FR4.2, AC1.2.5, AC1.2.6, AC4.2.3

  - id: BR1.4
    statement: A prioridade escolhida precisa estar ativa; sem escolha, vale a prioridade padrão.
    category: validation
    applies_to: abertura de chamado
    trigger: pedido de abertura
    logic: IF o pedido traz prioridade THEN ela precisa existir e estar ativa; ELSE usar a prioridade padrão do catálogo
    violation: 404 CATALOG_ITEM_NOT_FOUND; 422 CATALOG_ITEM_INACTIVE
    source: FR3.6, AC1.2.3

  - id: BR1.5
    statement: Todo chamado nasce em Aberto, sem responsável, com uma passagem aberta no setor derivado.
    category: policy
    applies_to: abertura de chamado
    trigger: abertura aceita
    logic: Gravar status OPEN, responsável vazio, openedAt e updatedAt no momento atual, e uma passagem por setor com enteredAt igual a openedAt; a abertura não gera entrada de histórico
    violation: não se aplica
    source: FR4.1, AC1.2.2

  - id: BR1.6
    statement: O identificador visível é um número sequencial global, único e imutável, exibido como cerquilha seguida do número.
    category: constraint
    applies_to: chamado
    trigger: abertura aceita
    logic: >
      O banco gera o próximo número de uma sequência única do sistema no momento da criação.
      O número nunca muda nem é reutilizado; lacunas podem aparecer quando uma criação é desfeita.
      O campo reference de API-U2, de VisibleTicket e de TicketListRow continua texto e é derivado:
      o sinal de cerquilha seguido do número, sem zeros à esquerda.
    violation: não se aplica
    source: FR4.3, Q1, AC1.3.1

  - id: BR2.1
    statement: O solicitante vê apenas os chamados que ele abriu.
    category: authorization
    applies_to: leitura e listagem de chamados
    trigger: consulta de um Aluno ou Professor
    logic: A condição requesterId igual ao ator entra na própria consulta ao banco, nunca como comparação depois de buscar
    violation: chamado de outro solicitante responde 404 TICKET_NOT_FOUND
    source: FR4.4, FR4.5, NFR1, AC1.3.1, AC1.3.5

  - id: BR2.2
    statement: Atendente e Gestor veem os chamados do setor atual e, em leitura, os que já passaram pelo setor.
    category: authorization
    applies_to: leitura e listagem de chamados
    trigger: consulta de um Atendente ou Gestor
    logic: >
      Visível = setor atual do chamado igual ao setor do ator
      OR existe passagem do chamado no setor do ator.
      A condição entra na própria consulta. Um ator sem setor não vê nenhum chamado.
    violation: 404 TICKET_NOT_FOUND para chamado invisível; 403 TICKET_QUEUE_NO_SECTOR ao abrir a fila sem setor
    source: FR5.1, FR5.6, FR2.7, AC2.1.2, AC2.1.3, AC2.1.4

  - id: BR2.3
    statement: O Administrador vê todos os chamados, só em leitura.
    category: authorization
    applies_to: leitura, listagem e ações sobre chamados
    trigger: consulta ou ação de um Administrador
    logic: IF o ator é ADMIN THEN a listagem geral e o detalhe de qualquer chamado são permitidos, e toda ação de atendimento, abertura, encerramento ou reabertura é recusada
    violation: 403 FORBIDDEN nas ações
    source: Q4

  - id: BR2.4
    statement: Chamado inexistente e chamado invisível ao ator respondem de forma idêntica.
    category: policy
    applies_to: toda operação sobre um chamado específico
    trigger: identificador que não existe ou não é visível
    logic: Mesma resposta, mesmo código, mesma mensagem e details vazio nos dois casos, inclusive nas ações
    violation: 404 TICKET_NOT_FOUND
    source: NFR4, AC5.2.1, AC5.2.2, AC1.3.5, AC1.6.4

  - id: BR2.5
    statement: Listagens são paginadas, filtráveis e ordenáveis, com contagem total.
    category: policy
    applies_to: listagens de chamados
    trigger: pedido de listagem
    logic: >
      Filtros por status, categoria e setor, combináveis.
      Ordenação por updatedAt, openedAt ou reference, crescente ou decrescente; padrão updatedAt decrescente.
      A resposta traz items, total, page e pageSize conforme X-01.
    violation: 400 VALIDATION_FAILED para filtro ou ordenação inválidos
    source: FR4.4, FR4.8, AC1.3.2, AC1.3.7, AC2.1.5

  - id: BR2.6
    statement: A fila do setor tem quatro recortes.
    category: calculation
    applies_to: fila do setor
    trigger: consulta da fila por Atendente ou Gestor
    logic: >
      unassigned = chamados do setor atual sem responsável;
      mine = chamados do setor atual cujo responsável é o ator;
      all = todos os chamados do setor atual;
      passed = chamados que passaram pelo setor do ator e hoje estão em outro setor, só em leitura.
      Chamado com responsável indisponível não entra em unassigned: o recorte não lê a tabela de
      usuários de U1 dentro da consulta (DB-01), então não tem como saber da indisponibilidade. O
      Atendente o encontra no recorte all, onde a marca de responsável indisponível aparece, e BR3.9
      continua permitindo que qualquer Atendente do setor o assuma como se estivesse sem responsável.
    violation: 403 TICKET_QUEUE_NO_SECTOR se o ator não tem setor
    source: FR5.1, FR5.6, AC2.1.1, AC2.1.3

  - id: BR2.7
    statement: O detalhe mostra descrição, metadados, responsável, histórico e passagens com nomes resolvidos na leitura.
    category: policy
    applies_to: detalhe de chamado
    trigger: leitura de um chamado visível
    logic: >
      Nomes de categoria, setor, status e prioridade vêm da consulta de rótulos de U1, inclusive de itens inativos.
      Nomes de solicitante, responsável e autores vêm do resumo de usuários de U1, inclusive de usuários desativados.
      A marca de responsável indisponível acompanha o responsável (BR3.9).
    violation: não se aplica
    source: FR4.5, AC1.3.4, AC4.1.5, SVC-01

  - id: BR2.8
    statement: Histórico e passagens são visíveis a quem vê o chamado, e a ninguém mais.
    category: authorization
    applies_to: histórico e passagens
    trigger: leitura de histórico ou passagens
    logic: A leitura aplica exatamente a visibilidade do chamado (BR2.1 a BR2.3)
    violation: 404 TICKET_NOT_FOUND
    source: FR4.6, AC1.3.4, AC2.4.7

  - id: BR2.9
    statement: Perfis permitidos por operação de U2.
    category: authorization
    applies_to: operações de API-U2
    trigger: requisição a operação de U2
    logic: >
      Listar meus chamados e abrir chamado: STUDENT e PROFESSOR.
      Fila do setor: AGENT e MANAGER. Listagem geral: ADMIN.
      Detalhe, histórico e passagens: qualquer perfil, filtrado pela visibilidade.
      Assumir, transferir, alterar prioridade e marcar aguardando: AGENT e MANAGER.
      Atribuir e listar quem pode receber atribuição: MANAGER.
      Encerrar: STUDENT e PROFESSOR no próprio chamado; AGENT e MANAGER conforme BR3.5.
      Reabrir: STUDENT e PROFESSOR no próprio chamado.
      Notificações: qualquer perfil, só as próprias.
      Perfil fora da lista responde 403; perfil permitido que não atende à condição de setor ou responsável num chamado visível responde 403; chamado invisível responde 404.
      Toda rota nova tem marcação de perfil e passa no teste de enumeração de rotas de U1.
    violation: 403 FORBIDDEN; 404 TICKET_NOT_FOUND
    source: NFR2, AC5.1.1, AC5.1.3, AC5.1.4, CT6

  - id: BR3.1
    statement: Atendente ou Gestor do setor atual assume chamado sem responsável disponível.
    category: policy
    applies_to: assumir chamado
    trigger: pedido de assumir
    logic: >
      IF o chamado está encerrado THEN recusar como encerrado;
      IF o ator não é do setor atual THEN recusar;
      IF o chamado tem responsável disponível diferente do ator THEN recusar informando o responsável atual;
      IF o responsável é o próprio ator e o status é Aberto THEN retomar o atendimento (caso de reabertura);
      ELSE o ator passa a ser o responsável.
      Status Aberto passa a Em análise; Em análise e Aguardando solicitante permanecem.
    violation: 403 TICKET_CLOSED; 403 FORBIDDEN; 409 TICKET_ALREADY_ASSIGNED com details do responsável atual
    source: FR5.2, FR8.2, AC2.2.1, AC2.2.2, Q6

  - id: BR3.2
    statement: O Gestor atribui ou reatribui chamado do seu setor a quem pode recebê-lo.
    category: policy
    applies_to: atribuir chamado
    trigger: pedido de atribuição
    logic: >
      IF o ator não é MANAGER THEN recusar;
      IF o chamado está encerrado THEN recusar como encerrado;
      IF o ator não é do setor atual THEN recusar;
      IF o destinatário não pode receber atribuição no setor atual (BR8.3 de U1) THEN recusar;
      IF o destinatário já é o responsável THEN nada muda;
      ELSE o destinatário passa a ser o responsável; status Aberto passa a Em análise, os demais permanecem.
    violation: 403 FORBIDDEN; 403 TICKET_CLOSED; 422 TICKET_ASSIGNEE_NOT_IN_SECTOR
    source: FR5.3, AC3.1.1, AC3.1.2, AC3.1.3, AC3.1.4

  - id: BR3.3
    statement: Atendente ou Gestor do setor atual transfere chamado não encerrado para outro setor ativo, com justificativa.
    category: policy
    applies_to: transferir chamado
    trigger: pedido de transferência
    logic: >
      IF o chamado está encerrado THEN recusar como encerrado;
      IF o ator não é do setor atual THEN recusar;
      IF a justificativa, sem espaços nas pontas, tem menos de 5 ou mais de 500 caracteres THEN recusar;
      IF o setor de destino não existe ou está inativo THEN recusar;
      IF o destino é o setor atual THEN recusar;
      ELSE encerrar a passagem atual com justificativa e autor, abrir passagem no destino,
      trocar o setor, remover o responsável e levar o status a Aberto.
    violation: 403 TICKET_CLOSED; 403 FORBIDDEN; 400 VALIDATION_FAILED; 404 CATALOG_ITEM_NOT_FOUND; 422 CATALOG_ITEM_INACTIVE; 422 TICKET_TRANSFER_SAME_SECTOR
    source: FR5.4, FR5.5, AC2.4.1, AC2.4.2, AC2.4.3, AC2.4.6, Q3

  - id: BR3.4
    statement: O responsável atual ou o Gestor do setor marca o chamado como aguardando o solicitante.
    category: policy
    applies_to: marcar aguardando solicitante
    trigger: pedido de aguardar solicitante
    logic: >
      IF o ator não é o responsável atual nem MANAGER do setor atual THEN recusar;
      IF o status não é Em análise THEN recusar como transição inválida;
      ELSE o status passa a Aguardando solicitante.
    violation: 403 FORBIDDEN; 409 TICKET_INVALID_TRANSITION
    source: AC2.3.1, Q7

  - id: BR3.5
    statement: O responsável atual ou o Gestor do setor encerra o chamado.
    category: policy
    applies_to: encerrar chamado por Atendente ou Gestor
    trigger: pedido de encerramento de um Atendente ou Gestor
    logic: >
      IF o ator não é o responsável atual nem MANAGER do setor atual THEN recusar;
      IF o chamado já está encerrado THEN recusar como transição inválida;
      ELSE o status passa a Encerrado e closedAt recebe o momento atual.
    violation: 403 FORBIDDEN; 409 TICKET_INVALID_TRANSITION
    source: FR5.7, AC2.2.4, Q7

  - id: BR3.6
    statement: O solicitante encerra o próprio chamado em qualquer status não encerrado.
    category: policy
    applies_to: encerrar chamado pelo solicitante
    trigger: pedido de encerramento do solicitante
    logic: IF o chamado já está encerrado THEN recusar como transição inválida; ELSE o status passa a Encerrado e closedAt recebe o momento atual
    violation: 404 TICKET_NOT_FOUND para chamado de outro solicitante; 409 TICKET_INVALID_TRANSITION
    source: AC1.6.7

  - id: BR3.7
    statement: Atendente ou Gestor do setor atual altera a prioridade de chamado não encerrado.
    category: policy
    applies_to: alterar prioridade
    trigger: pedido de alteração de prioridade
    logic: >
      IF o ator é STUDENT ou PROFESSOR THEN recusar;
      IF o chamado está encerrado THEN recusar como encerrado;
      IF o ator não é do setor atual THEN recusar;
      IF a prioridade não existe ou está inativa THEN recusar;
      IF é a prioridade atual THEN nada muda;
      ELSE trocar a prioridade.
    violation: 403 FORBIDDEN; 403 TICKET_CLOSED; 404 CATALOG_ITEM_NOT_FOUND; 422 CATALOG_ITEM_INACTIVE
    source: AC2.3.3, AC2.3.4

  - id: BR3.8
    statement: Quem vê um chamado só por passagem de setor, e o Administrador, não executam ações sobre ele.
    category: authorization
    applies_to: ações de atendimento
    trigger: ação sobre chamado visível apenas em leitura
    logic: IF o chamado é visível ao ator só por passagem anterior pelo seu setor, ou o ator é ADMIN THEN toda ação é recusada
    violation: 403 FORBIDDEN
    source: AC2.1.3, Q4

  - id: BR3.9
    statement: Responsável indisponível é marcado e não bloqueia o atendimento do setor.
    category: calculation
    applies_to: chamados com responsável
    trigger: leitura ou ação sobre chamado com responsável
    logic: >
      Indisponível = existe responsável AND ele não pode receber atribuição no setor atual do chamado
      (desativado, perfil diferente de Atendente ou Gestor, ou outro setor), conforme BR8.3 de U1.
      O chamado mantém o responsável e é exibido com a marca "responsável indisponível".
      Qualquer Atendente do setor pode assumi-lo como se estivesse sem responsável (BR3.1),
      e o Gestor pode reatribuí-lo (BR3.2). A reabertura segue a mesma regra.
    violation: não se aplica
    source: Q6, BR3.10 de U1

  - id: BR4.1
    statement: Só as nove transições válidas mudam o status, cada uma disparada pela sua ação.
    category: constraint
    applies_to: status do chamado
    trigger: qualquer ação que muda status
    logic: >
      Transições por chave estável de status, decididas por um módulo puro:
      OPEN para IN_ANALYSIS por assumir ou atribuir;
      IN_ANALYSIS para WAITING_REQUESTER por aguardar solicitante;
      WAITING_REQUESTER para IN_ANALYSIS por resposta do solicitante;
      IN_ANALYSIS para OPEN e WAITING_REQUESTER para OPEN por transferência;
      OPEN, IN_ANALYSIS e WAITING_REQUESTER para CLOSED por encerramento;
      CLOSED para OPEN por reabertura.
      Transferência de um chamado já Aberto mantém Aberto sem transição.
      Qualquer outra combinação de status e ação é recusada.
    violation: 409 TICKET_INVALID_TRANSITION
    source: FR8.1, FR4.7, tabela de transições em stories.md (Consequências para Artefatos Anteriores), AC2.3.5, ADR-006

  - id: BR4.2
    statement: Toda mudança de status gera entrada de histórico.
    category: policy
    applies_to: status do chamado
    trigger: transição aplicada
    logic: Gravar entrada com field STATUS, status anterior, status novo, autor e momento
    violation: não se aplica
    source: FR8.5, AC1.6.5

  - id: BR4.3
    statement: Só o solicitante reabre o próprio chamado, até 72 horas depois do encerramento.
    category: policy
    applies_to: reabrir chamado
    trigger: pedido de reabertura
    logic: >
      IF o ator não é STUDENT nem PROFESSOR THEN recusar;
      IF o chamado não é do ator THEN responder como inexistente;
      IF o chamado não está encerrado THEN recusar como transição inválida;
      IF o momento atual menos closedAt é de 72 horas ou mais THEN recusar por prazo vencido;
      ELSE status Aberto, closedAt vazio, responsável mantido.
      A fonte de tempo é injetável. Não há limite de reaberturas; cada janela conta do encerramento mais recente.
    violation: 403 FORBIDDEN; 404 TICKET_NOT_FOUND; 409 TICKET_INVALID_TRANSITION; 409 TICKET_REOPEN_WINDOW_EXPIRED
    source: FR8.3, FR8.4, AC1.6.1, AC1.6.2, AC1.6.4, AC1.6.6

  - id: BR4.4
    statement: A mensagem do solicitante num chamado que aguarda o solicitante devolve o chamado à análise.
    category: policy
    applies_to: retorno automático de status
    trigger: U3 informa que o solicitante enviou mensagem
    logic: >
      IF o ator é o solicitante AND o status é Aguardando solicitante
      THEN status Em análise, com entrada de histórico cujo autor é o solicitante;
      ELSE nada muda.
      Não gera notificação própria: o responsável já recebe, na mesma operação, a notificação de mensagem gravada por U3 (BR6.1).
      Isso diverge do comentário de onRequesterMessage em SVC-03, registrado nas divergências de functional-spec.md.
    violation: não se aplica
    source: AC2.3.2, SVC-03

  - id: BR5.1
    statement: Mudanças de responsável, setor e prioridade geram entradas de histórico, como as de status.
    category: policy
    applies_to: histórico do chamado
    trigger: assumir, atribuir, transferir, alterar prioridade
    logic: >
      Uma entrada por campo alterado, com field ASSIGNEE, SECTOR ou PRIORITY, valor anterior, valor novo, autor e momento.
      Uma transferência gera entradas de SECTOR, com a justificativa, de ASSIGNEE (se havia responsável) e de STATUS (se o status mudou).
      Na leitura, valores anteriores e novos são devolvidos como nomes resolvidos (BR2.7).
      Operação que não muda nada não gera entrada.
      O histórico é lido em ordem cronológica.
    violation: não se aplica
    source: FR4.6, AC1.3.6, AC2.3.3, AC2.3.6, AC2.4.4

  - id: BR5.2
    statement: Cada setor por onde o chamado passa fica registrado com entrada, saída, justificativa e autor da transferência.
    category: policy
    applies_to: passagens por setor
    trigger: abertura e transferência
    logic: Na abertura, abrir passagem no setor derivado; na transferência, encerrar a passagem aberta com leftAt, justificativa e autor, e abrir nova passagem no destino
    violation: não se aplica
    source: M1 de stories.md, AC2.4.4, AC2.4.7

  - id: BR5.3
    statement: Chamados existentes continuam exibindo categoria, setor, status e prioridade mesmo depois de desativados.
    category: policy
    applies_to: leitura de chamados
    trigger: item de catálogo referenciado foi desativado
    logic: A exibição usa a consulta de rótulos de U1, que inclui itens inativos; o chamado nunca é alterado pela desativação
    violation: não se aplica
    source: FR3.7, AC4.2.4, BR4.3 e BR8.8 de U1

  - id: BR6.1
    statement: Cada operação gera no máximo uma notificação por destinatário, com o tipo do evento mais significativo.
    category: policy
    applies_to: notificações de chamados
    trigger: operação que muda o chamado
    logic: >
      Solicitante recebe quando o chamado muda de setor (SECTOR_CHANGED), de responsável (ASSIGNEE_CHANGED) ou de status (STATUS_CHANGED).
      Responsável recebe STATUS_CHANGED quando o solicitante encerra o chamado.
      Último responsável recebe TICKET_REOPENED na reabertura, se houver.
      MESSAGE_RECEIVED é gravada por U3.
      Quando uma operação muda mais de um aspecto, o tipo é escolhido nesta ordem: SECTOR_CHANGED, ASSIGNEE_CHANGED, STATUS_CHANGED.
      Nenhum outro usuário recebe notificação de chamado alheio.
    violation: não se aplica
    source: FR7.1, FR7.3, AC1.5.1, AC1.5.6, AC1.6.3, AC1.6.7, AC2.2.4, AC2.3.1, AC2.4.5, AC3.1.5

  - id: BR6.2
    statement: Quem causou o evento nunca é notificado dele.
    category: policy
    applies_to: notificações
    trigger: gravação de notificação
    logic: O ator da operação é retirado da lista de destinatários antes da gravação
    violation: não se aplica
    source: CT9, contract-summary.md

  - id: BR6.3
    statement: A notificação é gravada na mesma transação da mudança que a causou.
    category: constraint
    applies_to: notificações
    trigger: gravação de notificação
    logic: Se a mudança é desfeita, a notificação também é; nunca existe notificação de mudança que não aconteceu
    violation: não se aplica
    source: CT9, X-01, Q5

  - id: BR6.4
    statement: Cada usuário lê, conta e marca como lidas apenas as próprias notificações.
    category: authorization
    applies_to: notificações
    trigger: consulta ou marcação de notificações
    logic: >
      A condição recipientId igual ao ator entra na consulta.
      Listagem da mais recente para a mais antiga, com filtro opcional de não lidas.
      Marcar uma notificação de outro usuário responde como inexistente.
      Marcar como lida é idempotente e grava readAt na primeira vez; marcar todas afeta só as não lidas do ator.
    violation: 404 NOTIFICATION_NOT_FOUND
    source: FR7.5, AC1.5.2, AC1.5.3, AC1.5.4

  - id: BR6.5
    statement: Abrir o chamado de uma notificação segue a visibilidade atual do chamado.
    category: authorization
    applies_to: navegação a partir de notificação
    trigger: abertura do chamado indicado na notificação
    logic: A notificação continua listada mesmo que o chamado deixe de ser visível; abrir o chamado aplica BR2.1 a BR2.3
    violation: 404 TICKET_NOT_FOUND
    source: BR2.4

  - id: BR6.6
    statement: Notificações existem só dentro do sistema.
    category: constraint
    applies_to: notificações
    trigger: não se aplica
    logic: Nenhuma notificação é enviada por e-mail ou canal externo
    violation: não se aplica
    source: FR7.4, AC1.5.5

  - id: BR7.1
    statement: Cada operação que grava roda numa transação ambiente da qual todo serviço chamado participa.
    category: constraint
    applies_to: operações de escrita de U2 e de U3
    trigger: início de operação de escrita
    logic: >
      A operação abre a transação; serviços de qualquer unidade chamados durante ela usam a mesma transação,
      sem receber parâmetro novo e sem expor tipos de persistência nas assinaturas.
      O mecanismo é um executor compartilhado no módulo comum (TransactionRunner): ele abre uma única
      transação interativa e guarda o cliente dela num contexto assíncrono de execução
      (AsyncLocalStorage, da biblioteca padrão do Node). Todo serviço chamado enquanto a operação corre
      obtém esse cliente por um acessor do próprio executor, em vez de recebê-lo como argumento, então
      nenhuma assinatura pública muda e nenhum tipo de persistência atravessa fronteira de unidade.
      Um serviço que pediria sua própria transação dentro de uma já aberta participa da existente,
      porque o executor detecta o contexto ativo e reaproveita a transação em vez de abrir outra.
      Chamado, histórico, passagens, notificações e, em U3, a mensagem são gravados juntos ou nenhum.
    violation: qualquer falha desfaz a operação inteira e responde conforme o erro original
    source: X-01, Q5, achado R-01 da revisão dos contratos

  - id: BR7.2
    statement: Dois pedidos simultâneos de assumir ou atribuir não produzem dois responsáveis.
    category: constraint
    applies_to: assumir e atribuir
    trigger: pedidos concorrentes sobre o mesmo chamado
    logic: A verificação do responsável e a gravação acontecem de forma atômica sobre o chamado; o segundo pedido vê o resultado do primeiro
    violation: 409 TICKET_ALREADY_ASSIGNED para quem perdeu a disputa de assumir
    source: FR5.2, AC2.2.2

  - id: BR7.3
    statement: Duas mudanças simultâneas de status não se sobrepõem.
    category: constraint
    applies_to: transições
    trigger: pedidos concorrentes sobre o mesmo chamado
    logic: A mudança só é gravada se o status ainda é o que foi lido; caso contrário a operação é reavaliada ou recusada
    violation: 409 TICKET_INVALID_TRANSITION
    source: FR4.7, BR4.1

  - id: BR7.4
    statement: O identificador visível é único mesmo com criações simultâneas.
    category: constraint
    applies_to: abertura de chamado
    trigger: aberturas concorrentes
    logic: A sequência do banco garante números distintos sem verificação na aplicação
    violation: não se aplica
    source: BR1.6

  - id: BR8.1
    statement: A consulta de chamado visível entrega os fatos do chamado só a quem pode vê-lo.
    category: authorization
    applies_to: TicketsPublicService.getVisibleTicket
    trigger: chamada de U3 ou U5
    logic: >
      Aplica BR2.1 a BR2.3 dentro da consulta.
      Devolve id, reference, requesterId, assigneeId, sectorId, passedSectorIds, statusKey e closedAt.
    violation: 404 TICKET_NOT_FOUND
    source: SVC-03, SVC-07

  - id: BR8.2
    statement: O aviso de mensagem do solicitante aplica o retorno automático de status.
    category: policy
    applies_to: TicketsPublicService.onRequesterMessage
    trigger: chamada de U3 depois de gravar a mensagem, na mesma transação
    logic: Aplica BR4.4 e não faz nada nos demais casos
    violation: não se aplica
    source: SVC-03, AC2.3.2

  - id: BR8.3
    statement: A busca de chamados aplica a visibilidade do ator e os filtros combinados.
    category: authorization
    applies_to: TicketsPublicService.searchTickets
    trigger: listagens de U2 e chamada de U4
    logic: Aplica BR2.1 a BR2.3 e BR2.5 na consulta, com filtros adicionais de período de abertura
    violation: não se aplica
    source: SVC-05, FR11.1

  - id: BR8.4
    statement: O registro de notificação grava uma notificação por destinatário distinto.
    category: policy
    applies_to: NotificationsPublicService.record
    trigger: chamada de U2 ou U3
    logic: Destinatários repetidos são gravados uma vez; o chamador já retirou o ator (BR6.2); a gravação participa da transação ambiente (BR7.1)
    violation: não se aplica
    source: SVC-03, CT9

  - id: BR8.5
    statement: O Gestor escolhe o destinatário de uma atribuição entre quem pode recebê-la no setor.
    category: authorization
    applies_to: lista de quem pode receber atribuição
    trigger: abertura do diálogo de atribuição
    logic: >
      Só MANAGER do setor atual do chamado consulta a lista.
      A lista vem de um método aditivo do serviço público de usuários de U1, findAssignableInSector, que devolve id e nome
      de usuários ativos com perfil AGENT ou MANAGER daquele setor.
    violation: 403 FORBIDDEN; 404 TICKET_NOT_FOUND
    source: AC3.1.1, SVC-01 (extensão aditiva)

  - id: BR8.6
    statement: Os serviços públicos de U2 não expõem tipos de persistência e só gravam por onRequesterMessage e record.
    category: constraint
    applies_to: TicketsPublicService e NotificationsPublicService
    trigger: chamada de outra unidade
    logic: Todos os demais métodos são de leitura; nenhum devolve modelo de persistência
    violation: não se aplica
    source: Q3 do Desenho de Contratos

  - id: BR9.1
    statement: A navegação e a tela de entrada seguem o perfil.
    category: policy
    applies_to: casca do frontend
    trigger: login ou abertura do sistema com sessão
    logic: >
      Aluno e Professor veem "Meus Chamados" e entram nele.
      Atendente e Gestor veem "Fila do Setor" e entram nela; o Gestor não ganha item novo em U2.
      Administrador vê "Chamados", em leitura, e "Administração", e entra em Administração.
      O item provisório "Início" e a tela provisória de entrada criados em U1 são removidos.
    violation: não se aplica; a proteção real é BR2.9
    source: wireframes.md Telas 2, 3 e 6, Q2, Q4

  - id: BR9.2
    statement: Telas do solicitante não rolam na horizontal em 375px, e tabelas de trabalho rolam só dentro do contentor.
    category: policy
    applies_to: telas de U2
    trigger: largura de tela estreita
    logic: Abaixo de 768px, a listagem de Meus Chamados vira cartões; a fila e a listagem geral mantêm tabela com rolagem contida
    violation: item reprovado no roteiro de inspeção manual
    source: NFR6, AC5.4.1, AC5.4.2, AC5.4.4

  - id: BR9.3
    statement: O formulário de novo chamado deriva o setor, conta caracteres e começa com a prioridade padrão.
    category: policy
    applies_to: tela Novo Chamado
    trigger: preenchimento do formulário
    logic: >
      Categoria entre as disponíveis; setor exibido, sem edição, a partir da categoria;
      título e descrição com contador e os limites de BR1.2; prioridade começa na padrão;
      validação ao sair do campo; texto preservado se o envio falhar; sucesso leva ao detalhe com confirmação.
    violation: não se aplica
    source: AC1.2.1, AC1.2.6, CT8, wireframes.md Tela 4

  - id: BR9.4
    statement: O detalhe do chamado mostra ações conforme o perfil e confirma mudanças de status antes de aplicar.
    category: policy
    applies_to: tela Detalhe do Chamado
    trigger: abertura do detalhe
    logic: >
      Abas Detalhes e Histórico em U2, com espaço para a aba Conversa de U3.
      Ações exibidas só quando BR2.9 e BR3 as permitem ao ator.
      Encerrar, aguardar solicitante e reabrir pedem confirmação antes do envio.
    violation: não se aplica
    source: AC1.3.4, wireframes.md Tela 5

  - id: BR9.5
    statement: A fila oferece os recortes, filtros e a ação de assumir por teclado em cada linha.
    category: policy
    applies_to: tela Fila do Setor
    trigger: abertura da fila
    logic: Recortes de BR2.6 como abas; filtros por status e categoria preservados ao paginar; responsável indisponível indicado em texto; assumir acessível por teclado
    violation: não se aplica
    source: AC2.1.1, AC2.1.5, wireframes.md Tela 6, Q6

  - id: BR9.6
    statement: O sino mostra a contagem de não lidas e abre o painel de notificações.
    category: policy
    applies_to: barra superior e painel de notificações
    trigger: sessão ativa
    logic: >
      Contador com rótulo acessível; painel como diálogo com foco preso e Escape que devolve o foco;
      clicar numa notificação marca como lida e leva ao chamado; ação de marcar todas; não lida indicada em texto.
    violation: não se aplica
    source: AC1.5.2, AC1.5.3, AC1.5.4, wireframes.md Tela 7

  - id: BR9.7
    statement: Transferir e atribuir usam diálogos com as mesmas regras do servidor.
    category: policy
    applies_to: diálogos de transferência e atribuição
    trigger: ação de transferir ou atribuir
    logic: Transferência escolhe entre setores ativos diferentes do atual e exige justificativa de 5 a 500 caracteres; atribuição escolhe da lista de BR8.5
    violation: não se aplica
    source: AC2.4.1, AC3.1.1

  - id: BR9.8
    statement: Toda tela de U2 que carrega dados tem estados de carregamento, vazio explicativo e erro com repetir.
    category: policy
    applies_to: telas de U2
    trigger: carregamento de dados
    logic: Esqueleto ao carregar; vazio com mensagem própria de cada tela; erro com ação de repetir que preserva recortes e filtros
    violation: não se aplica
    source: CT7, AC1.3.3, AC1.3.8, AC2.1.6

  - id: BR9.9
    statement: As telas de U2 cumprem as regras de acessibilidade da casca de U1.
    category: policy
    applies_to: telas de U2
    trigger: não se aplica
    logic: Operação só por teclado, foco visível, rótulos visíveis, status e prioridade também em texto, contraste do tema padrão, abas navegáveis por setas
    violation: item reprovado no roteiro de inspeção manual ou em teste de componente
    source: NFR5, AC5.3.1 a AC5.3.6, BR7.1 de U1
```

## Resumo das Regras

| ID | Regra | Categoria | Código de erro |
|----|-------|-----------|----------------|
| BR1.1 | Só Aluno e Professor abrem chamado | authorization | FORBIDDEN |
| BR1.2 | Título 5–120 e descrição 10–2000 | validation | VALIDATION_FAILED |
| BR1.3 | Categoria disponível; setor derivado | validation | CATALOG_ITEM_NOT_FOUND, CATALOG_ITEM_INACTIVE |
| BR1.4 | Prioridade ativa ou padrão | validation | CATALOG_ITEM_NOT_FOUND, CATALOG_ITEM_INACTIVE |
| BR1.5 | Nasce Aberto, sem responsável, com passagem | policy | — |
| BR1.6 | Identificador sequencial global imutável | constraint | — |
| BR2.1 | Solicitante vê só os seus | authorization | TICKET_NOT_FOUND |
| BR2.2 | Setor atual e, em leitura, setores de passagem | authorization | TICKET_NOT_FOUND, TICKET_QUEUE_NO_SECTOR |
| BR2.3 | Administrador vê tudo, só leitura | authorization | FORBIDDEN |
| BR2.4 | Inexistente e invisível idênticos | policy | TICKET_NOT_FOUND |
| BR2.5 | Paginação, filtros e ordenação | policy | VALIDATION_FAILED |
| BR2.6 | Quatro recortes da fila | calculation | TICKET_QUEUE_NO_SECTOR |
| BR2.7 | Detalhe com nomes resolvidos na leitura | policy | — |
| BR2.8 | Histórico e passagens seguem a visibilidade | authorization | TICKET_NOT_FOUND |
| BR2.9 | Perfis por operação de U2 | authorization | FORBIDDEN, TICKET_NOT_FOUND |
| BR3.1 | Assumir | policy | TICKET_CLOSED, FORBIDDEN, TICKET_ALREADY_ASSIGNED |
| BR3.2 | Atribuir e reatribuir | policy | FORBIDDEN, TICKET_CLOSED, TICKET_ASSIGNEE_NOT_IN_SECTOR |
| BR3.3 | Transferir | policy | TICKET_CLOSED, FORBIDDEN, VALIDATION_FAILED, CATALOG_ITEM_*, TICKET_TRANSFER_SAME_SECTOR |
| BR3.4 | Aguardar solicitante | policy | FORBIDDEN, TICKET_INVALID_TRANSITION |
| BR3.5 | Encerrar por responsável ou Gestor | policy | FORBIDDEN, TICKET_INVALID_TRANSITION |
| BR3.6 | Encerrar pelo solicitante | policy | TICKET_NOT_FOUND, TICKET_INVALID_TRANSITION |
| BR3.7 | Alterar prioridade | policy | FORBIDDEN, TICKET_CLOSED, CATALOG_ITEM_* |
| BR3.8 | Leitura por passagem e Administrador sem ações | authorization | FORBIDDEN |
| BR3.9 | Responsável indisponível | calculation | — |
| BR4.1 | Nove transições válidas | constraint | TICKET_INVALID_TRANSITION |
| BR4.2 | Histórico de status | policy | — |
| BR4.3 | Reabertura em até 72 horas | policy | FORBIDDEN, TICKET_NOT_FOUND, TICKET_INVALID_TRANSITION, TICKET_REOPEN_WINDOW_EXPIRED |
| BR4.4 | Retorno automático por mensagem do solicitante | policy | — |
| BR5.1 | Histórico de responsável, setor e prioridade | policy | — |
| BR5.2 | Passagens por setor | policy | — |
| BR5.3 | Itens desativados continuam exibidos | policy | — |
| BR6.1 | Destinatários e tipo por operação | policy | — |
| BR6.2 | Ator nunca notificado | policy | — |
| BR6.3 | Notificação na mesma transação | constraint | — |
| BR6.4 | Só as próprias notificações | authorization | NOTIFICATION_NOT_FOUND |
| BR6.5 | Chamado da notificação segue a visibilidade | authorization | TICKET_NOT_FOUND |
| BR6.6 | Só dentro do sistema | constraint | — |
| BR7.1 | Transação ambiente | constraint | — |
| BR7.2 | Assumir e atribuir concorrentes | constraint | TICKET_ALREADY_ASSIGNED |
| BR7.3 | Transições concorrentes | constraint | TICKET_INVALID_TRANSITION |
| BR7.4 | Identificador único sob concorrência | constraint | — |
| BR8.1 | Chamado visível para outras unidades | authorization | TICKET_NOT_FOUND |
| BR8.2 | Aviso de mensagem do solicitante | policy | — |
| BR8.3 | Busca com visibilidade | authorization | — |
| BR8.4 | Registro de notificação | policy | — |
| BR8.5 | Lista de quem pode receber atribuição | authorization | FORBIDDEN, TICKET_NOT_FOUND |
| BR8.6 | Serviços públicos sem tipos de persistência | constraint | — |
| BR9.1 | Navegação e entrada por perfil | policy | — |
| BR9.2 | Tela estreita | policy | — |
| BR9.3 | Formulário de novo chamado | policy | — |
| BR9.4 | Detalhe com ações por perfil | policy | — |
| BR9.5 | Fila do setor | policy | — |
| BR9.6 | Sino e painel de notificações | policy | — |
| BR9.7 | Diálogos de transferir e atribuir | policy | — |
| BR9.8 | Estados de tela | policy | — |
| BR9.9 | Acessibilidade das telas de U2 | policy | — |
