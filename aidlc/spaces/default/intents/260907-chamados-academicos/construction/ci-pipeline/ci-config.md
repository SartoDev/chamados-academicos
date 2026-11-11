# Configuração do Pipeline de Integração Contínua

Derivado de `build-and-test-summary.md` e `test-results.md` (em `../build-and-test/`), dos cinco `code-summary.md` (em `../u*/code-generation/`), das respostas confirmadas em `ci-pipeline-questions.md` desta pasta, e das decisões afirmadas em `team.md` § Deployment e `project.md` §§ Mandated e Forbidden.

Arquivo gerado no repositório: **`.github/workflows/ci.yml`**.

As quatro respostas derivadas e o acréscimo do `openapi:check` foram confirmados pelo autor na seção `## Consolidated Summary Confirmation` de `ci-pipeline-questions.md`, com recibo `SUMMARY_CONFIRMATION_RECORDED` no livro de auditoria. Este documento descreve o pipeline tal como aprovado ali.

## O que este pipeline é, e o que ele não é

O CI deste projeto **falha o job, mas não impede o merge.** `main` não tem proteção configurada no servidor, por decisão afirmada, e `project.md` § Forbidden proíbe configurá-la. O portão real é o **hook local de pre-push**, que roda lint e a suíte rápida antes de permitir o `git push`; o pipeline no servidor é auditoria e registro.

Isso está escrito no topo do próprio workflow, em comentário, para que ninguém leia um run vermelho como "o merge está bloqueado".

## Forma do Workflow

Um único workflow, dois jobs, como `project.md` § Mandated exige.

| | `api` | `web` |
|---|---|---|
| Runner | `ubuntu-latest` | `ubuntu-latest` |
| Node | De `.nvmrc` (24), com cache de npm pela chave do `package-lock.json` | idem |
| Serviço | `postgres:18-alpine`, com health check | nenhum |
| Passos | 11 | 6 |

**Gatilhos:** todo `push` e todo `pull_request`, conforme `project.md` § Mandated. Execuções da mesma referência se cancelam (`concurrency` com `cancel-in-progress`), para não enfileirar runs obsoletos.

**Permissões:** `contents: read`. O workflow não escreve no repositório, não publica nada e não precisa de mais que isso.

### Por que as verificações de repositório ficam no job `api`

Lint, formatação e as duas auditorias valem para o repositório inteiro, não para um pacote. Com apenas dois jobs disponíveis, colocá-las nos dois significaria rodar a mesma verificação duas vezes por run. Ficaram no `api`, que é o job que de todo modo precisa da instalação completa de dependências. É escolha de economia, declarada aqui para não parecer acidente.

### Por que o job `api` precisa de um Postgres de verdade

A suíte de integração não usa mock do Prisma nos caminhos de negócio — prática afirmada em `team.md`. O serviço `postgres` do runner cumpre o papel que o `postgres-test` do Docker Compose cumpre localmente, e a variável `DATABASE_URL_TEST` aponta para ele.

As migrações **não** são um passo do workflow: o `global-setup.ts` da suíte de integração roda `prisma migrate deploy` por conta própria, exatamente como faz na máquina do autor. Um passo a mais no YAML duplicaria isso.

### Dependência de ordem que vale conhecer

O cliente do Prisma é gerado em `apps/api/src/generated/`, que é ignorado pelo Git e não vem no clone. No workflow, quem o gera é o passo de tipos (`npm run typecheck -w apps/api` executa `prisma generate && tsc --noEmit`), que vem **antes** do passo de testes. Reordenar os passos quebraria o job por falta do cliente gerado, não por defeito do código.

## Verificação Local das Mesmas Linhas de Comando

Todos os comandos do workflow foram executados nesta máquina, na forma exata em que o YAML os chama:

| Comando do workflow | Verificado localmente |
|---------------------|----------------------|
| `npm run lint` | Exit 0 |
| `npm run format:check` | Exit 0 |
| `npm run typecheck -w apps/api` | Exit 0 |
| `npm run openapi:check -w apps/api` | Exit 0 |
| `npm run typecheck -w apps/web` | Exit 0 |
| `npm run build -w apps/web` | Exit 0 |
| `npm run test:coverage -w apps/web` | Exit 0 |
| `npm audit --omit=dev --audit-level=high` | Exit 0 após a correção de classificação de dependência registrada em `../build-and-test/test-results.md` |
| `npm run test:coverage -w apps/api` | **Não executado nesta forma exata.** O comando idêntico por baixo (`jest --config apps/api/jest.config.ts --runInBand --coverage`) foi executado duas vezes hoje, com exit 0 e 96,71% de linhas |
| `gitleaks/gitleaks-action@v2` | **Não executável localmente**: a ação roda no runner. `gitleaks` não está instalado nesta máquina |

As duas linhas não verificadas estão declaradas como tal em vez de serem apresentadas como confirmadas.

## O que Está Deliberadamente Ausente

| Ausente | Por quê |
|---------|---------|
| Publicação de imagem em registry | `project.md` § Forbidden: nenhuma publicação em registry, nenhuma entrega contínua (decisão de Ideação D08) |
| Qualquer passo que use credenciais AWS | `project.md` § Forbidden |
| Deploy, ambiente de homologação ou produção | Não existem neste projeto; o único ambiente de execução é local (D07/D09) |
| Build de imagem de contêiner no CI | Não está no conjunto de portões afirmado. O build das duas imagens foi verificado localmente na etapa de Build and Test, em 88 s |
| Proteção de branch exigindo CI verde | Proibida por decisão afirmada |
| Teste de navegador de ponta a ponta | Proibido por decisão afirmada; os cinco perfis são verificados por teste de API |
| Workflow de CodeQL | O CodeQL é usado em **configuração padrão**, habilitada na interface do GitHub e não por arquivo no repositório. Um workflow próprio duplicaria a varredura |

## Configuração que Vive Fora do Repositório

Dois itens afirmados não são arquivos e precisam ser habilitados uma vez, na interface do GitHub, pelo autor:

1. **CodeQL em configuração padrão** (Security → Code scanning → Default setup). Gratuito por o repositório ser público.
2. **Nada mais.** O `gitleaks` roda pela ação no workflow e, em repositório público, não exige licença.

Enquanto o CodeQL não for habilitado, a análise estática afirmada em `project.md` § Mandated fica pendente — e o pipeline não tem como detectar isso, porque é configuração de conta, não de repositório.
