# Práticas da Equipe

Projeto greenfield, desenvolvedor único. As seções abaixo especializam os padrões de `org.md` para este projeto, já com as decisões fechadas na entrevista humana.

## Way of Working

Nós usamos desenvolvimento em trunk (trunk-based development), com `main` como único ramo de longa duração. Cada Bolt de Construction abre um ramo de curta duração a partir de `main` e faz squash-merge de volta para `main` ao concluir, mantendo o histórico de commits do Bolt disponível no ramo de origem até o worktree ser descartado.

O código entra em `main` por pull request de ramos curtos, mas **sem proteção de branch configurada no servidor**. Isso significa, com honestidade: a Integração Contínua (CI) roda em todo push e todo pull request e reporta o resultado, mas nada no GitHub impede o merge de um pull request com o pipeline vermelho — o autor pode aprovar e mesclar o próprio PR por cima de um CI quebrado. O bloqueio real acontece localmente, por um **hook de pre-push** que roda lint e a suíte de testes rápidos (`test:unit`) antes de permitir o `git push`. O CI no servidor é auditoria e registro, não portão; o hook local é o portão de fato. Não há segundo revisor humano: o próprio autor e os agentes de qualidade e segurança do fluxo de trabalho cumprem esse papel antes do merge.

Não há ramos de release de longa duração: o único ambiente de execução é local, então não há por que gatear por ambiente de destino.

## Walking Skeleton

Nós não construímos uma fatia fina de ponta a ponta como entrega separada e aprovada à parte. O sequenciamento "fundação primeiro" já decidido em Ideação (autenticação e catálogos antes de chamados) cobre o mesmo risco de integração que um esqueleto ambulante resolveria: a primeira unidade de trabalho já atravessa toda a pilha (React, NestJS, Prisma, Postgres, Docker Compose) antes de qualquer funcionalidade de negócio mais profunda ser construída. Uma cerimônia extra só para provar a ligação não se paga no orçamento de horas deste projeto.

## Testing Posture

- **Methodology**: test-after
- **Ordering**: para cada camada testável de uma Unidade (regras de domínio, services no backend, componentes e hooks no frontend), implementamos a camada primeiro e só depois escrevemos e rodamos os testes daquela camada, antes de seguir para a próxima, dentro do mesmo Bolt.
- Cobertura: substituímos o piso padrão de 80% de cobertura de linha global de `org.md` por dois critérios que valem como portão. **Critério principal**: cobertura por requisito — cada requisito aprovado do corte mínimo precisa de pelo menos um teste automatizado que o verifique, com uma tabela de rastreabilidade (requisito → teste) mantida no repositório. **Critério mecânico do CI**: limiares de cobertura por caminho — 90% de cobertura de ramo (branch) em guards e regras de autorização, 80% em services, sem piso em código de andaime (`main.ts`, módulos, DTOs, `prisma.service.ts`) e em componentes de UI do Shadcn. Não há percentual global de linha afirmado como fato deste projeto.
- Ferramental: Jest com `@swc/jest` no backend (NestJS/Prisma) — Vitest não é usado no backend porque compila via esbuild, que não emite `emitDecoratorMetadata`, quebrando a injeção de dependência do NestJS. Vitest com Testing Library no frontend (React/Vite). Postgres real, rodando como serviço de teste no Docker Compose, para os testes de integração — sem mock do Prisma nos caminhos de negócio.
- Verificação dos cinco perfis de acesso (aluno, professor, atendente, gestor, administrador): feita por teste de API, com Supertest contra uma aplicação NestJS real e Postgres real — não por teste de navegador. Não há Playwright nem qualquer teste automatizado de navegador (E2E) no projeto, nem como material de demonstração fora do portão.
- Testes negativos de autorização são obrigatórios: para cada endpoint não público, ao menos um teste afirmando `403` para um perfil que não deve acessá-lo, e para todo recurso com dono, ao menos um teste de IDOR confirmando que um usuário não lê o registro de outro.

## Deployment

Nós fazemos deploy apenas para o ambiente local, via `docker compose up`, a partir de `main` — não existe ambiente de staging nem de produção neste projeto, não há publicação de imagem em registry nem entrega contínua (CD). O merge em `main` é o próprio critério de "pronto para rodar localmente".

