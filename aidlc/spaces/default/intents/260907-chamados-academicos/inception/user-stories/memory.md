<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->
- 2026-09-08T11:10:00Z - As tres revisoes levantaram cerca de vinte pontos, e cerca de vinte e um deles vinham marcados como 'decisao do humano'. Triei: levei ao usuario apenas as tres que eram julgamento legitimo dos dois lados (beco sem saida da transferencia, interface administrativa no corte minimo, encerramento pelo solicitante) e integrei o resto como redator. Subir vinte perguntas teria transferido meu trabalho para ele.
- 2026-09-08T11:10:00Z - Converti os criterios meta ('existe um teste automatizado afirmando isso') em criterios comportamentais. Um criterio de aceitacao descreve o sistema, nao o processo de verificacao; a exigencia de teste ja vive na postura de testes afirmada.

## Deviations
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->
- 2026-09-08T11:10:00Z - Nao dividi US1.3 nem US4.1/US4.2 como o desenvolvedor propos. A Q3 fixou granularidade media por decisao do usuario, e dividir agora contrariaria essa escolha. Registrei o dimensionamento dele nas consequencias de modelo em vez de reescrever o agrupamento.
- 2026-09-08T11:10:00Z - A tabela INVEST do rascunho afirmava que todo criterio era verificavel. Era falso para oito deles. Corrigi a afirmacao e escrevi a casa de verificacao ao lado de cada excecao, em vez de remover os criterios.

## Tradeoffs
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->
- 2026-09-08T11:10:00Z - A Q9 (toda a interface administrativa no corte minimo) contradiz uma regra que o proprio usuario afirmou em Practices Discovery. Em vez de aceitar em silencio ou recusar, levantei a contradicao numa pergunta de acompanhamento e ele escolheu corrigir a regra. Custo: uma pergunta extra. Beneficio: nenhuma contradicao permanente no contexto das etapas seguintes.
- 2026-09-08T11:10:00Z - AC2.1.3 concede ao setor de origem leitura das mensagens apos transferencia, resolvendo no sentido permissivo a ambiguidade R-05. A alternativa restritiva protegeria mais a privacidade do solicitante; escolhi o permissivo porque o setor de origem ja viu essas mensagens enquanto atendia.

## Open questions
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->
- 2026-09-08T11:10:00Z - O autor da transicao automatica de AC2.3.2 (chamado volta de Aguardando solicitante para Em analise quando o solicitante responde) nao esta definido: o historico registra o solicitante ou o sistema? Confirmar em Functional Design.
- 2026-09-08T11:10:00Z - Nenhum limite ao numero de reaberturas por chamado. Cada reabertura reinicia a janela de 72 horas, entao em tese um chamado pode ser reaberto indefinidamente. Confirmar se isso e aceitavel.
- 2026-09-08T11:10:00Z - A busca textual desenhada na barra superior dos wireframes nao tem requisito nem historia. Ou ela sai do desenho, ou ganha requisito.
