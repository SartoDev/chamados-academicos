# Resumo de Contratos — Sistema de Chamados Acadêmicos

Derivado de `unit-of-work.md` e `unit-of-work-dependency.md` (em `../units-generation/`: 5 unidades, 8 arestas), `components.md` (em `../domain-design/`: forma das entidades) e `requirements.md` (em `../requirements-analysis/`: FR1–FR12, NFR1–NFR9), com as respostas confirmadas em `contract-design-questions.md`.

Um contrato é o acordo formal sobre uma fronteira: o que atravessa, em que forma, por qual mecanismo e o que acontece quando dá errado. Este sistema tem três tipos de fronteira:

- **HTTP, entre o navegador e o backend.** Cada unidade expõe a sua parte da API REST sob o prefixo `/api/v1`. O consumidor é o frontend do próprio projeto (`apps/web`), executado no navegador. Não existe consumidor fora do sistema.
- **Serviço, entre unidades dentro do backend.** As oito arestas do grafo de unidades. Todas rodam no mesmo processo; o contrato é a interface TypeScript do serviço público que cada bloco exporta.
- **Dados compartilhados.** Um único Postgres e um único esquema do Prisma, com chaves estrangeiras entre tabelas de unidades diferentes.

**Estado dos blocos de especificação.** Os blocos abaixo são o desenho inicial (Q2). Depois que o código de cada unidade existir, o OpenAPI gerado a partir dele passa a ser a fonte da verdade, e o CI falha se esse arquivo mudar sem ser commitado. Tamanhos de campo, regras de validação detalhadas e a matriz completa de perfil × operação **não** são fixados aqui: pertencem ao Desenho Funcional de cada unidade. Onde uma operação traz `x-roles`, os perfis listados são apenas os que as histórias já fixaram.

## Tabela de Contratos

| # | Provider Unit | Consumer | Mechanism | Owner |
|---|---------------|----------|-----------|-------|
| X-01 | U1 | todas as unidades e `apps/web` | Convenções transversais HTTP: envelope de erro, códigos, forma das respostas, sessão, origem | U1 |
| API-U1 | U1 | `apps/web` (navegador) | REST/HTTP, OpenAPI | U1 |
| API-U2 | U2 | `apps/web` (navegador) | REST/HTTP, OpenAPI | U2 |
| API-U3 | U3 | `apps/web` (navegador) | REST/HTTP, OpenAPI | U3 |
| API-U4 | U4 | `apps/web` (navegador) | REST/HTTP, OpenAPI | U4 |
| API-U5 | U5 | `apps/web` (navegador) | REST/HTTP, OpenAPI | U5 |
| SVC-01 | U1 | U2 | Chamada de serviço em processo (interface TypeScript) | U1 |
| SVC-02 | U1 | U3 | Chamada de serviço em processo (interface TypeScript) | U1 |
| SVC-03 | U2 | U3 | Chamada de serviço em processo (interface TypeScript) | U2 |
| SVC-04 | U1 | U4 | Chamada de serviço em processo (interface TypeScript) | U1 |
| SVC-05 | U2 | U4 | Chamada de serviço em processo (interface TypeScript) | U2 |
| SVC-06 | U1 | U5 | Chamada de serviço em processo (interface TypeScript) | U1 |
| SVC-07 | U2 | U5 | Chamada de serviço em processo e extensão aditiva do serviço público de Tickets | U2 |
| SVC-08 | U4 | U5 | Extensão aditiva: indicador novo no mesmo formato e ponto de composição do painel | U4 |
| DB-01 | U1, U2, U3, U5 | U2, U3, U5 | Esquema compartilhado do Prisma: chaves estrangeiras entre unidades | cada unidade dona das suas tabelas |

---

## X-01 — Convenções Transversais

Valem para toda operação HTTP de toda unidade. U1 cria a infraestrutura que as aplica (filtro global de erro, guard global, validação de entrada), e toda unidade seguinte as respeita.

### Origem, sessão e proteção contra CSRF

- **Mesma origem** (Q9). O contêiner do frontend serve o SPA e repassa `/api` para o backend; em desenvolvimento, o servidor do Vite faz o mesmo repasse. O backend não configura CORS.
- **Sessão.** JWT num cookie `httpOnly`, `SameSite=Strict`, `Path=/api`, com duração média e sem refresh token (FR1.2). O logout apaga o cookie no navegador, sem invalidação no servidor (FR1.3).
- **Defesa contra CSRF.** `SameSite=Strict` impede o navegador de enviar o cookie a partir de outro site. Além disso, toda requisição que altera estado (`POST`, `PUT`, `PATCH`, `DELETE`) com cabeçalho `Origin` diferente da própria origem é recusada com 403 `FORBIDDEN`.
- **Perfil lido do banco a cada requisição** (CT10). Usuário desativado, ou token expirado, responde 401 `UNAUTHENTICATED` na requisição seguinte.

### Forma das requisições

- Corpo em JSON (`application/json`, UTF-8), campos em camelCase.
- Identificadores em UUID (Q8).
- **Campos desconhecidos na requisição são descartados, não rejeitados.** É isso que faz um `sectorId` enviado na abertura de chamado ser ignorado (AC1.2.5), e impede que um campo não previsto — por exemplo, `role` numa operação que não o aceita — seja gravado.
- Listas aceitam `page` (a partir de 1), `pageSize` (padrão 20, máximo 100) e, onde houver ordenação, `sort` (nome do campo) e `order` (`asc` ou `desc`). Os campos ordenáveis de cada lista são do Desenho Funcional.

### Forma das respostas de sucesso (Q7)

| Situação | Status | Corpo |
|----------|--------|-------|
| Leitura de um recurso | 200 | O recurso direto no corpo |
| Leitura de lista | 200 | `{ "items": [...], "total": 42, "page": 1, "pageSize": 20 }` |
| Criação | 201 | O recurso criado |
| Ação que devolve o recurso alterado | 200 | O recurso alterado |
| Ação sem retorno | 204 | vazio |

Datas em ISO 8601 UTC. Consumidores ignoram campos desconhecidos na resposta, o que torna seguras as adições de campo.

### Envelope de erro e códigos de status

Toda resposta de erro usa o envelope único afirmado em `team.md`. Nenhum erro nativo do Prisma chega à resposta (NFR3).

| Status | Quando | Código |
|--------|--------|--------|
| 400 | Entrada malformada ou que não passa na validação do DTO | `VALIDATION_FAILED`, com `details` por campo |
| 401 | Sem sessão, sessão expirada ou usuário desativado; credencial inválida no login | `UNAUTHENTICATED`, `AUTH_INVALID_CREDENTIALS` |
| 403 | Perfil sem direito à operação, rota sem marcação de perfil, origem diferente, ou ação que a regra de negócio nega ao perfil | `FORBIDDEN` ou código de domínio |
| 404 | Recurso inexistente **ou** existente mas invisível ao ator — as duas respostas são idênticas (NFR4, AC5.2.2) | `NOT_FOUND` ou `<DOMÍNIO>_NOT_FOUND` |
| 409 | Operação válida em forma, mas incompatível com o estado atual do recurso | código de domínio |
| 422 | Operação válida em forma, mas que viola uma regra de negócio independente do estado | código de domínio |
| 500 | Falha inesperada | `INTERNAL_ERROR`, sem detalhe interno |

### Catálogo de códigos de erro (Q5)

SCREAMING_SNAKE em inglês. Códigos genéricos, sem prefixo, pertencem a U1. Cada unidade é dona dos seus prefixos e cria a tradução em português do código na mesma unidade (CT11).

| Código | Status | Dono | Origem |
|--------|--------|------|--------|
| `VALIDATION_FAILED` | 400 | U1 | CT8 |
| `UNAUTHENTICATED` | 401 | U1 | FR1.2, FR1.3, CT10 |
| `FORBIDDEN` | 403 | U1 | FR1.5, NFR2 |
| `NOT_FOUND` | 404 | U1 | NFR4 |
| `INTERNAL_ERROR` | 500 | U1 | NFR3 |
| `AUTH_INVALID_CREDENTIALS` | 401 | U1 | AC1.1.2 |
| `USER_NOT_FOUND` | 404 | U1 | FR2 |
| `USER_EMAIL_TAKEN` | 409 | U1 | AC4.1.2 |
| `USER_SECTOR_REQUIRED` | 422 | U1 | AC4.1.6 |
| `CATALOG_ITEM_NOT_FOUND` | 404 | U1 | FR3 |
| `CATALOG_ITEM_INACTIVE` | 422 | U1 | AC1.2.6, AC4.2.3 |
| `TICKET_NOT_FOUND` | 404 | U2 | AC1.3.5, AC2.1.2 |
| `TICKET_INVALID_TRANSITION` | 409 | U2 | AC2.3.5 |
| `TICKET_ALREADY_ASSIGNED` | 409 | U2 | AC2.2.2 |
| `TICKET_REOPEN_WINDOW_EXPIRED` | 409 | U2 | AC1.6.2 |
| `TICKET_CLOSED` | 403 | U2 | AC2.4.6 |
| `TICKET_ASSIGNEE_NOT_IN_SECTOR` | 422 | U2 | AC3.1.2 |
| `TICKET_TRANSFER_SAME_SECTOR` | 422 | U2 | AC2.4.2 |
| `TICKET_QUEUE_NO_SECTOR` | 403 | U2 | AC2.1.4 |
| `NOTIFICATION_NOT_FOUND` | 404 | U2 | FR7.5 |
| `MESSAGE_TICKET_CLOSED` | 409 | U3 | AC1.4.2, AC2.2.5 |
| `RATING_NOT_FOUND` | 404 | U5 | FR12.1 |
| `RATING_TICKET_NOT_CLOSED` | 409 | U5 | AC6.3.1 |

