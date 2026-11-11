# Requisitos — Sistema de Chamados Acadêmicos

Base: `../../ideation/intent-capture/intent-statement.md` (problema, perfis, fronteira de produto), `../../ideation/scope-definition/scope-document.md` (corte mínimo, Should have, Could have e exclusões) e `../practices-discovery/team-practices.md` (convenções técnicas, postura de testes e mecanismo de autorização afirmados).

Os identificadores `FR{n}`, `FR{n}.{m}` e `NFR{n}` são chaves permanentes de rastreabilidade. As etapas seguintes preservam esses identificadores em vez de renumerar.

## Análise de Intenção

O objetivo não é "ter um sistema de chamados", e sim eliminar uma perda concreta: hoje uma solicitação acadêmica entra por canal informal e desaparece — ninguém consegue dizer onde ela está, quem responde por ela, nem há quanto tempo está parada.

Disso decorrem três objetivos que os requisitos precisam sustentar:

1. **Toda solicitação passa a ter um registro com dono e estado.** Um chamado sempre tem categoria, setor responsável, status e histórico.
2. **O solicitante acompanha sem precisar perguntar.** Estado visível, histórico visível, e aviso quando algo muda.
3. **O atendente trabalha a partir de uma fila, não de uma caixa de entrada.** Chamados do seu setor, com dono explícito e histórico do que já foi respondido.

Um quarto objetivo é do projeto e não do produto: os requisitos abaixo formam o documento de requisitos completo previsto entre os entregáveis do TCC.

## Requisitos Funcionais

Prioridade segue o `scope-document.md`: **Must** (corte mínimo), **Should**, **Could**.

### FR1 — Autenticação e Sessão (Must)

| ID | Requisito | Critério de aceitação |
|----|-----------|----------------------|
| FR1.1 | O sistema deve autenticar um usuário por e-mail e senha. | Credenciais válidas retornam sessão iniciada; credenciais inválidas retornam erro sem indicar qual dos dois campos falhou. |
| FR1.2 | A sessão deve ser mantida em cookie `httpOnly` contendo um JWT de duração média, sem renovação automática. | O cookie não é legível por JavaScript. Após a expiração, uma requisição autenticada retorna 401. |
| FR1.3 | O logout deve apagar o cookie de sessão no navegador. | Após o logout, uma requisição sem novo login retorna 401. O sistema não invalida o token no servidor. |
| FR1.4 | O sistema não deve oferecer auto-recuperação de senha. | A tela de login não exibe link de recuperação. |
| FR1.5 | Cada rota não pública deve exigir um perfil explícito; rota sem marcação é negada. | Uma rota autenticada sem marcação de perfil retorna 403 para qualquer perfil. |

Origem: fronteira de produto (`intent-statement.md`), Q5, e o mecanismo de autorização afirmado em `team-practices.md`.

### FR2 — Usuários e Perfis (Must)

| ID | Requisito | Critério de aceitação |
|----|-----------|----------------------|
| FR2.1 | O administrador deve cadastrar usuários informando nome, e-mail e perfil. | Usuário criado consegue autenticar com a senha definida. E-mail duplicado é recusado com erro específico. |
| FR2.2 | O sistema não deve permitir auto-cadastro. | Não existe rota pública de criação de conta. |
| FR2.3 | O sistema deve suportar exatamente cinco perfis: Aluno, Professor, Atendente, Gestor e Administrador. | Cada usuário tem exatamente um perfil. |
| FR2.4 | O administrador deve alterar o perfil de um usuário existente. | A alteração passa a valer na próxima requisição autenticada do usuário. |
| FR2.5 | O administrador deve redefinir a senha de um usuário. | Após a redefinição, a senha anterior não autentica mais. |
| FR2.6 | O administrador deve desativar um usuário sem apagá-lo. | Usuário desativado não autentica; seus chamados e mensagens permanecem visíveis no histórico. |
| FR2.7 | O atendente e o gestor devem estar vinculados a um setor. | Um atendente sem setor não consegue acessar nenhuma fila. |

Origem: Q5, Q6, e os perfis registrados em `intent-statement.md`.

### FR3 — Catálogos de Classificação (Must)

