# Instruções de Build — Sistema de Chamados Acadêmicos

Derivado dos cinco `code-generation-plan.md` e seus `unit-test-instructions.md` e `code-summary.md` (em `../u*/code-generation/`), de `compose.yaml`, `.env.example`, `.nvmrc` e dos scripts de `package.json` da raiz e dos dois pacotes.

O repositório é único, com `apps/api` (NestJS) e `apps/web` (React + Vite) em npm workspaces. Todos os comandos abaixo rodam **a partir da raiz** do repositório, salvo onde indicado.

## Pré-requisitos

| Item | Versão / condição | Como verificar |
|------|-------------------|----------------|
| Node.js | 24 (fixado em `.nvmrc`) | `node -v` |
| npm | O que acompanha o Node 24 | `npm -v` |
| Docker Engine + Compose | Daemon ativo | `docker compose version` |
| Portas livres em `127.0.0.1` | 8080 (web), 3000 (api), 55432 (Postgres de teste) | `docker compose ps` |

O Docker é obrigatório para os testes de integração e para subir o sistema: não há caminho alternativo com banco em memória, por decisão afirmada em `team.md` (Postgres real, sem mock do Prisma nos caminhos de negócio).

## Instalação de Dependências

```bash
npm ci
```

`npm ci` instala a partir do `package-lock.json`, para os dois workspaces de uma vez. Use `npm install` apenas quando a intenção for mudar o lockfile.

O script `prepare` instala o hook de pre-push (`scripts/install-git-hooks.mjs`), que roda lint e a suíte rápida antes de qualquer `git push` — é o portão de fato deste projeto, já que `main` não tem proteção no servidor.

## Configuração de Ambiente

1. Copie o modelo e preencha os valores:

```bash
cp .env.example .env
```

2. Variáveis obrigatórias, sem as quais a API **falha na inicialização** (comportamento intencional, não defeito):

| Variável | Observação |
|----------|------------|
| `POSTGRES_USER`, `POSTGRES_DB`, `POSTGRES_PASSWORD` | A senha entra na URL de conexão: use apenas letras e algarismos |
| `DATABASE_URL` | Usada quando a API roda fora do Docker; dentro do Compose a URL é montada das variáveis `POSTGRES_*` |
| `POSTGRES_TEST_*`, `DATABASE_URL_TEST` | Banco de teste; a porta é publicada **somente** em `127.0.0.1` |
| `JWT_SECRET` | Mínimo de 32 caracteres. Gere com `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"` |
| `APP_ORIGIN` | Origem em que o navegador abre o sistema; requisição de alteração vinda de outra origem é recusada |
| `COOKIE_SECURE` | `true` somente sob HTTPS |
| `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD` | Administrador criado na subida apenas se não existir nenhum ativo. Senha de 8 a 128 caracteres, com ao menos uma letra e um algarismo |

O `.env` nunca é versionado. Nenhum segredo vai para o repositório, que é público.

## Comandos de Build

```bash
npm run build -w apps/api
npm run build -w apps/web
```

- **API**: `prisma generate && tsc -p tsconfig.build.json`. O `prisma generate` escreve o cliente em `apps/api/src/generated/prisma/`, que é **ignorado pelo Git** e precisa ser regerado em cada máquina e após qualquer mudança no `schema.prisma`.
- **Web**: `tsc --noEmit -p tsconfig.json && vite build`. A verificação de tipos acontece antes do empacotamento, então erro de tipo falha o build.

## Verificação do Build

```bash
npm run lint
npm run typecheck
npm run format:check
npm run openapi:check -w apps/api
npm audit --omit=dev --audit-level=high
```

| Verificação | Critério de aprovação |
|-------------|----------------------|
| `lint` | ESLint sem erro em todo o repositório |
| `typecheck` | `tsc --noEmit` com `strict: true` nos dois pacotes |
| `format:check` | "All matched files use Prettier code style!" |
| `openapi:check` | "openapi.json is up to date." — o contrato versionado precisa corresponder ao código |
| `npm audit` | Nenhuma vulnerabilidade de severidade alta em dependência de produção |

Os cinco são bloqueantes no pipeline de CI, conforme `team.md` § Deployment.

## Build e Execução em Contêiner

```bash
docker compose build api web
docker compose up -d
```

- Os dois `Dockerfile` têm contexto de build na raiz, como exige `project.md`.
- A API aplica as migrações na subida (`prisma migrate deploy` antes de iniciar), então não há passo manual de migração.
- O web é publicado em `127.0.0.1:8080`; a API responde em `127.0.0.1:3000`. A porta do Postgres principal **não** é publicada no host.
- Health checks: a API responde `401` em `/api/v1/auth/me` sem sessão (sinal de que subiu e a autenticação está ativa); o web responde na raiz.

## Banco de Teste

```bash
docker compose --profile test up -d postgres-test
```

Sobe o serviço `postgres-test` (perfil `test`, `postgres:18-alpine`), publicado em `127.0.0.1:${POSTGRES_TEST_PORT:-55432}`. O serviço usa `tmpfs`, então o banco sobe vazio e a suíte de integração aplica as migrações.

## Problemas Comuns

| Sintoma | Causa e correção |
|---------|------------------|
| A API encerra na inicialização com erro de configuração | Falta variável obrigatória no `.env`. A falha é proposital: corrija o `.env`, não o código |
| `JWT_SECRET` recusado | Menos de 32 caracteres |
| Erro de tipo apontando para o cliente Prisma | Rode `npm run prisma:generate -w apps/api`; o cliente é ignorado pelo Git e não vem no clone |
| Teste de integração falha em conectar | O `postgres-test` não está de pé, ou a porta 55432 está ocupada; `docker compose --profile test ps` |
| `openapi:check` reprova | O código mudou e o `openapi.json` não foi regerado: `npm run openapi:generate -w apps/api` |
| Requisição de alteração recusada no navegador | `APP_ORIGIN` diferente da origem em que a tela está aberta |
| `npm ls` acusa `invalid` | Esperado: há `overrides` na raiz corrigindo avisos de segurança de dependência transitiva, conforme regra afirmada em `project.md` |

## Fora destas Instruções

- Publicação de imagem em registry e entrega contínua: fora do escopo por decisão afirmada (`project.md` § Forbidden).
- Ambiente de homologação ou produção: não existe neste projeto; o único ambiente de execução é local.
- `gitleaks` e CodeQL: rodam no pipeline de CI, etapa seguinte, não no build local.
