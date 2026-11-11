# Instruções de Teste — U5 Avaliação (`u5-rating`)

Derivado de `code-generation-plan.md` desta pasta e do contrato de testes nele embutido (test-after, estratégia padrão, escopo `feature`), e das instruções de teste de U1 a U4.

Os comandos restritos rodam **só os testes de U5** e são executados a partir da raiz do repositório. O portão completo, com os limiares de cobertura, fica numa seção à parte, porque U5 altera arquivos de U1, U2 e U4.

## Configuração dos Executores

Os executores são os já existentes, **sem nenhuma alteração de configuração**: as regras puras de U5 ficam em `apps/api/src/tickets/rules/`, que a chave de limiar `src/{tickets,notifications,conversation,reporting}/rules/**` já cobre.

| Aplicação | Executor | Configuração | Onde ficam os testes de U5 |
|-----------|----------|--------------|----------------------------|
| `apps/api` — unitários | Jest com `@swc/jest` | `apps/api/jest.unit.config.ts` | `*.spec.ts` ao lado do código, em `apps/api/src/tickets/rules/` |
| `apps/api` — integração | Jest com `@swc/jest` e Supertest, contra Postgres real | `apps/api/jest.integration.config.ts` | `apps/api/test/integration/u5-rating/` |
| `apps/web` | Vitest com Testing Library e jsdom | `apps/web/vitest.config.ts` | `*.test.tsx` em `apps/web/src/features/rating/`, mais os testes já existentes de `features/tickets` e `features/reports`, afetados pelos dois pontos de extensão |

## Como Rodar os Testes de U5

### Pré-requisito da integração

```bash
docker compose --profile test up -d postgres-test
```

### Backend — unitários de U5

```bash
npx jest --config apps/api/jest.unit.config.ts apps/api/src/tickets/rules
```

A pasta é compartilhada com as regras de U2, então os unitários de U2 rodam junto: é proposital, porque U5 acrescenta arquivos nessa pasta e a suíte de U2 tem de continuar verde.

### Backend — integração de U5

```bash
npx jest --config apps/api/jest.integration.config.ts --runInBand apps/api/test/integration/u5-rating
```

O resumo de avaliações, implementado no módulo de indicadores, é exercitado por esta suíte, porque é U5 quem o define.

### Frontend — U5

```bash
npx vitest run --config apps/web/vitest.config.ts apps/web/src/features/rating apps/web/src/features/tickets apps/web/src/features/reports
```

`features/tickets` e `features/reports` entram porque U5 cria um ponto de extensão em cada uma: a suíte existente dessas duas pastas tem de continuar verde **sem alteração de expectativa**, provando que o comportamento anterior não mudou quando nada é passado no ponto novo.

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

Nenhuma meta abaixo é reduzida para fazer um passo passar; uma meta não atingida é reportada como lacuna, com o valor medido. Nenhum limiar é alterado por U5.

| Meta | Onde | Origem |
|------|------|--------|
| 80% de linhas | Código não-andaime da API e do frontend | Piso do escopo `feature` no contrato de testes |
| 90% de ramos e 80% de linhas | `apps/api/src/**/guards/**` e `apps/api/src/{tickets,notifications,conversation,reporting}/rules/**`, que já cobre as regras de U5 | `team.md` |
| 80% de linhas | `apps/api/src/**/*.service.ts` | `team.md` |
| Todo critério de aceitação e toda regra BR de U5 com ao menos um teste | `docs/u5-rating/rastreabilidade-requisitos-testes.md` | `team.md`, cobertura por requisito |
| De 5 a 8 testes por componente, mais integração nas fronteiras principais | Todos os componentes de U5 | Estratégia padrão |
| Ao menos um teste de 403 por endpoint não público e um teste de IDOR por recurso com dono | As três operações de API-U5 | `team.md` |

## Volume Esperado

| Componente | Tipo | Quantidade aproximada |
|------------|------|-----------------------|
| `rating-access` | unitário | 8 ou mais: os cinco perfis na escrita e na leitura, mais responsável, atendente do setor e atendente de setor de passagem |
| `rating-score` | unitário | 5, com os limites 1 e 5, valores fora da escala, valor não inteiro e os rótulos |
| `RatingService` | integração | 10 ou mais: caminho feliz, chamado não encerrado, segunda avaliação, chamado alheio, leitura por cada perfil que pode ler, e o chamado reaberto |
| Resumo de avaliações | integração | 6: visibilidade de Gestor e de Administrador, limites do período, período vazio, e a migração de período do chamado reaberto |
| API-U5: caminho feliz, 401, 403, os dois 404, os dois 409 e validação | integração | 15 ou mais |
| Restrições do banco | integração | 5: escala, tamanho do comentário, unicidade e chave estrangeira |
| Componentes de frontend de U5 | componente | 5 a 8 cada |
| Pontos de extensão de U2 e de U4 | componente | 2, um por ponto, afirmando que sem a propriedade nova o comportamento é o de hoje |

## Mocks e Dublês

- **Nada de mock do Prisma** nos caminhos de negócio; as restrições e o resumo são testados contra o Postgres de teste.
- **Relógio injetável.** A data de avaliação e o recorte do período usam a fonte de tempo já existente, com relógio falso. Nenhum teste espera tempo real passar.
- **Cenário de dados.** Um cenário compartilhado cria chamados encerrados em datas escolhidas, avaliados e não avaliados, e um chamado avaliado e depois reaberto — é o que torna verificável o recorte por encerramento.
- **Frontend.** O cliente HTTP é substituído por respostas controladas no nível do `fetch`, com o suporte já existente em `apps/web/src/test/`.

## Dados de Teste

- **Fábricas** reaproveitadas de U1, U2 e U4, mais uma fábrica de avaliação.
- **Isolamento.** Cada suíte limpa as tabelas antes de cada teste, com `ticket_ratings` apagada antes das tabelas de U2, pela chave estrangeira.
- **Segredos.** Os testes usam os valores fictícios da configuração de teste.
