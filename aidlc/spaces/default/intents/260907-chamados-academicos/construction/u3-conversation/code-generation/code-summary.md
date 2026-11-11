# Resumo do Código — U3 Conversa (`u3-conversation`)

Derivado de `code-generation-plan.md` e `unit-test-instructions.md` desta pasta, do resumo de retorno do agente de desenvolvimento, da tabela `docs/u3-conversation/rastreabilidade-requisitos-testes.md` do repositório e das verificações reexecutadas pelo condutor.

## Situação dos Passos do Plano

Os 13 passos do plano aprovado foram executados. As caixas de `code-generation-plan.md` continuam desmarcadas de propósito: o plano tem impressão digital aprovada, e marcar caixas alteraria o arquivo e invalidaria a aprovação.

| Passo | Situação |
|-------|----------|
| 1 — Estrutura da unidade | Concluído |
| 2 — Prontidão dos executores de teste | Concluído |
| 3 — Modelo de dados: implementar | Concluído |
| 4 — Modelo de dados: testes | Concluído |
| 5 — Lógica de negócio: implementar | Concluído |
| 6 — Lógica de negócio: testes | Concluído |
| 7 — API: implementar | Concluído |
| 8 — API: testes | Concluído |
| 9 — Frontend: implementar | Concluído |
| 10 — Frontend: testes | Concluído |
| 11 — Ambiente e build | Concluído; `docker compose build api web` e a subida com a migração aplicada |
| 12 — Documentação | Concluído; a execução do roteiro de inspeção manual é do autor |
| 13 — Rastreabilidade e execução final | Concluído |

A geração foi interrompida uma vez pelo limite de uso da API, no Step 10, e retomada pelo mesmo agente, que conferiu o estado do disco antes de seguir.

## Arquivos Criados e Alterados

A lista completa de caminhos está em `source-manifest.json`, nesta pasta.

| Área | Conteúdo |
|------|----------|
| `apps/api` — novo | `src/conversation/` (service, controller, tipos, erros, DTOs, duas regras puras e três arquivos de teste unitário), migração `20260923034400_u3_conversation` |
| `apps/api` — alterado | `prisma/schema.prisma` (modelo `Message`, relações inversas e índice `(ticket_id, sent_at, id)`), `src/app.module.ts`, `src/common/errors/error-codes.ts` (`MESSAGE_TICKET_CLOSED`), `jest.shared.ts` (chave de limiar ampliada), `openapi.json` |
| `apps/api` — testes | 3 arquivos unitários em `src/conversation/`; 3 suítes de integração em `test/integration/u3-conversation/`, com suporte próprio; `test/integration/u1-foundation/support/database.ts` passou a limpar `messages` antes das tabelas de U2 e U1 |
| `apps/web` — novo | `src/features/conversation/` (aba, lista, balão, campo de envio, botões, regras e cliente de API, com cinco arquivos de teste), `src/test/message-fixtures.ts` |
| `apps/web` — alterado | `app/api/types.ts`, `app/i18n/error-code-messages.ts`, `features/tickets/TicketDetailPage.tsx` (passa a aba pelo ponto de extensão) |
| `docs/u3-conversation` | `rastreabilidade-requisitos-testes.md` e `roteiro-inspecao-manual.md`; `README.md` ganhou a seção da aba Conversa |

Nenhum teste de U1 ou de U2 precisou ser ajustado.

## Decisões de Implementação

- **Paginação e o achado R-06.** A ordenação declara o desempate no mesmo sentido da ordem pedida (`sentAt` e, em empate, o identificador). O raciocínio que sustenta a decisão: a mensagem é imutável e nunca é apagada, e mensagem nova entra sempre no início da ordem decrescente; por isso uma janela de deslocamento que desliza entre duas leituras só pode **repetir** uma mensagem já carregada, nunca esconder uma. A aba junta as páginas descartando identificadores repetidos, o que torna a repetição invisível. Está coberto por três testes: integração que grava mensagem entre a primeira e a segunda página, unitário da junção, e o caminho completo pela aba.
- **Achado R-07.** `order` entra sem `sort`, porque `sentAt` é o único campo ordenável da conversa; o motivo está no tipo e na descrição da operação no OpenAPI.
- **Restrição de tamanho no banco.** O `CHECK` usa `btrim("body", E' \t\r\n')` em vez do `btrim` de um argumento, que só remove espaços e aceitaria um corpo feito só de quebras de linha. É a única diferença de forma em relação à convenção de U2, e ela aperta a regra, nunca afrouxa; o motivo está comentado na migração.
- **404 idêntico.** `conversation.errors.ts` repete a mensagem de U2 caractere a caractere em vez de importar o erro de U2, o que manteria a fronteira entre unidades (BR4.4). Um teste compara os três corpos — inexistente, invisível e Administrador — ignorando o `traceId`.
- **Retirada da aba no 404.** As abas do detalhe são um componente não controlado, e só `TicketDetailPage` podia ser tocado; a aba é retirada trocando a chave do componente de abas, que remonta em Detalhes, e o foco volta ao gatilho de Detalhes. O motivo está comentado no código.
- **Fronteira entre unidades.** Como a ausência de consulta não pode ser provada em tempo de execução, um teste lê o próprio fonte da unidade e afirma que só a tabela de mensagens é acessada e que nenhum módulo interno de outra unidade é importado.
- **Ausência de edição e exclusão.** Um teste afirma que `PUT`, `PATCH` e `DELETE` na rota de mensagens respondem 404, para que a linha de AC1.4.3 na rastreabilidade seja verdadeira.

