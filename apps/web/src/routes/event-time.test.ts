import { describe, expect, it } from 'vitest';
import { localInputToIso, toLocalInput } from './event-time';

describe('event time conversion', () => {
  it('converts wedding-local time to an ISO instant', () => {
    expect(localInputToIso('2027-02-12T10:30', 'Asia/Kolkata')).toBe(
      '2027-02-12T05:00:00.000Z',
    );
  });
  it('round trips an ISO instant in the wedding time zone', () => {
    expect(toLocalInput('2027-02-12T05:00:00.000Z', 'Asia/Kolkata')).toBe(
      '2027-02-12T10:30',
    );
  });
  it('rejects a local time skipped by a daylight-saving transition', () => {
    expect(() =>
      localInputToIso('2027-03-14T02:30', 'America/New_York'),
    ).toThrow('does not exist');
  });
  it('rejects an ambiguous local time repeated by a daylight-saving transition', () => {
    expect(() =>
      localInputToIso('2027-11-07T01:30', 'America/New_York'),
    ).toThrow('occurs twice');
  });
});
