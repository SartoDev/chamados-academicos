# Rastreabilidade Requisito → Teste — U3 Conversa

Cobertura por requisito, critério principal de teste afirmado em `team.md`: cada critério de aceitação e cada regra de negócio da U3 aponta para os testes automatizados que o verificam. Os critérios sem casa automatizada, por não haver teste de navegador no projeto, apontam para o [roteiro de inspeção manual](roteiro-inspecao-manual.md).

Fontes: `stories.md` (US1.4 e os critérios de mensagens de US1.3, US1.5, US2.1, US2.2, US2.3, US4.1, US5.1, US5.2, US5.3 e US5.4), `rules.md` (BR1.1 a BR5.7) e `traceability.json` do Desenho Funcional da U3. Os critérios que a U3 realiza só em parte trazem, na coluna de observação, a unidade que realiza o restante.

## Legenda dos arquivos de teste

### API — unitários (`apps/api/src/`)

| Sigla            | Arquivo                                          |
| ---------------- | ------------------------------------------------ |
| U3-acesso        | `conversation/rules/conversation-access.spec.ts` |
| U3-destinatarios | `conversation/rules/message-recipients.spec.ts`  |
| U3-fronteira     | `conversation/conversation-boundary.spec.ts`     |

### API — integração com PostgreSQL real (`apps/api/test/integration/u3-conversation/`)

| Sigla      | Arquivo                        |
| ---------- | ------------------------------ |
| I3-dados   | `data-model.spec.ts`           |
| I3-servico | `conversation-service.spec.ts` |
| I3-api     | `api-messages.spec.ts`         |

### API — testes de U1 e U2 que cobrem as rotas novas

| Sigla    | Arquivo                                                             |
| -------- | ------------------------------------------------------------------- |
| I1-rotas | `apps/api/test/integration/u1-foundation/route-enumeration.spec.ts` |

### Web — componentes (`apps/web/src/features/conversation/`)

| Sigla     | Arquivo                      |
| --------- | ---------------------------- |
| W3-aba    | `ConversationTab.test.tsx`   |
| W3-lista  | `MessageList.test.tsx`       |
| W3-campo  | `MessageComposer.test.tsx`   |
| W3-balao  | `MessageBubble.test.tsx`     |
| W3-regras | `conversation-rules.test.ts` |

### Inspeção manual

| Sigla     | Documento                                                |
| --------- | -------------------------------------------------------- |
| M3-manual | [roteiro de inspeção manual](roteiro-inspecao-manual.md) |

## Critérios de aceitação realizados na U3

Só os critérios que a U3 realiza, no todo ou em parte. Os demais do `traceability.json` estão marcados como realizados em U1 ou U2 e são rastreados na tabela daquelas unidades.

