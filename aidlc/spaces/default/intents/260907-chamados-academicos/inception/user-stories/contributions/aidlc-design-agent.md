**Collaborator:** aidlc-design-agent

## Contribution

Revisão pelo ângulo de experiência de uso e fidelidade das personas. O rascunho é forte onde mais costuma ser fraco: a cobertura de autorização negativa (403/404, IDOR, ausência de rota) é exemplar e não tenho nada a acrescentar ali. O que falta está do outro lado — o que a pessoa vê na tela quando a coisa não é o caminho feliz.

O contexto que orienta tudo abaixo: **Refined Mockups foi cortada**. Não existe etapa posterior de experiência de uso. Todo detalhe de interação que não virar critério de aceitação aqui será decidido por improviso durante a geração de código. Por isso priorizo cada proposta com **Essencial** (será improvisado errado e custa caro consertar) ou **Desejável** (o improviso provavelmente acerta). Um desenvolvedor solo com 10 a 20 horas semanais não integra trinta critérios novos; integra doze bem escolhidos.

---

### 1. Personas: as quatro se sustentam, mas três ajustes são necessários

**A fusão Aluno + Professor está correta e não perde nada que as histórias precisassem.** Permissões idênticas, navegação idêntica, jornada idêntica. Manter duas personas produziria dois blocos de histórias com critérios duplicados e nenhuma diferença testável — o custo seria real e o ganho, zero.

Ela perde **uma coisa só**, e a perda é visível no documento: com a fusão, o cenário de *alto volume* ficou sem dono. A nota da variação Professor diz que ele "tende a ter mais chamados simultâneos", mas nenhuma história usa isso. O sintoma está em US1.3, que é mensuravelmente mais pobre que US2.1 exatamente nos pontos que só importam com volume — a fila do atendente tem paginação com contagem (AC2.1.5) e erro de carregamento (AC2.1.6), a listagem do solicitante não tem nem um nem outro, apesar de FR4.8 valer para as duas. Não é um problema de persona; é um problema que a persona deveria ter evitado.

**P1.1 (Essencial)** — acrescentar ao contexto de uso de P1:

> **Cenário de volume.** A maioria dos solicitantes tem poucos chamados por semestre, mas o Professor acumula vários simultâneos, sobre disciplinas diferentes. A listagem do solicitante precisa se sustentar nos dois extremos: com nenhum chamado (estado vazio que convida à ação) e com dezenas (filtro, paginação e contagem total, no mesmo padrão da fila do atendente). Quando os critérios divergirem entre US1.3 e US2.1, a divergência precisa ser intencional, e não um esquecimento.

**P1.2 (Desejável)** — acrescentar ao final da nota sobre a variação Professor, por honestidade do TCC:

> **Limite conhecido.** FR2.3 dá a cada usuário exatamente um perfil, então um Professor não pode ser também Atendente. Um chamado de revisão de nota chega ao setor responsável, mas a etapa em que o professor da disciplina efetivamente opina acontece fora do sistema. O sistema registra o pedido, o dono e o desfecho; não modela o encaminhamento interno ao docente.

**P2.1 (Essencial) — o Gestor está desconectado das histórias que ele executa.** Denise "faz tudo o que o Atendente faz", mas o agrupamento por persona colocou US2.1 a US2.4 sob "Como Atendente", e só AC2.3.3 e AC1.6.6 mencionam o Gestor por acidente. AC2.4 (transferir) não o menciona, embora FR5.4 diga "o atendente **ou gestor** deve transferir". Lido literalmente, o documento autoriza uma verificação de perfil que exclui a Gestora da fila e da transferência — um defeito de autorização que nasce da diagramação, não da regra. Corrigir de duas formas, ambas baratas:

- Trocar o ator de US2.4 para **Atendente ou Gestor**, alinhando com FR5.4.
- Abrir o bloco US2 com uma linha: *"O perfil Gestor executa todas as histórias deste grupo, além das do grupo US3. Onde o critério diz 'Atendente', leia-se 'Atendente ou Gestor', salvo quando o critério distinguir os dois explicitamente (AC3.1.4)."*

**P4.1 (Desejável)** — FR10.1 nomeia o gestor **e o administrador** como públicos dos indicadores, mas US6.1 tem só "Como Gestora". Ou incluir o Administrador no ator, ou registrar por que ele foi deixado de fora.

---

