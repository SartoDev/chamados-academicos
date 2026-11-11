# Rastreabilidade Requisito → Teste — U1 Fundação

Cobertura por requisito, critério principal de teste afirmado em `team.md`: cada critério de aceitação e cada regra de negócio da U1 aponta para os testes automatizados que o verificam. Os critérios sem casa automatizada, por não haver teste de navegador no projeto, apontam para o [roteiro de inspeção manual](roteiro-inspecao-manual.md).

Fontes: `stories.md` (US1.1, US4.1, US4.2, US5.1, US5.3, US5.4), `rules.md` (BR1.1 a BR8.9) e `traceability.json` do Desenho Funcional da U1.

## Legenda dos arquivos de teste

### API — unitários (`apps/api/src/`)

| Sigla         | Arquivo                                              |
| ------------- | ---------------------------------------------------- |
| U-limitador   | `auth/login-attempt-limiter.spec.ts`                 |
| U-login       | `auth/login.service.spec.ts`                         |
| U-token       | `auth/token.service.spec.ts`                         |
| U-guard       | `auth/guards/auth.guard.spec.ts`                     |
| U-origem      | `auth/guards/origin-check.spec.ts`                   |
| U-ator        | `auth/decorators/current-actor.decorator.spec.ts`    |
| U-regras-user | `users/user-rules.spec.ts`                           |
| U-regras-cat  | `catalog/catalog-rules.spec.ts`                      |
| U-senha       | `common/validation/password-policy.spec.ts`          |
| U-hash        | `common/security/password-hasher.spec.ts`            |
| U-filtro      | `common/errors/all-exceptions.filter.spec.ts`        |
| U-validacao   | `common/errors/validation-exception.factory.spec.ts` |
| U-comum       | `common/common-utilities.spec.ts`                    |
| U-config      | `config/app-config.spec.ts`                          |

### API — integração com PostgreSQL real (`apps/api/test/integration/u1-foundation/`)

| Sigla         | Arquivo                     |
| ------------- | --------------------------- |
| I-dados       | `data-model.spec.ts`        |
| I-subida      | `startup.spec.ts`           |
| I-svc-users   | `users-service.spec.ts`     |
| I-svc-cat     | `catalog-services.spec.ts`  |
| I-publicos    | `public-services.spec.ts`   |
| I-api-auth    | `api-auth.spec.ts`          |
| I-api-users   | `api-users.spec.ts`         |
| I-api-cat     | `api-catalog.spec.ts`       |
| I-autorizacao | `authorization.spec.ts`     |
| I-convencoes  | `api-conventions.spec.ts`   |
| I-rotas       | `route-enumeration.spec.ts` |

### Web — componentes (`apps/web/src/`)

| Sigla            | Arquivo                                                      |
| ---------------- | ------------------------------------------------------------ |
| W-http           | `app/api/api-client.test.ts`, `app/api/query-client.test.ts` |
| W-mensagens      | `app/i18n/error-code-messages.test.ts`                       |
| W-regras         | `app/rules.test.ts`                                          |
| W-lista          | `app/components/ListState.test.tsx`                          |
| W-compartilhados | `app/components/shared-components.test.tsx`                  |
| W-confirmacao    | `app/components/ConfirmDeactivateDialog.test.tsx`            |
| W-nav            | `app/layout/SideNav.test.tsx`                                |
| W-casca          | `app/layout/AppShell.test.tsx`                               |
| W-protegida      | `app/ProtectedLayout.test.tsx`                               |
| W-sessao         | `features/auth/session.test.tsx`                             |
| W-login-form     | `features/auth/LoginForm.test.tsx`                           |
| W-login-page     | `features/auth/LoginPage.test.tsx`                           |
| W-admin          | `features/admin/AdminPage.test.tsx`                          |
| W-usuarios       | `features/admin/users/UsersTab.test.tsx`                     |
| W-form-usuario   | `features/admin/users/UserFormDialog.test.tsx`               |
| W-senha          | `features/admin/users/ResetPasswordDialog.test.tsx`          |
| W-setores        | `features/admin/catalog/SectorsTab.test.tsx`                 |
| W-categorias     | `features/admin/catalog/CategoriesTab.test.tsx`              |
| W-status         | `features/admin/catalog/StatusesTab.test.tsx`                |
| W-prioridades    | `features/admin/catalog/PrioritiesTab.test.tsx`              |

