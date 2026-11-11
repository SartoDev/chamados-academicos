# Sistema de Chamados Acadêmicos

Sistema web para registrar e acompanhar solicitações acadêmicas (chamados), desenvolvido como Trabalho de Conclusão de Curso. Esta versão entrega:

- **Fundação (U1)**: autenticação e sessão, gestão de usuários, catálogos de classificação (setores, categorias, status e prioridades), a casca de navegação e a área administrativa.
- **Chamados (U2)**: abertura, acompanhamento e atendimento dos chamados — fila do setor, atribuição, transferência entre setores, prioridade, encerramento, reabertura em até 72 horas, histórico de alterações, passagens por setor e notificações dentro do sistema.
- **Conversa (U3)**: a troca de mensagens entre o solicitante e o atendimento, dentro do próprio chamado.
- **Indicadores (U4)**: o painel do Gestor e do Administrador — quantidades por status, categoria e setor, tempos médios de resolução e de atendimento e uma consulta filtrada em tela, sempre recortados por período.

O sistema roda **somente em ambiente local**, com Docker e Docker Compose.

## Estrutura do repositório

| Caminho                 | Conteúdo                                                                |
| ----------------------- | ----------------------------------------------------------------------- |
| `apps/api`              | API em NestJS, TypeScript, Prisma e PostgreSQL                          |
| `apps/web`              | Frontend em React, TypeScript, Vite, Tailwind e Shadcn                  |
| `apps/api/openapi.json` | Documento OpenAPI gerado a partir do código                             |
| `compose.yaml`          | Banco, API e web para uso local, mais o banco de testes (perfil `test`) |
| `.githooks/pre-push`    | Portão local: lint e testes rápidos antes de qualquer `git push`        |
| `docs/u1-foundation/`   | Roteiro de inspeção manual e rastreabilidade requisito → teste da U1    |
| `docs/u2-tickets/`      | Roteiro de inspeção manual e rastreabilidade requisito → teste da U2    |
| `docs/u3-conversation/` | Roteiro de inspeção manual e rastreabilidade requisito → teste da U3    |
| `docs/u4-reporting/`    | Roteiro de inspeção manual e rastreabilidade requisito → teste da U4    |

## Pré-requisitos

- Node.js 24 ou superior e npm 11 (há um `.nvmrc` na raiz)
- Docker com Docker Compose v2
- Git

## Configuração

1. Copie o arquivo de exemplo e preencha os valores:

   ```bash
   cp .env.example .env
   ```

2. Gere um segredo para `JWT_SECRET` (mínimo de 32 caracteres):

   ```bash
   node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
   ```

3. Defina `POSTGRES_PASSWORD` usando apenas letras e algarismos: a senha entra na URL de conexão da API.
4. Defina `INITIAL_ADMIN_EMAIL` e `INITIAL_ADMIN_PASSWORD` (de 8 a 128 caracteres, com ao menos uma letra e um algarismo). Esse administrador é criado na primeira subida, apenas se ainda não existir nenhum administrador ativo. Troque a senha pela interface depois de entrar.

O `.env` nunca é versionado. Se faltar alguma variável obrigatória, ou se ela for inválida, a API não sobe e o log nomeia a variável, sem exibir o valor.

### Variáveis de ambiente

| Variável                                                                                 | Uso                                                                                                          |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`                                      | Banco principal do Docker Compose                                                                            |
| `DATABASE_URL`                                                                           | Conexão da API quando ela roda fora do Docker (no Compose, a URL é montada automaticamente)                  |
| `POSTGRES_TEST_USER`, `POSTGRES_TEST_PASSWORD`, `POSTGRES_TEST_DB`, `POSTGRES_TEST_PORT` | Banco de testes (perfil `test`), publicado só em `127.0.0.1`                                                 |
| `DATABASE_URL_TEST`                                                                      | Conexão usada pelos testes de integração                                                                     |
| `JWT_SECRET`                                                                             | Segredo de assinatura do token de sessão (mínimo de 32 caracteres)                                           |
| `APP_ORIGIN`                                                                             | Origem em que o navegador abre o sistema; requisições que alteram dados vindas de outra origem são recusadas |
| `COOKIE_SECURE`                                                                          | `true` apenas quando servido por HTTPS                                                                       |
| `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD`                                          | Administrador inicial                                                                                        |

## Subir o sistema

```bash
docker compose up --build
```

O comando constrói as imagens, sobe o PostgreSQL, aplica as migrações, executa a carga inicial (quatro status, três prioridades com Normal como padrão e o administrador inicial) e publica o frontend em **http://localhost:8080**.

- Abra o sistema por `http://localhost:8080`, e não por `127.0.0.1`: a origem precisa ser igual a `APP_ORIGIN`.
- O banco não tem porta publicada no host; só a API o acessa, pela rede interna do Compose.
- A porta do frontend é publicada apenas em `127.0.0.1`.

