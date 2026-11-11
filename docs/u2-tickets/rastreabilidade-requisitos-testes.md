# Rastreabilidade Requisito → Teste — U2 Chamados

Cobertura por requisito, critério principal de teste afirmado em `team.md`: cada critério de aceitação e cada regra de negócio da U2 aponta para os testes automatizados que o verificam. Os critérios sem casa automatizada, por não haver teste de navegador no projeto, apontam para o [roteiro de inspeção manual](roteiro-inspecao-manual.md).

Fontes: `stories.md` (US1.2, US1.3, US1.5, US1.6, US2.1 a US2.4, US3.1, US5.2 e os critérios parciais de US4.1, US4.2, US5.1, US5.3 e US5.4), `rules.md` (BR1.1 a BR9.9) e `traceability.json` do Desenho Funcional da U2.

## Legenda dos arquivos de teste

### API — unitários (`apps/api/src/`)

| Sigla              | Arquivo                                               |
| ------------------ | ----------------------------------------------------- |
| U2-transicoes      | `tickets/rules/ticket-transitions.spec.ts`            |
| U2-politica        | `tickets/rules/ticket-action-policy.spec.ts`          |
| U2-visibilidade    | `tickets/rules/ticket-visibility.spec.ts`             |
| U2-janela          | `tickets/rules/reopen-window.spec.ts`                 |
| U2-disponibilidade | `tickets/rules/assignee-availability.spec.ts`         |
| U2-referencia      | `tickets/rules/ticket-reference.spec.ts`              |
| U2-destinatarios   | `notifications/rules/notification-recipients.spec.ts` |

### API — integração com PostgreSQL real (`apps/api/test/integration/u2-tickets/`)

| Sigla               | Arquivo                      |
| ------------------- | ---------------------------- |
| I2-dados            | `data-model.spec.ts`         |
| I2-transacao        | `transaction-runner.spec.ts` |
| I2-ciclo            | `ticket-lifecycle.spec.ts`   |
| I2-listagem         | `ticket-listing.spec.ts`     |
| I2-concorrencia     | `ticket-concurrency.spec.ts` |
| I2-publicos         | `public-services.spec.ts`    |
| I2-notificacoes     | `notifications.spec.ts`      |
| I2-api-chamados     | `api-tickets.spec.ts`        |
| I2-api-autorizacao  | `api-authorization.spec.ts`  |
| I2-api-notificacoes | `api-notifications.spec.ts`  |

### Web — componentes (`apps/web/src/`)

| Sigla           | Arquivo                                                   |
| --------------- | --------------------------------------------------------- |
| W2-regras       | `features/tickets/ticket-rules.test.ts`                   |
| W2-meus         | `features/tickets/MyTicketsPage.test.tsx`                 |
| W2-novo         | `features/tickets/NewTicketForm.test.tsx`                 |
| W2-detalhe      | `features/tickets/TicketDetailPage.test.tsx`              |
| W2-dialogos     | `features/tickets/dialogs/ticket-dialogs.test.tsx`        |
| W2-fila         | `features/tickets/SectorQueuePage.test.tsx`               |
| W2-sino         | `features/notifications/NotificationBell.test.tsx`        |
| W2-notificacoes | `features/notifications/NotificationsPage.test.tsx`       |
| W-nav           | `app/layout/SideNav.test.tsx` (U1, ajustado pela U2)      |
| W-casca         | `app/layout/AppShell.test.tsx` (U1, ajustado pela U2)     |
| W-regras        | `app/rules.test.ts` (U1, ajustado pela U2)                |
| W-protegida     | `app/ProtectedLayout.test.tsx` (U1, ajustado pela U2)     |
| W-login-page    | `features/auth/LoginPage.test.tsx` (U1, ajustado pela U2) |
| W-mensagens     | `app/i18n/error-code-messages.test.ts` (U1)               |
| W-lista         | `app/components/ListState.test.tsx` (U1)                  |

Manual: [roteiro de inspeção manual](roteiro-inspecao-manual.md), itens numerados.

## Critérios de aceitação

