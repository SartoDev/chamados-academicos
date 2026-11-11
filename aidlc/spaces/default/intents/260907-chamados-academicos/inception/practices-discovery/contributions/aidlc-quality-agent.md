**Collaborator:** aidlc-quality-agent

## Contribution

Revisão de qualidade sobre o rascunho de `## Testing Posture`, a parte de CI de `## Deployment` e as perguntas de entrevista associadas. Contexto que restringe tudo abaixo: greenfield sem código, desenvolvedor único a 10–20h/semana, TCC, ambiente só local via Docker, CI apenas de integração (build, lint, testes), AWS proibida, `Test Strategy` ativa = Standard (~5–8 testes por componente, unitário + integração nas fronteiras-chave; E2E/performance/segurança só quando um NFR exigir). As etapas de NFR foram cortadas deste fluxo, logo **não existe nenhum NFR que exija E2E, teste de carga ou teste de segurança** — isso não é uma escolha em aberto, é consequência do plano.

### 1. Cadência: `test-after` puro não é o melhor ajuste — proponho um híbrido nomeado

`test-after` como regra geral está certo para este perfil de capacidade: escrever teste antes de existir uma assinatura estável em controllers, DTOs, módulos NestJS e telas React desperdiça horas escassas em retrabalho de teste.

Mas há dois artefatos onde test-first é **mais barato**, não mais caro, porque a especificação já é uma tabela e a tabela já é o teste:

1. **Máquina de transições de status do chamado** — o conjunto `(status atual, ação, perfil) -> status permitido | erro` é finito e conhecido antes da implementação. Escrever a tabela como teste primeiro produz a implementação correta na primeira tentativa e impede a armadilha clássica de "só testei os caminhos que implementei".
2. **Matriz de autorização por perfil** — cinco perfis (aluno, professor, atendente, gestor, administrador) × ações × propriedade do recurso (dono/não-dono, mesmo setor/outro setor). É o comportamento de maior valor do sistema e o mais fácil de quebrar silenciosamente numa refatoração. Teste escrito depois tende a espelhar o código implementado, não a regra pretendida.

Nos dois casos os testes são orientados a tabela (`it.each` / `test.each`): uma tabela de casos, um corpo de teste. O custo por caso adicional é uma linha.

**Texto exato proposto para os dois campos que Code Generation resolve literalmente:**

```
- **Methodology**: custom
- **Ordering**: regra geral test-after — implementar a camada testável (domínio,
  serviço, componente, hook) e escrever e rodar os testes daquela camada antes de
  passar para a próxima, dentro do mesmo Bolt. Duas exceções test-first
  obrigatórias: (1) a máquina de transições de status do chamado e (2) a matriz de
  autorização por perfil; nessas duas a tabela de casos é escrita e roda vermelha
  antes da implementação. Nenhum Bolt é dado como concluído com testes adiados
  para um Bolt posterior.
```

Ponto crítico de mecânica: se o humano aceitar o híbrido, o campo **precisa** valer `custom`, não `test-after`. Code Generation lê `Methodology` como valor literal; manter `test-after` e descrever a exceção apenas na prosa faz a exceção ser ignorada na execução.

Se o humano preferir uniformidade, `test-after` puro é aceitável — mas então a matriz de autorização deve ser o **primeiro** teste escrito no Bolt de atendimento, não o último.

Independentemente da escolha, três cláusulas faltam no rascunho e valem mais que a metodologia em si:

- **Sem dívida de teste entre Bolts**: o teste vive no mesmo Bolt e no mesmo commit do código. A 10–20h/semana, um "Bolt de testes no fim" nunca acontece.
- **Todo defeito ganha um teste**: ao encontrar um bug, escrever primeiro o teste que o reproduz, depois corrigir. Custo quase zero e é a única defesa contra regressão num projeto sem revisor humano.
- **Estratégia de dados de teste**: fábricas por agregado (`createUser(perfil)`, `createTicket(status)`) em `test/factories/`, não um seed SQL único. Fábricas mantêm os testes independentes e legíveis; seed compartilhado cria acoplamento por ordem de execução.

