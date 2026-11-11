# Desenho de Contratos — Plano e Perguntas

Base: `../units-generation/unit-of-work.md` (5 unidades), `../units-generation/unit-of-work-dependency.md` (8 arestas e pontos de integração), `../domain-design/components.md` (forma das entidades) e `../requirements-analysis/requirements.md` (FR, NFR e a questão em aberto sobre o estilo da API).

Esta etapa fixa os **contratos**: o que atravessa cada fronteira, em que forma, por qual mecanismo, e o que acontece quando dá errado. Este sistema tem dois tipos de fronteira:

- **Entre unidades, dentro do backend.** As oito arestas do grafo (U2→U1, U3→U1, U3→U2, U4→U1, U4→U2, U5→U1, U5→U2, U5→U4). Todas rodam no mesmo processo.
- **Entre o navegador e o backend.** A API HTTP que `apps/web` consome. Cada unidade acrescenta a sua parte dela.

Já fixado e não perguntado:

- Integração entre unidades por chamada direta e síncrona de serviço, sem eventos (Q5 do Desenho de Domínio).
- Chave estrangeira só no sentido do grafo; dado de outra unidade lido pelo serviço dela (Q5 da Geração de Unidades).
- Envelope único de erro `{ error: { code, message, details, traceId } }`, com `code` estável em inglês e tradução só no frontend (`team.md`).
- 404, e não 403, para recurso que existe mas que o ator não pode ver (NFR4).
- Sessão em JWT num cookie `httpOnly`, sem refresh token (FR1.2).
- Listagens paginadas com contagem total e troca de página (FR4.8), o que pede paginação por número de página, e não por cursor.
- Nenhum consumidor fora do sistema: integrações externas estão fora de escopo (`requirements.md`). O único consumidor da API HTTP é o frontend do próprio projeto.

---

## Q1. Qual o estilo da API HTTP entre o frontend e o backend?

`requirements.md` deixou esta decisão para esta etapa. Ela define como toda unidade expõe suas operações ao navegador.

- A. REST com JSON: recursos no plural em inglês (`/tickets`, `/tickets/{id}/messages`), verbos HTTP para as operações, e ações que não são criar/ler/alterar/apagar como sub-recursos (`POST /tickets/{id}/transfer`). Especificado em OpenAPI.
- B. GraphQL: um único endpoint, com esquema tipado e consultas montadas pelo frontend.
- C. RPC tipado sobre HTTP: cada operação é uma função com entrada e saída tipadas, sem modelagem de recursos.
- X. Other (please specify)

[Answer]: A. REST com JSON: recursos no plural em inglês (`/tickets`, `/tickets/{id}/messages`), verbos HTTP para as operações, e ações que não são criar/ler/alterar/apagar como sub-recursos (`POST /tickets/{id}/transfer`). Especificado em OpenAPI.

---

## Q2. Qual é a fonte da verdade do contrato HTTP, e os tipos são compartilhados entre `apps/api` e `apps/web`?

Um contrato escrito num lugar e um código que diverge dele é o problema clássico. A resposta define onde essa divergência é pega.

- A. OpenAPI gerado do código do backend (decorators do NestJS nos DTOs e controllers), com tipos gerados a partir dele e consumidos pelo frontend; o CI falha se o arquivo gerado mudar sem ser commitado. Os blocos desta etapa são o desenho inicial; depois de construído, o código passa a ser a fonte da verdade.
- B. OpenAPI escrito à mão como fonte da verdade, com o backend validado contra ele em teste.
- C. Um terceiro pacote de workspace, `packages/contracts`, com esquemas de validação em TypeScript importados pelas duas aplicações, sem OpenAPI.
- X. Other (please specify)

[Answer]: A. OpenAPI gerado do código do backend (decorators do NestJS nos DTOs e controllers), com tipos gerados a partir dele e consumidos pelo frontend; o CI falha se o arquivo gerado mudar sem ser commitado. Os blocos desta etapa são o desenho inicial; depois de construído, o código passa a ser a fonte da verdade.

---

## Q3. Como uma unidade expõe operações para outra dentro do backend?

São oito arestas, todas no mesmo processo. O contrato aqui não é HTTP: é a interface TypeScript que uma unidade oferece às outras.

- A. Cada bloco exporta, pelo módulo NestJS, apenas um serviço público, com métodos tipados que recebem e devolvem tipos próprios do contrato — nunca modelos do Prisma. Serviços internos, controllers e o acesso ao banco não são exportados.
- B. A unidade exporta os providers que quiser; quem consome pode injetar qualquer um deles e usar os tipos do Prisma diretamente.
- C. Portas e adaptadores: a unidade consumidora define a interface de que precisa, e a provedora a implementa e registra; nenhuma unidade importa classe concreta de outra.
- X. Other (please specify)

