import { createTicketScenario, type TicketScenario } from '../../u2-tickets/support/scenario.js';
import { ticketTransferredFromSecretariaToFinanceiro } from '../../u2-tickets/support/factories.js';
import type { TestApp } from '../../u1-foundation/support/test-app.js';
import { controlledTicket, recordReopenHistory } from './factories.js';

const at = (iso: string): Date => new Date(iso);

/** The period every suite of U4 asks for: closed at the start, open at the end, in UTC (BR2.1). */
export const PERIOD_FROM = '2026-09-01T00:00:00.000Z';
export const PERIOD_TO = '2026-10-01T00:00:00.000Z';

/** The instant the controlled clock of the application stands at while the suites run. */
export const REPORT_NOW = at(PERIOD_TO);

export const HOUR_SECONDS = 3600;

export type ReportTicketKey =
  | 'openedAtLowerBound'
  | 'inAnalysis'
  | 'closedWithAssignee'
  | 'closedWithoutAssignee'
  | 'reopenedAndClosedAgain'
  | 'reopenedStillOpen'
  | 'transferredToFinanceiro'
  | 'financeClosed'
  | 'openedBeforePeriod'
  | 'openedAtUpperBound'
  | 'closedAtLowerBound'
  | 'closedAtUpperBound'
  | 'closedBeforePeriod';

export interface ReportScenario extends TicketScenario {
  tickets: Record<ReportTicketKey, string>;
}

/**
 * Tickets of two sectors, with and without an assignee, closed at instants chosen by hand, one
 * ticket reopened and closed again and another reopened and still open. Together they make the
 * two samples of the averages, the difference between the opening cut of the counts and the
 * closing cut of the durations, and both bounds of the period verifiable by arithmetic.
 *
 * Expected numbers, all derived from the table below:
 *
 * | ticket                 | sector      | opened      | closed      | handling |
 * |------------------------|-------------|-------------|-------------|----------|
 * | openedAtLowerBound     | Secretaria  | 09-01 00:00 | —           | —        |
 * | inAnalysis             | Secretaria  | 09-10 09:00 | —           | 2 h      |
 * | closedWithAssignee     | Secretaria  | 09-05 08:00 | 09-06 08:00 | 1 h      |
 * | closedWithoutAssignee  | Secretaria  | 09-07 08:00 | 09-07 11:00 | —        |
 * | reopenedAndClosedAgain | Secretaria  | 09-08 08:00 | 09-12 08:00 | 1 h      |
 * | reopenedStillOpen      | Secretaria  | 09-09 08:00 | —           | —        |
 * | transferredToFinanceiro| Financeiro  | 09-13 08:00 | —           | —        |
 * | financeClosed          | Financeiro  | 09-11 08:00 | 09-11 12:00 | 1 h      |
 * | openedBeforePeriod     | Secretaria  | 08-31 23:00 | —           | —        |
 * | openedAtUpperBound     | Secretaria  | 10-01 00:00 | —           | —        |
 * | closedAtLowerBound     | Secretaria  | 08-31 22:00 | 09-01 00:00 | —        |
 * | closedAtUpperBound     | Secretaria  | 09-30 20:00 | 10-01 00:00 | —        |
 * | closedBeforePeriod     | Secretaria  | 08-20 08:00 | 08-20 10:00 | —        |
 */
