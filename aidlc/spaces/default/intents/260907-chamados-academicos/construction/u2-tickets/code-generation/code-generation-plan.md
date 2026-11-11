# Plano de Geração de Código — U2 Chamados (`u2-tickets`)

Derivado de `functional-spec.md`, `rules.md`, `entities.md` e `frontend-components.md` (em `../functional-design/`), `contract-summary.md` (X-01, API-U2, SVC-01, SVC-03, SVC-05, SVC-07, DB-01), `unit-of-work.md`, `requirements.md`, do código de U1 já existente em `apps/api` e `apps/web`, e das práticas afirmadas em `team.md` e `project.md`.

O código vai para a raiz do repositório (`apps/api`, `apps/web`, `docs/`), nunca para a pasta de registro. Identificadores, código e comentários de código ficam em inglês; textos exibidos ao usuário ficam em português.

## Premissas de Execução

- **Área de trabalho com U1 pronta.** `apps/api` e `apps/web` já têm a fundação de U1. O repositório Git local está no ramo `main`, sem commits. Nenhum commit, push ou pull request acontece nesta geração sem pedido explícito do autor.
- **Linha de base verde.** Antes de qualquer mudança, lint, `typecheck` e os testes de U1 precisam passar. Se não passarem, a geração para e reporta.
- **Arquivos de U1 alterados por U2, só por adição ou pela decisão BR9.1.**
  - `apps/api/prisma/schema.prisma`: modelos de U2 e relações inversas nos modelos de U1; as colunas de chave estrangeira ficam só nas tabelas de U2 (DB-01).
  - `apps/api/src/app.module.ts`: registro de `TicketsModule` e `NotificationsModule`.
  - `apps/api/src/common/errors/error-codes.ts`: códigos de U2.
  - `apps/api/src/common/prisma/`: `TransactionRunner`.
  - `apps/api/src/users/users-public.service.ts`: método `findAssignableInSector`.
  - `apps/api/src/users/users-public.service.ts` e `apps/api/src/catalog/catalog-public.service.ts`: leituras pelo cliente da transação ambiente.
  - `apps/api/jest.shared.ts`: nova chave de limiar.
  - `apps/api/test/integration/u1-foundation/support/database.ts`: limpeza das tabelas de U2.
  - `apps/web`: `navigation.ts`, `AppRoutes.tsx`, `TopBar.tsx`, `i18n/error-code-messages.ts` e `api/types.ts`.
  - Remoção de `ProvisionalHomePage.tsx` e do item "Início" (BR9.1).
  - Testes de U1 afetados pela remoção de "Início" são ajustados à nova navegação, sem remover nem enfraquecer o que verificam.
- **Transação ambiente (BR7.1, Q5; achado R-01 da revisão do desenho funcional).** Mecanismo:
  - `TransactionRunner`, em `apps/api/src/common/prisma/transaction-runner.ts`, é provido e exportado pelo `PrismaModule` global.
  - Ele guarda o cliente transacional do Prisma num `AsyncLocalStorage` do Node e expõe dois métodos: `run<T>(work: () => Promise<T>): Promise<T>` e `db()`.
  - `run` abre uma transação interativa quando não há transação ativa. Quando já existe uma, só executa `work`, que participa da existente.
  - `db()` devolve o cliente da transação ativa ou, fora dela, o `PrismaService`.
  - Toda operação de escrita de U2 (abrir, assumir, atribuir, transferir, aguardar solicitante, encerrar, reabrir, alterar prioridade, registrar e marcar notificação) roda dentro de `run`. Como cada requisição de escrita executa uma única operação, a transação é por requisição.
  - Services de U2 e os services públicos de U1 chamados por U2 leem e gravam por `db()`.
  - Nenhuma assinatura pública recebe parâmetro novo nem expõe tipo do Prisma (X-01, Q3).
  - U3 envolverá `sendMessage` em `run`, e `onRequesterMessage` participará da mesma transação.
  - As transações próprias de U1 com lock consultivo não mudam.
- **Concorrência (BR7.2, BR7.3, BR7.4).**
  - Toda ação sobre um chamado, dentro da transação, aplica a visibilidade e bloqueia a linha do chamado com `SELECT ... FOR UPDATE`.
  - O estado é relido depois do bloqueio, antes de avaliar as regras; assim, duas ações simultâneas sobre o mesmo chamado executam uma depois da outra.
  - O número visível vem de uma sequência do Postgres (`autoincrement`), única sem verificação na aplicação.