[Answer]: A. Cada bloco exporta, pelo módulo NestJS, apenas um serviço público, com métodos tipados que recebem e devolvem tipos próprios do contrato — nunca modelos do Prisma. Serviços internos, controllers e o acesso ao banco não são exportados.

---

## Q4. Como tratar uma mudança que quebra contrato?

Backend e frontend moram no mesmo repositório e sobem juntos com `docker compose up`; nenhum consumidor externo depende de versão antiga.

- A. Sem versão na URL, só o prefixo `/api`. Uma mudança que quebra contrato é feita no mesmo pull request no backend, no frontend e nas unidades consumidoras. Mudanças aditivas são sempre seguras: consumidores ignoram campos desconhecidos.
- B. Prefixo `/api/v1` desde já, sem manter versões paralelas, só para deixar o caminho pronto caso surja consumidor externo.
- C. Versionamento com período de convivência: uma versão nova convive com a antiga até todos os consumidores migrarem.
- X. Other (please specify)

[Answer]: B. Prefixo `/api/v1` desde já, sem manter versões paralelas, só para deixar o caminho pronto caso surja consumidor externo.

---

## Q5. Qual o formato e o dono dos códigos de erro (o campo `code` do envelope)?

As histórias exigem códigos específicos — credencial inválida, prazo de reabertura vencido, transição inválida, chamado já assumido, transferência para o mesmo setor — e o frontend traduz cada um. O formato vira contrato estável.

- A. SCREAMING_SNAKE em inglês com prefixo do domínio (`AUTH_INVALID_CREDENTIALS`, `TICKET_INVALID_TRANSITION`, `TICKET_REOPEN_WINDOW_EXPIRED`), cada unidade dona dos seus prefixos, mais códigos genéricos compartilhados sem prefixo (`VALIDATION_FAILED`, `NOT_FOUND`, `FORBIDDEN`, `UNAUTHENTICATED`).
- B. Minúsculas separadas por ponto (`ticket.invalid_transition`), com a mesma divisão de dono.
- C. Só códigos genéricos por categoria (`NOT_FOUND`, `CONFLICT`, `VALIDATION_FAILED`), com o motivo específico dentro de `details`.
- X. Other (please specify)

[Answer]: A. SCREAMING_SNAKE em inglês com prefixo do domínio (`AUTH_INVALID_CREDENTIALS`, `TICKET_INVALID_TRANSITION`, `TICKET_REOPEN_WINDOW_EXPIRED`), cada unidade dona dos seus prefixos, mais códigos genéricos compartilhados sem prefixo (`VALIDATION_FAILED`, `NOT_FOUND`, `FORBIDDEN`, `UNAUTHENTICATED`).

---

## Q6. Como o frontend e as unidades reagem a uma falha: nova tentativa, tempo limite, propagação?

O critério CT7 exige estado de erro com ação de repetir em toda tela. A biblioteca de consultas do frontend repete automaticamente três vezes por padrão, inclusive em erros que não vão mudar, como 403 e 404.

- A. Frontend: consultas repetem no máximo uma vez, e só em falha de rede ou 5xx, nunca em 4xx; mutações nunca repetem sozinhas; tempo limite de 15 segundos por requisição, tratado como falha de rede. Entre unidades: sem tempo limite nem nova tentativa, por ser o mesmo processo; a exceção com `code` da unidade provedora se propaga até o filtro global, salvo quando a consumidora precisa traduzi-la para não revelar existência (404).
- B. Frontend com os padrões da biblioteca (três tentativas para qualquer erro); entre unidades, igual a A.
- C. Nenhuma nova tentativa automática: toda falha vai direto ao estado de erro com botão de repetir; entre unidades, igual a A.
- X. Other (please specify)

[Answer]: A. Frontend: consultas repetem no máximo uma vez, e só em falha de rede ou 5xx, nunca em 4xx; mutações nunca repetem sozinhas; tempo limite de 15 segundos por requisição, tratado como falha de rede. Entre unidades: sem tempo limite nem nova tentativa, por ser o mesmo processo; a exceção com `code` da unidade provedora se propaga até o filtro global, salvo quando a consumidora precisa traduzi-la para não revelar existência (404).

---

## Q7. Qual a forma das respostas de sucesso?

Define o que todo endpoint devolve quando dá certo, para que o frontend tenha um único jeito de ler.

- A. Recurso direto no corpo (`{ "id": ..., "title": ... }`); listas como `{ "items": [...], "total": 42, "page": 1, "pageSize": 20 }`; criação responde 201 com o recurso criado; ação sem retorno responde 204. Datas em ISO 8601 UTC; campos em camelCase.
- B. Tudo embrulhado em `{ "data": ..., "meta": { ... } }`, inclusive recurso único.
- C. Recurso direto no corpo, e paginação nos cabeçalhos HTTP (`X-Total-Count`), com a lista como array puro.
- X. Other (please specify)

