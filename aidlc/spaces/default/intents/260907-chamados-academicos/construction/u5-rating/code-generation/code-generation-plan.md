# Plano de Geração de Código — U5 Avaliação (`u5-rating`)

Derivado de `functional-spec.md`, `rules.md`, `entities.md` e `frontend-components.md` (em `../functional-design/`), `contract-summary.md` (X-01, API-U5, SVC-06, SVC-07, SVC-08, DB-01), `unit-of-work.md`, `requirements.md`, do código de U1 a U4 já existente em `apps/api` e `apps/web`, e das práticas afirmadas em `team.md` e `project.md`.

O código vai para a raiz do repositório (`apps/api`, `apps/web`, `docs/`), nunca para a pasta de registro. Identificadores, código e comentários de código ficam em inglês; textos exibidos ao usuário ficam em português.

## Premissas de Execução

- **Área de trabalho com U1 a U4 prontas.** Repositório no ramo `main`, sem commits. Nenhum commit, push ou pull request nesta geração.
- **Linha de base verde.** Antes de qualquer mudança, lint, `typecheck` e as suítes das quatro unidades precisam passar; se não passarem, a geração para e reporta.
- **Achado R-01 da revisão do desenho, que ficou aberto (Critical) — o mecanismo exato.** O desenho diz que a avaliação vive dentro da aba de detalhes do chamado, mas esse ponto de extensão não existe, e a analogia com a aba Conversa de U3 estava errada: `extraTabs` insere uma **aba irmã**, não conteúdo dentro de uma aba. O plano fixa o mecanismo real:
  - `apps/web/src/features/tickets/TicketTabs.tsx` ganha uma propriedade opcional de conteúdo extra da aba Detalhes, renderizada dentro do painel `details`, logo abaixo do componente de detalhes que já existe. Sem a propriedade, a aba se comporta exatamente como hoje.
  - `apps/web/src/features/tickets/TicketDetailPage.tsx` passa o bloco de avaliação por essa propriedade, do mesmo jeito que já passa as abas de U3.
  - Não se cria aba "Avaliação": BR5.1 e `frontend-components.md` pedem o bloco dentro de Detalhes.
- **Achado R-06 da revisão do desenho, também aberto (Minor) — onde o cartão entra.** `IndicatorsTab.tsx` não tem uma lista única de cartões: tem duas grades, a de contagens por status e a de tempos médios. O cartão de avaliação entra na **grade dos tempos médios**, que passa a acomodar três cartões em telas largas e a quebrar em uma coluna nas estreitas. A nota de rodapé do painel, que hoje explica os dois recortes, passa a dizer que a média das avaliações segue o recorte por encerramento, como os tempos.
- **Arquivos de outras unidades alterados, e só estes.**
  - `apps/api/prisma/schema.prisma`: modelo `Rating` e a relação inversa em `Ticket`.
  - `apps/api/src/common/errors/error-codes.ts`: `RATING_NOT_FOUND` (404), `RATING_TICKET_NOT_CLOSED` (409) e `RATING_ALREADY_EXISTS` (409).
  - `apps/api/src/tickets/tickets.module.ts`: registro do controller e do service de avaliação.
  - `apps/api/src/reporting/`: o resumo de avaliações, seguindo a forma dos demais indicadores.
  - `apps/api/test/integration/u1-foundation/support/database.ts`: limpeza de `ticket_ratings` antes das tabelas de U2.
  - `apps/api/openapi.json`: regenerado.
  - `apps/web`: `features/tickets/TicketTabs.tsx` e `TicketDetailPage.tsx` (o ponto de extensão acima), `features/reports/IndicatorsTab.tsx` (o cartão e a nota), `app/api/types.ts`, `app/i18n/error-code-messages.ts`.
