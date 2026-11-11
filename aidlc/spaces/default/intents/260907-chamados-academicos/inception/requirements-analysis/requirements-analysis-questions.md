# Análise de Requisitos — Perguntas

Base: `../../ideation/intent-capture/intent-statement.md` (problema, perfis, fronteira), `../../ideation/scope-definition/scope-document.md` (corte mínimo e exclusões) e `../practices-discovery/team-practices.md` (convenções técnicas afirmadas).

Quatro destas perguntas fecham itens que a Ideação deixou explicitamente em aberto para esta etapa. As outras quatro são lacunas que aparecem quando os requisitos precisam virar critérios verificáveis.

---

## Q1. A categoria escolhida define o setor responsável, ou apenas o sugere?

Item deixado em aberto pela Ideação. Sustenta a tela de abertura de chamado, a fila do setor e o modelo de dados — precisa fechar antes do desenho de domínio.

- A. A categoria **define** o setor: cada categoria pertence a exatamente um setor, e o solicitante não escolhe o setor.
- B. A categoria **sugere** o setor: o campo vem preenchido, mas o solicitante pode trocar.
- C. Categoria e setor são independentes: o solicitante escolhe os dois separadamente.
- D. Not yet defined.
- X. Other (please specify)

[Answer]: A. A categoria **define** o setor: cada categoria pertence a exatamente um setor, e o solicitante não escolhe o setor.

---

## Q2. Quais status existem por padrão no sistema recém-instalado?

Item deixado em aberto pela Ideação. Status é tabela administrável, mas o sistema precisa nascer com um conjunto inicial, e a máquina de transições depende dele.

- A. Quatro: Aberto, Em análise, Aguardando solicitante, Encerrado.
- B. Cinco: Aberto, Em análise, Aguardando solicitante, Resolvido, Encerrado — separando "resolvido pelo atendente" de "encerrado de fato".
- C. Três: Aberto, Em andamento, Encerrado.
- D. Six ou mais, incluindo Cancelado e Reaberto.
- X. Other (please specify)

[Answer]: A. Quatro: Aberto, Em análise, Aguardando solicitante, Encerrado.

---

## Q3. Quais prioridades existem por padrão, e quem as define?

Item deixado em aberto pela Ideação. Muda quem controla a fila.

- A. Três (Baixa, Normal, Alta); o solicitante escolhe na abertura e o atendente pode alterar depois.
- B. Três (Baixa, Normal, Alta); apenas o atendente ou gestor define — o solicitante não escolhe.
- C. Quatro (Baixa, Normal, Alta, Urgente); solicitante escolhe, atendente pode alterar.
- D. Not yet defined.
- X. Other (please specify)

[Answer]: A. Três (Baixa, Normal, Alta); o solicitante escolhe na abertura e o atendente pode alterar depois.

---

## Q4. Ao transferir um chamado entre setores, o que acontece com o responsável?

Item deixado em aberto pela Ideação. Os wireframes assumiram uma resposta; esta pergunta confirma ou corrige.

- A. O responsável é removido e o chamado volta para a fila do setor de destino, sem dono.
- B. O responsável é mantido até que alguém do setor de destino assuma.
- C. O responsável é removido e o gestor do setor de destino precisa atribuir manualmente.
- D. Not yet defined.
- X. Other (please specify)

[Answer]: A. O responsável é removido e o chamado volta para a fila do setor de destino, sem dono.

---

## Q5. A recuperação de senha entra no corte mínimo?

Item deixado em aberto pela Ideação. O link existe no wireframe de login, mas o fluxo não foi desenhado. Com notificações apenas in-app e sem e-mail no escopo, uma recuperação por link enviado por e-mail entraria em conflito direto com a exclusão registrada.

- A. Não entra: o administrador redefine a senha pela área administrativa, e o link sai da tela de login.
- B. Entra, mas sem e-mail: o usuário pede a redefinição e o administrador aprova dentro do sistema.
- C. Entra com envio de e-mail — o que exige reabrir a decisão de excluir e-mail do escopo.
- D. Not yet defined.
- X. Other (please specify)

[Answer]: A. Não entra: o administrador redefine a senha pela área administrativa, e o link sai da tela de login.

---

## Q6. Como os usuários passam a existir no sistema?

Não foi perguntado até aqui e não dá para modelar autenticação sem isso.

- A. Somente o administrador cadastra usuários; não há auto-cadastro.
- B. Auto-cadastro aberto: qualquer pessoa cria conta e recebe o perfil Aluno por padrão.
- C. Auto-cadastro restrito: a pessoa se cadastra, mas a conta fica pendente até um administrador aprovar e atribuir o perfil.
- D. Not yet defined.
- X. Other (please specify)

