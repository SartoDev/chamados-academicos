# Desenho Funcional — U3 Conversa (`u3-conversation`) — Plano e Perguntas

Base: `../../../inception/units-generation/unit-of-work.md` (U3: bloco Conversation), `../../../inception/units-generation/unit-of-work-story-map.md` (US1.4, mais os critérios de mensagens de US1.3, US1.5, US2.1, US2.2, US2.3, US4.1, US5.1, US5.2, US5.3 e US5.4), `../../../inception/requirements-analysis/requirements.md` (FR6, FR7.1, FR7.2), `../../../inception/domain-design/components.md` (bloco Conversation), `../../../inception/contract-design/contract-summary.md` (X-01, API-U3, SVC-02, SVC-03, DB-01), `../../../ideation/rough-mockups/wireframes.md` (Tela 5) e o desenho e o código já existentes de U1 e U2.

Esta etapa fixa regras, entidades e fluxos de U3 em nível de desenho. As perguntas abaixo são as questões que as etapas anteriores deixaram, explicitamente ou por omissão, para o Desenho Funcional desta unidade.

Já está fixado e não é perguntado:

- **Mensagem imutável:** não existe rota nem ação de edição ou exclusão (FR6.4, AC1.4.3).
- **Chamado encerrado:** o envio é recusado com 409 `MESSAGE_TICKET_CLOSED`, e o campo aparece desabilitado com o aviso "Este chamado está encerrado." (FR6.3, AC1.4.2, AC2.2.5).
- **Acesso:** a conversa parte do chamado visível devolvido por U2 (`getVisibleTicket`); quem está fora da regra recebe 404 `TICKET_NOT_FOUND`, sem nenhuma mensagem, idêntico ao chamado inexistente (FR6.5, AC2.1.7, AC5.2.1, AC5.2.2). U3 nunca consulta a tabela de chamados.
- **Setor de passagem:** atendentes e gestores de um setor por onde o chamado passou leem a conversa, sem enviar (AC2.1.3).
- **Retorno automático:** a mensagem do solicitante num chamado em Aguardando solicitante é gravada e, na mesma transação ambiente, U3 chama `onRequesterMessage`; U2 aplica a transição para Em análise (AC2.3.2, Q5 de U2).
- **Notificação de mensagem:** gravada como `MESSAGE_RECEIVED` pelo serviço de notificações de U2, na mesma transação da mensagem, e nunca para o autor.
- **Autor:** o nome vem do resumo de usuários de U1, inclusive de usuário desativado, para que a conversa continue legível (AC4.1.5).
- **Tela:** aba Conversa registrada no detalhe do chamado pelo ponto de extensão de U2, em ordem cronológica, mensagens do solicitante de um lado e do atendimento do outro, com os estados da Tela 5 (carregando, vazio, erro ao enviar com texto preservado, balão longo truncado com "ver mais").

---

## Q1. Quem pode enviar mensagem?

FR6.1 fala em "o solicitante e o atendente responsável". Os wireframes dão "enviar mensagem" ao Atendente e ao Gestor, e AC2.1.3 deixa os setores de passagem só em leitura. Não está dito o que acontece com um chamado ainda sem responsável.

- A. O solicitante, o responsável atual e o Gestor do setor atual. Os demais atendentes do setor e os leitores por passagem só leem. Num chamado sem responsável, só o solicitante envia.
- B. O solicitante e qualquer Atendente ou Gestor do setor atual, tenha ou não assumido o chamado. Leitores por passagem só leem.
- C. Só o solicitante e o responsável atual, como FR6.1 literalmente; o Gestor precisa se atribuir o chamado para escrever.
- X. Other (please specify)

[Answer]: A. O solicitante, o responsável atual e o Gestor do setor atual. Os demais atendentes do setor e os leitores por passagem só leem. Num chamado sem responsável, só o solicitante envia.

---

## Q2. O Administrador lê as mensagens?

U2 decidiu que o Administrador vê todos os chamados em leitura (Q4 de U2). A lista de FR6.5 não inclui o Administrador, e a revisão dos contratos deixou essa questão para U3.

- A. Não lê: a aba Conversa não aparece para o Administrador e a API responde 404, como FR6.5, porque a conversa pode tratar de assunto pessoal.
- B. Lê em modo somente leitura, como os demais dados do chamado, sem enviar.
- C. Lê só depois que o chamado é encerrado, também sem enviar.
- X. Other (please specify)

[Answer]: A. Não lê: a aba Conversa não aparece para o Administrador e a API responde 404, como FR6.5, porque a conversa pode tratar de assunto pessoal.

---

## Q3. Qual o limite de tamanho de uma mensagem?

O contrato só exige mínimo de 1 caractere. U2 fixou 10 a 2000 para a descrição do chamado.

- A. De 1 a 2000 caracteres, depois de remover espaços nas pontas; texto puro com quebras de linha preservadas.
- B. De 1 a 5000 caracteres, com as mesmas regras.
- C. De 1 a 10.000 caracteres, com as mesmas regras.
- X. Other (please specify)

