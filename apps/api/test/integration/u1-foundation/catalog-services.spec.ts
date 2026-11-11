import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { CategoriesService } from '../../../src/catalog/categories.service.js';
import { PrioritiesService } from '../../../src/catalog/priorities.service.js';
import { SectorsService } from '../../../src/catalog/sectors.service.js';
import { StatusesService } from '../../../src/catalog/statuses.service.js';
import { FIRST_PAGE } from '../../../src/common/pagination.js';
import { expectDomainError } from '../../support/expect-domain-error.js';
import { resetToInitialLoad } from './support/database.js';
import { createCategory, createPriority, createSector } from './support/factories.js';
import { createTestApp, type TestApp } from './support/test-app.js';

const UNKNOWN_ID = '00000000-0000-4000-8000-00000000cafe';

describe('catalog services against PostgreSQL (WF7, WF8)', () => {
  let testApp: TestApp;
  let sectors: SectorsService;
  let categories: CategoriesService;
  let statuses: StatusesService;
  let priorities: PrioritiesService;

  beforeAll(async () => {
    testApp = await createTestApp();
    sectors = testApp.app.get(SectorsService);
    categories = testApp.app.get(CategoriesService);
    statuses = testApp.app.get(StatusesService);
    priorities = testApp.app.get(PrioritiesService);
  });

  afterAll(async () => {
    await testApp.close();
  });

  beforeEach(async () => {
    await resetToInitialLoad(testApp.prisma, testApp.seed);
  });

  describe('sectors', () => {
    it('creates a sector with a trimmed name and lists it with filters', async () => {
      const created = await sectors.create({ name: '  Secretaria ' });
      await createSector(testApp.prisma, { name: 'Arquivo', active: false });

      const active = await sectors.list({ active: true }, FIRST_PAGE);
      const all = await sectors.list({}, { page: 1, pageSize: 1 });

      expect(created).toMatchObject({ name: 'Secretaria', active: true });
      expect(active.items.map((sector) => sector.name)).toEqual(['Secretaria']);
      expect(all).toMatchObject({ total: 2, pageSize: 1 });
      expect(all.items.map((sector) => sector.name)).toEqual(['Arquivo']);
    });

    it('refuses a name already used, ignoring case and counting inactive sectors (BR4.1)', async () => {
      await createSector(testApp.prisma, { name: 'Financeiro', active: false });
      const secretaria = await createSector(testApp.prisma, { name: 'Secretaria' });

      await expectDomainError(sectors.create({ name: 'FINANCEIRO' }), 'CATALOG_NAME_TAKEN');
      await expectDomainError(
        sectors.update(secretaria.id, { name: 'financeiro' }),
        'CATALOG_NAME_TAKEN',
      );
    });

    it('deactivates a sector without touching its categories (BR4.5) and answers not found otherwise', async () => {
      const secretaria = await createSector(testApp.prisma, { name: 'Secretaria' });
      const category = await createCategory(testApp.prisma, secretaria.id);

      expect((await sectors.update(secretaria.id, { active: false })).active).toBe(false);
      expect(
        (await testApp.prisma.category.findUniqueOrThrow({ where: { id: category.id } })).active,
      ).toBe(true);
      await expectDomainError(
        sectors.update(UNKNOWN_ID, { active: false }),
        'CATALOG_ITEM_NOT_FOUND',
      );
      await expectDomainError(
        sectors.update('bad-id', { active: false }),
        'CATALOG_ITEM_NOT_FOUND',
      );
    });
  });

  describe('categories', () => {
    it('creates a category in an active sector and refuses unknown or inactive sectors (BR4.2)', async () => {
      const secretaria = await createSector(testApp.prisma, { name: 'Secretaria' });
      const closed = await createSector(testApp.prisma, { name: 'Fechado', active: false });

      const created = await categories.create({ name: ' Documentos ', sectorId: secretaria.id });

      expect(created).toMatchObject({
        name: 'Documentos',
        sector: { id: secretaria.id, name: 'Secretaria' },
        active: true,
      });
      await expectDomainError(
        categories.create({ name: 'X', sectorId: UNKNOWN_ID }),
        'CATALOG_ITEM_NOT_FOUND',
      );
      await expectDomainError(
        categories.create({ name: 'X', sectorId: 'bad-id' }),
        'CATALOG_ITEM_NOT_FOUND',
      );
      await expectDomainError(
        categories.create({ name: 'X', sectorId: closed.id }),
        'CATALOG_ITEM_INACTIVE',
      );
    });

    it('keeps names unique per sector, counting inactive categories (BR4.1)', async () => {
      const secretaria = await createSector(testApp.prisma, { name: 'Secretaria' });
      const financeiro = await createSector(testApp.prisma, { name: 'Financeiro' });
      await createCategory(testApp.prisma, secretaria.id, { name: 'Boletos', active: false });

      await expectDomainError(
        categories.create({ name: 'boletos', sectorId: secretaria.id }),
        'CATALOG_NAME_TAKEN',
      );
      expect(
        (await categories.create({ name: 'Boletos', sectorId: financeiro.id })).sector.id,
      ).toBe(financeiro.id);
    });

    it('moves a category only to an active sector and keeps it in a sector deactivated later', async () => {
      const secretaria = await createSector(testApp.prisma, { name: 'Secretaria' });
      const closed = await createSector(testApp.prisma, { name: 'Fechado', active: false });
      const financeiro = await createSector(testApp.prisma, { name: 'Financeiro' });
      const category = await createCategory(testApp.prisma, secretaria.id);
      await testApp.prisma.sector.update({ where: { id: secretaria.id }, data: { active: false } });

      await expectDomainError(
        categories.update(category.id, { sectorId: closed.id }),
        'CATALOG_ITEM_INACTIVE',
      );
      expect(
        (await categories.update(category.id, { sectorId: secretaria.id, name: 'Renomeada' })).name,
      ).toBe('Renomeada');
      expect((await categories.update(category.id, { sectorId: financeiro.id })).sector.id).toBe(
        financeiro.id,
      );
      await expectDomainError(
        categories.update(UNKNOWN_ID, { active: false }),
        'CATALOG_ITEM_NOT_FOUND',
      );
    });

    it('lists only categories available for new tickets when asked (BR4.4)', async () => {
      const open = await createSector(testApp.prisma, { name: 'Aberto' });
      const closed = await createSector(testApp.prisma, { name: 'Fechado' });
      await createCategory(testApp.prisma, open.id, { name: 'Disponível' });
      await createCategory(testApp.prisma, open.id, { name: 'Desativada', active: false });
      await createCategory(testApp.prisma, closed.id, { name: 'Setor desativado' });
      await testApp.prisma.sector.update({ where: { id: closed.id }, data: { active: false } });

      const available = await categories.list({ available: true }, FIRST_PAGE);
      const unavailable = await categories.list({ available: false }, FIRST_PAGE);
      const bySector = await categories.list({ sectorId: open.id, active: true }, FIRST_PAGE);

      expect(available.items.map((c) => c.name)).toEqual(['Disponível']);
      expect(unavailable.items.map((c) => c.name).sort()).toEqual([
        'Desativada',
        'Setor desativado',
      ]);
      expect(bySector.items.map((c) => c.name)).toEqual(['Disponível']);
    });
  });

  describe('statuses', () => {
    it('lists the four statuses in the order of their keys', async () => {
      const list = await statuses.list();

      expect(list.items.map((status) => status.key)).toEqual([
        'OPEN',
        'IN_ANALYSIS',
        'WAITING_REQUESTER',
        'CLOSED',
      ]);
      expect(list).toMatchObject({ total: 4, page: 1 });
      expect(list.items[0]).not.toHaveProperty('active');
    });

    it('changes only the label, refusing a label in use and unknown statuses (BR4.6)', async () => {
      const open = await testApp.prisma.status.findUniqueOrThrow({ where: { key: 'OPEN' } });

      expect(await statuses.updateLabel(open.id, '  Novo ')).toEqual({
        id: open.id,
        key: 'OPEN',
        label: 'Novo',
      });
      await expectDomainError(statuses.updateLabel(open.id, 'ENCERRADO'), 'CATALOG_NAME_TAKEN');
      await expectDomainError(statuses.updateLabel(UNKNOWN_ID, 'Outro'), 'CATALOG_ITEM_NOT_FOUND');
      await expectDomainError(statuses.updateLabel('bad-id', 'Outro'), 'CATALOG_ITEM_NOT_FOUND');
    });
  });

  describe('priorities (BR4.7)', () => {
    async function defaultLabels(): Promise<string[]> {
      const rows = await testApp.prisma.priority.findMany({ where: { isDefault: true } });
      return rows.map((row) => row.label);
    }

    it('lists priorities in creation order and filters by state', async () => {
      await createPriority(testApp.prisma, { label: 'Crítica', active: false });

      const all = await priorities.list({}, FIRST_PAGE);
      const active = await priorities.list({ active: true }, FIRST_PAGE);

      expect(all.items.map((p) => p.label)).toEqual(['Baixa', 'Normal', 'Alta', 'Crítica']);
      expect(active.total).toBe(3);
    });

    it('creates a regular priority and a new default that takes the mark over', async () => {
      const regular = await priorities.create({ label: ' Média ' });
      const urgent = await priorities.create({ label: 'Urgente', isDefault: true });

      expect(regular).toMatchObject({ label: 'Média', isDefault: false, active: true });
      expect(urgent.isDefault).toBe(true);
      expect(await defaultLabels()).toEqual(['Urgente']);
      await expectDomainError(priorities.create({ label: 'normal' }), 'CATALOG_NAME_TAKEN');
    });

    it('moves the default mark in a single operation', async () => {
      const alta = await testApp.prisma.priority.findUniqueOrThrow({ where: { label: 'Alta' } });

      expect((await priorities.update(alta.id, { isDefault: true })).isDefault).toBe(true);
      expect(await defaultLabels()).toEqual(['Alta']);
    });

    it('refuses leaving the system without an active default priority', async () => {
      const normal = await testApp.prisma.priority.findUniqueOrThrow({
        where: { label: 'Normal' },
      });
      const inactive = await createPriority(testApp.prisma, { label: 'Antiga', active: false });

      await expectDomainError(
        priorities.update(normal.id, { isDefault: false }),
        'CATALOG_DEFAULT_PRIORITY_REQUIRED',
      );
      await expectDomainError(
        priorities.update(normal.id, { active: false }),
        'CATALOG_DEFAULT_PRIORITY_REQUIRED',
      );
      await expectDomainError(
        priorities.update(inactive.id, { isDefault: true }),
        'CATALOG_DEFAULT_PRIORITY_REQUIRED',
      );
      expect(await defaultLabels()).toEqual(['Normal']);
    });

    it('deactivates and renames regular priorities and answers not found otherwise', async () => {
      const baixa = await testApp.prisma.priority.findUniqueOrThrow({ where: { label: 'Baixa' } });

      expect(await priorities.update(baixa.id, { active: false, label: 'Mínima' })).toMatchObject({
        active: false,
        label: 'Mínima',
      });
      await expectDomainError(priorities.update(baixa.id, { label: 'ALTA' }), 'CATALOG_NAME_TAKEN');
      await expectDomainError(
        priorities.update(UNKNOWN_ID, { active: false }),
        'CATALOG_ITEM_NOT_FOUND',
      );
      await expectDomainError(
        priorities.update('bad-id', { active: false }),
        'CATALOG_ITEM_NOT_FOUND',
      );
    });

    it('keeps exactly one default under concurrent default changes', async () => {
      const baixa = await testApp.prisma.priority.findUniqueOrThrow({ where: { label: 'Baixa' } });
      const alta = await testApp.prisma.priority.findUniqueOrThrow({ where: { label: 'Alta' } });

      const results = await Promise.allSettled([
        priorities.update(baixa.id, { isDefault: true }),
        priorities.update(alta.id, { isDefault: true }),
        priorities.create({ label: 'Imediata', isDefault: true }),
      ]);

      expect(results.every((result) => result.status === 'fulfilled')).toBe(true);
      expect(await defaultLabels()).toHaveLength(1);
    });
  });
});
