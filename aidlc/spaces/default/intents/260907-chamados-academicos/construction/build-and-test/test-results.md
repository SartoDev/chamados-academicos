# Resultados de Build e Teste

Execução desta etapa na máquina do autor, em 2026-10-05, com o Postgres de teste do Docker Compose ligado. Todos os números abaixo foram medidos nesta etapa, não herdados dos `code-summary.md` das unidades; onde um número coincide com medição anterior, isso está dito.

Comandos coletados dos cinco `unit-test-instructions.md` e `code-generation-plan.md` (em `../u*/code-generation/`), deduplicados e executados uma vez cada, mais o build e as verificações estáticas de `build-instructions.md` desta pasta.

## Status do Build

| Passo | Comando | Resultado |
|-------|---------|-----------|
| Build da API | `npm run build -w apps/api` | Sucesso, 4,0 s |
| Build do web | `npm run build -w apps/web` | Sucesso, 6,2 s |
| Imagens de contêiner | `docker compose build api web` | Sucesso, 88,4 s; as duas imagens construídas |
| Banco de teste | `docker compose --profile test up -d postgres-test` | Serviço ativo em `127.0.0.1:55432` |

## Verificações Estáticas

| Verificação | Resultado |
|-------------|-----------|
| `npm run lint` | Sem erro |
| `npm run typecheck` | Sem erro nos dois pacotes, `strict: true` |
| `npm run format:check` | "All matched files use Prettier code style!" |
| `npm run openapi:check -w apps/api` | "openapi.json is up to date." |
| `npm audit --omit=dev --audit-level=high` | **Reprovou na primeira execução**; passa após a correção descrita abaixo |
| `npm audit` (completo, inclui desenvolvimento) | Vermelho, **report-only** por decisão afirmada em `team.md` |

## Resultados dos Testes

### Execuções de projeto inteiro

| Execução | Suítes / Arquivos | Testes | Cobertura de linha | Ramos |
|----------|-------------------|--------|--------------------|-------|
| API — unitários | — | todos aprovados | 35,19% (2376/6751) | 91,13% |
| API — integração | — | todos aprovados | 95,27% (6432/6751) | 91,75% |
| **API — portão combinado** | 58 | **766 aprovados, 0 falhas, 0 ignorados** | **96,71%** (6529/6751) | 95,70% |
| **Web** | 45 arquivos | **340 aprovados, 0 falhas, 0 ignorados** | **96,33%** (1208/1254) | 91,90% |

Os 35,19% da execução unitária isolada não são lacuna: essa configuração não declara limiar global, porque os services que tocam dados de negócio são cobertos pela integração contra Postgres real, sem mock do Prisma — prática afirmada em `team.md`.

### Execuções restritas por unidade

Um comando por unidade e por camada, deduplicado do conjunto declarado nas cinco unidades.

| Unidade | API unitários | API integração | Web |
|---------|---------------|----------------|-----|
| U1 Fundação | Aprovado (após correção) | Aprovado (após correção), 21 suítes | Aprovado (após correção), 21 arquivos / 144 testes |
| U2 Chamados | Aprovado, 2,2 s | Aprovado, 28,0 s | Aprovado, 18 arquivos / 132 testes |
| U3 Conversa | Aprovado, 1,8 s | Aprovado, 11,9 s | Aprovado, 11 arquivos / 93 testes |
| U4 Indicadores | Aprovado, 1,8 s | Aprovado, 14,8 s | Aprovado, 16 arquivos |
| U5 Avaliação | Aprovado, 1,8 s | Aprovado, 15,1 s | Aprovado, 17 arquivos |

## Falhas Encontradas, e o que Foi Feito

Quatro dos 28 passos reprovaram na primeira execução. **Nenhum teste falhou em passo algum**: as quatro reprovações foram de limiar de cobertura em execução parcial e de auditoria de dependência. As duas causas foram corrigidas dentro desta etapa, sem enfraquecer, relaxar ou desligar meta alguma.

### Falha 1 — `npm audit --omit=dev --audit-level=high`

**Sintoma.** Três avisos de severidade alta em `brace-expansion` e um em `braces`, na árvore de **produção**. A verificação passava mais cedo no mesmo dia: os avisos são novos na base de dados de advisories.

**Diagnóstico.** A cadeia inteira entrava por um único pacote:

```
web → shadcn@4.21.0 → ts-morph → @ts-morph/common → fast-glob → micromatch → braces
                               → minimatch → brace-expansion
```

`shadcn` é a **CLI de scaffolding** de componentes, não dependência de execução: nenhum arquivo de `apps/web/src` a importa, e o que existe no repositório é o `components.json`, que é a configuração dela. Os componentes gerados importam `radix-ui`, `class-variance-authority` e afins — nunca `shadcn`. Estava declarada em `dependencies` por classificação equivocada.

