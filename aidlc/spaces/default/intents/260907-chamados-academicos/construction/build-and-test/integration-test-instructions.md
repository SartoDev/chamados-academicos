# Instruções de Teste de Integração — Fronteiras entre Unidades

Derivado dos cinco `unit-test-instructions.md` e `code-summary.md` (em `../u*/code-generation/`), do `## Testing Contract` embutido em cada `code-generation-plan.md`, e das práticas afirmadas em `team.md` § Testing Posture.

Estratégia de testes ativa: **Standard**. No nível da etapa isso exige um conjunto de testes de integração nas fronteiras principais; os testes unitários e de integração por unidade já foram produzidos na Geração de Código e não se repetem aqui.

## O que já existe, e por que não se reescreve

Cada unidade entregou sua própria suíte de integração contra Postgres real, em `apps/api/test/integration/u*/`. Estas instruções **não criam uma segunda suíte**: elas identificam as fronteiras entre unidades, apontam onde cada uma é verificada hoje e definem o que verificar quando uma fronteira mudar.

| Fronteira | Quem depende de quem | Onde é verificada hoje |
|-----------|----------------------|------------------------|
| U2 → U1 | Visibilidade de chamado, catálogos e resumo de usuários pelos serviços públicos de U1 | `test/integration/u2-tickets/`, mais os unitários de `src/tickets/rules/` |
| U3 → U2 | Transação ambiente: mensagem, transição de status e notificação gravadas juntas ou nenhuma | `test/integration/u3-conversation/`, caminho de `onRequesterMessage` |
| U4 → U2 | `searchTickets`, `countTickets`, `getDurationAverages` e o campo aditivo `openedAt` em `TicketListRow` | `test/integration/u4-reporting/ticket-aggregations.spec.ts` e `reporting-service.spec.ts` |
| U5 → U2 | Visibilidade de chamado para avaliar e ler; recorte por encerramento | `test/integration/u5-rating/rating-service.spec.ts` |
| U5 → U4 | Resumo de avaliações compondo o painel | `test/integration/u5-rating/` e `apps/web/src/features/reports/` |
| Todas → U1 | Limpeza compartilhada de tabelas entre testes | `test/integration/u1-foundation/support/database.ts` |

## Como Rodar

Pré-requisito, uma vez por sessão:

```bash
docker compose --profile test up -d postgres-test
```

Integração completa, com cobertura:

```bash
npx jest --config apps/api/jest.integration.config.ts --runInBand --coverage
```

Portão combinado (unitários e integração na mesma medição de cobertura):

```bash
npx jest --config apps/api/jest.config.ts --runInBand --coverage
```

Por unidade, quando a mudança é local:

```bash
npx jest --config apps/api/jest.integration.config.ts --runInBand apps/api/test/integration/u1-foundation
npx jest --config apps/api/jest.integration.config.ts --runInBand apps/api/test/integration/u2-tickets
npx jest --config apps/api/jest.integration.config.ts --runInBand apps/api/test/integration/u3-conversation
npx jest --config apps/api/jest.integration.config.ts --runInBand apps/api/test/integration/u4-reporting
npx jest --config apps/api/jest.integration.config.ts --runInBand apps/api/test/integration/u5-rating
```

`--runInBand` é obrigatório: as suítes compartilham um único banco e truncam tabelas entre testes, então execução paralela se atropela.

## O que Todo Teste de Fronteira Precisa Afirmar

Quando uma fronteira entre unidades mudar, o teste que a cobre precisa afirmar as quatro coisas abaixo. São as regras que o projeto afirmou e que nenhuma mudança pode afrouxar.

1. **Atomicidade.** Operação que grava em mais de uma tabela grava tudo ou nada. O teste provoca a falha no meio (por exemplo, recusa de regra depois da primeira escrita) e verifica que nenhuma linha sobrou — nem chamado, nem histórico, nem passagem, nem notificação, nem mensagem.
2. **Visibilidade dentro da consulta.** O ator é filtrado na própria cláusula `where` do Prisma, nunca buscado e comparado depois. O teste cobre o caminho do ator que não pode ver o recurso e exige `404` idêntico ao de recurso inexistente.
3. **Fronteira de dados.** Nenhuma consulta de uma unidade lê a tabela de outra para filtrar, conforme regra afirmada em `project.md`. Quando a leitura é inevitável, ela passa pelo serviço público da unidade dona, e o teste verifica que o serviço interno não é importado fora do próprio módulo.
4. **Envelope de erro.** Toda recusa responde no envelope único, com `code` estável, e nenhum erro nativo do Prisma aparece na resposta.

## Verificação dos Cinco Perfis

Por decisão afirmada em `team.md`, a verificação dos perfis (aluno, professor, atendente, gestor, administrador) é feita por **teste de API** com Supertest contra aplicação NestJS real e Postgres real — não há teste de navegador neste projeto.

Obrigações, que valem para todo endpoint novo ou alterado:

- Ao menos um teste afirmando `403` para um perfil que não deve acessar o endpoint.
- Para todo recurso com dono, ao menos um teste de IDOR confirmando que um usuário não lê o registro de outro.
- Para endpoint que exige sessão, um teste de `401` sem sessão.
- O teste de enumeração de rotas de U1 (`test/integration/u1-foundation/route-enumeration.spec.ts`) precisa continuar verde: ele garante que nenhuma rota escapa do guard de negação por padrão.

## Metas de Cobertura

Nenhuma meta abaixo pode ser reduzida para fazer um passo passar. Meta não atingida é reportada como lacuna, com o valor medido.

| Meta | Onde | Origem |
|------|------|--------|
| 80% de linhas | Código não-andaime da API | Piso do escopo `feature` no contrato de testes |
| 90% de ramos e 80% de linhas | `apps/api/src/**/guards/**` | `team.md` |
| 90% de ramos e 80% de linhas | `apps/api/src/{tickets,notifications,conversation,reporting}/rules/**` | `team.md` |
| 80% de linhas | `apps/api/src/**/*.service.ts` | `team.md` |
| Todo requisito aprovado com ao menos um teste | Tabelas `docs/u*/rastreabilidade-requisitos-testes.md` | `team.md`, critério principal |

## Dados de Teste e Isolamento

- **Postgres real, sem mock do Prisma** nos caminhos de negócio.
- Cada suíte limpa as tabelas antes de cada teste, pela ordem definida em `test/integration/u1-foundation/support/database.ts` — um único `TRUNCATE ... RESTART IDENTITY CASCADE` com a lista completa das onze tabelas.
- Fábricas por unidade, reaproveitadas entre suítes; nomes significativos em vez de valores aleatórios.
- **Relógio injetável** onde a regra depende de tempo (janela de reabertura, recortes de período, data de avaliação). Nenhum teste espera tempo real passar.
- Segredos de teste vêm da configuração de teste, com valores fictícios.

## Fora destas Instruções

- Teste de navegador de ponta a ponta: proibido por decisão afirmada em `project.md`.
- Teste de carga e de desempenho: ver `performance-test-instructions.md`, nesta pasta.
- Varredura de segredo e análise estática: ver `security-test-instructions.md`, nesta pasta, e a etapa de pipeline de CI.
