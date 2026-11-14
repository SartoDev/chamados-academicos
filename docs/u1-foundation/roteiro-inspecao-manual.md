# Roteiro de Inspeção Manual — U1 Fundação

- **Roteiro criado em:** 2026-09-13
- **Versão do sistema:** U1 Fundação (código gerado nesta data, antes do primeiro commit)
- **Situação:** **executado em 2026-11-13**, em inspeção assistida por agente no Google Chrome do autor, com observação simultânea do autor, sobre o sistema em Docker Compose local (`http://localhost:8080`, Node 24.11.1, Docker Engine 29.7.2). Cada medida foi tirada com o viewport conferido antes e com controle positivo do instrumento de contraste (preto sobre branco = 21; `#767676` sobre branco = 4,54). Nenhum item recebeu `Aprovado` sem evidência medida registrada na linha. Desvio declarado quanto a `project.md` § Forbidden, que proíbe teste automatizado de navegador: esta inspeção não produz suíte, código de teste nem portão — é observação assistida.

Este roteiro cobre os critérios que o projeto não verifica por teste automatizado de navegador, por decisão registrada em `team.md` e `stories.md`. Os critérios AC5.3.3 (rótulo associado) e AC5.3.4 (informação em texto além da cor) também têm teste de componente; ver a tabela de rastreabilidade.

## Preparação

1. Suba o sistema com `docker compose up --build` e abra `http://localhost:8080` num navegador atual (Chrome, Edge ou Firefox).
2. Tenha em mãos o administrador inicial (`INITIAL_ADMIN_EMAIL`/`INITIAL_ADMIN_PASSWORD`) e crie, pela administração, um usuário de perfil Aluno para as telas de perfis não administradores.
3. Para medir contraste, use as ferramentas de desenvolvedor do navegador (inspeção de cor com razão de contraste) ou uma extensão de auditoria de acessibilidade.
4. Para a largura de 375px, use o modo de dispositivo das ferramentas de desenvolvedor com largura de 375px.

## Telas cobertas

| Tela                                                     | Como chegar                                            |
| -------------------------------------------------------- | ------------------------------------------------------ |
| Login                                                    | `http://localhost:8080/login`                          |
| Casca (barra superior e navegação)                       | Qualquer tela após entrar                              |
| Tela provisória de entrada                               | Entrar como Aluno (`/home`)                            |
| Administração — Usuários                                 | Entrar como administrador (`/admin`), aba Usuários     |
| Administração — Setores, Categorias, Status, Prioridades | Abas correspondentes                                   |
| Diálogos de administração                                | Novo, Editar, Redefinir senha, Desativar (confirmação) |

## Itens de verificação

Preencha a coluna **Resultado** com `Aprovado` ou `Reprovado` e, se reprovado, descreva o problema em **Observações**.

### AC5.3.1 — Uso só pelo teclado

| #   | Passos                                                                                    | Esperado                                                                                      | Resultado          | Observações                                                                                                                                                                  |
| --- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1 | Na tela de login, use só Tab, Shift+Tab, Enter e Espaço para preencher e entrar.          | Todos os campos e botões (incluindo mostrar senha) são alcançáveis; Enter envia o formulário. | Aprovado           | Ordem medida com teclas reais: login-email, login-password, botão Mostrar senha, botão Entrar. Preenchido e enviado só com teclado; chegou a /admin.                         |
| 1.2 | Após entrar, pressione Tab uma vez.                                                       | O primeiro foco é o link "Pular para o conteúdo"; Enter leva o foco ao conteúdo principal.    | Aprovado           | Um Tab revela o link; Enter move o foco para MAIN#main-content e o endereço passa a terminar em #main-content.                                                               |
| 1.3 | Abra o menu da conta pelo teclado (Enter no botão) e escolha "Sair" com as setas e Enter. | O menu abre, os itens são navegáveis por setas e "Sair" encerra a sessão.                     | Aprovado           | Enter abre o menu (role=menu); o foco vai para Sair (role=menuitem); Enter encerra a sessão e leva a /login.                                                                 |
| 1.4 | Na administração, foque a lista de abas e use as setas esquerda e direita.                | A aba ativa muda e o conteúdo correspondente aparece.                                         | Aprovado           | Roving tabindex correto: aba selecionada em 0 e demais em -1; as setas movem e a seleção acompanha o foco.                                                                   |
| 1.5 | Abra "Novo usuário", preencha e salve só pelo teclado; repita com Escape.                 | O foco fica preso no diálogo; Escape fecha; ao fechar, o foco volta ao botão que abriu.       | Reprovado          | Abre, preenche (perfil escolhido digitando no select) e salva só com teclado, e o usuário aparece na tabela. Mas ao fechar o foco vai para BODY em vez de voltar ao gatilho. |
| 1.6 | Em qualquer tabela, acione "Desativar" e cancele com Escape.                              | O diálogo de confirmação abre com o foco dentro; Escape cancela sem desativar.                | Reprovado em parte | Escape cancela sem desativar (usuário seguiu Ativo) e o foco inicial é Cancelar. Ao fechar, o foco vai para BODY.                                                            |
| 1.7 | Recolha e expanda a barra lateral pelo teclado.                                           | O botão alterna o estado e anuncia expandido/recolhido.                                       | Aprovado           | Barra lateral de 240px para 56px e de volta; rótulo alterna entre Recolher e Expandir menu; o foco permanece no botão.                                                       |

