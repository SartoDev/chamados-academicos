# Entidades — U5 Avaliação (`u5-rating`)

Derivado de `unit-of-work.md` (U5: extensão dos blocos Tickets e Reporting, em `../../../inception/units-generation/`), `requirements.md` (FR12), `contract-summary.md` (API-U5, SVC-07, SVC-08, DB-01) e das respostas confirmadas em `functional-design-questions.md`.

## Modelo de Entidades

U5 é dona de uma única entidade, que vive no módulo de chamados por ser sub-recurso do chamado (DB-01: tabela `ticket_ratings`). Tipos são lógicos, não de banco. Nomes de entidade, atributo e valor permitido são identificadores e ficam em inglês; as descrições ficam em português.

```yaml
entities:
  - name: Rating
    owner_block: Tickets (extensão de U5)
    description: Avaliação que o solicitante registra sobre o atendimento, depois do encerramento do chamado.
    attributes:
      - name: id
        type: uuid
        required: true
        unique: true
      - name: ticketId
        type: reference
        references: Ticket.id
        required: true
        unique: true
        constraints:
          - at most one rating per ticket; the uniqueness is enforced by the database
      - name: score
        type: integer
        required: true
        minimum: 1
        maximum: 5
        constraints:
          - each value has a fixed text label, from "muito ruim" to "muito bom"
      - name: comment
        type: text
        required: false
        min_length: 1
        max_length: 500
        constraints:
          - surrounding spaces removed before validation; empty after trimming is stored as absent
          - plain text; line breaks preserved and no markup interpreted
      - name: ratedAt
        type: timestamp
        required: true
    entity_constraints:
      - a rating is never updated nor deleted, not even when the ticket is reopened
      - the author is always the ticket's requester, so it is not stored again
    relationships:
      - target: Ticket
        cardinality: one-to-one
        direction: Rating -> Ticket
        optional: false
```

## Resumo

| Entidade | Bloco dono | Para que serve | Invariantes principais |
|----------|-----------|----------------|------------------------|
| Rating | Tickets, por extensão de U5 | O julgamento do atendimento pelo solicitante | Uma por chamado; imutável; nota de 1 a 5; comentário opcional de até 500 caracteres |

**Quem avaliou não é guardado.** A avaliação só pode ser registrada pelo solicitante do chamado, então o autor é sempre o `requesterId` do chamado. Guardar de novo criaria um segundo lugar para a mesma verdade.

**A reabertura não mexe na avaliação.** O chamado pode ser reaberto e encerrado outra vez; a avaliação existente permanece como está, e não há uma segunda (Q2).

**Diferenças em relação a `contract-summary.md`.** Nenhuma no formato: o esquema `Rating` do contrato já trazia `ticketId`, `score`, `comment` e `ratedAt`. Esta etapa fixa a escala (1 a 5), o limite do comentário (500) e a unicidade por chamado, que o contrato deixava em aberto.
