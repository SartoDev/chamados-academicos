# Regras Descobertas

Restrições que agora são fatos estabelecidos do projeto — vindas da descrição inicial, de decisões já registradas em Ideação, de `project.md`, e das decisões afirmadas na entrevista de Practices Discovery (Q1–Q9).

## Mandated

- ALWAYS escrever artefatos legíveis por pessoas (documentação, especificações, revisões) em português (pt-BR), mantendo código e comentários de código em inglês. (já afirmado em `project.md` § Corrections)
- ALWAYS restringir a Área Administrativa dedicada ao nível Should have, garantindo que categorias e setores sejam administráveis pelo modelo de dados no corte mínimo (Must have) mesmo sem a interface de administração completa. (já afirmado em `project.md` § Mandated)
- ALWAYS tratar a comunicação dentro do chamado (mensagens entre solicitante e atendente) como unidade separada do ciclo de vida do chamado, com modelo de dados e regras de acesso próprios. (já afirmado em `project.md` § Mandated)
- ALWAYS rodar build, lint e testes automatizados em Integração Contínua a cada push e a cada pull request. (decisão de Ideação D08, decorrente de D07 — ambiente apenas local)
- ALWAYS manter o repositório único, com `apps/api` e `apps/web` em npm workspaces, lint e formatação configurados na raiz, um único workflow de CI com dois jobs, e Dockerfiles com contexto de build na raiz. (afirmado na entrevista, Q1)
- ALWAYS exigir um hook local de pre-push rodando lint e a suíte de testes rápidos antes de qualquer `git push`, já que não há proteção de branch configurada em `main` e o CI no servidor não bloqueia merge algum. (afirmado na entrevista, Q2/Q9)
- ALWAYS aplicar `Status` e `Priority` como tabelas administráveis no modelo de dados, nunca como enums fixos, em decorrência do corte mínimo aprovado em Definição de Escopo. (integrado das revisões técnicas, sem pergunta ao humano)
- ALWAYS manter identificadores de código em inglês, seguindo o glossário canônico 1:1 dos termos de domínio em português (chamado→Ticket, setor→Sector, atendente→agent/assignee, prioridade→Priority, categoria→Category, status→Status, aluno→student, professor→professor/teacher, gestor→manager, administrador→admin). (integrado das revisões técnicas, sem pergunta ao humano)
- ALWAYS manter o token de sessão (JWT) num cookie `httpOnly`, com duração média (algumas horas) e sem renovação automática (refresh token); o logout apaga o cookie no navegador, sem invalidação da sessão no servidor. (afirmado na entrevista, Q7)
- ALWAYS habilitar varredura de segredos (`gitleaks`) e a análise estática gratuita do GitHub (CodeQL default setup) no repositório, que é público. (afirmado na entrevista, Q8)
- ALWAYS bloquear o pipeline de CI com `tsc --noEmit` (`strict: true`), ESLint, a suíte de testes, varredura de segredos e auditoria de dependências de produção em severidade alta (`npm audit --omit=dev --audit-level=high`); auditoria completa e CodeQL apenas reportam, sem bloquear. (integrado das revisões técnicas, sem pergunta ao humano)
- ALWAYS aplicar um guard global de negação por padrão (deny-by-default) e filtrar o ator dentro da cláusula `where` da consulta ao Prisma, nunca buscar o recurso e comparar o dono depois; todo endpoint não público exige ao menos um teste negativo de autorização (`403`) e todo recurso com dono exige ao menos um teste de IDOR. (integrado das revisões técnicas, sem pergunta ao humano — mecanismo de aplicação; a matriz de perfil × recurso × operação em si é regra de negócio de Functional Design)

## Forbidden

- NEVER usar servidores MCP da AWS, serviços AWS ou qualquer passo que exija credenciais AWS neste projeto. (já afirmado em `project.md` § Forbidden)
- NEVER implantar o sistema em servidor externo ou em ambiente de homologação/produção — o único ambiente de execução é local, via Docker e Docker Compose. (decisão de Ideação D07/D09; escopo do documento de escopo)
- NEVER publicar imagens de contêiner em registry nem executar entrega contínua (CD) — o pipeline cobre apenas integração contínua. (decisão de Ideação D08)
- NEVER incluir anexos em chamados, notificação por e-mail ou qualquer canal de notificação externo ao sistema, SLA/prazos automáticos, exportação de relatórios em PDF/CSV, ou base de conhecimento/FAQ nesta entrega — itens deliberadamente excluídos do escopo, com origem rastreável. (decisões de Ideação D16–D18)
- NEVER configurar proteção de branch em `main` que exija CI verde — a decisão afirmada na entrevista é manter `main` sem proteção no servidor, deslocando o bloqueio real para o hook local de pre-push. (afirmado na entrevista, Q2/Q9)
- NEVER usar teste automatizado de navegador (Playwright ou equivalente) neste projeto, nem como gate de merge nem como material de demonstração fora do gate — a verificação dos cinco perfis de acesso é feita por teste de API. (afirmado na entrevista, Q6)
- NEVER implementar renovação automática (refresh token) de sessão nem invalidação de sessão no servidor no logout — consequência aceita: um token roubado permanece válido até a expiração natural. (afirmado na entrevista, Q7)
- NEVER deixar vazar um erro nativo do Prisma na resposta da API — todo erro é convertido para o envelope único `{ error: { code, message, details, traceId } }` antes de chegar ao cliente. (integrado das revisões técnicas, sem pergunta ao humano)
- NEVER publicar a porta do Postgres no host sem ligá-la a `127.0.0.1`. (integrado das revisões técnicas, sem pergunta ao humano)

## Assumptions & Open Questions

None.
