import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { resetToInitialLoad } from './support/database.js';
import { createCategory, createSector, createUser } from './support/factories.js';
import { API, expectErrorEnvelope, http, sessionCookie } from './support/http.js';
import { createTestApp, TEST_INITIAL_ADMIN_EMAIL, type TestApp } from './support/test-app.js';

const UNKNOWN_ID = '00000000-0000-4000-8000-0000000000bb';

describe('API-U1 catalogs (US4.2)', () => {
  let testApp: TestApp;
  let adminCookie: string;
  let studentCookie: string;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.close();
  });

  beforeEach(async () => {
    await resetToInitialLoad(testApp.prisma, testApp.seed);
    const admin = await testApp.prisma.user.findUniqueOrThrow({
      where: { email: TEST_INITIAL_ADMIN_EMAIL },
    });
    adminCookie = sessionCookie(testApp, admin.id);
    studentCookie = sessionCookie(testApp, (await createUser(testApp.prisma)).id);
  });

  it('starts with four statuses and three priorities, Normal as default (AC4.2.5)', async () => {
    const statuses = await http(testApp)
      .get(`${API}/statuses`)
      .set('Cookie', studentCookie)
      .expect(200);
    const priorities = await http(testApp)
      .get(`${API}/priorities`)
      .set('Cookie', studentCookie)
      .expect(200);

    expect(statuses.body.items.map((s: { label: string }) => s.label)).toEqual([
      'Aberto',
      'Em análise',
      'Aguardando solicitante',
      'Encerrado',
    ]);
    expect(statuses.body.total).toBe(4);
    expect(
      priorities.body.items.map((p: { label: string; isDefault: boolean }) => [
        p.label,
        p.isDefault,
      ]),
    ).toEqual([
      ['Baixa', false],
      ['Normal', true],
      ['Alta', false],
    ]);
  });

  describe('sectors', () => {
    it('creates a sector that becomes available as a category destination (AC4.2.1)', async () => {
      const sector = await http(testApp)
        .post(`${API}/sectors`)
        .set('Cookie', adminCookie)
        .send({ name: 'Protocolo' })
        .expect(201);

      expect(sector.body).toMatchObject({ name: 'Protocolo', active: true });
      await http(testApp)
        .post(`${API}/categories`)
        .set('Cookie', adminCookie)
        .send({ name: 'Requerimentos', sectorId: sector.body.id })
        .expect(201);
      const listed = await http(testApp)
        .get(`${API}/sectors`)
        .query({ active: true })
        .set('Cookie', studentCookie)
        .expect(200);
      expect(listed.body.items.map((s: { name: string }) => s.name)).toEqual(['Protocolo']);
    });

    it('refuses a repeated name and updates or deactivates an existing sector', async () => {
      const sector = await createSector(testApp.prisma, { name: 'Financeiro' });

      expectErrorEnvelope(
        await http(testApp)
          .post(`${API}/sectors`)
          .set('Cookie', adminCookie)
          .send({ name: 'FINANCEIRO' }),
        409,
        'CATALOG_NAME_TAKEN',
      );
      const updated = await http(testApp)
        .patch(`${API}/sectors/${sector.id}`)
        .set('Cookie', adminCookie)
        .send({ name: 'Tesouraria', active: false })
        .expect(200);
      expect(updated.body).toMatchObject({ name: 'Tesouraria', active: false });
      expectErrorEnvelope(
        await http(testApp)
          .patch(`${API}/sectors/${UNKNOWN_ID}`)
          .set('Cookie', adminCookie)
          .send({ active: true }),
        404,
        'CATALOG_ITEM_NOT_FOUND',
      );
      expectErrorEnvelope(
        await http(testApp).post(`${API}/sectors`).set('Cookie', adminCookie).send({ name: '   ' }),
        400,
        'VALIDATION_FAILED',
      );
    });
  });

  describe('categories', () => {
    it('refuses a category without sector or with an inactive sector (AC4.2.2)', async () => {
      const closed = await createSector(testApp.prisma, { name: 'Fechado', active: false });

      const withoutSector = expectErrorEnvelope(
        await http(testApp)
          .post(`${API}/categories`)
          .set('Cookie', adminCookie)
          .send({ name: 'Solta' }),
        400,
        'VALIDATION_FAILED',
      );
      expect(withoutSector.details).toEqual([{ field: 'sectorId', code: 'INVALID_UUID' }]);
      expectErrorEnvelope(
        await http(testApp)
          .post(`${API}/categories`)
          .set('Cookie', adminCookie)
          .send({ name: 'Solta', sectorId: closed.id }),
        422,
        'CATALOG_ITEM_INACTIVE',
      );
    });

    it('stops offering inactive categories and categories of inactive sectors, keeping their names readable (AC4.2.3, AC4.2.4)', async () => {
      const open = await createSector(testApp.prisma, { name: 'Aberto' });
      const closing = await createSector(testApp.prisma, { name: 'Encerrando' });
      await createCategory(testApp.prisma, open.id, { name: 'Disponível' });
      const retired = await createCategory(testApp.prisma, open.id, { name: 'Aposentada' });
      await createCategory(testApp.prisma, closing.id, { name: 'Do setor encerrando' });

      await http(testApp)
        .patch(`${API}/categories/${retired.id}`)
        .set('Cookie', adminCookie)
        .send({ active: false })
        .expect(200);
      await http(testApp)
        .patch(`${API}/sectors/${closing.id}`)
        .set('Cookie', adminCookie)
        .send({ active: false })
        .expect(200);

      const available = await http(testApp)
        .get(`${API}/categories`)
        .query({ available: true })
        .set('Cookie', studentCookie)
        .expect(200);
      const everything = await http(testApp)
        .get(`${API}/categories`)
        .set('Cookie', studentCookie)
        .expect(200);

      expect(available.body.items.map((c: { name: string }) => c.name)).toEqual(['Disponível']);
      expect(everything.body.items.map((c: { name: string }) => c.name).sort()).toEqual([
        'Aposentada',
        'Disponível',
        'Do setor encerrando',
      ]);
    });

    it('moves a category to another active sector and refuses a repeated name in the sector', async () => {
      const secretaria = await createSector(testApp.prisma, { name: 'Secretaria' });
      const financeiro = await createSector(testApp.prisma, { name: 'Financeiro' });
      const category = await createCategory(testApp.prisma, secretaria.id, { name: 'Boletos' });
      await createCategory(testApp.prisma, financeiro.id, { name: 'Boletos' });

      expectErrorEnvelope(
        await http(testApp)
          .patch(`${API}/categories/${category.id}`)
          .set('Cookie', adminCookie)
          .send({ sectorId: financeiro.id }),
        409,
        'CATALOG_NAME_TAKEN',
      );
      const moved = await http(testApp)
        .patch(`${API}/categories/${category.id}`)
        .set('Cookie', adminCookie)
        .send({ sectorId: financeiro.id, name: 'Segunda via' })
        .expect(200);
      expect(moved.body.sector).toEqual({ id: financeiro.id, name: 'Financeiro' });
    });
  });

  describe('statuses', () => {
    it('changes only the label; key and state sent are discarded (BR4.6)', async () => {
      const open = await testApp.prisma.status.findUniqueOrThrow({ where: { key: 'OPEN' } });

      const response = await http(testApp)
        .patch(`${API}/statuses/${open.id}`)
        .set('Cookie', adminCookie)
        .send({ label: 'Novo', key: 'CLOSED', active: false })
        .expect(200);

      expect(response.body).toEqual({ id: open.id, key: 'OPEN', label: 'Novo' });
      expectErrorEnvelope(
        await http(testApp)
          .patch(`${API}/statuses/${open.id}`)
          .set('Cookie', adminCookie)
          .send({ label: 'encerrado' }),
        409,
        'CATALOG_NAME_TAKEN',
      );
    });
  });

  describe('priorities', () => {
    it('creates priorities and moves the default mark (BR4.7)', async () => {
      const created = await http(testApp)
        .post(`${API}/priorities`)
        .set('Cookie', adminCookie)
        .send({ label: 'Urgente' })
        .expect(201);
      await http(testApp)
        .patch(`${API}/priorities/${created.body.id}`)
        .set('Cookie', adminCookie)
        .send({ isDefault: true })
        .expect(200);

      const list = await http(testApp)
        .get(`${API}/priorities`)
        .query({ active: true })
        .set('Cookie', studentCookie)
        .expect(200);
      const defaults = list.body.items.filter((p: { isDefault: boolean }) => p.isDefault);
      expect(defaults.map((p: { label: string }) => p.label)).toEqual(['Urgente']);
    });

    it('refuses deactivating the default priority and deactivates a regular one', async () => {
      const normal = await testApp.prisma.priority.findUniqueOrThrow({
        where: { label: 'Normal' },
      });
      const baixa = await testApp.prisma.priority.findUniqueOrThrow({ where: { label: 'Baixa' } });

      expectErrorEnvelope(
        await http(testApp)
          .patch(`${API}/priorities/${normal.id}`)
          .set('Cookie', adminCookie)
          .send({ active: false }),
        422,
        'CATALOG_DEFAULT_PRIORITY_REQUIRED',
      );
      const deactivated = await http(testApp)
        .patch(`${API}/priorities/${baixa.id}`)
        .set('Cookie', adminCookie)
        .send({ active: false })
        .expect(200);
      expect(deactivated.body).toEqual({
        id: baixa.id,
        label: 'Baixa',
        isDefault: false,
        active: false,
      });
    });
  });
});
