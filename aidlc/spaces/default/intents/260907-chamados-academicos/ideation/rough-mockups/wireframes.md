# Wireframes de Conceito — Sistema de Chamados Acadêmicos

Baixa fidelidade. O objetivo é fixar layout, hierarquia e estados de tela, não estilo visual. Base: `../intent-capture/intent-statement.md` (perfis), `../scope-definition/scope-document.md` (o que entra) e `../scope-definition/intent-backlog.md` (proto-Unidades B1–B11).

Convenções: tema padrão do Shadcn, sem paleta própria [Q7]. Desktop em primeiro lugar, com layout responsivo funcional em celular [Q5]. Meta de acessibilidade: WCAG 2.1 A — navegação completa por teclado, rótulos visíveis em formulários e contraste mínimo [Q6].

## Arquitetura de Navegação

Barra superior com conta, notificações e busca; barra lateral com as seções, colapsável. [Q1]

```
+--------------------------------------------------------------------------+
| [logo] Chamados Academicos          [busca]      [sino 3] [avatar v]      |
+------------------+-------------------------------------------------------+
| [icone] Chamados |                                                       |
| [icone] Fila     |                 AREA DE CONTEUDO                      |
| [icone] Painel   |                                                       |
| [icone] Admin    |                                                       |
|                  |                                                       |
|                  |                                                       |
| [<] recolher     |                                                       |
+------------------+-------------------------------------------------------+
```

<!-- Text fallback: cabeçalho fixo no topo com logo à esquerda (que leva à tela de entrada do perfil), campo de busca ao centro, ícone de notificações com contador e menu do avatar à direita. Abaixo, barra lateral à esquerda com os itens de seção — Chamados, Fila, Painel e Admin, conforme o perfil — e um botão de recolher no rodapé; o restante da largura é a área de conteúdo. -->

Itens da lateral por perfil:

| Perfil | Itens visíveis |
|--------|----------------|
| Aluno, Professor | Meus Chamados |
| Atendente | Meus Chamados, Fila do Setor |
| Gestor | Meus Chamados, Fila do Setor, Painel |
| Administrador | Meus Chamados, Fila do Setor, Painel, Administração |

Não há item "Início" na barra lateral. A Q2 descartou uma tela inicial única: cada perfil entra direto na sua tela de tarefa, e o primeiro item da lateral já é essa tela. Um "Início" apontaria para a tela que o item seguinte também abre. O logotipo da barra superior leva à tela de entrada do perfil, cumprindo a convenção de "voltar ao começo" sem ocupar um item de navegação. [Q1] [Q2]

**Acessibilidade:** `header` como landmark `banner`, `nav` lateral como landmark `navigation`, conteúdo em `main`. Primeiro elemento focável da página é um link "Pular para o conteúdo". Item ativo da lateral marcado com `aria-current="page"`, não apenas por cor.

**Responsivo:** abaixo de 768px a barra lateral vira menu hambúrguer na barra superior; a busca colapsa em ícone.

## Tela 1 — Login

Entrada única do sistema. [B1]

```
+--------------------------------------------------------------------------+
|                                                                          |
|                    +----------------------------------+                  |
|                    |     Chamados Academicos          |                  |
|                    |                                  |                  |
|                    |  E-mail                          |                  |
|                    |  [______________________]        |                  |
|                    |                                  |                  |
|                    |  Senha                           |                  |
|                    |  [______________________] [olho] |                  |
|                    |                                  |                  |
|                    |  [        Entrar        ]        |                  |
|                    |                                  |                  |
|                    |  Esqueci minha senha             |                  |
|                    +----------------------------------+                  |
|                                                                          |
+--------------------------------------------------------------------------+
```

<!-- Text fallback: cartão centralizado na tela com título, campo de e-mail, campo de senha com botão de revelar, botão primário "Entrar" ocupando a largura do cartão, e link "Esqueci minha senha" abaixo. -->

| Estado | Comportamento |
|--------|---------------|
| Vazio | Campos em branco, botão Entrar desabilitado até ambos preenchidos. |
| Carregando | Botão vira spinner com rótulo "Entrando..."; campos ficam somente leitura. |
| Erro | Mensagem acima do formulário: "E-mail ou senha incorretos." Sem indicar qual dos dois falhou. |
| Sucesso | Redireciona conforme o perfil (ver Tela 2). |

**Acessibilidade:** `h1` "Chamados Acadêmicos". Rótulos visíveis acima dos campos, associados por `for`/`id`. Erro anunciado em região `aria-live="polite"`. Foco inicial no campo de e-mail.

