# Captura de Intenção e Enquadramento — Perguntas

**Modo de interação:** Guide me

## Sources

- [desc] Initial description: "Sistema de Chamados Academicos - academic support ticket system per Escopo projeto TCC.pdf: web app with React/TypeScript/Vite/Shadcn frontend and NestJS/TypeScript/Prisma/Postgres backend, JWT+cookie auth, user profiles (aluno, professor, atendente, gestor, administrador), ticket management, categories and sectors, service queue, notifications, dashboards and indicators, admin area, Docker and CI/CD. All documents in Portuguese (pt-BR); code and code comments in English. Skip AWS authentication."
- [scope] Workflow-selected scope: `feature`.

---

## Q1. Qual é o problema de negócio que este sistema resolve hoje?

O documento de escopo descreve o *que* será construído, mas não registra como as solicitações acadêmicas são tratadas atualmente. Saber isso define qual dor o sistema precisa eliminar.

- A. As solicitações chegam hoje por canais dispersos (e-mail, WhatsApp, presencial) ou sem processo definido, e se perdem sem rastreabilidade.
- B. Já existe um processo formal, mas é manual (planilhas/formulários) e não permite acompanhamento pelo solicitante.
- C. Já existe um sistema de chamados, porém inadequado (genérico, caro ou sem aderência ao contexto acadêmico), e será substituído.
- D. Not yet defined — é um projeto acadêmico (TCC) e o problema é tratado como cenário de referência, sem instituição real por trás.
- X. Other (please specify)

[Answer]: A. As solicitações chegam hoje por canais dispersos (e-mail, WhatsApp, presencial) ou sem processo definido, e se perdem sem rastreabilidade.

---

## Q2. Quem é o usuário principal e qual dor ele sente hoje?

O escopo prevê cinco perfis (Aluno, Professor, Atendente, Gestor, Administrador). Precisamos saber para quem o sistema é otimizado primeiro, porque isso ordena o que será construído antes.

- A. O **Aluno** — sofre por não saber o andamento da sua solicitação e precisar reabrir o pedido várias vezes.
- B. O **Atendente** dos setores — sofre com fila desorganizada, retrabalho e falta de histórico do que já foi respondido.
- C. O **Gestor** — sofre por não ter visibilidade de volume, tempo de atendimento e gargalos por setor.
- D. Aluno e Atendente com peso equivalente: o valor central é a comunicação entre os dois lados.
- X. Other (please specify)

[Answer]: D. Aluno e Atendente com peso equivalente: o valor central é a comunicação entre os dois lados.

---

## Q3. O que caracteriza sucesso para este projeto e quais métricas importam?

Cada opção define o que será medido nos dashboards (seção 3.6 do escopo) e o que a validação do projeto precisa comprovar.

- A. **Entregáveis do TCC**: sistema funcional, documentado e demonstrável, cobrindo os itens da seção 10 do escopo. Métricas = cobertura de entregáveis e de requisitos implementados.
- B. **Desempenho operacional**: redução do tempo médio de atendimento e de resolução. Métricas = tempo de primeira resposta e tempo até encerramento.
- C. **Adoção**: percentual de solicitações que passam a entrar pelo sistema em vez dos canais informais. Métricas = volume registrado e uso por perfil.
- D. **Entregáveis do TCC como critério primário**, com tempo de atendimento, adoção e avaliação implementados como indicadores do produto, sem meta numérica firmada agora.
- X. Other (please specify)

[Answer]: A. **Entregáveis do TCC**: sistema funcional, documentado e demonstrável, cobrindo os itens da seção 10 do escopo. Métricas = cobertura de entregáveis e de requisitos implementados.

---

## Q4. Qual é o gatilho desta iniciativa — por que agora?

Registrar o gatilho evita que decisões futuras (prazo, profundidade, o que cortar) sejam tomadas sem contexto.

- A. Trabalho de Conclusão de Curso (TCC): há prazo acadêmico e banca avaliadora a atender.
- B. Demanda real de uma instituição de ensino que precisa do sistema em produção.
- C. Construção de portfólio ou prova técnica, sem prazo externo rígido.
- D. Not yet defined.
- X. Other (please specify)

[Answer]: A. Trabalho de Conclusão de Curso (TCC): há prazo acadêmico e banca avaliadora a atender.

---

## Q5. Quem são os stakeholders deste projeto e o que cada um cobra? (selecione todas que se aplicam)

