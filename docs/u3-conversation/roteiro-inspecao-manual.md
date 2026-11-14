# Roteiro de Inspeção Manual — U3 Conversa

- **Roteiro criado em:** 2026-09-23
- **Versão do sistema:** U3 Conversa (código gerado nesta data, antes do primeiro commit)
- **Situação:** **executado em 2026-11-13**, em inspeção assistida por agente no Google Chrome do autor, com observação simultânea do autor, sobre o sistema em Docker Compose local (`http://localhost:8080`, Node 24.11.1, Docker Engine 29.7.2). Cada medida foi tirada com o viewport conferido antes e com controle positivo do instrumento de contraste (preto sobre branco = 21; `#767676` sobre branco = 4,54). Nenhum item recebeu `Aprovado` sem evidência medida registrada na linha. Desvio declarado quanto a `project.md` § Forbidden, que proíbe teste automatizado de navegador: esta inspeção não produz suíte, código de teste nem portão — é observação assistida.

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

| #   | Passos                                                                                                            | Esperado                                                                                           | Resultado                           | Observações                                                                                                                                                                                                              |
| --- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1.1 | No Chamado A, foque a lista de abas e use as setas esquerda e direita até chegar em Conversa.                     | A aba ativa muda entre Detalhes, Histórico e Conversa e o painel correspondente aparece.           | Aprovado                            | As setas levaram de Detalhes a Histórico e a Conversa, com o painel correspondente em cada parada.                                                                                                                       |
| 1.2 | Já na aba Conversa, percorra com Tab: "Atualizar", "Carregar mensagens anteriores", "Ver mais", campo e "Enviar". | Todos são alcançáveis e acionáveis por Enter ou Espaço; a ordem segue a leitura da tela.           | Aprovado                            | Ordem: contentor rolável, Atualizar, Carregar mensagens anteriores, campo Nova mensagem e Enviar; todos com anel.                                                                                                        |
| 1.3 | Escreva e envie uma mensagem usando só o teclado.                                                                 | O envio acontece, o campo é limpo e o foco volta para o campo, sem uso do rato.                    | Reprovado                           | O envio acontece e o campo é limpo, mas o foco não volta ao campo. Causa medida: o botão é desabilitado durante a requisição (disabled aos 75ms, foco em BODY aos 134ms, reabilitado aos 143ms sem devolver o foco).     |
| 1.4 | Acione "Carregar mensagens anteriores" com Enter e, em seguida, "Atualizar" com Espaço.                           | As duas ações são executadas; a posição de leitura é mantida ao carregar as anteriores.            | Aprovado                            | Carregar anteriores com Enter: scrollHeight cresceu 812px e scrollTop passou a 812, preservando a posição de leitura ao pixel. Atualizar com Espaço trouxe uma mensagem injetada por API.                                |
| 1.5 | Numa mensagem longa, acione "Ver mais" e depois "Ver menos" pelo teclado.                                         | O corpo expande e volta a dobrar; o foco permanece no próprio botão.                               | Aprovado                            | O corpo vai de 120px (6 linhas, line-clamp 6) para 820px e volta; o foco permanece no próprio botão nas duas vezes.                                                                                                      |
| 1.6 | Entre como Atendente do Financeiro num chamado que nunca passou pelo setor dele e tente alcançar a aba Conversa.  | A aba não permanece na lista: ela é retirada e o foco volta para a aba Detalhes, sem revelar nada. | Aprovado com divergência de roteiro | O roteiro prevê a aba ser retirada. Medido: setor por onde o chamado nunca passou recebe 404 no chamado inteiro, então a aba nunca existe; e o leitor por passagem mantém a aba e lê, o que BR1.2 permite expressamente. |
| 1.7 | No Chamado C (encerrado), percorra a aba Conversa com Tab.                                                        | O campo desabilitado e o botão "Enviar" desabilitado são pulados; o restante continua alcançável.  | Aprovado                            | O campo e o botão Enviar desabilitados são pulados no Tab; o percurso vai do contentor para Atualizar e sai da página.                                                                                                   |

### AC5.3.2 — Indicador de foco visível

| #   | Passos                                                                                                     | Esperado                                                          | Resultado | Observações                                                                    |
| --- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------ |
| 2.1 | Percorra com Tab toda a aba Conversa do Chamado A, incluindo o contentor rolável das mensagens.            | Todo elemento focado exibe anel ou borda de foco visível.         | Aprovado  | Todas as paradas com anel, incluindo o contentor rolável das mensagens.        |
| 2.2 | Force uma falha de envio (desligue a rede nas ferramentas de desenvolvedor) e percorra "Tentar novamente". | O botão do balão "Não enviado" mostra foco visível e é acionável. | Aprovado  | No balão de falha, Tentar novamente recebe foco com anel de 3px e é acionável. |