Para parar: `docker compose down`. Para apagar também os dados do banco: `docker compose down -v`.

## Desenvolvimento sem Docker (opcional)

```bash
npm install                                        # também instala o hook de pre-push
docker compose --profile test up -d postgres-test  # um PostgreSQL local em 127.0.0.1
```

Com `DATABASE_URL` apontando para um banco acessível e `APP_ORIGIN=http://localhost:5173` no `.env`:

```bash
npm run build -w apps/api
(cd apps/api && npx prisma migrate deploy && node --env-file=../../.env dist/main.js)
npm run dev -w apps/web                            # http://localhost:5173, com /api repassado à API
```

## Qualidade e testes

| Comando                    | O que faz                                                                       |
| -------------------------- | ------------------------------------------------------------------------------- |
| `npm run lint`             | ESLint nos dois pacotes                                                         |
| `npm run format:check`     | Verificação de formatação (Prettier)                                            |
| `npm run typecheck`        | `tsc --noEmit` com `strict: true` na API e na web                               |
| `npm run test:unit`        | Testes rápidos: unitários da API (Jest) e testes de componente da web (Vitest)  |
| `npm run test:integration` | Testes de integração da API contra PostgreSQL real (Supertest)                  |
| `npm run test:coverage`    | Execução com cobertura e limiares: API (unitário + integração combinados) e web |
| `npm run openapi:generate` | Regenera `apps/api/openapi.json` a partir dos decorators do NestJS              |

Os testes de integração precisam do banco de testes em execução e de `DATABASE_URL_TEST` no `.env`:

```bash
docker compose --profile test up -d postgres-test
```

### Comandos dos testes por unidade

Estes comandos rodam só os testes de uma unidade, para desenvolver. Eles **não medem cobertura**: os limiares valem para o código inteiro, e as unidades compartilham o mesmo código, então a cobertura é verificada no portão completo (`npm run test:coverage` e `npm run test:coverage -w apps/web`).

U1 — Fundação:

```bash
npx jest --config apps/api/jest.unit.config.ts apps/api/src/auth apps/api/src/users apps/api/src/catalog apps/api/src/common apps/api/src/config
npx jest --config apps/api/jest.integration.config.ts --runInBand apps/api/test/integration/u1-foundation
npx vitest run --config apps/web/vitest.config.ts apps/web/src/app apps/web/src/features/auth apps/web/src/features/admin
```

U2 — Chamados:

```bash
npx jest --config apps/api/jest.unit.config.ts apps/api/src/tickets apps/api/src/notifications
npx jest --config apps/api/jest.integration.config.ts --runInBand apps/api/test/integration/u2-tickets
npx vitest run --config apps/web/vitest.config.ts apps/web/src/features/tickets apps/web/src/features/notifications apps/web/src/app
```

A pasta `apps/web/src/app` entra nos testes da U2 porque a unidade altera a navegação, as rotas e a barra superior; os testes da U1 dessa pasta rodam junto.

U3 — Conversa:

```bash
npx jest --config apps/api/jest.unit.config.ts apps/api/src/conversation
npx jest --config apps/api/jest.integration.config.ts --runInBand apps/api/test/integration/u3-conversation
npx vitest run --config apps/web/vitest.config.ts apps/web/src/features/conversation apps/web/src/features/tickets
```

A pasta `apps/web/src/features/tickets` entra nos testes da U3 porque a unidade altera o detalhe do chamado para registrar a aba Conversa; os testes da U2 dessa pasta rodam junto.

U4 — Indicadores:

```bash
npx jest --config apps/api/jest.unit.config.ts apps/api/src/reporting
npx jest --config apps/api/jest.integration.config.ts --runInBand apps/api/test/integration/u4-reporting
npx vitest run --config apps/web/vitest.config.ts apps/web/src/features/reports apps/web/src/app
```

A pasta `apps/web/src/app` entra nos testes da U4 porque a unidade acrescenta um item de navegação e uma rota; os testes da U1 dessa pasta rodam junto. As agregações que a U4 implementa dentro do módulo da U2 são exercitadas pela suíte de integração da U4, porque é a U4 quem as consome.

U5 — Avaliação:

```bash
npx jest --config apps/api/jest.unit.config.ts apps/api/src/tickets/rules
npx jest --config apps/api/jest.integration.config.ts --runInBand apps/api/test/integration/u5-rating
npx vitest run --config apps/web/vitest.config.ts apps/web/src/features/rating apps/web/src/features/tickets apps/web/src/features/reports
```

As regras puras da U5 ficam em `apps/api/src/tickets/rules`, junto das regras da U2, então os unitários da U2 rodam junto — é proposital, porque a U5 acrescenta arquivos nessa pasta. No frontend, `features/tickets` e `features/reports` entram porque a U5 cria um ponto de extensão em cada uma: um espaço de conteúdo extra dentro da aba Detalhes do chamado e o cartão de avaliação na grade dos tempos médios do Painel. O resumo de avaliações, implementado no módulo de indicadores, é exercitado pela suíte de integração da U5, porque é a U5 quem o define.

A API é um pacote ES Module (NestJS 12), então o Jest roda em modo ESM. A opção `--experimental-vm-modules` vem de `node-options` no `.npmrc` da raiz, e por isso os comandos acima funcionam como estão.

### Limiares de cobertura

Nenhum limiar é reduzido para fazer uma execução passar.

| Limiar                                                                                                    | Onde é aplicado                                 |
| --------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 80% de linhas no código que não é andaime                                                                 | API (integração e execução combinada) e web     |
| 90% de ramos e 80% de linhas por arquivo em `src/**/guards/**`                                            | API (unitário, integração e execução combinada) |
| 90% de ramos e 80% de linhas por arquivo em `src/{tickets,notifications,conversation,reporting}/rules/**` | API (unitário, integração e execução combinada) |
| 80% de linhas por arquivo em `src/**/*.service.ts`                                                        | API (integração e execução combinada)           |

As regras de autorização, visibilidade e transição da U2, as regras de acesso à conversa da U3, as regras de período e de perfil da U4 e as regras de acesso e de conteúdo da avaliação da U5 vivem fora de `guards/`, em `rules/`, e por isso têm a sua própria chave de limiar. A U3, a U4 e a U5 apenas ampliaram o alcance dessa chave, sem alterar os valores.

Ficam fora da coleta o código de andaime: `main.ts`, módulos, DTOs, `prisma.service.ts`, o cliente gerado do Prisma, o script do OpenAPI e os componentes gerados do Shadcn (`components/ui`).

### Hook de pre-push

O `npm install` executa o script `prepare`, que configura `git config core.hooksPath .githooks`. Antes de cada `git push`, o hook roda `npm run lint` e `npm run test:unit`. Não há proteção de branch no servidor: o hook local é o portão de fato.

## Telas de chamados por perfil (U2)

Cada perfil entra direto na sua tela de trabalho; não há uma tela inicial comum.

| Perfil           | Entra em          | O que faz nas telas de chamados                                                                                                                                       |
| ---------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Aluno, Professor | **Meus Chamados** | Abre chamado (categoria, título, descrição e prioridade), acompanha os próprios chamados com filtros e ordenação, encerra e reabre em até 72 horas do encerramento    |
| Atendente        | **Fila do Setor** | Trabalha os recortes "não atribuídos", "meus", "todos" e "passaram pelo setor"; assume, marca aguardando solicitante, altera prioridade, transfere de setor e encerra |
| Gestor           | **Fila do Setor** | Tudo o que o Atendente faz no setor, mais atribuir e reatribuir o chamado a alguém do setor                                                                           |
| Administrador    | **Administração** | Lê todos os chamados em "Chamados", sem executar ações de atendimento                                                                                                 |

