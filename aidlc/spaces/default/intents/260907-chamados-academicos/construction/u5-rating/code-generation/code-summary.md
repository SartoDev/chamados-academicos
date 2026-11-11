# Resumo do Código — U5 Avaliação (`u5-rating`)

Derivado de `code-generation-plan.md` e `unit-test-instructions.md` desta pasta, do desenho funcional congelado em `../functional-design/`, da tabela `docs/u5-rating/rastreabilidade-requisitos-testes.md` do repositório e das verificações executadas no Step 13.

## Situação dos Passos do Plano

Os 13 passos do plano aprovado foram executados, na ordem, com os testes de cada camada escritos **depois** da implementação daquela camada e rodados antes de seguir para a próxima (test-after, conforme o `Testing Contract` embutido no plano). As caixas de `code-generation-plan.md` continuam desmarcadas de propósito: o plano tem impressão digital aprovada.

| Passo | Situação |
|-------|----------|
| 1 — Estrutura da unidade | Concluído; linha de base verde antes de qualquer mudança |
| 2 — Prontidão dos executores de teste | Concluído; os três comandos restritos rodaram com `--passWithNoTests` |
| 3 — Modelo de dados: implementar | Concluído; migração `u5_rating` criada com `--create-only` e revisada |
| 4 — Modelo de dados: testes | Concluído; 9 testes de integração contra Postgres real |
| 5 — Lógica de negócio: implementar | Concluído |
| 6 — Lógica de negócio: testes | Concluído; 34 unitários e 24 de integração |
| 7 — API: implementar | Concluído; `openapi.json` regenerado |
| 8 — API: testes | Concluído; 31 testes de integração com Supertest |
| 9 — Frontend: implementar | Concluído; os dois pontos de extensão criados |
| 10 — Frontend: testes | Concluído; 43 testes em 5 arquivos |
| 11 — Ambiente e build | Concluído; `docker compose build api web` passa e a migração entra na imagem |
| 12 — Documentação | Concluído; a execução do roteiro de inspeção manual é do autor |
| 13 — Rastreabilidade e execução final | Concluído; números medidos abaixo |

## Arquivos Criados e Alterados

A lista completa de caminhos está em `source-manifest.json`, nesta pasta.

| Área | Conteúdo |
|------|----------|
| `apps/api` — novo | `src/tickets/rating.{controller,service,types,errors}.ts`, `src/tickets/dto/rating-{input,response}.dto.ts`, duas regras puras em `src/tickets/rules/` com seus testes, e a migração `20260926220811_u5_rating` |
| `apps/api` — alterado, só por adição | `prisma/schema.prisma` (modelo `Rating` e a relação inversa em `Ticket`), `src/common/errors/error-codes.ts` (três códigos novos), `src/tickets/tickets.module.ts` (registro e exportação), `src/reporting/` (resumo de avaliações: controller, service, tipos, DTO e a regra de perfis), `openapi.json` |
| `apps/api` — testes | 2 arquivos unitários em `src/tickets/rules/`; 3 suítes de integração em `test/integration/u5-rating/`, com cenário e fábricas próprios; `test/integration/u1-foundation/support/database.ts` apaga `ticket_ratings` antes das tabelas de U2 |
| `apps/web` — novo | `src/features/rating/` (cliente de API, rótulos da escala, bloco, formulário, escolha de nota, diálogo de confirmação, exibição e cartão do painel), com cinco arquivos de teste |
| `apps/web` — alterado | `features/tickets/TicketTabs.tsx` e `TicketDetailPage.tsx` (ponto de extensão da aba Detalhes), `features/reports/IndicatorsTab.tsx` (cartão e nota de rodapé), `app/api/types.ts`, `app/i18n/error-code-messages.ts`, e os dois arquivos de apoio de teste `src/test/{ticket,report}-fixtures.ts` |
| `docs/u5-rating` | `rastreabilidade-requisitos-testes.md` e `roteiro-inspecao-manual.md`; `README.md` ganhou a seção da avaliação e os comandos de teste da U5 |