A Integração Contínua roda em todo push e todo pull request. Conjunto **bloqueante** do CI (falha vermelha, mesmo sem proteção de branch no servidor):
- `tsc --noEmit` com `strict: true` nos dois pacotes (`apps/api`, `apps/web`);
- ESLint e verificação de formatação (Prettier);
- suíte de testes (unitários e de integração);
- varredura de segredo commitado (`gitleaks`);
- auditoria de dependências de produção em severidade alta (`npm audit --omit=dev --audit-level=high`).

Apenas **reportam**, sem bloquear: auditoria completa de dependências (incluindo `devDependencies`), CodeQL (análise estática gratuita do GitHub, habilitada por o repositório ser público) e cobertura fora dos caminhos com piso definido.

O repositório é **público**, como parte do portfólio. Por isso a varredura de segredos é obrigatória (item acima) e a análise estática gratuita do GitHub (CodeQL default setup) fica ligada.

## Code Style

Nós seguimos as configurações do projeto assim que existirem:
- Repositório único, com `apps/api` (NestJS) e `apps/web` (React/Vite) em npm workspaces; lint e formatação configurados na raiz; um workflow de CI com dois jobs (`api`, `web`); Dockerfiles com contexto de build na raiz.
- Todo identificador de código é em inglês, com glossário canônico 1:1 dos termos de domínio: chamado → `Ticket`, setor → `Sector`, atendente → `agent` (papel) / `assignee` (relação no chamado), prioridade → `Priority`, categoria → `Category`, status → `Status`, aluno → `student`, professor → `professor`/`teacher`, gestor → `manager`, administrador → `admin`. Dados e textos exibidos ao usuário permanecem em português; identificadores, nunca.
- Prisma: modelos em PascalCase singular, campos em camelCase, tabelas em snake_case plural via `@@map`, colunas via `@map`. Valores do tipo enum em inglês SCREAMING_SNAKE; rótulos em português vivem só no frontend. `Status` e `Priority` são tabelas administráveis no modelo de dados, não enums fixos — decorrência do corte mínimo aprovado em Definição de Escopo, que exige que sejam administráveis.
- Camadas NestJS: controller trata apenas HTTP (rota, guard, validação de DTO, chamada ao service); service concentra a regra de negócio e é o único ponto que toca `PrismaService`; não há camada de repositório. A máquina de transições de status do chamado vive num módulo puro, sem dependência de Nest e sem dependência de Prisma.
- Tratamento de erro: envelope único `{ error: { code, message, details, traceId } }`; `code` é o contrato estável em inglês, `message` é apenas fallback de depuração; a tradução para português acontece só no frontend, a partir de `code`. Erros do Prisma são sempre convertidos, nunca vazam para a resposta. Para um recurso que existe mas o ator não pode ver, a resposta é `404`, não `403` — para não revelar a existência do registro.
- Autorização: guard global de negação por padrão (deny-by-default) — uma rota sem marcação explícita de perfil é negada. Toda consulta de recurso com dono filtra o ator dentro do próprio `where` do Prisma, nunca busca-e-compara depois. A matriz de perfil × recurso × operação é regra de negócio e mora em Functional Design; o mecanismo de aplicação (guard, filtro na consulta, teste negativo obrigatório) é prática afirmada aqui, porque as etapas de NFR foram cortadas do fluxo e este é o único lugar do processo em que essa prática pode ser fixada.
- Sessão: JWT em cookie `httpOnly`, com duração média (algumas horas), sem refresh token. Logout apaga o cookie no navegador, sem invalidação da sessão no servidor. Consequência aceita conscientemente: um token roubado continua válido até a expiração natural.
- Segredos: `.gitignore`, `.dockerignore` e `.env.example` entram no commit inicial, antes de qualquer `.env` ser criado. A aplicação falha na inicialização se faltar variável de ambiente obrigatória. Um segredo vazado se corrige por rotação do segredo, nunca por reescrita de histórico do Git. A porta do Postgres não é publicada no host; se precisar ser, fica ligada a `127.0.0.1`.

## Assumptions & Open Questions

None.
