**Collaborator:** aidlc-quality-agent

## Contribution

Revisão cega do rascunho pelo ângulo de **testabilidade dos critérios de aceitação**, contra o ferramental afirmado em `team.md`: Jest + `@swc/jest` no backend, Supertest contra aplicação NestJS real e Postgres real, Vitest + Testing Library no frontend, **sem Playwright e sem qualquer teste de navegador**. O portão principal é cobertura por requisito, com tabela de rastreabilidade requisito → teste no repositório.

O conjunto tem **103 critérios** (98 nas histórias + 5 transversais), sendo 93 no bloco Must. A qualidade média é alta: a maioria descreve resultado observável e vira teste direto. O problema não é a redação da maioria — é que o documento trata todos os critérios como igualmente verificáveis, e sete deles não têm casa automatizada nenhuma neste projeto. Com cobertura por requisito como portão, isso não é detalhe de execução: é o portão não podendo fechar.

### 1. Onde cada critério se verifica (tabela para integrar ao artefato)

Recomendo acrescentar uma coluna **Verificação** a cada tabela de critérios, ou esta tabela única numa seção nova. Sem ela, o desenvolvedor descobre em Construction, um critério por vez, que alguns não têm onde ser testados. Códigos:

- `API` — teste de API (Jest + Supertest + Postgres real)
- `MOD` — teste de módulo puro (Jest, sem Nest, sem banco)
- `COMP` — teste de componente (Vitest + Testing Library, jsdom)
- `CI` — verificação no pipeline, fora da suíte de testes
- `MAN` — **inspeção manual registrada; sem casa automatizada**
- `—` — **não verificável como escrito** (precisa de reescrita antes de virar teste)