## Tela 2 — Entrada por Perfil

Não há uma tela inicial única: cada perfil cai direto na sua tarefa principal. [Q2]

| Perfil | Destino após login |
|--------|--------------------|
| Aluno, Professor | Tela 3 — Meus Chamados |
| Atendente, Gestor | Tela 6 — Fila do Setor |
| Administrador | Tela 8 — Administração |

## Tela 3 — Meus Chamados

Lista dos chamados abertos pelo próprio usuário. [B4]

```
+--------------------------------------------------------------------------+
| Meus Chamados                                    [ + Novo Chamado ]      |
+--------------------------------------------------------------------------+
| [Status v] [Categoria v] [Setor v] [busca...]         [limpar filtros]   |
+--------------------------------------------------------------------------+
| # | Titulo              | Categoria  | Setor      | Status    | Atualizado|
+---+---------------------+------------+------------+-----------+-----------+
| 42| Revisao de nota     | Notas      | Secretaria | Em analise| ha 2h     |
| 41| Segunda via boleto  | Financeiro | Financeiro | Aguardando| ontem     |
| 38| Trancamento         | Matricula  | Secretaria | Encerrado | 12/03     |
+---+---------------------+------------+------------+-----------+-----------+
|                     Mostrando 1-3 de 3        [< 1 >]                    |
+--------------------------------------------------------------------------+
```

<!-- Text fallback: título "Meus Chamados" com botão primário "Novo Chamado" à direita. Abaixo, linha de filtros por status, categoria e setor, campo de busca e link para limpar filtros. Tabela com colunas número, título, categoria, setor, status e data de atualização. Rodapé com contagem e paginação. -->

| Estado | Comportamento |
|--------|---------------|
| Vazio (nenhum chamado) | Ícone, texto "Você ainda não abriu nenhum chamado." e botão "Abrir meu primeiro chamado". |
| Vazio (filtros sem resultado) | "Nenhum chamado corresponde aos filtros." com botão "Limpar filtros". |
| Carregando | Esqueleto de 5 linhas de tabela. |
| Erro | "Não foi possível carregar seus chamados." com botão "Tentar novamente". |
| Muitos itens | Paginação com contagem total; filtros e ordenação preservados ao trocar de página. |

**Acessibilidade:** `h1` "Meus Chamados". Tabela com `<th scope="col">`. Status representado por rótulo textual além da cor. Colunas ordenáveis anunciam a direção via `aria-sort`.

**Responsivo:** abaixo de 768px a tabela vira lista de cartões, um por chamado, com título, status e data.

## Tela 4 — Novo Chamado

Formulário em página única, com todos os campos visíveis. [Q3] [B4]

```
+--------------------------------------------------------------------------+
| < Voltar        Novo Chamado                                             |
+--------------------------------------------------------------------------+
|  Categoria *                     Setor responsavel *                     |
|  [ Selecione            v ]      [ Preenchido pela categoria  v ]        |
|                                                                          |
|  Titulo *                                                                |
|  [__________________________________________________________]           |
|                                                                          |
|  Descricao *                                                             |
|  +--------------------------------------------------------+             |
|  |                                                        |             |
|  |                                                        |             |
|  +--------------------------------------------------------+             |
|  0/2000 caracteres                                                       |
|                                                                          |
|  Prioridade                                                              |
|  ( ) Baixa   (o) Normal   ( ) Alta                                       |
|                                                                          |
|                                  [ Cancelar ]  [ Abrir Chamado ]         |
+--------------------------------------------------------------------------+
```

<!-- Text fallback: cabeçalho com link "Voltar" e título "Novo Chamado". Formulário com categoria e setor lado a lado (setor é sugerido pela categoria escolhida), campo de título de linha única, área de texto para descrição com contador de caracteres, grupo de rádio para prioridade com "Normal" pré-selecionado, e no rodapé os botões Cancelar e Abrir Chamado. -->

| Estado | Comportamento |
|--------|---------------|
| Inicial | Setor desabilitado até a categoria ser escolhida; prioridade em "Normal". |
| Validação | Validação ao sair do campo, não a cada tecla. Erro abaixo do campo, com texto específico. |
| Enviando | Botão "Abrir Chamado" vira spinner; formulário somente leitura. |
| Erro no envio | Alerta acima dos botões, com o texto digitado preservado. |
| Sucesso | Redireciona para a Tela 5 do chamado criado, com confirmação no topo. |

**Acessibilidade:** `h1` "Novo Chamado". Campos obrigatórios marcados com asterisco e `aria-required`. Grupo de prioridade em `fieldset` com `legend`. Erros associados por `aria-describedby`. Contador de caracteres em `aria-live="polite"`.