**Correção aplicada.** `shadcn` movida de `dependencies` para `devDependencies` em `apps/web/package.json`, com `npm install` regenerando o `package-lock.json`. Nenhum código foi alterado; nenhum override foi criado; o nível da auditoria não foi rebaixado.

**Verificação da correção.**

| Comando | Resultado |
|---------|-----------|
| `npm audit --omit=dev --audit-level=high` | **Passa** |
| `npm ls shadcn --omit=dev` | `(empty)` — a CLI saiu da árvore de produção |
| `npm run build -w apps/web` | Sucesso, 4,8 s |
| `npx vitest run --coverage` | Aprovado, 37,5 s, cobertura inalterada |
| `npx jest --config apps/api/jest.config.ts --runInBand --coverage` | Aprovado, 96,71% de linhas — idêntico ao de antes |
| `npm run lint`, `npm run typecheck` | Sem erro |

**O que permanece, declarado.** A árvore de produção ainda tem um aviso de `fast-uri` em severidade **moderada**. O critério afirmado em `project.md` bloqueia severidade **alta**, então isso não reprova o portão — e fica registrado aqui em vez de passar em silêncio.

### Falha 2, 3 e 4 — os três comandos restritos de U1

**Sintoma.** Os três comandos declarados em `../u1-foundation/code-generation/unit-test-instructions.md` reprovaram: unitários da API (21,64% de linhas), integração da API (70,64%) e web (50,31%).

**Diagnóstico.** Os três declaram `--coverage`, e o limiar global de 80% é aplicado sobre uma execução **deliberadamente parcial**: a cobertura é medida sobre o projeto inteiro enquanto apenas os testes de U1 rodam. Nenhuma asserção falhou em nenhuma das três. O comando passava quando U1 era a única unidade do repositório e deixou de passar quando U2 a U5 acrescentaram código. As unidades U2 a U5 não declaram `--coverage` em comando restrito, e passam.

**Correção aplicada.** Os comandos restritos canônicos desta etapa, em `integration-test-instructions.md` desta pasta, não levam `--coverage`: a cobertura é verificada no portão completo, onde o piso de 80% é atingido com folga. As três execuções foram repetidas sem a opção:

| Comando corrigido | Resultado |
|-------------------|-----------|
| `jest --config apps/api/jest.unit.config.ts apps/api/src/{auth,users,catalog,common,config}` | Aprovado, 3,2 s |
| `jest --config apps/api/jest.integration.config.ts --runInBand apps/api/test/integration/u1-foundation` | Aprovado, 24,5 s |
| `vitest run apps/web/src/app apps/web/src/features/{auth,admin}` | Aprovado, 17,6 s |

**O que fica para o portão.** O arquivo de instruções de U1 continua declarando a variante defeituosa. Não o alterei: é artefato de Geração de Código, com revisão final e aprovação já registradas, e corrigi-lo reabriria o recibo daquela etapa. A correção vive nas instruções desta etapa, e a divergência é levada ao portão como achado.

## Matriz de Verificação de Metas

Nenhuma meta foi enfraquecida, relaxada ou desligada. Metas de cobertura vêm do `## Testing Contract` aprovado nos cinco planos de código e de `team.md`; os NFR vêm de `requirements.md`, cada um com seu critério de aceitação declarado.