| Critério | Verificação | Observação |
|---|---|---|
| CT1 | `—` | Afirma a forma da implementação (`where` do Prisma), não comportamento. Ver §2. |
| CT2 | `API` (parcial) | Negativa universal. Precisa de forma limitada. Ver §2. |
| CT3 | `API` | Ler o hash gravado e afirmar prefixo do algoritmo. Falta nomear algoritmo e custo. |
| CT4 | `MAN` ou `CI` novo | `docker compose up` não roda dentro de Jest/Vitest e **não está no conjunto bloqueante do CI**. Ver §5. |
| CT5 | `CI` + `API` | Duas metades com casas diferentes. Separar em CT5a (gitleaks, já no CI) e CT5b (falha de inicialização sem variável, teste de módulo de configuração). |
| AC1.1.1 | `API` + `COMP` | Duas afirmações fundidas: sessão iniciada (API) e destino da navegação (frontend). Separar. |
| AC1.1.2 | `API` + `COMP` | A string em português não é asserção de API. Ver §3. |
| AC1.1.3 | `—` | "não entro no sistema" não tem valor esperado. Precisa de código HTTP + `code`, e deve ser **idêntico** ao de AC1.1.2, senão vira oráculo de enumeração de contas. |
| AC1.1.4 | `API` | Afirmar `Set-Cookie` de expiração + 401 seguinte. |
| AC1.1.5 | `API` + `COMP` | Exige fábrica de token expirado. Ver §6. |
| AC1.1.6 | `COMP` | Ausência frágil: passa também se a tela inteira não renderizar. Parear com asserção positiva do formulário. |
| AC1.2.1 | `COMP` | Nomear o que significa "não editável" (`readonly`, `disabled` ou texto). |
| AC1.2.2 | `API` + `COMP` | Três afirmações fundidas; a navegação é a única do frontend. |
| AC1.2.3 | `API` | Barato e valioso. |
| AC1.2.4 | `API` + `COMP` | Reformular para 400 com `details` nomeando o campo — aí testa sem frontend. |
| AC1.2.5 | `API` | Melhor critério do documento: mass assignment em uma requisição. |
| AC1.2.6 | `COMP` | **Falta a metade do servidor**: criar chamado com categoria inativa deve ser recusado. Como está, a regra só existe na tela. |
| AC1.3.1 | `API` | Fixture de dois solicitantes. |
| AC1.3.2 | `API` (parcial) | "o filtro persiste ao trocar de página" é ambíguo: querystring/resposta (testável em `API`) ou estado do navegador ao recarregar (sem casa em jsdom). Ver §2. |
| AC1.3.3 | `COMP` | |
| AC1.3.4 | `COMP` | "abas separadas" testável por `role="tab"`. |
| AC1.3.5 | `API` | IDOR central. Barato, altíssimo valor. |
| AC1.3.6 | `API` | Fixture cara: exige histórico já gerado. Ver §7. |
| AC1.4.1 | `API` | |
| AC1.4.2 | `API` + `COMP` | Duas casas, separar para a tabela de rastreabilidade não contar duas vezes. |
| AC1.4.3 | `API` | Negativa universal ("nem rota correspondente"). Forma limitada: `PATCH`/`DELETE` na rota de mensagem retornam 404/405. |
| AC1.4.4 | `COMP` | |
| AC1.4.5 | `API` | |
| AC1.5.1 | `API` | Quatro gatilhos num critério = quatro testes. |
| AC1.5.2 | `COMP` | |
| AC1.5.3 | `API` + `COMP` | |
| AC1.5.4 | `API` | |
| AC1.5.5 | `—` | Negativa universal sobre todo o sistema. Forma limitada e honesta: ausência de dependência de envio de e-mail no `package.json` de `apps/api`, verificada no CI. Não é teste de runtime. |
| AC1.5.6 | `API` | Barato, alto valor. |
| AC1.6.1 | `API` | Depende de relógio injetável. Ver §7. |
| AC1.6.2 | `API` | Idem, **e contradiz FR8.3 na fronteira**. Ver §8. |
| AC1.6.3 | `API` | |
| AC1.6.4 | `API` | |
| AC1.6.5 | `API` | |
| AC1.6.6 | `—` | "a ação não está disponível" não tem código HTTP. Ver §3. |
| AC2.1.1 | `API` | |
| AC2.1.2 | `API` | |
| AC2.1.3 | `API` | Fixture cara e implica elemento de modelo de dados não previsto. Ver §7. |
| AC2.1.4 | `—` | "acesso é negado" sem código HTTP. |
| AC2.1.5 | `API` | |
| AC2.1.6 | `COMP` (só com camada nova) | Exige simular falha de requisição no frontend (MSW ou stub de `fetch`), que **não está no ferramental afirmado**. Ver §9. |
| AC2.2.1 | `API` | |
| AC2.2.2 | `API` | Afirmar o `code`, não a mensagem. |
| AC2.2.3 | `API` | |
| AC2.2.4 | `API` | |
| AC2.2.5 | `API` | Duplica a metade de API de AC1.4.2; referenciar em vez de repetir. |
| AC2.3.1 | `API` | |
| AC2.3.2 | `API` | Regra de negócio real, barata, alto valor. |
| AC2.3.3 | `API` | |
| AC2.3.4 | `—` | Sem código HTTP. |
| AC2.3.5 | `MOD` | **O melhor custo-benefício do conjunto.** Ver §4. |
| AC2.3.6 | `API` | Consolidável com AC1.3.6 e AC2.4.4. Ver §4. |
| AC2.4.1 | `API` | |
| AC2.4.2 | `API` | Nomear o `code`. |
| AC2.4.3 | `API` | |
| AC2.4.4 | `API` | |
| AC2.4.5 | `API` | |
| AC2.4.6 | `—` | Sem código HTTP. |
| AC3.1.1 | `API` | |
| AC3.1.2 | `API` | |
| AC3.1.3 | `API` | |
| AC3.1.4 | `—` | Sem código HTTP. |
| AC3.1.5 | `API` | |
| AC4.1.1 | `API` | |
| AC4.1.2 | `API` | Serve também de evidência para CT2 (erro P2002 convertido). |
| AC4.1.3 | `API` | **Decide silenciosamente arquitetura de sessão.** Ver §8. |
| AC4.1.4 | `API` | |
| AC4.1.5 | `API` | |
| AC4.1.6 | `API` | |
| AC4.1.7 | `API` | Único critério do documento que nomeia o código HTTP numa negativa de autorização. É o modelo a seguir. |
| AC4.2.1 | `API` | |
| AC4.2.2 | `API` | |
| AC4.2.3 | `COMP` | Vale a metade de API também (recusar uso de item inativo). |
| AC4.2.4 | `API` | |
| AC4.2.5 | `API` | Uma consulta, cobre FR3.5 e FR3.6. |
| AC4.2.6 | `COMP` | Diálogo antes da mutação; testável. |
| AC5.1.1 | `—` | **Meta-critério**: afirma que um teste existe, não o que o sistema faz. Ver §3. |
| AC5.1.2 | `—` | Idem. |
| AC5.1.3 | `API` | Testável, mas exige controlador de teste com rota sem marcação. Ver §3 e §7. |
| AC5.2.1 | `API` | |
| AC5.2.2 | `API` (parcial) | "indistinguíveis" precisa de limite: status, `code` e forma do corpo. Tempo de resposta fica **explicitamente fora**. |
| AC5.3.1 | `COMP` (parcial) | `userEvent.tab()` cobre ordem no DOM, não alcançabilidade como renderizado. Ver §5. |
| AC5.3.2 | `MAN` | **Zero casa automatizada.** jsdom não tem layout nem avalia `:focus-visible`. |
| AC5.3.3 | `COMP` | Única exceção acessível do bloco: `getByLabelText` falha sem associação real. Barato, alto valor. |
| AC5.3.4 | `COMP` | Afirmar que o texto do status/prioridade está no nome acessível, não só a classe de cor. |
| AC5.4.1 | `MAN` | **Zero casa automatizada.** jsdom não calcula layout: `scrollWidth` é sempre 0. |
| AC5.4.2 | `MAN` ou `COMP` | Depende de uma decisão de desenho. Ver §5. |
| AC5.4.3 | `MAN` ou `COMP` | Idem. |
| AC6.1.1–AC6.1.5 | `API` | Bloqueadas pela pendência R-06 já declarada. |
| AC6.2.1 | `API` | |
| AC6.2.2 | `API` | Negativa universal; forma limitada como AC1.4.3. |
| AC6.3.1–AC6.3.3 | `API` | Bloqueadas pela pendência de escala já declarada. |

