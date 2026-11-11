import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { PrismaService } from '../../../src/common/prisma/prisma.service.js';
import { TransactionRunner } from '../../../src/common/prisma/transaction-runner.js';
import { resetToInitialLoad } from '../u1-foundation/support/database.js';
import { createSector } from '../u1-foundation/support/factories.js';
import { createTestApp, type TestApp } from '../u1-foundation/support/test-app.js';

describe('ambient transaction (BR7.1, Q5)', () => {
  let testApp: TestApp;
  let transactions: TransactionRunner;
  let prisma: PrismaService;

  beforeAll(async () => {
    testApp = await createTestApp();
    transactions = testApp.app.get(TransactionRunner);
    prisma = testApp.prisma;
  });

  afterAll(async () => {
    await testApp.close();
  });

  beforeEach(async () => {
    await resetToInitialLoad(testApp.prisma, testApp.seed);
  });

  it('gives the regular client outside a transaction and the transactional one inside it', async () => {
    expect(transactions.isInTransaction()).toBe(false);
    const outside = transactions.db();

    await transactions.run(async () => {
      expect(transactions.isInTransaction()).toBe(true);
      expect(transactions.db()).not.toBe(outside);
    });

    expect(transactions.isInTransaction()).toBe(false);
    expect(transactions.db()).toBe(outside);
  });

  it('lets a nested run join the transaction already open instead of opening another', async () => {
    let inner: unknown;
    let outer: unknown;

    await transactions.run(async () => {
      outer = transactions.db();
      await transactions.run(async () => {
        inner = transactions.db();
        await transactions.db().sector.create({ data: { name: 'Protocolo' } });
      });
    });

    expect(inner).toBe(outer);
    expect(await prisma.sector.count({ where: { name: 'Protocolo' } })).toBe(1);
  });

  it('undoes everything the operation wrote when a later step fails (BR6.3)', async () => {
    const failure = new Error('forced failure after the writes');

    await expect(
      transactions.run(async () => {
        await transactions.db().sector.create({ data: { name: 'Ouvidoria' } });
        await transactions.db().sector.create({ data: { name: 'Protocolo' } });
        throw failure;
      }),
    ).rejects.toBe(failure);

    expect(await prisma.sector.count({ where: { name: { in: ['Ouvidoria', 'Protocolo'] } } })).toBe(
      0,
    );
  });

  it('undoes the work of a nested run together with the operation that opened it', async () => {
    await expect(
      transactions.run(async () => {
        await transactions.run(async () => {
          await transactions.db().sector.create({ data: { name: 'Biblioteca' } });
        });
        throw new Error('forced failure after the nested run');
      }),
    ).rejects.toThrow('forced failure after the nested run');

    expect(await prisma.sector.count({ where: { name: 'Biblioteca' } })).toBe(0);
  });

  it('keeps simultaneous operations in transactions of their own', async () => {
    await createSector(prisma, { name: 'Secretaria' });

    const [kept] = await Promise.allSettled([
      transactions.run(async () => {
        await transactions.db().sector.create({ data: { name: 'Financeiro' } });
        return 'kept';
      }),
      transactions.run(async () => {
        await transactions.db().sector.create({ data: { name: 'Coordenação' } });
        throw new Error('forced failure in the parallel operation');
      }),
    ]);

    expect(kept).toEqual({ status: 'fulfilled', value: 'kept' });
    expect(await prisma.sector.findUnique({ where: { name: 'Financeiro' } })).not.toBeNull();
    expect(await prisma.sector.findUnique({ where: { name: 'Coordenação' } })).toBeNull();
  });
});