Manual: [roteiro de inspeção manual](roteiro-inspecao-manual.md), itens numerados.

## Critérios de aceitação

| Critério | O que verifica                                                                                | Testes                                                                                                       |
| -------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| AC1.1.1  | Login com sucesso leva à tela de entrada do perfil                                            | I-api-auth, U-login, W-login-page                                                                            |
| AC1.1.2  | Resposta única para e-mail inexistente e senha errada                                         | I-api-auth, U-login, W-login-form, W-mensagens                                                               |
| AC1.1.3  | Conta desativada não entra e perde a sessão na requisição seguinte                            | I-api-auth, U-guard, U-login                                                                                 |
| AC1.1.4  | Logout apaga o cookie; requisição seguinte responde 401                                       | I-api-auth, W-casca                                                                                          |
| AC1.1.5  | Sessão expirada responde 401 e leva ao login                                                  | I-api-auth, U-token, W-protegida, W-sessao                                                                   |
| AC1.1.6  | Sem link de recuperação de senha                                                              | W-login-form, I-api-auth, I-rotas                                                                            |
| AC1.1.7  | Cookie com `HttpOnly` e `SameSite`                                                            | I-api-auth                                                                                                   |
| AC4.1.1  | Usuário criado consegue entrar com a senha inicial                                            | I-api-users, I-svc-users, W-form-usuario, W-usuarios                                                         |
| AC4.1.2  | E-mail já cadastrado é recusado com erro específico                                           | I-api-users, I-svc-users, I-dados, W-form-usuario                                                            |
| AC4.1.3  | Troca de perfil vale na requisição seguinte                                                   | I-api-auth, I-svc-users                                                                                      |
| AC4.1.4  | Redefinição de senha invalida a anterior                                                      | I-api-auth, I-svc-users, W-senha                                                                             |
| AC4.1.5  | Usuário desativado não entra (a parte de chamados e mensagens é de U2 e U3)                   | I-api-auth, I-svc-users, W-usuarios                                                                          |
| AC4.1.6  | Atendente ou Gestor sem setor é recusado                                                      | I-api-users, I-svc-users, U-regras-user, I-dados, W-form-usuario                                             |
| AC4.1.7  | Quem não é administrador recebe 403 na gestão de usuários                                     | I-autorizacao, W-protegida, W-nav                                                                            |
| AC4.1.8  | Nenhuma rota pública de criação de conta                                                      | I-rotas, I-api-auth                                                                                          |
| AC4.1.9  | Exatamente cinco perfis, um por usuário                                                       | I-api-users, W-form-usuario, W-regras, U-comum                                                               |
| AC4.2.1  | Setor criado fica disponível como destino de categorias                                       | I-api-cat, W-setores                                                                                         |
| AC4.2.2  | Categoria sem setor é recusada                                                                | I-api-cat, I-svc-cat, W-categorias                                                                           |
| AC4.2.3  | Setor ou categoria inativos não são oferecidos                                                | I-api-cat, I-svc-cat, I-publicos, U-regras-cat                                                               |
| AC4.2.4  | **Deferred para U2**: chamados existentes exibem o item inalterado. U1 garante a pré-condição | I-publicos (rótulos de itens inativos), I-api-cat (nomes de inativos legíveis)                               |
| AC4.2.5  | Quatro status e três prioridades iniciais, Normal como padrão                                 | I-api-cat, I-dados                                                                                           |
| AC4.2.6  | Confirmação explica o efeito antes de desativar                                               | W-confirmacao, W-setores, W-categorias, W-usuarios                                                           |
| AC5.1.1  | Perfil sem direito recebe 403 sem dados do recurso                                            | I-autorizacao, U-guard                                                                                       |
| AC5.1.2  | Usuário não obtém dados de outro (IDOR)                                                       | I-autorizacao, I-api-auth                                                                                    |
| AC5.1.3  | Rota sem marcação de perfil responde 403 para todos                                           | I-autorizacao, U-guard                                                                                       |
| AC5.1.4  | Enumeração de rotas sem rota não pública desmarcada                                           | I-rotas                                                                                                      |
| AC5.3.1  | Uso completo só pelo teclado                                                                  | Manual 1.1 a 1.7; parte automatizada: W-admin (setas), W-confirmacao (Escape e foco preso), W-casca (atalho) |
| AC5.3.2  | Indicador de foco visível                                                                     | Manual 2.1 e 2.2                                                                                             |
| AC5.3.3  | Rótulo visível associado a cada campo                                                         | W-compartilhados, W-login-form, W-form-usuario, W-senha                                                      |
| AC5.3.4  | Informação transmitida também por texto, não só por cor                                       | W-usuarios, W-setores, W-prioridades, W-compartilhados, W-nav                                                |
| AC5.3.5  | Contraste mínimo de WCAG 2.1 nível A                                                          | Manual 5.1 e 5.2                                                                                             |
| AC5.3.6  | Nenhuma cor sobrescreve a paleta do tema                                                      | Manual 6.1 e 6.2 (revisão de código)                                                                         |
| AC5.4.1  | Tela de login sem rolagem horizontal em 375px (as demais telas são de U2, U3 e U5)            | Manual 4.1                                                                                                   |
| AC5.4.2  | **Deferred para U2**: listagem de chamados em cartões                                         | Não se aplica a U1                                                                                           |
| AC5.4.3  | Navegação recolhida em menu em 375px                                                          | Manual 4.2 e 4.3; parte automatizada: W-casca (menu móvel)                                                   |
| AC5.4.4  | Rolagem horizontal só dentro do contentor das tabelas                                         | Manual 4.4 e 4.5; parte automatizada: W-compartilhados (região rolável)                                      |

