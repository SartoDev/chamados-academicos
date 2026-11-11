# Gate de Cobertura entre Unidades — Build and Test

Derivado de `requirements.md` e `stories.md` (em `../../inception/`) e dos cinco `traceability.json` de `../u*/code-generation/`, com os `code-generation-plan.md`, `unit-test-instructions.md` e `code-summary.md` das mesmas pastas como contexto.

## Veredito

**PASS.**

| Conjunto enumerado | Total | Cobertos | Sem cobertura |
|---|---|---|---|
| Critérios de aceitação de três segmentos (`stories.md`) | 110 | 110 | 0 |
| Requisitos funcionais folha (`requirements.md`) | 58 | 58 | 0 |
| Requisitos não funcionais | 9 | ver seção própria | — |

## Como Cada Conjunto é Verificado

Os cinco `traceability.json` de geração de código registram **critérios de aceitação** e **regras de negócio**, nunca identificadores de requisito. A verificação respeita essa cadeia:

- **Critério de aceitação:** coberto quando ao menos uma unidade o registra com `status` `OK` e o arquivo-alvo citado existe em disco. As duas condições foram checadas; alvo citado e inexistente conta como falha, não como cobertura.
- **Requisito funcional:** coberto **transitivamente**, pela história que declara cobri-lo (linha `Cobre:` de `stories.md`) quando ao menos um critério daquela história está coberto. Requisito sem história que o declare conta como falha.
- **Requisito não funcional:** cada um tem critério de aceitação próprio em `requirements.md`, e nenhum é rastreado por identificador nos arquivos das unidades. Por isso recebem avaliação individual na seção própria, em vez de verdict mecânico.

## Requisitos Não Funcionais, um a um

| ID | Requisito | Critério declarado | Evidência | Situação |
|---|---|---|---|---|
| NFR1 | Ator filtrado dentro da própria cláusula de consulta | Revisão de código mais teste de IDOR por recurso com dono | Revisão de código das cinco unidades (todas `READY`) e testes de IDOR nas suítes de API | Verificado |
| NFR2 | Teste negativo de 403 em todo endpoint não público | Cobertura por requisito bloqueia a ausência | Suítes de API das cinco unidades, mais o teste de enumeração de rotas de U1 | Verificado |
| NFR3 | Envelope de erro único, sem vazar detalhe interno | Nenhum erro nativo do Prisma na resposta | Filtro global converte erro do Prisma; verificado nas suítes de API e na revisão de código de U5 | Verificado |
| NFR4 | Recurso invisível responde 404, não 403 | Teste para cada recurso com dono | Comparação de envelope campo a campo em `api-rating.spec.ts`; equivalentes em U2 e U3 | Verificado |
| NFR5 | WCAG 2.1 nível A nas telas do corte mínimo | Inspeção manual das telas | `docs/u*/roteiro-inspecao-manual.md`, datados e versionados — execução pendente do autor | Pendente do autor |
| NFR6 | Layout funcional em 375px, sem rolagem horizontal | Nenhuma tela do corte mínimo exige rolagem horizontal | `docs/u*/roteiro-inspecao-manual.md` — execução pendente do autor | Pendente do autor |
| NFR7 | Senha com hash resistente a força bruta | Inspeção do esquema e do código de autenticação | `apps/api/src/common/password-hasher.ts` e `schema.prisma`; coberto pelos testes de autenticação de U1 | Verificado |
| NFR8 | Subida completa com um único comando de composição | `docker compose up` deixa os três serviços operantes | `docker compose build api web` nesta etapa; migrações aplicadas na subida da imagem da API | Verificado |
| NFR9 | Nenhum segredo versionado; falha na inicialização sem variável obrigatória | Varredura de segredos no pipeline e teste de inicialização sem variável | Teste de configuração de U1; `gitleaks` é do pipeline de CI, etapa seguinte | Parcial: etapa seguinte |

## Requisitos Funcionais Folha