| Critério | O que a U3 realiza                                                               | Regras                     | Testes                                          | Observação                                               |
| -------- | -------------------------------------------------------------------------------- | -------------------------- | ----------------------------------------------- | -------------------------------------------------------- |
| AC1.3.4  | A aba de mensagens no detalhe, com os balões em ordem cronológica                | BR5.1, BR3.1               | W3-aba, W3-lista, W3-regras, I3-api             | Descrição, metadados e histórico em abas — U2            |
| AC1.4.1  | Enviar mensagem e vê-la na conversa, com autor e momento                         | BR1.3, BR2.1, BR3.1, BR5.2 | I3-api, I3-servico, W3-campo, W3-balao          | —                                                        |
| AC1.4.2  | Chamado encerrado recusa mensagem nova e mantém o campo desabilitado com o aviso | BR2.2, BR5.2               | I3-api, I3-servico, U3-acesso, W3-aba, W3-campo | —                                                        |
| AC1.4.3  | Não existe rota nem ação de edição ou exclusão de mensagem                       | BR2.3                      | I1-rotas, I3-api                                | A enumeração de rotas prova que só existem GET e POST    |
| AC1.4.4  | Falha no envio preserva o texto e oferece tentar novamente                       | BR5.3                      | W3-campo                                        | —                                                        |
| AC1.4.5  | Aviso ao responsável quando o solicitante escreve, e a ninguém sem responsável   | BR4.3                      | U3-destinatarios, I3-servico, I3-api            | —                                                        |
| AC1.5.1  | A notificação de mensagem recebida, gravada na mesma transação                   | BR4.3, BR4.1               | I3-api, I3-servico, U3-destinatarios            | Notificação de status, responsável e setor — U2          |
| AC2.1.3  | Mensagens de chamado que passou pelo setor, em leitura                           | BR1.2                      | U3-acesso, I3-api, I3-servico                   | Visibilidade do próprio chamado — U2                     |
| AC2.1.7  | 404 idêntico ao inexistente na rota de mensagens                                 | BR1.1, BR1.2               | I3-api, U3-acesso                               | —                                                        |
| AC2.2.3  | O atendimento responde na conversa e o solicitante é avisado                     | BR1.3, BR4.3               | I3-api, I3-servico, U3-destinatarios, U3-acesso | —                                                        |
| AC2.2.5  | Chamado encerrado recusa mensagem de qualquer perfil, inclusive do responsável   | BR2.2                      | I3-api, U3-acesso                               | —                                                        |
| AC2.3.2  | O gatilho da mensagem do solicitante e o pedido de retorno a Em análise          | BR4.2                      | I3-api, I3-servico                              | Transição e histórico — U2                               |
| AC4.1.5  | A mensagem de usuário desativado continua legível com o nome dele                | BR3.3                      | I3-api, I3-servico, W3-balao                    | Login recusado — U1; chamados visíveis — U2              |
| AC5.1.1  | As rotas novas declaram perfil e recusam quem não tem direito                    | BR1.3, BR1.4               | I3-api, I1-rotas, U3-acesso                     | Mecanismo de negação por padrão — U1                     |
| AC5.1.2  | Acesso alheio recusado nas rotas novas                                           | BR1.1, BR1.2               | I3-api, U3-acesso                               | Enumeração de rotas — U1                                 |
| AC5.2.1  | Chamado alheio responde como inexistente na rota de mensagens                    | BR1.1                      | I3-api                                          | —                                                        |
| AC5.2.2  | Corpo idêntico entre chamado inexistente, invisível e sem acesso à conversa      | BR1.1, BR1.4               | I3-api                                          | O teste compara as três respostas, ignorando o `traceId` |
| AC5.3.1  | Uso da aba Conversa só pelo teclado                                              | BR5.6                      | M3-manual                                       | Casca e telas anteriores — U1 e U2                       |
| AC5.3.2  | Indicador de foco visível na aba Conversa                                        | BR5.6                      | M3-manual, W3-aba                               | W3-aba verifica o foco devolvido a Detalhes no 404       |
| AC5.3.3  | Rótulo visível associado ao campo de envio                                       | BR5.2, BR5.6               | W3-campo                                        | Também observado em M3-manual                            |
| AC5.3.4  | Informação nunca só por cor na aba Conversa                                      | BR5.6                      | W3-balao, W3-campo                              | O autor e "Não enviado" aparecem por escrito             |
| AC5.3.5  | Contraste mínimo na aba Conversa                                                 | BR5.6                      | M3-manual                                       | Sem teste de navegador no projeto                        |
| AC5.3.6  | Tema padrão sem cores sobrescritas na aba Conversa                               | BR5.6                      | M3-manual                                       | Sem teste de navegador no projeto                        |
| AC5.4.1  | Aba Conversa sem rolagem horizontal em 375px                                     | BR5.6                      | M3-manual                                       | Sem teste de navegador no projeto                        |

## Regras de negócio da U3