## Tela 5 — Detalhe do Chamado

Abas separadas: Conversa, Histórico de alterações, Detalhes. [Q4] [B4] [B6]

```
+--------------------------------------------------------------------------+
| < Voltar   #42 Revisao de nota                    [Em analise v]         |
|            Secretaria - Notas - Prioridade Normal - Aberto em 12/03      |
+--------------------------------------------------------------------------+
| [ Conversa ] [ Historico ] [ Detalhes ]                                  |
+--------------------------------------------------------------------------+
|                                                                          |
|  +------------------------------------------------+                      |
|  | Aluno - 12/03 14:20                            |                      |
|  | Gostaria de solicitar revisao da nota da P2.   |                      |
|  +------------------------------------------------+                      |
|                                                                          |
|                      +------------------------------------------------+  |
|                      | Atendente - 12/03 16:05                        |  |
|                      | Recebido. Vou encaminhar ao professor.         |  |
|                      +------------------------------------------------+  |
|                                                                          |
+--------------------------------------------------------------------------+
|  [ Escreva uma mensagem...                            ] [ Enviar ]       |
+--------------------------------------------------------------------------+
```

<!-- Text fallback: cabeçalho com link "Voltar", número e título do chamado, seletor de status à direita, e uma linha de metadados com setor, categoria, prioridade e data de abertura. Abaixo, três abas: Conversa (ativa), Histórico e Detalhes. Na aba Conversa, as mensagens do solicitante aparecem alinhadas à esquerda e as do atendente à direita, cada uma com autor e horário. No rodapé fixo, campo de texto e botão Enviar. -->

Conteúdo por aba:

| Aba | Conteúdo |
|-----|----------|
| Conversa | Mensagens entre solicitante e atendente, em ordem cronológica, com autor e horário. Campo de envio fixo no rodapé. |
| Histórico | Mudanças de status, atribuições de responsável e transferências entre setores, em ordem cronológica, com autor e horário. |
| Detalhes | Descrição original completa, categoria, setor, prioridade, responsável atual, datas de abertura e de última atualização. |

Ações no cabeçalho, conforme o perfil:

| Perfil | Ações disponíveis |
|--------|-------------------|
| Aluno, Professor (autor) | Enviar mensagem. Encerrar o próprio chamado. |
| Atendente | Assumir, alterar status, transferir de setor, enviar mensagem, encerrar. |
| Gestor | Tudo do Atendente, mais atribuir responsável a outro atendente. |

| Estado | Comportamento |
|--------|---------------|
| Sem mensagens | "Nenhuma mensagem ainda. Escreva a primeira." |
| Carregando | Esqueleto de 3 balões de mensagem. |
| Erro ao enviar | Balão marcado com "Não enviado" e botão "Tentar novamente"; texto preservado. |
| Encerrado | Campo de mensagem desabilitado, com aviso "Este chamado está encerrado." |
| Mensagem longa | Balão trunca em 6 linhas com link "ver mais". |

**Acessibilidade:** `h1` com número e título do chamado. Abas seguem o padrão de teclado: setas para trocar, Tab para entrar no painel. Lista de mensagens em região `aria-live="polite"` para anunciar novas mensagens. Mudança de status confirmada antes de aplicar.

## Tela 6 — Fila do Setor

Visão do atendente e do gestor sobre os chamados do seu setor. [B5]

```
+--------------------------------------------------------------------------+
| Fila do Setor - Secretaria                                               |
+--------------------------------------------------------------------------+
| [Nao atribuidos] [Meus] [Todos]   [Status v] [Categoria v] [busca...]    |
+--------------------------------------------------------------------------+
| # | Titulo            | Solicitante | Responsavel | Status    | Aberto ha|
+---+-------------------+-------------+-------------+-----------+----------+
| 42| Revisao de nota   | J. Silva    | --          | Aberto    | 2h       |
| 39| Falta lancada     | M. Souza    | Voce        | Em analise| 1d       |
| 35| Historico escolar | A. Lima     | C. Rocha    | Aguardando| 3d       |
+---+-------------------+-------------+-------------+-----------+----------+
|                     Mostrando 1-3 de 3        [< 1 >]                    |
+--------------------------------------------------------------------------+
```

<!-- Text fallback: título com o nome do setor. Abaixo, três abas de recorte (Não atribuídos, Meus, Todos), seguidas de filtros por status e categoria e campo de busca. Tabela com número, título, solicitante, responsável, status e tempo desde a abertura. Rodapé com contagem e paginação. -->

