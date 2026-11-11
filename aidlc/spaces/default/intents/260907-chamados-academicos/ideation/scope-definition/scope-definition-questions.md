# Definição de Escopo e Priorização — Perguntas

Base: `intent-statement.md` (Captura de Intenção), que já fixou o problema, os perfis, o critério de sucesso, a fronteira do produto, o ambiente (Docker local) e o alcance do CI/CD (apenas integração contínua).

Estas perguntas tratam do que fica **dentro do corte mínimo**, em que **ordem** construir, e o que fica **explicitamente fora**.

---

## Q1. Qual é o corte mínimo que já entrega valor?

Os módulos previstos são: Autenticação, Usuários, Chamados, Atendimento, Categorias, Setores, Notificações, Dashboard, Relatórios e Administração. Esta resposta define o primeiro conjunto que precisa funcionar de ponta a ponta.

- A. Autenticação + Usuários + Chamados (abertura, consulta, acompanhamento) + Atendimento básico (assumir e responder).
- B. A opção A mais Categorias e Setores administráveis.
- C. A opção B mais Notificações.
- D. Todos os dez módulos formam o corte mínimo; não há priorização a fazer.
- X. Other (please specify)

[Answer]: C. A opção B mais Notificações. (Autenticação + Usuários + Chamados + Atendimento básico + Categorias e Setores administráveis + Notificações)

---

## Q2. Quais módulos são desejáveis, mas podem ficar de fora se o tempo apertar? (selecione todos que se aplicam)

Marcados aqui, entram como "Could have" no backlog: são construídos se houver folga, e cortá-los não invalida a entrega.

- A. Notificações.
- B. Dashboard e indicadores.
- C. Relatórios (listagens exportáveis).
- D. Avaliação dos atendimentos pelos solicitantes.
- X. Other (please specify)

[Answer]: B, C, D. Dashboard e indicadores; Relatórios; Avaliação dos atendimentos.

---

## Q3. Qual estratégia de sequenciamento você prefere?

Define a ordem de construção e o que cada etapa precisa provar antes da seguinte.

- A. **Esqueleto ambulante primeiro** — uma fatia vertical fina de ponta a ponta (login → abrir chamado → atendente responde → encerrar), provando que a arquitetura funciona antes de ampliar.
- B. **Fundação primeiro** — autenticação, modelo de dados e catálogos (setores, categorias, status, prioridades) antes de qualquer funcionalidade de chamado.
- C. **Valor primeiro** — todo o fluxo do Aluno completo antes de qualquer coisa do Atendente.
- D. **Risco primeiro** — atacar antes o que é mais incerto: fila de atendimento, permissões por perfil e notificações.
- X. Other (please specify)

[Answer]: B. **Fundação primeiro** — autenticação, modelo de dados e catálogos (setores, categorias, status, prioridades) antes de qualquer funcionalidade de chamado.

---

## Q4. Quais canais de notificação entram no escopo?

O documento de escopo deixa os canais para as histórias de usuário. Como isso muda bastante o tamanho do módulo, vale fixar agora a fronteira.

- A. Apenas notificações dentro do sistema (in-app).
- B. In-app mais e-mail.
- C. In-app mais e-mail mais um terceiro canal.
- D. Not yet defined — decidir no detalhamento das histórias de usuário.
- X. Other (please specify)

[Answer]: A. Apenas notificações dentro do sistema (in-app).

---

## Q5. Anexos nos chamados entram no corte mínimo?

Anexos aparecem na lista de funcionalidades de chamados. Eles trazem armazenamento de arquivos, validação de tipo e limite de tamanho junto.

- A. Sim, no corte mínimo, com armazenamento em volume Docker local e limite de tamanho.
- B. Sim, mas depois do corte mínimo (Should have).
- C. Não; ficam como desejável (Could have), sem compromisso de entrega.
- D. Not applicable — anexos ficam fora desta entrega.
- X. Other (please specify)

[Answer]: D. Not applicable — anexos ficam fora desta entrega.

---

## Q6. O que fica explicitamente fora, além do já registrado? (selecione todos que se aplicam)

Já estão fora: aplicativo mobile nativo, automação por IA e integrações não especificadas. Marque o que também deve ficar fora, para evitar crescimento silencioso do escopo.

- A. SLA e prazos automáticos por categoria (escalonamento por tempo).
- B. Exportação de relatórios em PDF ou CSV.
- C. Base de conhecimento ou FAQ integrada aos chamados.
- D. Nada além do já registrado; tudo que está no documento de escopo entra.
- X. Other (please specify)

[Answer]: A, B, C. SLA e prazos automáticos por categoria; exportação de relatórios em PDF ou CSV; base de conhecimento ou FAQ integrada.

---

## Q7. (Follow-up) O que sobra do módulo Relatórios, já que a exportação ficou fora?

Há uma tensão entre duas respostas: a Q2 mantém **Relatórios (listagens exportáveis)** como desejável (Could have), mas a Q6 coloca **exportação em PDF ou CSV** explicitamente fora do escopo. Preciso saber o que fica de pé antes de escrever o documento de escopo.

- A. Relatórios seguem como Could have, mas apenas como listagens em tela com filtros; a exportação em arquivo fica fora.
- B. Relatórios saem inteiramente do escopo; consulta e filtro ficam cobertos pelas telas de chamados e pelo dashboard.
- C. Relatórios seguem como Could have **com** exportação; a marcação da Q6 sobre exportação deve ser desfeita.
- D. Not yet defined — decidir na análise de requisitos.
- X. Other (please specify)

[Answer]: A. Relatórios seguem como Could have, mas apenas como listagens em tela com filtros; a exportação em arquivo fica fora.

---

## Consolidated Summary Confirmation

Resumo consolidado das respostas:

- Corte minimo (Must have): Autenticacao, Usuarios, Chamados (abertura, consulta, acompanhamento), Atendimento basico (assumir e responder), Categorias e Setores administraveis, e Notificacoes (Q1).
- Could have (entram se houver folga): Dashboard e indicadores, Relatorios, Avaliacao dos atendimentos (Q2).
- Sequenciamento: fundacao primeiro - autenticacao, modelo de dados e catalogos (setores, categorias, status, prioridades) antes de qualquer funcionalidade de chamado (Q3).
- Notificacoes: apenas in-app, dentro do sistema; sem e-mail e sem outros canais (Q4).
- Anexos: fora desta entrega (Q5).
- Fora do escopo, alem do ja registrado: SLA e prazos automaticos por categoria; exportacao de relatorios em PDF ou CSV; base de conhecimento ou FAQ integrada (Q6).
- Relatorios: permanecem como Could have apenas na forma de listagens em tela com filtros, sem exportacao em arquivo (Q7).
- Administracao permanece no escopo como Should have: e o modulo que torna categorias, setores, status e prioridades administraveis, exigido pelo corte minimo (Q1).

- Looks correct
- Request changes

[Answer]: Looks correct