- **Regras puras na pasta que os limiares já cobrem.** As regras de U5 ficam em `apps/api/src/tickets/rules/`, junto das regras de chamado, para que a chave de limiar existente as cubra sem alteração nenhuma na configuração de cobertura.
- **A avaliação é imutável e única por chamado.** A unicidade é garantida por restrição do banco, não só por verificação na aplicação; a segunda tentativa responde 409 `RATING_ALREADY_EXISTS`.
- **O recorte do painel é o encerramento atual do chamado**, o mesmo dos tempos médios: um chamado avaliado e reaberto sai das médias enquanto estiver aberto, e volta no período do encerramento seguinte.
- **Sem camada de repositório.** O service é o único ponto que toca o banco (`team.md`).
- **Docker.** Os testes de integração exigem o daemon ativo e o `postgres-test` ligado a `127.0.0.1`.

## Cobertura: Obrigações Somadas

Nenhum valor de limiar é alterado, e nenhuma chave nova é criada.

- **Global:** 80% de linhas sobre o código que não é andaime.
- **Por caminho, existentes:** 90% de ramos e 80% de linhas em `apps/api/src/**/guards/**` e em `apps/api/src/{tickets,notifications,conversation,reporting}/rules/**`, que já cobre as regras de U5; 80% de linhas em `apps/api/src/**/*.service.ts`.
- **Por requisito:** todo critério de aceitação e toda regra BR de U5 com ao menos um teste, na tabela requisito → teste do repositório.
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

A ordem segue o `plan_profile` do contrato. A camada "Repository / data access" é omitida, como nas demais unidades.

### Step 1 — Estrutura da unidade

- [ ] Conferir ferramentas e rodar a linha de base; parar e reportar se algo falhar.
- [ ] Códigos de erro de U5 no catálogo e suas traduções em português no frontend.
- [ ] `apps/web/src/features/rating/` com o cliente de API de U5; tipos de API-U5 em `app/api/types.ts`.

### Step 2 — Prontidão dos executores de teste

- [ ] Suporte de integração em `apps/api/test/integration/u5-rating/support/`, com fábrica de avaliação e um cenário de chamados encerrados em datas controladas.
- [ ] Limpeza compartilhada apagando `ticket_ratings` antes das tabelas de U2.
- [ ] Rodar os comandos restritos a U5 de `unit-test-instructions.md` com `--passWithNoTests`.

### Step 3 — Modelo de dados: implementar

- [ ] Modelo `Rating` conforme `entities.md`: tabela `ticket_ratings`, identificador UUID, `ticket_id` único com chave estrangeira `ON DELETE RESTRICT`, `score` inteiro, `comment` opcional e `rated_at`.
- [ ] Migração `u5_rating` criada com `--create-only` e revisada, com as restrições em SQL: nota entre 1 e 5; comentário, quando presente, entre 1 e 500 caracteres depois de remover espaços e quebras de linha das pontas; unicidade de `ticket_id`. Nenhuma restrição de U1 a U4 é removida.

### Step 4 — Modelo de dados: escrever e rodar os testes

- [ ] Integração contra Postgres real: cada restrição recusa a linha inválida; a segunda avaliação do mesmo chamado é recusada pelo banco; a chave estrangeira impede apagar chamado avaliado; as suítes de modelo de dados das unidades anteriores continuam verdes.

### Step 5 — Lógica de negócio: implementar

- [ ] **Regras puras** em `apps/api/src/tickets/rules/`: `rating-access.ts` (quem avalia e quem lê, a partir dos fatos de `getVisibleTicket`, incluindo o Administrador na leitura) e `rating-score.ts` (escala de 1 a 5 e os rótulos fixos).
- [ ] **`RatingService`** no módulo de chamados: registro e leitura da avaliação, com a visibilidade obtida de `TicketsPublicService.getVisibleTicket`, a recusa de chamado não encerrado, a recusa de segunda avaliação e a validação de nota e comentário. Nenhuma notificação é criada.
- [ ] **Resumo no módulo de indicadores:** média e quantidade das avaliações dos chamados visíveis encerrados no período, por consulta agregada, reaproveitando a condição de visibilidade e o recorte por encerramento que U4 já usa.