### AC5.3.2 — Indicador de foco visível

| #   | Passos                                                                 | Esperado                                                           | Resultado | Observações                                                                                                                                                                    |
| --- | ---------------------------------------------------------------------- | ------------------------------------------------------------------ | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2.1 | Percorra com Tab a tela de login, a casca e cada aba da administração. | Todo elemento focado exibe um anel ou borda de foco visível.       | Aprovado  | Anel assentado medido em toda a casca: Pular para o conteúdo com 2px mais outline; menu, logo, notificações e menu da conta com 3px. A cor é o token --ring: oklch(0.708 0 0). |
| 2.2 | Percorra os diálogos (formulários e confirmação).                      | Campos, seletores, caixa de seleção e botões mostram foco visível. | Aprovado  | Foco inicial dentro do diálogo; anel de 3px; em estado de erro o campo recebe aria-invalid=true e aria-describedby apontando a mensagem.                                       |

### AC5.3.5 — Contraste mínimo

| #   | Passos                                                                                               | Esperado                                                              | Resultado          | Observações                                                                                                                                                                       |
| --- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5.1 | Meça o contraste do texto principal, dos rótulos e dos textos auxiliares (cinza) nas telas cobertas. | Todos os pares de texto e fundo atendem o mínimo de WCAG 2.1 nível A. | Aprovado           | Título 19,8; cabeçalho de tabela 19,8; célula 19,8; aba selecionada 19,8; não selecionada 18,16; item do menu 19,8; texto auxiliar 19,8. Controle positivo do instrumento: 4,54.  |
| 5.2 | Meça as mensagens de erro (texto em vermelho) e os botões de desativar.                              | Atendem o mínimo exigido.                                             | Reprovado em parte | Mensagens de erro 4,77 (passam). Botão Desativar mede 3,97 (texto 231,0,11 sobre fundo efetivo 252,229,230, a 12,8px), abaixo dos 4,5. O critério de contraste é nível AA, não A. |

### AC5.3.6 — Tema padrão do Shadcn sem cores sobrescritas

| #   | Passos                                                                                                                                                                   | Esperado                                                                                                               | Resultado             | Observações                                                                                                                                            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 6.1 | Na raiz do repositório, execute `grep -rnE "#[0-9a-fA-F]{3,8}\b\|rgb\(\|hsl\(\|oklch\(\|\[color:" apps/web/src --include=*.tsx --include=*.ts \| grep -v components/ui`. | Nenhuma cor literal no código da aplicação; só tokens do tema (`text-destructive`, `bg-muted`, `border-primary` etc.). | Aprovado              | Comando do roteiro executado na raiz: 0 linhas.                                                                                                        |
| 6.2 | Confira em `apps/web/src/index.css` que os valores das variáveis de cor são os gerados pelo `shadcn init` (preset padrão, cor base neutral).                             | Nenhuma variável de cor alterada manualmente.                                                                          | Aprovado com ressalva | 85 variáveis em index.css; as de cor conferem com o preset neutral do shadcn. Ressalva: o diff contra uma saída nova de shadcn init não foi executado. |

### AC5.4.1 — Tela de login sem rolagem horizontal em 375px

| #   | Passos                                                                            | Esperado                                                              | Resultado | Observações                                                                                                           |
| --- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------- |
| 4.1 | Em 375px, abra `/login`, incluindo com a mensagem de erro de credenciais visível. | A página não rola na horizontal; o cartão ocupa a largura disponível. | Aprovado  | 375/375 sem rolagem horizontal, inclusive com a mensagem de credenciais visível; ela está em role=alert e é genérica. |

A parte de AC5.4.1 referente às telas de chamados e notificações pertence a U2, U3 e U5.

### AC5.4.3 — Navegação recolhida em 375px

| #   | Passos                                           | Esperado                                                                          | Resultado | Observações                                                                                                                         |
| --- | ------------------------------------------------ | --------------------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 4.2 | Em 375px, entre como Aluno e como administrador. | A barra lateral não aparece; um botão de menu na barra superior abre a navegação. | Aprovado  | Como Administrador e como Aluno: barra lateral com largura 0 e botão Abrir menu de navegação presente; 375/375.                     |
| 4.3 | Abra o menu, escolha um item e observe.          | O menu fecha após a escolha e a tela correspondente aparece.                      | Aprovado  | A gaveta abre com o foco dentro; escolher Chamados navegou de /admin para /all-tickets, o menu fechou sozinho e o destino não rola. |

### AC5.4.4 — Rolagem contida nas tabelas de administração em 375px

| #   | Passos                                          | Esperado                                                                                                               | Resultado | Observações                                                                                                                |
| --- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------- |
| 4.4 | Em 375px, abra cada aba da administração.       | A lista de abas e as tabelas rolam na horizontal dentro do próprio contentor; a página inteira não rola na horizontal. | Aprovado  | Nas cinco abas: página 375/375 e a tabela rolando dentro do contentor (744/341, overflow-x auto).                          |
| 4.5 | Em 375px, abra os diálogos de criação e edição. | O diálogo cabe na tela e rola na vertical quando necessário.                                                           | Aprovado  | Diálogo de 343px entre as margens 16 e 359; cabe na tela, sem rolagem da página nem do próprio diálogo; botões empilhados. |

## Registro da passagem

| Data da passagem | Navegador e versão | Responsável | Resultado geral |
| ---------------- | ------------------ | ----------- | --------------- |
|                  |                    |             |                 |
