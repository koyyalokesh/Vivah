import { describe, expect, it } from 'vitest';
import { getWeddingCountdown } from './dashboard-countdown';

describe('getWeddingCountdown', () => {
  it('counts calendar days in the wedding time zone', () => {
    const now = new Date('2026-11-01T20:00:00.000Z');

    expect(getWeddingCountdown('2026-11-03', 'Asia/Kolkata', now)).toEqual({
      status: 'upcoming',
      days: 1,
    });
    expect(getWeddingCountdown('2026-11-03', 'America/New_York', now)).toEqual({
      status: 'upcoming',
      days: 2,
    });
  });

  it('is not affected by daylight-saving day length', () => {
    expect(
      getWeddingCountdown(
        '2026-11-02',
        'America/New_York',
        new Date('2026-11-01T05:00:00.000Z'),
      ),
    ).toEqual({ status: 'upcoming', days: 1 });
  });

  it('distinguishes today, past, and missing dates', () => {
    const now = new Date('2026-11-01T12:00:00.000Z');

    expect(getWeddingCountdown('2026-11-01', 'UTC', now)).toEqual({
      status: 'today',
    });
    expect(getWeddingCountdown('2026-10-31', 'UTC', now)).toEqual({
      status: 'past',
    });
    expect(getWeddingCountdown(undefined, 'UTC', now)).toEqual({
      status: 'missing',
    });
    expect(getWeddingCountdown('2026-02-30', 'UTC', now)).toEqual({
      status: 'missing',
    });
  });
});
