# Declaração de Intenção — Sistema de Chamados Acadêmicos

## Problem Statement

As solicitações acadêmicas hoje chegam por canais dispersos — e-mail, WhatsApp, atendimento presencial — ou sem processo definido, e acabam se perdendo sem rastreabilidade. [Q1]

Sem rastreabilidade, não há registro confiável do andamento de cada solicitação. [Q1]

O sistema a ser construído centraliza essas solicitações em um fluxo único de chamados acadêmicos, com registro, acompanhamento e gerenciamento. [desc]

## Target Customer

O produto é otimizado para dois perfis com peso equivalente, porque o valor central está na comunicação entre eles: [Q2]

| Perfil | Dor atual | Fonte |
|--------|-----------|-------|
| Aluno (solicitante) | Não sabe o andamento da própria solicitação e precisa reabrir o pedido várias vezes por canais informais. | [Q1] [Q2] |
| Atendente (setor responsável) | Fila desorganizada, retrabalho e falta de histórico do que já foi respondido. | [Q1] [Q2] |

O sistema contempla ainda três perfis de acesso previstos na descrição da iniciativa, com os seguintes interesses: [desc] [Q14]

| Perfil | Interesse | Fonte |
|--------|-----------|-------|
| Professor | Abre e acompanha chamados como solicitante, do mesmo modo que o Aluno. | [Q14] |
| Gestor | Acompanha indicadores e redistribui chamados entre setores. | [Q14] |
| Administrador | Configura o sistema: usuários, perfis, setores, categorias, status e prioridades. | [Q14] |

Esses três perfis não são o alvo de otimização desta fase. [Q2]

## Success Metrics

O critério de sucesso desta iniciativa é a entrega dos artefatos e do sistema previstos para o Trabalho de Conclusão de Curso: um sistema funcional, documentado e demonstrável, cobrindo os itens da seção 10 do documento de escopo. [Q3]

| Métrica | O que mede | Fonte |
|---------|------------|-------|
| Cobertura de entregáveis | Percentual dos entregáveis previstos na seção 10 do documento de escopo que foram efetivamente produzidos. | [Q3] |
| Cobertura de requisitos implementados | Percentual dos requisitos aprovados que possuem implementação e verificação correspondentes. | [Q3] |

Dashboards e indicadores fazem parte do escopo do sistema a ser construído. [desc] Eles não foram adotados como critério de sucesso do projeto. [Q3] Não terão metas numéricas: são calculados e exibidos, sem limiar de aceite. [Q10] Quais indicadores exatamente serão exibidos é matéria da análise de requisitos, não desta etapa. [Q3]

## Initiative Trigger

A iniciativa é um Trabalho de Conclusão de Curso (TCC), com prazo acadêmico e banca avaliadora a atender. [Q4]

Isso significa que o projeto tem um momento formal de avaliação. [Q4] A documentação faz parte do critério de sucesso, junto com o sistema funcional e demonstrável. [Q3]

O prazo acadêmico existe, mas não restringe o planejamento nesta etapa; o marco relevante para o planejamento é a entrega do sistema, não a data da banca. [Q12] [Q16]

## Initial Scope Signal

**Escopo do fluxo de trabalho (workflow-selected):** `feature` — ciclo completo, da ideação à operação. [scope]

**Fronteira do produto (confirmada pelo usuário):** Frontend + Backend + banco de dados + autenticação + CI/CD. [Q8]

Dentro da fronteira, conforme a descrição da iniciativa: [desc]

- Aplicação web dividida em Frontend (React, TypeScript, Vite, Shadcn) e Backend (NestJS, TypeScript, Prisma, Postgres).
- Autenticação por JWT e cookie, com os perfis de acesso Aluno, Professor, Atendente, Gestor e Administrador.
- Gestão de chamados, categorias e setores, fila de atendimento, notificações, dashboards e indicadores, e área administrativa.
- Docker e CI/CD.

**Ambiente de execução alvo:** apenas execução local via Docker / Docker Compose, sem implantação em servidor externo. [Q13]

**Alcance do CI/CD:** apenas integração contínua — build, lint e testes automatizados a cada push ou pull request. Sem publicação de imagens e sem implantação. [Q18]

**Operação:** o sistema não será operado por uma instituição de ensino real. Não há, portanto, exigência regulatória decorrente de operação institucional. [Q17]

As respostas sobre ambiente e pipeline reduzem o que as etapas de operação deste fluxo poderão entregar; o item correspondente está registrado em `## Assumptions & Open Questions`. [Q13] [Q18]

Fora do escopo inicial: aplicativo mobile nativo, automação avançada baseada em IA e integrações não especificadas. [Q8]

A autenticação em provedor de nuvem AWS foi explicitamente excluída desta iniciativa. [desc]

## Assumptions & Open Questions

- [assumption] O escopo de fluxo de trabalho confirmado é `feature`, que executa o ciclo completo até a fase de operação [Q8] [scope], mas o ambiente alvo é apenas local via Docker [Q13] e o pipeline se limita à integração contínua, sem implantação [Q18]. Com isso, as etapas de operação (pipeline de implantação, provisionamento de ambientes, execução de implantação, observabilidade, resposta a incidentes e validação de desempenho) terão pouco conteúdo executável para produzir. Falta decidir se essas etapas permanecem no plano em versão reduzida ou se o fluxo deve ser enxugado. A decisão é do autor do projeto [Q6] e pode ser tomada até o planejamento de entrega.
- [assumption] O estilo da API do backend (REST, GraphQL ou outro) não foi confirmado por nenhuma resposta registrada; será decidido no desenho de contratos.

