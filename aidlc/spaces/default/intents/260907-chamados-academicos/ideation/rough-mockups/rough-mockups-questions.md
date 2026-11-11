# Wireframes e Visualização de Conceito — Perguntas

Base: `../intent-capture/intent-statement.md` (perfis e fronteira), `../scope-definition/scope-document.md` (o que entra no corte mínimo) e `../scope-definition/intent-backlog.md` (proto-Unidades B1–B11).

Já está decidido: Shadcn como biblioteca de componentes, React com TypeScript e Vite. Estas perguntas tratam de **estrutura de tela**, não de estilo visual detalhado — o refinamento de alta fidelidade ficou fora do plano.

---

## Q1. Qual padrão de navegação principal?

O sistema tem entre seis e dez áreas conforme o perfil (chamados, atendimento, notificações, administração, indicadores).

- A. Barra lateral fixa com as seções, colapsável para ícones.
- B. Barra superior com as seções e menu do usuário à direita.
- C. Barra superior (conta, notificações, busca) combinada com barra lateral (seções).
- D. Not yet defined.
- X. Other (please specify)

[Answer]: C. Barra superior (conta, notificações, busca) combinada com barra lateral (seções).

---

## Q2. O que o usuário vê imediatamente após o login?

Define a tela de entrada e, por consequência, o que o sistema considera a tarefa principal de cada perfil.

- A. Sempre a lista de chamados, filtrada conforme o perfil.
- B. Sempre um painel com indicadores.
- C. Uma tela inicial única com atalhos (abrir chamado, ver meus chamados, ver fila).
- D. Depende do perfil: Aluno e Professor veem seus chamados; Atendente e Gestor veem a fila do setor; Administrador vê a área administrativa.
- X. Other (please specify)

[Answer]: D. Depende do perfil: Aluno e Professor veem seus chamados; Atendente e Gestor veem a fila do setor; Administrador vê a área administrativa.

---

## Q3. Como é a abertura de um chamado?

O formulário precisa capturar categoria, setor de destino, título, descrição e prioridade.

- A. Formulário em página única com todos os campos visíveis.
- B. Assistente em etapas: categoria e setor → detalhes → revisão e confirmação.
- C. Modal sobre a lista de chamados.
- D. Not yet defined.
- X. Other (please specify)

[Answer]: A. Formulário em página única com todos os campos visíveis.

---

## Q4. Como é o layout da tela de detalhe do chamado?

É a tela onde solicitante e atendente conversam, o status muda e o histórico se acumula — a tela mais usada do sistema.

- A. Página única: cabeçalho com metadados e ações, seguido de uma linha do tempo cronológica que mistura mensagens e mudanças de status.
- B. Duas colunas: conversa à esquerda, metadados e ações à direita.
- C. Abas separadas: Conversa, Histórico de alterações, Detalhes.
- D. Not yet defined.
- X. Other (please specify)

[Answer]: C. Abas separadas: Conversa, Histórico de alterações, Detalhes.

---

## Q5. Quais formatos de tela precisam ser suportados?

- A. Desktop em primeiro lugar, com layout responsivo funcional em celular.
- B. Celular em primeiro lugar (mobile-first), com o desktop como ampliação.
- C. Apenas desktop; celular não é requisito.
- D. Not yet defined.
- X. Other (please specify)

[Answer]: A. Desktop em primeiro lugar, com layout responsivo funcional em celular.

---

## Q6. Qual nível de acessibilidade é alvo?

Isso vira critério de aceitação nas histórias de usuário e item de verificação nos testes.

- A. WCAG 2.1 AA como linha de base em todas as telas.
- B. WCAG 2.1 A: navegação completa por teclado, rótulos visíveis em formulários e contraste mínimo.
- C. Sem meta formal; aplicar boas práticas onde o custo for baixo.
- D. Not yet defined.
- X. Other (please specify)

[Answer]: B. WCAG 2.1 A: navegação completa por teclado, rótulos visíveis em formulários e contraste mínimo.

---

## Q7. Há diretrizes visuais a seguir?

- A. Nenhuma; usar o tema padrão do Shadcn como está.
- B. Shadcn com uma paleta própria simples (uma cor primária mais neutros).
- C. Seguir a identidade visual de uma instituição de ensino específica.
- D. Not yet defined.
- X. Other (please specify)

[Answer]: A. Nenhuma; usar o tema padrão do Shadcn como está.

---

## Consolidated Summary Confirmation

Resumo consolidado das respostas:

- Navegacao: barra superior (conta, notificacoes, busca) combinada com barra lateral para as secoes (Q1).
- Entrada apos login: depende do perfil - Aluno e Professor veem seus chamados; Atendente e Gestor veem a fila do setor; Administrador ve a area administrativa (Q2).
- Abertura de chamado: formulario em pagina unica, com todos os campos visiveis (Q3).
- Detalhe do chamado: abas separadas - Conversa, Historico de alteracoes, Detalhes (Q4).
- Formatos: desktop em primeiro lugar, com layout responsivo funcional em celular (Q5).
- Acessibilidade: WCAG 2.1 A - navegacao completa por teclado, rotulos visiveis em formularios e contraste minimo (Q6).
- Visual: tema padrao do Shadcn, sem diretriz propria (Q7).

- Looks correct
- Request changes

[Answer]: Looks correct
