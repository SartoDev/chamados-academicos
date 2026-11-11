# Desenho Funcional — U1 Fundação (`u1-foundation`) — Plano e Perguntas

Base: `../../../inception/units-generation/unit-of-work.md` (U1: estrutura do projeto, Auth, Users, Catalog, login e administração), `../../../inception/units-generation/unit-of-work-story-map.md` (US1.1, US4.1, US4.2, US5.1, US5.3, US5.4), `../../../inception/requirements-analysis/requirements.md` (FR1, FR2, FR3, FR9, NFR1–NFR9), `../../../inception/domain-design/components.md` (blocos Auth, Users e Catalog) e `../../../inception/contract-design/contract-summary.md` (X-01, API-U1, SVC-01/02/04/06).

Esta etapa fixa as regras de negócio, o modelo de entidades e os fluxos de U1 em nível de desenho — sem código. As perguntas abaixo são as questões que as etapas anteriores deixaram, explicitamente, para o Desenho Funcional desta unidade.

Já está fixado e não é perguntado:

- **Perfis:** exatamente cinco — Aluno, Professor, Atendente, Gestor, Administrador; Atendente e Gestor exigem setor (FR2.3, FR2.7).
- **Sessão:** JWT em cookie `httpOnly`, `SameSite=Strict`, sem refresh token, logout só apaga o cookie; perfil e situação lidos do banco a cada requisição (FR1.2, FR1.3, CT10, X-01).
- **Sem auto-cadastro e sem auto-recuperação de senha** (FR1.4, FR2.2).
- **Toda a área administrativa no corte mínimo**, pela decisão registrada em US4.1.
- **Chamados atribuídos a um usuário que muda de setor, de perfil ou é desativado:** U1 não pode consultar chamados, porque U1 não depende de U2 no grafo. A mudança é sempre permitida em U1, e o que a fila mostra nesses casos é decidido no Desenho Funcional de U2.

---

## Q1. Como o primeiro administrador passa a existir?

Não há auto-cadastro, e só o administrador cria usuários. Alguém precisa existir antes. O sistema deve subir com um único comando, sem passo manual (NFR8).

- A. Pela carga inicial, a partir de variáveis de ambiente obrigatórias (e-mail e senha do administrador inicial): se não existir nenhum administrador ativo, ele é criado; se já existir, nada acontece.
- B. Por um script de linha de comando que o autor roda manualmente depois da primeira subida.
- C. Pela carga inicial, com senha gerada aleatoriamente e exibida uma única vez no log da primeira subida.
- X. Other (please specify)

[Answer]: A. Pela carga inicial, a partir de variáveis de ambiente obrigatórias (e-mail e senha do administrador inicial): se não existir nenhum administrador ativo, ele é criado; se já existir, nada acontece.

---

## Q2. A prioridade mantém uma chave estável em inglês (`Priority.key`)?

O Desenho de Domínio criou o campo só por simetria com `Status.key` (ADR-006), sem nenhum consumidor. O contrato da API já não o expõe.

- A. Não: a prioridade é identificada pelo seu identificador e pela marcação de padrão; o campo sai do modelo.
- B. Sim: fica no modelo, sem uso hoje, para o caso de uma regra futura depender de prioridade.
- X. Other (please specify)

[Answer]: A. Não: a prioridade é identificada pelo seu identificador e pela marcação de padrão; o campo sai do modelo.

---

## Q3. O administrador pode criar e desativar status?

FR9.2 pede criação, edição e desativação para cada entidade de catálogo. Mas a máquina de transições só conhece as quatro chaves iniciais (Aberto, Em análise, Aguardando solicitante, Encerrado): um status novo não teria transição, e desativar um dos quatro quebraria o ciclo do chamado.