### 2. Critérios não verificáveis como escritos, e o que falta a cada um

Onze critérios não viram teste sem reescrita. Em ordem de gravidade:

**CT1** — "filtra o ator dentro da própria cláusula de consulta ao banco, nunca busca e compara depois" descreve a implementação, não o resultado. Um teste de caixa-preta passa igualmente numa implementação busca-e-compara. Além disso contradiz a própria tabela INVEST do documento ("Nenhum critério nomeia tabela, rota ou componente"). Sugestão: manter CT1 como **prática de revisão de código**, fora da tabela de critérios, e deixar o comportamento observável em AC5.2.1 e AC1.3.5, que já o cobrem.

**AC5.1.1 e AC5.1.2** — "…**e existe um teste automatizado afirmando isso**". Um critério de aceitação descreve o sistema; a obrigação de escrever teste é política de CI e já está afirmada em `team.md`. Como estão, geram linhas inúteis na tabela requisito → teste ("NFR2 → todos os testes"). Reescrita proposta:

> | AC5.1.1 | **Dado** um endpoint que exige perfil específico, **quando** um usuário de perfil sem direito o acessa, **então** a resposta é 403 com `code` estável, sem executar o efeito. |
> | AC5.1.2 | **Dado** um recurso com dono, **quando** outro usuário o acessa pelo identificador, **então** a resposta é 404 e o corpo não contém nenhum campo do recurso. |

E a obrigação de existir teste por endpoint migra para a Definição de Pronto, com **mecanismo concreto**: um teste de enumeração que percorre o registro de rotas do Nest (via `DiscoveryService`) e falha se alguma rota não pública estiver sem decorador de perfil. Isso torna AC5.1.3 mecanicamente verificável em vez de aspiracional, e protege toda rota futura sem esforço adicional.

**AC1.1.3, AC2.1.4, AC1.6.6, AC2.3.4, AC2.4.6, AC3.1.4** — "não entro", "acesso negado", "a ação não está disponível". Nenhum tem valor esperado. Como o teste negativo de autorização é obrigatório por regra afirmada, o valor esperado **é** o critério. Sem ele, o desenvolvedor escolhe entre 401, 403 e 404 na hora de escrever o teste, e cada escolha diferente vira uma inconsistência de contrato. Ver §3 para a regra que falta.

