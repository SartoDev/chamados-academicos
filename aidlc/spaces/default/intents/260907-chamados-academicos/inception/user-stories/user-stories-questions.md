# Histórias de Usuário — Plano e Perguntas

Base: `../requirements-analysis/requirements.md` (12 grupos funcionais, 9 não funcionais) e `../practices-discovery/team-practices.md` (postura de testes e cobertura por requisito).

## Plano

**Abordagem de personas.** Uma persona por perfil de acesso, com nome, papel, objetivos, dores e contexto de uso. Os cinco perfis de `requirements.md` FR2.3 são Aluno, Professor, Atendente, Gestor e Administrador. A Q1 abaixo decide se Aluno e Professor viram uma persona só ou duas.

**Formato das histórias.** "Como [persona], quero [ação], para [benefício]", com identificador estável `US{grupo}.{sequência}` e critérios de aceitação em Given/When/Then, cada um com identificador `AC{grupo}.{sequência}.{ordem}`. Os critérios seguem a regra de fase da Concepção: cada um precisa de um resultado verificável, sem linguagem ambígua.

**Priorização.** Cada história recebe prioridade MoSCoW herdada do grupo de requisitos que a origina: Must para FR1 a FR8, Should para FR9, Could para FR10 a FR12. O corte de MVP em si é decidido no Planejamento de Entrega; a prioridade aqui apenas informa essa decisão.

**Rastreabilidade.** Ao final, `traceability.json` lista cada `FR` e `NFR` de `requirements.md` com a história que o cobre, ou uma justificativa explícita quando não houver.

**Elaboração em grupo.** Depois do rascunho, o designer, o desenvolvedor e o engenheiro de qualidade revisam de forma independente e cega, cada um pelo seu ângulo: experiência de uso, viabilidade de implementação e testabilidade dos critérios.

---

## Q1. Aluno e Professor viram uma persona ou duas?

Os requisitos dão a eles comportamento idêntico como solicitantes (suposição A4 de `requirements.md`). A diferença é de contexto, não de permissão.

- A. Duas personas distintas: o contexto e as dores são diferentes o bastante para justificar, mesmo com permissões iguais.
- B. Uma persona única "Solicitante", com nota registrando que abrange Aluno e Professor.
- C. Uma persona principal (Aluno) e uma variante secundária (Professor) descrita como diferença sobre a primeira.
- D. Not yet defined.
- X. Other (please specify)

[Answer]: B. Uma persona única "Solicitante", com nota registrando que abrange Aluno e Professor.

---

## Q2. Como as histórias devem ser agrupadas?

Define a numeração `US{grupo}.{sequência}` e a ordem em que o documento é lido.

- A. Por área funcional, espelhando os grupos de requisitos (FR1 vira US1, FR2 vira US2, e assim por diante). Rastreabilidade direta.
- B. Por persona: todas as histórias do Solicitante, depois do Atendente, depois do Gestor, depois do Administrador.
- C. Por jornada: abrir e acompanhar, atender, administrar.
- D. Not yet defined.
- X. Other (please specify)

[Answer]: B. Por persona: todas as histórias do Solicitante, depois do Atendente, depois do Gestor, depois do Administrador.

---

## Q3. Qual granularidade de história?

Muda quantas histórias existem e o tamanho de cada uma.

- A. Fina: uma história por ação de usuário (abrir chamado, listar chamados, ver detalhe, enviar mensagem são quatro histórias). Mais histórias, cada uma pequena e independente.
- B. Média: uma história por capacidade coerente (gerenciar meus chamados agrupa listar, filtrar e ver detalhe). Menos histórias, cada uma com mais critérios.
- C. Grossa: uma história por grupo de requisitos, com muitos critérios de aceitação cada.
- D. Not yet defined.
- X. Other (please specify)

[Answer]: B. Média: uma história por capacidade coerente (gerenciar meus chamados agrupa listar, filtrar e ver detalhe).

---

## Q4. As histórias dos itens Could have são escritas agora?

FR10 (dashboard), FR11 (relatórios) e FR12 (avaliação) são Could have e podem nunca ser construídos.

- A. Sim, todas, com prioridade Could: o documento fica completo e serve de material do TCC mesmo que o código não venha.
- B. Sim, mas em versão resumida: uma história por grupo, sem detalhar critérios de aceitação.
- C. Não: escrever apenas Must e Should, e registrar os Could como pendência explícita.
- D. Not yet defined.
- X. Other (please specify)

[Answer]: A. Sim, todas, com prioridade Could: o documento fica completo e serve de material do TCC mesmo que o código não venha.

---

## Q5. Como os requisitos não funcionais entram nas histórias?

NFR1 a NFR9 tratam de autorização, envelope de erro, acessibilidade, responsividade, senha e ambiente.