O catálogo cresce por adição. Um código novo entra junto com a operação que o produz; um código existente nunca muda de significado.

### Falha, tempo limite e nova tentativa (Q6)

- **Frontend.** Uma consulta repete no máximo uma vez, e só em falha de rede ou 5xx; nunca em 4xx. Mutações nunca repetem sozinhas. Toda requisição tem tempo limite de 15 segundos, tratado como falha de rede. Esgotada a tentativa, a tela mostra o estado de erro com ação de repetir (CT7).
- **Entre unidades.** Sem tempo limite nem nova tentativa: é o mesmo processo. A exceção lançada pela unidade provedora, com seu `code`, se propaga até o filtro global. A consumidora só a traduz quando precisa esconder existência — por exemplo, transformar a recusa de um recurso interno em `TICKET_NOT_FOUND`.
- **Atomicidade.** Toda operação que grava em mais de um bloco — mensagem e retorno automático de status, transição e notificação, transferência e passagem por setor — é atômica: ou tudo é gravado, ou nada. O mecanismo de propagação da transação entre serviços é decisão do Desenho Funcional de U2, e não pode expor tipos do Prisma nas assinaturas públicas (Q3).

### Esquema compartilhado dos componentes OpenAPI

Os blocos OpenAPI de cada unidade referenciam estes componentes. No documento gerado a partir do código existe um único arquivo OpenAPI, onde tudo se junta.

```yaml
openapi: 3.1.0
info:
  title: X-01 Shared components
  version: 1.0.0
paths: {}
components:
  parameters:
    Page:
      name: page
      in: query
      required: false
      schema: { type: integer, minimum: 1, default: 1 }
    PageSize:
      name: pageSize
      in: query
      required: false
      schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
  schemas:
    Uuid:
      type: string
      format: uuid
    PageMeta:
      type: object
      required: [total, page, pageSize]
      properties:
        total: { type: integer, minimum: 0 }
        page: { type: integer, minimum: 1 }
        pageSize: { type: integer, minimum: 1, maximum: 100 }
    ErrorEnvelope:
      type: object
      required: [error]
      properties:
        error:
          type: object
          required: [code, message, traceId]
          properties:
            code:
              type: string
              pattern: '^[A-Z][A-Z0-9_]*$'
              description: Stable contract; the frontend translates it.
            message:
              type: string
              description: Debug fallback only; never shown as-is to the user.
            details:
              description: Optional structured detail, e.g. per-field validation codes.
              oneOf:
                - type: array
                  items:
                    type: object
                    required: [field, code]
                    properties:
                      field: { type: string }
                      code: { type: string }
                - type: object
            traceId:
              type: string
    Role:
      type: string
      enum: [STUDENT, PROFESSOR, AGENT, MANAGER, ADMIN]
    SectorRef:
      type: object
      required: [id, name]
      properties:
        id: { $ref: '#/components/schemas/Uuid' }
        name: { type: string }
    UserRef:
      type: object
      required: [id, name]
      properties:
        id: { $ref: '#/components/schemas/Uuid' }
        name: { type: string }
  responses:
    ValidationFailed:
      description: VALIDATION_FAILED
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ErrorEnvelope' }
    Unauthenticated:
      description: UNAUTHENTICATED or AUTH_INVALID_CREDENTIALS
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ErrorEnvelope' }
    Forbidden:
      description: FORBIDDEN or a domain code that denies the action to the actor's role
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ErrorEnvelope' }
    NotFound:
      description: Resource missing or invisible to the actor; both responses are identical
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ErrorEnvelope' }
    Conflict:
      description: Domain code for a state conflict
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ErrorEnvelope' }
    UnprocessableEntity:
      description: Domain code for a business-rule violation
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ErrorEnvelope' }
```

---

## API-U1 — Fundação

Autenticação, usuários e catálogos. Leitura de catálogos para qualquer usuário autenticado, porque o formulário de abertura de chamado precisa das categorias ativas; escrita apenas pelo administrador (AC4.1.7). Toda desativação é por `PATCH` com `active: false` — nenhum recurso é apagado.

