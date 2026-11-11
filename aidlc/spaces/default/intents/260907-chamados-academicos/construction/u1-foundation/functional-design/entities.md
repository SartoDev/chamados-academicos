# Entidades — U1 Fundação (`u1-foundation`)

Derivado de `components.md` (blocos Auth, Users e Catalog, em `../../../inception/domain-design/`), `unit-of-work.md` (em `../../../inception/units-generation/`), `requirements.md` (FR1, FR2, FR3), `contract-summary.md` (API-U1, DB-01) e das respostas confirmadas em `functional-design-questions.md`.

## Modelo de Entidades

O bloco YAML abaixo é a fonte da verdade do modelo de U1. Tipos são lógicos, não de banco. Os nomes de entidade, atributo e valor permitido são identificadores e ficam em inglês; as descrições ficam em português.

```yaml
entities:
  - name: User
    owner_block: Users
    description: Pessoa que usa o sistema, com exatamente um perfil de acesso.
    attributes:
      - name: id
        type: uuid
        required: true
        unique: true
      - name: name
        type: text
        required: true
        min_length: 1
        max_length: 120
      - name: email
        type: email
        required: true
        unique: true
        constraints:
          - compared and stored in lowercase, without surrounding spaces
        max_length: 254
      - name: passwordHash
        type: text
        required: true
        constraints:
          - slow hash resistant to brute force; the plain password is never stored
          - never returned by any operation
      - name: role
        type: enum
        required: true
        allowed_values: [STUDENT, PROFESSOR, AGENT, MANAGER, ADMIN]
      - name: sectorId
        type: reference
        references: Sector.id
        required: false
        constraints:
          - required when role is AGENT or MANAGER
          - must be empty for any other role
      - name: active
        type: boolean
        required: true
        default: true
      - name: createdAt
        type: timestamp
        required: true
      - name: updatedAt
        type: timestamp
        required: true
    entity_constraints:
      - at least one user with role ADMIN and active true exists after the initial load
      - a user is never deleted; deactivation only
    relationships:
      - target: Sector
        cardinality: many-to-one
        direction: User -> Sector
        optional: true

  - name: Sector
    owner_block: Catalog
    description: Área da instituição que atende chamados.
    attributes:
      - name: id
        type: uuid
        required: true
        unique: true
      - name: name
        type: text
        required: true
        unique: true
        min_length: 1
        max_length: 80
        constraints:
          - uniqueness ignores letter case
      - name: active
        type: boolean
        required: true
        default: true
      - name: createdAt
        type: timestamp
        required: true
      - name: updatedAt
        type: timestamp
        required: true
    entity_constraints:
      - a sector is never deleted; deactivation only
    relationships: []

  - name: Category
    owner_block: Catalog
    description: Assunto escolhido na abertura de um chamado; define o setor responsável.
    attributes:
      - name: id
        type: uuid
        required: true
        unique: true
      - name: name
        type: text
        required: true
        min_length: 1
        max_length: 80
      - name: sectorId
        type: reference
        references: Sector.id
        required: true
      - name: active
        type: boolean
        required: true
        default: true
      - name: createdAt
        type: timestamp
        required: true
      - name: updatedAt
        type: timestamp
        required: true
    entity_constraints:
      - name is unique within the same sector, ignoring letter case
      - a category is never deleted; deactivation only
    relationships:
      - target: Sector
        cardinality: many-to-one
        direction: Category -> Sector
        optional: false

  - name: Status
    owner_block: Catalog
    description: Situação de um chamado. Existem exatamente quatro, fixos em existência.
    attributes:
      - name: id
        type: uuid
        required: true
        unique: true
      - name: key
        type: enum
        required: true
        unique: true
        allowed_values: [OPEN, IN_ANALYSIS, WAITING_REQUESTER, CLOSED]
        constraints:
          - immutable after the initial load
      - name: label
        type: text
        required: true
        unique: true
        min_length: 1
        max_length: 40
        constraints:
          - uniqueness ignores letter case
      - name: createdAt
        type: timestamp
        required: true
      - name: updatedAt
        type: timestamp
        required: true
    entity_constraints:
      - exactly four rows, one per key; none is created or deactivated after the initial load
    relationships: []

  - name: Priority
    owner_block: Catalog
    description: Urgência atribuída a um chamado.
    attributes:
      - name: id
        type: uuid
        required: true
        unique: true
      - name: label
        type: text
        required: true
        unique: true
        min_length: 1
        max_length: 40
        constraints:
          - uniqueness ignores letter case
      - name: isDefault
        type: boolean
        required: true
        default: false
      - name: active
        type: boolean
        required: true
        default: true
      - name: createdAt
        type: timestamp
        required: true
      - name: updatedAt
        type: timestamp
        required: true
    entity_constraints:
      - exactly one priority has isDefault true at any time
      - the default priority is always active
      - a priority is never deleted; deactivation only
    relationships: []
```

## Resumo

| Entidade | Bloco dono | Para que serve | Invariantes principais |
|----------|-----------|----------------|------------------------|
| User | Users | Pessoa com um dos cinco perfis | E-mail único sem distinção de maiúsculas; setor obrigatório só para Atendente e Gestor; sempre existe ao menos um administrador ativo |
| Sector | Catalog | Área que atende chamados | Nome único; nunca apagado |
| Category | Catalog | Assunto do chamado, que aponta o setor | Setor obrigatório; nome único dentro do setor |
| Status | Catalog | Situação do chamado | Exatamente quatro, com chave imutável; só o rótulo muda |
| Priority | Catalog | Urgência do chamado | Exatamente uma padrão, sempre ativa; sem chave estável |

**Diferenças em relação a `components.md`:**
- `Priority.key` saiu do modelo (Q2).
- `Status.active` saiu do modelo, porque status não são desativados (Q3).

As duas mudanças estão registradas como divergência em `functional-spec.md`.

**Estado que não é entidade.** A contagem de tentativas de login falhas vive só na memória do processo e é perdida ao reiniciar (Q6). Por isso não aparece neste modelo; seu comportamento está em `functional-spec.md` e em `rules.md` (BR1.4).
