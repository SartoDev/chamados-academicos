# Componentes de Frontend — U2 Chamados (`u2-tickets`)

Derivado de `wireframes.md` (em `../../../ideation/rough-mockups/`: Telas 2 a 7), `functional-spec.md` e `rules.md` desta pasta, do código de frontend de U1 (casca, sessão, cliente HTTP, `ListState`, `PaginationControls`, `ConfirmDeactivateDialog`) e de `contract-summary.md` (API-U2 e X-01, em `../../../inception/contract-design/`).

U2 acrescenta à casca de U1 as telas de chamados, a fila, a listagem geral do Administrador e as notificações. O desenho é independente de biblioteca: "cache de consultas" é o estado de dados vindos do servidor, e "estado de formulário" é o que o usuário digitou e ainda não enviou.

## Hierarquia

```
ProtectedLayout (U1)
└── AppShell (U1)
    ├── TopBar (U1)
    │   └── NotificationBell                 contador de não lidas
    │       └── NotificationsPanel           diálogo com a lista e "marcar todas"
    ├── SideNav (U1)                         itens por perfil, atualizados por U2
    └── MainContent
        ├── MyTicketsPage                    STUDENT, PROFESSOR
        │   ├── TicketFilters
        │   ├── TicketTable | TicketCardList tabela no desktop, cartões abaixo de 768px
        │   └── PaginationControls (U1)
        ├── NewTicketPage                    STUDENT, PROFESSOR
        │   └── NewTicketForm
        ├── TicketDetailPage                 qualquer perfil, conforme visibilidade
        │   ├── TicketHeader                 número, título, badges de status e prioridade
        │   ├── TicketActions                ações permitidas ao ator
        │   │   ├── ConfirmStatusActionDialog
        │   │   ├── TransferDialog
        │   │   ├── AssignDialog
        │   │   └── PriorityDialog
        │   └── TicketTabs                   Detalhes, Histórico; espaço da aba Conversa de U3
        │       ├── TicketDetailsTab
        │       └── TicketHistoryTab         histórico e passagens
        ├── SectorQueuePage                  AGENT, MANAGER
        │   ├── QueueSliceTabs               não atribuídos, meus, todos, passaram pelo setor
        │   ├── TicketFilters
        │   └── QueueTable                   ação assumir por linha
        ├── AllTicketsPage                   ADMIN, só leitura
        └── NotificationsPage                "Ver todas"
Compartilhados de U2: TicketStatusBadge, PriorityBadge, AssigneeCell, ReferenceText
```

## Componentes

| Componente | Responsabilidade | Props principais | Estado | Regras |
|------------|------------------|------------------|--------|--------|
| MyTicketsPage | Lista os chamados do solicitante com filtros, ordenação e paginação; botão "Novo Chamado" | — | Filtros, página e ordenação na URL; cache de consultas | BR2.1, BR2.5, BR9.2, BR9.8 |
| TicketTable / TicketCardList | Mesma lista em tabela ou cartões, conforme a largura | itens | — | BR9.2 |
| NewTicketPage / NewTicketForm | Categoria entre as disponíveis, setor derivado exibido sem edição, título e descrição com contador, prioridade começando na padrão | — | Estado de formulário; enviando | BR1.2 a BR1.4, BR9.3 |
| TicketDetailPage | Carrega o detalhe; 404 mostra a tela de chamado não encontrado, sem revelar se existe | id do chamado | Cache de consultas | BR2.4, BR2.7 |
| TicketHeader | Número, título, status e prioridade em texto, setor, categoria, data de abertura, responsável com marca de indisponível | chamado | — | BR1.6, BR3.9, BR9.9 |
| TicketActions | Mostra só as ações que o ator pode executar naquele chamado; encerrar, aguardar e reabrir pedem confirmação | chamado, sessão | Diálogo aberto | BR2.9, BR3.1 a BR3.8, BR4.3, BR9.4 |
| TransferDialog | Setor de destino entre os ativos diferentes do atual; justificativa com contador de 5 a 500 | chamado | Estado de formulário | BR3.3, BR9.7 |
| AssignDialog | Lista quem pode receber atribuição no setor; destaca o responsável atual | chamado | Estado de formulário; cache | BR3.2, BR8.5, BR9.7 |
| PriorityDialog | Prioridades ativas; a atual pré-selecionada | chamado | Estado de formulário | BR3.7 |
| TicketTabs | Abas navegáveis por setas; espaço reservado para a aba Conversa de U3 | chamado | Aba ativa | BR9.4, BR9.9 |
| TicketHistoryTab | Histórico em ordem cronológica com autor, momento, valor anterior e novo; passagens com entrada, saída, justificativa e autor | id do chamado | Cache | BR2.8, BR5.1, BR5.2 |
| SectorQueuePage | Recortes como abas, filtros por status e categoria, paginação; mensagem de falta de setor para 403 `TICKET_QUEUE_NO_SECTOR` | — | Recorte, filtros e página na URL | BR2.2, BR2.6, BR9.5 |
| QueueTable | Número, título, solicitante, responsável com marca, status, tempo desde a abertura com data absoluta em título acessível; ação assumir por teclado | itens | — | BR3.1, BR3.9, BR9.5 |
| AllTicketsPage | Listagem geral em leitura para o Administrador, com os mesmos filtros | — | Filtros e página na URL | BR2.3 |
| NotificationBell | Contador de não lidas com rótulo acessível; abre o painel | — | Cache da contagem | BR6.4, BR9.6 |
| NotificationsPanel | Diálogo com foco preso e Escape; lista com "não lida" em texto; clicar marca como lida e navega; "marcar todas" | — | Cache; aberto ou fechado | BR6.4, BR6.5, BR9.6 |
| NotificationsPage | Lista completa paginada, com filtro de não lidas | — | Página e filtro na URL | BR6.4 |
| TicketStatusBadge / PriorityBadge | Rótulo textual, com cor só como reforço | status ou prioridade | — | BR9.9 |
| AssigneeCell | Nome do responsável ou "sem responsável"; marca "responsável indisponível" em texto | responsável, indisponível | — | BR3.9 |

