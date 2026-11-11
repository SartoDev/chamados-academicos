# Pipeline de CI — Respostas Derivadas e Confirmação

Derivado de `build-and-test-summary.md` e `test-results.md` (em `../build-and-test/`), dos cinco `code-summary.md` (em `../u*/code-generation/`), e das decisões afirmadas em `team.md` § Deployment e `project.md` §§ Mandated e Forbidden.

As quatro perguntas que esta etapa prevê **já estão respondidas** por decisões registradas na entrevista de práticas e nas etapas de Ideação. Pela regra aprendida neste projeto — não perguntar o que decisões registradas já respondem —, elas vêm aqui derivadas, com a origem de cada uma, para sua confirmação no portão em vez de virarem perguntas novas.

## Q1 — Qual ferramenta de CI?

**GitHub Actions.** Um único workflow, com dois jobs (`api` e `web`).

Origem: `project.md` § Mandated — "manter o repositório único, com `apps/api` e `apps/web` em npm workspaces, lint e formatação configurados na raiz, **um único workflow de CI com dois jobs**, e Dockerfiles com contexto de build na raiz" (afirmado na entrevista, Q1). A escolha de GitHub Actions decorre de o repositório ser público no GitHub e de a análise estática afirmada ser o CodeQL em configuração padrão, que é recurso do próprio GitHub.

Não há CodePipeline, CodeBuild nem Jenkins: `project.md` § Forbidden proíbe qualquer passo que exija credenciais AWS.

## Q2 — Qual estratégia de ramos?

**Trunk-based, com `main` como único ramo de longa duração**, ramos de curta duração por unidade de trabalho e squash-merge de volta.

Origem: `team.md` § Way of Working. Dois pontos que mudam o desenho do pipeline:

- **`main` não tem proteção configurada no servidor.** O CI roda em todo push e todo pull request e reporta o resultado, mas **nada no GitHub impede o merge com o pipeline vermelho** — o autor pode aprovar e mesclar o próprio pull request por cima de um CI quebrado. Está afirmado assim, deliberadamente (`project.md` § Forbidden proíbe configurar proteção que exija CI verde).
- **O portão real é local**, no hook de pre-push, que roda lint e a suíte rápida antes de permitir o `git push`. O CI no servidor é auditoria e registro.

Consequência honesta para este artefato: os "quality gates" descritos aqui são **bloqueantes no sentido de falhar o job**, não no sentido de impedir o merge. Dizer o contrário seria descrever um sistema que não existe.

## Q3 — Quais portões de qualidade antes do merge?

Conjunto **bloqueante** (falha o job):

| Portão | Comando | Origem |
|--------|---------|--------|
| Tipos | `tsc --noEmit` com `strict: true` nos dois pacotes | `team.md` § Deployment |
| Lint | `npm run lint` | idem |
| Formatação | `npm run format:check` | idem |
| Testes | Suíte unitária e de integração | idem |
| Segredo commitado | `gitleaks` | `project.md` § Mandated |
| Auditoria de produção | `npm audit --omit=dev --audit-level=high` | idem |

Conjunto **apenas reportando**, sem bloquear:

| Verificação | Por quê |
|-------------|---------|
| Auditoria completa, incluindo `devDependencies` | `team.md` § Deployment; hoje está vermelha pela cadeia transitiva da CLI de scaffolding, que é ferramenta e não vai para produção |
| CodeQL, configuração padrão do GitHub | `project.md` § Mandated; habilitado por o repositório ser público |
| Cobertura fora dos caminhos com piso definido | `team.md` § Deployment |

Acrescento um item que a Build and Test provou necessário e que não estava na lista afirmada: **`npm run openapi:check`**, que falha quando o `openapi.json` versionado não corresponde ao código. Não é invenção de requisito — é a verificação que `team.md` § Code Style já exige ao fixar o contrato como artefato versionado, e ela já roda localmente.

## Q4 — Quais repositórios de artefato?

**Nenhum.** Não há publicação de imagem em registry nem entrega contínua.

Origem: `project.md` § Forbidden — "NEVER publicar imagens de contêiner em registry nem executar entrega contínua (CD); o pipeline cobre apenas integração contínua" (decisão de Ideação D08). O único ambiente de execução é local, via Docker Compose (D07/D09).

O pipeline **constrói** as imagens para provar que o build de contêiner não quebrou, e as descarta. Não há ECR, CodeArtifact nem S3 — todos exigiriam credenciais AWS, proibidas neste projeto.

## O que o pipeline precisa resolver, e que nenhuma decisão anterior cobria

Dois pontos técnicos que decorrem do que a Build and Test mediu:

1. **Postgres real na integração.** A suíte de integração não usa mock do Prisma, por prática afirmada; então o job da API precisa de um serviço Postgres no runner, com as migrações aplicadas pela própria suíte, e `--runInBand` porque as suítes compartilham um banco.
2. **Cliente Prisma gerado.** `apps/api/src/generated/` é ignorado pelo Git, então todo job que compile ou teste a API precisa rodar `prisma generate` antes — o que os scripts `build` e `typecheck` já fazem por conta própria.

## Assumptions & Open Questions

- [assumption] O workflow roda em `ubuntu-latest` com Node 24, a versão fixada em `.nvmrc`.
- [assumption] As migrações no CI são aplicadas pela própria suíte de integração, como acontece localmente, em vez de um passo separado.
- [assumption] O cache de dependências usa o `package-lock.json` como chave, que é o que existe no repositório.

## Consolidated Summary Confirmation

Resumo consolidado das quatro respostas derivadas acima, mais o único item que não é derivação:

1. **Ferramenta:** GitHub Actions, um workflow com dois jobs (`api`, `web`).
2. **Ramos:** trunk-based, `main` sem proteção no servidor; os portões do CI falham o job e não impedem o merge, sendo o hook local de pre-push o portão real.
3. **Portões:** seis bloqueantes (tipos, lint, formatação, testes com cobertura, `gitleaks`, auditoria de produção) e três apenas reportando (auditoria completa, CodeQL, cobertura fora dos pisos).
4. **Repositórios de artefato:** nenhum; o pipeline não publica imagem nem executa entrega contínua.
5. **Acréscimo ao conjunto afirmado:** `npm run openapi:check -w apps/api` como portão bloqueante, por decorrer de `team.md` § Code Style, que fixa o contrato como artefato versionado.

- Looks correct
- Let me adjust

[Answer]: Looks correct