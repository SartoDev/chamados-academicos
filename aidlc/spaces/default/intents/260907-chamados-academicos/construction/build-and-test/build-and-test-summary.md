# Resumo de Build e Teste

Derivado dos cinco `code-generation-plan.md`, `unit-test-instructions.md` e `code-summary.md` (em `../u*/code-generation/`), de `requirements.md` e `stories.md` (em `../../inception/`), e da execução registrada em `test-results.md` desta pasta.

Estratégia de testes ativa: **Standard**. Escopo: `feature`.

## Situação Geral

| Dimensão | Situação |
|----------|----------|
| Build | **Pronto.** API e web compilam; as duas imagens de contêiner são construídas |
| Testes | **Pronto.** Suítes completas aprovadas, sem falha e sem teste ignorado |
| Cobertura | **Pronto.** Os cinco limiares atingidos com folga; cobertura por requisito completa |
| Rastreabilidade entre unidades | **PASS** — ver `cross-unit-traceability.md` |
| Implantação | **Local apenas**, por decisão afirmada. Não há ambiente externo, e isso não é lacuna |
| Inspeção manual | **Pendente do autor** — dois NFR de tela dependem dela |

Pré-requisitos para reproduzir: Node 24, Docker ativo, `.env` preenchido a partir de `.env.example`, e o serviço `postgres-test` de pé. O detalhe está em `build-instructions.md`.

## Inventário de Tipos de Teste

| Tipo | Gerado nesta etapa | Por quê |
|------|--------------------|---------|
| Unitário | Não | Coberto por unidade na Geração de Código; esta etapa apenas executa |
| Integração entre unidades | **Sim** — `integration-test-instructions.md` | Exigido pela estratégia Standard |
| Desempenho | **Sim, declarando ausência** — `performance-test-instructions.md` | Nenhuma meta de desempenho existe em fonte alguma; o documento registra a ausência e o que a mudaria |
| Segurança | **Sim** — `security-test-instructions.md` | As etapas de NFR foram cortadas do fluxo, mas as exigências de segurança existem como práticas afirmadas, e é contra elas que se verifica |
| Navegador, ponta a ponta | Não | Proibido por decisão afirmada em `project.md`; os cinco perfis são verificados por teste de API |
| Acessibilidade automatizada | Não | Mesma decisão; verificação por roteiro de inspeção manual datado |

## Cobertura por Unidade

Medições do portão combinado da API e da suíte do web, em `test-results.md`.

| Unidade | O que cobre | Observação de cobertura |
|---------|-------------|-------------------------|
| U1 Fundação | Autenticação, usuários, catálogos e telas de administração | Os três comandos restritos declarados pela unidade levam `--coverage` e não passam mais numa execução parcial; corrigido nas instruções desta etapa |
| U2 Chamados | Ciclo de vida do chamado, histórico, passagens, notificações | `tickets-public.service.ts` com o pior ramo entre os services, 83,87%; a chave de services não gateia por ramo |
| U3 Conversa | Mensagens dentro do chamado | Função exportada e testada que o serviço não chama (achado Minor da unidade) |
| U4 Indicadores | Contagens, tempos médios, listagem filtrada | Ramo defensivo do renderizador de condição para SQL sem cobertura |
| U5 Avaliação | Avaliação do atendimento e resumo no painel | `rating.service.ts` com 95,56% de linhas; duas regiões inalcançáveis por construção, declaradas |

## Matriz de Verificação de Metas

Vinte e três metas inventariadas: seis de cobertura e qualidade de código, sete de build e verificação estática, nove não funcionais e uma de desempenho. **Dezenove `Met`, três `Unverified`, uma `N/A`.** A matriz completa, com valor medido, evidência e etapa dona de cada linha, está em `test-results.md` desta pasta; o resumo é este:

| Grupo | Met | Unverified | N/A |
|-------|-----|------------|-----|
| Cobertura e cobertura por requisito | 6 | — | — |
| Build, lint, tipos, formato, contrato, auditoria | 7 | — | — |
| Requisitos não funcionais | 6 | 3 (NFR5, NFR6, NFR9) | — |
| Desempenho | — | — | 1 |

Nenhuma meta foi enfraquecida, relaxada ou desligada para fazer um passo passar. As três `Unverified` são, todas, por dependerem de inspeção humana (NFR5 e NFR6, telas) ou da etapa seguinte (NFR9, varredura de segredo no pipeline) — nenhuma por lacuna de implementação.

## Avaliação de Prontidão

- **Pronto para build:** sim, com os pré-requisitos acima.
- **Pronto para teste:** sim. 28 passos executados, incluindo um comando restrito por unidade e por camada; todas as suítes aprovadas.
- **Pronto para rodar localmente:** sim. `docker compose up` sobe os três serviços, com migrações aplicadas na subida.
- **Pronto para implantação externa:** não se aplica — este projeto não tem ambiente externo, por decisão afirmada.

## Limitações e Pendências

1. **Inspeção manual pendente do autor**, cinco roteiros em `docs/u*/roteiro-inspecao-manual.md`. Sem ela, NFR5 (WCAG 2.1 nível A) e NFR6 (375px) permanecem `Unverified`.
2. **`gitleaks` e CodeQL não rodam aqui**: pertencem ao pipeline de CI, a etapa seguinte. NFR9 fica parcial até lá.
3. **Aviso moderado em `fast-uri`** na árvore de produção. Não bloqueia pelo critério afirmado, que gateia severidade alta, e fica registrado.
4. **Instruções de U1 com o comando defeituoso.** O arquivo da unidade continua declarando `--coverage` em comando restrito; não foi alterado porque é artefato com revisão e aprovação registradas. A correção está nas instruções desta etapa.
5. **Sem meta de desempenho.** Consequência de as etapas de requisitos não funcionais terem sido cortadas do fluxo; registrada, não contornada.
6. **Nada commitado.** O repositório segue sem commit algum; a mudança de classificação de `shadcn` em `apps/web/package.json` e o `package-lock.json` regenerado estão no diretório de trabalho, não rastreados, como todo o resto.