| Critério | O que verifica                                                          | Testes                                                                                                                                             |
| -------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC1.2.1  | Setor preenchido pela categoria, sem edição                             | W2-novo; Manual 1.2                                                                                                                                |
| AC1.2.2  | Chamado criado Aberto, sem responsável, levando ao detalhe              | I2-ciclo, I2-api-chamados, W2-novo                                                                                                                 |
| AC1.2.3  | Sem escolha de prioridade, vale a padrão                                | I2-ciclo, W2-novo                                                                                                                                  |
| AC1.2.4  | Título ou descrição em branco: erro no campo, sem criar                 | I2-api-chamados, W2-novo                                                                                                                           |
| AC1.2.5  | Setor enviado pelo cliente é descartado                                 | I2-api-chamados                                                                                                                                    |
| AC1.2.6  | Categoria inativa fora das opções e recusada pelo servidor              | I2-ciclo, I2-api-chamados, W2-novo                                                                                                                 |
| AC1.3.1  | Listagem só dos meus chamados, com identificador e metadados            | I2-listagem, I2-api-chamados, W2-meus                                                                                                              |
| AC1.3.2  | Filtros aplicados e preservados ao trocar de página                     | I2-listagem, W2-meus                                                                                                                               |
| AC1.3.3  | Lista vazia com mensagem e botão de abrir o primeiro                    | W2-meus                                                                                                                                            |
| AC1.3.4  | Detalhe com descrição, metadados e histórico em abas (Conversa é da U3) | W2-detalhe                                                                                                                                         |
| AC1.3.5  | Chamado de outro solicitante responde 404                               | I2-listagem, I2-api-chamados, W2-detalhe                                                                                                           |
| AC1.3.6  | Histórico com autor, momento, valor anterior e novo, em ordem           | I2-ciclo, I2-listagem, W2-detalhe                                                                                                                  |
| AC1.3.7  | Contagem total exibida e filtros preservados na paginação               | I2-listagem, W2-meus                                                                                                                               |
| AC1.3.8  | Erro na listagem com ação de repetir                                    | W2-meus                                                                                                                                            |
| AC1.5.1  | Notificação criada no momento do evento                                 | I2-ciclo, I2-api-notificacoes                                                                                                                      |
| AC1.5.2  | Contador de não lidas no sino                                           | I2-notificacoes, I2-api-notificacoes, W2-sino                                                                                                      |
| AC1.5.3  | Abrir a notificação marca como lida e leva ao chamado                   | I2-notificacoes, I2-api-notificacoes, W2-sino, W2-notificacoes                                                                                     |
| AC1.5.4  | Marcar todas zera o contador                                            | I2-notificacoes, I2-api-notificacoes, W2-sino, W2-notificacoes                                                                                     |
| AC1.5.5  | Nenhum e-mail ou canal externo                                          | I2-notificacoes e I2-api-notificacoes (o efeito é sempre uma linha em `notifications`); ausência de canal externo verificada por revisão de código |
| AC1.5.6  | Chamado alheio não gera notificação para terceiros                      | U2-destinatarios, I2-api-notificacoes                                                                                                              |
| AC1.6.1  | Reabertura dentro do prazo mantém o último responsável                  | I2-ciclo, I2-api-chamados, W2-detalhe                                                                                                              |
| AC1.6.2  | Fronteira exata de 72 horas (71h59 aceita, 72h00 recusa)                | U2-janela, I2-ciclo, I2-api-chamados                                                                                                               |
| AC1.6.3  | Último responsável avisado da reabertura                                | I2-ciclo, I2-api-notificacoes                                                                                                                      |
| AC1.6.4  | Reabrir chamado de outro solicitante responde 404                       | I2-ciclo, I2-api-chamados                                                                                                                          |
| AC1.6.5  | Reabertura consta no histórico como transição                           | I2-ciclo                                                                                                                                           |
| AC1.6.6  | Atendente e Gestor recebem 403 ao tentar reabrir                        | U2-politica, I2-ciclo, I2-api-autorizacao                                                                                                          |
| AC1.6.7  | Solicitante encerra o próprio chamado e o responsável é avisado         | I2-ciclo, I2-api-notificacoes, W2-detalhe                                                                                                          |
| AC2.1.1  | Fila com os recortes do setor                                           | I2-listagem, I2-api-chamados, W2-fila                                                                                                              |
| AC2.1.2  | Chamado de outro setor não aparece e o acesso direto responde 404       | I2-listagem, I2-api-autorizacao                                                                                                                    |
| AC2.1.3  | Chamado que passou pelo setor continua visível, em leitura              | I2-ciclo, I2-listagem, I2-api-chamados                                                                                                             |
| AC2.1.4  | Sem setor vinculado, a fila é negada com mensagem própria               | U2-visibilidade, I2-listagem, W2-fila                                                                                                              |
| AC2.1.5  | Recorte e filtros preservados ao paginar, com contagem total            | I2-listagem, W2-fila                                                                                                                               |
| AC2.1.6  | Erro na fila com ação de repetir                                        | W2-fila                                                                                                                                            |
| AC2.2.1  | Assumir torna o ator responsável e leva a Em análise                    | I2-ciclo, I2-api-chamados, W2-fila                                                                                                                 |
| AC2.2.2  | Chamado já assumido: recusa informando o responsável atual              | U2-politica, I2-ciclo, I2-concorrencia, I2-api-chamados, W2-detalhe, W2-fila                                                                       |
| AC2.2.4  | Encerramento pelo responsável avisa o solicitante                       | I2-ciclo, I2-api-notificacoes                                                                                                                      |
| AC2.3.1  | Aguardando solicitante muda o status e avisa o solicitante              | I2-ciclo, I2-api-chamados, W2-detalhe                                                                                                              |
| AC2.3.2  | Mensagem do solicitante devolve o chamado a Em análise                  | I2-publicos                                                                                                                                        |
| AC2.3.3  | Alteração de prioridade vale e consta no histórico                      | I2-ciclo, I2-api-chamados, W2-dialogos                                                                                                             |
| AC2.3.4  | Solicitante recebe 403 ao tentar alterar a prioridade                   | U2-politica, I2-ciclo, I2-api-autorizacao                                                                                                          |
| AC2.3.5  | Transição fora da tabela é recusada                                     | U2-transicoes, I2-ciclo, I2-api-chamados                                                                                                           |
| AC2.3.6  | Toda mudança registra autor, momento e valores                          | I2-ciclo, I2-listagem                                                                                                                              |
| AC2.4.1  | Transferência remove o responsável e volta a Aberto no destino          | I2-ciclo, I2-api-chamados, W2-dialogos                                                                                                             |
| AC2.4.2  | Mesmo setor de destino é recusado                                       | U2-politica, I2-ciclo, I2-api-chamados, W2-dialogos                                                                                                |
| AC2.4.3  | Justificativa em branco é recusada                                      | I2-api-chamados, W2-dialogos                                                                                                                       |
| AC2.4.4  | Histórico traz origem, destino, justificativa, autor e momento          | I2-ciclo, I2-listagem, W2-detalhe                                                                                                                  |
| AC2.4.5  | Solicitante avisado da transferência                                    | I2-ciclo, I2-api-notificacoes                                                                                                                      |
| AC2.4.6  | Transferir chamado encerrado responde 403                               | U2-politica, I2-ciclo, I2-api-chamados                                                                                                             |
| AC2.4.7  | Cada passagem por setor com entrada e saída                             | I2-dados, I2-listagem, I2-api-chamados, W2-detalhe                                                                                                 |
| AC3.1.1  | Gestor atribui a alguém do setor e o status vai a Em análise            | I2-ciclo, I2-api-chamados, W2-dialogos                                                                                                             |
| AC3.1.2  | Atribuição a alguém de outro setor é recusada                           | U2-politica, I2-ciclo, I2-api-chamados, W2-dialogos                                                                                                |
| AC3.1.3  | Reatribuição troca o responsável e consta no histórico                  | I2-ciclo                                                                                                                                           |
| AC3.1.4  | Atendente recebe 403 ao tentar atribuir                                 | U2-politica, I2-ciclo, I2-api-autorizacao                                                                                                          |
| AC3.1.5  | Solicitante avisado da mudança de responsável                           | I2-ciclo, I2-api-notificacoes                                                                                                                      |
| AC4.1.5  | Chamados de usuário desativado continuam visíveis com o nome            | I2-listagem                                                                                                                                        |
| AC4.2.3  | Categoria ou setor inativo fora das opções de abertura                  | I2-ciclo, I2-api-chamados, W2-novo                                                                                                                 |
| AC4.2.4  | Item de catálogo desativado continua exibido nos chamados existentes    | I2-listagem                                                                                                                                        |
| AC5.1.1  | 403 para cada perfil sem direito em cada rota nova                      | I2-api-autorizacao                                                                                                                                 |
| AC5.1.2  | Recurso com dono não é acessível a outro usuário                        | I2-api-chamados, I2-api-autorizacao                                                                                                                |
| AC5.2.1  | Recurso existente porém invisível responde 404, não 403                 | I2-listagem, I2-publicos, I2-api-chamados                                                                                                          |
| AC5.2.2  | Respostas de inexistente e invisível são indistinguíveis                | I2-listagem, I2-publicos, I2-api-chamados                                                                                                          |
| AC5.3.1  | Uso completo só pelo teclado nas telas da U2                            | Manual 1.1 a 1.8; parte automatizada: W2-fila (assumir por teclado), W2-sino (Escape e foco), W2-detalhe (abas)                                    |
| AC5.3.2  | Indicador de foco visível                                               | Manual 2.1 e 2.2                                                                                                                                   |
| AC5.3.3  | Rótulo visível associado a cada campo                                   | W2-novo, W2-dialogos                                                                                                                               |
| AC5.3.4  | Status, prioridade e marcas transmitidos também por texto               | W2-detalhe, W2-fila, W2-sino                                                                                                                       |
| AC5.3.5  | Contraste mínimo de WCAG 2.1 nível A                                    | Manual 5.1 a 5.3                                                                                                                                   |
| AC5.3.6  | Nenhuma cor sobrescreve a paleta do tema                                | Manual 6.1 e 6.2 (revisão de código)                                                                                                               |
| AC5.4.1  | Telas do solicitante sem rolagem horizontal em 375px                    | Manual 4.1 e 4.2                                                                                                                                   |
| AC5.4.2  | Listagem de chamados em cartões em 375px                                | Manual 4.3 e 4.4; parte automatizada: W2-meus (cartões presentes)                                                                                  |
| AC5.4.4  | Rolagem contida no contentor das tabelas de trabalho                    | Manual 4.5 e 4.6                                                                                                                                   |

