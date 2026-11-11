# Entidades — U3 Conversa (`u3-conversation`)

Derivado de `components.md` (bloco Conversation, em `../../../inception/domain-design/`), `unit-of-work.md` (em `../../../inception/units-generation/`), `requirements.md` (FR6), `contract-summary.md` (API-U3, SVC-02, SVC-03, DB-01) e das respostas confirmadas em `functional-design-questions.md`.

## Modelo de Entidades

U3 é dona de uma única entidade. O bloco YAML abaixo é a fonte da verdade do modelo. Tipos são lógicos, não de banco. Nomes de entidade, atributo e valor permitido são identificadores e ficam em inglês; as descrições ficam em português. As referências a Ticket e a User apontam para entidades de U2 e de U1, sempre no sentido do grafo (DB-01).

```yaml
entities:
  - name: Message
    owner_block: Conversation
    description: Mensagem trocada dentro do chamado entre o solicitante e o atendimento.
    attributes:
      - name: id
        type: uuid
        required: true
        unique: true
      - name: ticketId
        type: reference
        references: Ticket.id
        required: true
        constraints:
          - never changes; a message belongs to the ticket it was written in
      - name: authorId
        type: reference
        references: User.id
        required: true
        constraints:
          - the actor who sent the message; never changes
      - name: body
        type: text
        required: true
        min_length: 1
        max_length: 2000
        constraints:
          - surrounding spaces removed before validation
          - plain text; line breaks are preserved and no markup is interpreted
      - name: sentAt
        type: timestamp
        required: true
    entity_constraints:
      - a message is never updated nor deleted after it is stored
    relationships:
      - target: Ticket
        cardinality: many-to-one
        direction: Message -> Ticket
        optional: false
      - target: User
        cardinality: many-to-one
        direction: Message -> User (author)
        optional: false
```

## Resumo

| Entidade | Bloco dono | Para que serve | Invariantes principais |
|----------|-----------|----------------|------------------------|
| Message | Conversation | A conversa dentro do chamado | Imutável depois de gravada; sempre presa a um chamado e a um autor; corpo de 1 a 2000 caracteres |

**O que U3 não guarda.** Status, responsável, setor e histórico do chamado são de U2. U3 nunca escreve na entidade `Ticket` nem consulta as tabelas de outra unidade: os fatos do chamado vêm do serviço público de U2, e os nomes das pessoas vêm do serviço público de U1 (BR4.4 em `rules.md`, DB-01).

**Diferenças em relação a `components.md`.** Nenhuma. O bloco Conversation já previa `Message` com `id`, `body` e `sentAt`, mais as referências a Ticket e a User; esta etapa apenas fixa os limites do corpo (Q3) e a imutabilidade como invariante explícita (FR6.4).