- **Máquina de transições pura (ADR-006, `team.md`).** `apps/api/src/tickets/rules/ticket-transitions.ts` não importa nada de NestJS nem de Prisma. As demais regras de decisão de U2 também ficam em `apps/api/src/tickets/rules/` e `apps/api/src/notifications/rules/`, como funções sem acesso a banco.
- **Sem camada de repositório.** Os services são o único ponto que toca o banco (`team.md`). A camada "Repository / data access" do contrato de testes é omitida.
- **Ciclo entre blocos.** `TicketsModule` importa `NotificationsModule` para registrar notificações. `NotificationsModule` não importa `TicketsModule`: lê número e título do chamado pela relação, que é tabela da própria U2 (DB-01).
- **Tipos de U1 consumidos.** Dos rótulos de status de `findLabels`, U2 usa só `id` e `name`; a ausência de `active` (achado R-01 da geração de código de U1) não afeta U2.
- **Achado R-02 do desenho funcional.** O recorte "não atribuídos" segue BR2.6 sem mudança. A marca de responsável indisponível aparece nos recortes "todos" e "meus".
- **Achado R-03 do desenho funcional.** U2 não emite nem escuta `AppEvents`. O único evento de U1 (`user.password-reset`) só zera o limitador de login em memória: não toca tabelas de U2 nem a transação ambiente.
- **Fora de U2 por decisão registrada.** `countTickets` e `getDurationAverages` de SVC-05 entram no Bolt de U4. A aba Conversa e as mensagens são de U3.
- **Estado inalcançável por HTTP.** A restrição de U1 que exige setor para Atendente e Gestor impede, pela API, o caso de `TICKET_QUEUE_NO_SECTOR`. O código existe e é verificado por teste de regra e de service com ator sintético.
- **Migração.** A migração de U2 é criada sem aplicar (`--create-only`) e revisada antes de aplicada, para garantir que não remova restrições de U1 criadas em SQL (`citext`, `CHECK`, índice parcial).
- **Docker.** Os testes de integração exigem o daemon do Docker ativo e o serviço `postgres-test` ligado a `127.0.0.1`.

## Cobertura: Obrigações Somadas

O contrato de testes traz, pelo escopo `feature`, um piso de **80% de cobertura de linha**. `team.md` afirma **cobertura por requisito** e limiares por caminho. Nenhum valor existente é alterado ou relaxado; U2 só acrescenta uma chave.

- **Global:** 80% de linhas sobre o código que não é andaime, com as mesmas exclusões de U1.
- **Por caminho, existentes:** 90% de ramos e 80% de linhas em `apps/api/src/**/guards/**`; 80% de linhas em `apps/api/src/**/*.service.ts`.
- **Por caminho, nova:** 90% de ramos e 80% de linhas em `apps/api/src/{tickets,notifications}/rules/**`, onde ficam as regras de autorização e visibilidade de U2. A chave é aplicada nas mesmas configurações que já aplicam o limiar de guards.
- **Por requisito:** todo critério de aceitação e toda regra BR de U2 com ao menos um teste, registrado na tabela requisito → teste do repositório.
- **Onde os limiares são verificados.** Os comandos restritos a U2 de `unit-test-instructions.md` servem para desenvolver e rodar os testes de U2. Os limiares são verificados no portão completo da API e do frontend, com cobertura, no Step 13.

## Testing Contract

