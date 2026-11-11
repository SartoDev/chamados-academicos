# Plano de Geração de Código — U3 Conversa (`u3-conversation`)

Derivado de `functional-spec.md`, `rules.md`, `entities.md` e `frontend-components.md` (em `../functional-design/`), `contract-summary.md` (X-01, API-U3, SVC-02, SVC-03, DB-01), `unit-of-work.md`, `requirements.md`, do código de U1 e U2 já existente em `apps/api` e `apps/web`, e das práticas afirmadas em `team.md` e `project.md`.

O código vai para a raiz do repositório (`apps/api`, `apps/web`, `docs/`), nunca para a pasta de registro. Identificadores, código e comentários de código ficam em inglês; textos exibidos ao usuário ficam em português.

## Premissas de Execução

- **Área de trabalho com U1 e U2 prontas.** O repositório Git local está no ramo `main`, sem commits. Nenhum commit, push ou pull request acontece nesta geração sem pedido explícito do autor.
- **Linha de base verde.** Antes de qualquer mudança, lint, `typecheck` e as suítes de U1 e U2 precisam passar. Se não passarem, a geração para e reporta.
- **U3 é pequena e cirúrgica.** Uma entidade, duas operações de API, uma aba. Não cria página, rota de navegação nem item de menu.
- **Arquivos de U1 e U2 alterados, só por adição ou pela decisão do desenho.**
  - `apps/api/prisma/schema.prisma`: modelo `Message` e as relações inversas em `Ticket` e `User`; as colunas de chave estrangeira ficam só na tabela de mensagens (DB-01).
  - `apps/api/src/app.module.ts`: registro de `ConversationModule`.
  - `apps/api/src/common/errors/error-codes.ts`: `MESSAGE_TICKET_CLOSED` com status 409.
  - `apps/api/jest.shared.ts`: a chave de limiar das regras passa a cobrir também `src/conversation/rules/**`, com os mesmos valores.
  - `apps/api/test/integration/u1-foundation/support/database.ts`: a limpeza do banco de teste apaga `messages` antes das tabelas de U2 e U1.
  - `apps/api/openapi.json`: regenerado com as duas operações novas.
  - `apps/web/src/app/api/types.ts`: tipo `Message` e a forma paginada da listagem.
  - `apps/web/src/app/i18n/error-code-messages.ts`: tradução de `MESSAGE_TICKET_CLOSED` (CT11).
  - `apps/web/src/features/tickets/TicketDetailPage.tsx`: passa a aba de U3 pelo ponto de extensão `extraTabs`, que hoje existe mas não recebe nada.
- **Transação ambiente.** O envio usa o `TransactionRunner` que já existe em `apps/api/src/common/prisma/`: abre a transação, e a gravação da mensagem, o aviso a U2 e o registro da notificação participam dela (BR4.1). Nenhuma assinatura pública muda.
- **Paginação e o achado R-06 da revisão do desenho.** A listagem mantém a paginação por deslocamento de X-01, com o parâmetro aditivo `order` (`asc` e `desc`, padrão `asc`), e a implementação resolve o deslizamento de janela assim:
  - a ordenação declara o desempate nos dois sentidos — `sentAt` e, em empate, o identificador, ambos no mesmo sentido da ordem pedida;
  - mensagem nunca é apagada nem editada (BR2.3), e mensagem nova entra sempre no início da ordem decrescente; por isso uma janela que desliza só pode **repetir** uma mensagem já carregada, nunca esconder uma;
  - a aba junta as páginas descartando identificadores repetidos, o que torna a repetição invisível;
  - esse raciocínio fica registrado em comentário no código da listagem e em `code-summary.md`, para não se perder.
- **Achado R-07 da revisão do desenho.** É correção de redação em BR3.2: a lacuna de ordenação era da operação `listMessages` de API-U3, não de X-01 como um todo, e `sort` é omitido porque `sentAt` é o único campo ordenável. O código segue essa leitura; a correção do texto vai ao portão, porque o desenho está congelado pela revisão final.
- **Sem camada de repositório.** O service é o único ponto que toca o banco (`team.md`).
- **Fronteira entre unidades.** U3 lê chamado e pessoas só pelos serviços públicos de U2 e U1, e escreve notificação só pelo serviço público de U2 (BR4.4, DB-01).
- **Migração.** A migração de U3 é criada sem aplicar (`--create-only`) e revisada antes de aplicada, para não remover as restrições em SQL de U1 e de U2.
- **Docker.** Os testes de integração exigem o daemon do Docker ativo e o serviço `postgres-test` ligado a `127.0.0.1`.

## Cobertura: Obrigações Somadas

Nenhum valor de limiar é alterado ou relaxado. U3 só amplia o alcance da chave que já existe.

