# Regras de Negócio — U1 Fundação (`u1-foundation`)

Derivado de `requirements.md` (FR1, FR2, FR3, FR9, NFR1–NFR9), `stories.md` (US1.1, US4.1, US4.2, US5.1, US5.3, US5.4 e critérios transversais), `contract-summary.md` (X-01, API-U1) e das respostas confirmadas em `functional-design-questions.md`.

## Regras

O bloco YAML é a fonte da verdade das regras de U1. Identificadores de regra seguem `BR{grupo}.{sequência}`. Códigos de erro, valores de enum e nomes de campo são identificadores e ficam em inglês.

Grupos: BR1 autenticação e sessão; BR2 autorização; BR3 usuários; BR4 catálogos; BR5 carga inicial e configuração; BR6 entrada e erros; BR7 interface; BR8 contratos de serviço expostos às outras unidades.

```yaml
rules:
  - id: BR1.1
    statement: O login identifica o usuário por e-mail e senha, com o e-mail comparado em minúsculas e sem espaços nas pontas.
    category: validation
    applies_to: login
    trigger: requisição de login
    logic: IF o e-mail normalizado corresponde a um usuário E a senha confere com o hash armazenado E o usuário está ativo THEN a sessão é iniciada
    violation: ver BR1.2
    source: FR1.1

  - id: BR1.2
    statement: Credencial inválida, e-mail inexistente e usuário desativado recebem exatamente a mesma resposta.
    category: policy
    applies_to: login
    trigger: login que não inicia sessão por qualquer desses três motivos
    logic: IF e-mail inexistente OR senha errada OR usuário inativo THEN responder 401 com o código AUTH_INVALID_CREDENTIALS e a mesma mensagem
    violation: nenhuma resposta pode distinguir os três casos
    source: FR1.1, FR2.6, AC1.1.2, AC1.1.3, Q5

  - id: BR1.3
    statement: O tempo de resposta do login não revela se o e-mail existe.
    category: policy
    applies_to: login
    trigger: login com e-mail inexistente
    logic: IF o e-mail não corresponde a nenhum usuário THEN a verificação de senha é executada mesmo assim contra um hash de referência, com o mesmo custo de uma verificação real
    violation: não se aplica; é uma propriedade do fluxo
    source: FR1.1, AC1.1.2

  - id: BR1.4
    statement: Mais de cinco tentativas falhas de login para o mesmo e-mail dentro de 15 minutos bloqueiam novas tentativas desse e-mail até o fim da janela.
    category: policy
    applies_to: login
    trigger: tentativa de login para um e-mail
    logic: >
      IF o e-mail (normalizado) já tem 5 falhas registradas na janela aberta pela primeira falha, que dura 15 minutos,
      THEN a tentativa é recusada sem verificar a senha;
      IF o login tem sucesso THEN a contagem desse e-mail é zerada;
      IF a janela termina THEN a contagem é zerada.
      A contagem existe para qualquer e-mail informado, exista ou não o usuário.
    violation: 429 com o código AUTH_TOO_MANY_ATTEMPTS e indicação do tempo restante até nova tentativa
    source: Q6 (questão aberta de contract-summary.md; RSK-06 de risk-and-sequencing-rationale.md)

  - id: BR1.5
    statement: A sessão é um token que identifica só o usuário, dura 8 horas a partir da emissão e viaja num cookie inacessível a scripts.
    category: policy
    applies_to: sessão
    trigger: login com sucesso
    logic: IF o login tem sucesso THEN emitir token com o identificador do usuário e validade de 8 horas, entregue em cookie httpOnly, SameSite=Strict, restrito ao caminho /api, sem refresh token
    violation: não se aplica
    source: FR1.2, AC1.1.7, Q7, team.md

  - id: BR1.6
    statement: O logout apaga o cookie de sessão no navegador e não invalida o token no servidor.
    category: policy
    applies_to: logout
    trigger: requisição de logout
    logic: IF logout é pedido THEN responder 204 instruindo o navegador a apagar o cookie, com ou sem sessão válida
    violation: não se aplica
    source: FR1.3, AC1.1.4, team.md

  - id: BR1.7
    statement: Requisição autenticada sem token, com token inválido ou expirado recebe 401.
    category: authorization
    applies_to: toda rota não pública
    trigger: requisição a rota não pública
    logic: IF o token está ausente, malformado, com assinatura inválida ou expirado THEN responder 401 com UNAUTHENTICATED; o frontend leva o usuário à tela de login
    violation: 401 UNAUTHENTICATED
    source: FR1.2, AC1.1.5

  - id: BR1.8
    statement: A cada requisição autenticada, perfil, setor e situação do usuário são lidos do banco, nunca do token.
    category: authorization
    applies_to: toda rota não pública
    trigger: requisição com token válido
    logic: IF o usuário do token não existe ou está inativo THEN responder 401 UNAUTHENTICATED; ELSE o ator da requisição usa o perfil e o setor lidos agora
    violation: 401 UNAUTHENTICATED
    source: CT10, AC1.1.3, AC4.1.3, AC4.1.5

  - id: BR1.9
    statement: Não existe criação de conta pelo próprio usuário nem recuperação de senha pelo próprio usuário.
    category: constraint
    applies_to: rotas públicas e tela de login
    trigger: não se aplica
    logic: As únicas rotas públicas são login e logout; a tela de login não oferece recuperação de senha
    violation: não se aplica
    source: FR1.4, FR2.2, AC1.1.6, AC4.1.8

  - id: BR2.1
    statement: Toda rota é negada por padrão; só responde a rota marcada como pública ou com os perfis permitidos declarados.
    category: authorization
    applies_to: toda rota
    trigger: requisição a qualquer rota
    logic: IF a rota não tem marcação pública nem lista de perfis THEN responder 403 FORBIDDEN para qualquer perfil
    violation: 403 FORBIDDEN
    source: FR1.5, AC5.1.3, team.md

  - id: BR2.2
    statement: Um ator cujo perfil não está entre os permitidos da rota recebe 403 sem nenhum dado do recurso.
    category: authorization
    applies_to: toda rota com lista de perfis
    trigger: requisição autenticada
    logic: IF o perfil do ator (lido conforme BR1.8) não está na lista da rota THEN responder 403 FORBIDDEN antes de qualquer leitura do recurso
    violation: 403 FORBIDDEN
    source: NFR2, AC5.1.1, AC4.1.7

  - id: BR2.3
    statement: A verificação de autorização falha fechada.
    category: authorization
    applies_to: toda rota não pública
    trigger: falha ao resolver o ator
    logic: IF o ator não pode ser resolvido por qualquer motivo, inclusive erro interno THEN a requisição é negada, nunca atendida
    violation: 401 UNAUTHENTICATED quando não há ator; 500 INTERNAL_ERROR sem detalhe quando a resolução falha por erro interno, sem executar a operação
    source: ADR-004, AC5.1.1

  - id: BR2.4
    statement: Um teste enumera as rotas registradas e falha se alguma rota não pública estiver sem lista de perfis, ou se existir rota pública além de login e logout.
    category: constraint
    applies_to: conjunto de rotas da aplicação
    trigger: execução da suíte de testes
    logic: IF alguma rota registrada não é login nem logout E não tem lista de perfis THEN o teste falha; IF existe rota pública de criação de conta ou de recuperação de senha THEN o teste falha
    violation: suíte de testes falha
    source: AC5.1.4, AC4.1.8, M5

  - id: BR2.5
    statement: Nenhuma operação de U1 devolve dados de outro usuário a um ator que não seja administrador.
    category: authorization
    applies_to: operações de usuário e sessão
    trigger: requisição autenticada
    logic: IF o ator não é ADMIN THEN a única leitura de dados de usuário disponível é a do próprio ator (sessão atual)
    violation: 403 FORBIDDEN nas rotas de usuários
    source: NFR1, AC5.1.2

  - id: BR2.6
    statement: Requisição que altera estado vinda de outra origem é recusada.
    category: authorization
    applies_to: toda requisição POST, PUT, PATCH ou DELETE
    trigger: requisição com cabeçalho de origem
    logic: IF o cabeçalho de origem está presente E difere da origem do próprio sistema THEN responder 403 FORBIDDEN sem executar a operação
    violation: 403 FORBIDDEN
    source: X-01 de contract-summary.md (Q9 do Desenho de Contratos)

  - id: BR2.7
    statement: Perfis permitidos por operação de U1.
    category: authorization
    applies_to: operações de API-U1
    trigger: requisição a operação de U1
    logic: >
      login e logout: públicas.
      Sessão atual: qualquer autenticado.
      Listar, ver, criar e alterar usuários, e redefinir senha: somente ADMIN.
      Listar setores, categorias, status e prioridades: qualquer autenticado.
      Criar e alterar setores, categorias e prioridades, e alterar rótulo de status: somente ADMIN.
    violation: 403 FORBIDDEN
    source: AC4.1.7, AC5.1.1, FR9

  - id: BR3.1
    statement: Criar usuário exige nome, e-mail, perfil e senha, com e-mail único sem distinção de maiúsculas.
    category: validation
    applies_to: criação de usuário
    trigger: pedido de criação
    logic: IF falta nome, e-mail, perfil ou senha THEN recusar por validação; IF já existe usuário com o mesmo e-mail normalizado, ativo ou inativo THEN recusar por duplicidade
    violation: 400 VALIDATION_FAILED; 409 USER_EMAIL_TAKEN
    source: FR2.1, AC4.1.1, AC4.1.2

  - id: BR3.2
    statement: Todo usuário tem exatamente um dos cinco perfis.
    category: constraint
    applies_to: criação e alteração de usuário
    trigger: pedido com perfil
    logic: IF o perfil não é STUDENT, PROFESSOR, AGENT, MANAGER ou ADMIN THEN recusar
    violation: 400 VALIDATION_FAILED
    source: FR2.3, AC4.1.9

  - id: BR3.3
    statement: Atendente e Gestor exigem um setor existente e ativo; os outros perfis não têm setor.
    category: validation
    applies_to: criação e alteração de usuário
    trigger: pedido que define ou mantém perfil AGENT ou MANAGER, ou outro perfil
    logic: >
      IF o perfil resultante é AGENT ou MANAGER E não há setor THEN recusar;
      IF o setor informado não existe THEN recusar como item inexistente;
      IF o setor informado está inativo THEN recusar como item inativo;
      IF o perfil resultante é outro THEN o setor fica vazio, mesmo que tenha sido enviado
    violation: 422 USER_SECTOR_REQUIRED; 404 CATALOG_ITEM_NOT_FOUND; 422 CATALOG_ITEM_INACTIVE
    source: FR2.7, AC4.1.6, Q10

  - id: BR3.4
    statement: A senha tem de 8 a 128 caracteres, com ao menos uma letra e ao menos um algarismo.
    category: validation
    applies_to: criação de usuário, redefinição de senha e senha do administrador inicial
    trigger: senha informada
    logic: IF o tamanho é menor que 8 ou maior que 128 OR não há letra OR não há algarismo THEN recusar
    violation: 400 VALIDATION_FAILED com código de campo específico
    source: Q8 (mínimo e composição); limite de 128 como proteção de entrada, derivado

  - id: BR3.5
    statement: A senha é guardada apenas como hash lento e resistente a força bruta, e nunca é devolvida.
    category: constraint
    applies_to: armazenamento e respostas de usuário
    trigger: criação, redefinição e carga inicial
    logic: IF uma senha é definida THEN guardar só o hash (argon2id ou equivalente de custo comparável); nenhuma resposta inclui a senha nem o hash
    violation: não se aplica
    source: NFR7, CT3

  - id: BR3.6
    statement: A alteração de perfil ou de setor vale a partir da próxima requisição do usuário alterado.
    category: policy
    applies_to: alteração de usuário
    trigger: alteração de perfil ou setor aceita
    logic: IF o perfil ou o setor muda THEN nenhuma sessão é invalidada, e a próxima requisição desse usuário já usa os valores novos (BR1.8); as regras BR3.3 e BR3.9 valem para o estado resultante
    violation: não se aplica
    source: FR2.4, AC4.1.3

  - id: BR3.7
    statement: Redefinir a senha substitui o hash; a senha anterior deixa de autenticar e o bloqueio de tentativas daquele e-mail é zerado.
    category: policy
    applies_to: redefinição de senha
    trigger: redefinição aceita
    logic: IF a senha é redefinida THEN o hash anterior é substituído E a contagem de BR1.4 do e-mail é zerada; sessões já abertas continuam válidas até expirar, porque não há invalidação no servidor
    violation: não se aplica
    source: FR2.5, AC4.1.4, team.md

  - id: BR3.8
    statement: Desativar um usuário preserva o registro e tudo o que ele produziu; reativar é permitido.
    category: policy
    applies_to: alteração da situação do usuário
    trigger: alteração de active
    logic: IF active passa a false THEN o usuário não autentica (BR1.2) e perde a sessão na próxima requisição (BR1.8), sem nenhum dado apagado; IF active volta a true THEN ele volta a autenticar com a senha atual
    violation: não se aplica
    source: FR2.6, AC4.1.5

  - id: BR3.9
    statement: O sistema nunca fica sem administrador ativo.
    category: constraint
    applies_to: alteração de usuário
    trigger: pedido que desativa um usuário ou tira dele o perfil ADMIN
    logic: >
      IF o alvo é o próprio ator E o pedido desativa ou tira o perfil ADMIN THEN recusar;
      IF o alvo é o único ADMIN ativo E o pedido o desativa ou tira o perfil ADMIN THEN recusar.
      A verificação e a alteração acontecem de forma atômica, para que dois pedidos simultâneos não deixem o sistema sem administrador.
    violation: 422 USER_SELF_MODIFICATION_FORBIDDEN; 422 USER_LAST_ACTIVE_ADMIN
    source: Q9

  - id: BR3.10
    statement: Mudar perfil, setor ou situação de um usuário nunca é recusado por causa de chamados.
    category: policy
    applies_to: alteração de usuário
    trigger: alteração aceita pelas demais regras
    logic: U1 não consulta chamados; o efeito da mudança sobre chamados atribuídos a esse usuário é decidido no Desenho Funcional de U2
    violation: não se aplica
    source: grafo de unidades (U1 não depende de U2)

  - id: BR4.1
    statement: Nomes e rótulos de catálogo são obrigatórios e únicos sem distinção de maiúsculas, contando itens ativos e inativos.
    category: validation
    applies_to: criação e alteração de setor, categoria, status e prioridade
    trigger: pedido com nome ou rótulo
    logic: IF o nome ou rótulo está vazio THEN recusar; IF já existe item da mesma entidade com o mesmo nome ou rótulo, sendo que para categoria vale dentro do mesmo setor THEN recusar. A comparação considera itens ativos e inativos, no mesmo padrão de BR3.1; o nome de um item desativado não é reaproveitado por um item novo, e o administrador reativa o item existente
    violation: 400 VALIDATION_FAILED; 409 CATALOG_NAME_TAKEN
    source: FR3.1, AC4.2.1; unicidade derivada

  - id: BR4.2
    statement: Toda categoria pertence a exatamente um setor existente e ativo no momento em que é criada ou movida.
    category: validation
    applies_to: criação e alteração de categoria
    trigger: pedido que define o setor da categoria
    logic: IF não há setor THEN recusar por validação; IF o setor não existe THEN recusar como inexistente; IF o setor está inativo THEN recusar como inativo
    violation: 400 VALIDATION_FAILED; 404 CATALOG_ITEM_NOT_FOUND; 422 CATALOG_ITEM_INACTIVE
    source: FR3.2, AC4.2.2

  - id: BR4.3
    statement: Desativar um item de catálogo não altera nenhum registro que já o referencia.
    category: policy
    applies_to: desativação de setor, categoria e prioridade
    trigger: active passa a false
    logic: IF um item é desativado THEN ele deixa de ser oferecido como opção para registros novos, E continua sendo exibido, com seu nome, em todo registro que já o referencia
    violation: não se aplica
    source: FR3.7, AC4.2.3, AC4.2.4

  - id: BR4.4
    statement: Uma categoria só é oferecida para abertura de chamado quando ela e o seu setor estão ativos.
    category: calculation
    applies_to: listagem de categorias disponíveis para abertura
    trigger: consulta de opções para abertura de chamado
    logic: categoria disponível = categoria ativa AND setor da categoria ativo
    violation: não se aplica
    source: FR3.1, AC4.2.3, Q10

  - id: BR4.5
    statement: Um setor pode ser desativado mesmo com categorias ativas, e setor inativo não recebe usuários novos nem chamados transferidos.
    category: policy
    applies_to: desativação de setor e uso de setor como destino
    trigger: desativação de setor; vínculo de usuário a setor; transferência de chamado
    logic: IF o setor é desativado THEN as categorias dele mantêm a própria situação e somem das opções (BR4.4) até o setor ser reativado; IF um setor inativo é informado como setor de usuário ou destino de transferência THEN recusar
    violation: 422 CATALOG_ITEM_INACTIVE
    source: Q10, AC4.2.3

  - id: BR4.6
    statement: Existem exatamente quatro status, com chaves imutáveis; o administrador só altera o rótulo.
    category: constraint
    applies_to: status
    trigger: qualquer pedido sobre status
    logic: >
      As chaves são OPEN, IN_ANALYSIS, WAITING_REQUESTER e CLOSED.
      IF o pedido altera o rótulo THEN aplicar BR4.1;
      nenhum status é criado, desativado ou tem a chave alterada.
      Desvio consciente de FR9.2, que previa criação e desativação também para status.
    violation: não há operação para criar ou desativar status; campo de chave enviado é descartado
    source: FR3.3, FR3.5, AC4.2.5, Q3, ADR-006

  - id: BR4.7
    statement: Existe sempre exatamente uma prioridade padrão, e ela está ativa.
    category: constraint
    applies_to: criação e alteração de prioridade
    trigger: pedido que marca prioridade como padrão ou desativa prioridade
    logic: >
      IF uma prioridade é marcada como padrão THEN a marcação sai da anterior na mesma operação;
      IF o pedido desativa a prioridade padrão, ou desmarca a padrão sem marcar outra THEN recusar;
      IF o pedido marca como padrão uma prioridade inativa THEN recusar.
      A prioridade não tem chave estável.
    violation: 422 CATALOG_DEFAULT_PRIORITY_REQUIRED
    source: FR3.4, FR3.6, AC4.2.5, Q2

  - id: BR4.8
    statement: Antes de desativar um item de catálogo, a interface pede confirmação explicando o efeito sobre registros existentes.
    category: policy
    applies_to: tela de administração
    trigger: ação de desativar setor, categoria ou prioridade
    logic: IF o administrador pede para desativar THEN exibir confirmação dizendo que o item deixa de ser oferecido para novos chamados e continua visível nos existentes; só então enviar o pedido
    violation: não se aplica
    source: FR9.3, AC4.2.6

  - id: BR5.1
    statement: A carga inicial garante os quatro status e as três prioridades, sem duplicar nem sobrescrever o que já existe.
    category: policy
    applies_to: inicialização do sistema
    trigger: subida da aplicação
    logic: >
      IF falta status para alguma das quatro chaves THEN criá-lo com o rótulo inicial (Aberto, Em análise, Aguardando solicitante, Encerrado);
      IF não existe nenhuma prioridade THEN criar Baixa, Normal (padrão) e Alta;
      rótulos já editados pelo administrador nunca são sobrescritos
    violation: não se aplica
    source: FR3.5, FR3.6, AC4.2.5

  - id: BR5.2
    statement: O administrador inicial vem de configuração obrigatória e só é criado se não houver administrador ativo.
    category: policy
    applies_to: inicialização do sistema
    trigger: subida da aplicação
    logic: >
      IF não existe usuário ADMIN ativo THEN criar um usuário ADMIN ativo com o e-mail e a senha configurados, e nome Administrador;
      IF já existe usuário com esse e-mail THEN não criar outro, e a inicialização falha com mensagem explícita;
      IF já existe ADMIN ativo THEN nada acontece
    violation: a aplicação não sobe e registra o motivo
    source: Q1, FR2.2

  - id: BR5.3
    statement: A aplicação não sobe se faltar configuração obrigatória ou se ela for inválida.
    category: validation
    applies_to: inicialização do sistema
    trigger: subida da aplicação
    logic: IF falta segredo de assinatura do token, conexão com o banco, e-mail ou senha do administrador inicial, OR a senha inicial viola BR3.4 THEN encerrar a inicialização com mensagem que nomeia a configuração, sem exibir valores
    violation: a aplicação não sobe
    source: NFR9, CT5, Q1

  - id: BR6.1
    statement: Toda resposta de erro usa o envelope único, e nenhum erro interno ou de banco vaza.
    category: policy
    applies_to: toda operação
    trigger: qualquer erro
    logic: IF ocorre erro THEN responder com error.code estável, error.message de apoio, error.details opcional e error.traceId; IF o erro é inesperado THEN usar INTERNAL_ERROR sem detalhe
    violation: não se aplica
    source: NFR3, CT2, X-01

  - id: BR6.2
    statement: Campos desconhecidos numa requisição são descartados antes de qualquer regra.
    category: validation
    applies_to: toda operação com corpo
    trigger: requisição com campos não previstos
    logic: IF o corpo traz campo não previsto na operação THEN o campo é ignorado, sem erro
    violation: não se aplica
    source: X-01

  - id: BR6.3
    statement: Erro de validação indica cada campo com um código específico.
    category: validation
    applies_to: toda operação com corpo
    trigger: corpo que viola regras de forma
    logic: IF um ou mais campos são inválidos THEN responder 400 VALIDATION_FAILED com details listando campo e código de cada violação
    violation: 400 VALIDATION_FAILED
    source: CT8, AC4.2.2

  - id: BR7.1
    statement: Toda tela de U1 é operável só pelo teclado, com foco visível, rótulos visíveis, informação não transmitida só por cor e contraste vindo do tema padrão.
    category: policy
    applies_to: telas de U1 (login, casca, administração)
    trigger: não se aplica
    logic: >
      Primeiro elemento focável é o atalho para o conteúdo; regiões de cabeçalho, navegação e conteúdo marcadas;
      item de navegação ativo indicado além da cor; todo campo com rótulo visível associado;
      situação ativa ou inativa em texto; nenhuma cor sobrescreve a paleta do tema sem justificativa registrada
    violation: item reprovado no roteiro de inspeção manual ou em teste de componente
    source: NFR5, AC5.3.1, AC5.3.2, AC5.3.3, AC5.3.4, AC5.3.5, AC5.3.6

  - id: BR7.2
    statement: Em telas estreitas, a navegação recolhe em menu e nenhuma página de U1 rola na horizontal.
    category: policy
    applies_to: telas de U1
    trigger: largura de tela abaixo de 768px
    logic: >
      IF a largura é menor que 768px THEN a barra lateral vira menu acionável;
      a tela de login não tem rolagem horizontal em 375px;
      tabelas de administração rolam na horizontal só dentro do próprio contentor;
      a apresentação em cartões da listagem de chamados é responsabilidade de U2
    violation: item reprovado no roteiro de inspeção manual
    source: NFR6, AC5.4.1, AC5.4.2, AC5.4.3, AC5.4.4

  - id: BR7.3
    statement: Depois do login, cada perfil vai para a sua tela de entrada.
    category: policy
    applies_to: navegação após login
    trigger: login com sucesso ou abertura do sistema com sessão válida
    logic: IF o perfil é ADMIN THEN ir para Administração; ELSE ir para a tela provisória de entrada, que mostra nome e perfil, até U2 registrar a tela de entrada definitiva de cada perfil
    violation: não se aplica
    source: AC1.1.1, wireframes.md Tela 2

  - id: BR7.4
    statement: Toda tela que carrega dados tem estado de carregamento, vazio explicativo e erro com ação de repetir; todo formulário valida ao sair do campo e preserva o texto quando o envio falha.
    category: policy
    applies_to: telas de U1
    trigger: carregamento de dados ou envio de formulário
    logic: IF carregando THEN esqueleto; IF lista vazia THEN mensagem explicativa; IF erro THEN mensagem com ação de repetir; IF envio falha THEN manter o texto digitado e mostrar o erro junto ao campo ou acima dos botões
    violation: não se aplica
    source: CT7, CT8

  - id: BR7.5
    statement: A mensagem mostrada ao usuário vem da tradução do código de erro no frontend.
    category: policy
    applies_to: telas de U1
    trigger: resposta de erro
    logic: IF a resposta traz error.code THEN mostrar o texto em português associado a esse código; IF o código não tem tradução THEN mostrar mensagem genérica de erro com o traceId
    violation: não se aplica
    source: CT11, AC1.1.2

  - id: BR7.6
    statement: A navegação de U1 mostra Administração apenas para o perfil ADMIN.
    category: authorization
    applies_to: casca do frontend
    trigger: renderização da navegação
    logic: IF o perfil do ator é ADMIN THEN mostrar o item Administração; ELSE não mostrar; itens de outras unidades são acrescentados por elas
    violation: não se aplica; a proteção real é BR2.2
    source: AC4.1.7, wireframes.md

  - id: BR8.1
    statement: O ator entregue às outras unidades tem só identificador, perfil e setor, lidos do banco na requisição corrente.
    category: authorization
    applies_to: ator autenticado e marcações de rota de SVC-01, SVC-02, SVC-04 e SVC-06
    trigger: requisição autenticada que chega a uma operação de outra unidade
    logic: O ator é montado conforme BR1.8 e entregue sem nome, e-mail ou hash de senha; as outras unidades declaram perfis por rota com as mesmas marcações de BR2.1 e BR2.2 e nunca leem o token diretamente
    violation: não se aplica; a recusa é a de BR1.7, BR1.8 e BR2.2
    source: contract-summary.md SVC-01, SVC-02, SVC-04, SVC-06; CT10

  - id: BR8.2
    statement: O resumo de usuários devolve nome, perfil, setor e situação dos usuários pedidos, inclusive inativos, e omite identificadores desconhecidos.
    category: policy
    applies_to: UsersPublicService.findSummariesByIds
    trigger: chamada de U2 ou U3 para exibir autor, solicitante ou responsável
    logic: IF o identificador existe THEN devolver id, name, role, sectorId e active, esteja o usuário ativo ou não; IF não existe THEN omiti-lo, sem erro; nunca devolver e-mail nem hash de senha; a ordem da resposta não é garantida
    violation: não se aplica
    source: contract-summary.md SVC-01, SVC-02; FR2.6 (registros de usuário desativado continuam legíveis)

  - id: BR8.3
    statement: Um usuário pode receber atribuição num setor quando está ativo, é Atendente ou Gestor e pertence exatamente a esse setor.
    category: calculation
    applies_to: UsersPublicService.isAssignableInSector
    trigger: chamada de U2 ao assumir ou atribuir chamado
    logic: atribuível = usuário existe AND active AND role em (AGENT, MANAGER) AND sectorId igual ao setor informado; a situação do setor não entra no cálculo, para que chamados que já estão num setor desativado continuem podendo ser atribuídos
    violation: não se aplica; o método devolve falso, e a recusa com código de erro é de U2
    source: contract-summary.md SVC-01; FR5.3, AC3.1.2; US3 (o Gestor executa tudo o que o Atendente executa no seu setor)

  - id: BR8.4
    statement: A consulta de categoria ativa só devolve categoria disponível para abertura de chamado, com o setor derivado.
    category: validation
    applies_to: CatalogPublicService.getActiveCategory
    trigger: chamada de U2 ao abrir chamado
    logic: IF a categoria não existe THEN CATALOG_ITEM_NOT_FOUND; IF a categoria está inativa OR o setor dela está inativo THEN CATALOG_ITEM_INACTIVE; ELSE devolver id, name, active e sectorId — a mesma condição de BR4.4
    violation: 404 CATALOG_ITEM_NOT_FOUND; 422 CATALOG_ITEM_INACTIVE
    source: contract-summary.md SVC-01; FR4.2, BR4.4

  - id: BR8.5
    statement: As consultas de setor ativo e de prioridade ativa só devolvem item existente e ativo.
    category: validation
    applies_to: CatalogPublicService.getActiveSector e CatalogPublicService.getActivePriority
    trigger: chamada de U2 ao transferir chamado ou alterar prioridade, e de U1 ao vincular setor a usuário
    logic: IF o item não existe THEN CATALOG_ITEM_NOT_FOUND; IF está inativo THEN CATALOG_ITEM_INACTIVE; ELSE devolver id, name e active
    violation: 404 CATALOG_ITEM_NOT_FOUND; 422 CATALOG_ITEM_INACTIVE
    source: contract-summary.md SVC-01; BR4.5, FR3.7

  - id: BR8.6
    statement: A consulta de prioridade padrão devolve sempre a única prioridade padrão, que está ativa.
    category: calculation
    applies_to: CatalogPublicService.getDefaultPriority
    trigger: chamada de U2 ao abrir chamado sem prioridade informada
    logic: devolver a prioridade com isDefault verdadeiro; BR4.7 garante que existe exatamente uma e que está ativa; se essa invariante estiver quebrada, a chamada falha, e nunca escolhe uma prioridade arbitrária
    violation: 500 INTERNAL_ERROR se a invariante de BR4.7 estiver quebrada
    source: contract-summary.md SVC-01; FR3.6, AC1.2.3, BR4.7

  - id: BR8.7
    statement: A consulta de status por chave devolve o status de uma das quatro chaves.
    category: validation
    applies_to: CatalogPublicService.getStatusByKey
    trigger: chamada de U2 ao aplicar uma transição
    logic: IF a chave é OPEN, IN_ANALYSIS, WAITING_REQUESTER ou CLOSED THEN devolver id, key e label; ELSE CATALOG_ITEM_NOT_FOUND, situação que só ocorre por erro de programação, já que BR4.6 e BR5.1 garantem os quatro
    violation: 404 CATALOG_ITEM_NOT_FOUND
    source: contract-summary.md SVC-01; BR4.6, ADR-006

  - id: BR8.8
    statement: A consulta de rótulos devolve nome ou rótulo de todo item pedido, inclusive inativos, e omite identificadores desconhecidos.
    category: policy
    applies_to: CatalogPublicService.findLabels
    trigger: chamada de U2, U4 ou U5 para exibir categoria, setor, status ou prioridade
    logic: para cada identificador pedido que existe, devolver id, nome ou rótulo e — exceto para status, que não têm situação — active, esteja o item ativo ou não; identificadores desconhecidos são omitidos, sem erro
    violation: não se aplica
    source: contract-summary.md SVC-01, SVC-04; FR3.7, BR4.3

  - id: BR8.9
    statement: Os serviços públicos de U1 são só de leitura, não repetem a autorização de rota e só expõem os tipos do contrato.
    category: constraint
    applies_to: UsersPublicService e CatalogPublicService
    trigger: chamada de outra unidade
    logic: A autorização por perfil é da rota da unidade consumidora (BR2.2); os métodos públicos não gravam nada, não devolvem modelos de persistência e não expõem e-mail nem hash de senha
    violation: não se aplica
    source: contract-summary.md Q3 do Desenho de Contratos (um serviço público por bloco, sem tipos do Prisma)
```