[Answer]: A. Recurso direto no corpo (`{ "id": ..., "title": ... }`); listas como `{ "items": [...], "total": 42, "page": 1, "pageSize": 20 }`; criação responde 201 com o recurso criado; ação sem retorno responde 204. Datas em ISO 8601 UTC; campos em camelCase.

---

## Q8. Que tipo de identificador aparece nas URLs e nos corpos?

O identificador interno (`id`) é o que vai em `/tickets/{id}`. Um número sequencial deixa adivinhar identificadores vizinhos: a regra de 404 (NFR4) já impede ler o que não é seu, mas não impede estimar quantos chamados existem. O identificador visível do chamado (`reference`) é outra coisa e fica para o Desenho Funcional de U2.

- A. UUID em todas as entidades.
- B. Inteiro sequencial em todas as entidades.
- C. UUID nas entidades com dono (chamado, mensagem, notificação, avaliação) e inteiro sequencial nos catálogos e nos usuários.
- X. Other (please specify)

[Answer]: A. UUID em todas as entidades.

---

## Q9. Frontend e backend na mesma origem, ou em origens diferentes?

O cookie de sessão e a política de origem do navegador dependem disso, e é aqui que se decide a proteção contra requisição forjada a partir de outro site (CSRF), que um cookie de sessão sempre exige. Tudo roda localmente via Compose.

- A. Mesma origem: o contêiner do frontend serve o SPA e repassa `/api` para o backend (em desenvolvimento, o servidor do Vite faz o mesmo repasse). Sem CORS; cookie `SameSite=Strict`; o backend não aceita requisição de outra origem.
- B. Origens diferentes (portas distintas): CORS restrito à origem do frontend, com credenciais; cookie `SameSite=Lax`; um cabeçalho customizado obrigatório nas requisições que alteram estado, como defesa extra contra CSRF.
- C. Origens diferentes, com CORS restrito, cookie `SameSite=Lax` e um token anti-CSRF emitido pelo backend e reenviado pelo frontend a cada requisição que altera estado.
- X. Other (please specify)

[Answer]: A. Mesma origem: o contêiner do frontend serve o SPA e repassa `/api` para o backend (em desenvolvimento, o servidor do Vite faz o mesmo repasse). Sem CORS; cookie `SameSite=Strict`; o backend não aceita requisição de outra origem.

---

## Consolidated Summary Confirmation

Resumo consolidado das respostas:

- Estilo da API HTTP: REST com JSON, recursos no plural em inglês, ações que não são criar/ler/alterar/apagar como sub-recursos, especificado em OpenAPI (Q1).
- Fonte da verdade: OpenAPI gerado do código do backend, com tipos gerados para o frontend e o CI falhando se o arquivo gerado mudar sem commit; os blocos desta etapa são o desenho inicial (Q2).
- Contrato entre unidades: cada bloco exporta um único serviço público pelo módulo NestJS, com tipos próprios do contrato e nunca modelos do Prisma (Q3).
- Versionamento: prefixo `/api/v1` desde já, sem versões paralelas mantidas (Q4).
- Códigos de erro: SCREAMING_SNAKE em inglês com prefixo por domínio, cada unidade dona dos seus prefixos, mais códigos genéricos compartilhados sem prefixo (Q5).
- Falha: no frontend, consultas repetem no máximo uma vez e só em falha de rede ou 5xx, mutações nunca repetem, tempo limite de 15 segundos; entre unidades, sem tempo limite nem nova tentativa, com a exceção propagada até o filtro global, salvo tradução para 404 (Q6).
- Respostas de sucesso: recurso direto no corpo; listas como `{ items, total, page, pageSize }`; 201 na criação e 204 em ação sem retorno; datas ISO 8601 UTC; camelCase (Q7).
- Identificadores: UUID em todas as entidades; o identificador visível do chamado continua separado e fica para o Desenho Funcional de U2 (Q8).
- Origem: mesma origem, com o contêiner do frontend repassando `/api` ao backend; sem CORS; cookie `SameSite=Strict` (Q9).

Já fixado antes das perguntas, e incorporado sem pergunta: chamada direta e síncrona entre unidades, sem eventos; chave estrangeira só no sentido do grafo; envelope único de erro; 404 para recurso inacessível; JWT em cookie `httpOnly` sem refresh token; paginação por número de página; nenhum consumidor externo.

O artefato terá um contrato HTTP por unidade (cinco blocos OpenAPI sob o mesmo prefixo), um contrato de serviço por aresta do grafo (oito, como interface TypeScript), um contrato de dados compartilhados (as chaves estrangeiras entre unidades) e o contrato transversal de erros e respostas.

- Looks correct
- Request changes

[Answer]: Looks correct