- **Global:** 80% de linhas sobre o código que não é andaime, com as mesmas exclusões.
- **Por caminho, existentes:** 90% de ramos e 80% de linhas em `apps/api/src/**/guards/**` e nas regras de U2; 80% de linhas em `apps/api/src/**/*.service.ts`.
- **Por caminho, ampliada:** a chave das regras passa a cobrir `apps/api/src/{tickets,notifications,conversation}/rules/**`, com os mesmos 90% de ramos e 80% de linhas, e continua cobrada nas execuções que exercitam essas regras: a unitária e a combinada.
- **Por requisito:** todo critério de aceitação e toda regra BR de U3 com ao menos um teste, na tabela requisito → teste do repositório.
- **Onde os limiares são verificados:** no portão completo da API e do frontend, com cobertura, no Step 13.

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

A ordem segue o `plan_profile` do contrato. A camada "Repository / data access" é omitida (Premissas).

### Step 1 — Estrutura da unidade

- [ ] Conferir Node.js, npm, Docker, Docker Compose e Git; rodar lint, `typecheck` e os testes unitários como linha de base; parar e reportar se algo faltar ou falhar.
- [ ] `apps/api/src/conversation/` com `ConversationModule` vazio, registrado em `AppModule`.
- [ ] `MESSAGE_TICKET_CLOSED` (409) no catálogo de erros e sua tradução em português no frontend.
- [ ] `apps/web/src/features/conversation/` com o cliente de API de U3; tipos de API-U3 em `app/api/types.ts`.

### Step 2 — Prontidão dos executores de teste

- [ ] Ampliar a chave de limiar das regras em `apps/api/jest.shared.ts` para cobrir `src/conversation/rules/**`, sem alterar valores nem a distribuição entre as configurações.
- [ ] Suporte de integração de U3 em `apps/api/test/integration/u3-conversation/support/`, reaproveitando as fábricas de U1 e U2.
- [ ] Limpeza compartilhada do banco de teste apagando `messages` antes das tabelas de U2 e U1.
- [ ] Rodar os comandos restritos a U3 de `unit-test-instructions.md` com `--passWithNoTests`.

### Step 3 — Modelo de dados: implementar

- [ ] Modelo `Message` conforme `entities.md`: tabela `messages`, UUID, `ticket_id` e `author_id` com `ON DELETE RESTRICT`, corpo e `sent_at`.
- [ ] Índice `(ticket_id, sent_at, id)`, que serve às duas ordens de leitura e ao desempate de R-06.
- [ ] Migração `u3_conversation` criada com `--create-only` e revisada, com a restrição em SQL do tamanho do corpo (1 a 2000 caracteres depois de remover espaços nas pontas) e sem remover nenhuma restrição de U1 ou de U2.

### Step 4 — Modelo de dados: escrever e rodar os testes

- [ ] Integração contra Postgres real: restrição de tamanho recusa corpo vazio e corpo acima do limite; chaves estrangeiras impedem apagar chamado ou usuário referenciado; ordenação por `sent_at` com desempate por identificador nas duas ordens.
- [ ] As suítes de modelo de dados de U1 e U2 continuam verdes depois da migração.

### Step 5 — Lógica de negócio: implementar

- [ ] **Regras puras** em `apps/api/src/conversation/rules/`:
  - `conversation-access.ts`: quem lê (BR1.2), quem escreve (BR1.3) e o Administrador fora (BR1.4), a partir dos fatos de `getVisibleTicket`;
  - `message-recipients.ts`: destinatários do aviso de mensagem, com a guarda de chamado sem responsável e o autor sempre fora (BR4.3).
- [ ] **`ConversationService`**:
  - listagem paginada com `order`, ordenação com desempate no mesmo sentido, e nomes de autor resolvidos pelo serviço público de U1 (BR3.1, BR3.2, BR3.3);
  - envio: acesso, permissão de escrita, chamado encerrado, validação do corpo, e a gravação dentro de `TransactionRunner.run` junto com o aviso a U2 e o registro da notificação (BR1.1 a BR2.3, BR4.1 a BR4.3);
  - nenhuma escrita na entidade `Ticket` e nenhuma consulta a tabela de outra unidade (BR4.4).

### Step 6 — Lógica de negócio: escrever e rodar os testes

- [ ] Unitários, de 5 a 8 por componente: acesso de leitura e de escrita para os cinco perfis, inclusive leitor por passagem e Administrador; destinatários do aviso nos quatro casos (solicitante com e sem responsável, atendimento pelo responsável e por Gestor que não é responsável).
- [ ] Integração contra Postgres real: envio grava mensagem, transição e notificação juntas; falha forçada no registro da notificação desfaz a mensagem inteira; mensagem do solicitante em Aguardando solicitante devolve o chamado a Em análise, com uma única notificação para o responsável; chamado encerrado recusa envio e continua legível; listagem nas duas ordens, com paginação e desempate.

