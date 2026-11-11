# Roteiro de Inspeção Manual — U5 Avaliação

- **Roteiro criado em:** 2026-09-26
- **Versão do sistema:** U5 Avaliação (código gerado nesta data, antes do primeiro commit)
- **Situação:** pendente de execução pelo autor. Os resultados abaixo ficam em branco até a passagem manual; nenhum item foi dado como aprovado sem ser observado.

Este roteiro cobre, **no bloco de avaliação dentro da aba Detalhes do chamado** e **no cartão de avaliação do Painel**, os critérios que o projeto não verifica por teste automatizado de navegador, por decisão registrada em `team.md` e em `project.md`: AC5.3.1, AC5.3.2, AC5.3.5, AC5.3.6 e AC5.4.1. Os critérios AC5.3.3 (rótulo associado ao campo) e AC5.3.4 (informação em texto além da cor) também têm teste de componente nas telas novas; ver a [tabela de rastreabilidade](rastreabilidade-requisitos-testes.md).

A U5 não acrescenta página, rota nem item de navegação: ela abre dois espaços dentro de telas que já existem. A casca, o tema e o menu recolhível já foram inspecionados em U1 ([roteiro da U1](../u1-foundation/roteiro-inspecao-manual.md)); o detalhe do chamado, em U2 ([roteiro da U2](../u2-tickets/roteiro-inspecao-manual.md)); a aba Conversa, em U3 ([roteiro da U3](../u3-conversation/roteiro-inspecao-manual.md)); o Painel, em U4 ([roteiro da U4](../u4-reporting/roteiro-inspecao-manual.md)). Aqui eles só reaparecem quando o bloco novo muda alguma coisa.

## Preparação

1. Suba o sistema com `docker compose up --build` e abra `http://localhost:8080` num navegador atual (Chrome, Edge ou Firefox).
2. Pela Administração, tenha cadastrados: dois setores (por exemplo Secretaria e Financeiro), pelo menos uma categoria ativa em cada, um Aluno, um Professor, um Atendente da Secretaria, um Gestor da Secretaria, um Atendente do Financeiro e o Administrador inicial.
3. Com o Aluno, abra e deixe nos seguintes estados:
   - um chamado **encerrado e ainda não avaliado** (é o que recebe o formulário);
   - um segundo **encerrado e ainda não avaliado**, para repetir o envio sem gastar o primeiro;
   - um chamado **encerrado, avaliado com nota 5 e com comentário longo** (mais de dez linhas, para observar a exibição);
   - um chamado **encerrado, avaliado sem comentário**;
   - um chamado **aberto** e outro **em análise** (nenhum dos dois pode mostrar bloco de avaliação);
   - um chamado **avaliado e depois reaberto**, deixado aberto.
4. Com o Professor, abra e encerre um chamado próprio, para conferir que o formulário também aparece para ele.
5. Peça ao Atendente da Secretaria que assuma pelo menos um dos chamados avaliados, e transfira um deles para o Financeiro depois de encerrado, para observar a leitura por setor de passagem.
6. Anote a nota e o comentário de cada avaliação: eles são a conferência dos números do Painel.
7. Para medir contraste, use as ferramentas de desenvolvedor do navegador (inspeção de cor com razão de contraste) ou uma extensão de auditoria de acessibilidade.
8. Para a largura de 375px, use o modo de dispositivo das ferramentas de desenvolvedor com largura de 375px.

## Telas cobertas

| Tela                                              | Como chegar                                                                                           |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Detalhe do chamado — **formulário de avaliação**  | Entrar como Aluno e abrir um chamado encerrado e ainda não avaliado; aba Detalhes                     |
| Detalhe do chamado — **avaliação registrada**     | Entrar como Aluno e abrir um chamado já avaliado; aba Detalhes                                        |
| Detalhe do chamado — **leitura pelo atendimento** | Entrar como Atendente, Gestor ou Administrador e abrir um chamado avaliado                            |
| Detalhe do chamado — **sem bloco algum**          | Abrir um chamado aberto ou em análise, e um chamado encerrado sem avaliação com perfil que não avalia |
| Diálogo de confirmação                            | No formulário, escolher uma nota e acionar "Enviar avaliação"                                         |
| Painel — cartão de avaliação                      | Entrar como Gestor ou Administrador e acionar "Painel" no menu lateral (`/reports`)                   |
| Painel — período sem avaliação                    | Escolher um período no futuro (por exemplo, o mês que vem)                                            |