## Fluxos de Interação

### Abrir chamado

1. O solicitante escolhe a categoria, e o setor aparece.
2. Título e descrição validam ao sair do campo, com contador.
3. Ao enviar, o botão mostra "Abrindo..." e o formulário fica somente leitura.
4. O resultado depende da resposta:
   - **201:** leva ao detalhe com a confirmação "Chamado #N aberto".
   - **400:** erros nos campos, texto preservado.
   - **404 ou 422 de catálogo:** mensagem traduzida acima dos botões, e a lista de categorias é recarregada.

### Atuar num chamado

1. O detalhe mostra só as ações permitidas ao ator.
2. Encerrar, aguardar solicitante e reabrir abrem confirmação; transferir, atribuir e prioridade abrem os diálogos próprios.
3. O resultado depende da resposta:
   - **200:** o detalhe e a lista são atualizados, e o foco volta para a ação.
   - **409 ou 422:** a mensagem traduzida aparece no diálogo. Em `TICKET_ALREADY_ASSIGNED`, a mensagem traz o nome do responsável.
   - **403:** mensagem traduzida, e as ações são recarregadas.

### Fila do setor

1. A fila abre no recorte "não atribuídos".
2. Trocar de recorte ou filtro atualiza a URL e volta à página 1.
3. "Assumir" numa linha executa a ação e mantém o foco na linha.
4. Um 409 mostra a mensagem com o responsável atual e recarrega a linha.

### Notificações

1. O contador aparece no sino quando há não lidas.
2. Abrir o painel lista as mais recentes.
3. Clicar numa notificação a marca como lida e navega ao chamado.
4. "Marcar todas" zera o contador.
5. Um erro no painel mostra a mensagem com a ação de repetir, com o painel aberto.

## Validação de Formulário no Cliente

A validação no cliente espelha as regras de forma e nunca substitui a do servidor.

| Formulário | Campo | Regra no cliente | Regra de origem |
|------------|-------|------------------|-----------------|
| Novo chamado | Categoria | Obrigatória, entre as disponíveis | BR1.3 |
| Novo chamado | Título | Obrigatório, de 5 a 120 caracteres após remover espaços nas pontas | BR1.2 |
| Novo chamado | Descrição | Obrigatória, de 10 a 2000 caracteres após remover espaços nas pontas | BR1.2 |
| Novo chamado | Prioridade | Opcional, começa na padrão | BR1.4 |
| Transferir | Setor de destino | Obrigatório, ativo, diferente do atual | BR3.3 |
| Transferir | Justificativa | Obrigatória, de 5 a 500 caracteres | BR3.3 |
| Atribuir | Destinatário | Obrigatório, da lista de quem pode receber atribuição | BR3.2 |
| Prioridade | Prioridade | Obrigatória, ativa | BR3.7 |

## Pontos de Integração com a API

| Componente | Operação | Quando |
|------------|----------|--------|
| MyTicketsPage | `listTickets` com `view=requested` | Abertura e mudança de filtro, ordenação ou página |
| NewTicketForm | `listCategories` com disponibilidade e `listPriorities` com `active=true` (API-U1); `openTicket` | Abertura do formulário; envio |
| TicketDetailPage | `getTicket` | Abertura |
| TicketHistoryTab | `listTicketHistory`, `listTicketSectorPassages` | Abertura da aba |
| TicketActions | `assumeTicket`, `waitForRequester`, `closeTicket`, `reopenTicket` | Ação confirmada |
| TransferDialog | `listSectors` com `active=true` (API-U1); `transferTicket` | Abertura; envio |
| AssignDialog | `GET /tickets/{ticketId}/assignable-users`; `assignTicket` | Abertura; envio |
| PriorityDialog | `listPriorities` com `active=true` (API-U1); `changeTicketPriority` | Abertura; envio |
| SectorQueuePage | `listTickets` com `view=queue` e o recorte | Abertura e mudança de recorte, filtro ou página |
| AllTicketsPage | `listTickets` com `view=all` | Abertura e mudança de filtro ou página |
| NotificationBell | `countUnreadNotifications` | Abertura do sistema e depois de cada ação que muda chamado |
| NotificationsPanel / NotificationsPage | `listNotifications`, `markNotificationRead`, `markAllNotificationsRead` | Abertura; clique; "marcar todas" |

Todas as chamadas seguem a política de falha de X-01. A contagem de não lidas é atualizada ao abrir o sistema, ao abrir o painel e depois das ações do próprio usuário; não há atualização em tempo real.

## Assumptions & Open Questions

- [assumption] Não há atualização em tempo real das notificações; a contagem é consultada nos momentos listados acima.
- [assumption] A aba Conversa ocupa um espaço reservado nas abas do detalhe e só aparece quando U3 a registra.
- [assumption] Os códigos de erro de U2 ganham tradução em português no mapa de mensagens de U1, na mesma unidade que os usa (CT11).
