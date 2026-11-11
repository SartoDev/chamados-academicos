# Verificação de Fronteira de Fase — Inception → Construction

**Veredito:** PASS

**Data:** 2026-09-12

**Resumo:** as três etapas da Inception que produzem rastreabilidade passam no sensor, sem lacuna, órfão, alvo inválido nem ID a montante ausente. A primeira execução desta verificação deu FAIL por um achado formal nas Histórias de Usuário; o autor escolheu corrigi-lo no próprio arquivo de rastreabilidade, sem alterar histórias, e a verificação foi reexecutada. O histórico do achado está na seção "Achado Corrigido" abaixo.

Fontes consolidadas: `inception/user-stories/traceability.json`, `inception/domain-design/traceability.json` e `inception/units-generation/traceability.json`. O Desenho de Contratos não produz `traceability.json` e não entra nesta verificação.

## Resultado por Etapa

| Etapa | Sensor de rastreabilidade | Lacunas | Órfãos | Alvos inválidos | IDs a montante ausentes | Situação |
|-------|---------------------------|---------|--------|-----------------|--------------------------|----------|
| Histórias de Usuário | passa | 0 | 0 | 0 | 0 | OK, depois da correção |
| Desenho de Domínio | passa | 0 | 0 | 0 | 0 | OK |
| Geração de Unidades | passa | 0 | 0 | 0 | 0 | OK |

## Histórias de Usuário — Detalhe

- **A montante:** grupos FR1 a FR12, os 58 sub-requisitos de `requirements.md` e NFR1 a NFR9.
- **Grupos e sub-requisitos:** todos com alvo `OK` em ao menos uma história.
- **NFR:** NFR2, NFR4, NFR5 e NFR6 com alvo `OK` (US5.1 a US5.4); NFR1, NFR3, NFR7, NFR8 e NFR9 como `N/A`, com destino explícito em critérios transversais (tabela abaixo).
- **FR4.9:** `N/A`, porque não é requisito (ver "Achado Corrigido").

## Achado Corrigido

**Primeira execução (FAIL).** O `traceability.json` das histórias declarava em `upstream_ids` e `coverage` apenas os grupos de requisito. O sensor extrai de `requirements.md` todo identificador no formato `FR{n}.{m}` e cobrou 59 IDs ausentes:

| IDs cobrados | Quantidade | Situação real |
|--------------|-----------|---------------|
| FR1.1–FR1.5, FR2.1–FR2.7, FR3.1–FR3.7, FR4.1–FR4.8, FR5.1–FR5.7, FR6.1–FR6.5, FR7.1–FR7.5, FR8.1–FR8.5, FR9.1–FR9.3, FR10.1–FR10.3, FR11.1, FR12.1–FR12.2 | 58 | Já mapeados a histórias no bloco `reverse` do mesmo arquivo e citados nas linhas "Cobre" de `stories.md`. Verificado por script: nenhum sub-requisito ficava sem história. |
| FR4.9 | 1 | Não é requisito: aparece só como exemplo de identificador no texto da revisão de `requirements.md` (achado R-01 daquela revisão). A capacidade sugerida — atendente ou gestor alterar a prioridade — está coberta por AC2.3.3. |

**Decisão do autor.** Entre corrigir só o arquivo, voltar formalmente à etapa de histórias, ou seguir com o achado aberto, o autor escolheu corrigir só o arquivo.

**Correção aplicada.** Foram acrescentados ao `traceability.json` das histórias os 58 sub-requisitos, cada um com as histórias que o bloco `reverse` já apontava, e `FR4.9` como `N/A` com a explicação acima. Nenhuma entrada existente mudou, e nenhuma história, critério ou outro artefato foi alterado.

**Segunda execução.** O sensor passa nas três etapas.

## Desenho de Domínio — Detalhe

- 20 histórias a montante: 18 com alvo `OK` num bloco do catálogo e 2 `Deferred` (US5.3 e US5.4, acessibilidade e uso pelo celular), porque o catálogo cobre só o backend (ADR-007).
- As duas `Deferred` foram resolvidas na Geração de Unidades: com as fatias verticais, as duas têm U1 como unidade principal e U2 a U5 como unidades adicionais.

## Geração de Unidades — Detalhe

- 20 histórias a montante, 20 com alvo `OK` numa unidade, e cada alvo presente na linha da história em `unit-of-work-story-map.md`.
- Grafo de unidades bem formado e sem ciclo (sensor de seções obrigatórias).

## Requisitos Não Funcionais sem História

Registrados como `N/A` nas histórias, com destino explícito — não são lacunas:

| NFR | Destino |
|-----|---------|
| NFR1 | Critério transversal CT1, verificado por revisão de código e pelos testes de acesso a registro alheio |
| NFR3 | Critério transversal CT2 e convenções X-01 de `contract-summary.md` |
| NFR7 | Critério transversal CT3, Definição de Pronto do Bolt 1 |
| NFR8 | Critério transversal CT4, Definição de Pronto do Bolt 1 |
| NFR9 | Critério transversal CT5, Definição de Pronto do Bolt 1 |

## Pendências Herdadas que Não Bloqueiam a Transição

Não são achados de rastreabilidade; estão atribuídas ao Desenho Funcional de cada unidade em `unit-of-work.md`, `contract-summary.md` e `bolt-plan.md`:

- Transição Aguardando solicitante → Encerrado ausente da lista de FR8.1 (achado R-11 das histórias), coberta pela Definição de Pronto do Bolt 2.
- Mecanismo de transação entre serviços de U2 e U3 (achado R-01 da revisão dos contratos), no Desenho Funcional de U2.
- Regra de `project.md` que ainda classifica a área administrativa como Should have, contra a decisão de US4.1.