[Answer]: A. Somente o administrador cadastra usuários; não há auto-cadastro.

---

## Q7. Um chamado encerrado pode ser reaberto?

Define se "Encerrado" é estado final e o que o solicitante faz quando a resposta não resolveu.

- A. Não: o chamado encerrado é final; o solicitante abre um chamado novo.
- B. Sim, pelo solicitante, dentro de uma janela de tempo (por exemplo, 7 dias após o encerramento).
- C. Sim, mas apenas por atendente ou gestor.
- D. Not yet defined.
- X. Other (please specify)

[Answer]: B. Sim, pelo solicitante, dentro de uma janela de tempo.

---

## Q8. O que um atendente enxerga além do próprio setor?

Define o alcance das consultas e é insumo direto da matriz de permissões que será fechada no desenho funcional.

- A. Apenas os chamados do seu setor; nada de outros setores.
- B. Os chamados do seu setor, mais os que já passaram por ele antes de uma transferência.
- C. Todos os chamados do sistema, em leitura, mas só age nos do seu setor.
- D. Not yet defined.
- X. Other (please specify)

[Answer]: B. Os chamados do seu setor, mais os que já passaram por ele antes de uma transferência.

---

## Q9. (Follow-up) Qual é exatamente a janela de reabertura?

A Q7 aceitou reabertura pelo solicitante "dentro de uma janela de tempo", com 7 dias apenas como exemplo. Um requisito precisa de um número verificável — sem ele não há critério de aceitação nem teste possível.

- A. 7 dias corridos após o encerramento.
- B. 3 dias corridos após o encerramento.
- C. 15 dias corridos após o encerramento.
- D. Sem limite de tempo: o solicitante pode reabrir a qualquer momento.
- X. Other (please specify)

[Answer]: B. 3 dias corridos após o encerramento.

---

## Q10. (Follow-up) Para qual status vai um chamado reaberto?

A Q2 fixou quatro status e nenhum deles é "Reaberto". A Q7 permitiu reabertura. Preciso saber onde o chamado cai, porque isso define a máquina de transições e o que aparece na fila do setor.

- A. Volta para **Aberto**, sem responsável, e retorna à fila do setor como um chamado novo.
- B. Volta para **Aberto**, mantendo o último responsável, que recebe notificação.
- C. Volta para **Em análise**, mantendo o último responsável.
- D. Acrescentar um quinto status **Reaberto** ao conjunto padrão — o que corrige a resposta da Q2.
- X. Other (please specify)

[Answer]: B. Volta para **Aberto**, mantendo o último responsável, que recebe notificação.

---

## Consolidated Summary Confirmation

Resumo consolidado das respostas:

- Categoria e setor: a categoria define o setor responsavel. Cada categoria pertence a exatamente um setor e o solicitante nao escolhe o setor (Q1).
- Status padrao: quatro - Aberto, Em analise, Aguardando solicitante, Encerrado (Q2).
- Prioridades padrao: tres - Baixa, Normal, Alta. O solicitante escolhe na abertura e o atendente pode alterar depois (Q3).
- Transferencia entre setores: remove o responsavel e devolve o chamado a fila do setor de destino, sem dono (Q4).
- Recuperacao de senha: fora do corte minimo. O administrador redefine a senha pela area administrativa e o link sai da tela de login (Q5).
- Criacao de usuarios: somente o administrador cadastra; nao ha auto-cadastro (Q6).
- Reabertura: permitida ao solicitante dentro de 3 dias corridos apos o encerramento (Q7, Q9). O chamado volta para Aberto mantendo o ultimo responsavel, que recebe notificacao (Q10).
- Visibilidade do atendente: chamados do proprio setor, mais os que ja passaram por ele antes de uma transferencia (Q8).

Consequencias que vou registrar nos requisitos, decorrentes destas respostas:

- O wireframe da tela de abertura muda: o campo de setor deixa de ser editavel e passa a ser exibicao do setor derivado da categoria (Q1).
- O link "Esqueci minha senha" sai da tela de login desenhada nos wireframes (Q5).
- A tela de administracao ganha a acao de redefinir senha de um usuario (Q5).
- A maquina de transicoes ganha a transicao Encerrado para Aberto, valida apenas para o solicitante e apenas dentro da janela de 3 dias (Q7, Q9, Q10).

- Looks correct
- Request changes

[Answer]: Looks correct
