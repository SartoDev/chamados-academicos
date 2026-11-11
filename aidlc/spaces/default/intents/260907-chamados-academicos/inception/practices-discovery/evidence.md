# Evidência

## O que foi inspecionado por cada participante

- **Líder (engenheiro de release, rascunho inicial)**: `aidlc-state.md` (projeto Greenfield, escopo `feature`, 18 etapas planejadas); `org.md` (as cinco seções tratadas como sugestão padrão, não fato deste projeto); `team.md` (template vazio, nenhuma reafirmação a herdar); `project.md` (entradas já afirmadas em `## Forbidden` e `## Corrections`, transpostas como fato); `ideation/approval-handoff/initiative-brief.md` e `decision-log.md` (ambiente local via Docker, CI apenas de integração, 10–20h/semana, desenvolvedor único, sequenciamento "fundação primeiro" D15); `ideation/scope-definition/scope-document.md` (exclusões de escopo que viraram proibições, ordem de construção); workspace do repositório (sem `.git`, sem CI, sem configuração de lint pré-existente — greenfield confirmado).
- **Engenheiro de qualidade**: inferiu a partir da `Test Strategy` ativa (Standard) e do corte das etapas de NFR que nenhum NFR exige E2E, teste de carga ou teste de segurança. Analisou o rascunho de `## Testing Posture` e propôs um híbrido `custom` (test-first para a máquina de transições de status e a matriz de autorização), limiares de cobertura por caminho em vez de piso global de linha, Jest+`@swc/jest` no backend e Vitest+Testing Library no frontend, e Postgres real (não mock do Prisma) para os testes de integração.
- **Desenvolvedor**: inspecionou a estrutura dos onze proto-Units para propor o layout de repositório único com `apps/api`/`apps/web`, o glossário de nomenclatura pt-BR→inglês, as convenções de Prisma, as fronteiras de camada do NestJS (controller/service/módulo puro de domínio), o envelope único de erro, e a organização do frontend com React Query/React Hook Form.
- **Engenheiro de segurança (devsecops)**: partiu da mesma constatação de corte das etapas de NFR para propor o conjunto de verificações de CI (bloqueantes vs. apenas informativas), a configuração de cookie/JWT, o mecanismo de aplicação de autorização (guard deny-by-default, filtro na consulta, testes negativos), e as práticas de segredo/Docker Compose (`.gitignore` no commit inicial, porta do Postgres não publicada).

## Decisões da entrevista (Q1–Q9) e onde cada uma resolveu uma tensão

- **Q1 — Repositório**: confirmada a recomendação do desenvolvedor sem alteração — repositório único, `apps/api` + `apps/web` em npm workspaces, lint/formatação na raiz, um workflow de CI com dois jobs, Dockerfiles com contexto na raiz.
- **Q2 + Q9 — Fluxo de merge**: o humano escolheu pull request **sem** proteção de branch (Q2), e a Q9 resolveu a tensão que isso cria com a Q5 (limiares de cobertura como "portão mecânico"): o bloqueio real é um **hook local de pre-push** rodando lint e testes rápidos, não o CI no servidor. O devsecops havia objetado explicitamente contra descrever o CI como um portão que ele não é — a redação final de `team-practices.md` § Way of Working e § Deployment segue essa objeção à risca, afirmando com honestidade que nada no servidor impede um merge sobre um pipeline vermelho.
- **Q3 — Esqueleto ambulante**: o humano recusou uma entrega separada e gated; o sequenciamento "fundação primeiro" já decidido em Ideação cobre a mesma necessidade.
- **Q4 — Metodologia de teste**: o humano **recusou** o híbrido `custom` proposto pelo engenheiro de qualidade (test-first para máquina de status e matriz de autorização) e escolheu `test-after` uniforme para todas as camadas. `team-practices.md` registra `- **Methodology**: test-after`, não `custom`.
- **Q5 — Cobertura**: o humano escolheu a opção combinada — cobertura por requisito como critério principal, mais os limiares por caminho (90% de ramo em guards/autorização, 80% em services, sem piso em andaime/UI) como portão mecânico do CI. O piso de 80% de linha global sugerido por `org.md` como default é explicitamente substituído, conforme a objeção do engenheiro de qualidade contra esse número.
- **Q6 — Teste de navegador**: o humano recusou Playwright inteiramente, mesmo como material de demonstração fora do gate. O tempo vai para testes de API cobrindo os cinco perfis — alinhado à posição do engenheiro de segurança de que teste de API, não de navegador, é o instrumento certo para verificar autorização.
- **Q7 — Sessão**: o humano escolheu token de duração média (algumas horas) sem refresh, com logout apenas apagando o cookie no navegador — a opção (A) que o engenheiro de segurança recomendou tecnicamente, com a consequência (token roubado continua válido até expirar) registrada por escrito em vez de ficar implícita.
- **Q8 — Visibilidade do repositório**: público, o que liga a varredura de segredos obrigatória e a análise estática gratuita do GitHub (CodeQL default setup) — exatamente o par que o devsecops havia condicionado à visibilidade pública.

