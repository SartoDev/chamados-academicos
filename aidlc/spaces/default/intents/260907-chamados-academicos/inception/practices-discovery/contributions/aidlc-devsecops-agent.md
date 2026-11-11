**Collaborator:** aidlc-devsecops-agent

## Contribution

O rascunho do líder está correto no que cobre, mas não tem nenhuma linha sobre segurança — e como as etapas de NFR Requirements e NFR Design foram cortadas deste fluxo, **não existe etapa posterior dedicada a isso**. O que não for afirmado como prática aqui, ou registrado como regra de negócio em Functional Design, simplesmente será improvisado durante Code Generation. Esta contribuição fecha essa lacuna e diz explicitamente onde cada item deve morar.

Princípio de calibragem usado em tudo abaixo: **um controle que não vai ser executado é pior que nenhum controle**, porque fabrica falsa garantia. Ferramenta que exige conta, token ou tuning de regras foi rejeitada; ferramenta que roda com um comando e sem cadastro foi mantida.

---

### 1. Varredura no CI — o que ganha o lugar e o que é teatro

O CI faz build, lint e testes. Estes acréscimos cabem nesse orçamento:

**Bloqueiam o merge (falha = PR vermelho):**

| Verificação | Comando / ferramenta | Por que ganha o lugar |
|---|---|---|
| Type check | `tsc --noEmit` com `strict: true` nos dois pacotes | Maior retorno por esforço numa base TypeScript; elimina classes inteiras de bug antes de qualquer scanner |
| Lint | ESLint + Prettier (já no rascunho) + `eslint-plugin-security` no backend | O plugin custa uma linha de config e pega `eval`, regex catastrófica, `child_process` com string montada |
| Segredo commitado | `gitleaks` (binário único, sem conta, sem token; roda via Docker ou GitHub Action oficial) | Único achado **irreversível** do conjunto: segredo em histórico Git continua lá depois do `git rm`. É o controle de maior valor absoluto |
| Dependência vulnerável (produção) | `npm audit --omit=dev --audit-level=high` | Nativo do npm, sem conta, sem serviço externo. Restrito a produção e a severidade alta porque a árvore de `devDependencies` (Vite, ESLint, ferramentas de teste) gera avisos sem correção disponível que só ensinam a ignorar o gate |

**Apenas relatam (não bloqueiam):**

- `npm audit` completo (incluindo `devDependencies`) impresso no log — informação, nunca gate.
- **CodeQL default setup** do GitHub Actions, *se e somente se* o repositório for público (gratuito, configuração de dois cliques, zero manutenção, resultados na aba Security). Em repositório privado no plano gratuito não está disponível — nesse caso, simplesmente não existe SAST neste projeto, e isso é aceitável.
- `hadolint` no Dockerfile — lint barato, achado informativo.

**Teatro neste projeto — recomendo recusar explicitamente:**

- **DAST / OWASP ZAP**: exigiria subir a stack Compose inteira dentro do CI só para varrer uma aplicação que nunca fica exposta. Custo alto, achado nenhum.
- **SonarQube self-hosted**: um contêiner a mais para manter, com fila de issues que ninguém vai fechar em 10–20h/semana.
- **Semgrep com regras próprias**: só rende depois de tuning; sem tuning é ruído.
- **Snyk / qualquer scanner com conta**: introduz um token — ou seja, cria exatamente o tipo de segredo que o item 4 tenta evitar — em troca do que `npm audit` já dá.
- **Checkov / cfn-nag / tfsec**: não existe IaC de nuvem aqui, só `docker-compose.yml`. Nada para varrer.
- **Trivy como gate de imagem**: as imagens nunca são publicadas em registry (proibição já registrada em `discovered-rules.md`). Em vez do scanner, a prática equivalente e gratuita é **fixar as imagens base em uma tag LTS atual e explícita** (`node:22-alpine`, `postgres:17-alpine`), nunca `latest`.
- **Pentest / revisão de segurança externa**: sem operação real e sem exposição pública, não há superfície a testar.
- **Dependabot/Renovate semanal**: se ligado, colocar em cadência **mensal** e sem auto-merge; PR de dependência semanal em projeto solo vira ruído que se aprende a fechar sem ler.

