<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->
- 2026-09-08T01:45:00Z - A Q2 descartou uma tela inicial unica, mas a barra lateral escolhida na Q1 pede um item de entrada. Resolvi manter 'Inicio' apontando para a tela de entrada do perfil, e registrei como suposicao que ele pode ser redundante.

## Deviations
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->
- 2026-09-08T01:45:00Z - O guia de wireframing pede as cinco fases de estado por tela (vazio, carregando, sucesso, erro, parcial). Desenhei os estados relevantes por tela em vez dos cinco em todas: telas sem paginacao nao tem estado parcial, e a tela de login nao tem estado vazio no sentido do guia. Registrar o que nao se aplica seria ruido.

## Tradeoffs
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->
- 2026-09-08T01:45:00Z - Meta de acessibilidade ficou em WCAG 2.1 A (Q6), nao AA. A persona de design trata AA como linha de base; aceitei A porque o usuario decidiu e o sistema nao sera operado por instituicao real. Consequencia: contraste e alternativas textuais entram como boa pratica, mas so teclado, rotulos e contraste minimo viram criterio verificavel.
- 2026-09-08T01:45:00Z - Abas no detalhe do chamado (Q4-C) em vez de linha do tempo unica: separa conversa de historico, o que reduz ruido na tela mais usada, mas exige que o usuario troque de aba para correlacionar uma mensagem com a mudanca de status que a acompanhou.

## Open questions
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->
- 2026-09-08T01:45:00Z - A regra entre categoria e setor (a categoria fixa o setor ou apenas sugere?) sustenta a tela de abertura e a fila. Precisa ser fechada na analise de requisitos antes do modelo de dados.
- 2026-09-08T01:45:00Z - Recuperacao de senha aparece como link no login mas nao foi desenhada nem confirmada como parte do corte minimo.