- A. Como critérios de aceitação dentro das histórias que eles afetam, mais uma seção de critérios transversais que valem para todas.
- B. Como histórias próprias, uma por NFR relevante.
- C. Apenas como seção de critérios transversais, sem entrar nas histórias individuais.
- D. Not yet defined.
- X. Other (please specify)

[Answer]: B. Como histórias próprias, uma por NFR relevante.

---

## Q6. As três lacunas apontadas na revisão dos requisitos devem ser fechadas aqui?

A revisão de `requirements.md` registrou, e você aceitou como risco: falta o requisito de alteração de prioridade pelo atendente (R-01); falta o ator das transições para "Aguardando solicitante" e de volta (R-03); e não está dito se a atribuição pelo gestor muda o status (R-04). Escrever a história obriga a decidir.

- A. Sim, fechar as três aqui: as histórias definem ator e resultado, e a decisão fica registrada como critério de aceitação.
- B. Fechar apenas R-01 (alteração de prioridade) aqui; R-03 e R-04 ficam para o desenho funcional.
- C. Não fechar nenhuma aqui: escrever as histórias sem esses comportamentos e deixar tudo para o desenho funcional.
- D. Not yet defined.
- X. Other (please specify)

[Answer]: A. Sim, fechar as três aqui: as histórias definem ator e resultado, e a decisão fica registrada como critério de aceitação.

---

## Q7. (Follow-up) Quais NFR viram história de verdade?

A Q5 escolheu "uma história própria por NFR relevante". A regra de fase da Concepção exige que toda história identifique ator, ação e valor de negócio, e a orientação de histórias trata a história técnica sem ator como anti-padrão. Cinco dos nove NFR não têm ator de usuário:

- NFR1 (filtro do ator na consulta ao banco) — mecanismo interno.
- NFR3 (envelope único de erro) — contrato técnico.
- NFR7 (hash de senha) — implementação.
- NFR8 (subir com um comando) — ambiente de desenvolvimento.
- NFR9 (segredos e variáveis de ambiente) — infraestrutura.

Os outros quatro têm ator: NFR2 (teste negativo de autorização protege o usuário de ver o que não é dele), NFR4 (404 em vez de 403 protege a existência do registro), NFR5 (acessibilidade por teclado) e NFR6 (uso em celular).

- A. Escrever história apenas para os quatro que têm ator de usuário (NFR2, NFR4, NFR5, NFR6); os outros cinco viram uma seção de critérios técnicos transversais.
- B. Escrever história para os nove, aceitando que cinco delas terão o ator "sistema" ou "desenvolvedor".
- C. Escrever história apenas para acessibilidade e responsividade (NFR5, NFR6); todos os demais viram critérios transversais.
- D. Voltar atrás na Q5 e tratar todos os NFR como critérios transversais, sem história alguma.
- X. Other (please specify)

[Answer]: A. Escrever história apenas para os quatro que têm ator de usuário (NFR2, NFR4, NFR5, NFR6); os outros cinco viram uma seção de critérios técnicos transversais.

---

## Consolidated Summary Confirmation

Resumo consolidado do plano, das respostas e da triagem do grupo:

- Personas: uma persona unica "Solicitante", abrangendo Aluno e Professor. Mais Atendente, Gestor e Administrador - quatro personas no total (Q1).
- Agrupamento: por persona (Q2). Granularidade media - uma historia por capacidade coerente (Q3).
- Itens Could have: escritos por completo, com prioridade Could (Q4).
- Requisitos nao funcionais: NFR2, NFR4, NFR5 e NFR6 viram historias proprias; NFR1, NFR3, NFR7, NFR8 e NFR9 viram criterios transversais (Q5, Q7).
- Lacunas da revisao de requisitos: as tres fechadas como criterio de aceitacao (Q6).
- Transferencia entre setores: devolve o chamado ao status Aberto alem de remover o responsavel, fechando o beco sem saida em que um chamado transferido ficava sem dono e sem ninguem poder assumi-lo (Q8).
- Interface administrativa: toda ela entra no corte minimo, superando a classificacao Should have de FR9 (Q9).
- Encerramento: o solicitante pode encerrar o proprio chamado a qualquer momento, e continua podendo reabrir dentro da janela (Q10).
- Regra em project.md sobre a area administrativa: sera corrigida no ritual de aprendizados desta etapa (Q11).

Integrado das tres revisoes sem pergunta, por ter resposta tecnicamente clara:

- Seis criterios transversais novos: regra 403 para acao negada e 404 para recurso invisivel (CT6), estados de tela (CT7), comportamento de formulario (CT8), gravacao de notificacao independente da tela (CT9), perfil lido do banco a cada requisicao (CT10), mensagens derivadas do code de erro (CT11).
- Janela de reabertura precisada em 72 horas exatas, resolvendo a contradicao de fronteira entre "3 dias" e "no 4o dia".
- Criterios meta ("existe um teste automatizado afirmando isso") reescritos em termos de comportamento observavel.
- Casa de verificacao declarada para os oito criterios que nao tem teste automatizado possivel sem ferramenta de navegador.
- Cobertura acrescentada para FR2.2 e FR2.3, que estavam sem criterio.
- Cinco consequencias de modelo registradas para o desenho de dominio: registro de passagem por setor, chave estavel de status, relogio injetavel, perfil por requisicao, e enumeracao de rotas.
- Nota de heranca: o Gestor executa tudo o que o Atendente executa, sem repetir as historias.