Distinga as pessoas **do projeto** (quem avalia, orienta, aprova) das personas **do produto** (Aluno, Professor, Atendente, Gestor, Administrador), que já constam do escopo.

- A. Orientador(a) acadêmico(a) — cobra rigor metodológico, documentação e defensabilidade das decisões técnicas.
- B. Banca avaliadora — cobra escopo entregue, funcionamento demonstrável e qualidade da documentação.
- C. Representante da instituição de ensino (coordenação, secretaria ou TI) — cobra aderência ao processo real e viabilidade de uso.
- D. Somente você, como autor e desenvolvedor único — cobra viabilidade de execução no prazo.
- X. Other (please specify)

[Answer]: D. Somente você, como autor e desenvolvedor único — cobra viabilidade de execução no prazo.

---

## Q6. Quem decide escopo e prioridade, e quem apenas influencia?

Isso define a quem eu levo as decisões nos pontos de aprovação ao longo do projeto.

- A. Você decide sozinho; o orientador influencia com recomendações.
- B. Você propõe e o orientador aprova formalmente as decisões de escopo.
- C. A instituição de ensino decide o escopo; você executa.
- D. Decisão compartilhada entre você e o orientador, com a banca como validação final.
- X. Other (please specify)

[Answer]: A. Você decide sozinho; o orientador influencia com recomendações.

---

## Q7. Há exigência de comunicação, relatório ou cadência de acompanhamento?

Se houver entregas periódicas (parciais, apresentações, reuniões de orientação), o planejamento de entrega precisa respeitá-las.

- A. Sim: reuniões periódicas de orientação com entregas parciais em datas definidas.
- B. Sim: entregas em marcos formais (qualificação, pré-banca, defesa final), sem cadência semanal.
- C. Sim: apenas o documento final de TCC e a defesa; nenhum acompanhamento intermediário formal.
- D. Não há exigência formal de comunicação; o acompanhamento é informal.
- X. Other (please specify)

[Answer]: D. Não há exigência formal de comunicação; o acompanhamento é informal.

---

## Q8. O escopo selecionado corresponde à fronteira de produto pretendida?

O fluxo foi iniciado com o escopo `feature`, que executa o ciclo completo (32 etapas, da ideação à operação). Esta pergunta confirma **a fronteira do produto**, não o escopo do fluxo de trabalho.

- A. Confirmo o escopo `feature` e a fronteira descrita no documento: Frontend + Backend + banco + autenticação + CI/CD, sem app mobile nativo, sem automação por IA e sem integrações não especificadas.
- B. Confirmo o escopo `feature`, mas a fronteira do produto é **menor**: apenas o núcleo de chamados (autenticação, abertura, acompanhamento, atendimento), deixando dashboards, notificações e administração para depois.
- C. Confirmo o escopo `feature`, mas a fronteira do produto é **maior** do que o documento descreve (há itens adicionais a incluir).
- D. A fronteira do produto está correta, mas quero rodar um fluxo de trabalho mais enxuto do que `feature`.
- X. Other (please specify)

[Answer]: A. Confirmo o escopo `feature` e a fronteira descrita no documento: Frontend + Backend + banco + autenticação + CI/CD, sem app mobile nativo, sem automação por IA e sem integrações não especificadas.

---

## Q9. (Follow-up) Orientador e banca existem como stakeholders deste projeto?

Há uma inconsistência entre as respostas: a Q4 indica que o gatilho é o TCC, "com prazo acadêmico e **banca avaliadora** a atender"; a Q6 diz que "o **orientador** influencia com recomendações"; mas a Q5 registra **somente você** como stakeholder. Preciso saber quem realmente entra no mapa de stakeholders antes de escrever os artefatos.

- A. Orientador e banca existem e devem constar no mapa (orientador influencia, banca valida no final), mas nenhum dos dois participa das aprovações deste fluxo de trabalho — você aprova sozinho.
- B. Apenas o orientador existe como stakeholder além de você; não há banca formal a considerar neste projeto.
- C. Não há orientador nem banca envolvidos: o TCC foi escolhido como gatilho apenas pelo prazo, e você é de fato o único stakeholder.
- D. Orientador e banca existem e têm autoridade de aprovação sobre o escopo — a resposta da Q6 deve ser corrigida.
- X. Other (please specify)

[Answer]: A. Orientador e banca existem e devem constar no mapa (orientador influencia, banca valida no final), mas nenhum dos dois participa das aprovações deste fluxo de trabalho — você aprova sozinho.

---

## Q10. Devem ser fixadas metas numéricas para os indicadores de produto?

