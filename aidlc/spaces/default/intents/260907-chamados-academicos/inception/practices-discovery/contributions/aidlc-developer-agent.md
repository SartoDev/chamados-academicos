**Collaborator:** aidlc-developer-agent

## Contribution

Revisão focada em nomenclatura, fronteiras de camada, tratamento de erro, organização de arquivos e convenções de estilo. Tudo abaixo é redigível direto na seção `## Code Style` de `team-practices.md` (ou em `discovered-rules.md`, quando indicado).

### 1. Layout do repositório — recomendo repositório único com `apps/api` e `apps/web`

Recomendação: **um repositório**, com `apps/api` (NestJS) e `apps/web` (React/Vite), usando **npm workspaces** (já embutido no npm; sem Nx, sem Turborepo).

```
/
  package.json            # workspaces: ["apps/*"]; scripts agregadores
  docker-compose.yml      # db, api, web
  .prettierrc  eslint.config.js  .editorconfig  .gitignore
  apps/api/               # package.json, tsconfig, prisma/, src/, Dockerfile
  apps/web/               # package.json, tsconfig, src/, Dockerfile
```

Justificativa e alternativa rejeitada: com **dois repositórios**, cada Bolt que atravessa a fronteira (praticamente todos: B1, B4, B5, B6, B7) vira dois commits em dois lugares, e o modelo de `org.md` — "cada Bolt = um squash-commit em `main`" — deixa de ser verificável. Dois repositórios também duplicam CI, duplicam configuração de lint e impedem um `docker compose up` único a partir da raiz. O custo do repositório único (um `node_modules` maior, workspaces a entender uma vez) é pago em uma tarde; o custo de dois repositórios é pago em todo Bolt.

Implicações concretas:
- **Ferramental**: `npm install` na raiz instala os dois apps; scripts de raiz `dev`, `build`, `lint`, `format:check`, `test` delegam via `npm run <x> --workspaces`. Prettier e ESLint ficam **na raiz**, em arquivo único, com blocos específicos por app.
- **CI**: um único workflow com dois jobs (`api`, `web`), e o job de `api` sobe um serviço Postgres para os testes de integração do Prisma. Filtro de caminho (`paths`) por job evita rodar o frontend inteiro quando só o schema mudou.
- **Docker**: um `docker-compose.yml` na raiz com três serviços e um `Dockerfile` por app. O contexto de build de cada `Dockerfile` é a raiz (por causa do lockfile compartilhado) — vale registrar isso agora, porque é a armadilha número um de workspaces com Docker.
- **Não criar** `packages/shared-types` no corte mínimo. Duplicar deliberadamente os tipos de contrato entre `api` e `web` é mais barato que um terceiro pacote com build próprio. Se a duplicação doer em B6/B9, aí sim se extrai.

### 2. Regra de nomenclatura pt-BR × inglês — híbrido com fronteira explícita

Regra a adotar, sem ambiguidade para o gerador de código:

> **Todo identificador é em inglês.** Cada termo de domínio em português tem **uma** tradução fixa, registrada num glossário único, e nenhuma outra é aceita no código. Dados e textos exibidos ao usuário permanecem em português; identificadores, nunca.

Glossário canônico (a fixar em `project.md` § Code Style após o aval humano):

| Termo do domínio (pt-BR) | Identificador (inglês) |
|---|---|
| chamado | `Ticket` |
| solicitante | `requester` |
| atendente | `agent` (papel) / `assignee` (relação no chamado) |
| setor | `Sector` |
| categoria | `Category` |
| prioridade | `Priority` |
| situação/status | `Status` / `TicketStatus` |
| mensagem do chamado | `TicketMessage` |
| notificação | `Notification` |
| avaliação | `Rating` |
| fila de atendimento | `queue` |
| usuário | `User` |
| perfil/papel | `Role` |