### 2. Cobertura: 80% de linha global é o instrumento errado aqui — recomendação concreta

Recomendo **não** afirmar o piso de 80% de linha global. Três razões concretas:

- **Denominador poluído por scaffolding.** Um projeto NestJS + Vite + Shadcn nasce com muito código gerado sem comportamento próprio: `main.ts`, `app.module.ts`, módulos, DTOs, `prisma.service.ts`, componentes `ui/` do Shadcn, `vite-env.d.ts`. Perseguir 80% global força testes de baixo valor sobre esse material — exatamente as horas que não existem.
- **Linha é a métrica errada para autorização.** Uma linha `if (user.role !== 'atendente') throw new ForbiddenException()` fica 100% coberta por um único teste com o perfil que passa. O caminho de negação nunca foi exercido e a cobertura de linha não vê isso. **Ramo (branch)** é a métrica que importa nesse código.
- **Piso fixado antes de existir código é um chute.** Não há linha de base para calibrar.

**Recomendação — gate em duas camadas:**

**(a) Gate primário, qualitativo: cobertura por requisito.** Cada critério de aceite de história Must have tem pelo menos um teste automatizado que falha se o critério for quebrado. Verificável por uma tabela de rastreabilidade curta (`ID do requisito -> nome do teste`) mantida no repositório. É o que a estratégia Standard já pede e é o que uma banca de TCC consegue de fato avaliar — um percentual de cobertura não prova que a regra de negócio está testada; a tabela prova.

**(b) Gate secundário, mecânico: limiares de cobertura por caminho, não globais.** Vitest (`coverage.thresholds` com chaves de glob) e Jest (`coverageThreshold` com chaves de path) suportam isso nativamente:

```
// exemplo de configuração no backend
coverage: {
  provider: 'v8',
  thresholds: {
    'src/**/*.guard.ts':   { branches: 90, lines: 90 },
    'src/**/*.policy.ts':  { branches: 90, lines: 90 },
    'src/**/*.service.ts': { branches: 80, lines: 80 },
    // sem piso: controllers, DTOs, módulos, main.ts, prisma.service.ts
  },
  exclude: ['src/main.ts', 'src/**/*.module.ts', 'src/**/*.dto.ts', '**/*.spec.ts'],
}
```

No frontend, mesmo padrão: piso sobre hooks de domínio e utilitários; **sem piso** sobre `src/components/ui/**` (Shadcn) e páginas de layout.

**Calibração:** medir e reportar cobertura desde o Bolt 1, mas só **bloquear** a partir do Bolt 2, com o limiar fixado no que o Bolt 1 realmente alcançou nos caminhos com piso (efeito catraca: pode subir, nunca desce). Isso evita tanto o chute inicial quanto a erosão ao longo do projeto.

Se o humano quiser mesmo um número global para o documento do TCC, sugerir um piso global **baixo e honesto** (40–50%) como canário anti-regressão, ao lado dos pisos altos e localizados — e explicar na monografia por que o número localizado é o relevante. É mais defensável academicamente do que um 80% global inflado por testes triviais de scaffolding.

### 3. Ferramental concreto para esta pilha

**Backend (NestJS + Prisma + Postgres): Jest com `@swc/jest`.**

Recomendo **não** trocar por Vitest no backend, apesar de o frontend ser Vite. Motivo técnico específico, não preferência: Vitest transpila via esbuild, e **esbuild não emite `emitDecoratorMetadata`**. Sem esses metadados, a injeção de dependência do NestJS não resolve os tipos dos parâmetros de construtor e os testes com `Test.createTestingModule()` quebram. A saída existe (`unplugin-swc` no `vitest.config.ts`), mas é uma sessão inteira de briga de configuração — cara demais a 10–20h/semana, enquanto o Nest CLI já entrega Jest funcionando sem trabalho nenhum. Trocar `ts-jest` por `@swc/jest` recupera boa parte da velocidade com uma linha de configuração.

