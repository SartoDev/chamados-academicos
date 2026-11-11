# Entidades — U4 Indicadores (`u4-reporting`)

Derivado de `components.md` (bloco Reporting, em `../../../inception/domain-design/`), `decisions.md` (ADR-005), `unit-of-work.md` (em `../../../inception/units-generation/`), `requirements.md` (FR10, FR11), `contract-summary.md` (API-U4, SVC-04, SVC-05, DB-01) e das respostas confirmadas em `functional-design-questions.md`.

## Modelo de Entidades

**U4 não é dona de nenhuma entidade e não grava nada.** Não cria tabela, não gera migração e nunca consulta tabela de outra unidade: lê chamados pelo serviço público de U2 e rótulos pelo serviço público de U1 (ADR-005, DB-01, BR6.1 em `rules.md`).

O que esta unidade define são **modelos de leitura**: as formas que ela calcula e entrega, derivadas do que os serviços de U2 devolvem. O bloco YAML abaixo é a fonte da verdade dessas formas. Nomes de campo são identificadores e ficam em inglês; as descrições ficam em português.

```yaml
entities: []

read_models:
  - name: TicketCountGroup
    description: Uma linha de contagem, por status, categoria ou setor.
    source: serviço público de U2 (countTickets), com o rótulo resolvido pelo serviço de U1
    fields:
      - name: id
        type: uuid
        required: true
        description: identificador do status, da categoria ou do setor agrupado
      - name: label
        type: text
        required: true
        description: nome exibido, resolvido na leitura, inclusive de item inativo
      - name: count
        type: integer
        required: true
        minimum: 0

  - name: TicketCountsView
    description: Resultado de uma contagem agrupada, com o período aplicado.
    fields:
      - name: groups
        type: list of TicketCountGroup
        required: true
      - name: total
        type: integer
        required: true
        minimum: 0
        description: soma das contagens dos grupos
      - name: from
        type: timestamp
        required: true
      - name: to
        type: timestamp
        required: true

  - name: DurationAveragesView
    description: Tempos médios do período, em segundos, sem meta nem limiar.
    fields:
      - name: averageHandlingSeconds
        type: number or empty
        required: true
        description: média do tempo de atendimento; vazio quando não há amostra
      - name: averageResolutionSeconds
        type: number or empty
        required: true
        description: média do tempo de resolução; vazio quando não há amostra
      - name: resolutionSampleSize
        type: integer
        required: true
        minimum: 0
        description: quantos chamados encerrados entraram na média de resolução
      - name: handlingSampleSize
        type: integer
        required: true
        minimum: 0
        description: quantos desses chamados tiveram responsável e entraram na média de atendimento
      - name: from
        type: timestamp
        required: true
      - name: to
        type: timestamp
        required: true

  - name: ReportTicketRow
    description: Uma linha da listagem filtrada; a mesma forma que a listagem de chamados de U2 entrega.
    source: >
      serviço público de U2 (searchTickets), com rótulos e pessoas resolvidos na leitura.
      openedAt é extensão aditiva de TicketListRow em SVC-05: o campo não existia no bloco de contrato
      original nem no tipo que searchTickets devolvia, e foi acrescentado dentro do módulo de U2 pelo
      Bolt desta unidade (BR6.2), do mesmo modo que countTickets e getDurationAverages. Não vem do
      endpoint próprio de U2 (TicketListItemView), que é outro modelo.
    fields:
      - name: id
        type: uuid
        required: true
      - name: reference
        type: text
        required: true
      - name: title
        type: text
        required: true
      - name: category
        type: reference
        required: true
      - name: sector
        type: reference
        required: true
      - name: status
        type: reference
        required: true
      - name: priority
        type: reference
        required: true
      - name: assignee
        type: reference or empty
        required: true
      - name: openedAt
        type: timestamp
        required: true
      - name: updatedAt
        type: timestamp
        required: true
```

## Resumo

| Modelo | Para que serve | De onde vem |
|--------|----------------|-------------|
| TicketCountGroup e TicketCountsView | Os cartões e os gráficos de barras do painel | Contagem do serviço de U2, com rótulos de U1 |
| DurationAveragesView | O cartão de tempo médio | Média do serviço de U2, sobre os chamados encerrados do período |
| ReportTicketRow | A listagem filtrada do Gestor | Busca de chamados do serviço de U2, que já aplica a visibilidade |

**Onde o dado mora.** Chamado, histórico e passagens por setor são de U2; status, categoria, setor e prioridade são de U1. U4 só lê, e sempre através dos serviços públicos deles — por isso cortar esta unidade não deixa tabela nem consulta órfã em lugar nenhum.

**Diferenças em relação a `components.md`.** Nenhuma: o bloco Reporting já era declarado sem entidade e sem acesso direto ao banco.