| ID | Requisito | Critério de aceitação |
|----|-----------|----------------------|
| FR3.1 | Setores devem ser registros administráveis com nome e situação (ativo ou inativo). | Um setor inativo não aparece como destino de novos chamados. |
| FR3.2 | Categorias devem ser registros administráveis, cada uma vinculada a exatamente um setor. | Não é possível salvar categoria sem setor. |
| FR3.3 | Status devem ser registros administráveis, não valores fixos em código. | O conjunto de status é lido do banco, não de um enum. |
| FR3.4 | Prioridades devem ser registros administráveis, não valores fixos em código. | O conjunto de prioridades é lido do banco. |
| FR3.5 | O sistema deve nascer com quatro status: Aberto, Em análise, Aguardando solicitante, Encerrado. | Após a carga inicial, os quatro existem e nenhum outro. |
| FR3.6 | O sistema deve nascer com três prioridades: Baixa, Normal, Alta, sendo Normal o padrão. | Um chamado aberto sem escolha explícita recebe Normal. |
| FR3.7 | Desativar um item de catálogo em uso não deve alterar os chamados existentes. | Chamados que referenciam o item continuam exibindo-o. |

Origem: Q1, Q2, Q3, e a regra afirmada em `team-practices.md` de que Status e Priority são tabelas administráveis.

### FR4 — Ciclo de Vida do Chamado (Must)

| ID | Requisito | Critério de aceitação |
|----|-----------|----------------------|
| FR4.1 | Um solicitante (Aluno ou Professor) deve abrir um chamado informando categoria, título, descrição e prioridade. | Chamado criado nasce com status Aberto e sem responsável. |
| FR4.2 | O setor responsável deve ser derivado da categoria escolhida, não informado pelo solicitante. | A tela exibe o setor; a requisição de criação ignora qualquer setor enviado pelo cliente. |
| FR4.3 | Todo chamado deve ter um identificador visível e estável. | O identificador aparece na listagem, no detalhe e nas notificações. |
| FR4.4 | O solicitante deve listar seus próprios chamados com filtro por status, categoria e setor. | A listagem nunca inclui chamado de outro solicitante. |
| FR4.5 | O solicitante deve ver o detalhe de um chamado seu, com descrição, metadados, mensagens e histórico. | Tentar acessar chamado de outro solicitante retorna 404. |
| FR4.6 | Toda alteração de status, responsável ou setor deve gerar um registro de histórico com autor e momento. | O histórico lista cada alteração em ordem cronológica. |
| FR4.7 | O sistema deve permitir alterar o status do chamado apenas conforme a máquina de transições definida em FR8. | Uma transição não prevista é recusada com erro específico. |
| FR4.8 | Listagens devem ser paginadas, preservando filtros e ordenação ao trocar de página. | A contagem total é exibida junto com a página atual. |

Origem: Q1, Q2, Q3, e o corte mínimo do `scope-document.md`.

### FR5 — Atendimento (Must)

| ID | Requisito | Critério de aceitação |
|----|-----------|----------------------|
| FR5.1 | O atendente deve ver a fila do seu setor, com recortes por não atribuídos, seus e todos. | A fila nunca inclui chamado de setor ao qual o atendente não pertence, salvo o previsto em FR5.6. |
| FR5.2 | O atendente deve assumir um chamado sem responsável, tornando-se o responsável. | Assumir um chamado já assumido por outro retorna erro informando o responsável atual. |
| FR5.3 | O gestor deve atribuir um chamado a um atendente do seu setor. | Atribuir a alguém de outro setor é recusado. |
| FR5.4 | O atendente ou gestor deve transferir um chamado para outro setor, com justificativa obrigatória. | Transferir para o mesmo setor é recusado; justificativa vazia é recusada. |
| FR5.5 | A transferência deve remover o responsável e devolver o chamado à fila do setor de destino. | Após a transferência, o chamado aparece como não atribuído na fila de destino. |
| FR5.6 | O atendente deve ver também os chamados que já passaram pelo seu setor antes de uma transferência. | Um chamado transferido para fora permanece consultável pelo setor de origem. |
| FR5.7 | O atendente ou gestor deve encerrar um chamado. | O chamado encerrado passa a recusar novas mensagens. |

Origem: Q4, Q8, e o corte mínimo do `scope-document.md`.

### FR6 — Comunicação no Chamado (Must)