### 2. Histórias e wireframes: as três invalidações estão tratadas, e há três divergências ainda abertas

As três correções registradas em `requirements.md` § Consequências para Artefatos Anteriores estão **corretamente refletidas nas histórias**: setor derivado e não editável (AC1.2.1 e AC1.2.5, este último fechando o vetor de servidor, que é o detalhe que quase sempre se esquece), ausência do link de recuperação (AC1.1.6, afirmado como ausência verificável), e redefinição de senha pelo administrador (AC4.1.4). Nenhuma história assume a tela antiga nesses três pontos.

Só que os wireframes continuam mostrando a tela antiga, e não há etapa que os atualize. Isso importa porque a geração de código vai ler os dois artefatos. Duas precisões que só as histórias podem fixar agora:

**D1 (Essencial) — o setor derivado não pode ser um `select` desabilitado.** A Tela 4 ainda desenha `[ Preenchido pela categoria v ]` com chevron de seletor, e o estado "Inicial" diz "Setor desabilitado até a categoria ser escolhida". Um campo desabilitado não recebe foco de teclado e é lido de forma inconsistente por leitor de tela — para um dado que o usuário *precisa* conferir antes de enviar, é a escolha errada. Substituir AC1.2.1 por:

| ID | Critério de aceitação |
|----|----------------------|
| AC1.2.1 | **Dado** que estou no formulário de abertura e ainda não escolhi categoria, **quando** observo o campo de setor responsável, **então** ele exibe o texto "Definido pela categoria" e não é um campo de formulário editável nem desabilitado; **quando** escolho uma categoria, **então** o nome do setor responsável aparece nesse mesmo lugar, em texto legível por leitor de tela, sem que exista qualquer forma de alterá-lo na interface. |

**D2 (Essencial) — sem o link de recuperação, a tela de login virou um beco sem saída.** AC1.1.6 remove o link, o que está certo, mas ninguém diz à Bruna o que fazer quando ela esquece a senha — e não existe e-mail, então o sistema não tem como socorrê-la. `user-flow.md` Fluxo 1 ainda instrui "usa 'Esqueci minha senha'", o que já não existe. Prevenir o beco custa uma frase estática:

| ID | Critério de aceitação |
|----|----------------------|
| AC1.1.7 | **Dado** que estou na tela de login, **quando** a observo, **então** existe um texto fixo informando que a redefinição de senha é feita pelo administrador do sistema, exibido independentemente de ter havido erro, e sem indicar qual campo falhou quando há erro. |

**D3 (Essencial) — o roteamento pós-login por perfil não tem critério nenhum.** A Tela 2 define destinos diferentes por perfil (Solicitante para Meus Chamados, Atendente e Gestor para a Fila, Administrador para Administração), mas AC1.1.1 afirma só o destino do Solicitante e nenhuma história de US2, US3 ou US4 afirma o seu. Isso será improvisado — provavelmente com uma rota única para todo mundo. Acrescentar a US2.1:

| ID | Critério de aceitação |
|----|----------------------|
| AC2.1.7 | **Dado** que entro no sistema como Atendente ou Gestor, **quando** a autenticação conclui, **então** sou levado à fila do meu setor, e não à listagem de chamados próprios. |

E acrescentar a US4.1 o equivalente para o Administrador (**AC4.1.8**).

**Três divergências que os wireframes ainda contêm e as histórias não resolvem:**

**D4 (Essencial, decisão do humano) — o solicitante encerra o próprio chamado?** A Tela 5 lista, para "Aluno, Professor (autor)": *"Enviar mensagem. **Encerrar o próprio chamado.**"* As histórias dão o encerramento só ao responsável (AC2.2.4), e FR5.7 diz "o atendente ou gestor". As duas leituras são defensáveis e a diferença é de permissão, não de desenho — não cabe a mim nem ao redator decidir. Ver § 6.

Ligado a isso: **FR8.1 prevê a transição `Aberto → Encerrado`, e nenhuma história a cobre.** AC2.2.4 pressupõe "sou o responsável", o que implica Em análise. Um chamado Aberto só chega a Encerrado se alguém encerrar sem assumir — o atendente descartando um duplicado, ou o solicitante desistindo. Enquanto esse ator não for nomeado, existe uma transição válida na máquina sem nenhum caminho de interface, e a geração de código vai inventar um botão ou omitir a transição.

