# Resumo do Código — U2 Chamados (`u2-tickets`)

Derivado de `code-generation-plan.md` e `unit-test-instructions.md` desta pasta, do resumo de retorno do agente de desenvolvimento, da tabela `docs/u2-tickets/rastreabilidade-requisitos-testes.md` do repositório e das verificações reexecutadas pelo condutor.

## Situação dos Passos do Plano

Os 13 passos do plano aprovado foram executados. As caixas de `code-generation-plan.md` continuam desmarcadas de propósito: o plano tem impressão digital aprovada, e marcar caixas alteraria o arquivo e invalidaria a aprovação. O progresso fica registrado aqui.

| Passo | Situação |
|-------|----------|
| 1 — Estrutura da unidade e configuração | Concluído |
| 2 — Prontidão dos executores de teste | Concluído |
| 3 — Modelo de dados: implementar | Concluído |
| 4 — Modelo de dados: testes | Concluído |
| 5 — Lógica de negócio: implementar | Concluído |
| 6 — Lógica de negócio: testes | Concluído |
| 7 — API: implementar | Concluído |
| 8 — API: testes | Concluído |
| 9 — Frontend: implementar | Concluído |
| 10 — Frontend: testes | Concluído |
| 11 — Ambiente e build | Concluído; `docker compose build api web` e `docker compose up` verificados |
| 12 — Documentação | Concluído; a execução do roteiro de inspeção manual é do autor |
| 13 — Rastreabilidade e execução final | Concluído |

A geração foi interrompida uma vez pelo limite de uso da API, ainda no Step 1, e retomada pelo mesmo agente. Na retomada, o agente conferiu os quatro arquivos já existentes em disco antes de seguir, e o condutor confirmou a lista pelo estado do repositório.

## Arquivos Criados e Alterados

A lista completa de caminhos está em `source-manifest.json`, nesta pasta.

| Área | Conteúdo |
|------|----------|
| `apps/api` — novo | `src/tickets/` (services, controllers, apresentador, tipos, erros, DTOs e seis módulos de regras puras), `src/notifications/` (service, service público, controller, apresentador, tipos, DTO e regra de destinatários), `src/common/prisma/transaction-runner.ts`, migração `20260916012356_u2_tickets` |
| `apps/api` — alterado | `prisma/schema.prisma` (quatro modelos, dois enums, relações inversas e índices), `src/app.module.ts`, `src/common/errors/error-codes.ts` (nove códigos de U2), `src/common/prisma/prisma.module.ts`, `src/users/users-public.service.ts`, `src/catalog/catalog-public.service.ts`, `jest.shared.ts`, `jest.unit.config.ts`, `openapi.json` |
| `apps/api` — testes | 7 arquivos unitários em `src/tickets/rules/` e `src/notifications/rules/`; 10 suítes de integração em `test/integration/u2-tickets/`, com dois arquivos de suporte; `test/integration/u1-foundation/support/database.ts` passou a limpar as tabelas de U2 antes das de U1 |
| `apps/web` — novo | `src/features/tickets/` (Meus Chamados, Novo Chamado, Detalhe com abas e ações, Fila do Setor, Chamados do Administrador, diálogos, componentes e regras) e `src/features/notifications/` (sino, painel, lista e página), `src/test/ticket-fixtures.ts` |
| `apps/web` — alterado | `app/navigation.ts`, `app/AppRoutes.tsx`, `app/layout/TopBar.tsx`, `app/i18n/error-code-messages.ts`, `app/api/types.ts` |
| `apps/web` — removido | `app/ProvisionalHomePage.tsx`, a tela provisória de entrada de U1 (BR9.1) |
| `docs/u2-tickets` | `rastreabilidade-requisitos-testes.md` e `roteiro-inspecao-manual.md`; `README.md` ganhou a seção de U2 |

Arquivos ignorados pelo Git e não reivindicados: `.env` local com valores fictícios, `node_modules/`, `dist/`, `coverage/` e o cliente Prisma gerado.

