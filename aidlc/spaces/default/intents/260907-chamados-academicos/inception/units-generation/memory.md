<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->
- 2026-09-12T21:40:35Z - Os nomes das unidades ficaram em ingles (u1-foundation a u5-rating), com nome exibido em portugues na tabela. O nome no bloco YAML vira o diretorio de construcao e alimenta nomes de ramo, entao foi tratado como identificador e seguiu o glossario de codigo.
- 2026-09-12T21:40:35Z - Uma historia aparece em mais de uma unidade quando algum criterio de aceitacao dela so se realiza na outra. O sensor de rastreabilidade associa a historia a toda unidade citada na linha; com uma unidade so por historia, criterios como AC2.2.3 ficariam sem dono entre U2 e U3.
- 2026-09-12T21:40:35Z - As cinco unidades receberam o tipo service, embora todas levem telas. Com fatias verticais nenhuma unidade e ui pura, e o tipo descreve a parte executavel no backend.

## Deviations
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->
- 2026-09-12T21:40:35Z - A etapa pede perguntar sobre modelo de implantacao; nao perguntei. As restricoes C2 e C3 (repositorio unico, apenas local via Compose) ja fixam tudo embutido em apps/api e apps/web, e perguntar seria ruido. Registrado como premissa fixada no arquivo de perguntas.
- 2026-09-12T21:40:35Z - A estrutura do projeto nao virou unidade packaging propria. A pratica afirmada em team.md diz que a primeira unidade ja atravessa a pilha; uma unidade so de estrutura seria a cerimonia de esqueleto que o time recusou.

## Tradeoffs
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->
- 2026-09-12T21:40:35Z - Notifications ficou dentro de U2, deixando a unidade XL. A alternativa era uma unidade de notificacoes antes dos chamados, sem chave estrangeira para o chamado. Escolhida a integridade no banco e o grafo sem ciclo; o tamanho de U2 fica como risco para o Planejamento de Entrega.
- 2026-09-12T21:40:35Z - Com a Q5-A, listagens resolvem nomes de categoria e usuario pelo servico de U1 em vez de juntar tabelas. Custa mais chamadas por listagem; aceito para manter ADR-004 intacto, ja que o sistema roda so localmente e sem meta de desempenho.

## Open questions
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->
- 2026-09-12T21:40:35Z - U2 e XL e uma Bolt nao divide uma unidade. Se o Planejamento de Entrega julgar U2 grande demais para 10 a 20 horas semanais, dividir exige voltar a esta etapa, nao apenas reordenar.
- 2026-09-12T21:40:35Z - U5 estende blocos entregues por U2 e U4 em vez de trazer bloco proprio. Confirmar no Desenho Funcional de U5 que o dado de avaliacao pertence a Tickets.
- 2026-09-12T21:40:35Z - O mecanismo de criacao do primeiro administrador (variavel de ambiente, script de carga) nao foi decidido; e pre-requisito da ordem interna de U1.