**Frontend (React + Vite): Vitest + `@testing-library/react` + `@testing-library/user-event`, ambiente `happy-dom`.** Três ajustes que evitam falhas intermitentes previsíveis nesta pilha:

- React Query: um helper `renderWithProviders` que cria um `QueryClient` novo por teste com `defaultOptions: { queries: { retry: false } }`. Sem isso, testes de caminho de erro ficam presos nas re-tentativas e estouram timeout.
- React Hook Form + Shadcn: usar `user-event`, não `fireEvent` — validação e estado de formulário dependem da sequência real de eventos.
- Mock de rede: **MSW** interceptando a requisição, em vez de mockar o cliente HTTP. Mockar o cliente testa o mock; MSW testa o código que monta a requisição e lê a resposta.

Aceitar dois runners é o trade-off correto aqui: o custo é lembrar dois comandos; o benefício é zero configuração de decorators e zero configuração cruzada de JSX/Vite.

**Postgres real vs mock do Prisma — recomendação: Postgres real para serviços e endpoints; mock do Prisma só em casos pontuais.**

Mockar o Prisma (`jest-mock-extended`, `prismock`) produz testes que passam com a query errada — e neste domínio o risco está exatamente nas queries: filtrar chamados por setor e por perfil, transições com constraint, índices únicos, cascatas. Um mock não vê nada disso. Como o Docker já é obrigatório no projeto, o Postgres real custa quase nada:

- Serviço `postgres-test` no `docker-compose.yml` (ou num `docker-compose.test.yml` / profile `test`), em porta distinta, com o diretório de dados em `tmpfs` — descartável e rápido, sem volume persistente.
- `.env.test` com `DATABASE_URL` apontando para ele. Antes da suíte, `prisma migrate deploy` (não `db push`): assim as **migrações** também são exercidas, e migração quebrada aparece no CI e não seis semanas depois.
- Isolamento entre testes: um helper global que roda `TRUNCATE <tabelas> RESTART IDENTITY CASCADE` no `beforeEach`. Mais simples e mais previsível que transação-por-teste com Prisma, que conflita quando o próprio código da aplicação abre transações.
- Executar a suíte de integração **serialmente** contra o banco único (`--runInBand` no Jest). Workers paralelos num banco compartilhado é a fonte clássica de flakiness.
- Separar scripts: `test:unit` (puro, sem banco — regras de domínio, guards, matriz de autorização, frontend) e `test:int` (precisa do banco). Local: rodar `test:unit` continuamente; CI: roda os dois.
- `@testcontainers/postgresql` é a alternativa e funciona, mas adiciona dependência e download de imagem; com Compose já no projeto, não compensa.

Mock do Prisma fica reservado a um caso legítimo: simular falha de infraestrutura (deadlock, violação de constraint) para testar o tratamento de erro — cenário difícil de provocar de verdade.

### 4. Contrato frontend–backend: sim ao contrato, não a uma ferramenta de contract testing

Ferramenta de contract testing dirigido pelo consumidor (Pact + broker + CI dos dois lados) **não se paga** aqui: um único desenvolvedor, os dois lados no mesmo repositório, entrega conjunta. O problema que o Pact resolve — consumidor e provedor evoluindo em ritmos independentes, com times diferentes — não existe neste projeto.

O que se paga, e custa quase nada:

1. **Tipos gerados a partir do backend.** `@nestjs/swagger` (idiomático no NestJS, decorators sobre os DTOs que já vão existir) gera o OpenAPI; `openapi-typescript` gera os tipos do cliente a partir dele. A partir daí, **`tsc --noEmit` no CI é o teste de contrato** — mudar um DTO no backend sem ajustar o frontend quebra o build. Verificação de fronteira em tempo de compilação, custo marginal zero, e o arquivo OpenAPI ainda vira anexo de documentação do TCC.
2. **`ValidationPipe` global com `whitelist: true` e `forbidNonWhitelisted: true`** no backend. Os testes de integração de endpoint passam a detectar deriva de forma no servidor, sem nenhum teste extra escrito para isso.
3. **Handlers MSW tipados** com os mesmos tipos gerados — assim um mock do frontend não pode descrever uma resposta que o backend nunca devolve, que é o modo de falha real de testes de frontend com mock.

Integração propriamente dita ganha lugar num ponto só: **testes de endpoint com `supertest` sobre a aplicação Nest real + Postgres real**, um por regra de autorização e um por transição de status. São os testes de maior valor por hora do projeto inteiro. Testes de componente React ficam limitados às telas do corte mínimo já listadas no rascunho (login, lista, abertura, fila) e valem menos que os de endpoint.

**E2E (Playwright): fora do piso mínimo e fora do gate de merge — concordo com o rascunho.** Como as etapas de NFR foram cortadas, nenhum NFR exige E2E, então pela definição da estratégia Standard ele está fora por construção. A pergunta real ao humano não é "a estratégia exige?" (não exige), e sim: quer 2–3 caminhos de fumaça em Playwright (login por perfil, abertura de chamado, atendente muda status) rodando contra `docker compose up`, **como material de demonstração e evidência para a banca**, executados manualmente ou em agendamento, nunca bloqueando PR? É um item "se sobrar hora", com valor acadêmico real e valor de regressão baixo.

### 5. No que o CI deve bloquear

CI é só integração (build, lint, testes), sem CD, sem registry, sem AWS. Sequência proposta, do mais barato ao mais caro, com falha rápida:

**Bloqueia:**

1. `npm ci` (não `npm install`) com versão de Node fixada em `.nvmrc` / `engines`.
2. `prettier --check` e `eslint --max-warnings=0` nos dois pacotes.
3. `tsc --noEmit` nos dois pacotes — é aqui que o contrato de fronteira da seção 4 é verificado.
4. `prisma validate` e `prisma migrate deploy` contra um Postgres limpo (serviço de banco do próprio runner de CI, gratuito, sem nuvem). Migração quebrada é a falha mais cara de descobrir tarde.
5. `test:unit` verde.
6. `test:int` verde, contra o Postgres do passo 4.
7. Build de produção dos dois apps (`nest build`, `vite build`) — pega problemas de import e de variável de ambiente que a checagem de tipos não pega.
8. **A partir do Bolt 2:** limiares de cobertura por caminho da seção 2.

**Não bloqueia (roda e reporta):**

- E2E Playwright, se existir.
- Auditoria de dependências (`npm audit`): reportar, não bloquear. Uma CVE transitiva sem correção disponível não pode parar um TCC.
- Cobertura dos caminhos sem piso (UI Shadcn, scaffolding).

Dois detalhes operacionais que importam mais do que parecem para um desenvolvedor solo:

- **`concurrency` com cancelamento de execuções em andamento** por branch: evita fila de execuções obsoletas.
- **Orçamento de tempo: o CI completo precisa ficar abaixo de ~5 minutos.** Acima disso, um desenvolvedor único começa a contornar o gate — e gate contornado é pior que gate nenhum, porque cria falsa confiança. Se passar de 5 minutos, cortar escopo do CI antes de cortar disciplina.

Por fim, o gate de merge só existe de fato se a proteção de branch estiver ligada em `main` exigindo o check verde; caso contrário o próprio autor faz merge por cima de um CI vermelho. Isso é decisão de configuração, não de ferramenta (ver seção 6).

### 6. O que o HUMANO precisa decidir, e não eu

