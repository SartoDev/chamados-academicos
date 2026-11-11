# Desenho de Domínio — Plano e Perguntas

Base: `../requirements-analysis/requirements.md` (FR1–FR12, NFR1–NFR9), `../user-stories/stories.md` (20 histórias, 11 critérios transversais, 5 consequências de modelo) e `../practices-discovery/team-practices.md` (camadas NestJS, glossário de identificadores, máquina de status em módulo puro).

Esta etapa define os **blocos lógicos de software** — código que você escreve. Banco de dados, contêineres e bibliotecas são dependências dos blocos, não blocos. Ela **não** decide topologia de implantação (isso é a Geração de Unidades) nem pilha tecnológica (já decidida).

Duas coisas já estão fixadas e não são perguntadas: a **máquina de transições de status** vive num módulo puro sem NestJS e sem Prisma (`team-practices.md`), e a **comunicação dentro do chamado** é tratada como unidade separada do ciclo de vida (regra afirmada em `project.md`).

---

## Q1. O atendimento é um bloco próprio ou parte do bloco de Chamados?

Atendimento agrupa fila do setor, assumir, atribuir e transferir (US2.1 a US2.4, US3.1). Todas essas operações mudam o mesmo registro de chamado.

- A. Bloco próprio, **Servicing**: o ciclo de vida do chamado (criar, consultar, mudar status) fica em Tickets, e a operação de fila fica separada. Fronteira por ator: solicitante contra atendente.
- B. Parte de **Tickets**: fila, atribuição e transferência são operações sobre o chamado, e separá-las divide a mesma entidade entre dois donos.
- C. Bloco próprio, mas só para a **fila e a atribuição**; a transferência fica em Tickets por mudar o setor do chamado.
- D. Not yet defined.
- X. Other (please specify)

[Answer]: B. Parte de **Tickets**: fila, atribuição e transferência são operações sobre o chamado, e separá-las divide a mesma entidade entre dois donos.

---

## Q2. Autenticação e gestão de usuários são um bloco ou dois?

Autenticação trata login, sessão e guarda de rotas (US1.1, US5.1). Gestão de usuários trata cadastro, perfil, redefinição de senha e desativação (US4.1). As duas mexem na mesma entidade de usuário.

- A. Dois blocos: **Auth** (sessão e autorização) e **Users** (cadastro e perfis). Auth lê o usuário, Users é dono dele.
- B. Um bloco único **Identity**, dono da entidade e responsável por autenticar, autorizar e administrar.
- C. Dois blocos com a entidade em Auth: Users vira apenas a interface administrativa sobre a entidade de Auth.
- D. Not yet defined.
- X. Other (please specify)

[Answer]: A. Dois blocos: **Auth** (sessão e autorização) e **Users** (cadastro e perfis). Auth lê o usuário, Users é dono dele.

---

## Q3. Os catálogos são um bloco só ou um por entidade?

Setor, Categoria, Status e Prioridade têm o mesmo comportamento: listar, criar, editar, desativar (US4.2). Nenhum tem regra de negócio própria além da relação categoria-setor.

- A. Um bloco único **Catalog**, dono das quatro entidades. Mesma taxa de mudança, mesmo comportamento.
- B. Quatro blocos, um por entidade. Fronteiras mais finas, mais arquivos.
- C. Dois blocos: **Organization** (setores e categorias, que têm relação entre si) e **TicketClassification** (status e prioridades, que a máquina de transições consome).
- D. Not yet defined.
- X. Other (please specify)

[Answer]: A. Um bloco único **Catalog**, dono das quatro entidades. Mesma taxa de mudança, mesmo comportamento.

---

## Q4. As notificações são um bloco próprio?

O critério transversal CT9 exige que todo evento notificável grave a notificação no momento em que ocorre. Seis histórias geram eventos.

- A. Bloco próprio **Notifications**, dono da entidade de notificação. Quem gera o evento chama esse bloco.
- B. Parte de Tickets: a notificação é efeito colateral das operações de chamado, e um bloco só para isso é cerimônia.
- C. Bloco próprio, mas acionado por evento interno em vez de chamada direta — quem muda o chamado publica um evento e Notifications escuta.
- D. Not yet defined.
- X. Other (please specify)

[Answer]: A. Bloco próprio **Notifications**, dono da entidade de notificação. Quem gera o evento chama esse bloco.

---

## Q5. Como os blocos se comunicam entre si?

Define se existe acoplamento direto entre blocos ou uma camada de eventos.

