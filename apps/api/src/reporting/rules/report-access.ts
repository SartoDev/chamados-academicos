import type { Role } from '../../common/roles.js';

/**
 * Who may call each operation of U4 (BR1.1). Pure module and single source of truth: the route
 * markers of the controller are built from this table, so the declared rule and the enforced
 * rule can never drift apart. The real protection is the global deny-by-default guard; this
 * module only says what the markers declare.
 */
export const REPORT_OPERATIONS = [
  'ticketCounts',
  'durationAverages',
  'ticketSearch',
  'ratingSummary',
] as const;

export type ReportOperation = (typeof REPORT_OPERATIONS)[number];

/**
 * Counts, averages and the rating summary belong to the manager and to the administrator; the
 * filtered listing is the manager's alone, because the administrator reads everything through
 * the general listing of U2, which has no period window (Q5). The rating summary was added by
 * U5 with the roles BR3.1 fixes, which are the same as the other two numbers of the panel.
 */
export const REPORT_OPERATION_ROLES: Record<ReportOperation, readonly Role[]> = {
  ticketCounts: ['MANAGER', 'ADMIN'],
  durationAverages: ['MANAGER', 'ADMIN'],
  ticketSearch: ['MANAGER'],
  ratingSummary: ['MANAGER', 'ADMIN'],
};

export function canRunReport(operation: ReportOperation, role: Role): boolean {
  return REPORT_OPERATION_ROLES[operation].includes(role);
}