Em todos os perfis, o sino da barra superior mostra a contagem de notificações não lidas, abre o painel com as mais recentes e leva à lista completa em "Ver todas". A notificação é gravada no momento do evento, nunca para quem o causou, e existe só dentro do sistema — não há e-mail.

O detalhe do chamado reúne, em abas, os **Detalhes** (descrição e metadados) e o **Histórico** (cada mudança de status, responsável, setor ou prioridade, com autor e momento, mais as passagens por setor com entrada, saída e justificativa da transferência). Encerrar, marcar como aguardando o solicitante e reabrir pedem confirmação antes de serem enviados.

## Aba Conversa do chamado (U3)

Ao lado de Detalhes e Histórico, o detalhe do chamado tem a aba **Conversa**, onde o solicitante e o atendimento trocam mensagens dentro do próprio chamado. A conversa é separada do histórico: mudanças de status, responsável, setor e prioridade continuam no Histórico.

| Perfil                                   | Na aba Conversa                                                  |
| ---------------------------------------- | ---------------------------------------------------------------- |
| Solicitante do chamado                   | Lê e envia mensagens                                             |
| Atendente responsável                    | Lê e envia mensagens                                             |
| Atendente do setor que não assumiu       | Lê; o campo de envio não aparece                                 |
| Gestor do setor atual                    | Lê e envia mensagens, sem precisar assumir o chamado             |
| Atendente ou Gestor de setor de passagem | Lê; o campo de envio não aparece                                 |
| Administrador                            | A aba não é oferecida: a conversa pode tratar de assunto pessoal |

Como a aba se comporta:

- abre nas 50 mensagens mais recentes e exibe tudo em ordem cronológica; **Carregar mensagens anteriores**, no topo, busca a página seguinte;
- não se atualiza sozinha — recarrega ao abrir a aba, depois de cada envio e pelo botão **Atualizar**; mensagens novas são anunciadas para quem usa leitor de tela;
- a mensagem tem de 1 a 2000 caracteres, é texto puro com as quebras de linha preservadas, e nunca pode ser editada nem apagada;
- uma mensagem do solicitante num chamado em _Aguardando solicitante_ devolve o chamado a _Em análise_, e cada mensagem gera um aviso de mensagem recebida para a outra parte — nunca para quem escreveu;
- chamado encerrado continua legível, mas o campo de envio fica desabilitado com o aviso "Este chamado está encerrado."; reaberto, o envio volta a ser aceito.

## Painel de indicadores (U4)

O item **Painel** do menu lateral aparece para o Gestor e para o Administrador e reúne duas abas. O período escolhido vale para as duas, começa nos últimos 30 dias e viaja no endereço, então recarregar a página ou compartilhar o link cai no mesmo recorte. O dia de fim entra inteiro no período.

| Perfil                       | No Painel                                                                                                      |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Gestor                       | Abas **Indicadores** e **Consulta**, restritas ao que ele vê: o setor atual e os chamados que passaram por ele |
| Administrador                | Apenas a aba **Indicadores**, com todos os chamados e o gráfico por setor                                      |
| Aluno, Professor e Atendente | O item não aparece no menu, e as rotas respondem 403                                                           |

Na aba **Indicadores**:

- um cartão por status (Aberto, Em análise, Aguardando solicitante e Encerrado), com zero nos status sem chamado no período;
- dois cartões de tempo médio — **resolução**, da abertura até o encerramento mais recente, e **atendimento**, da abertura até o primeiro responsável —, cada um com a sua própria base de cálculo ao lado e sem nenhuma meta ou limiar; um chamado encerrado sem nunca ter tido responsável entra só na média de resolução;
- dois gráficos de barras horizontais, por categoria para os dois perfis e por setor só para o Administrador, cada um com uma tabela equivalente para leitor de tela;
- as quantidades contam os chamados **abertos** no período, enquanto os tempos médios consideram os **encerrados** no período — a tela diz isso em texto, ao lado dos cartões;
- período sem nenhum chamado mostra "Nenhum chamado no período selecionado." em vez de uma fila de zeros.

Na aba **Consulta**, só do Gestor, a listagem combina filtros de status, categoria e setor com o período, pagina como as demais listas e preserva os filtros ao mudar de página. O Administrador continua lendo tudo pela listagem geral em "Chamados".

Não existe exportação em nenhum estado do Painel: nem botão de baixar, nem rota de download, nem arquivo gerado.