## Resumo das Regras

| ID | Regra | Categoria | Código de erro |
|----|-------|-----------|----------------|
| BR1.1 | Login por e-mail normalizado e senha | validation | — |
| BR1.2 | Mesma resposta para e-mail inexistente, senha errada e usuário inativo | policy | AUTH_INVALID_CREDENTIALS |
| BR1.3 | Tempo de resposta não revela existência do e-mail | policy | — |
| BR1.4 | Bloqueio após 5 falhas em 15 minutos por e-mail | policy | AUTH_TOO_MANY_ATTEMPTS |
| BR1.5 | Token de 8 horas em cookie httpOnly, SameSite=Strict | policy | — |
| BR1.6 | Logout apaga o cookie, sem invalidação no servidor | policy | — |
| BR1.7 | Sem token válido, 401 | authorization | UNAUTHENTICATED |
| BR1.8 | Perfil e situação lidos do banco a cada requisição | authorization | UNAUTHENTICATED |
| BR1.9 | Sem auto-cadastro e sem auto-recuperação | constraint | — |
| BR2.1 | Negação por padrão | authorization | FORBIDDEN |
| BR2.2 | Perfil fora da lista, 403 sem dados | authorization | FORBIDDEN |
| BR2.3 | Autorização falha fechada | authorization | UNAUTHENTICATED, INTERNAL_ERROR |
| BR2.4 | Teste de enumeração de rotas | constraint | — |
| BR2.5 | Dados de usuário só para administrador ou para o próprio ator | authorization | FORBIDDEN |
| BR2.6 | Recusa de requisição de outra origem | authorization | FORBIDDEN |
| BR2.7 | Perfis por operação de U1 | authorization | FORBIDDEN |
| BR3.1 | Campos obrigatórios e e-mail único | validation | VALIDATION_FAILED, USER_EMAIL_TAKEN |
| BR3.2 | Exatamente um dos cinco perfis | constraint | VALIDATION_FAILED |
| BR3.3 | Setor ativo obrigatório para Atendente e Gestor | validation | USER_SECTOR_REQUIRED, CATALOG_ITEM_NOT_FOUND, CATALOG_ITEM_INACTIVE |
| BR3.4 | Senha de 8 a 128 caracteres, com letra e algarismo | validation | VALIDATION_FAILED |
| BR3.5 | Só hash lento, nunca devolvido | constraint | — |
| BR3.6 | Perfil e setor novos valem na próxima requisição | policy | — |
| BR3.7 | Redefinição invalida a senha anterior e zera o bloqueio | policy | — |
| BR3.8 | Desativação preserva dados; reativação permitida | policy | — |
| BR3.9 | Nunca sem administrador ativo | constraint | USER_SELF_MODIFICATION_FORBIDDEN, USER_LAST_ACTIVE_ADMIN |
| BR3.10 | Mudança de usuário não depende de chamados | policy | — |
| BR4.1 | Nome ou rótulo obrigatório e único, contando itens inativos | validation | VALIDATION_FAILED, CATALOG_NAME_TAKEN |
| BR4.2 | Categoria com setor existente e ativo | validation | VALIDATION_FAILED, CATALOG_ITEM_NOT_FOUND, CATALOG_ITEM_INACTIVE |
| BR4.3 | Desativação não altera registros existentes | policy | — |
| BR4.4 | Categoria disponível exige setor ativo | calculation | — |
| BR4.5 | Setor desativável com categorias; não recebe usuários nem transferências | policy | CATALOG_ITEM_INACTIVE |
| BR4.6 | Quatro status fixos, só rótulo editável | constraint | — |
| BR4.7 | Exatamente uma prioridade padrão, ativa | constraint | CATALOG_DEFAULT_PRIORITY_REQUIRED |
| BR4.8 | Confirmação antes de desativar | policy | — |
| BR5.1 | Carga inicial de status e prioridades sem sobrescrever | policy | — |
| BR5.2 | Administrador inicial por configuração | policy | — |
| BR5.3 | Não sobe sem configuração obrigatória válida | validation | — |
| BR6.1 | Envelope único, sem vazamento | policy | INTERNAL_ERROR |
| BR6.2 | Campos desconhecidos descartados | validation | — |
| BR6.3 | Erro de validação por campo | validation | VALIDATION_FAILED |
| BR7.1 | Acessibilidade das telas de U1 | policy | — |
| BR7.2 | Comportamento em tela estreita | policy | — |
| BR7.3 | Tela de entrada por perfil | policy | — |
| BR7.4 | Estados de tela e de formulário | policy | — |
| BR7.5 | Mensagem traduzida a partir do código | policy | — |
| BR7.6 | Item Administração só para administrador | authorization | — |
| BR8.1 | Ator entregue às outras unidades: identificador, perfil e setor lidos do banco | authorization | — |
| BR8.2 | Resumo de usuários inclui inativos e omite desconhecidos | policy | — |
| BR8.3 | Atribuível: ativo, Atendente ou Gestor, do mesmo setor | calculation | — |
| BR8.4 | Categoria ativa exige setor ativo | validation | CATALOG_ITEM_NOT_FOUND, CATALOG_ITEM_INACTIVE |
| BR8.5 | Setor e prioridade ativos | validation | CATALOG_ITEM_NOT_FOUND, CATALOG_ITEM_INACTIVE |
| BR8.6 | Prioridade padrão única e ativa | calculation | INTERNAL_ERROR |
| BR8.7 | Status por uma das quatro chaves | validation | CATALOG_ITEM_NOT_FOUND |
| BR8.8 | Rótulos incluem inativos e omitem desconhecidos | policy | — |
| BR8.9 | Serviços públicos só de leitura, sem autorização própria e sem tipos de persistência | constraint | — |
