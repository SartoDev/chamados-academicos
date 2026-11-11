# Plano de Geração de Código — U4 Indicadores (`u4-reporting`)

Derivado de `functional-spec.md`, `rules.md`, `entities.md` e `frontend-components.md` (em `../functional-design/`), `contract-summary.md` (X-01, API-U4, SVC-04, SVC-05), `unit-of-work.md`, `requirements.md`, do código de U1, U2 e U3 já existente em `apps/api` e `apps/web`, e das práticas afirmadas em `team.md` e `project.md`.

O código vai para a raiz do repositório (`apps/api`, `apps/web`, `docs/`), nunca para a pasta de registro. Identificadores, código e comentários de código ficam em inglês; textos exibidos ao usuário ficam em português.

## Premissas de Execução

- **Área de trabalho com U1, U2 e U3 prontas.** Repositório no ramo `main`, sem commits. Nenhum commit, push ou pull request nesta geração.
- **Linha de base verde.** Antes de qualquer mudança, lint, `typecheck` e as suítes das três unidades precisam passar; se não passarem, a geração para e reporta.
- **Sem entidade e sem migração.** U4 não cria tabela nem altera o esquema do Prisma. Esta é a única unidade da construção que não gera migração.
- **Achado R-02 da revisão do desenho, que ficou aberto — como o plano o resolve.** A revisão apontou, corretamente, que `searchTickets` devolve `TicketListRow`, que só tem identificadores e não tem `openedAt`, enquanto o desenho descreve a listagem com rótulos e data de abertura. A correção é feita no código, em duas partes:
  - `TicketListRow` ganha o campo `openedAt`, por adição, dentro do módulo de U2 — a mesma regra de extensão aditiva que já vale para `countTickets` e `getDurationAverages` (BR6.2). Nenhum método existente muda de assinatura.
  - A resolução de rótulos e de pessoas é de U4: a partir dos identificadores de `TicketListRow`, a unidade chama a consulta de rótulos de U1 e o resumo de usuários de U1 e monta a resposta de API-U4. U4 não recebe entidade pronta de U2 nem consulta tabela alheia.
  - O desenho está congelado pela revisão final; esta é a leitura que o código segue, e a divergência entre o texto do desenho e o contrato real fica registrada em `code-summary.md` e levada ao portão.
- **Achado R-06 da revisão do desenho, também aberto.** É correção de redação: BR2.2 fala em "amostra zero" no singular, depois de BR4.3 fixar duas amostras. O código devolve as duas contagens; a correção do texto vai ao portão.
- **Arquivos de U2 alterados, só por adição, implementados neste Bolt.**
  - `apps/api/src/tickets/tickets.types.ts`: `openedAt` em `TicketListRow`; tipos de contagem e de médias, já declarados em SVC-05.
  - `apps/api/src/tickets/tickets-public.service.ts`: `countTickets` e `getDurationAverages`, e `openedAt` no resultado de `searchTickets`.
  - `apps/api/src/tickets/tickets.presenter.ts`: o campo novo entra na projeção de leitura.
  - A regra de visibilidade de U2 é reaproveitada como está: as agregações a aplicam dentro da própria consulta, sem cópia nem reimplementação.
- **Arquivos de U1 e do frontend alterados.**
  - `apps/api/jest.shared.ts`: a chave de limiar das regras passa a cobrir também `src/reporting/rules/**`, com os mesmos valores.
  - `apps/web/src/app/navigation.ts` e `AppRoutes.tsx`: item "Painel" e rota, para Gestor e Administrador.
  - `apps/web/src/app/api/types.ts`: tipos de API-U4.
- **Marcos dos tempos, como o desenho fixou.** Atendimento: da abertura até a menor data de entrada de histórico de responsável do chamado. Resolução: da abertura até `closedAt`. Como a reabertura limpa `closedAt` e o encerramento seguinte o grava de novo, o valor atual do campo é sempre o encerramento mais recente; chamado reaberto e ainda aberto fica fora da amostra por ter `closedAt` vazio.
- **Duas amostras.** A resposta de médias devolve `resolutionSampleSize` e `handlingSampleSize`; a de atendimento conta só os chamados que chegaram a ter responsável.
- **Agregação no banco.** As contagens e as médias são calculadas por consulta agregada dentro do módulo de U2, com a condição de visibilidade na própria consulta; nada é somado em memória a partir de listas.
- **Sem camada de repositório.** O service é o único ponto que toca o banco (`team.md`).
- **Docker.** Os testes de integração exigem o daemon ativo e o `postgres-test` ligado a `127.0.0.1`.

