# Desenho Funcional — U4 Indicadores (`u4-reporting`) — Plano e Perguntas

Base: `../../../inception/units-generation/unit-of-work.md` (U4: bloco Reporting), `../../../inception/units-generation/unit-of-work-story-map.md` (US6.1 e US6.2), `../../../inception/requirements-analysis/requirements.md` (FR10, FR11), `../../../inception/domain-design/components.md` (bloco Reporting, ADR-005), `../../../inception/contract-design/contract-summary.md` (X-01, API-U4, SVC-04, SVC-05), `../../../ideation/rough-mockups/wireframes.md` (Tela 9) e o desenho e o código já existentes de U1, U2 e U3.

Esta etapa fixa regras e fluxos de U4 em nível de desenho. U4 não é dona de nenhuma entidade e não grava nada: lê chamados pelo serviço público de U2 e rótulos pelo de U1.

Já está fixado e não é perguntado:

- **Somente leitura.** U4 não escreve, não cria tabela e nunca consulta tabela de outra unidade (ADR-005, DB-01).
- **Sem exportação.** Não existe rota de download nem ação de exportar arquivo (FR11.1, AC6.2.2).
- **Sem meta nem limiar.** Os tempos médios são exibidos sem comparação com qualquer alvo (FR10.2, AC6.1.5).
- **Visibilidade.** Todo número respeita o que o perfil que consulta pode ver, aplicado dentro da consulta pelo serviço de U2 (AC6.1.4, NFR1).
- **Período.** Fechado no início e aberto no fim, em UTC; o padrão da tela são os últimos 30 dias (Tela 9). Período sem dados mostra estado vazio explicativo, não zeros sem contexto (FR10.3, AC6.1.3).
- **Contrato.** `countTickets` e `getDurationAverages` entram por adição no serviço público de U2, implementados no Bolt de U4, como o desenho de U2 registrou; a listagem filtrada usa `searchTickets`, que já existe.
- **Acessibilidade.** Cada gráfico vem acompanhado de uma tabela equivalente; todo valor de cartão tem rótulo em texto, nunca só o número (Tela 9).

---

## Q1. Quais são os marcos de "tempo de atendimento" e "tempo de resolução"?

Esta é a pendência que a revisão de requisitos registrou (achado R-06) e que `unit-of-work.md` manda fixar aqui antes de construir. O histórico do chamado registra cada mudança de status, responsável e setor, com momento; o chamado tem abertura e encerramento.

- A. **Atendimento** = da abertura até a primeira vez que o chamado ganha responsável (primeira atribuição no histórico). **Resolução** = da abertura até o encerramento. Mede a espera até alguém pegar o caso e o tempo total até resolver.
- B. **Atendimento** = da abertura até a primeira saída do status Aberto, qualquer que seja o motivo. **Resolução** = da abertura até o encerramento. Parecido com A, mas conta também a transferência como "atendido".
- C. **Atendimento** = soma dos períodos em que o chamado esteve Em análise, excluindo o tempo em Aguardando solicitante. **Resolução** = da abertura até o encerramento. Mede esforço do atendimento, descontando a espera pelo solicitante.
- X. Other (please specify)

[Answer]: A. **Atendimento** = da abertura até a primeira vez que o chamado ganha responsável (primeira atribuição no histórico). **Resolução** = da abertura até o encerramento.

---

## Q2. Que chamados entram na amostra dos tempos médios, e como o período os recorta?

Um chamado aberto e ainda não encerrado não tem tempo de resolução. Um chamado reaberto tem mais de um encerramento.

- A. Entram os chamados **encerrados**, recortados pelo **encerramento** dentro do período; a reabertura faz valer o encerramento mais recente. As contagens continuam recortadas pela abertura.
- B. Entram os chamados **abertos** dentro do período que já foram encerrados; tudo é recortado pela abertura, contagens e tempos. Um chamado aberto no período e encerrado depois entra assim que for encerrado.
- C. Entram todos os chamados abertos no período: os não encerrados contam até agora, como tempo em aberto.
- X. Other (please specify)

[Answer]: A. Entram os chamados **encerrados**, recortados pelo **encerramento** dentro do período; a reabertura faz valer o encerramento mais recente. As contagens continuam recortadas pela abertura.

