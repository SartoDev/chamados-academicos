# Descoberta de Práticas — Entrevista

Estas perguntas fecham as cinco áreas que viram prática permanente do projeto: como o trabalho flui, se há uma fatia inicial de ponta a ponta, como se testa, o que o pipeline exige, e as convenções de código.

O rascunho foi escrito pelo engenheiro de release e revisado de forma independente pelo engenheiro de qualidade, pelo desenvolvedor e pelo engenheiro de segurança. As opções abaixo trazem a recomendação de cada um quando ela existe.

---

## Q1. O frontend e o backend ficam num repositório só ou em dois?

Decide desde já o formato do CI, a configuração de lint e o contexto de build dos Dockerfiles. O desenvolvedor recomenda um repositório só.

- A. Um repositório, com `apps/api` e `apps/web` em npm workspaces: lint e formatação configurados na raiz, um workflow de CI com dois jobs, Dockerfiles com contexto na raiz.
- B. Dois repositórios independentes, cada um com seu CI e sua configuração.
- C. Um repositório, mas sem workspaces: duas pastas com `package.json` independentes.
- D. Not yet defined.
- X. Other (please specify)

[Answer]: A. Um repositório, com `apps/api` e `apps/web` em npm workspaces: lint e formatação configurados na raiz, um workflow de CI com dois jobs, Dockerfiles com contexto na raiz.

---

## Q2. Como o código entra na branch principal, já que você trabalha sozinho?

Sem um segundo par de olhos humano, o pipeline automatizado é a única checagem que sempre roda. Tanto o engenheiro de segurança quanto o de qualidade apontaram que dizer "lint quebrado bloqueia o merge" só é verdade se houver proteção configurada — caso contrário você pode aprovar a si mesmo por cima de um CI vermelho.

- A. Branches curtas com pull request e proteção na `main` exigindo CI verde. Você abre e faz o merge do próprio PR, mas não consegue mesclar com o pipeline quebrado.
- B. Branches curtas com pull request, sem proteção configurada: disciplina pessoal decide.
- C. Commits direto na `main`, com o CI rodando depois e servindo de alarme.
- D. Not yet defined.
- X. Other (please specify)

[Answer]: B. Branches curtas com pull request, sem proteção configurada: disciplina pessoal decide.

---

## Q3. Construir uma fatia fina de ponta a ponta primeiro? Um esqueleto ambulante é uma versão mínima que atravessa o sistema inteiro, construída antes das funcionalidades reais para provar que as peças se conectam.

No seu caso seria algo como: login funcionando, um chamado sendo criado e listado, atravessando React, NestJS, Prisma e Postgres dentro do Docker Compose — sem regra de negócio de verdade. Você já escolheu "fundação primeiro" como sequenciamento, o que cobre parte disso.

- A. Sim, como primeira entrega separada e aprovada à parte, antes de qualquer funcionalidade real.
- B. Não; o sequenciamento "fundação primeiro" já resolve, e uma entrega extra só para provar a ligação não se paga.
- C. Sim, mas sem tratá-la como entrega separada: apenas garantir que a primeira unidade de trabalho atravesse a pilha toda.
- D. Not yet defined.
- X. Other (please specify)

[Answer]: B. Não; o sequenciamento "fundação primeiro" já resolve, e uma entrega extra só para provar a ligação não se paga.

---

## Q4. Quando os testes são escritos em relação ao código?

O engenheiro de qualidade recomenda a opção B, argumentando que máquina de transições de status e matriz de permissões são exatamente onde escrever o teste antes evita retrabalho — e que essas duas são o coração do sistema.

- A. Sempre depois: implementa a camada, depois escreve e roda os testes dela.
- B. Regra geral depois, com duas exceções escritas antes: a máquina de transições de status do chamado e a matriz de autorização dos cinco perfis.
- C. Sempre antes: teste primeiro em tudo.
- D. Not yet defined.
- X. Other (please specify)

[Answer]: A. Sempre depois: implementa a camada, depois escreve e roda os testes dela.

---

## Q5. Qual é o critério de cobertura de testes que vale como portão?

O padrão sugerido para este tipo de projeto é 80% de cobertura de linha no geral. O engenheiro de qualidade recusa esse número: diz que ele infla com código de andaime e componentes do Shadcn, e propõe medir onde importa.

- A. Cobertura por requisito: cada requisito aprovado precisa de um teste que o verifique, com uma tabela ligando um ao outro. Sem percentual global.
- B. Limiares por caminho: 90% de ramo em guards e regras de permissão, 80% em services, sem piso em andaime e componentes de UI.
- C. As duas coisas: cobertura por requisito como critério principal, mais os limiares por caminho como portão mecânico do CI.
- D. Manter o padrão: 80% de cobertura de linha no projeto todo.
- X. Other (please specify)

[Answer]: C. As duas coisas: cobertura por requisito como critério principal, mais os limiares por caminho como portão mecânico do CI.

---

## Q6. Teste automatizado de navegador (Playwright) entra no projeto?

Com as etapas de requisitos não funcionais fora do plano, teste de navegador não é exigido por nada. A pergunta real é se ele vale como material de demonstração para a banca.

- A. Sim, mas fora do portão: dois ou três roteiros gravados que atravessam os fluxos principais, servindo de evidência na defesa. Falha neles não bloqueia o merge.
- B. Sim, e bloqueando: os roteiros principais precisam passar para o merge acontecer.
- C. Não; o tempo rende mais em testes de API cobrindo os cinco perfis.
- D. Not yet defined.
- X. Other (please specify)

