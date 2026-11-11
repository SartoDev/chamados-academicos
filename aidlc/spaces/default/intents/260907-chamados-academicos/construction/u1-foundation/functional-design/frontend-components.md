# Componentes de Frontend — U1 Fundação (`u1-foundation`)

Derivado de `wireframes.md` (em `../../../ideation/rough-mockups/`: navegação, Tela 1 Login, Tela 2 Entrada por Perfil, Tela 8 Administração), `functional-spec.md` e `rules.md` desta pasta, e de `contract-summary.md` (API-U1 e X-01, em `../../../inception/contract-design/`).

U1 entrega três superfícies de tela: a **casca** que todas as unidades seguintes reutilizam, a **tela de login** e a **área de administração**. O desenho é independente de biblioteca; "cache de consultas" significa o estado de dados vindos do servidor, e "estado de formulário" significa o que o usuário digitou e ainda não foi enviado.

## Hierarquia

```
App
├── SessionProvider                  sessão atual em memória; responde a 401 global
├── ErrorCodeMessages                tradução de error.code para português
└── Router
    ├── LoginPage                    rota pública
    │   └── LoginForm
    └── ProtectedLayout              exige sessão; recebe perfis permitidos por rota
        ├── AppShell
        │   ├── SkipToContentLink
        │   ├── TopBar               logo, sino (vazio até U2), menu do avatar com Sair
        │   ├── SideNav              itens por perfil; vira MobileMenu abaixo de 768px
        │   └── MainContent
        ├── ProvisionalHomePage      perfis não administradores, até U2
        └── AdminPage                somente ADMIN
            └── AdminTabs
                ├── UsersTab
                │   ├── UserTable
                │   ├── UserFormDialog
                │   └── ResetPasswordDialog
                ├── SectorsTab
                │   ├── CatalogTable
                │   └── SectorFormDialog
                ├── CategoriesTab
                │   ├── CatalogTable
                │   └── CategoryFormDialog
                ├── StatusesTab
                │   ├── CatalogTable
                │   └── StatusLabelDialog
                └── PrioritiesTab
                    ├── CatalogTable
                    └── PriorityFormDialog
Compartilhados: DataTableContainer, ListState, ConfirmDeactivateDialog, FieldError, FormAlert
```

## Componentes

| Componente | Responsabilidade | Props principais | Estado | Regras |
|------------|------------------|------------------|--------|--------|
| SessionProvider | Obtém a sessão atual ao abrir; guarda nome, perfil e setor; ao receber 401 em qualquer consulta, limpa a sessão e leva ao login | — | Sessão atual (cache de consultas) | BR1.7, BR1.8, WF10 |
| ErrorCodeMessages | Mapa de `error.code` para texto em português; mensagem genérica com `traceId` para código sem tradução | — | — | BR7.5 |
| ProtectedLayout | Bloqueia a rota sem sessão (vai ao login) e sem perfil permitido (mostra aviso de acesso negado); a proteção real continua no servidor | perfis permitidos | — | BR2.2, BR7.6 |
| AppShell | Regiões de cabeçalho, navegação e conteúdo; atalho para o conteúdo como primeiro foco | itens de navegação | Barra lateral recolhida ou não | BR7.1, BR7.2 |
| SideNav / MobileMenu | Mostra itens conforme o perfil; item ativo marcado além da cor; abaixo de 768px vira menu acionável | perfil, itens | Menu aberto ou fechado | BR7.2, BR7.6 |
| LoginPage / LoginForm | E-mail e senha com rótulos visíveis; botão desabilitado até os dois estarem preenchidos; sem link de recuperação | — | Estado de formulário; enviando | BR1.2, BR1.4, BR1.9, BR7.4 |
| ProvisionalHomePage | Mostra nome e perfil do usuário e avisa que as telas de chamados ainda não existem | sessão | — | BR7.3 |
| AdminTabs | Abas navegáveis por setas: Usuários, Setores, Categorias, Status, Prioridades | — | Aba ativa | BR7.1 |
| UserTable | Lista paginada com nome, e-mail, perfil, setor e situação em texto; ações editar, redefinir senha, desativar ou reativar | filtros, página | Cache de consultas; filtros e página | BR2.7, BR7.4 |
| UserFormDialog | Cria ou edita usuário; campo de setor aparece e é obrigatório só para Atendente e Gestor, oferecendo apenas setores ativos | usuário (edição) | Estado de formulário | BR3.1 a BR3.4, BR3.9 |
| ResetPasswordDialog | Nova senha com as regras visíveis antes do envio | usuário | Estado de formulário | BR3.4, BR3.7 |
| CatalogTable | Lista de um catálogo com nome ou rótulo, situação em texto e ações; rolagem horizontal só dentro do contentor | entidade, colunas | Cache de consultas | BR4.3, BR7.2 |
| SectorFormDialog / CategoryFormDialog / PriorityFormDialog | Criação e edição; categoria escolhe entre setores ativos; prioridade tem a marcação de padrão | item (edição) | Estado de formulário | BR4.1, BR4.2, BR4.7 |
| StatusLabelDialog | Edita só o rótulo; a chave aparece como informação, não como campo | status | Estado de formulário | BR4.6 |
| ConfirmDeactivateDialog | Explica que o item deixa de ser oferecido para registros novos e continua visível nos existentes; foco preso; Escape cancela | item, efeito | Aberto ou fechado | BR4.8 |
| ListState | Esqueleto ao carregar, mensagem vazia explicativa, erro com Tentar novamente | estado, textos | — | BR7.4 |
| FieldError / FormAlert | Erro abaixo do campo ou acima dos botões, associado ao campo para leitores de tela | mensagem | — | BR6.3, BR7.1, BR7.4 |

