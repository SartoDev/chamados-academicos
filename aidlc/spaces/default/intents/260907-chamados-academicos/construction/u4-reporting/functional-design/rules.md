# Regras de Negócio — U4 Indicadores (`u4-reporting`)

Derivado de `requirements.md` (FR10, FR11, NFR1–NFR6), `stories.md` (US6.1, US6.2, e os critérios de US5.1, US5.3 e US5.4 nas telas novas), `contract-summary.md` (X-01, API-U4, SVC-04, SVC-05), das regras de U2 (`../../u2-tickets/functional-design/rules.md`) e das respostas confirmadas em `functional-design-questions.md`.

Grupos: BR1 acesso e visibilidade; BR2 período; BR3 contagens; BR4 tempos médios; BR5 listagem filtrada; BR6 fronteira entre unidades; BR7 interface.

## Regras

O bloco YAML é a fonte da verdade das regras de U4. Identificadores de regra seguem `BR{grupo}.{sequência}`; códigos de erro e nomes de campo ficam em inglês.

```yaml
rules:
  - id: BR1.1
    statement: As contagens e os tempos médios são do Gestor e do Administrador; a listagem filtrada é só do Gestor.
    category: authorization
    applies_to: operações de API-U4
    trigger: requisição a operação de U4
    logic: >
      Contagens e tempos: MANAGER e ADMIN.
      Listagem filtrada por período: MANAGER, como o contrato define; o Administrador continua usando
      a listagem geral de chamados de U2, que não tem recorte por período (Q5).
      Qualquer outro perfil recebe 403, e toda rota nova declara os perfis permitidos.
    violation: 403 FORBIDDEN
    source: FR10.1, FR11.1, AC5.1.1, AC5.1.3, NFR2, Q5

  - id: BR1.2
    statement: Todo número respeita o que o perfil que consulta pode ver.
    category: authorization
    applies_to: contagens, tempos médios e listagem
    trigger: qualquer consulta de U4
    logic: >
      A visibilidade é a de chamado de U2, aplicada dentro da própria consulta pelo serviço público dela,
      nunca recalculada aqui: o Gestor alcança os chamados do setor atual e os que já passaram pelo setor;
      o Administrador alcança todos (Q3).
      U4 nunca soma um chamado que o ator não poderia abrir.
    violation: não se aplica; a consulta simplesmente não enxerga o chamado
    source: FR10.1, AC6.1.4, NFR1, CT1, Q3

  - id: BR1.3
    statement: Um Gestor sem setor não tem números.
    category: authorization
    applies_to: contagens, tempos médios e listagem
    trigger: consulta de um MANAGER sem setor vinculado
    logic: >
      A visibilidade de U2 não devolve chamado nenhum, e o painel mostra o estado vazio, sem erro.
      A restrição de U1 que exige setor para Atendente e Gestor torna esse estado inalcançável pela API
      com um usuário ativo; a regra fica como comportamento defensivo, verificado no nível da regra
      com um ator sintético, e não por teste de API.
    violation: não se aplica
    source: BR2.2 de U2, BR3.3 de U1

  - id: BR2.1
    statement: O período é fechado no início e aberto no fim, em UTC.
    category: validation
    applies_to: contagens, tempos médios e listagem
    trigger: consulta com período
    logic: >
      Os dois limites são opcionais e independentes.
      IF o início é posterior ou igual ao fim OR qualquer um não é uma data válida THEN recusar indicando o campo.
      Sem período, a consulta cobre todo o histórico; a tela sempre envia um período, com padrão de 30 dias (BR7.2).
    violation: 400 VALIDATION_FAILED com details por campo
    source: X-01, FR10.3, AC6.1.2

  - id: BR2.2
    statement: Período sem dados devolve resultado vazio, nunca erro.
    category: policy
    applies_to: contagens e tempos médios
    trigger: período sem nenhum chamado visível
    logic: >
      Contagens: lista de grupos vazia e total zero.
      Tempos: as duas médias vazias, e as duas amostras (`resolutionSampleSize`, `handlingSampleSize`) zero.
      A tela mostra estado vazio explicativo, e não zeros sem contexto.
    violation: não se aplica
    source: FR10.3, AC6.1.3

  - id: BR3.1
    statement: A contagem agrupa por status, por categoria ou por setor, recortada pela abertura do chamado.
    category: calculation
    applies_to: contagem de chamados
    trigger: pedido de contagem
    logic: >
      O agrupamento é um de status, category ou sector, e é obrigatório.
      Entram os chamados visíveis cuja abertura cai dentro do período (Q2).
      Cada grupo traz identificador, rótulo e quantidade; grupo sem nenhum chamado no período não aparece.
    violation: 400 VALIDATION_FAILED para agrupamento ausente ou desconhecido
    source: FR10.1, AC6.1.1, AC6.1.2, Q2

  - id: BR3.2
    statement: O total é a soma dos grupos devolvidos.
    category: calculation
    applies_to: contagem de chamados
    trigger: contagem calculada
    logic: Cada chamado visível do período entra em exatamente um grupo, então o total é a quantidade de chamados do recorte
    violation: não se aplica
    source: FR10.1

  - id: BR3.3
    statement: Os rótulos vêm do catálogo de U1, inclusive de itens desativados.
    category: policy
    applies_to: contagem de chamados
    trigger: leitura dos grupos
    logic: Os nomes são resolvidos pela consulta de rótulos de U1, que inclui inativos (BR8.8 de U1); um grupo nunca aparece sem nome
    violation: não se aplica
    source: FR3.7, AC4.2.4, SVC-04

  - id: BR4.1
    statement: Tempo de atendimento é o intervalo entre a abertura e a primeira vez que o chamado ganha responsável.
    category: calculation
    applies_to: tempos médios
    trigger: cálculo das médias
    logic: >
      O marco final é a primeira entrada de histórico de responsável do chamado, tenha ela vindo de assumir
      ou de atribuir. Um chamado encerrado que nunca teve responsável fica fora desta média, e só desta.
      Esta regra fecha a pendência que a revisão de requisitos deixou (achado R-06).
    violation: não se aplica
    source: FR10.2, AC6.1.5, Q1

  - id: BR4.2
    statement: Tempo de resolução é o intervalo entre a abertura e o encerramento.
    category: calculation
    applies_to: tempos médios
    trigger: cálculo das médias
    logic: >
      O marco final é o encerramento mais recente do chamado.
      Um chamado reaberto e encerrado de novo conta uma vez, pelo encerramento mais recente (Q2).
    violation: não se aplica
    source: FR10.2, Q1, Q2

  - id: BR4.3
    statement: A amostra dos tempos médios são os chamados encerrados dentro do período.
    category: calculation
    applies_to: tempos médios
    trigger: cálculo das médias
    logic: >
      Entram os chamados visíveis cujo encerramento mais recente cai dentro do período.
      Chamado ainda aberto não entra.
      São duas amostras, e a resposta devolve as duas: a da resolução, com todos os chamados que entraram,
      e a do atendimento, com o subconjunto que chegou a ter responsável (BR4.1).
      Cada tempo médio é exibido com a sua própria amostra, para que um número calculado sobre poucos
      chamados não seja lido como se tivesse a mesma base do outro.
      Note-se que o recorte das médias é pelo encerramento, enquanto o das contagens é pela abertura (BR3.1).
    violation: não se aplica
    source: FR10.2, Q2

  - id: BR4.4
    statement: Os tempos são exibidos sem meta e sem limiar.
    category: constraint
    applies_to: tempos médios
    trigger: exibição
    logic: Nenhum valor de referência, alvo, cor de alerta ou comparação acompanha os tempos, na API ou na tela
    violation: não se aplica
    source: FR10.2, AC6.1.5

  - id: BR5.1
    statement: A listagem filtrada combina status, categoria, setor e período, e é paginada.
    category: policy
    applies_to: listagem de relatório
    trigger: pedido de listagem
    logic: >
      Os filtros são opcionais e combináveis, e o período recorta pela abertura do chamado.
      A busca é a de chamados do serviço público de U2, que já aplica a visibilidade do ator.
      A resposta traz items, total, page e pageSize conforme X-01.
    violation: 400 VALIDATION_FAILED para filtro ou paginação inválidos
    source: FR11.1, AC6.2.1

  - id: BR5.2
    statement: Não existe exportação.
    category: constraint
    applies_to: toda a unidade
    trigger: não se aplica
    logic: Nenhuma rota de download, nenhum arquivo gerado e nenhuma ação de exportar na tela
    violation: não se aplica
    source: FR11.1, AC6.2.2

  - id: BR6.1
    statement: U4 não é dona de entidade, não grava e não consulta tabela de outra unidade.
    category: constraint
    applies_to: toda a unidade
    trigger: necessidade de dado
    logic: >
      Chamados e agregações vêm do serviço público de U2; rótulos vêm do serviço público de U1.
      Nenhuma consulta de U4 toca o banco diretamente, e nenhuma migração é gerada por esta unidade.
    violation: não se aplica
    source: ADR-005, DB-01

  - id: BR6.2
    statement: As agregações entram por adição no serviço público de U2, implementadas no Bolt de U4.
    category: constraint
    applies_to: contrato entre unidades
    trigger: implementação de U4
    logic: >
      A contagem e os tempos médios já estão declarados em SVC-05 e foram adiados pelo desenho de U2;
      eles são implementados agora, dentro do módulo de U2, sem alterar nenhum método existente
      e sem expor tipo de persistência na assinatura.
    violation: não se aplica
    source: SVC-05, achado R-02 da revisão dos contratos

  - id: BR7.1
    statement: O painel tem cartões de quantidade por status, um cartão de tempo e gráficos de barras.
    category: policy
    applies_to: tela do painel
    trigger: abertura do painel
    logic: >
      Cartões: um por status, na ordem Aberto, Em análise, Aguardando solicitante e Encerrado,
      mostrando zero quando o período não tem chamados naquele status; mais um cartão com o tempo
      médio de resolução e outro com o de atendimento, cada um com a sua amostra (BR4.3).
      A contagem omite grupo sem chamado (BR3.1), então a tela completa com zero a partir da lista
      de status do catálogo de U1, que dá identificador e rótulo dos quatro; sem essa lista não haveria
      como saber o nome de um status que não apareceu no período.
      Gráficos de barras horizontais: por categoria para os dois perfis, e por setor só para o
      Administrador, porque para o Gestor ele teria praticamente uma barra só (Q4).
    violation: não se aplica
    source: AC6.1.1, wireframes.md Tela 9, Q4

  - id: BR7.2
    statement: O período é escolhido na tela, com padrão de 30 dias, e recarrega os números.
    category: policy
    applies_to: tela do painel e listagem
    trigger: escolha de período
    logic: O seletor começa nos últimos 30 dias, a escolha vai para a URL, e trocar de período recarrega tudo
    violation: não se aplica
    source: FR10.3, AC6.1.2, wireframes.md Tela 9

  - id: BR7.3
    statement: O painel tem estados de carregamento, vazio e erro.
    category: policy
    applies_to: tela do painel e listagem
    trigger: carregamento
    logic: >
      Carregando: esqueleto nos cartões e nos gráficos.
      Vazio: "Nenhum chamado no período selecionado." Como os dois recortes de período são diferentes
      (contagens pela abertura, tempos pelo encerramento), o estado vazio exige as duas populações
      vazias no mesmo período: nenhum chamado aberto no recorte das contagens e nenhum encerrado no
      recorte dos tempos. Com uma só delas vazia, a tela mostra os números, e o zero é legítimo.
      Erro: mensagem com ação de repetir, preservando o período escolhido.
    violation: não se aplica
    source: CT7, AC6.1.3, wireframes.md Tela 9

  - id: BR7.4
    statement: Cada gráfico vem com uma tabela equivalente, e todo número tem rótulo em texto.
    category: policy
    applies_to: tela do painel
    trigger: exibição
    logic: >
      A tabela equivalente traz rótulo e quantidade de cada barra, acessível a leitor de tela.
      Nenhuma informação é transmitida só por cor ou só por tamanho de barra.
      Os tempos aparecem em unidade legível, com o valor por extenso ao lado do número.
    violation: item reprovado no roteiro de inspeção manual ou em teste de componente
    source: NFR5, AC5.3.4, wireframes.md Tela 9

  - id: BR7.5
    statement: O painel e a consulta ficam num item de navegação novo, visível a quem pode abri-los.
    category: policy
    applies_to: navegação
    trigger: sessão ativa
    logic: >
      Item "Painel" para Gestor e Administrador. Dentro dele, duas abas: Indicadores, para os dois perfis,
      e Consulta, a listagem filtrada, só para o Gestor (BR1.1).
      A proteção real é a marcação de perfil das rotas.
    violation: não se aplica
    source: AC5.1.1, wireframes.md Tela 9

  - id: BR7.6
    statement: As telas de U4 cumprem as regras de acessibilidade e de tela estreita do sistema.
    category: policy
    applies_to: telas de U4
    trigger: não se aplica
    logic: >
      Operação só por teclado, foco visível, rótulos visíveis, contraste vindo do tema padrão,
      e em 375px a página não rola na horizontal: os cartões empilham e a tabela da consulta
      rola dentro do próprio contentor.
    violation: item reprovado no roteiro de inspeção manual ou em teste de componente
    source: NFR5, NFR6, AC5.3.1, AC5.3.2, AC5.3.3, AC5.3.5, AC5.3.6, AC5.4.4
```

