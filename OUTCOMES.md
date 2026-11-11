# Documento de Entrega — Sistema de Chamados Acadêmicos

**Escopo do fluxo**: `feature`
**Etapas entregues**: 18 aprovadas de 18 totais
**Duração**: 7.283 minutos (≈ 121 horas, entre 2026-09-07 e 2026-11-11)

Todas as contagens das seções 7 e 8 vêm de `bun .claude/tools/aidlc-runtime.ts summary --json`. O conteúdo das demais seções é sintetizado dos artefatos do fluxo e do código entregue.

## 1. O que foi construído

Sistema interno de registro e acompanhamento de chamados de suporte acadêmico, para que aluno e professor abram solicitações e a equipe de atendimento as resolva com histórico, conversa e indicadores. Trabalho de conclusão de curso: ambiente de execução **apenas local**, por decisão registrada.

**Cinco perfis de acesso**: aluno, professor, atendente, gestor e administrador.

### Unidades de trabalho entregues

| Unidade | Conteúdo |
|---------|----------|
| **U1 Fundação** | Autenticação por e-mail e senha, sessão em cookie `httpOnly`, bloqueio por tentativas, usuários, catálogos administráveis (categoria, setor, status, prioridade), telas de administração |
| **U2 Chamados** | Ciclo de vida completo: abertura, atribuição, transferência entre setores, nove transições de status, histórico, passagens de setor, notificações internas, reabertura em janela de 72 h |
| **U3 Conversa** | Mensagens dentro do chamado, atômicas com a transição de status e com a notificação, paginação com ordem configurável |
| **U4 Indicadores** | Contagens por status, dois tempos médios com amostras independentes, listagem filtrada, gráficos com tabela equivalente |
| **U5 Avaliação** | Avaliação do atendimento pelo solicitante, uma por chamado, imutável, e o cartão de média no painel |

### Decisões arquiteturais centrais

| Decisão | Por quê |
|---------|---------|
| **Transação ambiente** por executor compartilhado (`TransactionRunner`) com contexto assíncrono (`AsyncLocalStorage`) | Permite que uma operação que atravessa unidades grave tudo ou nada, sem passar parâmetro novo nas assinaturas públicas e sem expor tipo de persistência em fronteira de unidade |
| **Visibilidade sempre dentro da consulta** ao Prisma | Elimina a classe de falha "buscar e comparar o dono depois"; o ator entra no `where`, nunca em comparação posterior |
| **404 idêntico para recurso invisível e inexistente** | Não revela a existência de registro que o ator não pode ver; a igualdade é verificada campo a campo por teste |
| **Envelope de erro único** `{ error: { code, message, details, traceId } }` | O `code` é o contrato estável; a tradução para português acontece só no frontend. Erro do Prisma é sempre convertido |
| **`Status` e `Priority` como tabelas**, não enums | Decorrência do corte mínimo: precisam ser administráveis pelo modelo de dados |
| **Regras de domínio em módulos puros**, sem Nest e sem Prisma | Permite testá-las sem infraestrutura e mantém os limiares de cobertura de ramo altos onde a decisão de autorização vive |
| **Sem camada de repositório** | O service é o único ponto que toca o banco; menos indireção num sistema deste tamanho |

### Pilha, com versões fixadas

| Camada | Tecnologia |
|--------|-----------|
| Runtime | Node 24 (`.nvmrc`) |
| Backend | NestJS 12, Prisma 7.10 com adaptador `pg`, `@node-rs/argon2` 2.2, `class-validator` 0.15 |
| Frontend | React 19.3, Vite, React Router 8.3, TanStack Query 5.102, `radix-ui` 1.6, Tailwind 4, `react-hook-form` 7.88, Zod 4.6 |
| Banco | PostgreSQL 18 (`postgres:18-alpine`) |
| Testes | Jest com `@swc/jest` e Supertest no backend; Vitest com Testing Library no frontend |
| Execução | Docker Compose, três serviços mais um banco de teste em perfil separado |

## 2. Estrutura do repositório

