# Componentes de Frontend — U4 Indicadores (`u4-reporting`)

Derivado de `wireframes.md` (Tela 9, em `../../../ideation/rough-mockups/`), `functional-spec.md` e `rules.md` desta pasta, do código de frontend de U1, U2 e U3 (casca, navegação, `ListState`, `PaginationControls`, filtros e tabela de chamados) e de `contract-summary.md` (API-U4 e X-01).

U4 acrescenta um item de navegação e uma página com duas abas. Não altera telas existentes além da navegação.

## Hierarquia

```
AppShell (U1)
└── SideNav (U1)                          ganha o item "Painel" (MANAGER, ADMIN)
    └── ReportsPage                        duas abas
        ├── PeriodSelector                 padrão: últimos 30 dias, na URL
        ├── IndicatorsTab                  MANAGER e ADMIN
        │   ├── StatusCards                um cartão por status, mais dois de tempo
        │   │   ├── CountCard
        │   │   └── DurationCard           valor, unidade legível e tamanho da amostra
        │   └── CategoryBarChart           barras horizontais e tabela equivalente
        │       └── SectorBarChart         idem, só para ADMIN
        └── QueryTab                       só MANAGER
            ├── ReportFilters              status, categoria, setor e período
            ├── ReportTicketTable          reaproveita a tabela de chamados de U2
            └── PaginationControls (U1)
Compartilhado de U4: reports-api (cliente das operações de API-U4), BarChartWithTable
```

## Componentes

| Componente | Responsabilidade | Props principais | Estado | Regras |
|------------|------------------|------------------|--------|--------|
| ReportsPage | Página do painel; escolhe as abas conforme o perfil e mantém o período | sessão | Aba ativa e período na URL | BR7.5, BR1.1, BR7.2 |
| PeriodSelector | Escolha do período, com padrão de 30 dias; recarrega tudo ao mudar | período, ao mudar | — | BR7.2, BR2.1 |
| IndicatorsTab | Carrega contagens, tempos e a lista de status do catálogo, com a qual completa com zero os status sem chamado no período; orquestra cartões e gráficos; estado vazio quando o período não tem chamado nenhum | período, perfil | Cache de consultas | BR3.1, BR4.3, BR2.2, BR7.1, BR7.3 |
| CountCard | Um status e sua quantidade, com rótulo em texto | rótulo, quantidade | — | BR7.1, BR7.4 |
| DurationCard | Um tempo médio em unidade legível, com a amostra daquele tempo ao lado e um traço quando não há amostra; resolução e atendimento têm amostras diferentes | rótulo, segundos, amostra do próprio tempo | — | BR4.3, BR4.4, BR7.1, BR7.4 |
| BarChartWithTable | Barras horizontais mais uma tabela equivalente com rótulo e quantidade, lida por leitor de tela | título, grupos | — | BR7.4, BR7.6 |
| CategoryBarChart / SectorBarChart | Os dois agrupamentos do painel; o de setor só é montado para o Administrador | grupos | — | BR7.1, Q4 |
| QueryTab | A listagem filtrada do Gestor, com filtros combináveis e paginação | período | Filtros e página na URL | BR5.1, BR5.2 |
| ReportFilters | Status, categoria, setor e período, combináveis e preservados ao paginar | filtros, ao mudar | — | BR5.1 |
| ReportTicketTable | Linhas de chamado, reaproveitando a tabela de U2; sem coluna de tempo e sem ação de exportar | itens | — | BR5.1, BR5.2 |

## Fluxos de Interação

### Abrir o painel

1. O item "Painel" aparece para Gestor e Administrador.
2. A aba Indicadores carrega com o período padrão de 30 dias.
3. O resultado depende da resposta:
   - **200 com dados:** cartões e gráficos preenchidos, cada cartão de tempo com a sua própria amostra; o gráfico por setor só aparece para o Administrador.
   - **200 sem dados:** "Nenhum chamado no período selecionado.", sem cartões zerados.
   - **400:** período inválido, com a mensagem ao lado do seletor e o período anterior preservado.
   - **falha de rede ou 5xx:** erro com ação de repetir, mantendo o período escolhido.

### Trocar o período

1. A escolha vai para a URL, para que a tela possa ser recarregada ou compartilhada no mesmo recorte.
2. Todas as consultas da aba são refeitas.
3. Os cartões de tempo mostram, junto, de quantos chamados aquela média saiu.

### Consultar a listagem

1. A aba Consulta aparece só para o Gestor.
2. Filtros combináveis; trocar um filtro volta para a página 1 e preserva os demais.
3. Não existe botão de exportar em nenhum estado da tela.

## Validação de Formulário no Cliente

| Formulário | Campo | Regra no cliente | Regra de origem |
|------------|-------|------------------|-----------------|
| Seletor de período | Início e fim | Início anterior ao fim; datas válidas; envio em UTC | BR2.1 |
| Filtros da consulta | Status, categoria, setor | Opcionais, entre os itens do catálogo | BR5.1 |

## Pontos de Integração com a API

| Componente | Operação | Quando |
|------------|----------|--------|
| IndicatorsTab | `getTicketCounts` com `groupBy=status` | Abertura e troca de período |
| IndicatorsTab | `getTicketCounts` com `groupBy=category` | Abertura e troca de período |
| IndicatorsTab | `getTicketCounts` com `groupBy=sector` | Abertura e troca de período, só para o Administrador |
| IndicatorsTab | `getAverageDurations` | Abertura e troca de período |
| IndicatorsTab | `listStatuses` (API-U1) | Abertura, para completar com zero os status sem chamado no período |
| QueryTab | `searchTicketsForReport` | Abertura da aba e mudança de filtro, período ou página |
| ReportFilters | `listStatuses`, `listCategories`, `listSectors` (API-U1) | Abertura da aba |

Todas as chamadas seguem a política de falha de X-01: uma nova tentativa só em falha de rede ou 5xx, nenhuma em mutação — e U4 não tem mutação —, com tempo limite de 15 segundos.

## Assumptions & Open Questions

- [assumption] Os gráficos são desenhados com elementos simples de layout e largura proporcional, sem biblioteca de gráficos: são duas séries de barras horizontais, e uma dependência nova não se paga aqui.
- [assumption] O painel faz quatro consultas em paralelo; o estado de carregamento é único para a aba, e um erro em qualquer uma mostra o estado de erro da aba inteira.
- [assumption] A aba Consulta reaproveita os componentes de filtro e de tabela de U2 por composição, sem alterá-los.
