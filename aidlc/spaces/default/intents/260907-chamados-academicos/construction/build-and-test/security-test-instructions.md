# Instruções de Teste de Segurança

Derivado dos cinco `code-generation-plan.md` e seus `code-summary.md` e `unit-test-instructions.md` (em `../u*/code-generation/`), das regras afirmadas em `team.md` § Deployment e § Code Style, e de `project.md` §§ Mandated e Forbidden.

Não houve etapa de requisitos não funcionais neste fluxo. Isso **não** deixa a segurança sem critério: as exigências de segurança deste projeto foram afirmadas como práticas de equipe e de projeto, e é contra elas que se verifica. Cada item abaixo tem origem rastreável.

## Verificações Automatizadas que Já Rodam

| Verificação | Comando | Critério | Origem |
|-------------|---------|----------|--------|
| Auditoria de dependência de produção | `npm audit --omit=dev --audit-level=high` | Nenhuma vulnerabilidade de severidade alta | `project.md` § Mandated, bloqueante no CI |
| Auditoria completa, incluindo desenvolvimento | `npm audit` | Apenas reporta, não bloqueia | `team.md` § Deployment |
| Varredura de segredo commitado | `gitleaks detect --no-banner` | Nenhum segredo encontrado | `project.md` § Mandated, bloqueante no CI |
| Análise estática | CodeQL, configuração padrão do GitHub | Apenas reporta | `project.md` § Mandated, por o repositório ser público |
| Tipos estritos | `npm run typecheck` | `strict: true` nos dois pacotes | `team.md` § Deployment, bloqueante |

`gitleaks` e CodeQL rodam no pipeline de CI — etapa seguinte a esta. Localmente, `gitleaks` só roda se estiver instalado na máquina; sua ausência no host não é falha desta etapa, e a matriz de verificação registra o CI como etapa dona.

## Autorização: o que todo endpoint precisa provar

Esta é a parte mais importante, porque é a única exigência de segurança que o processo deste projeto fixou como mecanismo, e vale para todo endpoint novo ou alterado. Verificação por **teste de API** com Supertest, contra aplicação NestJS real e Postgres real — não há teste de navegador neste projeto.

| Obrigação | Como verificar | Origem |
|-----------|----------------|--------|
| Guard global de negação por padrão | Rota sem marcação explícita de perfil é negada; o teste de enumeração de rotas de U1 cobre o conjunto inteiro | `project.md` § Mandated |
| Ao menos um `403` por endpoint não público | Um perfil que não deve acessar recebe `403` | `team.md` § Testing Posture |
| Ao menos um teste de IDOR por recurso com dono | Usuário não lê o registro de outro | `team.md` § Testing Posture |
| `401` sem sessão | Endpoint que exige sessão recusa requisição anônima | Convenção X-01 |
| `404` em vez de `403` para recurso invisível | A resposta de recurso que existe mas o ator não pode ver é **idêntica**, campo a campo, à de recurso inexistente — inclusive a mensagem | `project.md` § Code Style; verificado por comparação de envelope em U5 |
| Filtro do ator dentro da consulta | O ator entra na cláusula `where` do Prisma; nunca busca-e-compara depois. Exigência de revisão de código, não de teste | `project.md` § Mandated |

## Tratamento de Erro e Vazamento de Informação

| Obrigação | Como verificar | Origem |
|-----------|----------------|--------|
| Envelope único `{ error: { code, message, details, traceId } }` | Todo caminho de recusa responde no envelope; o teste afirma a forma, não só o status | `team.md` § Code Style |
| Nenhum erro nativo do Prisma na resposta | O filtro global converte qualquer erro do Prisma em `INTERNAL_ERROR` com mensagem genérica | `project.md` § Forbidden |
| Contagem de tentativas de login sem revelar conta | A contagem conta qualquer e-mail informado, exista ou não, e normaliza antes de contar | Regra aprendida, `project.md` § Corrections |
| Mensagem de erro traduzida no cliente | O texto em português vem da tradução do `code`; a `message` é só fallback de depuração | `team.md` § Code Style |

## Sessão: o que está decidido e o que foi aceito como risco

| Decisão | Consequência aceita | Origem |
|---------|--------------------|--------|
| Token em cookie `httpOnly`, duração de algumas horas | — | `project.md` § Mandated |
| Sem renovação automática (refresh token) | O usuário refaz o login ao expirar | `project.md` § Forbidden |
| Logout apaga o cookie no navegador, sem invalidação no servidor | **Token roubado permanece válido até a expiração natural.** Risco aceito conscientemente pelo autor | `project.md` § Forbidden |
| Bloqueio de login por e-mail, mantido em memória | Um terceiro pode bloquear o login de outra pessoa por até 15 minutos. Risco aceito por ser sistema local | Registrado no diário de U1 |
| Segredo do token com mínimo de 32 caracteres | A API falha na inicialização se o segredo for curto | `.env.example`, validado na configuração |

Estas linhas não são achados: são decisões registradas, com a consequência escrita. Reabri-las é decisão do autor, não desta etapa.

## Segredos e Superfície Exposta

| Obrigação | Como verificar | Origem |
|-----------|----------------|--------|
| Nenhum segredo em código ou em artefato versionado | `gitleaks`; `.env` ignorado pelo Git; `.env.example` só com valores fictícios | `project.md` § Mandated |
| Segredo vazado se corrige por rotação, nunca por reescrita de histórico | Procedimento, não teste | `team.md` § Code Style |
| Porta do Postgres não publicada no host, ou ligada a `127.0.0.1` | `compose.yaml`: o `postgres` principal não publica porta; o `postgres-test` publica só em `127.0.0.1` | `project.md` § Forbidden |
| Requisição de alteração de outra origem recusada | `APP_ORIGIN` é obrigatório e a origem é verificada | Configuração da API |

## Como Rodar

```bash
docker compose --profile test up -d postgres-test
npm audit --omit=dev --audit-level=high
npm run typecheck
npx jest --config apps/api/jest.integration.config.ts --runInBand
```

A suíte de integração é onde os testes de autorização vivem: `403`, `401`, IDOR, `404` idêntico e envelope de erro. Não há suíte separada de segurança, e criar uma duplicaria o que já está verificado nos arquivos de API de cada unidade.

Com `gitleaks` instalado no host:

```bash
gitleaks detect --no-banner --redact
```

## Fora destas Instruções

- Teste dinâmico contra aplicação implantada (DAST): não há ambiente implantado neste projeto.
- Teste de penetração: fora do escopo e do orçamento declarados.
- Teste automatizado de navegador para fluxos de autenticação: proibido por decisão afirmada; a verificação é por API.
- Modelagem de ameaças formal: a etapa de requisitos não funcionais, que a produziria, não executou neste fluxo. A consequência está registrada aqui em vez de ficar implícita.