[Answer]: C. Não; o tempo rende mais em testes de API cobrindo os cinco perfis.

---

## Q7. Como funciona a sessão do usuário?

O engenheiro de segurança pede que isso seja fixado agora, e não improvisado na geração de código. O token fica num cookie `httpOnly`; a questão é a validade e o que acontece no logout.

- A. Token de curta duração (15 minutos) com refresh automático, e logout invalidando a sessão no servidor.
- B. Token de duração média (algumas horas), sem refresh, e logout apenas apagando o cookie no navegador.
- C. Token de curta duração com refresh, mas logout apenas apagando o cookie (sem invalidação no servidor).
- D. Not yet defined.
- X. Other (please specify)

[Answer]: B. Token de duração média (algumas horas), sem refresh, e logout apenas apagando o cookie no navegador.

---

## Q8. O repositório será público ou privado?

Muda o que faz sentido no pipeline: análise estática gratuita do GitHub só existe para repositórios públicos, e repositório público eleva o custo de um segredo vazado por acidente.

- A. Público, como parte do portfólio: vale ligar a análise estática gratuita e a varredura de segredos é obrigatória.
- B. Privado: varredura de segredos ainda entra, análise estática fica de fora.
- C. Privado agora, público depois da defesa.
- D. Not yet defined.
- X. Other (please specify)

[Answer]: A. Público, como parte do portfólio: vale ligar a análise estática gratuita e a varredura de segredos é obrigatória.

---

## Q9. (Follow-up) Sem proteção na branch, o que significa "portão" do CI?

Há uma tensão entre duas respostas. A Q2 escolheu pull request **sem** proteção configurada, e a Q5 escolheu limiares de cobertura como **portão mecânico do CI**. Sem proteção na `main`, nada impede um merge com o pipeline vermelho: o portão vira aviso. Preciso saber o que escrever na prática, para que ela descreva o que de fato acontece.

- A. Ativar proteção na `main` exigindo CI verde — os limiares viram portão de verdade. Isso corrige a resposta da Q2 para "com proteção".
- B. Manter sem proteção: o CI roda e falha visivelmente, mas nada bloqueia. A prática registra isso como disciplina pessoal, não como portão.
- C. Sem proteção no servidor, mas com hook local de pre-push rodando lint e testes rápidos: o bloqueio acontece na sua máquina.
- D. Manter sem proteção agora e revisitar quando a primeira unidade de trabalho terminar.
- X. Other (please specify)

[Answer]: C. Sem proteção no servidor, mas com hook local de pre-push rodando lint e testes rápidos: o bloqueio acontece na sua máquina.

---

## Consolidated Summary Confirmation

Resumo consolidado das decisoes de pratica:

- Repositorio: um so, com `apps/api` e `apps/web` em npm workspaces; lint e formatacao na raiz, um workflow de CI com dois jobs (Q1).
- Fluxo de merge: branches curtas com pull request, sem protecao configurada na `main`; o bloqueio real acontece por hook local de pre-push rodando lint e testes rapidos (Q2, Q9).
- Esqueleto ambulante: nao havera entrega separada; o sequenciamento "fundacao primeiro" ja cobre a necessidade (Q3).
- Cadencia de testes: sempre test-after - implementa a camada, depois escreve e roda os testes dela (Q4).
- Cobertura: cobertura por requisito como criterio principal, mais limiares por caminho (90% de ramo em guards e permissoes, 80% em services, sem piso em andaime e UI) verificados no CI (Q5).
- Teste de navegador: fora do projeto; o esforco vai para testes de API cobrindo os cinco perfis (Q6).
- Sessao: token em cookie httpOnly com duracao de algumas horas, sem refresh; logout apaga o cookie no navegador, sem invalidacao no servidor (Q7).
- Repositorio publico: varredura de segredos obrigatoria e analise estatica gratuita do GitHub ligada (Q8).

Decisoes tecnicas que integro sem perguntar, vindas das tres revisoes:

- Identificadores de codigo sempre em ingles, com glossario 1:1 dos termos de dominio em portugues (chamado -> Ticket, setor -> Sector, atendente -> agent, prioridade -> Priority, categoria -> Category). Modelos Prisma em PascalCase singular, tabelas snake_case plural via `@@map`.
- Camadas NestJS: controller so trata HTTP, service concentra a regra e e o unico a tocar o Prisma, maquina de transicoes de status num modulo puro sem Nest e sem Prisma.
- Envelope unico de erro `{ error: { code, message, details, traceId } }`, com `code` como contrato e traducao para portugues no frontend.
- Ferramental de teste: Jest com `@swc/jest` no backend (Vitest quebra a injecao de dependencia do NestJS), Vitest com Testing Library no frontend; Postgres real em servico de teste do Compose para os testes de integracao.
- Status e prioridades sao tabelas administraveis, nao enums fixos - decorre do corte minimo aprovado na Definicao de Escopo.
- CI bloqueante: `tsc --noEmit` com `strict`, ESLint, testes, varredura de segredos e auditoria de dependencias de producao em severidade alta. Apenas relatam: auditoria completa e analise estatica.

- Looks correct
- Request changes

[Answer]: Looks correct