Critérios adiados para a U3, conforme `traceability.json`: AC2.1.7 (mensagens de chamado visível só por passagem), AC2.2.3 (responder mensagem) e AC2.2.5 (mensagem em chamado encerrado).

## Regras de negócio

| Regra | Testes                                                                                             |
| ----- | -------------------------------------------------------------------------------------------------- |
| BR1.1 | U2-politica, I2-ciclo, I2-api-autorizacao                                                          |
| BR1.2 | I2-dados, I2-api-chamados, W2-novo                                                                 |
| BR1.3 | I2-ciclo, I2-api-chamados, W2-novo                                                                 |
| BR1.4 | I2-ciclo, W2-novo                                                                                  |
| BR1.5 | I2-ciclo (status, responsável e passagem inicial, sem histórico)                                   |
| BR1.6 | U2-referencia, I2-dados, I2-concorrencia, I2-api-chamados                                          |
| BR2.1 | U2-visibilidade, I2-listagem, I2-api-chamados                                                      |
| BR2.2 | U2-visibilidade, I2-listagem, I2-api-autorizacao                                                   |
| BR2.3 | U2-politica, I2-listagem, I2-api-autorizacao, W2-regras, W2-detalhe                                |
| BR2.4 | I2-listagem, I2-publicos, I2-api-chamados                                                          |
| BR2.5 | I2-listagem, I2-api-chamados, W2-meus                                                              |
| BR2.6 | U2-visibilidade, I2-listagem, I2-api-chamados, W2-fila                                             |
| BR2.7 | I2-listagem (nomes resolvidos, inclusive de itens e usuários inativos), W2-detalhe                 |
| BR2.8 | I2-listagem, I2-api-chamados                                                                       |
| BR2.9 | U2-visibilidade, U2-politica, I2-api-autorizacao                                                   |
| BR3.1 | U2-politica, I2-ciclo, I2-concorrencia, W2-regras, W2-fila                                         |
| BR3.2 | U2-politica, I2-ciclo, I2-api-chamados, W2-dialogos                                                |
| BR3.3 | U2-politica, I2-ciclo, I2-api-chamados, W2-dialogos                                                |
| BR3.4 | U2-politica, I2-ciclo, I2-api-chamados                                                             |
| BR3.5 | U2-politica, I2-ciclo, I2-api-chamados                                                             |
| BR3.6 | U2-politica, I2-ciclo, I2-api-chamados                                                             |
| BR3.7 | U2-politica, I2-ciclo, I2-api-chamados, W2-dialogos                                                |
| BR3.8 | U2-politica, I2-ciclo, I2-api-chamados, W2-regras                                                  |
| BR3.9 | U2-disponibilidade, I2-ciclo, I2-listagem, W2-regras, W2-fila, W2-detalhe                          |
| BR4.1 | U2-transicoes, I2-ciclo, I2-api-chamados                                                           |
| BR4.2 | I2-ciclo, I2-listagem                                                                              |
| BR4.3 | U2-janela, U2-politica, I2-ciclo, I2-api-chamados, W2-regras, W2-detalhe                           |
| BR4.4 | U2-transicoes, I2-publicos                                                                         |
| BR5.1 | I2-dados, I2-ciclo, I2-listagem, W2-detalhe                                                        |
| BR5.2 | I2-dados, I2-ciclo, I2-listagem, I2-api-chamados                                                   |
| BR5.3 | I2-listagem                                                                                        |
| BR6.1 | U2-destinatarios, I2-ciclo, I2-api-notificacoes                                                    |
| BR6.2 | U2-destinatarios, I2-ciclo, I2-api-notificacoes                                                    |
| BR6.3 | I2-transacao, I2-concorrencia (falha forçada no registro desfaz a ação), I2-publicos               |
| BR6.4 | I2-notificacoes, I2-api-notificacoes, I2-api-autorizacao, W2-sino, W2-notificacoes                 |
| BR6.5 | I2-api-notificacoes (notificação continua listada, chamado segue a visibilidade)                   |
| BR6.6 | I2-notificacoes, I2-api-notificacoes (o único efeito é a linha em `notifications`)                 |
| BR7.1 | I2-transacao, I2-publicos                                                                          |
| BR7.2 | I2-concorrencia (dois pedidos simultâneos de assumir)                                              |
| BR7.3 | I2-concorrencia (encerramentos e transições simultâneos)                                           |
| BR7.4 | I2-dados, I2-concorrencia (aberturas simultâneas)                                                  |
| BR8.1 | I2-publicos                                                                                        |
| BR8.2 | I2-publicos                                                                                        |
| BR8.3 | I2-publicos                                                                                        |
| BR8.4 | I2-publicos                                                                                        |
| BR8.5 | I2-listagem, I2-publicos, I2-api-chamados, W2-dialogos                                             |
| BR8.6 | I2-publicos (só contratos nas assinaturas; `onRequesterMessage` é o único método que grava)        |
| BR9.1 | W-regras, W-nav, W-casca, W-protegida, W-login-page                                                |
| BR9.2 | W2-meus (tabela e cartões); Manual 4.1 a 4.6                                                       |
| BR9.3 | W2-novo                                                                                            |
| BR9.4 | W2-regras, W2-detalhe                                                                              |
| BR9.5 | W2-fila                                                                                            |
| BR9.6 | W2-sino, W2-notificacoes                                                                           |
| BR9.7 | W2-dialogos                                                                                        |
| BR9.8 | W2-meus, W2-fila, W2-sino, W-lista                                                                 |
| BR9.9 | W2-detalhe (abas), W2-fila (teclado), W2-sino (foco e Escape), W2-novo (rótulos); Manual 1.x a 6.x |

