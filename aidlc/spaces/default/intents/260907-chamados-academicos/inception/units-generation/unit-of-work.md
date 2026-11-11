# Unidades de Trabalho — Sistema de Chamados Acadêmicos

Derivado de `components.md` e `decisions.md` (em `../domain-design/`: 7 blocos, 10 entidades, ADR-001 a ADR-007), `requirements.md` (em `../requirements-analysis/`: FR1–FR12, NFR1–NFR9, restrições C1–C8) e `stories.md` (em `../user-stories/`: 20 histórias, critérios transversais CT1–CT11), com as respostas confirmadas em `units-generation-questions.md`.

Cinco unidades de trabalho. Este documento diz o que cada unidade é, o que ela possui e entrega, e como é implantada. O que depende de quê está em `unit-of-work-dependency.md`; qual história cai em qual unidade está em `unit-of-work-story-map.md`. A ordem de construção, o caminho crítico e o corte dos Could have **não** são decididos aqui: são trabalho do Planejamento de Entrega.

## Premissas de Decomposição

- **Fatias verticais** (Q1). Cada unidade entrega o módulo do backend, as telas que o consomem e os testes das duas camadas. Uma unidade pronta é uma funcionalidade usável de ponta a ponta.
- **Implantação embutida.** Todas as unidades vivem dentro das duas aplicações do repositório único — módulos NestJS em `apps/api` e funcionalidades React em `apps/web` — e sobem juntas com `docker compose up` (C2, C3). Nenhuma unidade é implantada à parte.
- **Sem unidade de esqueleto.** A prática afirmada em `team.md` diz que a primeira unidade já atravessa a pilha inteira. A estrutura do projeto entra em U1, junto com as primeiras funcionalidades de negócio.
- **Auth, Users e Catalog juntos em U1.** Os dois ciclos declarados em ADR-004 passam por esses três blocos, e o grafo de unidades não pode ter ciclo.
- **Tickets e Notifications juntos em U2** (Q2). Tickets grava notificação, e a notificação aponta para o chamado. Em unidades separadas, uma das duas relações teria de perder a chave estrangeira.
- **Conversa em unidade própria**, por regra afirmada em `project.md`.
- **Could have em duas unidades** (Q3): indicadores (U4) e avaliação (U5), para que o painel possa ser entregue sem a avaliação e a avaliação possa ser cortada sozinha.
- **Integração por chamada direta de serviço**, sem camada de eventos (Q5 do Desenho de Domínio). Chave estrangeira entre unidades só no sentido do grafo, e dado de outra unidade é lido pelo serviço dela, nunca pela tabela alheia (Q5 desta etapa, ADR-004).

## Tabela de Unidades

| Unit ID | Directory | Nome | Tipo | Implantação | Complexidade | Prioridade |
|---------|-----------|------|------|-------------|--------------|-----------|
| U1 | `u1-foundation` | Fundação | service | embutida (embedded) | L | Must |
| U2 | `u2-tickets` | Chamados | service | embutida (embedded) | XL | Must |
| U3 | `u3-conversation` | Conversa | service | embutida (embedded) | M | Must |
| U4 | `u4-reporting` | Indicadores | service | embutida (embedded) | M | Could |
| U5 | `u5-rating` | Avaliação | service | embutida (embedded) | S | Could |

Os diretórios são identificadores e ficam em inglês, seguindo o glossário do projeto; o nome exibido fica em português.

**Tipo.** As cinco são `service`: cada uma leva uma parte executável do backend, e as telas fazem parte da mesma fatia. Nenhuma unidade é `ui`, `spec`, `packaging` ou `library` pura.

**Complexidade.** Estimativa relativa, pela contagem de blocos, entidades, histórias e regras não triviais de cada unidade. Não é estimativa de horas.

## Blocos e Entidades por Unidade

| Unidade | Blocos do catálogo | Entidades que possui |
|---------|--------------------|----------------------|
| U1 | Auth, Users, Catalog | User, Sector, Category, Status, Priority |
| U2 | Tickets, Notifications | Ticket, TicketHistoryEntry, TicketSectorPassage, Notification |
| U3 | Conversation | Message |
| U4 | Reporting | nenhuma |
| U5 | extensão de Tickets e de Reporting | o dado de avaliação ligado ao chamado, com forma decidida no Desenho Funcional |