## Decisões técnicas integradas sem pergunta ao humano

Vindas das três revisões e sem tensão entre si nem com as decisões do humano, por isso integradas diretamente em `team-practices.md` e `discovered-rules.md`:
- Glossário de nomenclatura pt-BR→inglês e convenções Prisma (PascalCase singular, camelCase, `@map`/`@@map`) — proposta do desenvolvedor.
- `Status` e `Priority` como tabelas administráveis, não enums — decorrência direta do corte mínimo já aprovado em Definição de Escopo (levantada como pergunta em aberto pelo desenvolvedor, mas já resolvida pela regra existente em `project.md`, não pela entrevista).
- Camadas NestJS (controller sem Prisma, service concentrando regra de negócio, máquina de estados em módulo puro) — proposta do desenvolvedor.
- Envelope único de erro com `code` como contrato e tradução só no frontend — proposta do desenvolvedor.
- Ferramental de teste (Jest+`@swc/jest` no backend, Vitest+Testing Library no frontend, Postgres real em serviço de teste do Compose) — proposta do engenheiro de qualidade, sem objeção das demais revisões.
- Conjunto bloqueante do CI (`tsc --noEmit` com `strict`, ESLint, testes, `gitleaks`, `npm audit --omit=dev --audit-level=high`) e itens apenas informativos (auditoria completa, CodeQL, cobertura fora dos caminhos com piso) — proposta do engenheiro de segurança, compatível com a decisão de repositório público (Q8).
- Mecanismo de aplicação de autorização (guard deny-by-default, filtro no `where` do Prisma, teste negativo obrigatório por endpoint e teste de IDOR por recurso com dono) — proposta do engenheiro de segurança; a matriz de perfil × recurso × operação em si permanece como regra de negócio de Functional Design, não como prática deste estágio.
- Segredos e Docker Compose (`.gitignore`/`.dockerignore`/`.env.example` no commit inicial, validação de ambiente obrigatória, porta do Postgres não publicada ou ligada a `127.0.0.1`, rotação em vez de reescrita de histórico em caso de vazamento) — proposta do engenheiro de segurança.

## Onde uma recomendação de apoio foi recusada pelo humano

- O engenheiro de qualidade recomendou `Methodology: custom` com exceções test-first para a máquina de transições de status do chamado e a matriz de autorização dos cinco perfis, argumentando que nessas duas a especificação já é uma tabela de casos e testar depois tende a espelhar o código implementado em vez da regra pretendida. **O humano recusou (Q4)** e optou por `test-after` uniforme. A objeção do engenheiro de qualidade fica registrada aqui como histórico de decisão, não como prática vigente.
- O engenheiro de segurança e o de qualidade convergiam em manter algum uso de Playwright como material de demonstração acadêmica (2–3 roteiros de fumaça, fora do gate). **O humano recusou (Q6)** — nenhum teste de navegador entra no projeto, nem como evidência de defesa.
- Nenhuma das três revisões recomendou proteção de branch obrigatória como requisito estrito, mas o engenheiro de segurança e o de qualidade destacaram a tensão de descrever o CI como gate sem ela. A entrevista (Q9) resolveu isso optando pelo hook local em vez de ativar a proteção — opção C, não a opção A (ativar proteção), que também estava disponível.

## Incerteza remanescente

Nenhuma. Todas as questões abertas no rascunho do líder foram fechadas pela entrevista (Q1–Q9) ou resolvidas por decisão técnica já registrada em `project.md` (caso de `Status`/`Priority` como tabelas administráveis). A matriz de perfil × recurso × operação continua propositalmente fora deste estágio — mora em Functional Design, como regra de negócio, e não é uma pendência deste artefato.

## Assumptions & Open Questions

None.