- Looks correct
- Request changes

[Answer]: Looks correct

---

## Q8. Beco sem saída na transferência entre setores

O desenvolvedor encontrou um estado do qual não se sai. A sequência: um chamado em **Em análise** com responsável é transferido para outro setor; a transferência remove o responsável (AC2.4.1) mas não muda o status. Só que assumir (AC2.2.1) e atribuir (AC3.1.1) só operam sobre chamado **Aberto**. Resultado: o chamado fica em Em análise, sem dono, e ninguém consegue pegá-lo.

- A. A transferência devolve o chamado ao status **Aberto**, além de remover o responsável. Fica coerente com "volta para a fila como chamado novo".
- B. Assumir e atribuir passam a aceitar também chamado em **Em análise** sem responsável, mantendo o status.
- C. A transferência só é permitida a partir de chamado **Aberto**; para transferir um chamado em andamento é preciso primeiro devolvê-lo à fila.
- D. Not yet defined.
- X. Other (please specify)

[Answer]: A. A transferência devolve o chamado ao status **Aberto**, além de remover o responsável.

---

## Q9. A interface administrativa entra no corte mínimo?

Contradição entre artefatos. A regra afirmada em `project.md` diz que o corte mínimo exige apenas que os catálogos sejam **administráveis pelo modelo de dados**, com a interface vindo depois. Mas FR2.1 (o administrador cadastra usuários) é Must, e sem auto-cadastro nem recuperação de senha, ninguém entra no sistema sem essa interface. O desenvolvedor estimou: com a interface administrativa no corte mínimo, o Must fica em 145–190 horas; sem ela, 105–135 horas.

- A. A interface de **usuários** entra no corte mínimo; a interface de **catálogos** (setores, categorias, status, prioridades) fica Should, atendida no início por carga inicial de dados.
- B. Toda a interface administrativa entra no corte mínimo. Custo maior, mas o sistema fica administrável de ponta a ponta.
- C. Nenhuma interface administrativa no corte mínimo: usuários e catálogos entram por carga inicial e script, e a interface vem depois.
- D. Not yet defined.
- X. Other (please specify)

[Answer]: B. Toda a interface administrativa entra no corte mínimo.

---

## Q10. O solicitante pode encerrar o próprio chamado?

Os wireframes desenharam essa ação para o solicitante (Tela 5). Os requisitos deram o encerramento apenas ao atendente e ao gestor (FR5.7), e o rascunho das histórias seguiu os requisitos. Um dos dois está errado.

- A. Não: apenas atendente e gestor encerram. O solicitante que considera resolvido apenas para de responder, e o atendente encerra. O wireframe é corrigido.
- B. Sim: o solicitante também encerra o próprio chamado, a qualquer momento. Ele continua podendo reabrir dentro da janela de 3 dias.
- C. Sim, mas apenas quando o chamado está em **Aguardando solicitante** — ou seja, quando a bola está com ele.
- D. Not yet defined.
- X. Other (please specify)

[Answer]: B. Sim: o solicitante também encerra o próprio chamado, a qualquer momento.

---

## Q11. (Follow-up) A regra afirmada sobre a área administrativa fica ou cai?

A Q9 colocou toda a interface administrativa no corte mínimo. Mas `aidlc/spaces/default/memory/project.md` carrega uma regra que você afirmou em etapa anterior: *"A area administrativa e classificada como Should have, nao Must have: o corte minimo exige apenas que categorias e setores sejam administraveis pelo modelo de dados; a interface dedicada de administracao vem depois."* Essa regra entra no contexto de toda etapa seguinte. Deixar as duas coisas valendo cria contradição permanente.

- A. A decisão da Q9 vale para este projeto: as histórias da área administrativa são Must. Registro nos artefatos que a classificação anterior foi superada, e a regra em `project.md` fica desatualizada até ser corrigida no ritual de aprendizados.
- B. Manter a regra afirmada: a interface administrativa volta a ser Should have, e o corte mínimo é atendido por carga inicial de dados — ou seja, a Q9 passa a valer como a opção A daquela pergunta.
- C. A decisão da Q9 vale, e no ritual de aprendizados desta etapa eu registro a correção explícita da regra em `project.md`.
- D. Not yet defined.
- X. Other (please specify)

[Answer]: C. A decisão da Q9 vale, e no ritual de aprendizados desta etapa eu registro a correção explícita da regra em `project.md`.

---