## Cobertura: Obrigações Somadas

Nenhum valor de limiar é alterado ou relaxado. U4 só amplia o alcance da chave existente.

- **Global:** 80% de linhas sobre o código que não é andaime.
- **Por caminho, existentes:** 90% de ramos e 80% de linhas em `apps/api/src/**/guards/**` e nas regras de U2 e U3; 80% de linhas em `apps/api/src/**/*.service.ts`.
- **Por caminho, ampliada:** a chave das regras passa a cobrir `apps/api/src/{tickets,notifications,conversation,reporting}/rules/**`, com os mesmos 90% de ramos e 80% de linhas.
- **Por requisito:** todo critério de aceitação e toda regra BR de U4 com ao menos um teste, na tabela requisito → teste do repositório.
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

A ordem segue o `plan_profile` do contrato. As camadas "Repository / data access" e "Data model" existem aqui só como **agregação de leitura**: U4 não tem modelo de dados próprio, então os Steps 3 e 4 tratam das consultas agregadas dentro do módulo de U2.

### Step 1 — Estrutura da unidade

- [ ] Conferir ferramentas e rodar a linha de base (lint, `typecheck`, testes unitários); parar e reportar se algo falhar.
- [ ] `apps/api/src/reporting/` com `ReportingModule` vazio, registrado em `AppModule`.
- [ ] `apps/web/src/features/reports/` com o cliente de API de U4; tipos de API-U4 em `app/api/types.ts`.

### Step 2 — Prontidão dos executores de teste

- [ ] Ampliar a chave de limiar das regras em `apps/api/jest.shared.ts` para cobrir `src/reporting/rules/**`, sem alterar valores nem a distribuição entre configurações.
- [ ] Suporte de integração em `apps/api/test/integration/u4-reporting/support/`, com um cenário que crie chamados de setores diferentes, com e sem responsável, encerrados em datas controladas pelo relógio injetável.
- [ ] Rodar os comandos restritos a U4 de `unit-test-instructions.md` com `--passWithNoTests`.

### Step 3 — Agregações: implementar

- [ ] `countTickets(actor, filter, groupBy)` em `TicketsPublicService`: consulta agregada por `statusId`, `categoryId` ou `sectorId`, com a condição de visibilidade de U2 dentro da própria consulta e o período recortando `openedAt`; devolve uma linha por grupo existente, sem grupos vazios (BR3.1).
- [ ] `getDurationAverages(actor, filter)` em `TicketsPublicService`:
  - resolução: média de `closedAt − openedAt` sobre os chamados visíveis com `closedAt` dentro do período;
  - atendimento: média de `primeira entrada de histórico de responsável − openedAt` sobre o subconjunto que teve responsável;
  - devolve as duas médias em segundos, `resolutionSampleSize` e `handlingSampleSize`, e as duas vêm vazias quando a amostra é zero (BR4.1 a BR4.3).
- [ ] `openedAt` acrescentado a `TicketListRow` e à projeção de `searchTickets`, por adição (achado R-02).

### Step 4 — Agregações: escrever e rodar os testes

- [ ] Integração contra Postgres real, com o relógio controlado:
  - contagem por status, categoria e setor, com visibilidade de Gestor e de Administrador;
  - chamado de outro setor não entra na contagem do Gestor, e chamado que passou pelo setor entra;
  - período recortando pela abertura, incluindo o limite inicial e excluindo o final;
  - médias com amostras diferentes: um chamado encerrado sem nunca ter tido responsável entra na de resolução e não na de atendimento;
  - chamado reaberto e encerrado de novo conta uma vez, pelo encerramento mais recente; reaberto e ainda aberto não entra;
  - período sem dados devolve grupos vazios, total zero, médias vazias e as duas amostras em zero;
  - `openedAt` presente em cada linha de `searchTickets`.

### Step 5 — Lógica de negócio: implementar

