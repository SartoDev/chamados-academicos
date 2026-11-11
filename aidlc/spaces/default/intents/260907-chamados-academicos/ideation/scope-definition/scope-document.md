# Documento de Escopo — Sistema de Chamados Acadêmicos

## Base

Este documento parte de `../intent-capture/intent-statement.md`, que fixou o problema (solicitações acadêmicas dispersas e sem rastreabilidade), os perfis atendidos, o critério de sucesso (entregáveis do TCC), o ambiente de execução (apenas local via Docker) e o alcance do CI/CD (apenas integração contínua). O que segue delimita a fronteira de entrega dentro daquele enquadramento.

## Dentro do Escopo

### Corte mínimo (Must have)

O sistema não cumpre seu propósito sem estes seis blocos. [Q1]

| Bloco | O que entrega |
|-------|---------------|
| Autenticação | Login e sessão via JWT em cookie; controle de acesso por perfil (Aluno, Professor, Atendente, Gestor, Administrador). |
| Usuários | Cadastro e gerenciamento de usuários e seus perfis de acesso. |
| Chamados | Abertura, consulta e acompanhamento do andamento; alteração de status; histórico das alterações. |
| Atendimento básico | Fila de chamados do setor; assumir um chamado; responder ao solicitante; encerrar. |
| Categorias e Setores | Catálogo administrável de categorias e setores responsáveis pelo atendimento. |
| Notificações | Avisos in-app sobre eventos dos chamados do usuário. [Q4] |

### Should have

| Bloco | O que entrega | Por quê |
|-------|---------------|---------|
| Administração | Área de configuração de usuários, perfis, setores, categorias, status e prioridades. | O corte mínimo exige categorias e setores **administráveis** [Q1]; a área administrativa é o que torna essa administração possível. |

### Could have

Construídos se houver folga. Cortá-los não invalida a entrega. [Q2]

| Bloco | O que entrega |
|-------|---------------|
| Dashboard e indicadores | Painéis de acompanhamento dos chamados e do atendimento, sem metas numéricas. |
| Relatórios | Listagens em tela com filtros, sem exportação em arquivo. [Q7] |
| Avaliação dos atendimentos | Nota dada pelo solicitante ao encerramento do chamado. |

## Fora do Escopo

| Item | Origem |
|------|--------|
| Aplicativo mobile nativo | Já registrado na Captura de Intenção. |
| Automação avançada baseada em IA | Já registrado na Captura de Intenção. |
| Integrações não especificadas | Já registrado na Captura de Intenção. |
| Anexos nos chamados | [Q5] |
| Notificação por e-mail ou qualquer canal externo | [Q4] |
| SLA e prazos automáticos por categoria (escalonamento por tempo) | [Q6] |
| Exportação de relatórios em PDF ou CSV | [Q6] [Q7] |
| Base de conhecimento ou FAQ integrada aos chamados | [Q6] |
| Implantação em servidor externo e ambientes de homologação/produção | `intent-statement.md` § Initial Scope Signal |
| Publicação de imagens e entrega contínua (CD) | `intent-statement.md` § Initial Scope Signal |

Anexos merecem registro explícito: aparecem na lista de funcionalidades do documento de escopo original do TCC, mas foram deliberadamente retirados desta entrega. [Q5]

## Sequenciamento

Estratégia escolhida: **fundação primeiro**. Autenticação, modelo de dados e catálogos (setores, categorias, status, prioridades) vêm antes de qualquer funcionalidade de chamado. [Q3]

Ordem de construção decorrente:

1. Autenticação e usuários — sem identidade e perfil, nenhuma regra de acesso do resto do sistema pode ser exercida.
2. Catálogos (setores, categorias, status, prioridades) — um chamado não existe sem categoria e setor de destino.
3. Chamados — abertura, consulta, acompanhamento, histórico.
4. Atendimento — fila, assumir, responder, transferir entre setores, encerrar.
5. Notificações in-app — dependem de eventos gerados pelos passos 3 e 4.
6. Administração — expõe em tela a gestão dos catálogos e usuários já modelados.
7. Dashboard, Relatórios e Avaliação (Could have) — consomem os dados acumulados pelos passos anteriores.

O detalhamento em unidades de trabalho e a ordenação econômica final ficam para as etapas de Units Generation e Delivery Planning.

## Fronteira de Valor

O sistema entrega valor a partir do passo 4: com autenticação, catálogos, chamados e atendimento funcionando, um aluno já consegue abrir uma solicitação e acompanhá-la, e um atendente já consegue tratá-la — que é exatamente a dor registrada na Captura de Intenção. Notificações (passo 5) completam o corte mínimo ao fechar o laço de comunicação sem que o solicitante precise consultar o sistema para saber que algo mudou. [Q1]

## Riscos de Escopo

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Os três blocos Could have consumirem tempo antes de o corte mínimo estar estável. | Média | Médio | Não iniciar Could have antes de o passo 6 estar concluído e testado. |
| Anexos e notificação por e-mail voltarem ao escopo por pressão de completude perante a banca. | Média | Médio | A exclusão está registrada com origem rastreável; reintroduzir exige decisão explícita em ponto de aprovação. |
| A matriz de permissões dos cinco perfis crescer em complexidade além do previsto. | Média | Alto | Especificar a matriz por completo em Functional Design antes de gerar código. |

## Assumptions & Open Questions

- [assumption] O detalhe de quais status e prioridades existem por padrão não foi definido; será tratado na análise de requisitos.
- [assumption] A transferência de chamados entre setores foi mantida no bloco de Atendimento por decorrer da fila e dos setores responsáveis, mas não foi objeto de pergunta específica; confirmar na análise de requisitos.