- A. Os quatro status são fixos em existência: o administrador edita o rótulo, e não cria nem desativa status. Registrado como desvio consciente de FR9.2 para Status — as outras três entidades seguem FR9.2 inteiro.
- B. Cada status pertence a uma das quatro fases da máquina: o administrador cria status adicionais dentro de uma fase, edita e desativa, desde que cada fase mantenha um status ativo marcado como padrão, que é o usado nas transições.
- C. O administrador cria e desativa status livremente; status criados ficam fora da máquina de transições e nenhum chamado chega até eles.
- X. Other (please specify)

[Answer]: A. Os quatro status são fixos em existência: o administrador edita o rótulo, e não cria nem desativa status. Registrado como desvio consciente de FR9.2 para Status — as outras três entidades seguem FR9.2 inteiro.

---

## Q4. O campo de busca da barra superior, desenhado nos wireframes, existe?

Nenhum requisito nem história pede busca; ele aparece só no desenho da barra superior.

- A. Não existe no corte: a barra superior fica sem campo de busca.
- B. Existe, buscando por identificador visível ou título entre os chamados que o usuário pode ver — o que o leva para U2, não para U1.
- X. Other (please specify)

[Answer]: A. Não existe no corte: a barra superior fica sem campo de busca.

---

## Q5. O que o login responde quando a conta existe, a senha está certa, mas o usuário está desativado?

AC1.1.2 exige a mesma resposta para e-mail inexistente e senha errada, para não revelar que a conta existe. AC1.1.3 só diz que o usuário desativado não entra.

- A. A mesma resposta de credencial inválida (`AUTH_INVALID_CREDENTIALS`): quem tenta não descobre que a conta existe.
- B. Um código próprio de conta desativada, para que a pessoa saiba que precisa procurar o administrador.
- X. Other (please specify)

[Answer]: A. A mesma resposta de credencial inválida (`AUTH_INVALID_CREDENTIALS`): quem tenta não descobre que a conta existe.

---

## Q6. Há limite de tentativas de login?

Nenhum requisito pede. Sem limite, uma senha pode ser descoberta por tentativa e erro, e a única defesa é o hash lento (NFR7). A revisão de contratos registrou isso como questão em aberto (RSK-06 no plano de entrega).

- A. Sim, simples: mais de 5 tentativas falhas para o mesmo e-mail em 15 minutos bloqueiam novas tentativas desse e-mail até o fim da janela, com resposta 429. Contagem em memória do processo, zerada ao reiniciar — aceitável num sistema só local.
- B. Não: fica sem limite, registrado como risco aceito.
- C. Sim, com atraso progressivo em vez de bloqueio: cada falha seguida dobra o tempo de espera até a próxima tentativa.
- X. Other (please specify)

[Answer]: A. Sim, simples: mais de 5 tentativas falhas para o mesmo e-mail em 15 minutos bloqueiam novas tentativas desse e-mail até o fim da janela, com resposta 429. Contagem em memória do processo, zerada ao reiniciar — aceitável num sistema só local.

---

## Q7. Qual a duração da sessão?

`team.md` diz "duração média, algumas horas", sem refresh token: quando o token expira, o usuário entra de novo.

- A. 8 horas: cobre um turno de trabalho ou de aulas.
- B. 4 horas.
- C. 12 horas.
- X. Other (please specify)

[Answer]: A. 8 horas: cobre um turno de trabalho ou de aulas.

---

## Q8. Qual a política de senha?

O administrador define a senha na criação e na redefinição (FR2.1, FR2.5). Não há outra forma de trocar senha.

- A. Mínimo de 8 caracteres, sem exigência de composição, e máximo de 128. Recusada se for igual ao e-mail.
- B. Mínimo de 12 caracteres, sem exigência de composição.
- C. Mínimo de 8 caracteres, com ao menos uma letra e um número.
- X. Other (please specify)

[Answer]: C. Mínimo de 8 caracteres, com ao menos uma letra e um número.

---

## Q9. O que impede o sistema de ficar sem administrador?

