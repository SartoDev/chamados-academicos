# Instruções de Teste — U3 Conversa (`u3-conversation`)

Derivado de `code-generation-plan.md` desta pasta e do contrato de testes nele embutido (test-after, estratégia padrão, escopo `feature`), e das instruções de teste de U1 e U2.

Os comandos restritos rodam **só os testes de U3** e são executados a partir da raiz do repositório. O portão completo, com os limiares de cobertura, fica numa seção à parte, porque U3 altera arquivos de U1 e U2.

## Configuração dos Executores

Os executores são os de U1 e U2; U3 não cria configuração nova, só amplia a chave de limiar das regras para cobrir `src/conversation/rules/**`.

| Aplicação | Executor | Configuração | Onde ficam os testes de U3 |
|-----------|----------|--------------|----------------------------|
| `apps/api` — unitários | Jest com `@swc/jest` | `apps/api/jest.unit.config.ts` | `*.spec.ts` ao lado do código, em `apps/api/src/conversation/` |
| `apps/api` — integração | Jest com `@swc/jest` e Supertest, contra Postgres real | `apps/api/jest.integration.config.ts` | `apps/api/test/integration/u3-conversation/` |
| `apps/web` | Vitest com Testing Library e jsdom | `apps/web/vitest.config.ts` | `*.test.tsx` ao lado do código, em `apps/web/src/features/conversation/` e, pela mudança do detalhe, `apps/web/src/features/tickets/` |

## Como Rodar os Testes de U3

### Pré-requisito da integração

```bash
docker compose --profile test up -d postgres-test
```

### Backend — unitários de U3

```bash
npx jest --config apps/api/jest.unit.config.ts apps/api/src/conversation
```

### Backend — integração de U3

```bash
npx jest --config apps/api/jest.integration.config.ts --runInBand apps/api/test/integration/u3-conversation
```

### Frontend — U3

```bash
npx vitest run --config apps/web/vitest.config.ts apps/web/src/features/conversation apps/web/src/features/tickets
```

`apps/web/src/features/tickets` entra porque U3 altera o detalhe do chamado para registrar a aba; os testes de U2 dessa pasta rodam junto.

### Prontidão antes do primeiro teste (Step 2 do plano)

Os três comandos acima rodam primeiro com `--passWithNoTests`, antes de existir teste de U3.

## Portão Completo com Cobertura (Step 13 do plano)

Rodado depois dos testes de U3, sobre U1, U2 e U3 juntos. É aqui que os limiares são verificados.

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
| 90% de ramos e 80% de linhas | `apps/api/src/**/guards/**` e `apps/api/src/{tickets,notifications,conversation}/rules/**` | `team.md` |
| 80% de linhas | `apps/api/src/**/*.service.ts` | `team.md` |
| Todo critério de aceitação e toda regra BR de U3 com ao menos um teste | `docs/u3-conversation/rastreabilidade-requisitos-testes.md` | `team.md`, cobertura por requisito |
| De 5 a 8 testes por componente, mais integração nas fronteiras principais | Todos os componentes de U3 | Estratégia padrão |

## Volume Esperado

| Componente | Tipo | Quantidade aproximada |
|------------|------|-----------------------|
| `conversation-access` | unitário | 8, cobrindo leitura e escrita para os cinco perfis, leitor por passagem e Administrador |
| `message-recipients` | unitário | 6, incluindo chamado sem responsável e Gestor que não é o responsável |
| `ConversationService` | integração | 8, incluindo transação desfeita e retorno automático de status |
| API-U3: caminho feliz, 401, 403, 404 idêntico, 409, validação | integração | 20 ou mais, conforme a matriz de perfis |
| Componentes de frontend de U3 | componente | 5 a 8 cada |

## Mocks e Dublês

- **Nada de mock do Prisma** nos caminhos de negócio; o service é testado contra o Postgres de teste.
- **Falha forçada.** Um teste de integração substitui, só nele, o registro de notificação por uma implementação que lança erro depois da gravação da mensagem, para provar que a transação desfaz tudo.
- **Serviços de outras unidades.** Nos testes unitários das regras puras, os fatos do chamado são dados de entrada, não dublês. Na integração, os serviços públicos reais de U1 e U2 são usados.
- **Frontend.** O cliente HTTP é substituído por respostas controladas no nível do `fetch`, com o suporte que já existe em `apps/web/src/test/`.

## Dados de Teste

- **Fábricas** para mensagem, com nomes significativos, reaproveitando as fábricas de usuário, setor, categoria, prioridade e chamado de U1 e U2.
- **Isolamento.** Cada suíte de integração limpa `messages` antes das tabelas de U2 e U1, antes de cada teste.
- **Concorrência de leitura.** O teste que cobre o achado R-06 grava uma mensagem nova entre a primeira e a segunda página e verifica que a junção das páginas não exibe mensagem repetida nem perde mensagem.
- **Segredos.** Os testes usam os valores fictícios da configuração de teste.
