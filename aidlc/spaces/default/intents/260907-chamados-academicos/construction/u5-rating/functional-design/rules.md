# Regras de Negócio — U5 Avaliação (`u5-rating`)

Derivado de `requirements.md` (FR12, NFR1–NFR6), `stories.md` (US6.3 e os critérios de US5.1 a US5.4 na tela nova), `contract-summary.md` (X-01, API-U5, SVC-06, SVC-07, SVC-08, DB-01), das regras de U2 e de U4 e das respostas confirmadas em `functional-design-questions.md`.

Grupos: BR1 acesso e situação do chamado; BR2 conteúdo e imutabilidade; BR3 painel; BR4 fronteira entre unidades; BR5 interface.

## Regras

O bloco YAML é a fonte da verdade das regras de U5. Identificadores de regra seguem `BR{grupo}.{sequência}`; códigos de erro e nomes de campo ficam em inglês.

```yaml
rules:
  - id: BR1.1
    statement: Só o solicitante do chamado registra a avaliação.
    category: authorization
    applies_to: registro de avaliação
    trigger: pedido de avaliação
    logic: >
      Os fatos do chamado vêm do serviço público de U2 (getVisibleTicket), que já recusa chamado
      inexistente ou invisível com a mesma resposta.
      IF o ator não é STUDENT nem PROFESSOR THEN recusar a ação;
      IF o ator é solicitante de outro chamado, ou não é o solicitante deste THEN responder como inexistente.
    violation: 403 FORBIDDEN para perfil sem direito; 404 TICKET_NOT_FOUND para chamado que o ator não pode ver ou que não é dele
    source: FR12.1, AC6.3.1, NFR4, SVC-07

  - id: BR1.2
    statement: Só chamado encerrado aceita avaliação.
    category: policy
    applies_to: registro de avaliação
    trigger: pedido de avaliação
    logic: A situação vem de getVisibleTicket (statusKey); chamado em qualquer outro status é recusado
    violation: 409 RATING_TICKET_NOT_CLOSED
    source: FR12.1, AC6.3.1

  - id: BR1.3
    statement: Lê a avaliação quem pode ver o chamado.
    category: authorization
    applies_to: leitura da avaliação
    trigger: consulta da avaliação de um chamado
    logic: >
      A regra de leitura é exatamente a visibilidade de chamado de U2: solicitante, responsável atual,
      atendentes e gestores do setor atual ou de um setor de passagem, e o Administrador em leitura (Q4).
      Chamado que o ator não vê responde como inexistente; chamado visível ainda sem avaliação responde
      que a avaliação não existe.
      O Administrador lê a avaliação, ao contrário da conversa de U3, que ele não lê: a avaliação é um
      julgamento do serviço prestado, que interessa a quem administra o sistema, enquanto a conversa pode
      tratar do assunto pessoal que motivou o chamado. A assimetria é deliberada e está registrada aqui.
    violation: 404 TICKET_NOT_FOUND para chamado invisível; 404 RATING_NOT_FOUND para chamado sem avaliação
    source: FR12.1, AC5.2.1, AC5.2.2, Q4

  - id: BR1.4
    statement: Avaliar é opcional e nunca bloqueia nada.
    category: policy
    applies_to: encerramento de chamado
    trigger: encerramento
    logic: >
      Nenhuma operação de encerramento consulta a avaliação nem depende dela, e nenhuma tela exibe a
      falta de avaliação como pendência, aviso ou erro.
      É verificável por três afirmações: encerrar um chamado sem avaliação responde igual a encerrar um
      já avaliado; o chamado encerrado e não avaliado aparece nas listagens sem marca alguma; e as
      contagens do painel não mudam com a presença ou ausência de avaliação.
    violation: não se aplica; a regra é verificada pelas três afirmações acima
    source: FR12.1, AC6.3.2

  - id: BR2.1
    statement: A nota é um inteiro de 1 a 5, e cada valor tem um rótulo fixo em texto.
    category: validation
    applies_to: registro de avaliação
    trigger: pedido de avaliação
    logic: >
      IF a nota não é inteiro OR está fora do intervalo de 1 a 5 THEN recusar indicando o campo.
      Os rótulos são fixos, de "muito ruim" a "muito bom", e acompanham a nota na exibição (Q1).
    violation: 400 VALIDATION_FAILED com details por campo
    source: FR12.1, Q1

  - id: BR2.2
    statement: O comentário é opcional, de até 500 caracteres, e é texto puro.
    category: validation
    applies_to: registro de avaliação
    trigger: pedido de avaliação
    logic: >
      Espaços nas pontas são removidos antes da validação; comentário vazio depois disso é gravado como ausente.
      IF o comentário passa de 500 caracteres THEN recusar indicando o campo.
      Quebras de linha são preservadas e nenhuma marcação é interpretada (Q3).
    violation: 400 VALIDATION_FAILED com details por campo
    source: Q3, CT8

  - id: BR2.3
    statement: Cada chamado tem no máximo uma avaliação, e ela nunca muda.
    category: constraint
    applies_to: avaliação gravada
    trigger: segundo pedido de avaliação do mesmo chamado
    logic: >
      A primeira avaliação vale. Uma segunda tentativa é recusada, qualquer que seja a nota (Q2).
      A avaliação nunca é alterada nem apagada, e não existe rota de edição ou exclusão.
      A unicidade é garantida pelo banco, não só pela verificação na aplicação.
    violation: 409 RATING_ALREADY_EXISTS
    source: Q2, FR12.1

  - id: BR2.4
    statement: A reabertura não mexe na avaliação.
    category: policy
    applies_to: avaliação gravada
    trigger: reabertura e novo encerramento do chamado
    logic: >
      A avaliação existente permanece como está, e o novo encerramento não abre uma segunda avaliação (Q2).
      Um chamado reaberto e ainda aberto continua sem aceitar avaliação nova, por BR1.2.
    violation: 409 RATING_ALREADY_EXISTS na tentativa de avaliar de novo
    source: Q2, BR4.3 de U2

  - id: BR3.1
    statement: O painel mostra a média das avaliações e quantas foram, no período.
    category: calculation
    applies_to: resumo de avaliações
    trigger: consulta do resumo
    logic: >
      Entram as avaliações dos chamados visíveis ao ator cujo encerramento mais recente cai no período,
      o mesmo recorte dos tempos médios de U4 (Q5).
      A média sai com uma casa decimal na exibição, e a quantidade acompanha o número.
      Só Gestor e Administrador consultam, com a visibilidade aplicada pelo serviço de U2.
      Como o recorte é o encerramento atual do chamado, e não o momento da avaliação, a reabertura move
      a avaliação de lugar: enquanto o chamado reaberto estiver aberto, ele não tem encerramento e some
      de qualquer média; encerrado de novo, a mesma avaliação, que não mudou, passa a contar no período
      do encerramento mais recente. É o mesmo comportamento que os tempos médios de U4 já têm, e é o
      preço de usar um recorte único para todos os números do painel (Q5).
    violation: 403 FORBIDDEN para os demais perfis
    source: FR12.2, AC6.3.3, Q5

  - id: BR3.2
    statement: Período sem avaliação devolve média vazia e quantidade zero.
    category: policy
    applies_to: resumo de avaliações
    trigger: período sem nenhuma avaliação visível
    logic: A média vem vazia e a quantidade é zero; o cartão mostra um traço e a explicação, nunca zero como se fosse nota
    violation: não se aplica
    source: FR10.3, AC6.1.3, BR2.2 de U4

  - id: BR3.3
    statement: O comentário nunca entra no painel.
    category: constraint
    applies_to: resumo de avaliações
    trigger: exibição do painel
    logic: O resumo devolve apenas média e quantidade; o texto do comentário só aparece no chamado, para quem pode lê-lo
    violation: não se aplica
    source: Q3, Q5

  - id: BR4.1
    statement: U5 estende os módulos de U2 e de U4 por adição, sem alterar o que existe.
    category: constraint
    applies_to: toda a unidade
    trigger: implementação de U5
    logic: >
      A avaliação e suas operações entram no módulo de chamados; o resumo entra no módulo de indicadores,
      seguindo a forma dos demais indicadores (SVC-08).
      Nenhum método existente muda de assinatura, nenhuma resposta existente perde campo,
      e a visibilidade de chamado continua sendo de U2.
      Aditivo não quer dizer sem tocar em arquivo, e os dois acréscimos nas telas têm formas diferentes.
      Na aba Detalhes do chamado, U5 cria um ponto de extensão que não existia: uma propriedade opcional
      de conteúdo extra em TicketTabs, renderizada dentro do painel Detalhes, abaixo do que já estava
      lá. Não é o padrão de aba irmã que U3 usa para a Conversa, e U5 não cria aba nova (BR5.1).
      No painel de indicadores, nenhum ponto de extensão é criado: o cartão de avaliação entra direto na
      grade dos tempos médios, e o módulo de U4 importa o cartão do módulo de U5 — uma dependência de U4
      para U5, declarada nas divergências de functional-spec.md junto com a forma de cada acréscimo.
      Em nenhum dos dois casos o comportamento existente da tela muda quando U5 não está presente.
    violation: não se aplica
    source: SVC-07, SVC-08, ADR-005, DB-01

  - id: BR4.2
    statement: Avaliar não gera notificação.
    category: constraint
    applies_to: registro de avaliação
    trigger: avaliação gravada
    logic: Nenhum aviso é criado para o responsável, para o setor ou para quem quer que seja; FR7 não lista a avaliação entre os eventos notificáveis
    violation: não se aplica
    source: FR7.1, FR12.1

  - id: BR5.1
    statement: A ação de avaliar aparece no detalhe do chamado encerrado, só para o solicitante e só enquanto não houver avaliação.
    category: policy
    applies_to: detalhe do chamado
    trigger: abertura do detalhe de um chamado encerrado
    logic: >
      Não há tela própria: a avaliação vive no detalhe, junto das demais ações.
      Para os outros perfis, e para o solicitante depois de avaliar, a ação não aparece;
      a proteção real é BR1.1 a BR1.3, no servidor.
    violation: não se aplica
    source: AC6.3.1, unit-of-work.md

  - id: BR5.2
    statement: A avaliação registrada é exibida a quem pode lê-la, com nota, rótulo, comentário e data.
    category: policy
    applies_to: detalhe do chamado
    trigger: chamado avaliado
    logic: A nota aparece com o rótulo em texto, nunca só como estrela ou cor; o comentário, quando existe, aparece na íntegra
    violation: não se aplica
    source: Q1, Q3, Q4, AC5.3.4

  - id: BR5.3
    statement: O formulário deixa claro que a avaliação é definitiva antes de enviar.
    category: policy
    applies_to: formulário de avaliação
    trigger: preenchimento
    logic: >
      Cinco opções com rótulo visível, escolhidas por teclado ou por clique; comentário opcional com contador;
      um aviso de que a avaliação não poderá ser alterada, e confirmação antes do envio.
      Falha no envio preserva o que foi digitado.
    violation: não se aplica
    source: Q2, CT7, CT8

  - id: BR5.4
    statement: O painel ganha um cartão com a média e a quantidade de avaliações.
    category: policy
    applies_to: painel de indicadores
    trigger: carregamento do painel
    logic: O cartão fica junto dos cartões de tempo, que usam o mesmo recorte de período, e mostra um traço quando não há avaliação
    violation: não se aplica
    source: AC6.3.3, Q5, BR7.1 de U4

  - id: BR5.5
    statement: As telas de U5 cumprem as regras de acessibilidade e de tela estreita do sistema.
    category: policy
    applies_to: formulário, exibição da avaliação e cartão do painel
    trigger: não se aplica
    logic: >
      Operação só por teclado, foco visível, rótulo visível em cada opção e no comentário,
      informação nunca transmitida só por cor ou por ícone, contraste vindo do tema padrão,
      e em 375px nenhuma rolagem horizontal da página.
    violation: item reprovado no roteiro de inspeção manual ou em teste de componente
    source: NFR5, NFR6, AC5.3.1, AC5.3.2, AC5.3.3, AC5.3.4, AC5.3.5, AC5.3.6, AC5.4.1

  - id: BR5.6
    statement: As mensagens de erro exibidas vêm da tradução do código no frontend.
    category: policy
    applies_to: telas de U5
    trigger: resposta de erro da API
    logic: Os códigos novos de U5 ganham tradução em português na própria unidade
    violation: não se aplica
    source: CT11
```

