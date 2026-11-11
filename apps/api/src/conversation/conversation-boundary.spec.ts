import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from '@jest/globals';

/**
 * BR4.4 is a boundary rule: U3 reads and writes its own table and reaches every other unit only
 * through its public service. No runtime assertion can prove a query that is absent, so this
 * reads the source of the unit and checks that no other model is ever reached through the
 * database client. It is the cheapest honest check of the rule (DB-01, ADR-005).
 */
const SOURCE_FILES = ['conversation.service.ts', 'conversation.controller.ts'] as const;

/** Every model of the shared Prisma schema that does not belong to U3. */
const MODELS_OF_OTHER_UNITS = [
  'ticket',
  'ticketHistoryEntry',
  'ticketSectorPassage',
  'notification',
  'user',
  'sector',
  'category',
  'status',
  'priority',
] as const;

function sourceOf(file: string): string {
  return readFileSync(fileURLToPath(new URL(file, import.meta.url)), 'utf8');
}

describe('boundary between units (BR4.4, DB-01)', () => {
  it('reaches no table of another unit through the database client', () => {
    for (const file of SOURCE_FILES) {
      const source = sourceOf(file);
      for (const model of MODELS_OF_OTHER_UNITS) {
        expect({ file, query: `db.${model}` }).toEqual({
          file,
          query: source.includes(`db.${model}.`) ? `forbidden query db.${model}` : `db.${model}`,
        });
      }
    }
  });

  it('touches only the messages table of U3', () => {
    const service = sourceOf('conversation.service.ts');

    const queried = [...service.matchAll(/this\.db\.(\w+)\./g)].map((match) => match[1]);

    expect(queried.length).toBeGreaterThan(0);
    expect([...new Set(queried)]).toEqual(['message']);
  });

  it('asks another unit only through its public service', () => {
    const service = sourceOf('conversation.service.ts');

    expect(service).toContain('TicketsPublicService');
    expect(service).toContain('NotificationsPublicService');
    expect(service).toContain('UsersPublicService');
    // Nothing internal of another unit is imported: no service, presenter or rule of U1 or U2.
    const imports = [...service.matchAll(/from '(\.\.\/[^']+)'/g)].map((match) => match[1]);
    const fromOtherUnits = imports.filter((path) =>
      /^\.\.\/(tickets|notifications|users|catalog|auth)\//.test(path),
    );
    expect(fromOtherUnits.sort()).toEqual([
      '../auth/actor.js',
      '../notifications/notifications-public.service.js',
      '../tickets/tickets-public.service.js',
      '../users/users-public.service.js',
    ]);
  });
});
