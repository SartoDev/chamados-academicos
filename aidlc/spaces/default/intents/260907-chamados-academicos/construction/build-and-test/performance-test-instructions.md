# Instruções de Teste de Desempenho — Ausência de Meta Declarada

Derivado do inventário de metas mensuráveis desta etapa, que varreu os cinco `code-generation-plan.md` e seus `unit-test-instructions.md` e `code-summary.md` (em `../u*/code-generation/`), mais as pastas de requisitos não funcionais.

## Situação: não existe meta de desempenho neste projeto

O inventário não encontrou **nenhuma** meta de desempenho mensurável. A constatação é verificável, não uma omissão desta etapa:

| Fonte procurada | Resultado |
|-----------------|-----------|
| `../../inception/nfr-requirements/` | A etapa não executou neste fluxo; a pasta não existe |
| `../../inception/nfr-design/` | A etapa não executou neste fluxo; a pasta não existe |
| `## Testing Contract` dos cinco planos de código | Nenhuma obrigação de desempenho; a estratégia `standard` fixa volume e tipos de teste, não tempo de resposta nem vazão |
| `requirements.md` | Nenhum requisito não funcional de desempenho com limiar numérico |
| `team.md`, `project.md` | Nenhuma meta de desempenho afirmada |

As etapas de requisitos e desenho não funcionais foram cortadas deste fluxo por composição de escopo, e `project.md` registra que o único mecanismo de qualidade fixado fora do desenho funcional é o de autorização. Sem meta declarada, **não há o que medir contra o quê**: um número medido aqui não teria critério de aprovação e inventar um limiar agora seria fabricar requisito.

Por isso, na matriz de verificação de `build-and-test-summary.md`, o desempenho aparece como uma única linha explicativa, e não como meta pendente ou não atingida.

## O que existe como evidência de sanidade

Não é teste de desempenho, e não é apresentado como tal. É o que o projeto já produz e que flagraria uma degradação grosseira:

| Sinal | Onde aparece | O que flagraria |
|-------|--------------|-----------------|
| Tempo de execução da suíte de integração | Saída do Jest em cada execução | Consulta que passou a varrer tabela inteira: a suíte usa Postgres real e o tempo salta de forma visível |
| Índices declarados no esquema | `apps/api/prisma/schema.prisma` | Consulta de listagem ou de conversa sem índice de apoio |
| Agregações no banco, não em memória | Serviços de `src/reporting/` e `rating.service.ts` | Carregamento de lista inteira para somar na aplicação — o desenho proíbe, e a revisão de código confirmou que não acontece |
| Paginação obrigatória em toda listagem | Convenção X-01, verificada nos testes de API | Endpoint devolvendo coleção sem limite |

Esses sinais são qualitativos. Nenhum deles é um limiar, e nenhum entra na matriz como meta atingida.

## O que fazer se uma meta for definida depois

Se o autor fixar uma meta — por exemplo, tempo de resposta da listagem de chamados com um volume dado —, o caminho mínimo e proporcional a este projeto é:

1. Registrar a meta com limiar numérico, população de dados e percentil, numa fonte rastreável (`project.md` ou um artefato de requisito não funcional).
2. Semear o banco de teste com volume representativo, usando as fábricas que já existem em `apps/api/test/integration/*/support/`.
3. Medir com ferramenta de linha de comando contra a API em contêiner (`autocannon`, `k6` ou equivalente), em execução única e local, registrando o percentil exigido.
4. Acrescentar a meta à matriz de verificação desta etapa, com a etapa dona da execução.

Nada disso é feito agora: seria trabalho sem requisito que o justifique, e o orçamento deste projeto é de horas.

## Fora destas Instruções

- Teste de carga, de estresse e de resistência: não há meta que os motive.
- Detecção de regressão de desempenho em CI: fora do escopo do pipeline afirmado em `team.md`, que cobre build, lint, tipos, testes, segredo e auditoria de dependência.
- Validação em ambiente de produção: não existe ambiente de produção neste projeto.
