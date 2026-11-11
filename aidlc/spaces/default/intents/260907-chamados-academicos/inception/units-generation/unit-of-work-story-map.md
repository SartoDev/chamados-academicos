# Mapa de Histórias por Unidade — Sistema de Chamados Acadêmicos

Derivado de `stories.md` (em `../user-stories/`: 20 histórias) e de `unit-of-work.md`.

**Regra de leitura.** Cada história tem uma **unidade principal**, que a entrega. Quando um ou mais critérios de aceitação da história só podem ser realizados em outra unidade, essa unidade também aparece na linha da história, na coluna "Também em". A seção seguinte diz exatamente quais critérios ficam em cada unidade adicional, para que o Desenho Funcional de cada unidade saiba quais são seus.

Os critérios transversais CT1 a CT11 de `stories.md` valem para todas as unidades e não aparecem no mapa, do mesmo modo que não aparecem em cada história. Os que dependem de estrutura — envelope de erro (CT2), hash de senha (CT3), subida com um comando (CT4), segredos (CT5), perfil lido por requisição (CT10) — nascem em U1.

## Mapa

| História | Título | Prioridade | Unidade principal | Diretório | Também em |
|----------|--------|-----------|-------------------|-----------|-----------|
| US1.1 | Entrar no sistema | Must | U1 | `u1-foundation` | — |
| US1.2 | Abrir um chamado | Must | U2 | `u2-tickets` | — |
| US1.3 | Acompanhar meus chamados | Must | U2 | `u2-tickets` | U3 |
| US1.4 | Conversar dentro do chamado | Must | U3 | `u3-conversation` | — |
| US1.5 | Ser avisado do que muda | Must | U2 | `u2-tickets` | U3 |
| US1.6 | Reabrir um chamado encerrado | Must | U2 | `u2-tickets` | — |
| US2.1 | Trabalhar a fila do setor | Must | U2 | `u2-tickets` | U3 |
| US2.2 | Assumir e responder | Must | U2 | `u2-tickets` | U3 |
| US2.3 | Controlar o andamento do chamado | Must | U2 | `u2-tickets` | U3 |
| US2.4 | Transferir para outro setor | Must | U2 | `u2-tickets` | — |
| US3.1 | Distribuir a carga do setor | Must | U2 | `u2-tickets` | — |
| US4.1 | Gerenciar usuários e acessos | Must | U1 | `u1-foundation` | U2, U3 |
| US4.2 | Manter os catálogos de classificação | Must | U1 | `u1-foundation` | U2 |
| US5.1 | Não ver o que não é meu | Must | U1 | `u1-foundation` | U2, U3, U4, U5 |
| US5.2 | Não revelar o que existe | Must | U2 | `u2-tickets` | U3, U5 |
| US5.3 | Usar o sistema só pelo teclado | Must | U1 | `u1-foundation` | U2, U3, U4, U5 |
| US5.4 | Usar pelo celular | Must | U1 | `u1-foundation` | U2, U3, U4, U5 |
| US6.1 | Acompanhar o desempenho do setor | Could | U4 | `u4-reporting` | — |
| US6.2 | Consultar listagens filtradas | Could | U4 | `u4-reporting` | — |
| US6.3 | Avaliar o atendimento | Could | U5 | `u5-rating` | — |

## Histórias que Atravessam Unidades

