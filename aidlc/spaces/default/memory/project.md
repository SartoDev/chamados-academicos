# Project-Level Rules

> Project-specific specialisation and corrections. Loaded after `org.md` and
> `team.md` as strict-additive guidance; contradictions with broader policy
> are rejected. Populated by practices-discovery and the self-learning loop.
>
> Use sparingly: most teams don't need a project layer. Reach for it
> only when this specific project needs stable, durable guidance beyond the
> team practice (for example, package-specific release checks or an additional
> regression suite for a legacy component).

## Way of Working

<!-- Project-specific specialisation. Example: -->
<!-- This monorepo requires package-scoped branch names and a package owner -->
<!-- review in addition to the team's normal merge policy. -->

## Walking Skeleton

<!-- Project-specific specialisation. Example: -->
<!-- The walking skeleton must exercise the legacy service adapter as well -->
<!-- as the new service boundary. -->

## Testing Posture

<!-- Project-specific specialisation. -->

- Quando uma unidade nova precisa de limiar de cobertura para suas regras, a chave de limiar existente e ampliada para cobrir o novo caminho, em vez de se criar uma chave por unidade: a exigencia e a mesma e ha menos configuracao para manter. (learned 2026-10-05) <!-- cid:260907-chamados-academicos:code-generation:d1b3ee3a3c935b80ca58a84a665b75523ad10dfc3b7aa91ac0728b6e7d7811b0 -->
- Comando de teste restrito a uma unidade nao leva a opcao de cobertura: o limiar global e aplicado sobre uma execucao parcial e reprova sem que nenhum teste falhe. A cobertura e verificada no portao completo, onde todos os limiares valem. (learned 2026-10-05) <!-- cid:260907-chamados-academicos:build-and-test:5d0bb1b437a96c607c86fe07a560f33b63fbb9721a9831c8cf928ca032b6bfd9 -->
## Deployment

<!-- Project-specific specialisation. -->

## Code Style

<!-- Project-specific specialisation. -->

## Tech Stack

<!-- Technology choices locked for this project. -->

## Decided

<!-- Decisions made in earlier stages that should not be re-asked. -->
<!-- Format: DECIDED: [decision] (Stage [slug], [date]) -->

## Scope Overrides

<!-- Custom scope rules for this project. -->

## Forbidden

<!-- Populated by practices-discovery affirmation gate. -->
<!-- Format: NEVER [behavior] (affirmed [date]) -->
<!-- Example: NEVER throw exceptions across service layer boundaries (affirmed 2026-05-17) -->

- Nao usar servidores MCP da AWS nem qualquer passo que exija credenciais AWS neste projeto; a infraestrutura segue Docker + CI/CD, sem provedor de nuvem fixado. (learned 2026-09-08) <!-- cid:260907-chamados-academicos:intent-capture:d1c1ee23d08f8a935775d27ba0132425556ca0201bf2a357929c9f0248d18ad9 -->
- NEVER usar servidores MCP da AWS, serviços AWS ou qualquer passo que exija credenciais AWS neste projeto. (já afirmado em `project.md` § Forbidden) (affirmed 2026-09-08)
- NEVER implantar o sistema em servidor externo ou em ambiente de homologação/produção — o único ambiente de execução é local, via Docker e Docker Compose. (decisão de Ideação D07/D09; escopo do documento de escopo) (affirmed 2026-09-08)
- NEVER publicar imagens de contêiner em registry nem executar entrega contínua (CD) — o pipeline cobre apenas integração contínua. (decisão de Ideação D08) (affirmed 2026-09-08)
- NEVER incluir anexos em chamados, notificação por e-mail ou qualquer canal de notificação externo ao sistema, SLA/prazos automáticos, exportação de relatórios em PDF/CSV, ou base de conhecimento/FAQ nesta entrega — itens deliberadamente excluídos do escopo, com origem rastreável. (decisões de Ideação D16–D18) (affirmed 2026-09-08)
- NEVER configurar proteção de branch em `main` que exija CI verde — a decisão afirmada na entrevista é manter `main` sem proteção no servidor, deslocando o bloqueio real para o hook local de pre-push. (afirmado na entrevista, Q2/Q9) (affirmed 2026-09-08)
- NEVER usar teste automatizado de navegador (Playwright ou equivalente) neste projeto, nem como gate de merge nem como material de demonstração fora do gate — a verificação dos cinco perfis de acesso é feita por teste de API. (afirmado na entrevista, Q6) (affirmed 2026-09-08)
- NEVER implementar renovação automática (refresh token) de sessão nem invalidação de sessão no servidor no logout — consequência aceita: um token roubado permanece válido até a expiração natural. (afirmado na entrevista, Q7) (affirmed 2026-09-08)
- NEVER deixar vazar um erro nativo do Prisma na resposta da API — todo erro é convertido para o envelope único `{ error: { code, message, details, traceId } }` antes de chegar ao cliente. (integrado das revisões técnicas, sem pergunta ao humano) (affirmed 2026-09-08)
- NEVER publicar a porta do Postgres no host sem ligá-la a `127.0.0.1`. (integrado das revisões técnicas, sem pergunta ao humano) (affirmed 2026-09-08)
## Mandated

