# Verificação de Fronteira de Fase — Ideação → Concepção

Executada conforme `.claude/knowledge/aidlc-shared/verification.md`. Verifica a consistência entre Intenção, Escopo e Backlog antes de a fase de Concepção começar.

## Resultado

**Situação: aprovada, com 5 itens em aberto rastreados e com dono definido.**

## Cobertura Intenção → Escopo

Cada elemento da fronteira de produto confirmada em `../ideation/intent-capture/intent-statement.md` tem tratamento correspondente em `../ideation/scope-definition/scope-document.md`.

| Elemento da intenção | Tratamento no escopo | Situação |
|----------------------|----------------------|----------|
| Autenticação por JWT e cookie, cinco perfis | Bloco Must have "Autenticação" | OK |
| Gestão de chamados | Bloco Must have "Chamados" | OK |
| Categorias e setores | Bloco Must have "Categorias e Setores" | OK |
| Fila de atendimento | Bloco Must have "Atendimento básico" | OK |
| Notificações | Bloco Must have "Notificações", restrito a in-app | OK |
| Dashboards e indicadores | Bloco Could have "Dashboard e indicadores" | OK |
| Área administrativa | Bloco Should have "Administração" | OK |
| Docker e CI/CD | Ambiente local e integração contínua, sem implantação | OK |
| Fora do escopo: mobile nativo, IA, integrações não especificadas | Repetido na tabela "Fora do Escopo" | OK |

**Cobertura: 9 de 9 elementos (100%).**

## Cobertura Escopo → Backlog

Cada bloco de `scope-document.md` tem ao menos uma proto-Unidade correspondente em `../ideation/scope-definition/intent-backlog.md`.

| Bloco do escopo | Proto-Unidades | Situação |
|-----------------|----------------|----------|
| Autenticação (Must) | B1 | OK |
| Usuários (Must) | B2 | OK |
| Chamados (Must) | B4 | OK |
| Atendimento básico (Must) | B5 | OK |
| Categorias e Setores (Must) | B3 | OK |
| Notificações (Must) | B7 | OK |
| Administração (Should) | B8 | OK |
| Dashboard e indicadores (Could) | B9 | OK |
| Relatórios (Could) | B10 | OK |
| Avaliação dos atendimentos (Could) | B11 | OK |

**Cobertura: 10 de 10 blocos (100%).**

## Backlog Órfão

Proto-Unidades sem bloco de escopo que as justifique.

| Proto-Unidade | Justificativa | Situação |
|---------------|---------------|----------|
| B6 — Comunicação no Chamado | Decorre da funcionalidade "Comunicação entre solicitante e atendente", parte do bloco Must have "Chamados". Separada como unidade própria por decisão do redator (D22), registrada como suposição a revisar em Units Generation. | OK |

**Nenhum órfão sem justificativa.**

## Cobertura Backlog → Wireframes

Cada proto-Unidade tem tela correspondente em `../ideation/rough-mockups/wireframes.md`, ou justificativa para não ter.

| Proto-Unidade | Tela | Situação |
|---------------|------|----------|
| B1 Autenticação | Tela 1 Login, Tela 2 Entrada por Perfil | OK |
| B2 Usuários e Perfis | Tela 8, aba Usuários (com nota de corte protegendo a capacidade Must have) | OK |
| B3 Catálogos | Tela 8, abas Setores, Categorias, Status, Prioridades | OK |
| B4 Chamados | Tela 3 Meus Chamados, Tela 4 Novo Chamado, Tela 5 Detalhe | OK |
| B5 Atendimento | Tela 6 Fila do Setor, ações do cabeçalho da Tela 5 | OK |
| B6 Comunicação | Tela 5, aba Conversa | OK |
| B7 Notificações | Tela 7 Notificações | OK |
| B8 Administração | Tela 8 Administração | OK |
| B9 Dashboard | Tela 9 Painel de Indicadores | OK |
| B10 Relatórios | Sem tela dedicada | Deferred — Could have; listagens em tela serão especificadas na análise de requisitos |
| B11 Avaliação | Sem tela dedicada | Deferred — Could have; depende de B9, será especificada quando B9 entrar |

**Cobertura: 9 de 11 com tela (82%); 2 diferidos com justificativa registrada.**

## Consistência entre Fases

Verificação de contradições entre os artefatos da Ideação.

| Verificação | Resultado |
|-------------|-----------|
| A fronteira de produto do `intent-statement.md` contradiz o `scope-document.md`? | Não |
| Algum item da lista "Fora do Escopo" reaparece como funcionalidade nos wireframes? | Não |
| Algum bloco Must have carece de tela ou de proto-Unidade? | Não |
| As dependências do backlog formam um grafo acíclico? | Sim; caminho crítico B1 → B3 → B4 → B5 → B7 |
| Alguma decisão de interface contradiz uma resposta confirmada? | Não; a única tensão detectada (item "Início" contra a ausência de tela inicial única) foi resolvida em D25 |
| O plano de trabalho recomposto deixou algum entregável do TCC sem etapa produtora? | Não; os nove entregáveis da seção 10 do documento de escopo têm etapa correspondente |

## Itens em Aberto Rastreados

Nenhum destes impede a passagem de fase. Todos têm dono e etapa de resolução.

| Item | Resolve em |
|------|------------|
| A categoria fixa o setor responsável ou apenas o sugere? | Requirements Analysis |
| Quais status e prioridades existem por padrão? | Requirements Analysis |
| A transferência entre setores limpa o responsável atual? | Requirements Analysis |
| Recuperação de senha está no corte mínimo? | Requirements Analysis |
| Matriz completa de permissões por perfil | Functional Design |

## Aprovação

- [x] Cobertura Intenção → Escopo verificada
- [x] Cobertura Escopo → Backlog verificada
- [x] Órfãos identificados e justificados
- [x] Cobertura Backlog → Wireframes verificada
- [x] Contradições entre artefatos verificadas
- [x] Itens em aberto rastreados com dono
- [ ] Aprovação humana no ponto de aprovação da etapa Approval & Handoff