Refere-se a tempo de atendimento, tempo de resolução e avaliação dos atendimentos. A resposta define se esses indicadores viram apenas visualização ou requisito verificável.

- A. Sem metas numéricas nesta fase: os indicadores são calculados e exibidos, sem limiar acordado.
- B. Metas serão definidas mais adiante, junto dos requisitos não funcionais.
- C. Fixar agora metas de referência (por exemplo: primeira resposta em até 1 dia útil e resolução em até 5 dias úteis).
- D. Not applicable — os indicadores não precisam de meta para o objetivo deste projeto.
- X. Other (please specify)

[Answer]: D. Not applicable — os indicadores não precisam de meta para o objetivo deste projeto.

---

## Q11. Existe uma instituição de ensino real que vai operar o sistema?

Isso muda a exigência sobre aderência a processos reais e sobre tratamento de dados pessoais (LGPD).

- A. Não: o contexto é de referência acadêmica, modelado a partir de uma instituição genérica.
- B. Sim, uma instituição real existe, mas não participa do projeto — serve apenas como referência de processo.
- C. Sim, uma instituição real que pretende usar o sistema em produção.
- D. Not yet defined.
- X. Other (please specify)

[Answer]: D. Not yet defined.

---

## Q12. Qual é a data-limite acadêmica do projeto?

O planejamento de entrega usa esse horizonte para dimensionar quantas etapas cabem antes da conclusão.

- A. Not yet defined — a data será informada mais adiante.
- B. Fim do semestre letivo corrente (horizonte aproximado de 4 meses).
- C. Fim do próximo semestre letivo (horizonte aproximado de 10 meses).
- D. Existe prazo, mas ele não deve restringir o planejamento nesta etapa.
- X. Other (please specify)

[Answer]: D. Existe prazo, mas ele não deve restringir o planejamento nesta etapa.

---

## Q13. Qual é o ambiente de execução alvo?

O documento de escopo prevê ambientes de desenvolvimento, homologação e produção. Esta resposta define até onde a implantação precisa chegar de verdade.

- A. Apenas execução local via Docker / Docker Compose; sem implantação em servidor externo.
- B. Docker local para desenvolvimento, mais implantação em servidor ou VPS próprio para homologação e produção.
- C. Docker mais uma plataforma gerenciada de aplicação (por exemplo Render, Railway ou Fly.io) para homologação e produção.
- D. Not yet defined — decidir nas etapas de infraestrutura e provisionamento.
- X. Other (please specify)

[Answer]: A. Apenas execução local via Docker / Docker Compose; sem implantação em servidor externo.

---

## Q14. Quais são os interesses dos perfis Professor, Gestor e Administrador?

Os cinco perfis constam da descrição da iniciativa, mas só Aluno e Atendente tiveram sua dor registrada até aqui.

- A. Professor abre e acompanha chamados como solicitante (igual ao Aluno); Gestor acompanha indicadores e redistribui chamados entre setores; Administrador configura o sistema (usuários, perfis, setores, categorias, status, prioridades).
- B. Professor abre chamados e também atende os de sua área; Gestor e Administrador conforme a opção A.
- C. Apenas o Administrador está claro (configuração do sistema); Professor e Gestor ficam para as histórias de usuário.
- D. Not yet defined — detalhar todos os três nas histórias de usuário.
- X. Other (please specify)

[Answer]: A. Professor abre e acompanha chamados como solicitante (igual ao Aluno); Gestor acompanha indicadores e redistribui chamados entre setores; Administrador configura o sistema (usuários, perfis, setores, categorias, status, prioridades).

---

## Q15. Um representante da instituição de ensino participa do projeto?

- A. Não participa; nenhum representante institucional está envolvido.
- B. Participa informalmente, como fonte de informação sobre o processo real.
- C. Participa formalmente, com voz sobre os requisitos.
- D. Not yet defined.
- X. Other (please specify)

[Answer]: A. Não participa; nenhum representante institucional está envolvido.

---

## Q16. Quando ocorre a avaliação formal pela banca?

- A. Not yet defined — a data será informada quando for agendada.
- B. Coincide com o fim do prazo acadêmico indicado na Q12.
- C. Ocorre algumas semanas após a entrega do documento final.
- D. A data não impacta o planejamento; o marco relevante é a entrega do sistema.
- X. Other (please specify)

[Answer]: D. A data não impacta o planejamento; o marco relevante é a entrega do sistema.

---