### AC5.3.5 — Contraste mínimo

| #   | Passos                                                                                                                 | Esperado                                                              | Resultado | Observações                                                                                                                                                                                     |
| --- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5.1 | Meça o contraste do corpo da mensagem e da linha de autor e momento (texto auxiliar em cinza) nos dois lados do balão. | Todos os pares de texto e fundo atendem o mínimo de WCAG 2.1 nível A. | Reprovado | 185 folhas medidas, 28 reprovam, todas no mesmo par: rgb(115,115,115) sobre rgb(245,245,245) a 12px = 4,35 (mínimo 4,5). A mesma cor sobre branco dá 4,74. É um par de tokens, não 28 defeitos. |
| 5.2 | Meça o contador de caracteres, o aviso "Este chamado está encerrado." e a mensagem de erro do envio recusado.          | Atendem o mínimo exigido.                                             | Aprovado  | Contador 4,74; aviso de chamado encerrado 4,74; mensagem de falha de conexão 4,54.                                                                                                              |
| 5.3 | Meça a marca "Não enviado" e a borda do balão de falha sobre o fundo da aba.                                           | Atende o mínimo exigido.                                              | Aprovado  | Não enviado com 4,77 a 12px; borda do balão rgb(231,0,11) de 1px com razão 4,77 contra o fundo.                                                                                                 |

### AC5.3.6 — Tema padrão do Shadcn sem cores sobrescritas

| #   | Passos                                                                                                                                 | Esperado                                                                                                                     | Resultado | Observações                                                                                     |
| --- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------- |
| 6.1 | Na raiz do repositório, execute `grep -rnE "#[0-9a-fA-F]{3,8}\b\|rgb\(\|hsl\(\|oklch\(\|\[color:" apps/web/src/features/conversation`. | Nenhuma cor literal na aba Conversa; só tokens do tema (`bg-card`, `bg-muted`, `text-muted-foreground`, `text-destructive`). | Aprovado  | Comando do roteiro executado na raiz: 0 linhas.                                                 |
| 6.2 | Observe o balão do solicitante e o do atendimento, lado a lado.                                                                        | O autor está sempre escrito no balão; o lado e o fundo são reforço, nunca a única informação.                                | Aprovado  | 59 rótulos de autor escritos nos balões, com três fundos distintos; o lado e a cor são reforço. |
| 6.3 | Observe o balão de falha de envio.                                                                                                     | "Não enviado" aparece por escrito; a borda vermelha é reforço, não a única pista.                                            | Aprovado  | Não enviado aparece por escrito; a borda vermelha é reforço.                                    |

### AC5.4.1 — Telas do solicitante sem rolagem horizontal em 375px

| #   | Passos                                                                                                         | Esperado                                                                                    | Resultado | Observações                                                                                      |
| --- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------ |
| 4.1 | Em 375px, entre como Aluno e abra o Chamado A na aba Conversa, com as mensagens longas carregadas.             | A página não rola na horizontal; os balões quebram linha e ocupam a largura útil.           | Aprovado  | 375/375; o elemento mais à direita da aba termina em 359.                                        |
| 4.2 | Em 375px, verifique a lista de abas com as três abas (Detalhes, Histórico, Conversa).                          | A lista de abas cabe ou rola dentro do próprio contentor, sem rolagem horizontal da página. | Aprovado  | Lista das três abas com 226px, sem rolagem interna e sem rolagem da página.                      |
| 4.3 | Em 375px, escreva uma mensagem longa no campo e observe o campo, o contador e o botão "Enviar".                | Nada transborda; o campo ocupa a largura útil e o botão continua visível.                   | Aprovado  | Campo com 343px, contador 229/2000 caracteres e botão Enviar terminando em 359; nada transborda. |
| 4.4 | Em 375px, cole no campo um texto de uma só palavra com mais de 100 caracteres e envie; observe o balão gerado. | O balão quebra a palavra e não provoca rolagem horizontal da página.                        | Aprovado  | Palavra única de 117 caracteres: o balão quebrou a palavra e a página seguiu em 375/375.         |

## Observações gerais da passagem

_Preencha aqui qualquer problema que não caiba na tabela, com a tela e a largura em que foi observado._