## Regras de negócio

| Regra  | Testes                                                                                                                        |
| ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| BR1.1  | U-login, U-comum, I-api-auth                                                                                                  |
| BR1.2  | U-login, I-api-auth, W-login-form                                                                                             |
| BR1.3  | U-login                                                                                                                       |
| BR1.4  | U-limitador, U-login, I-api-auth, W-login-form, W-mensagens                                                                   |
| BR1.5  | U-token, I-api-auth                                                                                                           |
| BR1.6  | I-api-auth, W-casca                                                                                                           |
| BR1.7  | U-guard, U-token, I-api-auth, I-autorizacao, W-http, W-sessao, W-protegida                                                    |
| BR1.8  | U-guard, I-api-auth                                                                                                           |
| BR1.9  | I-rotas, I-api-auth, W-login-form                                                                                             |
| BR2.1  | U-guard, I-autorizacao, I-rotas                                                                                               |
| BR2.2  | U-guard, I-autorizacao                                                                                                        |
| BR2.3  | U-guard, I-convencoes                                                                                                         |
| BR2.4  | I-rotas                                                                                                                       |
| BR2.5  | I-autorizacao, I-api-auth                                                                                                     |
| BR2.6  | U-origem, U-guard, I-autorizacao, I-api-auth                                                                                  |
| BR2.7  | I-autorizacao                                                                                                                 |
| BR3.1  | I-svc-users, I-api-users, I-dados, W-form-usuario                                                                             |
| BR3.2  | I-api-users, U-comum, W-regras, W-form-usuario                                                                                |
| BR3.3  | U-regras-user, I-svc-users, I-api-users, I-dados, W-form-usuario                                                              |
| BR3.4  | U-senha, U-config, I-api-users, I-subida, W-regras, W-form-usuario, W-senha                                                   |
| BR3.5  | U-hash, I-dados, I-svc-users, I-api-users                                                                                     |
| BR3.6  | I-api-auth, I-svc-users                                                                                                       |
| BR3.7  | I-api-auth, U-limitador, I-svc-users                                                                                          |
| BR3.8  | I-api-auth, I-svc-users                                                                                                       |
| BR3.9  | U-regras-user, I-svc-users (inclui concorrência), I-api-users, W-usuarios                                                     |
| BR3.10 | I-svc-users: as alterações de usuário dependem só de BR3.3 e BR3.9. U1 não consulta chamados; o efeito sobre chamados é de U2 |
| BR4.1  | I-svc-cat, I-api-cat, I-dados, W-setores, W-status                                                                            |
| BR4.2  | I-svc-cat, I-api-cat, W-categorias                                                                                            |
| BR4.3  | I-svc-cat, I-publicos, I-api-cat                                                                                              |
| BR4.4  | U-regras-cat, I-svc-cat, I-api-cat, I-publicos                                                                                |
| BR4.5  | I-svc-cat, I-svc-users, I-publicos                                                                                            |
| BR4.6  | U-regras-cat, I-svc-cat, I-api-cat, W-status                                                                                  |
| BR4.7  | U-regras-cat, I-svc-cat (inclui concorrência), I-api-cat, I-dados, W-prioridades                                              |
| BR4.8  | W-confirmacao, W-setores, W-categorias, W-usuarios                                                                            |
| BR5.1  | I-dados, I-subida                                                                                                             |
| BR5.2  | I-dados, I-subida                                                                                                             |
| BR5.3  | U-config, I-subida                                                                                                            |
| BR6.1  | U-filtro, I-convencoes e todas as suítes de API (verificação do envelope em cada erro)                                        |
| BR6.2  | I-convencoes, I-api-cat                                                                                                       |
| BR6.3  | U-validacao, I-convencoes, I-api-users, W-compartilhados, W-form-usuario, W-status                                            |
| BR7.1  | W-casca, W-nav, W-compartilhados, W-confirmacao, W-admin; Manual 1.x, 2.x, 5.x e 6.x                                          |
| BR7.2  | W-casca, W-compartilhados; Manual 4.x                                                                                         |
| BR7.3  | W-login-page, W-protegida, W-regras, W-casca                                                                                  |
| BR7.4  | W-lista, W-usuarios, W-login-form, W-form-usuario                                                                             |
| BR7.5  | W-mensagens, W-login-form, W-form-usuario                                                                                     |
| BR7.6  | W-nav, W-regras, W-protegida                                                                                                  |
| BR8.1  | U-guard                                                                                                                       |
| BR8.2  | I-publicos                                                                                                                    |
| BR8.3  | U-regras-user, I-publicos                                                                                                     |
| BR8.4  | U-regras-cat, I-publicos                                                                                                      |
| BR8.5  | U-regras-cat, I-publicos                                                                                                      |
| BR8.6  | I-publicos                                                                                                                    |
| BR8.7  | U-regras-cat, I-publicos                                                                                                      |
| BR8.8  | I-publicos                                                                                                                    |
| BR8.9  | I-publicos (somente leitura, sem e-mail nem hash nas respostas)                                                               |