**Nenhuma variável de ambiente nova**, portanto `.env.example` não mudou. Nenhum limiar de cobertura foi alterado e nenhuma chave nova foi criada: as regras puras da U5 ficam em `apps/api/src/tickets/rules/`, que a chave existente já cobre.

## Os Dois Pontos de Extensão

Os dois achados de revisão que ficaram abertos no desenho (R-01 Critical e R-06 Minor) foram resolvidos no código pelo mecanismo que o plano fixou, e o plano prevaleceu sobre o texto do desenho.

- **Aba Detalhes.** `TicketTabs` ganhou uma propriedade opcional `detailsExtra?: ReactNode`, renderizada **dentro** de `<TabsContent value="details">`, logo abaixo de `<TicketDetailsTab ticket={ticket} />`. `TicketDetailPage` passa o bloco de avaliação por ela. **Não é o padrão `extraTabs`**, que cria aba irmã e é como U3 registra a aba Conversa: a U5 não cria aba nova. Sem a propriedade, a aba Detalhes é exatamente o que era, e há teste afirmando isso.
- **Painel de indicadores.** O `RatingCard` entrou na **grade dos tempos médios**, que passou de `sm:grid-cols-2` para `sm:grid-cols-2 lg:grid-cols-3`: três cartões em telas largas, uma coluna nas estreitas. A grade das contagens por status ficou intacta. A nota de rodapé passou a dizer que a avaliação média segue o recorte por encerramento, como os tempos.

## Decisões de Implementação

- **A U5 hospeda o próprio serviço no módulo de chamados e o exporta**, em vez de alargar o serviço público da U2. A tabela `ticket_ratings` é da U5, e `tickets-public.service.ts` não foi tocado — exatamente o que a lista de arquivos do plano exige. O módulo de indicadores injeta `RatingService` para compor o resumo, sem ler a tabela.
- **O resumo é uma agregação do Prisma, não SQL cru.** Média e contagem saem de `rating.aggregate` com a condição `ticket: { AND: [visibilityCondition(actor), { closedAt: { not: null, gte, lt } }] }` — o ator é filtrado dentro do `where`, e a condição vem do mesmo módulo de regra que a U2 usa, sem cópia. Não foi preciso o tradutor de condição para SQL que a U4 criou, porque média de inteiro é agregação comum.
- **A unicidade é decidida duas vezes, de propósito.** O serviço lê antes de gravar, para responder 409 com o código que a tela traduz, e o índice único de `ticket_ratings` recusa de novo se duas requisições do mesmo solicitante chegarem juntas. A violação do Prisma é convertida no serviço e nunca chega à resposta.
- **`rating-score.ts` é dono das duas regras de conteúdo** — a escala de 1 a 5 (BR2.1) e o comentário opcional (BR2.2). O plano nomeou dois arquivos de regra; separar o comentário num terceiro acrescentaria um arquivo que o plano não declarava.
- **Os rótulos da escala existem dos dois lados, com papéis diferentes.** O módulo puro do backend fixa a chave estável em inglês (`VERY_BAD` a `VERY_GOOD`), cumprindo "cada valor tem um rótulo fixo"; o texto em português ("Muito ruim" a "Muito bom") vive só no frontend, como `team.md` exige. A API devolve apenas o número.
- **`RatingComment` não virou componente próprio.** O campo usa o `FormField` compartilhado da U1, que já entrega rótulo visível associado, dica e erro ligados por `aria-describedby` — o mesmo caminho do `MessageComposer` da U3. A tabela de componentes do desenho previa um componente separado; o comportamento previsto está inteiro, com um arquivo a menos.
- **As cinco opções são botões de escolha exclusiva com rótulo escrito, nunca estrelas**, conforme a suposição registrada no desenho: estrela sozinha não passa a informação a quem usa leitor de tela.
- **404 idêntico verificado por comparação de corpo.** A mensagem de `TICKET_NOT_FOUND` da U5 repete, caractere a caractere, a que a U2 responde; um teste de integração compara os dois envelopes campo a campo, ignorando só o `traceId`.
- **O comentário do formulário é colado, não digitado, nos testes.** Digitar 501 caracteres num campo controlado estourava o tempo do teste e, pior, continuava digitando nos testes seguintes, contaminando-os. Os testes usam `user.paste`, que é um evento só.