**D5 (Essencial, decisão do humano) — "Meus Chamados" aparece na lateral de todos os perfis.** A tabela de itens por perfil dos wireframes dá "Meus Chamados" ao Atendente, ao Gestor e ao Administrador. Mas FR4.1 restringe a abertura a "um solicitante (Aluno ou Professor)". Ou esses perfis abrem chamados — e falta história para isso — ou o item de navegação leva a uma lista permanentemente vazia. Pior: o mesmo desenho dá "Fila do Setor" ao Administrador, que por FR2.7 não tem setor vinculado, e AC2.1.4 manda negar o acesso. **Um item de menu que sempre termina em negação é um defeito de desenho, não uma proteção.** Regra que proponho fixar como critério transversal, independentemente de como o humano decidir o resto:

| ID | Critério | Origem |
|----|----------|--------|
| CT6 | Um item de navegação só é exibido a um perfil que pode efetivamente usá-lo. Nenhuma tela do sistema oferece caminho para uma ação que a autorização recusará por perfil. A negação de servidor permanece obrigatória (CT1, US5.1) como defesa, nunca como mecanismo de interface. | NFR2, wireframes § Arquitetura de Navegação |

**D6 (Desejável, decisão do humano) — a busca não existe em requisito nenhum.** A barra superior tem `[busca]` e as Telas 3 e 6 têm `[busca...]`. FR4.4 só concede filtro por status, categoria e setor; nenhum FR menciona busca textual, e nenhuma história a cobre. São horas reais de trabalho pendurando de um desenho sem requisito. Cortar do wireframe ou escrever a história — ver § 6.

---

### 3. Estados de tela: o rascunho cobre o caminho feliz e o caminho proibido, quase nunca o caminho quebrado

Cruzei cada história com a tabela de estados da tela correspondente nos wireframes. O resultado, por tela:

| Tela | Vazio | Carregando | Erro | Parcial / longo |
|------|-------|-----------|------|-----------------|
| 1 Login | n/a | **ausente** | AC1.1.2 | n/a |
| 3 Meus Chamados | AC1.3.3 (só "nenhum chamado"; falta "filtro sem resultado") | **ausente** | **ausente** | **ausente** (paginação) |
| 4 Novo Chamado | n/a | **ausente** | **ausente** (falha de envio) | **ausente** (limite do texto) |
| 5 Detalhe | AC1.4.4 | **ausente** | **ausente** (mensagem não enviada) | **ausente** (mensagem longa) |
| 6 Fila | **ausente** (dois estados vazios distintos) | **ausente** | AC2.1.6 | AC2.1.5 |
| 7 Notificações | **ausente** | **ausente** | **ausente** | n/a |
| 8 Administração | **ausente** | **ausente** | **ausente** | n/a |

O padrão é claro: os estados existem onde algum revisor anterior já os havia apontado (o achado R-03 da revisão dos wireframes acrescentou "Erro" às Telas 6 e 7, e é justamente ali que a história tem o critério). Onde ninguém apontou, o estado sumiu na passagem para as histórias.

Vinte e um critérios novos seria a resposta mecânica e ninguém os construiria. A resposta proporcional é **um critério transversal** que fixa a regra de uma vez, mais **quatro critérios pontuais** onde a decisão não é derivável da regra geral.

**Critério transversal proposto (Essencial):**

| ID | Critério | Origem |
|----|----------|--------|
| CT7 | Toda tela que carrega dados do servidor implementa quatro estados distintos: **carregando** (esqueleto com a forma do conteúdo, nunca tela em branco nem salto de layout), **vazio** (texto explicando por que está vazio e, quando existir, a ação que resolve), **erro** (mensagem em português mais botão "Tentar novamente" que refaz a requisição preservando filtros e recorte) e **conteúdo**. As telas alcançadas são Login, Meus Chamados, Novo Chamado, Detalhe do Chamado, Fila do Setor, Notificações e Administração. | `../../ideation/rough-mockups/wireframes.md`, tabelas "Estado / Comportamento" de cada tela |
| CT8 | Toda submissão de formulário desabilita o próprio botão de envio enquanto a requisição está em curso, e preserva integralmente o conteúdo digitado quando a requisição falha. | wireframes Telas 1, 4 e 5 |

CT7 e CT8 rastreiam a artefato de Ideação, satisfazendo a regra de rastreabilidade da fase: os estados não são invenção desta etapa, estão desenhados nas tabelas dos wireframes e simplesmente não atravessaram para as histórias.