### Step 7 — API: implementar

- [ ] `ConversationController` com `listMessages` e `sendMessage` sob `/tickets/{ticketId}/messages`, DTOs validados, parâmetro `order` com padrão `asc`, marcação de perfil e resposta conforme API-U3.
- [ ] `apps/api/openapi.json` regenerado; `openapi:check` passa.

### Step 8 — API: escrever e rodar os testes

- [ ] Integração com Supertest em `apps/api/test/integration/u3-conversation/`:
  - caminho feliz das duas operações;
  - 401 sem sessão; 404 para Administrador, para Atendente de setor sem passagem e para solicitante alheio; 403 para quem lê e não escreve;
  - corpo idêntico entre chamado inexistente e chamado invisível, ignorando `traceId`;
  - leitura permitida a quem vê o chamado por passagem de setor, com envio recusado;
  - 409 em chamado encerrado, e envio aceito de novo depois da reabertura;
  - validação do corpo nos dois limites;
  - uma única notificação por destinatário na operação que também muda o status;
  - o teste de enumeração de rotas de U1 continua verde com as rotas novas.

### Step 9 — Frontend: implementar

- [ ] `features/conversation`: `ConversationTab`, `MessageList`, `MessageBubble`, `LoadPreviousButton`, `ConversationRefreshButton` e `MessageComposer`, conforme `frontend-components.md`.
- [ ] `TicketDetailPage` passa a aba pelo ponto de extensão; a aba é oferecida ao solicitante e a todo Atendente e Gestor, nunca ao Administrador, e o 404 da primeira leitura a retira, devolvendo o foco a Detalhes (BR5.1).
- [ ] Junção de páginas descartando identificadores repetidos (R-06), região de anúncio educado, estados de carregamento, vazio e erro, texto preservado na falha de envio, e balão truncado com "ver mais".
- [ ] `data-testid` em todo elemento interativo; tema padrão sem sobrescrever cores.

### Step 10 — Frontend: escrever e rodar os testes

- [ ] Vitest, de 5 a 8 por componente:
  - `ConversationTab`: aba presente por perfil, retirada no 404 com foco em Detalhes, carga inicial em ordem decrescente exibida cronologicamente;
  - `MessageList` e `LoadPreviousButton`: carga de anteriores sem duplicar mensagem já exibida, posição de leitura preservada, estados de carregamento, vazio e erro;
  - `MessageComposer`: limites do corpo, envio em andamento, campo desabilitado em chamado encerrado, texto preservado na falha, mensagem traduzida do 409;
  - `MessageBubble`: autor, momento, lado e truncamento.

### Step 11 — Configuração de ambiente e build

- [ ] `docker compose build api web` passa, e a subida aplica a migração de U3 sem passo manual (NFR8).

### Step 12 — Documentação

- [ ] `README.md`: a aba Conversa na seção de telas.
- [ ] `docs/u3-conversation/roteiro-inspecao-manual.md`, datado, para AC5.3.1, AC5.3.2, AC5.3.5, AC5.3.6 e AC5.4.1 na aba Conversa.

### Step 13 — Rastreabilidade e execução final

- [ ] `docs/u3-conversation/rastreabilidade-requisitos-testes.md`: cada critério de aceitação e cada regra BR de U3 apontando para os testes que os verificam.
- [ ] Rodar lint, `typecheck`, `format:check`, `openapi:check`, `npm audit --omit=dev --audit-level=high`, os testes de U3 e o portão completo de U1, U2 e U3 com cobertura; reportar cada limiar com o valor medido, sem alterá-lo.

## Rastreabilidade História → Passo

| História | Passos |
|----------|--------|
| US1.4 — Conversar dentro do chamado | 3, 4, 5, 6, 7, 8, 9, 10 |
| US1.3 (aba de mensagens do detalhe) | 9, 10 |
| US1.5 (aviso de mensagem recebida) | 5, 6, 8 |
| US2.1 (mensagens de chamado de setor de passagem), US2.2, US2.3 (gatilho) | 5, 6, 8 |
| US4.1 (autor desativado continua legível) | 5, 6, 8 |
| US5.1, US5.2 (rotas novas e 404 idêntico) | 5, 6, 7, 8 |
| US5.3, US5.4 (aba nova) | 9, 10, 12 |
| Critérios transversais CT1, CT6, CT7, CT8, CT9, CT11 | 5, 7, 8, 9, 10 |

## Fora deste Plano

- Workflow de Integração Contínua: etapa de pipeline de CI.
- Commits, push e pull requests: só com pedido explícito do autor.
- Indicadores (U4) e avaliação (U5).
- Correção do texto de BR3.2 apontada em R-07: o desenho está congelado pela revisão final, e a correção vai ao portão.

## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-09-23T11:33:11Z
**Iteration:** 1
**Request Challenge:** review:ade85b2db86df97ab160f4b051ee8a1d

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Minor | `apps/api/src/conversation/rules/conversation-access.ts` função `readRefusal` | A função `readRefusal` é exportada e tem teste unitário próprio em `conversation-access.spec.ts`, mas `conversation.service.ts` nunca a chama: `listMessages` testa `canReadConversation` diretamente e lança `conversationNotFound()` sem passar pelo wrapper que devolve o código de recusa. Não é um defeito funcional — o resultado é idêntico —, mas é código morto em produção, mantido vivo só pelo teste. | Remover `readRefusal` (e seu teste) se não houver outro chamador previsto, ou usá-la em `listMessages` para eliminar a duplicação de decisão. | New |

### Validation Tool Results

| Tool | Result | Interpretation |
|---|---|---|
| `aidlc-sensor-traceability.ts --stage code-generation` | `{"pass":true,"gaps":[],"orphans":[],"findings_count":0}` | Os 86 identificadores de `traceability.json` resolvem sem lacuna. |
| `aidlc-sensor-required-sections.ts` (`code-generation-plan.md`, `unit-test-instructions.md`, `code-summary.md`) | `pass:true` nos três arquivos | Seções obrigatórias presentes, sem achado estrutural. |
| `docker compose --profile test up -d postgres-test` | Container `chamados-academicos-postgres-test-1` ativo | Ambiente de integração disponível; todos os testes abaixo rodaram contra Postgres real. |
| `npm run lint` | Sem erros | — |
| `npm run typecheck` (`apps/api`, `apps/web`) | Sem erros, `strict: true` nos dois pacotes | — |
| `npm run format:check` | "All matched files use Prettier code style!" | — |
| `npm run openapi:check -w apps/api` | "openapi.json is up to date." | O `build` prévio (`tsc -p tsconfig.build.json`) também passou sem erro; confirma que `listMessages`/`sendMessage` e o parâmetro `order` estão refletidos no contrato publicado. |
| `npm audit --omit=dev --audit-level=high` | "found 0 vulnerabilities" | — |
| `npx jest --config apps/api/jest.unit.config.ts --coverage` | 24 suítes, 222 testes aprovados | Bate exatamente com os números declarados em `code-summary.md`. `conversation/rules` a 100%/100% branches/linhas. |
| `npx jest --config apps/api/jest.integration.config.ts --runInBand --coverage` | 24 suítes, 370 testes aprovados | Bate com o declarado. `conversation.service.ts` a 100% linhas (96% ramos, uma linha de guarda não exercitada isoladamente aqui), coberta pelo teste de falha forçada e pelos de paginação. |
| `npx jest --config apps/api/jest.config.ts --runInBand --coverage` (portão combinado) | 48 suítes, 592 testes aprovados; linhas 97,63% | Bate exatamente com `code-summary.md`. `conversation.service.ts` e `conversation/rules` a 100% em linhas; nenhum limiar por caminho violado (guards, regras, services todos acima do piso). |
| `npx vitest run --config apps/web/vitest.config.ts --coverage` | 34 arquivos, 251 testes aprovados; linhas 95,78% | Bate exatamente com `code-summary.md`. `features/conversation` a 100% linhas. |

### Summary

A implementação foi lida por completo (service, controller, DTOs, regras puras, migração, componentes de frontend, hook de remoção da aba, mesclagem de páginas) e comparada linha a linha contra `rules.md`, `functional-spec.md` e `frontend-components.md`. Todas as onze frentes de ataque sugeridas resistiram: a fronteira BR1.1–BR1.4 é decidida só a partir de `getVisibleTicket`, com Administrador e chamado invisível respondendo corpo idêntico (testado inclusive comparando os três casos); a escrita (BR1.3) é mais estreita que a leitura e devolve 403 sem esconder o chamado; a paginação por deslocamento do achado R-06 tem exatamente o comportamento (repete, nunca esconde) que o desenho previu, com um teste de integração que grava mensagem entre duas páginas e prova isso, e a mesclagem do cliente descarta duplicatas por identificador; a transação ambiente é testada com falha forçada no registro de notificação, desfazendo mensagem e transição juntas; o `CHECK` do banco e a validação da API concordam depois do trim; a migração só cria a tabela, o índice e as duas chaves estrangeiras, sem tocar em nada de U1/U2; o limiar de cobertura das regras foi ampliado sem afrouxar nenhum valor, e o portão completo mede exatamente os números declarados em `code-summary.md`. O único achado desta iteração é um Minor de limpeza (função de regra pura exportada e testada, mas nunca chamada em produção), que não compromete a implementabilidade nem a segurança do sistema. Nenhum achado Critical ou Major: o código está pronto para o portão humano.