Vale registrar honestamente: **a proibição de AWS não é obstáculo aqui**. Todas as ferramentas acima são locais ou nativas do GitHub Actions; nenhuma pede credencial de nuvem.

---

### 2. Cookie e JWT — fixar como prática AGORA, não improvisar em Code Generation

Isto é configuração, não design; se não for decidido aqui vira uma sequência de tentativas durante a implementação. Proposta de prática afirmada:

**Cookie de sessão**
- `httpOnly: true` — sempre. O frontend nunca lê o token via JavaScript.
- `sameSite: 'lax'` — suficiente porque `localhost:5173` e `localhost:3000` são o **mesmo site** para efeito de cookie (a porta não entra no cálculo de SameSite); o cookie viaja normalmente entre os dois.
- `secure` controlado por ambiente (`NODE_ENV === 'production'`), para o código já nascer com a forma correta sem quebrar o HTTP local.
- `path: '/'`, **sem** atributo `domain`.
- CORS no NestJS com `origin` em lista explícita (a origem do Vite) e `credentials: true` — nunca `origin: '*'`, que aliás é incompatível com cookie de credencial.

**JWT**
- Algoritmo `HS256` com segredo de no mínimo 32 bytes aleatórios vindo de variável de ambiente. **Nunca** `process.env.JWT_SECRET || 'dev-secret'` — esse fallback é literalmente um segredo hardcoded e já viola o guardrail de Construction.
- Claims mínimas: `sub` (id do usuário), `role` (perfil), `iat`, `exp`. Nada de CPF, matrícula ou dado pessoal extra — o payload de um JWT é **legível por qualquer um**, só não é falsificável.
- Verificação de assinatura no backend em toda requisição. O perfil decodificado no frontend serve **apenas para esconder elementos de interface**; jamais como decisão de autorização.

**Expiração e renovação — decisão do humano, com o trade-off explícito** (ver item 6). Duas opções honestas:
- **(A) Token único, validade de 8h, sem refresh.** Menos código, menos modos de falha, e o logout limpa o cookie. Custo: um token roubado vale até expirar, e o logout não invalida de fato no servidor.
- **(B) Access token de 15min + refresh token em cookie separado com rotação.** Mais correto do ponto de vista de segurança, e é um capítulo mais interessante para o TCC — mas é significativamente mais código (rotação, detecção de reuso, armazenamento do refresh).

Recomendação técnica para o contexto: **(A)**, com a limitação documentada por escrito no TCC. É a escolha defensável para um sistema local sem operação real; fingir (B) e implementar mal é pior que (A) bem-feito e assumido.

**Postura de CSRF** — real, porque a autenticação é por cookie. Postura proporcional recomendada, sem biblioteca de token CSRF:
1. `SameSite=Lax` no cookie;
2. CORS com lista de origens explícita;
3. **NUNCA usar GET para operação que muda estado** — esta é a regra que precisa ser afirmada agora, porque é a única que, se violada durante Code Generation, torna as outras duas inúteis;
4. Todo endpoint de escrita usa `POST`/`PATCH`/`DELETE` com `Content-Type: application/json`, o que dispara preflight e derruba o ataque por formulário cross-site simples.

**Hash de senha**: `bcrypt` com cost 12 (ou `argon2id`). Fixar agora — é exatamente o tipo de escolha que, improvisada, sai como SHA-256 sem salt.

---

### 3. Verificação do modelo de cinco perfis — sem etapa de NFR, o mecanismo é este

Autorização é a preocupação de segurança de maior valor deste sistema, e ficou órfã com o corte das etapas de NFR. Divisão proposta:

