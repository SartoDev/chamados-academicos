import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { CatalogPublicService } from '../../../src/catalog/catalog-public.service.js';
import { UsersPublicService } from '../../../src/users/users-public.service.js';
import { expectDomainError } from '../../support/expect-domain-error.js';
import { resetToInitialLoad } from './support/database.js';
import {
  activeAgentOf,
  activeManagerOf,
  activeStudent,
  createCategory,
  createPriority,
  createSector,
} from './support/factories.js';
import { createTestApp, type TestApp } from './support/test-app.js';

const UNKNOWN_ID = '00000000-0000-4000-8000-00000000f00d';

describe('public services of U1 against PostgreSQL (BR8.2 to BR8.9)', () => {
  let testApp: TestApp;
  let usersPublic: UsersPublicService;
  let catalogPublic: CatalogPublicService;

  beforeAll(async () => {
    testApp = await createTestApp();
    usersPublic = testApp.app.get(UsersPublicService);
    catalogPublic = testApp.app.get(CatalogPublicService);
  });

  afterAll(async () => {
    await testApp.close();
  });

  beforeEach(async () => {
    await resetToInitialLoad(testApp.prisma, testApp.seed);
  });

  describe('UsersPublicService.findSummariesByIds (BR8.2)', () => {
    it('returns summaries of inactive users too, without e-mail or password hash', async () => {
      const secretaria = await createSector(testApp.prisma, { name: 'Secretaria' });
      const agent = await activeAgentOf(testApp.prisma, secretaria.id, { name: 'Gabi' });
      const formerStudent = await activeStudent(testApp.prisma, { name: 'Hugo', active: false });

      const summaries = await usersPublic.findSummariesByIds([agent.id, formerStudent.id]);

      expect(summaries.sort((a, b) => a.name.localeCompare(b.name))).toEqual([
        { id: agent.id, name: 'Gabi', role: 'AGENT', sectorId: secretaria.id, active: true },
        { id: formerStudent.id, name: 'Hugo', role: 'STUDENT', sectorId: null, active: false },
      ]);
    });

    it('omits unknown, malformed and repeated identifiers without failing', async () => {
      const student = await activeStudent(testApp.prisma);

      expect(
        await usersPublic.findSummariesByIds([student.id, student.id, UNKNOWN_ID, 'bad']),
      ).toHaveLength(1);
      expect(await usersPublic.findSummariesByIds([])).toEqual([]);
      expect(await usersPublic.findSummariesByIds(['bad'])).toEqual([]);
    });
  });

  describe('UsersPublicService.isAssignableInSector (BR8.3)', () => {
    it('accepts active agents and managers of the sector, even if the sector was deactivated', async () => {
      const secretaria = await createSector(testApp.prisma, { name: 'Secretaria' });
      const agent = await activeAgentOf(testApp.prisma, secretaria.id);
      const manager = await activeManagerOf(testApp.prisma, secretaria.id);
      await testApp.prisma.sector.update({ where: { id: secretaria.id }, data: { active: false } });

      expect(await usersPublic.isAssignableInSector(agent.id, secretaria.id)).toBe(true);
      expect(await usersPublic.isAssignableInSector(manager.id, secretaria.id)).toBe(true);
    });

    it('refuses other sectors, inactive users, requesters and unknown identifiers', async () => {
      const secretaria = await createSector(testApp.prisma, { name: 'Secretaria' });
      const financeiro = await createSector(testApp.prisma, { name: 'Financeiro' });
      const agent = await activeAgentOf(testApp.prisma, secretaria.id);
      const inactiveAgent = await activeAgentOf(testApp.prisma, secretaria.id, { active: false });
      const student = await activeStudent(testApp.prisma);

      expect(await usersPublic.isAssignableInSector(agent.id, financeiro.id)).toBe(false);
      expect(await usersPublic.isAssignableInSector(inactiveAgent.id, secretaria.id)).toBe(false);
      expect(await usersPublic.isAssignableInSector(student.id, secretaria.id)).toBe(false);
      expect(await usersPublic.isAssignableInSector(UNKNOWN_ID, secretaria.id)).toBe(false);
      expect(await usersPublic.isAssignableInSector('bad', secretaria.id)).toBe(false);
    });
  });

  describe('CatalogPublicService', () => {
    it('returns an available category with its sector and refuses inactive category or sector (BR8.4)', async () => {
      const open = await createSector(testApp.prisma, { name: 'Aberto' });
      const closing = await createSector(testApp.prisma, { name: 'Fechando' });
      const available = await createCategory(testApp.prisma, open.id, { name: 'Matrícula' });
      const inactive = await createCategory(testApp.prisma, open.id, { active: false });
      const orphaned = await createCategory(testApp.prisma, closing.id);
      await testApp.prisma.sector.update({ where: { id: closing.id }, data: { active: false } });

      expect(await catalogPublic.getActiveCategory(available.id)).toEqual({
        id: available.id,
        name: 'Matrícula',
        active: true,
        sectorId: open.id,
      });
      await expectDomainError(
        catalogPublic.getActiveCategory(inactive.id),
        'CATALOG_ITEM_INACTIVE',
      );
      await expectDomainError(
        catalogPublic.getActiveCategory(orphaned.id),
        'CATALOG_ITEM_INACTIVE',
      );
      await expectDomainError(
        catalogPublic.getActiveCategory(UNKNOWN_ID),
        'CATALOG_ITEM_NOT_FOUND',
      );
      await expectDomainError(catalogPublic.getActiveCategory('bad'), 'CATALOG_ITEM_NOT_FOUND');
    });

    it('returns active sectors and priorities only (BR8.5)', async () => {
      const sector = await createSector(testApp.prisma, { name: 'Protocolo' });
      const closed = await createSector(testApp.prisma, { name: 'Antigo', active: false });
      const normal = await testApp.prisma.priority.findUniqueOrThrow({
        where: { label: 'Normal' },
      });
      const retired = await createPriority(testApp.prisma, { label: 'Retirada', active: false });

      expect(await catalogPublic.getActiveSector(sector.id)).toEqual({
        id: sector.id,
        name: 'Protocolo',
        active: true,
      });
      expect(await catalogPublic.getActivePriority(normal.id)).toEqual({
        id: normal.id,
        name: 'Normal',
        active: true,
      });
      await expectDomainError(catalogPublic.getActiveSector(closed.id), 'CATALOG_ITEM_INACTIVE');
      await expectDomainError(catalogPublic.getActiveSector('bad'), 'CATALOG_ITEM_NOT_FOUND');
      await expectDomainError(catalogPublic.getActivePriority(retired.id), 'CATALOG_ITEM_INACTIVE');
      await expectDomainError(
        catalogPublic.getActivePriority(UNKNOWN_ID),
        'CATALOG_ITEM_NOT_FOUND',
      );
    });

    it('returns the single default priority and fails if the invariant is broken (BR8.6)', async () => {
      expect((await catalogPublic.getDefaultPriority()).name).toBe('Normal');

      await testApp.prisma.priority.update({ where: { label: 'Normal' }, data: { active: false } });
      await expectDomainError(catalogPublic.getDefaultPriority(), 'INTERNAL_ERROR');

      await testApp.prisma.priority.update({
        where: { label: 'Normal' },
        data: { isDefault: false },
      });
      await expectDomainError(catalogPublic.getDefaultPriority(), 'INTERNAL_ERROR');
    });

    it('returns a status by one of the four keys (BR8.7)', async () => {
      const waiting = await catalogPublic.getStatusByKey('WAITING_REQUESTER');

      expect(waiting).toMatchObject({ key: 'WAITING_REQUESTER', name: 'Aguardando solicitante' });
      expect(waiting).not.toHaveProperty('active');
      await expectDomainError(catalogPublic.getStatusByKey('REOPENED'), 'CATALOG_ITEM_NOT_FOUND');
    });

    it('returns labels of inactive items too, omitting unknown identifiers (BR8.8)', async () => {
      const sector = await createSector(testApp.prisma, { name: 'Biblioteca', active: false });
      const category = await createCategory(testApp.prisma, sector.id, {
        name: 'Empréstimo',
        active: false,
      });
      const open = await testApp.prisma.status.findUniqueOrThrow({ where: { key: 'OPEN' } });
      const retired = await createPriority(testApp.prisma, { label: 'Retirada', active: false });

      const labels = await catalogPublic.findLabels({
        categoryIds: [category.id, UNKNOWN_ID],
        sectorIds: [sector.id, 'bad'],
        statusIds: [open.id],
        priorityIds: [retired.id],
      });

      expect(labels).toEqual({
        categories: [{ id: category.id, name: 'Empréstimo', active: false }],
        sectors: [{ id: sector.id, name: 'Biblioteca', active: false }],
        statuses: [{ id: open.id, name: 'Aberto' }],
        priorities: [{ id: retired.id, name: 'Retirada', active: false }],
      });
      expect(await catalogPublic.findLabels({})).toEqual({
        categories: [],
        sectors: [],
        statuses: [],
        priorities: [],
      });
    });
  });
});
