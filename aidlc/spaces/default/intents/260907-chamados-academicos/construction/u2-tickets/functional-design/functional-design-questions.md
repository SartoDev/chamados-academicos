# Desenho Funcional — U2 Chamados (`u2-tickets`) — Plano e Perguntas

Base: `../../../inception/units-generation/unit-of-work.md` (U2: Tickets e Notifications), `../../../inception/units-generation/unit-of-work-story-map.md` (US1.2, US1.3, US1.5, US1.6, US2.1, US2.2, US2.3, US2.4, US3.1, US5.2, mais critérios de US4.1, US4.2, US5.1, US5.3 e US5.4), `../../../inception/requirements-analysis/requirements.md` (FR4, FR5, FR7, FR8), `../../../inception/domain-design/components.md` (blocos Tickets e Notifications), `../../../inception/contract-design/contract-summary.md` (X-01, API-U2, SVC-01, SVC-03, SVC-05, SVC-07, DB-01) e o desenho e o código já existentes de U1.

Esta etapa fixa regras, entidades e fluxos de U2 em nível de desenho. As perguntas abaixo são as questões que as etapas anteriores deixaram, explicitamente, para o Desenho Funcional desta unidade.

Já está fixado e não é perguntado:

- **Transições válidas:** a tabela completa de `stories.md`, com as nove transições, inclusive Aguardando solicitante → Encerrado (achado R-11), aplicada por um módulo puro que compara chaves estáveis de status.
- **Abertura:** nasce em Aberto, sem responsável, com setor derivado da categoria e prioridade padrão se nenhuma for escolhida.
- **Assumir e atribuir** levam a Em análise; **transferir** remove o responsável, volta a Aberto e exige justificativa; **reabrir** só pelo solicitante, dentro de 72 horas, mantendo o último responsável.
- **Visibilidade:** o solicitante vê os seus chamados; Atendente e Gestor veem o setor atual e, só em leitura, os chamados que já passaram pelo setor; chamado invisível responde 404, igual a inexistente.
- **Prioridade:** alterada por Atendente ou Gestor em chamado do próprio setor (AC2.3.3); nunca pelo solicitante depois da abertura.
- **Transferência:** qualquer Atendente ou Gestor do setor atual transfere (AC2.4.1); destino precisa ser setor ativo diferente do atual.
- **Notificação:** gravada no momento do evento (CT9), só dentro do sistema, e nunca para quem causou o evento.
- **Gestor** executa tudo o que o Atendente executa no seu setor, mais atribuir (US3).

---

## Q1. Qual o formato do identificador visível do chamado?

É o número que aparece na listagem, no detalhe e nas notificações (FR4.3). O endereço do chamado continua usando o UUID; o identificador visível não dá acesso a nada. Os wireframes mostram "#42".

- A. Sequencial global, exibido como `#42`: um contador único do sistema, gerado no banco no momento da criação, sem lacunas visíveis na maioria dos casos.
- B. Sequencial por ano, exibido como `2026-00042`: o contador recomeça a cada ano.
- C. Código curto não sequencial (por exemplo, `K7Q2-M9XA`), que não revela volume de chamados.
- X. Other (please specify)

[Answer]: A. Sequencial global, exibido como `#42`: um contador único do sistema, gerado no banco no momento da criação, sem lacunas visíveis na maioria dos casos.

---

## Q2. Quem pode abrir chamado?

FR4.1 diz "um solicitante (Aluno ou Professor)", mas os wireframes mostram "Meus Chamados" também para Atendente, Gestor e Administrador.

- A. Só Aluno e Professor, como diz FR4.1. "Meus Chamados" some da navegação dos outros perfis.
- B. Qualquer perfil autenticado abre chamado como solicitante; um Atendente ou Gestor que abre chamado para o próprio setor não pode assumi-lo nem atribuí-lo a si.
- C. Aluno, Professor, Atendente e Gestor abrem; Administrador não.
- X. Other (please specify)

[Answer]: A. Só Aluno e Professor, como diz FR4.1. "Meus Chamados" some da navegação dos outros perfis.

---

## Q3. Quais os limites de tamanho dos textos do chamado?

Os wireframes mostram "0/2000 caracteres" na descrição, como ilustração. A justificativa de transferência também é texto livre.

- A. Título de 5 a 120 caracteres; descrição de 10 a 2000; justificativa de transferência de 5 a 500.
- B. Título de 1 a 200; descrição de 1 a 5000; justificativa de 1 a 1000.
- C. Só limites técnicos máximos (título 255, descrição 10.000, justificativa 2000) e mínimo de 1 caractere.
- X. Other (please specify)

[Answer]: A. Título de 5 a 120 caracteres; descrição de 10 a 2000; justificativa de transferência de 5 a 500.

---

## Q4. O que o Administrador vê e faz com chamados?

ADR-005 diz que o administrador vê tudo nos indicadores. Nenhuma história diz o que ele faz com chamados individuais.

- A. Vê todos os chamados em leitura — listagem e detalhe com histórico —, sem fila e sem nenhuma ação de atendimento.
- B. Vê todos os chamados e pode executar qualquer ação de atendimento em qualquer setor (assumir, atribuir, transferir, encerrar).
- C. Não vê chamados: só administra cadastros.
- X. Other (please specify)