**Vai para Functional Design, como regra de negócio (não como item de segurança):**
- Uma **matriz de acesso** explícita: recurso × operação × perfil (`aluno`, `professor`, `atendente`, `gestor`, `administrador`), com cada célula marcada como permitida ou negada. Isso é regra de negócio legítima — quem pode mudar status de chamado, quem vê a fila de qual setor, quem administra catálogos.
- As **regras de escopo por propriedade**: `aluno`/`professor` enxergam apenas os próprios chamados; `atendente` enxerga a fila do seu setor; e assim por diante.
- A visibilidade das **mensagens do chamado** — a unidade de comunicação já foi separada em `project.md` justamente por ter regras de acesso próprias. Se existir nota interna entre atendentes, isso é uma regra de visibilidade e precisa estar nessa matriz, não descoberta na hora de codificar.

**Vira prática afirmada aqui (aplica-se a todo endpoint, independente da matriz):**
- **Deny-by-default**: guard global no NestJS via `APP_GUARD`; uma rota sem decorator explícito de perfil ou `@Public()` é **negada**, nunca liberada. Rota nova esquecida falha fechada.
- **Filtro na consulta, não checagem após a busca**: toda consulta de recurso com dono aplica o filtro do ator dentro do `where` do Prisma. Nunca buscar por id e depois comparar o dono — esse padrão vaza a existência do registro e é a origem clássica de IDOR.
- **Checagem no backend em toda requisição**; o frontend apenas esconde interface.

**Como isso é verificado (a regra de teste que substitui a etapa de NFR):**
- Para cada endpoint não público, **pelo menos um teste negativo** afirmando `403` para um perfil que não deve acessá-lo.
- Para cada recurso com dono, **pelo menos um teste** afirmando que um usuário do mesmo perfil não lê o registro de outro usuário (teste de IDOR).
- Esses testes são **de API** (Supertest, o `e2e` nativo do NestJS), não de navegador. Respondendo diretamente à pergunta aberta [Q] sobre E2E no rascunho do líder: **Playwright não é o instrumento certo aqui** — para verificar autorização, teste de API é mais barato, mais preciso e mais estável. Se o humano quiser E2E de navegador, que seja um único smoke de login e abertura de chamado, e por valor de demonstração no TCC, não por cobertura de autorização.
- Sugestão de método: a lista de testes negativos é **derivada da matriz** de Functional Design — cada célula negada vira (ou amostra) um caso de teste. Isso dá rastreabilidade de requisito a teste sem inventar processo novo.

Isso também é uma resposta melhor à pergunta de cobertura do rascunho: 80% de linha é um proxy fraco. Um piso mais honesto para este sistema é **cobertura completa das decisões de autorização** (toda célula negada da matriz coberta), mais o piso global que o humano escolher.

---

### 4. Segredos com Docker Compose e `.env`

**Entra no Git:**
- `.env.example` com **todas** as chaves e valores fictícios ou vazios, comentando o que cada uma faz e como gerar (`openssl rand -base64 48`).
- `docker-compose.yml` referenciando `${VAR}` — nenhum valor literal de segredo no arquivo.
- As migrations do Prisma (ver item 5).

**Nunca entra no Git:**
- `.env` e `.env.local`, `*.pem`, `node_modules`, `dist`, `coverage`.

**Ordem importa — isto é a parte que precisa ser prática, não intenção:** o `.gitignore` tem que existir **no commit inicial**, antes de qualquer `.env` ser criado. `.gitignore` adicionado depois não remove nada do histórico. Recomendo que o Bolt de fundação comece por `.gitignore` + `.dockerignore` + `.env.example`, nessa ordem, antes de qualquer código.