## Fluxos de Interação

### Login

1. O foco inicial vai para o campo de e-mail.
2. Ao enviar, o botão mostra "Entrando..." e os campos ficam somente leitura.
3. O resultado depende da resposta:
   - **401:** mensagem única "E-mail ou senha incorretos.", anunciada por leitor de tela, com o texto digitado mantido.
   - **429:** mensagem traduzida de `AUTH_TOO_MANY_ATTEMPTS`, com o tempo restante.
   - **200:** a sessão é guardada e o usuário vai para a tela de entrada do perfil.

### Administração: criar ou editar

1. O administrador abre o diálogo, e o foco vai para o primeiro campo.
2. A validação acontece ao sair de cada campo, com as mesmas regras de forma do servidor (tabela abaixo).
3. Ao enviar, o servidor pode recusar:
   - **400:** os erros aparecem nos campos, com o texto digitado mantido.
   - **409 ou 422:** a mensagem traduzida aparece acima dos botões.
4. Em caso de sucesso, o diálogo fecha, a lista é atualizada e o foco volta para a ação que o abriu.

### Administração: desativar

1. O administrador aciona "desativar".
2. Abre-se o diálogo de confirmação com o efeito explicado.
3. Ao confirmar, o pedido é enviado.
4. **422** (prioridade padrão, último administrador ou o próprio usuário): a mensagem traduzida aparece na linha afetada, e a tabela não é recarregada.

### Sessão expirada durante o uso

1. Qualquer consulta recebe 401.
2. A sessão em memória é limpa.
3. O usuário vai para a tela de login, com o aviso de que a sessão terminou.

## Validação de Formulário no Cliente

A validação no cliente espelha as regras de forma e nunca substitui a do servidor.

| Formulário | Campo | Regra no cliente | Regra de origem |
|------------|-------|------------------|-----------------|
| Login | E-mail | Obrigatório, formato de e-mail | BR1.1 |
| Login | Senha | Obrigatória | BR1.1 |
| Usuário | Nome | Obrigatório, até 120 caracteres | BR3.1 |
| Usuário | E-mail | Obrigatório, formato de e-mail, até 254 caracteres | BR3.1 |
| Usuário | Perfil | Um dos cinco | BR3.2 |
| Usuário | Setor | Obrigatório se Atendente ou Gestor; oculto nos demais | BR3.3 |
| Usuário, Redefinir senha | Senha | 8 a 128 caracteres, com letra e algarismo | BR3.4 |
| Setor, Categoria | Nome | Obrigatório, até 80 caracteres | BR4.1 |
| Categoria | Setor | Obrigatório, entre setores ativos | BR4.2 |
| Status, Prioridade | Rótulo | Obrigatório, até 40 caracteres | BR4.1 |

## Pontos de Integração com a API

| Componente | Operação (API-U1) | Quando |
|------------|-------------------|--------|
| SessionProvider | `getCurrentUser` | Ao abrir o sistema |
| LoginForm | `login` | Ao enviar |
| TopBar (Sair) | `logout` | Ao escolher Sair |
| UserTable | `listUsers` | Ao abrir a aba e ao mudar filtro ou página |
| UserFormDialog | `createUser`, `updateUser` | Ao enviar |
| ResetPasswordDialog | `resetUserPassword` | Ao enviar |
| UserTable (desativar ou reativar) | `updateUser` com `active` | Após confirmação |
| SectorsTab | `listSectors`, `createSector`, `updateSector` | Abertura, envio, desativação |
| CategoriesTab | `listCategories`, `createCategory`, `updateCategory`; `listSectors` com `active=true` para o seletor | Abertura, envio, desativação |
| StatusesTab | `listStatuses`, `updateStatus` com `label` | Abertura, envio |
| PrioritiesTab | `listPriorities`, `createPriority`, `updatePriority` | Abertura, envio, desativação, troca de padrão |

Todas as chamadas seguem a política de falha de X-01: consultas repetem no máximo uma vez, só em falha de rede ou 5xx; mutações não repetem sozinhas; o tempo limite é de 15 segundos.

## Assumptions & Open Questions

- [assumption] O sino da barra superior aparece em U1 sem contador e sem painel; U2 o preenche.
- [assumption] A lista de usuários pagina com o tamanho padrão de X-01, e os catálogos usam o mesmo formato de lista para manter uma única forma de leitura.
- [assumption] Reativar um item usa a mesma ação da tabela, sem diálogo de confirmação, porque não tem efeito sobre registros existentes.