```yaml
openapi: 3.1.0
info:
  title: API-U1 Foundation (auth, users, catalog)
  version: 1.0.0
servers:
  - url: /api/v1
paths:
  /auth/login:
    post:
      operationId: login
      x-roles: [PUBLIC]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email: { type: string, format: email }
                password: { type: string }
      responses:
        '200':
          description: Session started; Set-Cookie carries the httpOnly session cookie.
          headers:
            Set-Cookie:
              schema: { type: string }
          content:
            application/json:
              schema: { $ref: '#/components/schemas/CurrentUser' }
        '400': { $ref: '#/components/responses/ValidationFailed' }
        '401': { $ref: '#/components/responses/Unauthenticated' }
  /auth/logout:
    post:
      operationId: logout
      x-roles: [PUBLIC]
      responses:
        '204':
          description: Session cookie cleared in the browser; no server-side invalidation.
  /auth/me:
    get:
      operationId: getCurrentUser
      x-roles: [AUTHENTICATED]
      responses:
        '200':
          description: The authenticated actor, read from the database on this request.
          content:
            application/json:
              schema: { $ref: '#/components/schemas/CurrentUser' }
        '401': { $ref: '#/components/responses/Unauthenticated' }
  /users:
    get:
      operationId: listUsers
      x-roles: [ADMIN]
      parameters:
        - { $ref: '#/components/parameters/Page' }
        - { $ref: '#/components/parameters/PageSize' }
        - { name: role, in: query, required: false, schema: { $ref: '#/components/schemas/Role' } }
        - { name: active, in: query, required: false, schema: { type: boolean } }
        - { name: sectorId, in: query, required: false, schema: { $ref: '#/components/schemas/Uuid' } }
      responses:
        '200':
          description: Paginated users.
          content:
            application/json:
              schema:
                allOf:
                  - { $ref: '#/components/schemas/PageMeta' }
                  - type: object
                    required: [items]
                    properties:
                      items:
                        type: array
                        items: { $ref: '#/components/schemas/User' }
        '403': { $ref: '#/components/responses/Forbidden' }
    post:
      operationId: createUser
      x-roles: [ADMIN]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [name, email, role, password]
              properties:
                name: { type: string }
                email: { type: string, format: email }
                role: { $ref: '#/components/schemas/Role' }
                password: { type: string }
                sectorId:
                  $ref: '#/components/schemas/Uuid'
                  description: Required when role is AGENT or MANAGER (USER_SECTOR_REQUIRED).
      responses:
        '201':
          description: User created.
          content:
            application/json:
              schema: { $ref: '#/components/schemas/User' }
        '400': { $ref: '#/components/responses/ValidationFailed' }
        '403': { $ref: '#/components/responses/Forbidden' }
        '409': { $ref: '#/components/responses/Conflict' }
        '422': { $ref: '#/components/responses/UnprocessableEntity' }
  /users/{userId}:
    parameters:
      - { name: userId, in: path, required: true, schema: { $ref: '#/components/schemas/Uuid' } }
    get:
      operationId: getUser
      x-roles: [ADMIN]
      responses:
        '200':
          description: User.
          content:
            application/json:
              schema: { $ref: '#/components/schemas/User' }
        '403': { $ref: '#/components/responses/Forbidden' }
        '404': { $ref: '#/components/responses/NotFound' }
    patch:
      operationId: updateUser
      x-roles: [ADMIN]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name: { type: string }
                role: { $ref: '#/components/schemas/Role' }
                sectorId: { $ref: '#/components/schemas/Uuid' }
                active: { type: boolean }
      responses:
        '200':
          description: User updated; a role or active change applies on the user's next request.
          content:
            application/json:
              schema: { $ref: '#/components/schemas/User' }
        '400': { $ref: '#/components/responses/ValidationFailed' }
        '403': { $ref: '#/components/responses/Forbidden' }
        '404': { $ref: '#/components/responses/NotFound' }
        '422': { $ref: '#/components/responses/UnprocessableEntity' }
  /users/{userId}/password:
    parameters:
      - { name: userId, in: path, required: true, schema: { $ref: '#/components/schemas/Uuid' } }
    put:
      operationId: resetUserPassword
      x-roles: [ADMIN]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [password]
              properties:
                password: { type: string }
      responses:
        '204':
          description: Password replaced; the previous one no longer authenticates.
        '400': { $ref: '#/components/responses/ValidationFailed' }
        '403': { $ref: '#/components/responses/Forbidden' }
        '404': { $ref: '#/components/responses/NotFound' }
  /sectors:
    get:
      operationId: listSectors
      x-roles: [AUTHENTICATED]
      parameters:
        - { $ref: '#/components/parameters/Page' }
        - { $ref: '#/components/parameters/PageSize' }
        - { name: active, in: query, required: false, schema: { type: boolean } }
      responses:
        '200':
          description: Paginated sectors.
          content:
            application/json:
              schema:
                allOf:
                  - { $ref: '#/components/schemas/PageMeta' }
                  - type: object
                    required: [items]
                    properties:
                      items:
                        type: array
                        items: { $ref: '#/components/schemas/Sector' }
    post:
      operationId: createSector
      x-roles: [ADMIN]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [name]
              properties:
                name: { type: string }
      responses:
        '201':
          description: Sector created.
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Sector' }
        '400': { $ref: '#/components/responses/ValidationFailed' }
        '403': { $ref: '#/components/responses/Forbidden' }
  /sectors/{sectorId}:
    parameters:
      - { name: sectorId, in: path, required: true, schema: { $ref: '#/components/schemas/Uuid' } }
    patch:
      operationId: updateSector
      x-roles: [ADMIN]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name: { type: string }
                active: { type: boolean }
      responses:
        '200':
          description: Sector updated; deactivation does not change existing tickets.
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Sector' }
        '400': { $ref: '#/components/responses/ValidationFailed' }
        '403': { $ref: '#/components/responses/Forbidden' }
        '404': { $ref: '#/components/responses/NotFound' }
  /categories:
    get:
      operationId: listCategories
      x-roles: [AUTHENTICATED]
      parameters:
        - { $ref: '#/components/parameters/Page' }
        - { $ref: '#/components/parameters/PageSize' }
        - { name: active, in: query, required: false, schema: { type: boolean } }
        - { name: sectorId, in: query, required: false, schema: { $ref: '#/components/schemas/Uuid' } }
      responses:
        '200':
          description: Paginated categories, each with its destination sector.
          content:
            application/json:
              schema:
                allOf:
                  - { $ref: '#/components/schemas/PageMeta' }
                  - type: object
                    required: [items]
                    properties:
                      items:
                        type: array
                        items: { $ref: '#/components/schemas/Category' }
    post:
      operationId: createCategory
      x-roles: [ADMIN]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [name, sectorId]
              properties:
                name: { type: string }
                sectorId: { $ref: '#/components/schemas/Uuid' }
      responses:
        '201':
          description: Category created.
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Category' }
        '400': { $ref: '#/components/responses/ValidationFailed' }
        '403': { $ref: '#/components/responses/Forbidden' }
        '422': { $ref: '#/components/responses/UnprocessableEntity' }
  /categories/{categoryId}:
    parameters:
      - { name: categoryId, in: path, required: true, schema: { $ref: '#/components/schemas/Uuid' } }
    patch:
      operationId: updateCategory
      x-roles: [ADMIN]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name: { type: string }
                sectorId: { $ref: '#/components/schemas/Uuid' }
                active: { type: boolean }
      responses:
        '200':
          description: Category updated.
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Category' }
        '400': { $ref: '#/components/responses/ValidationFailed' }
        '403': { $ref: '#/components/responses/Forbidden' }
        '404': { $ref: '#/components/responses/NotFound' }
        '422': { $ref: '#/components/responses/UnprocessableEntity' }
  /statuses:
    get:
      operationId: listStatuses
      x-roles: [AUTHENTICATED]
      responses:
        '200':
          description: All statuses, active and inactive.
          content:
            application/json:
              schema:
                allOf:
                  - { $ref: '#/components/schemas/PageMeta' }
                  - type: object
                    required: [items]
                    properties:
                      items:
                        type: array
                        items: { $ref: '#/components/schemas/Status' }
  /statuses/{statusId}:
    parameters:
      - { name: statusId, in: path, required: true, schema: { $ref: '#/components/schemas/Uuid' } }
    patch:
      operationId: updateStatus
      x-roles: [ADMIN]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              description: The stable key is never editable.
              properties:
                label: { type: string }
                active: { type: boolean }
      responses:
        '200':
          description: Status updated.
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Status' }
        '400': { $ref: '#/components/responses/ValidationFailed' }
        '403': { $ref: '#/components/responses/Forbidden' }
        '404': { $ref: '#/components/responses/NotFound' }
  /priorities:
    get:
      operationId: listPriorities
      x-roles: [AUTHENTICATED]
      parameters:
        - { name: active, in: query, required: false, schema: { type: boolean } }
      responses:
        '200':
          description: Priorities.
          content:
            application/json:
              schema:
                allOf:
                  - { $ref: '#/components/schemas/PageMeta' }
                  - type: object
                    required: [items]
                    properties:
                      items:
                        type: array
                        items: { $ref: '#/components/schemas/Priority' }
    post:
      operationId: createPriority
      x-roles: [ADMIN]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [label]
              properties:
                label: { type: string }
                isDefault: { type: boolean }
      responses:
        '201':
          description: Priority created.
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Priority' }
        '400': { $ref: '#/components/responses/ValidationFailed' }
        '403': { $ref: '#/components/responses/Forbidden' }
  /priorities/{priorityId}:
    parameters:
      - { name: priorityId, in: path, required: true, schema: { $ref: '#/components/schemas/Uuid' } }
    patch:
      operationId: updatePriority
      x-roles: [ADMIN]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                label: { type: string }
                isDefault: { type: boolean }
                active: { type: boolean }
      responses:
        '200':
          description: Priority updated; exactly one priority stays default.
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Priority' }
        '400': { $ref: '#/components/responses/ValidationFailed' }
        '403': { $ref: '#/components/responses/Forbidden' }
        '404': { $ref: '#/components/responses/NotFound' }
        '422': { $ref: '#/components/responses/UnprocessableEntity' }
components:
  schemas:
    CurrentUser:
      type: object
      required: [id, name, email, role, sector]
      properties:
        id: { $ref: '#/components/schemas/Uuid' }
        name: { type: string }
        email: { type: string, format: email }
        role: { $ref: '#/components/schemas/Role' }
        sector:
          oneOf:
            - { $ref: '#/components/schemas/SectorRef' }
            - { type: 'null' }
    User:
      type: object
      required: [id, name, email, role, sector, active, createdAt, updatedAt]
      properties:
        id: { $ref: '#/components/schemas/Uuid' }
        name: { type: string }
        email: { type: string, format: email }
        role: { $ref: '#/components/schemas/Role' }
        sector:
          oneOf:
            - { $ref: '#/components/schemas/SectorRef' }
            - { type: 'null' }
        active: { type: boolean }
        createdAt: { type: string, format: date-time }
        updatedAt: { type: string, format: date-time }
    Sector:
      type: object
      required: [id, name, active, createdAt, updatedAt]
      properties:
        id: { $ref: '#/components/schemas/Uuid' }
        name: { type: string }
        active: { type: boolean }
        createdAt: { type: string, format: date-time }
        updatedAt: { type: string, format: date-time }
    Category:
      type: object
      required: [id, name, sector, active, createdAt, updatedAt]
      properties:
        id: { $ref: '#/components/schemas/Uuid' }
        name: { type: string }
        sector: { $ref: '#/components/schemas/SectorRef' }
        active: { type: boolean }
        createdAt: { type: string, format: date-time }
        updatedAt: { type: string, format: date-time }
    Status:
      type: object
      required: [id, key, label, active]
      properties:
        id: { $ref: '#/components/schemas/Uuid' }
        key:
          type: string
          description: Stable English key consumed by the transition machine; values fixed in Functional Design.
        label: { type: string }
        active: { type: boolean }
    Priority:
      type: object
      required: [id, label, isDefault, active]
      properties:
        id: { $ref: '#/components/schemas/Uuid' }
        label: { type: string }
        isDefault: { type: boolean }
        active: { type: boolean }
```

A senha nunca aparece em resposta. Não existe rota pública de criação de conta (AC4.1.8) nem de recuperação de senha (FR1.4).

---

## API-U2 — Chamados

Chamados, fila, atendimento, histórico, passagens por setor e notificações. Ações que mudam o estado do chamado são sub-recursos com `POST` (Q1). Toda operação sobre um chamado específico responde `TICKET_NOT_FOUND` quando o chamado não existe ou não é visível ao ator.