1. **Aceitar o híbrido `custom` (test-first para máquina de status e matriz de autorização) ou manter `test-after` uniforme.** Muda o hábito diário de trabalho; só ele sabe o próprio conforto com escrever teste antes do código.
2. **Qual instrumento de cobertura vale como "o número" do TCC.** Se o orientador ou o regulamento da disciplina exigir um percentual de cobertura declarado no documento, isso muda o que precisa aparecer escrito — só o humano tem essa informação. A recomendação técnica da seção 2 continua a mesma.
3. **Um runner ou dois** (Jest no backend + Vitest no frontend, como recomendo, ou Vitest em tudo pagando a configuração `unplugin-swc`).
4. **Se os caminhos de fumaça em Playwright entram como material de demonstração para a banca** (fora do gate) ou não entram de forma alguma.
5. **Se `main` terá proteção de branch exigindo CI verde** — ou seja, se ele aceita um gate contra si mesmo. Sem isso, tudo na seção 5 é aconselhamento, não gate.
6. **Quanto do orçamento de horas por Bolt vai para testes.** Sugestão de referência: ~20–25% das horas do Bolt. Quando os testes de um Bolt estourarem esse teto, cortar escopo de teste conscientemente — nunca afrouxar o gate para o passo passar (`org.md` § Testing Posture proíbe explicitamente enfraquecer o piso para fazer um passo passar).

## Positions

- AGREE: manter E2E de navegador fora do piso mínimo — com as etapas de NFR cortadas, nenhum NFR exige E2E, então pela estratégia Standard ele está fora por construção, e não por economia de horas.
- AGREE: tratar o piso de 80% de `org.md` como sugestão a confirmar e não incluí-lo em `discovered-rules.md` — a leitura do rascunho sobre o status desse default está correta.
- AGREE: substituir integralmente o modelo staging/produção de `org.md` por "merge em `main` = pronto para rodar localmente", com CI como único gate — não há ambiente a proteger.
- AGREE: registrar a ausência de revisor humano como assumption em vez de inventar um processo de revisão inexistente.
- OBJECT: `Methodology: test-after` uniforme — as regras de maior risco do sistema (transições de status e matriz de autorização de cinco perfis) são tabelas conhecidas antes da implementação, e teste escrito depois tende a espelhar o código em vez da regra; proponho `custom` com duas exceções test-first nomeadas.
- OBJECT: piso de 80% de cobertura de **linha global** — o denominador fica dominado por scaffolding NestJS/Shadcn e, no código de autorização, cobertura de linha não enxerga o caminho de negação; proponho cobertura por requisito como gate primário e limiares por caminho (90% de ramo em guards e policies, 80% em services, sem piso em scaffolding) como gate mecânico.
- OBJECT: "Vitest ou Jest para o backend" deixado em aberto — a escolha não é simétrica: Vitest via esbuild não emite `emitDecoratorMetadata` e quebra a injeção de dependência do NestJS sem `unplugin-swc`; a entrevista deve apresentar isso como custo concreto, não como preferência de gosto.
- OBJECT: falta decidir mock do Prisma vs Postgres real — é a decisão de ferramental de maior impacto do projeto e o rascunho só menciona "banco de testes" de passagem; sem Postgres real, as regras de filtragem por setor e perfil e as próprias migrações ficam sem verificação nenhuma.
- OBJECT: `## Testing Posture` não cita a `Test Strategy` ativa (Standard, ~5–8 testes por componente) — `org.md` determina que os pisos de escopo são aditivos à estratégia, então a estratégia precisa estar declarada no artefato para o piso ser interpretável.
- OBJECT: faltam três cláusulas de disciplina que valem mais que a metodologia — testes no mesmo Bolt e commit do código (sem dívida de teste), teste de regressão obrigatório para todo defeito encontrado, e dados de teste por fábricas em vez de seed compartilhado.
- OBJECT: falta a decisão sobre proteção de branch em `main` exigindo CI verde — sem ela, "o lint roda em CI e falha bloqueia o merge do Bolt" (§ Code Style) e todo o gate de CI viram aspiração, já que o autor pode fazer merge por cima de um check vermelho.