| Estado | Comportamento |
|--------|---------------|
| Fila vazia | "Nenhum chamado na fila deste setor." |
| Nada não atribuído | "Todos os chamados já têm responsável." |
| Carregando | Esqueleto de 5 linhas. |
| Erro | "Não foi possível carregar a fila do setor." com botão "Tentar novamente"; recorte e filtros preservados. |
| Muitos itens | Paginação; recorte e filtros preservados ao trocar de página. |

**Acessibilidade:** `h1` com o nome do setor. Coluna "Aberto há" traz o valor absoluto em `title` além do relativo. Ação "Assumir" disponível por teclado em cada linha.

## Tela 7 — Notificações

Painel aberto pelo sino da barra superior. [B7] Apenas notificações dentro do sistema; sem e-mail. [Q4 de scope-definition]

```
+------------------------------------------+
| Notificacoes            [marcar todas]   |
+------------------------------------------+
| * #42 respondido pela Secretaria    2h   |
| * #39 mudou para Em analise         1d   |
|   #35 transferido para Financeiro   3d   |
+------------------------------------------+
|            Ver todas                     |
+------------------------------------------+
```

<!-- Text fallback: painel com título "Notificações" e link "marcar todas" como lidas. Lista de itens; os não lidos têm um marcador à esquerda. Cada item traz o número do chamado, o que aconteceu e há quanto tempo. No rodapé, link "Ver todas". -->

| Estado | Comportamento |
|--------|---------------|
| Vazio | "Nenhuma notificação." |
| Todas lidas | Contador do sino desaparece; itens sem marcador. |
| Carregando | Esqueleto de 3 linhas. |
| Erro | "Não foi possível carregar suas notificações." com botão "Tentar novamente"; o painel permanece aberto. |

**Acessibilidade:** painel com `role="dialog"` e foco preso enquanto aberto; Escape fecha e devolve o foco ao sino. Não lido indicado por texto ("não lida") além do marcador visual. Contador do sino anunciado por `aria-label`.

## Tela 8 — Administração

Área de configuração do sistema. [B8]

**Atenção ao corte:** a aba **Usuários** desta tela não pertence a B8. Ela é a única superfície de interface de **B2 — Usuários e Perfis**, que é bloco Must have: cadastro de usuário, atribuição de perfil, consulta e edição. Se a área administrativa como interface dedicada (abas Setores, Categorias, Status e Prioridades) for cortada por falta de tempo, a gestão de usuários **permanece obrigatória** e precisa de uma tela própria, ainda que mínima — uma lista de usuários com criação e edição de perfil. As demais abas são Should have e podem ser cortadas juntas. [B2] [B8]

```
+--------------------------------------------------------------------------+
| Administracao                                                            |
+--------------------------------------------------------------------------+
| [Usuarios] [Setores] [Categorias] [Status] [Prioridades]                 |
+--------------------------------------------------------------------------+
|                                                  [ + Nova Categoria ]    |
| Nome            | Setor padrao   | Ativa | Acoes                         |
+-----------------+----------------+-------+-------------------------------+
| Matricula       | Secretaria     | Sim   | [editar] [desativar]          |
| Notas           | Secretaria     | Sim   | [editar] [desativar]          |
| Financeiro      | Financeiro     | Sim   | [editar] [desativar]          |
+-----------------+----------------+-------+-------------------------------+
```

<!-- Text fallback: título "Administração" seguido de abas por entidade administrável (Usuários, Setores, Categorias, Status, Prioridades). Dentro da aba ativa, botão de criação alinhado à direita e tabela com as colunas da entidade e uma coluna de ações com editar e desativar. -->

| Estado | Comportamento |
|--------|---------------|
| Vazio | "Nenhuma categoria cadastrada." com botão de criação. |
| Confirmação | Desativar pede confirmação, explicando o efeito sobre chamados existentes. |
| Erro | Mensagem inline na linha afetada, sem perder a tabela. |

**Acessibilidade:** `h1` "Administração", abas com padrão de teclado por setas. Diálogo de confirmação com foco preso e Escape para cancelar. Coluna "Ativa" com texto, não só ícone.

## Tela 9 — Painel de Indicadores (Could have)

Só é construída se houver folga; não faz parte do corte mínimo. [Q2 de scope-definition]

