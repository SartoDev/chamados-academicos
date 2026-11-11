# Mapa de Dependências Externas — Sistema de Chamados Acadêmicos

Derivado de `bolt-plan.md`, `requirements.md` (em `../requirements-analysis/`), `team-practices.md` (em `../practices-discovery/`), `contract-summary.md` (em `../contract-design/`) e do registro de decisões da Ideação.

Um **Bolt** é uma passada de construção sobre uma unidade de trabalho que termina em algo que roda localmente. Uma **dependência externa bloqueante** é qualquer coisa fora do projeto que precisa acontecer antes de um Bolt poder começar ou terminar: uma API de terceiros, dados que só ficam disponíveis numa janela, uma aprovação com prazo de resposta, ou a entrega de outro time.

## Dependências Externas Bloqueantes

**Nenhuma.** Nenhum Bolt depende de algo fora do controle do autor para começar ou terminar:

| Tipo de dependência | Situação | Origem |
|---------------------|----------|--------|
| API ou integração de terceiros | Não há: integrações não especificadas estão fora de escopo, e a API do sistema não tem consumidor externo | `requirements.md` (Fora de Escopo); `contract-summary.md` |
| Janela de disponibilidade de dados | Não há: o sistema não será operado por instituição real, e os dados são criados localmente pela carga inicial e pelos testes | D05; suposição A1 de `requirements.md` |
| Aprovação com prazo de resposta | Não há: o autor é o único stakeholder com autoridade de decisão; orientador e banca não aprovam etapas | D06 |
| Entrega de outro time | Não há: um único desenvolvedor | D12; `team-allocation.md` |
| Prazo externo | Não restringe o plano: a data da banca não é o marco de referência | D11 |
| Provedor de nuvem | Não há: nenhum serviço da AWS nem passo que exija credenciais AWS; execução apenas local | `project.md` (Forbidden); D07, D09 |

## Recursos Externos Não Bloqueantes

Ferramentas públicas que os Bolts usam, sem dono a quem pedir nem prazo de espera. Uma indisponibilidade temporária atrasa a execução, mas não exige replanejamento.

| Recurso | Dono | Tempo de espera | Bolts que usam | Se ficar indisponível |
|---------|------|-----------------|----------------|-----------------------|
| Registro público de pacotes npm | Mantenedores do registro npm | Nenhum | Todos (instalação de dependências) | Usar o cache local de pacotes; tentar novamente mais tarde; não altera o desenho |
| Registro público de imagens de contêiner (Node.js, Postgres) | Mantenedores das imagens oficiais | Nenhum | Todos (build local e Postgres de teste) | Usar imagens já baixadas; fixar versões para que o cache local continue válido |
| GitHub: repositório, Actions, CodeQL | GitHub | Nenhum | Todos (push, auditoria no CI); o workflow em si vem da etapa de pipeline de CI | O hook local de pre-push continua sendo o portão; o CI apenas audita, então uma indisponibilidade adia o registro sem bloquear o merge |
| `gitleaks` e auditoria de dependências do npm | Projetos de código aberto e registro npm | Nenhum | Etapa de pipeline de CI, depois dos Bolts | Rodar localmente quando o serviço voltar; não afeta a Definição de Pronto dos Bolts |

## Assumptions & Open Questions

- [assumption] "Nenhum tempo de espera" supõe acesso normal à internet no ambiente de desenvolvimento. Não há exigência de funcionamento offline.
- Nenhuma questão em aberto: o mapa fica vazio de bloqueios enquanto o escopo continuar sem integrações externas.