export async function createReportScenario(testApp: TestApp): Promise<ReportScenario> {
  const { prisma } = testApp;
  testApp.clock.set(REPORT_NOW);
  const scenario = await createTicketScenario(testApp);

  const openedAtLowerBound = await controlledTicket(prisma, scenario, {
    title: 'Aberto no limite inicial do período',
    openedAt: at('2026-09-01T00:00:00.000Z'),
  });

  const inAnalysis = await controlledTicket(prisma, scenario, {
    title: 'Em análise com responsável',
    openedAt: at('2026-09-10T09:00:00.000Z'),
    statusId: scenario.statuses.IN_ANALYSIS,
    assigneeId: scenario.users.agent,
    firstAssignedAt: at('2026-09-10T11:00:00.000Z'),
  });

  const closedWithAssignee = await controlledTicket(prisma, scenario, {
    title: 'Encerrado com responsável',
    openedAt: at('2026-09-05T08:00:00.000Z'),
    closedAt: at('2026-09-06T08:00:00.000Z'),
    assigneeId: scenario.users.agent,
    firstAssignedAt: at('2026-09-05T09:00:00.000Z'),
  });

  const closedWithoutAssignee = await controlledTicket(prisma, scenario, {
    title: 'Encerrado sem nunca ter tido responsável',
    openedAt: at('2026-09-07T08:00:00.000Z'),
    closedAt: at('2026-09-07T11:00:00.000Z'),
  });

  // Closed, reopened and closed again: `closedAt` holds only the most recent closing (BR4.2),
  // and the transfer that removed the assignee does not move the handling milestone (BR4.1).
  const reopenedAndClosedAgain = await controlledTicket(prisma, scenario, {
    title: 'Reaberto e encerrado de novo',
    openedAt: at('2026-09-08T08:00:00.000Z'),
    closedAt: at('2026-09-12T08:00:00.000Z'),
    firstAssignedAt: at('2026-09-08T09:00:00.000Z'),
    unassignedAt: at('2026-09-08T20:00:00.000Z'),
  });
  await recordReopenHistory(prisma, scenario, reopenedAndClosedAgain.id, {
    firstClosedAt: at('2026-09-09T08:00:00.000Z'),
    reopenedAt: at('2026-09-10T08:00:00.000Z'),
    closedAgainAt: at('2026-09-12T08:00:00.000Z'),
  });

  // Reopened and still open: the reopening cleared `closedAt`, so it leaves both samples.
  const reopenedStillOpen = await controlledTicket(prisma, scenario, {
    title: 'Reaberto e ainda aberto',
    openedAt: at('2026-09-09T08:00:00.000Z'),
  });
  await recordReopenHistory(prisma, scenario, reopenedStillOpen.id, {
    firstClosedAt: at('2026-09-10T08:00:00.000Z'),
    reopenedAt: at('2026-09-11T08:00:00.000Z'),
  });

  // Passed through Secretaria and sits in Financeiro: the manager of Secretaria still sees it.
  const transferredToFinanceiro = await ticketTransferredFromSecretariaToFinanceiro(
    prisma,
    scenario,
    { title: 'Transferido para o Financeiro', openedAt: at('2026-09-13T08:00:00.000Z') },
  );

  // Never touched Secretaria: it belongs to the numbers of the administrator only.
  const financeClosed = await controlledTicket(prisma, scenario, {
    title: 'Encerrado no Financeiro',
    openedAt: at('2026-09-11T08:00:00.000Z'),
    closedAt: at('2026-09-11T12:00:00.000Z'),
    sectorId: scenario.sectors.financeiro,
    categoryId: scenario.categories.boletos,
    assigneeId: scenario.users.financeAgent,
    firstAssignedAt: at('2026-09-11T09:00:00.000Z'),
  });

  const openedBeforePeriod = await controlledTicket(prisma, scenario, {
    title: 'Aberto antes do período',
    openedAt: at('2026-08-31T23:00:00.000Z'),
  });

  const openedAtUpperBound = await controlledTicket(prisma, scenario, {
    title: 'Aberto exatamente no limite final',
    openedAt: at(PERIOD_TO),
  });

  // Opened before the period and closed inside it: it enters the averages with the whole
  // interval, which is larger than the period itself, and stays out of the counts.
  const closedAtLowerBound = await controlledTicket(prisma, scenario, {
    title: 'Encerrado exatamente no limite inicial',
    openedAt: at('2026-08-31T22:00:00.000Z'),
    closedAt: at(PERIOD_FROM),
  });

  const closedAtUpperBound = await controlledTicket(prisma, scenario, {
    title: 'Encerrado exatamente no limite final',
    openedAt: at('2026-09-30T20:00:00.000Z'),
    closedAt: at(PERIOD_TO),
  });

  const closedBeforePeriod = await controlledTicket(prisma, scenario, {
    title: 'Encerrado antes do período',
    openedAt: at('2026-08-20T08:00:00.000Z'),
    closedAt: at('2026-08-20T10:00:00.000Z'),
  });

  return {
    ...scenario,
    tickets: {
      openedAtLowerBound: openedAtLowerBound.id,
      inAnalysis: inAnalysis.id,
      closedWithAssignee: closedWithAssignee.id,
      closedWithoutAssignee: closedWithoutAssignee.id,
      reopenedAndClosedAgain: reopenedAndClosedAgain.id,
      reopenedStillOpen: reopenedStillOpen.id,
      transferredToFinanceiro: transferredToFinanceiro.id,
      financeClosed: financeClosed.id,
      openedBeforePeriod: openedBeforePeriod.id,
      openedAtUpperBound: openedAtUpperBound.id,
      closedAtLowerBound: closedAtLowerBound.id,
      closedAtUpperBound: closedAtUpperBound.id,
      closedBeforePeriod: closedBeforePeriod.id,
    },
  };
}

/** The whole period, as the filter the public service of U2 receives for the counts. */
export const PERIOD_FILTER = { openedFrom: PERIOD_FROM, openedTo: PERIOD_TO } as const;

/** The same period, as the filter of the duration averages, which cuts by the closing. */
export const CLOSING_PERIOD_FILTER = { closedFrom: PERIOD_FROM, closedTo: PERIOD_TO } as const;

/** Tickets of the manager of Secretaria whose opening falls inside the period (8 of them). */
export const MANAGER_COUNT_TOTAL = 8;
/** The administrator also sees the ticket that never touched Secretaria. */
export const ADMIN_COUNT_TOTAL = 9;

/** Resolution sample of the manager: 24 h + 3 h + 96 h + 2 h over four tickets. */
export const MANAGER_RESOLUTION_SAMPLE = 4;
export const MANAGER_AVERAGE_RESOLUTION_SECONDS = ((24 + 3 + 96 + 2) * HOUR_SECONDS) / 4;
/** Handling sample of the manager: only the two closed tickets that gained an assignee. */
export const MANAGER_HANDLING_SAMPLE = 2;
export const MANAGER_AVERAGE_HANDLING_SECONDS = HOUR_SECONDS;

/** The administrator adds the ticket closed in Financeiro: 4 h of resolution, 1 h of handling. */
export const ADMIN_RESOLUTION_SAMPLE = 5;
export const ADMIN_AVERAGE_RESOLUTION_SECONDS = ((24 + 3 + 96 + 2 + 4) * HOUR_SECONDS) / 5;
export const ADMIN_HANDLING_SAMPLE = 3;
export const ADMIN_AVERAGE_HANDLING_SECONDS = HOUR_SECONDS;