**Critérios pontuais, onde a regra geral não decide sozinha:**

| ID | História | Critério de aceitação | Por quê |
|----|----------|----------------------|---------|
| AC1.3.7 | US1.3 | **Dado** que apliquei filtros e nenhum chamado corresponde, **quando** a lista recarrega, **então** vejo "Nenhum chamado corresponde aos filtros" com ação de limpar filtros — mensagem distinta da que vejo quando não tenho chamado algum. | Os dois vazios exigem ações opostas: um convida a abrir chamado, o outro a afrouxar o filtro. Confundi-los diz à Bruna que ela não tem chamados quando ela tem. |
| AC1.3.8 | US1.3 | **Dado** que tenho mais chamados do que cabem numa página, **quando** troco de página, **então** filtros e ordenação são preservados e a contagem total é exibida. | Fecha a assimetria com AC2.1.5; FR4.8 vale para as duas listagens. |
| AC1.2.7 | US1.2 | **Dado** que o envio do chamado falhou, **quando** vejo o erro, **então** título, descrição, categoria e prioridade que digitei continuam preenchidos, e posso reenviar sem redigitar. | Perder uma descrição longa por falha de rede é o pior desfecho possível do fluxo central; é também o mais provável de ser improvisado errado. |
| AC1.4.6 | US1.4 | **Dado** que o envio de uma mensagem falhou, **quando** vejo o resultado, **então** a mensagem aparece na conversa marcada como não enviada, com ação de tentar novamente, e o texto não é perdido. | O wireframe já desenhou o balão "Não enviado"; sem critério, a geração de código escolhe entre otimista e confirmado pelo servidor por conta própria, e as duas produzem telas diferentes. |

**Desejável, se sobrar orçamento:** estado vazio das notificações (**AC1.5.7**), o segundo estado vazio da fila — "Todos os chamados já têm responsável", distinto de "Nenhum chamado na fila" (**AC2.1.8**, e importa para Carlos, cujo trabalho é justamente varrer o recorte de não atribuídos), e truncamento de mensagem longa com "ver mais" (**AC1.4.7**).

---

### 4. Detalhes de interação que serão improvisados se não entrarem aqui

**I1 (Essencial) — a janela de reabertura é invisível até expirar.** AC1.6.2 recusa a reabertura depois de 3 dias com uma mensagem explicando o prazo vencido. Isso é mensagem de erro onde caberia prevenção: em nenhum lugar o solicitante fica sabendo que o prazo existe, muito menos quanto resta dele. Para uma persona que entra no sistema poucas vezes por semestre, descobrir a regra no momento em que ela já foi violada é o pior momento possível.

| ID | Critério de aceitação |
|----|----------------------|
| AC1.6.7 | **Dado** um chamado meu encerrado dentro do prazo de reabertura, **quando** abro o detalhe, **então** vejo em texto até quando posso reabri-lo, junto da ação de reabrir; **dado** que o prazo já venceu, **então** vejo em texto que o prazo terminou e a ação de reabrir não é oferecida. |

**I2 (Essencial) — o encerramento não pede confirmação.** Os wireframes exigem confirmação para desativar catálogo (AC4.2.6 cobre) e para mudança de status na Tela 5 ("Mudança de status confirmada antes de aplicar"), mas nenhuma história cobre a confirmação do encerramento — que é a ação mais consequente do sistema, porque desabilita mensagens e dispara o relógio de 3 dias.

| ID | Critério de aceitação |
|----|----------------------|
| AC2.2.6 | **Dado** que sou o responsável e escolho encerrar o chamado, **quando** confirmo a ação num diálogo que explica que novas mensagens serão bloqueadas e que o solicitante terá 3 dias corridos para reabrir, **então** o chamado é encerrado; **quando** cancelo o diálogo, **então** nada muda. |

**I3 (Essencial) — o seletor de status oferece transições inválidas.** A Tela 5 desenha `[Em analise v]` como um seletor comum, e AC2.3.5 apenas recusa a transição inválida quando ela é tentada. Prevenção custa o mesmo que a recusa e evita a tela em que o usuário escolhe uma opção que o sistema imediatamente rejeita.