Os sete blocos de `components.md` aparecem, cada um, em exatamente uma unidade de origem. As dez entidades têm exatamente uma unidade dona.

---

## U1 — Fundação (`u1-foundation`)

**Descrição.** A primeira fatia, que atravessa a pilha inteira: estrutura do repositório e das duas aplicações, autenticação e sessão, gestão de usuários, catálogos de classificação, casca de navegação do frontend e toda a interface administrativa.

**Fronteira.** Dentro: os blocos Auth, Users e Catalog, e a estrutura compartilhada que as unidades seguintes usam. Fora: tudo que depende da existência de um chamado.

**Responsabilidades e entregas.**

- Estrutura do repositório: npm workspaces com `apps/api` e `apps/web`, lint e formatação configurados na raiz, Dockerfiles com contexto na raiz, Compose com Postgres sem porta publicada no host (ou ligada a `127.0.0.1`), `.gitignore`, `.dockerignore` e `.env.example` antes de qualquer `.env`, validação das variáveis obrigatórias na inicialização, hook local de pre-push com lint e testes rápidos.
- Convenções transversais do backend: envelope único de erro com conversão dos erros do Prisma (NFR3), guard global de negação por padrão com marcação explícita de perfil (FR1.5), carga do ator do banco a cada requisição (CT10), `PrismaService`.
- Autenticação: login por e-mail e senha, JWT em cookie `httpOnly` sem refresh token, logout que apaga o cookie, resposta idêntica para e-mail inexistente e senha errada (FR1).
- Usuários: cadastro pelo administrador, cinco perfis, alteração de perfil, redefinição de senha, desativação sem apagar, vínculo obrigatório de atendente e gestor a um setor, senha com hash resistente a força bruta (FR2, NFR7).
- Catálogos: setores, categorias com setor obrigatório, status com chave estável, prioridades com marcação de padrão, desativação sem efeito em registros existentes, carga inicial dos quatro status e das três prioridades (FR3).
- Frontend: casca de layout com barra lateral recolhível, contexto de sessão, tradução do `code` de erro para português (CT11), tela de login e telas de administração de usuários e de catálogos (FR9).
- Teste de enumeração das rotas registradas, que falha se alguma rota não pública estiver sem marcação de perfil (M5 de `stories.md`).

**Implantação.** Embutida: módulos `auth`, `users` e `catalog` em `apps/api`; funcionalidades de login e administração em `apps/web`.

**Complexidade: L.** É a unidade com mais superfície nova: a estrutura inteira do projeto, três blocos e duas áreas de tela. Não tem, porém, máquina de estados nem regra de visibilidade por setor.

**Notas e restrições.**

- Os dois ciclos de ADR-004 ficam inteiros dentro desta unidade. O mecanismo para resolvê-los no NestJS é decisão de construção; em qualquer mecanismo, o guard falha fechado — se não conseguir resolver o ator, nega a requisição.
- Auth não acessa o banco diretamente; lê o usuário sempre através de Users.
- Toda a área administrativa está no corte mínimo, pela decisão registrada em US4.1 de `stories.md`. A regra de `project.md` que classifica a área administrativa como Should have continua sem correção, e esta unidade segue a decisão posterior.
- O workflow de Integração Contínua é produzido pela etapa de pipeline de CI. Esta unidade entrega o que roda localmente: lint, formatação, testes e o hook de pre-push.

---

## U2 — Chamados (`u2-tickets`)

**Descrição.** O chamado e todo o seu percurso, mais o aviso in-app de cada evento: abertura, acompanhamento, fila do setor, assumir, atribuir, transferir, andamento, encerramento, reabertura, histórico, passagens por setor e notificações.

**Fronteira.** Dentro: os blocos Tickets e Notifications. Fora: mensagens (U3), indicadores (U4) e avaliação (U5).

**Responsabilidades e entregas.**

