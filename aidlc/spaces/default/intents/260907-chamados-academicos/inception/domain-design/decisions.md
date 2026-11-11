# Registro de Decisões de Arquitetura — Desenho de Domínio

Decisões significativas tomadas nesta etapa, com contexto, consequências e alternativas rejeitadas. Complementa a tabela de justificativa por bloco em `components.md`, que é o resumo rápido; este é o registro durável.

---

## ADR-001: Atendimento vive dentro de Tickets

**Contexto.** O atendimento agrupa cinco operações — ver a fila do setor, assumir, atribuir, transferir e encerrar (US2.1 a US2.4, US3.1). Todas mudam o mesmo registro de chamado. Ao mesmo tempo, elas servem um perfil diferente do que abre o chamado, e a divisão por ator é uma fronteira legítima em domínios de atendimento.

A regra de propriedade de entidade desta etapa é dura: cada entidade tem exatamente um bloco dono, e propriedade ambígua é sinal de desenho errado.

**Decisão.** Não existe bloco `Servicing`. Fila, atribuição, transferência e encerramento são operações dentro de `Tickets`, que é o único dono da entidade `Ticket`.

**Consequências.**

Positivas: um dono só para a entidade `Ticket`, sem coordenação de escrita entre blocos. O histórico nasce onde o dado muda, sem precisar decidir quem grava. A máquina de transições é consumida por um bloco só.

Negativas: `Tickets` fica o maior bloco do sistema, com três entidades e a maior superfície de comportamento. Se o atendimento crescer — regras de escalonamento, distribuição automática, SLA —, este bloco será o primeiro candidato a divisão.

Neutras: a separação por ator continua existindo, mas no nível de rota e de guard, não de bloco.

**Alternativas rejeitadas.**

*Bloco `Servicing` separado, com fronteira por ator.* O solicitante falaria com `Tickets`, o atendente com `Servicing`. Rejeitada porque os dois blocos escreveriam na mesma entidade `Ticket`, violando a regra de dono único e obrigando a decidir arbitrariamente quem grava o histórico. A reversibilidade é alta — extrair `Servicing` depois é mecânico —, o que torna o custo de começar junto baixo.

*Bloco separado só para fila e atribuição, com a transferência em `Tickets`.* Rejeitada por ser a pior das duas: mantém a escrita compartilhada e ainda espalha o atendimento por dois lugares, deixando a fronteira difícil de explicar.

---

## ADR-002: Auth e Users são blocos separados

**Contexto.** Autenticação (login, sessão, guard de rota) e gestão de usuários (cadastro, perfil, senha, desativação) tocam a mesma entidade `User`. Juntá-las produziria um bloco coeso em torno do dado; separá-las produz dois blocos coesos em torno do comportamento.

O sistema não tem auto-cadastro nem auto-recuperação de senha: o administrador é o único caminho para alguém entrar. Isso torna a administração de usuários uma capacidade obrigatória, com público e frequência de uso completamente diferentes da autenticação, que todo usuário exercita a cada sessão.

**Decisão.** Dois blocos. `Users` é dono da entidade `User`. `Auth` não é dono de entidade alguma: autentica, emite e valida a sessão, e aplica o guard de perfil, sempre lendo o usuário através de `Users`.

**Consequências.**

Positivas: `Auth` fica sem entidade, o que deixa explícito que a separação é por comportamento. A regra de sessão e a regra de cadastro mudam por motivos diferentes e agora mudam em lugares diferentes.

Negativas: introduz um ciclo entre `Auth` e `Users` — `Auth` lê o usuário, e `Users` pede a `Auth` a verificação de que o ator é administrador. O ciclo está registrado em ADR-004.

**Implicações de segurança.** Esta decisão move a verificação de perfil para fora do bloco que é dono da entidade `User`. O risco que isso cria é concreto: se um dia `Users` expuser uma operação administrativa sem passar por `Auth`, a rota fica sem checagem de perfil e qualquer autenticado administra usuários. A mitigação é o guard global de negação por padrão afirmado nas práticas do projeto: uma rota sem marcação explícita de perfil é recusada, de modo que esquecer a marcação produz recusa, e não permissão. A verificação mecânica dessa mitigação é AC5.1.4, que enumera as rotas registradas e falha se alguma rota não pública estiver sem marcação.