### Step 6 — Lógica de negócio: escrever e rodar os testes

- [ ] Unitários das duas regras puras: os cinco perfis na escrita e na leitura, e os limites da escala.
- [ ] Integração: só o solicitante avalia; chamado não encerrado recusa; segunda avaliação recusa; avaliação de chamado alheio responde como inexistente; leitura por responsável, atendente do setor, atendente de setor de passagem e Administrador; chamado avaliado e reaberto mantém a avaliação e sai das médias enquanto estiver aberto, voltando no encerramento seguinte; resumo com visibilidade de Gestor e de Administrador; período sem avaliação devolve média vazia e quantidade zero.

### Step 7 — API: implementar

- [ ] `GET` e `PUT` de `/tickets/{ticketId}/rating` e `GET /reports/ratings`, com DTOs validados, marcação de perfil conforme BR1.1 e BR3.1, e respostas conforme API-U5.
- [ ] `apps/api/openapi.json` regenerado; `openapi:check` passa.

### Step 8 — API: escrever e rodar os testes

- [ ] Integração com Supertest em `apps/api/test/integration/u5-rating/`: caminho feliz das três operações; 401 sem sessão; 403 para quem não pode avaliar e para quem não pode ver o resumo; 404 idêntico para chamado alheio e inexistente; 404 de avaliação inexistente em chamado visível; 409 de chamado não encerrado e de avaliação já existente; validação de nota e de comentário; o teste de enumeração de rotas de U1 continua verde.

### Step 9 — Frontend: implementar

- [ ] Ponto de extensão da aba Detalhes em `TicketTabs.tsx` e passagem do bloco em `TicketDetailPage.tsx`, conforme as Premissas; sem a propriedade, a aba não muda.
- [ ] `features/rating`: `RatingSection`, `RatingForm` com as cinco opções rotuladas, comentário com contador, diálogo de confirmação avisando que a avaliação é definitiva, e `RatingSummaryView`.
- [ ] `RatingCard` no painel, na grade dos tempos médios, que passa a acomodar três cartões em telas largas; a nota de rodapé do painel passa a citar o recorte da avaliação.
- [ ] `data-testid` em todo elemento interativo; tema padrão sem sobrescrever cores; nenhuma estrela como único portador da informação.

### Step 10 — Frontend: escrever e rodar os testes

- [ ] Vitest, de 5 a 8 por componente: `RatingSection` (formulário para o solicitante, avaliação registrada para os demais, nada em chamado não encerrado); `RatingForm` (nota obrigatória, contador do comentário, confirmação antes de enviar, texto preservado na falha, mensagens traduzidas dos 409); `RatingSummaryView` (nota com rótulo em texto); `RatingCard` (média, quantidade, traço sem avaliação); e os testes de U2 e U4 afetados pelos dois pontos de extensão continuam verdes, com o comportamento anterior preservado quando nada é passado.

### Step 11 — Configuração de ambiente e build

- [ ] `docker compose build api web` passa; a subida aplica a migração de U5 sem passo manual.

### Step 12 — Documentação

- [ ] `README.md`: a avaliação na seção de telas.
- [ ] `docs/u5-rating/roteiro-inspecao-manual.md`, datado, para AC5.3.1, AC5.3.2, AC5.3.5, AC5.3.6 e AC5.4.1 no formulário e na exibição.

### Step 13 — Rastreabilidade e execução final

- [ ] `docs/u5-rating/rastreabilidade-requisitos-testes.md`: cada critério e cada regra BR de U5 apontando para os testes.
- [ ] Rodar lint, `typecheck`, `format:check`, `openapi:check`, `npm audit --omit=dev --audit-level=high`, os testes de U5 e o portão completo de U1 a U5 com cobertura; reportar cada limiar com o valor medido, sem alterá-lo.

