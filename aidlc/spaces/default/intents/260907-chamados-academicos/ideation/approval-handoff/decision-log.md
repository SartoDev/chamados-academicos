# Log de Decisões — Fase de Ideação

Registro das decisões tomadas entre a Captura de Intenção e o fechamento da Ideação, com origem rastreável. Complementa `initiative-brief.md`; as fontes são os artefatos de `../intent-capture/`, `../scope-definition/` e `../rough-mockups/`.

## Decisões de Enquadramento

| # | Decisão | Fundamento | Origem |
|---|---------|------------|--------|
| D01 | O problema tratado é a dispersão das solicitações acadêmicas por canais informais, sem rastreabilidade. | Escolhido entre quatro cenários possíveis; descarta as hipóteses de processo manual formal, sistema existente inadequado e cenário puramente acadêmico. | intent-capture Q1 |
| D02 | Aluno e Atendente são os perfis prioritários, com peso equivalente. | O valor central está na comunicação entre solicitante e atendente, não em otimizar para um só lado. | intent-capture Q2 |
| D03 | Sucesso é medido pelos entregáveis do TCC, não por métricas operacionais. | O projeto tem banca e prazo acadêmico; indicadores de produto entram como funcionalidade, não como critério de aceite. | intent-capture Q3, Q10 |
| D04 | Indicadores de produto não terão metas numéricas. | Sem operação real, um limiar de tempo de atendimento não teria como ser validado. | intent-capture Q10 |
| D05 | O sistema não será operado por uma instituição de ensino real. | Elimina exigência regulatória decorrente de operação institucional. | intent-capture Q17 |
| D06 | O autor é o único stakeholder com autoridade de decisão. Orientador e banca constam no mapa sem participar das aprovações. | Resolve a contradição entre o gatilho (TCC com banca) e a resposta inicial que listava só o autor. | intent-capture Q5, Q6, Q9, Q15 |

## Decisões de Ambiente e Entrega

| # | Decisão | Fundamento | Origem |
|---|---------|------------|--------|
| D07 | Ambiente de execução: apenas local, via Docker e Docker Compose. Sem implantação em servidor externo. | Projeto acadêmico sem operação real; elimina custo e complexidade de infraestrutura. | intent-capture Q13 |
| D08 | CI/CD limitado a integração contínua: build, lint e testes a cada push ou pull request. Sem publicação de imagens e sem implantação. | Decorre de D07: não há destino de implantação. | intent-capture Q18 |
| D09 | Autenticação em provedor AWS excluída da iniciativa. | Instrução explícita na abertura do fluxo de trabalho. | descrição inicial |
| D10 | O plano de trabalho foi enxugado de 32 para 18 etapas. | D07 e D08 esvaziam a fase de operação; sem equipe e sem mercado, as etapas de pesquisa e formação não têm pergunta a responder. Todos os entregáveis do TCC seguem com etapa produtora. | recomposição aprovada, 2026-09-08 |
| D11 | O prazo acadêmico não restringe o planejamento nesta fase; a data da banca não é o marco de referência. | O marco relevante é a entrega do sistema. | intent-capture Q12, Q16 |
| D12 | Capacidade de trabalho: 10 a 20 horas por semana. | Insumo para dimensionar as unidades de trabalho em Delivery Planning. | approval-handoff Q3 |

## Decisões de Escopo