```yaml
openapi: 3.1.0
info:
  title: API-U2 Tickets and notifications
  version: 1.0.0
servers:
  - url: /api/v1
paths:
  /tickets:
    get:
      operationId: listTickets
      x-roles: [AUTHENTICATED]
      description: >
        Always filtered by the actor's visibility inside the query. view=requested lists the
        actor's own tickets as requester; view=queue lists the actor's sector queue, including
        tickets that passed through the sector.
      parameters:
        - { $ref: '#/components/parameters/Page' }
        - { $ref: '#/components/parameters/PageSize' }
        - { name: view, in: query, required: true, schema: { type: string, enum: [requested, queue] } }
        - { name: queue, in: query, required: false, schema: { type: string, enum: [unassigned, mine, all], default: all } }
        - { name: statusId, in: query, required: false, schema: { $ref: '#/components/schemas/Uuid' } }
        - { name: categoryId, in: query, required: false, schema: { $ref: '#/components/schemas/Uuid' } }
        - { name: sectorId, in: query, required: false, schema: { $ref: '#/components/schemas/Uuid' } }
        - { name: sort, in: query, required: false, schema: { type: string } }
        - { name: order, in: query, required: false, schema: { type: string, enum: [asc, desc] } }
      responses:
        '200':
          description: Paginated ticket list.
          content:
            application/json:
              schema:
                allOf:
                  - { $ref: '#/components/schemas/PageMeta' }
                  - type: object
                    required: [items]
                    properties:
                      items:
                        type: array
                        items: { $ref: '#/components/schemas/TicketListItem' }
        '400': { $ref: '#/components/responses/ValidationFailed' }
        '403': { $ref: '#/components/responses/Forbidden' }
    post:
      operationId: openTicket
      x-roles: [STUDENT, PROFESSOR]
      description: The sector is derived from the category; any sector sent by the client is discarded.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [categoryId, title, description]
              properties:
                categoryId: { $ref: '#/components/schemas/Uuid' }
                title: { type: string }
                description: { type: string }
                priorityId:
                  $ref: '#/components/schemas/Uuid'
                  description: Optional; the default priority applies when omitted.
      responses:
        '201':
          description: Ticket opened with the initial status and no assignee.
          content:
            application/json:
              schema: { $ref: '#/components/schemas/TicketDetail' }
        '400': { $ref: '#/components/responses/ValidationFailed' }
        '403': { $ref: '#/components/responses/Forbidden' }
        '422': { $ref: '#/components/responses/UnprocessableEntity' }
  /tickets/{ticketId}:
    parameters:
      - { name: ticketId, in: path, required: true, schema: { $ref: '#/components/schemas/Uuid' } }
    get:
      operationId: getTicket
      x-roles: [AUTHENTICATED]
      responses:
        '200':
          description: Ticket detail.
          content:
            application/json:
              schema: { $ref: '#/components/schemas/TicketDetail' }
        '404': { $ref: '#/components/responses/NotFound' }
  /tickets/{ticketId}/history:
    parameters:
      - { name: ticketId, in: path, required: true, schema: { $ref: '#/components/schemas/Uuid' } }
    get:
      operationId: listTicketHistory
      x-roles: [AUTHENTICATED]
      parameters:
        - { $ref: '#/components/parameters/Page' }
        - { $ref: '#/components/parameters/PageSize' }
      responses:
        '200':
          description: Changes in chronological order.
          content:
            application/json:
              schema:
                allOf:
                  - { $ref: '#/components/schemas/PageMeta' }
                  - type: object
                    required: [items]
                    properties:
                      items:
                        type: array
                        items: { $ref: '#/components/schemas/TicketHistoryEntry' }
        '404': { $ref: '#/components/responses/NotFound' }
  /tickets/{ticketId}/sector-passages:
    parameters:
      - { name: ticketId, in: path, required: true, schema: { $ref: '#/components/schemas/Uuid' } }
    get:
      operationId: listTicketSectorPassages
      x-roles: [AUTHENTICATED]
      responses:
        '200':
          description: Every sector the ticket passed through, with entry and exit.
          content:
            application/json:
              schema:
                allOf:
                  - { $ref: '#/components/schemas/PageMeta' }
                  - type: object
                    required: [items]
                    properties:
                      items:
                        type: array
                        items: { $ref: '#/components/schemas/TicketSectorPassage' }
        '404': { $ref: '#/components/responses/NotFound' }
  /tickets/{ticketId}/assume:
    parameters:
      - { name: ticketId, in: path, required: true, schema: { $ref: '#/components/schemas/Uuid' } }
    post:
      operationId: assumeTicket
      x-roles: [AGENT, MANAGER]
      responses:
        '200':
          description: The actor becomes the assignee and the ticket moves to analysis.
          content:
            application/json:
              schema: { $ref: '#/components/schemas/TicketDetail' }
        '403': { $ref: '#/components/responses/Forbidden' }
        '404': { $ref: '#/components/responses/NotFound' }
        '409': { $ref: '#/components/responses/Conflict' }
  /tickets/{ticketId}/assign:
    parameters:
      - { name: ticketId, in: path, required: true, schema: { $ref: '#/components/schemas/Uuid' } }
    post:
      operationId: assignTicket
      x-roles: [MANAGER]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [assigneeId]
              properties:
                assigneeId: { $ref: '#/components/schemas/Uuid' }
      responses:
        '200':
          description: Assignee set or replaced; an open ticket moves to analysis.
          content:
            application/json:
              schema: { $ref: '#/components/schemas/TicketDetail' }
        '400': { $ref: '#/components/responses/ValidationFailed' }
        '403': { $ref: '#/components/responses/Forbidden' }
        '404': { $ref: '#/components/responses/NotFound' }
        '409': { $ref: '#/components/responses/Conflict' }
        '422': { $ref: '#/components/responses/UnprocessableEntity' }
  /tickets/{ticketId}/transfer:
    parameters:
      - { name: ticketId, in: path, required: true, schema: { $ref: '#/components/schemas/Uuid' } }
    post:
      operationId: transferTicket
      x-roles: [AGENT, MANAGER]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [targetSectorId, justification]
              properties:
                targetSectorId: { $ref: '#/components/schemas/Uuid' }
                justification: { type: string, minLength: 1 }
      responses:
        '200':
          description: Assignee removed, ticket back to the initial status in the target sector queue.
          content:
            application/json:
              schema: { $ref: '#/components/schemas/TicketDetail' }
        '400': { $ref: '#/components/responses/ValidationFailed' }
        '403': { $ref: '#/components/responses/Forbidden' }
        '404': { $ref: '#/components/responses/NotFound' }
        '422': { $ref: '#/components/responses/UnprocessableEntity' }
  /tickets/{ticketId}/wait-for-requester:
    parameters:
      - { name: ticketId, in: path, required: true, schema: { $ref: '#/components/schemas/Uuid' } }
    post:
      operationId: waitForRequester
      x-roles: [AGENT, MANAGER]
      responses:
        '200':
          description: Ticket waits for the requester.
          content:
            application/json:
              schema: { $ref: '#/components/schemas/TicketDetail' }
        '403': { $ref: '#/components/responses/Forbidden' }
        '404': { $ref: '#/components/responses/NotFound' }
        '409': { $ref: '#/components/responses/Conflict' }
  /tickets/{ticketId}/close:
    parameters:
      - { name: ticketId, in: path, required: true, schema: { $ref: '#/components/schemas/Uuid' } }
    post:
      operationId: closeTicket
      x-roles: [STUDENT, PROFESSOR, AGENT, MANAGER]
      x-actor-rule: A requester may close only their own ticket.
      responses:
        '200':
          description: Ticket closed.
          content:
            application/json:
              schema: { $ref: '#/components/schemas/TicketDetail' }
        '403': { $ref: '#/components/responses/Forbidden' }
        '404': { $ref: '#/components/responses/NotFound' }
        '409': { $ref: '#/components/responses/Conflict' }
  /tickets/{ticketId}/reopen:
    parameters:
      - { name: ticketId, in: path, required: true, schema: { $ref: '#/components/schemas/Uuid' } }
    post:
      operationId: reopenTicket
      x-roles: [STUDENT, PROFESSOR]
      x-actor-rule: Only the ticket's requester, within the reopen window.
      responses:
        '200':
          description: Ticket back to the initial status, last assignee kept.
          content:
            application/json:
              schema: { $ref: '#/components/schemas/TicketDetail' }
        '403': { $ref: '#/components/responses/Forbidden' }
        '404': { $ref: '#/components/responses/NotFound' }
        '409': { $ref: '#/components/responses/Conflict' }
  /tickets/{ticketId}/priority:
    parameters:
      - { name: ticketId, in: path, required: true, schema: { $ref: '#/components/schemas/Uuid' } }
    put:
      operationId: changeTicketPriority
      x-roles: [AGENT, MANAGER]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [priorityId]
              properties:
                priorityId: { $ref: '#/components/schemas/Uuid' }
      responses:
        '200':
          description: Priority changed and recorded in history.
          content:
            application/json:
              schema: { $ref: '#/components/schemas/TicketDetail' }
        '400': { $ref: '#/components/responses/ValidationFailed' }
        '403': { $ref: '#/components/responses/Forbidden' }
        '404': { $ref: '#/components/responses/NotFound' }
        '422': { $ref: '#/components/responses/UnprocessableEntity' }
  /notifications:
    get:
      operationId: listNotifications
      x-roles: [AUTHENTICATED]
      parameters:
        - { $ref: '#/components/parameters/Page' }
        - { $ref: '#/components/parameters/PageSize' }
        - { name: unreadOnly, in: query, required: false, schema: { type: boolean, default: false } }
      responses:
        '200':
          description: The actor's own notifications, newest first.
          content:
            application/json:
              schema:
                allOf:
                  - { $ref: '#/components/schemas/PageMeta' }
                  - type: object
                    required: [items]
                    properties:
                      items:
                        type: array
                        items: { $ref: '#/components/schemas/Notification' }
  /notifications/unread-count:
    get:
      operationId: countUnreadNotifications
      x-roles: [AUTHENTICATED]
      responses:
        '200':
          description: Unread counter for the bell.
          content:
            application/json:
              schema:
                type: object
                required: [count]
                properties:
                  count: { type: integer, minimum: 0 }
  /notifications/{notificationId}/read:
    parameters:
      - { name: notificationId, in: path, required: true, schema: { $ref: '#/components/schemas/Uuid' } }
    post:
      operationId: markNotificationRead
      x-roles: [AUTHENTICATED]
      responses:
        '204':
          description: Marked as read.
        '404': { $ref: '#/components/responses/NotFound' }
  /notifications/read-all:
    post:
      operationId: markAllNotificationsRead
      x-roles: [AUTHENTICATED]
      responses:
        '204':
          description: Every unread notification of the actor marked as read.
components:
  schemas:
    StatusRef:
      type: object
      required: [id, key, label]
      properties:
        id: { $ref: '#/components/schemas/Uuid' }
        key: { type: string }
        label: { type: string }
    PriorityRef:
      type: object
      required: [id, label]
      properties:
        id: { $ref: '#/components/schemas/Uuid' }
        label: { type: string }
    CategoryRef:
      type: object
      required: [id, name]
      properties:
        id: { $ref: '#/components/schemas/Uuid' }
        name: { type: string }
    TicketListItem:
      type: object
      required: [id, reference, title, category, sector, status, priority, assignee, updatedAt]
      properties:
        id: { $ref: '#/components/schemas/Uuid' }
        reference:
          type: string
          description: Visible, stable identifier; format fixed in Functional Design of U2.
        title: { type: string }
        category: { $ref: '#/components/schemas/CategoryRef' }
        sector: { $ref: '#/components/schemas/SectorRef' }
        status: { $ref: '#/components/schemas/StatusRef' }
        priority: { $ref: '#/components/schemas/PriorityRef' }
        assignee:
          oneOf:
            - { $ref: '#/components/schemas/UserRef' }
            - { type: 'null' }
        updatedAt: { type: string, format: date-time }
    TicketDetail:
      allOf:
        - { $ref: '#/components/schemas/TicketListItem' }
        - type: object
          required: [description, requester, openedAt, closedAt]
          properties:
            description: { type: string }
            requester: { $ref: '#/components/schemas/UserRef' }
            openedAt: { type: string, format: date-time }
            closedAt:
              oneOf:
                - { type: string, format: date-time }
                - { type: 'null' }
    TicketHistoryEntry:
      type: object
      required: [id, field, previousValue, newValue, author, occurredAt]
      properties:
        id: { $ref: '#/components/schemas/Uuid' }
        field:
          type: string
          description: Which attribute changed (status, assignee, sector, priority); values fixed in Functional Design.
        previousValue:
          oneOf:
            - { type: string }
            - { type: 'null' }
        newValue:
          oneOf:
            - { type: string }
            - { type: 'null' }
        author: { $ref: '#/components/schemas/UserRef' }
        occurredAt: { type: string, format: date-time }
    TicketSectorPassage:
      type: object
      required: [id, sector, enteredAt, leftAt, justification, transferredBy]
      properties:
        id: { $ref: '#/components/schemas/Uuid' }
        sector: { $ref: '#/components/schemas/SectorRef' }
        enteredAt: { type: string, format: date-time }
        leftAt:
          oneOf:
            - { type: string, format: date-time }
            - { type: 'null' }
        justification:
          oneOf:
            - { type: string }
            - { type: 'null' }
        transferredBy:
          oneOf:
            - { $ref: '#/components/schemas/UserRef' }
            - { type: 'null' }
    Notification:
      type: object
      required: [id, kind, ticket, read, createdAt, readAt]
      properties:
        id: { $ref: '#/components/schemas/Uuid' }
        kind:
          type: string
          description: Event type (message received, status, assignee or sector change, reopening); values fixed in Functional Design.
        ticket:
          type: object
          required: [id, reference, title]
          properties:
            id: { $ref: '#/components/schemas/Uuid' }
            reference: { type: string }
            title: { type: string }
        read: { type: boolean }
        createdAt: { type: string, format: date-time }
        readAt:
          oneOf:
            - { type: string, format: date-time }
            - { type: 'null' }
```