- Abertura com setor derivado da categoria, ignorando qualquer setor enviado pelo cliente; prioridade padrão; identificador visível (FR4.1 a FR4.3).
- Listagem e detalhe do solicitante com filtros, paginação e histórico; 404 para chamado alheio (FR4.4 a FR4.8, NFR4).
- Fila do setor com recortes "não atribuídos", "meus" e "todos", incluindo os chamados que já passaram pelo setor (FR5.1, FR5.6).
- Assumir, atribuir pelo gestor, transferir com justificativa, alterar prioridade, marcar Aguardando solicitante e encerrar (FR5.2 a FR5.5, FR5.7).
- Máquina de transições como módulo puro, sem NestJS e sem Prisma, comparando chaves estáveis de status (FR8, ADR-006).
- Reabertura pelo solicitante dentro de 72 horas, com fonte de tempo injetável para teste (FR8.3, FR8.4, M3 de `stories.md`).
- Histórico de alterações e registro de passagens por setor (FR4.6, FR8.5, M1 de `stories.md`).
- Notificações: gravação no momento do evento (CT9), sino com contador de não lidas, listagem e marcação de lida individual e em lote (FR7).
- Métodos de serviço consumidos pelas unidades seguintes: obter o chamado visível ao ator, aplicar o retorno automático de status quando o solicitante responde, gravar notificação, e consultas agregadas já filtradas pela regra de visibilidade (ADR-005).

**Implantação.** Embutida: módulos `tickets` e `notifications` em `apps/api`; funcionalidades de chamados, fila e notificações em `apps/web`.

**Complexidade: XL.** Maior unidade do sistema: quatro entidades, a máquina de transições, a regra de visibilidade por perfil e por setor, e dez histórias principais. Fica registrada como o maior risco de tamanho para o Planejamento de Entrega.

**Notas e restrições.**

- A regra de visibilidade do chamado existe só aqui. U3, U4 e U5 a consomem pelo serviço, e nunca a reimplementam (ADR-005).
- Toda consulta de chamado filtra o ator dentro do próprio `where` (NFR1).
- O detalhe do chamado é entregue com descrição, metadados e histórico; a aba de mensagens é acrescentada por U3.
- A lista de transições válidas deve partir da tabela completa de `stories.md`, e não da lista de FR8.1 — ver a questão R-11 em Assumptions & Open Questions.

---

## U3 — Conversa (`u3-conversation`)

**Descrição.** Mensagens trocadas dentro do chamado entre solicitante e atendimento, com modelo de dados e regra de acesso próprios.

**Fronteira.** Dentro: o bloco Conversation. Fora: o ciclo de vida do chamado, que U3 aciona pelo serviço de U2 sem escrever na entidade `Ticket`.

**Responsabilidades e entregas.**

- Envio e leitura de mensagens em ordem cronológica, separadas do histórico; mensagem imutável, sem rota de edição nem exclusão (FR6.1, FR6.2, FR6.4).
- Recusa de mensagem em chamado encerrado (FR6.3).
- Regra de acesso à conversa: solicitante, responsável atual, e atendentes e gestores do setor atual ou de setor por onde o chamado passou; 404 para quem está fora (FR6.5, NFR4).
- Pedido a U2 do retorno automático de Aguardando solicitante para Em análise quando o solicitante responde.
- Gravação, pelo serviço de U2, da notificação de mensagem recebida (FR7.1, FR7.2).
- Aba de conversa no detalhe do chamado.

**Implantação.** Embutida: módulo `conversation` em `apps/api`; aba de conversa em `apps/web`.

**Complexidade: M.** Uma entidade e uma regra de acesso mais permissiva que a do chamado, sem máquina de estados própria.

**Notas e restrições.**

- Separada do ciclo de vida do chamado por regra afirmada em `project.md`.
- A transição de status disparada pela mensagem é aplicada por U2, pela máquina de transições; U3 só pede.

---

## U4 — Indicadores (`u4-reporting`)

**Descrição.** Painel com volume e tempos dos chamados, e listagens com filtros combinados. Somente leitura. Could have.

**Fronteira.** Dentro: o bloco Reporting. Não escreve nada e não é dono de entidade; lê chamados e histórico através de U2 e rótulos através de U1 (ADR-005).