---

## Q3. O que o Gestor vê nos números do seu setor?

A visibilidade de chamado de U2 dá ao Gestor o setor atual e, em leitura, os chamados que já passaram pelo setor. Para um indicador de desempenho, isso muda o resultado.

- A. Exatamente a visibilidade de U2: setor atual mais os chamados que passaram pelo setor. Um chamado transferido para fora continua contando para o setor de origem.
- B. Só os chamados que estão hoje no setor do Gestor. Um chamado transferido para fora sai dos números, e um que chegou por transferência entra.
- C. Só os chamados que estão hoje no setor, mas os tempos médios contam apenas o período em que o chamado esteve neste setor.
- X. Other (please specify)

[Answer]: A. Exatamente a visibilidade de U2: setor atual mais os chamados que passaram pelo setor.

---

## Q4. O que o painel mostra para cada perfil?

A Tela 9 desenha quatro cartões (Abertos, Em análise, Encerrados, Tempo médio) e dois gráficos de barras: por categoria e por setor. O Gestor enxerga um setor só; o Administrador enxerga todos.

- A. O mesmo painel para os dois, com o gráfico por setor aparecendo só para o Administrador, porque para o Gestor ele teria uma barra só.
- B. O mesmo painel para os dois, com o gráfico por setor sempre presente; para o Gestor ele mostra a distribuição entre o setor atual e os setores por onde os chamados dele passaram.
- C. Painéis diferentes: o Gestor vê cartões e categorias; o Administrador vê tudo, mais um recorte por setor.
- X. Other (please specify)

[Answer]: A. O mesmo painel para os dois, com o gráfico por setor aparecendo só para o Administrador.

---

## Q5. O Administrador também consulta a listagem filtrada?

FR11.1 fala do Gestor, e o contrato restringe a listagem de relatório ao perfil de Gestor. O Administrador já lê todos os chamados pela listagem geral de U2, com filtros de status, categoria e setor, mas sem filtro por período.

- A. Só o Gestor, como está no contrato. O Administrador usa a listagem geral de chamados de U2, que não tem recorte por período.
- B. Gestor e Administrador, igualando a listagem de relatório às contagens e aos tempos, que já são dos dois perfis.
- C. Só o Gestor, e a listagem geral de U2 ganha, por adição, o filtro por período, para o Administrador não ficar sem esse recorte.
- X. Other (please specify)

[Answer]: A. Só o Gestor, como está no contrato. O Administrador usa a listagem geral de chamados de U2, que não tem recorte por período.

---

## Consolidated Summary Confirmation

Resumo consolidado das respostas:

- Tempo de atendimento: da abertura até a primeira vez que o chamado ganha responsável. Tempo de resolução: da abertura até o encerramento. Fecha a pendência que a revisão de requisitos deixou (achado R-06) (Q1).
- Amostra dos tempos médios: chamados encerrados, recortados pela data de encerramento, valendo o encerramento mais recente em caso de reabertura; as contagens continuam recortadas pela data de abertura (Q2).
- Números do Gestor: exatamente a visibilidade de chamado de U2 — setor atual mais os chamados que já passaram pelo setor —, para o painel bater com a listagem que ele consegue abrir (Q3).
- Painel: o mesmo para Gestor e Administrador, com o gráfico por setor aparecendo só para o Administrador (Q4).
- Listagem filtrada por período: só para o Gestor, como o contrato define; o Administrador continua com a listagem geral de chamados de U2 (Q5).

Já fixado antes das perguntas, e incorporado sem pergunta: unidade somente leitura, sem entidade e sem consulta a tabela de outra unidade; nenhuma exportação nem rota de download; tempos exibidos sem meta nem limiar; todo número restrito à visibilidade de quem consulta; período fechado no início e aberto no fim, em UTC, com padrão de últimos 30 dias e estado vazio explicativo; contagens e tempos entram por adição no serviço público de U2, implementados no Bolt de U4; cada gráfico acompanhado de tabela equivalente e todo cartão com rótulo em texto.

- Looks correct
- Request changes

[Answer]: Looks correct