## Rastreabilidade História → Passo

| História | Passos |
|----------|--------|
| US6.3 — Avaliar o atendimento | 3, 4, 5, 6, 7, 8, 9, 10 |
| US5.1, US5.2 (rotas novas e 404 idêntico) | 5, 6, 7, 8 |
| US5.3, US5.4 (formulário, exibição e cartão) | 9, 10, 12 |
| Critérios transversais CT1, CT6, CT7, CT8, CT11 | 5, 7, 8, 9, 10 |

## Fora deste Plano

- Workflow de Integração Contínua: etapa de pipeline de CI.
- Commits, push e pull requests: só com pedido explícito do autor.
- Qualquer mudança de comportamento nas telas de U2 e de U4 além dos dois pontos de extensão descritos.

## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Iteration:** 1
**Request Challenge:** review:644fb41aa3fe5db15ff67ea30836e0e3

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | `apps/web/src/features/reports/IndicatorsTab.tsx` linhas 33, 40 e 45-51 | Terceira mudança de comportamento no Painel de U4, não declarada. `useRatingSummary(period)` entrou no array `queries` que decide o estado único de carregamento e de erro da aba inteira: uma falha ou lentidão da rota nova `GET /reports/ratings` agora joga todo o Painel de U4 (contagens por status, dois cartões de tempo e os dois gráficos) em estado de erro ou de carregamento, o que não acontecia antes da U5. O plano declara para esse arquivo apenas "o cartão e a nota" (linha 23 e Step 9) e exclui explicitamente "Qualquer mudança de comportamento nas telas de U2 e de U4 além dos dois pontos de extensão" (linha 189); a tabela de Desvios de `code-summary.md` não a lista. Nenhum teste fixa o comportamento nos dois sentidos: `apps/web/src/test/report-fixtures.ts` linha 97 responde sempre 200 em `GET /reports/ratings`, então o teste de erro de U4 (`apps/web/src/features/reports/IndicatorsTab.test.tsx` linha 94) nunca exercita uma falha da rota da U5. | Declarar a mudança e o raio de alcance na tabela de Desvios de `code-summary.md`, ou isolar a falha do cartão de avaliação do estado compartilhado do Painel; em qualquer das duas escolhas, acrescentar um teste que fixe o comportamento escolhido quando `GET /reports/ratings` falha. | New |
| R-02 | Minor | `construction/u5-rating/code-generation/code-summary.md` > Pendências e Riscos, item "Ramo não coberto em `rating.service.ts`" | Divulgação de cobertura incompleta. O artefato relata 95,56% de linhas e 87,5% de ramos em `rating.service.ts` e explica a lacuna apenas como o caminho de conversão da violação de unicidade (linhas 115-119). A execução medida nesta revisão reporta as linhas sem cobertura como 59-60 e 115-119: a região 59-60 (`throw ratingRefusal(refusal)` de `getRating`, em `apps/api/src/tickets/rating.service.ts`) é uma segunda lacuna que o artefato não menciona. A análise de alcance confirma que esse ramo é inalcançável por construção — para ADMIN `canReadRating` devolve `true`; para STUDENT e PROFESSOR `getVisibleTicket` só concede quando `requesterId` é o ator; para AGENT e MANAGER sem setor `visibilityCondition` devolve `MATCHES_NOTHING` e `getVisibleTicket` já recusa; e com setor a concessão vem de `sectorId` ou de `sectorPassages`, ambos reproduzidos por `worksInSector`. É guarda defensiva legítima, com a mesma forma de `conversation-access`, e a rastreabilidade de BR1.3 não é generosa: `apps/api/src/tickets/rules/rating-access.spec.ts` linhas 114-130 testa `readRefusal` diretamente e I5-api cobre o 404 observável. O defeito é só a omissão. | Acrescentar as linhas 59-60 à divulgação de cobertura de `code-summary.md`, registrando-as como guarda defensiva inalcançável enquanto `getVisibleTicket` aplicar a mesma visibilidade, com a justificativa de por que a redundância fica. | New |
| R-03 | Minor | `apps/api/prisma/migrations/20260926220811_u5_rating/migration.sql` > comentário de `ticket_ratings_comment_length_check` | O comentário afirma que "the database refuses exactly what the API refuses". A afirmação é falsa no conjunto de caracteres: o `trim()` do JavaScript remove também `\v`, `\f`, U+00A0, U+FEFF e os separadores de espaço Unicode, que `btrim("comment", E' \t\r\n')` não remove. Um `INSERT` direto de comentário formado apenas por `\v` ou U+00A0 passa pela restrição, enquanto a API o gravaria como ausente. Só é alcançável fora do caminho da API (a API sempre grava o texto já aparado), portanto não há defeito de comportamento — apenas a palavra "exactly" não se sustenta. A restrição de nota (`BETWEEN 1 AND 5`) e a de unicidade recusam exatamente o que a API recusa, e a migração de fato só acrescenta: cria `ticket_ratings`, seu índice único e sua chave estrangeira, sem `DROP` nem `ALTER` de tabela de U1 a U3. | Reescrever o comentário para "recusa exatamente o que o caminho da API pode produzir", ou ampliar o conjunto do `btrim` para o conjunto de espaços do JavaScript. | New |
| R-04 | Minor | `docs/u5-rating/rastreabilidade-requisitos-testes.md` > linhas 80 (BR2.4) e 87 (BR5.2) | Duas citações não sustentadas na tabela requisito → teste, que `team.md` define como critério principal de cobertura. A linha de BR2.4 ("A reabertura não mexe na avaliação nem libera uma segunda") cita W5-bloco (`apps/web/src/features/rating/RatingSection.test.tsx`), mas nenhum dos oito testes daquele arquivo exercita chamado reaberto nem chamado avaliado fora de `CLOSED`; a busca pelos termos `reopen` ou `reabert` em `apps/web/src` só retorna arquivos de U2. BR2.4 continua coberto por I5-servico e I5-api, portanto o requisito não fica descoberto — a citação é que é falsa. Além disso, sob a divergência declarada (`if (!closed) return null` em `RatingSection.tsx` linha 28), BR5.2 ("A avaliação registrada é exibida a quem pode lê-la") só é realizada em chamado encerrado, e a tabela afirma cobertura sem essa qualificação — o roteiro de inspeção manual a carrega (itens 8.10 e 8.11), a tabela não. Quanto ao resto do desvio: ele está declarado corretamente, em três lugares (Step 10 do plano, Pendências de `code-summary.md`, roteiro manual 8.10 e 8.11), a API segue fiel ao desenho e `rating-access.spec.ts` linha 128 fixa a leitura "em qualquer status" no nível da regra; nenhum critério de aceitação depende de ler a avaliação em chamado não encerrado (AC5.2.1 e AC5.2.2 são de API, AC5.3.4 e AC6.3.1 vivem no caminho encerrado). | Remover a citação de W5-bloco da linha de BR2.4 e qualificar as linhas de BR5.2 e BR1.3 com a restrição de tela, apontando para o desvio registrado em `code-summary.md`. | New |