**Responsabilidades e entregas.**

- Contagem de chamados por status, categoria e setor (FR10.1).
- Tempo médio de atendimento e tempo médio de resolução, exibidos sem meta nem limiar (FR10.2).
- Recorte por período, com estado vazio explicativo (FR10.3).
- Números restritos ao que o perfil que consulta pode ver.
- Listagens com filtros combinados em tela, sem exportação nem rota de download (FR11.1).

**Implantação.** Embutida: módulo `reporting` em `apps/api`; painel e listagens em `apps/web`.

**Complexidade: M.** Sem entidade, mas com consultas agregadas que atravessam o serviço de U2.

**Notas e restrições.**

- Os marcos de início e fim de "tempo de atendimento" e "tempo de resolução" não estão definidos (achado R-06 da revisão de requisitos). Precisam ser fixados no Desenho Funcional desta unidade antes da construção.
- Cortar esta unidade não deixa consulta órfã em nenhuma outra, mas obriga a cortar U5 junto, que depende dela.

---

## U5 — Avaliação (`u5-rating`)

**Descrição.** Avaliação opcional do atendimento pelo solicitante, depois do encerramento, compondo os indicadores. Could have.

**Fronteira.** Dentro: o dado de avaliação ligado ao chamado, a ação de avaliar no detalhe de um chamado encerrado, e a inclusão da avaliação nos indicadores de U4. Fora: o encerramento em si, que continua acontecendo sem avaliação.

**Responsabilidades e entregas.**

- Registro da avaliação em chamado encerrado do próprio solicitante; 404 para chamado alheio (FR12.1, NFR4).
- Inclusão da avaliação nos números do painel (FR12.2).

**Implantação.** Embutida: extensão dos módulos `tickets` e `reporting` em `apps/api`; ação de avaliar e ajuste do painel em `apps/web`.

**Complexidade: S.** Um dado novo, uma ação de tela e uma extensão de consulta.

**Notas e restrições.**

- É a única unidade que estende blocos entregues por outras unidades (Tickets, de U2, e Reporting, de U4) em vez de trazer um bloco próprio.
- Escala e semântica da avaliação não estão definidas e precisam ser fixadas no Desenho Funcional desta unidade.

---

## Estrutura Compartilhada entre Unidades

Pontos de código que mais de uma unidade altera. Não são unidades: são os lugares onde a construção de uma unidade encosta na de outra.

| Ponto | Criado em | Estendido por | Regra |
|-------|-----------|---------------|-------|
| Esquema do Prisma e migrações | U1 | U2, U3, U5 | Só uma unidade por vez gera migração, na ordem em que as unidades entram em `main` (Q4). U4 não gera migração. |
| Registro de módulos da API | U1 | U2, U3, U4, U5 | Cada unidade registra apenas os próprios módulos. |
| Navegação e rotas do frontend | U1 | U2, U3, U4, U5 | Cada unidade acrescenta os próprios itens de menu e rotas. |
| Tradução de `code` de erro | U1 | U2, U3, U4, U5 | Todo código de erro novo ganha tradução na mesma unidade que o cria (CT11). |
| Teste de enumeração de rotas | U1 | U2, U3, U4, U5 | Toda rota nova entra com marcação de perfil e com ao menos um teste negativo de 403 (NFR2). |
| Carga inicial | U1 | nenhuma prevista | Status, prioridades e primeiro administrador. |

## Cobertura dos Requisitos por Unidade

| Requisito | Unidade |
|-----------|---------|
| FR1 — Autenticação e Sessão | U1 |
| FR2 — Usuários e Perfis | U1 |
| FR3 — Catálogos de Classificação | U1 |
| FR4 — Ciclo de Vida do Chamado | U2 |
| FR5 — Atendimento | U2 |
| FR6 — Comunicação no Chamado | U3 |
| FR7 — Notificações in-app | U2 (gravação e leitura), U3 (evento de mensagem recebida) |
| FR8 — Máquina de Transições de Status | U2 |
| FR9 — Área Administrativa | U1 |
| FR10 — Dashboard e Indicadores | U4 |
| FR11 — Relatórios | U4 |
| FR12 — Avaliação dos Atendimentos | U5 |
| NFR1, NFR2, NFR4 — autorização e não revelação | mecanismo criado em U1; aplicado por toda unidade que cria rota |
| NFR3 — envelope de erro | criado em U1; mantido por todas |
| NFR5, NFR6 — acessibilidade e celular | casca e tema criados em U1; aplicados por toda unidade que cria tela |
| NFR7 — hash de senha | U1 |
| NFR8, NFR9 — subida com um comando e segredos | U1 |