```json
{
  "version": 1,
  "methodology": "test-after",
  "source": "team",
  "ordering": "para cada camada testável de uma Unidade (regras de domínio, services no backend, componentes e hooks no frontend), implementamos a camada primeiro e só depois escrevemos e rodamos os testes daquela camada, antes de seguir para a próxima, dentro do mesmo Bolt.",
  "scope": "feature",
  "test_strategy": "standard",
  "project_type": "greenfield",
  "applicable_notes": [
    {
      "layer": "org",
      "text": "We treat tests as a first-class deliverable in every Bolt. The specific\nmethodology (TDD, BDD, ATDD, or classic test-after) is affirmed at\npractices-discovery and recorded in `team.md` under this heading with explicit\n`Methodology` and `Ordering` fields; Code Generation resolves those fields\nindependently from coverage, tooling, and scope notes.\n\nWhen no posture has been affirmed, our default per scope is:\n- **Methodology**: test-after\n- **Ordering**: implement each applicable testable layer, then write and run\n  that layer's tests.\n- `mvp`, `enterprise`, `feature`, `infra`, `classic` add an 80% line-coverage\n  floor and CI execution before merge.\n- `bugfix`, `security-patch` add a targeted regression for the specific\n  bug/vulnerability and require the existing suite to remain green.\n- `express` uses the Minimal strategy: requirement-driven unit tests (one per\n  requirement, with a happy-path floor per component); existing tests remain\n  green.\n- `poc`, `refactor`, `workshop` add no extra new-test floor and require the\n  existing suite to remain green.\n\nThe active `Test Strategy` still applies in every scope and determines test\nvolume/types. Scope floors are additive; they never reduce or replace the\nselected strategy.\n\nBuild and Test verifies defined coverage floors and affirmed quality targets;\nthey may not be weakened to make a step pass.\n\nAffirm a stricter posture in `team.md` if the team commits to one."
    },
    {
      "layer": "team",
      "text": "- **Methodology**: test-after\n- **Ordering**: para cada camada testável de uma Unidade (regras de domínio, services no backend, componentes e hooks no frontend), implementamos a camada primeiro e só depois escrevemos e rodamos os testes daquela camada, antes de seguir para a próxima, dentro do mesmo Bolt.\n- Cobertura: substituímos o piso padrão de 80% de cobertura de linha global de `org.md` por dois critérios que valem como portão. **Critério principal**: cobertura por requisito — cada requisito aprovado do corte mínimo precisa de pelo menos um teste automatizado que o verifique, com uma tabela de rastreabilidade (requisito → teste) mantida no repositório. **Critério mecânico do CI**: limiares de cobertura por caminho — 90% de cobertura de ramo (branch) em guards e regras de autorização, 80% em services, sem piso em código de andaime (`main.ts`, módulos, DTOs, `prisma.service.ts`) e em componentes de UI do Shadcn. Não há percentual global de linha afirmado como fato deste projeto.\n- Ferramental: Jest com `@swc/jest` no backend (NestJS/Prisma) — Vitest não é usado no backend porque compila via esbuild, que não emite `emitDecoratorMetadata`, quebrando a injeção de dependência do NestJS. Vitest com Testing Library no frontend (React/Vite). Postgres real, rodando como serviço de teste no Docker Compose, para os testes de integração — sem mock do Prisma nos caminhos de negócio.\n- Verificação dos cinco perfis de acesso (aluno, professor, atendente, gestor, administrador): feita por teste de API, com Supertest contra uma aplicação NestJS real e Postgres real — não por teste de navegador. Não há Playwright nem qualquer teste automatizado de navegador (E2E) no projeto, nem como material de demonstração fora do portão.\n- Testes negativos de autorização são obrigatórios: para cada endpoint não público, ao menos um teste afirmando `403` para um perfil que não deve acessá-lo, e para todo recurso com dono, ao menos um teste de IDOR confirmando que um usuário não lê o registro de outro."
    }
  ],
  "obligations": {
    "strategy": "standard",
    "strategy_volume": [
      "Five to eight tests per component.",
      "Unit tests plus integration tests for key boundaries.",
      "Add E2E, performance, or security tests when requirements demand them."
    ],
    "scope_floor": [
      "Meet an 80% line-coverage floor.",
      "Run the selected tests in CI before merge."
    ],
    "combination_rule": "Apply every selected-strategy obligation and every scope-floor obligation; neither replaces the other, and a targeted scope regression may add the narrowest necessary test type beyond the strategy default."
  },
  "plan_profile": {
    "methodology": "test-after",
    "runner_step": "Bootstrap the minimal test runner/configuration and record the exact unit-scoped command.",
    "runner_ready_before_first_test": true,
    "testable_layers": [
      "Data model / database behavior",
      "Repository / data access",
      "Business logic",
      "API / endpoint",
      "Frontend behavior"
    ],
    "steps": [
      "Project structure and production configuration skeleton.",
      "Bootstrap the minimal test runner/configuration and record the exact unit-scoped command.",
      "Data model / database behavior - implement.",
      "Data model / database behavior - write and run its tests after implementation.",
      "Repository / data access - implement.",
      "Repository / data access - write and run its tests after implementation.",
      "Business logic - implement.",
      "Business logic - write and run its tests after implementation.",
      "API / endpoint - implement.",
      "API / endpoint - write and run its tests after implementation.",
      "Frontend behavior - implement.",
      "Frontend behavior - write and run its tests after implementation.",
      "Environment/build configuration.",
      "Documentation and traceability."
    ]
  },
  "input_sha256": "sha256:8fdafecf7e0d7dec54211b4b2cb6e44d9cae898f5acaaa53b76fd1ccdb022b7e",
  "contract_sha256": "sha256:d3b8dd6c82c27014d2f7fd44fcb7730d766e052f3ebadc0f0b456cda2c90eadc"
}
```

## Passos

A ordem segue o `plan_profile` do contrato: estrutura, prontidão do executor de testes e, para cada camada testável, implementar e depois testar. A camada "Repository / data access" é omitida (Premissas).

### Step 1 — Estrutura da unidade e esqueleto de configuração

- [ ] Conferir Node.js, npm, Docker, Docker Compose e Git; rodar `npm run lint`, `npm run typecheck` e os testes unitários de U1 como linha de base; parar e reportar se algo faltar ou falhar.
- [ ] `apps/api/src/tickets/` e `apps/api/src/notifications/` com `TicketsModule` e `NotificationsModule` vazios, registrados em `AppModule`.
- [ ] `TransactionRunner` com `AsyncLocalStorage`, provido e exportado pelo `PrismaModule` (Premissas).
- [ ] Códigos de U2 no catálogo de erros, com os status HTTP de X-01: `TICKET_NOT_FOUND`, `TICKET_INVALID_TRANSITION`, `TICKET_ALREADY_ASSIGNED`, `TICKET_REOPEN_WINDOW_EXPIRED`, `TICKET_CLOSED`, `TICKET_ASSIGNEE_NOT_IN_SECTOR`, `TICKET_TRANSFER_SAME_SECTOR`, `TICKET_QUEUE_NO_SECTOR`, `NOTIFICATION_NOT_FOUND`.
- [ ] `apps/web/src/features/tickets/` e `apps/web/src/features/notifications/` com os clientes de API de U2; tipos de API-U2 em `app/api/types.ts`.

### Step 2 — Prontidão dos executores de teste

- [ ] Acrescentar em `apps/api/jest.shared.ts` a chave de limiar de `src/{tickets,notifications}/rules/**/*.ts` (90% de ramos, 80% de linhas), sem alterar valores nem chaves existentes, nas mesmas configurações que aplicam o limiar de guards.
- [ ] Suporte de integração de U2 em `apps/api/test/integration/u2-tickets/support/`: fábricas de chamado, passagem e notificação com nomes significativos, reaproveitando as fábricas de U1.
- [ ] Limpeza compartilhada do banco de teste: tabelas de U2 antes das de U1, respeitando as chaves estrangeiras, para que as suítes de U1 e U2 continuem independentes de ordem.
- [ ] Rodar os comandos restritos a U2 de `unit-test-instructions.md` com `--passWithNoTests` e confirmar que funcionam antes do primeiro teste real.

