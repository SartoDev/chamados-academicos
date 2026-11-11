# Regras de Negócio — U3 Conversa (`u3-conversation`)

Derivado de `requirements.md` (FR6, FR7.1, FR7.2, NFR1–NFR6), `stories.md` (US1.4, e os critérios de mensagens de US1.3, US1.5, US2.1, US2.2, US2.3, US4.1, US5.1, US5.2, US5.3, US5.4), `contract-summary.md` (X-01, API-U3, SVC-02, SVC-03, DB-01), das regras de U2 (`../../u2-tickets/functional-design/rules.md`) e das respostas confirmadas em `functional-design-questions.md`.

Grupos: BR1 acesso à conversa; BR2 envio e conteúdo; BR3 leitura; BR4 integração com U2 e atomicidade; BR5 interface.

## Regras

O bloco YAML é a fonte da verdade das regras de U3. Identificadores de regra seguem `BR{grupo}.{sequência}`; códigos de erro, valores de enum e nomes de campo ficam em inglês.

```yaml
rules:
  - id: BR1.1
    statement: A conversa só existe para um chamado que o ator pode ver, e U3 nunca decide isso sozinha.
    category: authorization
    applies_to: leitura e envio de mensagens
    trigger: qualquer operação sobre a conversa de um chamado
    logic: >
      U3 obtém os fatos do chamado pelo serviço público de U2 (getVisibleTicket), que aplica a visibilidade
      dentro da própria consulta e recusa chamado inexistente ou invisível.
      A recusa se propaga sem tradução: mesma resposta, mesmo código e mesmo corpo nos dois casos.
    violation: 404 TICKET_NOT_FOUND
    source: FR6.5, NFR4, AC2.1.7, AC5.2.1, AC5.2.2, SVC-03

  - id: BR1.2
    statement: Leem a conversa o solicitante, o responsável atual e atendentes e gestores do setor atual ou de um setor por onde o chamado passou.
    category: authorization
    applies_to: leitura da conversa
    trigger: pedido de listagem de mensagens
    logic: >
      A regra é aplicada sobre os fatos devolvidos por getVisibleTicket: requesterId, assigneeId,
      sectorId e passedSectorIds. Quem está fora do conjunto responde como se o chamado não existisse,
      sem nenhuma mensagem no corpo.
    violation: 404 TICKET_NOT_FOUND
    source: FR6.5, AC2.1.3, AC2.1.7, AC5.1.2

  - id: BR1.3
    statement: Escrevem na conversa o solicitante, o responsável atual e o Gestor do setor atual.
    category: authorization
    applies_to: envio de mensagem
    trigger: pedido de envio
    logic: >
      IF o ator é o solicitante do chamado, o responsável atual, ou MANAGER do setor atual THEN permitir;
      ELSE IF o ator lê a conversa por BR1.2, mas não está nessa lista — por exemplo, Atendente do setor
      que não assumiu, ou leitor por passagem de setor — THEN recusar a ação, sem esconder o chamado;
      ELSE responder como inexistente.
      Num chamado sem responsável, só o solicitante escreve: quem quiser responder assume antes (BR3.1 de U2).
    violation: 403 FORBIDDEN para quem lê e não pode escrever; 404 TICKET_NOT_FOUND para quem não lê
    source: FR6.1, AC1.4.1, AC2.2.3, CT6, Q1

  - id: BR1.4
    statement: O Administrador não lê nem escreve na conversa.
    category: authorization
    applies_to: leitura e envio de mensagens
    trigger: operação de um ator com perfil ADMIN
    logic: >
      O Administrador está fora da lista de FR6.5, mesmo vendo o chamado em leitura por BR2.3 de U2.
      As duas operações respondem como chamado inexistente, com o mesmo corpo, e a aba não é oferecida.
    violation: 404 TICKET_NOT_FOUND
    source: FR6.5, Q2

  - id: BR2.1
    statement: O corpo da mensagem é obrigatório, tem de 1 a 2000 caracteres e é texto puro.
    category: validation
    applies_to: envio de mensagem
    trigger: pedido de envio
    logic: >
      Espaços nas pontas são removidos antes da validação.
      IF o corpo fica vazio OR passa de 2000 caracteres THEN recusar indicando o campo.
      Quebras de linha são preservadas; nenhuma marcação é interpretada, na gravação nem na exibição.
    violation: 400 VALIDATION_FAILED com details por campo
    source: FR6.1, Q3, CT8

  - id: BR2.2
    statement: Chamado encerrado não aceita mensagem nova, mas continua legível.
    category: policy
    applies_to: envio de mensagem
    trigger: pedido de envio em chamado com status CLOSED
    logic: >
      A situação vem de getVisibleTicket (statusKey).
      IF o chamado está encerrado THEN recusar, qualquer que seja o perfil do ator, inclusive o solicitante.
      A leitura da conversa continua permitida a quem vê o chamado. Reaberto, o envio volta a ser aceito.
    violation: 409 MESSAGE_TICKET_CLOSED
    source: FR6.3, AC1.4.2, AC2.2.5

  - id: BR2.3
    statement: A mensagem é imutável.
    category: constraint
    applies_to: mensagem gravada
    trigger: gravação aceita
    logic: >
      A mensagem é gravada com o autor igual ao ator e o momento atual, e nunca é alterada nem apagada.
      Não existe rota nem ação de edição ou de exclusão, nem para o autor, nem para o Administrador.
    violation: não se aplica; a operação não existe
    source: FR6.4, AC1.4.3

  - id: BR3.1
    statement: As mensagens são lidas em ordem cronológica e separadas do histórico de alterações.
    category: policy
    applies_to: listagem de mensagens
    trigger: pedido de listagem
    logic: >
      Ordem por sentAt e, em empate, por identificador, para ser determinística. O desempate acompanha
      a direção pedida: crescente com order asc, decrescente com order desc, de modo que a página 2 em
      desc seja exatamente o complemento da página 1 quando várias mensagens compartilham o mesmo sentAt.
      Mudanças de status, responsável, setor e prioridade não aparecem na conversa: ficam no histórico de U2.
    violation: não se aplica
    source: FR6.2, AC1.3.4, AC1.4.1

  - id: BR3.2
    statement: A listagem de mensagens é paginada como as demais listas do sistema.
    category: policy
    applies_to: listagem de mensagens
    trigger: pedido de listagem
    logic: >
      A resposta traz items, total, page e pageSize conforme X-01.
      A operação ganha, por adição, o parâmetro order com os valores asc e desc, padrão asc:
      com desc, a página 1 traz as mensagens mais recentes, e a tela as exibe em ordem cronológica.
      Sem esse parâmetro não haveria como pedir a página mais recente numa única chamada: a convenção
      transversal de X-01 já prevê sort e order onde houver ordenação, mas a operação listMessages de
      API-U3 não os adotou no desenho de contratos, e sua página 1 trazia sempre as mais antigas. O
      parâmetro sort é omitido de propósito, porque sentAt é o único campo ordenável da conversa.
      A paginação é por deslocamento, então a janela desliza quando chega mensagem nova entre duas
      chamadas. O efeito é limitado a repetir mensagem já carregada, nunca a esconder alguma: mensagem
      é imutável e nunca apagada (BR2.3), então só pode ser empurrada para uma página seguinte, e o
      cliente descarta identificador repetido ao juntar as páginas. Aceitamos o deslocamento em vez de
      paginação por cursor, que seria a correção completa e não se paga no volume deste sistema.
    violation: 400 VALIDATION_FAILED para paginação inválida
    source: X-01, Q6

  - id: BR3.3
    statement: O autor de cada mensagem é exibido pelo nome, inclusive quando o usuário foi desativado.
    category: policy
    applies_to: listagem de mensagens
    trigger: leitura da conversa
    logic: Os nomes vêm do resumo de usuários de U1, que inclui usuários inativos e omite identificadores desconhecidos (BR8.2 de U1)
    violation: não se aplica
    source: AC4.1.5, SVC-02

  - id: BR4.1
    statement: Gravar a mensagem, pedir a transição e registrar a notificação acontecem na mesma transação.
    category: constraint
    applies_to: envio de mensagem
    trigger: envio aceito
    logic: >
      O envio abre a transação ambiente e todos os serviços chamados dentro dele participam, sem parâmetro
      novo nas assinaturas e sem expor tipos de persistência (mecanismo fixado no desenho de U2).
      Ou a mensagem, a transição de status e a notificação ficam gravadas, ou nada fica.
    violation: qualquer falha desfaz a operação inteira e responde conforme o erro original
    source: X-01, Q5 de U2, BR7.1 de U2

  - id: BR4.2
    statement: A mensagem do solicitante devolve o chamado à análise, e quem aplica isso é U2.
    category: policy
    applies_to: envio de mensagem
    trigger: mensagem gravada
    logic: >
      Depois de gravar, U3 chama o aviso de mensagem do solicitante no serviço público de U2, na mesma transação.
      U2 decide e aplica a transição de Aguardando solicitante para Em análise, com a entrada de histórico.
      U3 nunca escreve na entidade Ticket e não repete a máquina de transições.
      O aviso não gera notificação própria, apesar do comentário de SVC-03 dizer que notifica o responsável:
      quem avisa o responsável é BR4.3, na mesma operação, e dois avisos para o mesmo destinatário
      violariam BR6.1 de U2. A divergência está registrada em functional-spec.md.
    violation: não se aplica
    source: AC2.3.2, SVC-03, ADR-006

  - id: BR4.3
    statement: Cada mensagem gera um aviso de mensagem recebida para quem não a escreveu.
    category: policy
    applies_to: notificação de mensagem
    trigger: mensagem gravada
    logic: >
      Mensagem do solicitante: o responsável atual, se houver; sem responsável, ninguém, porque o chamado
      já está na fila do setor.
      Mensagem do atendimento: o solicitante e, quando existe responsável e ele não é quem escreveu, também o responsável.
      O autor nunca entra na lista. O registro é feito pelo serviço público de notificações de U2,
      com o tipo MESSAGE_RECEIVED, na transação do envio.
    violation: não se aplica
    source: FR7.1, FR7.2, AC1.4.5, AC1.5.1, AC2.2.3, CT9, Q4

  - id: BR4.4
    statement: U3 lê dados de outra unidade somente pelos serviços públicos dela.
    category: constraint
    applies_to: toda operação de U3
    trigger: necessidade de dado de chamado ou de usuário
    logic: >
      Chamado: serviço público de U2. Pessoas: serviço público de U1. Notificação: serviço público de U2.
      Nenhuma consulta de U3 toca tabela de outra unidade, e a tabela de mensagens é escrita só por U3.
    violation: não se aplica
    source: DB-01, ADR-005

  - id: BR5.1
    statement: A aba Conversa aparece no detalhe do chamado apenas para quem pode ler a conversa.
    category: policy
    applies_to: detalhe do chamado
    trigger: abertura do detalhe
    logic: >
      A aba é registrada no ponto de extensão que U2 deixou no detalhe, ao lado de Detalhes e Histórico.
      O cliente não decide sozinho quem lê por passagem de setor, porque o detalhe do chamado não traz
      os setores de passagem: a aba é oferecida ao solicitante do chamado e a todo Atendente e Gestor,
      nunca ao Administrador, e o 404 da primeira leitura retira a aba e devolve o foco a Detalhes.
      A proteção real é BR1.2 e BR1.4, no servidor.
      As mensagens aparecem em balões com autor e momento, o solicitante de um lado e o atendimento do outro.
    violation: não se aplica
    source: AC1.3.4, AC1.4.1, wireframes.md Tela 5, Q2

  - id: BR5.2
    statement: O campo de envio só aparece para quem pode escrever, e fica desabilitado em chamado encerrado.
    category: policy
    applies_to: aba Conversa
    trigger: exibição da conversa
    logic: >
      Sem permissão de escrita, o campo não é exibido.
      Com o chamado encerrado, o campo aparece desabilitado com o aviso "Este chamado está encerrado."
      O campo tem rótulo visível e contador de caracteres, e o envio mostra o estado de envio em andamento.
    violation: não se aplica; a proteção real é BR1.3 e BR2.2
    source: AC1.4.2, BR2.1, wireframes.md Tela 5

  - id: BR5.3
    statement: A aba tem estados de carregamento, vazio e erro, e o envio que falha preserva o texto.
    category: policy
    applies_to: aba Conversa
    trigger: carregamento ou envio
    logic: >
      Carregando: esqueleto de três balões. Vazio: "Nenhuma mensagem ainda. Escreva a primeira."
      Erro ao carregar: mensagem com ação de repetir. Erro ao enviar: o balão fica marcado como "Não enviado",
      com ação de tentar novamente, e o texto digitado é preservado.
    violation: não se aplica
    source: CT7, CT8, AC1.4.4, wireframes.md Tela 5

  - id: BR5.4
    statement: A conversa longa abre nas mensagens mais recentes, com carga das anteriores sob demanda.
    category: policy
    applies_to: aba Conversa
    trigger: abertura da aba
    logic: >
      A aba pede a primeira página em ordem decrescente, com 50 por página (BR3.2), e exibe o resultado
      em ordem cronológica; "Carregar mensagens anteriores", no topo, busca a página seguinte.
      Balão muito longo é truncado em seis linhas, com "ver mais".
    violation: não se aplica
    source: Q6, wireframes.md Tela 5

  - id: BR5.5
    statement: A conversa não se atualiza sozinha.
    category: policy
    applies_to: aba Conversa
    trigger: uso da aba
    logic: >
      A conversa é carregada ao abrir a aba, depois de cada envio e pelo botão "Atualizar".
      Não há consulta periódica nem conexão permanente. As mensagens novas trazidas por essas cargas
      são anunciadas numa região de anúncio educado, para quem usa leitor de tela.
    violation: não se aplica
    source: Q5, wireframes.md Tela 5

  - id: BR5.6
    statement: A aba Conversa cumpre as regras de acessibilidade e de tela estreita do sistema.
    category: policy
    applies_to: aba Conversa
    trigger: não se aplica
    logic: >
      Operação só por teclado, foco visível, rótulo visível no campo de envio, abas navegáveis por setas,
      informação nunca transmitida só por cor, contraste vindo do tema padrão e, em 375px,
      nenhuma rolagem horizontal da página.
    violation: item reprovado no roteiro de inspeção manual ou em teste de componente
    source: NFR5, NFR6, AC5.3.1, AC5.3.2, AC5.3.3, AC5.3.4, AC5.3.5, AC5.3.6, AC5.4.1

  - id: BR5.7
    statement: As mensagens de erro exibidas vêm da tradução do código de erro no frontend.
    category: policy
    applies_to: aba Conversa
    trigger: resposta de erro da API
    logic: O código novo de U3 (MESSAGE_TICKET_CLOSED) ganha tradução em português na própria unidade
    violation: não se aplica
    source: CT11
```