- [ ] **Regras puras** em `apps/api/src/reporting/rules/`:
  - `report-period.ts`: normalização e validação do período (BR2.1), com a fonte de tempo injetável para o padrão de 30 dias;
  - `report-access.ts`: perfis por operação (BR1.1).
- [ ] **`ReportingService`**: orquestra as chamadas ao serviço público de U2, resolve rótulos e pessoas pelo serviço público de U1 a partir dos identificadores devolvidos, e monta as respostas de API-U4 (BR3.3, BR5.1, achado R-02). Nenhuma consulta direta ao banco.

### Step 6 — Lógica de negócio: escrever e rodar os testes

- [ ] Unitários de `report-period` (limites, período invertido, data inválida, padrão de 30 dias com relógio falso) e de `report-access` (os cinco perfis nas três operações).
- [ ] Integração de `ReportingService`: rótulos resolvidos inclusive de item desativado; linha de listagem completa com categoria, setor, status, prioridade, responsável e data de abertura.

### Step 7 — API: implementar

- [ ] `ReportingController` com `getTicketCounts`, `getAverageDurations` e `searchTicketsForReport`, DTOs validados, marcação de perfil conforme BR1.1 e respostas conforme API-U4, com as divergências declaradas (duas amostras).
- [ ] `apps/api/openapi.json` regenerado; `openapi:check` passa.

### Step 8 — API: escrever e rodar os testes

- [ ] Integração com Supertest em `apps/api/test/integration/u4-reporting/`:
  - caminho feliz das três operações;
  - 401 sem sessão; 403 para Aluno, Professor e Atendente nas três; 403 para o Administrador na listagem de relatório;
  - período inválido com 400 e o campo indicado;
  - agrupamento ausente ou desconhecido com 400;
  - números do Gestor restritos ao que ele vê, comparados com os do Administrador no mesmo período;
  - o teste de enumeração de rotas de U1 continua verde com as rotas novas.

### Step 9 — Frontend: implementar

- [ ] Item "Painel" e rota para Gestor e Administrador; a aba Consulta só para o Gestor (BR7.5).
- [ ] `features/reports`: `ReportsPage`, `PeriodSelector`, `IndicatorsTab`, `CountCard`, `DurationCard`, `BarChartWithTable`, `QueryTab`, `ReportFilters` e a tabela de chamados reaproveitada de U2, conforme `frontend-components.md`.
- [ ] Preenchimento com zero dos status sem chamado, a partir da lista de status de U1 (BR7.1); cada cartão de tempo com a sua própria amostra; gráfico por setor só para o Administrador.
- [ ] Estados de carregamento, vazio e erro; `data-testid`; tema padrão sem sobrescrever cores; sem biblioteca de gráficos.

### Step 10 — Frontend: escrever e rodar os testes

- [ ] Vitest, de 5 a 8 por componente:
  - `ReportsPage`: abas por perfil, período na URL, recarga ao trocar o período;
  - `IndicatorsTab`: zero nos status sem chamado, estado vazio quando não há chamado nenhum, erro com repetir;
  - `DurationCard`: amostra própria, traço quando não há amostra, nenhuma meta exibida;
  - `BarChartWithTable`: tabela equivalente com rótulo e quantidade;
  - `QueryTab`: filtros combináveis preservados ao paginar, ausência de qualquer ação de exportar.

### Step 11 — Configuração de ambiente e build

- [ ] `docker compose build api web` passa; a subida continua sem passo manual. Nenhuma migração nova.

### Step 12 — Documentação

- [ ] `README.md`: o painel na seção de telas.
- [ ] `docs/u4-reporting/roteiro-inspecao-manual.md`, datado, para AC5.3.1, AC5.3.2, AC5.3.5, AC5.3.6 e AC5.4.4 nas telas de U4.

### Step 13 — Rastreabilidade e execução final

- [ ] `docs/u4-reporting/rastreabilidade-requisitos-testes.md`: cada critério e cada regra BR de U4 apontando para os testes.
- [ ] Rodar lint, `typecheck`, `format:check`, `openapi:check`, `npm audit --omit=dev --audit-level=high`, os testes de U4 e o portão completo de U1 a U4 com cobertura; reportar cada limiar com o valor medido, sem alterá-lo.