## Decisões de Implementação

- **Transação ambiente.** `TransactionRunner` com `AsyncLocalStorage`, provido pelo `PrismaModule` global: cada operação de escrita roda em `run()`, os services leem e gravam por `db()`, e os serviços públicos de U1 passaram a ler pelo mesmo cliente. Nenhuma assinatura pública mudou e nenhum tipo do Prisma atravessa fronteira. É a resposta ao achado R-01 da revisão do desenho funcional, e U3 usará o mesmo mecanismo.
- **Concorrência.** Cada ação aplica a visibilidade, bloqueia a linha do chamado com `SELECT ... FOR UPDATE` e relê o estado antes de decidir, tudo dentro da transação. O número visível é uma sequência do Postgres.
- **Ordem do histórico.** Por momento, depois pela ordem do enum do campo, depois pelo identificador: determinística para entradas gravadas na mesma operação.
- **Limpeza do banco de teste.** `truncateU1Tables` virou apelido de `truncateTestTables`, que limpa U2 antes de U1, para não alterar as suítes de U1 fora do plano.
- **Distribuição dos limiares.** A chave de ramos das regras de U2 é cobrada nas execuções que exercitam essas regras: a unitária e a combinada. A configuração de integração declara os limiares que a própria execução sustenta — o global, o de guards e o de services. Nenhum valor de limiar mudou, e a chave continua declarada em `jest.shared.ts`.
- **Comandos por unidade no README.** Deixaram de usar `--coverage`: com U2 no repositório, uma execução restrita a U1 mediria zero nos arquivos de U2 e falharia nos limiares globais. A cobertura é verificada no portão completo, como o plano determina. Nenhum limiar foi alterado.

## Cobertura e Testes

Medições do agente na execução final (Step 13), em 2026-09-15, e reexecução do condutor.

| Suíte | Resultado |
|-------|-----------|
| API — unitários de U2 | 7 suítes, 74 testes aprovados |
| API — integração de U2 | 10 suítes, 154 testes aprovados |
| API — portão combinado de U1 com U2 | 42 suítes, 519 testes aprovados |
| Web — comando de U2, incluindo `app/` de U1 | 18 arquivos, 132 testes aprovados |
| Web — suíte completa | 29 arquivos, 206 testes aprovados |

| Limiar | Exigido | Medido |
|--------|---------|--------|
| API — linhas no código que não é andaime | 80% | 97,43% |
| Guards — ramos por arquivo | 90% | 100% |
| Regras de U2 — ramos por arquivo | 90% | 100% (sete arquivos) |
| Regras de U2 — linhas por arquivo | 80% | 100% |
| Services — linhas por arquivo | 80% | menor valor 95,74% |
| Web — linhas global | 80% | 94,73% |

Verificações reexecutadas pelo condutor, sem alterar nada: `npm run lint`, `npm run typecheck` e `npm run format:check` sem erros, e `npm run openapi:check -w apps/api` confirma o `openapi.json` atualizado. As auditorias de dependências de produção e completa terminaram com 0 vulnerabilidades na execução do agente.

Execuções de teste reexecutadas pelo condutor, já com a correção dos limiares:

| Execução | Resultado |
|----------|-----------|
| `jest --config apps/api/jest.unit.config.ts --coverage` | 21 suítes, 200 testes aprovados |
| `jest --config apps/api/jest.integration.config.ts --runInBand --coverage` | 21 suítes, 319 testes aprovados; linhas 95,79% |
| `jest --config apps/api/jest.config.ts --runInBand --coverage` | 42 suítes, 519 testes aprovados; linhas 97,43%, ramos 96,18% |
| `vitest run --config apps/web/vitest.config.ts --coverage` | 29 arquivos, 206 testes aprovados; linhas 94,73% |

Nenhum limiar ficou abaixo do exigido em nenhuma das quatro execuções, e os números batem com os que o agente declarou.