## Cobertura e Testes

Medições da execução final (Step 13), na máquina do autor, com o Postgres de teste do Docker Compose ligado. O Step 13 foi executado **duas vezes**, a segunda inteira e do zero, com o contêiner de teste reiniciado (banco vazio, as quatro migrações reaplicadas pela subida da suíte): os números abaixo são idênticos nas duas execuções, com uma única variação irrelevante — os ramos da execução de integração isolada, 91,75% na primeira e 91,65% na segunda, sobre uma chave que não tem limiar de ramo.

| Suíte | Resultado |
|-------|-----------|
| API — unitários (todos) | 28 suítes, 274 testes aprovados |
| API — integração (todas) | 30 suítes, 492 testes aprovados |
| API — portão combinado de U1 a U5 | 58 suítes, 766 testes aprovados |
| Web — suíte completa | 45 arquivos, 340 testes aprovados |
| Só U5 — unitários de API (`src/tickets/rules`) | 8 suítes, 98 testes (inclui as regras da U2, que compartilham a pasta) |
| Só U5 — integração de API (`test/integration/u5-rating`) | 3 suítes, 64 testes |
| Só U5 — frontend (`features/rating`) | 5 arquivos, 43 testes |
| Comando restrito do frontend (rating + tickets + reports) | 17 arquivos, 137 testes |

Acréscimo da U5 sobre a linha de base da U4: **+3 suítes e +64 testes** na integração da API, **+2 suítes e +35 testes** nos unitários da API, **+5 arquivos e +43 testes** no frontend.

| Limiar | Exigido | Medido |
|--------|---------|--------|
| API — linhas no código que não é andaime (portão combinado) | 80% | **96,71%** |
| Web — linhas global | 80% | **96,33%** |
| Guards — ramos e linhas por arquivo | 90% e 80% | 100% e 100% |
| Regras de U2 a U5 — ramos por arquivo | 90% | menor valor **94,44%** (`rating-score.ts`); `rating-access.ts` com 100% |
| Regras de U2 a U5 — linhas por arquivo | 80% | menor valor **100%** |
| Services — linhas por arquivo | 80% | menor valor **95,56%** (`rating.service.ts`, entre 18 arquivos); `reporting.service.ts` com 100% |

Nenhum limiar ficou por atingir e nenhuma configuração de cobertura foi tocada. A chave dos guards cobre 2 arquivos, a das regras 13 e a dos services 18. O menor valor de ramo entre os services é 83,87%, em `src/tickets/tickets-public.service.ts` — lacuna já registrada pela U4 (formas de condição que só os recortes de fila produzem) e que não tem limiar de ramo nessa chave; a U5 não a alterou.

Arquivos novos da U5, em detalhe (portão combinado):

| Arquivo | Linhas | Ramos |
|---------|--------|-------|
| `src/tickets/rules/rating-access.ts` | 100% | 100% |
| `src/tickets/rules/rating-score.ts` | 100% | 94,44% |
| `src/tickets/rating.service.ts` | 95,56% | 87,5% |
| `src/tickets/rating.controller.ts` | 100% | 100% |
| `src/tickets/rating.errors.ts` | 100% | 100% |
| `src/reporting/reporting.service.ts` | 100% | 91,89% |
| `apps/web/src/features/rating/` (pasta) | 96,9% | 88,73% |

Verificações do Step 13, todas sem erro: `npm run lint`; `npm run typecheck` (API e web, `strict: true`); `npm run format:check` ("All matched files use Prettier code style!"); `npm run openapi:check -w apps/api` ("openapi.json is up to date."); `npm audit --omit=dev --audit-level=high` ("found 0 vulnerabilities"); `docker compose build api web` (as duas imagens construídas, com a migração da U5 dentro da imagem da API).

Cobertura por requisito: cada critério de aceitação e cada regra BR da U5 aponta para testes em `docs/u5-rating/rastreabilidade-requisitos-testes.md`.

