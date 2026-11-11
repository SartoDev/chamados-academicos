# Verificação de Fronteira de Fase — Construction → Operation

Executada na etapa de pipeline de CI, em 2026-10-05. Fontes lidas: `../construction/build-and-test/cross-unit-traceability.md` e `test-results.md`, os cinco `../construction/u*/code-generation/traceability.json`, as tabelas de achados das revisões de desenho funcional e de geração de código das cinco unidades, e `../construction/ci-pipeline/{ci-config,quality-gates}.md`.

## Veredito

**PASS.** As quatro condições da fronteira foram verificadas uma a uma, com evidência, e nenhuma ficou pendente.

| Condição | Resultado |
|----------|-----------|
| Todas as unidades construídas e testadas | Confirmado |
| Nenhum achado não resolvido nas tabelas de geração de código | Confirmado |
| Gate de cobertura FR/NFR/AC entre unidades aprovado | Confirmado |
| Portões de qualidade do CI aplicam os comandos de build e teste registrados | Confirmado |

## Condição 1 — Unidades construídas e testadas

As cinco unidades têm `code-generation` concluída, com revisão `READY` e aprovação humana registrada. A execução da etapa de Build and Test, com 28 passos, cobriu o projeto inteiro e um comando restrito por unidade e por camada.

| Unidade | Artefatos de geração de código | Testes executados nesta rodada |
|---------|-------------------------------|-------------------------------|
| U1 Fundação | Plano, instruções, resumo, manifesto, rastreabilidade | Unitários, integração e web, aprovados (após a correção de comando registrada em `test-results.md`) |
| U2 Chamados | idem | Unitários, integração e web, aprovados |
| U3 Conversa | idem | Unitários, integração e web, aprovados |
| U4 Indicadores | idem | Unitários, integração e web, aprovados |
| U5 Avaliação | idem | Unitários, integração e web, aprovados |

Números do portão combinado, medidos por saída estruturada: **Jest 58 suítes e 766 testes, 766 aprovados, 0 falhas, 0 pendentes, 0 ignorados; Vitest 340 testes, 340 aprovados, 0 falhas.** Cobertura de 96,71% de linhas na API e 96,33% no web, com os cinco limiares por caminho atingidos.

## Condição 2 — Achados não resolvidos

**Nenhum achado permanece `New` ou `Unresolved`** em qualquer uma das duas etapas revisadas. Verificado unidade por unidade com `aidlc-review-brief.ts context`, que sobrepõe às tabelas as disposições duráveis registradas no livro de auditoria.

| Etapa | U1 | U2 | U3 | U4 | U5 | Total |
|-------|----|----|----|----|----|-------|
| Geração de código | 4 aceitos | 2 aceitos | 1 aceito | 2 aceitos | 4 aceitos | **13 aceitos** |
| Desenho funcional | 4 resolvidos, 6 aceitos | 3 resolvidos, 4 aceitos | 9 resolvidos, 5 aceitos | 7 resolvidos, 5 aceitos | 7 resolvidos, 5 aceitos | **30 resolvidos, 25 aceitos** |

A distinção importa e não deve ser lida como se tudo tivesse sido consertado:

- **Resolvido** significa que o reparo foi aplicado e um revisor o verificou contra o código.
- **Risco aceito** significa que o achado **continua valendo** e foi apresentado ao autor no portão da etapa, que aprovou com ele registrado. A aceitação é disposição humana, gravada no livro de auditoria no momento da aprovação, não uma marcação do agente.

Os cinco achados de maior severidade entre os aceitos, para que a fronteira não os esconda:

| Achado | Unidade | O que permanece |
|--------|---------|-----------------|
| Código R-03 | U1 | O manifesto de fontes descreve um conjunto de arquivos que não é o do repositório: 14 caminhos reescritos por Bolts posteriores e um que não existe mais |
| Código R-01 | U1 | O contrato compartilhado declara `active` obrigatório em `statuses`, e o código usa um tipo sem esse campo |
| Código R-01 | U2 | A regra escrita manda responder 404 para encerrar ou reabrir chamado alheio; a política implementada responde 403 |
| Código R-02 | U2 | A tela "Chamados" do Administrador é a única listagem sem teste de componente: 11,11% de linhas |
| Código R-01 | U5 | O cartão de avaliação entrou no estado único de carregamento e erro do Painel: falha da rota nova derruba todo o painel de U4 |