| Requisito | Situação | Histórias que o declaram | Exemplo de alvo coberto |
|---|---|---|---|
| FR1.1 | Coberto | US1.1 | `AC1.1.1` |
| FR1.2 | Coberto | US1.1 | `AC1.1.1` |
| FR1.3 | Coberto | US1.1 | `AC1.1.1` |
| FR1.4 | Coberto | US1.1 | `AC1.1.1` |
| FR1.5 | Coberto | US5.1 | `AC5.1.1` |
| FR2.1 | Coberto | US4.1 | `AC4.1.1` |
| FR2.2 | Coberto | US4.1 | `AC4.1.1` |
| FR2.3 | Coberto | US4.1 | `AC4.1.1` |
| FR2.4 | Coberto | US4.1 | `AC4.1.1` |
| FR2.5 | Coberto | US4.1 | `AC4.1.1` |
| FR2.6 | Coberto | US1.1, US4.1 | `AC1.1.1` |
| FR2.7 | Coberto | US2.1, US4.1 | `AC2.1.1` |
| FR3.1 | Coberto | US4.2 | `AC4.2.1` |
| FR3.2 | Coberto | US4.2 | `AC4.2.1` |
| FR3.3 | Coberto | US4.2 | `AC4.2.1` |
| FR3.4 | Coberto | US4.2 | `AC4.2.1` |
| FR3.5 | Coberto | US4.2 | `AC4.2.1` |
| FR3.6 | Coberto | US1.2, US4.2 | `AC1.2.1` |
| FR3.7 | Coberto | US1.2, US4.2 | `AC1.2.1` |
| FR4.1 | Coberto | US1.2 | `AC1.2.1` |
| FR4.2 | Coberto | US1.2 | `AC1.2.1` |
| FR4.3 | Coberto | US1.3 | `AC1.3.1` |
| FR4.4 | Coberto | US1.3 | `AC1.3.1` |
| FR4.5 | Coberto | US1.3 | `AC1.3.1` |
| FR4.6 | Coberto | US1.3, US2.3, US2.4, US3.1 | `AC1.3.1` |
| FR4.7 | Coberto | US2.3 | `AC2.3.1` |
| FR4.8 | Coberto | US1.3, US2.1 | `AC1.3.1` |
| FR5.1 | Coberto | US2.1 | `AC2.1.1` |
| FR5.2 | Coberto | US2.2 | `AC2.2.1` |
| FR5.3 | Coberto | US3.1 | `AC3.1.1` |
| FR5.4 | Coberto | US2.4 | `AC2.4.1` |
| FR5.5 | Coberto | US2.4 | `AC2.4.1` |
| FR5.6 | Coberto | US2.1 | `AC2.1.1` |
| FR5.7 | Coberto | US2.2 | `AC2.2.1` |
| FR6.1 | Coberto | US1.4, US2.2 | `AC1.4.1` |
| FR6.2 | Coberto | US1.4 | `AC1.4.1` |
| FR6.3 | Coberto | US1.4 | `AC1.4.1` |
| FR6.4 | Coberto | US1.4 | `AC1.4.1` |
| FR6.5 | Coberto | US2.1 | `AC2.1.1` |
| FR7.1 | Coberto | US1.5, US2.2, US2.4, US3.1 | `AC1.5.1` |
| FR7.2 | Coberto | US1.4, US2.2 | `AC1.4.1` |
| FR7.3 | Coberto | US1.6 | `AC1.6.1` |
| FR7.4 | Coberto | US1.5 | `AC1.5.1` |
| FR7.5 | Coberto | US1.5 | `AC1.5.1` |
| FR8.1 | Coberto | US2.3 | `AC2.3.1` |
| FR8.2 | Coberto | US2.2 | `AC2.2.1` |
| FR8.3 | Coberto | US1.6 | `AC1.6.1` |
| FR8.4 | Coberto | US1.6 | `AC1.6.1` |
| FR8.5 | Coberto | US2.3 | `AC2.3.1` |
| FR9.1 | Coberto | US4.1 | `AC4.1.1` |
| FR9.2 | Coberto | US4.2 | `AC4.2.1` |
| FR9.3 | Coberto | US4.2 | `AC4.2.1` |
| FR10.1 | Coberto | US6.1 | `AC6.1.1` |
| FR10.2 | Coberto | US6.1 | `AC6.1.1` |
| FR10.3 | Coberto | US6.1 | `AC6.1.1` |
| FR11.1 | Coberto | US6.2 | `AC6.2.1` |
| FR12.1 | Coberto | US6.3 | `AC6.3.1` |
| FR12.2 | Coberto | US6.3 | `AC6.3.1` |

