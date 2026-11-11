import { describe, expect, it } from '@jest/globals';
import { ROLES, type Role } from '../../common/roles.js';
import {
  canRunReport,
  REPORT_OPERATIONS,
  REPORT_OPERATION_ROLES,
  type ReportOperation,
} from './report-access.js';

const ALLOWED: Record<ReportOperation, readonly Role[]> = {
  ticketCounts: ['MANAGER', 'ADMIN'],
  durationAverages: ['MANAGER', 'ADMIN'],
  ticketSearch: ['MANAGER'],
  ratingSummary: ['MANAGER', 'ADMIN'],
};

describe('report access (BR1.1)', () => {
  it.each(ROLES)('decides every operation for %s', (role) => {
    for (const operation of REPORT_OPERATIONS) {
      expect(canRunReport(operation, role)).toBe(ALLOWED[operation].includes(role));
    }
  });

  it('gives the counts and the averages to the manager and to the administrator', () => {
    expect(REPORT_OPERATION_ROLES.ticketCounts).toEqual(['MANAGER', 'ADMIN']);
    expect(REPORT_OPERATION_ROLES.durationAverages).toEqual(['MANAGER', 'ADMIN']);
  });

  it('gives the rating summary to the manager and to the administrator (BR3.1 of U5)', () => {
    expect(REPORT_OPERATION_ROLES.ratingSummary).toEqual(['MANAGER', 'ADMIN']);
    expect(canRunReport('ratingSummary', 'MANAGER')).toBe(true);
    expect(canRunReport('ratingSummary', 'ADMIN')).toBe(true);
  });

  it('gives the filtered listing to the manager alone (Q5)', () => {
    expect(REPORT_OPERATION_ROLES.ticketSearch).toEqual(['MANAGER']);
    expect(canRunReport('ticketSearch', 'ADMIN')).toBe(false);
  });

  it('never opens an operation to a requester or to an agent', () => {
    for (const operation of REPORT_OPERATIONS) {
      expect(canRunReport(operation, 'STUDENT')).toBe(false);
      expect(canRunReport(operation, 'PROFESSOR')).toBe(false);
      expect(canRunReport(operation, 'AGENT')).toBe(false);
    }
  });

  it('declares a non-empty list of known roles for every operation', () => {
    for (const operation of REPORT_OPERATIONS) {
      const roles = REPORT_OPERATION_ROLES[operation];
      expect(roles.length).toBeGreaterThan(0);
      expect(roles.every((role) => ROLES.includes(role))).toBe(true);
    }
  });
});