Sem auto-cadastro, se o último administrador ativo for desativado ou rebaixado, ninguém mais consegue administrar o sistema.

- A. O administrador não pode desativar nem rebaixar a si mesmo, e nenhum administrador pode desativar ou rebaixar o último administrador ativo.
- B. Só o último administrador ativo é protegido; um administrador pode desativar ou rebaixar a si mesmo se houver outro ativo.
- C. Nenhuma proteção: a carga inicial recria um administrador a partir das variáveis de ambiente se não houver nenhum ativo.
- X. Other (please specify)

[Answer]: A. O administrador não pode desativar nem rebaixar a si mesmo, e nenhum administrador pode desativar ou rebaixar o último administrador ativo.

---

## Q10. O que acontece ao desativar um setor que ainda tem categorias ativas?

Um setor inativo não aparece como destino de novos chamados (FR3.1), e desativar um item não altera chamados existentes (FR3.7). Mas uma categoria ativa de um setor inativo mandaria chamados novos para esse setor.

- A. A desativação é permitida, e categorias de setor inativo deixam de aparecer para abertura de chamado, sem mudar a situação delas; ao reativar o setor, voltam a aparecer. Não é possível criar usuário nem transferir chamado para setor inativo.
- B. A desativação é recusada enquanto houver categoria ativa vinculada; o administrador desativa as categorias antes.
- C. A desativação do setor desativa em cascata as categorias vinculadas.
- X. Other (please specify)

[Answer]: A. A desativação é permitida, e categorias de setor inativo deixam de aparecer para abertura de chamado, sem mudar a situação delas; ao reativar o setor, voltam a aparecer. Não é possível criar usuário nem transferir chamado para setor inativo.

---

## Consolidated Summary Confirmation

Resumo consolidado das respostas:

- Primeiro administrador: criado pela carga inicial a partir de variáveis de ambiente obrigatórias, só se não houver administrador ativo; nenhum passo manual (Q1).
- Prioridade: sem chave estável; identificada pelo identificador e pela marcação de padrão (Q2).
- Status: os quatro são fixos em existência; o administrador só edita o rótulo, sem criar nem desativar. Desvio consciente de FR9.2 apenas para Status (Q3).
- Busca da barra superior: não existe no corte (Q4).
- Login de usuário desativado: mesma resposta de credencial inválida, sem revelar que a conta existe (Q5).
- Tentativas de login: mais de 5 falhas para o mesmo e-mail em 15 minutos bloqueiam esse e-mail até o fim da janela, com 429; contagem em memória. Requisito novo, com origem na questão aberta da revisão de contratos (Q6).
- Sessão: 8 horas (Q7).
- Senha: mínimo de 8 caracteres, com ao menos uma letra e um número (Q8).
- Último administrador: ninguém desativa nem rebaixa a si mesmo, e ninguém desativa ou rebaixa o último administrador ativo (Q9).
- Setor inativo: a desativação é permitida; categorias dele somem da abertura de chamado sem mudar de situação e voltam ao reativar; não se cria usuário nem se transfere chamado para setor inativo (Q10).

Já fixado antes das perguntas, e incorporado sem pergunta: cinco perfis, com setor obrigatório para Atendente e Gestor; sessão em cookie `httpOnly` sem refresh token, com perfil e situação lidos do banco a cada requisição; sem auto-cadastro nem auto-recuperação de senha; toda a área administrativa no corte mínimo; mudança de setor, perfil ou situação de um usuário sempre permitida em U1, com o efeito na fila decidido em U2.

Decidido por derivação, e registrado como suposição nos artefatos: tamanho máximo de senha de 128 caracteres como limite técnico de entrada; e-mail comparado sem distinção de maiúsculas; nome de setor único e nome de categoria único dentro do setor; exatamente uma prioridade padrão, que não pode ser desativada; tela provisória de entrada para perfis não administradores até U2 existir.

- Looks correct
- Request changes

[Answer]: Looks correct