| Target ID | Fonte | Esperado | Medido | Evidência | Etapa dona | Veredito |
|---|---|---|---|---|---|---|
| COV-API-GLOBAL | Testing Contract, piso do escopo `feature` | 80% de linhas em código não-andaime | 96,71% | Portão combinado, `jest.config.ts --coverage` | build-and-test | Met |
| COV-WEB-GLOBAL | Testing Contract, piso do escopo `feature` | 80% de linhas | 96,33% | `vitest run --coverage` | build-and-test | Met |
| COV-GUARDS | `team.md` § Testing Posture | 90% de ramos e 80% de linhas em `src/**/guards/**` | 100% e 100% | Portão combinado, limiar por caminho em `jest.shared.ts` | build-and-test | Met |
| COV-RULES | `team.md` § Testing Posture | 90% de ramos e 80% de linhas em `src/{tickets,notifications,conversation,reporting}/rules/**` | Pior ramo 94,44%; pior linha 100% | Portão combinado | build-and-test | Met |
| COV-SERVICES | `team.md` § Testing Posture | 80% de linhas em `src/**/*.service.ts` | Pior 95,56% | Portão combinado | build-and-test | Met |
| COV-POR-REQUISITO | `team.md`, critério principal | Todo requisito aprovado com ao menos um teste | 110 de 110 critérios e 58 de 58 requisitos folha cobertos | `cross-unit-traceability.md`, nesta pasta | build-and-test | Met |
| BUILD-API | `build-instructions.md` | Build sem erro | Sucesso | `npm run build -w apps/api` | build-and-test | Met |
| BUILD-WEB | `build-instructions.md` | Build sem erro | Sucesso | `npm run build -w apps/web` | build-and-test | Met |
| LINT | `team.md` § Deployment, bloqueante | ESLint sem erro | Sem erro | `npm run lint` | build-and-test | Met |
| TYPES | `team.md` § Deployment, bloqueante | `tsc --noEmit` com `strict: true` | Sem erro | `npm run typecheck` | build-and-test | Met |
| FORMAT | `team.md` § Deployment, bloqueante | Prettier conforme | Conforme | `npm run format:check` | build-and-test | Met |
| CONTRATO-OPENAPI | `team.md` § Code Style | `openapi.json` igual ao gerado do código | Igual | `npm run openapi:check -w apps/api` | build-and-test | Met |
| AUDIT-PROD | `project.md` § Mandated, bloqueante | Nenhuma vulnerabilidade alta em dependência de produção | Nenhuma alta; uma moderada (`fast-uri`) | `npm audit --omit=dev --audit-level=high` após a correção | build-and-test | Met |
| NFR1 | `requirements.md` | Ator filtrado dentro da própria consulta | Confirmado | Revisão de código das cinco unidades, todas `READY`, mais testes de IDOR | code-generation | Met |
| NFR2 | `requirements.md` | Teste de 403 em todo endpoint não público | Confirmado | Suítes de API das cinco unidades e enumeração de rotas de U1 | code-generation | Met |
| NFR3 | `requirements.md` | Envelope de erro único, sem vazar detalhe interno | Confirmado | Filtro global converte erro do Prisma; verificado nas suítes de API | code-generation | Met |
| NFR4 | `requirements.md` | Recurso invisível responde 404, não 403 | Confirmado | Comparação de envelope campo a campo em `api-rating.spec.ts` e equivalentes | code-generation | Met |
| NFR5 | `requirements.md` | WCAG 2.1 nível A nas telas do corte mínimo | Não medido nesta etapa | `docs/u*/roteiro-inspecao-manual.md`, datados e versionados | Inspeção manual do autor | Unverified |
| NFR6 | `requirements.md` | Nenhuma tela exige rolagem horizontal em 375px | Não medido nesta etapa | `docs/u*/roteiro-inspecao-manual.md` | Inspeção manual do autor | Unverified |
| NFR7 | `requirements.md` | Senha com hash resistente a força bruta | Confirmado | `password-hasher.ts` e `schema.prisma`; testes de autenticação de U1 | code-generation | Met |
| NFR8 | `requirements.md` | Subida completa por um comando de composição | Confirmado | `docker compose build api web` nesta etapa; migrações aplicadas na subida | build-and-test | Met |
| NFR9 | `requirements.md` | Nenhum segredo versionado; falha na inicialização sem variável | Parcial | Teste de configuração de U1 cobre a falha; `gitleaks` é do pipeline | ci-pipeline | Unverified |
| PERF | Inventário desta etapa | Nenhuma meta de desempenho declarada em fonte alguma | N/A | `performance-test-instructions.md`, nesta pasta | — | N/A |

### Metas com veredito diferente de `Met`

Três, e nenhuma por defeito de código:

- **NFR5 e NFR6** só se verificam olhando a tela, e este projeto decidiu não ter teste de navegador. Os roteiros datados existem e estão versionados; a execução é do autor. Ficam `Unverified` em vez de serem declaradas atingidas sem evidência.
- **NFR9** tem duas metades: a falha na inicialização sem variável obrigatória está coberta por teste de U1; a varredura de segredo (`gitleaks`) pertence ao pipeline de CI, a etapa seguinte, e não roda no host. Fica `Unverified` com etapa dona nomeada.
- **PERF** é a única linha `N/A`: o inventário não encontrou meta de desempenho em nenhuma fonte, porque as etapas de requisitos não funcionais foram cortadas deste fluxo. Inventar um limiar agora seria fabricar requisito.

## Conclusão desta Etapa

O build passa, as suítes passam por inteiro, os cinco limiares de cobertura são atingidos com folga e o gate de rastreabilidade entre unidades dá **PASS**. Duas falhas reais foram encontradas e corrigidas dentro da etapa — uma de classificação de dependência, que tirou uma cadeia vulnerável da árvore de produção, e uma de comando de teste declarado em U1. Três metas permanecem `Unverified`, todas por dependerem de inspeção humana ou da etapa seguinte, e nenhuma por lacuna de implementação.
