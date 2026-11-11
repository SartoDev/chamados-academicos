# Instruções de Teste — U1 Fundação (`u1-foundation`)

Derivado de `code-generation-plan.md` desta pasta e do contrato de testes nele embutido (test-after, estratégia padrão, escopo `feature`).

Todos os comandos abaixo rodam **só os testes de U1** e são executados a partir da raiz do repositório. Não há comando de projeto inteiro aqui.

## Configuração dos Executores

| Aplicação | Executor | Configuração | Onde ficam os testes de U1 |
|-----------|----------|--------------|----------------------------|
| `apps/api` — unitários | Jest com `@swc/jest` | `apps/api/jest.unit.config.ts` | `*.spec.ts` ao lado do código, em `apps/api/src/auth/`, `apps/api/src/users/`, `apps/api/src/catalog/`, `apps/api/src/common/` e `apps/api/src/config/` |
| `apps/api` — integração | Jest com `@swc/jest` e Supertest, contra Postgres real | `apps/api/jest.integration.config.ts` | `apps/api/test/integration/u1-foundation/` |
| `apps/web` | Vitest com Testing Library e jsdom | `apps/web/vitest.config.ts` | `*.test.tsx` ao lado dos componentes, em `apps/web/src/app/` e `apps/web/src/features/auth/` e `apps/web/src/features/admin/` |

Vitest não é usado no backend porque não emite metadados de decorators e quebra a injeção de dependência do NestJS (`team.md`).

## Como Rodar os Testes de U1

### Pré-requisito da integração

```bash
docker compose --profile test up -d postgres-test
```

`DATABASE_URL_TEST` em `.env` aponta para esse serviço. Os testes aplicam as migrações no início da suíte.

### Backend — unitários

```bash
npx jest --config apps/api/jest.unit.config.ts --coverage apps/api/src/auth apps/api/src/users apps/api/src/catalog apps/api/src/common apps/api/src/config
```

### Backend — integração

```bash
npx jest --config apps/api/jest.integration.config.ts --runInBand --coverage apps/api/test/integration/u1-foundation
```

`--runInBand` porque as suítes compartilham o mesmo banco de teste.

### Frontend

```bash
npx vitest run --config apps/web/vitest.config.ts --coverage apps/web/src/app apps/web/src/features/auth apps/web/src/features/admin
```

### Prontidão antes do primeiro teste (Step 2 do plano)

Os três comandos acima rodam primeiro com `--passWithNoTests` (Jest) e `--passWithNoTests` (Vitest), sem nenhum teste escrito, para provar que o executor e a configuração funcionam antes do Step 4.

## Metas de Cobertura

Nenhuma meta abaixo é reduzida para fazer um passo passar; uma meta não atingida é reportada como lacuna.

| Meta | Onde | Origem |
|------|------|--------|
| 80% de linhas | Código não-andaime de U1 (fora da coleta: `main.ts`, `*.module.ts`, `*.dto.ts`, `prisma.service.ts`, `components/ui/`) | Piso do escopo `feature` no contrato de testes |
| 90% de ramos | Guards e regras de autorização em `apps/api/src/**/guards/**` | `team.md` |
| 80% de linhas | Services em `apps/api/src/**/*.service.ts` | `team.md` |
| Todo critério de aceitação e toda regra BR de U1 com ao menos um teste | Tabela requisito → teste do repositório | `team.md`, cobertura por requisito |
| De 5 a 8 testes por componente, mais integração nas fronteiras principais | Todos os componentes de U1 | Estratégia padrão |

## Volume Esperado

| Componente | Tipo | Quantidade aproximada |
|------------|------|-----------------------|
| `LoginAttemptLimiter` | unitário | 6 |
| `PasswordPolicy` e `PasswordHasher` | unitário | 5 |
| `LoginService` | unitário | 6 |
| Guard global e verificação de origem | unitário | 8 |
| `UsersService` | unitário e integração | 8 |
| `UsersPublicService` | unitário | 5 |
| Services de catálogo | unitário e integração | 8 |
| `CatalogPublicService` | unitário | 7 |
| Carga inicial e validação de configuração | integração | 7 |
| API-U1: caminho feliz, 401 e 403 por perfil, enumeração de rotas, cookie, envelope, origem | integração | 40 ou mais, conforme a matriz de perfis |
| Componentes de frontend de U1 | componente | 5 a 8 cada |

## Mocks e Dublês

- **Nada de mock do Prisma** nos caminhos de negócio. Service que grava ou lê regra de negócio é testado contra o Postgres de teste.
- **Relógio injetável.** O limitador de tentativas e a validade do token recebem a fonte de tempo, e os testes usam um relógio falso controlado. Os testes nunca esperam tempo real passar.
- **Hash de senha.** Nos testes unitários do limitador e do guard, um hasher falso e rápido é aceitável. Nos testes de `LoginService` e na integração, o hasher real é usado para verificar o comportamento de tempo e de comparação.
- **Frontend.** O cliente HTTP é substituído por respostas controladas no nível do `fetch`; componentes nunca chamam a API real.

## Dados de Teste

- **Fábricas** para usuário (por perfil), setor, categoria e prioridade, com valores significativos, por exemplo `activeAgentOfSecretaria` e `inactiveAdmin`, e sem literais soltos.
- **Isolamento.** Cada suíte de integração limpa as tabelas de U1 antes de cada teste e recria os quatro status e as três prioridades pela própria carga inicial. Nenhum teste depende da ordem de outro.
- **Segredos.** Os testes usam valores fictícios definidos na configuração de teste; nenhum segredo real entra no repositório.