| ID | Requisito | Critério de aceitação |
|----|-----------|----------------------|
| FR6.1 | O solicitante e o atendente responsável devem trocar mensagens dentro do chamado. | Cada mensagem registra autor e momento. |
| FR6.2 | As mensagens devem ser exibidas em ordem cronológica, separadas do histórico de alterações. | A aba de conversa não mistura mensagens com mudanças de status. |
| FR6.3 | Um chamado encerrado não deve aceitar novas mensagens. | A tentativa retorna erro específico; o campo de envio aparece desabilitado. |
| FR6.4 | Uma mensagem não deve ser editada nem apagada depois de enviada. | Não existe rota de edição ou exclusão de mensagem. |
| FR6.5 | Somente o solicitante, o responsável atual, e atendentes ou gestores do setor devem ler as mensagens de um chamado. | Um usuário fora desse conjunto recebe 404 ao tentar ler. |

Origem: `scope-document.md` e a regra afirmada em `project.md` de tratar a comunicação como unidade separada.

### FR7 — Notificações in-app (Must)

| ID | Requisito | Critério de aceitação |
|----|-----------|----------------------|
| FR7.1 | O sistema deve notificar o solicitante quando o chamado dele receber mensagem, mudar de status, de responsável ou de setor. | A notificação aparece para o solicitante e para mais ninguém. |
| FR7.2 | O sistema deve notificar o responsável quando o solicitante enviar mensagem no chamado. | A notificação aparece para o responsável atual. |
| FR7.3 | O sistema deve notificar o último responsável quando um chamado seu for reaberto. | Decorre de FR8.4. |
| FR7.4 | As notificações devem ser apenas dentro do sistema, sem e-mail nem qualquer canal externo. | Não existe integração de envio de mensagem para fora do sistema. |
| FR7.5 | O usuário deve marcar notificações como lidas, individualmente ou todas de uma vez. | O contador de não lidas reflete a ação imediatamente. |

Origem: Q7 do `scope-document.md` (notificações apenas in-app) e Q10 desta etapa.

### FR8 — Máquina de Transições de Status (Must)

| ID | Requisito | Critério de aceitação |
|----|-----------|----------------------|
| FR8.1 | As transições válidas devem ser: Aberto → Em análise; Em análise → Aguardando solicitante; Aguardando solicitante → Em análise; Em análise → Encerrado; Aberto → Encerrado; Encerrado → Aberto (apenas reabertura, ver FR8.3). | Qualquer transição fora desta lista é recusada. |
| FR8.2 | Assumir um chamado Aberto deve levá-lo a Em análise. | Após assumir, o status é Em análise e o responsável é o atendente. |
| FR8.3 | O solicitante deve reabrir um chamado encerrado dentro de 3 dias corridos após o encerramento. | No 4º dia a reabertura é recusada com erro específico. Somente o solicitante do chamado pode reabrir. |
| FR8.4 | A reabertura deve levar o chamado a Aberto mantendo o último responsável, que é notificado. | Após reabrir, o chamado aparece na fila do setor com responsável preenchido. |
| FR8.5 | Toda transição deve registrar autor, momento, status de origem e status de destino no histórico. | O histórico permite reconstruir a sequência completa. |

Origem: Q2, Q7, Q9, Q10.

### FR9 — Área Administrativa (Should)

| ID | Requisito | Critério de aceitação |
|----|-----------|----------------------|
| FR9.1 | O administrador deve gerenciar usuários por interface: criar, editar perfil, redefinir senha e desativar. | Esta interface sustenta FR2, que é Must, e por isso é entregue mesmo se o restante de FR9 for cortado. |
| FR9.2 | O administrador deve gerenciar setores, categorias, status e prioridades por interface. | Cada entidade tem listagem, criação, edição e desativação. |
| FR9.3 | A desativação de um item em uso deve pedir confirmação explicando o efeito sobre chamados existentes. | A confirmação precede a ação. |

Origem: `scope-document.md` (Should have) e o achado da revisão dos wireframes sobre FR2 depender desta interface.

### FR10 — Dashboard e Indicadores (Could)

| ID | Requisito | Critério de aceitação |
|----|-----------|----------------------|
| FR10.1 | O gestor e o administrador devem ver quantidade de chamados por status, por categoria e por setor. | Os números correspondem aos chamados visíveis ao perfil. |
| FR10.2 | O sistema deve calcular tempo médio de atendimento e tempo médio de resolução. | Sem meta numérica associada: os valores são exibidos, não comparados a um limiar. |
| FR10.3 | Os indicadores devem aceitar recorte por período. | Período sem dados exibe estado vazio explicativo. |

Origem: `scope-document.md` (Could have) e Q10 da Captura de Intenção (sem metas numéricas).

### FR11 — Relatórios (Could)