## Avaliação do atendimento (U5)

Depois que o chamado é encerrado, o solicitante pode avaliar o atendimento. A avaliação vive **dentro da aba Detalhes** do chamado — não há tela nem aba própria — e é opcional: o encerramento acontece do mesmo jeito sem ela, e nenhuma listagem marca o chamado não avaliado.

| Perfil                                   | Na avaliação                                                                          |
| ---------------------------------------- | ------------------------------------------------------------------------------------- |
| Solicitante do chamado                   | Avalia o próprio chamado encerrado, uma única vez, e depois lê a avaliação que deixou |
| Atendente responsável e do setor atual   | Lê a avaliação registrada; não avalia                                                 |
| Atendente ou Gestor de setor de passagem | Lê a avaliação registrada                                                             |
| Gestor                                   | Lê a avaliação e vê a média no Painel                                                 |
| Administrador                            | Lê a avaliação de qualquer chamado e vê a média no Painel                             |

Como a avaliação se comporta:

- a nota vai de **1 a 5**, cada valor com o rótulo escrito ao lado (1 — Muito ruim até 5 — Muito bom); a nota nunca aparece só como estrela ou como cor;
- o comentário é opcional, de até 500 caracteres, texto puro com as quebras de linha preservadas;
- o formulário avisa que a avaliação é definitiva e pede confirmação antes de enviar;
- a avaliação é **única por chamado e imutável**: não existe rota de edição nem de exclusão, e uma segunda tentativa responde que o chamado já foi avaliado;
- reabrir o chamado não apaga a avaliação nem libera uma segunda; enquanto o chamado estiver reaberto, avaliar é recusado porque ele não está encerrado;
- avaliar não gera notificação para ninguém.

No **Painel**, junto dos dois cartões de tempo médio, entra o cartão **Avaliação média do atendimento**, com a média de uma casa decimal e a quantidade de avaliações ao lado. Ele segue o mesmo recorte dos tempos: conta as avaliações dos chamados **encerrados** no período. Por isso um chamado avaliado e reaberto sai da média enquanto estiver aberto e volta no período do encerramento seguinte. Período sem avaliação mostra um traço, nunca um zero lido como nota, e o comentário nunca aparece no Painel.

## Documentação por unidade

- U1 — [roteiro de inspeção manual](docs/u1-foundation/roteiro-inspecao-manual.md) e [rastreabilidade requisito → teste](docs/u1-foundation/rastreabilidade-requisitos-testes.md).
- U2 — [roteiro de inspeção manual](docs/u2-tickets/roteiro-inspecao-manual.md) e [rastreabilidade requisito → teste](docs/u2-tickets/rastreabilidade-requisitos-testes.md).
- U3 — [roteiro de inspeção manual](docs/u3-conversation/roteiro-inspecao-manual.md) e [rastreabilidade requisito → teste](docs/u3-conversation/rastreabilidade-requisitos-testes.md).
- U4 — [roteiro de inspeção manual](docs/u4-reporting/roteiro-inspecao-manual.md) e [rastreabilidade requisito → teste](docs/u4-reporting/rastreabilidade-requisitos-testes.md).
- U5 — [roteiro de inspeção manual](docs/u5-rating/roteiro-inspecao-manual.md) e [rastreabilidade requisito → teste](docs/u5-rating/rastreabilidade-requisitos-testes.md).

Os roteiros cobrem acessibilidade e uso em tela estreita, que não têm teste automatizado de navegador neste projeto; as tabelas de rastreabilidade ligam cada critério de aceitação e cada regra de negócio aos testes que os verificam.

## Segurança em resumo

- Senhas guardadas apenas como hash argon2id.
- Sessão em cookie `httpOnly`, `SameSite=Strict`, `Path=/api`, válida por 8 horas, sem renovação automática; o logout apaga o cookie no navegador.
- Todas as rotas são negadas por padrão; só login e logout são públicos, e um teste enumera as rotas registradas.
- Perfil e situação do usuário são lidos do banco a cada requisição.
- Toda resposta de erro usa o envelope `{ error: { code, message, details, traceId } }`, sem vazar erros internos.
- Bloqueio temporário após 5 tentativas de login falhas em 15 minutos para o mesmo e-mail.