## Q17. O sistema deve ser projetado como se fosse operar em uma instituição real?

A Q11 deixou em aberto se haverá instituição real. Esta resposta define o rigor exigido sobre dados pessoais (LGPD) e sobre aderência a processos institucionais.

- A. Não haverá instituição real: contexto acadêmico de referência. Proteção de dados pessoais tratada como boa prática de engenharia, sem exigência regulatória formal.
- B. Haverá instituição real: tratar conformidade com a LGPD e aderência a processos institucionais como requisito de primeira classe.
- C. Segue indefinido, mas projete assumindo o caso mais exigente (como se fosse operar em instituição real).
- D. Not yet defined — decidir na etapa de requisitos.
- X. Other (please specify)

[Answer]: X. Other (please specify) — "Nao sera operado por uma instituicao real" (resposta do usuário, verbatim).

---

## Q18. Até onde vai o pipeline de CI/CD?

A fronteira confirmada inclui CI/CD (Q8), mas o ambiente alvo é apenas local via Docker (Q13). Esta resposta define o alcance real das etapas de operação deste fluxo.

- A. Apenas integração contínua: build, lint e testes automatizados a cada push ou pull request. Sem publicação de imagens e sem implantação.
- B. Integração contínua mais publicação de imagens Docker em um registro, sem implantação automática.
- C. Integração contínua mais implantação automatizada em ambiente containerizado local (script ou `docker compose`), simulando homologação e produção na mesma máquina.
- D. Pipeline completo com implantação em servidor externo — isso contradiz a Q13; escolha esta opção se quiser rever aquela resposta.
- X. Other (please specify)

[Answer]: A. Apenas integração contínua: build, lint e testes automatizados a cada push ou pull request. Sem publicação de imagens e sem implantação.

---

## Consolidated Summary Confirmation

Resumo consolidado das respostas (revisado apos as perguntas de acompanhamento Q10-Q18):

- Problema: solicitacoes academicas chegam por canais dispersos (e-mail, WhatsApp, presencial) ou sem processo definido, e se perdem sem rastreabilidade (Q1).
- Usuario principal: Aluno e Atendente com peso equivalente; o valor central e a comunicacao entre solicitante e atendente (Q2).
- Demais perfis: Professor abre e acompanha chamados como solicitante; Gestor acompanha indicadores e redistribui chamados entre setores; Administrador configura o sistema (Q14).
- Sucesso: entregaveis do TCC - sistema funcional, documentado e demonstravel, cobrindo a secao 10 do documento de escopo (Q3). Os indicadores de produto nao terao metas numericas (Q10).
- Gatilho: Trabalho de Conclusao de Curso, com prazo academico e banca avaliadora (Q4). O prazo nao restringe o planejamento nesta etapa e a data da banca nao impacta o plano (Q12, Q16).
- Stakeholders: voce, como autor e desenvolvedor unico (Q5), mais orientador e banca, que constam no mapa mas nao participam das aprovacoes deste fluxo (Q9). Nenhum representante da instituicao participa (Q15).
- Decisao de escopo: voce decide sozinho; o orientador influencia com recomendacoes (Q6, Q9).
- Cadencia: nao ha exigencia formal de comunicacao; o acompanhamento e informal (Q7).
- Fronteira de produto: escopo `feature` confirmado - Frontend + Backend + banco + autenticacao + CI/CD; fora do escopo inicial: app mobile nativo, automacao por IA e integracoes nao especificadas (Q8).
- Ambiente de execucao: apenas local, via Docker / Docker Compose, sem implantacao em servidor externo (Q13).
- Operacao real: o sistema nao sera operado por uma instituicao real (Q17).
- CI/CD: apenas integracao continua - build, lint e testes automatizados a cada push ou pull request, sem publicacao de imagens e sem implantacao (Q18).

- Looks correct
- Request changes

[Answer]: Looks correct

## Assumption Confirmation

Após as respostas Q10-Q16, restam as seguintes suposições em aberto, todas em `intent-statement.md`:

1. Ainda não está definido se existe uma instituição de ensino real que operará o sistema (Q11).
2. O ambiente de execução alvo é apenas local via Docker (Q13), enquanto a fronteira confirmada inclui CI/CD (Q8); falta definir até onde o pipeline vai — apenas build e testes, ou também publicação de imagens e provisionamento de ambientes.

`stakeholder-map.md` não tem mais suposições em aberto.

- A. Accept assumptions
- B. Convert to follow-up questions

[Answer]: B. Convert to follow-up questions
