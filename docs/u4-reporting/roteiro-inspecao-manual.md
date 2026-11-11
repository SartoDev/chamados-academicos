# Roteiro de Inspeção Manual — U4 Indicadores

- **Roteiro criado em:** 2026-09-24
- **Versão do sistema:** U4 Indicadores (código gerado nesta data, antes do primeiro commit)
- **Situação:** pendente de execução pelo autor. Os resultados abaixo ficam em branco até a passagem manual; nenhum item foi dado como aprovado sem ser observado.

Este roteiro cobre, **no Painel** (aba Indicadores e aba Consulta), os critérios que o projeto não verifica por teste automatizado de navegador, por decisão registrada em `team.md` e em `project.md`: AC5.3.1, AC5.3.2, AC5.3.5, AC5.3.6 e AC5.4.4. Os critérios AC5.3.3 (rótulo associado ao campo) e AC5.3.4 (informação em texto além da cor) também têm teste de componente nas telas novas; ver a [tabela de rastreabilidade](rastreabilidade-requisitos-testes.md).

A U4 acrescenta um item de navegação ("Painel"), uma rota (`/reports`) e duas abas dentro dela. A casca, o tema e o menu recolhível já foram inspecionados em U1 ([roteiro da U1](../u1-foundation/roteiro-inspecao-manual.md)); as telas de chamados, em U2 ([roteiro da U2](../u2-tickets/roteiro-inspecao-manual.md)); a aba Conversa, em U3 ([roteiro da U3](../u3-conversation/roteiro-inspecao-manual.md)). Aqui eles só reaparecem quando a tela nova muda alguma coisa.

## Preparação

1. Suba o sistema com `docker compose up --build` e abra `http://localhost:8080` num navegador atual (Chrome, Edge ou Firefox).
2. Pela Administração, tenha cadastrados: dois setores (por exemplo Secretaria e Financeiro), pelo menos duas categorias ativas na Secretaria e uma no Financeiro, um Aluno, um Atendente da Secretaria, um Gestor da Secretaria, um Atendente do Financeiro e o Administrador inicial.
3. Com o Aluno, abra pelo menos seis chamados nas categorias da Secretaria e dois nas do Financeiro, distribuídos assim:
   - dois deixados **abertos**, sem responsável;
   - um **em análise**, assumido pelo Atendente da Secretaria;
   - um **aguardando solicitante**;
   - um **encerrado** depois de assumido (entra nas duas médias);
   - um **encerrado sem nunca ter tido responsável** (entra só na média de resolução);
   - um **transferido da Secretaria para o Financeiro** (o Gestor da Secretaria continua vendo-o);
   - um **encerrado e reaberto**, deixado aberto (não entra em nenhuma média).
4. Anote a data de abertura e a de encerramento de cada um: elas são a conferência dos números do painel.
5. Para medir contraste, use as ferramentas de desenvolvedor do navegador (inspeção de cor com razão de contraste) ou uma extensão de auditoria de acessibilidade.
6. Para a largura de 375px, use o modo de dispositivo das ferramentas de desenvolvedor com largura de 375px.

## Telas cobertas

| Tela                                  | Como chegar                                                                     |
| ------------------------------------- | ------------------------------------------------------------------------------- |
| Painel — aba **Indicadores** (Gestor) | Entrar como Gestor e acionar "Painel" no menu lateral (`/reports`)              |
| Painel — aba **Indicadores** (Admin)  | Entrar como Administrador e acionar "Painel"; aqui aparece o gráfico por setor  |
| Painel — aba **Consulta**             | Como Gestor, acionar a segunda aba do Painel                                    |
| Painel — período vazio                | Escolher um período no futuro (por exemplo, o mês que vem)                      |
| Painel — estado de erro               | Desligar a rede nas ferramentas de desenvolvedor e recarregar a aba Indicadores |
| Navegação sem o item                  | Entrar como Aluno, Professor ou Atendente e conferir a ausência de "Painel"     |

## Itens de verificação

Preencha a coluna **Resultado** com `Aprovado` ou `Reprovado` e, se reprovado, descreva o problema em **Observações**.

