# Resumo do Código — U1 Fundação (`u1-foundation`)

Derivado de `code-generation-plan.md` e `unit-test-instructions.md` desta pasta, do resumo de retorno do agente de desenvolvimento e da tabela `docs/u1-foundation/rastreabilidade-requisitos-testes.md` do repositório.

## Situação dos Passos do Plano

Os 13 passos do plano aprovado foram executados. As caixas de `code-generation-plan.md` foram deixadas desmarcadas de propósito: o plano tem impressão digital aprovada, e marcar caixas alteraria o arquivo e invalidaria a aprovação. O progresso fica registrado aqui.

| Passo | Situação |
|-------|----------|
| 1 — Estrutura do projeto e esqueleto de configuração | Concluído |
| 2 — Prontidão dos executores de teste | Concluído |
| 3 — Modelo de dados: implementar | Concluído |
| 4 — Modelo de dados: testes | Concluído |
| 5 — Lógica de negócio: implementar | Concluído |
| 6 — Lógica de negócio: testes | Concluído |
| 7 — API: implementar | Concluído |
| 8 — API: testes | Concluído |
| 9 — Frontend: implementar | Concluído |
| 10 — Frontend: testes | Concluído |
| 11 — Ambiente e build | Concluído; `docker compose build api web` passou |
| 12 — Documentação | Concluído; o roteiro de inspeção manual está escrito, e sua execução é do autor |
| 13 — Rastreabilidade e execução final | Concluído |

A geração foi interrompida duas vezes por limite de uso da API e retomada pelo mesmo agente, com o contexto preservado; em cada retomada o agente conferiu o estado da área de trabalho antes de continuar.

## Arquivos Criados e Alterados

A lista completa de caminhos está em `source-manifest.json`, nesta pasta.

| Área | Conteúdo |
|------|----------|
| Raiz | `package.json` (workspaces, scripts e `overrides`), `package-lock.json`, `tsconfig.base.json`, `eslint.config.mjs`, Prettier, `.editorconfig`, `.nvmrc`, `.npmrc`, `.gitattributes`, `.gitignore` (alterado), `.dockerignore`, `.env.example`, `compose.yaml`, `README.md`, `.githooks/pre-push`, `scripts/install-git-hooks.mjs` |
| `apps/api` | NestJS: configuração validada, `PrismaService`, filtro de erros com envelope, `traceId`, carga inicial, módulos `auth` (login, limitador de tentativas, token, cookie, guard global, verificação de origem, decorators), `users` e `catalog` (services, services públicos, controllers, DTOs), geração de `openapi.json`; `prisma/schema.prisma` e a primeira migração; Dockerfile |
| `apps/api` — testes | 14 arquivos unitários em `src/**` e 11 de integração em `test/integration/u1-foundation/`, com suporte de fábricas, relógio falso e aplicação de teste |
| `apps/web` | Vite, React e Shadcn; casca (atalho para conteúdo, barra superior, navegação lateral que vira menu), sessão, cliente HTTP com política de X-01, traduções de códigos de erro, login, tela provisória de entrada, administração com as cinco abas e diálogos; Dockerfile e `nginx.conf` com repasse de `/api` |
| `apps/web` — testes | 21 arquivos de teste de componente e de regras |
| `docs/u1-foundation` | `rastreabilidade-requisitos-testes.md` e `roteiro-inspecao-manual.md` |

Arquivos ignorados pelo Git e não reivindicados: `.env` local com valores fictícios, `node_modules/`, `dist/`, `coverage/` e o cliente Prisma gerado.

## Decisões de Implementação

- **Versões:** Node 24.11.1 e npm 11.10.0 no ambiente; NestJS 12 em ESM, com o Jest rodando em `--experimental-vm-modules` via `.npmrc`; Prisma 7.10 (a 8 ainda é candidata a lançamento); TypeScript 6.0.3 (a 7 é incompatível com o typescript-eslint).
- **Ciclo Auth ↔ Users ↔ Catalog:** resolvido como o plano previa, sem injeção tardia; o guard global depende só de `UsersPublicService` e falha fechado.
- **Restrições no banco em SQL:** `citext` para e-mail e nomes, `CHECK` do vínculo perfil–setor e índice único parcial para a prioridade padrão única.
- **Concorrência:** locks consultivos de transação do Postgres na carga inicial, na proteção do último administrador e na troca de prioridade padrão; os dois casos concorrentes têm teste de integração.
- **Vulnerabilidades de produção:** três avisos de severidade alta (`multer`, `mysql2`, `deepmerge-ts`) corrigidos por `overrides` na raiz, com o `package-lock.json` regenerado; a auditoria de produção e a completa terminam com 0 vulnerabilidades. Nenhum nível de auditoria foi reduzido.
- **Limiares do Jest:** as chaves de caminho foram ancoradas em `apps/api`, porque rodando pela raiz o Jest não encontrava os arquivos e saía com erro mesmo com todos os testes passando. Valores e escopo dos limiares não mudaram.
- **Distribuição dos limiares entre configurações:** a configuração unitária aplica o limiar de guards; os limiares global e de services são aplicados nas configurações de integração e combinada, onde os services são exercitados contra Postgres real.