## Critérios transversais relacionados à U2

| Critério                                               | Testes                                                        |
| ------------------------------------------------------ | ------------------------------------------------------------- |
| CT1 — nenhuma consulta devolve recurso de outro dono   | U2-visibilidade, I2-listagem, I2-publicos, I2-api-autorizacao |
| CT6 — 403 para ação negada, 404 para recurso invisível | I2-api-autorizacao, I2-api-chamados                           |
| CT7 — estados de carregamento, vazio e erro            | W2-meus, W2-fila, W2-sino, W-lista                            |
| CT8 — validação ao sair do campo e texto preservado    | W2-novo, W2-dialogos                                          |
| CT9 — notificação gravada no momento do evento         | U2-destinatarios, I2-ciclo, I2-api-notificacoes               |
| CT11 — mensagens traduzidas a partir do código de erro | W-mensagens, W2-detalhe, W2-fila, W2-dialogos                 |

## Resultado da execução final (Etapa 13)

Execução em 2026-09-15, com Node 24.11.1, npm 11.10.0 e o PostgreSQL de teste do Docker Compose (perfil `test`, porta ligada a `127.0.0.1:55432`). Os limiares são os do plano aprovado e nenhum foi alterado ou reduzido.

| Verificação                                             | Resultado                                                                                      |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `npm run lint`                                          | Sem erros                                                                                      |
| `npm run typecheck`                                     | Sem erros (`apps/api` e `apps/web`)                                                            |
| `npm run format:check`                                  | Todos os arquivos formatados                                                                   |
| `npm run openapi:check -w apps/api`                     | `openapi.json` atualizado, com as 16 operações da API-U2                                       |
| `npm audit --omit=dev --audit-level=high`               | 0 vulnerabilidades                                                                             |
| `npm audit --audit-level=high` (inclui dev, só reporta) | 0 vulnerabilidades                                                                             |
| API — unitários da U2                                   | 7 suítes, 74 testes aprovados                                                                  |
| API — integração da U2                                  | 10 suítes, 154 testes aprovados                                                                |
| API — portão combinado da U1 com a U2                   | 42 suítes, 519 testes aprovados                                                                |
| Web — comando da U2 (inclui `app/` da U1)               | 18 arquivos, 132 testes aprovados                                                              |
| Web — suíte completa                                    | 29 arquivos, 206 testes aprovados                                                              |
| `docker compose build api web`                          | Imagens construídas                                                                            |
| `docker compose up`                                     | Banco, API e web saudáveis; as duas migrações são aplicadas na subida, sem passo manual (NFR8) |