## Rastreabilidade História → Passo

| História | Passos |
|----------|--------|
| US6.1 — Acompanhar o desempenho do setor | 3, 4, 5, 6, 7, 8, 9, 10 |
| US6.2 — Consultar listagens filtradas | 3, 5, 6, 7, 8, 9, 10 |
| US5.1 (rotas novas) | 5, 7, 8 |
| US5.3, US5.4 (telas novas) | 9, 10, 12 |
| Critérios transversais CT1, CT6, CT7 | 3, 5, 8, 9, 10 |

## Fora deste Plano

- Workflow de Integração Contínua: etapa de pipeline de CI.
- Commits, push e pull requests: só com pedido explícito do autor.
- U5 (avaliação), que é decisão à parte depois desta unidade.
- Correção do texto de BR2.2 apontada em R-06: o desenho está congelado pela revisão final, e a correção vai ao portão.

## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-09-24T11:37:37Z
**Iteration:** 1
**Request Challenge:** review:232e55be618d264eabc2aa37848b2981

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Minor | `apps/api/src/tickets/tickets-public.service.ts` > `toSqlCondition`, ramo `default` (linhas 138-144) | O renderizador de condição para SQL bruto tem uma cláusula `default` que lança `INTERNAL_ERROR` para qualquer forma de `TicketWhere` não reconhecida — a proteção central contra alargamento silencioso da visibilidade que o próprio `code-summary.md` cita ("Uma forma de condição não reconhecida lança erro interno em vez de alargar silenciosamente o que o ator enxerga"). A suíte de cobertura de integração confirma que essas linhas nunca são exercitadas (`tickets-public.service.ts`, linhas não cobertas `84, 94-99, 139-144`, 83,87% de ramos). Hoje o ramo é de fato inalcançável a partir de `visibilityCondition` e `searchFilterCondition` — a interface `TicketWhere` tem exatamente as dez chaves que o `switch` trata, com checagem de exaustão via `never` —, então não há caminho de visibilidade sem teste em produção; mas a garantia central de segurança desta unidade ("forma desconhecida vira erro interno, nunca alarga") não tem nenhuma evidência de teste direta, e uma futura extensão de `TicketWhere` só quebraria essa garantia silenciosamente se o TypeScript não fosse recompilado a tempo de pegar o erro de exaustão (por exemplo, um `as any` de passagem, ou uma mudança que adicione um campo e trate o `never` com um cast). | Acrescentar um teste unitário que force o ramo `default`, por exemplo chamando `getDurationAverages` com um `actor`/`filter` cuja combinação com um `visibilityCondition` ou `searchFilterCondition` dublado (via `jest.mock` do módulo de regra) produza uma chave fora das dez tratadas, e afirmar que a chamada rejeita com `INTERNAL_ERROR`. Isso transforma a garantia central de segurança do achado em evidência executável, em vez de depender só da checagem de tipo em tempo de compilação. | New |
| R-02 | Minor | `aidlc-sensor-required-sections.ts` sobre `code-generation-questions.md` | O sensor de seções obrigatórias devolve `pass:false` (`h2_count:1`, `findings_count:1`) para `code-generation-questions.md`, que tem só o H2 `## Plan Approval`. Não há modelo (`aidlc/spaces/default/memory/templates/`) configurado para esta etapa, então o sensor cai na heurística genérica de mínimo de duas seções H2, que não se aplica bem a um registro de aprovação de plano — este arquivo, por natureza, é só a pergunta de aprovação e a resposta, como o de outras unidades já revisadas. Não há lacuna de conteúdo real: a aprovação, a impressão digital e os pontos de atenção estão todos presentes no único H2. | Nenhuma ação de conteúdo necessária; registrado para o rastro de auditoria. Se o time quiser eliminar o falso positivo de forma duradoura, considerar um modelo dedicado para arquivos de aprovação de plano em `aidlc/spaces/default/memory/templates/`, fora do escopo desta unidade. | New |

### Validation Tool Results

