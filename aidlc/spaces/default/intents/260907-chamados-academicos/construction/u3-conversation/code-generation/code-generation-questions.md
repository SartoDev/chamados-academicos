# Geração de Código — U3 Conversa (`u3-conversation`) — Aprovação do Plano

Base: `code-generation-plan.md` (13 passos, com o contrato de testes embutido) e `unit-test-instructions.md` desta pasta.

## Plan Approval

Aprovar exatamente este plano de geração de código de U3, o contrato de testes embutido nele e as instruções de teste?

Pontos de atenção:
- **Achado R-06 da revisão do desenho (paginação).** O plano resolve no código, sem mudar o contrato: a ordenação declara o desempate nos dois sentidos, e como mensagem nunca é apagada, uma janela que desliza só pode repetir uma mensagem já carregada, nunca esconder uma. A aba junta as páginas descartando identificadores repetidos, e um teste de integração prova isso gravando mensagem nova entre as duas páginas.
- **Achado R-07 (redação de BR3.2).** É correção de texto no desenho, que está congelado pela revisão final. O código segue a leitura correta, e a correção vai ao portão.
- **Arquivos de U1 e U2 alterados.** Esquema do Prisma, catálogo de erros, limiar de cobertura, limpeza do banco de teste, OpenAPI, tipos e traduções do frontend, e o detalhe do chamado, que passa a registrar a aba pelo ponto de extensão que já existe.
- **Cobertura.** Nenhum limiar muda; a chave das regras passa a cobrir também as regras de U3.
- **Ambiente.** Os testes de integração exigem o Docker ativo.

[Approval Fingerprint]: sha256:49f9dba92095ecf8d5cf006938c4292014fcd80c213155748d2f636cad68848e

- Approve Plan
- Request Changes

[Answer]: Approve Plan