### Verificações Executadas

| Comando | Resultado | Confere com code-summary.md? |
|---|---|---|
| `npm run lint` | Sucesso, sem saída de erro (código de saída 0) | Sim |
| `npm run typecheck` | Sucesso nos dois pacotes, `strict: true` (código 0) | Sim |
| `npm run format:check` | "All matched files use Prettier code style!" | Sim |
| `npm run openapi:check -w apps/api` | "openapi.json is up to date." | Sim |
| `npx jest --config apps/api/jest.config.ts --runInBand --coverage` | 58 suítes, 766 testes aprovados; linhas 96,71% (6529 de 6751), ramos 95,79%; `rating.service.ts` 95,56% linhas e 87,5% ramos, não cobertas as linhas 59-60 e 115-119; `rating-access.ts` 100% e 100%; `rating-score.ts` 100% e 94,44%; `reporting.service.ts` 100% e 91,89% | Sim nos números; ver R-02 quanto às linhas não cobertas |
| `npx vitest run --config apps/web/vitest.config.ts --coverage` | Código de saída 0; linhas 96,33% (1208 de 1254), ramos 91,90%; `features/rating` 96,90% linhas e 88,73% ramos; `RatingForm.tsx` 93,61% linhas, não cobertas 62, 77 e 81 | Sim |
| `git status --porcelain` | 22 entradas, todas não rastreadas; nenhum commit no ramo `main` | Sim |