| ID | Critério de aceitação |
|----|----------------------|
| AC2.3.7 | **Dado** um chamado em qualquer status, **quando** abro o seletor de status, **então** apenas as transições válidas a partir do status atual são oferecidas. A recusa de servidor de AC2.3.5 permanece obrigatória como defesa, e não como mecanismo de interface. |

**I4 (Essencial) — o tamanho máximo de título e descrição nunca foi definido.** O wireframe mostra "0/2000 caracteres" e declara o número ilustrativo, remetendo aos requisitos; `requirements.md` não fixou nenhum limite. Sem número, o contador da Tela 4 não pode ser construído, a coluna do banco será escolhida por chute, e AC5.4.1 (sem rolagem horizontal em 375px) não pode ser verificada, porque o pior caso de layout é justamente o título mais longo permitido. É uma decisão de uma linha que destrava três coisas — ver § 6.

**I5 (Desejável) — a aba inicial do detalhe não está declarada.** O wireframe abre em Conversa. AC1.3.4 diz que as três abas existem, não qual abre. Uma frase em AC1.3.4 resolve.

**I6 (Desejável) — a validação do formulário dispara em momentos diferentes nos dois artefatos.** O wireframe da Tela 4 manda validar ao sair do campo, "não a cada tecla"; AC1.2.4 descreve o erro só no envio. Escolher um: validar ao sair do campo *e* no envio é o comportamento que os dois artefatos juntos sugerem, e é o que Shadcn com um formulário controlado entrega por padrão.

**I7 (Desejável) — "Ver todas" no painel de notificações aponta para uma tela que não existe** em requisito, história ou wireframe. Cortar o link ou escrever a tela.

---

### 5. US5.3 e US5.4: hoje não são verificáveis por inspeção manual; com estes ajustes, passam a ser

Este é o ponto em que mais discordo do rascunho, e a razão é específica: sem ferramenta de navegador (proibida por regra afirmada) e sem etapa posterior de experiência de uso, **a inspeção manual é o único mecanismo de verificação que existe**, e um critério só é verificável por inspeção manual se disser *quais telas*, *o que exatamente observar* e *onde o resultado fica registrado*. AC5.3.1 falha nos três: "qualquer tela do corte mínimo" não é uma lista, "todos os elementos interativos" não é um roteiro, e nada registra o resultado — na prática, ninguém consegue dizer se passou.

**Substituir AC5.3.1 por (Essencial):**

| ID | Critério de aceitação |
|----|----------------------|
| AC5.3.1 | **Dado** o roteiro de verificação por teclado versionado no repositório, cobrindo nominalmente as seis telas do corte mínimo — Login, Meus Chamados, Novo Chamado, Detalhe do Chamado, Fila do Setor e painel de Notificações —, **quando** percorro cada tela usando apenas Tab, Shift+Tab, Enter, Espaço, setas e Escape, **então** alcanço e aciono todos os elementos interativos de cada uma, e registro no roteiro a data e o resultado por tela. |

**Acrescentar a US5.3 (Essencial os três primeiros, Desejável o último):**

| ID | Critério de aceitação | WCAG 2.1 |
|----|----------------------|----------|
| AC5.3.5 | **Dado** qualquer diálogo ou painel sobreposto (transferência de setor, confirmação de desativação, confirmação de encerramento, painel de notificações), **quando** ele está aberto, **então** o foco permanece dentro dele, Escape o fecha, e o foco volta ao elemento que o abriu. | 2.1.2 (A) |
| AC5.3.6 | **Dado** qualquer tela do corte mínimo, **quando** navego por Tab, **então** a ordem do foco acompanha a ordem visual de leitura, e o primeiro elemento focável da página é um link "Pular para o conteúdo" que leva ao `main`. | 2.4.3 e 2.4.1 (A) |
| AC5.3.7 | **Dado** qualquer tela, **quando** inspeciono o documento, **então** o idioma da página está declarado como português e o título do documento identifica a tela de forma única. | 3.1.1 e 2.4.2 (A) |
| AC5.3.8 | **Dado** qualquer campo de formulário com erro, **quando** o erro é exibido, **então** ele é apresentado em texto e associado ao campo por atributo, não apenas por proximidade visual ou cor. | 3.3.1 e 1.3.1 (A) |

**Duas correções de precisão que o TCC vai precisar defender:**

