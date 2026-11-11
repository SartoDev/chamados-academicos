# Rastreabilidade Requisito → Teste — U4 Indicadores

Cobertura por requisito, critério principal de teste afirmado em `team.md`: cada critério de aceitação e cada regra de negócio da U4 aponta para os testes automatizados que o verificam. Os critérios sem casa automatizada, por não haver teste de navegador no projeto, apontam para o [roteiro de inspeção manual](roteiro-inspecao-manual.md).

Fontes: `stories.md` (US6.1, US6.2 e os critérios de US5.1, US5.3 e US5.4 nas telas novas), `rules.md` (BR1.1 a BR7.6) e `traceability.json` do Desenho Funcional da U4. Os critérios que a U4 realiza só em parte trazem, na coluna de observação, a unidade que realiza o restante.

## Legenda dos arquivos de teste

### API — unitários (`apps/api/src/`)

| Sigla      | Arquivo                                 |
| ---------- | --------------------------------------- |
| U4-periodo | `reporting/rules/report-period.spec.ts` |
| U4-acesso  | `reporting/rules/report-access.spec.ts` |

### API — integração com PostgreSQL real (`apps/api/test/integration/u4-reporting/`)

| Sigla        | Arquivo                       |
| ------------ | ----------------------------- |
| I4-agregacao | `ticket-aggregations.spec.ts` |
| I4-servico   | `reporting-service.spec.ts`   |
| I4-api       | `api-reports.spec.ts`         |

### API — testes de U1 que cobrem as rotas novas

| Sigla    | Arquivo                                                             |
| -------- | ------------------------------------------------------------------- |
| I1-rotas | `apps/api/test/integration/u1-foundation/route-enumeration.spec.ts` |

### Web — componentes (`apps/web/src/`)

| Sigla          | Arquivo                                             |
| -------------- | --------------------------------------------------- |
| W4-painel      | `features/reports/ReportsPage.test.tsx`             |
| W4-indicadores | `features/reports/IndicatorsTab.test.tsx`           |
| W4-tempo       | `features/reports/DurationCard.test.tsx`            |
| W4-grafico     | `features/reports/BarChartWithTable.test.tsx`       |
| W4-consulta    | `features/reports/QueryTab.test.tsx`                |
| W4-periodo     | `features/reports/report-period.test.ts`            |
| W1-navegacao   | `app/rules.test.ts` e `app/layout/SideNav.test.tsx` |

### Inspeção manual

| Sigla     | Documento                                                |
| --------- | -------------------------------------------------------- |
| M4-manual | [roteiro de inspeção manual](roteiro-inspecao-manual.md) |

## Critérios de aceitação realizados na U4

Só os critérios que a U4 realiza, no todo ou em parte. Os demais do `traceability.json` estão marcados como realizados em U1 ou U2 e são rastreados na tabela daquelas unidades.

| Critério | O que a U4 realiza                                                   | Regras       | Testes                                                  | Observação                                                 |
| -------- | -------------------------------------------------------------------- | ------------ | ------------------------------------------------------- | ---------------------------------------------------------- |
| AC5.1.1  | As três rotas novas declaram perfil e recusam quem não tem direito   | BR1.1        | I4-api, I1-rotas, U4-acesso                             | Mecanismo de negação por padrão — U1                       |
| AC5.1.2  | Número e listagem alheios recusados nas rotas novas                  | BR1.2        | I4-api, I4-agregacao                                    | Enumeração de rotas — U1                                   |
| AC5.3.1  | Uso do Painel só pelo teclado                                        | BR7.6        | M4-manual                                               | Casca e telas anteriores — U1, U2 e U3                     |
| AC5.3.2  | Indicador de foco visível no Painel                                  | BR7.6        | M4-manual                                               | Sem teste de navegador no projeto                          |
| AC5.3.3  | Rótulo visível associado aos campos de período e de filtro           | BR7.6        | W4-painel, W4-consulta                                  | Também observado em M4-manual                              |
| AC5.3.4  | Informação nunca só por cor ou por tamanho de barra                  | BR7.4        | W4-grafico, W4-tempo, W4-indicadores                    | Rótulo e quantidade escritos ao lado de cada barra         |
| AC5.3.5  | Contraste mínimo no Painel                                           | BR7.6        | M4-manual                                               | Sem teste de navegador no projeto                          |
| AC5.3.6  | Tema padrão sem cores sobrescritas no Painel                         | BR7.6        | M4-manual                                               | Sem teste de navegador no projeto                          |
| AC5.4.4  | Painel sem rolagem horizontal em 375px                               | BR7.6        | M4-manual                                               | Sem teste de navegador no projeto                          |
| AC6.1.1  | Quantidade por status, por categoria e por setor                     | BR3.1, BR7.1 | I4-agregacao, I4-servico, I4-api, W4-indicadores        | Na tela, o gráfico por setor é do Administrador (Q4)       |
| AC6.1.2  | O período escolhido recorta os números e volta no endereço           | BR2.1, BR7.2 | I4-agregacao, I4-api, U4-periodo, W4-painel, W4-periodo | —                                                          |
| AC6.1.3  | Período sem chamado mostra estado vazio explicativo, não zeros       | BR2.2, BR7.3 | I4-agregacao, I4-servico, I4-api, W4-indicadores        | —                                                          |
| AC6.1.4  | Os números do Gestor correspondem apenas ao que o perfil dele vê     | BR1.2        | I4-agregacao, I4-servico, I4-api                        | Comparação direta com os do Administrador no mesmo período |
| AC6.1.5  | Nenhum limiar ou meta acompanha os tempos médios                     | BR4.4        | W4-tempo, I4-servico                                    | I4-servico confere a lista exata de campos da resposta     |
| AC6.2.1  | Filtros de status, categoria, setor e período combinados na listagem | BR5.1        | I4-servico, I4-api, W4-consulta                         | —                                                          |
| AC6.2.2  | Não existe ação de exportar nem rota correspondente                  | BR5.2        | I4-api, W4-consulta                                     | I4-api também confere que nenhuma resposta é arquivo       |

