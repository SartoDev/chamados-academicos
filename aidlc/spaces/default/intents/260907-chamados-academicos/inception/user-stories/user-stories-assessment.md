# Avaliação — Histórias de Usuário são necessárias?

## Decisão

**Executar.**

## Fundamento

O documento de requisitos (`../requirements-analysis/requirements.md`) descreve *o que* o sistema faz, em 12 grupos funcionais. O que ele não descreve é *para quem cada comportamento existe* e *o que caracteriza pronto* do ponto de vista de quem usa. Três sinais tornam essa lacuna cara neste projeto:

1. **Cinco perfis com jornadas distintas e conflitantes.** Aluno e Professor abrem chamados; Atendente trabalha uma fila; Gestor redistribui e acompanha; Administrador configura. O mesmo requisito — por exemplo FR4.4, listar chamados — significa coisas diferentes conforme quem lista. Sem histórias por persona, essa diferença só apareceria na geração de código.

2. **Regra de negócio com estado.** A máquina de transições de FR8, a janela de reabertura de 3 dias e a matriz de visibilidade por setor não são CRUD. São comportamentos com pré-condição, ator e resultado observável — exatamente o que critérios de aceitação em Given/When/Then capturam e uma tabela de requisitos não captura.

3. **Rastreabilidade é critério de sucesso do projeto.** A postura de testes afirmada em `../practices-discovery/team-practices.md` fixou cobertura por requisito como critério principal: cada requisito aprovado precisa de um teste que o verifique, com tabela ligando um ao outro. As histórias são o elo que torna essa tabela construível — requisito, história, critério de aceitação, teste.

## Fatores Considerados

| Fator | Situação neste projeto |
|-------|------------------------|
| Tipo de projeto | Sistema novo, voltado ao usuário final, com interface web |
| Personas | Cinco perfis de acesso distintos |
| Complexidade de regra | Máquina de estados, autorização por perfil e setor, janela temporal |
| Coordenação entre times | Nenhuma — desenvolvedor único |
| Escopo voltado ao usuário | Praticamente todo o corte mínimo |

O único fator que pesaria contra é a ausência de coordenação entre times. Ele não basta: as histórias aqui servem à especificação e à rastreabilidade, não à comunicação entre equipes.

## Onde as Histórias Agregam Mais

- **Ciclo de vida do chamado e atendimento (FR4, FR5, FR8):** onde a regra de negócio vive. Cada transição precisa de ator, pré-condição e resultado observável.
- **Visibilidade e autorização (FR5.1, FR5.6, FR6.5):** os requisitos foram apontados na revisão como ambíguos entre si. Escrever a história de cada perfil força a contradição a aparecer.
- **Comunicação no chamado (FR6):** é o valor central identificado na Captura de Intenção, e o requisito sozinho não expressa a experiência dos dois lados.

## Onde as Histórias Agregam Menos

- **Catálogos (FR3):** operações administrativas de manutenção, próximas de CRUD puro. Histórias existirão, mas curtas.

## Tratamento dos Requisitos Não Funcionais

Decidido na Q5 e refinado na Q7 desta etapa. Os nove NFR se dividem em dois grupos:

| Grupo | NFR | Tratamento |
|-------|-----|-----------|
| Com ator de usuário e valor observável | NFR2, NFR4, NFR5, NFR6 | Viram histórias próprias em US5, com critérios de aceitação em Given/When/Then |
| Sem ator de usuário | NFR1, NFR3, NFR7, NFR8, NFR9 | Viram critérios transversais (CT1 a CT5) no topo de `stories.md`, aplicáveis a toda história |

O corte segue a regra de fase da Concepção: toda história identifica ator, ação e valor de negócio. Transformar "erros usam o envelope X" ou "senha usa hash resistente" em história produziria o anti-padrão da história técnica sem ator, que a orientação de histórias adverte contra.

## Correção sobre o Rascunho Inicial

A primeira versão deste documento afirmava que nenhum requisito não funcional viraria história. Isso foi superado pela decisão registrada na Q5 e delimitado pela Q7: quatro deles viram história, cinco viram critério transversal.

## Resultado da Elaboração em Grupo

O rascunho passou por três revisões independentes e cegas, registradas em `contributions/`: design (experiência de uso e fidelidade das personas), desenvolvimento (viabilidade e dimensionamento), qualidade (testabilidade dos critérios).

As três levantaram cerca de vinte pontos. Como redator, integrei tudo que tinha resposta tecnicamente clara e levei ao autor do projeto apenas três julgamentos legítimos dos dois lados, mais uma pergunta sobre a contradição que uma das respostas criou com uma regra já afirmada. O resultado dessas quatro decisões está em `stories.md`.

## Assumptions & Open Questions

None.
