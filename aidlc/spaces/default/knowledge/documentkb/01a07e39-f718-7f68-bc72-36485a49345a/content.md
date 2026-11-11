Sistema de Chamados Acad�micos
1. Vis�o Geral
O projeto consiste no desenvolvimento de um Sistema de Chamados Acad�micos, destinado a centralizar e organizar solicita��es realizadas por alunos, professores e demais usu�rios da institui��o de ensino. O sistema permitir� registrar, acompanhar e gerenciar chamados acad�micos, proporcionando maior organiza��o, rastreabilidade e transpar�ncia no processo de atendimento.
2. Objetivo
O principal objetivo do sistema � fornecer uma plataforma para abertura, acompanhamento e gerenciamento de solicita��es acad�micas, permitindo que os usu�rios acompanhem o andamento de seus chamados e que os respons�veis pelos setores possam gerenciar e atender essas solicita��es.
3. Escopo do Produto
O sistema ser� composto por uma aplica��o web dividida em Frontend e Backend, contemplando as seguintes �reas principais:
3.1 Gest�o de Usu�rios
O sistema dever� possuir mecanismos para autentica��o e gerenciamento dos usu�rios, contemplando diferentes perfis de acesso. Perfis inicialmente previstos:
 Aluno;  Professor;  Atendente;  Gestor;  Administrador.

3.2 Gest�o de Chamados
O sistema dever� permitir a cria��o e gerenciamento de chamados acad�micos.
De forma geral, dever� contemplar:
 Abertura de chamados;  Consulta de chamados;  Acompanhamento do andamento;  Altera��o de status;  Atribui��o de respons�veis;  Transfer�ncia entre setores;  Comunica��o entre solicitante e atendente;  Hist�rico das altera��es;  Anexos;  Encerramento dos chamados.
Os detalhes das funcionalidades ser�o especificados posteriormente por meio de hist�rias de usu�rio.
3.3 Categorias e Setores
O sistema dever� permitir organizar os chamados de acordo com categorias e setores respons�veis pelo atendimento.
Exemplos de categorias:
 Matr�cula;  Notas;  Frequ�ncia;  Documenta��o;  Financeiro;  Est�gio;  TCC;  Biblioteca;  Sistemas acad�micos;  Outros.
As categorias e setores dever�o ser administr�veis de acordo com as permiss�es do sistema.
3.4 Atendimento

O sistema dever� fornecer recursos para que os respons�veis possam gerenciar os chamados recebidos, permitindo acompanhar a fila de atendimento, assumir ou receber chamados e interagir com os solicitantes.
3.5 Notifica��es
O sistema dever� possuir mecanismos de notifica��o para informar os usu�rios sobre eventos relevantes relacionados aos seus chamados.
Os canais e eventos de notifica��o ser�o definidos durante o detalhamento das hist�rias de usu�rio.
3.6 Dashboard e Indicadores
O sistema dever� possuir dashboards e indicadores para acompanhamento dos chamados e do atendimento.
Entre os indicadores previstos est�o:
 Quantidade de chamados;  Chamados por status;  Chamados por categoria;  Chamados por setor;  Tempo de atendimento;  Tempo de resolu��o;  Avalia��o dos atendimentos.
3.7 Administra��o
O sistema dever� possuir uma �rea administrativa para gerenciamento das principais configura��es da aplica��o, incluindo:
 Usu�rios;  Perfis e permiss�es;  Setores;  Categorias;  Status;  Prioridades;  Configura��es gerais.

4. Tecnologias
4.1 Frontend
 React  TypeScript  Vite  Shadcn como biblioteca de componentes  React Hook Form (RHF) para gerenciamento de estado  React Query para gerenciamento de requisi��es
As tecnologias complementares poder�o ser definidas durante o desenvolvimento.
4.2 Backend
 NestJS  TypeScript  API REST  Prisma para ORM  Postgres  JWT e Cookie para autentica��o
4.3 Infraestrutura
 Docker;  CI/CD;  Ambiente de desenvolvimento;  Ambiente de homologa��o;  Ambiente de produ��o;  Sistema de logs e monitoramento.
5. Principais M�dulos
O sistema ser� inicialmente dividido nos seguintes m�dulos:
1. Autentica��o

2. Usu�rios 3. Chamados 4. Atendimento 5. Categorias 6. Setores 7. Notifica��es 8. Dashboard 9. Relat�rios 10.Administra��o
A divis�o poder� ser ajustada conforme o detalhamento das hist�rias de usu�rio.
6. Escopo do Frontend
O Frontend ser� respons�vel pela interface de intera��o dos usu�rios com o sistema.
Dever� contemplar:
 Autentica��o;  Dashboard;  Abertura de chamados;  Listagem e consulta de chamados;  Visualiza��o dos detalhes;  Comunica��o dentro dos chamados;  Gerenciamento de chamados para atendentes;  Administra��o do sistema;  Visualiza��o de indicadores;  Notifica��es;  Controle de acesso conforme o perfil do usu�rio;  Interface responsiva.
7. Escopo do Backend
O Backend ser� respons�vel por disponibilizar a API e concentrar as regras de neg�cio do sistema.
Dever� contemplar:

 Autentica��o e autoriza��o;  Gerenciamento de usu�rios;  Gerenciamento de chamados;  Gerenciamento de categorias e setores;  Controle de status e prioridades;  Comunica��o e hist�rico dos chamados;  Gerenciamento de anexos;  Notifica��es;  Indicadores e relat�rios;  Persist�ncia dos dados;  Auditoria;  Integra��o com servi�os externos, quando necess�rio.
8. Fora do Escopo Inicial
N�o fazem parte do escopo inicial, salvo se posteriormente aprovados:
 Aplicativo mobile nativo;  Integra��es n�o especificadas;  Funcionalidades n�o relacionadas ao gerenciamento de chamados acad�micos;  Automa��o avan�ada baseada em IA;  Funcionalidades que n�o estejam contempladas nas hist�rias de usu�rio aprovadas.
9. Hist�rias de Usu�rio
Os requisitos detalhados do sistema ser�o definidos posteriormente por meio de hist�rias de usu�rio.
As hist�rias dever�o ser derivadas deste documento de escopo e dever�o detalhar:
 Ator;  Necessidade;  Comportamento esperado;  Regras de neg�cio;  Crit�rios de aceita��o;  Depend�ncias, quando aplic�vel.

O conjunto de hist�rias de usu�rio ser� utilizado como base para o planejamento e desenvolvimento do sistema.
10. Entreg�veis
Ao final do projeto, espera-se disponibilizar:
 Aplica��o Web (Frontend);  API Backend;  Banco de dados;  Sistema de autentica��o e autoriza��o;  Documenta��o da API;  Configura��o dos ambientes;  Pipeline de CI/CD;  Sistema de chamados funcional;  Documenta��o b�sica do projeto.  Documento de requisitos completo do projeto