| ID | Requisito | Critério de aceitação |
|----|-----------|----------------------|
| FR11.1 | O gestor deve consultar listagens de chamados com filtros combinados em tela. | Sem exportação em arquivo: não existe rota de download. |

Origem: `scope-document.md` e Q7 da Definição de Escopo.

### FR12 — Avaliação dos Atendimentos (Could)

| ID | Requisito | Critério de aceitação |
|----|-----------|----------------------|
| FR12.1 | O solicitante deve avaliar o atendimento ao encerramento do chamado. | A avaliação é opcional; o encerramento não depende dela. |
| FR12.2 | A avaliação deve compor os indicadores de FR10. | Depende de FR10 estar entregue. |

Origem: `scope-document.md` (Could have).

## Requisitos Não Funcionais

As etapas dedicadas a requisitos não funcionais foram retiradas do plano de trabalho. Os NFR abaixo são os que decorrem diretamente de decisões já afirmadas e que precisam ser verificáveis; não há aqui uma análise não funcional completa, e isso é deliberado.

| ID | Requisito | Critério de aceitação |
|----|-----------|----------------------|
| NFR1 | Toda consulta de recurso com dono deve filtrar o ator dentro da própria cláusula de consulta ao banco, nunca buscar e comparar depois. | Revisão de código e teste de IDOR por recurso com dono. |
| NFR2 | Todo endpoint não público deve ter ao menos um teste negativo de autorização afirmando 403 para um perfil sem direito. | Ausência do teste bloqueia o pipeline pelo critério de cobertura por requisito. |
| NFR3 | Erros nunca devem vazar detalhes internos: toda resposta de erro usa o envelope `{ error: { code, message, details, traceId } }`. | Nenhum erro nativo do Prisma aparece na resposta. |
| NFR4 | Um recurso que existe mas o ator não pode ver deve responder 404, não 403. | Verificado por teste para cada recurso com dono. |
| NFR5 | As telas devem atender WCAG 2.1 nível A: navegação completa por teclado, rótulos visíveis em formulários e contraste mínimo. | Verificado por inspeção manual das telas do corte mínimo. |
| NFR6 | O layout deve ser desktop-first e permanecer funcional em celular. | Nenhuma tela do corte mínimo exige rolagem horizontal em 375px de largura. |
| NFR7 | Senhas devem ser armazenadas com hash de algoritmo resistente a força bruta, nunca em texto claro nem com hash simples. | Inspeção do esquema e do código de autenticação. |
| NFR8 | O sistema deve subir por completo com um único comando de composição de contêineres, sem passo manual. | `docker compose up` deixa frontend, backend e banco operantes. |
| NFR9 | Nenhum segredo deve estar versionado; a aplicação deve falhar na inicialização se faltar variável de ambiente obrigatória. | Varredura de segredos no pipeline e teste de inicialização sem variável. |

Origem: `team-practices.md` (mecanismo de autorização, envelope de erro, sessão, segredos), Q6 dos wireframes (acessibilidade), Q5 dos wireframes (formatos) e decisões de Ideação D07 e D08.

## Restrições

| # | Restrição | Origem |
|---|-----------|--------|
| C1 | Frontend em React com TypeScript, Vite e Shadcn; backend em NestJS com TypeScript, Prisma e Postgres. | Descrição inicial da iniciativa |
| C2 | Repositório único com `apps/api` e `apps/web` em npm workspaces. | Practices Discovery Q1 |
| C3 | Ambiente de execução apenas local, via Docker e Docker Compose. Sem servidor externo, homologação ou produção. | Ideação D07 |
| C4 | Pipeline limitado a integração contínua. Sem publicação de imagens e sem entrega contínua. | Ideação D08 |
| C5 | Nenhum serviço da AWS e nenhum passo que exija credenciais AWS. | Regra afirmada em `project.md` |
| C6 | Identificadores de código em inglês, com glossário 1:1 dos termos de domínio em português. | `team-practices.md` |
| C7 | Artefatos legíveis por pessoas em português; código e comentários em inglês. | Regra afirmada em `project.md` |
| C8 | Desenvolvedor único, com disponibilidade de 10 a 20 horas por semana. | Approval & Handoff Q3 |

## Suposições