### Step 3 — Modelo de dados: implementar

- [ ] Modelos `Ticket`, `TicketHistoryEntry`, `TicketSectorPassage` e `Notification` conforme `entities.md`:
  - tabelas `tickets`, `ticket_history_entries`, `ticket_sector_passages` e `notifications`;
  - enums `TicketHistoryField` (STATUS, ASSIGNEE, SECTOR, PRIORITY) e `NotificationKind` (MESSAGE_RECEIVED, STATUS_CHANGED, ASSIGNEE_CHANGED, SECTOR_CHANGED, TICKET_REOPENED);
  - `Ticket.number` inteiro único gerado por sequência;
  - UUID em todo identificador e chaves estrangeiras com `ON DELETE RESTRICT`.
- [ ] Índices para as consultas de visibilidade e listagem:
  - `tickets(requester_id)`, `tickets(sector_id, assignee_id)` e `tickets(updated_at)`;
  - `ticket_sector_passages(sector_id, ticket_id)` e `ticket_history_entries(ticket_id, occurred_at)`;
  - `notifications(recipient_id, read, created_at)`.
- [ ] Migração `u2_tickets` criada com `--create-only` e revisada, com restrições em SQL:
  - título de 5 a 120 e descrição de 10 a 2000 caracteres;
  - na passagem, `left_at`, `justification` e `transferred_by_id` todos presentes ou todos ausentes;
  - índice único parcial de uma única passagem aberta por chamado;
  - `justification` da entrada de histórico presente exatamente quando `field = SECTOR`;
  - `previous_value` e `new_value` nunca ambos nulos nem iguais;
  - `read_at` presente exatamente quando `read` é verdadeiro;
  - nenhuma restrição de U1 removida.

### Step 4 — Modelo de dados: escrever e rodar os testes

- [ ] Integração contra Postgres real:
  - números distintos e crescentes em aberturas simultâneas (BR1.6, BR7.4);
  - recusa de cada linha que viola uma restrição do Step 3;
  - segunda passagem aberta recusada;
  - chaves estrangeiras impedem apagar usuário, setor, categoria, status ou prioridade referenciados.
- [ ] Suíte de modelo de dados de U1 continua verde depois da migração de U2.

### Step 5 — Lógica de negócio: implementar

- [ ] **Regras puras** em `apps/api/src/tickets/rules/`:
  - `ticket-transitions.ts`: as nove transições de BR4.1, com a ação que dispara cada uma, e a transferência de chamado Aberto sem transição;
  - `ticket-action-policy.ts`: BR1.1, BR2.3, BR2.9, BR3.1 a BR3.8 e BR4.3, devolvendo permissão ou o código de recusa;
  - `reopen-window.ts`: 72 horas desde `closedAt`, com a fonte de tempo `Clock`;
  - `assignee-availability.ts`: BR3.9, a partir do resumo de usuário de U1 e do setor atual;
  - `ticket-reference.ts`: `#` seguido do número;
  - `ticket-visibility.ts`: condição de consulta de BR2.1 a BR2.3 e dos recortes de BR2.6.
- [ ] **Regras puras** em `apps/api/src/notifications/rules/notification-recipients.ts`: destinatários e tipo por operação, com o ator sempre retirado e um aviso por destinatário (BR6.1, BR6.2).
- [ ] **`TicketsService`**, para WF1 e WF2:
  - abertura com categoria disponível, setor derivado e prioridade ativa ou padrão (BR1.2 a BR1.5);
  - listagens por `view` e `queue`, com filtros, ordenação e paginação (BR2.5, BR2.6);
  - detalhe, histórico e passagens com nomes resolvidos por `findLabels` e `findSummariesByIds`, marca de responsável indisponível e justificativa nas entradas de setor (BR2.7, BR2.8, BR5.1, BR5.3).
- [ ] **`TicketActionsService`**, para WF3 a WF9. Cada operação:
  - roda em `TransactionRunner.run`, aplica a visibilidade e bloqueia a linha do chamado;
  - avalia a política e a transição;
  - grava a mudança, as entradas de histórico, as passagens e as notificações na mesma transação (BR3.1 a BR3.9, BR4.1 a BR4.3, BR5.1, BR5.2, BR6.1 a BR6.3, BR7.1 a BR7.3).
- [ ] **`TicketsPublicService`**, exportado por `TicketsModule`:
  - `getVisibleTicket` (BR8.1);
  - `onRequesterMessage`, com o retorno automático e sem notificação própria (BR4.4, BR8.2);
  - `searchTickets` (BR8.3).
- [ ] **`NotificationsService`**: listagem, contagem de não lidas, marcar uma e marcar todas, só as do ator (BR6.4). **`NotificationsPublicService.record`**: um aviso por destinatário distinto, dentro da transação ambiente (BR8.4).
- [ ] **U1:** `UsersPublicService.findAssignableInSector(sectorId)`, com id e nome de usuários ativos Atendente ou Gestor do setor (BR8.5, BR8.3 de U1); leituras dos services públicos de U1 pelo cliente de `TransactionRunner.db()`.

### Step 6 — Lógica de negócio: escrever e rodar os testes

