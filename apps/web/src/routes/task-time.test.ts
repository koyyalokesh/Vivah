import { describe, expect, it } from 'vitest';
import { dateToWeddingIso, isOverdue, weddingDate } from './task-time';
describe('task wedding dates', () => {
  it('stores wedding-local midnight as UTC', () => {
    expect(dateToWeddingIso('2027-02-12', 'Asia/Kolkata')).toBe(
      '2027-02-11T18:30:00.000Z',
    );
  });
  it('round trips a date in the wedding timezone', () => {
    expect(weddingDate('2027-02-11T18:30:00.000Z', 'Asia/Kolkata')).toBe(
      '2027-02-12',
    );
  });
  it('never marks completed work overdue', () => {
    expect(
      isOverdue('2020-01-01T00:00:00.000Z', 'COMPLETED', 'Asia/Kolkata'),
    ).toBe(false);
  });
});
