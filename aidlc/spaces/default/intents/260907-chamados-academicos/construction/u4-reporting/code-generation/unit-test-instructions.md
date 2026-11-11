# Instruções de Teste — U4 Indicadores (`u4-reporting`)

Derivado de `code-generation-plan.md` desta pasta e do contrato de testes nele embutido (test-after, estratégia padrão, escopo `feature`), e das instruções de teste de U1, U2 e U3.

Os comandos restritos rodam **só os testes de U4** e são executados a partir da raiz do repositório. O portão completo, com os limiares de cobertura, fica numa seção à parte, porque U4 altera arquivos de U2 e de U1.

## Configuração dos Executores

Os executores são os já existentes; U4 só amplia a chave de limiar das regras para cobrir `src/reporting/rules/**`.

| Aplicação | Executor | Configuração | Onde ficam os testes de U4 |
|-----------|----------|--------------|----------------------------|
| `apps/api` — unitários | Jest com `@swc/jest` | `apps/api/jest.unit.config.ts` | `*.spec.ts` ao lado do código, em `apps/api/src/reporting/` |
| `apps/api` — integração | Jest com `@swc/jest` e Supertest, contra Postgres real | `apps/api/jest.integration.config.ts` | `apps/api/test/integration/u4-reporting/` |
| `apps/web` | Vitest com Testing Library e jsdom | `apps/web/vitest.config.ts` | `*.test.tsx` e `*.test.ts` em `apps/web/src/features/reports/` e, pela mudança de navegação, `apps/web/src/app/` |

## Como Rodar os Testes de U4

### Pré-requisito da integração

```bash
docker compose --profile test up -d postgres-test
```

### Backend — unitários de U4

```bash
npx jest --config apps/api/jest.unit.config.ts apps/api/src/reporting
```

### Backend — integração de U4

```bash
npx jest --config apps/api/jest.integration.config.ts --runInBand apps/api/test/integration/u4-reporting
```

As agregações implementadas dentro do módulo de U2 são exercitadas por esta suíte, porque é U4 quem as consome.

### Frontend — U4

```bash
npx vitest run --config apps/web/vitest.config.ts apps/web/src/features/reports apps/web/src/app
```

`apps/web/src/app` entra porque U4 acrescenta item de navegação e rota; os testes de U1 a U3 dessa pasta rodam junto.

### Prontidão antes do primeiro teste (Step 2 do plano)

Os três comandos acima rodam primeiro com `--passWithNoTests`.

## Portão Completo com Cobertura (Step 13 do plano)

```bash
npx jest --config apps/api/jest.unit.config.ts --coverage
npx jest --config apps/api/jest.integration.config.ts --runInBand --coverage
npx jest --config apps/api/jest.config.ts --runInBand --coverage
npx vitest run --config apps/web/vitest.config.ts --coverage
```

## Metas de Cobertura

Nenhuma meta abaixo é reduzida para fazer um passo passar; uma meta não atingida é reportada como lacuna, com o valor medido.

| Meta | Onde | Origem |
|------|------|--------|
| 80% de linhas | Código não-andaime da API e do frontend | Piso do escopo `feature` no contrato de testes |
| 90% de ramos e 80% de linhas | `apps/api/src/**/guards/**` e `apps/api/src/{tickets,notifications,conversation,reporting}/rules/**` | `team.md` |
| 80% de linhas | `apps/api/src/**/*.service.ts` | `team.md` |
| Todo critério de aceitação e toda regra BR de U4 com ao menos um teste | `docs/u4-reporting/rastreabilidade-requisitos-testes.md` | `team.md`, cobertura por requisito |
| De 5 a 8 testes por componente, mais integração nas fronteiras principais | Todos os componentes de U4 | Estratégia padrão |

## Volume Esperado

| Componente | Tipo | Quantidade aproximada |
|------------|------|-----------------------|
| `report-period` | unitário | 6, incluindo período invertido, data inválida e padrão de 30 dias com relógio falso |
| `report-access` | unitário | 5, os cinco perfis nas três operações |
| `countTickets` e `getDurationAverages` | integração | 10 ou mais, incluindo visibilidade, limites do período, amostras diferentes e reabertura |
| `ReportingService` | integração | 6, com rótulos de itens desativados e a linha completa da listagem |
| API-U4: caminho feliz, 401, 403 por perfil, período inválido, agrupamento inválido | integração | 15 ou mais |
| Componentes de frontend de U4 | componente | 5 a 8 cada |

## Mocks e Dublês

- **Nada de mock do Prisma** nos caminhos de negócio; as agregações são testadas contra o Postgres de teste.
- **Relógio injetável.** O período padrão de 30 dias e as datas de encerramento dos cenários usam a fonte de tempo já existente, com relógio falso nos testes. Nenhum teste espera tempo real passar.
- **Cenário de dados.** Um cenário compartilhado cria chamados em dois setores, com e sem responsável, encerrados em datas escolhidas, e um chamado reaberto — é o que torna verificáveis as duas amostras e o recorte por encerramento.
- **Frontend.** O cliente HTTP é substituído por respostas controladas no nível do `fetch`, com o suporte já existente em `apps/web/src/test/`.

## Dados de Teste

- **Fábricas** reaproveitadas de U1 e U2, com nomes significativos, mais uma fábrica de chamado encerrado em data controlada.
- **Isolamento.** Cada suíte limpa as tabelas antes de cada teste, na ordem já estabelecida (mensagens, tabelas de U2, tabelas de U1).
- **Segredos.** Os testes usam os valores fictícios da configuração de teste.