---

## API-U3 — Conversa

Mensagens do chamado. O caminho fica sob `/tickets/{ticketId}` por ser sub-recurso do chamado, mas a operação pertence a U3. Não existe rota de edição nem de exclusão de mensagem (AC1.4.3). Um ator fora da regra de acesso à conversa recebe `TICKET_NOT_FOUND`, sem nenhuma mensagem no corpo (AC2.1.7).

```yaml
openapi: 3.1.0
info:
  title: API-U3 Conversation
  version: 1.0.0
servers:
  - url: /api/v1
paths:
  /tickets/{ticketId}/messages:
    parameters:
      - { name: ticketId, in: path, required: true, schema: { $ref: '#/components/schemas/Uuid' } }
    get:
      operationId: listMessages
      x-roles: [AUTHENTICATED]
      x-actor-rule: Requester, current assignee, agents and managers of the current sector or of a sector the ticket passed through.
      parameters:
        - { $ref: '#/components/parameters/Page' }
        - { $ref: '#/components/parameters/PageSize' }
      responses:
        '200':
          description: Messages in chronological order.
          content:
            application/json:
              schema:
                allOf:
                  - { $ref: '#/components/schemas/PageMeta' }
                  - type: object
                    required: [items]
                    properties:
                      items:
                        type: array
                        items: { $ref: '#/components/schemas/Message' }
        '404': { $ref: '#/components/responses/NotFound' }
    post:
      operationId: sendMessage
      x-roles: [AUTHENTICATED]
      x-actor-rule: Same access rule as listMessages. A requester message on a ticket waiting for the requester moves it back to analysis.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [body]
              properties:
                body: { type: string, minLength: 1 }
      responses:
        '201':
          description: Message stored; the counterpart is notified.
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Message' }
        '400': { $ref: '#/components/responses/ValidationFailed' }
        '404': { $ref: '#/components/responses/NotFound' }
        '409': { $ref: '#/components/responses/Conflict' }
components:
  schemas:
    Message:
      type: object
      required: [id, body, author, sentAt]
      properties:
        id: { $ref: '#/components/schemas/Uuid' }
        body: { type: string }
        author: { $ref: '#/components/schemas/UserRef' }
        sentAt: { type: string, format: date-time }
```

---

## API-U4 — Indicadores

Somente leitura. Todo número respeita o recorte de visibilidade do perfil que consulta. Não existe rota de exportação nem de download (AC6.2.2). O período é fechado no início e aberto no fim, em UTC.

```yaml
openapi: 3.1.0
info:
  title: API-U4 Reporting
  version: 1.0.0
servers:
  - url: /api/v1
paths:
  /reports/ticket-counts:
    get:
      operationId: getTicketCounts
      x-roles: [MANAGER, ADMIN]
      parameters:
        - { name: groupBy, in: query, required: true, schema: { type: string, enum: [status, category, sector] } }
        - { $ref: '#/components/parameters/From' }
        - { $ref: '#/components/parameters/To' }
      responses:
        '200':
          description: Ticket counts per group; an empty period returns an empty list and total 0.
          content:
            application/json:
              schema:
                type: object
                required: [groups, total, from, to]
                properties:
                  groups:
                    type: array
                    items:
                      type: object
                      required: [id, label, count]
                      properties:
                        id: { $ref: '#/components/schemas/Uuid' }
                        label: { type: string }
                        count: { type: integer, minimum: 0 }
                  total: { type: integer, minimum: 0 }
                  from: { type: string, format: date-time }
                  to: { type: string, format: date-time }
        '400': { $ref: '#/components/responses/ValidationFailed' }
        '403': { $ref: '#/components/responses/Forbidden' }
  /reports/durations:
    get:
      operationId: getAverageDurations
      x-roles: [MANAGER, ADMIN]
      description: Start and end milestones of each duration are fixed in Functional Design of U4.
      parameters:
        - { $ref: '#/components/parameters/From' }
        - { $ref: '#/components/parameters/To' }
      responses:
        '200':
          description: Averages in seconds, null when the period has no sample; no threshold or goal attached.
          content:
            application/json:
              schema:
                type: object
                required: [averageHandlingSeconds, averageResolutionSeconds, sampleSize, from, to]
                properties:
                  averageHandlingSeconds:
                    oneOf:
                      - { type: number, minimum: 0 }
                      - { type: 'null' }
                  averageResolutionSeconds:
                    oneOf:
                      - { type: number, minimum: 0 }
                      - { type: 'null' }
                  sampleSize: { type: integer, minimum: 0 }
                  from: { type: string, format: date-time }
                  to: { type: string, format: date-time }
        '400': { $ref: '#/components/responses/ValidationFailed' }
        '403': { $ref: '#/components/responses/Forbidden' }
  /reports/tickets:
    get:
      operationId: searchTicketsForReport
      x-roles: [MANAGER]
      parameters:
        - { $ref: '#/components/parameters/Page' }
        - { $ref: '#/components/parameters/PageSize' }
        - { name: statusId, in: query, required: false, schema: { $ref: '#/components/schemas/Uuid' } }
        - { name: categoryId, in: query, required: false, schema: { $ref: '#/components/schemas/Uuid' } }
        - { name: sectorId, in: query, required: false, schema: { $ref: '#/components/schemas/Uuid' } }
        - { $ref: '#/components/parameters/From' }
        - { $ref: '#/components/parameters/To' }
      responses:
        '200':
          description: On-screen listing with combined filters.
          content:
            application/json:
              schema:
                allOf:
                  - { $ref: '#/components/schemas/PageMeta' }
                  - type: object
                    required: [items]
                    properties:
                      items:
                        type: array
                        items: { $ref: '#/components/schemas/TicketListItem' }
        '400': { $ref: '#/components/responses/ValidationFailed' }
        '403': { $ref: '#/components/responses/Forbidden' }
components:
  parameters:
    From:
      name: from
      in: query
      required: false
      schema: { type: string, format: date-time }
    To:
      name: to
      in: query
      required: false
      schema: { type: string, format: date-time }
```

---

## API-U5 — Avaliação

Avaliação do atendimento como sub-recurso do chamado, e um indicador que se soma ao painel de U4 com o mesmo recorte de período.