Três decisões que o glossário fecha e que costumam vazar depois:
- **`Sector` e não `Department`**: `Department` é inglês mais idiomático, mas quebra o mapeamento 1:1 com o glossário dos artefatos em pt-BR e piora a rastreabilidade requisito → código. Preferimos a correspondência direta.
- **`agent` como valor de `Role`, `assignee` como campo de `Ticket`**: `Ticket.agent` seria ambíguo (o papel ou a pessoa atribuída?); `Ticket.assigneeId → User` é inequívoco.
- **Exceção**: se aparecer um termo sem tradução fiel (não identifiquei nenhum nos onze proto-Units), ele fica em português, recebe comentário `// glossary: <termo>` e é acrescentado à tabela. Fora dessa exceção documentada, português em identificador é erro de revisão.

**Valores de enum e rótulos**: os valores persistidos são inglês em SCREAMING_SNAKE (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`; `LOW`, `MEDIUM`, `HIGH`). A tradução para pt-BR ("Aberto", "Em atendimento") vive **exclusivamente** num mapa de rótulos no frontend — nunca no banco, nunca no retorno da API. Isso mantém o banco estável quando a redação da interface mudar.

**Prisma — regra fechada (não adiar para Domain Design)**:
- Modelo: PascalCase, **singular**, inglês — `Ticket`, `TicketMessage`, `Sector`.
- Campo: camelCase inglês — `createdAt`, `assigneeId`, `sectorId`.
- Tabela física: snake_case **plural** via `@@map("tickets")`, `@@map("ticket_messages")`.
- Coluna física: snake_case via `@map("created_at")`, `@map("assignee_id")`.
- Enum Prisma: nome PascalCase (`TicketStatus`), valores SCREAMING_SNAKE.

Isso precisa ser decidido **agora**, não em Domain Design: aplicar `@map`/`@@map` depois significa uma migração de renomeação em cima de dados já semeados, e o rascunho atual (linha 33 de `team-practices.md`) deixa o ponto em aberto sem necessidade.

**Dado é português, schema é inglês**: os registros semeados de `Sector` e `Category` têm `name` em português ("Secretaria Acadêmica", "Matrícula"). Isso não viola a regra — é dado, não identificador.

### 3. Módulos e fronteiras de camada no NestJS

Um módulo Nest por agrupamento de proto-Unit, para que um Bolt toque uma pasta de cada lado:

```
apps/api/src/
  main.ts  app.module.ts
  common/           # filtros, guards, interceptors, decorators, DTO base
  prisma/           # PrismaModule + PrismaService (único ponto de acesso ao banco)
  modules/
    auth/           # B1
    users/          # B2
    catalog/        # B3 (sectors, categories)
    tickets/        # B4 ciclo de vida + B5 fila (consulta, não módulo à parte)
    ticket-messages/  # B6 — unidade separada, conforme project.md
    notifications/  # B7
    admin/          # B8
    reporting/      # B9 + B10, somente leitura
    ratings/        # B11
```

Regras de camada (candidatas a `## Mandated` / `## Forbidden`):
- **Controller** faz apenas HTTP: rota, `@UseGuards`, validação do DTO por `ValidationPipe` global com `class-validator`, chamada de um método de service, retorno. **NEVER** injetar `PrismaService` num controller. **NEVER** colocar condicional de regra de negócio num controller.
- **Service** é o único lugar com regra de negócio e o único que fala com `PrismaService`. Transações vivem aqui (`prisma.$transaction`).
- **Sem camada de repositório.** Para um desenvolvedor solo, um `TicketRepository` que só repassa chamadas ao Prisma é cerimônia: o Prisma já é a abstração de acesso a dados. A testabilidade que um repositório traria vem melhor do item seguinte.
- **Entre módulos**: um módulo consome outro pelo service exportado, nunca lendo as tabelas do outro pelo Prisma. Exceção permitida e única: `include` de leitura dentro de um agregado que o próprio módulo possui (`Ticket` incluindo `sector` e `category`).

**Onde mora a máquina de estados do chamado** (a pergunta mais importante desta lista): num arquivo **puro**, sem decorators do Nest e sem import do Prisma:

```
modules/tickets/domain/ticket-status.ts
  - TICKET_TRANSITIONS: tabela de transições permitidas
  - canTransition(from, to, role): { ok: true } | { ok: false, reason }
```

`TicketsService.changeStatus()` consulta essa função **antes** de persistir e, num mesmo `prisma.$transaction`, grava a linha de `Ticket` e uma linha de histórico (`TicketStatusHistory`). Efeitos colaterais (notificação de B7, mensagem automática de B6) são disparados **pelo service**, nunca pela função de domínio.

Motivo prático: essa função é testável sem banco, sem Nest e sem mock — é onde a postura test-after do rascunho rende mais por hora investida, e é o único ponto do backend em que eu recomendaria escrever o teste antes, mesmo com test-after como metodologia geral.

### 4. Tratamento de erro na fronteira da API

O rascunho **não trata** disso, e a regra de fase `construction.md` § Error Handling exige tratamento em toda fronteira de integração. Convenção proposta:

- **Um** `AllExceptionsFilter` global (via `APP_FILTER`) e uma hierarquia curta em `common/errors`: `DomainException` (base) → `InvalidStateTransitionError`, `NotFoundError`, `ForbiddenActionError`, `ConflictError`.
- **Envelope único de resposta de erro**, idêntico para todos os status:

```json
{
  "error": {
    "code": "TICKET_INVALID_TRANSITION",
    "message": "developer-facing English fallback",
    "details": [{ "field": "title", "rule": "maxLength" }],
    "traceId": "..."
  }
}
```

- **`code` é o contrato; `message` não é.** `code` é um literal estável em inglês SCREAMING_SNAKE, e o frontend mapeia `code` → texto em pt-BR. `message` é apenas fallback de depuração e **nunca** é renderizado direto na interface. Isso resolve de forma limpa e definitiva a tensão "código em inglês × interface em português", sem espalhar textos de UI pelo backend.
- **Mapeamento HTTP**: 400 validação de DTO; 401 sem autenticação; 403 papel sem permissão; 404 recurso inexistente ou fora do escopo de visibilidade do usuário; 409 conflito e transição de estado inválida; 500 inesperado. **Não usar 422** — 400 e 409 cobrem tudo aqui, e uma superfície menor é mais fácil de acertar no frontend.
- **Erro do Prisma nunca vaza**: o filtro converte `PrismaClientKnownRequestError` P2002 → 409 `UNIQUE_VIOLATION` e P2025 → 404 `NOT_FOUND`. Stack trace, SQL e nome de coluna física ficam no log do servidor junto ao `traceId`; jamais na resposta.
- **Segurança**: para recurso que existe mas o usuário não pode ver, responder 404 e não 403, para não vazar a existência de chamados de terceiros.
- **O que o frontend pode assumir**: todo erro chega no envelope acima. Um único wrapper em `lib/http.ts` lança `ApiError { status, code, details }`; nenhum componente lê a resposta crua. O React Hook Form usa `details[].field` em `setError`; o React Query trata `code` no `onError`; 401 é interceptado num único ponto que redireciona para o login.

### 5. Prisma e migrações para desenvolvedor solo

- Um único `apps/api/prisma/schema.prisma`.
- `npx prisma migrate dev --name <verbo_substantivo_snake>` no desenvolvimento; a migração é commitada **no mesmo commit** do código que depende dela.
- **NEVER editar migração já aplicada** — correção vem como migração nova. `migrate reset` só enquanto não houver dado real que importe.
- **NEVER usar `db push`** num schema que já tem histórico de migração (mistura os dois modelos e corrompe `_prisma_migrations`).
- Na subida do contêiner: `prisma migrate deploy` (não `dev`) antes de iniciar a aplicação.
- `prisma/seed.ts` **idempotente** (`upsert`), povoando setores, categorias e um usuário por papel. O seed é o fixture local e faz parte do repositório; é ele que substitui o ambiente de homologação que este projeto não tem.
- **Id**: `String @id @default(uuid())`. Id sequencial aparece na URL do chamado, permite enumerar chamados alheios e deixa inferir volume — num sistema com dados acadêmicos, é um achado de segurança evitável de graça.
- **Timestamps** em todo modelo: `createdAt DateTime @default(now()) @map("created_at")` e `updatedAt DateTime @updatedAt @map("updated_at")`.
- **Sem soft delete genérico.** Onde a exclusão física quebra chave estrangeira (setor ou categoria já usados, usuário com chamados), usar `deactivatedAt` explícito naquele modelo e filtrar no service.

**Consequência de modelagem que vale registrar agora** (e confirmar em Domain Design): B3 chama setor, categoria, situação e prioridade de "catálogos de classificação", mas `project.md` só exige que **categorias e setores** sejam administráveis pelo modelo de dados. Logo: `Sector` e `Category` são **tabelas**; `TicketStatus` e `Priority` são **enums do Prisma**, porque a máquina de estados do item 3 depende de valores fixos e conhecidos em tempo de compilação. Situação administrável em tabela tornaria a máquina de estados dinâmica — bem mais cara, e não pedida.

### 6. Organização do frontend com React Query e React Hook Form

Organização por funcionalidade, espelhando os módulos do backend:

```
apps/web/src/
  app/            # router, providers (QueryClientProvider, AuthProvider)
  components/ui/  # gerado pelo Shadcn — não editar à mão
  components/     # componentes de aplicação compartilhados
  features/
    tickets/
      api/        # queries.ts, mutations.ts, keys.ts
      components/
      hooks/
      schemas.ts  # zod
    auth/  ticket-messages/  notifications/  admin/  dashboard/  reports/  ratings/
  lib/            # http.ts, queryClient.ts, utils.ts
  pages/          # composição de rota, fina
```

Regras:
- **Chaves de query centralizadas** por funcionalidade em `keys.ts` (`ticketKeys.all`, `ticketKeys.list(filters)`, `ticketKeys.detail(id)`). **NEVER** escrever array de chave literal dentro de componente — invalidação errada falha em silêncio, e é o bug mais caro de diagnosticar nesta pilha.
- **Estado de servidor mora só no React Query.** Nada de copiar resposta para `useState` ou Context. Estado de cliente é só UI (diálogo aberto, filtro antes de submeter).
- **React Hook Form com `zodResolver`**; o schema zod da funcionalidade é a fonte única de validação no frontend e espelha deliberadamente o DTO `class-validator` do backend. Duplicação consciente, pelo motivo do item 1 (sem pacote compartilhado no corte mínimo).
- **Mutação**: `onSuccess` invalida por chave; erro do servidor é mapeado de `details[].field` para `setError`. **Sem atualização otimista** no corte mínimo — risco alto, ganho baixo.
- `components/ui` (Shadcn) é código gerado: fora do piso de cobertura e com regras de lint relaxadas.
- **Sem arquivos barrel** (`index.ts` reexportando a pasta): criam ciclos de import e escondem dependência entre funcionalidades.

### 7. ESLint/Prettier que se paga — e o que é cerimônia

**Se paga**, para um desenvolvedor:
- `tsconfig` com `"strict": true` nos dois apps. Rende mais que qualquer regra de lint; é a decisão de estilo com melhor retorno do projeto.
- Prettier com configuração de cinco linhas na raiz, sem debate, e `format:check` na CI.
- ESLint flat config: `@eslint/js` recomendado com `typescript-eslint` recomendado.
- `eslint-plugin-react-hooks` no `apps/web` — `exhaustive-deps` pega bug real de dependência em hook com React Query.
- `@tanstack/eslint-plugin-query` — pega chave de query e uso de mutation errados, exatamente a classe de bug do item 6.
- **Só no `apps/api`**, lint com informação de tipo, apenas por `no-floating-promises` e `no-misused-promises`: em NestJS com Prisma, promise não aguardada é falha silenciosa que não aparece em teste. É a única regra que justifica o custo do lint type-aware.

**Cerimônia, deixar de fora**: preset Airbnb; `eslint-plugin-unicorn`; `import/order` com ordenação alfabética obrigatória; JSDoc obrigatório; regras de `max-lines` e complexidade; `husky` com `lint-staged` e `commitlint` (a CI já é o portão — um gate pré-commit só rouba tempo de quem tem 10–20h/semana); Nx ou Turborepo; aliases de caminho além de um `@/` por app.

### 8. O que o HUMANO decide, e não eu

1. **Layout do repositório** (item 1). Recomendo repositório único com convicção, mas é estrutural e difícil de reverter depois de onze Bolts — vai ao gate.
2. **O vocabulário do glossário, termo a termo** (item 2): `Sector` vs `Department`, `agent` vs `assignee`. A **forma** da regra (identificador em inglês, glossário único e congelado) não deve ser relitigada; as palavras são do humano e, uma vez aprovadas, ficam em `project.md` § Code Style.
3. **`Status` e `Priority` como enum ou como tabela** (item 5): depende de o humano querer ou não que sejam administráveis, e isso muda o escopo de B3 e B8.
4. **Piso de cobertura** — e acrescento um recorte à pergunta que o líder já faz: se o piso de 80% ficar, medi-lo **apenas** sobre `apps/api/src/modules/**` (domínio e services), excluindo `components/ui`, código gerado pelo Prisma e boilerplate do Nest. Um piso global de 80% neste projeto mede geração de código, não qualidade.
5. **Jest ou Vitest no backend** — ver objeção abaixo; o humano escolhe, mas com uma recomendação, não com um "ou/ou".

## Positions

- AGREE: Reescrita completa da seção `## Deployment` para "apenas local via `docker compose up`" — corretamente ancorada em D07/D08/D09 e sem inventar ambiente que não existe.
- AGREE: Manter o piso de 80% fora de `discovered-rules.md` — a separação entre fato afirmado e sugestão a confirmar está exatamente certa, e `org.md` de fato o declara como default, não como fato.
- AGREE: `test-after` com ordenação por camada como padrão do rascunho — proporcional a um TCC solo; sugiro apenas a exceção pontual da máquina de estados do item 3.
- AGREE: CI rodando build, lint e testes a cada push e PR como regra mandatória — é o único portão que sobra sem revisor humano, e por isso precisa mesmo ser regra e não sugestão.
- AGREE: Direção de nomenclatura do Prisma (PascalCase e camelCase no schema, snake_case no banco) — está correta; a objeção é apenas sobre adiá-la.
- OBJECT: A seção `## Code Style` não resolve a regra português × inglês nos identificadores — é a ambiguidade de maior risco do projeto, atravessa todos os onze proto-Units, e o gerador de código não tem como adivinhá-la; ver glossário do item 2.
- OBJECT: `@map`/`@@map` marcado como "a confirmar durante Domain Design" (linha 33) — decidir depois significa migração de renomeação sobre dados já semeados; a regra completa do item 2 deve entrar agora.
- OBJECT: Não há nenhuma convenção de tratamento de erro no rascunho, embora `construction.md` § Error Handling a exija em toda fronteira de integração — sem envelope único definido aqui, cada Bolt improvisa o seu e o frontend termina com onze formatos de erro; ver item 4.
- OBJECT: O layout do repositório (único vs dois) não está decidido nem sequer listado como pergunta de entrevista — ele bloqueia a estrutura de Bolts em Delivery Planning, o arquivo de CI e o `docker-compose.yml`, e precisa entrar no gate.
- OBJECT: Faltam as fronteiras de camada do NestJS — sem a regra "controller não toca Prisma, service concentra regra de negócio, máquina de estados em módulo puro", onze Bolts gerados independentemente produzirão onze arquiteturas internas diferentes.
- OBJECT: Ferramental de teste apresentado como "Vitest ou Jest" para o backend, sem recomendação — o Jest já vem no scaffold do Nest CLI, e Vitest no backend custa configuração que um orçamento de TCC não deve gastar; recomendo fixar **Jest no `apps/api`, Vitest com Testing Library no `apps/web`** e levar isso ao gate como escolha única.
- OBJECT: A assumption "sem par de revisão" está correta, mas o rascunho não diz o que substitui mecanicamente o portão de merge — proponho enunciá-lo: `format:check`, lint, build e testes verdes na CI é a condição de merge do Bolt, e nada mais.
