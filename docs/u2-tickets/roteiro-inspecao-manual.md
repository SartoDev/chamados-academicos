# Roteiro de Inspeção Manual — U2 Chamados

- **Roteiro criado em:** 2026-09-15
- **Versão do sistema:** U2 Chamados (código gerado nesta data, antes do primeiro commit)
- **Situação:** **executado em 2026-11-13**, em inspeção assistida por agente no Google Chrome do autor, com observação simultânea do autor, sobre o sistema em Docker Compose local (`http://localhost:8080`, Node 24.11.1, Docker Engine 29.7.2). Cada medida foi tirada com o viewport conferido antes e com controle positivo do instrumento de contraste (preto sobre branco = 21; `#767676` sobre branco = 4,54). Nenhum item recebeu `Aprovado` sem evidência medida registrada na linha. Desvio declarado quanto a `project.md` § Forbidden, que proíbe teste automatizado de navegador: esta inspeção não produz suíte, código de teste nem portão — é observação assistida.

Este roteiro cobre, **nas telas novas da U2**, os critérios que o projeto não verifica por teste automatizado de navegador, por decisão registrada em `team.md` e em `stories.md`. Os critérios AC5.3.3 (rótulo associado) e AC5.3.4 (informação em texto além da cor) também têm teste de componente nas telas de U2; ver a [tabela de rastreabilidade](rastreabilidade-requisitos-testes.md).

A casca, o tema e o menu recolhível já foram inspecionados em U1 ([roteiro da U1](../u1-foundation/roteiro-inspecao-manual.md)); aqui eles só reaparecem quando a tela nova muda alguma coisa.

## Preparação

1. Suba o sistema com `docker compose up --build` e abra `http://localhost:8080` num navegador atual (Chrome, Edge ou Firefox).
2. Pela Administração, tenha cadastrados: dois setores (por exemplo Secretaria e Financeiro), uma categoria ativa em cada um, um Aluno, um Professor, dois Atendentes da Secretaria, um Gestor da Secretaria e um Atendente do Financeiro.
3. Abra pelo menos três chamados com o Aluno, em categorias diferentes, e deixe um deles encerrado (encerre pelo próprio Aluno) para inspecionar a reabertura.
4. Para medir contraste, use as ferramentas de desenvolvedor do navegador (inspeção de cor com razão de contraste) ou uma extensão de auditoria de acessibilidade.
5. Para a largura de 375px, use o modo de dispositivo das ferramentas de desenvolvedor com largura de 375px.

## Telas cobertas

| Tela                          | Como chegar                                                 |
| ----------------------------- | ----------------------------------------------------------- |
| Meus Chamados                 | Entrar como Aluno ou Professor (`/tickets`)                 |
| Novo Chamado                  | Em Meus Chamados, botão "Novo Chamado" (`/tickets/new`)     |
| Detalhe do Chamado            | Clicar no título de um chamado (`/tickets/{id}`)            |
| Fila do Setor                 | Entrar como Atendente ou Gestor (`/queue`)                  |
| Chamados (visão geral)        | Entrar como Administrador, item "Chamados" (`/all-tickets`) |
| Notificações — painel do sino | Sino na barra superior, em qualquer tela                    |
| Notificações — lista completa | No painel do sino, "Ver todas" (`/notifications`)           |
| Diálogos do chamado           | Transferir, Atribuir, Alterar prioridade, e as confirmações |

## Itens de verificação

Preencha a coluna **Resultado** com `Aprovado` ou `Reprovado` e, se reprovado, descreva o problema em **Observações**.

### AC5.3.1 — Uso só pelo teclado

