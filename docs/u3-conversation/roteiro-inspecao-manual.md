# Roteiro de Inspeção Manual — U3 Conversa

- **Roteiro criado em:** 2026-09-23
- **Versão do sistema:** U3 Conversa (código gerado nesta data, antes do primeiro commit)
- **Situação:** pendente de execução pelo autor. Os resultados abaixo ficam em branco até a passagem manual; nenhum item foi dado como aprovado sem ser observado.

Este roteiro cobre, **na aba Conversa do detalhe do chamado**, os critérios que o projeto não verifica por teste automatizado de navegador, por decisão registrada em `team.md` e em `stories.md`: AC5.3.1, AC5.3.2, AC5.3.5, AC5.3.6 e AC5.4.1. Os critérios AC5.3.3 (rótulo associado ao campo) e AC5.3.4 (informação em texto além da cor) também têm teste de componente na aba; ver a [tabela de rastreabilidade](rastreabilidade-requisitos-testes.md).

A U3 não cria página, rota nem item de menu: acrescenta uma aba ao detalhe do chamado. A casca, o tema e o menu recolhível já foram inspecionados em U1 ([roteiro da U1](../u1-foundation/roteiro-inspecao-manual.md)); as telas de chamados, em U2 ([roteiro da U2](../u2-tickets/roteiro-inspecao-manual.md)). Aqui eles só reaparecem quando a aba nova muda alguma coisa.

## Preparação

1. Suba o sistema com `docker compose up --build` e abra `http://localhost:8080` num navegador atual (Chrome, Edge ou Firefox).
2. Pela Administração, tenha cadastrados: dois setores (por exemplo Secretaria e Financeiro), uma categoria ativa em cada um, um Aluno, dois Atendentes da Secretaria, um Gestor da Secretaria e um Atendente do Financeiro.
3. Com o Aluno, abra três chamados na categoria da Secretaria:
   - **Chamado A** — um Atendente da Secretaria assume; troque pelo menos oito mensagens entre o Aluno e o Atendente, sendo uma delas com mais de dez linhas e outra com mais de 2000 caracteres tentados (para ver a recusa);
   - **Chamado B** — deixe sem responsável, com uma mensagem do Aluno;
   - **Chamado C** — o Atendente assume, troca duas mensagens e o Aluno encerra.
4. **Chamado D** — abra um quarto chamado, o Atendente da Secretaria assume, troca uma mensagem e transfere para o Financeiro (para inspecionar o leitor por passagem de setor).
5. Para medir contraste, use as ferramentas de desenvolvedor do navegador (inspeção de cor com razão de contraste) ou uma extensão de auditoria de acessibilidade.
6. Para a largura de 375px, use o modo de dispositivo das ferramentas de desenvolvedor com largura de 375px.

## Telas cobertas

| Tela                                  | Como chegar                                                                                  |
| ------------------------------------- | -------------------------------------------------------------------------------------------- |
| Detalhe do Chamado — aba **Conversa** | Abrir um chamado (`/tickets/{id}`) e acionar a terceira aba, ao lado de Detalhes e Histórico |
| Aba Conversa — conversa longa         | No Chamado A, o botão "Carregar mensagens anteriores" no topo da lista                       |
| Aba Conversa — somente leitura        | No Chamado D, entrando como Atendente da Secretaria (setor de passagem)                      |
| Aba Conversa — chamado encerrado      | No Chamado C, com o campo de envio desabilitado                                              |
| Aba ausente                           | Entrando como Administrador em qualquer chamado                                              |

## Itens de verificação

Preencha a coluna **Resultado** com `Aprovado` ou `Reprovado` e, se reprovado, descreva o problema em **Observações**.

### AC5.3.1 — Uso só pelo teclado