- [ ] Unitários, de 5 a 8 por componente:
  - transições: as nove válidas e todas as combinações inválidas de status e ação;
  - política de ações: caso permitido e recusado de cada regra, para os cinco perfis, inclusive leitura por passagem e Administrador;
  - janela de reabertura com relógio falso: 71h59 aceita e 72h00 recusada (AC1.6.2);
  - destinatários: ator nunca incluído, um aviso por destinatário, tipo escolhido pela ordem de BR6.1;
  - visibilidade por perfil, inclusive ator sem setor;
  - disponibilidade do responsável e formato da referência.
- [ ] Integração contra Postgres real:
  - `TransactionRunner`: participação aninhada, falha depois de gravar desfaz tudo, transações independentes em paralelo;
  - fluxos WF1 a WF10 com histórico, passagens e notificações gravados;
  - falha forçada no registro de notificação desfaz a mudança do chamado (BR6.3);
  - dois pedidos simultâneos de assumir resultam em um sucesso e um `TICKET_ALREADY_ASSIGNED` (BR7.2);
  - duas transições simultâneas não se sobrepõem (BR7.3);
  - `getVisibleTicket` com recusa idêntica para inexistente e invisível;
  - `onRequesterMessage` dentro de uma transação que simula U3;
  - `searchTickets` com a visibilidade de cada perfil;
  - notificações: só as próprias, marcar alheia com 404, marcação idempotente;
  - `findAssignableInSector`.

### Step 7 — API: implementar

- [ ] Controllers de API-U2, com DTOs validados, parâmetros UUID e `@Roles` conforme BR2.9:
  - `TicketsController`: `listTickets` (com `view` requested, queue ou all e `queue` unassigned, mine, all ou passed; cada `view` limitado aos seus perfis), `openTicket`, `getTicket`, `listTicketHistory`, `listTicketSectorPassages` e `GET /tickets/{ticketId}/assignable-users`;
  - `TicketActionsController`: assume, assign, transfer, wait-for-requester, close, reopen e priority;
  - `NotificationsController`: list, unread-count, read e read-all.
- [ ] DTOs removem espaços nas pontas e aplicam os limites de BR1.2 e BR3.3. Campos desconhecidos são descartados, inclusive setor na abertura (AC1.2.5).
- [ ] Respostas conforme API-U2, com as divergências aditivas registradas no desenho funcional:
  - `reference` no formato `#n`;
  - `assigneeUnavailable` e `justification` no histórico;
  - novos valores de `view` e `queue`;
  - nova operação de quem pode receber atribuição.
- [ ] `apps/api/openapi.json` regenerado; `openapi:check` passa.

### Step 8 — API: escrever e rodar os testes

- [ ] Integração com Supertest contra a aplicação NestJS real e Postgres real, em `apps/api/test/integration/u2-tickets/`:
  - caminho feliz de cada operação de API-U2;
  - 401 sem sessão e 403 para cada perfil sem direito em cada endpoint novo, inclusive cada valor de `view`, cobrindo os cinco perfis (NFR2);
  - acesso alheio: detalhe, histórico, passagens, encerrar e reabrir chamado de outro solicitante; chamado de setor sem passagem para Atendente e Gestor; notificação de outro usuário — todos com 404;
  - corpo idêntico para identificador inexistente e existente invisível, ignorando `traceId` (AC5.2.2);
  - chamado que passou pelo setor legível e sem ações (AC2.1.3, BR3.8); Administrador lê e não age (BR2.3);
  - transição inválida com 409; reabertura na fronteira de 72 horas com relógio falso na aplicação de teste;
  - 422 de transferência para o mesmo setor e de atribuição fora do setor; 403 `TICKET_CLOSED` em chamado encerrado;
  - 409 `TICKET_ALREADY_ASSIGNED` com o responsável atual em `details`;
  - notificação gravada para os destinatários certos e nunca para o ator.
- [ ] O teste de enumeração de rotas de U1 continua verde com as rotas novas (AC5.1.3, AC5.1.4).

### Step 9 — Frontend: implementar

- [ ] Navegação e entrada por perfil (BR9.1):
  - "Meus Chamados" para Aluno e Professor, "Fila do Setor" para Atendente e Gestor, "Chamados" e "Administração" para Administrador;
  - `entryPathForRole` por perfil; rotas protegidas por perfil;
  - remoção de "Início" e da tela provisória.
- [ ] `features/tickets`, conforme `frontend-components.md`:
  - `MyTicketsPage`, com tabela a partir de 768px e cartões abaixo;
  - `NewTicketPage` e `NewTicketForm`;
  - `TicketDetailPage`, com `TicketHeader`, `TicketActions`, `ConfirmStatusActionDialog`, `TransferDialog`, `AssignDialog`, `PriorityDialog`, e `TicketTabs` (Detalhes e Histórico, com ponto de extensão para a aba Conversa de U3);
  - `SectorQueuePage` com recortes e filtros na URL; `AllTicketsPage`;
  - compartilhados `TicketStatusBadge`, `PriorityBadge` e `AssigneeCell`.
- [ ] `features/notifications`: `NotificationBell` na barra superior, no lugar do botão desabilitado; `NotificationsPanel` como diálogo; `NotificationsPage`.
- [ ] Traduções em português de todos os códigos de U2 (CT11). Estados de carregamento, vazio e erro com `ListState` (BR9.8). `data-testid` em todo elemento interativo. Tema padrão do Shadcn, sem sobrescrever cores (AC5.3.6).

