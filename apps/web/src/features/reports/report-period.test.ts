import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PERIOD_DAYS,
  defaultPeriodDays,
  formatDay,
  formatDurationLong,
  formatDurationShort,
  formatSample,
  isValidDay,
  periodError,
  toReportPeriod,
} from './report-period';

describe('report period on the client (BR2.1, BR7.2)', () => {
  it('opens on the last thirty days, counting the current one', () => {
    const days = defaultPeriodDays(new Date('2026-09-24T15:30:00.000Z'));

    expect(days).toEqual({ from: '2026-08-26', to: '2026-09-24' });
    expect(DEFAULT_PERIOD_DAYS).toBe(30);
  });

  it('turns the chosen days into a window closed at the start and open at the end', () => {
    const period = toReportPeriod({ from: '2026-09-01', to: '2026-09-30' });

    expect(period).toEqual({
      from: '2026-09-01T00:00:00.000Z',
      // The end day enters whole, so the exclusive bound is the first instant of the next one.
      to: '2026-10-01T00:00:00.000Z',
    });
  });

  it('accepts a single day as a period, because the end day is included', () => {
    expect(periodError({ from: '2026-09-10', to: '2026-09-10' })).toBeNull();
    expect(toReportPeriod({ from: '2026-09-10', to: '2026-09-10' })).toEqual({
      from: '2026-09-10T00:00:00.000Z',
      to: '2026-09-11T00:00:00.000Z',
    });
  });

  it('refuses an inverted period and a malformed day', () => {
    expect(periodError({ from: '2026-09-30', to: '2026-09-01' })).toBe(
      'A data de início deve ser anterior ou igual à data de fim.',
    );
    expect(periodError({ from: 'ontem', to: '2026-09-01' })).toBe(
      'Informe datas válidas para o início e o fim do período.',
    );
    expect(isValidDay('2026-13-45')).toBe(false);
    expect(isValidDay('2026-09-01')).toBe(true);
  });

  it('shows a day in the Brazilian order, without shifting it by time zone', () => {
    expect(formatDay('2026-09-01')).toBe('01/09/2026');
    expect(formatDay('nada')).toBe('nada');
  });

  it('writes a duration in a short unit and in full', () => {
    expect(formatDurationShort(93_600)).toBe('1 d 2 h');
    expect(formatDurationLong(93_600)).toBe('1 dia e 2 horas');
    expect(formatDurationShort(5400)).toBe('1 h 30 min');
    expect(formatDurationLong(5400)).toBe('1 hora e 30 minutos');
    expect(formatDurationShort(720)).toBe('12 min');
    expect(formatDurationLong(720)).toBe('12 minutos');
  });

  it('never shows a bare zero for a duration shorter than a minute', () => {
    expect(formatDurationLong(30)).toBe('menos de um minuto');
    expect(formatDurationShort(0)).toBe('0 min');
    expect(formatDurationLong(172_800)).toBe('2 dias');
  });

  it('agrees the sample with its size', () => {
    expect(formatSample(1)).toBe('Base: 1 chamado');
    expect(formatSample(0)).toBe('Base: 0 chamados');
    expect(formatSample(12)).toBe('Base: 12 chamados');
  });
});