## Regras de negócio da U4

| Regra | O que exige                                                                                 | Testes                                                     |
| ----- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| BR1.1 | Perfis por operação: contagens e tempos do Gestor e do Administrador, listagem só do Gestor | U4-acesso, I4-api, I1-rotas, W4-painel                     |
| BR1.2 | Todo número respeita a visibilidade do ator, aplicada por U2                                | I4-agregacao, I4-servico, I4-api                           |
| BR1.3 | Gestor sem setor não tem números                                                            | I4-agregacao                                               |
| BR2.1 | Período fechado no início e aberto no fim, em UTC                                           | U4-periodo, I4-agregacao, I4-api, W4-periodo, W4-painel    |
| BR2.2 | Período sem dados devolve vazio, nunca erro                                                 | I4-agregacao, I4-servico, I4-api, W4-indicadores, W4-tempo |
| BR3.1 | Contagem por status, categoria ou setor, recortada pela abertura                            | I4-agregacao, I4-servico, I4-api                           |
| BR3.2 | O total é a soma dos grupos devolvidos                                                      | I4-agregacao, I4-servico                                   |
| BR3.3 | Rótulos vêm do catálogo de U1, inclusive de item desativado                                 | I4-servico, I4-api                                         |
| BR4.1 | Atendimento: da abertura até o primeiro responsável                                         | I4-agregacao, I4-api                                       |
| BR4.2 | Resolução: da abertura até o encerramento mais recente                                      | I4-agregacao                                               |
| BR4.3 | Duas amostras, recortadas pelo encerramento                                                 | I4-agregacao, I4-servico, I4-api, W4-indicadores, W4-tempo |
| BR4.4 | Tempos exibidos sem meta e sem limiar                                                       | W4-tempo, I4-servico                                       |
| BR5.1 | Listagem filtrada, combinável e paginada                                                    | I4-servico, I4-api, W4-consulta                            |
| BR5.2 | Não existe exportação                                                                       | I4-api, W4-consulta                                        |
| BR6.1 | Unidade somente leitura, sem entidade e sem tabela alheia                                   | I1-rotas, I4-servico                                       |
| BR6.2 | Agregações entram por adição no serviço público de U2                                       | I4-agregacao                                               |
| BR7.1 | Cartões por status, com zero nos status sem chamado, e gráficos                             | W4-indicadores                                             |
| BR7.2 | Seletor de período com padrão de 30 dias, no endereço                                       | W4-painel, W4-periodo, U4-periodo, I4-servico, I4-api      |
| BR7.3 | Estados de carregamento, vazio e erro com repetir                                           | W4-indicadores, W4-consulta                                |
| BR7.4 | Tabela equivalente a cada gráfico e todo número com rótulo em texto                         | W4-grafico, W4-tempo                                       |
| BR7.5 | Item "Painel" e abas por perfil                                                             | W4-painel, W1-navegacao                                    |
| BR7.6 | Acessibilidade e tela estreita das telas de U4                                              | M4-manual, W4-painel, W4-consulta, W4-grafico              |

## Achados da revisão do desenho cobertos por teste

| Achado | O que foi coberto                                                                                                                                | Testes                                |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------- |
| R-02   | `searchTickets` passou a trazer `openedAt` em cada linha, por adição, e a resolução de rótulos e de pessoas a partir dos identificadores é da U4 | I4-agregacao, I4-servico, W4-consulta |
| R-06   | As duas amostras viajam separadas em toda a cadeia; o campo único `sampleSize` do bloco de contrato não existe na resposta                       | I4-api, I4-servico, I4-agregacao      |

## Critérios transversais

| Critério | O que exige                                                | Testes                        |
| -------- | ---------------------------------------------------------- | ----------------------------- |
| CT1      | Sessão obrigatória nas rotas novas                         | I4-api, I1-rotas              |
| CT6      | Perfil sem direito recebe 403                              | I4-api, U4-acesso             |
| CT7      | Estados de carregamento, vazio e erro com repetir          | W4-indicadores, W4-consulta   |
| CT8      | Validação de campo com o campo indicado na resposta        | I4-api, U4-periodo, W4-painel |
| CT11     | Mensagem de erro traduzida a partir do código, no frontend | W4-indicadores, W4-consulta   |
