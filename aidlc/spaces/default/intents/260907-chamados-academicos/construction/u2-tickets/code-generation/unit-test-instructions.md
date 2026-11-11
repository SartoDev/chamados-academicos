# Instruções de Teste — U2 Chamados (`u2-tickets`)

Derivado de `code-generation-plan.md` desta pasta e do contrato de testes nele embutido (test-after, estratégia padrão, escopo `feature`), e das instruções de teste de U1.

Os comandos restritos rodam **só os testes de U2** e são executados a partir da raiz do repositório. O portão completo, com os limiares de cobertura, fica numa seção à parte, porque U2 altera arquivos de U1 e os limiares valem para o código inteiro.

## Configuração dos Executores

Os executores são os de U1; U2 não cria configuração nova, só acrescenta a chave de limiar das regras de U2 em `apps/api/jest.shared.ts`.

| Aplicação | Executor | Configuração | Onde ficam os testes de U2 |
|-----------|----------|--------------|----------------------------|
| `apps/api` — unitários | Jest com `@swc/jest` | `apps/api/jest.unit.config.ts` | `*.spec.ts` ao lado do código, em `apps/api/src/tickets/` e `apps/api/src/notifications/` |
| `apps/api` — integração | Jest com `@swc/jest` e Supertest, contra Postgres real | `apps/api/jest.integration.config.ts` | `apps/api/test/integration/u2-tickets/` |
| `apps/web` | Vitest com Testing Library e jsdom | `apps/web/vitest.config.ts` | `*.test.tsx` e `*.test.ts` ao lado do código, em `apps/web/src/features/tickets/`, `apps/web/src/features/notifications/` e, para a navegação, `apps/web/src/app/` |

## Como Rodar os Testes de U2

### Pré-requisito da integração

```bash
docker compose --profile test up -d postgres-test
```

`DATABASE_URL_TEST` em `.env` aponta para esse serviço, ligado a `127.0.0.1`. Os testes aplicam as migrações no início da suíte.

### Backend — unitários de U2

```bash
npx jest --config apps/api/jest.unit.config.ts apps/api/src/tickets apps/api/src/notifications
```

### Backend — integração de U2

```bash
npx jest --config apps/api/jest.integration.config.ts --runInBand apps/api/test/integration/u2-tickets
```

`--runInBand` porque as suítes compartilham o mesmo banco de teste.

### Frontend — U2

```bash
npx vitest run --config apps/web/vitest.config.ts apps/web/src/features/tickets apps/web/src/features/notifications apps/web/src/app
```

`apps/web/src/app` entra porque U2 altera a navegação, as rotas e a barra superior; os testes de U1 dessa pasta rodam junto.

### Prontidão antes do primeiro teste (Step 2 do plano)

Os três comandos acima rodam primeiro com `--passWithNoTests`, antes de existir teste de U2, para provar que os caminhos e a configuração funcionam.

## Portão Completo com Cobertura (Step 13 do plano)

Rodado depois dos testes de U2, sobre U1 e U2 juntos. É aqui que os limiares são verificados.

```bash
npx jest --config apps/api/jest.unit.config.ts --coverage
npx jest --config apps/api/jest.integration.config.ts --runInBand --coverage
npx vitest run --config apps/web/vitest.config.ts --coverage
```

## Metas de Cobertura

Nenhuma meta abaixo é reduzida para fazer um passo passar; uma meta não atingida é reportada como lacuna, com o valor medido.

| Meta | Onde | Origem |
|------|------|--------|
| 80% de linhas | Código não-andaime da API e do frontend (mesmas exclusões de U1) | Piso do escopo `feature` no contrato de testes |
| 90% de ramos e 80% de linhas | `apps/api/src/**/guards/**` (existente) e `apps/api/src/{tickets,notifications}/rules/**` (nova) | `team.md` |
| 80% de linhas | `apps/api/src/**/*.service.ts` | `team.md` |
| Todo critério de aceitação e toda regra BR de U2 com ao menos um teste | `docs/u2-tickets/rastreabilidade-requisitos-testes.md` | `team.md`, cobertura por requisito |
| De 5 a 8 testes por componente, mais integração nas fronteiras principais | Todos os componentes de U2 | Estratégia padrão |

## Volume Esperado

| Componente | Tipo | Quantidade aproximada |
|------------|------|-----------------------|
| `ticket-transitions` | unitário | 8, cobrindo por tabela todas as combinações de status e ação |
| `ticket-action-policy` | unitário | 8 por grupo de ação (assumir, atribuir, transferir, aguardar, encerrar, reabrir, prioridade) |
| `reopen-window`, `ticket-reference`, `assignee-availability` | unitário | 5 cada |
| `ticket-visibility` | unitário | 6 |
| `notification-recipients` | unitário | 7 |
| `TransactionRunner` | integração | 5 |
| `TicketsService` e `TicketActionsService` | integração | 8 por fluxo, mais os casos de concorrência |
| `TicketsPublicService` e `NotificationsPublicService` | integração | 6 cada |
| `NotificationsService` | integração | 6 |
| API-U2: caminho feliz, 401 e 403 por perfil, acesso alheio, 404 idêntico, códigos de erro | integração | 60 ou mais, conforme a matriz de perfis e operações |
| Componentes de frontend de U2 | componente | 5 a 8 cada |

## Mocks e Dublês

- **Nada de mock do Prisma** nos caminhos de negócio. Service que grava ou lê regra de negócio é testado contra o Postgres de teste.
- **Relógio injetável.** A janela de reabertura recebe a fonte de tempo `Clock`, e os testes usam o relógio falso de `apps/api/test/support/fake-clock.ts`. Os testes nunca esperam tempo real passar.
- **Falha forçada.** Para provar que a transação desfaz tudo, um teste de integração substitui, só naquele teste, o registro de notificação por uma implementação que lança erro depois das gravações anteriores.
- **Concorrência.** Os testes de corrida disparam as duas operações ao mesmo tempo contra o banco real e verificam o estado final, sem depender de ordem de chegada.
- **Frontend.** O cliente HTTP é substituído por respostas controladas no nível do `fetch`, com o suporte de `apps/web/src/test/api-mock.ts`; componentes nunca chamam a API real.

## Dados de Teste

- **Fábricas** para chamado, passagem e notificação com nomes significativos, por exemplo `openTicketOfStudentInSecretaria` e `closedTicket71HoursAgo`, reaproveitando as fábricas de usuário, setor, categoria e prioridade de U1.
- **Isolamento.** Cada suíte de integração limpa as tabelas de U2 e depois as de U1 antes de cada teste, e recria status e prioridades pela carga inicial. Nenhum teste depende da ordem de outro, nem entre suítes de U1 e U2.
- **Segredos.** Os testes usam os valores fictícios da configuração de teste; nenhum segredo real entra no repositório.
