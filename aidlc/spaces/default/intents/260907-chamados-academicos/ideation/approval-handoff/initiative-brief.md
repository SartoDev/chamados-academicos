# Resumo da Iniciativa — Sistema de Chamados Acadêmicos

Documento de fechamento da fase de Ideação. Compila `../intent-capture/intent-statement.md`, `../intent-capture/stakeholder-map.md`, `../scope-definition/scope-document.md`, `../scope-definition/intent-backlog.md` e `../rough-mockups/wireframes.md`.

## Problema e Intenção

As solicitações acadêmicas hoje chegam por canais dispersos — e-mail, WhatsApp, atendimento presencial — ou sem processo definido, e se perdem sem rastreabilidade. Sem rastreabilidade, não há registro confiável do andamento de cada solicitação.

O sistema centraliza essas solicitações em um fluxo único de chamados acadêmicos, com registro, acompanhamento e gerenciamento. O valor está na comunicação entre dois perfis de peso equivalente: o **Aluno**, que não sabe o andamento do próprio pedido, e o **Atendente**, que trabalha sem fila organizada nem histórico.

O sistema também atende Professor (solicitante, como o Aluno), Gestor (indicadores e redistribuição) e Administrador (configuração), sem otimizar para eles nesta fase.

## Validação de Mercado

Não aplicável. A etapa de pesquisa de mercado foi retirada do plano de trabalho: a iniciativa é um Trabalho de Conclusão de Curso, sem instituição cliente e sem intenção de comercialização. A pilha tecnológica já estava decidida na descrição da iniciativa, de modo que a análise construir-versus-comprar não teria pergunta a responder.

## Viabilidade e Riscos

A etapa formal de viabilidade também foi retirada do plano: a pilha (React, TypeScript, Vite, Shadcn no frontend; NestJS, TypeScript, Prisma, Postgres no backend; JWT em cookie; Docker) é padrão e conhecida, sem integração externa. As restrições reais estão registradas: desenvolvedor único, execução apenas local, sem provedor de nuvem.

Riscos registrados e suas mitigações — considerados suficientes para seguir [Q1]:

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Itens Could have consumirem tempo antes de o corte mínimo estabilizar | Média | Médio | Não iniciar Could have antes de B1–B8 concluídos e testados |
| Anexos e notificação por e-mail voltarem ao escopo por pressão de completude | Média | Médio | Exclusão registrada com origem rastreável; reintroduzir exige decisão explícita em ponto de aprovação |
| Matriz de permissões dos cinco perfis crescer além do previsto | Média | Alto | Especificar a matriz por completo em Functional Design antes de gerar código |

## Fronteira de Escopo

**Corte mínimo (Must have):** Autenticação, Usuários e Perfis, Catálogos de Classificação, Chamados (ciclo de vida), Atendimento, Comunicação no Chamado, Notificações in-app.

**Should have:** Área Administrativa. A aba de Usuários dentro dela sustenta a capacidade Must have de gestão de usuários e sobrevive a qualquer corte do restante.

**Could have:** Dashboard e indicadores, Relatórios (apenas listagens em tela), Avaliação dos atendimentos.

**Fora do escopo:** aplicativo mobile nativo, automação por IA, integrações não especificadas, anexos nos chamados, notificação por e-mail ou qualquer canal externo, SLA e prazos automáticos, exportação de relatórios em PDF ou CSV, base de conhecimento ou FAQ, implantação em servidor externo, entrega contínua e ambientes de homologação e produção.

**Ambiente:** apenas execução local via Docker e Docker Compose. **CI/CD:** apenas integração contínua — build, lint e testes automatizados, sem publicação de imagens e sem implantação.

## Visuais de Conceito

Nove telas de baixa fidelidade desenhadas em `../rough-mockups/wireframes.md`, confirmadas como fiéis à visão pretendida [Q2]: login, entrada por perfil, meus chamados, novo chamado, detalhe com abas (Conversa, Histórico, Detalhes), fila do setor, notificações, administração e painel de indicadores.

Navegação: barra superior com conta, notificações e busca, mais barra lateral com as seções por perfil. Sem tela inicial única — cada perfil entra direto na sua tarefa. Desktop em primeiro lugar, com responsivo funcional em celular. Acessibilidade alvo: WCAG 2.1 A.

Quatro fluxos documentados em `../rough-mockups/user-flow.md`: abrir e acompanhar chamado, atender, transferir entre setores, administrar catálogos.

## Plano de Equipe

Não há equipe a formar. O autor do projeto é o desenvolvedor único e o único decisor de escopo [stakeholder-map]. A etapa de composição de equipes foi retirada do plano por não ter pergunta a responder.

**Capacidade:** dedicação média, entre 10 e 20 horas por semana [Q3]. Esse é o insumo que o planejamento de entrega usará para dimensionar as unidades de trabalho.

**Orientador e banca** constam no mapa de stakeholders, mas não participam das aprovações deste fluxo.

## Recomendação de Prosseguimento

**Recomendação: seguir para a fase de Concepção.**

Fundamento: o problema está definido e confirmado; a fronteira do produto está fechada, com lista explícita do que fica fora; existe um backlog priorizado de onze proto-Unidades com dependências mapeadas e caminho crítico identificado (B1 → B3 → B4 → B5 → B7); as telas do corte mínimo estão desenhadas; e todos os entregáveis do TCC têm etapa produtora no plano de 18 passos.

Nenhuma decisão da Ideação foi marcada para revisão [Q4]. A decisão registrada do autor é **seguir conforme planejado** [Q5].

Próxima etapa: Practices Discovery, que fixa postura de testes, convenções de código e o que o pipeline de integração contínua vai cobrar.

## Assumptions & Open Questions

- [assumption] A regra entre categoria e setor — se a categoria fixa o setor responsável ou apenas o sugere — sustenta a tela de abertura e a fila, e precisa ser fechada na análise de requisitos antes do modelo de dados.
- [assumption] Status e prioridades padrão do sistema recém-instalado não foram definidos; ficam para a análise de requisitos.
- [assumption] O fluxo de recuperação de senha aparece como link na tela de login, mas não foi desenhado nem confirmado como parte do corte mínimo.
- [assumption] Quem pode encerrar um chamado — apenas o atendente, ou também o solicitante — depende da matriz de permissões, a ser fechada em Functional Design.
- [assumption] A transferência entre setores limpa o responsável atual e devolve o chamado à fila do destino; comportamento coerente com a fila por setor, mas não confirmado.