## Cobertura e Testes

Medições do agente na execução final (Step 13), em 2026-09-23, e reexecução do condutor.

| Suíte | Resultado |
|-------|-----------|
| API — unitários | 24 suítes, 222 testes aprovados |
| API — integração | 24 suítes, 370 testes aprovados |
| API — portão combinado de U1, U2 e U3 | 48 suítes, 592 testes aprovados |
| Web — suíte completa | 34 arquivos, 251 testes aprovados |
| Só U3 | 22 testes unitários de API, 51 de integração e 93 no comando web, que inclui os 48 de U2 em `features/tickets` |

| Limiar | Exigido | Medido |
|--------|---------|--------|
| API — linhas no código que não é andaime | 80% | 97,63% |
| Web — linhas global | 80% | 95,78% |
| Guards — ramos e linhas por arquivo | 90% e 80% | 100% e 100% |
| Regras de U2 e U3 — ramos e linhas por arquivo | 90% e 80% | 100% e 100% |
| Services — linhas por arquivo | 80% | menor valor 95,74%; `conversation.service.ts` com 100% |

Verificações reexecutadas pelo condutor, sem alterar nada: `npm run lint`, `npm run typecheck` e `npm run format:check` sem erros; `npm run openapi:check -w apps/api` confirma o `openapi.json` atualizado; portão combinado da API com 48 suítes e 592 testes a 97,63% de linhas; suíte web com 95,78% de linhas. Os números batem com os que o agente declarou. A auditoria de dependências terminou com 0 vulnerabilidades na execução do agente.

Cobertura por requisito: cada critério de aceitação e cada regra BR de U3 aponta para testes em `docs/u3-conversation/rastreabilidade-requisitos-testes.md` e em `traceability.json` desta pasta, que passou no sensor com 86 identificadores e nenhuma lacuna.

## Desvios em Relação ao Plano e ao Desenho

| Desvio | Onde | Motivo | Situação |
|--------|------|--------|----------|
| `CHECK` do corpo com `btrim` de dois argumentos | Migração de U3 | O `btrim` de um argumento aceitaria corpo só com quebras de linha, mais frouxo que BR2.1 e que a validação da API | Aperta a regra; diferença de forma em relação à convenção de U2, registrada aqui |
| Mensagem de erro de chamado não encontrado repetida em vez de importada | `conversation.errors.ts` | Importar o erro de U2 atravessaria a fronteira entre unidades (BR4.4) | Um teste garante que os corpos continuam idênticos |
| Aba retirada por troca de chave do componente de abas | `use-conversation-tab.tsx` | O componente de abas de U2 é não controlado e não podia ser alterado por este plano | Documentado no código; o foco volta para Detalhes |
| `apps/web/src/test/message-fixtures.ts` | Suporte de teste | Fixturas de mensagem e um utilitário de renderização do detalhe com a aba | Aditivo |

## Pendências e Riscos

- **Achado R-07 do desenho, em aberto:** correção de redação em BR3.2 de `rules.md`, que o desenho congelado pela revisão final não permitiu aplicar. O código segue a leitura correta. Vai ao portão.
- **Inspeção manual:** o autor executa `docs/u3-conversation/roteiro-inspecao-manual.md` e registra os resultados (AC5.3.1, AC5.3.2, AC5.3.5, AC5.3.6, AC5.4.1).
- **Aba que aparece e some:** para quem não lê a conversa, a aba é retirada depois da primeira leitura. É consequência de o detalhe do chamado não informar os setores de passagem; confirmar no portão se incomoda na prática.
- **Docker Desktop caiu duas vezes** durante a geração e foi reiniciado; o banco de teste é efêmero e as migrações são reaplicadas na subida da suíte, então nenhum resultado foi afetado. O contêiner `postgres-test` precisou ser recriado uma vez para reaplicar a migração depois de um ajuste no `CHECK`.
- **Migrações futuras:** um `prisma migrate dev` pode propor remover as restrições em SQL de U1, U2 e agora U3; toda migração gerada precisa ser revisada.
- **Integração Contínua:** o workflow é da etapa de pipeline de CI.
- **Git:** nada foi commitado; todos os arquivos continuam não rastreados no ramo `main`.