## Resumo das Regras

| ID | Regra | Categoria | Código de erro |
|----|-------|-----------|----------------|
| BR1.1 | Conversa só de chamado visível, decidido por U2 | authorization | TICKET_NOT_FOUND |
| BR1.2 | Quem lê a conversa | authorization | TICKET_NOT_FOUND |
| BR1.3 | Quem escreve na conversa | authorization | FORBIDDEN, TICKET_NOT_FOUND |
| BR1.4 | Administrador fora da conversa | authorization | TICKET_NOT_FOUND |
| BR2.1 | Corpo de 1 a 2000, texto puro | validation | VALIDATION_FAILED |
| BR2.2 | Chamado encerrado não aceita mensagem | policy | MESSAGE_TICKET_CLOSED |
| BR2.3 | Mensagem imutável | constraint | — |
| BR3.1 | Ordem cronológica, separada do histórico | policy | — |
| BR3.2 | Listagem paginada | policy | VALIDATION_FAILED |
| BR3.3 | Autor exibido, inclusive desativado | policy | — |
| BR4.1 | Tudo na mesma transação | constraint | — |
| BR4.2 | Retorno automático aplicado por U2 | policy | — |
| BR4.3 | Destinatários do aviso de mensagem | policy | — |
| BR4.4 | Só serviços públicos entre unidades | constraint | — |
| BR5.1 | Aba Conversa por permissão de leitura | policy | — |
| BR5.2 | Campo de envio por permissão e situação | policy | — |
| BR5.3 | Estados da aba e texto preservado | policy | — |
| BR5.4 | Conversa longa | policy | — |
| BR5.5 | Sem atualização automática | policy | — |
| BR5.6 | Acessibilidade e tela estreita | policy | — |
| BR5.7 | Erro traduzido no frontend | policy | — |
