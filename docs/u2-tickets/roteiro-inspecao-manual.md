# Roteiro de Inspeção Manual — U2 Chamados

- **Roteiro criado em:** 2026-09-15
- **Versão do sistema:** U2 Chamados (código gerado nesta data, antes do primeiro commit)
- **Situação:** pendente de execução pelo autor. Os resultados abaixo ficam em branco até a passagem manual; nenhum item foi dado como aprovado sem ser observado.

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

| #   | Passos                                                                                                | Esperado                                                                                                 | Resultado | Observações |
| --- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------- | ----------- |
| 1.1 | Em Meus Chamados, percorra com Tab: filtros, ordenação, "Novo Chamado", links de título e paginação.  | Todos são alcançáveis e acionáveis por Enter ou Espaço; a ordem segue a leitura da tela.                 |           |             |
| 1.2 | Em Novo Chamado, preencha e envie usando só o teclado (setas no grupo de prioridade).                 | Categoria, setor (somente leitura), título, descrição, prioridade e botões são alcançáveis; Enter envia. |           |             |
| 1.3 | No Detalhe do Chamado, foque a lista de abas e use as setas esquerda e direita.                       | A aba ativa muda entre Detalhes e Histórico e o painel correspondente aparece.                           |           |             |
| 1.4 | Como Atendente, acione "Assumir" pelo teclado em uma linha da Fila do Setor.                          | A ação é executada e a linha é atualizada; o foco permanece na tabela.                                   |           |             |
| 1.5 | Abra "Transferir", preencha e confirme só pelo teclado; repita abrindo e fechando com Escape.         | O foco fica preso no diálogo; Escape fecha; ao fechar, o foco volta ao botão que abriu.                  |           |             |
| 1.6 | Abra "Encerrar" (confirmação), cancele com Escape, abra de novo e confirme com Enter.                 | A confirmação aparece antes de qualquer envio; Escape cancela sem encerrar.                              |           |             |
| 1.7 | Abra o sino pelo teclado, percorra as notificações, acione uma com Enter e feche o painel com Escape. | O painel abre, os itens são alcançáveis, Enter abre o chamado e Escape devolve o foco ao sino.           |           |             |
| 1.8 | Como Gestor, abra "Atribuir", escolha uma pessoa com as setas e confirme.                             | Os rádios são navegáveis por teclado e a atribuição é enviada.                                           |           |             |

### AC5.3.2 — Indicador de foco visível

| #   | Passos                                                                                                 | Esperado                                                  | Resultado | Observações |
| --- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- | --------- | ----------- |
| 2.1 | Percorra com Tab Meus Chamados, Novo Chamado, Detalhe, Fila do Setor e a visão geral do Administrador. | Todo elemento focado exibe anel ou borda de foco visível. |           |             |
| 2.2 | Percorra os diálogos (Transferir, Atribuir, Prioridade e as confirmações) e o painel do sino.          | Campos, rádios, seletores e botões mostram foco visível.  |           |             |

### AC5.3.5 — Contraste mínimo

| #   | Passos                                                                                                                     | Esperado                                                              | Resultado | Observações |
| --- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | --------- | ----------- |
| 5.1 | Meça o contraste dos textos principais e auxiliares (cinza) em Meus Chamados, Detalhe, Fila e Notificações.                | Todos os pares de texto e fundo atendem o mínimo de WCAG 2.1 nível A. |           |             |
| 5.2 | Meça as marcas de status e prioridade, a marca "responsável indisponível" e as mensagens de erro em vermelho dos diálogos. | Atendem o mínimo exigido.                                             |           |             |
| 5.3 | Meça o contador do sino sobre o fundo da barra superior.                                                                   | Atende o mínimo exigido.                                              |           |             |

### AC5.3.6 — Tema padrão do Shadcn sem cores sobrescritas

| #   | Passos                                                                                                                                                                | Esperado                                                                                                               | Resultado | Observações |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------- | ----------- |
| 6.1 | Na raiz do repositório, execute `grep -rnE "#[0-9a-fA-F]{3,8}\b\|rgb\(\|hsl\(\|oklch\(\|\[color:" apps/web/src/features/tickets apps/web/src/features/notifications`. | Nenhuma cor literal nas telas de U2; só tokens do tema (`text-muted-foreground`, `bg-muted`, `text-destructive` etc.). |           |             |
| 6.2 | Observe as marcas de status e de prioridade no Detalhe e na Fila.                                                                                                     | A diferença entre elas é sempre textual; a cor é reforço, nunca a única informação.                                    |           |             |

### AC5.4.1 — Telas do solicitante sem rolagem horizontal em 375px

| #   | Passos                                                                                                     | Esperado                                                                    | Resultado | Observações |
| --- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | --------- | ----------- |
| 4.1 | Em 375px, abra Meus Chamados, Novo Chamado, Detalhe do Chamado (abas Detalhes e Histórico) e Notificações. | Nenhuma dessas páginas rola na horizontal; o conteúdo ocupa a largura útil. |           |             |
| 4.2 | Em 375px, abra o painel do sino e os diálogos de confirmação a partir do Detalhe.                          | O painel e os diálogos cabem na largura, sem rolagem horizontal da página.  |           |             |

### AC5.4.2 — Listagem de chamados em cartões em 375px

| #   | Passos                                                        | Esperado                                                                                                 | Resultado | Observações |
| --- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------- | ----------- |
| 4.3 | Em 375px, observe Meus Chamados com pelo menos três chamados. | A lista aparece como cartões (número, status, título, categoria, setor e data), não como tabela cortada. |           |             |
| 4.4 | Aumente a largura para 768px ou mais.                         | A lista volta a ser tabela, com as mesmas colunas da inspeção em desktop.                                |           |             |

### AC5.4.4 — Rolagem contida nas telas de trabalho em 375px

| #   | Passos                                                                                       | Esperado                                                                                             | Resultado | Observações |
| --- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------- | ----------- |
| 4.5 | Em 375px, entre como Atendente e abra a Fila do Setor, com pelo menos três chamados na fila. | A página não rola na horizontal; a tabela rola dentro do próprio contentor, que recebe foco por Tab. |           |             |
| 4.6 | Em 375px, entre como Administrador e abra "Chamados".                                        | Mesmo comportamento: rolagem só dentro do contentor da tabela.                                       |           |             |

## Observações gerais da passagem

_Preencha aqui qualquer problema que não caiba na tabela, com a tela e a largura em que foi observado._
