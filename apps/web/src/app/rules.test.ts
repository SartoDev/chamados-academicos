import { describe, expect, it } from 'vitest';
import { entryPathForRole, NAV_ITEMS, navItemsFor } from './navigation';
import { isRole, requiresSector, ROLE_LABELS, ROLES } from './roles';
import { passwordPolicyMessage, passwordSchema } from './validation/password-policy';

describe('password policy mirror (BR3.4)', () => {
  it('accepts 8 to 128 characters with a letter and a digit', () => {
    expect(passwordPolicyMessage('Senha123')).toBeNull();
    expect(passwordPolicyMessage(`a1${'x'.repeat(126)}`)).toBeNull();
    expect(passwordSchema.safeParse('ação2026').success).toBe(true);
  });

  it('explains each violated rule', () => {
    expect(passwordPolicyMessage('Abc1234')).toBe('A senha deve ter pelo menos 8 caracteres.');
    expect(passwordPolicyMessage(`a1${'x'.repeat(127)}`)).toBe(
      'A senha deve ter no máximo 128 caracteres.',
    );
    expect(passwordPolicyMessage('12345678')).toBe('A senha deve ter ao menos uma letra.');
    expect(passwordPolicyMessage('abcdefgh')).toBe('A senha deve ter ao menos um algarismo.');
    expect(passwordSchema.safeParse('curta').success).toBe(false);
  });
});

describe('roles (BR3.2, BR3.3)', () => {
  it('offers exactly five roles with Portuguese labels', () => {
    expect(ROLES.map((role) => ROLE_LABELS[role])).toEqual([
      'Aluno',
      'Professor',
      'Atendente',
      'Gestor',
      'Administrador',
    ]);
    expect(isRole('ADMIN')).toBe(true);
    expect(isRole('GUEST')).toBe(false);
  });

  it('requires a sector only for agents and managers', () => {
    expect(requiresSector('AGENT')).toBe(true);
    expect(requiresSector('MANAGER')).toBe(true);
    expect(requiresSector('PROFESSOR')).toBe(false);
    expect(requiresSector('')).toBe(false);
  });
});

describe('navigation (BR7.6 of U1, BR9.1 of U2)', () => {
  it('gives each role the sections of its own work', () => {
    expect(navItemsFor('ADMIN').map((item) => item.label)).toEqual([
      'Chamados',
      'Painel',
      'Administração',
    ]);
    for (const role of ['STUDENT', 'PROFESSOR'] as const) {
      expect(navItemsFor(role).map((item) => item.label)).toEqual(['Meus Chamados']);
    }
    expect(navItemsFor('AGENT').map((item) => item.label)).toEqual(['Fila do Setor']);
    // U4 gives the manager the panel next to the queue of the sector (BR7.5).
    expect(navItemsFor('MANAGER').map((item) => item.label)).toEqual(['Fila do Setor', 'Painel']);
    expect(NAV_ITEMS).toHaveLength(5);
  });

  it('keeps Administração only for the administrator', () => {
    for (const role of ['STUDENT', 'PROFESSOR', 'AGENT', 'MANAGER'] as const) {
      expect(navItemsFor(role).map((item) => item.label)).not.toContain('Administração');
    }
  });

  it('sends each role to its entry screen (BR9.1)', () => {
    expect(entryPathForRole('ADMIN')).toBe('/admin');
    expect(entryPathForRole('STUDENT')).toBe('/tickets');
    expect(entryPathForRole('PROFESSOR')).toBe('/tickets');
    expect(entryPathForRole('AGENT')).toBe('/queue');
    expect(entryPathForRole('MANAGER')).toBe('/queue');
  });

  it('offers no provisional "Início" item any more', () => {
    expect(NAV_ITEMS.map((item) => item.label)).not.toContain('Início');
    expect(NAV_ITEMS.map((item) => item.to)).not.toContain('/home');
  });
});
