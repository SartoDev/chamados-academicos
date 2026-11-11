# Rastreabilidade Requisito → Teste — U5 Avaliação

Cobertura por requisito, critério principal de teste afirmado em `team.md`: cada critério de aceitação e cada regra de negócio da U5 aponta para os testes automatizados que o verificam. Os critérios sem casa automatizada, por não haver teste de navegador no projeto, apontam para o [roteiro de inspeção manual](roteiro-inspecao-manual.md).

Fontes: `stories.md` (US6.3 e os critérios de US5.1 a US5.4 realizados no bloco e no cartão novos), `requirements.md` (FR12.1 e FR12.2) e `rules.md` (BR1.1 a BR5.6) do Desenho Funcional da U5. Os critérios que a U5 realiza só em parte trazem, na coluna de observação, a unidade que realiza o restante.

## Legenda dos arquivos de teste

### API — unitários (`apps/api/src/`)

| Sigla       | Arquivo                                 |
| ----------- | --------------------------------------- |
| U5-acesso   | `tickets/rules/rating-access.spec.ts`   |
| U5-conteudo | `tickets/rules/rating-score.spec.ts`    |
| U4-acesso   | `reporting/rules/report-access.spec.ts` |

### API — integração com PostgreSQL real (`apps/api/test/integration/u5-rating/`)

| Sigla      | Arquivo                  |
| ---------- | ------------------------ |
| I5-modelo  | `data-model.spec.ts`     |
| I5-servico | `rating-service.spec.ts` |
| I5-api     | `api-rating.spec.ts`     |

### API — testes de U1 que cobrem as rotas novas

| Sigla    | Arquivo                                                             |
| -------- | ------------------------------------------------------------------- |
| I1-rotas | `apps/api/test/integration/u1-foundation/route-enumeration.spec.ts` |

### Web — componentes (`apps/web/src/`)

| Sigla          | Arquivo                                      |
| -------------- | -------------------------------------------- |
| W5-bloco       | `features/rating/RatingSection.test.tsx`     |
| W5-formulario  | `features/rating/RatingForm.test.tsx`        |
| W5-exibicao    | `features/rating/RatingSummaryView.test.tsx` |
| W5-cartao      | `features/rating/RatingCard.test.tsx`        |
| W5-extensao    | `features/rating/extension-points.test.tsx`  |
| W4-indicadores | `features/reports/IndicatorsTab.test.tsx`    |

### Inspeção manual

| Sigla     | Documento                                                |
| --------- | -------------------------------------------------------- |
| M5-manual | [roteiro de inspeção manual](roteiro-inspecao-manual.md) |

## Critérios de aceitação realizados na U5

Só os critérios que a U5 realiza, no todo ou em parte. Os demais estão marcados como realizados em U1, U2 ou U4 e são rastreados na tabela daquelas unidades.

| Critério | O que a U5 realiza                                                 | Regras        | Testes                                          | Observação                                                      |
| -------- | ------------------------------------------------------------------ | ------------- | ----------------------------------------------- | --------------------------------------------------------------- |
| AC5.1.1  | As três rotas novas declaram perfil e recusam quem não tem direito | BR1.1, BR3.1  | I5-api, I1-rotas, U5-acesso, U4-acesso          | Mecanismo de negação por padrão — U1                            |
| AC5.1.2  | Chamado alheio recusado nas rotas novas, sem devolver conteúdo     | BR1.1, BR1.3  | I5-api, I5-servico, U5-acesso                   | Enumeração de rotas — U1                                        |
| AC5.2.1  | Chamado que o ator não pode ver responde 404, e não 403            | BR1.1, BR1.3  | I5-api, I5-servico                              | —                                                               |
| AC5.2.2  | 404 de chamado alheio indistinguível do 404 de inexistente         | BR1.3         | I5-api                                          | I5-api compara os dois corpos campo a campo                     |
| AC5.3.1  | Uso do bloco de avaliação e do diálogo só pelo teclado             | BR5.5         | M5-manual                                       | Casca e telas anteriores — U1 a U4                              |
| AC5.3.2  | Indicador de foco visível nas opções, no campo e no diálogo        | BR5.5         | M5-manual                                       | Sem teste de navegador no projeto                               |
| AC5.3.3  | Rótulo visível associado ao grupo de notas e ao comentário         | BR5.3, BR5.5  | W5-formulario                                   | Também observado em M5-manual                                   |
| AC5.3.4  | Nota sempre com rótulo em texto, nunca só estrela ou cor           | BR5.2, BR5.5  | W5-formulario, W5-exibicao, W5-cartao           | O cartão do painel mostra escala e base escritas ao lado        |
| AC5.3.5  | Contraste mínimo no bloco, no diálogo e no cartão                  | BR5.5         | M5-manual                                       | Sem teste de navegador no projeto                               |
| AC5.3.6  | Tema padrão sem cores sobrescritas nas telas da U5                 | BR5.5         | M5-manual                                       | Sem teste de navegador no projeto                               |
| AC5.4.1  | Bloco de avaliação sem rolagem horizontal em 375px                 | BR5.5         | M5-manual                                       | Sem teste de navegador no projeto                               |
| AC6.3.1  | O solicitante registra a avaliação num chamado seu já encerrado    | BR1.1 a BR2.3 | I5-api, I5-servico, W5-bloco, W5-formulario     | —                                                               |
| AC6.3.2  | O encerramento acontece normalmente sem avaliação                  | BR1.4         | I5-servico                                      | I5-servico compara encerrar com e sem avaliação, e as contagens |
| AC6.3.3  | A avaliação compõe os números do painel                            | BR3.1 a BR3.3 | I5-servico, I5-api, W5-extensao, W4-indicadores | O painel e o recorte de período — U4                            |