- AC5.3.2 (indicador de foco visível) é o critério **2.4.7, nível AA** — não nível A. Não proponho removê-lo: o tema padrão do Shadcn já entrega o anel de foco e mantê-lo custa zero. Proponho reformulá-lo de modo verificável e honesto: *"o anel de foco padrão do tema não é removido nem sobrescrito por CSS próprio"* — verificável por inspeção de código, não de tela. E anotar no documento que é um extra deliberado acima da meta declarada.
- **NFR5 exige "contraste mínimo" e nenhuma história o cobre.** "Contraste mínimo" é o nome do critério **1.4.3, também nível AA**. Com tema padrão do Shadcn e nenhuma paleta própria (decisão Q7 dos wireframes), a conformidade vem de graça, e o critério verificável é justamente esse: **AC5.3.9** — *"as cores de texto e de fundo vêm do tema padrão do Shadcn, sem sobrescrita de paleta própria"*. Deixar NFR5 sem nenhum critério é o pior dos mundos: ninguém verifica e o documento afirma conformidade que não demonstrou.

**US5.4 tem uma contradição interna (Essencial resolver).** AC5.4.1 exige ausência de rolagem horizontal em **qualquer** tela do corte mínimo a 375px; AC5.4.2 só converte em cartões **a listagem de chamados**. A Fila do Setor tem seis colunas e nenhuma regra responsiva no wireframe — como está escrito, US5.4 exige que a Fila caiba em 375px sem dizer como. E a persona P2 diz explicitamente que Carlos "trabalha no desktop". Resolver declarando o alvo, em vez de deixar a contradição para a geração de código:

| ID | Critério de aceitação |
|----|----------------------|
| AC5.4.1 | **Dado** 375px de largura, **quando** abro as telas do solicitante (Login, Meus Chamados, Novo Chamado, Detalhe do Chamado, painel de Notificações), **então** o corpo da página não rola horizontalmente, com dados de exemplo que incluam o título mais longo permitido. |
| AC5.4.4 | **Dado** 375px de largura, **quando** abro a Fila do Setor ou a Administração — telas cuja persona trabalha em desktop —, **então** a página continua utilizável e qualquer rolagem horizontal fica contida na própria tabela, nunca no corpo da página. |
| AC5.4.5 | **Dado** o menu de navegação recolhido em 375px, **quando** o abro, **então** ele é operável por teclado e fecha com Escape, devolvendo o foco ao botão que o abriu. |

**Uma sugestão de mecanismo, para os revisores de desenvolvimento e qualidade confirmarem:** `eslint-plugin-jsx-a11y` é um *linter*, não teste de navegador — não colide com a regra que proíbe Playwright e afins, e o ESLint já é bloqueante no CI. Ele pega automaticamente rótulo ausente, `aria` inválido e elemento interativo sem papel, que é a maior parte do que AC5.3.3 e AC5.3.8 exigem. Transformaria parte de US5.3 de "alguém lembrou de conferir" em portão mecânico, a custo de uma dependência de desenvolvimento. Não é decisão minha; registro como opção de baixo custo.

---

### 6. Decisões que devem ir ao humano, e não ser resolvidas por mim nem pelo redator

Todas mudam escopo, permissão ou custo — nenhuma é questão de ofício de desenho.

| # | Decisão | Por que é do humano | Efeito se ninguém decidir |
|---|---------|--------------------|--------------------------|
| H1 | **O solicitante pode encerrar o próprio chamado?** Wireframe Tela 5 diz que sim; AC2.2.4 e FR5.7 dizem que não. Ligado: `Aberto → Encerrado` existe em FR8.1 e nenhuma história dá ator a essa transição. | É regra de permissão e de produto — muda quem controla o fim do chamado e se existe "desistir". | Transição válida sem caminho de interface; a geração de código inventa um botão ou omite a transição. |
| H2 | **Atendente, Gestor e Administrador abrem chamados?** O wireframe dá "Meus Chamados" aos três; FR4.1 restringe a abertura ao solicitante. | Muda a matriz de perfis e o volume de histórias. | Item de menu que leva a lista sempre vazia, ou abertura por perfil não previsto. |
| H3 | **Limite de caracteres de título e descrição.** Declarado ilustrativo nos wireframes, nunca fixado nos requisitos. | É decisão de produto com efeito em banco, contador de tela e verificação de AC5.4.1. | Coluna dimensionada por chute; contador não construível; pior caso de layout não testável. |
| H4 | **A busca textual está no escopo?** Presente na barra superior e nas Telas 3 e 6; sem FR, sem história. | São horas reais de trabalho, num orçamento de 10 a 20 horas semanais. | Ou é construída sem requisito, ou fica um campo morto na tela. |
| H5 | **O alvo de celular é todas as telas ou só as do solicitante?** AC5.4.1 diz todas; a persona P2 é desktop. | Define quanto trabalho responsivo entra no corte mínimo. | A contradição de US5.4 é resolvida por improviso, provavelmente na direção mais cara. |
| H6 | **Um status criado pelo administrador participa da máquina de transições?** US4.2 torna Status administrável (AC4.2.5 semeia quatro); FR8.1 fixa transições sobre esses quatro nomes. | É contradição entre dois requisitos Must, com consequência direta no seletor de status da Tela 5. | Administrador cria um quinto status que nenhuma transição alcança. Encaminhável ao Desenho Funcional, mas precisa de decisão registrada. |
| H7 | **"Ver todas" das notificações: tela nova ou link cortado?** | Escopo. | Link para lugar nenhum. |