```yaml
openapi: 3.1.0
info:
  title: API-U5 Rating
  version: 1.0.0
servers:
  - url: /api/v1
paths:
  /tickets/{ticketId}/rating:
    parameters:
      - { name: ticketId, in: path, required: true, schema: { $ref: '#/components/schemas/Uuid' } }
    get:
      operationId: getTicketRating
      x-roles: [AUTHENTICATED]
      responses:
        '200':
          description: The rating of a ticket visible to the actor.
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Rating' }
        '404': { $ref: '#/components/responses/NotFound' }
    put:
      operationId: rateTicket
      x-roles: [STUDENT, PROFESSOR]
      x-actor-rule: Only the ticket's requester, only on a closed ticket. Whether a rating can be replaced is fixed in Functional Design of U5.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [score]
              properties:
                score:
                  type: integer
                  description: Scale fixed in Functional Design of U5.
                comment: { type: string }
      responses:
        '200':
          description: Rating stored.
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Rating' }
        '400': { $ref: '#/components/responses/ValidationFailed' }
        '403': { $ref: '#/components/responses/Forbidden' }
        '404': { $ref: '#/components/responses/NotFound' }
        '409': { $ref: '#/components/responses/Conflict' }
  /reports/ratings:
    get:
      operationId: getRatingSummary
      x-roles: [MANAGER, ADMIN]
      parameters:
        - { $ref: '#/components/parameters/From' }
        - { $ref: '#/components/parameters/To' }
      responses:
        '200':
          description: Rating summary for the period, within the actor's visibility.
          content:
            application/json:
              schema:
                type: object
                required: [averageScore, count, from, to]
                properties:
                  averageScore:
                    oneOf:
                      - { type: number }
                      - { type: 'null' }
                  count: { type: integer, minimum: 0 }
                  from: { type: string, format: date-time }
                  to: { type: string, format: date-time }
        '400': { $ref: '#/components/responses/ValidationFailed' }
        '403': { $ref: '#/components/responses/Forbidden' }
components:
  schemas:
    Rating:
      type: object
      required: [ticketId, score, comment, ratedAt]
      properties:
        ticketId: { $ref: '#/components/schemas/Uuid' }
        score: { type: integer }
        comment:
          oneOf:
            - { type: string }
            - { type: 'null' }
        ratedAt: { type: string, format: date-time }
```

---

## Contratos de Serviço entre Unidades

Cada bloco exporta, pelo seu módulo NestJS, **um único serviço público** (Q3). Os métodos recebem e devolvem os tipos declarados aqui — nunca modelos do Prisma. Serviços internos, controllers, a máquina de transições e o `PrismaService` de cada unidade não são exportados.

As interfaces estão agrupadas por unidade provedora, porque a mesma interface atende a mais de uma aresta. Cada tabela depois do bloco diz quais métodos cada aresta usa.

### Serviços públicos de U1 — SVC-01, SVC-02, SVC-04, SVC-06

```typescript
// Shared contract types exported by U1 (auth, users, catalog modules).

export type Role = 'STUDENT' | 'PROFESSOR' | 'AGENT' | 'MANAGER' | 'ADMIN';

/** The authenticated actor, loaded from the database on every request. */
export interface Actor {
  id: string; // UUID
  role: Role;
  sectorId: string | null; // set only for AGENT and MANAGER
}

// --- Auth: route-level contract (no service injection needed by consumers) ---
// @Public()              marks a route as public; every other route is denied by default
// @Roles(...roles)       declares which roles may call a route
// @CurrentActor() actor  injects the Actor into a controller method
// A guard that cannot resolve the actor denies the request (fail closed).

// --- Users ---
export interface UserSummary {
  id: string;
  name: string;
  role: Role;
  sectorId: string | null;
  active: boolean; // inactive users are still returned, so history stays readable
}

export interface UsersPublicService {
  /** Resolves display data for authors, requesters and assignees. Unknown ids are omitted. */
  findSummariesByIds(ids: string[]): Promise<UserSummary[]>;
  /** True when the user is active and may be made assignee of a ticket in the given sector. */
  isAssignableInSector(userId: string, sectorId: string): Promise<boolean>;
}

// --- Catalog ---
export interface CatalogItemRef {
  id: string;
  name: string; // label for statuses and priorities
  active: boolean;
}

export interface CategoryRef extends CatalogItemRef {
  sectorId: string;
}

export interface StatusRef extends CatalogItemRef {
  key: string; // stable English key; values fixed in Functional Design
}

export interface CatalogLabels {
  categories: CatalogItemRef[];
  sectors: CatalogItemRef[];
  statuses: CatalogItemRef[];
  priorities: CatalogItemRef[];
}

export interface CatalogPublicService {
  /** Throws CATALOG_ITEM_NOT_FOUND or CATALOG_ITEM_INACTIVE. */
  getActiveCategory(categoryId: string): Promise<CategoryRef>;
  /** Throws CATALOG_ITEM_NOT_FOUND or CATALOG_ITEM_INACTIVE. */
  getActiveSector(sectorId: string): Promise<CatalogItemRef>;
  /** Throws CATALOG_ITEM_NOT_FOUND or CATALOG_ITEM_INACTIVE. */
  getActivePriority(priorityId: string): Promise<CatalogItemRef>;
  getDefaultPriority(): Promise<CatalogItemRef>;
  /** Throws CATALOG_ITEM_NOT_FOUND when the key has no status row. */
  getStatusByKey(key: string): Promise<StatusRef>;
  /** Labels for display, including inactive items still referenced by existing tickets. */
  findLabels(ids: {
    categoryIds?: string[];
    sectorIds?: string[];
    statusIds?: string[];
    priorityIds?: string[];
  }): Promise<CatalogLabels>;
}
```

| Aresta | Consumidor | O que usa |
|--------|-----------|-----------|
| SVC-01 | U2 | `Actor` e decorators de rota; `findSummariesByIds`, `isAssignableInSector`; `getActiveCategory`, `getActiveSector`, `getActivePriority`, `getDefaultPriority`, `getStatusByKey`, `findLabels` |
| SVC-02 | U3 | `Actor` e decorators de rota; `findSummariesByIds` |
| SVC-04 | U4 | `Actor` e decorators de rota; `findLabels` |
| SVC-06 | U5 | `Actor` e decorators de rota |

### Serviços públicos de U2 — SVC-03, SVC-05, SVC-07

```typescript
// Contract types exported by U2 (tickets and notifications modules).
import type { Actor } from '../foundation'; // illustrative path

export interface VisibleTicket {
  id: string;
  reference: string;
  requesterId: string;
  assigneeId: string | null;
  sectorId: string;
  passedSectorIds: string[]; // sectors the ticket was in before the current one
  statusKey: string;
  closedAt: string | null; // ISO 8601 UTC
}

export interface TicketSearchFilter {
  statusId?: string;
  categoryId?: string;
  sectorId?: string;
  openedFrom?: string; // ISO 8601 UTC, inclusive
  openedTo?: string; // ISO 8601 UTC, exclusive
}

export interface PageRequest {
  page: number;
  pageSize: number;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TicketListRow {
  id: string;
  reference: string;
  title: string;
  categoryId: string;
  sectorId: string;
  statusId: string;
  priorityId: string;
  assigneeId: string | null;
  updatedAt: string;
}

export interface TicketCountGroup {
  groupId: string;
  count: number;
}

export interface DurationAverages {
  averageHandlingSeconds: number | null;
  averageResolutionSeconds: number | null;
  sampleSize: number;
}

export interface TicketsPublicService {
  /**
   * Returns the ticket only when the actor may see it; the actor is filtered inside the query.
   * Throws TICKET_NOT_FOUND otherwise, identical for missing and invisible tickets.
   */
  getVisibleTicket(actor: Actor, ticketId: string): Promise<VisibleTicket>;
  /**
   * Called after a message is stored. When the actor is the requester and the ticket waits
   * for the requester, applies the transition back to analysis through the transition machine,
   * records history and notifies the assignee. No-op otherwise.
   */
  onRequesterMessage(actor: Actor, ticketId: string): Promise<void>;
  /** Visibility-filtered listing with combined filters. */
  searchTickets(actor: Actor, filter: TicketSearchFilter, page: PageRequest): Promise<Page<TicketListRow>>;
  /** Visibility-filtered counts. */
  countTickets(
    actor: Actor,
    filter: TicketSearchFilter,
    groupBy: 'status' | 'category' | 'sector',
  ): Promise<TicketCountGroup[]>;
  /** Visibility-filtered duration averages; milestones fixed in Functional Design of U4. */
  getDurationAverages(actor: Actor, filter: TicketSearchFilter): Promise<DurationAverages>;
}

export interface NotificationsPublicService {
  /** Stores one in-app notification per recipient at the moment the event happens. */
  record(input: { kind: string; ticketId: string; recipientIds: string[] }): Promise<void>;
}
```

| Aresta | Consumidor | O que usa |
|--------|-----------|-----------|
| SVC-03 | U3 | `getVisibleTicket` (existência, situação e visibilidade), `onRequesterMessage`, `NotificationsPublicService.record` com o tipo de mensagem recebida |
| SVC-05 | U4 | `searchTickets`, `countTickets`, `getDurationAverages` |
| SVC-07 | U5 | `getVisibleTicket` (chamado encerrado do próprio solicitante); U5 acrescenta ao serviço público de Tickets, por adição, `getRatingSummary(actor, filter)`, que não altera nenhum método existente |