## Critérios transversais relacionados à U1

| Critério                                                     | Testes                                                |
| ------------------------------------------------------------ | ----------------------------------------------------- |
| CT2 — envelope de erro, sem erro nativo do Prisma            | U-filtro, I-convencoes                                |
| CT3 — senha com hash resistente a força bruta                | U-hash, I-dados                                       |
| CT4 — sistema sobe com um único comando                      | Verificação de `docker compose up` descrita no README |
| CT5 — sem segredo versionado; falha sem variável obrigatória | U-config, I-subida                                    |
| CT7 — estados de carregamento, vazio e erro                  | W-lista, W-usuarios, W-status                         |
| CT8 — validação ao sair do campo e texto preservado          | W-login-form, W-form-usuario, W-setores               |
| CT10 — perfil e situação lidos do banco a cada requisição    | U-guard, I-api-auth                                   |
| CT11 — mensagens traduzidas a partir do código               | W-mensagens                                           |

## Resultado da execução final (Etapa 13)

Execução em 2026-09-13, com Node 24.11.1, npm 11.10.0 e o PostgreSQL de teste do Docker Compose (perfil `test`, porta ligada a `127.0.0.1:55432`). Os limiares são os do plano aprovado e não foram alterados.

| Verificação                                                  | Resultado                                                                                          |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `npm run lint`                                               | Sem erros                                                                                          |
| `npm run typecheck`                                          | Sem erros (`apps/api` e `apps/web`)                                                                |
| `npm run format:check`                                       | Todos os arquivos formatados                                                                       |
| `npm run openapi:check -w apps/api`                          | `openapi.json` atualizado                                                                          |
| `npm audit --omit=dev --audit-level=high`                    | 0 vulnerabilidades, com `overrides` na raiz: `multer` 2.3.0, `mysql2` 3.24.4, `deepmerge-ts` 8.0.2 |
| `npm audit --audit-level=high` (inclui dev; apenas reporta)  | 0 vulnerabilidades                                                                                 |
| API — comando unitário documentado no README                 | 14 suítes, 126 testes aprovados                                                                    |
| API — comando de integração U1 documentado no README         | 11 suítes, 165 testes aprovados                                                                    |
| API — portão combinado (`npm run test:coverage -w apps/api`) | 25 suítes, 291 testes aprovados                                                                    |
| Web — comando documentado no README                          | 21 arquivos, 142 testes aprovados                                                                  |
| `docker compose build api web`                               | Imagens construídas com o `package-lock.json` atualizado                                           |