**Demais regras:**
- `.dockerignore` incluindo `.env`, `.git`, `node_modules` — para o segredo não entrar na imagem por acidente via `COPY . .`.
- **Nenhum `ENV JWT_SECRET=...` no Dockerfile** e nenhum `COPY .env`.
- A aplicação **falha na inicialização** se faltar variável obrigatória: `ConfigModule` do NestJS com schema de validação (Joi ou zod). Sem default silencioso, sem fallback.
- Senha do Postgres local: string aleatória gerada, **não** `postgres/postgres`. O risco real é baixo (é local), mas o hábito é o que se leva para o próximo projeto — e o repositório vai ser lido pela banca.
- Se um segredo vazar para um commit: a correção é **rotacionar o segredo**, não reescrever o histórico. Reescrever sem rotacionar não corrige nada.

---

### 5. Prisma e Postgres na rede local do Compose

- **Não publicar a porta 5432 no host por padrão.** Os serviços conversam pela rede do Compose usando o hostname do serviço (`db:5432`); `ports:` no Compose publica no host e, em várias configurações, o Docker escreve regras de iptables que passam por cima do firewall do host — o banco fica acessível na rede local sem que ninguém tenha pedido isso.
- Se for preciso ferramenta gráfica (DBeaver, Prisma Studio, pgAdmin), publicar **ligado ao loopback**: `127.0.0.1:5432:5432`. Prática geral: **toda porta publicada neste projeto é ligada a `127.0.0.1`**, inclusive a API e o frontend.
- `DATABASE_URL` tem dois valores legítimos e confundi-los custa horas: `db` como host de dentro dos contêineres, `127.0.0.1` para ferramenta rodando no host. Documentar ambos no `.env.example`.
- **Migrations desde o primeiro dia** (`prisma migrate dev`), commitadas. Nunca `prisma db push --accept-data-loss` fora de descarte. Isso também é ganho de reprodutibilidade para o TCC — o esquema tem histórico auditável.
- **Nunca `$queryRawUnsafe` / `$executeRawUnsafe`.** SQL cru só via template tag parametrizado `$queryRaw`, e apenas quando o query builder realmente não resolver. Vale dizer com franqueza: como o Prisma parametriza por padrão, injeção de SQL é um risco pequeno neste projeto — o que é mais um motivo para não gastar orçamento em SAST de injeção e sim nesta regra de uma linha.
- Log de query do Prisma (`log: ['query']`) apenas em desenvolvimento; nunca com dados em log persistido.
- Contêiner da aplicação rodando como usuário não-root (`USER node` no Dockerfile) — uma linha, e é conteúdo de um parágrafo do TCC.

**Proteção de dados, na dose honesta.** Sem operação por instituição real, não há obrigação regulatória de LGPD. O que ainda **ganha o lugar**, porque o sistema modela dado pessoal de forma realista: (a) dados de seed **sintéticos**, jamais nomes e e-mails de pessoas reais; (b) hash de senha (item 2); (c) claims mínimas no JWT (item 2); (d) **nenhum dado pessoal em log** — não logar corpo de requisição de autenticação nem conteúdo de mensagem de chamado, e mascarar e-mail quando precisar aparecer; (e) uma seção curta no TCC dizendo quais princípios (minimização, finalidade) o desenho respeita e quais estão fora de escopo por não haver operação real. O que é **teatro** e deve ser recusado: DPO, RIPD/DPIA, tela de gestão de consentimento, fluxo de requisição de titular, automação de retenção.

---

### 6. O que o HUMANO decide, não eu