<!-- Populated by practices-discovery affirmation gate. -->
<!-- Format: ALWAYS [behavior] (affirmed [date]) -->
<!-- Example: ALWAYS use Result<T,E> for fallible operations in service layer (affirmed 2026-05-17) -->

- ALWAYS escrever artefatos legíveis por pessoas (documentação, especificações, revisões) em português (pt-BR), mantendo código e comentários de código em inglês. (já afirmado em `project.md` § Corrections) (affirmed 2026-09-08)
- ALWAYS restringir a Área Administrativa dedicada ao nível Should have, garantindo que categorias e setores sejam administráveis pelo modelo de dados no corte mínimo (Must have) mesmo sem a interface de administração completa. (já afirmado em `project.md` § Mandated) (affirmed 2026-09-08)
- ALWAYS tratar a comunicação dentro do chamado (mensagens entre solicitante e atendente) como unidade separada do ciclo de vida do chamado, com modelo de dados e regras de acesso próprios. (já afirmado em `project.md` § Mandated) (affirmed 2026-09-08)
- ALWAYS rodar build, lint e testes automatizados em Integração Contínua a cada push e a cada pull request. (decisão de Ideação D08, decorrente de D07 — ambiente apenas local) (affirmed 2026-09-08)
- ALWAYS manter o repositório único, com `apps/api` e `apps/web` em npm workspaces, lint e formatação configurados na raiz, um único workflow de CI com dois jobs, e Dockerfiles com contexto de build na raiz. (afirmado na entrevista, Q1) (affirmed 2026-09-08)
- ALWAYS exigir um hook local de pre-push rodando lint e a suíte de testes rápidos antes de qualquer `git push`, já que não há proteção de branch configurada em `main` e o CI no servidor não bloqueia merge algum. (afirmado na entrevista, Q2/Q9) (affirmed 2026-09-08)
- ALWAYS aplicar `Status` e `Priority` como tabelas administráveis no modelo de dados, nunca como enums fixos, em decorrência do corte mínimo aprovado em Definição de Escopo. (integrado das revisões técnicas, sem pergunta ao humano) (affirmed 2026-09-08)
- ALWAYS manter identificadores de código em inglês, seguindo o glossário canônico 1:1 dos termos de domínio em português (chamado→Ticket, setor→Sector, atendente→agent/assignee, prioridade→Priority, categoria→Category, status→Status, aluno→student, professor→professor/teacher, gestor→manager, administrador→admin). (integrado das revisões técnicas, sem pergunta ao humano) (affirmed 2026-09-08)
- ALWAYS manter o token de sessão (JWT) num cookie `httpOnly`, com duração média (algumas horas) e sem renovação automática (refresh token); o logout apaga o cookie no navegador, sem invalidação da sessão no servidor. (afirmado na entrevista, Q7) (affirmed 2026-09-08)
- ALWAYS habilitar varredura de segredos (`gitleaks`) e a análise estática gratuita do GitHub (CodeQL default setup) no repositório, que é público. (afirmado na entrevista, Q8) (affirmed 2026-09-08)
- ALWAYS bloquear o pipeline de CI com `tsc --noEmit` (`strict: true`), ESLint, a suíte de testes, varredura de segredos e auditoria de dependências de produção em severidade alta (`npm audit --omit=dev --audit-level=high`); auditoria completa e CodeQL apenas reportam, sem bloquear. (integrado das revisões técnicas, sem pergunta ao humano) (affirmed 2026-09-08)
- ALWAYS aplicar um guard global de negação por padrão (deny-by-default) e filtrar o ator dentro da cláusula `where` da consulta ao Prisma, nunca buscar o recurso e comparar o dono depois; todo endpoint não público exige ao menos um teste negativo de autorização (`403`) e todo recurso com dono exige ao menos um teste de IDOR. (integrado das revisões técnicas, sem pergunta ao humano — mecanismo de aplicação; a matriz de perfil × recurso × operação em si é regra de negócio de Functional Design) (affirmed 2026-09-08)
## Corrections

