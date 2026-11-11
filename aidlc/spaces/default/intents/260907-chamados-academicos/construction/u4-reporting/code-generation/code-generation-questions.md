# Geração de Código — U4 Indicadores (`u4-reporting`) — Aprovação do Plano

Base: `code-generation-plan.md` (13 passos, com o contrato de testes embutido) e `unit-test-instructions.md` desta pasta.

## Plan Approval

Aprovar exatamente este plano de geração de código de U4, o contrato de testes embutido nele e as instruções de teste?

Pontos de atenção:
- **Achado R-02, que a revisão deixou aberto.** O desenho descrevia a listagem com rótulos e data de abertura, mas o método de serviço de U2 devolve só identificadores e não tem data de abertura. O plano resolve no código: o campo entra por adição em `TicketListRow`, dentro do módulo de U2, e a resolução de rótulos e pessoas passa a ser de U4, a partir dos identificadores. A divergência entre o texto do desenho e o contrato real vai ao portão.
- **Achado R-06, também aberto.** Correção de redação em BR2.2, que fala em "amostra zero" no singular depois de o desenho fixar duas amostras. O código devolve as duas; a correção do texto vai ao portão.
- **Arquivos de U2 alterados, só por adição:** os dois métodos de agregação que o desenho de U2 adiou para este Bolt, e o campo novo na linha de listagem. Nenhuma assinatura existente muda.
- **Nenhuma migração.** U4 é a única unidade que não altera o esquema do banco.
- **Cobertura.** Nenhum limiar muda; a chave das regras passa a cobrir também as regras de U4.
- **Ambiente.** Os testes de integração exigem o Docker ativo.

[Approval Fingerprint]: sha256:090c32070b348e5cfca5b6154ea09246a3990dc47da68bbd04e08f7ab11a1031

- Approve Plan
- Request Changes

[Answer]: Approve Plan