## Resumo das Regras

| ID | Regra | Categoria | Código de erro |
|----|-------|-----------|----------------|
| BR1.1 | Perfis por operação | authorization | FORBIDDEN |
| BR1.2 | Números restritos à visibilidade do ator | authorization | — |
| BR1.3 | Gestor sem setor não tem números | authorization | — |
| BR2.1 | Período fechado no início, aberto no fim, em UTC | validation | VALIDATION_FAILED |
| BR2.2 | Período sem dados devolve vazio | policy | — |
| BR3.1 | Contagem por status, categoria ou setor, pela abertura | calculation | VALIDATION_FAILED |
| BR3.2 | Total é a soma dos grupos | calculation | — |
| BR3.3 | Rótulos de U1, inclusive inativos | policy | — |
| BR4.1 | Atendimento: abertura até o primeiro responsável | calculation | — |
| BR4.2 | Resolução: abertura até o encerramento mais recente | calculation | — |
| BR4.3 | Amostra: encerrados no período | calculation | — |
| BR4.4 | Sem meta nem limiar | constraint | — |
| BR5.1 | Listagem filtrada e paginada | policy | VALIDATION_FAILED |
| BR5.2 | Sem exportação | constraint | — |
| BR6.1 | Sem entidade, sem escrita, sem tabela alheia | constraint | — |
| BR6.2 | Agregações aditivas no serviço de U2 | constraint | — |
| BR7.1 | Cartões e gráficos do painel | policy | — |
| BR7.2 | Seletor de período com padrão de 30 dias | policy | — |
| BR7.3 | Estados da tela | policy | — |
| BR7.4 | Tabela equivalente e rótulo em texto | policy | — |
| BR7.5 | Item de navegação e abas por perfil | policy | — |
| BR7.6 | Acessibilidade e tela estreita | policy | — |