## Assumptions & Open Questions

- [assumption] A carga inicial cria o primeiro administrador, já que não há auto-cadastro (FR2.2) e só o administrador cria usuários. O mecanismo — variável de ambiente, script de carga ou outro — é decisão do Desenho Funcional de U1.
- [assumption] O dado de avaliação pertence ao bloco Tickets, conforme a rastreabilidade do Desenho de Domínio (US6.3 aponta para Tickets). O catálogo de blocos não previu uma entidade de avaliação; U5 a acrescenta como extensão de Tickets.
- [assumption] O tipo `service` foi atribuído às cinco unidades embora todas carreguem telas, porque o tipo descreve a parte executável e as telas pertencem à mesma fatia vertical.
- [assumption] As estimativas de complexidade são relativas entre as cinco unidades e não servem como estimativa de esforço em horas.

Questões herdadas das etapas anteriores, agora com a unidade que as recebe:

| Questão | Unidade afetada | Resolve em |
|---------|-----------------|-----------|
| A lista de correções de FR8.1 em `stories.md` omite a transição Aguardando solicitante → Encerrado (achado R-11, aceito como risco), embora a tabela completa do mesmo documento a inclua. | U2 | Desenho Funcional de U2, partindo da tabela completa |
| `Priority.key` permanece ou sai (ADR-006). | U1 | Desenho Funcional de U1 |
| O administrador pode criar status além dos quatro iniciais, e que transições um status novo teria (ADR-006). | U1, U2 | Desenho Funcional de U1 |
| Formato do identificador visível do chamado. | U2 | Desenho Funcional de U2 |
| Matriz completa de perfil × recurso × operação. | todas | Desenho Funcional de cada unidade |
| A busca textual da barra superior dos wireframes não tem requisito nem história. | U1 | Desenho Funcional de U1 |
| Atendente, Gestor e Administrador também abrem chamados? | U2 | Desenho Funcional de U2 |
| Limite de caracteres de título e descrição. | U2 | Desenho Funcional de U2 |
| Marcos de início e fim dos tempos médios (achado R-06). | U4 | Desenho Funcional de U4 |
| Escala e semântica da avaliação. | U5 | Desenho Funcional de U5 |
| Um roteiro manual datado conta como requisito coberto? | toda unidade com tela | Build and Test |
| `project.md` ainda classifica a área administrativa como Should have, contra a decisão de US4.1. | U1 | Não resolvida: o autor optou por não corrigir a regra |

## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-09-12T21:43:27Z
**Iteration:** 1

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Minor | unit-of-work.md > Tabela de Unidades, coluna Tipo | As cinco unidades recebem `kind: service`, inclusive U4 e U5, que são Could have, somente leitura ou de extensão fina (U4 não possui entidade própria; U5 apenas estende Tickets e Reporting). O artefato já registra isso como suposição explícita ("Assumptions & Open Questions"), mas a consequência prática é que U4 e U5 carregam a matriz completa de artefatos de desenho de Construction (incluindo desenho de infraestrutura e de NFR) mesmo sendo as unidades de menor porte e de corte mais provável. | Nenhuma ação obrigatória — a suposição já está documentada e justificada. Registrar para o humano no portão que, se o Planejamento de Entrega cortar U4/U5, o esforço de artefato "cheio" nunca chega a ser gasto; caso sejam mantidas, considerar se `spec`/`library` descreveria melhor U4 antes do Desenho Funcional. | New |
| R-02 | Minor | unit-of-work.md > Assumptions & Open Questions, última linha da tabela | A contradição entre `project.md` (Área Administrativa como Should have) e a decisão de US4.1 (Must have, herdada de `stories.md`) é corretamente herdada e sinalizada como "Não resolvida", sem propor correção de `project.md`. Isso é honesto, mas deixa a regra de memória do projeto desatualizada indefinidamente enquanto o Must have segue sendo construído em U1. | Nenhuma ação bloqueante nesta etapa — decisão de correção de `project.md` cabe ao humano no portão de aprovação, via ritual de aprendizados (§13), não a esta etapa. | New |
| R-03 | Minor | unit-of-work.md > U2 — Chamados, seção "Notas e restrições" | O achado R-11 de `stories.md` (transição Aguardando solicitante → Encerrado ausente em FR8.1) é corretamente herdado e roteado para o Desenho Funcional de U2 "partindo da tabela completa", o que mitiga o risco. Como FR8.1 em `requirements.md` continua sem a correção na origem, um leitor que for direto a FR8.1 sem passar por este artefato ainda encontra a lista incompleta. | Nenhuma ação bloqueante nesta etapa — a mitigação já existe aqui; a correção de origem em `requirements.md`/`stories.md` é de responsabilidade dessas etapas, não desta. | New |