Segunda implicação: como `Auth` recarrega perfil e situação do banco a cada requisição em vez de confiar no token (CT10), desativar um usuário ou rebaixá-lo tem efeito imediato. Sem isso, e como o projeto não invalida sessão no servidor por decisão afirmada, um usuário desativado continuaria operando até o token expirar.

**Implicações de conformidade.** Nenhuma. O sistema não será operado por instituição real e não processa dado pessoal de produção, conforme registrado na Captura de Intenção.

**Alternativas rejeitadas.**

*Bloco único `Identity`.* Um dono para a entidade e para todo o comportamento em volta dela, sem ciclo. Rejeitada porque juntaria a superfície mais exercitada do sistema (autenticar, a cada requisição) com a menos exercitada (administrar usuários, algumas vezes por semestre), e porque o guard de autorização é consumido por todos os blocos — deixá-lo dentro de um bloco que também administra usuários faria todo mundo depender da administração.

*Dois blocos com a entidade em `Auth`.* `Users` viraria apenas a interface administrativa sobre a entidade de `Auth`. Rejeitada por inverter a propriedade: quem é dono do dado seria o bloco que menos o modifica.

---

## ADR-003: Um bloco Catalog para as quatro classificações

**Contexto.** Setor, Categoria, Status e Prioridade são administráveis por decisão de escopo — `Status` e `Priority` são tabelas, nunca enums fixos, por regra afirmada do projeto. As quatro têm exatamente o mesmo comportamento: listar, criar, editar, desativar, tudo restrito ao administrador. A única regra de negócio entre elas é o vínculo categoria-setor, que deriva o setor responsável do chamado.

**Decisão.** Um bloco `Catalog`, dono das quatro entidades.

**Consequências.**

Positivas: o vínculo categoria-setor fica dentro de uma fronteira só, sem chamada entre blocos para uma regra de uma linha. Um lugar para a carga inicial dos quatro status e três prioridades.

Negativas: um bloco com quatro entidades é maior do que a média. Se qualquer uma delas ganhar regra de negócio própria — por exemplo, prioridade que escalona sozinha com o tempo —, ela deixa de caber aqui.

**Alternativas rejeitadas.**

*Quatro blocos, um por entidade.* Fronteiras mais finas. Rejeitada porque multiplicaria arquivos sem separar concerns: quatro blocos com o mesmo comportamento e nenhuma regra distinta não são quatro concerns, são quatro tabelas.

*Dois blocos — `Organization` (setores e categorias) e `TicketClassification` (status e prioridades).* Tem mérito: o primeiro par se relaciona entre si, e o segundo é consumido pela máquina de transições. Rejeitada porque a linha divisória é de origem conceitual, não de taxa de mudança nem de propriedade: as quatro mudam pelo mesmo motivo, pela mesma pessoa, na mesma tela.

---

## ADR-004: Dois ciclos deliberados no grafo de dependências

**Contexto.** A regra desta etapa pede grafo acíclico, e exige que todo ciclo deliberado seja declarado. O desenho tem dois: `Auth ↔ Users`, e o triângulo `Auth → Users → Catalog → Auth`.

Os dois nascem do mesmo fato: a verificação de perfil administrador é transversal, e todo bloco que escreve precisa dela. `Auth` é quem verifica. Mas `Auth` também precisa ler o usuário, e quem é dono do usuário é `Users`. Já `Users` precisa validar o setor no vínculo de atendente e gestor, e quem é dono do setor é `Catalog` — que por sua vez precisa da verificação de `Auth`.

**Decisão.** Aceitar os dois ciclos, declarados aqui e no diagrama de `components.md`.

**Consequências.**

Positivas: nenhum bloco duplica lógica de autorização, e nenhum bloco lê a tabela de outro para evitar a chamada. Os ciclos são de chamada, não de dados: `Auth` nunca consulta a tabela de usuários direto, e `Catalog` nunca resolve setor por conta de `Users`.

Negativas: dois ciclos exigem cuidado na implementação. Em NestJS isso se resolve com injeção tardia, ou extraindo a verificação de perfil para um guard que não dependa de `Users` — decisão de construção, não de desenho. Um leitor do grafo precisa deste ADR para entender que os ciclos são intencionais.

**Implicações de segurança.** Este é o ponto mais delicado do desenho, porque os dois ciclos existem justamente em volta do mecanismo de autorização. Três riscos concretos:

Primeiro, **janela de guard não aplicado durante a resolução do ciclo**. Injeção tardia resolve a dependência circular adiando a obtenção da referência. Se um guard for construído antes de a referência estar disponível e falhar em silencio, a rota pode responder sem checagem de perfil. A mitigação é falhar fechado: um guard que não consegue resolver o ator nega a requisição, nunca a deixa passar. Isso vale para a inicialização e para qualquer erro de resolução em tempo de execução.

Segundo, **tentação de contornar o ciclo lendo a tabela alheia**. A saída mais fácil para quem implementa é `Auth` consultar a tabela de usuários direto, em vez de passar por `Users`. Isso quebraria a propriedade da entidade e criaria um segundo caminho de leitura de credencial, fora da regra do dono. O catálogo registra explicitamente que `Auth` não tem acesso direto ao banco, e essa linha existe por este motivo.

Terceiro, **duplicação da regra de autorização**. A alternativa rejeitada de duplicar a verificação em cada bloco foi recusada aqui por razão de desenho, mas a razão de segurança é mais forte: seis cópias de uma regra de autorização divergem, e a cópia divergente é a que vaza dado. Manter uma implementação única, mesmo ao custo do ciclo, é a escolha mais segura.

A verificação de que o mecanismo funciona não é confiança no desenho: são os testes negativos obrigatórios afirmados nas práticas do projeto — 403 por perfil sem direito em todo endpoint não público, e um teste de IDOR por recurso com dono.

**Implicações de conformidade.** Nenhuma, pelo mesmo motivo registrado em ADR-002.

**Alternativas rejeitadas.**

*Duplicar a verificação de perfil em cada bloco.* Quebraria os dois ciclos. Rejeitada porque espalharia a regra de autorização por seis lugares, contra a prática afirmada de guard global de negação por padrão.

*Extrair um bloco `Authorization` sem dependências.* Quebraria o ciclo de verdade. Rejeitada por criar um terceiro bloco de identidade num sistema que já tem dois, e por acabar precisando ler o perfil do usuário de qualquer forma — o ciclo voltaria pela porta dos fundos.

---

## ADR-005: Reporting lê através de Tickets, não direto do banco

**Contexto.** `Reporting` calcula volume e tempos a partir de chamados e histórico. É somente leitura, não é dono de entidade alguma, e é Could have — pode nunca ser construído. Com chamada direta síncrona entre blocos (decisão da Q5), ele tem duas formas de obter o dado: pedir a `Tickets`, ou consultar a tabela de chamados diretamente.

A regra de visibilidade do sistema é não trivial: um solicitante vê os seus, um atendente vê o setor dele mais os que já passaram por ele, um gestor vê o setor, um administrador vê tudo. Ela vive em `Tickets`.

**Decisão.** `Reporting` lê através de `Tickets` e de `Catalog`. Não acessa o banco diretamente.

**Consequências.**

Positivas: a regra de visibilidade fica num lugar só. Um indicador nunca mostra a um gestor um chamado que ele não poderia abrir. Cortar `Reporting` do plano não deixa consulta órfã em lugar nenhum.

Negativas: consultas agregadas atravessam uma camada de serviço desenhada para operações unitárias. Para volumes maiores isso pesa. O projeto roda apenas local, sem meta de desempenho e sem etapa de validação de desempenho no plano, então o custo é aceito conscientemente.

**Alternativas rejeitadas.**

*Leitura direta ao banco por `Reporting`.* Mais eficiente para agregação. Rejeitada porque duplicaria a regra de visibilidade — e uma duplicata dessa regra é exatamente o tipo de erro que vaza dado de um setor para outro. Se o desempenho vier a pesar, esta é a alternativa a revisitar, e a mitigação é dar a `Tickets` métodos de consulta agregada em vez de dar o banco a `Reporting`.

*Sem bloco `Reporting`, com as consultas dentro de `Tickets`.* Rejeitada na Q7: manter separado permite cortar o Could have inteiro sem tocar em `Tickets`.

---

## ADR-006: A máquina de transições é módulo, não bloco

**Contexto.** A prática afirmada do projeto diz que a máquina de transições de status vive num módulo puro, sem NestJS e sem Prisma. Isso já estava decidido antes desta etapa. O que esta etapa precisa decidir é se esse módulo aparece no catálogo como bloco.

Ao mesmo tempo, `Status` é tabela administrável: o administrador pode renomear um status. Um módulo puro que não consulta o banco não pode comparar rótulos editáveis.