```
.
├── apps/
│   ├── api/                      NestJS
│   │   ├── prisma/               esquema e 4 migrações
│   │   ├── src/
│   │   │   ├── auth/             autenticação, guards, limitador de tentativas
│   │   │   ├── users/            usuários e serviço público consumido por U2
│   │   │   ├── catalog/          categoria, setor, status, prioridade
│   │   │   ├── tickets/          ciclo de vida, regras puras, avaliação (U5)
│   │   │   ├── conversation/     mensagens do chamado
│   │   │   ├── notifications/    avisos internos
│   │   │   ├── reporting/        indicadores e listagem filtrada
│   │   │   ├── common/           erros, relógio, hash, TransactionRunner
│   │   │   ├── config/           configuração com falha na inicialização
│   │   │   ├── openapi/          geração e verificação do contrato
│   │   │   ├── seed/             administrador inicial
│   │   │   └── generated/        cliente Prisma — IGNORADO pelo Git
│   │   ├── test/integration/     uma pasta por unidade, contra Postgres real
│   │   └── openapi.json          contrato versionado, verificado no CI
│   └── web/                      React + Vite
│       ├── src/app/              rotas, navegação, cliente de API, traduções de erro
│       ├── src/components/       componentes de UI gerados (Shadcn)
│       ├── src/features/         auth, admin, tickets, conversation, notifications, reports, rating
│       └── src/test/             apoios de teste compartilhados
├── docs/u1..u5/                  rastreabilidade requisito→teste e roteiros de inspeção manual
├── aidlc/                        registro do fluxo AI-DLC (artefatos, memória, auditoria)
├── .claude/                      framework AI-DLC (agentes, etapas, ferramentas, hooks)
├── .github/workflows/ci.yml      pipeline de integração contínua
├── .githooks/pre-push            portão real: lint e suíte rápida antes do push
├── compose.yaml                  três serviços mais o banco de teste
└── .env.example                  modelo de configuração, sem valor real
```

O código da aplicação fica na raiz; o registro do fluxo fica em `aidlc/`. Nenhum artefato de processo é lido em tempo de execução.

## 3. Guia de instalação

### Pré-requisitos

| Item | Versão |
|------|--------|
| Node.js | 24, como fixado em `.nvmrc` |
| Docker Engine + Compose | Daemon ativo |
| Portas livres em `127.0.0.1` | 8080, 3000, 55432 |

### Passo a passo

```bash
npm ci
cp .env.example .env     # preencha os valores antes de subir
docker compose --profile test up -d postgres-test
```

O script `prepare` instala o hook de pre-push automaticamente no `npm ci`.

### Variáveis obrigatórias

Sem qualquer uma delas a API **falha na inicialização**, de propósito:

| Variável | Observação |
|----------|-----------|
| `POSTGRES_USER`, `POSTGRES_DB`, `POSTGRES_PASSWORD` | A senha entra na URL de conexão: use só letras e algarismos |
| `DATABASE_URL` | Para a API fora do Docker; dentro do Compose a URL é montada das variáveis acima |
| `POSTGRES_TEST_*`, `DATABASE_URL_TEST` | Banco de teste; a porta é publicada só em `127.0.0.1` |
| `JWT_SECRET` | Mínimo de 32 caracteres |
| `APP_ORIGIN` | Origem do navegador; requisição de alteração de outra origem é recusada |
| `COOKIE_SECURE` | `true` apenas sob HTTPS |
| `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD` | Administrador criado na subida se não existir nenhum ativo |

### Como rodar os testes

```bash
npm run test:coverage -w apps/api     # unitários + integração, com os 5 limiares
npm run test:coverage -w apps/web     # componentes, com o piso de 80%
```

Comando restrito a uma unidade **não leva** a opção de cobertura: o limiar global recai sobre execução parcial e reprova sem que nenhum teste falhe. Os comandos restritos canônicos estão em `aidlc/.../construction/build-and-test/integration-test-instructions.md`.

## 4. Build e execução

```bash
npm run build -w apps/api      # prisma generate && tsc
npm run build -w apps/web      # tsc --noEmit && vite build
docker compose build api web
docker compose up -d
```

A API aplica as migrações na subida; não há passo manual. O web responde em `127.0.0.1:8080`, a API em `127.0.0.1:3000`, e a porta do Postgres principal não é publicada no host.

**Não há implantação de infraestrutura.** O único ambiente é local, por decisão registrada: sem provedor de nuvem, sem registry de imagem, sem entrega contínua. O pipeline de CI cobre apenas integração.