Um comentário sobre H1, H2 e H4 juntos: os três existem porque os wireframes foram desenhados antes dos requisitos e ficaram mais generosos que eles. Isso é normal e saudável — mas com Refined Mockups cortada, **esta etapa é o último lugar onde a diferença pode ser conciliada por decisão em vez de por improviso**. Vale gastar o tempo do portão com as sete.

---

## Positions

- AGREE: A fusão de Aluno e Professor numa persona Solicitante única — permissões, navegação e jornada são idênticas, e duas personas produziriam critérios duplicados sem nenhuma diferença testável.
- AGREE: A decisão de escrever os itens Could have por completo (US6.1 a US6.3) com pendências declaradas — o custo é de redação, não de construção, e o TCC ganha um documento completo.
- AGREE: A cobertura de autorização negativa (403, 404, IDOR, ausência de rota em AC1.4.3 e AC6.2.2) — afirmar a *ausência* de uma capacidade como critério verificável é o padrão certo e está aplicado com consistência.
- AGREE: Fechar as três lacunas R-01, R-03 e R-04 como critério de aceitação com a suposição declarada em vez de empurrá-las adiante — cada uma teria virado improviso na geração de código.
- AGREE: Os Critérios Transversais CT1 a CT5 como forma de cobrir requisitos não funcionais sem ator, em vez de fabricar histórias com ator "sistema".
- OBJECT: Os critérios descrevem quase só o caminho feliz e o caminho proibido — dos sete conjuntos de estados desenhados nos wireframes, "carregando" não aparece em nenhuma história e "erro de carregamento" aparece em uma só (AC2.1.6). Proponho CT7 e CT8 mais quatro critérios pontuais, em vez dos vinte e um que a cobertura mecânica exigiria.
- OBJECT: AC5.3.1 não é verificável por inspeção manual — "qualquer tela" não é uma lista, "todos os elementos interativos" não é um roteiro, e nada registra o resultado; sem ferramenta de navegador, um critério sem roteiro e sem evidência versionada não tem como passar nem falhar.
- OBJECT: US5.4 contradiz a si mesma — AC5.4.1 exige ausência de rolagem horizontal em qualquer tela a 375px, AC5.4.2 só converte em cartões a listagem do solicitante, e a Fila do Setor tem seis colunas sem regra responsiva alguma.
- OBJECT: NFR5 exige contraste mínimo e nenhum critério de aceitação o cobre; e AC5.3.2 (indicador de foco) é critério de nível AA apresentado dentro de uma meta declarada como nível A — ambos precisam de correção de precisão, não de remoção.
- OBJECT: O Gestor executa US2.1 a US2.4 mas o agrupamento por persona atribuiu essas histórias ao Atendente, e US2.4 contraria FR5.4 ao omiti-lo do ator — lido literalmente, o documento autoriza uma verificação de perfil que exclui a Gestora da fila e da transferência.
- OBJECT: A janela de reabertura de 3 dias só se manifesta como mensagem de erro depois de vencida (AC1.6.2), sem que o prazo seja exibido antes — prevenção de erro cabia aqui e custa um texto.
- OBJECT: Três divergências entre histórias e wireframes seguem abertas além das três já invalidadas — o encerramento pelo solicitante, o item "Meus Chamados" em perfis que não abrem chamados, e a busca textual sem requisito — e não há etapa posterior que as concilie.