### Step 10 — Frontend: escrever e rodar os testes

- [ ] Vitest com Testing Library, de 5 a 8 por componente:
  - navegação e entrada por perfil, com os testes de U1 ajustados à remoção de "Início";
  - `NewTicketForm`: setor derivado, contador e limites, prioridade padrão, erro de catálogo preservando o texto;
  - `MyTicketsPage`: filtros preservados ao paginar, vazio com botão, erro com repetir;
  - `TicketActions`: ações por perfil e condição, confirmação antes de encerrar, aguardar e reabrir, 409 com o nome do responsável;
  - `TransferDialog`: setor atual fora das opções, justificativa de 5 a 500;
  - `AssignDialog`: lista de quem pode receber atribuição, responsável atual destacado;
  - `SectorQueuePage`: recortes, marca de responsável indisponível em texto, assumir por teclado, mensagem de falta de setor;
  - `NotificationBell` e `NotificationsPanel`: contador com rótulo acessível, clicar marca como lida e navega, marcar todas, Escape devolve o foco.
- [ ] Rótulo associado a cada campo (AC5.3.3) e status e prioridade também em texto (AC5.3.4).

### Step 11 — Configuração de ambiente e build

- [ ] `docker compose build api web` passa, e a subida aplica a migração de U2 sem passo manual (NFR8). Nenhum serviço novo no Compose; hook de pre-push inalterado.

### Step 12 — Documentação

- [ ] `README.md`: seção curta com as telas de U2 por perfil.
- [ ] `docs/u2-tickets/roteiro-inspecao-manual.md`, datado, para AC5.3.1, AC5.3.2, AC5.3.5, AC5.3.6, AC5.4.1, AC5.4.2 e AC5.4.4 nas telas de U2.

### Step 13 — Rastreabilidade e execução final

- [ ] `docs/u2-tickets/rastreabilidade-requisitos-testes.md`: cada critério de aceitação de U2 e cada regra BR de `rules.md` apontando para os testes que os verificam, e os critérios de inspeção manual apontando para o roteiro.
- [ ] Rodar lint, `typecheck`, `format:check`, `openapi:check`, `npm audit --omit=dev --audit-level=high`, os testes de U2 e o portão completo de U1 com U2 (unitários e integração da API, frontend) com cobertura; reportar cada limiar com o valor medido, sem alterá-lo.

## Rastreabilidade História → Passo

| História | Passos |
|----------|--------|
| US1.2 — Abrir um chamado | 3, 4, 5, 6, 7, 8, 9, 10 |
| US1.3 — Acompanhar meus chamados | 5, 6, 7, 8, 9, 10 |
| US1.5 — Ser avisado do que muda | 3, 4, 5, 6, 7, 8, 9, 10 |
| US1.6 — Reabrir um chamado encerrado | 5, 6, 7, 8, 9, 10 |
| US2.1 — Trabalhar a fila do setor | 5, 6, 7, 8, 9, 10 |
| US2.2 — Assumir e responder (parte de U2) | 5, 6, 7, 8, 9, 10 |
| US2.3 — Controlar o andamento do chamado | 5, 6, 7, 8, 9, 10 |
| US2.4 — Transferir para outro setor | 3, 4, 5, 6, 7, 8, 9, 10 |
| US3.1 — Distribuir a carga do setor | 5, 6, 7, 8, 9, 10 |
| US5.2 — Não revelar o que existe | 5, 6, 7, 8 |
| US4.1, US4.2 (AC4.1.5, AC4.2.3, AC4.2.4) | 5, 6, 8, 9, 10 |
| US5.1, US5.3, US5.4 (rotas e telas novas) | 7, 8, 9, 10, 12 |
| Critérios transversais CT1, CT6, CT7, CT8, CT9, CT11 | 5, 7, 8, 9, 10 |

## Fora deste Plano

- Workflow de Integração Contínua: etapa de pipeline de CI.
- Commits, push e pull requests: só com pedido explícito do autor.
- Mensagens, aba Conversa e notificação de mensagem recebida: U3.
- `countTickets` e `getDurationAverages`: Bolt de U4.
- Atualização de `contract-summary.md`: as divergências de U2 estão registradas no desenho funcional e no resumo do código.

## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-09-17T13:41:58Z
**Iteration:** 1
**Request Challenge:** review:a93e9558edc581c95b0e20859682395d

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | `apps/api/src/tickets/rules/ticket-action-policy.ts` > `ticketActionRefusal` (casos `CLOSE` e `REOPEN`), confirmado por `apps/api/src/tickets/rules/ticket-action-policy.spec.ts` ("refuses a requester on somebody else ticket" e "accepts only the requester of the ticket") | `rules.md` é a fonte da verdade e, para BR3.6 ("Encerrar chamado pelo solicitante") e BR4.3 ("Reabrir chamado"), afirma explicitamente que um chamado que não é do ator responde **404 TICKET_NOT_FOUND** ("responder como inexistente"), a mesma doutrina de BR2.4. A implementação faz o módulo puro devolver `'FORBIDDEN'` (403) nesse caso, e o teste unitário do próprio módulo confirma esse valor errado como comportamento esperado, em vez do valor documentado na regra. Na prática, o caminho HTTP não expõe o defeito porque `visibilityCondition` (BR2.1) já filtra o chamado pelo `requesterId` do ator antes de `ticketActionRefusal` ser chamado, então um Aluno/Professor pedindo `close`/`reopen` do chamado de outro solicitante recebe 404 por `findVisibleRow`/`assertVisible`, não pelo código de política. Mas isso é um encobrimento acidental por outra camada, não uma implementação correta da regra: o módulo de política, testado isoladamente, contraria sua própria especificação, e a cobertura por requisito declarada para BR3.6/BR4.3 em `docs/u2-tickets/rastreabilidade-requisitos-testes.md` aponta para um teste que verifica o código de erro errado. Qualquer mudança futura que altere a ordem de chamadas (por exemplo, se `ticketActionRefusal` passar a ser chamado antes da visibilidade, ou se `TicketActionsController`/`TicketsPublicService` vier a reutilizar esse módulo em outro caminho de leitura menos restrito) exporia 403 onde a regra exige 404, revelando a existência do chamado de outro solicitante. | Corrigir `ticketActionRefusal` para os casos `CLOSE` e `REOPEN` de forma que "chamado não é do ator" devolva o mesmo tratamento de inexistente que BR3.6/BR4.3 exigem (por exemplo, devolvendo `null` e deixando a checagem de dono para a camada de visibilidade, ou introduzindo um valor de recusa que o chamador converte em `TICKET_NOT_FOUND`), e corrigir a asserção de `ticket-action-policy.spec.ts` para verificar o comportamento documentado, não o comportamento atual. | New |
| R-02 | Major | `apps/web/src/features/tickets/AllTicketsPage.tsx` — sem arquivo de teste correspondente; `npx vitest run --config apps/web/vitest.config.ts --coverage` mediu 11,11% de linhas e 0% de branches/funções neste arquivo; `docs/u2-tickets/rastreabilidade-requisitos-testes.md` e `traceability.json` desta pasta não citam `AllTicketsPage` em nenhuma linha | A tela "Chamados" do Administrador (BR2.3, BR9.1, US5.1) é a única tela de listagem de U2 sem teste de componente dedicado. Ela tem lógica própria — filtros (`TicketFilters`), estados de carregamento/vazio/erro via `ListState` (BR9.8), paginação e a tabela com coluna de solicitante (`showRequester`) — e nenhuma dessas condições é exercitada por um teste; a cobertura medida (11%/0%) mostra que nem o caminho de sucesso é executado fora de uma navegação incidental de outro teste. O próprio `code-generation-plan.md`, no Step 10, lista os componentes que ganham teste dedicado e não inclui `AllTicketsPage`, então a lacuna já vinha do plano aprovado, não é um desvio do desenvolvedor. Isso contraria a prática afirmada em `team.md` (cobertura por requisito: "cada requisito aprovado do corte mínimo precisa de pelo menos um teste automatizado que o verifique") para BR9.8 e BR9.9 nesta tela específica, e o piso "cinco a oito testes por componente" do contrato de testes embutido no plano. O piso global de linha do frontend (80%) continua atendido (94,73% medido), então o portão mecânico passa, mas a garantia por requisito para esta tela não existe. | Acrescentar um arquivo de teste para `AllTicketsPage` cobrindo ao menos: leitura sem filtro (view=all), estado vazio, estado de erro com repetir, filtros combináveis e a coluna de solicitante exibida; ou, caso a equipe decida que a cobertura via `TicketListTable`/`TicketFilters` isolados é suficiente, registrar essa decisão explicitamente em `code-summary.md` e na tabela de rastreabilidade para BR9.8/BR9.9 nesta tela. | New |

### Validation Tool Results