### Última verificação completa

| Verificação | Resultado |
|-------------|-----------|
| Jest, portão combinado | 58 suítes, 766 testes, 766 aprovados, 0 falhas |
| Vitest | 340 testes, 340 aprovados, 0 falhas |
| Cobertura | 96,71% de linhas na API; 96,33% no web |
| Cobertura por requisito | 110 de 110 critérios, 58 de 58 requisitos folha |
| Estáticas | lint, tipos estritos, formato, contrato OpenAPI, auditoria de produção — limpos |

## 5. Decisões de arquitetura e restrições

### Decisões com alternativa descartada

| Decisão | Alternativa rejeitada | Motivo |
|---------|----------------------|--------|
| Transação ambiente por contexto assíncrono | Passar o cliente transacional como parâmetro | Vazaria tipo de persistência pelas assinaturas públicas, contra a fronteira de contrato |
| `PUT` não idempotente para avaliar | Trocar para `POST` | Divergiria do contrato de outra forma; ficou o verbo, com a não idempotência declarada |
| Bloqueio de linha (`SELECT FOR UPDATE`) em ação sobre chamado | Atualização condicional | Serializa as ações do mesmo chamado com menos casos de erro, ao custo de segurar a linha |
| Paginação por deslocamento na conversa | Paginação por cursor | Risco de deslocamento aceito pelo autor: mensagem é imutável, então a janela só repete, nunca esconde, e o cliente desduplica |
| Opções de nota com rótulo escrito | Estrelas | Estrela sozinha não transmite a informação a leitor de tela |
| Administrador lê a avaliação, não a conversa | Acesso uniforme por privilégio | Acesso decidido por tipo de recurso: a nota julga o serviço, a conversa carrega assunto pessoal |

### Restrições que moldaram o desenho

- Ambiente de execução apenas local, via Docker; nenhum serviço de nuvem.
- Repositório único com `apps/api` e `apps/web` em npm workspaces, um workflow de CI com dois jobs.
- `main` sem proteção no servidor: o portão real é o hook local de pre-push.
- Sem teste automatizado de navegador; os cinco perfis são verificados por teste de API.
- Sem renovação automática de sessão e sem invalidação no servidor no logout.
- Fora de escopo por decisão: anexos, notificação externa, SLA automático, exportação em PDF ou CSV, base de conhecimento.

### Riscos aceitos, com a consequência escrita

| Risco | Consequência aceita |
|-------|--------------------|
| Logout sem invalidação no servidor | Token roubado permanece válido até a expiração natural |
| Bloqueio de login mantido em memória, por e-mail | Um terceiro pode bloquear o login de outra pessoa por até 15 minutos |
| `main` sem proteção | Pull request com pipeline vermelho pode ser mesclado pelo autor |
| Paginação por deslocamento | Mensagem já carregada pode reaparecer; o cliente desduplica |

## 6. O que comitar e o que arquivar

| Artefato | Ação | Destino |
|----------|------|---------|
| Código da aplicação e de infraestrutura | Comitar | Já no repositório |
| `docs/u*/rastreabilidade-requisitos-testes.md` | Comitar | Já em `docs/` |
| `docs/u*/roteiro-inspecao-manual.md` | Comitar | Já em `docs/` |
| `.github/workflows/ci.yml`, `.githooks/pre-push` | Comitar | Já no repositório |
| Este documento | Comitar | Raiz |
| Árvore `aidlc/` (artefatos, memória, auditoria) | **Comitar** | Já no repositório |
| `.env` | Nunca comitar | Local, ignorado pelo Git |
| `apps/api/src/generated/` | Nunca comitar | Regerado por `prisma generate` |

**Desvio deliberado do modelo deste documento**, declarado em vez de silencioso: o modelo sugere arquivar os shards de auditoria fora do repositório e descartar `aidlc-state.md` e os arquivos de perguntas. Aqui eles **são comitados**, porque o `CLAUDE.md` deste projeto determina versionar a árvore `aidlc/` inteira — registro, memória e auditoria — e porque, num trabalho de conclusão de curso, o rastro de decisão é parte do que se entrega. Só os cursores por usuário e o runtime por máquina ficam fora, pelo `.gitignore`.

## 7. Pegada do fluxo