## Review

**Verdict:** READY
**Reviewer:** aidlc-product-lead-agent
**Date:** 2026-09-08T00:45:24Z
**Iteration:** 1
**Request Challenge:** review:181f4bd365237128a00975079ac0bed5

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Critical | intent-statement.md > Success Metrics | A itemização das seis métricas específicas foi removida; o parágrafo agora fala apenas em "Dashboards e indicadores fazem parte do escopo... [desc]" e defere a lista de indicadores para a análise de requisitos, sob `[Q3]`. Confere com a descrição inicial e com a resposta de Q3. | — | Resolved |
| R-02 | Major | intent-statement.md > Initial Scope Signal | "com API REST" foi removido da frase sobre Frontend/Backend; o estilo de API agora é um item explícito em `[assumption]` ("será decidido no desenho de contratos"). Confere com a descrição inicial, que não menciona estilo de API. | — | Resolved |
| R-03 | Major | intent-statement.md > Initial Scope Signal + Assumptions & Open Questions | Foi adicionada a frase "As respostas sobre ambiente e pipeline reduzem o que as etapas de operação deste fluxo poderão entregar... [Q13] [Q18]" e um item de `[assumption]` detalhado explicando a tensão entre o escopo `feature` (ciclo completo) e as respostas Q13/Q18 (ambiente local, CI apenas), registrando que a decisão cabe ao autor do projeto. A tensão identificada na iteração anterior está agora explicitamente sinalizada. | Nenhuma ação adicional necessária para aprovação; observação: a cláusula "que executa o ciclo completo até a fase de operação" nesse item de suposição está citada com `[Q8] [scope]`, mas esse detalhe (32 etapas, ideação a operação) aparece apenas no texto de enquadramento da pergunta Q8, não na resposta confirmada do usuário nem na declaração literal de `[scope]` (que só prova o nome do escopo selecionado). Ver R-07 abaixo. | Resolved |
| R-04 | Minor | intent-statement.md > Problem Statement | A elaboração das "três perguntas" foi substituída por uma frase mais próxima do texto de Q1 ("Sem rastreabilidade, não há registro confiável do andamento de cada solicitação."). Já não há especificidade inventada. | — | Resolved |
| R-05 | Minor | intent-statement.md > Initiative Trigger | A frase sobre equivalência de peso entre documentação e software foi substituída por "A documentação faz parte do critério de sucesso, junto com o sistema funcional e demonstrável. [Q3]", que reflete razoavelmente o texto de Q3 ("sistema funcional, documentado e demonstrável"). | — | Resolved |
| R-06 | Minor | intent-statement.md > Success Metrics, frase "Não terão metas numéricas: são calculados e exibidos, sem limiar de aceite. [Q10]" | A resposta confirmada de Q10 foi a opção D ("Not applicable — os indicadores não precisam de meta para o objetivo deste projeto"), mas a frase do artefato reproduz quase literalmente o texto da opção A, não escolhida ("indicadores são calculados e exibidos, sem limiar acordado"). O sentido geral (sem metas numéricas) está correto, mas o detalhe "calculados e exibidos, sem limiar de aceite" não está no texto da opção efetivamente confirmada. | Ajustar a frase para refletir o texto da opção D realmente confirmada, ou remover o detalhe "calculados e exibidos" que não consta da resposta escolhida. | New |
| R-07 | Minor | intent-statement.md > Assumptions & Open Questions, item 1, trecho "que executa o ciclo completo até a fase de operação [Q8] [scope]" | Essa caracterização do escopo `feature` (32 etapas, ideação a operação) vem do texto de enquadramento da pergunta Q8, não da resposta confirmada pelo usuário nem da declaração literal de `[scope]` em `## Sources` (que registra apenas o nome do escopo, "feature"). A diretriz da etapa é explícita: `[scope]` prova somente o escopo selecionado, nunca um detalhe adicional sobre o que esse escopo executa. | Retirar o detalhe do que o ciclo completo executa desta citação, ou trocar a fonte por `[desc]`/observação editorial sem tag de fonte confirmada, mantendo apenas "feature" como fato sob `[scope]`. | New |

### Summary

As cinco pendências da rodada anterior foram corrigidas de forma consistente com as respostas confirmadas: a itemização de métricas não registrada foi removida, o detalhe de API REST não confirmado virou suposição explícita, a tensão escopo `feature` vs. ambiente local/CI apenas foi sinalizada tanto no corpo do texto quanto nas suposições, e as duas elaborações não sourced foram suavizadas para refletir o texto real das respostas. Restam apenas duas observações novas de severidade menor (citação de detalhe não confirmado sob `[Q10]` e uso de `[scope]`/`[Q8]` além do que essas fontes realmente provam) — nenhuma delas crítica ou bloqueante; ambas ficam registradas para ajuste fino, mas não impedem o avanço.