Sensores da etapa: rastreabilidade, seções obrigatórias e tipos passaram. O sensor de lint devolveu `eslint-bad-output` e não produziu resultado utilizável neste projeto; a verificação de lint vale pelo `npm run lint` da raiz, que cobre o repositório inteiro e passa sem erros.

Cobertura por requisito: cada critério de aceitação e cada regra BR de U2 aponta para testes em `docs/u2-tickets/rastreabilidade-requisitos-testes.md` e em `traceability.json` desta pasta, que passou no sensor de rastreabilidade com 146 identificadores e nenhuma lacuna.

## Desvios em Relação ao Plano e ao Desenho

| Desvio | Onde | Motivo | Situação |
|--------|------|--------|----------|
| `TicketListItem` e `TicketDetail` trazem também `requester` e `openedAt` | API-U2 | A fila e a visão do Administrador precisam do solicitante e da data de abertura, conforme `frontend-components.md` | Aditivo ao contrato; presente no `openapi.json` gerado |
| Histórico e passagens aceitam `page` e `pageSize` | API-U2 | Alinha as duas leituras à convenção de listas de X-01 | Aditivo |
| `assignable-users` devolve `{ items }` sem metadados de página | API-U2 | A lista é curta e não pagina | Divergência da convenção de listas, registrada aqui |
| Comandos por unidade sem `--coverage` no README | `README.md` | Ver Decisões de Implementação | Os limiares continuam verificados no portão completo |
| Teste da barra superior mudou de sentido | `apps/web` | Afirmava o sino desabilitado "em breve"; o placeholder deixou de existir por BR9.1 e BR9.6 | O teste agora afirma o sino em funcionamento, com rótulo acessível |
| Limiar das regras de U2 na execução isolada de integração | `apps/api/jest.integration.config.ts` | A chave vinha dos limiares compartilhados e era cobrada também na execução que quase não exercita as regras puras, reprovando `reopen-window.ts` por ramos | Corrigido depois da verificação do condutor: a configuração de integração passou a declarar o global, o de guards e o de services, e a chave das regras segue cobrada na unitária e na combinada, com os mesmos valores |
| Dois testes do próprio agente foram corrigidos | `apps/web`, `apps/api` | A sessão de oito horas de U1 expira quando o relógio falso avança 71 horas na reabertura, e duas asserções de navegação corriam antes do redirecionamento | Corrigidos no teste, não no código: o teste reemite o cookie e espera a navegação |

Divergências já registradas no desenho funcional e confirmadas na implementação: `reference` no formato `#n`, `view=all`, `queue=passed`, `assigneeUnavailable`, `justification` nas entradas de histórico de setor, a operação de quem pode receber atribuição, `findAssignableInSector` em SVC-01, e `onRequesterMessage` sem notificação própria.

## Pendências e Riscos

- **Inspeção manual:** o autor executa `docs/u2-tickets/roteiro-inspecao-manual.md` e registra os resultados (AC5.3.1, AC5.3.2, AC5.3.5, AC5.3.6, AC5.4.1, AC5.4.2, AC5.4.4).
- **AC1.5.5** (nenhum canal externo) não tem teste direto: é verificado pelo efeito observável, uma linha em `notifications`, mais revisão de código.
- **Achado R-02 do desenho funcional:** o recorte "não atribuídos" continua sem os chamados de responsável indisponível, que aparecem em "todos" e "meus".
- **`countTickets` e `getDurationAverages`** seguem fora, para o Bolt de U4.
- **Docker Desktop parou sozinho duas vezes** durante a geração e foi reiniciado; o contêiner `postgres-test` continua no ar, ligado a `127.0.0.1:55432`.
- **Migrações futuras:** um `prisma migrate dev` pode propor remover as restrições criadas em SQL, de U1 e agora de U2; toda migração gerada precisa ser revisada.
- **Integração Contínua:** o workflow com os dois jobs é da etapa de pipeline de CI.
- **Git:** nada foi commitado; todos os arquivos continuam não rastreados no ramo `main`, aguardando o autor.