**AC1.5.5, AC1.4.3, AC6.2.2, CT2** — negativas universais ("nenhum e-mail", "nem rota correspondente", "nenhum erro do Prisma vaza"). Nenhuma é falseável por teste. Todas viram critérios bons na forma limitada:
- CT2: acionar as três classes de erro conhecidas do Prisma (`P2002` violação de unicidade, `P2025` registro ausente, identificador malformado) e afirmar o envelope em cada uma. Barato, e AC4.1.2 já entrega a primeira.
- AC1.4.3 e AC6.2.2: afirmar 404/405 nas rotas plausíveis nomeadas.
- AC1.5.5: verificação de dependência no CI, não teste de runtime — e dizer isso.

**AC1.3.2** — a segunda metade ("o filtro persiste ao trocar de página") tem duas leituras com custos muito diferentes. Se for "a página 2 devolve o mesmo conjunto filtrado com a contagem total", é `API` e barato, e é o que FR4.8 pede. Se for "recarregar o navegador preserva o filtro", exige roteador em memória nos testes de componente e vale bem menos. Recomendo fixar a primeira leitura no texto.

### 3. Duas regras ausentes que atravessam dezenas de critérios

**(a) Nenhum critério pode afirmar a mensagem em português numa camada de API.** `team.md` fixa que `code` é o contrato estável em inglês, `message` é só fallback de depuração, e a tradução para português acontece **só no frontend, a partir de `code`**. AC1.1.2 cita literalmente "E-mail ou senha incorretos"; AC2.2.2, AC2.3.5, AC2.4.2, AC4.1.2, AC1.6.2 e AC2.1.4 dizem "mensagem específica" ou "erro específico". "Específico" não é valor esperado. Proposta: todo critério de erro nomeia o `code` (ou o marca como definido em Contract Design), e a frase em português vira critério de componente separado, quando importar. Sem isso, o desenvolvedor escreverá asserção de string portuguesa em teste de API, contrariando o contrato de erro afirmado.

**(b) Falta a regra 403 × 404 para *ações*.** NFR4 e US5.2 fixam 404 para **recurso que o ator não pode ver**. Mas AC1.6.6, AC2.3.4, AC2.4.6 e AC3.1.4 tratam de casos em que o ator **vê** o recurso e apenas não pode executar a ação — território de 403, não de 404. O documento não afirma isso em lugar nenhum, e é o valor esperado de quatro testes obrigatórios. Sugiro um critério transversal novo:

> | CT6 | Quando o ator não pode ver o recurso, a resposta é 404. Quando ele pode vê-lo mas não pode executar a operação, a resposta é 403. As duas respostas usam o mesmo envelope, com `code` distinto. | NFR2, NFR4 |

### 4. Custo × valor no orçamento de 10 a 20 horas por semana

**Baratos e de alto valor — construir primeiro:**
- **AC2.3.5, teste de tabela da máquina de transições.** A máquina vive em módulo puro, sem Nest e sem Prisma (afirmado em `team.md`). São 4 status × 4 destinos = 16 pares, 6 válidos e 10 recusados, num único teste parametrizado, sem banco, em milissegundos. Cobre FR8.1 e FR4.7 por inteiro e entrega quase de graça o piso de 90% de cobertura de ramo no código mais denso em regra do sistema. É o melhor retorno do conjunto inteiro.
- **O bloco de negativas** (AC1.3.5, AC1.6.4, AC2.1.2, AC4.1.7, AC5.2.1, AC5.1.2): uma única fixture de dois solicitantes e dois setores serve a todos. Cada teste é uma requisição e uma asserção.
- **AC1.2.5** (setor derivado, não enviado): uma requisição, valor de segurança desproporcional ao custo.
- **AC4.2.5** (carga inicial), **CT3** (hash), **AC1.2.3** (prioridade padrão): uma consulta cada.
- **AC5.3.3** (rótulo associado): `getByLabelText` por formulário. É o único critério de acessibilidade do documento que automatiza de verdade — e por isso deveria ser destacado, não diluído entre três irmãos que não automatizam.
- **O teste de enumeração de rotas** proposto em §2: escrito uma vez, protege toda rota futura.

