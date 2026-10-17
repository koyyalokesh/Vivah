import { describe, expect, it } from 'vitest';
import { getAuthReturnPath } from './auth-return-path';

describe('getAuthReturnPath', () => {
  it('preserves a member invitation return path', () => {
    expect(
      getAuthReturnPath({ from: '/member-invitations/invitation-token' }),
    ).toBe('/member-invitations/invitation-token');
  });

  it.each([
    undefined,
    null,
    {},
    { from: 'https://malicious.example' },
    { from: '//malicious.example' },
    { from: '/login' },
    { from: '/signup' },
  ])('uses the application fallback for an unsafe state', (state) => {
    expect(getAuthReturnPath(state)).toBe('/app');
  });
});