**Decisão.** `TicketStatusMachine` é dependência externa de `Tickets`, do tipo `other`, e não um bloco. Para que ele funcione sem banco, `Status` carrega uma **chave estável em inglês** além do rótulo editável. Os valores dessa chave não são enumerados aqui: estão na nota de rastreabilidade de `components.md`, com a origem a montante, e são fixados no Desenho Funcional.

`Priority` recebeu o mesmo campo **por simetria, e não por necessidade**. Nenhum módulo puro consome prioridade, e o escopo aprovado não tem SLA nem escalonamento automático — os dois únicos consumidores plausíveis de uma chave estável de prioridade. O campo fica registrado como suposição em `components.md`, e o Desenho Funcional decide se ele permanece ou se é adiado até haver consumidor real.

**Consequências.**

Positivas: a regra de transição fica testável sem banco e sem framework, que é o ponto da prática afirmada. O administrador pode renomear o rótulo de um status sem quebrar nenhuma regra.

Negativas: cada status ganha dois campos onde um pareceria bastar, e a carga inicial precisa criar as chaves corretas. Se o administrador puder **criar** status novos, esses não terão chave conhecida pela máquina — o que significa que criar status é, na prática, limitado a status sem transição própria. Isso não foi decidido e fica como questão aberta para o Desenho Funcional. `Priority` carrega o mesmo custo sem o benefício correspondente, pelo motivo registrado na Decisão.

**Implicações de segurança.** A chave estável é o que impede que renomear um rótulo administrável altere silenciosamente qual transição é permitida. Sem ela, um administrador poderia, sem intenção, habilitar um caminho de estado que a regra de negócio recusa — por exemplo, tornando alcançável um encerramento que deveria exigir passagem por análise.

**Alternativas rejeitadas.**

*`Status` como enum fixo em código.* Tornaria a máquina trivial. Rejeitada por contrariar regra afirmada do projeto: o corte mínimo exige status administrável.

*Chave estável apenas em `Status`, sem estendê-la a `Priority`.* É a opção mais enxuta e a que o Desenho Funcional deve reconsiderar. Não foi adotada agora por consistência entre duas entidades de catálogo que são tratadas de forma idêntica em todo o resto do desenho.

*Máquina de transições como bloco próprio.* Rejeitada porque não tem estado, não tem entidade e não tem ciclo de vida: é uma função pura. Um bloco sem dado e sem lifecycle é uma biblioteca com nome pomposo.

---

## ADR-007: O catálogo cobre apenas o backend

**Contexto.** O sistema tem duas aplicações no mesmo repositório: `apps/api` e `apps/web`. O catálogo de blocos poderia representar as duas.

**Decisão.** Os blocos são os módulos do backend. O frontend é organizado por funcionalidade e não entra como bloco lógico.

**Consequências.**

Positivas: um catálogo, uma decomposição, sem espelhamento artificial. A organização do frontend fica livre para seguir a tela, que é como um frontend se organiza bem, em vez de seguir a fronteira do backend.

Negativas: o frontend não ganha rastreabilidade a nível de bloco nesta etapa. As histórias e os wireframes cobrem o que ele precisa fazer; a Geração de Unidades decide se ele vira uma unidade de trabalho própria.

**Alternativas rejeitadas.**

*Espelhar cada bloco de backend com um bloco de frontend.* Rejeitada porque a decomposição útil do frontend segue a jornada do usuário, não a fronteira de dados do servidor. Espelhar produziria blocos de frontend artificiais — um "bloco Catalog de frontend" não descreve nada que exista na tela.

*Um bloco único de interface.* Rejeitada por não acrescentar informação: um bloco que contém tudo não é uma decomposição.

## Assumptions & Open Questions

- [assumption] O mecanismo para resolver os dois ciclos de ADR-004 em NestJS (injeção tardia, ou extração do guard) é decisão de construção. Se nenhum dos dois funcionar limpo, o ciclo vira problema de desenho e este ADR precisa ser revisto.
- [assumption] `Priority.key` permanece por simetria com `Status.key`, sem consumidor identificado. O Desenho Funcional confirma ou remove.
- [assumption] ADR-006 deixa em aberto se o administrador pode criar status novos além dos iniciais. Como a máquina de transições só conhece chaves conhecidas, um status criado não teria transição definida. O Desenho Funcional precisa decidir se a criação é permitida e o que acontece nesse caso.