**Regra de acesso à conversa.** U3 aplica a sua própria regra (FR6.5) sobre os fatos devolvidos por `getVisibleTicket`: solicitante, responsável atual, e atendentes e gestores do setor atual ou de um setor em `passedSectorIds`. U3 nunca consulta a tabela de chamados.

### Extensão de U4 usada por U5 — SVC-08

U4 garante duas coisas, e U5 depende só delas:

```yaml
extension-contract:
  provider: U4
  consumer: U5
  backend:
    indicator-shape: every indicator endpoint lives under /api/v1/reports, accepts the same from/to period parameters and applies the actor's visibility through TicketsPublicService
    rule: U5 adds GET /api/v1/reports/ratings following this shape; no existing U4 endpoint changes
  frontend:
    composition-point: the dashboard page renders an ordered list of indicator cards, each receiving the selected period
    rule: U5 registers one additional card; U4 cards and the period selector are not modified
```

---

## DB-01 — Dados Compartilhados

Um único Postgres e um único esquema do Prisma. Cada unidade é dona das próprias tabelas e é a única que grava nelas; ler dado de outra unidade é pela chamada ao serviço dela, nunca por consulta à tabela alheia (ADR-004). As chaves estrangeiras entre unidades existem só no sentido do grafo (Q5 da Geração de Unidades).

```yaml
shared-schema:
  database: postgresql
  schema-file: single Prisma schema; migrations generated by one unit at a time, in merge order
  naming: models PascalCase singular, tables snake_case plural via @@map, columns snake_case via @map
  identifiers: uuid on every table
  deletion: no row is ever deleted; deactivation only, so every foreign key is ON DELETE RESTRICT
  tables:
    U1: [users, sectors, categories, statuses, priorities]
    U2: [tickets, ticket_history_entries, ticket_sector_passages, notifications]
    U3: [messages]
    U5: [ticket_ratings]
  cross-unit-foreign-keys:
    - { from: tickets.requester_id, to: users.id, edge: U2 -> U1 }
    - { from: tickets.assignee_id, to: users.id, edge: U2 -> U1, nullable: true }
    - { from: tickets.category_id, to: categories.id, edge: U2 -> U1 }
    - { from: tickets.sector_id, to: sectors.id, edge: U2 -> U1 }
    - { from: tickets.status_id, to: statuses.id, edge: U2 -> U1 }
    - { from: tickets.priority_id, to: priorities.id, edge: U2 -> U1 }
    - { from: ticket_history_entries.author_id, to: users.id, edge: U2 -> U1 }
    - { from: ticket_sector_passages.sector_id, to: sectors.id, edge: U2 -> U1 }
    - { from: ticket_sector_passages.transferred_by_id, to: users.id, edge: U2 -> U1, nullable: true }
    - { from: notifications.recipient_id, to: users.id, edge: U2 -> U1 }
    - { from: messages.ticket_id, to: tickets.id, edge: U3 -> U2 }
    - { from: messages.author_id, to: users.id, edge: U3 -> U1 }
    - { from: ticket_ratings.ticket_id, to: tickets.id, edge: U5 -> U2 }
  forbidden:
    - any foreign key from a table of a unit to a table of a unit that depends on it
    - any query from one unit's service to another unit's table
```

As chaves internas a uma unidade (por exemplo `users.sector_id` em U1, ou `notifications.ticket_id` em U2) não são contrato entre unidades e ficam no Desenho Funcional de cada unidade. O nome final de cada coluna também é do Desenho Funcional; o que este bloco fixa é a existência e o sentido de cada relação.

---

## Regras de Propriedade dos Contratos

- **Dono.** A unidade provedora é dona de cada contrato: U1 de X-01, API-U1 e dos serviços públicos de U1; U2 de API-U2 e dos serviços públicos de U2; U3, U4 e U5 das próprias APIs; U4 do contrato de extensão SVC-08. Em DB-01, cada unidade é dona das próprias tabelas.
- **Mudança aditiva** — campo novo em resposta, operação nova, método novo num serviço público, código de erro novo — é sempre segura: consumidores ignoram o que não conhecem. Entra no pull request da unidade dona.
- **Mudança que quebra** — remover ou renomear campo, mudar tipo, mudar significado de código de erro, mudar assinatura de método público — é feita no mesmo pull request no provedor, em todos os consumidores e no frontend, com o OpenAPI gerado atualizado. Não existem versões paralelas mantidas (Q4); o prefixo `/api/v1` fica para o caso de um consumidor externo surgir.
- **Fonte da verdade** (Q2). Os blocos deste documento são o desenho inicial. Depois que o código existe, o OpenAPI gerado do backend é a fonte da verdade da API HTTP, com os tipos do frontend gerados a partir dele, e o CI falha se o arquivo gerado mudar sem ser commitado. As interfaces TypeScript exportadas são a fonte da verdade dos contratos de serviço.
- **Nenhum tipo do Prisma** atravessa uma fronteira: nem em resposta HTTP, nem em assinatura de serviço público.

## Implicações de Segurança

| Decisão | Risco tratado | Risco que permanece |
|---------|---------------|---------------------|
| Mesma origem, `SameSite=Strict` e recusa de `Origin` diferente em requisição que altera estado (Q9) | CSRF: nenhum site externo consegue fazer o navegador enviar o cookie de sessão numa ação | Uma falha de XSS no próprio frontend continua podendo agir em nome do usuário; o cookie `httpOnly` impede apenas a leitura do token |
| UUID em todo identificador (Q8) | Enumeração: não dá para estimar volume nem adivinhar o identificador de um vizinho | Um UUID vazado dá acesso só ao que a regra de visibilidade já permite; a proteção real continua sendo o 404 |
| 404 idêntico para inexistente e invisível (X-01) | Descoberta de chamados alheios por tentativa (NFR4) | Nenhum, desde que o teste de indistinguibilidade (AC5.2.2) exista em cada recurso com dono |
| Campos desconhecidos descartados na entrada (X-01) | Atribuição em massa: `sectorId` na abertura e `role` fora da gestão de usuários não são gravados | Um campo aceito indevidamente num DTO continua sendo gravado; a lista de campos de cada DTO é revisada no Desenho Funcional |
| Nenhum tipo do Prisma na fronteira; `INTERNAL_ERROR` sem detalhe (X-01, Q3) | Vazamento de estrutura do banco e de mensagens internas (NFR3) | — |
| OpenAPI gerado commitado num repositório público (Q2) | — | Todas as rotas e formas ficam públicas; aceitável porque não carregam segredo, e a segurança não depende de a rota ser desconhecida |
| Regra de visibilidade só em U2, consumida por U3, U4 e U5 (SVC-03, SVC-05, SVC-07) | Duplicação divergente da regra, que é o jeito típico de vazar dado entre setores | Um método público novo em U2 que esqueça o filtro do ator; mitigado pelo teste de IDOR obrigatório por recurso com dono |

## Decisões e Alternativas

| Decisão | Escolhida | Alternativas rejeitadas e por quê |
|---------|-----------|-----------------------------------|
| Estilo da API (Q1) | REST com JSON e OpenAPI | GraphQL: acrescenta servidor de esquema e complica a autorização por campo num sistema com poucas telas. RPC tipado: perde a modelagem por recurso, que casa com o 404 por recurso |
| Fonte da verdade (Q2) | OpenAPI gerado do código, tipos gerados para o frontend | OpenAPI à mão: diverge do código sem aviso. Pacote `packages/contracts`: um terceiro workspace, e sem documento OpenAPI para o TCC |
| Contrato entre unidades (Q3) | Um serviço público por bloco, com tipos próprios | Exportação livre: vaza tipos do Prisma e acopla ao esquema. Portas e adaptadores: dobra a quantidade de arquivos sem ganho num monólito de um desenvolvedor |
| Versionamento (Q4) | Prefixo `/api/v1`, sem versões paralelas | Sem versão: igual em custo hoje, mas sem caminho pronto. Versões convivendo: manutenção dupla sem consumidor que precise |
| Códigos de erro (Q5) | SCREAMING_SNAKE com prefixo por domínio | Minúsculas com ponto: destoa da convenção de enums do projeto. Só genéricos: o frontend não consegue traduzir motivos que as histórias exigem |
| Falha (Q6) | Uma nova tentativa só em rede ou 5xx; mutação nunca | Padrão da biblioteca: repete 403 e 404 à toa e atrasa o estado de erro. Nenhuma: piora a experiência em falhas transitórias |
| Respostas (Q7) | Recurso direto; lista com `items` e metadados | Tudo embrulhado: ruído em toda leitura. Paginação em cabeçalho: mais difícil de tipar no OpenAPI gerado |
| Identificadores (Q8) | UUID em tudo | Sequencial: permite enumeração. Misto: duas convenções para o mesmo tipo de campo |
| Origem (Q9) | Mesma origem | Origens diferentes com cabeçalho ou token anti-CSRF: exige CORS com credenciais e uma defesa a mais para manter |

## Open questions