## Desvios em Relação ao Plano e ao Desenho

| Desvio | Onde | Motivo | Situação |
|--------|------|--------|----------|
| Nota de rodapé do painel reescrita | `features/reports/IndicatorsTab.test.tsx` | O plano exige que a nota passe a citar a avaliação; a asserção da U4 verificava a frase antiga | Única expectativa de U2/U4 alterada; a asserção continua verificando a mesma coisa, com a frase nova |
| Tabela de perfis do teste da U4 ampliada | `src/reporting/rules/report-access.spec.ts` | A operação nova entra no `Record` tipado de `REPORT_OPERATIONS`, e sem a entrada o teste não compila | Aditivo: a entrada nova e uma asserção nova; nada perdeu o que verificava |
| Rotas de avaliação nos apoios de teste compartilhados | `src/test/ticket-fixtures.ts`, `src/test/report-fixtures.ts` | As telas de U2 e U4 passam a pedir a avaliação e o resumo; sem a resposta, as suítes existentes cairiam em estado de erro | Só respostas novas nos apoios; nenhuma expectativa de U2 ou U4 foi tocada |
| `RatingService` exportado pelo módulo de chamados | `tickets.module.ts` | Mantém `tickets-public.service.ts` intocado, como a lista de arquivos do plano exige | Aditivo; a U4 injeta o serviço em vez de ler a tabela |
| Comentário sem componente próprio | `features/rating/RatingForm.tsx` | O `FormField` da U1 já entrega rótulo, dica e erro ligados | Comportamento previsto inteiro, um arquivo a menos |
| `PUT` não idempotente | API-U5 | Segunda chamada responde 409 em vez de repetir o resultado | Divergência já declarada no desenho (Q2, BR2.3) |
| Rótulos da escala em dois lugares | `rules/rating-score.ts` e `features/rating/rating-labels.ts` | Chave estável em inglês no backend, texto em português no frontend (`team.md`) | Declarado; a API devolve só o número |

## Pendências e Riscos

- **Divergência entre a máquina de estado do desenho e o plano, na tela.** SM1 de `functional-spec.md` diz que uma avaliação registrada é legível "em qualquer status", e WF2 passo 4 idem; o Step 10 do plano, porém, especifica que a `RatingSection` mostra "nada em chamado não encerrado". O código segue o plano: um chamado avaliado e depois reaberto não exibe o bloco enquanto estiver aberto, e o bloco volta com a mesma avaliação no encerramento seguinte. **A API continua fiel ao desenho** — `getTicketRating` devolve a avaliação em qualquer status, e há teste afirmando isso; a restrição é só de tela. O desenho está congelado. **Vai ao portão.**
- **Ramo não coberto em `rating.service.ts` (87,5% de ramos).** O caminho que converte a violação de unicidade do banco só é atingido por duas transações concorrentes do mesmo solicitante no mesmo chamado; a verificação anterior à gravação ganha a corrida em qualquer teste determinístico. O ramo existe como rede de segurança e é exercitado pelo teste de integração da restrição do banco (`data-model.spec.ts`), do lado do Postgres. Não há limiar de ramo em services, então nenhum limiar ficou por atingir.
- **Ramo não coberto em `rating-score.ts` (94,44% de ramos).** É o `?? null` de `labelKeyForScore`, inalcançável enquanto `isValidScore` guardar a chamada. Acima do limiar de 90%.
- **Teste de componente que cobre `RatingForm` a 93,61% de linhas.** As três linhas fora de cobertura são ramos de segurança do envio (nota nula no momento do envio, que a confirmação já impede). Não há limiar por arquivo no frontend, e o global está em 96,33%.
- **Inspeção manual:** o autor executa `docs/u5-rating/roteiro-inspecao-manual.md`, que cobre AC5.3.1, AC5.3.2, AC5.3.5, AC5.3.6 e AC5.4.1, mais uma seção de conferência do comportamento da avaliação.
- **Git:** nada foi commitado; todos os arquivos continuam não rastreados no ramo `main`, como pedido.