<!-- Project-specific corrections from human feedback. -->
<!-- Format: NEVER/ALWAYS [behavior] (learned [date]) -->
- Todos os artefatos legiveis por pessoas deste projeto sao escritos em portugues (pt-BR); codigo e comentarios de codigo ficam em ingles. (learned 2026-09-08) <!-- cid:260907-chamados-academicos:intent-capture:c8d0e5254d26dfcd2c9fe2786aab3238219b4ddeccd6b9bbbc9d50a892ea37d1 -->
- A area administrativa e classificada como Should have, nao Must have: o corte minimo exige apenas que categorias e setores sejam administraveis pelo modelo de dados; a interface dedicada de administracao vem depois. (learned 2026-09-08) <!-- cid:260907-chamados-academicos:scope-definition:9784e057e41e59f7ff7ab9d4210a23cbf1ca8200415bcc79a17bf9ebe016bae0 -->
- A comunicacao dentro do chamado (mensagens entre solicitante e atendente) e tratada como unidade separada do ciclo de vida do chamado, por ter modelo de dados e regras de acesso proprios. (learned 2026-09-08) <!-- cid:260907-chamados-academicos:scope-definition:5c04e7a353ba92c3f3d25b12acf6e76aad77d30268357fc50e26453e3a2c8bca -->
- Nomes de unidade de trabalho (o name do bloco YAML, que vira diretório de construção e nome de ramo) são identificadores e ficam em inglês, no formato u{n}-<descrição>; o nome em português aparece só como nome exibido nas tabelas dos artefatos. (learned 2026-09-12) <!-- cid:260907-chamados-academicos:units-generation:a6474b8e18faa149711152d22641dfa3fad072aeaba143b6e587dfe498107d89 -->
- No mapa de histórias por unidade, uma história é associada também a toda unidade em que algum critério de aceitação dela só pode ser realizado, com a divisão por critério registrada, para que nenhum critério fique sem unidade que o rastreie. (learned 2026-09-12) <!-- cid:260907-chamados-academicos:units-generation:cd131982a640930f560135647ea9bebf064e25c5eda50ae92a8db2e02698c2e3 -->
- No Planejamento de Entrega, quando cada Bolt corresponde a uma única unidade e não há formação de equipe, as respostas por Bolt (unidades, marcador de esqueleto, Definição de Pronto, hipótese de confiança, dono) são derivadas dos artefatos anteriores e confirmadas pelo autor no portão, em vez de virarem perguntas. (learned 2026-09-13) <!-- cid:260907-chamados-academicos:delivery-planning:fe6768fcf79616761e5a817217076c8e8321311497c5d64a475787c11fdf788a -->
- Não perguntar sobre dependências externas quando decisões já registradas as respondem (autor como único aprovador, prazo que não restringe, escopo sem integrações externas); registrar a ausência no mapa de dependências, com a origem de cada item. (learned 2026-09-13) <!-- cid:260907-chamados-academicos:delivery-planning:e1c0b790a004d45b397fd0b29d73d19b3f5b47122eaeec40ba872b0baec53402 -->
- Quando uma regra das histórias (por exemplo, Could have só depois de todas as Must) contradiz uma permissão dada em etapa anterior (por exemplo, paralelismo entre unidades), perguntar ao autor qual prevalece, em vez de decidir. (learned 2026-09-13) <!-- cid:260907-chamados-academicos:delivery-planning:d8fbe9bd8932d3d40f8768198abde766052dead2ddbf4dbb912617ef3fdb8a43 -->
- Riscos apontados em etapas anteriores entram no registro de riscos do planejamento mesmo quando o autor não os marca como preocupação, mas não passam à frente, dentro dos Bolts, das preocupações que o autor escolheu. (learned 2026-09-13) <!-- cid:260907-chamados-academicos:delivery-planning:bf6212610c83d995a042d8d34b8e13d416411aacbde8a0b9a7138fef5535edd1 -->
- A escolha entre 403 e 404 segue a visibilidade do recurso pai: quem vê o chamado mas não pode agir sobre o recurso filho recebe 403; o 404 fica só para quem não alcança o recurso, e é idêntico ao 404 de recurso inexistente. (learned 2026-09-27) <!-- cid:260907-chamados-academicos:functional-design:8f887ad2fb0b7bb52056e0d30f39882201d9e95b0396845875d52f35ebcfa532 -->
- A contagem de tentativas de login conta qualquer e-mail informado, exista ou não o usuário, e normaliza o e-mail antes de contar; contar só e-mails existentes revelaria quais contas existem, e não normalizar permitiria contornar o bloqueio variando maiúsculas. (learned 2026-09-27) <!-- cid:260907-chamados-academicos:functional-design:6c99fe64dfbb0b24f27d347e9c7ec22310d571bdaca48558afb880e87581c517 -->
- Nenhuma consulta de uma unidade lê a tabela de outra unidade para filtrar: quando o recorte desejado exigiria esse acesso, o recorte é estreitado e a consequência fica declarada no desenho, em vez de contornada por uma junção que atravessa a fronteira de dados. (learned 2026-09-27) <!-- cid:260907-chamados-academicos:functional-design:2e070985fbc76b4fc12fbb3678976d1fdf4dbc3d57be0af7cc08011d54cd4afb -->
- Uma unidade que inclui tela produz o documento de componentes de frontend mesmo quando é classificada como serviço; a classificação da unidade não dispensa o artefato quando há interface a desenhar. (learned 2026-09-27) <!-- cid:260907-chamados-academicos:functional-design:0e839caaa99b60ad5dd4e79835810f9078ddc93b06edaded36f95a30adf0c3c0 -->
- Quando o desenho já está congelado por revisão final e seu texto descreve um ponto de extensão de forma imprecisa, o mecanismo real é fixado no plano de código, que prevalece sobre o texto do desenho, e a divergência entre os dois vai ao portão humano em vez de ser corrigida no desenho. (learned 2026-09-27) <!-- cid:260907-chamados-academicos:functional-design:ed32a629d0044c61b727e4e72d84d2232adcb8654c6b509b01215d03e6e23fae -->
- Todo número do painel de indicadores é recortado pelo encerramento atual do chamado, não pelo instante do registro; a consequência aceita é que um chamado reaberto sai das médias enquanto estiver aberto e volta no período do encerramento seguinte. (learned 2026-09-27) <!-- cid:260907-chamados-academicos:functional-design:941cec19631ac3d2c018ab696b8a29fae38eb79b793d917485ea285543c111f2 -->
- O acesso do Administrador é decidido por tipo de recurso, não por nível de privilégio: ele lê a avaliação, que julga o serviço prestado, e não lê a conversa do chamado, que pode carregar o assunto pessoal do solicitante; toda assimetria dessas é declarada na regra. (learned 2026-09-27) <!-- cid:260907-chamados-academicos:functional-design:a9824ce7cd98e0f75866ad1f5b801e38564c84ca871ec7e30b74c336a4a66801 -->
- Quando dois números da mesma tela usam recortes de período diferentes, a tela diz em texto qual é o recorte de cada um; sem isso o número é lido como se todos viessem do mesmo recorte. (learned 2026-09-27) <!-- cid:260907-chamados-academicos:functional-design:7a6beefc53375210057861bdc63bd3f257ee9071c82bf5518b497a23313221c3 -->
- Aviso de seguranca em dependencia de producao se corrige por override na raiz com lockfile regenerado, nunca aceitando o aviso nem rebaixando o nivel da auditoria; o custo aceito e que npm ls acusa invalido e os overrides precisam sair quando o upstream corrigir. (learned 2026-10-05) <!-- cid:260907-chamados-academicos:code-generation:89840be9c5e118ca882490e57c72f51863cc07b184102c1c1c7be06c782960fd -->
- Codigo de erro que uma restricao de banco torna inalcancavel por HTTP nao e removido: fica coberto por teste de regra e de service com ator sintetico, e a inalcancabilidade e declarada no desenho. (learned 2026-10-05) <!-- cid:260907-chamados-academicos:code-generation:cf6e3324278aa0eaec336031d6f8159d7278fc6ab0808a7af35cef0dfc92bfce -->