| Tool | Result | Interpretation |
|---|---|---|
| `docker compose --profile test up -d postgres-test` | FALHOU: `failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine ... The system cannot find the file specified.` | O daemon do Docker não respondeu neste ambiente de revisão. Nenhum teste de integração da API (Postgres real), nenhuma verificação de migração contra banco real, nenhum teste de concorrência (BR7.2, BR7.3), nenhum teste de IDOR/403/404 via Supertest e nenhuma reexecução do portão combinado (`jest.config.ts`) ou de `jest.integration.config.ts` foram executados nesta revisão. Os números de 154/319 testes de integração aprovados e os limiares de cobertura de integração vêm de `code-summary.md` (medidos pelo agente e reditos como reexecutados pelo condutor em 2026-09-15) e não foram reconferidos por este revisor. |
| `bun .claude/tools/aidlc-sensor-traceability.ts --stage code-generation --output-path .../traceability.json` | `{"pass":true,"gaps":[],"orphans":[],"missing_from_table":[],"missing_from_upstream_ids":[],"invalid_entries":[],"invalid_targets":[],"findings_count":0}` | 146 identificadores de U2 mapeados sem lacuna estrutural. Não detecta a lacuna de conteúdo do R-02 (o mapeamento existe para BR9.8/BR9.9 apontando a outras telas, mas nunca a `AllTicketsPage`), nem a inconsistência semântica do R-01 (o teste existe e passa, mas verifica o código de erro errado) — ambas exigiram leitura do código, não apenas do sensor. |
| `npm run typecheck` (workspaces `api`, `web`) | Sem erros | `tsc --noEmit` com `strict: true` limpo nos dois pacotes. |
| `npm run lint` | Sem erros | ESLint na raiz cobrindo o repositório inteiro, sem violação. |
| `npm run format:check` | "All matched files use Prettier code style!" | Sem violação de formatação. |
| `npm run openapi:check -w apps/api` | "openapi.json is up to date." | `openapi.json` gerado bate com o código atual dos controllers/DTOs de U2. |
| `npm audit --omit=dev --audit-level=high` | "found 0 vulnerabilities" | Sem vulnerabilidade de produção em severidade alta. |
| `npx jest --config apps/api/jest.unit.config.ts --coverage` | 21 suítes, 200 testes aprovados; `src/tickets/rules` e `src/notifications/rules` em 100% de linhas e ramos; cobertura global da execução unitária 38,92% de linhas (esperado, pois só a camada de regras puras é exercitada nesta execução isolada) | Bate com os números de `code-summary.md`. Confirma que as seis regras puras de U2 têm 100% de ramos, satisfazendo a chave nova de limiar (`U2_RULES_THRESHOLD_KEY`, 90% de ramos e 80% de linhas) já nesta execução. |
| `npx vitest run --config apps/web/vitest.config.ts --coverage` | 29 arquivos, 206 testes aprovados; linhas globais 94,73%, ramos 89,87% | Bate com os números de `code-summary.md`. O detalhamento por arquivo expõe a lacuna de `AllTicketsPage.tsx` (11,11% linhas, 0% funções e ramos) registrada em R-02; os demais arquivos de `features/tickets` e `features/notifications` ficam acima de 75% de linhas, a maioria acima de 85%. |
| Leitura de `apps/api/src/common/prisma/transaction-runner.ts`, `ticket-actions.service.ts`, `tickets.service.ts`, `ticket-visibility.ts`, `notification-recipients.ts`, `ticket-action-policy.ts` | Mecanismo de transação ambiente (`AsyncLocalStorage`), ordem visibilidade → `SELECT ... FOR UPDATE` → releitura, e a lógica de notificação (BR6.1, BR6.2) conferem com o plano e com `rules.md`, exceto pelo caso descrito em R-01 | O `run()` reentrante participa da transação existente em vez de abrir outra; `lockVisibleTicket` aplica a visibilidade antes do lock e relê o estado depois, como o plano exige para BR7.2/BR7.3 (não verificado sob concorrência real por falta de Docker); nenhuma assinatura pública de `TicketsPublicService`/`NotificationsPublicService` expõe tipo do Prisma. |
| Leitura de `apps/api/prisma/migrations/20260916012356_u2_tickets/migration.sql` | Restrições de U2 presentes (título 5–120, descrição 10–2000, tríade da passagem, uma passagem aberta por chamado, `justification` só em `SECTOR`, `previousValue`/`newValue` não ambos nulos nem iguais, `readAt` condicionado a `read`); todas as chaves estrangeiras com `ON DELETE RESTRICT`; nenhuma linha remove `citext`, `CHECK` ou o índice parcial de U1 | Não executada contra banco real (Docker indisponível); a leitura textual da migração não encontrou remoção de restrição de U1 nem divergência da lista do Step 3 do plano. |
| Leitura de `apps/api/jest.integration.config.ts` e `jest.shared.ts` (desvio "Limiar das regras de U2 na execução isolada de integração" de `code-summary.md`) | A configuração de integração agora declara apenas `global`, `GUARDS_THRESHOLD_KEY` e `SERVICES_THRESHOLD_KEY`; `U2_RULES_THRESHOLD_KEY` continua com os mesmos valores (90% ramos, 80% linhas) em `jest.shared.ts` e é cobrada pela execução unitária e pela combinada | Não houve enfraquecimento de limiar: o valor não mudou em nenhuma configuração, só deixou de ser cobrado na execução que não exercita as regras puras (que rodam em memória, sem I/O), permanecendo cobrado nas duas execuções que as exercitam. Consistente com a premissa de cobertura do plano. |

### Summary

A implementação segue de perto o plano aprovado e `rules.md`: o mecanismo de transação ambiente, o travamento otimista por linha, a máquina de transições pura e a política de notificações conferem com o desenho, e lint, typecheck, formatação, `openapi:check`, auditoria de dependências e a suíte unitária (200 testes, regras de U2 em 100% de ramos) rodaram limpos nesta revisão. O sensor de rastreabilidade não aponta lacuna estrutural. Dois achados Major sobrevivem à tentativa de refutação: (R-01) o módulo puro de política de ação implementa e testa um código de erro que contradiz o texto de BR3.6/BR4.3 para "chamado de outro solicitante" — hoje encoberto pela visibilidade, mas uma inconsistência real entre regra, código e teste; e (R-02) a tela de listagem geral do Administrador não tem nenhum teste de componente dedicado, uma lacuna que já vinha do plano aprovado. Nenhum dos dois compromete o funcionamento observável do sistema hoje, e juntos ficam no limite que `team.md`/`org.md` toleram para READY (até dois Major). Os testes de integração, de concorrência e de banco real não puderam ser reexecutados nesta revisão porque o daemon do Docker não respondeu no ambiente; os números de `code-summary.md` para essas suítes não foram reconferidos.