| # | Decisão | Fundamento | Origem |
|---|---------|------------|--------|
| D13 | O corte mínimo inclui Autenticação, Usuários, Chamados, Atendimento básico, Categorias e Setores administráveis, e Notificações. | É o conjunto que fecha o laço de comunicação entre solicitante e atendente. | scope-definition Q1 |
| D14 | Dashboard, Relatórios e Avaliação dos atendimentos são Could have. | Cortá-los não invalida a entrega; não são iniciados antes de o corte mínimo estar concluído e testado. | scope-definition Q2 |
| D15 | Estratégia de sequenciamento: fundação primeiro. | Autenticação, modelo de dados e catálogos antes de qualquer funcionalidade de chamado. | scope-definition Q3 |
| D16 | Notificações apenas in-app. Sem e-mail e sem canais externos. | Reduz a superfície: sem SMTP, sem fila de envio, sem tratamento de falha de entrega. | scope-definition Q4 |
| D17 | Anexos nos chamados ficam fora desta entrega. | Constam do documento de escopo original do TCC, mas foram deliberadamente retirados. Reintroduzir exige decisão explícita. | scope-definition Q5 |
| D18 | Também ficam fora: SLA e prazos automáticos, exportação de relatórios em PDF ou CSV, base de conhecimento ou FAQ. | Evita crescimento silencioso do escopo. | scope-definition Q6 |
| D19 | Relatórios permanecem como Could have apenas na forma de listagens em tela com filtros. | Resolve a contradição entre manter Relatórios (D14) e excluir exportação (D18). | scope-definition Q7 |
| D20 | A Área Administrativa é Should have, não Must have. | O corte mínimo exige que categorias e setores sejam administráveis pelo modelo de dados; a interface dedicada vem depois. | scope-definition, decisão do redator confirmada na revisão |
| D21 | A aba de Usuários da Área Administrativa pertence ao corte mínimo e sobrevive a qualquer corte do restante. | Sem ela, a capacidade Must have de gestão de usuários ficaria sem interface. | rough-mockups, achado R-01 da revisão |
| D22 | Comunicação no Chamado é tratada como unidade separada do ciclo de vida do chamado. | Modelo de dados e regras de acesso próprios. Units Generation pode fundi-las. | scope-definition, decisão do redator |

## Decisões de Interface

| # | Decisão | Fundamento | Origem |
|---|---------|------------|--------|
| D23 | Navegação: barra superior (conta, notificações, busca) com barra lateral (seções). | Adequado a sistema com seis a dez áreas conforme o perfil. | rough-mockups Q1 |
| D24 | Não há tela inicial única. Cada perfil entra direto na sua tarefa principal. | Aluno e Professor nos seus chamados; Atendente e Gestor na fila; Administrador na administração. | rough-mockups Q2 |
| D25 | Não há item "Início" na barra lateral. | Decorre de D24: apontaria para a mesma tela que o primeiro item da lateral. O logotipo cumpre o papel de retorno. | rough-mockups, achado R-04 da revisão |
| D26 | Abertura de chamado: formulário em página única. | Menos passos que um assistente para um formulário de cinco campos. | rough-mockups Q3 |
| D27 | Detalhe do chamado em abas: Conversa, Histórico, Detalhes. | Separa conversa de histórico na tela mais usada, ao custo de trocar de aba para correlacionar mensagem e mudança de status. | rough-mockups Q4 |
| D28 | Desktop em primeiro lugar, com layout responsivo funcional em celular. | Aplicativo mobile nativo está fora do escopo; o acesso por celular é pelo navegador. | rough-mockups Q5 |
| D29 | Meta de acessibilidade: WCAG 2.1 A. | Navegação por teclado, rótulos visíveis e contraste mínimo viram critério verificável; o restante fica como boa prática. | rough-mockups Q6 |
| D30 | Tema padrão do Shadcn, sem paleta própria. | Sem instituição real a representar, não há identidade visual a seguir. | rough-mockups Q7 |

## Decisões de Processo

| # | Decisão | Fundamento | Origem |
|---|---------|------------|--------|
| D31 | Todos os artefatos legíveis por pessoas são escritos em português (pt-BR); código e comentários em inglês. | Instrução explícita na abertura do fluxo. Registrada como prática permanente do projeto. | learnings, intent-capture |
| D32 | O documento de escopo em PDF foi indexado no catálogo de documentos e associado a esta iniciativa, em vez de lido como texto solto. | Formato binário; o conteúdo molda as perguntas mas não é fonte citável nos artefatos. | intent-capture, decisão do redator |

## Decisões Pendentes

Itens que a Ideação deliberadamente deixou em aberto, com o dono da resolução:

| Item | Resolve em |
|------|------------|
| A categoria fixa o setor responsável ou apenas o sugere? | Requirements Analysis |
| Quais status e prioridades existem por padrão? | Requirements Analysis |
| A transferência entre setores limpa o responsável? | Requirements Analysis |
| Recuperação de senha está no corte mínimo? | Requirements Analysis |
| Matriz completa de permissões por perfil | Functional Design |
| Estilo da API do backend (REST, GraphQL ou outro) | Contract Design |
| Comunicação no Chamado permanece unidade separada? | Units Generation |