| Contract | Question | Blocks |
|----------|----------|--------|
| API-U1 | O administrador pode criar status além dos iniciais (ADR-006)? Por isso API-U1 não traz `POST /statuses`; se a criação for permitida, a operação entra por adição. | U1, U2 |
| API-U1 | O login de um usuário desativado responde o mesmo `AUTH_INVALID_CREDENTIALS` de uma senha errada, para não revelar que a conta existe? | U1 |
| API-U1 | Nenhum requisito limita tentativas de login; sem limite, a senha fica exposta a tentativa por força bruta, mitigada só pelo hash lento (NFR7). | U1 |
| X-01 | Duração exata do cookie de sessão ("algumas horas" em `team.md`). | U1 |
| API-U1, SVC-01 | Valores finais de `Status.key`; e se `Priority.key` fica — este contrato não o expõe, por não haver consumidor (ADR-006). | U1, U2 |
| API-U2 | Formato do `reference` do chamado. | U2 |
| API-U2 | Atendente, Gestor e Administrador também abrem chamados? `x-roles` de `openTicket` traz só Aluno e Professor. | U2 |
| API-U2 | Limites de tamanho de título, descrição, justificativa e mensagem. | U2, U3 |
| API-U2 | O que o Administrador vê em `listTickets` e `getTicket`, e se `view=queue` vale para ele. | U2 |
| X-01 | Mecanismo de propagação de transação entre serviços públicos sem expor tipos do Prisma. | U2, U3 |
| API-U2 | Valores de `field` no histórico e de `kind` na notificação. | U2, U3 |
| API-U3 | O Administrador lê as mensagens? A lista de FR6.5 não o inclui. | U3 |
| API-U4 | Marcos de início e fim dos tempos médios (achado R-06). | U4 |
| API-U4 | O Administrador consulta a listagem filtrada de `searchTicketsForReport`? FR11.1 fala só do Gestor. | U4 |
| API-U5 | Escala da nota, e se a avaliação pode ser substituída depois de enviada. | U5 |
| Todos | Matriz completa de perfil × operação: `x-roles` traz só o que as histórias fixaram. | U1, U2, U3, U4, U5 |

## Assumptions & Open Questions

- [assumption] A convenção de status HTTP — 409 para conflito com o estado atual, 422 para regra de negócio independente do estado, 400 para validação de entrada — não foi perguntada; foi derivada para dar lugar único a cada código do catálogo. As exceções vêm das histórias: `TICKET_CLOSED` e `TICKET_QUEUE_NO_SECTOR` respondem 403 porque AC2.4.6 e AC2.1.4 pedem 403.
- [assumption] A defesa extra de recusar requisição que altera estado com `Origin` diferente foi acrescentada à resposta Q9, que falava em "o backend não aceita requisição de outra origem".
- [assumption] Toda desativação usa `PATCH` com `active: false`, inclusive a de usuário, em vez de uma ação `/deactivate`. A redefinição de senha fica como sub-recurso próprio por ter semântica diferente de uma edição.
- [assumption] Catálogos respondem no mesmo formato paginado das outras listas, embora sejam pequenos, para que o frontend tenha um único jeito de ler listas (Q7).
- [assumption] A avaliação foi desenhada como `PUT /tickets/{ticketId}/rating` e `GET /reports/ratings`, mantendo U5 como extensão dos blocos Tickets e Reporting, conforme `unit-of-work.md`.
- [assumption] O período dos indicadores é fechado no início e aberto no fim, em UTC.

## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-09-12T23:34:32Z
**Iteration:** 1

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | contract-summary.md > "Falha, tempo limite e nova tentativa (Q6)" § Atomicidade, e Open questions > linha "X-01 \| Mecanismo de propagação de transação entre serviços públicos sem expor tipos do Prisma." | A atomicidade entre mensagem (U3) e retorno automático de status/histórico (U2) — e, de forma análoga, entre transferência e passagem por setor dentro de U2 — exige uma transação Postgres única atravessando dois serviços públicos distintos. O documento delega o mecanismo inteiramente ao "Desenho Funcional de U2", mas a operação que dispara a necessidade (`onRequesterMessage`, chamada por U3 depois de gravar a mensagem) é iniciada pelo lado consumidor (U3), e qualquer mecanismo direto (por exemplo, passar um `PrismaClient` de transação através da chamada de serviço) violaria a regra "nenhum tipo do Prisma atravessa uma fronteira" fixada no mesmo documento (X-01, Q3). O próprio artefato já reconhece o ponto como questão aberta que bloqueia U2 e U3, o que confirma tratar-se de um risco real e não hipotético: sem um padrão decidido (por exemplo, um `TransactionRunner` de aplicação injetado sem expor tipos do Prisma, ou um padrão de outbox), a implementação de U2 e U3 corre risco de retrabalho ou de uma violação silenciosa da regra de fronteira. | Antes do Desenho Funcional de U2, decidir e registrar o mecanismo de propagação de transação entre U2 e U3 (e dentro de U2 para transferência/passagem de setor), explicitando como ele evita expor tipos do Prisma na assinatura pública, já que a decisão afeta o desenho de ambas as unidades e não apenas de U2. | New |
| R-02 | Minor | contract-summary.md > "Contratos de Serviço entre Unidades" § SVC-07 e § "Extensão de U4 usada por U5" (SVC-08) | A Tabela de Contratos lista o Owner de SVC-07 como U2 e o de SVC-08 como U4 (a unidade provedora, conforme a regra "a unidade provedora é dona de cada contrato"), mas o texto dos dois contratos afirma que é U5 quem "acrescenta" o método `getRatingSummary` ao serviço público de Tickets e quem "adiciona" o endpoint `GET /reports/ratings` ao módulo de Reporting. Isso deixa implícito, sem declarar, que a implementação física da extensão aditiva é feita no diretório/módulo da unidade provedora durante o Bolt da unidade consumidora (U5) — um detalhe relevante para quem for planejar as Bolts em Planejamento de Entrega, pois não é o padrão geral de "mudança aditiva entra no pull request da unidade dona" descrito na seção "Regras de Propriedade dos Contratos" duas seções abaixo. | Adicionar uma frase explícita nas Regras de Propriedade dos Contratos (ou nos dois contratos de extensão) esclarecendo que uma extensão aditiva por composição (SVC-07, SVC-08) é implementada pela unidade consumidora dentro do diretório da unidade provedora, distinguindo esse caso do caso geral em que a própria unidade dona implementa a mudança aditiva. | New |

### Validation Tool Results

| Tool | Result | Interpretation |
|---|---|---|
| `aidlc-sensor-required-sections.ts --stage contract-design` | PASS — `h2_count: 14`, `findings_count: 0` | Todas as seções esperadas do artefato (Tabela de Contratos, cada bloco de contrato, Regras de Propriedade, Implicações de Segurança, Decisões e Alternativas, Open questions, Assumptions & Open Questions) estão presentes. |
| Parsing YAML de todo bloco ```` ```yaml ```` | PASS — 8 de 8 blocos (X-01, API-U1, API-U2, API-U3, API-U4, API-U5, extensão SVC-08, shared-schema DB-01) analisados com `js-yaml`, sem erro de sintaxe. | Nenhum bloco de especificação está malformado. |
| Cobertura das 8 arestas do grafo (`unit-of-work-dependency.md`) | PASS (verificação manual) | As 8 arestas (U2→U1, U3→U1, U3→U2, U4→U1, U4→U2, U5→U1, U5→U2, U5→U4) têm cada uma uma linha SVC-0X correspondente na Tabela de Contratos, com a mesma direção provedor→consumidor. |
| Direção das chaves estrangeiras cross-unit em DB-01 | PASS (verificação manual contra `components.md` e o grafo de dependências) | Todas as 13 chaves estrangeiras cross-unit apontam de uma unidade dependente para uma de suas dependências (nunca o inverso), e cada referência corresponde a uma relação de entidade já declarada em `components.md` (Ticket, TicketHistoryEntry, TicketSectorPassage, Message, Notification) ou introduzida de forma rastreável para a entidade nova de U5 (Rating, FR12.1). |
| Cruzamento de códigos de erro/status com critérios de aceitação citados | PASS (verificação manual contra `stories.md`) | `TICKET_CLOSED` (403, AC2.4.6), `TICKET_QUEUE_NO_SECTOR` (403, AC2.1.4), `TICKET_REOPEN_WINDOW_EXPIRED` (409, AC1.6.2), `TICKET_ALREADY_ASSIGNED` (409, AC2.2.2), `TICKET_INVALID_TRANSITION` (409, AC2.3.5), `MESSAGE_TICKET_CLOSED` (409, AC1.4.2/AC2.2.5), a regra do 404 indistinguível (AC5.2.2) e `RATING_TICKET_NOT_CLOSED` (409, AC6.3.1) correspondem ao texto das respectivas histórias; a reabertura fica restrita a `[STUDENT, PROFESSOR]` mais a regra de ator "apenas o solicitante", e a atribuição (`assign`) fica restrita a `[MANAGER]`, como pedido no enunciado da revisão. |

### Summary

O artefato é consistente com o grafo de dependências, com a forma das entidades de `components.md` e com os critérios de aceitação que cita, e já demonstra um nível incomum de autocrítica (seções de Open questions e Assumptions cobrindo boa parte das lacunas reais, incluindo o próprio ponto de R-01). O único risco que considero Major é a decisão de atomicidade entre serviços de U2/U3 (R-01): é tecnicamente delicada — expor um cliente Prisma transacional pela fronteira de serviço quebraria a própria regra do documento — e afeta o desenho funcional de duas unidades, não de uma só, por isso vale a pena resolvê-la formalmente antes de a Construção começar, mesmo sem bloquear a aprovação desta etapa.