### Afirmações Conferidas contra o Código

| Afirmação | Situação |
|---|---|
| "Os dois pontos de extensão são aditivos e não mudaram comportamento de U2 nem de U4" | **Refutada em parte.** `detailsExtra` em `TicketTabs.tsx` é de fato aditivo (sem a propriedade, painel `details` idêntico, três testes em `extension-points.test.tsx` linhas 20-70) e a grade dos tempos de `IndicatorsTab` passou a `sm:grid-cols-2 lg:grid-cols-3` sem tocar a grade das contagens. Nenhuma suíte foi enfraquecida: a busca por `.skip(`, `.only(`, `xit(`, `xdescribe(` e `it.todo` em `apps/` retorna zero ocorrências de teste, a única expectativa alterada é a da nota de rodapé (`IndicatorsTab.test.tsx` linhas 67-73) e as mudanças em `report-access.spec.ts` e nos apoios `ticket-fixtures.ts` e `report-fixtures.ts` são acréscimos. O que não se sustenta é o "nada mais mudou de comportamento": ver R-01. |
| "Visibilidade aplicada dentro da consulta ao Prisma, nunca por busca-e-comparação" | **Confirmada.** `rating.service.ts` linha 61 busca por `where: { ticketId }` já resolvido por `getVisibleTicket`, e `summarize` (linhas 135-153) monta a condição `ticket` com `visibilityCondition(actor)` e `closedAt` e agrega com `rating.aggregate`, sem carregar lista nenhuma. O resumo do Painel passa por `reporting.service.ts` linha 114, que delega ao mesmo método. Não existe caminho que leia primeiro e filtre depois. |
| "404 idêntico e nenhum erro nativo do Prisma no envelope" | **Confirmada.** `rating.errors.ts` repete a mensagem `Ticket not found` de U2, e `api-rating.spec.ts` linhas 206-234 compara os dois envelopes campo a campo ignorando só `traceId`, nos caminhos de leitura e de escrita. `all-exceptions.filter.ts` linha 75 converte qualquer erro do Prisma em `INTERNAL_ERROR` com mensagem genérica antes de responder; a violação de unicidade já é convertida no serviço (linhas 114-119). |
| "A migração só acrescenta, e as duas restrições CHECK recusam o que a API recusa" | **Confirmada quanto ao acréscimo**, refutada quanto ao "exatamente": ver R-03. |
| "Nenhum limiar de cobertura alterado e nenhuma chave nova" | **Confirmada.** `apps/api/jest.shared.ts` linhas 70-75 mantém as quatro chaves com os mesmos valores (global 80 linhas; guards 90 ramos e 80 linhas; regras de `tickets`, `notifications`, `conversation` e `reporting` 90 ramos e 80 linhas; `*.service.ts` 80 linhas), e a chave de regras já alcançava `tickets/rules/**`, onde as duas regras puras da U5 ficaram. `apps/web/vitest.config.ts` linha 26 mantém o limiar de 80 linhas. |
