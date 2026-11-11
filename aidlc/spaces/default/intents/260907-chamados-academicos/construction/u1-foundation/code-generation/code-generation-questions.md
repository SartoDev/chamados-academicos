# Geração de Código — U1 Fundação (`u1-foundation`) — Aprovação do Plano

Base: `code-generation-plan.md` (13 passos, com o contrato de testes embutido) e `unit-test-instructions.md` desta pasta.

## Plan Approval

Aprovar exatamente este plano de geração de código de U1, o contrato de testes embutido nele e as instruções de teste?

Pontos de atenção:
- **Cobertura.** O plano soma o piso de 80% de linhas do escopo `feature`, medido sobre o código que não é andaime, aos limiares de `team.md`: 90% de ramos em guards e 80% em services. Nenhum dos dois é relaxado.
- **Git.** O plano inicializa um repositório Git local, sem nenhum commit nem push.
- **Achado R-04.** O desenho funcional segue BR8.8, e os rótulos de status vão sem o campo `active`. A divergência fica registrada no resumo do código.

[Approval Fingerprint]: sha256:afd876a4168127297907a1327763abc30b506e168b7c5725ef430655a8626a74

- Approve Plan
- Request Changes

[Answer]: Approve Plan