| # | Suposição | Razão |
|---|-----------|-------|
| A1 | O sistema não será operado por uma instituição de ensino real, portanto não há obrigação regulatória decorrente de operação institucional. | Captura de Intenção Q17. Os dados modelados têm forma de dado pessoal, então proteção básica segue como boa prática. |
| A2 | O volume de chamados é baixo o bastante para dispensar otimização de consulta além de índice e paginação. | Não há operação real nem meta de desempenho; a etapa de validação de desempenho está fora do plano. |
| A3 | Um usuário pertence a exatamente um setor quando é Atendente ou Gestor. | Decorre de FR5.1 e FR5.3, mas nenhuma resposta tratou de atendente multi-setor. |
| A4 | Professor tem exatamente o mesmo comportamento de Aluno como solicitante, sem privilégio adicional. | Captura de Intenção Q14. |
| A5 | A janela de reabertura de 3 dias é contada a partir do momento do encerramento, em dias corridos, não úteis. | Q9 disse "dias corridos"; a contagem a partir do encerramento é inferência. |

## Fora de Escopo

Itens explicitamente excluídos, com origem rastreável:

| Item | Origem |
|------|--------|
| Aplicativo mobile nativo | Captura de Intenção Q8 |
| Automação avançada baseada em IA | Captura de Intenção Q8 |
| Integrações não especificadas | Captura de Intenção Q8 |
| Anexos nos chamados | Definição de Escopo Q5 |
| Notificação por e-mail ou qualquer canal externo | Definição de Escopo Q4 |
| SLA e prazos automáticos por categoria | Definição de Escopo Q6 |
| Exportação de relatórios em PDF ou CSV | Definição de Escopo Q6 e Q7 |
| Base de conhecimento ou FAQ | Definição de Escopo Q6 |
| Auto-cadastro de usuários | Requirements Analysis Q6 |
| Auto-recuperação de senha pelo próprio usuário | Requirements Analysis Q5 |
| Implantação em servidor externo, entrega contínua, ambientes de homologação e produção | Ideação D07 e D08 |
| Teste automatizado de navegador | Practices Discovery Q6 |

## Consequências para Artefatos Anteriores

Três respostas desta etapa alteram o que os wireframes desenharam. Registrado aqui para que o desenho funcional não replique a versão antiga:

| Artefato | O que muda | Origem |
|----------|-----------|--------|
| `rough-mockups/wireframes.md` Tela 4 | O campo "Setor responsável" deixa de ser um seletor editável e passa a ser exibição do setor derivado da categoria. | FR4.2, Q1 |
| `rough-mockups/wireframes.md` Tela 1 | O link "Esqueci minha senha" sai da tela de login. | FR1.4, Q5 |
| `rough-mockups/wireframes.md` Tela 8 | A aba Usuários ganha a ação de redefinir senha. | FR2.5, Q5 |

## Questões em Aberto

| Questão | Resolve em |
|---------|-----------|
| Matriz completa de perfil × recurso × operação, incluindo o que o Gestor pode fazer além do Atendente. | Functional Design |
| Um Atendente pode pertencer a mais de um setor? A suposição A3 diz que não. | Functional Design |
| Estilo da API do backend (REST, GraphQL ou outro). | Contract Design |
| A Comunicação no Chamado permanece unidade separada do ciclo de vida do chamado? | Units Generation |
| Escala e semântica da avaliação de atendimento (FR12), caso ela entre no plano. | Functional Design, se FR12 for construído |

## Assumptions & Open Questions

Ver as seções **Suposições** e **Questões em Aberto** acima, que são a forma completa desta seção neste artefato. Nenhuma suposição adicional além das cinco listadas (A1 a A5).

## Review