[Answer]: A. Vê todos os chamados em leitura — listagem e detalhe com histórico —, sem fila e sem nenhuma ação de atendimento.

---

## Q5. Como uma operação que grava em mais de um serviço fica atômica?

`contract-summary.md` (X-01) exige que transição de status, histórico, passagem por setor e notificação sejam gravados juntos ou nenhum, sem expor tipos do banco nas assinaturas públicas. A revisão dos contratos (R-01) deixou o mecanismo para esta etapa, porque ele vale também para U3 (mensagem e retorno automático de status).

- A. Transação ambiente por requisição: a operação abre uma transação, e todo serviço chamado dentro dela, de qualquer unidade, participa automaticamente, sem receber nada novo na assinatura.
- B. Contexto de transação explícito: a operação cria um contexto opaco, de tipo próprio do contrato, e o passa como parâmetro aos serviços públicos que gravam.
- C. Sem atomicidade entre serviços: grava a mudança principal primeiro e a notificação depois; se a notificação falhar, a falha é registrada em log e a operação não é desfeita. Revisa a regra de atomicidade de X-01.
- X. Other (please specify)

[Answer]: A. Transação ambiente por requisição: a operação abre uma transação, e todo serviço chamado dentro dela, de qualquer unidade, participa automaticamente, sem receber nada novo na assinatura.

---

## Q6. O que acontece com um chamado cujo responsável deixou de poder atendê-lo?

U1 permite desativar, trocar de perfil ou de setor um usuário que é responsável por chamados, e deixou para U2 decidir o efeito (BR3.10). O mesmo vale para a reabertura, que mantém o último responsável.

- A. O chamado mantém o responsável, mas aparece na fila do setor marcado como "responsável indisponível"; o Gestor pode reatribuir, e qualquer Atendente do setor pode assumi-lo como se estivesse sem responsável.
- B. Na mudança do usuário nada acontece; na próxima operação sobre o chamado, o sistema remove o responsável indisponível e o devolve a Aberto, registrando no histórico.
- C. Nada muda: o chamado fica com o responsável até alguém reatribuir, sem marcação.
- X. Other (please specify)

[Answer]: A. O chamado mantém o responsável, mas aparece na fila do setor marcado como "responsável indisponível"; o Gestor pode reatribuir, e qualquer Atendente do setor pode assumi-lo como se estivesse sem responsável.

---

## Q7. Quem pode encerrar o chamado e marcá-lo como aguardando o solicitante?

AC2.2.4 e AC2.3.1 falam do responsável; FR5.7 diz "o atendente ou gestor". O solicitante encerra o próprio chamado (AC1.6.7) e isso não muda.

- A. O responsável atual ou o Gestor do setor.
- B. Qualquer Atendente ou Gestor do setor atual.
- C. Só o responsável atual; o Gestor só se for ele o responsável.
- X. Other (please specify)

[Answer]: A. O responsável atual ou o Gestor do setor.

---

## Consolidated Summary Confirmation

Resumo consolidado das respostas:

- Identificador visível: sequencial global, exibido como `#42`, gerado no banco na criação do chamado (Q1).
- Abertura de chamado: só Aluno e Professor, como diz FR4.1; "Meus Chamados" sai da navegação dos outros perfis (Q2).
- Limites de texto: título de 5 a 120 caracteres, descrição de 10 a 2000, justificativa de transferência de 5 a 500 (Q3).
- Administrador: vê todos os chamados em leitura — listagem e detalhe com histórico —, sem fila e sem nenhuma ação de atendimento (Q4).
- Atomicidade: transação ambiente por requisição; todo serviço chamado dentro da operação, de qualquer unidade, participa da mesma transação sem parâmetro novo na assinatura. Vale também para U3 (Q5).
- Responsável indisponível (desativado, com outro perfil ou de outro setor): o chamado mantém o responsável e aparece marcado como "responsável indisponível"; o Gestor reatribui, e qualquer Atendente do setor pode assumi-lo como se estivesse sem responsável — exceção explícita à recusa de assumir chamado já atribuído (AC2.2.2) (Q6).
- Encerrar e marcar como aguardando o solicitante: o responsável atual ou o Gestor do setor; o solicitante continua encerrando o próprio chamado (Q7).

Já fixado antes das perguntas, e incorporado sem pergunta: as nove transições da tabela completa de `stories.md` num módulo puro por chave estável; abertura em Aberto, sem responsável, com setor derivado da categoria e prioridade padrão; assumir e atribuir levam a Em análise; transferir remove o responsável, volta a Aberto e exige justificativa, feita por qualquer Atendente ou Gestor do setor para setor ativo diferente; reabertura só pelo solicitante em até 72 horas, mantendo o último responsável; visibilidade do solicitante, do setor atual e, em leitura, dos setores de passagem, com 404 para chamado invisível; prioridade alterada só por Atendente ou Gestor do setor; notificação gravada no momento do evento, só dentro do sistema e nunca para quem causou o evento; Gestor com tudo o que o Atendente faz, mais atribuir.

- Looks correct
- Request changes

[Answer]: Looks correct