## Itens de verificação

Preencha a coluna **Resultado** com `Aprovado` ou `Reprovado` e, se reprovado, descreva o problema em **Observações**.

### AC5.3.1 — Uso só pelo teclado

| #   | Passos                                                                                                                           | Esperado                                                                                  | Resultado | Observações |
| --- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | --------- | ----------- |
| 1.1 | Como Aluno, num chamado encerrado e não avaliado, alcance o bloco de avaliação apenas com Tab, partindo do topo da aba Detalhes. | O bloco é alcançado sem o rato, depois da descrição do chamado.                           |           |             |
| 1.2 | Com o foco no primeiro botão de nota, use as setas para cima e para baixo.                                                       | A escolha percorre as cinco notas, como um grupo de opções exclusivas, sem pular nenhuma. |           |             |
| 1.3 | Escolha uma nota com Espaço e siga com Tab até o campo de comentário.                                                            | A nota fica marcada; o campo de comentário recebe o foco em seguida.                      |           |             |
| 1.4 | Escreva um comentário e alcance o botão "Enviar avaliação" com Tab, acionando com Enter.                                         | O diálogo de confirmação abre.                                                            |           |             |
| 1.5 | Com o diálogo aberto, percorra com Tab.                                                                                          | O foco fica preso dentro do diálogo e alterna entre "Cancelar" e "Enviar avaliação".      |           |             |
| 1.6 | Pressione Escape com o diálogo aberto.                                                                                           | O diálogo fecha, nada é enviado, e o foco volta para o botão que o abriu.                 |           |             |
| 1.7 | Reabra o diálogo e confirme com Enter.                                                                                           | A avaliação é enviada e o bloco passa a exibir a avaliação registrada, sem nenhum clique. |           |             |
| 1.8 | Provoque um erro de envio (desligue a rede nas ferramentas de desenvolvedor) e repita o envio pelo teclado.                      | A mensagem de erro é alcançável e a nota e o comentário continuam preenchidos.            |           |             |
| 1.9 | Como Gestor, percorra a aba Indicadores inteira com Tab.                                                                         | O cartão de avaliação não captura o foco sem motivo e não vira armadilha de foco.         |           |             |

### AC5.3.2 — Indicador de foco visível

| #   | Passos                                                                         | Esperado                                                                          | Resultado | Observações |
| --- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- | --------- | ----------- |
| 2.1 | Percorra com Tab as cinco opções de nota.                                      | Cada opção focada exibe anel ou borda de foco visível, na própria linha da opção. |           |             |
| 2.2 | Foque o campo de comentário.                                                   | O campo exibe anel de foco visível e o contador continua legível.                 |           |             |
| 2.3 | Foque o botão "Enviar avaliação" e, com o diálogo aberto, os dois botões dele. | Todos exibem foco visível.                                                        |           |             |
| 2.4 | No estado de erro do bloco, foque "Tentar novamente".                          | O botão exibe foco visível.                                                       |           |             |

### AC5.3.3 — Rótulo visível associado ao campo

| #   | Passos                                                 | Esperado                                                                                      | Resultado | Observações |
| --- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------- | --------- | ----------- |
| 3.1 | Observe o grupo de notas.                              | O grupo tem título visível ("Sua nota para o atendimento") e cada opção tem o rótulo escrito. |           |             |
| 3.2 | Observe o campo de comentário.                         | Tem rótulo visível acima ("Comentário (opcional)"), não apenas texto de exemplo dentro.       |           |             |
| 3.3 | Ligue um leitor de tela e foque o campo de comentário. | Ele lê o rótulo e o contador de caracteres associados ao campo.                               |           |             |

### AC5.3.4 — Informação nunca só por cor ou por ícone