| #   | Passos                                                                                                | Esperado                                                                                                 | Resultado | Observações                                                                                                                                                                                                  |
| --- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1.1 | Em Meus Chamados, percorra com Tab: filtros, ordenação, "Novo Chamado", links de título e paginação.  | Todos são alcançáveis e acionáveis por Enter ou Espaço; a ordem segue a leitura da tela.                 | Aprovado  | Ordem: Novo Chamado, Status, Categoria, Setor, Ordenar por, contentor da tabela e títulos; todos com anel. Enter no título abriu o chamado. O contentor rolável é focável com nome Tabela dos meus chamados. |
| 1.2 | Em Novo Chamado, preencha e envie usando só o teclado (setas no grupo de prioridade).                 | Categoria, setor (somente leitura), título, descrição, prioridade e botões são alcançáveis; Enter envia. | Aprovado  | Chamado #11 criado só com teclado: categoria por digitação, setor preenchido sozinho (Secretaria, somente leitura), título, descrição, prioridade Baixa por seta e envio com Enter.                          |
| 1.3 | No Detalhe do Chamado, foque a lista de abas e use as setas esquerda e direita.                       | A aba ativa muda entre Detalhes e Histórico e o painel correspondente aparece.                           | Aprovado  | Detalhes, Histórico e Conversa com o painel acompanhando; da primeira aba a seta esquerda dá a volta para a última.                                                                                          |
| 1.4 | Como Atendente, acione "Assumir" pelo teclado em uma linha da Fila do Setor.                          | A ação é executada e a linha é atualizada; o foco permanece na tabela.                                   | Reprovado | A ação executa (a fila caiu de 2 para 1), mas o foco vai para BODY. O roteiro exige que o foco permaneça na tabela.                                                                                          |
| 1.5 | Abra "Transferir", preencha e confirme só pelo teclado; repita abrindo e fechando com Escape.         | O foco fica preso no diálogo; Escape fecha; ao fechar, o foco volta ao botão que abriu.                  | Aprovado  | Foco preso no diálogo (seis Tabs seguem dentro); Escape devolve o foco ao mesmo nó do gatilho; a transferência por teclado levou o chamado ao Financeiro.                                                    |
| 1.6 | Abra "Encerrar" (confirmação), cancele com Escape, abra de novo e confirme com Enter.                 | A confirmação aparece antes de qualquer envio; Escape cancela sem encerrar.                              | Aprovado  | A confirmação aparece antes de qualquer envio; Escape cancelou sem encerrar (status seguiu Em análise); Enter encerrou.                                                                                      |
| 1.7 | Abra o sino pelo teclado, percorra as notificações, acione uma com Enter e feche o painel com Escape. | O painel abre, os itens são alcançáveis, Enter abre o chamado e Escape devolve o foco ao sino.           | Aprovado  | Enter abre o painel (role=dialog), o foco entra em Marcar todas como lidas, 13 itens alcançáveis, e Enter numa notificação abriu o chamado com o painel fechando sozinho.                                    |
| 1.8 | Como Gestor, abra "Atribuir", escolha uma pessoa com as setas e confirme.                             | Os rádios são navegáveis por teclado e a atribuição é enviada.                                           | Aprovado  | Rádios navegáveis por seta (para baixo marca Gestor, para cima volta a Atendente); Tab chega ao confirmar e Enter atribuiu.                                                                                  |

### AC5.3.2 — Indicador de foco visível

| #   | Passos                                                                                                 | Esperado                                                  | Resultado | Observações                                                                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1 | Percorra com Tab Meus Chamados, Novo Chamado, Detalhe, Fila do Setor e a visão geral do Administrador. | Todo elemento focado exibe anel ou borda de foco visível. | Aprovado  | Anel em todas as paradas de Meus Chamados, Detalhe, casca e Fila do Setor. Os botões de ação têm nome contextual, por exemplo Assumir chamado #15. |
| 2.2 | Percorra os diálogos (Transferir, Atribuir, Prioridade e as confirmações) e o painel do sino.          | Campos, rádios, seletores e botões mostram foco visível.  | Aprovado  | Prioridade (três rádios), Transferir (select e textarea com anel de 3px), botões e itens do painel do sino.                                        |

### AC5.3.5 — Contraste mínimo

| #   | Passos                                                                                                                     | Esperado                                                              | Resultado | Observações                                                                                                                          |
| --- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 5.1 | Meça o contraste dos textos principais e auxiliares (cinza) em Meus Chamados, Detalhe, Fila e Notificações.                | Todos os pares de texto e fundo atendem o mínimo de WCAG 2.1 nível A. | Aprovado  | Varredura exaustiva: 106 folhas de texto em Meus Chamados e 37 no Detalhe, zero reprovações. Pior caso 4,74 (Sem responsável, 14px). |
| 5.2 | Meça as marcas de status e prioridade, a marca "responsável indisponível" e as mensagens de erro em vermelho dos diálogos. | Atendem o mínimo exigido.                                             | Aprovado  | Aberto 19,8; Prioridade Normal 18,16; Sem responsável 4,74. Todas acima de 4,5.                                                      |
| 5.3 | Meça o contador do sino sobre o fundo da barra superior.                                                                   | Atende o mínimo exigido.                                              | Aprovado  | Contador do sino: 19,8 a 10px.                                                                                                       |

