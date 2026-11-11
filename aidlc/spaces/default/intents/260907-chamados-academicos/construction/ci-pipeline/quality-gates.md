# Portões de Qualidade

Derivado de `build-and-test-summary.md` e `test-results.md` (em `../build-and-test/`), dos cinco `code-summary.md` (em `../u*/code-generation/`), de `ci-config.md` desta pasta, e das decisões afirmadas em `team.md` § Deployment e § Testing Posture e em `project.md` § Mandated.

O conjunto de portões abaixo é o confirmado pelo autor na seção `## Consolidated Summary Confirmation` de `ci-pipeline-questions.md`, com recibo `SUMMARY_CONFIRMATION_RECORDED` no livro de auditoria — seis bloqueantes afirmados, três apenas reportando, mais o `openapi:check` acrescentado nesta etapa e aprovado ali.

## Onde o Bloqueio Realmente Acontece

Três camadas, com poderes diferentes. Confundi-las é a forma mais fácil de achar que o projeto está protegido quando não está.

| Camada | O que roda | Poder real |
|--------|------------|------------|
| **Hook local de pre-push** (`.githooks/pre-push`) | `npm run lint` e `npm run test:unit` | **Impede o `git push`.** É o único portão que de fato barra código |
| **Pipeline de CI** (`.github/workflows/ci.yml`) | Os seis portões bloqueantes abaixo | **Falha o job.** Não impede merge: `main` não tem proteção no servidor, por decisão afirmada |
| **Revisão humana** | O próprio autor, mais os agentes de qualidade e segurança do fluxo | Julgamento; não há segundo revisor humano neste projeto |

A consequência aceita conscientemente: um pull request com o pipeline vermelho **pode** ser mesclado pelo autor. Foi assim que a prática foi afirmada (`project.md` § Forbidden proíbe configurar proteção que exija CI verde).

## Portões Bloqueantes

Falham o job. Seis itens afirmados mais um acréscimo confirmado pelo autor nesta etapa.

| # | Portão | Comando | Critério | Origem |
|---|--------|---------|----------|--------|
| 1 | Tipos | `npm run typecheck -w apps/api` e `-w apps/web` | `tsc --noEmit` com `strict: true`, sem erro | `team.md` § Deployment |
| 2 | Lint | `npm run lint` | ESLint sem erro no repositório | idem |
| 3 | Formatação | `npm run format:check` | Prettier conforme | idem |
| 4 | Testes e cobertura | `npm run test:coverage` nos dois pacotes | Suítes aprovadas **e** limiares atingidos | idem, mais `team.md` § Testing Posture |
| 5 | Segredo commitado | `gitleaks/gitleaks-action@v2` | Nenhum segredo no histórico | `project.md` § Mandated |
| 6 | Auditoria de produção | `npm audit --omit=dev --audit-level=high` | Nenhuma vulnerabilidade de severidade alta em dependência de produção | idem |
| 7 | Contrato OpenAPI | `npm run openapi:check -w apps/api` | `openapi.json` igual ao gerado do código | **Acréscimo desta etapa**, confirmado pelo autor; decorre de `team.md` § Code Style, que fixa o contrato como artefato versionado |

## Verificações que Apenas Reportam

Não falham o job. Estão aqui para serem lidas, não ignoradas.

| Verificação | Onde | Por que não bloqueia |
|-------------|------|----------------------|
| Auditoria completa de dependências | Passo do job `api`, com `continue-on-error` | `team.md` § Deployment. Aviso em ferramenta de build não alcança o sistema em execução. **Hoje está vermelha**, pela cadeia transitiva da CLI de scaffolding movida para `devDependencies` |
| CodeQL, configuração padrão | Interface do GitHub, fora do repositório | `project.md` § Mandated. Pendente de habilitação pelo autor |
| Cobertura fora dos caminhos com piso | Saída do Jest e do Vitest | `team.md` § Deployment: não há percentual global afirmado como fato deste projeto além dos pisos abaixo |

## Limiares de Cobertura

Valores exatos, como estão em `apps/api/jest.shared.ts` e `apps/web/vitest.config.ts`. **Nenhum pode ser reduzido para fazer um passo passar** — é regra afirmada, e a etapa de Build and Test a respeitou mesmo quando quatro passos reprovaram.

| Chave | Exigido | Último valor medido | Folga |
|-------|---------|---------------------|-------|
| Global da API, código não-andaime | 80% de linhas | 96,71% | 16,7 pontos |
| Global do web | 80% de linhas | 96,33% | 16,3 pontos |
| `apps/api/src/**/guards/**` | 90% de ramos e 80% de linhas | 100% e 100% | 10 e 20 pontos |
| `apps/api/src/{tickets,notifications,conversation,reporting}/rules/**` | 90% de ramos e 80% de linhas | pior ramo 94,44%; pior linha 100% | 4,4 e 20 pontos |
| `apps/api/src/**/*.service.ts` | 80% de linhas | pior 95,56% | 15,6 pontos |

### O critério principal não é percentual

`team.md` § Testing Posture é explícito: o critério principal é **cobertura por requisito** — cada requisito aprovado com ao menos um teste automatizado que o verifique, com tabela de rastreabilidade mantida no repositório. Os percentuais acima são o critério mecânico do CI, não o critério de qualidade.

Situação na última medição, em `../build-and-test/cross-unit-traceability.md`: **110 de 110** critérios de aceitação e **58 de 58** requisitos funcionais folha cobertos, com arquivo-alvo existente em disco.

## Obrigações de Teste que Nenhum Limiar Captura

Valem para todo endpoint novo ou alterado, por `team.md` § Testing Posture. O CI as verifica apenas de forma indireta, pela suíte; quem as garante é a revisão.

- Ao menos um teste afirmando `403` para um perfil sem direito, em todo endpoint não público.
- Ao menos um teste de IDOR por recurso com dono.
- `404` idêntico ao de recurso inexistente quando o ator não pode ver o recurso.
- Teste negativo de autorização nunca removido para "simplificar" uma suíte.

## O que Fazer Quando um Portão Reprova

Ordem, e ela importa:

1. **Ler a evidência antes de mexer.** A etapa de Build and Test teve quatro reprovações e **nenhum teste falhado**: duas eram limiar sobre execução parcial e duas eram auditoria de dependência. Diagnosticar primeiro evita "corrigir" o que não está quebrado.
2. **Corrigir a causa, não o limiar.** Enfraquecer, relaxar, rebaixar ou desligar um portão não é correção aceitável — é regra afirmada. Quando a causa é dependência, a correção é reclassificar ou atualizar, com lockfile regenerado, nunca rebaixar o nível da auditoria.
3. **Registrar o que ficou.** Aviso que não bloqueia pelo critério afirmado — como o `fast-uri` em severidade moderada hoje na árvore de produção — fica escrito em vez de passar em silêncio.
4. **Reexecutar e reportar o número medido**, não a afirmação de que passou.

## Pendências de Portão

| Pendência | Dono | Consequência enquanto não fecha |
|-----------|------|---------------------------------|
| Habilitar o CodeQL em configuração padrão na interface do GitHub | Autor | A análise estática afirmada não roda; o pipeline não tem como detectar a ausência |
| Executar os cinco roteiros de inspeção manual (`docs/u*/roteiro-inspecao-manual.md`) | Autor | NFR5 (WCAG 2.1 nível A) e NFR6 (375px) permanecem `Unverified` |
| Primeira execução real do workflow | Autor, no primeiro push | O YAML foi validado e cada comando foi executado localmente, mas o pipeline nunca rodou em runner — o repositório não tem commit algum |