| Limiar                                                        | Exigido          | Medido                                                               |
| ------------------------------------------------------------- | ---------------- | -------------------------------------------------------------------- |
| API — linhas no código que não é andaime                      | 80%              | 97,43%                                                               |
| Guards — ramos por arquivo                                    | 90%              | 100% (menor valor entre 2 arquivos)                                  |
| Guards — linhas por arquivo                                   | 80%              | 100%                                                                 |
| Regras da U2 (`src/{tickets,notifications}/rules/**`) — ramos | 90%              | 100% (menor valor entre 7 arquivos)                                  |
| Regras da U2 — linhas por arquivo                             | 80%              | 100%                                                                 |
| Services — linhas por arquivo                                 | 80%              | menor valor 95,74% (`catalog/statuses.service.ts`)                   |
| Web — linhas globais                                          | 80%              | 94,73%                                                               |
| Por requisito                                                 | 1 teste por item | Todo critério e toda regra desta tabela têm teste ou item de roteiro |

Os arquivos de serviço da U2 medidos: `tickets.service.ts` 99,39% de linhas, `ticket-actions.service.ts` 98,36%, `tickets-public.service.ts` 96,46%, `notifications.service.ts` e `notifications-public.service.ts` 100%. As sete regras puras da U2 e o `transaction-runner.ts` ficaram em 100% de linhas e de ramos.