## Critérios de Aceitação

| Critério | Situação | Unidade que cobre | Arquivo-alvo |
|---|---|---|---|
| AC1.1.1 | Coberto | U1 | `apps/api/test/integration/u1-foundation/api-auth.spec.ts` |
| AC1.1.2 | Coberto | U1 | `apps/api/test/integration/u1-foundation/api-auth.spec.ts` |
| AC1.1.3 | Coberto | U1 | `apps/api/test/integration/u1-foundation/api-auth.spec.ts` |
| AC1.1.4 | Coberto | U1 | `apps/api/test/integration/u1-foundation/api-auth.spec.ts` |
| AC1.1.5 | Coberto | U1 | `apps/api/test/integration/u1-foundation/api-auth.spec.ts` |
| AC1.1.6 | Coberto | U1 | `apps/web/src/features/auth/LoginForm.test.tsx` |
| AC1.1.7 | Coberto | U1 | `apps/api/test/integration/u1-foundation/api-auth.spec.ts` |
| AC1.2.1 | Coberto | U2 | `apps/web/src/features/tickets/NewTicketForm.test.tsx` |
| AC1.2.2 | Coberto | U2 | `apps/api/test/integration/u2-tickets/ticket-lifecycle.spec.ts` |
| AC1.2.3 | Coberto | U2 | `apps/api/test/integration/u2-tickets/ticket-lifecycle.spec.ts` |
| AC1.2.4 | Coberto | U2 | `apps/api/test/integration/u2-tickets/api-tickets.spec.ts` |
| AC1.2.5 | Coberto | U2 | `apps/api/test/integration/u2-tickets/api-tickets.spec.ts` |
| AC1.2.6 | Coberto | U2 | `apps/api/test/integration/u2-tickets/ticket-lifecycle.spec.ts` |
| AC1.3.1 | Coberto | U2 | `apps/api/test/integration/u2-tickets/ticket-listing.spec.ts` |
| AC1.3.2 | Coberto | U2 | `apps/api/test/integration/u2-tickets/ticket-listing.spec.ts` |
| AC1.3.3 | Coberto | U2 | `apps/web/src/features/tickets/MyTicketsPage.test.tsx` |
| AC1.3.4 | Coberto | U2 | `apps/web/src/features/tickets/TicketDetailPage.test.tsx` |
| AC1.3.5 | Coberto | U2 | `apps/api/test/integration/u2-tickets/ticket-listing.spec.ts` |
| AC1.3.6 | Coberto | U2 | `apps/api/test/integration/u2-tickets/ticket-lifecycle.spec.ts` |
| AC1.3.7 | Coberto | U2 | `apps/api/test/integration/u2-tickets/ticket-listing.spec.ts` |
| AC1.3.8 | Coberto | U2 | `apps/web/src/features/tickets/MyTicketsPage.test.tsx` |
| AC1.4.1 | Coberto | U3 | `apps/api/test/integration/u3-conversation/api-messages.spec.ts` |
| AC1.4.2 | Coberto | U3 | `apps/api/test/integration/u3-conversation/api-messages.spec.ts` |
| AC1.4.3 | Coberto | U3 | `apps/api/test/integration/u1-foundation/route-enumeration.spec.ts` |
| AC1.4.4 | Coberto | U3 | `apps/web/src/features/conversation/MessageComposer.test.tsx` |
| AC1.4.5 | Coberto | U3 | `apps/api/src/conversation/rules/message-recipients.spec.ts` |
| AC1.5.1 | Coberto | U2 | `apps/api/test/integration/u2-tickets/ticket-lifecycle.spec.ts` |
| AC1.5.2 | Coberto | U2 | `apps/api/test/integration/u2-tickets/notifications.spec.ts` |
| AC1.5.3 | Coberto | U2 | `apps/api/test/integration/u2-tickets/notifications.spec.ts` |
| AC1.5.4 | Coberto | U2 | `apps/api/test/integration/u2-tickets/notifications.spec.ts` |
| AC1.5.5 | Coberto | U2 | `apps/api/test/integration/u2-tickets/notifications.spec.ts` |
| AC1.5.6 | Coberto | U2 | `apps/api/src/notifications/rules/notification-recipients.spec.ts` |
| AC1.6.1 | Coberto | U2 | `apps/api/test/integration/u2-tickets/ticket-lifecycle.spec.ts` |
| AC1.6.2 | Coberto | U2 | `apps/api/src/tickets/rules/reopen-window.spec.ts` |
| AC1.6.3 | Coberto | U2 | `apps/api/test/integration/u2-tickets/ticket-lifecycle.spec.ts` |
| AC1.6.4 | Coberto | U2 | `apps/api/test/integration/u2-tickets/ticket-lifecycle.spec.ts` |
| AC1.6.5 | Coberto | U2 | `apps/api/test/integration/u2-tickets/ticket-lifecycle.spec.ts` |
| AC1.6.6 | Coberto | U2 | `apps/api/src/tickets/rules/ticket-action-policy.spec.ts` |
| AC1.6.7 | Coberto | U2 | `apps/api/test/integration/u2-tickets/ticket-lifecycle.spec.ts` |
| AC2.1.1 | Coberto | U2 | `apps/api/test/integration/u2-tickets/ticket-listing.spec.ts` |
| AC2.1.2 | Coberto | U2 | `apps/api/test/integration/u2-tickets/ticket-listing.spec.ts` |
| AC2.1.3 | Coberto | U2 | `apps/api/test/integration/u2-tickets/ticket-lifecycle.spec.ts` |
| AC2.1.4 | Coberto | U2 | `apps/api/src/tickets/rules/ticket-visibility.spec.ts` |
| AC2.1.5 | Coberto | U2 | `apps/api/test/integration/u2-tickets/ticket-listing.spec.ts` |
| AC2.1.6 | Coberto | U2 | `apps/web/src/features/tickets/SectorQueuePage.test.tsx` |
| AC2.1.7 | Coberto | U3 | `apps/api/test/integration/u3-conversation/api-messages.spec.ts` |
| AC2.2.1 | Coberto | U2 | `apps/api/test/integration/u2-tickets/ticket-lifecycle.spec.ts` |
| AC2.2.2 | Coberto | U2 | `apps/api/src/tickets/rules/ticket-action-policy.spec.ts` |
| AC2.2.3 | Coberto | U3 | `apps/api/test/integration/u3-conversation/api-messages.spec.ts` |
| AC2.2.4 | Coberto | U2 | `apps/api/test/integration/u2-tickets/ticket-lifecycle.spec.ts` |
| AC2.2.5 | Coberto | U3 | `apps/api/test/integration/u3-conversation/api-messages.spec.ts` |
| AC2.3.1 | Coberto | U2 | `apps/api/test/integration/u2-tickets/ticket-lifecycle.spec.ts` |
| AC2.3.2 | Coberto | U2 | `apps/api/test/integration/u2-tickets/public-services.spec.ts` |
| AC2.3.3 | Coberto | U2 | `apps/api/test/integration/u2-tickets/ticket-lifecycle.spec.ts` |
| AC2.3.4 | Coberto | U2 | `apps/api/src/tickets/rules/ticket-action-policy.spec.ts` |
| AC2.3.5 | Coberto | U2 | `apps/api/src/tickets/rules/ticket-transitions.spec.ts` |
| AC2.3.6 | Coberto | U2 | `apps/api/test/integration/u2-tickets/ticket-lifecycle.spec.ts` |
| AC2.4.1 | Coberto | U2 | `apps/api/test/integration/u2-tickets/ticket-lifecycle.spec.ts` |
| AC2.4.2 | Coberto | U2 | `apps/api/src/tickets/rules/ticket-action-policy.spec.ts` |
| AC2.4.3 | Coberto | U2 | `apps/api/test/integration/u2-tickets/api-tickets.spec.ts` |
| AC2.4.4 | Coberto | U2 | `apps/api/test/integration/u2-tickets/ticket-lifecycle.spec.ts` |
| AC2.4.5 | Coberto | U2 | `apps/api/test/integration/u2-tickets/ticket-lifecycle.spec.ts` |
| AC2.4.6 | Coberto | U2 | `apps/api/src/tickets/rules/ticket-action-policy.spec.ts` |
| AC2.4.7 | Coberto | U2 | `apps/api/test/integration/u2-tickets/data-model.spec.ts` |
| AC3.1.1 | Coberto | U2 | `apps/api/test/integration/u2-tickets/ticket-lifecycle.spec.ts` |
| AC3.1.2 | Coberto | U2 | `apps/api/src/tickets/rules/ticket-action-policy.spec.ts` |
| AC3.1.3 | Coberto | U2 | `apps/api/test/integration/u2-tickets/ticket-lifecycle.spec.ts` |
| AC3.1.4 | Coberto | U2 | `apps/api/src/tickets/rules/ticket-action-policy.spec.ts` |
| AC3.1.5 | Coberto | U2 | `apps/api/test/integration/u2-tickets/ticket-lifecycle.spec.ts` |
| AC4.1.1 | Coberto | U1 | `apps/api/test/integration/u1-foundation/api-users.spec.ts` |
| AC4.1.2 | Coberto | U1 | `apps/api/test/integration/u1-foundation/api-users.spec.ts` |
| AC4.1.3 | Coberto | U1 | `apps/api/test/integration/u1-foundation/api-auth.spec.ts` |
| AC4.1.4 | Coberto | U1 | `apps/api/test/integration/u1-foundation/api-auth.spec.ts` |
| AC4.1.5 | Coberto | U1 | `apps/api/test/integration/u1-foundation/api-auth.spec.ts` |
| AC4.1.6 | Coberto | U1 | `apps/api/test/integration/u1-foundation/api-users.spec.ts` |
| AC4.1.7 | Coberto | U1 | `apps/api/test/integration/u1-foundation/authorization.spec.ts` |
| AC4.1.8 | Coberto | U1 | `apps/api/test/integration/u1-foundation/route-enumeration.spec.ts` |
| AC4.1.9 | Coberto | U1 | `apps/api/test/integration/u1-foundation/api-users.spec.ts` |
| AC4.2.1 | Coberto | U1 | `apps/api/test/integration/u1-foundation/api-catalog.spec.ts` |
| AC4.2.2 | Coberto | U1 | `apps/api/test/integration/u1-foundation/api-catalog.spec.ts` |
| AC4.2.3 | Coberto | U1 | `apps/api/test/integration/u1-foundation/api-catalog.spec.ts` |
| AC4.2.4 | Coberto | U2 | `apps/api/test/integration/u2-tickets/ticket-listing.spec.ts` |
| AC4.2.5 | Coberto | U1 | `apps/api/test/integration/u1-foundation/api-catalog.spec.ts` |
| AC4.2.6 | Coberto | U1 | `apps/web/src/app/components/ConfirmDeactivateDialog.test.tsx` |
| AC5.1.1 | Coberto | U1 | `apps/api/test/integration/u1-foundation/authorization.spec.ts` |
| AC5.1.2 | Coberto | U1 | `apps/api/test/integration/u1-foundation/authorization.spec.ts` |
| AC5.1.3 | Coberto | U1 | `apps/api/test/integration/u1-foundation/authorization.spec.ts` |
| AC5.1.4 | Coberto | U1 | `apps/api/test/integration/u1-foundation/route-enumeration.spec.ts` |
| AC5.2.1 | Coberto | U2 | `apps/api/test/integration/u2-tickets/ticket-listing.spec.ts` |
| AC5.2.2 | Coberto | U2 | `apps/api/test/integration/u2-tickets/ticket-listing.spec.ts` |
| AC5.3.1 | Coberto | U1 | `docs/u1-foundation/roteiro-inspecao-manual.md` |
| AC5.3.2 | Coberto | U1 | `docs/u1-foundation/roteiro-inspecao-manual.md` |
| AC5.3.3 | Coberto | U1 | `apps/web/src/app/components/shared-components.test.tsx` |
| AC5.3.4 | Coberto | U1 | `apps/web/src/features/admin/users/UsersTab.test.tsx` |
| AC5.3.5 | Coberto | U1 | `docs/u1-foundation/roteiro-inspecao-manual.md` |
| AC5.3.6 | Coberto | U1 | `docs/u1-foundation/roteiro-inspecao-manual.md` |
| AC5.4.1 | Coberto | U1 | `docs/u1-foundation/roteiro-inspecao-manual.md` |
| AC5.4.2 | Coberto | U2 | `apps/web/src/features/tickets/MyTicketsPage.test.tsx` |
| AC5.4.3 | Coberto | U1 | `docs/u1-foundation/roteiro-inspecao-manual.md` |
| AC5.4.4 | Coberto | U1 | `docs/u1-foundation/roteiro-inspecao-manual.md` |
| AC6.1.1 | Coberto | U4 | `apps/api/test/integration/u4-reporting/ticket-aggregations.spec.ts` |
| AC6.1.2 | Coberto | U4 | `apps/api/test/integration/u4-reporting/ticket-aggregations.spec.ts` |
| AC6.1.3 | Coberto | U4 | `apps/api/test/integration/u4-reporting/ticket-aggregations.spec.ts` |
| AC6.1.4 | Coberto | U4 | `apps/api/test/integration/u4-reporting/ticket-aggregations.spec.ts` |
| AC6.1.5 | Coberto | U4 | `apps/web/src/features/reports/DurationCard.test.tsx` |
| AC6.2.1 | Coberto | U4 | `apps/api/test/integration/u4-reporting/reporting-service.spec.ts` |
| AC6.2.2 | Coberto | U4 | `apps/api/test/integration/u4-reporting/api-reports.spec.ts` |
| AC6.3.1 | Coberto | U5 | `apps/api/test/integration/u5-rating/api-rating.spec.ts` |
| AC6.3.2 | Coberto | U5 | `apps/api/test/integration/u5-rating/rating-service.spec.ts` |
| AC6.3.3 | Coberto | U5 | `apps/api/test/integration/u5-rating/rating-service.spec.ts` |

## Elementos sem Cobertura

Nenhum. Todos os 110 critérios de aceitação de três segmentos e os 58 requisitos funcionais folha estão cobertos, com arquivo-alvo existente em disco.

## Observações de Enumeração

- **`FR4.9` não é requisito.** O identificador aparece na prosa de `requirements.md`, mas não existe como linha de requisito em tabela alguma. É o mesmo identificador fantasma que a verificação de fronteira de fase apontou no Planejamento de Entrega. Não entra na enumeração, e não conta como lacuna.
- **Entradas `N/A` e `Deferred` não contam como cobertura.** Um critério registrado apenas assim conta como falha; nenhuma das 110 linhas caiu nesse caso, porque cada `N/A` de uma unidade tem `OK` correspondente em outra.
- **Os totais por unidade** nos cinco arquivos somam 407 entradas: 331 `OK`, 71 `N/A` e 5 `Deferred`. Os `Deferred` são de U1, declarando o que ficou para unidades seguintes.