1. **Validade de token e estratégia de refresh** — opção (A) 8h sem refresh, ou (B) 15min com refresh rotativo (item 2). Depende de quanto do orçamento de horas vale gastar aqui e do que a banca espera ver.
2. **Se o logout precisa invalidar de fato no servidor** — se sim, (A) deixa de ser suficiente e entra tabela de sessão, o que muda o desenho.
3. **Repositório público ou privado no GitHub** — decide se CodeQL e o secret scanning nativo existem de graça, e muda completamente o custo de um `.env` vazado.
4. **Se o audit de dependências bloqueia ou só relata** — bloquear é mais rigoroso e às vezes trava o merge por vulnerabilidade transitiva sem correção disponível.
5. **Se entram hooks de pre-commit** (husky + `gitleaks protect --staged`) — tolerância a atrito é pessoal, e hook lento acaba contornado com `--no-verify`, o que é pior que não ter.
6. **Se a defesa/monografia exige um capítulo de segurança ou LGPD** — se exigir, o trabalho é de escrita, não de ferramenta, e essa distinção precisa estar clara no planejamento de horas.
7. **Se dados de demonstração podem conter nomes de pessoas reais** (colegas em capturas de tela) — recomendo sintético, mas a chamada é do humano.

---

### Resumo de onde cada coisa mora

- **Afirmar como prática agora (`team.md`)**: conjunto de checks bloqueantes do CI; flags de cookie e configuração do JWT; regra "nunca GET que muda estado"; algoritmo de hash de senha; guard global deny-by-default; regra de teste negativo de autorização; `.gitignore`/`.dockerignore`/`.env.example` no commit inicial; portas publicadas ligadas a `127.0.0.1`; migrations desde o início; proibição de `$queryRawUnsafe`; nenhum dado pessoal em log; seed sintético.
- **Levar para Functional Design como regra de negócio**: matriz perfil × recurso × operação; regras de escopo por propriedade; visibilidade das mensagens do chamado; quem pode transicionar status.
- **Deixar para as etapas de CI Pipeline / Code Generation**: os arquivos de configuração propriamente ditos (workflow do Actions, `.eslintrc`, `docker-compose.yml`) — implementação do que foi decidido acima, não decisão nova.

## Positions

- AGREE: Substituir o modelo staging/produção de `org.md` por "merge em `main` = pronto para rodar localmente" — não há ambiente a proteger, e inventar um gate de produção inexistente seria cerimônia vazia.
- AGREE: Manter o piso de cobertura de 80% como pergunta em aberto em vez de afirmá-lo — cobertura de linha é proxy fraco, e afirmá-la por inércia criaria um número que ninguém defende.
- AGREE: Registrar a ausência de revisão de par como assumption em vez de inventar processo — honesto e verificável.
- AGREE: Lint bloqueando o merge do Bolt — é a base sobre a qual os demais checks bloqueantes se apoiam sem custo adicional de infraestrutura.
- OBJECT: O rascunho não tem nenhuma seção de segurança — com NFR Requirements e NFR Design cortados, isto não é omissão de estilo: é a única oportunidade do fluxo de fixar postura de autenticação, autorização e segredos antes de Code Generation.
- OBJECT: `## Deployment` diz que CI roda "build, lint e testes" sem dizer o que bloqueia — o conjunto bloqueante precisa ser explícito (`tsc --noEmit`, ESLint, testes, `gitleaks`, `npm audit --omit=dev --audit-level=high`) e os demais declarados como apenas informativos.
- OBJECT: O rascunho afirma que "os agentes de qualidade/devsecops do fluxo" cumprem o papel de segundo olhar antes do merge — agentes não executam o CI; o único segundo olhar que sempre roda é o gate automatizado, o que torna a lista de checks bloqueantes uma decisão de primeira ordem, não um detalhe de configuração.
- OBJECT: A pergunta [Q] sobre E2E está mal enquadrada como decisão de volume de testes — a questão real é como verificar os cinco perfis de acesso, e a resposta correta é teste de API com Supertest derivado de uma matriz de acesso, não Playwright.
- OBJECT: Falta uma prática sobre `.gitignore`/`.dockerignore` no commit inicial — em projeto greenfield essa ordem é a diferença entre um segredo que nunca existe no histórico e um que exige rotação para ser corrigido.
- OBJECT: `## Code Style` cita ESLint sem mencionar `tsc --noEmit` com `strict: true` no CI — numa base TypeScript é a verificação de maior retorno por esforço e não é coberta pelo lint.