### AC5.3.6 — Tema padrão do Shadcn sem cores sobrescritas

| #   | Passos                                                                                                                                                                | Esperado                                                                                                               | Resultado | Observações                                                                                  |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------- |
| 6.1 | Na raiz do repositório, execute `grep -rnE "#[0-9a-fA-F]{3,8}\b\|rgb\(\|hsl\(\|oklch\(\|\[color:" apps/web/src/features/tickets apps/web/src/features/notifications`. | Nenhuma cor literal nas telas de U2; só tokens do tema (`text-muted-foreground`, `bg-muted`, `text-destructive` etc.). | Aprovado  | Comando do roteiro executado na raiz: 0 linhas.                                              |
| 6.2 | Observe as marcas de status e de prioridade no Detalhe e na Fila.                                                                                                     | A diferença entre elas é sempre textual; a cor é reforço, nunca a única informação.                                    | Aprovado  | As marcas carregam o próprio texto (Em análise, Prioridade Normal, Aberto); a cor é reforço. |

### AC5.4.1 — Telas do solicitante sem rolagem horizontal em 375px

| #   | Passos                                                                                                     | Esperado                                                                    | Resultado | Observações                                                                                            |
| --- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------ |
| 4.1 | Em 375px, abra Meus Chamados, Novo Chamado, Detalhe do Chamado (abas Detalhes e Histórico) e Notificações. | Nenhuma dessas páginas rola na horizontal; o conteúdo ocupa a largura útil. | Aprovado  | Meus Chamados, Novo Chamado e Detalhe nas abas Detalhes e Histórico: todas em 375/375.                 |
| 4.2 | Em 375px, abra o painel do sino e os diálogos de confirmação a partir do Detalhe.                          | O painel e os diálogos cabem na largura, sem rolagem horizontal da página.  | Aprovado  | Painel do sino com 343px (16 a 359) e confirmação Reabrir com 320px (28 a 348); nenhuma rola a página. |

### AC5.4.2 — Listagem de chamados em cartões em 375px

| #   | Passos                                                        | Esperado                                                                                                 | Resultado | Observações                                                                                                                                   |
| --- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 4.3 | Em 375px, observe Meus Chamados com pelo menos três chamados. | A lista aparece como cartões (número, status, título, categoria, setor e data), não como tabela cortada. | Aprovado  | 8 cartões de 343px e zero tabelas visíveis; cada cartão traz número, status, título, categoria, setor e data.                                 |
| 4.4 | Aumente a largura para 768px ou mais.                         | A lista volta a ser tabela, com as mesmas colunas da inspeção em desktop.                                | Aprovado  | Viewport 768 confirmado: 1 tabela com 7 colunas (Número, Título, Categoria, Setor, Responsável, Status, Atualizado), 8 linhas e zero cartões. |

### AC5.4.4 — Rolagem contida nas telas de trabalho em 375px

| #   | Passos                                                                                       | Esperado                                                                                             | Resultado                           | Observações                                                                                                                                                                                                                         |
| --- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4.5 | Em 375px, entre como Atendente e abra a Fila do Setor, com pelo menos três chamados na fila. | A página não rola na horizontal; a tabela rola dentro do próprio contentor, que recebe foco por Tab. | Aprovado                            | Perfil Atendente com 3 chamados: página 375/375 e tabela rolando dentro do contentor (731/341, overflow-x auto).                                                                                                                    |
| 4.6 | Em 375px, entre como Administrador e abra "Chamados".                                        | Mesmo comportamento: rolagem só dentro do contentor da tabela.                                       | Aprovado com divergência de roteiro | Página 375/375 sem rolagem horizontal, mas por outro mecanismo: 1 tabela no DOM e 0 visíveis, com 15 cartões de 343px. O roteiro previa rolagem dentro do contentor da tabela; a tela adota cartões. O critério do NFR6 é atendido. |

## Observações gerais da passagem

_Preencha aqui qualquer problema que não caiba na tabela, com a tela e a largura em que foi observado._