### AC5.3.1 — Uso só pelo teclado

| #   | Passos                                                                                                    | Esperado                                                                                                 | Resultado | Observações |
| --- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------- | ----------- |
| 1.1 | Como Gestor, alcance o item "Painel" do menu lateral apenas com Tab e acione-o com Enter.                 | A página do Painel abre; nenhum passo exigiu o rato.                                                     |           |             |
| 1.2 | Percorra com Tab: campo "Início", campo "Fim", aba Indicadores, aba Consulta.                             | Todos são alcançáveis, na ordem em que aparecem na tela.                                                 |           |             |
| 1.3 | Com o foco na lista de abas, use as setas esquerda e direita.                                             | A aba ativa alterna entre Indicadores e Consulta e o painel correspondente aparece.                      |           |             |
| 1.4 | Altere o período usando só o teclado (digitação da data ou setas para cima e para baixo no campo).        | Os números do painel são recarregados sem nenhum clique.                                                 |           |             |
| 1.5 | Na aba Consulta, percorra os três seletores de filtro, o botão "Limpar filtros" e os botões de paginação. | Todos são alcançáveis e acionáveis por Enter ou Espaço.                                                  |           |             |
| 1.6 | Na aba Consulta, alcance o contentor rolável da tabela com Tab e role-o com as setas.                     | O contentor recebe foco e rola por teclado, sem rolar a página inteira.                                  |           |             |
| 1.7 | Provoque o estado de erro (rede desligada) e acione "Tentar novamente" pelo teclado.                      | A nova tentativa acontece e o período escolhido continua o mesmo.                                        |           |             |
| 1.8 | Como Administrador, percorra a aba Indicadores inteira com Tab.                                           | Nada dentro dos cartões e dos gráficos captura o foco sem motivo; os gráficos não são armadilha de foco. |           |             |

### AC5.3.2 — Indicador de foco visível

| #   | Passos                                                                                                 | Esperado                                                           | Resultado | Observações |
| --- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ | --------- | ----------- |
| 2.1 | Percorra com Tab o item "Painel", os dois campos de data e as duas abas.                               | Todo elemento focado exibe anel ou borda de foco visível.          |           |             |
| 2.2 | Na aba Consulta, percorra os filtros, "Limpar filtros", os links de título dos chamados e a paginação. | Todos exibem foco visível, inclusive os links dentro da tabela.    |           |             |
| 2.3 | Foque o contentor rolável da tabela da Consulta.                                                       | O contentor exibe anel de foco, deixando claro que ele é que rola. |           |             |

### AC5.3.5 — Contraste mínimo

| #   | Passos                                                                                                             | Esperado                                                              | Resultado | Observações |
| --- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- | --------- | ----------- |
| 5.1 | Meça o contraste do número grande de cada cartão de quantidade e do texto auxiliar em cinza abaixo dele.           | Todos os pares de texto e fundo atendem o mínimo de WCAG 2.1 nível A. |           |             |
| 5.2 | Meça o contraste do valor e do texto de base ("Base: N chamados") nos dois cartões de tempo.                       | Atendem o mínimo exigido.                                             |           |             |
| 5.3 | Meça o contraste das barras dos gráficos contra o fundo da trilha, e o do rótulo e da quantidade ao lado da barra. | Atendem o mínimo exigido.                                             |           |             |
| 5.4 | Meça a mensagem de período inválido ao lado do seletor e a mensagem do estado de erro.                             | Atendem o mínimo exigido.                                             |           |             |

### AC5.3.6 — Tema padrão do Shadcn sem cores sobrescritas