| #   | Passos                                                         | Esperado                                                                                                 | Resultado | Observações |
| --- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------- | ----------- |
| 4.1 | Observe as cinco opções de nota.                               | Cada uma traz o número e o rótulo escrito (1 — Muito ruim até 5 — Muito bom); não há estrela nem só cor. |           |             |
| 4.2 | Observe a avaliação registrada num chamado já avaliado.        | A nota aparece com o rótulo em texto ao lado, e a data está escrita por extenso.                         |           |             |
| 4.3 | No Painel, observe o cartão de avaliação com e sem avaliações. | Sem avaliação aparece um traço e a frase explicativa, nunca um zero e nunca só uma cor diferente.        |           |             |
| 4.4 | No cartão do Painel, observe o valor.                          | A escala ("De 1 a 5") e a base ("Base: N avaliações") estão escritas ao lado do número.                  |           |             |

### AC5.3.5 — Contraste mínimo

| #   | Passos                                                                                                        | Esperado                                                              | Resultado | Observações |
| --- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | --------- | ----------- |
| 5.1 | Meça o contraste do título do bloco, do aviso de que a avaliação é definitiva e dos rótulos das cinco opções. | Todos os pares de texto e fundo atendem o mínimo de WCAG 2.1 nível A. |           |             |
| 5.2 | Meça o contraste do contador de caracteres e da mensagem de erro abaixo do campo.                             | Atendem o mínimo exigido.                                             |           |             |
| 5.3 | Meça o contraste do texto dentro do diálogo de confirmação e dos seus dois botões.                            | Atendem o mínimo exigido.                                             |           |             |
| 5.4 | Meça o contraste da nota, do comentário e da data na avaliação registrada.                                    | Atendem o mínimo exigido.                                             |           |             |
| 5.5 | No Painel, meça o valor do cartão de avaliação e o texto auxiliar em cinza abaixo dele.                       | Atendem o mínimo exigido.                                             |           |             |

### AC5.3.6 — Tema padrão do Shadcn sem cores sobrescritas

| #   | Passos                                                                                                                           | Esperado                                                                                                | Resultado | Observações |
| --- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------- | ----------- |
| 6.1 | Na raiz do repositório, execute `grep -rnE "#[0-9a-fA-F]{3,8}\b\|rgb\(\|hsl\(\|oklch\(\|\[color:" apps/web/src/features/rating`. | Nenhuma cor literal no bloco de avaliação; só tokens do tema (`text-muted-foreground`, `border-input`). |           |             |
| 6.2 | Observe a opção de nota escolhida.                                                                                               | A escolha é indicada pelo próprio controlo de opção, não por uma cor de fundo inventada.                |           |             |
| 6.3 | Observe o comentário longo de dez linhas.                                                                                        | O texto aparece na íntegra, com as quebras de linha preservadas e sem nenhuma formatação interpretada.  |           |             |
| 6.4 | Escreva um comentário com `**texto**` e `<b>texto</b>` e envie.                                                                  | O comentário aparece exatamente como foi escrito; nada vira negrito e nenhuma marcação é interpretada.  |           |             |

### AC5.4.1 — Telas do Solicitante sem rolagem horizontal em 375px

| #   | Passos                                                                                | Esperado                                                                           | Resultado | Observações |
| --- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | --------- | ----------- |
| 7.1 | Em 375px, como Aluno, abra um chamado encerrado e não avaliado na aba Detalhes.       | A página não rola na horizontal; as cinco opções empilham e cabem na largura útil. |           |             |
| 7.2 | Em 375px, escreva um comentário longo numa única linha, sem espaços.                  | O texto quebra dentro do campo; nada transborda e a página não rola na horizontal. |           |             |
| 7.3 | Em 375px, abra o diálogo de confirmação.                                              | O diálogo cabe na largura, os dois botões continuam alcançáveis e nada é cortado.  |           |             |
| 7.4 | Em 375px, observe a avaliação registrada com o comentário longo de dez linhas.        | O comentário quebra dentro do bloco; a página não rola na horizontal.              |           |             |
| 7.5 | Em 375px, como Gestor, observe a grade com os dois cartões de tempo e o de avaliação. | Os três empilham um abaixo do outro; a página não rola na horizontal.              |           |             |