### Validation Tool Results

| Tool | Result | Interpretation |
|---|---|---|
| aidlc-sensor-traceability.ts --stage units-generation | `{"pass":true,"gaps":[],"orphans":[],"findings_count":0}` | Todas as 20 histórias de `stories.md` têm alvo `OK` em `traceability.json`, e cada alvo aparece na linha correspondente de `unit-of-work-story-map.md` (unidade principal ou "Também em"). Nenhuma órfã, nenhuma lacuna. |
| aidlc-sensor-required-sections.ts --stage units-generation --output-path unit-of-work-dependency.md | `{"pass":true,"h2_count":7,"edge_block":"ok"}` | O bloco `yaml` de arestas é bem formado e acíclico; as sete seções H2 esperadas estão presentes. |
| Verificação manual — aciclicidade do grafo de unidades | PASS | `depends_on` de U2, U3, U4, U5 forma um DAG: U1 sem dependência; nenhuma unidade depende de U3 nem de U5; existem ordenações topológicas válidas (o documento lista três, sem escolher uma — respeitando a proibição desta etapa de recomendar ordem). |
| Verificação manual — cobertura dos dois ciclos de ADR-004 | PASS | Auth↔Users e Auth→Users→Catalog→Auth ficam inteiramente contidos em U1, conforme exigido pela etapa (ciclo entre blocos não pode virar aresta entre unidades). |
| Verificação manual — propriedade de entidade única e sentido da chave estrangeira (Q5) | PASS | As dez entidades de `components.md` têm exatamente uma unidade dona (U1: User, Sector, Category, Status, Priority; U2: Ticket, TicketHistoryEntry, TicketSectorPassage, Notification; U3: Message). Toda referência de entidade cruza unidades apenas no sentido de uma unidade da qual se depende no grafo (U2→U1, U3→U1, U3→U2), nunca no sentido inverso. |
| Verificação manual — respeito ao limite de escopo da etapa (sem ordem de implementação nem caminho crítico entre unidades) | PASS | `unit-of-work-dependency.md` lista topologia e paralelismo sem escolher ordem; `unit-of-work-story-map.md` só ordena histórias **dentro** de cada unidade (exigido pela própria etapa), afirmando explicitamente que a ordem **entre** unidades é do Planejamento de Entrega. |
| Verificação manual — sete blocos de `components.md` mapeados 1:1 para as cinco unidades | PASS | Auth+Users+Catalog→U1, Tickets+Notifications→U2, Conversation→U3, Reporting→U4; nenhum bloco duplicado ou ausente. |

### Summary

O grafo de unidades é acíclico, respeita a contenção dos dois ciclos de ADR-004 dentro de U1, mantém propriedade única de entidade e direção de chave estrangeira consistente com a resposta Q5, cobre as 20 histórias sem órfã (confirmado pelos dois sensores) e respeita o limite de escopo da etapa (topologia, não ordem de construção). Os três achados são Minor e informativos — riscos já auto-documentados no próprio artefato ou heranças de etapas anteriores corretamente roteadas — nenhum bloqueia a aprovação.