| #   | Passos                                                                                                                            | Esperado                                                                                                        | Resultado | Observações |
| --- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------- | ----------- |
| 6.1 | Na raiz do repositório, execute `grep -rnE "#[0-9a-fA-F]{3,8}\b\|rgb\(\|hsl\(\|oklch\(\|\[color:" apps/web/src/features/reports`. | Nenhuma cor literal nas telas do Painel; só tokens do tema (`bg-primary`, `bg-muted`, `text-muted-foreground`). |           |             |
| 6.2 | Observe as barras dos dois gráficos.                                                                                              | Rótulo e quantidade estão escritos ao lado de cada barra; a largura é reforço, nunca a única informação.        |           |             |
| 6.3 | Observe os dois cartões de tempo com e sem amostra.                                                                               | Sem amostra aparece um traço e a frase explicativa, nunca um zero e nunca só uma cor diferente.                 |           |             |
| 6.4 | Ligue um leitor de tela e percorra cada gráfico.                                                                                  | Ele lê a tabela equivalente, com rótulo e quantidade de cada item, e não anuncia as barras duas vezes.          |           |             |

### AC5.4.4 — Telas de gestão sem rolagem horizontal em 375px

| #   | Passos                                                                         | Esperado                                                                                          | Resultado | Observações |
| --- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | --------- | ----------- |
| 4.1 | Em 375px, como Gestor, abra o Painel na aba Indicadores.                       | A página não rola na horizontal; os cartões empilham um abaixo do outro.                          |           |             |
| 4.2 | Em 375px, observe o seletor de período.                                        | Os dois campos e o texto de apoio quebram linha e cabem na largura útil.                          |           |             |
| 4.3 | Em 375px, observe a lista de abas (Indicadores, Consulta).                     | A lista cabe ou rola dentro do próprio contentor, sem rolagem horizontal da página.               |           |             |
| 4.4 | Em 375px, observe os gráficos de barras, com um rótulo de categoria bem longo. | O rótulo é truncado ou quebra dentro do cartão; a barra não provoca rolagem horizontal da página. |           |             |
| 4.5 | Em 375px, abra a aba Consulta com pelo menos cinco chamados listados.          | A tabela dá lugar à lista de cartões; a página não rola na horizontal.                            |           |             |
| 4.6 | Em 375px, aplique os três filtros ao mesmo tempo e acione "Limpar filtros".    | Os seletores empilham, todos continuam utilizáveis e nada transborda.                             |           |             |
| 4.7 | Em 375px, como Administrador, observe os dois gráficos (categoria e setor).    | Um fica abaixo do outro; nenhum provoca rolagem horizontal.                                       |           |             |

### Conferência dos números (US6.1, US6.2)

Não é critério de acessibilidade, mas é o que prova que o painel diz a verdade.

| #   | Passos                                                                                                | Esperado                                                                                                         | Resultado | Observações |
| --- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------- | ----------- |
| 7.1 | Como Gestor, confira os quatro cartões de quantidade contra os chamados que você criou na preparação. | Os quatro status aparecem, com zero nos que não têm chamado no período.                                          |           |             |
| 7.2 | Compare os números do Gestor com os do Administrador, no mesmo período.                               | Os do Administrador são maiores ou iguais; o chamado que nunca passou pela Secretaria não aparece para o Gestor. |           |             |
| 7.3 | Confira o cartão de tempo de resolução e o de atendimento.                                            | A base do de atendimento é menor, porque o chamado encerrado sem responsável entra só na de resolução.           |           |             |
| 7.4 | Escolha um período que não contenha nenhum chamado (por exemplo, o mês que vem).                      | Aparece "Nenhum chamado no período selecionado.", e não uma fila de zeros.                                       |           |             |
| 7.5 | Recarregue a página com o período escolhido e copie o endereço para outra aba.                        | O painel volta no mesmo recorte: o período está no endereço.                                                     |           |             |
| 7.6 | Na aba Consulta, combine status, categoria e setor, e depois avance de página.                        | A listagem reflete a combinação e os filtros continuam aplicados na página seguinte.                             |           |             |
| 7.7 | Procure, em qualquer estado das duas abas, um botão de exportar, baixar, CSV ou PDF.                  | Não existe nenhum; nem ação na tela, nem rota correspondente.                                                    |           |             |
| 7.8 | Entre como Aluno, Professor e Atendente e tente abrir `/reports` digitando o endereço.                | O item não aparece no menu e a página responde "Acesso negado"; a API recusa com 403.                            |           |             |

## Observações gerais da passagem

_Preencha aqui qualquer problema que não caiba na tabela, com a tela e a largura em que foi observado._