| #   | Passos                                                                                                            | Esperado                                                                                           | Resultado | Observações |
| --- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------- | ----------- |
| 1.1 | No Chamado A, foque a lista de abas e use as setas esquerda e direita até chegar em Conversa.                     | A aba ativa muda entre Detalhes, Histórico e Conversa e o painel correspondente aparece.           |           |             |
| 1.2 | Já na aba Conversa, percorra com Tab: "Atualizar", "Carregar mensagens anteriores", "Ver mais", campo e "Enviar". | Todos são alcançáveis e acionáveis por Enter ou Espaço; a ordem segue a leitura da tela.           |           |             |
| 1.3 | Escreva e envie uma mensagem usando só o teclado.                                                                 | O envio acontece, o campo é limpo e o foco volta para o campo, sem uso do rato.                    |           |             |
| 1.4 | Acione "Carregar mensagens anteriores" com Enter e, em seguida, "Atualizar" com Espaço.                           | As duas ações são executadas; a posição de leitura é mantida ao carregar as anteriores.            |           |             |
| 1.5 | Numa mensagem longa, acione "Ver mais" e depois "Ver menos" pelo teclado.                                         | O corpo expande e volta a dobrar; o foco permanece no próprio botão.                               |           |             |
| 1.6 | Entre como Atendente do Financeiro num chamado que nunca passou pelo setor dele e tente alcançar a aba Conversa.  | A aba não permanece na lista: ela é retirada e o foco volta para a aba Detalhes, sem revelar nada. |           |             |
| 1.7 | No Chamado C (encerrado), percorra a aba Conversa com Tab.                                                        | O campo desabilitado e o botão "Enviar" desabilitado são pulados; o restante continua alcançável.  |           |             |

### AC5.3.2 — Indicador de foco visível

| #   | Passos                                                                                                     | Esperado                                                          | Resultado | Observações |
| --- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | --------- | ----------- |
| 2.1 | Percorra com Tab toda a aba Conversa do Chamado A, incluindo o contentor rolável das mensagens.            | Todo elemento focado exibe anel ou borda de foco visível.         |           |             |
| 2.2 | Force uma falha de envio (desligue a rede nas ferramentas de desenvolvedor) e percorra "Tentar novamente". | O botão do balão "Não enviado" mostra foco visível e é acionável. |           |             |

### AC5.3.5 — Contraste mínimo

| #   | Passos                                                                                                                 | Esperado                                                              | Resultado | Observações |
| --- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | --------- | ----------- |
| 5.1 | Meça o contraste do corpo da mensagem e da linha de autor e momento (texto auxiliar em cinza) nos dois lados do balão. | Todos os pares de texto e fundo atendem o mínimo de WCAG 2.1 nível A. |           |             |
| 5.2 | Meça o contador de caracteres, o aviso "Este chamado está encerrado." e a mensagem de erro do envio recusado.          | Atendem o mínimo exigido.                                             |           |             |
| 5.3 | Meça a marca "Não enviado" e a borda do balão de falha sobre o fundo da aba.                                           | Atende o mínimo exigido.                                              |           |             |

### AC5.3.6 — Tema padrão do Shadcn sem cores sobrescritas

| #   | Passos                                                                                                                                 | Esperado                                                                                                                     | Resultado | Observações |
| --- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------- | ----------- |
| 6.1 | Na raiz do repositório, execute `grep -rnE "#[0-9a-fA-F]{3,8}\b\|rgb\(\|hsl\(\|oklch\(\|\[color:" apps/web/src/features/conversation`. | Nenhuma cor literal na aba Conversa; só tokens do tema (`bg-card`, `bg-muted`, `text-muted-foreground`, `text-destructive`). |           |             |
| 6.2 | Observe o balão do solicitante e o do atendimento, lado a lado.                                                                        | O autor está sempre escrito no balão; o lado e o fundo são reforço, nunca a única informação.                                |           |             |
| 6.3 | Observe o balão de falha de envio.                                                                                                     | "Não enviado" aparece por escrito; a borda vermelha é reforço, não a única pista.                                            |           |             |

### AC5.4.1 — Telas do solicitante sem rolagem horizontal em 375px

| #   | Passos                                                                                                         | Esperado                                                                                    | Resultado | Observações |
| --- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --------- | ----------- |
| 4.1 | Em 375px, entre como Aluno e abra o Chamado A na aba Conversa, com as mensagens longas carregadas.             | A página não rola na horizontal; os balões quebram linha e ocupam a largura útil.           |           |             |
| 4.2 | Em 375px, verifique a lista de abas com as três abas (Detalhes, Histórico, Conversa).                          | A lista de abas cabe ou rola dentro do próprio contentor, sem rolagem horizontal da página. |           |             |
| 4.3 | Em 375px, escreva uma mensagem longa no campo e observe o campo, o contador e o botão "Enviar".                | Nada transborda; o campo ocupa a largura útil e o botão continua visível.                   |           |             |
| 4.4 | Em 375px, cole no campo um texto de uma só palavra com mais de 100 caracteres e envie; observe o balão gerado. | O balão quebra a palavra e não provoca rolagem horizontal da página.                        |           |             |

## Observações gerais da passagem

_Preencha aqui qualquer problema que não caiba na tabela, com a tela e a largura em que foi observado._