## Regras de negócio da U5

| Regra | O que exige                                                                                         | Testes                                                                 |
| ----- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| BR1.1 | Só o solicitante do chamado registra a avaliação; outro perfil recebe 403 e chamado alheio, 404     | U5-acesso, I5-servico, I5-api, W5-bloco                                |
| BR1.2 | Só chamado encerrado aceita avaliação; os demais status recusam com 409                             | U5-acesso, I5-servico, I5-api, W5-bloco, W5-formulario                 |
| BR1.3 | Lê a avaliação quem vê o chamado, o Administrador incluído; sem avaliação, 404 próprio              | U5-acesso, I5-servico, I5-api, W5-bloco                                |
| BR1.4 | Avaliar é opcional e não bloqueia encerramento, listagem nem contagem                               | I5-servico, W5-bloco                                                   |
| BR2.1 | Nota inteira de 1 a 5, cada valor com rótulo fixo                                                   | U5-conteudo, I5-modelo, I5-servico, I5-api, W5-formulario, W5-exibicao |
| BR2.2 | Comentário opcional de até 500 caracteres, texto puro com quebras preservadas                       | U5-conteudo, I5-modelo, I5-servico, I5-api, W5-formulario, W5-exibicao |
| BR2.3 | Uma avaliação por chamado, imutável, com a unicidade garantida pelo banco                           | I5-modelo, I5-servico, I5-api                                          |
| BR2.4 | A reabertura não mexe na avaliação nem libera uma segunda                                           | I5-servico, I5-api, W5-bloco                                           |
| BR3.1 | Média e quantidade das avaliações dos chamados visíveis encerrados no período                       | I5-servico, I5-api, U4-acesso, W5-extensao                             |
| BR3.2 | Período sem avaliação devolve média vazia e quantidade zero                                         | I5-servico, I5-api, W5-cartao, W5-extensao                             |
| BR3.3 | O comentário nunca entra no resumo do painel                                                        | I5-servico, I5-api                                                     |
| BR4.1 | Extensão aditiva de U2 e de U4, sem alterar o comportamento existente                               | W5-extensao, I1-rotas, e as suítes de U2 e de U4 intactas              |
| BR4.2 | Avaliar não gera notificação para ninguém                                                           | I5-servico                                                             |
| BR5.1 | A ação de avaliar aparece no detalhe do chamado encerrado, só para o solicitante e só sem avaliação | W5-bloco, W5-extensao                                                  |
| BR5.2 | A avaliação registrada é exibida com nota, rótulo, comentário e data                                | W5-exibicao, W5-bloco                                                  |
| BR5.3 | O formulário avisa que a avaliação é definitiva e confirma antes de enviar                          | W5-formulario                                                          |
| BR5.4 | O painel ganha um cartão com a média e a quantidade, junto dos cartões de tempo                     | W5-cartao, W5-extensao, W4-indicadores                                 |
| BR5.5 | Acessibilidade e uso em tela estreita nas telas da U5                                               | W5-formulario, W5-exibicao, W5-cartao, M5-manual                       |
| BR5.6 | As mensagens de erro exibidas vêm da tradução do código no frontend                                 | W5-formulario                                                          |

## Requisitos funcionais cobertos

| Requisito | O que exige                                                    | Testes                                          |
| --------- | -------------------------------------------------------------- | ----------------------------------------------- |
| FR12.1    | O solicitante avalia o atendimento ao encerramento; é opcional | I5-servico, I5-api, W5-bloco, W5-formulario     |
| FR12.2    | A avaliação compõe os indicadores de FR10                      | I5-servico, I5-api, W5-extensao, W4-indicadores |

## Critérios transversais verificados na U5

| Critério | O que exige na U5                                                                  | Testes                                                                           |
| -------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| CT1      | Nenhuma consulta devolve avaliação de outro dono, por qualquer caminho             | I5-servico, I5-api; o filtro dentro da consulta é exigência de revisão de código |
| CT2      | Toda resposta de erro usa o envelope único; nenhum erro do Prisma vaza             | I5-api (verifica o envelope em cada recusa), I5-servico                          |
| CT6      | Ação negada por perfil responde 403; recurso invisível responde 404                | I5-api, U5-acesso                                                                |
| CT7      | O bloco tem estado de carregamento, estado vazio e estado de erro com repetição    | W5-bloco                                                                         |
| CT8      | O formulário valida ao sair do campo, mostra o erro abaixo dele e preserva o texto | W5-formulario                                                                    |
| CT11     | As mensagens exibidas derivam do `code` do envelope, traduzido no frontend         | W5-formulario                                                                    |

## O que não é verificado por teste automatizado

- **AC5.3.1, AC5.3.2, AC5.3.5, AC5.3.6 e AC5.4.1** dependem de observar a tela e não têm teste de navegador neste projeto, por decisão afirmada em `team.md` e em `project.md`. Estão no [roteiro de inspeção manual](roteiro-inspecao-manual.md), que é datado e fica versionado no repositório; a passagem é do autor.
- **CT1**, na parte do meio (filtrar o ator dentro da própria cláusula de consulta), é exigência de revisão de código, não critério de teste, conforme a redação do próprio critério em `stories.md`. O comportamento observável está coberto por I5-servico e I5-api.