## Condição 3 — Gate de cobertura entre unidades

**PASS**, conforme `../construction/build-and-test/cross-unit-traceability.md`.

| Conjunto | Total | Cobertos |
|----------|-------|----------|
| Critérios de aceitação de três segmentos | 110 | 110 |
| Requisitos funcionais folha | 58 | 58 |
| Requisitos não funcionais | 9 | 6 verificados, 3 `Unverified` com etapa dona nomeada |

Os três `Unverified` são NFR5 e NFR6 (acessibilidade e largura de 375px, pendentes da inspeção manual do autor) e NFR9 na metade da varredura de segredo, que pertence ao pipeline de CI. Nenhum é lacuna de implementação, e todos têm dono registrado.

Nota de enumeração: `FR4.9` aparece na prosa de `requirements.md` sem existir como linha de requisito. Não entra na contagem e não conta como lacuna — é o mesmo identificador fantasma que a verificação de fronteira anterior apontou.

## Condição 4 — Os portões do CI aplicam o que a Build and Test registrou

Comparação linha a linha entre os comandos que a Build and Test executou e os que o workflow executa.

| Comando registrado em Build and Test | Portão no CI | Bloqueante |
|--------------------------------------|--------------|-----------|
| `npm run lint` | Passo `Lint` do job `api` | Sim |
| `npm run format:check` | Passo `Formatting` | Sim |
| `npm run typecheck` (dois pacotes) | `Types (api)` e `Types (web)` | Sim |
| `npm run openapi:check -w apps/api` | `OpenAPI contract` | Sim |
| `jest --config apps/api/jest.config.ts --runInBand --coverage` | `Tests and coverage (api)`, pelo script `test:coverage` | Sim, com os cinco limiares |
| `vitest run --coverage` | `Tests and coverage (web)` | Sim, com o piso de 80% |
| `npm audit --omit=dev --audit-level=high` | `Dependency audit (production, blocking)` | Sim |
| `npm audit` completo | `Dependency audit (full, report only)` | Não, por decisão afirmada |
| `docker compose build api web` | **Ausente do CI**, por não estar no conjunto afirmado; verificado localmente em 88 s | — |
| `gitleaks` | `Secret scan`, pela ação do workflow | Sim |

Os limiares de cobertura não são redeclarados no YAML: vivem em `apps/api/jest.shared.ts` e `apps/web/vitest.config.ts`, e o CI os aplica por executar os mesmos scripts. Duplicá-los no workflow criaria duas fontes de verdade.

## O que esta fronteira NÃO atesta

Dito explicitamente, para que a aprovação não seja lida como mais do que é:

1. **O pipeline nunca rodou em runner.** O YAML foi validado, e cada comando que ele chama foi executado nesta máquina na forma exata — exceto `npm run test:coverage -w apps/api`, cujo comando idêntico por baixo rodou duas vezes hoje, e a ação do `gitleaks`, que só roda no runner. A primeira execução real depende do primeiro push, e o repositório não tem commit algum.
2. **O CodeQL não está habilitado.** É configuração de conta na interface do GitHub, não arquivo do repositório, e nenhum passo do pipeline consegue detectar a ausência.
3. **Dois NFR de tela não foram verificados.** Dependem dos cinco roteiros de inspeção manual, que existem, estão datados e versionados, e cuja execução é do autor.
4. **Treze achados de código seguem valendo** como risco aceito, incluindo uma regra escrita que contradiz o código (U2 R-01) e uma tela de administração sem teste de componente (U2 R-02).
5. **Nada foi commitado.** A fronteira atesta o estado do diretório de trabalho, não de um histórico de Git.