## Resumo das Regras

| ID | Regra | Categoria | Código de erro |
|----|-------|-----------|----------------|
| BR1.1 | Só o solicitante avalia | authorization | FORBIDDEN, TICKET_NOT_FOUND |
| BR1.2 | Só chamado encerrado aceita avaliação | policy | RATING_TICKET_NOT_CLOSED |
| BR1.3 | Lê quem vê o chamado | authorization | TICKET_NOT_FOUND, RATING_NOT_FOUND |
| BR1.4 | Avaliar é opcional | policy | — |
| BR2.1 | Nota inteira de 1 a 5, com rótulo | validation | VALIDATION_FAILED |
| BR2.2 | Comentário opcional de até 500 | validation | VALIDATION_FAILED |
| BR2.3 | Uma avaliação por chamado, imutável | constraint | RATING_ALREADY_EXISTS |
| BR2.4 | Reabertura não mexe na avaliação | policy | RATING_ALREADY_EXISTS |
| BR3.1 | Média e quantidade no período | calculation | FORBIDDEN |
| BR3.2 | Período sem avaliação devolve vazio | policy | — |
| BR3.3 | Comentário nunca entra no painel | constraint | — |
| BR4.1 | Extensão aditiva de U2 e U4 | constraint | — |
| BR4.2 | Avaliar não notifica | constraint | — |
| BR5.1 | Ação no detalhe do chamado encerrado | policy | — |
| BR5.2 | Exibição da avaliação registrada | policy | — |
| BR5.3 | Formulário avisa que é definitiva | policy | — |
| BR5.4 | Cartão no painel | policy | — |
| BR5.5 | Acessibilidade e tela estreita | policy | — |
| BR5.6 | Erro traduzido no frontend | policy | — |