### Conferência do comportamento (US6.3)

Não é critério de acessibilidade, mas é o que prova que a avaliação faz o que promete.

| #    | Passos                                                                                       | Esperado                                                                                                                  | Resultado | Observações |
| ---- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------- | ----------- |
| 8.1  | Como Aluno, abra um chamado **aberto** e outro **em análise**.                               | Não aparece bloco de avaliação nenhum, nem aviso de pendência.                                                            |           |             |
| 8.2  | Como Aluno, encerre um chamado e recarregue o detalhe.                                       | O formulário de avaliação aparece na aba Detalhes, abaixo da descrição, e não numa aba nova.                              |           |             |
| 8.3  | Acione "Enviar avaliação" sem escolher nota.                                                 | A mensagem "Escolha uma nota para enviar a avaliação." aparece e nada é enviado.                                          |           |             |
| 8.4  | Envie a avaliação e recarregue a página.                                                     | O formulário deu lugar à avaliação registrada, com nota, rótulo, comentário e data; não há botão de editar nem de apagar. |           |             |
| 8.5  | Como Professor, encerre um chamado próprio e avalie.                                         | O formulário aparece e o envio funciona igual ao do Aluno.                                                                |           |             |
| 8.6  | Como Atendente responsável, abra o mesmo chamado avaliado.                                   | A avaliação aparece em leitura; não há formulário nem botão de avaliar.                                                   |           |             |
| 8.7  | Como Atendente do Financeiro, abra o chamado transferido e já encerrado e avaliado.          | A avaliação aparece em leitura, pela passagem do chamado pelo setor.                                                      |           |             |
| 8.8  | Como Administrador, abra um chamado avaliado.                                                | A avaliação aparece em leitura (ao contrário da aba Conversa, que ele não vê).                                            |           |             |
| 8.9  | Como Atendente, abra um chamado encerrado e **não** avaliado.                                | Não aparece bloco algum: nem formulário, nem aviso de que falta avaliar.                                                  |           |             |
| 8.10 | Como Aluno, reabra um chamado já avaliado e abra o detalhe.                                  | Não aparece bloco de avaliação enquanto o chamado estiver aberto; nada foi apagado.                                       |           |             |
| 8.11 | Encerre de novo esse chamado reaberto e abra o detalhe.                                      | A avaliação anterior reaparece, inalterada, e não há formulário para uma segunda.                                         |           |             |
| 8.12 | Com duas abas abertas no mesmo chamado encerrado e não avaliado, envie a avaliação nas duas. | A segunda recebe o aviso "Este chamado já foi avaliado." e passa a exibir a avaliação da primeira.                        |           |             |
| 8.13 | Encerre um chamado sem avaliar e observe "Meus Chamados".                                    | O chamado aparece como qualquer outro encerrado, sem marca de avaliação pendente.                                         |           |             |
| 8.14 | Como Gestor, confira o cartão de avaliação do Painel contra as notas anotadas na preparação. | A média e a quantidade correspondem às avaliações dos chamados encerrados no período, só do que o Gestor vê.              |           |             |
| 8.15 | Compare o cartão do Gestor com o do Administrador, no mesmo período.                         | O do Administrador conta as avaliações de todos os setores; o do Gestor, só as que ele vê.                                |           |             |
| 8.16 | Escolha um período sem nenhuma avaliação.                                                    | O cartão mostra um traço e a frase explicativa, nunca um zero.                                                            |           |             |
| 8.17 | Procure, em qualquer estado do Painel, o comentário de alguma avaliação.                     | O comentário nunca aparece no Painel; só dentro do chamado.                                                               |           |             |
| 8.18 | Como Aluno ou Atendente, tente abrir `/api/v1/reports/ratings` digitando o endereço.         | A API recusa com 403.                                                                                                     |           |             |

## Observações gerais da passagem

_Preencha aqui qualquer problema que não caiba na tabela, com a tela e a largura em que foi observado._