| Tool | Result | Interpretation |
|---|---|---|
| `aidlc-sensor-traceability.ts` (`--stage code-generation`, `traceability.json` de u4-reporting) | `{"pass":true,"gaps":[],"orphans":[],"missing_from_table":[],"missing_from_upstream_ids":[],"invalid_entries":[],"invalid_targets":[],"findings_count":0}` | Os 44 identificadores upstream (AC e BR de U4) têm cobertura declarada, sem lacuna estrutural. |
| `aidlc-sensor-required-sections.ts` (cada um dos cinco `.md` da pasta) | `pass:true` para `code-generation-plan.md` (6 H2), `unit-test-instructions.md` (7 H2) e `code-summary.md` (6 H2); `pass:false` para `code-generation-questions.md` (1 H2, sem modelo configurado) | Ver achado R-02: falso positivo da heurística genérica sobre um registro de aprovação de plano, não uma lacuna de conteúdo. |
| `npm run lint` | Sem erros | — |
| `npm run typecheck` (dois pacotes, `strict: true`) | Sem erros, nos dois workspaces | — |
| `npm run format:check` | "All matched files use Prettier code style!" | — |
| `npm run openapi:check -w apps/api` | "openapi.json is up to date." | Confirma que o contrato publicado reflete os dois novos campos de amostra e as três rotas novas. |
| `npm audit --omit=dev --audit-level=high` | "found 0 vulnerabilities" | — |
| `npx jest --config apps/api/jest.unit.config.ts --coverage` | 26 suítes, 239 testes aprovados | Bate com `code-summary.md`. |
| `npx jest --config apps/api/jest.integration.config.ts --runInBand --coverage` (contra `postgres-test` real em 127.0.0.1:55432) | 27 suítes, 428 testes aprovados; `tickets-public.service.ts` 96,06% linhas / 83,87% ramos, com as linhas não cobertas exatamente nos ramos `assigneeId` e `default` de `toSqlCondition` | Confirma a alegação do `code-summary.md` de que as formas de condição não exercitadas só estreitam a visibilidade, nunca a alargam (ver achado R-01 sobre a ausência de teste direto do ramo `default`). |
| `npx jest --config apps/api/jest.config.ts --runInBand --coverage` (portão combinado U1 a U4) | 53 suítes, 667 testes aprovados; 96,75% de linhas, 95,85% de ramos | Bate exatamente com os números de `code-summary.md`. |
| `npx vitest run --config apps/web/vitest.config.ts --coverage` | 40 arquivos, 297 testes aprovados; 96,28% de linhas | Bate com `code-summary.md`. |

### Summary

O código resolve corretamente o achado R-02 que a revisão do desenho funcional deixou aberto: `openedAt` foi acrescentado a `TicketListRow` (não a `TicketListItemView`, o tipo errado que uma tentativa anterior de correção havia citado), e `ReportingService.searchTickets` resolve rótulos e pessoas a partir dos identificadores desse tipo, exatamente como o plano descreve — confirmado lendo `tickets.types.ts`, `tickets-public.service.ts` e `reporting.service.ts` diretamente, e pelo teste de integração dedicado ao achado. O tradutor de condição de visibilidade para SQL bruto em `getDurationAverages` usa parâmetros de consulta em todo valor, nunca interpolação de string, e reproduz fielmente o `OR` de setor atual mais setores por onde o chamado passou que `ticket-visibility.ts` define; os testes de integração comparam Gestor e Administrador no mesmo período e period, incluindo os limites do recorte (fechado no início, aberto no fim) tanto para abertura quanto para encerramento, chamado reaberto e reencerrado contado uma vez, e chamado reaberto e ainda aberto fora da amostra — todos verificados tanto contra a implementação quanto reexecutados nesta revisão com Postgres real. As sete verificações de portão (lint, typecheck, format, openapi, audit, e as quatro suítes de teste) foram reexecutadas nesta revisão e batem exatamente com os números que `code-summary.md` declara. Os dois achados desta revisão são Minor e não bloqueiam: a garantia de "forma desconhecida de condição lança erro interno" não tem teste direto (R-01), e o sensor de seções obrigatórias marca um falso positivo sobre o registro de aprovação do plano, que não tem modelo configurado (R-02). Nenhum achado Critical ou Major foi encontrado; um desenvolvedor poderia implementar ou dar manutenção a partir deste plano e deste código sem precisar de orientação adicional do arquiteto.
