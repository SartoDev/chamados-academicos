# Componentes de Frontend — U5 Avaliação (`u5-rating`)

Derivado de `functional-spec.md` e `rules.md` desta pasta, do código de frontend de U1 a U4 (detalhe do chamado, abas, diálogos de confirmação, `ListState`, cartões do painel) e de `contract-summary.md` (API-U5 e X-01). Os wireframes não têm tela de avaliação: esta etapa fixa a forma.

U5 acrescenta um bloco ao detalhe do chamado encerrado e um cartão ao painel. Não cria página, rota nem item de navegação.

**O que U5 acrescenta nas telas de U2 e de U4, e em que forma.** A aba Detalhes do chamado é um componente fechado, sem espaço para conteúdo de outra unidade: U5 acrescenta a `TicketTabs` uma propriedade opcional de conteúdo extra (`detailsExtra`), renderizada dentro do painel Detalhes, abaixo do que já existia. **Não é o padrão `extraTabs`**, que insere uma aba irmã e é como U3 registra a aba Conversa — U5 não cria aba nova (BR5.1). No painel, nenhum ponto de extensão é criado: o cartão de avaliação entra direto na grade dos tempos médios, que passa a acomodar três cartões em telas largas, e `IndicatorsTab` importa o cartão de `features/rating`, de modo que o módulo de U4 passa a depender do de U5. Nos dois casos, a tela sem U5 é a que sempre foi. Está declarado nas divergências de `functional-spec.md`.

## Hierarquia

```
TicketDetailPage (U2)
└── TicketTabs (U2)                          ganha a propriedade opcional detailsExtra, criada por U5
    └── painel Detalhes
        ├── TicketDetailsTab                 o que já existia, inalterado
        └── RatingSection                    conteúdo extra de U5, só em chamado encerrado
            ├── RatingForm                   só para o solicitante, enquanto não há avaliação
            │   ├── ScoreChoice              cinco opções com rótulo em texto
            │   ├── RatingComment            opcional, com contador de 500
            │   └── ConfirmRatingDialog      avisa que é definitiva
            └── RatingSummaryView            avaliação registrada: nota, rótulo, comentário e data

ReportsPage (U4)
└── IndicatorsTab (U4)                       a grade dos tempos médios passa a três cartões em telas largas
    └── RatingCard                           média e quantidade, ao lado dos dois cartões de tempo
Compartilhado de U5: rating-api (cliente das operações de API-U5), rating-labels
```

## Componentes

| Componente | Responsabilidade | Props principais | Estado | Regras |
|------------|------------------|------------------|--------|--------|
| RatingSection | Decide o que mostrar no detalhe: formulário, avaliação registrada ou nada | chamado, sessão | Cache da consulta de avaliação | BR5.1, BR5.2, BR1.3 |
| RatingForm | Recolhe nota e comentário, valida e envia; preserva o texto quando o envio falha | chamado | Estado de formulário; enviando; falha | BR2.1, BR2.2, BR5.3 |
| ScoreChoice | Cinco opções exclusivas, cada uma com o rótulo escrito; escolha por teclado ou clique | valor, ao mudar | — | BR2.1, BR5.5 |
| RatingComment | Campo opcional com rótulo visível e contador de 500 | valor, ao mudar | — | BR2.2, BR5.5 |
| ConfirmRatingDialog | Confirma antes de enviar, dizendo que a avaliação não poderá ser alterada | nota escolhida | Aberto ou fechado | BR5.3, Q2 |
| RatingSummaryView | Mostra a avaliação registrada: nota com rótulo, comentário quando existe, e data | avaliação | — | BR5.2, BR5.5 |
| RatingCard | Cartão do painel com a média, a quantidade ao lado e um traço quando não há avaliação | média, quantidade | — | BR3.2, BR5.4 |

## Fluxos de Interação

### Avaliar

1. No detalhe de um chamado encerrado do próprio solicitante e ainda sem avaliação, aparece o formulário.
2. A nota é obrigatória; o comentário, opcional, valida ao sair do campo.
3. Ao enviar, a confirmação avisa que a avaliação é definitiva.
4. O resultado depende da resposta:
   - **200:** o formulário dá lugar à avaliação registrada, com uma confirmação curta.
   - **400:** erro abaixo do campo, texto preservado.
   - **409 `RATING_TICKET_NOT_CLOSED`:** aviso de que o chamado não está encerrado, e o bloco é recarregado.
   - **409 `RATING_ALREADY_EXISTS`:** aviso de que o chamado já foi avaliado, e a avaliação existente passa a ser exibida.
   - **falha de rede:** mensagem com ação de tentar novamente, com nota e comentário preservados.

### Ler

1. Quem vê o chamado e abre o detalhe de um chamado avaliado vê a avaliação registrada.
2. Chamado sem avaliação não mostra bloco nenhum para quem não pode avaliar.
3. O Administrador vê a avaliação, em leitura, como vê o resto do chamado.

### No painel

1. O cartão de avaliação aparece junto dos cartões de tempo, com o mesmo período.
2. Sem avaliação no período, mostra um traço e a explicação, nunca zero.

## Validação de Formulário no Cliente

| Formulário | Campo | Regra no cliente | Regra de origem |
|------------|-------|------------------|-----------------|
| Avaliação | Nota | Obrigatória, uma das cinco opções | BR2.1 |
| Avaliação | Comentário | Opcional, até 500 caracteres após remover espaços nas pontas | BR2.2 |
| Avaliação | Envio | Bloqueado sem nota escolhida e enquanto o envio estiver em andamento | BR5.3 |

## Pontos de Integração com a API

| Componente | Operação | Quando |
|------------|----------|--------|
| RatingSection | `getTicketRating` | Abertura do detalhe de um chamado encerrado |
| RatingForm | `rateTicket` | Envio confirmado |
| RatingCard | `getRatingSummary` | Junto das demais consultas do painel, na abertura e ao trocar o período |

Todas as chamadas seguem a política de falha de X-01. A tradução dos códigos novos de U5 entra no mapa de mensagens de erro do frontend, na própria unidade (BR5.6, CT11).

## Assumptions & Open Questions

- [assumption] O bloco de avaliação fica na aba Detalhes, e não numa aba nova: é uma informação do chamado, não uma conversa nem um histórico.
- [assumption] A resposta 404 de avaliação inexistente é tratada como "ainda não avaliado", e não como erro de tela.
- [assumption] As cinco opções são botões de escolha exclusiva com rótulo visível, e não estrelas: estrela sozinha não passa a informação a quem usa leitor de tela.