| História | Critérios realizados fora da unidade principal | Onde | Por quê |
|----------|-----------------------------------------------|------|---------|
| US1.3 | AC1.3.4, na parte da aba de mensagens do detalhe | U3 | As mensagens pertencem a Conversation. U2 entrega o detalhe com descrição, metadados e histórico. |
| US1.5 | AC1.5.1, no evento de mensagem recebida | U3 | O evento nasce em Conversation, que grava a notificação pelo serviço de U2. |
| US2.1 | AC2.1.3, na parte das mensagens; AC2.1.7 | U3 | A regra de acesso à conversa é de Conversation, distinta da regra de acesso ao chamado. |
| US2.2 | AC2.2.3 e AC2.2.5 | U3 | Responder e ter a mensagem recusada em chamado encerrado são operações de Conversation. |
| US2.3 | AC2.3.2 | U3 | O gatilho do retorno automático é a mensagem do solicitante; U3 pede a transição e U2 a aplica pela máquina de transições. |
| US4.1 | AC4.1.5, na parte "chamados e mensagens permanecem visíveis" | U2, U3 | Só é verificável quando existem chamados (U2) e mensagens (U3) de um usuário desativado. |
| US4.2 | AC4.2.3, no formulário de chamado; AC4.2.4 | U2 | O formulário de abertura e os chamados existentes estão em U2. U1 entrega a listagem de itens ativos que o formulário consome. |
| US5.1 | AC5.1.1 e AC5.1.2, para cada rota nova | U2, U3, U4, U5 | O mecanismo nasce em U1 (AC5.1.3 e AC5.1.4 ficam lá); cada unidade acrescenta rotas e os testes negativos delas. |
| US5.2 | AC5.2.1 e AC5.2.2, para mensagens e avaliação | U3, U5 | Cada recurso com dono responde 404 ao ator que não pode vê-lo; o recurso de chamado fica em U2. |
| US5.3 | AC5.3.1 a AC5.3.6, para cada tela nova | U2, U3, U4, U5 | A casca e o tema nascem em U1; cada tela nova entra no roteiro de inspeção manual. |
| US5.4 | AC5.4.1, AC5.4.2 e AC5.4.4, para cada tela nova | U2, U3, U4, U5 | A barra lateral recolhível (AC5.4.3) nasce em U1; cada tela nova respeita a largura de 375px. |

## Ordem de Implementação dentro de Cada Unidade

A ordem abaixo vale **dentro** de cada unidade e segue as dependências de construção de `stories.md`. A ordem **entre** unidades é do Planejamento de Entrega.

**U1 — Fundação.**

1. Estrutura do projeto e convenções transversais.
2. US1.1, usando o administrador da carga inicial.
3. US5.1: guard global e teste de enumeração de rotas.
4. US4.2: setores vêm antes de usuários, porque atendente e gestor exigem setor.
5. US4.1.
6. US5.3 e US5.4, verificados sobre as telas da unidade.

**U2 — Chamados.**

1. US1.2.
2. US1.3.
3. US5.2.
4. US2.1.
5. A gravação de notificações de US1.5, antes de qualquer evento notificável, por causa de CT9.
6. US2.2.
7. US2.3.
8. US2.4.
9. US3.1.
10. US1.6.
11. A leitura de notificações de US1.5 (sino, listagem, marcar como lida).

**U3 — Conversa.**

1. US1.4.
2. Os critérios de mensagens de US2.2, US2.3 e US2.1, nesta ordem.
3. A aba de mensagens de US1.3.
4. A notificação de mensagem de US1.5.

**U4 — Indicadores.** As duas histórias não dependem uma da outra.

1. US6.2 primeiro, porque reaproveita os filtros da fila de U2.
2. Depois US6.1.

**U5 — Avaliação.** US6.3.

## Verificação de Cobertura

- Todas as 20 histórias de `stories.md` estão mapeadas. Nenhuma ficou sem unidade principal.
- Toda unidade tem ao menos uma história principal:
  - U1: seis — US1.1, US4.1, US4.2, US5.1, US5.3, US5.4.
  - U2: dez — US1.2, US1.3, US1.5, US1.6, US2.1, US2.2, US2.3, US2.4, US3.1, US5.2.
  - U3: uma — US1.4.
  - U4: duas — US6.1, US6.2.
  - U5: uma — US6.3.
- Histórias tocadas por unidade além das principais:
  - U2: cinco.
  - U3: dez.
  - U4: três.
  - U5: quatro.
  - U1: nenhuma.
- US5.3 e US5.4 estavam sem alvo na rastreabilidade do Desenho de Domínio, porque o catálogo de blocos cobre só o backend (ADR-007). Com as fatias verticais, as duas passam a ter unidade principal e unidades adicionais.

## Assumptions & Open Questions

- [assumption] Uma unidade só aparece em "Também em" quando algum critério de aceitação da história é realizado nela. Isso faz o Desenho Funcional de U3 receber histórias cuja maior parte está em U2. A alternativa — cada história numa unidade só — deixaria critérios como AC2.2.3 sem dono: U2 os adiaria para U3, e U3 não os rastrearia.
- [assumption] US5.3 e US5.4 têm U1 como unidade principal porque é lá que nascem a casca de layout, o tema e a navegação recolhível dos quais os critérios dependem.
- [assumption] A ordem dentro de U1 supõe que o primeiro administrador exista pela carga inicial, conforme registrado em `unit-of-work.md`.