[Answer]: A. De 1 a 2000 caracteres, depois de remover espaços nas pontas; texto puro com quebras de linha preservadas.

---

## Q4. Quem é avisado quando chega uma mensagem?

FR7.1 avisa o solicitante quando o chamado recebe mensagem; FR7.2 e AC1.4.5 avisam o responsável quando o solicitante escreve, "quando o chamado tem responsável". Ficam em aberto a mensagem do solicitante num chamado sem responsável e a mensagem de quem escreve pelo atendimento sem ser o responsável.

- A. Mensagem do solicitante avisa o responsável atual, se houver; sem responsável, ninguém é avisado, porque o chamado já está na fila do setor. Mensagem do atendimento avisa o solicitante e, se quem escreveu não é o responsável, também o responsável.
- B. Como A, mas a mensagem do solicitante num chamado sem responsável avisa todos os Atendentes e Gestores do setor atual.
- C. Só o par direto: a mensagem do solicitante avisa o responsável, e qualquer mensagem do atendimento avisa só o solicitante.
- X. Other (please specify)

[Answer]: A. Mensagem do solicitante avisa o responsável atual, se houver; sem responsável, ninguém é avisado, porque o chamado já está na fila do setor. Mensagem do atendimento avisa o solicitante e, se quem escreveu não é o responsável, também o responsável.

---

## Q5. Como a conversa se atualiza na tela?

U2 não tem atualização em tempo real: a contagem de notificações é consultada em momentos definidos. A Tela 5 pede que novas mensagens sejam anunciadas numa região acessível.

- A. Sem atualização automática: a conversa é carregada ao abrir a aba, depois de cada envio e por um botão "Atualizar"; mensagens novas trazidas por essas cargas são anunciadas na região acessível.
- B. Consulta periódica a cada 30 segundos enquanto a aba Conversa está aberta e visível, além das cargas de A.
- C. Atualização em tempo real por conexão permanente com o servidor.
- X. Other (please specify)

[Answer]: A. Sem atualização automática: a conversa é carregada ao abrir a aba, depois de cada envio e por um botão "Atualizar"; mensagens novas trazidas por essas cargas são anunciadas na região acessível.

---

## Q6. Como a aba mostra uma conversa longa?

O contrato devolve as mensagens em ordem cronológica, paginadas.

- A. A aba abre nas mensagens mais recentes (as últimas 50) e oferece "Carregar mensagens anteriores" no topo; a ordem na tela continua cronológica.
- B. A aba carrega a conversa inteira ao abrir, buscando todas as páginas em sequência.
- C. Paginação numerada, igual às listagens de chamados, começando pela primeira mensagem.
- X. Other (please specify)

[Answer]: A. A aba abre nas mensagens mais recentes (as últimas 50) e oferece "Carregar mensagens anteriores" no topo; a ordem na tela continua cronológica.

---

## Consolidated Summary Confirmation

Resumo consolidado das respostas:

- Envio de mensagem: o solicitante, o responsável atual e o Gestor do setor atual; os demais atendentes do setor e os leitores por passagem de setor só leem; num chamado sem responsável, só o solicitante escreve, e quem quiser responder assume antes (Q1).
- Administrador: não lê a conversa — a aba não aparece para ele e a API responde 404, como FR6.5; ele continua vendo descrição, metadados e histórico do chamado (Q2).
- Tamanho da mensagem: de 1 a 2000 caracteres depois de remover espaços nas pontas, texto puro com quebras de linha preservadas (Q3).
- Notificação: a mensagem do solicitante avisa o responsável atual, e ninguém quando não há responsável; a mensagem do atendimento avisa o solicitante e também o responsável quando quem escreveu não é ele; o autor nunca é avisado (Q4).
- Atualização da tela: sem atualização automática — carrega ao abrir a aba, depois de cada envio e pelo botão "Atualizar", com anúncio acessível das mensagens novas (Q5).
- Conversa longa: a aba abre nas últimas 50 mensagens, com "Carregar mensagens anteriores" no topo e ordem cronológica na tela (Q6).

Já fixado antes das perguntas, e incorporado sem pergunta: mensagem imutável, sem edição nem exclusão; chamado encerrado recusa nova mensagem com 409 e campo desabilitado; acesso derivado do chamado visível de U2, com 404 idêntico ao inexistente para quem está fora da regra; leitura pelos setores de passagem, sem envio; mensagem do solicitante em Aguardando solicitante grava e pede a U2 o retorno a Em análise, na mesma transação; notificação de mensagem gravada pelo serviço de U2 na mesma transação, nunca para o autor; autor exibido inclusive quando o usuário foi desativado; aba Conversa registrada no ponto de extensão do detalhe do chamado, com os estados da Tela 5.

- Looks correct
- Request changes

[Answer]: Looks correct