**Caros demais para o valor, nesta capacidade:**
- **AC2.1.6** (erro ao carregar a fila): obriga a introduzir camada de simulação de requisição no frontend só por esse critério. Ver §9.
- **AC1.3.6, AC2.3.6, AC2.4.4, AC1.6.5** (histórico) como quatro testes independentes: cada um precisa montar seu próprio histórico. **Maior economia disponível no conjunto**: um único teste de integração que executa a sequência roteirizada (criar → assumir → mudar prioridade → transferir → encerrar → reabrir) e afirma o histórico inteiro numa passagem. Quatro fixtures caras viram uma.
- **As oito asserções de notificação** (AC1.4.5, AC1.5.1, AC1.6.3, AC2.2.3, AC2.2.4, AC2.3.1, AC2.4.5, AC3.1.5) pedem um auxiliar compartilhado `expectNotification(destinatário, tipo, chamado)` construído uma vez, não oito montagens.
- **Estados vazios** (AC1.3.3, AC1.4.4, AC6.1.3): baratos individualmente, valor baixo. Manter, mas com prioridade menor que qualquer negativa de autorização.
- **AC5.4.1, AC5.4.2, AC5.4.3, AC5.3.2**: ou custo zero (checklist manual) ou custo infinito (navegador, proibido). Não existe meio-termo sem violar a regra afirmada.

### 5. US5.3 e US5.4: onde se verificam de fato, e a desonestidade do rascunho

Resposta direta: **na inspeção manual, e o rascunho não diz isso em lugar nenhum.**

Detalhando o que jsdom permite e o que não permite:

- **AC5.3.1** — `userEvent.tab()` da Testing Library simula sequência de foco e cobre uma parte real: alcançar e acionar elementos na ordem do DOM, com Enter e Espaço. O que ele **não** cobre é justamente o que quebra na prática: elemento escondido por `@media`, `visibility`, recorte por `overflow`, `inert`, e armadilha de foco em diálogo. Cobre talvez metade do critério, e a metade menos arriscada.
- **AC5.3.2** (indicador de foco visível) — **nada**. jsdom não tem motor de layout e não avalia `:focus-visible` nem cascata de CSS externo. Não existe asserção possível.
- **AC5.3.3** — automatiza por inteiro.
- **AC5.3.4** — automatiza em boa parte (texto presente no nome acessível).
- **AC5.4.1** (sem rolagem horizontal em 375px) — **nada**. `scrollWidth`, `clientWidth` e `getBoundingClientRect()` retornam zero em jsdom. Não há como falsear esse critério sem navegador.
- **AC5.4.2 e AC5.4.3** — dependem de uma decisão de desenho ainda não tomada: se a troca de tabela para cartões e o recolhimento da barra lateral forem feitos por **CSS puro** (`@media`), não têm casa automatizada nenhuma; se forem por **hook de JavaScript** lendo `matchMedia`, viram teste de componente barato (basta simular `window.matchMedia`). Vale explicitar essa consequência agora, porque ela é decidida por acidente em Construction se ninguém a nomear.
- **NFR5 menciona contraste mínimo, e US5.3 simplesmente não o cobriu.** Além de ser lacuna de cobertura, contraste também é incalculável em jsdom — `axe-core` não avalia contraste sem layout e estilo computado.

Sobre a honestidade: **`requirements.md` já era honesto e a história perdeu essa informação na tradução.** O critério de aceitação de NFR5 diz literalmente "Verificado por **inspeção manual** das telas do corte mínimo". `stories.md` transformou isso em quatro critérios apresentados na mesma tabela e no mesmo formato de tudo o mais, sem uma linha dizendo que não há teste. Pior, a tabela de conformidade INVEST afirma: *"Testable — Todo critério tem resultado verificável: código HTTP, presença de registro, estado após ação, ou ausência de rota."* Isso é **factualmente falso** para AC5.3.2, AC5.4.1, AC5.4.2, AC5.4.3, CT1, CT4 e AC1.5.5. É uma afirmação verificável dentro do próprio documento, e ela não se sustenta.

Correção proposta, barata e adequada a um TCC: manter os critérios (eles são requisitos legítimos), marcá-los `MAN` na coluna de verificação, e **exigir evidência auditável** — um checklist datado no repositório, com a lista das telas do corte mínimo e a largura testada, preenchido pela emulação de dispositivo do navegador. Assim a linha da tabela requisito → teste deixa de ser um buraco e passa a ser "NFR6 → checklist manual, revisão N", que é defensável na banca. O que não é defensável é apresentar como testável o que não é.

### 6. Cobertura por requisito: o portão fecha? Lacunas encontradas

