# Componentes de Frontend — U3 Conversa (`u3-conversation`)

Derivado de `wireframes.md` (Tela 5, em `../../../ideation/rough-mockups/`), `functional-spec.md` e `rules.md` desta pasta, do código de frontend de U1 e U2 (casca, sessão, cliente HTTP, `ListState`, `TicketTabs` com o ponto de extensão `extraTabs`, `TicketDetailPage`) e de `contract-summary.md` (API-U3 e X-01).

U3 acrescenta uma aba ao detalhe do chamado e nada mais: não cria página, rota nem item de navegação.

## Hierarquia

```
TicketDetailPage (U2)
└── TicketTabs (U2)                      Detalhes, Histórico
    └── extraTabs                        ponto de extensão que U2 deixou
        └── ConversationTab              registrada por U3; o 404 da leitura retira a aba
            ├── MessageList               região de anúncio educado
            │   ├── LoadPreviousButton    "Carregar mensagens anteriores"
            │   └── MessageBubble         autor, momento, corpo, "ver mais"
            ├── ConversationRefreshButton "Atualizar"
            └── MessageComposer           campo, contador e envio
Compartilhado de U3: conversation-api (cliente das operações de API-U3)
```

## Componentes

| Componente | Responsabilidade | Props principais | Estado | Regras |
|------------|------------------|------------------|--------|--------|
| ConversationTab | Registra a aba para o solicitante do chamado e para todo Atendente e Gestor, nunca para o Administrador; carrega a conversa e, se a leitura responder 404, retira a aba e devolve o foco a Detalhes | chamado, sessão | Cache de consultas; mensagens carregadas; aba retirada | BR5.1, BR1.2, BR1.4 |
| MessageList | Lista os balões em ordem cronológica, numa região que anuncia mensagens novas de forma educada; estados de carregamento, vazio e erro | mensagens, estado | — | BR3.1, BR5.3, BR5.5, BR5.6 |
| MessageBubble | Um balão com autor, momento e corpo; solicitante de um lado, atendimento do outro; trunca em seis linhas com "ver mais" | mensagem, lado | Expandido ou truncado | BR3.3, BR5.1, BR5.4 |
| LoadPreviousButton | Carrega a página anterior de mensagens no topo, mantendo a posição de leitura | há anteriores, carregando | — | BR5.4, BR3.2 |
| ConversationRefreshButton | Recarrega a conversa a pedido | carregando | — | BR5.5 |
| MessageComposer | Campo com rótulo visível e contador de 2000; envia, mostra envio em andamento e preserva o texto quando falha; desabilitado com aviso em chamado encerrado; ausente para quem não escreve | chamado, pode escrever, encerrado | Estado de formulário; enviando; falha | BR1.3, BR2.1, BR2.2, BR5.2, BR5.3 |

## Fluxos de Interação

### Abrir a aba

1. O detalhe abre em Detalhes; a aba Conversa aparece ao lado de Histórico para quem pode ler.
2. Ao entrar na aba, a conversa pede a primeira página em ordem decrescente, com 50 por página, e exibe o resultado em ordem cronológica.
3. O resultado depende da resposta:
   - **200:** os balões aparecem em ordem cronológica, com o fim da conversa visível.
   - **200 sem mensagens:** "Nenhuma mensagem ainda. Escreva a primeira."
   - **404:** o ator não lê esta conversa — por exemplo, um Atendente de outro setor por onde o chamado nunca passou. A aba é retirada da lista e o foco volta para Detalhes, sem revelar nada sobre o chamado.
   - **falha de rede ou 5xx:** mensagem de erro com ação de repetir.

### Enviar

1. O campo valida o corpo ao sair do campo e no envio: obrigatório, até 2000 caracteres.
2. Durante o envio, o botão mostra o progresso e o campo fica somente leitura.
3. O resultado depende da resposta:
   - **201:** a mensagem entra no fim da lista, o campo é limpo e o foco volta para ele.
   - **400:** erro abaixo do campo, texto preservado.
   - **403:** mensagem traduzida; a aba recarrega as permissões.
   - **409 `MESSAGE_TICKET_CLOSED`:** aviso de chamado encerrado; o campo passa a desabilitado.
   - **falha de rede:** balão marcado como "Não enviado", com "Tentar novamente" e o texto preservado.

### Atualizar

1. "Atualizar" recarrega a conversa; mensagens novas são anunciadas.
2. Cada envio também recarrega, para trazer o que chegou enquanto a pessoa escrevia.

## Validação de Formulário no Cliente

A validação no cliente espelha as regras de forma e nunca substitui a do servidor.

| Formulário | Campo | Regra no cliente | Regra de origem |
|------------|-------|------------------|-----------------|
| Envio de mensagem | Corpo | Obrigatório, de 1 a 2000 caracteres após remover espaços nas pontas; quebras de linha preservadas | BR2.1 |
| Envio de mensagem | Envio | Bloqueado quando o chamado está encerrado ou o ator não pode escrever | BR2.2, BR1.3 |

## Pontos de Integração com a API

| Componente | Operação | Quando |
|------------|----------|--------|
| ConversationTab | `listMessages` com `order=desc`, página 1 | Abertura da aba, botão "Atualizar" e depois de cada envio |
| LoadPreviousButton | `listMessages` com `order=desc`, página seguinte | Clique em "Carregar mensagens anteriores" |
| MessageComposer | `sendMessage` | Envio confirmado |

Todas as chamadas seguem a política de falha de X-01: uma nova tentativa só em falha de rede ou 5xx nas consultas, nenhuma nas mutações, e tempo limite de 15 segundos. A tradução de `MESSAGE_TICKET_CLOSED` entra no mapa de mensagens de erro do frontend, na própria unidade (BR5.7, CT11).

## Assumptions & Open Questions

- [assumption] A aba Conversa não mostra contagem de não lidas; o sino de notificações já avisa das mensagens recebidas.
- [assumption] A permissão de escrita é decidida no cliente a partir dos dados do chamado que o detalhe já tem — solicitante, responsável e setor —, e sempre reconfirmada pelo servidor no envio.
- [assumption] "Carregar mensagens anteriores" mantém a posição de leitura, sem saltar para o topo.