## Cobertura e Testes

| Suíte | Resultado |
|-------|-----------|
| API — unitários de U1 | 14 suítes, 126 testes aprovados |
| API — integração de U1 | 11 suítes, 165 testes aprovados |
| API — portão combinado | 25 suítes, 291 testes aprovados |
| Web — testes de U1 | 21 arquivos, 142 testes aprovados |
| Lint, `typecheck`, `format:check`, `openapi:check` | Sem erros |

| Limiar | Exigido | Medido |
|--------|---------|--------|
| API — linhas global (código não-andaime) | 80% | 96,87% |
| Guards — ramos por arquivo | 90% | 100% |
| Guards — linhas por arquivo | 80% | 100% |
| Services — linhas por arquivo | 80% | menor valor 95,74% |
| Web — linhas global | 80% | 97,47% |

As regras de autorização fora da pasta `guards/` (`user-rules.ts`, `catalog-rules.ts`, `roles.ts`, `login-attempt-limiter.ts`, `current-actor.decorator.ts`) têm 100% de ramos e linhas. Cobertura por requisito: cada critério de aceitação e cada regra BR de U1 aponta para testes em `docs/u1-foundation/rastreabilidade-requisitos-testes.md` e em `traceability.json` desta pasta.

## Desvios em Relação ao Plano e ao Desenho

| Desvio | Onde | Motivo | Situação |
|--------|------|--------|----------|
| Item de navegação provisório "Início" na barra lateral | `apps/web/src/app/navigation.ts` | Leva à tela provisória de entrada enquanto U2 não existe | Diverge de `wireframes.md`, que não tem item "Início"; a remover quando U2 registrar as telas definitivas |
| Filtro adicional `available` na listagem de categorias | API-U1 `listCategories` | Implementa BR4.4 (categoria e setor ativos) numa única consulta para o formulário de abertura | Aditivo ao contrato; presente no `openapi.json` gerado |
| `JWT_SECRET` com no mínimo 32 caracteres | Validação de configuração | Endurecimento da assinatura do token | Aditivo a BR5.3 |
| Postgres de teste em `127.0.0.1:55432` | `compose.yaml`, perfil `test` | Permite os testes de integração rodarem do host | Dentro da regra: porta ligada só a `127.0.0.1` |
| `overrides` de três dependências de produção | `package.json` da raiz | Corrigir avisos de segurança altos | A remover quando `@nestjs/platform-express` e `prisma` publicarem versões corrigidas |
| `CatalogLabels.statuses` sem o campo `active` | `catalog-public.service.ts` | Segue BR8.8 e o achado R-04 da revisão do desenho funcional | Divergência do tipo `CatalogItemRef` de `contract-summary.md`, registrada aqui |
| Erro de digitação corrigido pelo condutor na mensagem de `openapi:check` | `apps/api/src/openapi/generate-openapi.ts` | "outdatedc" → "outdated" | Corrigido antes da revisão |

## Pendências e Riscos

- **Inspeção manual:** o autor executa `docs/u1-foundation/roteiro-inspecao-manual.md` e registra os resultados (AC5.3.1, AC5.3.2, AC5.3.5, AC5.3.6, AC5.4.1, AC5.4.3, AC5.4.4).
- **Critérios adiados:** AC4.2.4 e AC5.4.2 ficam para U2, conforme o desenho funcional.
- **`USER_LAST_ACTIVE_ADMIN`:** não é provocável por uma única requisição HTTP (a proteção do próprio ator dispara antes); está coberto no teste de service, inclusive com concorrência.
- **Migrações futuras:** um `prisma migrate dev` pode propor remover as restrições criadas em SQL; toda migração gerada precisa ser revisada.
- **Chaves de limiar absolutas:** num clone em caminho com caracteres especiais de glob, as chaves podem deixar de casar com os arquivos.
- **Bundle do frontend:** o Vite avisa que o pacote passa de 500 kB.
- **Integração Contínua:** o workflow com os dois jobs, `gitleaks` e CodeQL é da etapa de pipeline de CI.
- **Git:** nada foi commitado; todos os arquivos estão não rastreados no ramo `main`, aguardando o autor.
- **Ambiente:** o contêiner `postgres-test` continua ativo, ligado a `127.0.0.1:55432`.