A estrutura permite montar a tabela requisito → teste: os blocos "Cobre:" ao fim de cada história dão o mapeamento direto, e os identificadores são estáveis. Isso é um acerto real do rascunho. Mas há requisitos **sem nenhum critério que os teste**:

| Requisito | Situação | O que falta |
|---|---|---|
| FR1.2 | Parcial | "O cookie não é legível por JavaScript" (`HttpOnly`) não é afirmado por critério nenhum. Teste trivial: inspecionar `Set-Cookie`. |
| FR2.2 | **Sem cobertura** | "Não existe rota pública de criação de conta". Nenhum critério toca nisso. Forma limitada: `POST` na rota plausível de cadastro retorna 401/404. |
| FR2.3 | **Sem cobertura** | "Exatamente cinco perfis; cada usuário tem exatamente um". Nenhum critério fixa o conjunto nem a cardinalidade. Teste barato: recusar perfil desconhecido na criação. |
| FR3.3, FR3.4 | Parcial | "Lido do banco, não de um enum" só é evidenciado indiretamente por AC4.2.5. Teste mais forte e ainda barato: criar um quinto status pela rota administrativa e usá-lo num chamado. |
| FR4.1 | Parcial | A escolha explícita de prioridade na abertura não tem critério — só o padrão (AC1.2.3). |
| FR4.3 | Parcial | O identificador é afirmado na listagem (AC1.3.1), mas não no detalhe nem na notificação, e a **estabilidade** (não muda ao longo do ciclo) não é testada em lugar nenhum. |
| FR5.4 | Parcial | US2.4 é escrita só para o Atendente; a transferência pelo Gestor, que FR5.4 concede, não tem critério. |
| FR6.2 | Parcial | "Ordem cronológica" é afirmada para o histórico (AC1.3.6), nunca para as **mensagens**. |
| FR6.5 | Parcial | A negativa ("usuário fora do conjunto recebe 404 ao ler") só existe para o chamado (AC1.3.5), não para o endpoint de mensagens. Como a comunicação é unidade separada com regras de acesso próprias (regra afirmada em `project.md`), ela precisa da sua própria negativa. |
| FR8.4 | Parcial | "O chamado aparece na fila do setor com responsável preenchido" após reabrir não é afirmado. |
| NFR1 | **Sem cobertura testável** | CT1 é afirmação de implementação. Ver §2. |
| NFR2 | **Sem cobertura testável** | AC5.1.1 é meta-critério. Ver §2. |
| NFR5 | Parcial + lacuna | Contraste mínimo não virou critério; foco visível não tem casa. |
| NFR6 | Sem casa automatizada | Ver §5. |
| NFR8 | Sem casa | CT4 não roda em Jest/Vitest e não está no conjunto bloqueante do CI descrito em `team.md`. Ou entra um job de CI (subir a composição, aguardar saúde, `curl`), ou é `MAN` declarado. |

### 7. Dados de teste: fixtures e factories implicadas

O conjunto exige a seguinte camada de dados. Vale registrá-la agora — construída de uma vez é barata, retrofitada é cara:

1. **Semente de organização**: 2 setores, 2 categorias (uma por setor), 1 administrador, **2 solicitantes distintos** (toda negativa de IDOR precisa do segundo), 1 professor, 2 atendentes (um por setor), 1 gestor, e **1 atendente sem setor** — este último existe só para AC2.1.4 e é o mais fácil de esquecer.
2. **Semente de catálogo**: 4 status, 3 prioridades, **mais 1 categoria inativa e 1 setor inativo** (AC1.2.6, AC4.2.3) — igualmente fáceis de esquecer.
3. **Factory de chamado** com `status`, `assigneeId`, `sectorId`, `createdAt` e `closedAt` sobrescrevíveis.
4. **AC2.1.3 — chamado que já passou por um setor.** Duas complicações. Primeira: o critério exige um **registro de passagem por setor** que nenhum requisito descreve; a única fonte hoje seria o histórico de FR4.6, e depender do histórico para decidir autorização é uma escolha de desenho que ninguém fez conscientemente. Vale sinalizar como consequência de modelo de dados, não só como custo de fixture. Segunda: a fixture mais segura é construir esse chamado **pela própria API** (criar → transferir), não semear linhas, para que ela não divirja da regra real de transferência. Custo: duas chamadas autenticadas e um segundo setor. Aceitável, mas não trivial.
5. **AC1.6.1 e AC1.6.2 — chamado encerrado há 3 dias ou mais.** É a fixture mais desconfortável do conjunto, e por um motivo específico: **relógio falso não funciona aqui**. A asserção atravessa Supertest, Nest, Prisma e um Postgres real; `jest.useFakeTimers()` não alcança o `now()` do banco nem o processo do serviço da mesma forma. Restam duas saídas honestas: (a) gravar `closedAt` explicitamente na fixture e comparar contra um **relógio injetável** no serviço de reabertura, sobrescrito no teste; ou (b) manipular a coluna direto no banco e torcer para que o serviço leia `closedAt` e não `now()` interno. A opção (a) é a única que sobrevive. **Isso é uma restrição de desenho que a história cria**: se o serviço chamar `new Date()` inline, AC1.6.1 e AC1.6.2 ficam sem teste possível. Vale registrar na história.
6. **Token expirado** (AC1.1.5): fábrica que assina com o segredo de teste e `exp` no passado.
7. **Rota sem marcação de perfil** (AC5.1.3): não pode existir no código de produção, por definição. Exige um **controlador só de teste**, registrado num módulo de teste. Sem nomear isso, o desenvolvedor conclui que o critério é intestável e o pula.
8. **Auxiliar de notificação** compartilhado, ver §4.
9. **Isolamento entre testes contra Postgres real**: com ~90 critérios tocando o banco num serviço compartilhado, os testes ficam dependentes de ordem se cada um não truncar ou rodar em transação revertida. É preocupação de Construction, mas é **o volume deste conjunto de histórias** que a torna obrigatória desde o primeiro Bolt — barata no início, cara depois.

### 8. Duas incoerências que só aparecem ao escrever o teste

**(a) Fronteira dos 3 dias: AC1.6.2 contradiz FR8.3.** FR8.3 diz que o solicitante reabre "dentro de 3 dias corridos" e que "no 4º dia a reabertura é recusada". AC1.6.2 recusa "encerrado há **3 dias corridos ou mais**". No instante exato de encerramento + 72h, FR8.3 permite e AC1.6.2 recusa. Um teste de fronteira precisa de um único número. Além disso, "3 dias corridos" comporta duas contagens diferentes: 72 horas exatas, ou 3 dias de calendário (e em qual fuso?). A suposição A5 de `requirements.md` fixou o marco inicial, não a unidade.

**(b) AC4.1.3 decide arquitetura de sessão sem dizer.** "A mudança vale na requisição autenticada seguinte dele" só é verdade se o perfil for **lido do banco a cada requisição**. Se o perfil viajar dentro do JWT — e a sessão afirmada é JWT sem renovação automática — a mudança só passa a valer no próximo login, e o critério falha. O critério, como está, obriga o guard a consultar o banco por requisição. Pode ser a decisão certa; o problema é que ela está sendo tomada dentro de uma linha de tabela de história de usuário.

Registro também, sem objeção: as suposições que fecham R-01, R-03, R-04 e R-05 estão declaradas com honestidade na seção final. O parecer do revisor de requisitos segue `NOT-READY` com esses achados em estado `New`, então a ratificação é do humano no portão — o rascunho faz a coisa certa ao explicitar em vez de silenciar.

**Nota de exatidão menor**: a tabela INVEST afirma "entre 5 e 7 critérios por história". Não vale para US5.1 (3), US5.2 (2), US5.3 (4), US5.4 (3), US6.2 (2) e US6.3 (3).

### 9. Decisões que devem ir ao humano, não ser resolvidas por mim nem pelo redator

