import type { PrismaService } from '../../../../src/common/prisma/prisma.service.js';
import type { SeedService } from '../../../../src/seed/seed.service.js';

/**
 * Every table of the test database, the tables of U5 and U3 before those of U2 and those of U2
 * before the tables of U1 they reference. The suites of U1 to U5 then start from the same empty
 * database whatever ran before them. RESTART IDENTITY also resets the ticket number sequence,
 * so visible identifiers are deterministic in every suite. Constant identifiers only; no
 * external input reaches this SQL.
 */
const TEST_TABLES = [
  'ticket_ratings',
  'messages',
  'notifications',
  'ticket_history_entries',
  'ticket_sector_passages',
  'tickets',
  'users',
  'categories',
  'sectors',
  'statuses',
  'priorities',
] as const;

export async function truncateTestTables(prisma: PrismaService): Promise<void> {
  const tableList = TEST_TABLES.map((table) => `"${table}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`);
}

/** Name used by the suites of U1, which call it before running their own initial load. */
export const truncateU1Tables = truncateTestTables;

/** Isolation for every test: empty U1 tables, then the application's own initial load. */
export async function resetToInitialLoad(prisma: PrismaService, seed: SeedService): Promise<void> {
  await truncateU1Tables(prisma);
  await seed.run();
}