- **Etapas**: 18 aprovadas, 0 falhadas, 0 pendentes — 3 de inicialização, 4 de ideação, 7 de concepção, 4 de construção.
- **Anotações de diário**: 73 no total — 21 interpretações, 12 desvios, 18 trade-offs, 22 perguntas abertas.
- **Sensores**: 106 disparos, 97 aprovados, 9 reprovados, 0 contornados por orçamento.
- **Aprendizados capturados**: 10 do orquestrador, 0 de acréscimo do autor.

Nota de leitura honesta: `aidlc/spaces/default/memory/project.md` carrega **22 linhas de regra** com identificador de conteúdo, mais do que os 10 que a ferramenta contabiliza. A diferença são as regras gravadas em etapas cujo registro no grafo de runtime foi escrito apenas no momento da aprovação; as regras estão em disco e valem, mas não entram nessa contagem. Os números acima são os da ferramenta, como a regra de contagem exige.

## 8. Limitações conhecidas e o que atacar em seguida

### Pendente de ação humana

1. **Executar os cinco roteiros de inspeção manual** (`docs/u*/roteiro-inspecao-manual.md`). Enquanto não forem executados, NFR5 (WCAG 2.1 nível A) e NFR6 (sem rolagem horizontal em 375px) permanecem não verificados.
2. **Habilitar o CodeQL em configuração padrão** na interface do GitHub. É configuração de conta, não arquivo do repositório, e nenhum passo do pipeline detecta a ausência.
3. **Primeira execução real do pipeline**, no primeiro push. O YAML foi validado e cada comando foi executado localmente na forma exata, exceto a ação do `gitleaks`, que só roda no runner.

### Dívida técnica identificada e não resolvida

Treze achados de revisão de código permanecem como risco aceito, registrados nas tabelas de revisão de cada unidade. Os cinco que valem atenção:

| Achado | O que permanece |
|--------|-----------------|
| U2, código R-01 | A regra escrita manda responder **404** para encerrar ou reabrir chamado alheio; a política implementada responde **403**. Um dos dois está errado, e hoje não se sabe qual é o pretendido |
| U2, código R-02 | A tela "Chamados" do administrador é a única listagem **sem teste de componente**: 11,11% de linhas |
| U5, código R-01 | O cartão de avaliação entrou no estado único de carregamento e erro do painel: falha da rota de avaliação derruba **todo** o painel de indicadores |
| U1, código R-03 | O manifesto de fontes de U1 descreve um conjunto de arquivos que não é o do repositório: 14 caminhos reescritos por unidades posteriores e um que não existe mais |
| U1, código R-01 | O contrato compartilhado declara `active` obrigatório em `statuses`; o código usa um tipo sem esse campo |

Vinte e cinco achados de desenho também ficaram como risco aceito, sendo o mais relevante o **U3 R-11**: o desenho garante "nada foi gravado" para toda falha, mas um aborto por tempo limite chega à tela como erro de rede, e sem chave de idempotência o reenvio pode duplicar a mensagem.

Além disso: um aviso **moderado** de `fast-uri` na árvore de produção, que o critério afirmado (severidade alta) não bloqueia.

### Próximos passos recomendados, em ordem

1. Resolver o **U2 R-01** decidindo se a resposta certa é 404 ou 403, e alinhar regra e código.
2. Escrever o teste de componente da tela "Chamados" (**U2 R-02**).
3. Isolar a falha do cartão de avaliação do estado compartilhado do painel (**U5 R-01**), com teste que fixe a escolha.
4. Regenerar o manifesto de fontes de U1 (**U1 R-03**) ou declarar a divergência no resumo de código.
5. Avaliar chave de idempotência no envio de mensagem (**U3 R-11**), se a duplicata se mostrar incômoda no uso real.
6. Das 22 perguntas abertas nos diários, as que ainda valem decisão estão nos artefatos de cada etapa; a mais prática é se a aba Conversa que aparece e some (oferecida de forma ampla e retirada pelo 404 da primeira leitura) incomoda no uso.

### Escopo deliberadamente adiado

Área administrativa dedicada classificada como *Should have* — o corte mínimo exige apenas que categorias e setores sejam administráveis pelo modelo de dados. Anexos, notificação por e-mail, SLA automático, exportação em PDF ou CSV e base de conhecimento foram excluídos com origem rastreável.
