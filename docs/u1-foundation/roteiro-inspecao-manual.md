# Roteiro de Inspeção Manual — U1 Fundação

- **Roteiro criado em:** 2026-09-13
- **Versão do sistema:** U1 Fundação (código gerado nesta data, antes do primeiro commit)
- **Situação:** pendente de execução pelo autor. Os resultados abaixo ficam em branco até a passagem manual; nenhum item foi dado como aprovado sem ser observado.

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

| #   | Passos                                                                                    | Esperado                                                                                      | Resultado | Observações |
| --- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------- | ----------- |
| 1.1 | Na tela de login, use só Tab, Shift+Tab, Enter e Espaço para preencher e entrar.          | Todos os campos e botões (incluindo mostrar senha) são alcançáveis; Enter envia o formulário. |           |             |
| 1.2 | Após entrar, pressione Tab uma vez.                                                       | O primeiro foco é o link "Pular para o conteúdo"; Enter leva o foco ao conteúdo principal.    |           |             |
| 1.3 | Abra o menu da conta pelo teclado (Enter no botão) e escolha "Sair" com as setas e Enter. | O menu abre, os itens são navegáveis por setas e "Sair" encerra a sessão.                     |           |             |
| 1.4 | Na administração, foque a lista de abas e use as setas esquerda e direita.                | A aba ativa muda e o conteúdo correspondente aparece.                                         |           |             |
| 1.5 | Abra "Novo usuário", preencha e salve só pelo teclado; repita com Escape.                 | O foco fica preso no diálogo; Escape fecha; ao fechar, o foco volta ao botão que abriu.       |           |             |
| 1.6 | Em qualquer tabela, acione "Desativar" e cancele com Escape.                              | O diálogo de confirmação abre com o foco dentro; Escape cancela sem desativar.                |           |             |
| 1.7 | Recolha e expanda a barra lateral pelo teclado.                                           | O botão alterna o estado e anuncia expandido/recolhido.                                       |           |             |

### AC5.3.2 — Indicador de foco visível

| #   | Passos                                                                 | Esperado                                                           | Resultado | Observações |
| --- | ---------------------------------------------------------------------- | ------------------------------------------------------------------ | --------- | ----------- |
| 2.1 | Percorra com Tab a tela de login, a casca e cada aba da administração. | Todo elemento focado exibe um anel ou borda de foco visível.       |           |             |
| 2.2 | Percorra os diálogos (formulários e confirmação).                      | Campos, seletores, caixa de seleção e botões mostram foco visível. |           |             |

### AC5.3.5 — Contraste mínimo

| #   | Passos                                                                                               | Esperado                                                              | Resultado | Observações |
| --- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | --------- | ----------- |
| 5.1 | Meça o contraste do texto principal, dos rótulos e dos textos auxiliares (cinza) nas telas cobertas. | Todos os pares de texto e fundo atendem o mínimo de WCAG 2.1 nível A. |           |             |
| 5.2 | Meça as mensagens de erro (texto em vermelho) e os botões de desativar.                              | Atendem o mínimo exigido.                                             |           |             |

### AC5.3.6 — Tema padrão do Shadcn sem cores sobrescritas

| #   | Passos                                                                                                                                                                   | Esperado                                                                                                               | Resultado | Observações |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | --------- | ----------- |
| 6.1 | Na raiz do repositório, execute `grep -rnE "#[0-9a-fA-F]{3,8}\b\|rgb\(\|hsl\(\|oklch\(\|\[color:" apps/web/src --include=*.tsx --include=*.ts \| grep -v components/ui`. | Nenhuma cor literal no código da aplicação; só tokens do tema (`text-destructive`, `bg-muted`, `border-primary` etc.). |           |             |
| 6.2 | Confira em `apps/web/src/index.css` que os valores das variáveis de cor são os gerados pelo `shadcn init` (preset padrão, cor base neutral).                             | Nenhuma variável de cor alterada manualmente.                                                                          |           |             |

### AC5.4.1 — Tela de login sem rolagem horizontal em 375px

| #   | Passos                                                                            | Esperado                                                              | Resultado | Observações |
| --- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------- | --------- | ----------- |
| 4.1 | Em 375px, abra `/login`, incluindo com a mensagem de erro de credenciais visível. | A página não rola na horizontal; o cartão ocupa a largura disponível. |           |             |

A parte de AC5.4.1 referente às telas de chamados e notificações pertence a U2, U3 e U5.

### AC5.4.3 — Navegação recolhida em 375px

| #   | Passos                                           | Esperado                                                                          | Resultado | Observações |
| --- | ------------------------------------------------ | --------------------------------------------------------------------------------- | --------- | ----------- |
| 4.2 | Em 375px, entre como Aluno e como administrador. | A barra lateral não aparece; um botão de menu na barra superior abre a navegação. |           |             |
| 4.3 | Abra o menu, escolha um item e observe.          | O menu fecha após a escolha e a tela correspondente aparece.                      |           |             |

### AC5.4.4 — Rolagem contida nas tabelas de administração em 375px

| #   | Passos                                          | Esperado                                                                                                               | Resultado | Observações |
| --- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------- | ----------- |
| 4.4 | Em 375px, abra cada aba da administração.       | A lista de abas e as tabelas rolam na horizontal dentro do próprio contentor; a página inteira não rola na horizontal. |           |             |
| 4.5 | Em 375px, abra os diálogos de criação e edição. | O diálogo cabe na tela e rola na vertical quando necessário.                                                           |           |             |

## Registro da passagem

| Data da passagem | Navegador e versão | Responsável | Resultado geral |
| ---------------- | ------------------ | ----------- | --------------- |
|                  |                    |             |                 |