**Verdict:** NOT-READY
**Reviewer:** aidlc-product-lead-agent
**Date:** 2026-09-08T16:00:28Z
**Iteration:** 1

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Critical | requirements.md > FR4 (Ciclo de Vida do Chamado) | A resposta confirmada em Q3 diz que "o atendente pode alterar depois" a prioridade escolhida pelo solicitante, mas nenhum FR concede essa capacidade. FR3.6 e FR4.1 só cobrem a escolha inicial pelo solicitante; não há linha de FR4 ou FR5 permitindo ao atendente ou gestor alterar a prioridade de um chamado existente. | Adicionar um FR explícito (ex.: FR4.9 ou FR5.x) que permita ao atendente ou gestor alterar a prioridade de um chamado, com critério de aceitação testável (quem pode alterar, se gera registro de histórico). | New |
| R-02 | Major | requirements.md > FR9 (Área Administrativa) vs `project.md` Mandado/Corrections | FR9 é rotulado Should have, e o `project.md` afirma que o corte mínimo exige apenas que categorias e setores sejam administráveis pelo modelo de dados, com a interface dedicada vindo depois. Ainda assim FR9.1 declara que a interface de gerenciamento de usuários "é entregue mesmo se o restante de FR9 for cortado" — promovendo parte de um bloco Should have a Must de fato, sem que o documento explique como o Administrador cadastraria usuários (FR2.1, Must) na ausência dessa interface, e sem aplicar o mesmo raciocínio a FR3 (setores/categorias), que permanece explicitamente sem exigência de interface no corte mínimo. Isso é uma contradição interna sobre o que é realmente Must. | Ou (a) documentar um caminho não-UI para FR2 (ex.: seed/script/API administrativa) e manter FR9 inteiramente Should have, ou (b) reclassificar FR9.1 como Must explicitamente e registrar a origem dessa mudança de escopo em vez de embuti-la na tabela de FR9. | New |
| R-03 | Major | requirements.md > FR8.1 (Máquina de Transições) | A transição Em análise → Aguardando solicitante e a transição inversa Aguardando solicitante → Em análise existem na tabela de FR8.1, mas nenhum requisito (diferente de FR8.2 para "assumir" e FR5.7 para "encerrar") descreve o ator ou a ação que dispara essas duas transições. Sem uma ação nomeada, QA não consegue escrever um teste de pass/fail para elas. | Adicionar um FR (ou sub-item de FR5) que nomeie a ação e o ator que move o chamado para Aguardando solicitante e o que o traz de volta a Em análise. | New |
| R-04 | Major | requirements.md > FR5.3 vs FR8.2 | FR8.2 diz que assumir um chamado Aberto leva-o a Em análise. FR5.3 permite ao gestor atribuir um chamado a um atendente do próprio setor, mas não diz se essa atribuição também muda o status. Isso deixa em aberto se um chamado atribuído pelo gestor permanece Aberto com responsável preenchido — o que contradiz o invariante implícito por FR4.1 (chamado nasce Aberto e sem responsável) e por FR8.2 (responsável só aparece ao entrar em Em análise). | Especificar em FR5.3 se a atribuição pelo gestor também transiciona o chamado para Em análise, com o mesmo nível de detalhe de FR8.2. | New |
| R-05 | Major | requirements.md > FR5.6 vs FR6.5 | FR5.6 garante ao atendente visibilidade de chamados que já passaram pelo seu setor antes de uma transferência. FR6.5 restringe a leitura de mensagens a "o solicitante, o responsável atual, e atendentes ou gestores do setor" — sem esclarecer se "do setor" inclui o setor de origem (pós-transferência) ou só o setor atual. Como estão redigidos, os dois requisitos permitem leituras conflitantes do mesmo cenário: um atendente do setor de origem pode ver o chamado (FR5.6) mas ser barrado da leitura das mensagens (FR6.5), sem que isso seja afirmado como intencional. | Esclarecer explicitamente em FR6.5 se o setor de origem mantém acesso de leitura às mensagens de um chamado transferido, alinhando com o escopo de visibilidade de FR5.6. | New |
| R-06 | Minor | requirements.md > FR10.2 | "Tempo médio de atendimento" e "tempo médio de resolução" não têm o marco inicial e final definidos (por exemplo, se "atendimento" conta do Aberto até Em análise, e "resolução" do Aberto até Encerrado). Como FR10 é Could have, isso não bloqueia o corte mínimo, mas fica sem critério de aceitação totalmente testável se e quando for construído. | Definir os marcos de início/fim de cada métrica antes de iniciar o desenho funcional de FR10, caso o item entre no plano. | New |

### Summary

O documento é bem estruturado, rastreia origem por requisito e é honesto sobre o corte da análise de NFR dedicada. Mas a fidelidade às respostas não é completa (R-01: uma capacidade confirmada em Q3 nunca virou requisito), há uma contradição não resolvida entre o corte mínimo afirmado para a Área Administrativa e a promoção de FR9.1 a Must de fato (R-02), e a máquina de transições de FR8 tem lacunas de acionamento e pontos de ambiguidade com FR5.3 e FR6.5 (R-03, R-04, R-05) que impedem escrever testes de aceitação sem inferir comportamento não especificado. Combinados, esses achados (1 Critical + 4 Major) ultrapassam o limite de tolerância da política de veredito desta fase, por isso o veredito é NOT-READY nesta passagem consultiva — a decisão final de aprovar ou pedir revisão cabe ao humano no portão.
