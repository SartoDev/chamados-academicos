<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->
- 2026-09-08T10:20:00Z - A entrevista foi reduzida a 8 perguntas (mais uma de acompanhamento) a partir de mais de 20 decisoes levantadas pelas tres revisoes. O criterio: perguntei o que muda o que sera construido e o que o humano tem autoridade unica para decidir; integrei como recomendacao tecnica o que tinha uma resposta tecnicamente correta (Jest vs Vitest no backend, glossario de identificadores, camadas NestJS, envelope de erro).

## Deviations
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->
- 2026-09-08T10:20:00Z - O piso de 80% de cobertura de linha do padrao org foi substituido, e nao apenas complementado, por cobertura por requisito mais limiares por caminho. O engenheiro de qualidade argumentou que o numero global infla com componentes do Shadcn e codigo de andaime; o humano concordou na Q5.
- 2026-09-08T10:20:00Z - A secao ## Deployment do padrao org (deploy-on-merge para staging com gate manual de producao) foi integralmente substituida: nao existe staging nem producao neste projeto. Escrita como 'merge na main = pronto para rodar localmente via Docker Compose'.

## Tradeoffs
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->
- 2026-09-08T10:20:00Z - O humano escolheu test-after uniforme (Q4) contra a recomendacao do engenheiro de qualidade de test-first para a maquina de transicoes de status e a matriz de permissoes. Aceito e registrado como historico em evidence.md; o risco e retrabalho justamente nas duas areas mais criticas.
- 2026-09-08T10:20:00Z - Sem protecao de branch na main (Q2), o portao real e um hook local de pre-push (Q9). Isso foi escrito honestamente nas praticas em vez de descrever o CI como bloqueante: o CI relata, o hook bloqueia na maquina, e nada no servidor impede um merge com pipeline vermelho.
- 2026-09-08T10:20:00Z - Sessao sem refresh e sem invalidacao no servidor (Q7): mais simples de implementar, ao custo de um token roubado permanecer valido ate expirar. Consequencia registrada explicitamente nas praticas.

## Open questions
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->
- 2026-09-08T10:20:00Z - Com as etapas de NFR cortadas, a matriz de autorizacao perfil x recurso x operacao ficou orfa e foi atribuida ao Functional Design como regra de negocio. Confirmar la que ela realmente sera especificada por completo antes da geracao de codigo - e o risco de maior impacto registrado no documento de escopo.
