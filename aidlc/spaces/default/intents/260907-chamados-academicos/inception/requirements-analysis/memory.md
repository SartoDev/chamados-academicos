<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->
- 2026-09-08T10:40:00Z - As etapas de NFR estao fora do plano, entao escrevi apenas os NFR que decorrem diretamente de decisoes ja afirmadas (autorizacao, envelope de erro, sessao, segredos, acessibilidade, Docker). Registrei explicitamente no artefato que isso nao e uma analise nao funcional completa, para nao criar falsa impressao de cobertura.
- 2026-09-08T10:40:00Z - Acrescentei uma secao 'Consequencias para Artefatos Anteriores' listando as tres telas dos wireframes que as respostas desta etapa invalidam. Sem isso, o desenho funcional replicaria o campo de setor editavel e o link de recuperacao de senha que deixaram de existir.

## Deviations
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->

## Tradeoffs
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->
- 2026-09-08T10:40:00Z - FR9.1 (gestao de usuarios por interface) esta sob a Area Administrativa, que e Should have, mas sustenta FR2, que e Must. Marquei no proprio requisito que ele e entregue mesmo se o resto de FR9 for cortado, em vez de mover FR9.1 para outro grupo - manter o agrupamento por tela facilita o desenho, e a ressalva resolve o risco.

## Open questions
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->
- 2026-09-08T10:40:00Z - A suposicao A3 (atendente pertence a exatamente um setor) nao foi confirmada por nenhuma resposta. Ela sustenta FR5.1 e FR5.3; se um atendente puder atuar em varios setores, a fila e a atribuicao mudam. Confirmar em Functional Design.
- 2026-09-08T10:40:00Z - FR8.1 lista as transicoes validas, mas nao ha transicao de Aguardando solicitante direto para Encerrado. Se um chamado ficar parado aguardando o solicitante indefinidamente, so sai por Em analise. Verificar em Functional Design se isso e intencional.
