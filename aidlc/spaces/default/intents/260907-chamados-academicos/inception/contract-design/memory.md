<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->
- 2026-09-12T23:30:51Z - A fronteira HTTP foi tratada como a linha de consumidor fora da unidade, com apps/web no navegador como consumidor, embora o frontend seja do proprio sistema. Nao ha consumidor externo real; sem essa leitura a etapa nao teria onde fixar a API REST.
- 2026-09-12T23:30:51Z - x-roles em cada operacao traz so os perfis que as historias ja fixaram (ex.: reabrir so solicitante, atribuir so gestor). A matriz completa segue no Desenho Funcional; marcar mais seria decidir autorizacao nesta etapa.
- 2026-09-12T23:30:51Z - A convencao 400/409/422 nao foi perguntada. Derivei para cada codigo do catalogo ter um status unico, e mantive 403 onde as historias pedem 403 (AC2.4.6, AC2.1.4).

## Deviations
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->
- 2026-09-12T23:30:51Z - Os arquivos de conhecimento do agente de plataforma sao todos de AWS (CDK, custo, Well-Architected) e nao foram aplicados: project.md proibe AWS. A visao de plataforma entrou so na topologia local de mesma origem com o Compose.
- 2026-09-12T23:30:51Z - Um bloco de especificacao por servico publico provedor, e nao um por aresta. As oito arestas reutilizam tres interfaces; repetir a mesma interface oito vezes criaria copias que divergem. Cada aresta ganhou uma linha dizendo quais metodos usa.

## Tradeoffs
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->
- 2026-09-12T23:30:51Z - Mensagens ficam em /tickets/{ticketId}/messages, sob o caminho do chamado, mas pertencem a U3. O caminho aninhado casa com o 404 por recurso; o custo e o dono da rota nao ser obvio pelo prefixo, registrado no texto da API-U3.
- 2026-09-12T23:30:51Z - A regra de atomicidade entre servicos foi fixada como contrato, mas o mecanismo ficou para o Desenho Funcional de U2. Fixar o mecanismo aqui exigiria escolher biblioteca de transacao propagada antes de existir codigo.

## Open questions
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->
- 2026-09-12T23:30:51Z - Nenhum requisito limita tentativas de login; ficou como questao aberta bloqueando U1, porque a unica mitigacao hoje e o hash lento.
- 2026-09-12T23:30:51Z - O Administrador le mensagens? FR6.5 nao o inclui; bloqueia U3.
