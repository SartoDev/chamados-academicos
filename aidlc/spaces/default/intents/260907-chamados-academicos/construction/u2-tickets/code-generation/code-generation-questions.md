# Geração de Código — U2 Chamados (`u2-tickets`) — Aprovação do Plano

Base: `code-generation-plan.md` (13 passos, com o contrato de testes embutido) e `unit-test-instructions.md` desta pasta.

## Plan Approval

Aprovar exatamente este plano de geração de código de U2, o contrato de testes embutido nele e as instruções de teste?

Pontos de atenção:
- **Transação ambiente (achado R-01 do desenho funcional).** O plano fixa o mecanismo: um `TransactionRunner` com `AsyncLocalStorage`, em que cada operação de escrita abre a transação e todo service chamado dentro dela participa, sem parâmetro novo e sem tipo do Prisma nas assinaturas públicas. U3 usará o mesmo mecanismo.
- **Arquivos de U1 alterados.** Esquema do Prisma, catálogo de erros, services públicos de usuários e catálogo, limpeza do banco de teste, navegação, rotas e barra superior. A tela provisória e o item "Início" são removidos, e os testes de U1 que dependiam deles são ajustados sem perder o que verificam.
- **Cobertura.** Nenhum limiar muda. U2 acrescenta 90% de ramos nas regras de autorização e visibilidade de U2. Os limiares são verificados no portão completo de U1 com U2, porque U2 altera código de U1.
- **Achados R-02 e R-03.** A fila "não atribuídos" continua sem os chamados de responsável indisponível; U2 não usa os eventos internos de U1.
- **Ambiente.** Os testes de integração exigem o Docker ativo.

[Approval Fingerprint]: sha256:3f3630609632ae7d62ee8edfa5b601b360bcde2250800c481015939a39212277

- Approve Plan
- Request Changes

[Answer]: Approve Plan