1. **A fronteira dos 3 dias** (§8a): permitido ou recusado em 72h exatas, e "dias corridos" são 72 horas ou dias de calendário em qual fuso. Um teste precisa de um número.
2. **O que "coberto" significa para um requisito sem casa automatizada.** AC5.3.2, AC5.4.1, AC5.4.2, AC5.4.3, o contraste de NFR5 e CT4 só têm verificação manual. Com cobertura por requisito como **portão principal**, aceitar um checklist manual datado como linha válida da tabela é uma flexibilização do portão afirmado — e só o humano pode concedê-la. A alternativa é rebaixar esses critérios de Must.
3. **A troca responsiva em 375px é dirigida por JavaScript ou por CSS puro?** JavaScript dá casa automatizada a AC5.4.2 e AC5.4.3; CSS puro é mais simples e não dá nenhuma. É troca consciente entre testabilidade e simplicidade.
4. **O perfil é lido do banco a cada requisição ou carregado no JWT?** (§8b) Consequência direta sobre a sessão já afirmada.
5. **Entra uma camada de simulação de requisição no frontend (MSW ou equivalente)?** É acréscimo ao ferramental afirmado em `team.md`, portanto decisão do humano. Sem ela, AC2.1.6 e qualquer critério futuro de estado de erro na tela ficam sem verificação.
6. **Algoritmo e fator de custo do hash de senha** (CT3): "resistente a força bruta" não é valor de aprovação/reprovação.
7. **A regra 403 × 404 para ações** (§3b): confirmar o princípio agora, porque ele é o valor esperado de todos os testes negativos obrigatórios.

## Positions

- AGREE: Os blocos "Cobre: FR…" ao fim de cada história — são exatamente o que torna construível a tabela requisito → teste que é o portão principal deste projeto, e poucos conjuntos de histórias trazem isso.
- AGREE: AC1.2.5, AC1.3.5, AC2.1.2, AC5.2.1 e AC1.5.6 — negativas de segurança escritas como comportamento observável, baratas de testar e de valor desproporcional ao custo.
- AGREE: A separação dos NFR entre Critérios Transversais e US5 evita repetir cinco critérios em vinte histórias, e mantém rastreável o requisito de origem.
- AGREE: As pendências declaradas em US6.1 e US6.3 e as seis suposições finais — o rascunho prefere explicitar a lacuna a fingir que não existe, e é assim que o portão do humano funciona.
- OBJECT: A tabela INVEST afirma que "todo critério tem resultado verificável", o que é falso para AC5.3.2, AC5.4.1, AC5.4.2, AC5.4.3, CT1, CT4 e AC1.5.5 — `requirements.md` já dizia que NFR5 se verifica por inspeção manual, e a história perdeu essa honestidade na tradução.
- OBJECT: AC5.1.1 e AC5.1.2 são meta-critérios ("existe um teste automatizado afirmando isso") — descrevem o processo, não o sistema, e produzem linhas inúteis na tabela de rastreabilidade; a obrigação de testar pertence à Definição de Pronto, e o critério deve descrever o 403 e o 404 observáveis.
- OBJECT: Seis critérios encerram-se em "a ação não está disponível" ou "o acesso é negado" sem código HTTP (AC1.1.3, AC2.1.4, AC1.6.6, AC2.3.4, AC2.4.6, AC3.1.4), justamente onde o teste negativo de autorização é obrigatório — falta a regra 403 × 404 para ações, distinta do 404 de visibilidade de NFR4.
- OBJECT: Critérios citam a mensagem em português como resultado esperado (AC1.1.2) ou dizem apenas "erro específico" (AC2.3.5, AC2.4.2, AC4.1.2, AC2.2.2), contrariando o contrato afirmado em que `code` é o contrato estável e a tradução vive só no frontend.
- OBJECT: AC1.6.2 recusa a reabertura a partir de 3 dias completos, enquanto FR8.3 só a recusa "no 4º dia" — a fronteira de 72 horas fica ambígua, e é exatamente onde um teste de limite precisa de um número único.
- OBJECT: CT1 afirma a forma da implementação (`where` da consulta) em vez de comportamento observável, contradizendo a própria tabela INVEST do documento e sem virar teste de caixa-preta.
- OBJECT: Doze requisitos ficam sem critério que os teste — FR2.2 e FR2.3 sem nenhuma cobertura, e FR1.2 (`HttpOnly`), FR3.3, FR3.4, FR4.1, FR4.3, FR5.4 (transferência pelo Gestor), FR6.2 (ordem das mensagens), FR6.5 (404 no endpoint de mensagens), FR8.4 e o contraste de NFR5 apenas parcialmente cobertos.
- OBJECT: AC2.1.3 exige um registro de passagem por setor que nenhum requisito descreve, e AC1.6.1/AC1.6.2 exigem um relógio injetável no serviço de reabertura — duas restrições de modelo e de desenho criadas pelas histórias sem serem nomeadas, que só aparecem quando alguém tenta montar a fixture.
