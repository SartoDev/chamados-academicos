<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->
- 2026-09-09T10:00:00Z - A maquina de transicoes de status entrou como dependencia externa do tipo `other`, e nao como bloco. Um bloco sem estado, sem entidade e sem ciclo de vida e uma biblioteca; registrar como bloco inflaria o catalogo sem separar nada.
- 2026-09-09T10:00:00Z - Acrescentei uma chave estavel em ingles a Status e Priority, que nenhuma resposta pediu. Sem ela, a pratica afirmada (maquina de transicoes em modulo puro sem Prisma) e a decisao de escopo (status administravel) sao incompativeis: um modulo que nao le o banco nao pode comparar rotulos editaveis.

## Deviations
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->
- 2026-09-09T10:00:00Z - O grafo tem dois ciclos deliberados (Auth-Users e Auth-Users-Catalog-Auth), contra a regra de grafo aciclico da etapa. A regra permite ciclo declarado; declarei os dois em ADR-004 e no diagrama, e verifiquei que sao ciclos de chamada e nao de dados.

## Tradeoffs
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->
- 2026-09-09T10:00:00Z - Reporting le atraves de Tickets em vez de ir direto ao banco (ADR-005). Custo: consulta agregada atravessa camada de servico feita para operacao unitaria. Beneficio: a regra de visibilidade, que e nao trivial e vaza dado entre setores se duplicada, fica num lugar so. Aceito porque o projeto roda apenas local e nao tem meta de desempenho.
- 2026-09-09T10:00:00Z - Tickets absorveu o atendimento (ADR-001) e ficou o maior bloco do sistema, com tres entidades. A alternativa protegia o tamanho ao custo de duas escritas na mesma entidade. Escolhi o dono unico; se o atendimento ganhar escalonamento ou distribuicao automatica, este bloco e o primeiro a dividir.

## Open questions
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->
- 2026-09-09T10:00:00Z - ADR-006 deixa em aberto se o administrador pode criar status alem dos quatro iniciais. A maquina de transicoes so conhece chaves conhecidas, entao um status criado nao teria transicao definida. Precisa ser fechado no Desenho Funcional.
- 2026-09-09T10:00:00Z - O formato do campo `reference` (identificador visivel do chamado) segue sem definicao desde as historias. Sequencial global, por ano, ou outro - decidir antes da geracao de codigo.
- 2026-09-09T10:00:00Z - US5.3 e US5.4 ficaram Deferred na rastreabilidade por nao se realizarem em nenhum bloco de backend, e o catalogo cobre so o backend (ADR-007). Isso significa que acessibilidade e responsividade nao tem alvo de rastreabilidade em nenhuma etapa deste plano, ja que Refined Mockups foi cortada. Vale confirmar em Delivery Planning se isso e aceitavel.