### Cobertura por limiar

| Limiar                                                                  | Exigido | Medido      | Situação |
| ----------------------------------------------------------------------- | ------- | ----------- | -------- |
| API — global, linhas (portão combinado)                                 | 80%     | 96,87%      | Atendido |
| API — guards, ramos por arquivo (`auth.guard.ts`, `origin-check.ts`)    | 90%     | 100% e 100% | Atendido |
| API — guards, linhas por arquivo (`auth.guard.ts`, `origin-check.ts`)   | 80%     | 100% e 100% | Atendido |
| API — services, linhas por arquivo (menor valor: `statuses.service.ts`) | 80%     | 95,74%      | Atendido |
| Web — global, linhas                                                    | 80%     | 97,47%      | Atendido |

| Service (portão combinado)          | Linhas |
| ----------------------------------- | ------ |
| `auth/login.service.ts`             | 100%   |
| `auth/token.service.ts`             | 100%   |
| `seed/seed.service.ts`              | 100%   |
| `users/users.service.ts`            | 96,77% |
| `users/users-public.service.ts`     | 100%   |
| `catalog/sectors.service.ts`        | 97,18% |
| `catalog/categories.service.ts`     | 97,41% |
| `catalog/statuses.service.ts`       | 95,74% |
| `catalog/priorities.service.ts`     | 100%   |
| `catalog/catalog-public.service.ts` | 99,13% |

Observações:

- Regras de autorização fora de `guards/` (`users/user-rules.ts`, `catalog/catalog-rules.ts`, `common/roles.ts`, `auth/login-attempt-limiter.ts`, `auth/decorators/current-actor.decorator.ts`) têm 100% de ramos e de linhas no portão combinado. A chave de limiar do plano cobre apenas `guards/`; o valor é registrado aqui para transparência.
- Execuções isoladas: a unitária mede 100% de ramos nos guards e 50,25% de linhas no total — a configuração unitária não impõe piso global, porque os services são exercitados na integração contra PostgreSQL real; a de integração mede 94,8% de linhas no total, 96% de ramos em `auth.guard.ts` e no mínimo 95,74% de linhas por service.
- Web: 97,47% de linhas, 95,3% de ramos, 96,62% de funções e 97,52% de instruções. O único arquivo abaixo de 80% de linhas é `app/ProvisionalHomePage.tsx` (75%); o frontend não tem limiar por arquivo.
- Correção feita nesta etapa: as chaves de limiar por caminho do Jest passaram a ser ancoradas no diretório `apps/api`. Antes, ao rodar os comandos documentados a partir da raiz, o Jest não encontrava os arquivos dessas chaves e encerrava com código 1, embora todos os testes passassem. Limiares e escopo não mudaram.
- `npm ls` marca `multer`, `mysql2` e `deepmerge-ts` como `invalid` por causa dos `overrides`; é só a exibição do `npm ls`, que compara com a versão declarada pelo pacote pai. `prisma generate`, `prisma migrate deploy` e as suítes rodam normalmente com essas versões.