```
+--------------------------------------------------------------------------+
| Painel                          [Periodo: ultimos 30 dias v]             |
+--------------------------------------------------------------------------+
| +--------------+ +--------------+ +--------------+ +--------------+      |
| | Abertos      | | Em analise   | | Encerrados   | | Tempo medio  |      |
| |     18       | |      7       | |     43       | |    2,4 d     |      |
| +--------------+ +--------------+ +--------------+ +--------------+      |
|                                                                          |
| Por categoria                     Por setor                              |
| +----------------------------+    +----------------------------+         |
| | [barras horizontais]       |    | [barras horizontais]       |         |
| +----------------------------+    +----------------------------+         |
+--------------------------------------------------------------------------+
```

<!-- Text fallback: título "Painel" com seletor de período à direita. Faixa de quatro cartões numéricos (abertos, em análise, encerrados, tempo médio). Abaixo, dois gráficos de barras horizontais lado a lado: chamados por categoria e chamados por setor. -->

| Estado | Comportamento |
|--------|---------------|
| Sem dados no período | "Nenhum chamado no período selecionado." |
| Carregando | Esqueleto nos cartões e nos gráficos. |

**Acessibilidade:** cada gráfico acompanhado de uma tabela equivalente acessível por leitor de tela. Valores nos cartões com rótulo textual, nunca só número.

## Assumptions & Open Questions

- [assumption] O setor responsável é sugerido automaticamente a partir da categoria escolhida na abertura do chamado. Isso decorre do documento de escopo, que organiza chamados por categoria e setor, mas a regra exata (categoria fixa um setor, ou apenas sugere) não foi confirmada; a análise de requisitos precisa fechá-la.
- [assumption] O limite de 2000 caracteres na descrição é ilustrativo, para mostrar o contador na tela; o valor real será definido nos requisitos.
- [assumption] A tela de recuperação de senha aparece como link no login, mas seu fluxo não foi desenhado nesta etapa. Confirmar se está no escopo do corte mínimo.
- [assumption] As ações disponíveis por perfil na tela de detalhe refletem a divisão natural entre solicitante e atendente, mas a matriz completa de permissões só será fechada em Functional Design.

## Review

**Verdict:** READY
**Reviewer:** aidlc-product-lead-agent
**Date:** 2026-09-08T01:38:41Z
**Iteration:** 2
**Request Challenge:** review:17914cdcc64182e0b1e6240af2a55fdd

### Contexto desta passagem

Esta é uma passagem de recuperação, disparada apenas porque os bytes do artefato mudaram após o recibo anterior de READY. Confirmei que a mudança se limitou à normalização da coluna Status da tabela de achados para tokens simples; nenhum conteúdo de wireframe, fluxo ou escopo foi alterado.

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | wireframes.md > Tela 8 — Administração | B2 (Usuários e Perfis) é bloco Must have no intent-backlog.md, mas a única tela que expõe cadastro/edição de usuários era a aba "Usuários" dentro da Tela 8, rotulada apenas [B8] (Should have). | Adicionar nota explícita de que a aba "Usuários" pertence ao corte mínimo (B2) mesmo que o restante da Administração seja Should have, com fallback mínimo se B8 for cortado. | Resolved |
| R-02 | Minor | wireframes.md > Tela 7 — Notificações | A tag [Q4] sugeria erroneamente que a regra "sem e-mail" vinha da Q4 deste próprio Q\&A, quando na verdade vem da Q4 de scope-document.md. | Corrigir a tag para [Q4 de scope-definition]. | Resolved |
| R-03 | Minor | wireframes.md > Tela 6 — Fila do Setor e Tela 7 — Notificações | Ausência de um estado de "Erro" de carregamento, ao contrário das Telas 1, 3, 4 e 5. | Adicionar às Telas 6 e 7 uma linha de "Erro" análoga às demais telas de lista. | Resolved |
| R-04 | Minor | user-flow.md > Assumptions \& Open Questions; wireframes.md > Arquitetura de Navegação | O item "Início" aparecia na tabela por perfil, mas a Q2 eliminou a tela inicial única; a tensão ficou registrada apenas como [assumption]. | Decidir explicitamente, ainda nesta etapa, se "Início" existe como item de navegação ou se é removido da lateral. | Resolved |

### Summary

Reverifiquei os quatro achados anteriores diretamente no artefato: a nota de corte mínimo sobre a aba Usuários (B2) está presente na Tela 8, a tag de origem da regra "sem e-mail" foi corrigida na Tela 7, as Telas 6 e 7 agora têm linha de "Erro" no padrão das demais telas de lista, e a decisão sobre o item "Início" está registrada de forma explícita na seção de Arquitetura de Navegação, removendo a ambiguidade anterior. Não encontrei nenhuma alteração de conteúdo substantivo além da normalização da tabela de achados. O artefato permanece READY.