- A. Chamada direta síncrona: o bloco A injeta o serviço do bloco B e chama o método. Simples, rastreável, e o acoplamento fica visível.
- B. Eventos internos: quem muda o estado publica um evento e quem se interessa escuta. Desacopla, mas acrescenta uma infraestrutura de eventos ao projeto.
- C. Misto: chamada direta para o que precisa de resposta, evento para efeito colateral (notificação, histórico).
- D. Not yet defined.
- X. Other (please specify)

[Answer]: A. Chamada direta síncrona: o bloco A injeta o serviço do bloco B e chama o método. Simples, rastreável, e o acoplamento fica visível.

---

## Q6. Quem é dono do histórico de alterações do chamado?

O histórico registra mudanças de status, responsável, setor e prioridade (AC1.3.6, AC2.3.6), e também as passagens por setor (M1 das consequências de modelo, AC2.4.7).

- A. Tickets é dono: o histórico é parte do chamado e nasce junto com ele.
- B. Bloco próprio **AuditTrail**, dono de um registro genérico de alterações que qualquer bloco pode gravar.
- C. Tickets é dono do histórico de alterações; as passagens por setor pertencem ao bloco de Atendimento.
- D. Not yet defined.
- X. Other (please specify)

[Answer]: A. Tickets é dono: o histórico é parte do chamado e nasce junto com ele.

---

## Q7. Os indicadores são um bloco próprio?

Painel e listagens filtradas (US6.1, US6.2) são Could have e leem dados de chamados e atendimento, sem escrever nada.

- A. Bloco próprio **Reporting**, somente leitura, com consultas próprias sobre os dados dos outros blocos.
- B. Parte de Tickets: são consultas agregadas sobre a mesma entidade, e um bloco só de leitura não se paga.
- C. Bloco próprio, mas apenas se e quando os Could have entrarem no plano — não modelar agora.
- D. Not yet defined.
- X. Other (please specify)

[Answer]: A. Bloco próprio **Reporting**, somente leitura, com consultas próprias sobre os dados dos outros blocos.

---

## Q8. Há um bloco de frontend no catálogo, ou o catálogo cobre só o backend?

O sistema tem duas aplicações (`apps/api` e `apps/web`). A pergunta é se o catálogo de blocos representa as duas.

- A. Só o backend: os blocos são os módulos do NestJS. O frontend é organizado por funcionalidade e não entra como bloco lógico.
- B. As duas: cada bloco de backend ganha um bloco de frontend correspondente, com as telas que o consomem.
- C. As duas, mas o frontend como um bloco único de interface, sem espelhar a decomposição do backend.
- D. Not yet defined.
- X. Other (please specify)

[Answer]: A. Só o backend: os blocos são os módulos do NestJS. O frontend é organizado por funcionalidade e não entra como bloco lógico.

---

## Consolidated Summary Confirmation

Resumo consolidado das respostas:

- Atendimento: nao e bloco proprio. Fila, assumir, atribuir e transferir sao operacoes dentro de Tickets, que e dono da entidade de chamado (Q1).
- Identidade: dois blocos. Auth cuida de sessao e autorizacao; Users e dono da entidade de usuario e cuida de cadastro, perfil, redefinicao de senha e desativacao (Q2).
- Catalogos: um bloco unico Catalog, dono de Setor, Categoria, Status e Prioridade (Q3).
- Notificacoes: bloco proprio Notifications, dono da entidade de notificacao, acionado por chamada direta de quem gera o evento (Q4).
- Comunicacao entre blocos: chamada direta sincrona, sem camada de eventos (Q5).
- Historico: Tickets e dono, incluindo as passagens por setor exigidas por AC2.4.7 (Q6).
- Indicadores: bloco proprio Reporting, somente leitura (Q7).
- Escopo do catalogo: apenas o backend. O frontend nao entra como bloco logico (Q8).

Ja fixado antes desta etapa, e incorporado sem pergunta:

- A maquina de transicoes de status vive num modulo puro, sem NestJS e sem Prisma (team-practices.md). Ela e consumida por Tickets, mas nao e um bloco: e uma biblioteca interna sem estado nem entidade propria.
- A comunicacao dentro do chamado (mensagens) e bloco separado do ciclo de vida, com modelo de dados e regras de acesso proprios (regra afirmada em project.md).

Consequencia que decorre das respostas e que vou registrar:

- Com Q5 (chamada direta) e Q7 (Reporting le dados de outros blocos), Reporting depende de Tickets. Vou registrar essa dependencia explicitamente e a alternativa rejeitada num ADR, porque um bloco somente-leitura que atravessa a fronteira de outro merece justificativa.

- Looks correct
- Request changes

[Answer]: Looks correct
