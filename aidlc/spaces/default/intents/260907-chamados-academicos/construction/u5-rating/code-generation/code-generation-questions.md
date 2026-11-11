# Geração de Código — U5 Avaliação (`u5-rating`) — Aprovação do Plano

Base: `code-generation-plan.md` (13 passos, com o contrato de testes embutido) e `unit-test-instructions.md` desta pasta.

## Plan Approval

Aprovar exatamente este plano de geração de código de U5, o contrato de testes embutido nele e as instruções de teste?

Pontos de atenção:
- **Achado R-01, que a revisão do desenho deixou aberto como Critical.** O desenho diz que a avaliação vive dentro da aba de detalhes do chamado, mas esse ponto de extensão não existe, e a comparação com a aba Conversa de U3 estava errada: `extraTabs` cria uma **aba irmã**, não conteúdo dentro de uma aba. O plano fixa o mecanismo real: `TicketTabs` ganha uma propriedade opcional de conteúdo extra, renderizada dentro do painel de detalhes, e a página de detalhe passa o bloco de avaliação por ela. Sem a propriedade, a aba não muda. A divergência entre o texto do desenho e o mecanismo real vai ao portão.
- **Achado R-06, também aberto.** O desenho cita uma lista "StatusCards" que não existe: o painel tem duas grades separadas. O plano põe o cartão de avaliação na **grade dos tempos médios**, que passa a acomodar três cartões em telas largas, e estende a nota de rodapé para citar o recorte da avaliação.
- **Arquivos de outras unidades alterados:** os dois pontos de extensão acima em U2 e U4, o catálogo de erros, o módulo de chamados, a limpeza de tabelas dos testes e o `openapi.json`. Nenhum comportamento existente muda.
- **Migração nova.** Tabela `ticket_ratings`, com unicidade por chamado garantida pelo banco — a segunda avaliação responde 409, não sobrescreve.
- **Cobertura.** Nenhum limiar muda e nenhuma chave nova é criada: as regras de U5 ficam na pasta de regras de chamados, já coberta.
- **Ambiente.** Os testes de integração exigem o Docker ativo.

[Approval Fingerprint]: sha256:f670aed42b32cfb56dfe876bbd3ea71b6bd6068e72c03c07d47e6148fd474b2e

- Approve Plan
- Request Changes

[Answer]: Approve Plan