| Regra | O que exige                                                       | Testes                                                 |
| ----- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| BR1.1 | A conversa só existe para chamado visível, decidido por U2        | I3-api, I3-servico                                     |
| BR1.2 | Quem lê a conversa                                                | U3-acesso, I3-api, I3-servico, W3-regras               |
| BR1.3 | Quem escreve na conversa                                          | U3-acesso, I3-api, I3-servico, W3-regras, W3-aba       |
| BR1.4 | O Administrador fica fora da conversa                             | U3-acesso, I3-api, I3-servico, W3-aba, W3-regras       |
| BR2.1 | Corpo de 1 a 2000 caracteres, texto puro                          | I3-dados, I3-api, I3-servico, W3-campo, W3-balao       |
| BR2.2 | Chamado encerrado não aceita mensagem e continua legível          | U3-acesso, I3-api, I3-servico, W3-aba, W3-campo        |
| BR2.3 | A mensagem é imutável                                             | I1-rotas, I3-api                                       |
| BR3.1 | Ordem cronológica, separada do histórico                          | I3-dados, I3-servico, I3-api, W3-lista, W3-regras      |
| BR3.2 | Listagem paginada, com o parâmetro aditivo `order`                | I3-dados, I3-servico, I3-api, W3-regras, W3-aba        |
| BR3.3 | Autor exibido pelo nome, inclusive desativado                     | I3-servico, I3-api, W3-balao                           |
| BR4.1 | Mensagem, transição e notificação na mesma transação              | I3-servico (inclusive a falha forçada que desfaz tudo) |
| BR4.2 | A mensagem do solicitante devolve o chamado à análise, por U2     | I3-servico, I3-api                                     |
| BR4.3 | Destinatários do aviso de mensagem, nunca o autor                 | U3-destinatarios, I3-servico, I3-api                   |
| BR4.4 | Dado de outra unidade só pelo serviço público dela                | U3-fronteira, I3-servico, I3-api                       |
| BR5.1 | A aba Conversa por permissão de leitura                           | W3-aba, W3-regras                                      |
| BR5.2 | Campo de envio por permissão e situação do chamado                | W3-aba, W3-campo, W3-regras                            |
| BR5.3 | Estados da aba e texto preservado na falha                        | W3-lista, W3-campo, W3-aba                             |
| BR5.4 | Conversa longa: última página, carga das anteriores e truncamento | W3-aba, W3-lista, W3-balao, W3-regras, I3-servico      |
| BR5.5 | Sem atualização automática, com anúncio educado                   | W3-aba, W3-lista, W3-regras                            |
| BR5.6 | Acessibilidade e tela estreita da aba                             | M3-manual, W3-campo, W3-balao, W3-aba                  |
| BR5.7 | Erro exibido vem da tradução do código no frontend                | W3-campo                                               |

## Achados da revisão do desenho cobertos por teste

| Achado | O que foi coberto                                                                                                                                                                                       | Testes                                  |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| R-06   | Janela de deslocamento sob escrita concorrente: uma mensagem nova entre a primeira e a segunda página só pode repetir uma já carregada, nunca esconder uma; a junção descarta identificadores repetidos | I3-servico, W3-regras, W3-aba, I3-dados |
| R-07   | `order` sem `sort`, porque `sentAt` é o único campo ordenável da conversa                                                                                                                               | I3-api, I3-servico                      |

## Critérios transversais

| Critério | O que exige                                       | Testes                   |
| -------- | ------------------------------------------------- | ------------------------ |
| CT1      | Sessão obrigatória nas rotas novas                | I3-api, I1-rotas         |
| CT6      | Perfil sem direito recebe 403                     | I3-api, U3-acesso        |
| CT7      | Estados de carregamento, vazio e erro com repetir | W3-lista, W3-aba         |
| CT8      | Validação de campo com mensagem ao lado do campo  | I3-api, W3-campo         |
| CT9      | Notificação nunca para quem causou o evento       | U3-destinatarios, I3-api |
| CT11     | Mensagem de erro traduzida a partir do código     | W3-campo                 |
